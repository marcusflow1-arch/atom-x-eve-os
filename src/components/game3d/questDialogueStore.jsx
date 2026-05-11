// Per-quest editable dialogue text store.
// Admin can rewrite the NPC's spoken line for any quest. Returns the override
// if present, else the original quest.description.

const STORAGE_KEY = 'quest_dialogue_overrides_v1';

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

let map = load();
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(map));
const persist = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch {}
};

export function getQuestDialogue(questId, fallback) {
  return (map[questId] && map[questId].trim()) || fallback || '';
}

export function getAllQuestDialogue() {
  return { ...map };
}

export function setQuestDialogue(questId, text) {
  map = { ...map, [questId]: text };
  persist();
  emit();
}

export function clearQuestDialogue(questId) {
  const next = { ...map };
  delete next[questId];
  map = next;
  persist();
  emit();
}

export function subscribeQuestDialogue(fn) {
  listeners.add(fn);
  fn(map);
  return () => listeners.delete(fn);
}