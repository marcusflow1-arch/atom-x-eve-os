// ─── Weapon Mastery Tree Store ───────────────────────────────────────────
// Persists allocated ranks per weapon TYPE (sword / guardian / ranged).
// Spending model: each weapon-type level grants 1 point. Players spend
// points on tree nodes to unlock passive stat modifiers.
//
//   allocations = { sword: { sw_dmg_1: 2, sw_crit_1: 1, ... }, ... }
//
// Persists to localStorage. Pure data layer — combat scaling reads via
// `getAllocatedModifiers(weaponType)` from the resolver.

import { getTreeForType, getNodeById } from './weaponMasteryTreeData';
import { resolveWeaponType, WEAPON_TYPES } from './weaponMasteryConfig';
import { getMasteryState } from '../weaponMasteryStore';
import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';

const storage = characterScopedStorage('weapon_mastery_tree_v1');

const defaults = () => ({
  [WEAPON_TYPES.SWORD]:    {},
  [WEAPON_TYPES.GUARDIAN]: {},
  [WEAPON_TYPES.RANGED]:   {},
  [WEAPON_TYPES.FISTS]:    {},
});

const loadAllocations = () => {
  try {
    const raw = storage.get();
    if (raw) return { ...defaults(), ...JSON.parse(raw) };
  } catch {}
  return defaults();
};

let allocations = loadAllocations();

const listeners = new Set();
const persist = () => { storage.set(JSON.stringify(allocations)); };
const emit = () => listeners.forEach((fn) => fn(getSnapshot()));

// Reload this character's tree when the active character switches.
subscribeCharacterChange(() => { allocations = loadAllocations(); emit(); });

export function subscribeMasteryTree(fn) {
  listeners.add(fn);
  fn(getSnapshot());
  return () => listeners.delete(fn);
}

export function getSnapshot() {
  return JSON.parse(JSON.stringify(allocations));
}

export function getNodeRank(weaponType, nodeId) {
  return allocations[weaponType]?.[nodeId] || 0;
}

// Sum of (rank × cost) for all allocated nodes of a weapon TYPE.
export function getTotalSpent(weaponType) {
  const tree = getTreeForType(weaponType);
  if (!tree) return 0;
  let total = 0;
  for (const node of tree.nodes) {
    const rank = allocations[weaponType]?.[node.id] || 0;
    total += rank * node.cost;
  }
  return total;
}

// Total earned points = highest level among weapons of this TYPE.
// (Engine already increments level via usage. We treat each weapon-type as
// sharing a single point pool fed by the highest-level instance of that type.)
export function getTotalPoints(weaponType) {
  const ms = getMasteryState();
  let best = 1;
  Object.keys(ms.weapons || {}).forEach((id) => {
    if (resolveWeaponType(id) === weaponType) {
      best = Math.max(best, ms.weapons[id].level || 1);
    }
  });
  return best;
}

export function getAvailablePoints(weaponType) {
  return Math.max(0, getTotalPoints(weaponType) - getTotalSpent(weaponType));
}

// Are all prerequisites of a node fully maxed (rank === maxRank)?
export function arePrerequisitesMet(weaponType, nodeId) {
  const node = getNodeById(weaponType, nodeId);
  if (!node) return false;
  if (!node.prereq || node.prereq.length === 0) return true;
  return node.prereq.every((pid) => {
    const pnode = getNodeById(weaponType, pid);
    if (!pnode) return false;
    return (allocations[weaponType]?.[pid] || 0) >= pnode.maxRank;
  });
}

// Can the player allocate one more rank to this node right now?
export function canAllocate(weaponType, nodeId) {
  const node = getNodeById(weaponType, nodeId);
  if (!node) return { ok: false, reason: 'unknown_node' };
  const rank = getNodeRank(weaponType, nodeId);
  if (rank >= node.maxRank) return { ok: false, reason: 'max_rank' };
  if (getTotalPoints(weaponType) < node.unlockLevel) return { ok: false, reason: 'level_locked' };
  if (!arePrerequisitesMet(weaponType, nodeId)) return { ok: false, reason: 'prereq' };
  if (getAvailablePoints(weaponType) < node.cost) return { ok: false, reason: 'no_points' };
  return { ok: true };
}

export function allocateNode(weaponType, nodeId) {
  const check = canAllocate(weaponType, nodeId);
  if (!check.ok) return check;
  allocations[weaponType][nodeId] = (allocations[weaponType][nodeId] || 0) + 1;
  persist();
  emit();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('weaponMasteryNodeAllocated', {
      detail: { weaponType, nodeId, rank: allocations[weaponType][nodeId] },
    }));
  }
  return { ok: true };
}

// Refund all points for a weapon type. Returns the number of points refunded.
export function resetTree(weaponType) {
  const before = getTotalSpent(weaponType);
  allocations[weaponType] = {};
  persist();
  emit();
  return before;
}

// Aggregate all unlocked node modifiers for a weapon TYPE.
// Numeric mods sum; boolean flags overwrite (true wins).
export function getAllocatedModifiers(weaponType) {
  const tree = getTreeForType(weaponType);
  if (!tree) return {};
  const out = {};
  for (const node of tree.nodes) {
    const rank = allocations[weaponType]?.[node.id] || 0;
    if (rank <= 0) continue;
    for (const k of Object.keys(node.mod || {})) {
      const v = node.mod[k];
      if (typeof v === 'number') out[k] = (out[k] || 0) + v * rank;
      else out[k] = v;
    }
  }
  return out;
}