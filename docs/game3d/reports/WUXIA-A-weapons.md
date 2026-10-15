# Worker report: Wuxia slice A, weapon archetypes, Weapon Affinity, quick-switch

**Task / status / specialist:** Wuxia blueprint (owner's v3, §1 state container, §3 weapons) for the Game 3D hero world;
TASK-000 gap map plus slice A. Implemented; awaiting PM and QA review and owner approval. Claude (implementation).

**Exactly what changed and why:**

- **Five weapon archetypes** (single-hit burst, multi-hit combo, ranged, close-combat, defensive):
  - Added as a second dimension next to the existing three AXE roles (offensive / defensive / ranged). Roles keep
    driving PvP range, mastery paths and the native class passives, so no existing balance moves.
  - Dual blades stay *defensive* for those systems but are *multi-hit* for archetype purposes (blueprint §3.1).
  - Classification is by an explicit `item.archetype`, else name tokens (heavy and twin weapons first), else the mastery family.
- **Weapon Affinity:**
  - **Passives:** the blueprint's table, while a weapon of that archetype is in hand. Close-combat and single-hit get
    +20% damage, defensive +50% total defense, ranged +15% dodge rate and +15% movement speed, and multi-hit +10%
    critical dodge (the "Critical Strike Focus" row).
  - **Specialty:** the one archetype you specialize in gets 2×.
  - **Wiring:** applied as the final derived-stat stage in `playerHUDStore` (the blueprint's "state container" is this
    existing aggregator), plus movement in `getWeaponMoveSpeedMult`.
  - **Stacking:** it stacks with the native class passives and is provisional balance.
- **Quick-switch:**
  - **Hotkeys:** two quick slots drawn with Shift+1 / Shift+2, instantly, even during the global cooldown. Pressing
    the key of the weapon in hand returns to the previous one. Plain 1–0 stay the ability bar (they read
    `event.key`).
  - **Equipping:** it goes through the existing equip path, so `AXEWeaponIdentityMount` re-syncs mastery, role and the
    skill bar as for a manual equip. It never adds a third equipped weapon (every equipped item adds its stats): a
    slot weapon that isn't equipped takes the place of the inactive equipped one, never the one in hand.
  - **Notice:** an ink-style toast (sumi-e direction).
- **Character Hub:** Weapon Mastery gains an "Affinity & Quick-Switch" view for choosing the specialty and assigning the slots.

**Actual inspected files; changed paths:**

- **Inspected:**
  - `playerHUDStore.jsx`, `statsSystem.jsx`, `weaponClassBuffStore.jsx`, `weaponClassCombatHelpers.jsx`
  - `axe/weapons/*`, `axe/factions/AXEFactionWeaponConfig.js`
  - `axe/equipment/AXEEquipmentInventoryStore.js`, `axe/equipment/AXEEquipmentSystem.js`, `axe/equipment/AXEEquipmentRuntimeStats.js`
  - `progression/hub/WeaponMasteryTab.jsx`, `skills/AbilitySystem.jsx`, `pages/GameView.jsx`
  - `tests/game3d/progression-integration.test.mjs`
- **New:**
  - `src/components/game3d/axe/weapons/AXEWeaponArchetypes.js`
  - `src/components/game3d/axe/weapons/AXEWeaponAffinityStore.js`
  - `src/components/game3d/axe/weapons/AXEWeaponQuickSwitchMount.jsx`
  - `src/components/game3d/progression/hub/WeaponAffinityPanel.jsx`
  - `tests/game3d/weapon-affinity.test.mjs`
  - `docs/game3d/WUXIA_BLUEPRINT_GAP_MAP.md`
  - this report
- **Changed:**
  - `src/components/game3d/playerHUDStore.jsx`: affinity provider, final stage, subscription.
  - `src/components/game3d/weaponClassCombatHelpers.jsx`: movement multiplier.
  - `src/components/game3d/progression/hub/WeaponMasteryTab.jsx`: third top view.
  - `src/pages/GameView.jsx`: mounts the hotkeys.

**Commit SHA / PR URL / report location:** branch `game3d/wuxia-blueprint`; this file. No PR is opened (the owner opens PRs).

**Cross-system interface or schema impact:**

- **Storage:** a new character-scoped key `axe_weapon_affinity_v1` holding `{ specialized, quickSlots[2], previousInstanceId }`. No existing save is read differently or migrated.
- **Derived stats:** `weaponAffinity` (`{ archetype, doubled, scale }`) and `critChanceReductionPct` (the defender field `AXECombatMath` already reads).

**Exact tests run and observed output:**

- `node --test tests/game3d/*.test.mjs`: 18 tests, 18 pass, 0 fail (12 existing progression integration plus 6 new).
- `npx vite build`: exit 0.
- Scoped `npx eslint` on the new files: 0 problems.
- **Isolated browser review** (scratch harness on the real panel, mount and stores, Tailwind from `src/index.css`):
  - The five cards render, and "In hand" marks the held weapon's archetype.
  - Specializing Close-Combat raised derived damage from 73.20 to 85.40 (exactly 1.4 / 1.2).
  - Shift+1 drew the bow, with the sword staying equipped.
  - Shift+2 drew the greatsword, with the bow that was in hand staying equipped.
  - The notice read "2 · Heavy Greatsword · Single-Hit Burst".

**Tests not run and why:**

- The live GameView route was not run: it needs Base44 authentication and a real character.
- Multiplayer and PvP: the quick-switch changes local equipment only, so remote players see weapon changes only through existing sync.
- Combat feel of the doubled passives, and visual QA inside the 3D HUD (notice position against the hotbar).

**Bugs, risks, rollback:**

- **Power creep:** affinity stacks on the native class passives, so a specialized close-combat fighter gets +40% damage on top of Brutal Force (up to +35%). All values live in `AXE_WEAPON_ARCHETYPES` for tuning.
- **No defensive items yet:** no shield weapon exists in the item data, so that archetype has no items until some are added.
- **Rollback:** revert the slice commit. The new storage key is simply ignored afterwards.

**PM HANDOFF:**

- **Integration order:** slice A is independent.
- **Next slices:** mount soul fusion (7 slots, combination share, absorption, soul skill transformations), then Taurus Chosen Ascension (the Balanced nature reuses the 0 s quick-switch), then the v1 cap migrations (D1 answered: 200% / Stage 20, which needs a save backup and rollback plan).
- **Owner decisions still open:** D2–D7 in the gap map.
- **QA:** an independent review of the commit is needed.
