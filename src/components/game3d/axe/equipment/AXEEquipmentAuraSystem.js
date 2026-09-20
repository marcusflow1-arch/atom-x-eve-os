// AXE Prompt 023 — equipment Aura system.
// Aura is a small secondary-stat layer attached to individual equipment pieces.
// It is intentionally separate from gems, Core, enchantment and set bonuses.

export const AXE_AURA_STAT_POOL = Object.freeze([
  'critDefense',
  'critChance',
  'critDamage',
  'maxHP',
  'maxChi',
  'attack',
  'defense',
  'accuracy',
  'evasion',
  'attributeAttack',
  'attributeDefense',
]);

export const AXE_AURA_TIERS = Object.freeze([
  Object.freeze({ id: 'aura_1', rank: 1, rolls: 1, valueScale: 1 }),
  Object.freeze({ id: 'aura_2', rank: 2, rolls: 1, valueScale: 1.2 }),
  Object.freeze({ id: 'aura_3', rank: 3, rolls: 2, valueScale: 1.4 }),
  Object.freeze({ id: 'aura_4', rank: 4, rolls: 2, valueScale: 1.7 }),
  Object.freeze({ id: 'aura_5', rank: 5, rolls: 3, valueScale: 2 }),
]);

const BASE_VALUES = Object.freeze({
  critDefense: 0.5,
  critChance: 0.35,
  critDamage: 1,
  maxHP: 10,
  maxChi: 8,
  attack: 2,
  defense: 2,
  accuracy: 1,
  evasion: 1,
  attributeAttack: 2,
  attributeDefense: 2,
});

export function getAXEAuraTier(rank = 1) {
  return AXE_AURA_TIERS.find((tier) => tier.rank === Number(rank)) || AXE_AURA_TIERS[0];
}

export function canApplyAXEAura(item) {
  const slot = item?.slot || item?.category;
  if (!slot) return false;
  return !['costume'].includes(slot);
}

export function rollAXEAura({
  tierRank = 1,
  rng = Math.random,
  lockedEffects = [],
  existingEffects = [],
} = {}) {
  const tier = getAXEAuraTier(tierRank);
  const locked = (existingEffects || []).filter((effect) => lockedEffects.includes(effect.id));
  const available = AXE_AURA_STAT_POOL.filter((stat) => !locked.some((effect) => effect.stat === stat));
  const effects = [...locked];

  while (effects.length < tier.rolls && available.length) {
    const index = Math.floor(Math.max(0, Math.min(0.999999, rng())) * available.length);
    const stat = available.splice(index, 1)[0];
    const spread = 0.85 + Math.max(0, Math.min(1, rng())) * 0.3;
    effects.push({
      id: `axe_aura_${stat}_${effects.length}`,
      stat,
      value: Number(((BASE_VALUES[stat] || 1) * tier.valueScale * spread).toFixed(3)),
    });
  }

  return {
    tierId: tier.id,
    tierRank: tier.rank,
    effects,
  };
}

export function collectAXEAuraStats(aura) {
  const stats = {};
  for (const effect of aura?.effects || []) {
    const value = Number(effect?.value);
    if (!effect?.stat || !Number.isFinite(value)) continue;
    stats[effect.stat] = (stats[effect.stat] || 0) + value;
  }
  return stats;
}

export function upgradeAXEAura(aura = {}) {
  const current = Number(aura.tierRank || 1);
  const next = AXE_AURA_TIERS.find((tier) => tier.rank === current + 1);
  if (!next) return { ok: false, reason: 'MAX_AURA_TIER', aura };
  return {
    ok: true,
    aura: rollAXEAura({
      tierRank: next.rank,
      existingEffects: aura.effects || [],
      lockedEffects: (aura.effects || []).map((effect) => effect.id),
    }),
  };
}
