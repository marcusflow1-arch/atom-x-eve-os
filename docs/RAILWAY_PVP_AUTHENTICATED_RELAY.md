# Authenticated Railway PvP relay — testing branch

Scope: `test/ai-battle-websocket-latency`. The existing queue, Base44 combat rules, WebRTC transport and polling fallback remain in use. No production queue migration is included.

## What this change implements

- `railwayPvPTicket` authenticates the caller with Base44 and reads the stored PvP match. Only its two participants can obtain a 90-second ticket for an active match. Client-supplied player lists are ignored.
- Railway verifies the HMAC signature, audience, participant pair, match and expiry. Ticket nonces cannot be reused within their lifetime on this replica. One active connection per player per match; a reconnect replaces that player's older connection.
- Successful Base44 combat/status responses optionally include a signed receipt containing the server's accepted cast, recent hit log, HP observation, dodge state and turn. Browser-supplied damage or unsigned actions are rejected by Railway.
- The browser forwards receipts without persisting them. Railway publishes them only inside the authenticated match. Identical states do not echo back and forth; older observed states/damage revisions are ignored. Room sequence numbers and stream epochs handle reconnects and restarts.
- Accepted cast/melee events use the existing arena animation handler and cast IDs. Old history is not replayed as a new animation.
- Signed state changes wake the existing coalesced Base44 reader to reconcile HP, turns and hit logs. **HP is still read from Base44, not applied directly from the WebSocket packet.** This is an authenticated delivery layer, not a new authoritative combat engine.
- Ticket renewal rechecks membership every 60 seconds. Expired sessions close. Network failures use bounded reconnect attempts; the existing polling fallback remains available throughout.
- Size/rate/backpressure limits, authentication timeouts, and an explicit browser-origin allowlist constrain the test gateway.

## Activation requirements

1. Deploy this branch's frontend and both changed Base44 functions to a **test app/environment**. Do not overwrite the live queue deployment to activate a test.
2. Configure the same cryptographically random, at least 32-character `RAILWAY_PVP_TICKET_SECRET` in the Base44 test backend and Railway's `pvp-diagnostic-gateway` service in environment `test`. Keep it server-side. Never use a `VITE_` variable, commit it, or paste it into a browser.
3. On Railway, set `PVP_ALLOWED_ORIGINS` to comma-separated exact origins serving that test app, including its actual preview iframe origin if applicable. No wildcard fallback is implemented. Native probes without an Origin still require tickets for combat.
4. Bundle `railway/pvp/server.js` into one ESM file for Railway Function deployment:

   ```sh
   npx esbuild railway/pvp/server.js --bundle --format=esm --platform=neutral --outfile=/tmp/pvp-gateway.bundle.js
   ```

   Send that **complete bundle** with Railway's Function source update capability. The service runs Bun, listens on `PORT`, and must remain at one replica.
5. Check `/health`. Without the secret it reports `mode: auth-unconfigured`, `gameplayRelay: false`; ping/pong still works. With the secret it reports `authenticated-relay`. Health alone does not prove Base44 deployment, correct origins, or two-player gameplay.
6. In each signed-in test browser, opt in and reload:

   ```js
   localStorage.setItem('atomxe_pvp_wss_enabled', '1');
   localStorage.setItem('atomxe_pvp_wss_url', 'wss://pvp-diagnostic-gateway-test.up.railway.app/ws');
   localStorage.setItem('atomxe_pvp_latency_debug', '1');
   ```

   The client pins that exact gateway URL so a mutable browser setting cannot redirect signed tickets to another server.

Rollback the client with `localStorage.removeItem('atomxe_pvp_wss_enabled')` and reload. No queue cleanup or migration is required.

## Wire messages (implemented transport v2)

Client: `auth {ticket}`, `ping {id}`, `combat.receipt {receipt}`.
Server: `auth.ok`, `pong`, `combat.sync`, `error`.

Tickets and receipts are sent inside WSS frames, never URL query parameters. `railwayPvPProtocol.js` contains an older prospective envelope vocabulary; this gateway does not implement its queue/movement commands. The deployed ping-compatible v2 transport is defined by `gateway.js` and `pvpDiagnosticSocket.js`.

## Verification

```sh
node --test tests/railway-pvp.test.mjs tests/ai-battle-matchmaking.test.mjs tests/pvp-latency.test.mjs
bun tests/railway-pvp-network.mjs
npx vite build
```

The first command covers signature/membership/expiry checks, forged/cross-room receipts, replay, reconnection, rate/size bounds, animation deduplication, actual Base44 damage receipts, and existing queue/latency behavior. The Bun smoke test opens real local WebSockets for two players and checks origin rejection and signed state delivery. Neither test substitutes for two real signed-in players in the deployed application.

For live acceptance: enter the existing queue with two test accounts, observe `wss_authenticated` in each browser, cast a skill and melee, verify identical HP/turns, disconnect/rejoin, then disable WSS and verify fallback. Compare latency traces before/after; no measured production latency improvement is claimed yet.

## Remaining boundaries

- Railway rooms and replay caches are bounded in-memory state for a single test replica. Restart loses them; Base44 polling restores authoritative state. Cross-replica replay protection/fan-out needs shared storage before horizontal scaling.
- Authorization is a 90-second lease; renewals check current membership. This is not instantaneous ticket revocation.
- Base44 still owns damage resolution and impact deadlines. This change does not solve database transaction contention or move the combat engine onto Railway.
- Character movement still uses the existing transport. Railway movement and new game modes are separate work.
- Receipt forwarding depends on at least one connected browser receiving a Base44 response. Lost delivery is recovered by the existing poller; no durable event log is introduced.
