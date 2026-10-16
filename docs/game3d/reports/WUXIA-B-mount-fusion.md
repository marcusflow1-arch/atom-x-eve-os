# Worker report: Wuxia slice B, Mount Soul Fusion

**Task / status / specialist:** Wuxia blueprint §4 (owner's v1 and v3) for the Game 3D hero world: 7-slot mount gear,
combination share, absorption pills, fused stat multiplier and aura. Implemented; awaiting PM and QA review and owner
approval. Claude (implementation).

**Exactly what changed and why:**

- **Combination share** (`AXEMountFusionSystem.js`, pure rules):
  - **Base:** 25% at full mount growth. The existing 0–100% growth stands in for the blueprint's mount level 1–50.
  - **Gear:** +2% for each of the seven gear slots refined to Stage 20, so 25% → 39%.
  - **Refining:** Stage n → n+1 costs 150 × (n+1) of the mount store's gold (31,500 per slot to Stage 20), with a
    review and confirmation and a stale-review guard, like legendary crafting. Provisional balance.
- **Absorption** (`AXEMountStore.js`):
  - **Pills:** an Absorption Pill (S, 60 min) or (600 min) absorbs the *registered* mount; another pill adds its time.
  - **Riding:** the absorbed mount can't be ridden (`MOUNT_ABSORBED`; GameWorld3D shows a notice) and can't be released.
  - **Persistence:** the fusion persists per character, survives a reload and ends on time (a timer, plus
    `tickAXEMountFusion` from the HUD as a safety net).
  - **Starter pills:** every character gets 3 Absorption Pill (S) once, so the feature can be tried. Provisional:
    reward sources are a later economy task.
- **Stats:** while absorbed, `playerHUDStore` multiplies the equipment's attribute and flat contribution by
  (1 + share / 100), which is the blueprint's S_absorbed = S_gear × (1 + C/100). Derived stats carry
  `mountFusion: { active, share }`.
- **Aura** (`AXEMountFusionVisualRuntime.js`, attached like the halo runtime): an awakened core at the chest, two
  energy rings crossing the body, about 90 particles spiralling up and a ground ring. Each clan has its own colours:
  - War Wolf: Flame (crimson-orange).
  - Iron Wolf: Water (azure).
  - Spirit Wolf: Spirit (jade).
  - Vanguard Wolf: Ninja Clan (blue-black).
  It's brighter at a higher share, with particles off in low-effects mode.
- **HUD:** a fusion timer chip in the ink style (`AXEMountFusionHUD.jsx`, in GameView).
- **Character Hub → Mounts:** a Soul Fusion section showing the share with its breakdown, the seven slots, and the
  pills with absorb, extend and release (`MountSoulFusionPanel.jsx`).
- **Bug fixed:** `grantAXEMountMaterials` rebuilt the materials map from four fixed keys, dropping any other material.
  It now keeps every key and can grant pills.

**Changed paths:**

- **New:**
  - `axe/progression/AXEMountFusionSystem.js`, `AXEMountFusionVisualRuntime.js`, `AXEMountFusionHUD.jsx`
  - `progression/hub/MountSoulFusionPanel.jsx`
  - `tests/game3d/mount-fusion.test.mjs`
  - this report
- **Changed:**
  - `axe/progression/AXEMountStore.js`: fusion, gear refine, pill grant fix, ride and release guards.
  - `axe/progression/AXEMountSystem.js`: gear normalized onto every mount.
  - `playerHUDStore.jsx`: equipment scaled while fused.
  - `GameWorld3D.jsx`: aura runtime create/update/dispose, plus the absorbed-ride notice.
  - `progression/hub/MountSubTab.jsx`: renders the section.
  - `pages/GameView.jsx`: HUD chip.

**Cross-system / schema impact:**

- **Mount save:** each mount gains `gear: { bitting, saddle, barding, stirrups, reins, harness, core: { stage } }`
  (old saves start at Stage 0). The store gains `fusion: { mountId, until } | null` and the materials
  `absorption_pill_s` and `absorption_pill_600`.
- **Events:** a window event `axeMountFusionChanged`.

**Exact tests run and observed output:**

- `node --test tests/game3d/*.test.mjs`: 25 tests, 25 pass (12 progression, 6 weapon affinity, 7 mount fusion). The
  fusion test checks that the gear part of live derived damage becomes exactly ×1.25 at a 25% share, and returns
  when released.
- `npx vite build`: exit 0.
- Scoped eslint on the new files: 0 problems.
- **Isolated browser review** (real Mount tab, HUD chip and aura runtime on a stand-in figure):
  - The share showed 29% of 39% for a full-growth mount with two pieces at Stage 20.
  - Refining Chest Barding through the review spent 150 gold and moved it to Stage 1.
  - The timer counted down and survived a page reload.
  - The aura was checked for Flame and Ninja Clan; the oversized chest core was reduced after that review.

**Tests not run:**

- Live GameView (needs Base44 sign-in): the aura on the real avatar, its scale and the chip's position against the real HUD.
- Multiplayer: remote players don't see another player's aura; the aura and stats are local.
- Combat balance of a +39% gear multiplier.

**Bugs, risks, rollback:**

- **Balance:** +39% on all equipment stats is a large multiplier, by design. It stacks with Weapon Affinity.
- **Economy:** the starter pills and gold costs are provisional, and there are no reward sources for pills yet.
- **Visuals:** "armor plates opening" needs authored gear-model layers.
- **Rollback:** revert the commit. The extra save fields are ignored by the old code.

**PM HANDOFF:**

- **Next:** mount soul skill transformations (single → 2-hit spectral strike, 3-hit → 5-hit flurry, AoE → double AoE
  with an independent crit roll), which need the skill-execution pipeline. Also companion 20% + 20% stat transfer and
  pill reward sources (economy, owner-gated).
- **Owner decisions:** D2–D7 are unchanged.
