# Worker report: Wuxia slice D, Taurus Chosen Ascension

**Task / status / specialist:** blueprint v3 §4 for the Game 3D hero world. A character at the peak of mortal
progression becomes an Enlightened Being, walks one of three Natures, levitates and wears the Angel Cloak.
Implemented; awaiting PM and QA review and owner approval. Claude.

**Exactly what changed and why:**

- **Rules** (`axe/progression/AXEAscensionSystem.js`, pure). All values are provisional balance:
  - Eligibility from level 100. Game 3D has no level cap yet (`normalLevelCap` is null), so "peak character limits"
    is a provisional threshold for the owner to set.
  - **Destroyer:** skill damage ×1.5, and single-hit skills send out a shockwave.
  - **Balanced:** damage, defense, max HP, chi, attack success and block all ×1.2. The blueprint's "0 s swap GCD"
    needs nothing today because Game 3D has no swap cooldown. If one is added, Balanced should be exempt.
  - **Defensive:** defense ×1.5, and 30% of every blow the hero lands is banked as a shield. The shield is capped at
    40% of max HP and fades 8 s after the last blow that fed it.
  - Changing Nature again within an hour is refused.
- **State** (`axe/progression/AXEAscensionStore.js`): saved per character (`axe_ascension_v1`). The shield lives in
  memory only, so a reload or a character switch clears it.
  - The ritual needs an explicit confirmation and happens once.
  - Levitation: movement ×1.12.
  - Angel Cloak: +500 HP, +40 defense, +30 attribution defense and +3% movement. Hiding the cloak mesh keeps its
    bonuses, as outfits do.
- **Wiring:**
  - `playerHUDStore.jsx`: the cloak's flat bonuses join the existing sum, and the Nature is a new final derived-stat
    stage after Weapon Affinity. Stats recompute on every ascension change.
  - `skillExecutor.jsx`: Destroyer multiplies every strike, soul echoes included. Single-hit casts carry
    `ascensionShockwave`.
  - `weaponClassCombatHelpers.jsx`: the movement multiplier.
  - `buffCompat.absorbShield`: Aegis absorbs first, then the Defensive shield. GameWorld3D already calls this on
    every incoming hit.
  - `GameWorld3D.jsx`: banks each landed blow and runs the visual runtime.
- **Visuals** (`axe/progression/AXEAscensionVisualRuntime.js`, procedural like the halo):
  - **Hover:** the body floats 0.15 m with a slight bob, over a soft pool of light. The model root, which the game
    snaps to the ground and collides with, never moves. The avatar is skinned, so the lift runs after the animation
    mixer each frame (`lateUpdate`). A bone the mixer has just rewritten takes its new height as the base. The offset
    is converted to the model's scale, because the avatar loader resizes each model to the character's height.
  - **Angel Cloak:** an ivory and gold cape from the shoulders, tapered and wrapped round the body, with star
    embroidery. It sways toward the hem.
  - **Destroyer:** a ground shockwave ring on single-hit skills.
  - **Defensive:** a shield bubble while the shield holds. It hides by itself when the shield expires.
- **Hub:** Progression → Ascension (`progression/hub/AscensionSubTab.jsx`, registered in the service registry and menu):
  - Level progress, then the ritual with an inline review.
  - Three Nature cards with the re-attune countdown.
  - The cloak show/hide toggle.
- **Floor effects raised to 0.10 m:** road and path decals sit up to 6.5 cm above the sampled ground, which hid the
  glow and rings. Slice B's fusion foot ring and shockwave had the same problem and are fixed here too.

**Changed paths:**

- New: `axe/progression/AXEAscensionSystem.js`, `AXEAscensionStore.js`, `AXEAscensionVisualRuntime.js`,
  `progression/hub/AscensionSubTab.jsx`, `tests/game3d/ascension.test.mjs`, this report.
- Edited: `playerHUDStore.jsx`, `skills/skillExecutor.jsx`, `skills/buffCompat.jsx`, `weaponClassCombatHelpers.jsx`,
  `GameWorld3D.jsx`, `axe/services/AXEServiceRegistry.js`, `axe/services/AXEGlobalServicesMenu.jsx`,
  `axe/progression/AXEMountFusionVisualRuntime.js`, `docs/game3d/WUXIA_BLUEPRINT_GAP_MAP.md`.

**Exact tests run and observed output:**

- `node --test tests/game3d/*.test.mjs`: 36 tests, 36 pass. The 9 new ones cover:
  - The level and confirmation gates.
  - The Nature cooldown.
  - The cloak and Natures in the live derived stats (+500 HP, +40 defense, Balanced ×1.2 on six stats, Defensive
    defense ×1.5).
  - Movement ×1.12 × 1.03.
  - A real `castSkill` with mocked timers: Destroyer ×1.5, and the shockwave on single-hit skills only.
  - The shield bank, cap and expiry, drained through `absorbShield`.
  - Per-character persistence without the shield.
  - The visual runtime: the root never moves, the lift doesn't pile up and follows a re-posed bone, rings fade, the
    bubble hides on expiry, dispose cleans up. Also the hover in metres on a centimetre-scale rig.
- `npx vite build`: exit 0.
- **eslint on the changed files:** no new errors. The services menu keeps its 2 pre-existing errors, and GameWorld3D
  its 17 pre-existing warnings.
- **Live GameView** (local Vite plus a local Base44 stand-in with a test account; nothing reached real services):
  - Progression → Ascension: at level 1 the button is disabled ("Reach level 100"). At level 100 the review appears,
    and confirming ascends.
  - The HUD went from 193 HP / 23.26 defense to 693 / 63.26, and Defensive took defense to 94.89.
  - Choosing Destroyer started the 60-minute re-attune countdown and set the skill multiplier to 1.5.
  - The state survived a reload.
  - On the real avatar:
    - The skeleton lifted 0.157 local units (0.15 m at the model's 0.97 scale), with the root on the ground.
    - The cloak rendered on the back.
    - The glow and two shockwave rings showed above the road.
    - The shield bubble appeared with a 120 shield and hid once it expired.
  - Afterwards the test character was put back to level 1 and un-ascended.

**Tests not run:**

- **Combat feel in a real fight**, and the shockwave's timing against real skill animations. The window was
  unfocused, so the game loop ran at about one frame per 1.5 s and frames were rendered by hand for the screenshots.
- **Multiplayer:** remote players don't see the hover, cloak or effects.

**Bugs, risks, rollback:**

- **Partial against the blueprint:**
  - The Destroyer shockwave is visual only. Splash damage needs GameWorld3D's inline kill handling (rewards, XP,
    quests, network broadcast) pulled into a function that more than one target can use first.
  - The Defensive shield protects only the hero until party combat exists.
- **Balance:** Destroyer stacks with Mount Soul Fusion and its echoes, so a fused single-hit skill reaches about
  ×2.6 its mortal damage.
- **Hover with future rigs:** the lift moves the model's direct children. A rig whose animated root bone is a direct
  child is handled, but any later code that sets a child's height after `lateUpdate` would undo the lift for that frame.
- **Rollback:** revert the commit. The only saved data is `axe_ascension_v1`, which older builds ignore.

**PM HANDOFF:**

- **Next:**
  - The companion 20% + 20% stat transfer.
  - The Destroyer splash damage, after the kill-path refactor.
  - Pill reward sources (economy, owner-gated).
  - The v1 cap migrations (backup plan first).
- **Owner decisions:**
  - The ascension level threshold.
  - Whether a Nature change should cost something besides time.
  - D2–D7 are unchanged.
