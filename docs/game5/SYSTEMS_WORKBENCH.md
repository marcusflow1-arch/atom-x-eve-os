# Game 5: systems workbench

This branch adds a usable, isolated Game 5 equipment/cultivation interface and shared progression/combat rules. It is **not a deployed MMO backend**, a new character model, or a replacement for the existing quest scene. The entry point is **Game 5 → Character systems**, behind the existing administrator gate.

## Implemented

- Sumi-e-inspired charcoal, jade and muted-gold interface; desktop and narrow-screen layouts. The earlier concept board is retained at [`system-template.png`](../../public/game5/ui/concepts/system-template.png). The implemented armory follows its equipment / inventory / item-detail hierarchy. The interface uses existing Lucide icons, not generated character or environment assets.
- Rare, Elite and Chosen equipment, inventory search/filter, three ready weapon slots, equip/unequip, locks, salvage confirmation, enchantment, overcharge, refinement and sockets.
- Separate four-slot **player and mount vanity** inventories. Silver augments roll attack speed or critical chance; gold rerolls replace a slot with attack or skill damage. Three augments per item. Equipped/locked items cannot be salvaged.
- Seven mount equipment slots; 25% starting stat share without mount-level grinding, up to 39% with seven maxed pieces. Sharing activates with 60/600-minute absorption pills. Feed stores XP for spiritual-weapon advancement.
- Offensive spiritual weapons add armor-bypassing damage. Utility weapons trade that for agility/critical chance. Movement multiplier is computed but **not applied to the existing world controller yet**.
- Head halos, wing halos, attribute allocation, titles, companion selection/hatching, silver supplies and material counts.
- Shared five-archetype combat rules with three skills each, cooldowns/energy costs, defense/hit/critical calculation, guard/parry, bounded PvE challenges, recovery, enemy retaliation and rewards. The combat panel tests rules; it does not render a new world or animate characters.
- Local sandbox save/reload/reset, explicitly simulated funds, and a separate HTTP transport. Failed connected requests never fall back to a sandbox account.
- Transactional SQLite storage, authenticated-identity boundary, exact-origin writes, body/rate limits, revision/sequence checks and idempotent commands. No client-supplied player ID, wallet, stats, position or reward data is accepted.
- Service composition shares the existing Game 5 movement authority across movement and systems routes. Combat requires fresh server-owned position and injected visibility checks. A disconnected/stale movement session cannot attack.

## Progression decisions

All current values are in `src/game5/systems/rules.mjs`. They are development balance, not tested competitive balance.

| System                                      | Current rule                                                         | Status                                                                                                              |
| ------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Enchant ceilings                            | Standard 120%, basic overcharge 150%, mythical 200%                  | Latest clear requested percentages                                                                                  |
| Overcharge unlock                           | Reach current ceiling, pay configured silver/CP, unlock next ceiling | Provisional cost tuning; unlock does not grant enchantment                                                          |
| Enchant stat formula                        | `(base + refinement) × rarity × (1 + enchant / 100)`                 | Preserves existing formula; 200% means **+200% / 3×**, not 2× total output. Final interpretation remains unresolved |
| Refinement cap                              | 20                                                                   | Existing rule preserved; dictated 12/25/25 stages require clarification before replacing it                         |
| Character maximum                           | 200                                                                  | Existing rule preserved; dictated 120 was not clearly assigned to character level                                   |
| Head / wing halo caps                       | 96 / 20                                                              | Existing rules retained; not interpreted from ambiguous 120/450 wording                                             |
| Mount level                                 | Legacy field preserved, no longer drives sharing or consumes feed XP | Direct sharing replaces the 1–50 grind                                                                              |
| Spiritual weapon ranks                      | 20; next rank costs `(rank + 1) × 500` stored mount XP               | Configurable provisional rule                                                                                       |
| Enchant protection                          | Mandatory from 90%; celestial from 160%                              | Corrected to match written specification                                                                            |
| Vanity silver rolls                         | 1–3% attack speed or crit                                            | Implemented as ratios, not flat attack/defense/HP                                                                   |
| Vanity gold rolls                           | 4–8% attack or 5–10% skill damage                                    | Replaces one existing augment                                                                                       |
| Combined stages / two-sided spiritual wings | Not invented from unclear dictation                                  | Future rules/assets required                                                                                        |

