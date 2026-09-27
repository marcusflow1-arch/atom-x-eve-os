# AI Battle reliability — 27 September 2026

This pass fixes the PvP problems reported from live play: players dropping out of the queue, being ejected from a match once the arena loaded (with **Queue** as the only way back), abilities that did not show or fire in PvP, and melee/ability hits with no visible impact on the opponent.

## Queue and match stability

**Root causes**

- The arena and the matchmaking bridge were mounted deep inside the dashboard avatar card (`LunaTemplate → Mini3DViewerBox → AvatarStatCard → DashboardAvatarOverview → DashboardAvatarScene`). Any branch switch there unmounted the fight: focus mode, section changes, the UI toggle, or dashboard hotkeys pressed during the match (for example **C** for console mode).
- Passive observers of the `['ai-battle-matchmaking', userId]` cache used a placeholder `queryFn: async () => ({})`. React Query keeps the options of the last observer to render, so any invalidate or refetch (the arena calls `invalidateQueries` when its ready handshake fails) replaced the cache with `{}`. The live match disappeared and the arena unmounted.
- `aiBattleMatchmaker` treated failed reads as "no row". `getMatch`, `activeQueuesForUser`, `queueForMatch` and `activeMatchForUser` all used `.catch(() => [] / null)`. A rate limit or timeout during a poll therefore cancelled the player's reservation, and they fell out of the match. **Queue** worked only because `join` takes the `PlayerState.active_match_id` recovery path.
- Reserved pairs never expired. If one browser vanished in `matched` or `connecting`, the other player waited forever. Every later Queue press then "reconnected" them into that dead match.
- When one player cancelled a reservation, the opponent's queue row was cancelled as well.

**Changes**

- `src/components/battle/AIBattleHost.jsx` is the single owner of matchmaking polling, the room bridge and the arena. It is mounted once at the root of `LunaTemplate` and portals a full-screen arena, wrapped in its own error boundary. A reload reconnects on the first status poll.
- Every observer uses the real fetcher (`fetchAIBattleStatus`, `useAIBattleSnapshot`). The heartbeat publishes its results to the same cache.
- Server reads now distinguish "not found" (404) from failure. Failures return 5xx and change nothing, and the client keeps its last known state.
- `settlePrefight` ends a pair when either player's heartbeat is stale, or when `matched` exceeds 90 s or `connecting` exceeds 180 s. Players who are still present go back to `waiting` and keep their original `queued_at`. The response carries a `notice` explaining what happened.
- `cancel` and `forfeit` during a reservation return the other player to the queue instead of cancelling them.
- **UI:**
  - A queue indicator (`AIBattleQueueStatus`) stays visible whenever the player is queued and the popup is closed.
  - On other pages, a **Return to match** banner (`AIBattleReturnBanner`) appears while a fight is live.
  - The results screen no longer calls `reset`, which could cancel a queue entered right after a match.
- While a match is live, the arena stops key propagation, so dashboard shortcuts cannot fire underneath the fight.

## Abilities in PvP

**Root causes**

- The arena called `runtime.playIdle()` on every frame while a fighter stood still. For Getsuga this cancelled the ability clip one frame after it started, and for everyone it restarted the idle clip each frame (frozen pose).
- Female (Artemis) fighters' `AnimationMixer` was never updated in the arena. The runtime relies on its host to advance it, and only the dashboard scene did. Their animations never played, and the first ability left the runtime permanently "busy".
- Keys 1–4 were handled by both `useSkills` and the arena, so each press sent two casts, and the second was rejected with an error.
- `window.__lunaPvPCombat.requestSkill` captured a stale turn and cooldown snapshot.
- The queue sent `avatar_gender: 'male'` whenever the avatar had not resolved yet. That froze female players' loadouts as male, dropping their Artemis abilities, and loaded the wrong fighter.
- A single failed Skill Book read at countdown froze an empty hotbar for the whole match.
- Generic ability cards had a 3 m range, while fighters spawn 10 m apart.

**Changes**

- Motion is driven only when it changes, and never over a running ability (`setMotion` in `PvPArenaStage`).
- The Artemis mixer advances every frame. Artemis stays in her combat stance between turns (`relaxAfter: 0`), so a cast can't land during the sheathe animation.
- Casters are rooted while their ability plays.
- The arena alone handles keys 1–4. Global combat hooks delegate through wrappers that always read the latest state.
- The client sends a blank gender when unknown, and the server then uses the saved Avatar.
- A countdown refreeze that fails keeps the loadout snapshot taken at pairing.
- Generic card abilities are lock-on with 18 m range, which covers the whole court.

## Combat feedback

`src/components/battle/combatFx.js` adds four effects, all driven by the arena render loop:

- **Melee slash:** a slash line drawn across the target, with sparks.
- **Ability hits:** a lock-on projectile from caster to target that lands on the server's `resolves_at`, followed by an impact burst.
- **Damage flash:** a red flash and a short recoil on the damaged fighter.
- **Floating numbers:** damage, crit and MISS text over the fighter.

The melee attacker also lunges.

Hit feedback is driven by the authoritative `hit_log`, so both players see every hit even when the peer relay drops the live message. The matchmaker also records `last_cast` (new `AIBattleMatch` field), so the opponent's ability animation starts from the server poll if the relay misses it. Every visual is de-duplicated by `cast_id`.

## Tests

`tests/ai-battle-matchmaking.test.mjs` covers the following. All nine cases fail on the previous code.

- Failed reads do not cancel queues.
- Abandoned pairs are re-queued with their original place.
- Stale pointers put the player into the queue, not a dead arena.
- The full handshake reaches a fight in which a card ability casts from spawn distance and records `last_cast`.
- Position writes are skipped when the fighter has not moved.
- Cancel and forfeit re-queue the other player.

The 11 existing failures in `tests/battle-skill-eligibility.test.mjs` predate this change. They expect Skill Book locks during `matched` and when there is no live heartbeat, which `base44/shared/matchLock.ts` no longer enforces.

Run with `node --test tests/ai-battle-matchmaking.test.mjs` (requires `npm ci`, which provides `esbuild`).

## Deploy notes

- Deploy the `aiBattleMatchmaker` function together with the `AIBattleMatch` entity change (new `last_cast` object field).
- Both frontend and backend must ship together. The new client reads `notice` and `last_cast`, but tolerates their absence.

## Follow-up: Queue flips back to Q (rate limit)

Base44's Logs showed `aiBattleMatchmaker` returning **429 (too many requests)** many times a minute. The Queue popup treated rate-limit errors as silent, so the button spun and flipped back to Q. Other dashboard functions (`dashboardSession`, `partySystem`, `ownedGames`) were failing at the same time because the limit is shared across the whole app.

- **Polling is slower per phase:** 3 s while queued, 1.5 s while connecting, 1 s during a fight, 30 s when idle, and 6 s after a 429. Before, it was 0.5–1 s in every phase.
- **The background heartbeat skips its tick** while the dashboard poller is already active.
- **The arena's "ready" confirmation** is resent every 4 s instead of every second.
- **The server memoizes the caller's queue rows per request.** It also skips the PlayerState lookup for waiting rows, and only re-reads after a pair was actually created. A queued poll now costs at most 2 reads (was 4), and a fight poll costs 3 (was 4).
- **Join, cancel and reconnect retry a 429** after 1.5 s, 3 s and 5 s. If the server is still busy, the popup says so instead of silently resetting.
