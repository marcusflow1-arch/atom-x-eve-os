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
import { getElixirBonuses, subscribeElixirs } from './progression/elixirStore';
import { consumeRestedForGain } from './restedXPStore';
import { xpForLevel } from './gameWorldConfig';
import { characterScopedStorage, subscribeCharacterChange } from './characterStorage';

const storage = characterScopedStorage('wwm_player_progression_v1');
const STAT_POINTS_PER_LEVEL = 3;

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
  elixir: getElixirBonuses(),
});

// TwelveSky-style elixirs are direct permanent bonuses, not virtual attribute
// points. Apply them after the normal Atom X Eve stat formulas so one VIT dose
// is exactly +20 max HP, one Spirit dose is exactly +25 Force, etc.
function applyElixirBonuses(derived, elixir = {}) {
  const bonusDamage = (elixir.damage || 0) + (elixir.attributeAttack || 0);
  const totalDamage = (derived.totalDamage || derived.damage || 0) + bonusDamage;
  return {
    ...derived,
    maxHP: (derived.maxHP || 0) + (elixir.hp || 0),
    chi: (derived.chi || 0) + (elixir.force || 0),
    hitChance: Math.min(95, (derived.hitChance || 0) + (elixir.hit || 0)),
    evasionPct: (derived.evasionPct || 0) + (elixir.dodge || 0),
    totalDamage,
    damage: totalDamage,
    elementalDefense: (derived.elementalDefense || 0) + (elixir.attributeDefense || 0),
    attributeAttack: elixir.attributeAttack || 0,
    attributeDefense: elixir.attributeDefense || 0,
    elixirBonuses: { ...elixir },
  };
}

function derive(baseStats, bonuses = getBonuses()) {
  return applyElixirBonuses(
    computeDerivedStats(baseStats, [], bonuses.halo, bonuses.title),
    bonuses.elixir,
  );
}

const buildDefault = () => {
  const b = getBonuses();
  const derived = derive(DEFAULT_PLAYER_STATS, b);
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
      const base = migrateBaseStats(parsed.baseStats);
      const b = getBonuses();
      const derived = derive(base, b);
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

subscribeCharacterChange(() => {
  state = loadState();
  listeners.forEach((fn) => fn(state));
});

export function setPlayerHUD(next) {
  state = { ...state, ...next };
  emit();
}

export function awardXP({ newLevel, newXP, xpForNext, levelsGained, bonusPoints = 0, xpGained = 0 }) {
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

export function allocateStat(statKey) {
  if (state.unspentPoints <= 0) return false;
  if (!(statKey in state.baseStats)) return false;
  const newBase = { ...state.baseStats, [statKey]: state.baseStats[statKey] + 1 };
  const b = getBonuses();
  const newDerived = derive(newBase, b);
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

function recomputeFromBonuses() {
  const b = getBonuses();
  const newDerived = derive(state.baseStats, b);
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
subscribeElixirs(recomputeFromBonuses);

export function setHP(hp) {
  state = { ...state, hp: Math.max(0, Math.min(state.maxHP, hp)) };
  emit();
}

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
