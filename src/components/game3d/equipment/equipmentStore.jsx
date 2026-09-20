// Backend store for the equipment menu.
// Holds: equipped abilities (martial arts + inner way + mystic skills),
// gear slots, and talents. Persists to localStorage and notifies subscribers.
//
// AXE Prompt 018 integration:
// - slot definitions come from the AXE-native equipment contract
// - legacy inventory remains usable through an adapter
// - equip validation is centralized instead of being UI-only

import { INVENTORY, getAllEquippedInCategory } from './inventoryData';
import {
  AXE_EQUIPMENT_SLOT_DEFS,
  migrateLegacyEquipmentItem,
  validateAXEEquip,
} from '../axe/equipment/AXEEquipmentSystem';

const STORAGE_KEY = 'wwm_equipment_state_v1';

// Existing UI categories are preserved, with AXE prestige/appearance slots added.
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
  talents: TALENT_TREES.reduce((acc, t) => { acc[t.id] = []; return acc; }, {}),
  selectedAbilityGroup: 'martial_arts',
  selectedGearCategory: 'weapon',
  selectedTalentTree: 'tree_range',
});

let state = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const base = buildDefaultState();
      return {
        ...base,
        ...parsed,
        gear: { ...base.gear, ...(parsed.gear || {}) },
      };
    }
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
  const arr = [...(next.gear[categoryId] || [])];
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

const findCategoryDef = (categoryId) =>
  GEAR_CATEGORIES.find((c) => c.id === categoryId);

export const equipItem = (categoryId, itemId, context = {}) => {
  const items = INVENTORY[categoryId];
  if (!items) return { ok: false, reason: 'CATEGORY_MISSING' };
  const target = items.find((it) => it.id === itemId);
  if (!target) return { ok: false, reason: 'ITEM_MISSING' };
  if (target.equipped) { emit(); return { ok: true, reason: 'ALREADY_EQUIPPED' }; }

  const axeItem = migrateLegacyEquipmentItem(target, categoryId);
  const validation = validateAXEEquip(axeItem, context);
  if (!validation.ok) return validation;

  const cat = findCategoryDef(categoryId);
  const maxSlots = cat?.slots || 1;
  const currentlyEquipped = getAllEquippedInCategory(categoryId);

  if (currentlyEquipped.length >= maxSlots) {
    const toRemove = currentlyEquipped[0];
    if (toRemove) toRemove.equipped = false;
  }
  target.equipped = true;
  emit();
  return { ok: true, reason: null };
};

export const unequipItem = (categoryId, itemId) => {
  const items = INVENTORY[categoryId];
  if (!items) return { ok: false, reason: 'CATEGORY_MISSING' };
  const target = items.find((it) => it.id === itemId);
  if (!target) return { ok: false, reason: 'ITEM_MISSING' };
  target.equipped = false;
  emit();
  return { ok: true, reason: null };
};
