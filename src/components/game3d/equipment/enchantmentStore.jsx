// Enchantment system store.
// - Persists per-item enchantment levels (level 0..10 per slot, 4 slots per item).
// - Persists the player's enchantment materials inventory.
// - Computes material cost per level and stat bonuses applied to gear.

const ENCH_KEY = 'wwm_enchantments_v1';
const MATS_KEY = 'wwm_ench_materials_v1';

export const MAX_ENCH_LEVEL = 10;
export const ENCH_SLOTS = 4; // I, II, III, IV

export const MATERIALS = [
  { id: 'mat_essence',    name: 'Essence Shard',   color: '#67e8f9' },
  { id: 'mat_crystal',    name: 'Spirit Crystal',  color: '#a78bfa' },
  { id: 'mat_starlight',  name: 'Starlight Dust',  color: '#fde68a' },
];

const BASE_COST = { mat_essence: 2, mat_crystal: 1, mat_starlight: 1 };

export const getCostForNextLevel = (currentLevel) => {
  const target = Math.min(MAX_ENCH_LEVEL, (currentLevel || 0) + 1);
  return {
    mat_essence:   BASE_COST.mat_essence   * target,
    mat_crystal:   BASE_COST.mat_crystal   * target,
    mat_starlight: BASE_COST.mat_starlight * target,
  };
};

export const PER_LEVEL_BONUS = {
  minAtk: 2,
  maxAtk: 3,
  mastery: 1,
  durability: 5,
  crit: 1,
};

const buildDefaultEnch = () => ({});
const buildDefaultMats = () => ({
  mat_essence:   12,
  mat_crystal:   6,
  mat_starlight: 4,
});

const load = (key, builder) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...builder(), ...JSON.parse(raw) };
  } catch {}
  return builder();
};

let enchState = load(ENCH_KEY, buildDefaultEnch);
let matsState = load(MATS_KEY, buildDefaultMats);

const listeners = new Set();
const persist = () => {
  try {
    localStorage.setItem(ENCH_KEY, JSON.stringify(enchState));
    localStorage.setItem(MATS_KEY, JSON.stringify(matsState));
  } catch {}
};
const emit = () => {
  persist();
  listeners.forEach((fn) => fn({ enchantments: enchState, materials: matsState }));
};

export const subscribeEnchantments = (fn) => {
  listeners.add(fn);
  fn({ enchantments: enchState, materials: matsState });
  return () => listeners.delete(fn);
};

export const getMaterials = () => matsState;

export const getItemEnchantments = (itemId) => {
  if (!itemId) return new Array(ENCH_SLOTS).fill(0);
  return enchState[itemId] || new Array(ENCH_SLOTS).fill(0);
};

export const getTotalEnchLevel = (itemId) =>
  getItemEnchantments(itemId).reduce((a, b) => a + b, 0);

export const getEnchBonus = (itemId) => {
  const total = getTotalEnchLevel(itemId);
  return {
    minAtk:     total * PER_LEVEL_BONUS.minAtk,
    maxAtk:     total * PER_LEVEL_BONUS.maxAtk,
    mastery:    total * PER_LEVEL_BONUS.mastery,
    durability: total * PER_LEVEL_BONUS.durability,
    crit:       total * PER_LEVEL_BONUS.crit,
  };
};

const canAfford = (cost) =>
  Object.entries(cost).every(([k, v]) => (matsState[k] || 0) >= v);

export const enchantSlot = (itemId, slotIndex) => {
  if (!itemId) return { ok: false, reason: 'no_item' };
  if (slotIndex < 0 || slotIndex >= ENCH_SLOTS) return { ok: false, reason: 'bad_slot' };

  const current = getItemEnchantments(itemId);
  const level = current[slotIndex] || 0;
  if (level >= MAX_ENCH_LEVEL) return { ok: false, reason: 'max_level' };

  const cost = getCostForNextLevel(level);
  if (!canAfford(cost)) return { ok: false, reason: 'insufficient_materials' };

  const nextMats = { ...matsState };
  Object.entries(cost).forEach(([k, v]) => { nextMats[k] = (nextMats[k] || 0) - v; });
  matsState = nextMats;

  const nextArr = [...current];
  nextArr[slotIndex] = level + 1;
  enchState = { ...enchState, [itemId]: nextArr };

  emit();
  return { ok: true };
};

export const grantMaterials = (delta) => {
  matsState = {
    mat_essence:   (matsState.mat_essence   || 0) + (delta.mat_essence   || 0),
    mat_crystal:   (matsState.mat_crystal   || 0) + (delta.mat_crystal   || 0),
    mat_starlight: (matsState.mat_starlight || 0) + (delta.mat_starlight || 0),
  };
  emit();
};