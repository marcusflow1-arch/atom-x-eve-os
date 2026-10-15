# Game 3D collaboration handoff

Updated 2026-10-15. Working target: `src/pages/GameView.jsx` and its existing `src/components/game3d` runtime.

## Repository baseline and coordination

This continuation starts from main `362e24ca843f602503e00b3a5465f6e2bdd6a70a`.

- PR #78 (earlier Game5 systems workbench) and PR #82 (GameView progression integration) are merged. Do not reapply those commits or replace the current AXE runtime with the Game5 simulator.
- Claude's co-authored Game 2 dual-saber/staff change `4f8746cb3cf0e8c8fa0bd57bda3e9c45d1165724` is present via merged PR #85. The newer Game 2 tutorial PR #84 is also present. This branch does not edit Game 2, its animation banks, or its tutorial.
- The supplied `Pasted markdown(2).md` is the October 11 AI Battle genre-menu/Arena Shift design. It specifies compatible queues and honest preview availability. It is context for future integration, not evidence that the listed simulations or authenticated networking are now live. No queue, AI Battle rules, or live service is changed here.
- Coordination is through this committed handoff and the PR. No direct Claude session notification or agent-to-agent connection has been established by this work.

## This continuation: persistence failures

Mount and vanity mutation methods previously updated state, swallowed localStorage errors, notified the HUD, and returned success. A full/blocked browser store could therefore display an upgrade that vanished on reload.

Changes:

1. Add opt-in `characterScopedStorage(...).setChecked(value)`. Existing `set()` callers retain their prior behavior; this is not an unreviewed repository-wide persistence migration.
2. Mount and vanity stores retain a checkpoint for the active user/character. Persistent mutations must save successfully before publishing. Failed writes restore the checkpoint and return `SAVE_FAILED`, without spending XP, cards, materials, adding audit events, changing stats, or notifying appearance/HUD subscribers.
3. Reset the checkpoint on character/account change; a failed save cannot restore a different character's state.
4. Commit persistent mount selection before applying companion-selection side effects. Riding/dismounting remains transient and never requires a successful disk write. Failed riding XP writes retain earned activity for a subsequent retry.
5. Return detached grant/crafting/ability results so callers cannot mutate committed state through a returned object. Avoid deep-cloning the mount in the per-frame speed getter.
6. Mount and Vanity panels display the save error and allow retry. Hide/show vanity now also returns and displays a result.

Changed production surfaces are limited to `characterStorage.jsx`, `AXEMountStore.js`, `AXEVanityStore.js`, `MountSubTab.jsx`, and `VanitySubTab.jsx`. Coordinate before concurrently editing these files.

## Verification / reproduction

- `node --test tests/game3d/progression-integration.test.mjs`: 19 tests pass. Includes simulated QuotaExceededError, rollback/retry, no false subscriber updates, unchanged HUD stats, unchanged legendary abilities/currency, character-switch checkpoint isolation, normal progression, and transient mount controls.
- Targeted ESLint on the five changed production files passes.
- `npm run build` passes; local Base44 app/proxy env is absent. This is a compile check, not a live account test.
- Browser runner: `tools/game3d/review-progression.mjs`; supports `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`, and optional `REVIEW_OUTPUT_DIR`. Uses real panels/stores with a seeded test character and a stubbed external Base44 boundary. Includes injected save failure → error feedback → unchanged rank/cards → restored storage → successful retry, in addition to previous desktop/mobile checks.
- To reproduce manually in a disposable test profile: open GameView → C → Services → Mounts/Vanity. Simulate blocked storage for the store under test, confirm an upgrade and verify the visible failure with unchanged resources. Restore storage, repeat, reload, and verify only the successful purchase persists. Do not inject failure into a real player's browser profile.

## Concrete next tasks for Claude / the next coding session

### A. Mount vanity bindings (coding first; no fabricated assets)

The current companion catalog in `companionData.jsx` has saddle/armor/charm metadata, but those entries do not supply model/texture attachment bindings. The player vanity catalog has appearance IDs; this does not by itself prove that the runtime attaches an asset. Before adding a second inventory UI:

- Verify the actual equipped-item source and renderer hook for both player and mount. Reuse `AXEEquipmentInventoryStore` ownership and the real mounted companion instance.
- Define a versioned appearance manifest mapping an owned item to a compatible model/attachment point/material binding. Only register supplied assets. Keep original skeletal transforms and animations intact.
- Implement deterministic equip/unequip/restore, clean up loaded resources, and reject incompatible slots or unowned items. Clearly show unavailable asset bindings instead of a successful visual-equipment claim.
- Decide the mount vanity slot/stat contract from the owner's specification; do not silently substitute Game5's wrap/wing-skin/trail/heraldry slots for AXE's player head/torso/pelvis/leggings mapping.
- Verify switching characters, reloading, hiding cosmetics, mounting/dismounting and bonus recomputation with the actual assets once supplied.

### B. Authoritative progression transactions

`AXEServiceTransactionGateway` can call `window.__axeAuthoritativeServiceRequest` when present, but local progression panels call local stores. This PR does not turn local storage into a multiplayer authority.

- Establish the actual authenticated backend integration; validate identity/ownership on the server.
- Route progression requests through one versioned action contract. Use idempotency keys and expected state revisions; commit cost and result atomically in the authoritative store.
- Return committed state/revision, reconcile locally, and expose network/save failures without false success. Test lost responses, retries, stale revisions, concurrent spending and unauthorized access.
- Keep Game3D rules separate from the dashboard AI Battle adapter. The attached design explicitly rejects treating racing/PvE/world events as renamed avatar duels.

### C. Existing companion-save boundary

`companionStore.jsx` still uses a global local-storage key and a user-level `companion_state` field, unlike the scoped AXE stores. Its delayed cloud hydration/write can race character changes. Investigate this before mount vanity depends on that persistence. A migration needs an explicit legacy-owner policy, per-character server schema and server-side concurrency handling; do not claim it is fixed by the scoped mount checkpoint alone.

## Limits

Local single-document save handling is covered. Multi-tab conflicts, authoritative remote transactions, cloud failures, actual live GameView riding/combat, full asset attachments and deployment are not verified here. Halo and other progression stores still use their existing save paths and need separate reviewed migration. Balance values, models, maps, input bindings and animations are unchanged in this continuation.
