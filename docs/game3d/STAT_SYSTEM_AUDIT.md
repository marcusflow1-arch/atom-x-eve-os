# Game 3D stat system: audit, structure and rebalance

**Date:** 2026-10-15 (audit), 2026-10-16 (rebalance, §6).
**Status:** the owner chose all four recommended options (§5), and they are built (§6). §1–§3 describe the game *before* the change.
**Since:** build against build, the hit pipelines and the numbers of §6.2 were redone in [BUILD_BALANCE.md](BUILD_BALANCE.md) (2026-10-16). The budget bands and the enemy targets of §6 still hold; the per-system numbers there are superseded.
**Branch:** `game3d/stat-system-coherence`, stacked on `game3d/wuxia-blueprint`, so the numbers include slices A–D.
**Author:** Claude, for the owner and PM.

**Why:** the owner asked for every progression system to fit one stat structure, the way a real MMORPG's does:

- Stat points and attributes.
- Gear: enchant, over-enchant, stage, refine, ultimate.
- Halo, aura, wings and titles.
- Pets, mounts, cores, capes, costumes and vanity.
- The Wuxia systems.

Adding a system must never break the game.

**How it was measured:** heroes are built system by system through the real stores, the same code the game runs, and their live stats are compared with the enemies the world spawns. §2 comes from the first version of that tool. The current `node tools/game3d/stat-report.mjs` (built on `tools/game3d/powerBuild.mjs`) measures each group's share and the par curve (§6).

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
2. **Boss minions used an enemy template that doesn't exist** (`common`). They fell back to the player's default stats. They now use the enemy curve.
3. **Switching characters overwrote the next character's progression.**
   - **Cause:** on a switch, every progression store reloads and notifies the HUD store before the HUD's own reload runs. The HUD recomputed with the *previous* character's state and saved it under the *new* character's key.
   - **Effect:** an alt at level 5 became a copy of the main at level 50 (level, XP, stat points, attributes, HP), and a brand-new character inherited them too. This happened on every `setActiveCharacter` and account switch.
   - **Fix:** the HUD records which character its state belongs to. It never saves into another character's slot, and a mid-switch recompute loads the new character's own save instead.
   - **Test:** `stat-routing.test.mjs`, "switching characters never copies…".
4. **Crit damage and crit defense used two different units.**
   - Capes, cores, costumes and gear wrote them in percentage points (6 = 6%). The halo, wings and titles wrote ratios (0.06), and combat reads ratios.
   - Effect: the God's cape alone made crits hit ×9.2 and made the wearer crit-immune. A 0.5% gear crit-defense roll gave 50%.
   - Fix: one unit per stat (crit chance in percentage points; crit damage and crit defense as ratios). Each percent-unit source converts where it enters the sheet.
5. **Percentage stats scaled like flat stats.** A ring's +0.5% crit grew with item level, quality and every upgrade, until one level-100 ring gave about 50% crit. Rate stats now grow with rarity only (`isAXERateStat`).

### Structural problems (decided in §5, built in §6)

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

**Owner decisions (2026-10-15), each the recommended option:**

1. Defense: a percentage reduction with diminishing returns.
2. Enemies: a level curve, with zones setting levels and a level cap.
3. Budget: gear-led, with the shares in §4.2.
4. Hit roll: Accuracy against Block decides hits.

Halo, Aura and Wings took the roles in §4.2. The level cap is 100 (provisional; Ascension also opens at 100).

**Not covered here:** the backend systems (chat, party, trade, guild, duels). They are a separate audit.

## 6. Built (phases 2–4)

### 6.1 The rules

- **One config:** `axe/balance/AXEPowerBudget.js` holds the level cap (100), the combat rules, the budget bands, the par-hero table and the enemy curve.
- **Combat** (`AXECombatMath.js`, `statsSystem.jsx`):
  - **Defense:** reduction = DEF ÷ (DEF + 1.5 × the par hero's defense at the attacker's level), capped at 75%. A par defender takes 40% less.
  - **Attribute attack:** extra damage that only attribute defense reduces, by the same curve.
  - **Crits:** ×2 plus crit damage, up to 50%. A forced critical (Critical Focus) never misses.
  - **Hit roll:** hit chance = 85% + 50% × (ACC − BLK) ÷ (ACC + BLK), clamped to 50–98%. A miss shows MISS and spends no damage buff or skill multiplier.
  - **Level gap:** ±8% per level, both ways, clamped to ×0.5–×1.5. This replaces the old one-way +25% / −15% in GameWorld3D.
- **The stat sheet** (`playerHUDStore.jsx`, `AXEStatPool.js`):
  - Every percentage bonus (vanity activation, gear %, advanced class, weapon affinity) adds into one pool per stat and is applied once.
  - The Ascension Nature is the only true multiplier.
  - The hero's level is on the derived stats. Hit % and Evasion % are shown against an even-level enemy.
