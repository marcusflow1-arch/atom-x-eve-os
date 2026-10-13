# Game 2 remote-player jitter trial (isolated GitHub branch)

## What this changes
Only the *remote player* position correction in `src/components/game2/engine/netgame.js`. This release enables bounded correction by default for Game 2 multiplayer, with an immediate opt-out URL flag. No changes to Base44 login, Railway server, offline mode, saber damage, Force rules, animations, maps, or the default online path.

**Hypothesis:** when an incoming position update differs from the displayed remote fighter by >1.5 game units, the old correction moves the remote fighter to the new position in a single frame. On both players' screens this may appear as jumping or rubber-banding. This is a hypothesis, not a verified cause.

## A/B comparison
1. Test with **two separately signed-in players**, two browsers or computers. Use the same map, network conditions, movement sequence, and location, ideally for at least 3 minutes per run.
2. **Baseline**: open Game 2 with `?g2netsmooth=0&g2netdebug=1` (or append with `&` if the URL already has query parameters). This uses **the original** movement correction.
3. In the browser Developer Tools console, evaluate `window.__atomxeGame2NetStats`. This is a read-only observational step; it contains no tokens or player credentials. Record `received`, `longGaps`, `maxGapMs`, `largeCorrections`, `hardSnaps`, `worstCorrection`, and `lastRttMs`.
4. **Trial**: reload both clients without `g2netsmooth=0`, adding `g2netdebug=1` to record the trial. `g2netsmooth=1` is also accepted. The trial limits per-frame movement corrections and preserves a hard snap for obvious teleports and respawns.
5. Ask both players to record perceived opponent jitter and whether own input, saber hits, Force push/pull, collision, dying and respawning still behave normally. Avoid claims of improvement without comparing both runs.
6. Test a brief poor-connection scenario (network throttling or a second connection with variable ping). Watch for excessive trailing instead of teleports. If damage targeting looks wrong, disable the flag and investigate a display-only smoothing approach.

## Pass/fail and rollback
- A smoother opponent with no extra visible trails, no combat regressions, and comparable latency is the trial goal.
- If players lag behind their true positions, combat targeting changes, or the measured corrections do not improve, **use `g2netsmooth=0` immediately** and roll back the change.
- Default online correction is changed when the updated code is deployed. Only Game 2 remote fighter correction is affected; server/other pages are unchanged.
- This does **not** change WebSockets/TCP reliability or eliminate network congestion. A longer-term improvement may need timestamped snapshots, an interpolation buffer, packet telemetry, or a different transport.

## Tests
- `node --test tests/game2-remote-smoothing.test.mjs`
- `node --test tests/game2-online.test.mjs tests/game2-arena-coordinator.test.mjs`
- `npm run build`
- `npm test --prefix server/game2`

### Scope guard
Do **not** change Game 1, Game 3, unrelated Atom XE dashboard screens, AI systems, or Railway/Azure service settings for this trial. Separate tests are needed before a production rollout.
