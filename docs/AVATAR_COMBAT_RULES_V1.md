# Avatar, card and Skill Book combat rules v1

These are the implemented starting rules in `base44/shared/combatStats.ts`, `cardStats.ts`, `combatProfile.ts` and `combatSkills.ts`. They belong to the AI avatar, not the driver account. The PvP latency repair preserves this integration.

## Level growth and allocated attributes

Level 1 starts at 1,000 HP and 100 attack. Avatar level is capped at 50; the existing 1,000 XP-per-level convention is retained. Each gained level awards five spendable attribute points.

| Source | Effect |
| --- | --- |
| Each gained level | +100 HP, +20 defense rating, +1 dodge rating, +0.3% attack speed, +35 base attack |
| Strength point | +7 attack; +0.2% scaling of equipped weapon attack, capped at +100% |
| Defense point | +8 defense rating |
| Vitality point | +25 HP |
| Agility point | +3 dodge rating; +0.2% attack speed |
| Intelligence point | +0.1 percentage point cooldown reduction |
| Wisdom point | +0.2 percentage point ability damage |

The +35 base attack and the two additional allocatable attributes are balancing choices added to the requested HP/defense growth. These constants are starting values, not a claim that every build has been validated in live play. There is no chi resource.

## Defense and rate limits

A rating is not a percentage. For an attacker at level L, after armor penetration:

`mitigation = min(0.70, defense / (defense + 200 + 20 × (L − 1)))`

A landed attack deals at least one damage; a dodge deals zero. Accuracy reduces opposing dodge rating. Dodge has diminishing returns and a 35% ceiling.

Cooldown reduction is capped at 40%, total attack-speed bonus at 100%, critical chance at 50%, critical damage at 2×, and armor penetration at 40%. Ability/weapon damage bonuses have their own caps. Rates use fractions internally: 0.003 means 0.3%.

Cooldown reduction increases cast frequency nonlinearly, which is why unbounded linear reduction is not used. Background reference: [Riot's official item-system discussion](https://www.leagueoflegends.com/en-us/news/riot-games/preseason-2021-champion-class-item-goals/). The app's exact caps and constants are design choices.

## Cards and equipment

Effective card stats combine the canonical base definition, enhancements and enchantments, followed by card growth:

`growth = min(6, 1 + 0.055 × (level − 1) + 0.12 × (stage − 1) + 0.18 × ascension + 0.05 × over-enchant rank + unlocked node bonuses)`

Core Calibration adds 0.03; Avatar Sync adds 0.05. Growth applies to attack, defense, magic, vitality and speed. Percentage modifiers are not multiplied by this growth factor.

Only owned, available cards count. Duplicate references cannot stack the same item twice. Only the active weapon slot contributes attack; additional weapon slots are reserves. Armor and accessories contribute once each.

Skill Book ability damage before the opponent's defenses is:

`(ability base × card growth × avatar level multiplier + avatar attack × 0.5 + avatar magic + card attack × 0.5 + card magic) × (1 + ability damage bonus)`

The avatar ability level multiplier is `1 + 0.10 × gained levels`. Card speed can contribute cooldown reduction, subject to the shared 40% cap. Skill Book, collection previews and the frozen PvP loadout use the same resolver.

## Backend and persistence

- Allocation validates ownership, point budget, request id and expected revision. Replayed requests do not spend points twice.
- Legacy purchased increments and unspent point credit are preserved during migration.
- Verified server rewards advance avatar XP. Client animation events cannot grant durable XP or edit combat HP.
- Live PvP freezes combat stats and the four equipped skills; loadout/allocation changes are blocked for live participants.
- The PvE practice encounter uses the same damage resolver and frozen build. Practice awards no XP or items.

The 28 avatar-combat tests cover level growth, allocation, migration, ownership, duplicate/replayed requests, card/Skill Book consistency, live-match locks and server-authoritative PvP/PvE damage. Balance still needs actual match data: win rate by build, damage per turn, match length and card rarity/level differences.
