# Game 3D weapon-switch integration

Verified 2026-10-16 against main `b3ef8e8c7fbd6769eab9b35eb8f5f39f61b9246b` (merged #89), including Claude's updated stat budget, mount fusion, ascension and social changes. Runtime target is `src/pages/GameView.jsx` and its existing AXE stores. This is a correction to the current game, not a replacement scene or a Game5 migration.

## Reproduced problem

Before this patch, quick-switch unequipped the inactive weapon, then tried to equip the target, then made it active. Each step emitted a separate equipment snapshot. The HUD rewards increases in maximum HP, so removing and restoring equal-HP gear could heal a wounded player even though the final maximum HP was unchanged.

On the pre-fix `50fc8be7` baseline, the new regression checks observed:

| Action | Expected | Observed before fix |
| --- | --- | --- |
| Draw an unequipped bow with the same HP bonus as the inactive bow | HP stays at 25 | HP rose to 125 |
| Attempt that draw with insufficient level | No equipment or HP change | Rejected draw still raised HP to 125 |
| Block the inventory storage write | Failed result and unchanged loadout | Successful result and changed runtime equipment |

The hotkey mount also omitted the actual character level, causing the equipment validator to default to level 1 for higher-level characters. Preference writes for specialty and quick slots silently ignored storage errors.

## Change contract

1. `switchAXEInventoryWeapon(instanceId, context)` validates ownership/category and the existing equip rules, builds the final equipped set, and commits it with a checked write. The current weapon remains equipped and only the inactive weapon is replaced. A successful draw publishes one complete inventory snapshot. A rejected draw publishes none.
2. Active weapon and return history live in the same scoped inventory document. There is no second history write that can fail after the equipment changes. Existing saves without this history field can still read the old affinity-store history until their first successful draw. An explicit new null history overrides the legacy value.
3. Both quick-slot draws and the older cycle helper use that transaction. Return-history/slot success results are detached from the stored objects.
4. The mounted Shift+1/2 handler supplies the live HUD level. It shows a specific failure for level restrictions or blocked storage. Existing key bindings remain intact.
5. Specialty and quick-slot preferences save before publishing. Failed saves preserve the previous selection and affinity bonuses. The existing panel displays an accessible status message; switching character clears that message.
6. The real weapon-identity binding still drives mastery and role. Its subscription already supplies the initial state, so the duplicate initialization call is removed. A failed draw cannot reset that identity or the legacy hotbar through a temporary unequip.

No balance values, currency, model, animation, map, camera/mouse logic or PvP queue were changed by this patch. PR #89's edits are incorporated without rewriting them.

## Verification performed

```sh
node --test tests/game3d/*.test.mjs tests/duel-system-backend.test.mjs tests/world-chat-backend.test.mjs
```

**102 pass, 0 fail.** This includes the existing companion, mount/vanity, fusion, ascension, stat-budget/routing and social tests plus 14 weapon-affinity tests. Eight weapon tests were added here. They exercise real stores and the identity binding; only the external Base44 service boundary is stubbed.

```sh
npx eslint src/components/game3d/axe/equipment/AXEEquipmentInventoryStore.js \
  src/components/game3d/axe/weapons/AXEWeaponAffinityStore.js \
  src/components/game3d/axe/weapons/AXEWeaponIdentityMount.jsx \
  src/components/game3d/axe/weapons/AXEWeaponQuickSwitch.js \
  src/components/game3d/axe/weapons/AXEWeaponQuickSwitchMount.jsx \
  src/components/game3d/progression/hub/WeaponAffinityPanel.jsx
npm run build
git diff --check
```

All exit successfully. The build emitted the existing missing local Base44 app/proxy environment warning and browser-data/Tailwind warnings. It produced `dist`; it does not establish working live API calls.

`tools/game3d/review-weapon-switching.mjs` bundles the production panel, hotkey mount, identity component and stores into an isolated Chromium harness. It passed:

- Actual Shift+1 and Shift+2 draws/returns, using a level-12 character and level-12 weapon; level 11 is rejected.
- Equal-HP weapon replacement without transient healing; correct equipped count, mastery and combat role.
- Restoration of the existing legacy weapon-path hotbar on return.
- No draws while typing, while focusing a select, or from repeating keydown events.
- Injected quota failure: visible error with unchanged loadout, HP and derived stats; successful retry after restoring storage.
- Reload preserves active weapon and return history.
- Specialty and slot failures leave selections unchanged, then retry and reload persist the successful selections.
- Desktop and 390px mobile panel width; no browser page errors. Screenshots were inspected for the desktop panel.

Run with Playwright installed, or specify `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH`. `REVIEW_OUTPUT_DIR` optionally retains screenshots. It uses disposable local data and does not connect a live account or modify production.

## Live review steps

Use a disposable test character in GameView → Character Hub → Weapon Mastery → Affinity. Assign owned weapons to both quick slots. Draw and return with Shift+1/2; confirm the held weapon, mastery/role, HUD bonuses and saved choices. Compare damage/skill behavior with the actual world loaded, then reload and switch characters. Exercise legitimate level restrictions. Do not inject storage failures into a real player's profile.

## Limits and next integration checks

- This is a checked local inventory transaction, not server-authoritative ownership, a cloud save, or multi-tab conflict resolution. Other inventory mutation APIs still use their existing persistence behavior.
- The patch removes **transient** healing from an unchanged final HP bonus. The general HUD policy that grants health for a real max-HP increase is unchanged. Deliberately changing to higher-HP equipment or manual unequip/re-equip needs a separate combat-policy review.
- Successful weapon-path changes still use the existing legacy cooldown behavior. The newer `skills/loadoutStore` and world skill executor are separate paths; all live skill/cooldown combinations have not been verified. Do not claim that this fixes cooldown exploits globally.
- Shared keyboard routing needs a follow-up: GameWorld interprets numeric `event.key`, while quick-switch uses `event.code`. On layouts where Shift+Digit1/2 produces a numeric key, the world may also queue a skill. The isolated hotkey test does not mount GameWorld and does not verify that collision.
- Signed-in live GameView, supplied asset loading, actual combat/animation/camera behavior, party voice, multiplayer authority, cloud policies and deployment remain unverified by this patch. Existing backend tests use service-boundary doubles.
- Owner review, merge and deployment remain separate per `CLAUDE.md`. The committed handoff and PR are the collaboration record; no direct notification to Claude is claimed.
