# Railway PvP migration contract (Atom X Eve)

## Current state
Base44 `aiBattleMatchmaker` owns queue, reservations, match lifecycle, combat rules, damage and persistence. Railway gateway currently accepts diagnostic WebSocket ping only. Never point the production battleClient at the ping gateway: it has no queue or combat protocol.

## Required before switching live traffic
1. Authenticate browser users with Base44-issued short-lived, single-use Railway session tickets minted by a server-side Base44 function after `createClientFromRequest(req).auth.me()`. Ticket must bind user ID, match ID, expiry, nonce, and audience, and be validated by Railway against a shared signing key or a trusted verification endpoint. Do not put signing keys in browser code.
2. Railway owns atomic queue operations: join, cancel, heartbeat, matched pair reservation, reconnect grace, duplicate queue protection, and match-ready handshakes. Use a persistent transactional store (e.g. Redis/Postgres) for concurrency and recovery; not an in-memory Map.
3. Railway verifies every combat command against match membership, turn, equipped skill, ATB, cooldown, range, idempotent cast ID and authoritative positions. Server resolves HP, dodge, stun, win/loss and broadcasts a sequenced result to both clients.
4. Base44 remains the durable source for avatars, skill inventories, rewards, and achievements. Synchronize match results idempotently from Railway to a protected Base44 function; do not accept client-reported victory.
5. Client transport `src/components/battle/battleClient.js` currently invokes `base44.functions.invoke('aiBattleMatchmaker',...)`. Replace with Railway protocol only after its response schema matches `createBattleTransport` and the Railway auth handshake is functional.
6. WebSocket events need monotonic match sequence numbers, cast IDs, server timestamps, replay/resume cursor, and periodic snapshots. Predict cosmetic animations locally; reconcile server outcomes; interpolate remote movement.
7. Keep rollback checkpoint and a feature flag until Railway can service a complete two-player queue-to-result flow. Do not claim Railway combat is active while /ws only supports ping/pong.

## Current diagnostic
Open Atom X Eve with `?pvp_debug=1` in both browsers. Railway panel reports ping latency; gameplay still uses Base44.
