// Central player progression store.
// GameWorld3D publishes XP/level/stats here; HUD + Progression menu read from it.
// allocateStat() is callable from the menu and feeds back into the world's stats.
import { DEFAULT_PLAYER_STATS, computeDerivedStats } from './statsSystem';

const STAT_POINTS_PER_LEVEL = 3;

let state = {
  level: 1,
  xp: 0,
  xpForNext: 5,
  baseStats: { ...DEFAULT_PLAYER_STATS },
  unspentPoints: 0,
  hp: computeDerivedStats(DEFAULT_PLAYER_STATS, []).maxHP,
  maxHP: computeDerivedStats(DEFAULT_PLAYER_STATS, []).maxHP,
  derived: computeDerivedStats(DEFAULT_PLAYER_STATS, []),
};
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(state));

export function setPlayerHUD(next) {
  state = { ...state, ...next };
  emit();
}

// Called by GameWorld3D when player gains XP. Handles level-ups and awards points.
export function awardXP({ newLevel, newXP, xpForNext, levelsGained }) {
  const points = Math.max(0, levelsGained || 0) * STAT_POINTS_PER_LEVEL;
  state = {
    ...state,
    level: newLevel,
    xp: newXP,
    xpForNext,
    unspentPoints: state.unspentPoints + points,
  };
  emit();
}

// Player allocates 1 point into a stat (called from progression menu).
// Returns true on success.
export function allocateStat(statKey) {
  if (state.unspentPoints <= 0) return false;
  if (!(statKey in state.baseStats)) return false;
  const newBase = { ...state.baseStats, [statKey]: state.baseStats[statKey] + 1 };
  const newDerived = computeDerivedStats(newBase, []);
  // Preserve current HP ratio when max HP changes
  const ratio = state.maxHP > 0 ? state.hp / state.maxHP : 1;
  state = {
    ...state,
    baseStats: newBase,
    unspentPoints: state.unspentPoints - 1,
    derived: newDerived,
    maxHP: newDerived.maxHP,
    hp: Math.min(newDerived.maxHP, Math.round(newDerived.maxHP * ratio) + (newDerived.maxHP - state.maxHP)),
  };
  emit();
  return true;
}

// World pushes live HP (e.g. when player takes damage in the future).
export function setHP(hp) {
  state = { ...state, hp: Math.max(0, Math.min(state.maxHP, hp)) };
  emit();
}

export function getPlayerHUD() {
  return state;
}

export function subscribePlayerHUD(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}