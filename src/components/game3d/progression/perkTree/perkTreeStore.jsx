// ─── Perk Tree Store ──────────────────────────────────────────────────────
// Manages perk point allocation, keystone selection, and unlocked perks.
// Persists to localStorage. Pure JS — no React dependency.
//
// State shape per weapon:
// {
//   spentPoints: number,
//   branches: {
//     [branchId]: { unlockedTiers: number[] (e.g. [1,2,3]) }
//   },
//   activeKeystone: string | null  (only one keystone per weapon)
// }

import { PERK_TREE_CONFIG, getBranch, getMaxPoints } from './perkTreeData';

const STORAGE_KEY = 'weapon_perk_tree_v1';

// ─── Internal state ───────────────────────────────────────────────────────
let state = {};
let subscribers = [];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw);
  } catch {}
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function notify() {
  subscribers.forEach(fn => fn(getFullState()));
}

load();

// ─── Default state for a weapon ──────────────────────────────────────────
function defaultWeaponState(weaponId) {
  const branches = {};
  (PERK_TREE_CONFIG[weaponId]?.branches || []).forEach(b => {
    branches[b.id] = { unlockedTiers: [] };
  });
  return { spentPoints: 0, branches, activeKeystone: null };
}

function ensureWeapon(weaponId) {
  if (!state[weaponId]) state[weaponId] = defaultWeaponState(weaponId);
  // Ensure all branches exist (in case data was added after first save)
  (PERK_TREE_CONFIG[weaponId]?.branches || []).forEach(b => {
    if (!state[weaponId].branches[b.id]) {
      state[weaponId].branches[b.id] = { unlockedTiers: [] };
    }
  });
  return state[weaponId];
}

// ─── Read API ─────────────────────────────────────────────────────────────

export function getWeaponPerkState(weaponId) {
  return ensureWeapon(weaponId);
}

export function getFullState() {
  return { ...state };
}

export function isUnlocked(weaponId, branchId, tier) {
  const ws = ensureWeapon(weaponId);
  return ws.branches[branchId]?.unlockedTiers.includes(tier) ?? false;
}

export function isKeystoneActive(weaponId, keystoneId) {
  return ensureWeapon(weaponId).activeKeystone === keystoneId;
}

export function getSpentPoints(weaponId) {
  return ensureWeapon(weaponId).spentPoints;
}

export function getRemainingPoints(weaponId) {
  return getMaxPoints(weaponId) - getSpentPoints(weaponId);
}

/** True if this branch has ≥ pointsToUnlockKeystone tiers unlocked. */
export function canUnlockKeystone(weaponId, branchId) {
  const ws = ensureWeapon(weaponId);
  const branchState = ws.branches[branchId];
  if (!branchState) return false;
  return branchState.unlockedTiers.length >= PERK_TREE_CONFIG.pointsToUnlockKeystone;
}

/** True if the player CAN unlock the next tier of this branch. */
export function canUnlockTier(weaponId, branchId, tier) {
  const ws = ensureWeapon(weaponId);
  if (getRemainingPoints(weaponId) <= 0) return false;
  // Previous tiers must all be unlocked
  for (let t = 1; t < tier; t++) {
    if (!ws.branches[branchId]?.unlockedTiers.includes(t)) return false;
  }
  return !ws.branches[branchId]?.unlockedTiers.includes(tier);
}

// ─── Write API ────────────────────────────────────────────────────────────

/** Unlock a tier perk. Returns { ok, reason }. */
export function unlockTier(weaponId, branchId, tier) {
  const ws = ensureWeapon(weaponId);

  if (!canUnlockTier(weaponId, branchId, tier)) {
    const reason = getRemainingPoints(weaponId) <= 0
      ? 'No points remaining'
      : `Tier ${tier - 1} must be unlocked first`;
    return { ok: false, reason };
  }

  ws.branches[branchId].unlockedTiers.push(tier);
  ws.spentPoints += 1;
  save();
  notify();
  return { ok: true };
}

/** Refund a tier (and any higher tiers in the branch + keystone if invalidated). */
export function refundTier(weaponId, branchId, tier) {
  const ws = ensureWeapon(weaponId);
  const b = ws.branches[branchId];
  if (!b) return { ok: false, reason: 'Branch not found' };

  // Remove this tier and any higher tiers (tree must be contiguous top-down)
  const removed = b.unlockedTiers.filter(t => t >= tier);
  b.unlockedTiers = b.unlockedTiers.filter(t => t < tier);
  ws.spentPoints = Math.max(0, ws.spentPoints - removed.length);

  // Invalidate keystone if branch no longer meets threshold
  if (!canUnlockKeystone(weaponId, branchId)) {
    const branch = getBranch(weaponId, branchId);
    if (branch && ws.activeKeystone === branch.keystone?.id) {
      ws.activeKeystone = null;
    }
  }

  save();
  notify();
  return { ok: true, refunded: removed.length };
}

/** Activate a keystone (only one per weapon). Deactivates the previous one. */
export function activateKeystone(weaponId, branchId) {
  const ws = ensureWeapon(weaponId);
  if (!canUnlockKeystone(weaponId, branchId)) {
    return { ok: false, reason: `Need ${PERK_TREE_CONFIG.pointsToUnlockKeystone} tiers in this branch` };
  }
  const branch = getBranch(weaponId, branchId);
  if (!branch?.keystone) return { ok: false, reason: 'No keystone defined' };

  ws.activeKeystone = branch.keystone.id;
  save();
  notify();
  return { ok: true, keystone: branch.keystone };
}

/** Deactivate the current keystone for a weapon. */
export function deactivateKeystone(weaponId) {
  const ws = ensureWeapon(weaponId);
  ws.activeKeystone = null;
  save();
  notify();
}

/** Full reset for a weapon — refunds all points. */
export function resetWeapon(weaponId) {
  state[weaponId] = defaultWeaponState(weaponId);
  save();
  notify();
}

// ─── Derived mods (used by combat pipeline) ──────────────────────────────

/**
 * Returns a merged modifier object from all unlocked perks + active keystone
 * for a given weapon. All numeric values are additive unless specified.
 */
export function getActiveMods(weaponId) {
  const ws = ensureWeapon(weaponId);
  const config = PERK_TREE_CONFIG[weaponId];
  if (!config) return {};

  const mods = {};

  const merge = (mod) => {
    if (!mod) return;
    Object.entries(mod).forEach(([k, v]) => {
      if (typeof v === 'boolean') {
        mods[k] = mods[k] || v;
      } else {
        mods[k] = (mods[k] || 0) + v;
      }
    });
  };

  config.branches.forEach(branch => {
    const bs = ws.branches[branch.id];
    if (!bs) return;
    // Merge unlocked tier mods
    branch.tiers.forEach(perk => {
      if (bs.unlockedTiers.includes(perk.tier)) merge(perk.mod);
    });
    // Merge active keystone mod
    if (ws.activeKeystone === branch.keystone?.id) {
      merge(branch.keystone.mod);
    }
  });

  return mods;
}

// ─── Subscription ────────────────────────────────────────────────────────

export function subscribePerkTree(fn) {
  subscribers.push(fn);
  fn(getFullState()); // immediate call with current state
  return () => { subscribers = subscribers.filter(s => s !== fn); };
}