# Card detail workspace

The clicked-card experience is shared by Cards / Achievements, the Adam XE collection, and existing dashboard card inspectors. Collection browsing, the store overview, and game landing pages keep their existing layouts.

## Interface
- Overview: card artwork, rarity, live power, effective attributes, combat output, and collection provenance.
- Upgrade: separate disciplines for level/stat growth, socket infusions and over-enchantment, divine fusion, and ascension.
- Skill paths: server-defined prerequisite lanes and a maximum of three active perks.
- Exchange: reviewed fixed-price listings in the Trading Post or Buy Market (the existing Black Market), with cancellation for an owned active listing.
- Chronicle: confirmed progression events with dates, power changes, attempt outcomes, and consumed offerings.

## Data and progression
`cardProgression` remains the authority for ownership, PvP/trade locks, material balances, skill prerequisites, and saved changes. `base44/shared/cardWorkshop.ts` supplies upgrade terms to both mutations and the displayed quotes.

| Discipline | Current rules shown in the UI |
| --- | --- |
| Training | One skill catalyst; 50 + 10 × stage XP |
| Level | Required card XP; one stat point and one skill point |
| Stat point | One point adds +1 to the chosen attribute before growth |
| Material enhancement | Precision shards + combat cores, scaled by the attribute's enhancement tier |
| Infusion | Server recipe, permitted card type, material costs and socket capacity |
| Over-enchantment | Adaptive shards; server-calculated success chance; materials spent on either outcome |
| Divine stage | Compatible inventory entries or one wildcard; maximum stage V |
| Ascension | Current level cap reached, ascension cores; +10 maximum levels and two skill points; XP resets |
| Markets | Real UserCard ID, whole AGP price, equipment/starter/trade-lock restrictions |

Owned copies are addressed by UserCard IDs. Explicit unowned catalog definitions do not call progression or display made-up power. Achievement-only lookup is supported only by the existing legacy detail adapter, and still requires backend ownership.

Current backend fusion and sale semantics consume/transfer an entire inventory entry, including stacked copies. Review panels explicitly disclose this. Infusions currently cannot be removed. No currency, progression balance, or market payment rules were redesigned.

The hook prevents duplicate submissions, ignores stale responses after changing cards, refreshes real inventory state, subscribes to card/progression changes, and invalidates the collection cache after confirmed updates.

## Verification
- Production Vite build and scoped ESLint.
- UI tests run the real progression and market handlers against fixture inventory: training, level/stat growth, socketing, over-enchantment, fusion, ascension, skills, listing and cancellation.
- Additional checks cover unowned cards, stale load responses, repeat clicks, ownership/security, catalog reconciliation, and dashboard library integration.
- Responsive styles use the available inspector width, with a stacked layout on narrow screens and reduced-motion support.
- Live visual review in the authenticated app has not been performed in this session.
