# AI Battle: genre menu and Arena Shift design
Date: 2026-10-11
Scope: Luna dashboard → bottom-right AI Battle window.

## Product direction
A persistent avatar earns an identity through the games its player enjoys. Achievements unlock cards; equipped cards express that identity in challenges. The menu should answer four questions: Who am I playing against? What kind of play is this? What can my avatar bring? What happens when I queue?

The primary flow is Mode → Genre → Read styles/loadout → Queue. PvP is competition; PvE is short AI encounters; World Events is cooperative boss participation. They must not be interchangeable names for the same two-player duel.

“Genre” is a useful browsing label but not always a simulation contract. Fighting and racing describe mechanics; sci-fi and fantasy describe settings. The catalog therefore carries a family description as well as its label. A sci-fi arena can combine compatible action mechanics. A racing queue must never silently select an avatar duel. Different sports and real-time/turn-based strategy need explicit compatible rules before they can be combined.

## Research and application
The following are primary developer/publisher sources. The Arena Shift system below is an Atom XE proposal, not a feature claimed to exist in these references.

1. **Capcom: Street Fighter 6 World Tour, Battle Hub and Extreme Battle.**
   World Tour links avatar progression to learned fighting styles; Battle Hub carries the avatar into a social battle space. Extreme Battle separately names its win-condition rule and its arena gimmick. Application: keep the avatar and card loadout persistent; make the objective and style modifiers legible before queueing. Do not present a rules change as only a cosmetic environment change.
   https://news.capcomusa.com/2022/09/15/details-on-street-fighter-6s-world-tour-battle-hub-four-world-warriors-and-a-closed-beta/

2. **Bandai Namco: Sparking! ZERO beginner guide.**
   Its guide explicitly distinguishes health, attack/movement energy, transformation resources, and grounded/airborne controls. Application: moving from a side-on duel to an aerial arena changes controls and resource interpretation, not merely the camera. Atom XE needs an input/action adapter and server-approved state conversion. This reference does not establish that 2D/3D switching is already implemented.
   https://en.bandainamcoent.eu/dragon-ball/news/dragon-ball-sparking-zero-the-beginners-guide

3. **ArenaNet: Designing World Bosses in Janthir Wilds.**
   The designers describe cooperative mechanics with readable counterplay, including coordinated positioning and breaking armor. Application: World Events should communicate the shared objective and participation conditions. A boss should have cooperative mechanics, not simply inflated HP or another player’s avatar substituted for an AI.
   https://www.guildwars2.com/en/news/designing-world-bosses-in-guild-wars-2-janthir-wilds/

4. **ArenaNet: PvP Reward Tracks and Gear Unification.**
   Appearance and equipment identity can carry between modes while PvP stat configuration is treated separately for equalized competition. Application: preserve earned collection identity; evaluate competitive power bands or an explicitly labeled normalized ranked ruleset. This UI change does not normalize anyone’s stats or remove progression.
   https://www.guildwars2.com/en-gb/news/pvp-reward-tracks-and-gear-unification/

5. **AWS: GameLift FlexMatch overview.**
   The documentation treats latency, compatible skill, party structure, acceptance, expanding constraints and backfill as separate matching concerns. Application: one compatible genre/ruleset pool, with three internal styles, avoids creating three needless subqueues. Never relax genre or ruleset compatibility just to shorten a wait. This is an architectural recommendation; no AWS service is added.
   https://docs.aws.amazon.com/gameliftservers/latest/flexmatchguide/match-intro.html

6. **Microsoft Xbox Accessibility Guideline 117.**
   Motion settings, camera control and reducing distracting animation matter for readable interfaces. Application: no autoplay carousel or flashing arena preview; native buttons and visible focus states; reduced-motion support. A future Arena Shift should offer a minimal-motion camera transition while preserving the same authoritative gameplay timing.
   https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/117

## Menu delivered
- Slate/navy translucent surfaces, cyan highlights and restrained borders matching Luna.
- Existing independently movable/minimizable/resizable dashboard window; larger initial size, responsive layout for previously saved smaller windows.
- Three mode buttons: PvP, PvE and World Events.
- Current Avatar Duel pinned above a searchable genre collection.
- Nine genre collections, each with three proposed creative references/styles.
- Clickable style descriptions and a schematic view. These are previews, not game screenshots or generated character models.
- “Arena Shift” explanation, stable objective text and expandable reference/rules details.
- Achievement → card → playstyle explanation.
- Ten equipped-card slots from the existing dashboard store, active preset label and working Skill Book shortcut. These mirror dashboard state, not a claim that every card is eligible for every proposed genre.
- Persistent queue footer; unknown activity counts display a dash instead of fabricated zeroes.
- Search, exploration and opening the window never enter a queue.

## Initial reference collections
These are creative starting points for original Atom XE mechanics, not imported assets or newly integrated games.

