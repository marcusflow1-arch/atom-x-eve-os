# G5-0003-A — Game 5 authenticated quest integration contract

**Status: isolated backend integration seam, NOT mounted or production-deployed.**
This task reuses `lostCardQuest.mjs` and changes only `src/game5/quests/**` /
`tests/game5/quests/**`. The existing local server, dashboard browser demo,
Game 2/Game 3, global router, Base44 entities and balances are unchanged.

## Verified existing architecture

- `src/lib/AuthContext.jsx` uses `base44.auth.me()` to display the signed-in
  frontend user. `src/api/base44Client.js` constructs the SDK client with
  `requiresAuth: false`. Browser authentication state / client `user.id`
  cannot be used as proof of server identity.
- `src/game5/gameplay/devServer.mjs` listens only on loopback and provides a
  development API with a fixed `game5-dev-player`, checked Host/Origin and
  simulated `position`. It is NOT production auth or secure movement.
- `src/game5/gameplay/devQuestRepository.mjs` is single-process JSON;
  `src/game5/quests/fileQuestRepository.mjs` uses Linux `flock` and atomic
  file replace for local tests. Neither provides a cross-host ACID contract.
- `src/game5/client/browserQuestDemo.mjs` uses browser/sessionStorage state;
  Game5QuestPreview uses client-side Three.js movement. Neither is a trusted
  multiplayer position authority or inventory.
- Read-only inspection of the connected **Atom x Eve OS** Base44 app schema:
  an existing entity named `Quest` is a shared quest **definition/catalog**
  (`key`, `title`, `scope`, `objectives`, `rewards`, `status`);
  it does not expose the required per-player atomic progress, pickup receipt,
  completion ledger or outbox transaction. Its create/update/delete rules are
  admin-only. Do **not** retrofit it for this task without an approved entity
  migration and security review.
- Base44 SDK documents hosted backend functions via
  `createClientFromRequest(req)` followed by `await base44.auth.me()` and
  invoking backend functions through `base44.functions.invoke(...)`.
  The documented Base44 entity CRUD operations alone **do not establish**
  atomic multi-record transactions, CAS, unique grant constraints, or rollback.
  No verified transactional Base44 quest adapter exists in this repository.
  **DO NOT** substitute a `filter` + `update` sequence and claim exactly-once.

## Proposed hosting and identity (approval required)

Add a **Game 5-only Base44-hosted backend function/route**, *after explicit
approval to change hosting and function wiring*. Inside that hosted function,
import the verified SDK's `createClientFromRequest(req)`, invoke
`createBase44SessionAuthenticator({ createClientFromRequest })(req)`.
Only the SDK-backed `auth.me()` server result determines the opaque
`base44:<user.id>` player key. Never accept playerId, authenticated, actor or
user from body, URL, sessionStorage, localStorage, or unsigned cookies.

Compose the resulting verifier and a trusted movement adapter with
`createAuthenticatedQuestHandler`. Mount `/api/game5/quest/{state,accept,pickup,complete}`
or adapt the platform's function-invoke entrypoint into the same logical routes.
The code in this task implements a framework-neutral Fetch Request/Response
handler, not that actual function deployment. Keep secrets and service role
credentials on the server only. Protect cookie-authenticated POSTs against CSRF:
configure precise allowed origin(s) and platform CSRF protection. Gateway must
also enforce per-user rate and request size limits.

**Important:** The authorization adapter in this branch expects a trusted
`createClientFromRequest` supplied by the hosted runtime; tests use a fake
`auth.me()` and do NOT certify that a real Atom XE session was verified.

## API v1 (logical endpoints; all require verified authentication)

All responses are JSON with `Cache-Control: no-store`. Never return collection
receipts, other users' records, or internal storage errors.

### GET /api/game5/quest/state

No query params/body. Returns HTTP 200:

```json
{
  "snapshot": {
    "quest": {
      "questId": "G5-0001",
      "status": "not_started",
      "objective": { "id": "collect-lost-card", "cardId": "game5:lost-card", "current": 0, "required": 1 },
      "rewarded": false
    },
    "cardCollected": false,
    "testWallet": 0,
    "isolatedTestOnly": true
  }
}
```

### POST /api/game5/quest/accept

Content-Type `application/json`, request:

```json
{ "npcId": "lost-card-elder" }
```

The server checks the logged-in player's **trusted** proximity to Elder Shen,
then calls the original `acceptQuest`. HTTP 200:

```json
{ "changed": true, "snapshot": { "quest": { "status": "active", "objective": { "current": 0, "required": 1 } }, "testWallet": 0, "cardCollected": false, "isolatedTestOnly": true } }
```

The actual snapshot always contains the full quest shape from `GET`.
Retries/duplicates return `changed:false`, with current authoritative state.

### POST /api/game5/quest/pickup

```json
{ "pickupId": "lost-card-ground-01" }
```

Server verifies a recent authoritative position near the world card.
`collectTrustedCard` generates the isolated test receipt and objective event
**inside one atomic `repository.transact(playerId, mutate)`**, so no crash
window exists between receipt and progression. Browser supplies only the
static pickup target ID, not inventory proof, receipt, coordinates or event.

Returns HTTP 200 with `changed:true` on first pickup, full snapshot with
`status:ready_to_complete`, `objective.current:1` and `cardCollected:true`.
Retries return `changed:false`, with no further receipt/outbox entries.

