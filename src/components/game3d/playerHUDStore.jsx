// Central player progression store.
// GameWorld3D publishes XP/level/stats here; HUD + Progression menu read from it.
// allocateStat() is callable from the menu and feeds back into the world's stats.
// Persists level/xp/baseStats/unspentPoints/hp to localStorage so progression
// survives logout and page reloads.
import { DEFAULT_PLAYER_STATS, computeDerivedStats, migrateBaseStats } from './statsSystem';
import { getHaloBonuses, subscribeHalo } from './progression/haloStore';
import { getEquippedTitleBonuses, subscribeTitles } from './progression/titleStore';

const STORAGE_KEY = 'wwm_player_progression_v1';
const STAT_POINTS_PER_LEVEL = 3;

// Pull current halo+title bonuses for every derived-stat recompute. Halo
// bonuses are treated as VIRTUAL ATTRIBUTE POINTS — they pass through the
// same statsSystem formulas as allocated points (e.g. +1 STR → +3 phys dmg).
const getBonuses = () => ({
  halo:  getHaloBonuses(),
  title: getEquippedTitleBonuses(),
});

const buildDefault = () => {
  const b = getBonuses();
  const derived = computeDerivedStats(DEFAULT_PLAYER_STATS, [], b.halo, b.title);
  return {
    level: 1,
    xp: 0,
    xpForNext: 5,
    baseStats: { ...DEFAULT_PLAYER_STATS },
    unspentPoints: 0,
    hp: derived.maxHP,
    maxHP: derived.maxHP,
    derived,
  };
};

let state = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate legacy stat keys (hp/spirit/elemental) → new NW keys.
      const base = migrateBaseStats(parsed.baseStats);
      const b = getBonuses();
      const derived = computeDerivedStats(base, [], b.halo, b.title);
      return {
        level: parsed.level || 1,
        xp: parsed.xp || 0,
        xpForNext: parsed.xpForNext || 5,
        baseStats: base,
        unspentPoints: parsed.unspentPoints || 0,
        maxHP: derived.maxHP,
        hp: Math.min(derived.maxHP, parsed.hp ?? derived.maxHP),
        derived,
      };
    }
  } catch {}
  return buildDefault();
})();

const listeners = new Set();
const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      level: state.level,
      xp: state.xp,
      xpForNext: state.xpForNext,
      baseStats: state.baseStats,
      unspentPoints: state.unspentPoints,
      hp: state.hp,
    }));
  } catch {}
};
const emit = () => {
  persist();
  listeners.forEach((fn) => fn(state));
};

// Used by GameWorld3D to seed/sync hud snapshots. Persists too.
export function setPlayerHUD(next) {
  state = { ...state, ...next };
  emit();
}

// Called by GameWorld3D when player gains XP. Handles level-ups and awards points.
export function awardXP({ newLevel, newXP, xpForNext, levelsGained, bonusPoints = 0 }) {
  const points = Math.max(0, levelsGained || 0) * STAT_POINTS_PER_LEVEL + Math.max(0, bonusPoints);
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
  const b = getBonuses();
  const newDerived = computeDerivedStats(newBase, [], b.halo, b.title);
  // Heal by the maxHP increase (so investing in vitality feels rewarding)
  const hpGain = newDerived.maxHP - state.maxHP;
  state = {
    ...state,
    baseStats: newBase,
    unspentPoints: state.unspentPoints - 1,
    derived: newDerived,
    maxHP: newDerived.maxHP,
    hp: Math.min(newDerived.maxHP, state.hp + Math.max(0, hpGain)),
  };
  emit();
  return true;
}

// Real-time recompute: when Halo level changes (or equipped title changes),
// re-run computeDerivedStats with the new virtual attribute points so the
// HUD, damage formulas, and UI all reflect the new bonuses instantly.
// Heals the player by any maxHP increase so leveling up Halo feels rewarding.
function recomputeFromBonuses() {
  const b = getBonuses();
  const newDerived = computeDerivedStats(state.baseStats, [], b.halo, b.title);
  const hpGain = newDerived.maxHP - state.maxHP;
  state = {
    ...state,
    derived: newDerived,
    maxHP: newDerived.maxHP,
    hp: Math.min(newDerived.maxHP, state.hp + Math.max(0, hpGain)),
  };
  emit();
}
subscribeHalo(recomputeFromBonuses);
subscribeTitles(recomputeFromBonuses);

// World pushes live HP (e.g. when player takes damage in the future).
export function setHP(hp) {
  state = { ...state, hp: Math.max(0, Math.min(state.maxHP, hp)) };
  emit();
}

// Called once per frame from the game loop. Regenerates HP based on derived hpRegen.
// Skipped if dead or at full HP. Internal accumulator avoids re-rendering every frame.
let regenAccumulator = 0;
export function tickRegen(delta) {
  if (!state.derived?.hpRegen) return;
  if (state.hp <= 0 || state.hp >= state.maxHP) return;
  regenAccumulator += state.derived.hpRegen * delta;
  if (regenAccumulator >= 1) {
    const gain = Math.floor(regenAccumulator);
    regenAccumulator -= gain;
    state = { ...state, hp: Math.min(state.maxHP, state.hp + gain) };
    emit();
  }
}

export function getPlayerHUD() {
  return state;
}

export function subscribePlayerHUD(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}