| Collection | Three references | Proposed styles |
|---|---|---|
| Fighting | Street Fighter; Tekken; Dragon Ball Z: Budokai Tenkaichi 3 | Side-on duel; ground arena; aerial clash |
| Racing | Need for Speed; Forza Horizon; Mario Kart | Street sprint; precision course; ability race |
| Sci-fi | Star Wars: Jedi Outcast; Mass Effect; Halo | Energy duel; tactical powers; weapon arena |
| Fantasy | Breath of the Wild; Elden Ring; Monster Hunter | Wild terrain; measured duel; creature hunt |
| Shooter | Quake; Overwatch; Apex Legends | Arena pressure; ability front; mobile skirmish |
| RPG | Final Fantasy X; Clair Obscur: Expedition 33; Persona 5 | Command duel; reactive defense; party sequence |
| Strategy | StarCraft; Age of Empires; Fire Emblem | Unit command; territory siege; formation clash |
| Sports | EA Sports FC; NBA 2K; Rocket League | Field play; court play; boost arena |
| Platform | Super Mario; Sonic; Fall Guys | Precision route; momentum run; obstacle course |

The collection is extensible, not an exhaustive taxonomy of every game. Sports styles are not automatically compatible; a shared scoring contract must be designed first. Similarly, changing from real-time to turn-based action cannot happen without explicit scheduling rules. Implement Fighting first to prove the concept, then Racing, rather than pretending all families share one controller.

## Arena Shift: proposed gameplay contract
Use one match identity, one objective and one authoritative state across three styles. The match combines their approved mechanics/assets in an original environment; the ability changes the active movement/camera/action rules. It does not load an unrelated game or reset the fight.

1. The server validates card ownership, compatible genre, phase, shift resource and cooldown. A client only requests a shift.
2. The server announces the target style and a synchronized transition time. Both players receive warning and updated control hints. Competing shift requests resolve deterministically.
3. Both clients acknowledge the required environment and controller resources. If either cannot load them, stay in the current style; refund the unused shift cost once. Never award an attacker a free opening because an opponent is still loading.
4. At the confirmed transition boundary, convert positions into safe valid positions. Preserve HP, status effects, cooldown deadlines, spent resources, remaining time and score. Do not heal, clear a stun or duplicate a projectile through a shift.
5. Resume with the same action meanings (move, defend, primary, ability, evade). Movement interpretation may change from plane to free arena, but both players receive the same rule change. Validate collision and camera framing.
6. Reconnect and late join snapshots contain the active style, ruleset version, shift state and authoritative deadlines. Old or repeated requests cannot apply the transition twice.

Balance values remain to be playtested: charge earned through meaningful play, a per-match/round limit, a minimum dwell time, counterplay and a transition lock during resolution. Do not invent final numerical tuning from menu research alone. Adapt cards through explicit compatible effects; do not automatically turn all sword damage into racing speed.

## Networking and progression boundaries
Keep account identity, owned cards, matchmaking authorization and progression in Base44. An authenticated real-time match authority can run on Railway. Each game supplies its own movement/combat adapter; presentation and prediction remain client-side.

Future queue tickets need mode, mechanical family, genre collection, ruleset version, region/latency, party and authoritative loadout version. Match acceptance must freeze the compatible ruleset for every participant. Style choice is internal to that match, not an extra queue.

Use authoritative achievement verification and reward finalization; repeated completion messages must not mint cards or rewards twice. PvE needs genuine AI simulation. World Events need capacity, schedule, join-in-progress state, contribution rules and reward eligibility. They must not fabricate live events, player counts, loot probabilities or wait estimates.

## Current implementation boundary
The inspected backend currently accepts pvp, pve and world_boss labels but pairs two players into the same ARENA. It has no genre matching field, and AIBattleHost renders PvPArenaStage for the resulting match. Therefore:
- New joins from this menu are enabled only for PvP → Avatar Duel.
- Genre collections, Arena Shift, PvE and World Events are explicitly previews until their gameplay exists.
- Already active/reserved legacy modes remain visible and cancellable.
- The backend queue protocol, pairing, damage calculations, mission scripts and real-time transport were not changed.
- The shared host still owns polling and connection acknowledgment; opening this window adds no second poller.
- Both mouse and Q-key paths use the same availability guard. Repeated pending requests are guarded. Modifier keys, text input, background and minimized windows do not trigger Q.
- No live multiplayer reliability claim follows from this menu change.

## Verification
See the implementation completion notes appended after the checks below.

### Completion checks
- Production `npm run build`: passed, exit 0. Existing browser-database and unrelated Tailwind ambiguous-duration warnings remain.
- Targeted ESLint on the queue overlay, new workspace and catalog: passed.
- `node --test tests/ai-battle-matchmaking.test.mjs tests/ai-battle-menu.test.mjs tests/dashboard-quick-windows.test.mjs tests/dashboard-floating-windows.test.mjs`: 30 checks passed, 0 failed.
- Menu checks cover no automatic joins, every unavailable genre/mode, mouse/Q consistency, duplicate pending requests, text-field/modifier/background/minimized guards, cancellation, legacy reservations, server-confirmed transition, error retry, initial loading, genre search, real store card rendering and unknown count display.
- Existing dashboard test fixtures referred to the earlier Memories name and omitted the already-existing RecordsWorkspace/Swords imports. Updated those fixtures to the current Records surface; no Records production behavior changed.
- Added an integration check that the Skill Book event opens/focuses the actual Cards window without closing AI Battle.
- The authenticated Base44 preview redirects this browser to sign-in. Live visual layout, account-backed card loading, actual two-player matching/combat, latency, PvE, world bosses and Arena Shift were NOT verified in a signed-in app.
- Responsive CSS and reduced-motion behavior are implemented; automated DOM tests are not a substitute for rendered viewport/accessibility review.
