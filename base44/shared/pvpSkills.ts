export const SKILL_SLOT_COUNT = 4;
export const ATB_RATE_PER_S = 25;
export const ATB_MAX = 100;
export const ATB_START = 50;
export const DODGE = { atb_cost: 20, cooldown_ms: 2000, window_ms: 350 } as const;
export const BASIC_MELEE = {
  id: 'basic_melee',
  kind: 'Lock-on basic attack',
  // Final-Fantasy-style basic attack: selecting the sword locks onto the
  // opponent and resolves regardless of arena spacing. `range_m` remains a
  // presentation/telemetry value only; the server does not gate the hit by it.
  range_m: 99,
  atb_cost: 50,
  cooldown_ms: 1000,
  hit_ms: 350,
  base_damage: 10,
} as const;

export const SKILL_STATS: Record<string, any> = {
  getsuga_tensho: { kind: 'Ranged wave', range_m: 18, atb_cost: 50, cooldown_ms: 8000, base_damage: 120, hit_ms: 900 },
  artemis_call_of_the_husky: { kind: 'Spirit charge', range_m: 18, atb_cost: 50, cooldown_ms: 7000, base_damage: 110, hit_ms: 1500 },
  artemis_rain_of_arrows: { kind: 'Area volley', range_m: 18, atb_cost: 60, cooldown_ms: 8500, base_damage: 130, hit_ms: 1970 },
  artemis_lunar_beam: { kind: 'Heavy beam', range_m: 18, atb_cost: 75, cooldown_ms: 10000, base_damage: 180, hit_ms: 3100 },
  adam_chidori_attack_01: { kind: 'Lightning rush', range_m: 18, atb_cost: 55, cooldown_ms: 6500, base_damage: 135, hit_ms: 1000 },
  adam_chidori_ultimate: { kind: 'Lightning ultimate', range_m: 18, atb_cost: 80, cooldown_ms: 11000, base_damage: 220, hit_ms: 2000, stun_ms: 2800 },
  artemis_chidori_ultimate: { kind: 'Lightning ultimate', range_m: 18, atb_cost: 80, cooldown_ms: 11000, base_damage: 220, hit_ms: 2000, stun_ms: 2800 },
  // Demo card (Naruto Shippuden: Ultimate Ninja Storm 4 achievement). One card
  // for both bodies: the caster charges for 1.42 s, dashes across the net, and
  // the strike lands at 2.0 s. A clean hit stuns the target (they lose their
  // next turn and cannot act until the stun ends).
  chidori: { kind: 'Lightning dash', range_m: 18, atb_cost: 80, cooldown_ms: 11000, base_damage: 220, hit_ms: 2000, stun_ms: 2800 },
};

export function skillStunMs(effectId: string, skill: Record<string, any> = {}) {
  const declared = Number(skill?.stun_ms ?? skill?.animation_effect?.stun_ms);
  if (Number.isFinite(declared) && declared > 0) return Math.min(6000, declared);
  return Number(SKILL_STATS[String(effectId || '')]?.stun_ms || 0);
}

export const BASIC_BY_RARITY = {
  // Card abilities lock onto the single PvP opponent, exactly like the basic
  // attack. 18 m covers every position on the 12 x 16 m court, so a generic
  // card can never be rejected as "out of range" just because the fighters
  // spawn 10 m apart on opposite sides of the net.
  range_m: 18,
  atb_cost: 25,
  cooldown_ms: 3000,
  hit_ms: 400,
  base_damage: { Common: 40, Uncommon: 50, Rare: 60, Epic: 80, Legendary: 100, Mythic: 110, Unique: 120 },
} as const;

export function atbNow(row: any, nowMs = Date.now()) {
  if (!row) return ATB_START;
  // PvP now supports an explicit turn owner. Turn-state ATB is intentionally
  // frozen: the active player receives a full action meter and the waiting
  // player remains at zero until the turn changes.
  if (typeof row.turn === 'boolean') return Math.min(ATB_MAX, Math.max(0, Number(row.value || 0)));
  const at = Date.parse(row.at || '') || nowMs;
  return Math.min(ATB_MAX, Math.max(0, Number(row.value || 0) + ((nowMs - at) / 1000) * ATB_RATE_PER_S));
}

export function skillStats(effectId: string, rarity = 'Common') {
  if (effectId && SKILL_STATS[effectId]) return SKILL_STATS[effectId];
  return { ...BASIC_BY_RARITY, base_damage: BASIC_BY_RARITY.base_damage[rarity as keyof typeof BASIC_BY_RARITY.base_damage] || 40, kind: 'Basic strike' };
}
