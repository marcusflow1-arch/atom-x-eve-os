// Central player progression store.
// GameWorld3D publishes XP/level/stats here; HUD + Progression menu read from it.
// allocateStat() is callable from the menu and feeds back into the world's stats.
// Persists level/xp/baseStats/unspentPoints/hp to localStorage so progression
// survives logout and page reloads.
import { DEFAULT_PLAYER_STATS, computeDerivedStats, migrateBaseStats } from './statsSystem';
import { getHaloBonuses, subscribeHalo } from './progression/haloStore';
import { getAuraBonuses, subscribeAura } from './progression/auraStore';
import {
  getEquippedWingsMultiplierBonuses,
  getEquippedWingsFlatBonuses,
  subscribeWings,
} from './progression/wingsStore';
import { getEquippedTitleBonuses, subscribeTitles } from './progression/titleStore';
import { consumeRestedForGain } from './restedXPStore';
import { xpForLevel } from './gameWorldConfig';
import { characterScopedStorage, subscribeCharacterChange } from './characterStorage';

const storage = characterScopedStorage('wwm_player_progression_v1');
const STAT_POINTS_PER_LEVEL = 3;

// Pull current halo+aura+wings+title bonuses for every derived-stat recompute.
// Halo + Aura + equipped-wing multiplier are all VIRTUAL ATTRIBUTE POINTS —
// they pass through the same statsSystem formulas as allocated points
// (e.g. +1 STR → +3 phys dmg). Equipped-wing specialization + title are FLAT
// FINAL stats applied after the formulas.
const sumAttr = (...objs) => {
  const out = {
    strength: 0, constitution: 0, dexterity: 0, intelligence: 0, focus: 0,
    vitality: 0, spirit: 0, criticalChance: 0, criticalDefense: 0, criticalDamage: 0,
  };
  objs.forEach((o) => { if (!o) return; Object.keys(out).forEach((k) => { out[k] += o[k] || 0; }); });
  return out;
};
const sumFlat = (...objs) => {
  const out = { hp: 0, damage: 0, defense: 0, critChance: 0, critDamage: 0, criticalDefense: 0 };
  objs.forEach((o) => { if (!o) return; Object.keys(out).forEach((k) => { out[k] += o[k] || 0; }); });
  return out;
};

const getBonuses = () => ({
  halo:  sumAttr(getHaloBonuses(), getAuraBonuses(), getEquippedWingsMultiplierBonuses()),
  title: sumFlat(getEquippedTitleBonuses(), getEquippedWingsFlatBonuses()),
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

const loadState = () => {
  try {
    const saved = storage.get();
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
};

let state = loadState();

const listeners = new Set();
const persist = () => {
  storage.set(JSON.stringify({
    level: state.level,
    xp: state.xp,
    xpForNext: state.xpForNext,
    baseStats: state.baseStats,
    unspentPoints: state.unspentPoints,
    hp: state.hp,
  }));
};
const emit = () => {
  persist();
  listeners.forEach((fn) => fn(state));
};

// When the active character changes, reload that character's progression.
subscribeCharacterChange(() => {
  state = loadState();
  listeners.forEach((fn) => fn(state));
});

// Used by GameWorld3D to seed/sync hud snapshots. Persists too.
export function setPlayerHUD(next) {
  state = { ...state, ...next };
  emit();
}

// Called by GameWorld3D when player gains XP. Handles level-ups and awards points.
//
// Rested XP integration:
//   The caller computes its result (newLevel/newXP/xpForNext/levelsGained) using
//   only the BASE xp that was earned. This function then pulls a matching
//   amount of bonus XP out of the rested pool (1:1 with the base gain, so the
//   player effectively earns 2× while rested) and re-runs the level-up loop
//   with that bonus on top. Any rested pool left over rolls naturally into
//   future XP gains — there is nothing to carry across the level-up boundary
//   beyond the pool itself, which the rested store already preserves.
export function awardXP({ newLevel, newXP, xpForNext, levelsGained, bonusPoints = 0, xpGained = 0 }) {
  // Pull rested bonus matching the BASE gain. The bonus is applied at the
  // CURRENT level's xpForNext (the gain happened at that level).
  const restedBonus = xpGained > 0
    ? consumeRestedForGain(xpGained, state.xpForNext || xpForNext)
    : 0;

  let level = newLevel;
  let xp = newXP;
  let next = xpForNext;
  let extraLevels = 0;

  if (restedBonus > 0) {
    xp += restedBonus;
    let need = xpForLevel(level);
    next = need;
    while (xp >= need) {
      xp -= need;
      level += 1;
      extraLevels += 1;
      need = xpForLevel(level);
      next = need;
    }
  }

  const totalLevels = Math.max(0, levelsGained || 0) + extraLevels;
  const points = totalLevels * STAT_POINTS_PER_LEVEL + Math.max(0, bonusPoints);

  state = {
    ...state,
    level,
    xp,
    xpForNext: next,
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
subscribeAura(recomputeFromBonuses);
subscribeWings(recomputeFromBonuses);
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