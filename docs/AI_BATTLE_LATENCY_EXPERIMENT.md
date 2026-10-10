> Update (2026-10-10): match-bound authentication and signed combat relay implementation are now on this testing branch. See [activation requirements and verification](RAILWAY_PVP_AUTHENTICATED_RELAY.md). Earlier endpoint/status notes below are historical. Live two-account acceptance is still pending.

# AI Battle latency experiment (isolated branch)

This branch is for measuring the existing PvP event path before switching transport. It does not change production matchmaking or damage authority.

## Confirmed existing paths
- PvPArenaStage uses peer relay for fast casts, with server-polled last_cast and hit_log fallbacks.
- The reliability report documents 1-second combat polling and 6-second backoff after rate limits.
- realtimeNetworkManager implements WebSocket ping/pong, snapshots, interpolation, and combat_event subscription, but its presence does not prove PvP uses it.

## Two-browser measurement
1. Open two distinct authenticated accounts and DevTools in both browsers. Enable Preserve log and record a performance trace.
2. Record client timestamp when a Chidori input is submitted, when peer relay arrives, when last_cast/hit_log is observed, and when the opponent's animation actually starts. Use performance.now() for local intervals; do not subtract unsynchronized clocks between machines.
3. Repeat 20 attacks, including misses and knockdowns. Compare median and p95 latency, duplicate cast IDs, dropped effects, and server 429 responses.
4. Repeat with throttled network and disconnected relay to verify fallback behavior.

## Transport prototype acceptance criteria
- Keep Base44 authentication, progression and matchmaking; use an authenticated WSS room scoped to match ID.
- Server validates participant membership and resolves damage; clients never submit authoritative damage.
- Broadcast cast_started and hit_resolved with unique cast IDs, monotonically increasing sequence numbers and server timestamps.
- De-duplicate by cast ID and reconcile missed events against authoritative hit_log after reconnect.
- Compare old relay/poll path against WSS in the same test harness before enabling any feature flag.
- Never use ws://localhost from an HTTPS production page; configure a reachable wss:// endpoint and secure server-side token validation.

## Status
Testing plan committed. No Fedora server deployed, no live two-player test executed, and no combat transport switched yet.
