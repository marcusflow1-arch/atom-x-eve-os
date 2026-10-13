# G5-0004-A — Base44 hosting assessment and G5-0004-B gameplay handoff

**Status:** Prepared integration only. No hosted function created/deployed, no
live route, no real-session proof, no server movement, and no production ACID
storage has been configured. **Do not merge or deploy without QA + owner approval.**

## Verified findings

1. The merged Game 5 dashboard calls `/api/game5/quest/state` etc via
   `src/game5/client/game5QuestHttpTransport.mjs`. No handler is mounted at
   that path. Base44's SPA hosting serves an HTML document for unknown routes,
   explaining the HTML response instead of a quest JSON snapshot.
2. Base44's supported backend mechanism is a **named Deno function**.
   Server code uses `createClientFromRequest(req)` from `npm:@base44/sdk` and
   `await base44.auth.me()` to authenticate the incoming actual request.
   Frontends call `base44.functions.invoke('game5Quest', data)`, receiving an
   Axios response with JSON in `response.data`. This is not the same as the
   dashboard's bare `fetch('/api/game5/quest/state')` call.
   References:
   - https://docs.base44.com/sdk-getting-started/client
   - https://doc-sdk.base44.app/FunctionsDocs
   - https://github.com/base44/skills/blob/main/skills/base44-sandbox/SKILL.md
3. `src/game5/quests/authenticatedQuestApi.mjs` already supplies the
   verified-auth session seam and original Game 5 quest engine. New
   `base44QuestFunction.mjs` adapts a named POST invocation to that handler.
   Its tests exercise a real **local HTTP** handler and mocks `auth.me`;
   no actual hosted Base44 function has been deployed or invoked.
4. The existing Linux `flock` repository is development-only. The Base44
   `Quest` entity is a catalog definition, not an atomic player ledger;
   generic entity `create`/`update`/`filter` do not prove multi-record
   atomicity or unique completion settlement.

## Scope-locked proposed deployment (requires owner approval)

**Do not modify shared routing, global config or shared authentication.**
Approval proposal for the Backend/Hosting specialist:

