// ─────────────────────────────────────────────
// Quest Store — lightweight pub/sub for active/completed quests.
// Mirrors the pattern of playerHUDStore so it works the same way.
// ─────────────────────────────────────────────

const state = {
  acceptedIds: [],   // quest ids the player has accepted (in progress)
  completedIds: [],  // quest ids the player has finished
  progress: {},      // { questId: currentCount } for kill objectives
};

const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn(state));

export function getQuestState() {
  return state;
}

export function subscribeQuests(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export function acceptQuest(questId) {
  if (state.acceptedIds.includes(questId) || state.completedIds.includes(questId)) return;
  state.acceptedIds = [...state.acceptedIds, questId];
  state.progress = { ...state.progress, [questId]: 0 };
  notify();
}

export function completeQuest(questId) {
  if (!state.acceptedIds.includes(questId)) return;
  state.acceptedIds = state.acceptedIds.filter((id) => id !== questId);
  state.completedIds = [...state.completedIds, questId];
  notify();
}

// Bump kill-progress for all active quests of matching type.
// quests array is passed in to keep this store decoupled from quest data.
export function reportEnemyKill(quests, killedTier) {
  let mutated = false;
  state.acceptedIds.forEach((qid) => {
    const q = quests.find((x) => x.id === qid);
    if (!q) return;
    const obj = q.objective;
    if (obj.type === 'kill') {
      state.progress[qid] = (state.progress[qid] || 0) + 1;
      mutated = true;
    } else if (obj.type === 'kill_tier' && obj.tier === killedTier) {
      state.progress[qid] = (state.progress[qid] || 0) + 1;
      mutated = true;
    }
  });
  if (mutated) {
    state.progress = { ...state.progress };
    notify();
  }
}