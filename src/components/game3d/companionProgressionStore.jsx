// Companion progression store — persists each companion's level, XP, and stats.
// Parallels playerHUDStore but keyed by companionId so each pet has its own progression.
// Saved to localStorage so pets keep their levels across logouts.

import { consumeRestedForGain } from './restedXPStore';

// Companions earn 1.5× XP while the player has rested XP available
// (vs. the player's 2×). Bonus drains from the same shared rested pool.
const COMPANION_RESTED_MULT = 0.5; // +50% on top of base

const STORAGE_KEY = 'wwm_companion_progression_v1';
const STAT_POINTS_PER_LEVEL = 2;

// XP curve — kept gentler than the player so pets can level alongside you
const XP_TABLE = [4, 8, 14, 22, 34, 50, 70, 95, 125, 160];
export const companionXpForLevel = (level) =>
  XP_TABLE[Math.min(level - 1, XP_TABLE.length - 1)] || 200;

export const DEFAULT_COMPANION_STATS = {
  strength:  2,  // physical damage
  hp:        3,  // max HP / regen
  spirit:    1,  // mana / spell power
  dexterity: 2,  // defense / crit / range
  elemental: 0,  // elemental damage / defense
};

const buildDefault = () => ({
  level: 1,
  xp: 0,
  xpForNext: companionXpForLevel(1),
  baseStats: { ...DEFAULT_COMPANION_STATS },
  unspentPoints: 0,
});

// state shape: { [companionId]: companionEntry }
let state = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
})();

const listeners = new Set();
const persist = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
};
const emit = () => {
  persist();
  listeners.forEach((fn) => fn(state));
};

export function subscribeCompanionProgression(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export function getCompanionProgression(companionId) {
  if (!companionId) return buildDefault();
  if (!state[companionId]) {
    state = { ...state, [companionId]: buildDefault() };
    emit();
  }
  return state[companionId];
}

// Award XP to a specific companion. Handles multi-level-ups.
// Rested bonus: while the player has rested XP, the companion earns
// an extra 50% (1.5× total). Bonus is drawn from the shared rested pool.
export function awardCompanionXP(companionId, amount) {
  if (!companionId || amount <= 0) return;
  const cur = getCompanionProgression(companionId);

  // Pull a 0.5× bonus from the rested pool, capped by what's available.
  const desiredBonus = amount * COMPANION_RESTED_MULT;
  const restedBonus = consumeRestedForGain(desiredBonus, cur.xpForNext || companionXpForLevel(cur.level));
  const totalGain = amount + restedBonus;

  let newXP = cur.xp + totalGain;
  let newLevel = cur.level;
  let needed = companionXpForLevel(newLevel);
  let gained = 0;
  while (newXP >= needed) {
    newXP -= needed;
    newLevel++;
    gained++;
    needed = companionXpForLevel(newLevel);
  }
  state = {
    ...state,
    [companionId]: {
      ...cur,
      level: newLevel,
      xp: newXP,
      xpForNext: needed,
      unspentPoints: cur.unspentPoints + gained * STAT_POINTS_PER_LEVEL,
    },
  };
  emit();
}

// Spend 1 point on a stat for a specific companion.
export function allocateCompanionStat(companionId, statKey) {
  const cur = getCompanionProgression(companionId);
  if (cur.unspentPoints <= 0) return false;
  if (!(statKey in cur.baseStats)) return false;
  state = {
    ...state,
    [companionId]: {
      ...cur,
      baseStats: { ...cur.baseStats, [statKey]: cur.baseStats[statKey] + 1 },
      unspentPoints: cur.unspentPoints - 1,
    },
  };
  emit();
  return true;
}