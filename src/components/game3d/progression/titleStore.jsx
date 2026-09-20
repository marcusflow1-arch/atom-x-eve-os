// AXE Prompt 029 — Title progression store.
// Five paths, fifteen stages, Contribution Points, active display title, and
// separate attribute + flat-stat outputs for the live combat pipeline.

import {
  MAX_TITLE_LEVEL,
  TITLE_PATHS,
  TITLE_KILL_POINTS,
  getTitleStageCost,
  getTitlePathById,
  getTitleBonusesForLevel,
  getTitleAttributeBonusesForLevel,
  getTitleRarityForLevel,
} from './titleData';
import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';

const storage = characterScopedStorage('title_progression_v2');

const initialPathState = () => {
  const paths = {};
  TITLE_PATHS.forEach((p) => {
    paths[p.id] = { level: 0, totalProgressPoints: 0 };
  });
  return paths;
};

const defaultTracking = () => ({
  totalEnemyKills: 0,
  bossKills: 0,
  eliteKills: 0,
  pvpKills: 0,
  raidParticipation: 0,
});

const loadState = () => {
  try {
    const raw = storage.get();
    if (raw) {
      const parsed = JSON.parse(raw);
      const paths = initialPathState();
      Object.keys(parsed.paths || {}).forEach((id) => {
        if (!paths[id]) return;
        const p = parsed.paths[id];
        paths[id] = {
          level: Math.max(0, Math.min(MAX_TITLE_LEVEL, Number(p.level || 0))),
          totalProgressPoints: Math.max(0, Number(p.totalProgressPoints ?? p.totalKills ?? 0)),
        };
      });
      return {
        paths,
        equippedPathId: parsed.equippedPathId || null,
        displayHidden: !!parsed.displayHidden,
        contributionPoints: Math.max(0, Number(parsed.contributionPoints || 0)),
        tracking: { ...defaultTracking(), ...(parsed.tracking || {}) },
      };
    }
  } catch {}

  return {
    paths: initialPathState(),
    equippedPathId: null,
    displayHidden: false,
    contributionPoints: 0,
    tracking: defaultTracking(),
  };
};

let state = loadState();
const listeners = new Set();

const save = () => storage.set(JSON.stringify(state));
const emit = () => {
  save();
  const snapshot = getTitleState();
  listeners.forEach((fn) => fn(snapshot));
};

subscribeCharacterChange(() => {
  state = loadState();
  listeners.forEach((fn) => fn(getTitleState()));
});

export function getTitleState() {
  const paths = {};
  TITLE_PATHS.forEach((def) => {
    const p = state.paths[def.id];
    const nextLevel = Math.min(MAX_TITLE_LEVEL, p.level + 1);
    paths[def.id] = {
      ...def,
      level: p.level,
      totalProgressPoints: p.totalProgressPoints,
      isMaxLevel: p.level >= MAX_TITLE_LEVEL,
      nextStageCost: p.level >= MAX_TITLE_LEVEL ? 0 : getTitleStageCost(nextLevel),
      canAdvance: p.level < MAX_TITLE_LEVEL && state.contributionPoints >= getTitleStageCost(nextLevel),
      rarity: getTitleRarityForLevel(Math.max(1, p.level || 1)),
      attributeBonuses: getTitleAttributeBonusesForLevel(def.id, p.level),
      bonuses: getTitleBonusesForLevel(def.id, p.level),
      nextLevelAttributeBonuses: p.level < MAX_TITLE_LEVEL
        ? getTitleAttributeBonusesForLevel(def.id, p.level + 1)
        : null,
      nextLevelBonuses: p.level < MAX_TITLE_LEVEL
        ? getTitleBonusesForLevel(def.id, p.level + 1)
        : null,
    };
  });

  return {
    paths,
    equippedPathId: state.equippedPathId,
    equippedTitle: state.equippedPathId ? paths[state.equippedPathId] : null,
    displayHidden: state.displayHidden,
    contributionPoints: state.contributionPoints,
    tracking: { ...state.tracking },
  };
}

export function getEquippedTitleBonuses() {
  if (!state.equippedPathId) {
    return { hp: 0, chi: 0, damage: 0, defense: 0, critChance: 0, critDamage: 0, criticalDefense: 0 };
  }
  const p = state.paths[state.equippedPathId];
  return getTitleBonusesForLevel(state.equippedPathId, p.level);
}

export function getEquippedTitleAttributeBonuses() {
  if (!state.equippedPathId) {
    return { strength: 0, constitution: 0, dexterity: 0, focus: 0 };
  }
  const p = state.paths[state.equippedPathId];
  return getTitleAttributeBonusesForLevel(state.equippedPathId, p.level);
}

export function subscribeTitles(fn) {
  listeners.add(fn);
  fn(getTitleState());
  return () => listeners.delete(fn);
}

export function recordTitleKill(killType = 'normal', count = 1) {
  const n = Math.max(0, Number(count) || 0);
  if (n <= 0) return;

  state.tracking.totalEnemyKills += n;
  if (killType === 'elite') state.tracking.eliteKills += n;
  if (killType === 'boss') state.tracking.bossKills += n;
  if (killType === 'pvp') state.tracking.pvpKills += n;
  if (killType === 'raid') state.tracking.raidParticipation += n;

  const points = (TITLE_KILL_POINTS[killType] ?? 1) * n;
  state.contributionPoints += points;

  if (state.equippedPathId && state.paths[state.equippedPathId]) {
    state.paths[state.equippedPathId].totalProgressPoints += points;
  }
  emit();
}

export function grantTitleContributionPoints(amount) {
  state = {
    ...state,
    contributionPoints: state.contributionPoints + Math.max(0, Number(amount) || 0),
  };
  emit();
  return state.contributionPoints;
}

export function advanceTitleStage(pathId) {
  const p = state.paths[pathId];
  if (!p) return { ok: false, reason: 'TITLE_PATH_MISSING' };
  if (p.level >= MAX_TITLE_LEVEL) return { ok: false, reason: 'MAX_STAGE' };

  const nextLevel = p.level + 1;
  const cost = getTitleStageCost(nextLevel);
  if (state.contributionPoints < cost) {
    return { ok: false, reason: 'INSUFFICIENT_CONTRIBUTION', cost, have: state.contributionPoints };
  }

  state = {
    ...state,
    contributionPoints: state.contributionPoints - cost,
    paths: {
      ...state.paths,
      [pathId]: { ...p, level: nextLevel },
    },
  };
  emit();
  return { ok: true, level: nextLevel, cost };
}

export function equipTitle(pathId) {
  if (!getTitlePathById(pathId)) return { ok: false, reason: 'TITLE_PATH_MISSING' };
  state = { ...state, equippedPathId: pathId };
  emit();
  return { ok: true };
}

export function unequipTitle() {
  state = { ...state, equippedPathId: null };
  emit();
}

export function setTitleDisplayHidden(hidden) {
  state = { ...state, displayHidden: !!hidden };
  emit();
}

export function setTitleLevel(pathId, level) {
  const p = state.paths[pathId];
  if (!p) return;
  state = {
    ...state,
    paths: {
      ...state.paths,
      [pathId]: {
        ...p,
        level: Math.max(0, Math.min(MAX_TITLE_LEVEL, Math.round(level))),
      },
    },
  };
  emit();
}

export function resetTitles() {
  state = {
    paths: initialPathState(),
    equippedPathId: null,
    displayHidden: false,
    contributionPoints: 0,
    tracking: defaultTracking(),
  };
  emit();
}
