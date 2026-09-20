// AXE Prompt 036 — character-scoped Quest Store.
// Preserves the legacy single-objective API while adding data-driven campaigns,
// multi-objective progress, story flags, abandonment, repeatability, choices,
// party-share hooks, and world discovery/interact event support.

import { characterScopedStorage, subscribeCharacterChange } from './characterStorage';
import {
  AXE_QUESTS,
  getAXEQuestObjectives,
  objectiveMatchesAXEQuestEvent,
} from './axe/quests/AXEQuestFramework';

const storage = characterScopedStorage('axe_quest_state_v2');
const LEGACY_STORAGE_KEY = 'wwm_quest_state_v1';

const defaultState = () => ({
  acceptedIds: [],
  completedIds: [],
  progress: {},
  objectiveProgress: {},
  lastAcceptedId: null,
  storyFlags: {},
  choices: {},
  abandonedIds: [],
  completionCounts: {},
});

const loadState = () => {
  try {
    let raw = storage.get();
    // One-way compatibility migration from the original non-character-scoped store.
    if (!raw && typeof localStorage !== 'undefined') raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaultState(),
        ...parsed,
        acceptedIds: Array.isArray(parsed.acceptedIds) ? parsed.acceptedIds : [],
        completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds : [],
        progress: parsed.progress || {},
        objectiveProgress: parsed.objectiveProgress || {},
        storyFlags: parsed.storyFlags || {},
        choices: parsed.choices || {},
        abandonedIds: Array.isArray(parsed.abandonedIds) ? parsed.abandonedIds : [],
        completionCounts: parsed.completionCounts || {},
      };
    }
  } catch {}
  return defaultState();
};

let state = loadState();
const listeners = new Set();

const persist = () => storage.set(JSON.stringify(state));
const notify = () => {
  persist();
  const snapshot = getQuestState();
  listeners.forEach((fn) => fn(snapshot));
};

subscribeCharacterChange(() => {
  state = loadState();
  listeners.forEach((fn) => fn(getQuestState()));
});

export function getQuestState() {
  return {
    ...state,
    acceptedIds: [...state.acceptedIds],
    completedIds: [...state.completedIds],
    progress: { ...state.progress },
    objectiveProgress: { ...state.objectiveProgress },
    storyFlags: { ...state.storyFlags },
    choices: { ...state.choices },
    abandonedIds: [...state.abandonedIds],
    completionCounts: { ...state.completionCounts },
  };
}

export function subscribeQuests(fn) {
  listeners.add(fn);
  fn(getQuestState());
  return () => listeners.delete(fn);
}

const objectiveId = (objective, index) =>
  objective?.id || `objective_${index}`;

const initializeQuestObjectives = (questDef) => {
  const objectives = getAXEQuestObjectives(questDef);
  const current = state.objectiveProgress[questDef?.id] || {};
  const next = { ...current };
  objectives.forEach((objective, index) => {
    const id = objectiveId(objective, index);
    if (!Number.isFinite(Number(next[id]))) next[id] = 0;
  });
  return next;
};

export function acceptQuest(questId, questDef = null) {
  if (state.acceptedIds.includes(questId)) return { ok: false, reason: 'ALREADY_ACCEPTED' };

  const def = questDef || AXE_QUESTS.find((q) => q.id === questId) || null;
  const repeatable = !!def?.repeatable;
  if (state.completedIds.includes(questId) && !repeatable) {
    return { ok: false, reason: 'ALREADY_COMPLETED' };
  }

  const requiredFlags = def?.storyFlagsRequired || [];
  if (requiredFlags.some((flag) => !state.storyFlags[flag])) {
    return { ok: false, reason: 'STORY_FLAG_REQUIRED' };
  }

  state = {
    ...state,
    acceptedIds: [...state.acceptedIds, questId],
    progress: { ...state.progress, [questId]: 0 },
    objectiveProgress: def
      ? { ...state.objectiveProgress, [questId]: initializeQuestObjectives(def) }
      : state.objectiveProgress,
    lastAcceptedId: questId,
    abandonedIds: state.abandonedIds.filter((id) => id !== questId),
  };
  notify();
  return { ok: true };
}

export function completeQuest(questId, questDef = null) {
  if (!state.acceptedIds.includes(questId)) return { ok: false, reason: 'NOT_ACCEPTED' };

  const def = questDef || AXE_QUESTS.find((q) => q.id === questId) || null;
  if (def && !isQuestComplete(def, state)) {
    return { ok: false, reason: 'OBJECTIVES_INCOMPLETE' };
  }

  const acceptedIds = state.acceptedIds.filter((id) => id !== questId);
  const completedIds = state.completedIds.includes(questId)
    ? state.completedIds
    : [...state.completedIds, questId];

  const storyFlags = { ...state.storyFlags };
  for (const flag of def?.storyFlagsOnComplete || []) storyFlags[flag] = true;

  state = {
    ...state,
    acceptedIds,
    completedIds,
    storyFlags,
    completionCounts: {
      ...state.completionCounts,
      [questId]: Number(state.completionCounts[questId] || 0) + 1,
    },
    lastAcceptedId: state.lastAcceptedId === questId
      ? (acceptedIds[acceptedIds.length - 1] || null)
      : state.lastAcceptedId,
  };
  notify();
  return { ok: true };
}

