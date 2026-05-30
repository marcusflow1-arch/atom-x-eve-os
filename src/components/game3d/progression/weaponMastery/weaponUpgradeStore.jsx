// ─── Weapon Upgrade Store ─────────────────────────────────────────────────
// Separate from enchantment — this tracks the weapon's LEVEL (1..50).
// Each level increases the weapon's base damage by a fixed amount.
// Materials required: Gold + Iron Shards (common drop from enemies).

const STORAGE_KEY = 'weapon_upgrade_v1';

export const MAX_UPGRADE_LEVEL = 50;
const BASE_DMG = 100;                     // damage at level 1
const DMG_PER_LEVEL = 18;                 // flat damage added per level
const GOLD_BASE = 300;                    // gold cost at level 1
const GOLD_GROWTH = 150;                  // extra gold per level
const SHARDS_BASE = 2;                    // iron shards at level 1
const SHARDS_GROWTH = 1;                  // extra shard per 5 levels

// ── Rarity tiers every 10 levels ──────────────────────────────────────────
export const UPGRADE_RARITY_TIERS = [
  { upTo: 10, name: 'Iron',     color: '#94a3b8' },
  { upTo: 20, name: 'Steel',    color: '#60a5fa' },
  { upTo: 30, name: 'Mithril',  color: '#34d399' },
  { upTo: 40, name: 'Adamant',  color: '#fbbf24' },
  { upTo: 50, name: 'Celestial',color: '#f0abfc' },
];

export function getUpgradeRarity(level) {
  return UPGRADE_RARITY_TIERS.find((t) => level <= t.upTo) || UPGRADE_RARITY_TIERS[UPGRADE_RARITY_TIERS.length - 1];
}

export function getDamageAtLevel(level) {
  return BASE_DMG + Math.max(0, level - 1) * DMG_PER_LEVEL;
}

export function getUpgradeCost(toLevel) {
  const shards = SHARDS_BASE + Math.floor((toLevel - 1) / 5) * SHARDS_GROWTH;
  const gold   = GOLD_BASE + (toLevel - 1) * GOLD_GROWTH;
  return { gold, shards };
}

// ── Persistence ────────────────────────────────────────────────────────────
let state = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
})();

const listeners = new Set();
const persist = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} };
const emit = () => listeners.forEach((fn) => fn());

function ensureEntry(weaponId) {
  if (!state[weaponId]) state[weaponId] = { level: 1 };
  return state[weaponId];
}

export function subscribeUpgrade(fn) {
  listeners.add(fn);
  fn();
  return () => listeners.delete(fn);
}

export function getUpgrade(weaponId) {
  return ensureEntry(weaponId);
}

export function attemptUpgrade(weaponId) {
  const entry = ensureEntry(weaponId);
  if (entry.level >= MAX_UPGRADE_LEVEL) return { ok: false, reason: 'max_level' };
  entry.level += 1;
  persist();
  emit();
  window.dispatchEvent(new CustomEvent('weaponUpgraded', {
    detail: { weaponId, newLevel: entry.level },
  }));
  return { ok: true, newLevel: entry.level };
}

export function resetUpgrade(weaponId) {
  state[weaponId] = { level: 1 };
  persist();
  emit();
}