### POST /api/game5/quest/complete

```json
{ "npcId": "lost-card-elder" }
```

Server verifies trusted proximity to Elder Shen and invokes original
`completeQuest`. HTTP 200 `changed:true` for first valid completion,
`status:completed`, `rewarded:true` and `testWallet:1`. Premature
completion is an idempotent `changed:false` with no credit. Retries and
concurrent completions return `changed:false` and do not grant more.

**Test-only currency:** `game5_quest_token` in isolated Game 5 ledger; never
Atom XE / Luna / real balances, card records, or production inventory.

### Errors

| Status | `error` | Meaning / retry |
| --- | --- | --- |
| 400 | `INVALID_JSON`, `UNEXPECTED_FIELDS`, `UNEXPECTED_QUERY` | Fix request |
| 400 | `FORBIDDEN_CLIENT_FIELDS` | Identity/position/receipt/state/reward fields prohibited |
| 400 | `INVALID_TARGET` | Wrong NPC/card ID |
| 401 | `UNAUTHORIZED` | Missing/invalid server-verified session |
| 403 | `ORIGIN_FORBIDDEN` | Origin not in server-configured allowlist |
| 403 | `NOT_NEAR_TARGET` | Server-position too far |
| 405 | `METHOD_NOT_ALLOWED` | Wrong HTTP method |
| 413 | `REQUEST_TOO_LARGE` | Oversize JSON |
| 415 | `JSON_REQUIRED` | Unsupported media type |
| 503 | `AUTH_BACKEND_UNAVAILABLE` | Verify identity backend; retry |
| 503 | `MOVEMENT_AUTHORITY_NOT_CONFIGURED` | Deployment prerequisite missing |
| 503 | `AUTHORITATIVE_POSITION_UNAVAILABLE` | Missing/stale/untrusted position |
| 503 | `QUEST_BACKEND_UNAVAILABLE` | Persistence or internal failure; retry |

Responses to failed writes never assert success or optimistically change state.

## Security, movement and collection prerequisites

A trustworthy Game 5 movement server must own position state per authenticated
player and map instance. Clients should send **movement intent**, not
authoritative coordinates: validate monotonic sequence numbers, server delta
time, acceleration/speed caps, collision and teleport restrictions, map
membership, logout/reconnect expiry, and latency tolerance; optionally reconcile
with client prediction. The backend reader used here returns
`{ position: {x,z}, observedAt: <server timestamp ms>, worldId:
"game5-lost-card-world", authoritative: true }`. The handler enforces
freshness (default 2500ms), bounded/nearby coordinates, world identity and
`authoritative:true`; **those fields are meaningful ONLY because the
injecting trusted movement service guarantees them**. Merely copying a
browser-reported position and setting `authoritative:true` is a vulnerability.

At present, the playable Game 5 demo's movement remains client-controlled.
**Do not claim secure collection or enable production pickup** until gameplay/
networking supplies that trusted movement authority. Route currently fails
closed with 503 if omitted. World NPC/card locations are Game 5 test geometry.

## Persistence and exactly-once requirements

The repository contract used by the existing service is
`read(playerId): Promise<record>` and
`transact(playerId, async mutate(record) => result): Promise<result>`.

A production adapter must document/test:

1. Linearizable per-player atomic read-modify-write despite simultaneous
   workers, retries, timeouts and process crashes. CAS/version-stamp or
   row/transaction locking with conflict retries; commit to durable shared DB.
2. Receipt, objective, outbox event and Game 5 **isolated test reward ledger**
   as one atomic state transition. Unique completion key `(player, G5-0001)`.
3. Crash recovery with no lost write, half-committed receipt, double reward or
   partial outbox, plus read-after-write consistency across sessions/servers.
4. No untrusted client direct-write permission to quest records, award ledger,
   receipts, or outbox. Validate row-level access and scoped service role.
5. Observability and safe replay semantics for delayed outbox dispatch.

The currently inspected Base44 SDK entity API does not furnish a verified
atomic multi-record primitive for this task. Do not claim Base44 ACID
guarantees from a generic CRUD SDK. Evaluate a single-record CAS option only
if documented/supported and proven under concurrency; otherwise obtain an
approved transactional backend adapter.

`FileQuestRepository` remains Linux-only development tooling, not production.
The original file repository's in-memory quiescence, lock semantics, and
lack of fsync are not equivalent to a distributed datastore.

## QA / Gameplay handoff gates

- Separate auth/backend specialist: approved hosted function route, actual
  `auth.me()` verification with real Atom XE users, CSRF and CORS config.
- Gameplay/networking specialist: server-owned movement + proximity, movement
  abuse tests and simultaneous pickup/reconnect.
- Data/backend specialist: audited transactional persistence adapter, durable
  game5-only test economy ledger, multi-node concurrency and restart tests.
- QA: run old 28 tests + new regression suite, prove two real players isolated,
  forged bodies rejected, crash-fault matrix, live server authentication and
  outbox delivery behavior (outbox dispatch remains unimplemented).

Until all gates pass, **Game 5 Gameplay Programmer handoff is CONDITIONAL
for client API wiring/contract review only; NOT approved for secure live pickup
or production deployment.** No merge without owner signoff and independent QA.
