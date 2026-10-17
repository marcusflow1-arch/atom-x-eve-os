# Build balance: every system matched against every other

**Date:** 2026-10-16.
**Branch:** `game3d/build-balance`, from `main`.
**Author:** Claude, for the owner and PM.

**Why:** the owner asked for every system to be compared with every other: does what one system gives make sense next to what another gives, and does any of it contradict what a stat says it does?

- A defense build must be safe without worrying that someone has too much damage.
- A damage build must not have to worry that someone has too much HP or defense.
- The old assessments are to be revisited, and the old systems removed and redone.

**What came before:** the stat audit ([STAT_SYSTEM_AUDIT.md](STAT_SYSTEM_AUDIT.md)) balanced one fully built hero against enemies, and each system's share of total power. It never tested builds against each other: its own limits said "Not tested: PvP". This document is that test, and the rebuild it led to.

## 1. What was wrong

### Hits ran through two to four systems each, outside every cap

A hero's hit on an enemy (GameWorld3D) went through all of these:

1. **The budget's rules:** hit roll, crit and defense.
2. **Five multipliers:** damage buff, Power Charge, weapon class, skill and shop buff.
3. **A second crit roll** from the shop crit buff (×1.5).
4. **Lethal Blow,** which set the damage to the target's whole HP, bosses included.
5. **Weapon mastery's own pipeline** (`applyMasteryToHit`):
   - a third crit roll with its own 35% cap and +50% crit damage;
   - its own defense formula, then combo, execute and variance;
   - "armor penetration" that **added** a share of the target's defense to the damage.

An enemy's hit on the hero went through all of these:

1. **Four separate avoidance rolls:** Iron Stance dodge, Iron Stance guard, Swift Marksman's "hit chance" used as evasion, and a dodge buff that was already a no-op.
2. **Then the budget's hit roll.**
3. **Then a reflect roll.**
4. **Then mastery and advanced class:**
   - their own dodge (up to 25%) and a 50% block;
   - a deflect that took no damage and returned 100–150% of the hit;
   - damage reduction stacked on defense's own 75% cap.

So a tank could avoid about three quarters of hits and shrug off the rest while attackers killed themselves on its reflects. A damage build could stack crit on crit. Duels used only the budget's rules, so the same build had one strength against enemies and another against players.

### Units, dead effects and contradictions

| Found | Effect |
|---|---|
| Advanced class crit damage went on the sheet as percentage points (50 instead of 0.5) | A Berserker's crits hit **×52**, a Sniper's ×42, an Executioner's ×37 |
| Advanced class dodge and block counted twice (as Block points and as their own rolls) | A dodge class was harder to hit twice over |
| Iron Stance's "+40% defense" was never applied | The text promised what the game never gave |
| Decisive Blow (crit chance) and God's Deflection (crit resist) were stored and never read | Two skills did nothing |
| Guardian Crushing Blow's `defense_scale` was never read | A promised defense-to-damage scaling that never existed |
| Sniper weak spot and Shadow Ranger stealth damage were checked, but no caller set them | Two class identities did nothing |
| Explosive damage, combo multiplier, HP-to-damage, rage and shield scaling were read by no code | Class passives did nothing |
| Elemental scaling raised `elementalDamage`, which heroes never have (always 0) | Paladin and Blood Knight's elemental bonus did nothing |
| The bow's attacks charged without limit (+25% for every extra second held) | Holding the button multiplied a shot without end |
| World bosses and rogues were hit with **defense 0** and no level gap | Bosses ignored their own armor |
| Rogues had flat HP (180 + 20 a level) and hit for 14 + 2 a level, straight to HP | Off the enemy curve; a defense build gained nothing against them |
| A `TEST_KILL_MULTIPLIER = 100` was still on ("⚠ remove for live release") | Rogue kills gave 100× the title kills |
| The legacy spells (Lightning Strike, Frost Tornado) dealt a fixed number, ignoring the target | Far too strong at level 1, nothing at level 100 |
| Every level-100 build sat at the 50% crit cap and near the attack-speed cap whatever it chose | Crit and speed investments bought nothing |
| A point of Vitality was worth about 1.6× a point of Strength | Damage builds lost more than they gained |
| `getAXEExpectedHit` (the budget and the enemy curve) ignored crit damage and crit defense | Builds that invested in either were invisible to the budget |
| Two old balance configs (`progression/combatBalanceConfig.jsx`, unused, and `weaponMastery/CombatBalanceConfig.jsx`) had their own crit, dodge and mitigation caps | Caps disagreed: crit 30% / 35% / 50%, mitigation 60% / 75% / 90% |
| `applyClassPassives` and the old fixed enemy templates were unused, with their own caps (crit 95%, dodge 90%) | Dead code waiting to be wired back in |

