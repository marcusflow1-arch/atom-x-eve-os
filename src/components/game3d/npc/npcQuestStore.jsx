// npcQuestStore.js — Reactive store for all NPC quest state

import { QuestState } from './questData';

const DEFAULT_STATE = {
  // Map of questId → { state, killProgress, killTarget }
  quests: {},
  // Which NPC dialogue is open: null | { npcId, questId }
  dialogueOpen: null,
  // Notification queue
  notifications: [],
};

let _state = { ...DEFAULT_STATE, quests: {} };
const _listeners = new Set();

function notify() {
  _listeners.forEach(fn => fn({ ..._state }));
}

export function subscribeNPCQuest(fn) {
  _listeners.add(fn);
  fn({ ..._state });
  return () => _listeners.delete(fn);
}

export function getNPCQuestState() {
  return { ..._state };
}

// ── Quest lifecycle ────────────────────────────────────────────────────────────

export function getQuestEntry(questId) {
  return _state.quests[questId] || { state: QuestState.NONE, killProgress: 0, killTarget: 1 };
}

export function acceptQuest(questId, killTarget) {
  _state = {
    ..._state,
    quests: {
      ..._state.quests,
      [questId]: { state: QuestState.ACTIVE, killProgress: 0, killTarget },
    },
    notifications: [..._state.notifications, { id: Date.now(), type: 'accept', questId }],
  };
  notify();
}

export function recordKill(questId) {
  const entry = getQuestEntry(questId);
  if (entry.state !== QuestState.ACTIVE) return;

  const newProgress = entry.killProgress + 1;
  const completed = newProgress >= entry.killTarget;

  _state = {
    ..._state,
    quests: {
      ..._state.quests,
      [questId]: {
        ...entry,
        killProgress: newProgress,
        state: completed ? QuestState.READY_TO_TURN : QuestState.ACTIVE,
      },
    },
    notifications: completed
      ? [..._state.notifications, { id: Date.now(), type: 'ready', questId }]
      : _state.notifications,
  };
  notify();
}

export function turnInQuest(questId) {
  const entry = getQuestEntry(questId);
  if (entry.state !== QuestState.READY_TO_TURN) return false;

  _state = {
    ..._state,
    quests: {
      ..._state.quests,
      [questId]: { ...entry, state: QuestState.COMPLETED },
    },
    notifications: [..._state.notifications, { id: Date.now(), type: 'complete', questId }],
  };
  notify();
  return true;
}

export function dismissNotification(id) {
  _state = {
    ..._state,
    notifications: _state.notifications.filter(n => n.id !== id),
  };
  notify();
}

// ── Dialogue control ──────────────────────────────────────────────────────────

export function openDialogue(npcId, questId) {
  _state = { ..._state, dialogueOpen: { npcId, questId } };
  notify();
}

export function closeDialogue() {
  _state = { ..._state, dialogueOpen: null };
  notify();
}

// ── Debug helpers ─────────────────────────────────────────────────────────────

export function debugCompleteQuest(questId) {
  const entry = getQuestEntry(questId);
  if (entry.state !== QuestState.ACTIVE) return;
  _state = {
    ..._state,
    quests: {
      ..._state.quests,
      [questId]: { ...entry, killProgress: entry.killTarget, state: QuestState.READY_TO_TURN },
    },
    notifications: [..._state.notifications, { id: Date.now(), type: 'ready', questId }],
  };
  notify();
}

export function resetAllQuests() {
  _state = { ...DEFAULT_STATE, quests: {} };
  notify();
}