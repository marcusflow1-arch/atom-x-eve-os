// ─────────────────────────────────────────────
// Stat System — single source of truth for player/enemy combat math.
//
// New-World-inspired 5-attribute model:
//
//   STRENGTH     → +physical damage, +hit chance, heavy weapon scaling
//   CONSTITUTION → +max HP, +HP regen, +defense, survivability
//   DEXTERITY    → +crit chance, +attack speed, +evasion, ranged scaling
//   INTELLIGENCE → +elemental damage, +DoT %, magic scaling
//   FOCUS        → +mana pool, +mana regen, +cooldown reduction, +skill power
//
// LEGACY KEY MIGRATION:
//   Older saves used { strength, hp, spirit, dexterity, elemental }.
//   These map 1:1 onto the new model:
//     hp        → constitution
//     spirit    → focus
//     elemental → intelligence
//   `migrateBaseStats()` upgrades any legacy stat block on load.
//
// Equipment acts as a MULTIPLIER on invested stats so gear scales WITH
// your character, not in isolation.
// ─────────────────────────────────────────────

// Per-point conversion rates for the 5 new attributes.
export const STAT_RATES = {
  strength:     3,    // physical dmg per point
  constitution: 20,   // HP per point
  dexterity:    2,    // defense per point (legacy carry — Dex feeds both crit and a touch of defense)
  intelligence: 2,    // elemental dmg per point
  focus:        20,   // mana per point
};

// Secondary derived-stat rates (per invested point)
export const SECONDARY_RATES = {
  hitPerStr:        0.5,   // % hit chance per strength
  hitPerCon:        0.2,   // % hit chance per constitution
  dmgRollPerStr:    0.3,   // % bonus damage variance per strength
  hpRegenPerCon:    0.4,   // HP/sec per constitution
  defPerCon:        1.0,   // flat defense per constitution
  manaRegenPerFoc:  0.5,   // mana/sec per focus
  skillPowerPerFoc: 2.0,   // % skill / spell power per focus
  cooldownPerFoc:   0.15,  // % cooldown reduction per focus (capped)
  critPerDex:       0.6,   // % crit chance per dexterity
  atkSpdPerDex:     0.4,   // % attack speed per dexterity
  evasionPerDex:    0.25,  // % evasion per dexterity
  rangePerDex:      0.05,  // m attack range per dexterity
  dotDmgPerInt:     3.0,   // % DoT / elemental % per intelligence
  elemDefPerInt:    1.5,   // flat elemental defense per intelligence
};

// Default player starting stats (level 1) — using new keys.
export const DEFAULT_PLAYER_STATS = {
  strength:     3,
  constitution: 5,
  dexterity:    2,
  intelligence: 0,
  focus:        2,
};

// One-time migration of legacy { hp, spirit, elemental } keys → new keys.
// Safe to call on every load; new-shape stats pass through untouched.
export function migrateBaseStats(stats) {
  if (!stats || typeof stats !== 'object') return { ...DEFAULT_PLAYER_STATS };
  const out = { ...DEFAULT_PLAYER_STATS };
  // Carry forward known new keys
  ['strength', 'constitution', 'dexterity', 'intelligence', 'focus'].forEach((k) => {
    if (typeof stats[k] === 'number') out[k] = stats[k];
  });
  // Legacy → new
  if (typeof stats.hp === 'number'        && typeof stats.constitution !== 'number') out.constitution = stats.hp;
  if (typeof stats.spirit === 'number'    && typeof stats.focus        !== 'number') out.focus        = stats.spirit;
  if (typeof stats.elemental === 'number' && typeof stats.intelligence !== 'number') out.intelligence = stats.elemental;
  return out;
}