The v1 → v2 migration preserves existing inventory, currency, ranks and old augments. Existing gear above 120/150% is assigned an appropriate tier rather than downgraded. Existing flat augments remain flat; new rolls use the new percentage pools.

## Backend integration

`src/game5/systems/service.mjs` exposes `createGame5SystemsService`:

```js
const service = createGame5SystemsService({
  filename: "/durable-volume/game5.sqlite",
  authenticate: verifiedAccountAuthenticator,
  allowedOrigins: ["https://YOUR-APP-ORIGIN"],
  lineOfSight: authoritativeWorldVisibility,
});
// Same-origin gateway forwards Request objects to service.handle(request).
// Instantiate once per process. Call service.close() on shutdown.
```

The authenticator must verify the real account/session and return `{ authenticated: true, playerId: 'base44:<verified-id>' }`. The browser cannot choose that identity. The connected client accepts a host-provided header callback if bearer tokens are needed; it does not look for arbitrary tokens or change login state.

- Routes: `GET/POST /api/game5/systems` and the existing `/api/game5/movement/{connect,input,disconnect}`.
- POST envelope: `{ id, sequence, expectedRevision, command }`. Retry an uncertain request with the identical envelope; do not invent another request ID. Receipts are retained for the last 128 commands; old sequence numbers remain rejected after receipt eviction.
- SQLite is durable when the host volume is durable. This is single-process deployment preparation; the existing movement authority is an in-memory Map. Multiple replicas require shared authoritative session state and a shared transactional datastore.
- The actual authenticated same-origin gateway, durable hosting, real world line-of-sight binding, account login flow and live transport are **not deployed or verified by this change**. No Base44 builder was invoked.
- The isolated UI does not start a real movement session. Connected combat requires the existing game client to maintain its movement input stream. There is no fabricated position fallback.
- Only the sandbox gets development currency, advanced gear and a completed vow. New authenticated accounts start with the ordinary starter state.

## Verification performed

- `node --test tests/game5/**/*.test.mjs`: 99 passing tests (76 existing, 23 systems tests).
- Scoped ESLint (`tools/game5/systems-eslint.config.mjs`) passed for the systems modules, client and Game 5 entry point.
- `npx vite build`: successful production build. Build is compile-only: `VITE_BASE44_APP_ID` and the live proxy URL were not configured in this review environment. Existing stale Browserslist/baseline-data and ambiguous Tailwind-duration warnings remain.
- `tools/game5/systems-browser-check.mjs`: Chromium desktop 1600px and mobile 390px workflow. Verified feed, absorption, spiritual mode/rank, both vanity owners, augments, attribute allocation, modal cancellation, overcharge/enchant, combat, reload persistence, mobile overflow and zero page exceptions.
- The browser harness also submitted a real HTTP command to the local systems API and verified the resulting SQLite row. **Its account authenticator is an explicit local test fixture, not evidence of live Base44 authentication.**
- Service integration test confirms the existing movement authority supplies combat positions and a disconnected session cannot attack.
- Review captures: [mount desktop](review/systems-mount-desktop.png), [armory desktop](review/systems-armory-desktop.png), [mount mobile](review/systems-mount-mobile.png).

Local UI review:

```sh
node tools/game5/systems-preview.mjs
# Open http://127.0.0.1:4175 — sandbox only, no deployed auth bypass.
```

Browser regression script requires an installed Playwright module and Chromium. `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` can point to the review environment's copies; they are not application runtime dependencies.

## Remaining work, explicitly not claimed complete

- Deploy and validate the real authentication/gateway/storage integration and real-world combat presentation.
- Competitive balancing, final progression caps and final interpretation of 200% output.
- Bind movement utility, final mount skill variants, spiritual-wing effects, supplied assets and their visual attachment layers.
- Player-to-player duel/trade/market execution, faction-wide towers, social services and assistant behavior are not delivered here. Core state fields do not constitute a live multiplayer system.
- Full production-account end-to-end QA and broader application visual QA. Existing Game 5 tests and the application build passed; no claim is made about live Game 2/PvP queues or unrelated pages.
