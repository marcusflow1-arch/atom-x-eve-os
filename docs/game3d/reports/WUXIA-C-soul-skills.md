# Worker report: Wuxia slice C, mount soul skill transformations

**Task / status / specialist:** blueprint v3 §7.2 (v1 §4.4) for the Game 3D hero world. While a mount is absorbed
(slice B), skills gain strikes from the mount's soul. Implemented; awaiting PM and QA review and owner approval. Claude.

**Exactly what changed and why:**

- **Plan** (`planAXEMountSoulEchoes` in `AXEMountFusionSystem.js`, pure): for each skill it gives the extra strikes
  ("echoes") and when they land after the skill's own last strike, using each cast type's existing schedule:
  - Single-hit skills (Heavy Strike, Crushing Blow) gain a spectral strike: 1 → 2 hits, at 0.75× damage.
  - Combos of 3 or more hits gain two elemental strikes on the skill's own rhythm: Triple Slash 3 → 5, Twin Fang
    4 → 6, Barrage 5 → 7, each at 0.8×.
  - AoE skills (`aoe_radius > 0`) gain a second explosion, 25% wider, at 0.8×. No current skill has an AoE radius, so
    this rule is ready for when one does.
  - Double Shot (2 hits) fits none of the three and is left unchanged.
  - The damage scales are provisional balance.
- **Executor** (`skillExecutor.jsx`): while fused, `castSkill` schedules the echoes as ordinary `playerSkillStrike`
  events.
  - Each event carries `soulEcho` ('spectral' | 'elemental' | 'spectral_aoe') and `soulPalette`, with the multiplier scaled.
  - Each echo goes through the normal attack path, so it rolls its own critical hit, as the blueprint asks for the second explosion.
  - Echoes never consume the Critical Focus meant for the real single hit.
  - Every strike of a cast reports the fused hit total.
- **Visuals** (`AXEMountFusionVisualRuntime.js`), in the clan's colours:
  - A three-claw spectral rake in front of the hero for spectral strikes.
  - A burst of sparks for elemental strikes.
  - A ground shockwave out to the echo's radius for the AoE echo.
  - Echo time steps are capped at 0.1 s so a frame hitch can't swallow an effect.

**Changed paths:** `axe/progression/AXEMountFusionSystem.js` (rules), `axe/progression/AXEMountFusionVisualRuntime.js`
(echo effects), `skills/skillExecutor.jsx` (scheduling), `tests/game3d/mount-fusion.test.mjs` (two more tests), this report.

**Exact tests run and observed output:**

- `node --test tests/game3d/*.test.mjs`: 27 tests, 27 pass. Two are new:
  - The echo plan for every registered skill, plus a synthetic AoE skill.
  - A real `castSkill` with an equipped sword and mocked timers:
    - Not absorbed, Heavy Strike lands 1 strike.
    - Absorbed, it lands 2, the second spectral at 0.75× with the flame palette.
    - Triple Slash lands 5, the last two elemental, all reporting 5 hits.
    - After release it's back to 3.
- `npx vite build`: exit 0. Scoped eslint: 0 problems.
- **Isolated browser review** (real runtime, stand-in figure, frames stepped by hand because the hidden pane pauses `requestAnimationFrame`):
  - The spectral claw rake rendered (+864 triangles, three claws).
  - The AoE shockwave ring expanded on the ground.

**Tests not run:** live GameView (Base44 sign-in), so not how echoes look on the real avatar or which way the claws
face in the world. Also not combat feel or multiplayer: remote players don't see echo effects.

**Bugs, risks, rollback:**

- **Animation:** each echo presses the normal attack, so the hero plays an attack animation for it. That fits the
  blueprint's "extends the attack animation" for the flurry, while the spectral strike would ideally be the mount
  avatar's alone (needs mount-avatar art).
- **Balance:** fused damage rises by +75% for single-hit skills and about +53% for a 3-hit combo, on top of the +39% gear share.
- **Rollback:** revert the commit.

**PM HANDOFF:**

- **Next:** companion 20% + 20% stat transfer; Taurus Chosen Ascension; pill reward sources (economy, owner-gated);
  the v1 cap migrations (backup plan first).
- **Owner decisions:** D2–D7 are unchanged.
