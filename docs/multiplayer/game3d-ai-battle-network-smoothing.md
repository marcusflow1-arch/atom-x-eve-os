# Game 3D world + Luna AI Battle multiplayer smoothing

This change adapts the bounded remote-position reconciliation validated in Game 2, but **only for remote character presentation**. The game modes do not use identical networking: Game 2 uses Railway's dedicated WebSocket relay, the shared 3D world has legacy peer movement with an optional new realtime remote renderer, and AI Battle has a Base44-authoritative queue/combat backend plus visual peer messages.

## Changed paths
- Game 3D: legacy remote avatars and the opt-in modern remote renderer use frame-rate-independent bounded movement corrections. Existing world combat, local player input, quest objectives and the boss/enemy simulation are unchanged.
- Luna AI Battle PvP: the visible opponent gets a smooth render-only location. The separate authoritative opponent coordinates, targeting, range checks, hit confirmations, HP, cooldowns, ATB, AI and matchmaking stay unchanged.
- Queue/reconnect: when the browser network connection returns, an active queue or match requests a coalesced status refresh instead of relying solely on the existing poll. No faster polling and no extra database writes.
- Opt-in timing evidence: `aibattledebug=1` exposes at most 60 recent client-to-Base44 timing samples at `window.__atomxeAIBattleTimings`, including the `join`, `status`, `use_skill`, and `basic_attack` requests. These samples contain no user IDs, tokens or battle content.

## Two-person validation
1. Open the same published version in two browser sessions. Compare Game 3D world movement with normal URL and `g3netsmooth=0` in both clients.
2. From Luna Dashboard, open AI Battle -> PvP -> Avatar Duel and join the queue from each account. Confirm there is **one match**, and both players appear in the same dashboard room; check the two fighters render before combat begins.
3. Run the same movement test in the PvP arena with default behavior and `aibattlesmooth=0`. Confirm both avatars face each other, move smoothly, respond to WASD, and do not visually teleport during normal strafing.
4. Test basic attacks, Skill Book abilities, Chidori, misses, dodge, Force-like effects, stuns, disconnect/reconnect and finish/result flow. Ensure no extra damage, false misses, delayed attack inputs or loss of local control. Compare with both smoothing flags off.
5. Test matchmaking by toggling the browser offline and back online **while waiting** and in a reconnecting active match, then verify queue reservation/arena state recovers without duplicate matches.
6. With `aibattledebug=1` inspect `window.__atomxeAIBattleTimings` for duration measurements. Distinguish waiting for an opponent from request latency: neither smoothing nor faster frame updates can make matchmaking find an opponent sooner.

## Rollback and limitations
- **3D world:** use `g3netsmooth=0` to return both remote renderers to the old position lerp.
- **Luna AI Battle:** use `aibattlesmooth=0` to disable the extra visual opponent smoothing. No effect on the server match.
- Roll back the GitHub change if gameplay accuracy or animation reaction regressions appear.
- This does **not** migrate Luna AI Battle or the world to Railway. Combat outcome still waits for Base44 authorization, and smoothing does not eliminate transit latency or server-side processing delay.
- No changes are made to AI Battle PvE and World Event preview-only queues, which are not yet playable according to the mode catalog.
