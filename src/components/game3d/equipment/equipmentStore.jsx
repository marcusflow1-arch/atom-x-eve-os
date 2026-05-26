// Backend store for the equipment menu.
// Holds: equipped abilities (martial arts + inner way + mystic skills),
// gear slots, and talents. Persists to localStorage and notifies subscribers.

import { INVENTORY, getAllEquippedInCategory } from './inventoryData';

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
  { id: 'tree_range',   label: 'Range',   weaponPath: 'ranged',  icon: '🏹', color: '#10b981' },
  { id: 'tree_defense', label: 'Defense', weaponPath: 'defense', icon: '🗡️', color: '#3b82f6' },
  { id: 'tree_offense', label: 'Offense', weaponPath: 'damage',  icon: '⚔️', color: '#ef4444' },
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
  selectedTalentTree: 'tree_range',
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

// --- Inventory equip / unequip --------------------------------------------
// Flips the `equipped` flag on items inside INVENTORY for a category.
// For single-slot categories, equipping a new item unequips the previous one.
// For multi-slot categories (weapon/accessory/trinket), we cap equipped count
// at the category's slot count and unequip the oldest equipped item if full.

const findCategoryDef = (categoryId) =>
  GEAR_CATEGORIES.find((c) => c.id === categoryId);

export const equipItem = (categoryId, itemId) => {
  const items = INVENTORY[categoryId];
  if (!items) return;
  const target = items.find((it) => it.id === itemId);
  if (!target || target.equipped) { emit(); return; }

  const cat = findCategoryDef(categoryId);
  const maxSlots = cat?.slots || 1;
  const currentlyEquipped = getAllEquippedInCategory(categoryId);

  if (currentlyEquipped.length >= maxSlots) {
    // Unequip the first equipped item to make room
    const toRemove = currentlyEquipped[0];
    if (toRemove) toRemove.equipped = false;
  }
  target.equipped = true;
  emit();
};

export const unequipItem = (categoryId, itemId) => {
  const items = INVENTORY[categoryId];
  if (!items) return;
  const target = items.find((it) => it.id === itemId);
  if (!target) return;
  target.equipped = false;
  emit();
};