# Game 3D stat system: audit and proposed structure

**Date:** 2026-10-15.
**Branch:** `game3d/stat-system-coherence`, stacked on `game3d/wuxia-blueprint`, so the numbers include slices A–D.
**Author:** Claude, for the owner and PM.

**Why:** the owner asked for every progression system to fit one stat structure, the way a real MMORPG's does:

- Stat points and attributes.
- Gear: enchant, over-enchant, stage, refine, ultimate.
- Halo, aura, wings and titles.
- Pets, mounts, cores, capes, costumes and vanity.
- The Wuxia systems.

Adding a system must never break the game.

**How it was measured:** `node tools/game3d/stat-report.mjs` builds one character system by system through the real stores. That is the same code the game runs. The tool prints the live stats after each step and compares the result with the enemies the world spawns. All the numbers below come from that run.

## 1. How the stat sheet works today

1. **Attributes.** A new hero starts with Strength 3, Agility 2, Vitality 5 and Spirit 2, and earns 3 points per level.
2. **Virtual attribute points.** These are added to the attributes before the formulas run:
   - Halo, Aura and the wing level each give +1 to every attribute per level.
   - Title attributes, elixirs, costume and vanity base stats, and gear attributes add their own amounts.
3. **Rates** (`statsSystem.jsx`):

   | Attribute | Gives, per point |
   |---|---|
   | Strength | 2.65 attack, 1.71 accuracy |
   | Agility | 1.63 defense, 1.67 block, 0.08% crit |
   | Vitality | 20 HP, 0.9 block |
   | Spirit | 1.43 attack, 15.31 chi |

4. **Flat stats on top:**
   - Title and wing-path flat stats.
   - Cores, cape, pet and mount.
   - Costume and vanity flat stats.
   - Gear flat stats (base stats × enhancement × advancement).
   - Advanced class flat stats and the Angel Cloak.
5. **Final multipliers, in sequence, so they compound.** In order:
   1. Vanity activation.
   2. Gear %.
   3. Advanced class.
   4. Weapon Affinity.
   5. Ascension Nature.

   Mount Soul Fusion also multiplies the gear stats before the formulas run.
6. **Combat** (`AXECombatMath.js`):
   - Damage = attack × skill × weapon × buffs.
   - A crit multiplies it by ×3 plus crit damage. Crit chance goes up to 75%.
   - Then **defense is subtracted, with a minimum of 1**.
   - There is no hit or miss roll.

## 2. Measured: one character, every system at its cap

| Step | Damage | Share of final damage | Max HP | Share of final HP | Defense | Crit % | Notes |
|---|---|---|---|---|---|---|---|
| Starting hero (level 1, starter kit) | 28.8 | 0.2% | 193 | 0.5% | 23.3 | 5.7 |  |
| Level 100, 297 stat points | +445 | 2.8% | +1,600 | 4.1% | 121 | 10.5 | STR 120 / AGI 60 / VIT 80 / SPI 37 |
| Halo 200/200 | +979 | 6.1% | +4,000 | 10.2% | 447 | 66.5 |  |
| Aura 200/200 | +979 | 6.1% | +4,000 | 10.2% | 773 | 75 |  |
| Wings 200/200 (strongest path) | +8,179 | **50.8%** | +10,000 | 25.6% | 1,899 | 75 | Wings of Strength; wing reinforcement left at 0% |
| Title 15/15 (strongest path) | +0 | 0.0% | +5,600 | 14.3% | 2,399 | 75 | Path of Vitality |
| Elixirs, full capacity | +245 | 1.5% | +1,000 | 2.6% | 2,481 | 75 | 50 each: strength, dexterity, vitality, spirit |
| Cape (strongest) | +120 | 0.7% | +650 | 1.7% | 2,599 | 75 | axe_cape_gods |
| Cores (2 strongest, level 20) | +109 | 0.7% | +644 | 1.6% | 2,755 | 75 | divine_balance, bastion |
| Pet (strongest, level 200, over-enchant 200%) | +414 | 2.6% | +0 | 0.0% | 2,755 | 75 | war_wolf |
| Mount (registered, 100% growth) | +144 | 0.9% | +500 | 1.3% | 2,795 | 75 |  |
| Costume (strongest) | +4.8 | 0.0% | +20 | 0.1% | 2,797 | 75 | axe_costume_skyguard |
| Vanity (4 slots, top card) | +1,297 | 8.1% | +2,821 | 7.2% | 3,076 | 75 | gold card |
| Gear: heroic Lv100 Q20 drops, every upgrade maxed | +372 | **2.3%** | +805 | 2.1% | 3,293 | 75 | drop ×7.51, enhancement ×2.85, advancement ×2.415; sockets, auras, sets not included |
| Taurus Chosen Ascension (Balanced) | +2,664 | 16.5% | +7,027 | 18.0% | 4,004 | 75 |  |
| Mount Soul Fusion (absorbed) | +114 | 0.7% | +256 | 0.7% | 4,072 | 75 | share 25% |
| **Total** | **16,095** | | **39,115** | | **4,072** | **75** | |

