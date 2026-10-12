# Luna Skill Book reference redesign

The dashboard Cards / Skill Book action now opens a silver-framed Skill Book and an independently movable Skill Prefab window, based on `image(20261012-153504).png`. Other dashboard windows retain their existing chrome.

## Layout and behavior

- Dark translucent glass, silver/cyan vector corner ornaments, centered gems, serif headings and glowing selected states.
- Alphabetical game rail, selected-game banner, learned progress, Games/Cards views, genre and rarity filtering, text and voice search.
- Learned and unlearned cards come from the existing `skillBookLoadout` catalog. Displayed covers, skill artwork, descriptions, rarity and damage come from that response, not the reference's fictional games.
- Click or right-click a learned card, then choose a hotkey; alternatively drag it to a slot. The minus button unequips. All changes use the existing server mutations and shared saving guard.
- Ten existing bindings (1–0) and four saved prefabs remain intact. The ten slots use two rows. Selected Skill and Avatar Progress occupy the reference's passive/ultimate areas because the current loadout contract does not expose separate passive/ultimate slots. No unsupported slots or extra loadouts are advertised.
- The same HUD instance moves into the prefab window and back to the dashboard. Pending requests can finish while the book closes. Editing does not cast abilities.
- Both windows support the existing drag, keyboard movement, resize, minimize, maximize and account-scoped session geometry. Desktop defaults are side by side; smaller displays use overlapping movable windows and a persistent “Skill Prefab” reopening control. There is no page-wide backdrop.

## Verification — 2026-10-12

Passed:

- ESLint for all changed components and geometry helpers.
- `node tests/skill-book-eligibility-ui.test.mjs`: actual components, shared React Query hook and HUD store against a controlled service fixture; learned/unlearned filtering, incompatible-card blocking, text/voice search, real drag payloads, duplicate-save guard, slot replacement, saved set switching, unequip, failed-save preservation, refresh restoration, cancellation, closing during a save, and combat-key suppression while editing.
- `node tests/skill-book-avatar-refresh.test.mjs`: avatar-specific eligibility and hotbar refresh.
- `node tests/skill-book-layout.test.mjs`: existing dashboard HUD placement and new paired-window bounds.
- `node tests/dashboard-floating-windows.test.mjs` and `node tests/dashboard-quick-windows.test.mjs`: shared window interactions and other dashboard actions.
- `npx vite build`: production compilation. Local environment does not contain the production Base44 app ID; this is a compile check, not a deployment.
- Chromium rendering and interaction checks at 1672, 1280, 900 and 390px widths: no horizontal overflow, pointer drag/drop, right-click selection and slot placement, unequip, loadout switching, independent window movement, close/reopen, search and narrow-screen placement. Screenshots were visually inspected using a clearly labeled local data fixture. The actual user's account and production API were not accessed.

Production deployment, signed-in account data and live persistence still require a live-app check. No Base44 editor/build-credit workflow was used; backend contracts, combat rules and assets were not changed.