export function abandonQuest(questId) {
  if (!state.acceptedIds.includes(questId)) return { ok: false, reason: 'NOT_ACCEPTED' };
  const acceptedIds = state.acceptedIds.filter((id) => id !== questId);
  state = {
    ...state,
    acceptedIds,
    progress: { ...state.progress, [questId]: 0 },
    objectiveProgress: { ...state.objectiveProgress, [questId]: {} },
    abandonedIds: [...new Set([...state.abandonedIds, questId])],
    lastAcceptedId: state.lastAcceptedId === questId
      ? (acceptedIds[acceptedIds.length - 1] || null)
      : state.lastAcceptedId,
  };
  notify();
  return { ok: true };
}

export function reportQuestEvent(quests, event = {}) {
  const list = Array.isArray(quests) ? quests : [];
  const amount = Math.max(1, Number(event.count) || 1);
  let mutated = false;

  for (const questId of state.acceptedIds) {
    const q = list.find((entry) => entry.id === questId);
    if (!q) continue;

    const objectives = getAXEQuestObjectives(q);
    const qProgress = {
      ...(state.objectiveProgress[questId] || initializeQuestObjectives(q)),
    };

    objectives.forEach((objective, index) => {
      if (!objectiveMatchesAXEQuestEvent(objective, event)) return;
      const id = objectiveId(objective, index);
      const required = Math.max(1, Number(objective.count) || 1);
      qProgress[id] = Math.min(required, Number(qProgress[id] || 0) + amount);
      mutated = true;
    });

    if (mutated) {
      const firstId = objectiveId(objectives[0], 0);
      state.objectiveProgress = {
        ...state.objectiveProgress,
        [questId]: qProgress,
      };
      state.progress = {
        ...state.progress,
        [questId]: Number(qProgress[firstId] || 0),
      };
    }
  }

  if (mutated) notify();
  return mutated;
}

// Backward-compatible kill reporter used by GameWorld3D.
export function reportEnemyKill(quests, killedTier) {
  return reportQuestEvent(quests, {
    type: 'enemy_killed',
    tier: killedTier,
    count: 1,
  });
}

export function reportLocationDiscovery(quests, locationId) {
  return reportQuestEvent(quests, {
    type: 'location_discovered',
    targetId: locationId,
    count: 1,
  });
}

export function isQuestComplete(questDef, snapshot = state) {
  const objectives = getAXEQuestObjectives(questDef);
  if (!objectives.length) return false;
  const qProgress = snapshot.objectiveProgress?.[questDef.id] || {};

  return objectives
    .filter((objective) => !objective.optional)
    .every((objective, index) => {
      const id = objectiveId(objective, index);
      const required = Math.max(1, Number(objective.count) || 1);
      const fallback = index === 0 ? Number(snapshot.progress?.[questDef.id] || 0) : 0;
      return Number(qProgress[id] ?? fallback) >= required;
    });
}

export function setTrackedQuest(questId) {
  if (!state.acceptedIds.includes(questId)) return false;
  state = { ...state, lastAcceptedId: questId };
  notify();
  return true;
}

export function setQuestStoryFlag(flagId, value = true) {
  if (!flagId) return false;
  state = {
    ...state,
    storyFlags: { ...state.storyFlags, [flagId]: !!value },
  };
  notify();
  return true;
}

export function setQuestChoice(choiceId, value) {
  if (!choiceId) return false;
  state = {
    ...state,
    choices: { ...state.choices, [choiceId]: value },
  };
  notify();
  return true;
}

export function shareQuestWithParty(questId) {
  if (!state.acceptedIds.includes(questId)) return { ok: false, reason: 'NOT_ACCEPTED' };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeQuestShareRequested', {
      detail: { questId },
    }));
  }
  return { ok: true };
}

// World-event bridge. AXEWorldStreamingMount already emits axePOIDiscovered.
if (typeof window !== 'undefined' && !window.__axeQuestEventBridgeInstalled) {
  window.__axeQuestEventBridgeInstalled = true;

  window.addEventListener('axePOIDiscovered', (event) => {
    reportQuestEvent(AXE_QUESTS, {
      type: 'location_discovered',
      targetId: event?.detail?.id,
      count: 1,
    });
  });

  window.addEventListener('axeQuestEvent', (event) => {
    if (event?.detail?.type) reportQuestEvent(AXE_QUESTS, event.detail);
  });
}