// Compute final combat-ready stats from base stats + equipment multipliers.
// equipment      = array of { strength_mult, constitution_mult, dexterity_mult, intelligence_mult, focus_mult }
//                  (legacy keys hp_mult / spirit_mult / elemental_mult are also accepted for backwards compat)
// haloBonuses    = { strength, constitution|vitality, dexterity, intelligence|elemental, focus|spirit,
//                    criticalDefense, criticalChance } — flat stat-point additions.
//                  Legacy keys (vitality/spirit) are auto-mapped.
// titleBonuses   = same shape as haloBonuses + optional flat `defense` and `hp`.
export function computeDerivedStats(baseStats, equipment = [], haloBonuses = null, titleBonuses = null) {
  // Ensure base is in the new shape.
  const base = migrateBaseStats(baseStats);

  // Aggregate equipment multipliers (accept both new and legacy keys).
  const totals = {
    strength_mult:     0,
    constitution_mult: 0,
    dexterity_mult:    0,
    intelligence_mult: 0,
    focus_mult:        0,
  };
  equipment.forEach((eq) => {
    if (!eq) return;
    totals.strength_mult     += eq.strength_mult     || 0;
    totals.constitution_mult += eq.constitution_mult || eq.hp_mult        || 0;
    totals.dexterity_mult    += eq.dexterity_mult    || 0;
    totals.intelligence_mult += eq.intelligence_mult || eq.elemental_mult || 0;
    totals.focus_mult        += eq.focus_mult        || eq.spirit_mult    || 0;
  });

  // Normalize halo / title bonus key names (accept legacy aliases).
  const normalizeBonus = (b) => {
    const x = b || {};
    return {
      strength:        x.strength     || 0,
      constitution:    x.constitution || x.vitality  || 0,
      dexterity:       x.dexterity    || 0,
      intelligence:    x.intelligence || x.elemental || 0,
      focus:           x.focus        || x.spirit    || 0,
      criticalDefense: x.criticalDefense || 0,
      criticalChance:  x.criticalChance  || 0,
      criticalDamage:  x.criticalDamage  || 0,
      defense:         x.defense || 0,
      hp:              x.hp      || 0,
    };
  };
  const halo  = normalizeBonus(haloBonuses);
  const title = normalizeBonus(titleBonuses);

  // Halo + Title stack into base BEFORE equipment multipliers, so gear scales WITH them.
  const baseStr = base.strength     + halo.strength     + title.strength;
  const baseCon = base.constitution + halo.constitution + title.constitution;
  const baseDex = base.dexterity    + halo.dexterity    + title.dexterity;
  const baseInt = base.intelligence + halo.intelligence + title.intelligence;
  const baseFoc = base.focus        + halo.focus        + title.focus;

  // Apply equipment multiplier on top of the base+halo+title totals.
  const effStr = baseStr + Math.floor(baseStr * totals.strength_mult);
  const effCon = baseCon + Math.floor(baseCon * totals.constitution_mult);
  const effDex = baseDex + Math.floor(baseDex * totals.dexterity_mult);
  const effInt = baseInt + Math.floor(baseInt * totals.intelligence_mult);
  const effFoc = baseFoc + Math.floor(baseFoc * totals.focus_mult);

  // Primary derived combat stats.
  const physDmg = effStr * STAT_RATES.strength;
  const maxHP   = effCon * STAT_RATES.constitution + title.hp;
  const chi     = effFoc * STAT_RATES.focus;
  // Defense draws from Dex (rate) + Con (flat) + title flat defense bonus.
  const defense = effDex * STAT_RATES.dexterity
                + effCon * SECONDARY_RATES.defPerCon
                + title.defense;
  const elemDmg = effInt * STAT_RATES.intelligence;

  // Secondary derived stats.
  const hitChance = Math.min(95,
    50 + effStr * SECONDARY_RATES.hitPerStr + effCon * SECONDARY_RATES.hitPerCon);
  // Base 10% crit chance + Dex scaling + Halo additive crit.
  const critChance = Math.min(75, 10 + effDex * SECONDARY_RATES.critPerDex + halo.criticalChance);
  // Critical Defense — % reduction applied to incoming crit damage (0..1+, clamped at 1 in damage calc).
  const criticalDefense = halo.criticalDefense + title.criticalDefense;
  // Critical Damage — additive multiplier ON TOP of base CRIT_MULTIPLIER.
  // e.g. 0.20 means crits deal (CRIT_MULTIPLIER + 0.20)× damage.
  const criticalDamage  = halo.criticalDamage  + title.criticalDamage;
  const attackRange     = 2.0 + effDex * SECONDARY_RATES.rangePerDex;
  const attackSpeedPct  = effDex * SECONDARY_RATES.atkSpdPerDex;     // % attack-speed bonus
  const evasionPct      = effDex * SECONDARY_RATES.evasionPerDex;    // % dodge
  const hpRegen         = effCon * SECONDARY_RATES.hpRegenPerCon;
  const manaRegen       = effFoc * SECONDARY_RATES.manaRegenPerFoc;
  const skillPowerPct   = effFoc * SECONDARY_RATES.skillPowerPerFoc; // % bonus on all spells/skills
  const cooldownReductionPct = Math.min(40, effFoc * SECONDARY_RATES.cooldownPerFoc); // capped 40%
  const dotDamagePct    = effInt * SECONDARY_RATES.dotDmgPerInt;
  const elementalDefense= effInt * SECONDARY_RATES.elemDefPerInt;
  const damageRollBonus = effStr * SECONDARY_RATES.dmgRollPerStr;

  return {
    // Primary
    physicalDamage: physDmg,
    elementalDamage: elemDmg,
    totalDamage: physDmg + elemDmg,
    damage: physDmg + elemDmg, // alias used by GameWorld3D
    maxHP,
    chi,
    defense,
    // Secondary
    hitChance,
    critChance,
    attackRange,
    attackSpeedPct,
    evasionPct,
    hpRegen,
    manaRegen,
    skillPowerPct,
    cooldownReductionPct,
    spellDamagePct: skillPowerPct, // legacy alias: spirit→focus
    dotDamagePct,
    elementalDefense,
    damageRollBonus,
    criticalDefense,
    criticalDamage,
    // Echo effective invested values for UI live previews.
    effective: {
      strength:     effStr,
      constitution: effCon,
      dexterity:    effDex,
      intelligence: effInt,
      focus:        effFoc,
    },
  };
}

