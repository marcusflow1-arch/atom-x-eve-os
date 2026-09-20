// AXE Prompt 019 — reinforcement, enchantment and over-enchantment backend.
// Item progression is persisted per character. Upgrade materials are REAL loot
// inventory items, so Services and the Inventory screen consume the same stock.

import {
  AXE_ENCHANTMENT_CONFIG,
  resolveOverEnchant,
  resolveReinforcement,
  getAXEEnhancementStatMultiplier,
} from '../axe/equipment/AXEItemEnhancementSystem';
import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';
import {
  getLootItemCount,
  grantLootItemById,
  consumeLootItemById,
  subscribeLootInventory,
} from '../lootStore';

const enchStorage = characterScopedStorage('wwm_enchantments_v1');
const reinforceStorage = characterScopedStorage('axe_reinforcement_v1');
const overEnchantStorage = characterScopedStorage('axe_over_enchant_v1');
const materialSeedStorage = characterScopedStorage('axe_upgrade_material_seed_v2');

export const MAX_ENCH_LEVEL = AXE_ENCHANTMENT_CONFIG.maxLevelPerSlot;
export const ENCH_SLOTS = AXE_ENCHANTMENT_CONFIG.slots;

export const MATERIALS = [
  { id: 'mat_essence', name: 'Essence Shard', color: '#d4d4d8' },
  { id: 'mat_crystal', name: 'Spirit Crystal', color: '#c4b5fd' },
  { id: 'mat_starlight', name: 'Starlight Dust', color: '#f5f5f4' },
  { id: 'mat_reinforce', name: 'Reinforcement Stone', color: '#d6d3d1' },
  { id: 'mat_over_enchant', name: 'Over-Enchant Catalyst', color: '#e4e4e7' },
  { id: 'mat_protection', name: 'Stabilizer', color: '#d1fae5' },
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

function loadObject(storage) {
  try {
    const raw = storage.get();
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

let enchState = loadObject(enchStorage);
let reinforcementState = loadObject(reinforceStorage);
let overEnchantState = loadObject(overEnchantStorage);
const listeners = new Set();

function ensureStarterMaterials() {
  try {
    if (materialSeedStorage.get()) return;
    const seed = {
      mat_essence: 12,
      mat_crystal: 6,
      mat_starlight: 4,
      mat_reinforce: 8,
      mat_over_enchant: 4,
      mat_protection: 2,
    };
    materialSeedStorage.set(JSON.stringify({ seededAt: Date.now(), seed }));
    Object.entries(seed).forEach(([id, count]) => {
      if (getLootItemCount(id, 'material') <= 0) grantLootItemById(id, count);
    });
  } catch {}
}

ensureStarterMaterials();

const persist = () => {
  enchStorage.set(JSON.stringify(enchState));
  reinforceStorage.set(JSON.stringify(reinforcementState));
  overEnchantStorage.set(JSON.stringify(overEnchantState));
};

const snapshot = () => ({
  enchantments: { ...enchState },
  materials: getMaterials(),
  reinforcement: { ...reinforcementState },
  overEnchant: { ...overEnchantState },
});

const emit = () => {
  persist();
  const snap = snapshot();
  listeners.forEach((fn) => fn(snap));
};

subscribeCharacterChange(() => {
  enchState = loadObject(enchStorage);
  reinforcementState = loadObject(reinforceStorage);
  overEnchantState = loadObject(overEnchantStorage);
  ensureStarterMaterials();
  const snap = snapshot();
  listeners.forEach((fn) => fn(snap));
});

// Material inventory changes must update any open enchant/service UI immediately.
subscribeLootInventory(() => {
  const snap = snapshot();
  listeners.forEach((fn) => fn(snap));
});

export const subscribeEnchantments = (fn) => {
  listeners.add(fn);
  fn(snapshot());
  return () => listeners.delete(fn);
};

// Hoisted: subscribeLootInventory immediately requests a snapshot during startup.
export function getMaterials() {
  return Object.fromEntries(
    MATERIALS.map((material) => [
      material.id,
      getLootItemCount(material.id, 'material'),
    ]),
  );
}

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
  Object.entries(cost).every(([id, count]) =>
    getLootItemCount(id, 'material') >= Number(count || 0)
  );

const consume = (cost) => {
  if (!canAfford(cost)) return { ok: false, reason: 'insufficient_materials' };
  for (const [id, count] of Object.entries(cost)) {
    const result = consumeLootItemById(id, count, 'material');
    if (!result.ok) return result;
  }
  return { ok: true };
};

export const enchantSlot = (itemId, slotIndex) => {
  if (!itemId) return { ok: false, reason: 'no_item' };
  if (slotIndex < 0 || slotIndex >= ENCH_SLOTS) return { ok: false, reason: 'bad_slot' };

  const current = getItemEnchantments(itemId);
  const level = current[slotIndex] || 0;
  if (level >= MAX_ENCH_LEVEL) return { ok: false, reason: 'max_level' };

  const cost = getCostForNextLevel(level);
  if (!canAfford(cost)) {
    return { ok: false, reason: 'insufficient_materials', cost, materials: getMaterials() };
  }

  const paid = consume(cost);
  if (!paid.ok) return paid;

  const nextArr = [...current];
  nextArr[slotIndex] = level + 1;
  enchState = { ...enchState, [itemId]: nextArr };
  emit();
  return { ok: true, outcome: 'success', level: nextArr[slotIndex], cost };
};

export const reinforceItem = (itemId, { protectedAttempt = false, roll } = {}) => {
  if (!itemId) return { ok: false, reason: 'no_item' };

  const cost = {
    mat_reinforce: 1 + Math.floor((getItemReinforcement(itemId).percent || 0) / 20),
    ...(protectedAttempt ? { mat_protection: 1 } : {}),
  };
  if (!canAfford(cost)) {
    return { ok: false, reason: 'insufficient_materials', cost, materials: getMaterials() };
  }

  const result = resolveReinforcement(getItemReinforcement(itemId), {
    protectedAttempt,
    ...(Number.isFinite(roll) ? { roll } : {}),
  });

  if (result.reason === 'max_reinforcement') return result;

  const paid = consume(cost);
  if (!paid.ok) return paid;

  reinforcementState = { ...reinforcementState, [itemId]: result.record };
  emit();
  return { ...result, cost };
};

export const overEnchantItem = (itemId, { protectedAttempt = false, roll } = {}) => {
  if (!itemId) return { ok: false, reason: 'no_item' };

  const cost = {
    mat_over_enchant: 1 + Math.floor((getItemOverEnchant(itemId).level || 0) / 2),
    ...(protectedAttempt ? { mat_protection: 1 } : {}),
  };
  if (!canAfford(cost)) {
    return { ok: false, reason: 'insufficient_materials', cost, materials: getMaterials() };
  }

  const result = resolveOverEnchant(getItemOverEnchant(itemId), {
    protectedAttempt,
    ...(Number.isFinite(roll) ? { roll } : {}),
  });

  if (result.reason === 'max_over_enchant') return result;

  const paid = consume(cost);
  if (!paid.ok) return paid;

  overEnchantState = { ...overEnchantState, [itemId]: result.record };
  emit();
  return { ...result, cost };
};

export const grantMaterials = (delta = {}) => {
  for (const material of MATERIALS) {
    const count = Math.max(0, Math.floor(Number(delta[material.id] || 0)));
    if (count > 0) grantLootItemById(material.id, count);
  }
  emit();
  return getMaterials();
};