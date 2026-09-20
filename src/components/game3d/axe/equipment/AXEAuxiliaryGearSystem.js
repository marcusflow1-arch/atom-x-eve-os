// AXE Prompt 025 — four-piece auxiliary equipment layer.
// Auxiliary gear is a separate layer from the main Set 2/3/4/5 system.

export const AXE_AUXILIARY_CONFIG = Object.freeze({
  maxEquipped: 4,
  slots: Object.freeze(['aux_1', 'aux_2', 'aux_3', 'aux_4']),
});

export const AXE_AUXILIARY_SET_DEFINITIONS = Object.freeze({
  AXE_AuxSet_Skyguard: Object.freeze({
    id: 'AXE_AuxSet_Skyguard',
    name: 'Skyguard Relics',
    thresholds: Object.freeze({
      2: Object.freeze({ maxHP: 20, defense: 4 }),
      3: Object.freeze({ critDefense: 1.25, spirit: 1 }),
      4: Object.freeze({ attack: 5, defense: 5, maxHP: 30 }),
    }),
  }),
  AXE_AuxSet_WarSoul: Object.freeze({
    id: 'AXE_AuxSet_WarSoul',
    name: 'War Soul Relics',
    thresholds: Object.freeze({
      2: Object.freeze({ attack: 4 }),
      3: Object.freeze({ critChance: 1 }),
      4: Object.freeze({ attack: 6, critDamage: 3 }),
    }),
  }),
});

export function getAXEAuxiliarySetDefinition(auxSetId) {
  return AXE_AUXILIARY_SET_DEFINITIONS[auxSetId] || null;
}

const add = (target, source = {}) => {
  for (const [key, raw] of Object.entries(source)) {
    const value = Number(raw);
    if (!Number.isFinite(value)) continue;
    target[key] = (target[key] || 0) + value;
  }
};

export function evaluateAXEAuxiliaryBonuses(items = []) {
  const equipped = items.filter((item) =>
    item?.equipped && (item.slot === 'auxiliary' || item.category === 'auxiliary')
  );

  const baseStats = {};
  for (const item of equipped) {
    add(baseStats, item.baseStats || item.stats || {});
    add(baseStats, item.rolledStats || item.affixes || {});
  }

  const groups = new Map();
  for (const item of equipped) {
    if (!item.auxSetId) continue;
    const def = getAXEAuxiliarySetDefinition(item.auxSetId);
    if (!def) continue;
    const group = groups.get(item.auxSetId) || { definition: def, items: [] };
    group.items.push(item);
    groups.set(item.auxSetId, group);
  }

  const setStats = {};
  const activeSets = [];
  for (const [setId, group] of groups.entries()) {
    const count = group.items.length;
    const activeThresholds = [];
    for (const threshold of [2, 3, 4]) {
      const bonus = group.definition.thresholds[threshold];
      if (count >= threshold && bonus) {
        add(setStats, bonus);
        activeThresholds.push(threshold);
      }
    }
    activeSets.push({
      setId,
      name: group.definition.name,
      equippedPieces: count,
      activeThresholds,
      nextThreshold: [2, 3, 4].find((n) => n > count) || null,
    });
  }

  return { baseStats, setStats, activeSets };
}

export function collectAXEAuxiliaryStats(items = []) {
  const result = evaluateAXEAuxiliaryBonuses(items);
  const total = { ...result.baseStats };
  add(total, result.setStats);
  return total;
}
