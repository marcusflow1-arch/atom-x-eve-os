// One percentage pool per stat (docs/game3d/STAT_SYSTEM_AUDIT.md §4.1). Every "+x% damage"
// from every system is added together and applied once, so a new system adds to the
// others instead of multiplying all of them. Only the Ascension Nature and timed combat
// buffs stay true multipliers.
export const AXE_POOL_STATS = Object.freeze(['damagePct', 'defensePct', 'hpPct', 'chiPct']);

export function sumAXEPercentPools(...sources) {
  const out = { damagePct: 0, defensePct: 0, hpPct: 0, chiPct: 0 };
  for (const s of sources) {
    if (!s) continue;
    for (const k of AXE_POOL_STATS) out[k] += Number(s[k]) || 0;
  }
  return out;
}

// pool values are percentages (+10 = +10%); a negative pool never takes a stat below 5%
export function applyAXEPercentPool(derived, pool = {}) {
  if (!derived) return derived;
  const mult = (k) => Math.max(0.05, 1 + (Number(pool[k]) || 0) / 100);
  const dmg = mult('damagePct');
  const damage = Math.max(1, Math.round(Number(derived.damage || derived.totalDamage || 1) * dmg));
  return {
    ...derived,
    damage,
    totalDamage: damage,
    physicalDamage: Math.max(1, Math.round(Number(derived.physicalDamage || damage) * dmg)),
    defense: Math.max(0, Number(derived.defense || 0) * mult('defensePct')),
    maxHP: Math.max(1, Math.round(Number(derived.maxHP || 1) * mult('hpPct'))),
    chi: Math.max(0, Math.round(Number(derived.chi || 0) * mult('chiPct'))),
    percentPool: Object.fromEntries(AXE_POOL_STATS.map((k) => [k, Number(pool[k]) || 0])),
  };
}