## 2. What changed: one sheet, one hit

**One sheet.** Every permanent build effect is a stat on the hero's sheet, each capped. These come from the weapon in hand:

- its class passive (Brutal Force, Swift Marksman, Iron Stance);
- weapon mastery (global, identity, milestones, tree);
- the advanced class.

The sheet fields are:

- **Offense:** crit, crit damage, accuracy bonus, armor penetration, skill damage, execute, attack speed.
- **Defense:** avoidance, deflect, block, damage reduction, reflect.
- **Sustain:** life steal.
- **Situational:** charge, weak-spot and stealth damage, long-range crit.

Damage % and defense % join the existing stat pool.

**One hit.** `axeStrikeOutcomes` in `base44/shared/axePowerBudget.ts` lists every way a swing can end, with its chance:

1. **The hit roll** (Accuracy against Block, plus the accuracy bonus).
2. **The defender's avoidance and deflect:** one roll. Misses, avoids and deflects together never pass 50%.
3. **Crit and block.**
4. **Defense** (less armor pen) and every damage reduction, under one 75% cap.
5. **Execute, level gap and the hero-against-hero scale.**

Reflect returns part of the damage taken; life steal heals part of the damage dealt. The same function serves:

- the hero's hits on enemies, rogues and world bosses (`AXEStrikeRuntime.resolveAXEHeroStrike`);
- every enemy's hit on the hero (`resolveAXEStrikeOnHero`);
- duels on the server (`duelSystem`);
- the measuring tool and the tests, as expected values.

**Temporary bonuses** (Focus, Power Charge, shop elixirs, the momentum chain, situational class bonuses) multiply into one bonus on a swing, capped at ×2, and are spent only when the swing lands. Decisive Blow and the shop crit elixir add crit chance under the 50% cap. God's Deflection and Heaven's Riposte now work, inside the crit-defense and deflect caps. Lethal Blow finishes ordinary enemies only, never bosses or players.

### The caps (`AXE_BUILD_CAPS`)

| Effect | Cap | | Effect | Cap |
|---|---|---|---|---|
| Damage % from build systems | 60% | | Block chance (halves the hit) | 25% |
| Defense % from build systems | 60% | | Damage reduction on top of defense | 20% |
| Crit damage | +100% (a crit ×3 at most) | | Defense and every reduction together | 75% |
| Crit defense | 60% | | Reflect | 10% |
| Crit dodge | 40% | | Life steal | 10% |
| Armor penetration | 20% | | Skill damage | 50% |
| Accuracy bonus | +10 points of hit chance | | Execute: threshold, damage | 30% HP, +60% |
| Avoidance (every dodge and guard) | 20% | | Attack speed | +40% |
| Deflect | 8% | | Situational damage (each) | 50% |
| Missed, avoided and deflected together | 50% | | Temporary bonus on one swing | ×2 |

**Hero against hero:** every hit is scaled by 0.23 (`pvpDamageScale`), so a duel lasts seconds instead of two swings. Heroes hit hard enough to clear enemies built for the par hero. This is the usual MMORPG approach and is easy to change in one place.

### The numbers that changed

