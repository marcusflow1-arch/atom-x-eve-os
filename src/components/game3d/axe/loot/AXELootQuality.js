// AXE Prompt 017 — rarity, quality bands and bonus-stat rolls.
// Rarity and percentage quality are deliberately separate axes.

export const AXE_RARITIES = Object.freeze({
  common:    Object.freeze({ id: 'common', label: 'Common', rank: 0, weight: 55 }),
  uncommon:  Object.freeze({ id: 'uncommon', label: 'Uncommon', rank: 1, weight: 25 }),
  rare:      Object.freeze({ id: 'rare', label: 'Rare', rank: 2, weight: 12 }),
  elite:     Object.freeze({ id: 'elite', label: 'Elite', rank: 3, weight: 5 }),
  legendary:Object.freeze({ id: 'legendary', label: 'Legendary', rank: 4, weight: 2.5 }),
  heroic:    Object.freeze({ id: 'heroic', label: 'Heroic', rank: 5, weight: 0.5, axeOriginal: true }),
});

export const AXE_QUALITY_BANDS = Object.freeze([
  Object.freeze({ percent: 5,  affixRolls: 0, weight: 48 }),
  Object.freeze({ percent: 10, affixRolls: 1, weight: 30 }),
  Object.freeze({ percent: 15, affixRolls: 2, weight: 17 }),
  Object.freeze({ percent: 20, affixRolls: 3, weight: 5 }),
]);

export const AXE_AFFIX_POOL = Object.freeze([
  { id: 'attack', label: 'Attack', min: 1, max: 8 },
  { id: 'defense', label: 'Defense', min: 1, max: 8 },
  { id: 'hp', label: 'HP', min: 5, max: 40 },
  { id: 'chi', label: 'Chi', min: 3, max: 30 },
  { id: 'critChance', label: 'Critical Chance', min: 0.25, max: 2.5 },
  { id: 'critDamage', label: 'Critical Damage', min: 0.02, max: 0.12 },
  { id: 'criticalDefense', label: 'Critical Defense', min: 0.002, max: 0.02 },
  { id: 'attributeAttack', label: 'Attribute Attack', min: 1, max: 8 },
  { id: 'attributeDefense', label: 'Attribute Defense', min: 1, max: 8 },
]);

function weightedPick(table, rng) {
  const total = table.reduce((sum, row) => sum + Math.max(0, Number(row.weight) || 0), 0);
  if (total <= 0) return table[0] || null;
  let roll = rng() * total;
  for (const row of table) {
    roll -= Math.max(0, Number(row.weight) || 0);
    if (roll <= 0) return row;
  }
  return table[table.length - 1] || null;
}

export function rollAXEQuality(rng = Math.random, tier = 'normal', isBoss = false) {
  const boost = isBoss ? 2 : ['elite', 'miniBoss', 'caveBoss', 'gateBoss', 'worldBoss'].includes(tier) ? 1 : 0;
  const adjusted = AXE_QUALITY_BANDS.map((band, index) => ({
    ...band,
    weight: Math.max(0.1, band.weight * (1 + Math.max(0, index - 1) * boost * 0.45)),
  }));
  return weightedPick(adjusted, rng) || AXE_QUALITY_BANDS[0];
}

export function rollAXEAffixes(count, rng = Math.random, qualityPercent = 5) {
  const available = [...AXE_AFFIX_POOL];
  const results = [];
  for (let i = 0; i < Math.min(Math.max(0, count), available.length); i += 1) {
    const index = Math.floor(rng() * available.length);
    const affix = available.splice(index, 1)[0];
    const t = rng();
    const qualityScale = Math.max(0.25, Number(qualityPercent || 5) / 20);
    const value = (affix.min + (affix.max - affix.min) * t) * qualityScale;
    results.push({
      id: affix.id,
      label: affix.label,
      value: Number(value.toFixed(affix.max < 1 ? 4 : 2)),
    });
  }
  return results;
}

export function finalizeAXEDrop(item, {
  rng = Math.random,
  enemyTier = 'normal',
  isBoss = false,
  authorityTag = 'host-authoritative',
  generatedAt = Date.now(),
} = {}) {
  const quality = rollAXEQuality(rng, enemyTier, isBoss);
  const canRollAffixes = ['gear', 'weapon', 'armor', 'equipment'].includes(item?.category);
  const affixes = canRollAffixes ? rollAXEAffixes(quality.affixRolls, rng, quality.percent) : [];

  return {
    ...item,
    qualityPercent: quality.percent,
    qualityBand: `${quality.percent}%`,
    affixRolls: quality.affixRolls,
    affixes,
    generatedAt,
    authorityTag,
  };
}


export function createAXESeededRng(seedValue = 'axe-loot') {
  const text = String(seedValue);
  let seed = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    seed ^= text.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
