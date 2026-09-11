// TwelveSky-style combat stat model for Mines.
// Canonical player attributes are the original four pillars:
//   Strength  -> weapon attack + attack success
//   Agility   -> defense + evasion
//   Vitality  -> HP + evasion
//   Spirit    -> chi + weapon attack
//
// The engine still exposes legacy aliases (dexterity/constitution/focus) so
// older Atom XE systems continue to work while the wider migration proceeds.

export const STAT_RATES = Object.freeze({
  strengthAttack: 2.65,
  strengthAttackSuccess: 1.71,
  agilityDefense: 1.63,
  agilityEvasion: 1.67,
  vitalityHP: 20,
  vitalityEvasion: 0.90,
  spiritAttack: 1.43,
  spiritChi: 15.31,
});

export const SECONDARY_RATES = Object.freeze({
  hpRegenPerVitality: 0.12,
  chiRegenPerSpirit: 0.22,
  critPerAgility: 0.08,
  attackSpeedPerAgility: 0.10,
  criticalDefensePerVitality: 0.0007,
});

export const DEFAULT_PLAYER_STATS = Object.freeze({
  strength: 3,
  dexterity: 2,      // Agility compatibility key
  constitution: 5,   // Vitality compatibility key
  focus: 2,          // Spirit compatibility key
});

export function migrateBaseStats(stats) {
  if (!stats || typeof stats !== 'object') return { ...DEFAULT_PLAYER_STATS };
  const strength = Number.isFinite(stats.strength) ? stats.strength : DEFAULT_PLAYER_STATS.strength;
  const agility = Number.isFinite(stats.agility)
    ? stats.agility
    : Number.isFinite(stats.dexterity) ? stats.dexterity : DEFAULT_PLAYER_STATS.dexterity;
  const vitality = Number.isFinite(stats.vitality)
    ? stats.vitality
    : Number.isFinite(stats.constitution) ? stats.constitution
      : Number.isFinite(stats.hp) ? stats.hp : DEFAULT_PLAYER_STATS.constitution;
  // Older Atom XE saves split magic between Focus/Spirit and Intelligence.
  // Fold any old INT investment into Spirit once so players do not lose points.
  const legacySpirit = Number.isFinite(stats.spirit)
    ? stats.spirit
    : Number.isFinite(stats.focus) ? stats.focus : DEFAULT_PLAYER_STATS.focus;
  const oldInt = Number.isFinite(stats.intelligence) ? Math.max(0, stats.intelligence) : 0;
  return {
    strength: Math.max(0, strength),
    dexterity: Math.max(0, agility),
    constitution: Math.max(0, vitality),
    focus: Math.max(0, legacySpirit + oldInt),
  };
}

function normalizeAttributeBonuses(input = {}) {
  return {
    strength: input.strength || 0,
    agility: input.agility ?? input.dexterity ?? 0,
    vitality: input.vitality ?? input.constitution ?? 0,
    spirit: input.spirit ?? input.focus ?? 0,
    critChance: input.criticalChance || input.critChance || 0,
    criticalDefense: input.criticalDefense || 0,
    criticalDamage: input.criticalDamage || input.critDamage || 0,
    attributionAttackPct: input.attributionAttackPct || 0,
    attributionDefensePct: input.attributionDefensePct || 0,
  };
}

function aggregateEquipment(equipment = []) {
  const out = {
    strengthMult: 0,
    agilityMult: 0,
    vitalityMult: 0,
    spiritMult: 0,
    flatAttack: 0,
    flatDefense: 0,
    flatHP: 0,
    flatChi: 0,
    hit: 0,
    block: 0,
    critical: 0,
  };
  equipment.forEach((eq) => {
    if (!eq) return;
    out.strengthMult += eq.strength_mult || 0;
    out.agilityMult += eq.agility_mult || eq.dexterity_mult || 0;
    out.vitalityMult += eq.vitality_mult || eq.constitution_mult || eq.hp_mult || 0;
    out.spiritMult += eq.spirit_mult || eq.focus_mult || eq.intelligence_mult || 0;
    out.flatAttack += eq.attackPower || eq.attack_power || eq.damage || 0;
    out.flatDefense += eq.defensePower || eq.defense_power || eq.defense || 0;
    out.flatHP += eq.hp || eq.maxHP || 0;
    out.flatChi += eq.chi || eq.mana || 0;
    out.hit += eq.attackSuccess || eq.attack_success || 0;
    out.block += eq.attackBlock || eq.attack_block || 0;
    out.critical += eq.critical || eq.critChance || 0;
  });
  return out;
}

