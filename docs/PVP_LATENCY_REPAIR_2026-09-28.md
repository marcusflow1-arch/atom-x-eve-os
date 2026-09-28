# PvP response and matchmaking repair

The supplied `chidori-ultimate-cinematic.patch` adds a cinematic and a 5,400 ms timer extension. It does not repair matchmaking. This repair leaves that patch unapplied and addresses the existing queue and combat paths.

## Changes

- The persistent battle host listens for its own queue and participating-match entity changes. Signals request fresh authoritative state; heartbeat and position-only changes are ignored. Read access is owner/participant-only; all entity writes remain admin/backend-only.
- The arena, popup, polling and heartbeat share one status request. A signal received during an older request gets a fresh read after it. Response sequence and mutation guards prevent an older poll from undoing an accepted action.
- Responses timestamp both arrival and completion of server processing. The client records a fixed clock offset until its next response, excluding backend processing time from the round-trip estimate.
- Public matches include pending-hit deadlines. The host refreshes at impact and countdown completion, rather than waiting for the regular one-second fight or three-second queue interval. Clock-jitter retries are bounded; reconnect pauses suspend impact wake-ups.
- Basic attacks show the cosmetic swing immediately. Damage, HP, misses, critical hits and target reactions stay server-authoritative. Skill/attack/dodge inputs are guarded while an action is pending; attacks are never automatically retried after a 429.
- Chidori's movement/impact presentation uses the server impact timestamp. Existing animation content and combat rules are preserved.
- Pairing loads the two player profiles concurrently and scans the waiting pool once per new join. Failed pool reads report an error instead of pretending no opponent exists.
- Dashboard room joins are throttled while a join is already pending.

Normal polling remains the fallback if realtime is unavailable. The intentional countdown and model-loading handshake remain. This removes avoidable polling waits; it does not eliminate network transit, backend processing or asset loading. Ability acceptance still comes from the server.

## Verification

```sh
node --test tests/ai-battle-matchmaking.test.mjs tests/avatar-combat-stats.test.mjs tests/pvp-latency.test.mjs tests/pvp-queue-realtime.test.mjs
npm run build
```

- **63 focused checks passed**, including actual React queue-hook integration, failure recovery, response ordering, impact scheduling, read/write permissions and the existing shared-stat combat tests.
- Production build passed. Existing browser-data and ambiguous-Tailwind-class warnings remain.
- The broader reward, card-ownership and battle-skill suites ran **135 tests: 124 passed, 11 failed**. The same 11 test names also fail in an isolated copy of pre-repair commit `f176dff800790333dec6a7e7ca5f96dafe8741e2`; no new failures were introduced. These are the existing loadout-lock fixture/expectation cases documented in `AI_BATTLE_RELIABILITY_2026-09-27.md`.

A live, two-account gameplay session was not run in this environment. Final gameplay verification should queue two signed-in players, complete loading, exchange basic attacks and abilities, and repeat with a temporary peer/network interruption. Confirm a rejected action changes no HP, the match survives reconnect, and no duplicate action fires afterward.
