// Central player progression store.
// GameWorld3D publishes XP/level/stats here; HUD + Character menus read from it.
// TwelveSky-style progression grants five distributable stat points per level.
import { DEFAULT_PLAYER_STATS, computeDerivedStats, migrateBaseStats } from './statsSystem';
import { getHaloBonuses, subscribeHalo } from './progression/haloStore';
import { getAuraBonuses, subscribeAura } from './progression/auraStore';
import { getPalaceBonusesForPlayer, subscribePalace } from './progression/palaceStore';
import { getElixirFlatBonuses, subscribeElixirs } from './progression/elixirStore';
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
const STAT_POINTS_PER_LEVEL = 5;

// Attribute bonuses are normalized here so TwelveSky names (Agility/Vitality/
// Spirit) and the older Atom XE names (Dexterity/Constitution/Focus) feed the
// same combat pipeline while the wider engine migration is in progress.
const sumAttr = (...objs) => {
  const out = {
    strength: 0,
    constitution: 0,
    dexterity: 0,
    intelligence: 0,
    focus: 0,
    criticalChance: 0,
    criticalDefense: 0,
    criticalDamage: 0,
    attributionAttackPct: 0,
    attributionDefensePct: 0,
  };
  objs.forEach((o) => {
    if (!o) return;
    out.strength += o.strength || 0;
    out.constitution += o.constitution ?? o.vitality ?? 0;
    out.dexterity += o.dexterity ?? o.agility ?? 0;
    out.intelligence += o.intelligence ?? o.elemental ?? 0;
    out.focus += o.focus ?? o.spirit ?? 0;
    out.criticalChance += o.criticalChance || 0;
    out.criticalDefense += o.criticalDefense || 0;
    out.criticalDamage += o.criticalDamage || 0;
    out.attributionAttackPct += o.attributionAttackPct || 0;
    out.attributionDefensePct += o.attributionDefensePct || 0;
  });
  return out;
};

const sumFlat = (...objs) => {
  const out = {
    hp: 0,
    damage: 0,
    defense: 0,
    chi: 0,
    attackSuccess: 0,
    attackBlock: 0,
    attributionAttack: 0,
    attributionDefense: 0,
    critChance: 0,
    critDamage: 0,
    criticalDefense: 0,
  };
  objs.forEach((o) => { if (!o) return; Object.keys(out).forEach((k) => { out[k] += o[k] || 0; }); });
  return out;
};

const getBonuses = () => ({
  halo: sumAttr(
    getHaloBonuses(),
    getAuraBonuses(),
    getPalaceBonusesForPlayer(),
    getEquippedWingsMultiplierBonuses(),
    getEquippedTitleBonuses(),
  ),
  title: sumFlat(
    getEquippedWingsFlatBonuses(),
    getElixirFlatBonuses(),
  ),
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
  const newDerived = computeDerivedStats(newBase, [], b.halo, b.title);
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
subscribePalace(recomputeFromBonuses);
subscribeElixirs(recomputeFromBonuses);
subscribeWings(recomputeFromBonuses);
subscribeTitles(recomputeFromBonuses);

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

export function getPlayerHUD() { return state; }
export function subscribePlayerHUD(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}
