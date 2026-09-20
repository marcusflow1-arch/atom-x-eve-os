// AXE Prompt 021 — Set 2 / Set 3 / Set 4 / Set 5 equipment bonuses.
// Set identity, grade and activation thresholds are separate concepts so Rare,
// Elite and Heroic versions can share a family without sharing balance values.

export const AXE_SET_GRADES = Object.freeze(['rare', 'elite', 'heroic']);

export const AXE_SET_DEFINITIONS = Object.freeze({
  AXE_Set_StarterVanguard: Object.freeze({
    id: 'AXE_Set_StarterVanguard',
    name: 'Vanguard',
    allowedGrades: AXE_SET_GRADES,
    allowMixedGrades: false,
    thresholds: Object.freeze({
      2: Object.freeze({ defense: 8, maxHP: 30 }),
      3: Object.freeze({ attack: 6, critDefense: 1 }),
      4: Object.freeze({ strength: 2, vitality: 2 }),
      5: Object.freeze({ attackPct: 5, defensePct: 5 }),
    }),
  }),
  AXE_Set_HeavenlyPath: Object.freeze({
    id: 'AXE_Set_HeavenlyPath',
    name: 'Heavenly Path',
    allowedGrades: Object.freeze(['elite', 'heroic']),
    allowMixedGrades: true,
    thresholds: Object.freeze({
      2: Object.freeze({ maxHPPct: 4 }),
      3: Object.freeze({ critChance: 1.5, critDefense: 1.5 }),
      4: Object.freeze({ spirit: 3, maxChi: 20 }),
      5: Object.freeze({ attackPct: 8, defensePct: 8 }),
    }),
  }),
});

export function getAXESetDefinition(setId) {
  return AXE_SET_DEFINITIONS[setId] || null;
}

const addStats = (target, source = {}) => {
  for (const [key, raw] of Object.entries(source)) {
    const value = Number(raw);
    if (!Number.isFinite(value)) continue;
    target[key] = (target[key] || 0) + value;
  }
  return target;
};

export function evaluateAXESetBonuses(items = []) {
  const groups = new Map();

  for (const item of items) {
    if (!item?.equipped || !item.setId) continue;
    const def = getAXESetDefinition(item.setId);
    if (!def) continue;

    const grade = String(item.rarity || '').toLowerCase();
    if (!def.allowedGrades.includes(grade)) continue;

    const key = def.allowMixedGrades ? item.setId : `${item.setId}::${grade}`;
    const current = groups.get(key) || {
      setId: item.setId,
      grade: def.allowMixedGrades ? 'mixed' : grade,
      count: 0,
      itemIds: [],
      definition: def,
    };

    current.count += 1;
    current.itemIds.push(item.instanceId || item.id);
    groups.set(key, current);
  }

  const activeSets = [];
  const stats = {};

  for (const group of groups.values()) {
    const activeThresholds = [];
    for (const threshold of [2, 3, 4, 5]) {
      const bonus = group.definition.thresholds[threshold];
      if (group.count >= threshold && bonus) {
        activeThresholds.push(threshold);
        addStats(stats, bonus);
      }
    }
    activeSets.push({
      setId: group.setId,
      setName: group.definition.name,
      grade: group.grade,
      equippedPieces: group.count,
      itemIds: group.itemIds,
      activeThresholds,
      nextThreshold: [2, 3, 4, 5].find((n) => n > group.count) || null,
    });
  }

  return { stats, activeSets };
}

export function describeAXESetProgress(item, equippedItems = []) {
  if (!item?.setId) return null;
  const def = getAXESetDefinition(item.setId);
  if (!def) return null;

  const relevant = equippedItems.filter((candidate) => {
    if (!candidate?.equipped || candidate.setId !== item.setId) return false;
    if (def.allowMixedGrades) return true;
    return String(candidate.rarity || '').toLowerCase() === String(item.rarity || '').toLowerCase();
  });

  const count = relevant.length;
  return {
    setId: def.id,
    name: def.name,
    equippedPieces: count,
    thresholds: [2, 3, 4, 5].map((threshold) => ({
      threshold,
      active: count >= threshold,
      bonus: def.thresholds[threshold] || null,
    })),
  };
}
