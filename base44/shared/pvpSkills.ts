export const SKILL_SLOT_COUNT = 4;
export const ATB_RATE_PER_S = 25;
export const ATB_MAX = 100;
export const ATB_START = 50;
export const DODGE = { atb_cost: 20, cooldown_ms: 2000, window_ms: 350 } as const;

export const SKILL_STATS: Record<string, any> = {
  getsuga_tensho: { kind: 'Ranged wave', range_m: 18, atb_cost: 50, cooldown_ms: 8000, base_damage: 120, hit_ms: 900 },
  artemis_call_of_the_husky: { kind: 'Spirit charge', range_m: 18, atb_cost: 50, cooldown_ms: 7000, base_damage: 110, hit_ms: 1500 },
  artemis_rain_of_arrows: { kind: 'Area volley', range_m: 18, atb_cost: 60, cooldown_ms: 8500, base_damage: 130, hit_ms: 1970 },
  artemis_lunar_beam: { kind: 'Heavy beam', range_m: 18, atb_cost: 75, cooldown_ms: 10000, base_damage: 180, hit_ms: 3100 },
};

export const BASIC_BY_RARITY = {
  range_m: 3,
  atb_cost: 25,
  cooldown_ms: 3000,
  hit_ms: 400,
  base_damage: { Common: 40, Uncommon: 50, Rare: 60, Epic: 80, Legendary: 100, Mythic: 110, Unique: 120 },
} as const;

export function atbNow(row: any, nowMs = Date.now()) {
  if (!row) return ATB_START;
  const at = Date.parse(row.at || '') || nowMs;
  return Math.min(ATB_MAX, Math.max(0, Number(row.value || 0) + ((nowMs - at) / 1000) * ATB_RATE_PER_S));
}

export function skillStats(effectId: string, rarity = 'Common') {
  if (effectId && SKILL_STATS[effectId]) return SKILL_STATS[effectId];
  return { ...BASIC_BY_RARITY, base_damage: BASIC_BY_RARITY.base_damage[rarity as keyof typeof BASIC_BY_RARITY.base_damage] || 40, kind: 'Basic strike' };
}