| System | Before | After |
|---|---|---|
| Strength: attack per point | 2.65 | 3.5 |
| Vitality: HP per point | 20 | 15 |
| Spirit: attack per point; skill power | 1.43; 0.35% (only two legacy spells read it) | 2.2; 0.05% on every skill |
| Agility: crit per point; attack speed per point | 0.08%; 0.10% | 0.05%; 0.05% |
| Halo crit at 200 | +15% | +8% |
| Brutal Force (damage passive) | +35% damage | +12% |
| Swift Marksman (ranged passive) | +10% damage, +15% hit chance (worked as evasion) | +5% damage, +10 accuracy |
| Iron Stance (defense passive) | +40% defense (never applied), +20% damage, 7% dodge + 7% guard | +15% defense, +5% damage, 4% + 4% |
| Weapon mastery: crit, crit damage, attack speed | +10%, +30%, +15% | +5%, +20%, +10% |
| Sword mastery: execute damage | +50% | +20% |
| Natures: Destroyer skill damage; Defensive defense; Defensive shield | ×1.25; ×1.25; 20% of damage dealt, up to 40% of max HP | ×1.35; ×1.15; 10%, up to 25% |
| Berserker | +20% crit, +50% crit damage (×52 by the unit bug), 15% life steal, +20% attack speed | +12%, +30%, 8%, +10% |
| Blade Dancer | 25% dodge, +25% attack speed, +30% combo | 8%, +10%, +10% |
| Executioner | +80% execute damage, +35% crit damage | +50%, +50% |
| Blood Knight | 25% life steal | 10% |
| Fortress Tank | +40% defense, +30% HP, 25% block, 15% reflect | +12%, +8%, 15%, 10% |
| Counter Fighter | 20% block, 15% dodge, +15% attack speed | 12%, 6%, +10% |
| Juggernaut | +25% defense, +20% HP | +12%, +8% |
| Paladin | +20% defense, +15% HP, 15% block | +10%, +8%, 10% |
| Shadow Ranger | 20% dodge | 12% |
| Rogues | flat HP and hits | champion tier on the enemy curve |
| Rogue kills for titles | ×100 (test value) | ×1, as the file's own comment says live should be |
| Legacy spells | fixed damage | skill hits: Lightning ×1.6, Frost Tornado 3 × ×0.6 |

Class bonuses now act as follows:

| Bonus | Where it acts |
|---|---|
| Charge damage | Power Charge hits |
| Weak spot | Hits from 10 m or more |
| Stealth | The first hit after 5 s out of combat |
| Explosive damage | Skill damage |
| Combo multiplier | The momentum chain |
| Elemental scaling | Attribute attack |
| A bow's on-hit stacks (lost in the rebuild) | Restored as its momentum chain |

### Removed

- **Weapon mastery's second pipeline** (`applyMasteryToHit`, `applyMasteryToIncomingDamage` and four unused helpers) and its config, `weaponMastery/CombatBalanceConfig.jsx`.
- **The unused `progression/combatBalanceConfig.jsx`.**
- **Every weapon-class roll and multiplier** in `weaponClassCombatHelpers.jsx`; only movement speed remains.
- **The buff shim's no-op and superseded helpers.**
- **Dead helpers:** `applyClassPassives`, the fixed enemy templates, and three unused hit wrappers in `statsSystem.jsx`.

## 3. Measured: build against build

`node tools/game3d/build-matchups.mjs` builds four real level-100 archetypes through the stores the game runs. Each has its own stat split, elixirs, weapon with class passive and mastery, advanced class, wing and title paths, role-picked cape, cores and pet, and Nature:

| Archetype | Stats | Weapon and class | Nature |
|---|---|---|---|
| Striker (all damage) | Strength 70% | Sword, Berserker | Destroyer |
| Bulwark (all defense) | Vitality 60%, Agility 30% | Dual blades, Fortress Tank | Defensive |
| Ranger (precision) | Strength 45%, Agility 40% | Bow, Sniper | Balanced |
| Balanced | as the par hero | Sword | Balanced |

