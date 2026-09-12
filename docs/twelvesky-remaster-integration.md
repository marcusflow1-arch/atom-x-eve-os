# TwelveSky Remaster Integration Map

## Objective

Use the behavior and data structure visible in the supplied TwelveSky2-era server package as a reference for a modern Atom X Eve game-world implementation while preserving the systems already present in `src/components/game3d`.

The target is a modernized TwelveSky-style MMO experience: familiar progression depth and combat loops, but with a current presentation, direct player-menu services, modern boss encounters, and a clean data-driven architecture.

## Source and licensing boundary

The supplied archive contains legacy server/gameplay source and game data whose redistribution license is not established. Do **not** copy those proprietary source files, models, textures, sounds, motions, or other client assets into this repository unless ownership or redistribution rights are confirmed.

Use them as behavioral/reference material and reimplement compatible game rules in the repository's own code. Existing permissively licensed TwelveSky/Fenrir reference material can continue to be imported under its license and attribution requirements.

## Existing Atom X Eve systems to preserve

The current game world already includes most of the framework needed for a remaster:

- Player input, movement, camera and animation controllers.
- Shared combat/stat pipeline and weapon-class modifiers.
- Skill execution, cooldowns, buffs, dodge/guard/critical mechanics.
- Enemy AI and companion AI.
- World boss spawning, boss brain, encounter controller, telegraphs, HP feedback and boss death handling.
- XP, player levels, stat allocation and persistent HUD progression.
- Quest acceptance/progress/completion/rewards.
- Equipment, enchantment, companion equipment and fusion UI.
- TwelveSky-style Halo, Wings, Palace, Titles/Contribution and Elixirs.
- Portable market and remote contracts.
- Persistent guild/clan backend with membership, chat, vault, missions, upgrades and guild hall.

Do not build parallel versions of these systems. Extend their data and rule layers.

## Legacy-to-remaster system map

| Legacy concept | Remaster destination | Rule |
| --- | --- | --- |
| Zone/game server combat | `game3d/combat`, `statsSystem`, `skills` | Translate formulas/state rules into the shared combat pipeline. |
| Monster/boss spawn regions | spawn config + boss system | Convert spawn records into data manifests; keep rendering independent. |
| Monster AI | `game3d/ai/EnemyAISystem` | Add behavior profiles/states rather than hard-coded per-monster loops. |
| Summon/boss systems | `boss/`, spawn helpers | Use encounter-controller phases, telegraphs and server-authoritative state hooks. |
| Player EXP/levels | `playerHUDStore`, XP table | Keep one progression source of truth. |
| Skills | `skills/AbilitySystem`, `skillExecutor` | Map skill ids, costs, cooldowns, ranges and effects into data definitions. |
| Items/equipment | equipment/store registries | Import definitions; preserve current equipment UI and stat pipeline. |
| Pills/elixirs | progression elixir system | Player-menu service; no NPC requirement. |
| Halo/title/palace systems | progression modules | Player-menu service; preserve costs/caps/prerequisites. |
| Guild creation/management | `clanStore` + `clanSystem` | Player-menu service; no registrar NPC requirement. |
| Shops/blacksmith NPC services | Spirit Services | World NPCs may remain for lore, but transactions are available remotely. |
| Character/client animation signals | current Three.js animation controllers | Map combat states to licensed/current animation clips; do not import unlicensed motions. |
| Character models | current asset pipeline | Replace with owned/licensed assets or newly created remaster models. |

## Combat contract

All hostile entities, including world bosses, should enter the same target/damage contract:

1. Input requests an attack or skill.
2. Target resolver chooses an eligible hostile target, with explicit lock-on/raycast target taking priority over proximity fallback.
3. Combat pipeline validates range, cooldown, weapon/skill restrictions and player state.
4. Hit/crit/dodge/guard calculations execute from shared stats and buffs.
5. Damage is applied to the entity's authoritative combat state.
6. A combat event drives floating damage, HP UI, hit reaction and animation/VFX.
7. Death produces XP, loot/quest/achievement credit and boss encounter completion where applicable.
8. Player progression is saved through the existing progression stores/backend integration.

Do not create a special damage formula for bosses. Bosses may add mitigation, phases, break bars or mechanics, but should consume the same base combat event format as normal enemies.

## Animation/model contract

Gameplay code should request semantic states, not asset filenames:

- `idle`
- `walk`
- `run`
- `attack.primary`
- `attack.skill.<skillId>`
- `hit`
- `guard`
- `dodge`
- `cast`
- `death`
- `levelUp`

The animation controller maps those states to the currently installed licensed clips. This allows remaster-quality models and animations to replace placeholders without rewriting combat code.

## Player Services design

`SpiritServicesTab` is the modern replacement for legacy NPC errands. It should expose services while preserving world gameplay:

- Forge/Reinforcement
- Halo
- Wings
- Palace
- Titles/Contribution
- Pills/Elixirs
- Aura
- Market/consumables/materials
- Contracts/quests
- Guild creation and management

Bosses, PvP, wars, monster kills, exploration and quest objectives stay in-world. Administrative/progression interactions do not require travel to an NPC.

## Economy and monetization readiness

Every paid or currency-consuming service should go through a transaction descriptor instead of embedding payment logic in a UI component. A descriptor should identify:

- service id
- item/progression target
- soft-currency cost (Silver)
- earned-progression cost (CP/materials)
- optional premium convenience SKU
- server-side validation action
- resulting entitlement or state mutation

Premium purchases should be additive/convenience/cosmetic where possible. Combat power must still have explicit server-side caps and progression prerequisites so payment cannot bypass validation or create impossible state.

Recommended monetizable surfaces that do not require rewriting gameplay:

- Cosmetics, auras, wing appearances and UI themes.
- Account/service convenience such as extra loadouts or storage.
- Seasonal pass rewards.
- Optional service-fee waivers or convenience tokens where game balance permits.
- Name/guild customization and cosmetic guild presentation.

Do not let the client directly grant currency, levels, reinforcement success, items or premium entitlements. Those mutations need a backend-authoritative transaction/action.

## Migration order

1. Keep current world-boss hit/death flow and unify target priority across normal enemies and bosses.
2. Convert legacy item/skill/monster/quest rows into data manifests consumed by existing systems.
3. Port combat formulas and progression rules that are still absent, with tests against known legacy examples.
4. Add missing AI profiles and boss/monster behaviors.
5. Complete equipment reinforcement/refinement/fusion rules through the current equipment UI.
6. Add remaining social/faction/war systems through existing clan/multiplayer infrastructure.
7. Replace placeholder visual assets with newly created or clearly licensed remaster models, animations, VFX and audio.
8. Move economy-changing mutations behind backend-authoritative service actions before enabling real-money monetization.

## Definition of done

The remaster architecture is complete when a player can enter the world, target and fight normal monsters/world bosses, earn XP/levels/loot, build a character, upgrade gear and TwelveSky progression systems, use pills/elixirs, form/manage a guild, complete quests, and access market/progression services from the player UI—all while the underlying rules remain data-driven and server-validatable.
