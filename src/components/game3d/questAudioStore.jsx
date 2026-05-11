// Quest voice-over audio store.
// Maps quest.id → uploaded audio file URL. Persists to localStorage so the
// admin's uploads survive page reloads. Both the admin manager and the
// QuestDialogueBox read from here.

const STORAGE_KEY = 'quest_audio_map_v1';

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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
};

export function getQuestAudio(questId) {
  return map[questId] || null;
}

export function getAllQuestAudio() {
  return { ...map };
}

export function setQuestAudio(questId, url) {
  map = { ...map, [questId]: url };
  persist();
  emit();
}

export function clearQuestAudio(questId) {
  const next = { ...map };
  delete next[questId];
  map = next;
  persist();
  emit();
}

export function subscribeQuestAudio(fn) {
  listeners.add(fn);
  fn(map);
  return () => listeners.delete(fn);
}