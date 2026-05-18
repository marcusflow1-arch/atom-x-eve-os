// ─── Weapon Enchantment Store ─────────────────────────────────────────────
// Per-weapon enchantment progression inspired by Annulus / mobile MMOs.
//
//   Levels: 0 → 200
//     0..120  → Normal Enchantment (each +1 boosts ATK)
//     121..200 → Over-Enchantment (higher cost, requires special materials)
//
//   Milestones: every 20 levels (20, 40, 60, … 200)
//     At each milestone the weapon "evolves" — glow / aura / name tier upgrades.
//
// Storage shape:
//   { [weaponId]: { level, normalAttempts, overAttempts } }
//
// Pure data layer — UI subscribes via subscribeEnchantment().

const STORAGE_KEY = 'weapon_enchantment_v1';

export const MAX_NORMAL_LEVEL = 120;
export const MAX_LEVEL = 200;
export const MILESTONE_STEP = 20;
export const MILESTONES = Array.from(
  { length: MAX_LEVEL / MILESTONE_STEP },
  (_, i) => (i + 1) * MILESTONE_STEP,
);

// ATK gained per +1 enchantment level (normal vs over-enchant).
const ATK_PER_LEVEL_NORMAL = 5;
const ATK_PER_LEVEL_OVER = 8;

// Gold cost curve. Normal scales linear-ish, over-enchant scales steeper.
function goldCostFor(level) {
  // level is the LEVEL we are upgrading TO (1..200)
  if (level <= MAX_NORMAL_LEVEL) return 50 + Math.floor(level * 12);
  const over = level - MAX_NORMAL_LEVEL;
  return 1500 + Math.floor(over * 250);
}

// Material requirement for a single +1 attempt at the next level.
// Normal levels use "Iron Ore". Over-enchant uses "Refined Stone".
function materialReqFor(level) {
  if (level <= MAX_NORMAL_LEVEL) {
    const tier = Math.floor((level - 1) / MILESTONE_STEP); // 0..5 across 0–120
    return {
      key: 'iron_ore',
      label: 'Iron Ore',
      count: 1 + tier, // 1,2,3,4,5,6
    };
  }
  return {
    key: 'refined_stone',
    label: 'Refined Stone',
    count: 2 + Math.floor((level - MAX_NORMAL_LEVEL) / MILESTONE_STEP),
  };
}

// Milestone visual tier color (used for glow + aura indicator on the ring).
const MILESTONE_GLOWS = [
  '#94a3b8', // 20  — silver
  '#60a5fa', // 40  — azure
  '#22d3ee', // 60  — cyan
  '#a3e635', // 80  — lime
  '#facc15', // 100 — gold
  '#fb923c', // 120 — ember
  '#f43f5e', // 140 — crimson (over)
  '#a855f7', // 160 — violet (over)
  '#22d3ee', // 180 — radiant (over)
  '#fde047', // 200 — divine (over)
];

const RARITY_TIERS = [
  { upTo: 20,  name: 'Common',     color: '#94a3b8' },
  { upTo: 40,  name: 'Uncommon',   color: '#60a5fa' },
  { upTo: 60,  name: 'Rare',       color: '#22d3ee' },
  { upTo: 80,  name: 'Epic',       color: '#a3e635' },
  { upTo: 100, name: 'Heroic',     color: '#facc15' },
  { upTo: 120, name: 'Legendary',  color: '#fb923c' },
  { upTo: 140, name: 'Mythic',     color: '#f43f5e' },
  { upTo: 160, name: 'Ascendant',  color: '#a855f7' },
  { upTo: 180, name: 'Radiant',    color: '#22d3ee' },
  { upTo: 200, name: 'Divine',     color: '#fde047' },
];

const defaults = () => ({});

let state = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaults();
})();

const listeners = new Set();
const persist = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} };
const emit = () => listeners.forEach((fn) => fn(getSnapshot()));

export function subscribeEnchantment(fn) {
  listeners.add(fn);
  fn(getSnapshot());
  return () => listeners.delete(fn);
}

export function getSnapshot() {
  return JSON.parse(JSON.stringify(state));
}

function ensureEntry(weaponId) {
  if (!state[weaponId]) state[weaponId] = { level: 0, normalAttempts: 0, overAttempts: 0 };
  return state[weaponId];
}

export function getEnchantment(weaponId) {
  return ensureEntry(weaponId);
}

export function isOverEnchant(level) {
  return level > MAX_NORMAL_LEVEL;
}

export function isMilestone(level) {
  return level > 0 && level % MILESTONE_STEP === 0;
}

export function getMilestoneIndex(level) {
  // Returns 0..9 for milestone bands (which color/tier the weapon is in).
  return Math.min(MILESTONES.length - 1, Math.floor(Math.max(0, level - 1) / MILESTONE_STEP));
}

export function getMilestoneColor(level) {
  if (level <= 0) return 'rgba(180,160,130,0.45)';
  return MILESTONE_GLOWS[getMilestoneIndex(level)];
}

export function getRarityForLevel(level) {
  return RARITY_TIERS.find((t) => level <= t.upTo) || RARITY_TIERS[RARITY_TIERS.length - 1];
}

// ATK derived purely from enchantment level (the base ATK is added by the
// weapon itself in the consuming view).
export function getAtkBonus(level) {
  const normal = Math.min(level, MAX_NORMAL_LEVEL) * ATK_PER_LEVEL_NORMAL;
  const over = Math.max(0, level - MAX_NORMAL_LEVEL) * ATK_PER_LEVEL_OVER;
  return normal + over;
}

// What does attempting +1 from `currentLevel` to `currentLevel+1` cost / preview?
export function getNextStepPreview(weaponId) {
  const entry = ensureEntry(weaponId);
  const cur = entry.level;
  if (cur >= MAX_LEVEL) {
    return { atMax: true };
  }
  const next = cur + 1;
  return {
    atMax: false,
    fromLevel: cur,
    toLevel: next,
    fromAtk: getAtkBonus(cur),
    toAtk: getAtkBonus(next),
    gold: goldCostFor(next),
    material: materialReqFor(next),
    isOver: isOverEnchant(next),
    crossesMilestone: isMilestone(next),
  };
}

// Attempt a single +1 enhancement. We always succeed for now — the curve
// difficulty comes from material/gold cost, not from RNG failure (this
// matches the screenshot's deterministic flow with Enhance / Refine buttons).
//
// Caller is responsible for verifying & spending materials/gold in their own
// economy store. This store ONLY tracks the level + history.
export function attemptEnhance(weaponId) {
  const entry = ensureEntry(weaponId);
  if (entry.level >= MAX_LEVEL) return { ok: false, reason: 'at_max' };
  const next = entry.level + 1;
  entry.level = next;
  if (next > MAX_NORMAL_LEVEL) entry.overAttempts += 1;
  else entry.normalAttempts += 1;
  persist();
  emit();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('weaponEnchanted', {
      detail: { weaponId, newLevel: next, crossedMilestone: isMilestone(next) },
    }));
  }
  return { ok: true, newLevel: next, crossedMilestone: isMilestone(next) };
}

// Admin / debug — reset a weapon back to enchant 0.
export function resetEnchantment(weaponId) {
  state[weaponId] = { level: 0, normalAttempts: 0, overAttempts: 0 };
  persist();
  emit();
}