The starting hero against every enemy tier (plain hits: no crits, skills or level modifier):

| Enemy | Level | HP | Attack | Defense | Hero's hit | Hits to kill | Enemy's hit | Hits to kill the hero |
|---|---|---|---|---|---|---|---|---|
| normal | 1 | 40 | 7 | 1.6 | 27 | 2 | **1** | 193 |
| champion | 3 | 100 | 13 | 3.3 | 26 | 4 | **1** | 193 |
| elite | 5 | 180 | 24 | 6.5 | 22 | 9 | **1** | 193 |
| miniBoss | 8 | 440 | 42 | 9.8 | 19 | 24 | 19 | 11 |
| caveBoss | 12 | 960 | 70 | 14.7 | 14 | 69 | 47 | 5 |
| gateBoss | 18 | 1600 | 105 | 21.2 | 8 | 200 | 82 | 3 |
| worldBoss | 25 | 3200 | 159 | 29.3 | **1** | 3200 | 136 | 2 |

The fully built hero hits every tier for about 16,000, one hit each, and every tier hits it for 1.

## 3. Problems

### Fixed on this branch

1. **Vitality and Spirit were silently dropped from most systems.**
   - **Cause:** the aggregator pre-filled `vitality: 0` and `spirit: 0`, and the formulas read `vitality ?? constitution`. So a bonus named `constitution` or `focus` never counted. That covered gear, titles, elixirs, costumes and every other system that uses those names; only systems that wrote both names (the halo, aura and wing level) were unaffected.
   - **Effect:** +10 Vitality on gear gave 0 HP, and the Path of Vitality's +30 Vitality did nothing.
   - **Fix:** `playerHUDStore.jsx` reads each system's value under either name and counts it once.
   - **Evidence:** gear +10 Vitality now gives +200 HP. The title now gives +5,600 HP instead of +5,000. Elixirs give +1,000 HP and +766 chi instead of 0.
   - **Test:** `tests/game3d/stat-routing.test.mjs`. It fails on the old code (3 of 4) and passes with the fix.
2. **Boss minions used an enemy template that doesn't exist** (`common`). They fell back to the player's default stats. They now use `normal`.

### Structural problems (they need the owner's decisions; see §5)

- **S1. Flat defense subtraction makes either side immune.**
  - Any defense at or above the attacker's attack means 1 damage.
  - A starting hero already takes 1 from normal, champion and elite enemies.
  - The same hero deals 1 to the world boss.
  - Every system that adds defense moves this cliff.
- **S2. Enemies don't scale.**
  - There are seven fixed stat templates at levels 1–25, while the hero's level has no cap.
  - The hero's damage grows 560× (28.8 → 16,095), but the strongest enemy stays where it is.
  - XP per level stays at 160 from level 11 on.
- **S3. Power sits in the wrong places.**
  - One wing path is half of all endgame damage: Wings of Strength gives +6,000 flat damage at level 200.
  - Ascension is 16.5%.
  - The whole gear-upgrade chain is ×6.9 (reinforcement 120%, four enchant slots, over-enchant, combine, stage, refine, ultimate) but only 2.3%. The gear templates are tiny (the best sword has +3 attack), so ×52 of almost nothing is still small.
  - Stat points are 2.8%.
  - In Twelve Sky-style games, gear and its upgrades are the backbone; here they're a rounding error.
- **S4. Three systems are the same system.** Halo, Aura and the wing level each give +1 to every attribute per level, +200 each at max. That is the same curve three times, and each one is worth more than twice all of a level-100 hero's stat points (+979 damage against +445).
- **S5. Dead stats.**
  - Accuracy, Block, Hit % and Evasion % are computed and shown, but no combat roll uses them.
  - The Hit % shown falls as the hero levels (75% → 9%), because it compares the hero's accuracy with the hero's own block.
  - The halo's +200 Intelligence does nothing.
