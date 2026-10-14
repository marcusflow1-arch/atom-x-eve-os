# G5-0004-B — Isolated server-authoritative movement (QA handoff)

**Status: development-only server integration seam, not hosted/deployed.** Do not merge or deploy without independent QA and owner approval. No Game 2/3, Luna, routing, production accounts, inventory, currency or quest service is changed.

## Modules

- `authoritativeMovement.mjs`: server-owned per-player position, clock, speed, collision, reconnect/session and anti-replay state. Uses Node `crypto.randomUUID`; never import in browser. **The built-in Map is single-process and volatile.** A multi-worker, multi-node or production deployment MUST replace it with a reviewed atomic shared movement/session store (or a single authoritative session-affine realtime simulation) and prove cross-node ordering/failover semantics before secure pickup.
- `movementApi.mjs`: framework-neutral `Request → Response` adapter. Requires the **same trusted server authenticator** supplied to G5-0003-A `createAuthenticatedQuestHandler`. Never accept `playerId` from a browser; browser body contains only session nonce, sequence, movement intent and sprint flag. Reject extra fields including client position/time/reward.
- `game5MovementTransport.mjs` (client): same-origin credentialed `/api/game5/movement` requests, no browser actor or coordinates. Fail closed when endpoint is absent; no Browser Demo fallback.
- Existing `Game5QuestPreview.jsx`: only Connected Test posts movement intents at ~100ms; visual prediction is reconciled toward server position. Browser Demo and all existing temple/NPC/card graphics and mobile/keyboard controls remain unchanged.

## Integration — exact G5-0003-A seam

A trusted Game 5 host must create **one** authority instance (one simulation owner), `const authority = createGame5MovementAuthority()`, then:

```js
const movement = createGame5MovementApi({
  authority,
  authenticate: verifiedBase44Authenticator,
  allowedOrigins: ['https://exact-approved-game5-origin.example'],
});
const quest = createAuthenticatedQuestHandler({
  repository: approvedSharedAtomicTestRepository,
  authenticate: verifiedBase44Authenticator,
  getAuthoritativePosition: movement.getAuthoritativePosition,
  allowedOrigins: ['https://exact-approved-game5-origin.example'],
});
// Route /api/game5/movement/* to movement.handleMovementRequest.
// Route /api/game5/quest/* to quest. Do NOT route either to devServer.mjs.
```

**DO NOT COPY THIS into a live function without an approved hosting/session/store/CSRF integration.** Both handlers must see the same authoritative player session and shared movement state. The existing quest API rejects `authoritative:false`, stale observations >2500 ms, or incorrect `worldId`. `getAuthoritativePosition({playerId})` returns `{position:{x,z}, observedAt, worldId:'game5-lost-card-world', authoritative:true}` **only** for a fresh accepted server simulation input. It returns `null` on expiry/disconnect/reconnect until a new accepted input. The quest API's server-side proximity validation remains the sole decision maker.

## Logical API (unmounted)

All three paths are **POST**, Content-Type `application/json`, exact approved `Origin`, verified session and `credentials:'same-origin'`. Responses JSON `Cache-Control: no-store`, `isolatedTestOnly:true` on success:

- `/api/game5/movement/connect`, body `{}` → `{sessionId,seq:0,position:{x,z},worldId,isolatedTestOnly:true}`. Cryptographically random nonce invalidates any prior active session for this player. The first new movement input establishes a fresh trusted observation.
- `/api/game5/movement/input`, body `{sessionId,seq:positive safe integer,moveX:-1..1,moveZ:-1..1,sprint:boolean}` → `{ackSeq,position:{x,z},observedAt,worldId,isolatedTestOnly:true}`. The previous accepted intent moves for elapsed **server clock** time, ≤150ms; gaps >300ms drop movement rather than bank elapsed time. No displacement is taken from client. Sequence must increase. Maximum walk speed 5 m/s and sprint 8 m/s; diagonal normalized. Colliders include temple footprint, trees, Elder Shen, and ±28m bounds with 0.4m character radius.
- `/api/game5/movement/disconnect`, body `{sessionId}` → `{disconnected:true,isolatedTestOnly:true}`. Never sends trusted position during disconnect.

Client reconciles rendering with server ack but **any visual coordinate remains untrusted**. Inputs arriving after an old session is invalidated are rejected; activity older than the 30s reconnect grace resets the player to the trusted spawn. No client-provided timestamp, duration, map membership or teleport position is ever accepted.

## Remaining safety dependencies

1. **Authenticated hosted adapter, not yet wired.** `src/game5/quests/authenticatedQuestApi.mjs` provides the logical v1 quest handler, not a deployed production Base44 function. Server must use verified SDK auth, CSRF protection and a strict Origin/gateway rate and body-size limit. `Origin` alone is defense in depth, not a full auth boundary.
2. **Shared authoritative movement ownership and persistence.** This Map cannot safely run behind multi-worker load balancing or across hosts and does not survive process restart. Secure reconnect after backend crash needs an owner-approved shared simulation/lease store. Movement message ordering must hold across nodes; do not turn on real pickups with this temporary adapter in distributed hosting.
3. **Collision/physics.** These are static 2D primitives synchronized manually to current Three.js temple/tree/NPC meshes. No height, vertical movement, animated collider, obstacle update, latency compensation, combat collision, navmesh, or server/client collision replication yet. Player prediction can drift until reconciled. QA should verify no collision geometry regressions and no stuck world positions.
4. **Clock and arrival fairness.** Server uses elapsed wall-clock time only; delayed client packets cannot accumulate movement. Intent gap >300ms drops movement. Real-time operation needs server monotonic clock, network jitter tuning, supervision, rate caps, and performance tests under real latency.
5. **Quest atomicity and test-only reward.** Quest Developer owns real auth, verified shared transactional repository and exactly-once test-token ledger. No real inventory or production currency is connected here. Do not mount the API until independent QA proves multi-player separation and concurrent pickup/turn-in.

## QA and test commands

```bash
node --test tests/game5/gameplay/authoritativeMovement.test.mjs tests/game5/gameplay/movementApi.test.mjs tests/game5/client/game5MovementTransport.test.mjs
```

Tests use only fake request-auth callbacks and fake Fetch implementations; they are **not** real user-session verification. Independently test two signed-in browser identities on the same hosted movement simulation, simultaneous pickups at the card, out-of-order/delayed messages, forged extra fields, reconnect on another backend node, and stale-server-position rejections. Browser Demo + Connected Test must each be walked through the existing Luna → Game5 route. Real multiplayer and browser screenshots remain a separate blocked gate without an authenticated deployed host.