- **Enemies:**
  - Stats come from the enemy's level and tier (`getAXEEnemyStats`). An even-level normal enemy takes a par hero 5 average swings and kills one in 17. Champions, elites and bosses scale from there.
  - Zones set levels: Starter Spirits 1–4, Bamboo Raiders 6–10, Bamboo Elites 10–14, Cave Guardian 15.
  - The world boss is level 25 on the world-boss tier. Dungeon bosses scale a normal enemy of their level by their own HP, damage and defense scales. Quest targets match the hero's level.
- **Level cap:** at 100 no amount of XP is enough to level, and the XP bars show MAX LEVEL.

### 6.2 The numbers that changed

| System | Before | After |
|---|---|---|
| Halo (role: the critical strike) | +1 to every attribute per level (+200), +40% crit, +60% crit defense | +0.15 per level (+30), +15% crit, +30% crit defense |
| Aura (role: attribute power) | the Halo's bonuses again | +0.1 per level (+20), +300 attribute attack and +300 attribute defense |
| Wing level | the Halo's bonuses again | +0.1 per level (+20) |
| Wing paths at 200 | Strength +6,000 damage; Endurance +16,000 HP | Strength +140 damage; Endurance +1,100 HP (all four rescaled) |
| Title paths at 15 | Vitality +5,000 HP; Strength +350 damage | Vitality +450 HP; Strength +60 damage |
| Pets at 200 | the strongest +230 attack | +100 (every pet stat about half) |
| Vanity activation | +10% | +5% |
| Natures | Destroyer ×1.5 skills; Balanced ×1.2; Defensive ×1.5 defense and a 30% shield | ×1.25; ×1.06; ×1.25 and 20% |
| Weapon Affinity (blueprint values) | +20% damage; +10% crit dodge; +15% dodge and movement; +50% defense | +5%; +5%; +5% dodge and +8% movement; +10% (doubled when specialized). Dodge now raises Block |
| Gear | best starter sword +3 attack, little armour HP; drops +2.5% per level | sword +6, armour carries HP; drops +6% per level |

### 6.3 Results (`node tools/game3d/stat-report.mjs`)

A fully built level-100 hero now has 3,175 damage, 14,618 HP, 1,564 defense and 50% crit. Before, it was 16,095 damage and 39,115 HP.

Each group's share is what the hero loses without it, divided by the sum of those losses. The losses overlap, because removing a group also removes its part of the % pool.

| Group | Damage | HP | Band (target) |
|---|---|---|---|
| Character | 21.6% | 18.2% | 13–28% (20%) |
| Gear | 33.7% | 34.3% | 27–43% (35%) |
| Prestige | 21.2% | 22.9% | 13–27% (20%) |
| Companions | 14.3% | 11.6% | 6–18% (12%) |
| Appearance | 4.4% | 4.5% | 2–9% (5%) |
| Ascension | 4.8% | 8.5% | 4–12% (8%) |

- **Par hero against an even-level normal enemy:** 5 swings to kill and 17 swings to fall, at every level from 1 to 100. The hero hits 74% of swings at level 1 and about 79–85% after.
- **Fully built level-100 hero against level-100 enemies:**

  | Tier | Hero's swings to kill | Enemy's swings to kill the hero |
  |---|---|---|
  | Normal | 5 | 17 |
  | Elite | 25 | 11 |
  | World boss | 600 | 5 |

  A level-1 enemy dies in one swing.

**Checked live** in the local GameView (Dev Test character, level 1):

- Enemies spawn with their zone's levels and curve stats.
- In 2,000 simulated swings with the game's own modules, the hero kills a level-1 spirit in 5.7 swings and misses 27% (the stat screen shows 74.1% hit).
- The spirit kills the hero in 16.8 swings.
- In the running game, real swings took a spirit 84 → 66 → 46 → 26 → 0, the spirit's hits took the hero 193 → 163, and MISS floats appeared.

### 6.4 The guard

`tests/game3d/power-budget.test.mjs` builds heroes through the real stores and fails when:

- a group leaves its band, for any of the four wing paths;
- the par table drifts from the systems;
- a par hero is off its time-to-kill targets;
- the game's combat differs from the budget's maths;
- defense makes anyone immune;
- the level cap stops working;
- loot rate stats scale with level.

With the old +6,000 wing damage put back, it fails 3 of its 7 checks and names the cause.

**After a deliberate balance change:** run `node tools/game3d/stat-report.mjs --write-par` to regenerate the par table, then the test.

### 6.5 Limits and risks

- **Existing characters change.** Their saved levels, items and progress stay; no save is migrated. But each level and item now gives the new numbers, so maxed characters lose most of their power. That was approved with the budget.
- **Content stops at about level 15.** Zones go to level 15 and the world boss is 25, so the level 16–100 curve has no zones yet.
- **Pacing is untouched.** XP per level is still flat at 160 from level 11, and enemy XP rewards are unchanged.
- **Mount Soul Fusion** is a timed pill buff (+25–39% of gear) and sits outside the budget.
- **Raid bosses** keep their own phase and tank HP pipeline (`BossPhaseController`).
- **Not tested:** PvP (it uses the same rules) and remote players. *Since tested build against build, and found to be broken by systems outside the budget: see [BUILD_BALANCE.md](BUILD_BALANCE.md).*