They fight with the game's own hit resolution, in this rotation: 70% plain swings and 30% skills at ×1.6. The situational bonuses apply at these assumed uptimes:

| Situation | Assumed uptime |
|---|---|
| Power Charge hits | 15% |
| A ranged build's hits from range | 60% |
| Hits from stealth | 5% |
| Momentum chain | 3 hits |
| Execute window | the last 30% of the target's HP |

**Seconds for the row to kill the column** (swings in brackets):

| | Striker | Bulwark | Ranger | Balanced |
|---|---|---|---|---|
| **Striker** | 3.9 (5.0) | 12.2 (15.8) | 5.3 (6.8) | 5.6 (7.2) |
| **Bulwark** | 14.0 (17.0) | 44.2 (53.7) | 19.5 (23.7) | 20.7 (25.2) |
| **Ranger** | 5.4 (7.6) | 17.4 (24.3) | 7.6 (10.7) | 8.0 (11.2) |
| **Balanced** | 6.0 (7.2) | 19.7 (23.6) | 8.5 (10.2) | 9.0 (10.8) |

**Races, both swinging** (reflect, life steal and the Defensive shield included). Every pairing is within 1.21×:

| Race | Winner | Margin |
|---|---|---|
| Striker vs Bulwark | Striker | 1.06× |
| Striker vs Ranger | Striker | 1.12× |
| Striker vs Balanced | Striker | 1.21× |
| Bulwark vs Ranger | Bulwark | 1.08× |
| Bulwark vs Balanced | Bulwark | 1.12× |
| Ranger vs Balanced | Ranger | 1.06× |

**What the owner asked for, checked:**

- **A defense build is safe from damage.** The Bulwark lasts 12.2 s against the Striker, 2.2× the Balanced build's 5.6 s.
- **A damage build can still bring a defense build down.** The Striker kills the Bulwark in 12.2 s, while the Bulwark kills the Striker in 14.0 s.
- **Damage investment pays.** The Striker kills the Balanced build in 5.6 s, where the Balanced mirror takes 9.0 s.
- **No pairing is a one-shot or a wall:** 5–54 swings.

**Choices inside a system, on the same hero.** Offense / survival / power, against the first option:

| System | Choices |
|---|---|
| Wing paths | strength 0 / 0 / 0 · endurance −7.4 / +9.1 / +1.0 · precision +3.4 / −0.9 / +2.4 · spirit +2.0 / +0.1 / +2.2 |
| Title paths | strength 0 · vitality −8.6 / +9.9 / +0.4 · dexterity −2.0 / +3.2 / +1.2 · spirit −4.9 / 0 / −4.9 · harmony −1.9 / +6.6 / +4.6 |
| Natures | destroyer 0 · balanced −8.9 / +9.9 / +0.1 · defensive −15.1 / +14.2 / −3.0 |
| Weapons | sword 0 · dual blades −12.4 / +16.9 / +2.4 · bow +2.7 / +2.7 / +5.5 |
| Sword classes | berserker +17.3 · blade dancer +28.0 · executioner +9.8 · blood knight +16.9 (power) |
| Guardian classes | fortress tank +20.7 · counter fighter +23.3 · juggernaut +19.2 · paladin +20.2 |
| Ranged classes | sniper +15.0 · tactical expert +19.7 · explosive archer +14.0 · shadow ranger +16.5 |

Each choice goes its own direction (more damage or more survival) for about the same power. No choice is a trap or a must-pick.

**Stat points: +10 points on the Balanced build.**

| Attribute | Gives |
|---|---|
| Strength | +1.96% damage |
| Vitality | +1.60% survival |
| Agility | +0.69% damage (attack speed) and +1.04% survival |
| Spirit | +0.68% damage, plus chi and skill power |

On the Bulwark, Strength is worth more (+3.4%) because it has invested so little in damage. That is diminishing returns, not a contradiction.

