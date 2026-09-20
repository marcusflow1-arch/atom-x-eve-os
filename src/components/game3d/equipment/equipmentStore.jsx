// Character-scoped equipment UI/loadout adapter.
// Actual owned equipment + equipped state is canonical in AXEEquipmentInventoryStore.
// This module now owns only UI selections, ability/talent choices and compatibility
// wrappers used by the legacy equipment menu.

import { AXE_EQUIPMENT_SLOT_DEFS } from '../axe/equipment/AXEEquipmentSystem';
import {
  equipAXEInventoryItem,
  getEquippedAXEItemsByCategory,
  subscribeAXEEquipmentInventory,
  unequipAXEInventoryItem,
} from '../axe/equipment/AXEEquipmentInventoryStore';
import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';

const storage = characterScopedStorage('wwm_equipment_state_v2');

export const GEAR_CATEGORIES = [
  { id: 'weapon',    label: 'Weapon',    slots: AXE_EQUIPMENT_SLOT_DEFS.weapon.maxEquipped },
  { id: 'helm',      label: 'Helm',      slots: AXE_EQUIPMENT_SLOT_DEFS.helm.maxEquipped },
  { id: 'chest',     label: 'Chest',     slots: AXE_EQUIPMENT_SLOT_DEFS.chest.maxEquipped },
  { id: 'gloves',    label: 'Gloves',    slots: AXE_EQUIPMENT_SLOT_DEFS.gloves.maxEquipped },
  { id: 'legs',      label: 'Legs',      slots: AXE_EQUIPMENT_SLOT_DEFS.legs.maxEquipped },
  { id: 'boots',     label: 'Boots',     slots: AXE_EQUIPMENT_SLOT_DEFS.boots.maxEquipped },
  { id: 'accessory', label: 'Accessory', slots: 3 },
  { id: 'trinket',   label: 'Trinket',   slots: 2 },
  { id: 'cape',      label: 'Cape',      slots: AXE_EQUIPMENT_SLOT_DEFS.cape.maxEquipped },
  { id: 'wings',     label: 'Wings',     slots: AXE_EQUIPMENT_SLOT_DEFS.wings.maxEquipped },
  { id: 'costume',   label: 'Costume',   slots: AXE_EQUIPMENT_SLOT_DEFS.costume.maxEquipped },
  { id: 'auxiliary', label: 'Auxiliary Gear', slots: AXE_EQUIPMENT_SLOT_DEFS.auxiliary.maxEquipped },
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
  // Compatibility mirror only. Real equipped items come from the canonical
  // AXE inventory store and this mirror is rebuilt on inventory updates.
  gear: GEAR_CATEGORIES.reduce((acc, c) => {
    acc[c.id] = new Array(c.slots).fill(null);
    return acc;
  }, {}),
  talents: TALENT_TREES.reduce((acc, t) => { acc[t.id] = []; return acc; }, {}),
  selectedAbilityGroup: 'martial_arts',
  selectedGearCategory: 'weapon',
  selectedTalentTree: 'tree_range',
});

function rebuildGearMirror(baseState) {
  const gear = { ...baseState.gear };
  for (const cat of GEAR_CATEGORIES) {
    const ids = getEquippedAXEItemsByCategory(cat.id).map((item) => item.instanceId);
    gear[cat.id] = new Array(cat.slots).fill(null).map((_, index) => ids[index] || null);
  }
  return { ...baseState, gear };
}

function load() {
  try {
    const raw = storage.get();
    if (raw) {
      const parsed = JSON.parse(raw);
      const def = buildDefaultState();
      return rebuildGearMirror({
        ...def,
        ...parsed,
        gear: { ...def.gear },
        abilities: { ...def.abilities, ...(parsed.abilities || {}) },
        talents: { ...def.talents, ...(parsed.talents || {}) },
      });
    }
  } catch {}
  return rebuildGearMirror(buildDefaultState());
}

let state = load();
const listeners = new Set();

const persist = () => {
  // Gear is derived; do not persist duplicate ownership/equip authority here.
  const { gear, ...rest } = state;
  storage.set(JSON.stringify(rest));
};

const emit = () => {
  state = rebuildGearMirror(state);
  persist();
  listeners.forEach((fn) => fn(state));
};

subscribeCharacterChange(() => {
  state = load();
  listeners.forEach((fn) => fn(state));
});

subscribeAXEEquipmentInventory(() => {
  // Canonical equipment state changed due to inventory, service or loot.
  state = rebuildGearMirror(state);
  listeners.forEach((fn) => fn(state));
});

export const getEquipmentState = () => state;

export const subscribeEquipment = (fn) => {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
};

export const equipAbility = (groupId, slotIndex, abilityId) => {
  const arr = [...(state.abilities[groupId] || [])];
  if (slotIndex < 0 || slotIndex >= arr.length) return false;
  arr[slotIndex] = abilityId;
  state = {
    ...state,
    abilities: { ...state.abilities, [groupId]: arr },
  };
  emit();
  return true;
};

export const equipGear = (categoryId, slotIndex, itemId, context = {}) => {
  const result = equipAXEInventoryItem(itemId, context);
  emit();
  return result;
};

export const toggleTalent = (treeId, nodeId) => {
  const arr = state.talents[treeId] || [];
  state = {
    ...state,
    talents: {
      ...state.talents,
      [treeId]: arr.includes(nodeId)
        ? arr.filter((n) => n !== nodeId)
        : [...arr, nodeId],
    },
  };
  emit();
};

export const setSelected = (key, value) => {
  state = { ...state, [key]: value };
  emit();
};

export const equipItem = (categoryId, itemId, context = {}) => {
  const result = equipAXEInventoryItem(itemId, context);
  emit();
  return result;
};

export const unequipItem = (categoryId, itemId) => {
  const result = unequipAXEInventoryItem(itemId);
  emit();
  return result;
};
