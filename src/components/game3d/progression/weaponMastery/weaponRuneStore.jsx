// ─── Weapon Rune Store ────────────────────────────────────────────────────
// Rune slots amplify the weapon's base damage using socketed runes.
// Each weapon has 4 rune slots. Runes can be inserted, removed, or upgraded.
// Rune tiers: I (common) → V (divine). Each tier multiplies base ATK more.

const STORAGE_KEY = 'weapon_rune_v1';

export const MAX_RUNE_SLOTS = 4;
export const MAX_RUNE_TIER  = 5; // I..V

export const RUNE_TIERS = [
  { tier: 1, name: 'Rune I',    color: '#94a3b8', atkBonus: 25,  cost: { gold: 500,   dust: 1 } },
  { tier: 2, name: 'Rune II',   color: '#60a5fa', atkBonus: 75,  cost: { gold: 2000,  dust: 3 } },
  { tier: 3, name: 'Rune III',  color: '#34d399', atkBonus: 175, cost: { gold: 6000,  dust: 6 } },
  { tier: 4, name: 'Rune IV',   color: '#fbbf24', atkBonus: 350, cost: { gold: 15000, dust: 12} },
  { tier: 5, name: 'Rune V',    color: '#f0abfc', atkBonus: 700, cost: { gold: 40000, dust: 25} },
];

export const RUNE_SLOT_UNLOCK_LEVELS = [1, 5, 15, 30]; // mastery levels to unlock each slot

export function getRuneTier(tier) {
  return RUNE_TIERS.find((r) => r.tier === tier) || RUNE_TIERS[0];
}

export function getTotalRuneBonus(slots) {
  return slots.reduce((sum, s) => sum + (s ? (getRuneTier(s.tier)?.atkBonus || 0) : 0), 0);
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
  if (!state[weaponId]) {
    // 4 slots — null = empty
    state[weaponId] = { slots: [null, null, null, null] };
  }
  return state[weaponId];
}

export function subscribeRune(fn) {
  listeners.add(fn);
  fn();
  return () => listeners.delete(fn);
}

export function getRuneData(weaponId) {
  return ensureEntry(weaponId);
}

// Insert a rune of given tier into a slot (replaces any existing rune)
export function insertRune(weaponId, slotIndex, tier) {
  const entry = ensureEntry(weaponId);
  entry.slots[slotIndex] = { tier };
  persist();
  emit();
}

// Remove a rune from a slot
export function removeRune(weaponId, slotIndex) {
  const entry = ensureEntry(weaponId);
  entry.slots[slotIndex] = null;
  persist();
  emit();
}

// Upgrade a rune in a slot by 1 tier (if below max)
export function upgradeRune(weaponId, slotIndex) {
  const entry = ensureEntry(weaponId);
  const s = entry.slots[slotIndex];
  if (!s) return { ok: false };
  if (s.tier >= MAX_RUNE_TIER) return { ok: false, reason: 'max_tier' };
  s.tier += 1;
  persist();
  emit();
  return { ok: true, newTier: s.tier };
}