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
- Vite's document root is `src/game5/client`, with strict filesystem allowlisting of `src/game5/client`, `src/game5/gameplay`, and installed `node_modules`. Repository root, quests source, application pages, and repository metadata are not intended browser-accessible paths. Vite's dev/HMR and allowed `node_modules` are still local-only development exposure, not a hardened public file server. Never bind to public interfaces or deploy. This is not a production-ready anti-CSRF/session implementation.
- The scene uses basic original primitive meshes, not production animations/assets. It is available via a standalone URL, not the protected app routing.

## Test

```sh
node --test tests/game5/gameplay/*.test.mjs tests/game5/client/*.test.mjs
node --check src/game5/gameplay/devServer.mjs
node --check src/game5/client/main.js
node --test tests/game5/quests/*.test.mjs  # existing independent quest tests (Linux with flock)
```

Full production integration needs authenticated identity, server-authoritative positions and NPC/pickup instances, an inventory-backed immutable collection event, shared ACID persistence, atomic real reward settlement, outbox delivery, world-state replication, comprehensive crash/multi-node QA, and explicit app routing approval.
