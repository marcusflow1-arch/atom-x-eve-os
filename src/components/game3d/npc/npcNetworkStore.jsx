// npcNetworkStore.js — Persistent quest + dialogue state for the NPC network

import { setFlag, adjustTrust, addPathScore, adjustChaos, getWorldState } from './worldStateStore';
import { getNetworkQuest } from './npcNetworkData';

const STORAGE_KEY = 'npc_network_quests_v1';

export const QS = {
  NONE:          'NONE',
  ACTIVE:        'ACTIVE',
  READY_TO_TURN: 'READY_TO_TURN',
  COMPLETED:     'COMPLETED',
};

function loadQuests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

let _state = {
  quests: loadQuests(),        // { [questId]: { state, killProgress, killTarget, choiceMade } }
  dialogueOpen: null,          // { npcId, questId } | null
  notifications: [],
  unlockedQuests: new Set(),
};

const _listeners = new Set();

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_state.quests)); } catch {}
}

function notify() {
  _listeners.forEach(fn => fn({
    ..._state,
    unlockedQuests: Array.from(_state.unlockedQuests),
  }));
}

export function subscribeNetwork(fn) {
  _listeners.add(fn);
  fn({ ..._state, unlockedQuests: Array.from(_state.unlockedQuests) });
  return () => _listeners.delete(fn);
}

export function getQuestEntry(questId) {
  return _state.quests[questId] || { state: QS.NONE, killProgress: 0, killTarget: 0 };
}

// ── Accept quest ──────────────────────────────────────────────────────────────
export function acceptNetworkQuest(questId) {
  const quest = getNetworkQuest(questId);
  if (!quest) return;
  _state = {
    ..._state,
    quests: {
      ..._state.quests,
      [questId]: { state: QS.ACTIVE, killProgress: 0, killTarget: quest.killTarget },
    },
    notifications: [..._state.notifications, { id: Date.now(), type: 'accept', questId }],
    dialogueOpen: null,
  };
  save(); notify();
}

// ── Record a kill against ALL active quests ────────────────────────────────
export function recordNetworkKill() {
  let changed = false;
  const updatedQuests = { ..._state.quests };
  const newNotifs = [];

  Object.entries(updatedQuests).forEach(([qId, entry]) => {
    if (entry.state !== QS.ACTIVE) return;
    const quest = getNetworkQuest(qId);
    if (!quest || quest.isChoiceQuest || quest.killTarget === 0) return;

    const newProgress = entry.killProgress + 1;
    const done = newProgress >= entry.killTarget;
    updatedQuests[qId] = { ...entry, killProgress: newProgress, state: done ? QS.READY_TO_TURN : QS.ACTIVE };
    if (done) newNotifs.push({ id: Date.now() + Math.random(), type: 'ready', questId: qId });
    changed = true;
  });

  if (!changed) return;
  _state = { ..._state, quests: updatedQuests, notifications: [..._state.notifications, ...newNotifs] };
  save(); notify();
}

// ── Player makes a branching choice ──────────────────────────────────────────
export function makeChoice(questId, choice) {
  // Apply world state effects
  setFlag(choice.consequence, true);
  Object.entries(choice.trustDeltas || {}).forEach(([npcId, delta]) => adjustTrust(npcId, delta));
  Object.entries(choice.pathScore || {}).forEach(([path, score]) => addPathScore(path, score));
  if (choice.chaosAdjust) adjustChaos(choice.chaosAdjust);

  // Unlock follow-on quests
  const newUnlocked = new Set(_state.unlockedQuests);
  (choice.unlocks || []).forEach(qId => newUnlocked.add(qId));

  _state = {
    ..._state,
    quests: {
      ..._state.quests,
      [questId]: { state: QS.COMPLETED, killProgress: 0, killTarget: 0, choiceMade: choice.id },
    },
    unlockedQuests: newUnlocked,
    notifications: [
      ..._state.notifications,
      { id: Date.now(), type: 'complete', questId },
      { id: Date.now() + 1, type: 'consequence', text: choice.nextDialogue },
    ],
    dialogueOpen: null,
  };
  save(); notify();
}

// ── Turn in a kill-objective quest ────────────────────────────────────────────
export function turnInNetworkQuest(questId) {
  const entry = getQuestEntry(questId);
  if (entry.state !== QS.READY_TO_TURN) return false;
  const quest = getNetworkQuest(questId);

  // Apply trust bonus
  Object.entries(quest?.trustBonus || {}).forEach(([npcId, delta]) => adjustTrust(npcId, delta));

  _state = {
    ..._state,
    quests: { ..._state.quests, [questId]: { ...entry, state: QS.COMPLETED } },
    notifications: [..._state.notifications, { id: Date.now(), type: 'complete', questId }],
    dialogueOpen: null,
  };
  save(); notify();
  return quest?.reward || {};
}

// ── Dialogue ──────────────────────────────────────────────────────────────────
export function openNetworkDialogue(npcId, questId) {
  _state = { ..._state, dialogueOpen: { npcId, questId } };
  notify();
}

export function closeNetworkDialogue() {
  _state = { ..._state, dialogueOpen: null };
  notify();
}

export function dismissNetworkNotification(id) {
  _state = { ..._state, notifications: _state.notifications.filter(n => n.id !== id) };
  notify();
}

// ── Debug ─────────────────────────────────────────────────────────────────────
export function debugFillProgress(questId) {
  const entry = getQuestEntry(questId);
  if (entry.state !== QS.ACTIVE) return;
  const quest = getNetworkQuest(questId);
  if (!quest || quest.isChoiceQuest) return;
  _state = {
    ..._state,
    quests: { ..._state.quests, [questId]: { ...entry, killProgress: quest.killTarget, state: QS.READY_TO_TURN } },
    notifications: [..._state.notifications, { id: Date.now(), type: 'ready', questId }],
  };
  save(); notify();
}

export function resetNetwork() {
  localStorage.removeItem(STORAGE_KEY);
  _state = { quests: {}, dialogueOpen: null, notifications: [], unlockedQuests: new Set() };
  notify();
}