- Add only a new **Game 5 function**, for example
  `base44/functions/game5Quest/entry.ts` (exact function directory naming
  must be validated against the connected app's supported deployment tooling).
  Base44 runtime patterns vary between CLI/local repo and editor-hosted
  functions. Bundle the existing quest module and handler into this function,
  or use a verified supported relative-import/bundling strategy. **Do not
  publish a file that has unresolved imports to `src/game5/quests`.**
- In the hosted function, call `createClientFromRequest(req)` from
  `npm:@base44/sdk` and pass it into
  `createBase44QuestFunction({ createClientFromRequest, repository,
  getAuthoritativePosition, allowedOrigins: ['https://APP_ORIGIN'] })`.
  Register the returned function with the Base44-supported Deno handler
  convention (such as `Deno.serve(handler)`). The original incoming request,
  including SDK-managed credentials, is passed unchanged to `auth.me()`.
  No service-role override should authenticate the player; never use a
  client-supplied user ID or signed claims without provider verification.
- Set explicit HTTPS Origin allowlist to exact approved application origin(s),
  verify Base44 `functions.invoke` sends the required Origin header, and
  verify gateway CSRF policy with a real browser. This staged adapter rejects
  **missing/foreign Origin** (including `null`) and
  `Sec-Fetch-Site: cross-site`. If Base44 strips Origin on `invoke`, do
  not disable this protection without an approved replacement anti-CSRF
  design. Also enforce request rate limiting and timeout upstream.
- Before activating, attach the separately approved shared transactional
  store and trusted multiplayer movement provider. The current implementation
  offers no default substitutes. The Game 5 function should fail closed or
  remain unpublished until they exist.

### Precise frontend transport change for G5-0004-B

**Owner approval required before editing**
`src/game5/client/game5QuestHttpTransport.mjs` or Game 5 dashboard wiring.

Change only transport, not the browser demo. Use the existing client SDK's
authenticated `base44.functions.invoke`; **do not** manually invent bearer
headers, store tokens, or pass user IDs:

```js
import { base44 } from '@/api/base44Client';

async function invokeQuest(action, target = {}) {
  const response = await base44.functions.invoke('game5Quest', {
    action,
    ...target,  // target is only { npcId } or { pickupId }
  });
  // Axios response: JSON payload lives in .data
  return response.data;
}

const transport = {
  load: () => invokeQuest('state'),
  accept: () => invokeQuest('accept', { npcId: 'lost-card-elder' }),
  pickup: () => invokeQuest('pickup', { pickupId: 'lost-card-ground-01' }),
  complete: () => invokeQuest('complete', { npcId: 'lost-card-elder' }),
};
```

For non-2xx responses, propagate
`error.response.status` and `error.response.data.error` to the existing
connected quest session classifier; never interpret error HTML as success,
never fall back to the browser demo or client-local quest state.
Use the existing application auth token through the SDK; no new production
auth changes.

### Named function wire contract

All network calls use `POST /functions/game5Quest` in the documented
Base44 function model *via the SDK invocation*, not a guessed SPA `/api`
route. Host/platform may use its own internal URL and authentication
proxying: use the SDK instead of concatenating a backend URL manually.

Request body → logical existing quest handler → response:

| Body | Logical route | Successful response |
| --- | --- | --- |
| `{"action":"state"}` | GET /api/game5/quest/state | `{"snapshot":{...}}` |
| `{"action":"accept","npcId":"lost-card-elder"}` | POST /api/game5/quest/accept | `{"changed":true/false,"snapshot":{...}}` |
| `{"action":"pickup","pickupId":"lost-card-ground-01"}` | POST /api/game5/quest/pickup | `{"changed":true/false,"snapshot":{...}}` |
| `{"action":"complete","npcId":"lost-card-elder"}` | POST /api/game5/quest/complete | `{"changed":true/false,"snapshot":{...}}` |

The original HTTP handlers remain intact for tests; new wrapper maps
`action` to a logical path but derives identity from *the original* request.
All responses are JSON with no-store. Unexpected keys, claimed receipt,
position, state, actor and reward are rejected. Absence of session yields
`401 UNAUTHORIZED`; provider outage yields `503 AUTH_BACKEND_UNAVAILABLE`.
An expired token is rejected. Origin/cross-site requests yield `403`.

No single browser test can prove all supported Base44 CSRF/auth semantics;
verify with the deployed domain and two real accounts, including session
expiry, after authorization.

## Transactional persistence proposal (approval required — NOT provisioned)

**Recommended:** Game 5-only managed PostgreSQL, separate schema/table and
credentials, accessed only from the approved server-side function. No shared
Atom XE / Luna balances or Base44 entities are updated. Never provision a
service based on this PR alone.

Schema and adapter design, to be implemented and reviewed by Backend/DB:

```sql
CREATE TABLE game5_quest_players (
  player_id TEXT PRIMARY KEY,
  state JSONB NOT NULL,
  version BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Database credentials grant DML only on isolated Game 5 tables.
```

Implement `read(playerId)` and `transact(playerId, mutate)` via one
PostgreSQL transaction on a single connection:

1. `BEGIN`; create a blank per-player row with
   `INSERT ... ON CONFLICT (player_id) DO NOTHING`.
2. `SELECT state FROM game5_quest_players WHERE player_id=$1 FOR UPDATE`.
   Run the existing quest mutation on that locked copy; no external calls
   or HTTP calls inside the critical section unless bounded and approved.
3. `UPDATE ... SET state=$2, version=version+1`, then `COMMIT`.
   On error or timeout: `ROLLBACK` and return a safe 503.
4. The same one-row atomic state contains `quests`, `questReceipts`,
   `outbox`, `rewardLedger`, and *only* isolated `game5_quest_token`.
   A lost pickup or double award after crash must be impossible within
   a successfully committed transaction; no real Atom XE inventory currency.
5. Concurrency and power-loss tests: two actual DB connections, parallel
   requests, transaction rollback injection, delayed commit, killed server,
   restart, and read-after-commit across nodes. Document DB fsync/backup and
   connection pooling. Unique row PK plus per-player serialized updates
   provide one completion ledger. If splitting wallets/ledgers into new
   tables later, add DB unique `(player_id, quest_id, reward_type)`.

This is a **formal proposal**, not implementation or validation of PostgreSQL
inside Base44. Compatibility of Deno outbound TCP/HTTP, secrets, pooled
connections, cold starts, billing, and provider region must be verified.
Base44 entity CRUD is not assumed ACID.

### Budget / operational cost before purchase

Example **Railway PostgreSQL** provider option, not yet provisioned:
- Railway Free plan: $0/month with $1 included resource usage, restricted
  resource caps, unsuitable as a promised production SLA.
- Hobby: $5/month minimum subscription with $5 monthly usage credit; usage
  beyond it is billed. Published rates include approximately $10/GB-month
  RAM, $20/vCPU-month CPU, $0.15/GB-month volume storage, and $0.05/GB
  network egress. Costs are **variable**, not a fixed $5 database price.
- Backups, monitoring, high availability, extra services and egress can add
  costs. Determine expected connection/compute profile and owner budget cap
  before approval. Published rates:
  https://docs.railway.com/pricing
  https://docs.railway.com/pricing/plans

Another candidate is Neon PostgreSQL free tier, which as of 2026-10-02
advertises up to 1 GB per free project; pay-as-you-go pricing depends on
compute usage and retention. Need platform compatibility, service plan
eligibility, and restore-policy confirmation:
https://neon.com/blog/neon-free-plan-1-gb-per-project

**No Railway/Neon account, database, schema, secrets, function, or live
deployment has been created in G5-0004-A.**

## Movement prerequisite (cannot relax)

`getAuthoritativePosition({playerId})` must read an independently trusted
server simulation: immutable player identity from session, server timestamp,
map ID and coordinates computed from validated movement intents with
speed/collision/teleport checks. Server returns
`{ authoritative: true, worldId: 'game5-lost-card-world',
observedAt: timestampMs, position: {x,z} }`. The core API enforces max age
(default 2500 ms) and distance to Elder Shen or Lost Card. Browser-reported
coordinates are never accepted, not even if signed by the browser. Without
this provider, `accept` / `pickup` / `complete` fail 503; `state` may return
a verified authenticated snapshot once storage exists.

## Release / QA gates

- **Authenticated live Base44 function:** not yet verified or deployed;
  no claim of a real production session request.
- **CSRF:** tested in the isolated wrapper; live SDK/browser behavior pending.
- **Storage:** mocked concurrency and local test `flock` are not evidence
  of shared DB atomicity. Production adapter awaits approved provisioning.
- **Proximity:** current playable Game 5 demo is not an authoritative
  movement server; live pickup intentionally unavailable.
- **Gameplay Programmer handoff:** ready to implement SDK transport after
  owner approval, but NOT ready to claim connected Game 5 play works.
  Preserve the Browser Demo, error UI and fail-closed behavior.
- **Independent QA + game owner approval:** mandatory before merge/deploy.
