# Worker report: live GameView pass, problems found and fixed

**Task / status:** the owner asked to "continue to work and fix any problems". GameView was run locally (Vite + a local
Base44 API stand-in with a test account; nothing reached real services) and slices A–C were exercised in the real game.
Fixed; awaiting review. Claude.

**Found and fixed:**

1. **No in-game toast ever appeared (pre-existing).**
   - **Cause:** GameView renders outside the app Layout, and the Layout's `<Toaster>` is the only one, so skill
     activations, "requires a sword" errors, PvP lock-on notices and friend / party / trade / duel confirmations were
     silently dropped.
   - **Fix:** `GameView.jsx` mounts its own `react-hot-toast` `<Toaster>` below the boss bar, in the ink style.
   - **Live check:** a probe toast now renders; before, there were zero toaster containers.
2. **F could no longer mount the companion (pre-existing).**
   - **Cause:** 6a64a744 rebound F to Kick and dropped the line that set `mountToggleRef`. The dismount/mount code and
     the "F Mount / Dismount" prompt stayed, but nothing could trigger them.
   - **Fix:** F mounts or dismounts exactly when that prompt is showing (next to the companion, or while riding) and
     kicks everywhere else.
   - **Live check:** F next to the wolf → riding, and the prompt switched to "Dismount Baby Wolf".
3. **Absorbing a ridden mount left the hero on it (slice B).**
   - **Cause:** the mount store dismounted, but the world's own mounted flag wasn't told.
   - **Fix:** `absorbAXEMount` now signals a forced dismount (`axeMountForceDismount`), and `GameWorld3D` runs its
     normal dismount on the next frame.
4. **The quick-switch notice covered the hotbar (slice A).** Moved above the hotbar cluster (`bottom-[15rem]`).
5. **The fusion timer chip covered the boss HP bar (slice B).** Moved to the right column, under the Dungeon Runtime
   panel (`right-4 top-[10.5rem]`).
6. **The Dismount prompt sat behind the hotbar (pre-existing, 80 px).** It now uses the Mount prompt's 128 px.
7. **Absorbing a 0%-growth mount silently did nothing to stats (slice B).** The Soul Fusion section now explains that
   growth raises the base share, and that until then an absorption brings only the aura and the soul strikes.
8. **The affinity cards were cramped at the hub's real five-column width (slice A).** Each specialized value now
   stacks under its base value.
9. **Lint:** removed unused imports in `GameView.jsx` (`React`, `subscribeLootInventory`) and `WeaponMasteryTab.jsx`
   (`React`). No changed file gains a lint error; GameView drops from 2 errors to 0.

**Verified live:**

- Affinity view, slot assignment and Shift+1 / Shift+2 swaps in the real hub.
- The Soul Fusion section and the absorb review.
- The aura on the real avatar.
- Fusion expiry (it ended while the session was paused) and fusion persistence across a reload.
- Toasts rendering.
- F mounting next to the wolf.

**Not verified live:** the forced dismount after absorbing while riding, because the pane's tab was in the background
(the owner had GitHub open), which pauses the game's animation loop. Its wiring reuses the dismount path that was seen
working.

**Tests:**

- `node --test tests/game3d/*.test.mjs`: 27 pass. `npx vite build`: exit 0.
- **Full suite:** 811 tests, 769 pass, 34 fail, 8 skipped. The 34 failures are identical on main before this branch
  (754 pass, 34 fail of 796). They're in dashboard, store, social, AI battle, Game 5 quest, Jedi camera, WASM and voice
  tests, and are handed to a separate task. This branch adds 15 tests, all passing.

**Open (owner):**

- In this build the companion is hidden by default (the `=` key shows it), so the mount prompt and riding work on an
  invisible wolf. That's a pre-existing dev setting, left alone.
- D2–D7 in the gap map.
