// ─────────────────────────────────────────────
// Stat System — single source of truth for player/enemy combat math.
//
// 5 core stats. Each invested point converts to multiple derived combat values:
//
//   STRENGTH  → +physical damage, +hit chance, small damage roll bonus
//   VITALITY  → +max HP, +HP regen per second, small hit chance bonus
//   SPIRIT    → +chi (mana) pool, +mana regen per second, +spell damage %
//   DEXTERITY → +defense, +crit chance, +attack range
//   ELEMENTAL → +elemental damage, +elemental defense, +DoT spell damage %
//
// Equipment acts as a MULTIPLIER on the stats you've invested.
// e.g. a sword with { strength_mult: 0.5 } means its bonus damage =
//   floor(player.strength * 0.5 * 3)  — half your invested strength,
//   re-converted through the strength→damage rate.
// This way equipment scales WITH your character, not in isolation.
// ─────────────────────────────────────────────

export const STAT_RATES = {
  strength:  3,   // dmg per point
  hp:        20,  // HP per point
  spirit:    20,  // chi per point
  dexterity: 2,   // defense per point
  elemental: 1,   // elemental dmg per point
};

// Secondary derived-stat rates (per invested point)
export const SECONDARY_RATES = {
  hitPerStr:        0.5,   // % hit chance per strength
  hitPerVit:        0.2,   // % hit chance per vitality
  dmgRollPerStr:    0.3,   // % bonus damage variance per strength
  hpRegenPerVit:    0.4,   // HP/sec per vitality point
  manaRegenPerSpr:  0.5,   // mana/sec per spirit point
  spellDmgPerSpr:   2.0,   // % spell damage per spirit point
  critPerDex:       0.6,   // % crit chance per dexterity
  rangePerDex:      0.05,  // meters per dexterity (attack range)
  dotDmgPerElem:    3.0,   // % DoT/elemental spell damage per elemental
  elemDefPerElem:   1.5,   // flat elemental defense per elemental
};

// Default player starting stats (level 1)
export const DEFAULT_PLAYER_STATS = {
  strength:  3,
  hp:        5,
  spirit:    2,
  dexterity: 2,
  elemental: 0,
};

// Compute final combat-ready stats from base stats + equipment multipliers.
// equipment = array of { strength_mult, hp_mult, spirit_mult, dexterity_mult, elemental_mult }
// haloBonuses = optional { strength, dexterity, vitality, spirit, criticalDefense, criticalChance }
//   — flat additive points that stack BEFORE equipment multipliers, so equipment
//   scales WITH the halo gains. criticalDefense / criticalChance are passed through
//   as derived-stat additions.
// titleBonuses = optional { strength, vitality, dexterity, spirit, defense, criticalDefense, hp }
//   — flat additive bonuses from the equipped Title. Stack into the base alongside
//   halo so equipment scales with them too. `defense` and `hp` are added to derived
//   values post-rate; `criticalDefense` stacks with halo's criticalDefense.
export function computeDerivedStats(baseStats, equipment = [], haloBonuses = null, titleBonuses = null) {
  const totals = {
    strength_mult:  0,
    hp_mult:        0,
    spirit_mult:    0,
    dexterity_mult: 0,
    elemental_mult: 0,
  };
  equipment.forEach((eq) => {
    if (!eq) return;
    totals.strength_mult  += eq.strength_mult  || 0;
    totals.hp_mult        += eq.hp_mult        || 0;
    totals.spirit_mult    += eq.spirit_mult    || 0;
    totals.dexterity_mult += eq.dexterity_mult || 0;
    totals.elemental_mult += eq.elemental_mult || 0;
  });

  // Halo + Title provide flat stat-point additions that stack into the base
  // before equipment multipliers apply, so gear scales WITH them.
  const halo  = haloBonuses  || { strength: 0, dexterity: 0, vitality: 0, spirit: 0, criticalDefense: 0, criticalChance: 0 };
  const title = titleBonuses || { strength: 0, dexterity: 0, vitality: 0, spirit: 0, criticalDefense: 0, defense: 0, hp: 0 };
  const baseStr  = (baseStats.strength  || 0) + (halo.strength  || 0) + (title.strength  || 0);
  const baseVit  = (baseStats.hp        || 0) + (halo.vitality  || 0) + (title.vitality  || 0);
  const baseSpr  = (baseStats.spirit    || 0) + (halo.spirit    || 0) + (title.spirit    || 0);
  const baseDex  = (baseStats.dexterity || 0) + (halo.dexterity || 0) + (title.dexterity || 0);
  const baseElem = (baseStats.elemental || 0);

  // Effective invested values (base + halo + equipment bonus rounded down)
  const effStr  = baseStr  + Math.floor(baseStr  * totals.strength_mult);
  const effVit  = baseVit  + Math.floor(baseVit  * totals.hp_mult);
  const effSpr  = baseSpr  + Math.floor(baseSpr  * totals.spirit_mult);
  const effDex  = baseDex  + Math.floor(baseDex  * totals.dexterity_mult);
  const effElem = baseElem + Math.floor(baseElem * totals.elemental_mult);

  const physDmg = effStr  * STAT_RATES.strength;
  // Title contributes flat HP and flat defense on top of derived values.
  const maxHP   = effVit  * STAT_RATES.hp        + (title.hp      || 0);
  const chi     = effSpr  * STAT_RATES.spirit;
  const defense = effDex  * STAT_RATES.dexterity + (title.defense || 0);
  const elemDmg = effElem * STAT_RATES.elemental;

  // Secondary stats
  const hitChance      = Math.min(95,
    50 + effStr * SECONDARY_RATES.hitPerStr + effVit * SECONDARY_RATES.hitPerVit);
  // Base 10% crit chance for everyone, plus dexterity scaling, plus Halo additive crit bonus.
  const critChance     = Math.min(75, 10 + effDex * SECONDARY_RATES.critPerDex + (halo.criticalChance || 0));
  // Critical Defense — % reduction applied to enemy crit damage when this player is HIT by a crit.
  // 0 = no reduction, 1.0 = fully negates crit damage. Halo + Title stack additively here.
  const criticalDefense = (halo.criticalDefense || 0) + (title.criticalDefense || 0);
  const attackRange    = 2.0 + effDex * SECONDARY_RATES.rangePerDex;
  const hpRegen        = effVit * SECONDARY_RATES.hpRegenPerVit;       // HP / sec
  const manaRegen      = effSpr * SECONDARY_RATES.manaRegenPerSpr;     // mana / sec
  const spellDamagePct = effSpr * SECONDARY_RATES.spellDmgPerSpr;      // % bonus to ALL spell damage
  const dotDamagePct   = effElem * SECONDARY_RATES.dotDmgPerElem;      // % bonus to DoT / elemental spells
  const elementalDefense = effElem * SECONDARY_RATES.elemDefPerElem;
  const damageRollBonus  = effStr * SECONDARY_RATES.dmgRollPerStr;     // % variance roll bonus

  return {
    physicalDamage: physDmg,
    elementalDamage: elemDmg,
    totalDamage: physDmg + elemDmg,
    // alias used by GameWorld3D ability damage scaling
    damage: physDmg + elemDmg,
    maxHP,
    chi,
    defense,
    // Secondary
    hitChance,
    critChance,
    attackRange,
    hpRegen,
    manaRegen,
    spellDamagePct,
    dotDamagePct,
    elementalDefense,
    damageRollBonus,
    criticalDefense,
  };
}

