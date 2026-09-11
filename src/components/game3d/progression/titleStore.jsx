// ─── Title Store ──────────────────────────────────────────────────────────
// Modernized TwelveSky-style title progression.
// Combat still tracks kills for history/analytics, but title STAGES are now
// purchased with Contribution Points from the Character menu instead of being
// granted automatically by kill thresholds or requiring a palace NPC.

import {
  MAX_TITLE_LEVEL,
  TITLE_PATHS,
  killsRequiredForTitleLevel,
  getTitlePathById,
  getTitleBonusesForLevel,
  getTitleRarityForLevel,
} from './titleData';
import {
  getContributionPoints,
  spendContributionPoints,
  awardFieldContribution,
} from './contributionStore';
import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';

const storage = characterScopedStorage('title_progression_v1');

const initialPathState = () => {
  const paths = {};
  TITLE_PATHS.forEach((p) => {
    paths[p.id] = { level: 0, killsIntoLevel: 0, totalKills: 0 };
  });
  return paths;
};

const loadState = () => {
  try {
    const raw = storage.get();
    if (raw) {
      const parsed = JSON.parse(raw);
      const paths = initialPathState();
      Object.keys(parsed.paths || {}).forEach((id) => {
        if (paths[id]) {
          const p = parsed.paths[id];
          paths[id] = {
            level: Math.max(0, Math.min(MAX_TITLE_LEVEL, p.level || 0)),
            killsIntoLevel: Math.max(0, p.killsIntoLevel || 0),
            totalKills: Math.max(0, p.totalKills || 0),
          };
        }
      });
      return {
        paths,
        equippedPathId: parsed.equippedPathId || null,
        tracking: {
          totalEnemyKills: parsed.tracking?.totalEnemyKills || 0,
          bossKills: parsed.tracking?.bossKills || 0,
          eliteKills: parsed.tracking?.eliteKills || 0,
          pvpKills: parsed.tracking?.pvpKills || 0,
          raidParticipation: parsed.tracking?.raidParticipation || 0,
        },
      };
    }
  } catch {}
  return {
    paths: initialPathState(),
    equippedPathId: null,
    tracking: {
      totalEnemyKills: 0,
      bossKills: 0,
      eliteKills: 0,
      pvpKills: 0,
      raidParticipation: 0,
    },
  };
};

let state = loadState();
const listeners = new Set();

const save = () => { storage.set(JSON.stringify(state)); };
const emit = () => {
  const snapshot = getTitleState();
  listeners.forEach((fn) => fn(snapshot));
};

subscribeCharacterChange(() => { state = loadState(); emit(); });

// Existing Atom X Eve title curve becomes the CP curve at 10% of its old
// kill-point requirement. This preserves the relative pacing of the current
// 20-stage custom title system while switching the acquisition currency to CP.
export function titleCpCostForLevel(level) {
  if (level <= 0 || level > MAX_TITLE_LEVEL) return Infinity;
  const oldThreshold = killsRequiredForTitleLevel(level);
  return Number.isFinite(oldThreshold) ? Math.max(50, Math.round(oldThreshold / 10)) : Infinity;
}

export function getTitleState() {
  const paths = {};
  TITLE_PATHS.forEach((def) => {
    const p = state.paths[def.id];
    const nextLevel = p.level + 1;
    paths[def.id] = {
      ...def,
      level: p.level,
      killsIntoLevel: p.killsIntoLevel,
      killsForNextLevel: 0,
      totalKills: p.totalKills,
      isMaxLevel: p.level >= MAX_TITLE_LEVEL,
      cpForNextStage: p.level >= MAX_TITLE_LEVEL ? 0 : titleCpCostForLevel(nextLevel),
      canAffordNextStage: p.level < MAX_TITLE_LEVEL && getContributionPoints() >= titleCpCostForLevel(nextLevel),
      rarity: getTitleRarityForLevel(Math.max(1, p.level || 1)),
      bonuses: getTitleBonusesForLevel(def.id, p.level),
      nextLevelBonuses: p.level < MAX_TITLE_LEVEL
        ? getTitleBonusesForLevel(def.id, p.level + 1)
        : null,
    };
  });
  return {
    paths,
    equippedPathId: state.equippedPathId,
    equippedTitle: state.equippedPathId ? paths[state.equippedPathId] : null,
    tracking: { ...state.tracking },
    contributionPoints: getContributionPoints(),
  };
}

export function getEquippedTitleBonuses() {
  if (!state.equippedPathId) {
    return { hp: 0, damage: 0, defense: 0, critChance: 0, critDamage: 0, criticalDefense: 0 };
  }
  const p = state.paths[state.equippedPathId];
  return getTitleBonusesForLevel(state.equippedPathId, p.level);
}

export function subscribeTitles(fn) {
  listeners.add(fn);
  fn(getTitleState());
  return () => listeners.delete(fn);
}

// Combat now feeds CP + analytics. Title stages no longer auto-level from
// kills; players deliberately spend CP on the title path they want.
export function recordTitleKill(killType = 'normal', count = 1) {
  if (count <= 0) return;
  state.tracking.totalEnemyKills += count;
  if (killType === 'elite') state.tracking.eliteKills += count;
  if (killType === 'boss') state.tracking.bossKills += count;
  if (killType === 'pvp') state.tracking.pvpKills += count;
  if (killType === 'raid') state.tracking.raidParticipation += count;

  if (state.equippedPathId && state.paths[state.equippedPathId]) {
    state.paths[state.equippedPathId].totalKills += count;
  }

  awardFieldContribution(killType, count);
  save();
  emit();
}

export function purchaseTitleStage(pathId) {
  const p = state.paths[pathId];
  if (!p) return { ok: false, reason: 'Unknown title path.' };
  if (p.level >= MAX_TITLE_LEVEL) return { ok: false, reason: 'Title is already maxed.' };

  const nextLevel = p.level + 1;
  const cost = titleCpCostForLevel(nextLevel);
  const paid = spendContributionPoints(cost, `title:${pathId}:stage:${nextLevel}`);
  if (!paid.ok) return paid;

  p.level = nextLevel;
  p.killsIntoLevel = 0;
  save();
  emit();
  return { ok: true, level: nextLevel, spent: cost, remainingCP: paid.remaining };
}

export function equipTitle(pathId) {
  if (!getTitlePathById(pathId)) return;
  state.equippedPathId = pathId;
  save();
  emit();
}

export function unequipTitle() {
  state.equippedPathId = null;
  save();
  emit();
}

export function setTitleLevel(pathId, level) {
  const p = state.paths[pathId];
  if (!p) return;
  p.level = Math.max(0, Math.min(MAX_TITLE_LEVEL, Math.round(level)));
  p.killsIntoLevel = 0;
  save();
  emit();
}

export function resetTitles() {
  state = {
    paths: initialPathState(),
    equippedPathId: null,
    tracking: { totalEnemyKills: 0, bossKills: 0, eliteKills: 0, pvpKills: 0, raidParticipation: 0 },
  };
  save();
  emit();
}