// Damage calc — dealt damage is reduced by defender's defense (min 1).
export const CRIT_MULTIPLIER = 3;

export function calculateHit(attackerStats, defenderStats) {
  let raw = attackerStats.totalDamage;
  const crit = Math.random() * 100 < (attackerStats.critChance || 0);
  if (crit) {
    const critMult = CRIT_MULTIPLIER + (attackerStats.criticalDamage || 0);
    raw = Math.round(raw * critMult);
  }
  const reduced = Math.max(1, raw - (defenderStats?.defense || 0));
  return reduced;
}

// Crit-aware variant — returns { damage, crit } so the UI can color crits.
// Defender's `criticalDefense` reduces ONLY the EXTRA crit damage on top of a normal hit.
// Attacker's `criticalDamage` adds to the crit multiplier (CRIT_MULTIPLIER + criticalDamage).
export function calculateHitWithCrit(attackerStats, defenderStats) {
  const crit = Math.random() * 100 < (attackerStats.critChance || 0);
  let raw = attackerStats.totalDamage;
  if (crit) {
    const critMult = CRIT_MULTIPLIER + (attackerStats.criticalDamage || 0);
    const critBonus = raw * (critMult - 1);
    const defReduction = Math.max(0, Math.min(1, defenderStats?.criticalDefense || 0));
    const mitigatedBonus = critBonus * (1 - defReduction);
    raw = Math.round(raw + mitigatedBonus);
  }
  const damage = Math.max(1, raw - (defenderStats?.defense || 0));
  return { damage, crit };
}

// Spell damage scaling — applies focus (all skills) and intelligence (DoT/elemental) bonuses.
export function applySpellScaling(baseDamage, attackerDerived, { isDoT = false, isElemental = true } = {}) {
  const focusPct = attackerDerived.skillPowerPct || attackerDerived.spellDamagePct || 0;
  const dotPct   = (isDoT || isElemental) ? (attackerDerived.dotDamagePct || 0) : 0;
  const totalPct = focusPct + dotPct;
  return Math.round(baseDamage * (1 + totalPct / 100));
}

// Enemy stat templates by tier — use new key names.
export const ENEMY_STAT_TEMPLATES = {
  normal:   { strength: 2, constitution: 2, dexterity: 1, intelligence: 0, focus: 1 },
  elite:    { strength: 4, constitution: 4, dexterity: 2, intelligence: 1, focus: 2 },
  champion: { strength: 6, constitution: 7, dexterity: 3, intelligence: 2, focus: 3 },
};