// Damage calc — dealt damage is reduced by defender's defense (min 1).
// If the attacker rolls a crit (based on their critChance %), damage is x2 and
// the returned object includes `crit: true` so the world can display it specially.
// Backward compatible: callers that destructure a number still work because we
// return a Number-coerced primitive when there's no crit. To keep the call sites
// simple, we ALWAYS return a number — crits are encoded by attaching a `.crit`
// flag on the result via a thin wrapper object only when explicitly asked.
// Crit multiplier — 3× damage on a critical strike (i.e. +150% over a base x2 hit).
export const CRIT_MULTIPLIER = 3;

export function calculateHit(attackerStats, defenderStats) {
  let raw = attackerStats.totalDamage;
  const crit = Math.random() * 100 < (attackerStats.critChance || 0);
  if (crit) raw = Math.round(raw * CRIT_MULTIPLIER);
  const reduced = Math.max(1, raw - (defenderStats?.defense || 0));
  return reduced;
}

// Crit-aware variant — returns { damage, crit } so the UI can color crits.
// Defender's `criticalDefense` (from Halo) reduces the EXTRA crit damage on top
// of the base hit. 1.0 = fully negates the crit multiplier (crit deals same as a normal hit).
// >1.0 is clamped to 1.0 so a crit can never deal LESS than a normal hit.
export function calculateHitWithCrit(attackerStats, defenderStats) {
  const crit = Math.random() * 100 < (attackerStats.critChance || 0);
  let raw = attackerStats.totalDamage;
  if (crit) {
    const critBonus = raw * (CRIT_MULTIPLIER - 1);
    const defReduction = Math.max(0, Math.min(1, defenderStats?.criticalDefense || 0));
    const mitigatedBonus = critBonus * (1 - defReduction);
    raw = Math.round(raw + mitigatedBonus);
  }
  const damage = Math.max(1, raw - (defenderStats?.defense || 0));
  return { damage, crit };
}

// Spell damage scaling — applies spirit (all spells) and elemental (DoT/elemental) bonuses.
// `isDoT` flags damage-over-time / elemental spells, which get the extra elemental bonus.
export function applySpellScaling(baseDamage, attackerDerived, { isDoT = false, isElemental = true } = {}) {
  const spirit = attackerDerived.spellDamagePct || 0;
  const elem   = (isDoT || isElemental) ? (attackerDerived.dotDamagePct || 0) : 0;
  const totalPct = spirit + elem;
  return Math.round(baseDamage * (1 + totalPct / 100));
}

// Enemy stat templates by tier — scales with the same system.
// Normal mob ~ a level-1 player. Champions are like investing 5-6 points.
export const ENEMY_STAT_TEMPLATES = {
  normal:   { strength: 2, hp: 2,  spirit: 1, dexterity: 1, elemental: 0 },
  elite:    { strength: 4, hp: 4,  spirit: 2, dexterity: 2, elemental: 1 },
  champion: { strength: 6, hp: 7,  spirit: 3, dexterity: 3, elemental: 2 },
};