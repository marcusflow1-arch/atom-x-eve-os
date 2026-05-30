// questNetworkStore.js — Persistent reactive store for the quest network

import { QuestState, QUEST_LIST, getQuestDef } from './questNetwork';
import { setFlag, getFlag, adjustTrust, addPathScore, adjustChaos, getWorldState } from './worldStateStore';

const STORAGE_KEY = 'quest_network_v1';

function defaultState() {
  return {
    quests: {},          // { [questId]: { state, killProgress, killTarget, branchChoice } }
    notifications: [],   // toast queue
    dialogueOpen: null,  // { npcId, questId }
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch {}
  return defaultState();
}

let _state = load();
const _listeners = new Set();

function save() {
  try {
    const { notifications, dialogueOpen, ...rest } = _state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {}
}

function notify() { _listeners.forEach(fn => fn({ ..._state })); }

export function subscribeQuestNetwork(fn) {
  _listeners.add(fn);
  fn({ ..._state });
  return () => _listeners.delete(fn);
}

export function getQuestNetworkState() { return { ..._state }; }

// ── Dialogue ──────────────────────────────────────────────────────────────────
export function openDialogue(npcId, questId) {
  _state = { ..._state, dialogueOpen: { npcId, questId } };
  notify();
}

export function closeDialogue() {
  _state = { ..._state, dialogueOpen: null };
  notify();
}

// ── Accept quest ──────────────────────────────────────────────────────────────
export function acceptQuest(questId) {
  const def = getQuestDef(questId);
  if (!def) return;
  _state = {
    ..._state,
    quests: {
      ..._state.quests,
      [questId]: {
        state: QuestState.ACTIVE,
        killProgress: 0,
        killTarget: def.killTarget || 1,
        branchChoice: null,
      },
    },
  };
  _pushNotification({ type: 'accepted', questTitle: def.title });
  save(); notify();
}

// ── Record a kill (applies to all active quests) ──────────────────────────────
export function recordNetworkKill(questId) {
  const entry = _state.quests[questId];
  if (!entry || entry.state !== QuestState.ACTIVE) return;
  const newProgress = entry.killProgress + 1;
  const ready = newProgress >= entry.killTarget;
  _state = {
    ..._state,
    quests: {
      ..._state.quests,
      [questId]: {
        ...entry,
        killProgress: newProgress,
        state: ready ? QuestState.READY_TO_TURN : QuestState.ACTIVE,
      },
    },
  };
  if (ready) _pushNotification({ type: 'ready', questTitle: getQuestDef(questId)?.title });
  save(); notify();
}

// ── Turn in quest (with optional branch choice for shared quest) ──────────────
export function turnInQuest(questId, branchChoice = null) {
  const def = getQuestDef(questId);
  const entry = _state.quests[questId];
  if (!def || !entry) return null;

  // Resolve rewards
  let rewards, trustEffects, pathScore;
  if (def.hasBranching && branchChoice && def.rewards[branchChoice]) {
    rewards      = def.rewards[branchChoice];
    trustEffects = def.trustEffects[branchChoice] || {};
    pathScore    = rewards.pathScore || {};
    setFlag(rewards.flag);
  } else if (!def.hasBranching && def.rewards) {
    rewards      = def.rewards;
    trustEffects = def.trustEffects || {};
    pathScore    = rewards.pathScore || {};
    setFlag(rewards.flag);
  }

  // Apply trust + path scores + world chaos
  if (trustEffects) {
    Object.entries(trustEffects).forEach(([npcId, delta]) => adjustTrust(npcId, delta));
  }
  if (pathScore) {
    Object.entries(pathScore).forEach(([path, amt]) => addPathScore(path, amt));
  }
  // Combat path raises chaos
  if (branchChoice === 'kill' || def.id === 'kali_q2') adjustChaos(15);
  if (branchChoice === 'spare') adjustChaos(-10);

  _state = {
    ..._state,
    quests: {
      ..._state.quests,
      [questId]: { ...entry, state: QuestState.COMPLETED, branchChoice },
    },
  };

  _pushNotification({ type: 'completed', questTitle: def.title });
  save(); notify();

  return rewards || null;
}

// ── Force complete (debug) ─────────────────────────────────────────────────────
export function debugCompleteQuest(questId) {
  const entry = _state.quests[questId];
  const def   = getQuestDef(questId);
  if (!def) return;
  if (!entry || entry.state === QuestState.NONE) {
    acceptQuest(questId);
  }
  const killTarget = def.killTarget || 1;
  _state = {
    ..._state,
    quests: {
      ..._state.quests,
      [questId]: {
        state: QuestState.READY_TO_TURN,
        killProgress: killTarget,
        killTarget,
        branchChoice: null,
      },
    },
  };
  save(); notify();
}

// ── Reset ─────────────────────────────────────────────────────────────────────
export function resetNetwork() {
  _state = defaultState();
  localStorage.removeItem(STORAGE_KEY);
  notify();
}

// ── Notifications ─────────────────────────────────────────────────────────────
function _pushNotification(data) {
  const id = Date.now() + Math.random();
  _state = { ..._state, notifications: [..._state.notifications, { ...data, id }] };
}

export function dismissNotification(id) {
  _state = { ..._state, notifications: _state.notifications.filter(n => n.id !== id) };
  notify();
}