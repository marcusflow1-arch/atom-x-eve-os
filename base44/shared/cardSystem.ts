type Row = Record<string, any>;

export const CARD_SYSTEM_VERSION = 2;
export const ENHANCEMENT_CAP = 120;
export const ASCENSION_CAP = 5;
export const STACK_CAP = 4;

// The architecture specification defines the progression shape but not the
// tuning values. Keep all tuning here so balance can change without changing
// the progression contract.
export const CARD_BALANCE = {
  enhancementPowerPerPercent: 0.002,
  stackPowerPerLevel: 0.12,
  materialValueByRarity: {
    Common: 4,
    Uncommon: 8,
    Unique: 16,
  } as Record<string, number>,
};

export const PLAYABLE_TIERS = [
  'Rare',
  'Epic',
  'Legendary',
  'Demigod',
  'Mythical',
  'Deity',
  'Chosen',
] as const;

export const MATERIAL_TIERS = ['Common', 'Uncommon', 'Unique'] as const;

const finite = (value: any, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
const clamp = (value: any, min: number, max: number) => Math.min(max, Math.max(min, finite(value, min)));
const rounded = (value: number) => Math.round(value * 100) / 100;

export function legacyPowerMultiplier(p: Row = {}) {
  const level = clamp(p.level ?? 1, 1, 60);
  const stage = clamp(p.stage ?? 1, 1, 5);
  const ascension = clamp(p.ascension ?? 0, 0, ASCENSION_CAP);
  const overEnchant = clamp(p.over_enchant_rank ?? 0, 0, 5);
  const skillNodes = Array.isArray(p.unlocked_skill_nodes) ? p.unlocked_skill_nodes : [];
  return rounded(Math.min(6,
    1
    + (level - 1) * 0.055
    + (stage - 1) * 0.12
    + ascension * 0.18
    + overEnchant * 0.05
    + (skillNodes.includes('core_calibration') ? 0.03 : 0)
    + (skillNodes.includes('avatar_sync') ? 0.05 : 0),
  ));
}

export function normalizeProgression(p: Row | null = null) {
  const source = p || {};
  const migrated = Number(source.system_version || 0) < CARD_SYSTEM_VERSION;
  const permanentStats = source.permanent_stats && typeof source.permanent_stats === 'object'
    ? source.permanent_stats
    : { ...(source.enhanced_stats || {}) };
  const currentCycleStats = source.current_cycle_stats && typeof source.current_cycle_stats === 'object'
    ? source.current_cycle_stats
    : {};
  return {
    ...source,
    system_version: CARD_SYSTEM_VERSION,
    enhancement_percent: clamp(source.enhancement_percent ?? 0, 0, ENHANCEMENT_CAP),
    ascension: clamp(source.ascension ?? 0, 0, ASCENSION_CAP),
    stack_level: clamp(source.stack_level ?? Math.min(STACK_CAP, Math.max(1, finite(source.stage, 1))), 1, STACK_CAP),
    permanent_stats: permanentStats,
    current_cycle_stats: currentCycleStats,
    migration_power_multiplier: Math.max(1, finite(source.migration_power_multiplier, migrated ? legacyPowerMultiplier(source) : 1)),
    mastery_visual: source.mastery_visual || (clamp(source.ascension ?? 0, 0, ASCENSION_CAP) >= ASCENSION_CAP ? 'holographic_3d' : 'standard'),
    migrated_from_legacy: Boolean(source.migrated_from_legacy || migrated),
  };
}

export function enhancementMaterialValue(material: Row = {}) {
  const explicit = finite(material.enhancement_value, 0);
  if (explicit > 0) return Math.max(1, Math.round(explicit));
  const rarity = String(material.rarity || '');
  const canonical = CARD_BALANCE.materialValueByRarity[rarity];
  if (canonical) return canonical;
  // Compatibility for pre-v2 enhancement materials. New materials should use
  // Common / Uncommon / Unique and can set enhancement_value explicitly.
  if (String(material.use_category || '').toLowerCase() === 'enhancement') {
    return Math.max(1, Math.round(clamp(material.quality ?? 1, 1, 5) * 4));
  }
  return 0;
}

export function isEnhancementMaterial(material: Row = {}) {
  return enhancementMaterialValue(material) > 0;
}

export function cycleStatGain(baseStats: Row = {}, percentGain: number) {
  const ratio = Math.max(0, finite(percentGain)) * CARD_BALANCE.enhancementPowerPerPercent;
  const out: Row = {};
  for (const [key, value] of Object.entries(baseStats || {})) {
    const n = finite(value);
    if (n > 0) out[key] = rounded(n * ratio);
  }
  return out;
}

export function addStats(a: Row = {}, b: Row = {}) {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  return Object.fromEntries([...keys].map((key) => [key, rounded(finite(a?.[key]) + finite(b?.[key]))]));
}

export function cardStatMultiplier(progression: Row | null = null) {
  const p = normalizeProgression(progression);
  const stack = (finite(p.stack_level, 1) - 1) * CARD_BALANCE.stackPowerPerLevel;
  return rounded(Math.max(1, finite(p.migration_power_multiplier, 1)) * (1 + stack));
}

export function cardGrowthMultiplier(progression: Row | null = null) {
  // Enhancement strength lives in current_cycle_stats and permanent_stats.
  // Keeping it out of this multiplier guarantees that Ascension's 120% -> 0%
  // gauge reset never removes damage or attributes already earned.
  return cardStatMultiplier(progression);
}

export function cardMasteryState(progression: Row | null = null) {
  const p = normalizeProgression(progression);
  return {
    enhancement_percent: p.enhancement_percent,
    enhancement_cap: ENHANCEMENT_CAP,
    ascension: p.ascension,
    ascension_cap: ASCENSION_CAP,
    stack_level: p.stack_level,
    stack_cap: STACK_CAP,
    can_ascend: p.enhancement_percent >= ENHANCEMENT_CAP && p.ascension < ASCENSION_CAP,
    mastered: p.ascension >= ASCENSION_CAP,
    holographic: p.ascension >= ASCENSION_CAP,
    visual_tier: p.ascension >= ASCENSION_CAP ? 'holographic_3d' : `ascension_${p.ascension}`,
  };
}

export function playableTierName(card: Row = {}) {
  const explicit = String(card.playable_tier || card.mastery_tier || '');
  if (PLAYABLE_TIERS.includes(explicit as any)) return explicit;
  const rarity = String(card.card_rarity || card.rarity || 'Rare');
  if (PLAYABLE_TIERS.includes(rarity as any)) return rarity;
  // Legacy playable rarities remain valid records. New published playable cards
  // should use the seven-tier specification above.
  return rarity;
}