**Against enemies (level 100):** the par hero kills an even-level normal enemy in 5 average swings and falls in 17, as before.

| Archetype | Swings to kill a normal enemy |
|---|---|
| Striker | 3.7 |
| Balanced | 4.8 |
| Ranger | 5.1 |
| Bulwark | 11.6 |

**The budget** (`node tools/game3d/stat-report.mjs`): every group stays in its band under all four wing paths.

| Group | Damage share | HP share |
|---|---|---|
| Character | 23.3% | 14.9% |
| Gear | 34.9% | 37.7% |
| Prestige | 21.5% | 21.4% |
| Companions | 11.6% | 12.8% |
| Appearance | 4.1% | 4.5% |
| Ascension | 4.6% | 8.8% |

Weapon mastery and its class passive count in the gear group: they belong to the weapon in hand. The par table now carries the whole combat sheet, so enemies are calibrated against what heroes really bring.

## 4. The guard

`tests/game3d/build-balance.test.mjs` measures the builds and fails when:

1. **A race is lopsided:** any race is won by more than 1.35×.
2. **Defense stops paying:** the Bulwark survives the Striker less than 1.8× as long as the Balanced build does.
3. **The tank becomes a wall:** the Bulwark takes more than 3× as long to kill as the Balanced build.
4. **Damage stops paying:** the Striker no longer kills faster than the Balanced mirror.
5. **Burst or walls appear:** any pairing takes under 4 or over 60 swings.
6. **Choices drift apart:** wing paths, titles, Natures or weapons more than 8% from their system's median power, or any advanced class outside +8–30%.
7. **Stat points drift:** a point of Strength and a point of Vitality more than 2× apart (Balanced and Striker builds).
8. **Stacking passes a cap:** a hero with every avoidance maxed is hit less than half the time, mitigation passes 75%, or a crit exceeds ×3.
9. **An old pipeline returns:** GameWorld3D imports one of the removed second pipelines again.

**Updated tests:** `power-budget`, `duel-system-backend`, `ascension` and `mount-fusion` now use the new rules.

**Verified:**

- 103 Game 3D and backend tests pass.
- The production build passes.
- Lint matches `main` or is better (the weapon-mastery pipeline went from 2 problems to 0).
- The shared rules pass a strict type check.

**Checked live in GameView,** with the real GameWorld3D path:

- the hero's swings on a level-1 spirit went 107 → 54 (a crit) → 28 → 2;
- the spirit's hit took the hero from 199 to 184;
- no combat errors.

## 5. For the owner

**Changes that players will notice:**

- **Maxed characters change.** Advanced classes lose the ×52 crit bug and their oversized avoidance; tanks can no longer be untouchable; Brutal Force is +12%, not +35%. No save is migrated: saved levels and items stay, and give the new numbers.
- **Duels change:**
  - the server now uses every build effect (avoidance, block, deflect, reflect, life steal, execute, crit dodge);
  - reflect can knock out the attacker;
  - every hero-against-hero hit is scaled by 0.23.
- **Rogue kills give title kills at the live rate** (the rogue's level, not ×100).

**Assumptions to confirm or change:** the PvP scale, the rotation and the uptimes above, the caps table, and the archetype definitions. Each is one constant in `axePowerBudget.ts` or `tools/game3d/build-matchups.mjs`.

**Not built** (each still promises something):

- Bleed chance and trap damage (no bleed or trap systems exist).
- Summon strength and HP-to-damage.
- Rage gain, shield scaling and crowd-control resistance from classes.
- The player aura effects (`PassiveSkillAuraEffects.jsx`: Power Charge hand glow, barrier, repulsion, destruction) still read the old buff store (`activeBuffsStore.jsx`) that nothing writes, so they never show. The two HUD buff strips now read the buff engine.
- Positioning and range are not in the races: a ranged build's real advantage of hitting from distance is on top of the numbers above.

**Not run:** live multiplayer (two players in one world) and the deployed duel server.
