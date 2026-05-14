// Backend store for the equipment menu.
// Holds: equipped abilities (martial arts + inner way + mystic skills),
// gear slots, and talents. Persists to localStorage and notifies subscribers.

const STORAGE_KEY = 'wwm_equipment_state_v1';

// Slot definitions used by the UI. Info text intentionally left blank
// so the layout matches Where Winds Meet without copying its content.
export const GEAR_CATEGORIES = [
  { id: 'weapon',    label: 'Weapon',    slots: 2 },
  { id: 'helm',      label: 'Helm',      slots: 1 },
  { id: 'chest',     label: 'Chest',     slots: 1 },
  { id: 'gloves',    label: 'Gloves',    slots: 1 },
  { id: 'legs',      label: 'Legs',      slots: 1 },
  { id: 'boots',     label: 'Boots',     slots: 1 },
  { id: 'accessory', label: 'Accessory', slots: 3 },
  { id: 'trinket',   label: 'Trinket',   slots: 2 },
];

export const ABILITY_GROUPS = [
  { id: 'martial_arts', label: 'Martial Arts', slots: 2 },
  { id: 'inner_way',    label: 'Inner Way',    slots: 4 },
  { id: 'mystic_skills', label: 'Mystic Skills', slots: 4 },
];

export const TALENT_TREES = [
  { id: 'tree_offense',  label: 'Offense' },
  { id: 'tree_defense',  label: 'Defense' },
  { id: 'tree_mystic',   label: 'Mystic' },
];

const buildDefaultState = () => ({
  abilities: {
    martial_arts: [null, null],
    inner_way: [null, null, null, null],
    mystic_skills: [null, null, null, null],
  },
  gear: GEAR_CATEGORIES.reduce((acc, c) => {
    acc[c.id] = new Array(c.slots).fill(null);
    return acc;
  }, {}),
  // Per-tree: array of allocated node ids
  talents: TALENT_TREES.reduce((acc, t) => { acc[t.id] = []; return acc; }, {}),
  // Selected item per tab (drives right-side detail panel)
  selectedAbilityGroup: 'martial_arts',
  selectedGearCategory: 'weapon',
  selectedTalentTree: 'tree_offense',
});

let state = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...buildDefaultState(), ...JSON.parse(saved) };
  } catch {}
  return buildDefaultState();
})();

const listeners = new Set();
const persist = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
};
const emit = () => {
  persist();
  listeners.forEach((fn) => fn(state));
};

export const getEquipmentState = () => state;
export const subscribeEquipment = (fn) => {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
};

export const equipAbility = (groupId, slotIndex, abilityId) => {
  const next = { ...state, abilities: { ...state.abilities } };
  const arr = [...next.abilities[groupId]];
  arr[slotIndex] = abilityId;
  next.abilities[groupId] = arr;
  state = next;
  emit();
};

export const equipGear = (categoryId, slotIndex, itemId) => {
  const next = { ...state, gear: { ...state.gear } };
  const arr = [...next.gear[categoryId]];
  arr[slotIndex] = itemId;
  next.gear[categoryId] = arr;
  state = next;
  emit();
};

export const toggleTalent = (treeId, nodeId) => {
  const next = { ...state, talents: { ...state.talents } };
  const arr = next.talents[treeId] || [];
  next.talents[treeId] = arr.includes(nodeId)
    ? arr.filter((n) => n !== nodeId)
    : [...arr, nodeId];
  state = next;
  emit();
};

export const setSelected = (key, value) => {
  state = { ...state, [key]: value };
  emit();
};