export function computeDerivedStats(baseStats, equipment = [], attributeBonuses = null, flatBonuses = null) {
  const base = migrateBaseStats(baseStats);
  const bonus = normalizeAttributeBonuses(attributeBonuses || {});
  const flat = flatBonuses || {};
  const gear = aggregateEquipment(equipment);

  const rawStrength = base.strength + bonus.strength;
  const rawAgility = base.dexterity + bonus.agility;
  const rawVitality = base.constitution + bonus.vitality;
  const rawSpirit = base.focus + bonus.spirit;

  const strength = rawStrength * (1 + gear.strengthMult);
  const agility = rawAgility * (1 + gear.agilityMult);
  const vitality = rawVitality * (1 + gear.vitalityMult);
  const spirit = rawSpirit * (1 + gear.spiritMult);

  const baseAttack = strength * STAT_RATES.strengthAttack
    + spirit * STAT_RATES.spiritAttack
    + gear.flatAttack
    + (flat.damage || 0);
  const attributionAttackPct = bonus.attributionAttackPct || 0;
  const attributionDefensePct = bonus.attributionDefensePct || 0;
  const totalDamage = Math.max(1, Math.round(baseAttack * (1 + attributionAttackPct / 100)));

  const rawDefense = agility * STAT_RATES.agilityDefense + gear.flatDefense + (flat.defense || 0);
  const defense = Math.max(0, rawDefense * (1 + attributionDefensePct / 100));
  const maxHP = Math.max(1, Math.round(vitality * STAT_RATES.vitalityHP + gear.flatHP + (flat.hp || 0)));
  const chi = Math.max(0, Math.round(spirit * STAT_RATES.spiritChi + gear.flatChi));

  const attackSuccess = strength * STAT_RATES.strengthAttackSuccess + gear.hit;
  const attackBlock = agility * STAT_RATES.agilityEvasion + vitality * STAT_RATES.vitalityEvasion + gear.block;
  const hitChance = Math.max(5, Math.min(98, 75 + (attackSuccess - attackBlock) * 0.12));
  const evasionPct = Math.max(0, Math.min(70, attackBlock * 0.08));
  const critChance = Math.max(0, Math.min(75,
    5 + agility * SECONDARY_RATES.critPerAgility + gear.critical + bonus.critChance + (flat.critChance || 0)));
  const criticalDefense = Math.max(0,
    bonus.criticalDefense + (flat.criticalDefense || 0) + vitality * SECONDARY_RATES.criticalDefensePerVitality);
  const criticalDamage = Math.max(0, bonus.criticalDamage + (flat.critDamage || 0));

  const hpRegen = vitality * SECONDARY_RATES.hpRegenPerVitality;
  const manaRegen = spirit * SECONDARY_RATES.chiRegenPerSpirit;
  const attackSpeedPct = agility * SECONDARY_RATES.attackSpeedPerAgility;

  return {
    physicalDamage: totalDamage,
    elementalDamage: 0,
    totalDamage,
    damage: totalDamage,
    maxHP,
    chi,
    defense,
    attackSuccess,
    attackBlock,
    hitChance,
    critChance,
    attackRange: 2.0,
    attackSpeedPct,
    evasionPct,
    hpRegen,
    manaRegen,
    skillPowerPct: spirit * 0.35,
    cooldownReductionPct: 0,
    spellDamagePct: spirit * 0.35,
    dotDamagePct: 0,
    elementalDefense: attributionDefensePct,
    damageRollBonus: strength * 0.10,
    criticalDefense,
    criticalDamage,
    attributionAttackPct,
    attributionDefensePct,
    effective: {
      strength: Math.round(strength),
      agility: Math.round(agility),
      vitality: Math.round(vitality),
      spirit: Math.round(spirit),
      // compatibility aliases
      dexterity: Math.round(agility),
      constitution: Math.round(vitality),
      focus: Math.round(spirit),
      intelligence: 0,
    },
  };
}

export const CRIT_MULTIPLIER = 3;

function mitigate(raw, defenderStats) {
  const defense = defenderStats?.defense || 0;
  return Math.max(1, Math.round(raw - defense));
}

export function calculateHit(attackerStats, defenderStats) {
  let raw = attackerStats.totalDamage || attackerStats.damage || 1;
  const crit = Math.random() * 100 < (attackerStats.critChance || 0);
  if (crit) {
    const critMult = CRIT_MULTIPLIER + (attackerStats.criticalDamage || 0);
    const bonus = raw * (critMult - 1);
    const critDefense = Math.max(0, Math.min(1, defenderStats?.criticalDefense || 0));
    raw += bonus * (1 - critDefense);
  }
  return mitigate(raw, defenderStats);
}

export function calculateHitWithCrit(attackerStats, defenderStats) {
  const crit = Math.random() * 100 < (attackerStats.critChance || 0);
  let raw = attackerStats.totalDamage || attackerStats.damage || 1;
  if (crit) {
    const critMult = CRIT_MULTIPLIER + (attackerStats.criticalDamage || 0);
    const bonus = raw * (critMult - 1);
    const critDefense = Math.max(0, Math.min(1, defenderStats?.criticalDefense || 0));
    raw += bonus * (1 - critDefense);
  }
  return { damage: mitigate(raw, defenderStats), crit };
}

export function applySpellScaling(baseDamage, attackerDerived) {
  const spiritPct = attackerDerived?.skillPowerPct || attackerDerived?.spellDamagePct || 0;
  return Math.max(1, Math.round(baseDamage * (1 + spiritPct / 100)));
}

export const ENEMY_STAT_TEMPLATES = Object.freeze({
  normal:   { strength: 2, dexterity: 1, constitution: 2, focus: 1 },
  elite:    { strength: 4, dexterity: 2, constitution: 4, focus: 2 },
  champion: { strength: 6, dexterity: 3, constitution: 7, focus: 3 },
});
