# Skill mastery: skills level up by being used

**Owner's direction (2026-10-16):** you start with your skills at level 1. Using a skill evolves it to the next level, and
so on up to the highest level. This applies to every kind of skill: single hit, multi-hit, AoE and buffs. Simply using
a skill makes you more effective with it.

Branch `game3d/skill-mastery`, stacked on `game3d/aura-buff-engine`, which sits on `game3d/hud-buff-strips` and
`game3d/build-balance`.

## What was wrong

Every skill was cast at level 1, forever: `GameWorld3D.jsx` called `castSkill(id, { level: 1, … })`. The level scaling
already existed in every skill (`scaling: { stat: { min, max } }`, read by `scaleStat` from level 1 to `max_level` 30),
so strikes, shields, reflect, crit and charge values never moved past their level-1 numbers.

## What changed

- **`base44/shared/skillMastery.ts`** holds the curve, the ranks and the save check, shared by the game and the
  server.
- **`skills/skillMasteryStore.jsx`** holds each character's XP per skill, saved in `axe_skill_mastery_v1`, so the
  Character Vault keeps it on the server with the rest of the character.
- **`skills/skillExecutor.jsx`** casts every skill at its mastery level and reports each use.
- **The HUD skill slots** show the level, in its rank colour, with a thin bar for progress to the next level. The
  tooltip gives the level, rank and XP.
- **A level-up shows a toast**, for example "🛡️ AEGIS Shield reached level 8 — Master". It also sends the window
  event `skillMasteryEvent` (`LEVEL_UP`, `RANK_UP`) for later effects and sounds.

### What counts as a use

A use earns the skill's **cooldown in XP**. A skill used every time it is ready therefore earns about 1 XP per second of
fighting, whatever its cooldown: a 5 s strike and a 60 s buff master at the same pace.

| Skill | Earns its XP when |
|---|---|
| Single hit, multi-hit, AoE | each strike **lands** (on an enemy, a rogue player or a locked duel opponent), each strike earning its share: cooldown ÷ strikes. A strike into the air earns nothing. |
| Buff | combat happens while it is up, with a hit landed or taken. A buff cast in town earns nothing; one cast just before a fight earns once the fight starts. |
| A skill in slot 2 (Critical Focus charge) | the next hit lands |

The landed-hit signals are events the game already sends: `weaponMasteryEvent` ON_HIT, `rogueAITakeDamage`,
`duelAttack`. Hits taken come through `CombatMusicTrigger`, the existing combat detector.

### The curve

Total XP to reach a level is `72,000 × ((level − 1) / 29)^2.2`. The hours below assume the skill is used every
time it is ready during fights.

| Level | Total XP | Fighting time |
|---|---|---|
| 2 | 44 | under a minute |
| 5 | 922 | 15 min |
| 8 (Master) | 3,157 | 53 min |
| 15 (Demigod) | 14,506 | 4 h |
| 22 (God) | 35,395 | 10 h |
| 30 (Chosen) | 72,000 | 20 h |

The eight skill slots level side by side, so a character fighting with a full bar masters all eight in about 20 hours
of combat. The total and the exponent are the two constants in `SKILL_MASTERY`.

### The server

`characterSaveRules.ts` checks `axe_skill_mastery_v1` before the vault keeps a save:

- **Rejected:** a wrong shape, a bad skill id, or XP below 0 or above 72,000.
- **Accepted but flagged for review:** a skill that gained more than 600 + 90 XP per minute since the last save
  (normal play is about 60 per minute).

## Tests

`tests/game3d/skill-mastery.test.mjs` runs the real executor, buff engine and store. It covers:

- the curve and the five ranks;
- level 1 for a new character;
- strike shares for single-hit and 3-hit skills, and nothing for a strike that misses;
- buff credit in and out of combat, and an expired buff earning nothing;
- the slot-2 charge;
- a level-30 Aegis Shield shielding 15% of max HP against 5% at level 1;
- level-up and rank-up events and the toast;
- no XP past the max level;
- saves kept per character;
- the server's save check.

## Limits

- **Duel strikes earn when they are sent** to a locked opponent in range. The duel server decides hit or miss and
  does not report it back yet.
- **The duel server does not check the level yet.** It caps a strike's skill multiplier at 3 but does not check it
  against the character's mastery level. Every registry skill's level-30 value is within that cap (the highest is
  Divine Single, ×3.00).
- **Balance:** `tools/game3d/build-matchups.mjs` assumes a fixed skill multiplier of 1.6, which is about mid-ladder. A
  mastered character now reaches each skill's top value, which the registry always allowed but nothing ever reached.
- **The old skill book upgrade** (`equipment/skillUpgradeStore.jsx`: points per level, "adaptation XP") belongs to the
  legacy skill list and is unchanged. It does not affect cast skills.
- **Ranks are names and colours only.** No skill changes its look or gains a new effect at a rank yet.

## For the owner to decide

1. **Pace:** about 20 hours to master a skill. Faster or slower is one constant.
2. **Ranks:** should Master, Demigod, God and Chosen change the skill itself (bigger effects, an extra hit, a new
   visual), or stay as names?
3. **Efficiency:** should mastery also shorten cooldowns or cost less, beyond the stronger values?
4. **The old skill book points:** keep, fold into mastery, or remove?
