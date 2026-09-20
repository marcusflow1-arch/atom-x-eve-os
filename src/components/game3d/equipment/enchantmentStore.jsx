// AXE Prompt 019 — browser persistence adapter for reinforcement,
// enchantment and over-enchantment. Existing UI exports are preserved.

import {
  AXE_ENCHANTMENT_CONFIG,
  resolveOverEnchant,
  resolveReinforcement,
  getAXEEnhancementStatMultiplier,
} from '../axe/equipment/AXEItemEnhancementSystem';

const ENCH_KEY = 'wwm_enchantments_v1';
const MATS_KEY = 'wwm_ench_materials_v1';
const REINFORCE_KEY = 'axe_reinforcement_v1';
const OVER_ENCHANT_KEY = 'axe_over_enchant_v1';

export const MAX_ENCH_LEVEL = AXE_ENCHANTMENT_CONFIG.maxLevelPerSlot;
export const ENCH_SLOTS = AXE_ENCHANTMENT_CONFIG.slots;

export const MATERIALS = [
  { id: 'mat_essence', name: 'Essence Shard', color: '#67e8f9' },
  { id: 'mat_crystal', name: 'Spirit Crystal', color: '#a78bfa' },
  { id: 'mat_starlight', name: 'Starlight Dust', color: '#fde68a' },
  { id: 'mat_reinforce', name: 'Reinforcement Stone', color: '#f59e0b' },
  { id: 'mat_over_enchant', name: 'Over-Enchant Catalyst', color: '#fb7185' },
  { id: 'mat_protection', name: 'Stabilizer', color: '#34d399' },
];

const BASE_COST = { mat_essence: 2, mat_crystal: 1, mat_starlight: 1 };

export const getCostForNextLevel = (currentLevel) => {
  const target = Math.min(MAX_ENCH_LEVEL, (currentLevel || 0) + 1);
  return {
    mat_essence: BASE_COST.mat_essence * target,
    mat_crystal: BASE_COST.mat_crystal * target,
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
  mat_essence: 12,
  mat_crystal: 6,
  mat_starlight: 4,
  mat_reinforce: 8,
  mat_over_enchant: 4,
  mat_protection: 2,
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
let reinforcementState = load(REINFORCE_KEY, () => ({}));
let overEnchantState = load(OVER_ENCHANT_KEY, () => ({}));

const listeners = new Set();
const persist = () => {
  try {
    localStorage.setItem(ENCH_KEY, JSON.stringify(enchState));
    localStorage.setItem(MATS_KEY, JSON.stringify(matsState));
    localStorage.setItem(REINFORCE_KEY, JSON.stringify(reinforcementState));
    localStorage.setItem(OVER_ENCHANT_KEY, JSON.stringify(overEnchantState));
  } catch {}
};
const snapshot = () => ({
  enchantments: enchState,
  materials: matsState,
  reinforcement: reinforcementState,
  overEnchant: overEnchantState,
});
const emit = () => {
  persist();
  listeners.forEach((fn) => fn(snapshot()));
};

export const subscribeEnchantments = (fn) => {
  listeners.add(fn);
  fn(snapshot());
  return () => listeners.delete(fn);
};

export const getMaterials = () => matsState;

export const getItemEnchantments = (itemId) => {
  if (!itemId) return new Array(ENCH_SLOTS).fill(0);
  return enchState[itemId] || new Array(ENCH_SLOTS).fill(0);
};

export const getTotalEnchLevel = (itemId) =>
  getItemEnchantments(itemId).reduce((a, b) => a + b, 0);

export const getItemReinforcement = (itemId) =>
  reinforcementState[itemId] || { percent: 0 };

export const getItemOverEnchant = (itemId) =>
  overEnchantState[itemId] || { level: 0, fractured: false };

export const getEnchBonus = (itemId) => {
  const total = getTotalEnchLevel(itemId);
  const multiplier = getAXEEnhancementStatMultiplier({
    reinforcement: getItemReinforcement(itemId),
    enchantments: getItemEnchantments(itemId),
    overEnchant: getItemOverEnchant(itemId),
  });
  return {
    minAtk: total * PER_LEVEL_BONUS.minAtk,
    maxAtk: total * PER_LEVEL_BONUS.maxAtk,
    mastery: total * PER_LEVEL_BONUS.mastery,
    durability: total * PER_LEVEL_BONUS.durability,
    crit: total * PER_LEVEL_BONUS.crit,
    multiplier,
  };
};

const canAfford = (cost) =>
  Object.entries(cost).every(([k, v]) => (matsState[k] || 0) >= v);

const consume = (cost) => {
  const next = { ...matsState };
  Object.entries(cost).forEach(([k, v]) => { next[k] = (next[k] || 0) - v; });
  matsState = next;
};

export const enchantSlot = (itemId, slotIndex) => {
  if (!itemId) return { ok: false, reason: 'no_item' };
  if (slotIndex < 0 || slotIndex >= ENCH_SLOTS) return { ok: false, reason: 'bad_slot' };

  const current = getItemEnchantments(itemId);
  const level = current[slotIndex] || 0;
  if (level >= MAX_ENCH_LEVEL) return { ok: false, reason: 'max_level' };

  const cost = getCostForNextLevel(level);
  if (!canAfford(cost)) return { ok: false, reason: 'insufficient_materials' };

  consume(cost);
  const nextArr = [...current];
  nextArr[slotIndex] = level + 1;
  enchState = { ...enchState, [itemId]: nextArr };
  emit();
  return { ok: true, outcome: 'success', level: nextArr[slotIndex] };
};

export const reinforceItem = (itemId, { protectedAttempt = false, roll } = {}) => {
  if (!itemId) return { ok: false, reason: 'no_item' };

  const cost = {
    mat_reinforce: 1 + Math.floor((getItemReinforcement(itemId).percent || 0) / 20),
    ...(protectedAttempt ? { mat_protection: 1 } : {}),
  };
  if (!canAfford(cost)) return { ok: false, reason: 'insufficient_materials' };

  const result = resolveReinforcement(getItemReinforcement(itemId), {
    protectedAttempt,
    ...(Number.isFinite(roll) ? { roll } : {}),
  });

  if (result.reason === 'max_reinforcement') return result;
  consume(cost);
  reinforcementState = { ...reinforcementState, [itemId]: result.record };
  emit();
  return result;
};

export const overEnchantItem = (itemId, { protectedAttempt = false, roll } = {}) => {
  if (!itemId) return { ok: false, reason: 'no_item' };

  const cost = {
    mat_over_enchant: 1 + Math.floor((getItemOverEnchant(itemId).level || 0) / 2),
    ...(protectedAttempt ? { mat_protection: 1 } : {}),
  };
  if (!canAfford(cost)) return { ok: false, reason: 'insufficient_materials' };

  const result = resolveOverEnchant(getItemOverEnchant(itemId), {
    protectedAttempt,
    ...(Number.isFinite(roll) ? { roll } : {}),
  });

  if (result.reason === 'max_over_enchant') return result;
  consume(cost);
  overEnchantState = { ...overEnchantState, [itemId]: result.record };
  emit();
  return result;
};

export const grantMaterials = (delta) => {
  matsState = {
    ...matsState,
    ...Object.fromEntries(
      Object.keys(buildDefaultMats()).map((key) => [
        key,
        (matsState[key] || 0) + (delta[key] || 0),
      ]),
    ),
  };
  emit();
};
