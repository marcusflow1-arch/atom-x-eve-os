type Row = Record<string, any>;

const numericModifier = (value: any) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function cardCombatPower(progression: Row | null | undefined) {
  const p = progression || {};
  const level = Math.max(1, Number(p.level || 1));
  const stage = Math.max(1, Number(p.stage || 1));
  const ascension = Math.max(0, Number(p.ascension || 0));
  const overEnchant = Math.max(0, Number(p.over_enchant_rank || 0));
  const enhanced = p.enhanced_stats || {};
  const base = p.base_stats || {};

  const enchantOffense = (p.enchantments || []).reduce((sum: number, enchant: Row) => {
    const mods = enchant?.modifiers || {};
    return sum
      + numericModifier(mods.attack)
      + numericModifier(mods.damage)
      + numericModifier(mods.strength)
      + numericModifier(mods.magic) * 0.5
      + numericModifier(mods.spirit) * 0.5;
  }, 0);
  const enhancedOffense = numericModifier(enhanced.attack) + numericModifier(enhanced.magic) * 0.5;
  const baselineOffense = Math.max(20, numericModifier(base.attack) + numericModifier(base.magic) * 0.5);
  const forgeScale = Math.max(0, (enhancedOffense + enchantOffense) / baselineOffense);
  const nodes = new Set((p.unlocked_skill_nodes || []).map(String));
  const nodeScale = (nodes.has('core_calibration') ? 0.03 : 0) + (nodes.has('avatar_sync') ? 0.05 : 0);

  // Mirrors the progression service's milestone weights, then adds offensive
  // forge/enchantment growth. PvP freezes this multiplier with the card so the
  // exact upgraded state seen in Cards/Skill Book is the state used in battle.
  const multiplier = Math.min(6, Math.max(1,
    1
    + (level - 1) * 0.055
    + (stage - 1) * 0.12
    + ascension * 0.18
    + overEnchant * 0.05
    + forgeScale
    + nodeScale
  ));

  return {
    multiplier: Math.round(multiplier * 1000) / 1000,
    bonus_percent: Math.round((multiplier - 1) * 100),
    level,
    stage,
    ascension,
    over_enchant_rank: overEnchant,
    power_score: Number(p.power_score || 0),
  };
}

export function effectiveCardDamage(baseDamage: any, progression: Row | null | undefined) {
  const base = Math.max(0, Number(baseDamage || 0));
  const combat = cardCombatPower(progression);
  return { ...combat, base_damage: base, effective_damage: Math.round(base * combat.multiplier) };
}
