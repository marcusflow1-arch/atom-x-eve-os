# Game 5 — Retrieve the Lost Card (local dev only)

**Not a production game route.** No protected application files are changed. Local Game 5-only development uses Three.js and Vite, which already exist in package.json. The merged quest service at `src/game5/quests/lostCardQuest.mjs` is imported on the Node server only; it is never imported by the browser.

## Run

From the repository root, after `npm install`:

```sh
node src/game5/gameplay/devServer.mjs
```

Visit **http://127.0.0.1:4178/index.html**. The server binds only to `127.0.0.1`; close the command to stop it. Move with WASD / arrow keys, hold Shift to run, press E near Elder Shen to accept/complete, and E near the floating card to collect. Complete the quest at Elder Shen. Reload the page to verify state restoration. Browser devtools Network tab shows `/api/game5/*` requests.

To use an alternative port, set `GAME5_DEV_PORT` when launching the server (for example `GAME5_DEV_PORT=4189 node src/game5/gameplay/devServer.mjs` on Linux/macOS, or `$env:GAME5_DEV_PORT=4189; node src/game5/gameplay/devServer.mjs` in PowerShell). API Origin and Host checks use the actual listening port; foreign origins and hosts are rejected.

State is saved under the OS temporary directory: `game5-dev-only/lost-card-prototype.json`. To reset the prototype **only with the server stopped**, remove that single test file; do not touch live player data. Test wallet currency is `game5_quest_token`, and is not connected to any production wallet.

## Simulated / non-production behavior

- Single fixed development actor `game5-dev-player`, injected by the local Node server. **No real authentication or account authorization.**
- Movement and location are browser-reported; range checks detect honest out-of-range gameplay but cannot stop a malicious client from spoofing coordinates. **Not server-authoritative movement.**
- A locally committed receipt may precede quest progression if the process stops mid-pickup. The next state read replays that persisted receipt through the unchanged idempotent quest service before returning a snapshot. Only confirmed quest progression hides the collectible. If recovery encounters an error, the client is shown an error rather than a false 1/1 state. This is development-only compensation, **not an ACID commit across inventory and quest state**.
- Inventory is an internal mock `devClaims` receipt in the dev JSON store, not the real Game 5 inventory. The browser cannot send an inventory collection event, but a malicious local caller can spoof position.
- Persistence serializes requests **only inside one Node process**; no interprocess or distributed locking, no guaranteed fsync/power-loss durability. The Linux `flock` test adapter is intentionally NOT used for distributed deployment.
- Server stores the existing quest's test wallet/ledger/outbox but **does not dispatch the outbox or grant real currency**.
- Vite's document root is `src/game5/client`, with strict filesystem allowlisting of `src/game5/client`, the explicitly imported `src/game5/gameplay/world.mjs` module, and installed `node_modules`. Repository root, quests source, application pages, and repository metadata are not intended browser-accessible paths. Vite's dev/HMR and allowed `node_modules` are still local-only development exposure, not a hardened public file server. Never bind to public interfaces or deploy. This is not a production-ready anti-CSRF/session implementation.
- The scene uses basic original primitive meshes, not production animations/assets. It is available via a standalone URL, not the protected app routing.

## Test

```sh
node --test tests/game5/gameplay/*.test.mjs tests/game5/client/*.test.mjs
node --check src/game5/gameplay/devServer.mjs
node --check src/game5/client/main.js
node --test tests/game5/quests/*.test.mjs  # existing independent quest tests (Linux with flock)
```

Full production integration needs authenticated identity, server-authoritative positions and NPC/pickup instances, an inventory-backed immutable collection event, shared ACID persistence, atomic real reward settlement, outbox delivery, world-state replication, comprehensive crash/multi-node QA, and explicit app routing approval.

## G5-0003-B — Game 5 dashboard two-mode integration

The already registered admin-only `/Game5` dashboard continues to mount the **same** Three.js scene in `Game5QuestPreview.jsx`. The visual meshes, camera, lighting, keyboard movement, and mobile controls have not been replaced.

- **Browser Demo:** browser-only, tab-scoped simulation using `browserQuestDemo.mjs`. Simulated token counts are explicitly labeled; none are posted to a backend.
- **Connected Test:** fail-closed, separate `connectedQuestSession.mjs` state machine. It requires a reviewed `connectedTransport` supplied by the Game 5 dashboard; when absent it displays `disconnected` and a missing-backend message. It does **not** run or copy Browser Demo state. Requests are serialized; NPC dialogue refreshes the authoritative snapshot; card geometry disappears only at authoritative `ready_to_complete` or `completed` state.

### Dependency gate — G5-0003-A

At the time of this change, **no approved authenticated G5-0003-A browser-facing endpoint contract is present on `main`**. Consequently, the dashboard deliberately supplies **no** Connected Test transport. It is incorrect to claim the mode can yet save or award anything through the backend.

The Quest Developer must first provide and document:
1. The exact authenticated browser API transport (URL or existing sanctioned SDK function), session binding, CSRF/CORS policy, and account/character ownership enforcement.
2. The supported `load`, `accept`, `pickup`, and `complete` commands; whether the server accepts the existing `npcId` / `pickupId` / `position` payloads or instead uses a different schema. Client-reported coordinates must not be treated as authoritative.
3. A normalized response of `{snapshot:{quest:{status,objective:{current,required}},cardCollected?,testWallet?},notice?}`, or an explicit mapping adapter agreed with the Quest Developer, and server error status mapping.
4. The dedicated test-only inventory, reward, idempotency, and persistence guarantees; do not connect real player wallets/inventory.

After coordination, attach a **real authenticated transport** in `src/pages/Game5.jsx` using the approved endpoint/SDK. Never create a client-side trusted actor or a fabricated authenticated response. A separate narrow integration PR is needed if backend contract changes or protected files would be required.

### Test evidence and remaining verification

```sh
node --test tests/game5/client/connectedQuestSession.test.mjs
# 6 tests cover no-fallback, server snapshots/reload, duplicate in-flight action,
# rejected pickup, unauthorized/disconnect/503 errors, and invalid responses.
```

These tests use test transport fixtures **only inside test files**. They do not prove a live authenticated server connection or browser interaction. Browser end-to-end verification of **both** modes on the Luna → Game 5 entry route remains blocked until an installed/full environment and real G5-0003-A endpoints are provided. No QA or deployment approval is implied.
