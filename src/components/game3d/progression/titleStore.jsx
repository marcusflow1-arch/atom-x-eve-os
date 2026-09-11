import {
  MAX_TITLE_LEVEL,
  TITLE_PATHS,
  getTitlePathById,
  getTitleBonusesForLevel,
  getTitleRarityForLevel,
  getTitleStageCost,
  getTotalTitleCpSpent,
} from './titleData';
import { addContribution, refundContribution, spendContribution } from './contributionStore';
import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';

const storage = characterScopedStorage('title_progression_v1');
const listeners = new Set();

const CP_PER_KILL = Object.freeze({ normal: 1, elite: 3, boss: 10, pvp: 10, raid: 5 });

function defaultState() {
  return {
    typeId: 'basic',
    stage: 0,
    enabled: true,
    tracking: { totalEnemyKills: 0, bossKills: 0, eliteKills: 0, pvpKills: 0, raidParticipation: 0 },
  };
}

function migrateLegacy(parsed) {
  if (!parsed) return defaultState();
  if (parsed.typeId) {
    return {
      ...defaultState(),
      ...parsed,
      typeId: getTitlePathById(parsed.typeId).id,
      stage: Math.max(0, Math.min(MAX_TITLE_LEVEL, Number(parsed.stage) || 0)),
      enabled: parsed.enabled !== false,
      tracking: { ...defaultState().tracking, ...(parsed.tracking || {}) },
    };
  }

  // Legacy Atom XE title store had four kill-leveled paths. Preserve the
  // player's visible progress while moving them onto the real TS2 title model.
  const legacyId = parsed.equippedPathId || 'basic';
  const mappedId = legacyId === 'dexterity' ? 'agility' : legacyId;
  const legacyStage = parsed.paths?.[legacyId]?.level || 0;
  return {
    ...defaultState(),
    typeId: getTitlePathById(mappedId).id,
    stage: Math.max(0, Math.min(MAX_TITLE_LEVEL, legacyStage)),
    enabled: !!parsed.equippedPathId,
    tracking: { ...defaultState().tracking, ...(parsed.tracking || {}) },
  };
}

function loadState() {
  try {
    const raw = storage.get();
    if (raw) return migrateLegacy(JSON.parse(raw));
  } catch {}
  return defaultState();
}

let state = loadState();
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
  const type = getTitlePathById(state.typeId);
  const nextStage = Math.min(MAX_TITLE_LEVEL, state.stage + 1);
  return {
    typeId: type.id,
    type,
    stage: state.stage,
    enabled: state.enabled,
    isMaxLevel: state.stage >= MAX_TITLE_LEVEL,
    rarity: getTitleRarityForLevel(Math.max(1, state.stage || 1)),
    bonuses: getTitleBonusesForLevel(type.id, state.stage),
    nextBonuses: state.stage < MAX_TITLE_LEVEL ? getTitleBonusesForLevel(type.id, nextStage) : null,
    nextCost: state.stage < MAX_TITLE_LEVEL ? getTitleStageCost(nextStage) : 0,
    totalCpSpent: getTotalTitleCpSpent(state.stage),
    tracking: { ...state.tracking },
    types: TITLE_PATHS,
  };
}

export function subscribeTitles(fn) {
  listeners.add(fn);
  fn(getTitleState());
  return () => listeners.delete(fn);
}

export function selectTitleType(typeId) {
  const type = getTitlePathById(typeId);
  if (!type) return { ok: false, reason: 'Unknown title type' };
  if (state.stage > 0 && type.id !== state.typeId) {
    return { ok: false, reason: 'Reset the current title before changing type' };
  }
  state = { ...state, typeId: type.id, enabled: true };
  emit();
  return { ok: true };
}

export function upgradeTitle() {
  if (state.stage >= MAX_TITLE_LEVEL) return { ok: false, reason: 'Title is already rank 12' };
  const nextStage = state.stage + 1;
  const cost = getTitleStageCost(nextStage);
  const spend = spendContribution(cost);
  if (!spend.ok) return spend;
  state = { ...state, stage: nextStage, enabled: true };
  emit();
  return { ok: true, stage: nextStage, cost };
}

export function resetTitle(refundRate = 0.7) {
  const rate = Math.max(0, Math.min(1, Number(refundRate) || 0));
  const refund = Math.floor(getTotalTitleCpSpent(state.stage) * rate);
  if (refund > 0) refundContribution(refund);
  state = { ...defaultState(), tracking: { ...state.tracking } };
  emit();
  return { ok: true, refund, refundRate: rate };
}

export function getEquippedTitleBonuses() {
  if (!state.enabled || state.stage <= 0) {
    return {
      strength: 0, agility: 0, dexterity: 0, vitality: 0, constitution: 0, spirit: 0, focus: 0,
      attributionAttackPct: 0, attributionDefensePct: 0,
    };
  }
  return getTitleBonusesForLevel(state.typeId, state.stage);
}

// Kept for existing GameWorld3D call sites. Kills now earn CP; they no longer
// level titles directly. This mirrors TwelveSky's contribution economy and
// lets the player decide when/where to spend CP from the personal menu.
export function recordTitleKill(killType = 'normal', count = 1) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  if (!n) return;
  state.tracking.totalEnemyKills += n;
  if (killType === 'elite') state.tracking.eliteKills += n;
  if (killType === 'boss') state.tracking.bossKills += n;
  if (killType === 'pvp') state.tracking.pvpKills += n;
  if (killType === 'raid') state.tracking.raidParticipation += n;
  addContribution((CP_PER_KILL[killType] || 1) * n);
  emit();
}

export function equipTitle(pathId = state.typeId) {
  if (state.stage <= 0) return;
  if (pathId && pathId !== state.typeId && state.stage === 0) state.typeId = getTitlePathById(pathId).id;
  state.enabled = true;
  emit();
}

export function unequipTitle() {
  state.enabled = false;
  emit();
}

export function setTitleLevel(pathId, level) {
  const type = getTitlePathById(pathId || state.typeId);
  state = {
    ...state,
    typeId: type.id,
    stage: Math.max(0, Math.min(MAX_TITLE_LEVEL, Math.round(Number(level) || 0))),
    enabled: true,
  };
  emit();
}

export function resetTitles() {
  state = defaultState();
  emit();
}