- **S6. Caps disagree.**
  - Crit chance is capped at 30% in `combatBalanceConfig.jsx` (unused) but at 75% in the stats and the combat maths.
  - Damage reduction is capped at 60% in one file and 90% in another.
  - Crit is already at 75% from the halo and aura alone.
- **S7. Multipliers compound.** Five final multipliers apply in sequence, so every new % system multiplies all the others. Balanced's ×1.2 alone adds more than the whole gear chain does.

## 4. Proposed structure

### 4.1 One stat sheet, one order of operations

Every system feeds the same sheet in the same order, and none writes a final stat directly:

1. **Attributes** = start + stat points + virtual points from systems. One name per attribute: Strength, Agility, Vitality, Spirit, with one alias table.
2. **Derived stats** from the rates.
3. **Flat additions.**
4. **One % pool per stat.** Every "+x% damage" from every system is added together, then applied once. A new system adds to the pool and never multiplies the others.
5. **At most two true multipliers:** the Ascension Nature and temporary combat buffs. Both are budgeted.

### 4.2 A power budget

Each system gets a share of endgame power, and a test holds it there. Proposed shares of total damage and HP for a fully built hero:

| Group | Systems | Share | Today (damage) |
|---|---|---|---|
| Character | level, stat points, elixirs | 20% | 4.3% |
| Gear | drops, reinforcement, enchant, over-enchant, combine, stage, refine, ultimate, sockets, auras, sets | 35% | 2.3% |
| Prestige | halo, aura, wings, titles (about 5% each, each with its own role) | 20% | 63.0% |
| Companions | pet, mount, cores, cape | 12% | 4.9% |
| Appearance | costume, vanity | 5% | 8.1% |
| Ascension | Nature | 8% | 16.5% |

Halo, aura and wings would stop being three copies of one curve. A possible split:

- **Halo:** crit and crit defense.
- **Aura:** attribute (elemental) attack and defense.
- **Wings:** movement plus flat HP and defense.
- **Titles:** kill-earned attributes.

### 4.3 Combat that stacking can't break

- **Defense as a % reduction with diminishing returns.** Reduction = DEF ÷ (DEF + K × attacker level), capped at about 75%. Defense always helps, never makes anyone immune, and works at every level.
- **A real hit roll from Accuracy against Block,** between attacker and defender: hit chance = 75% + (ACC − BLK) × c, clamped to 50–98%. Strength's accuracy and Agility's block finally do something.
- **One crit cap (about 50%) and a ×2 base crit multiplier.** Crit damage adds to it, and crit defense reduces it.
- **The level-difference modifier both ways.** Today only enemies hitting the hero get it.

### 4.4 Enemies scale with the world

Enemy stats would come from a level curve tied to a "par" hero of the same level (par = expected gear and systems for that level). Proposed targets:

- A par hero kills an even-level normal enemy in about 4–6 hits and dies to one in about 15–20.
- Champion, elite and boss tiers multiply those numbers.
- Zones and dungeons set enemy levels.
- Bosses scale with the party.

### 4.5 One config, one guard test

- **Config:** `axe/balance/AXEPowerBudget.js` holds the rates, caps, budget shares and enemy curve. Every system reads from it.
- **Guard test:** it maxes every system the way `stat-report.mjs` does and asserts:
  - each group's share is within its band;
  - a par hero against a par enemy stays inside the time-to-kill targets.

  A future system that breaks the budget fails the test instead of the game.

## 5. Plan and decisions

| Phase | What | Changes the live game? | Owner approval |
|---|---|---|---|
| 1 (this branch) | Measurement tool, attribute-routing fix, minion template fix | Players get the Vitality and Spirit they were owed | Merge only |
| 2 | Combat formulas (defense %, hit roll, single caps) and the enemy level curve | Yes: how fights feel | **Yes** |
| 3 | Rebalance each system to its budget band | Yes: the stats each level gives. Saved levels stay; no save migration | **Yes**. It lowers maxed characters |
| 4 | Guard test in the suite | No | Merge only |

**Decisions needed:**

1. The defense model (§4.3).
2. Enemy scaling and a level cap (§4.4; `normalLevelCap` is unset today).
3. The budget shares (§4.2).
4. What Halo, Aura and Wings should each be for (S4).
5. Whether Accuracy and Block should become a real hit roll (S5).

**Not covered here:** the backend systems (chat, party, trade, guild, duels). They are a separate audit.
