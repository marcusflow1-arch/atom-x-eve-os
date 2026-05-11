// Combat / action sound effect store.
// Maps action key → uploaded audio URL. Persists to localStorage.
// Game code calls playActionSound(key) at runtime to play the SFX.

const STORAGE_KEY = 'combat_audio_map_v1';

// All registered action types. Add new ones here + the manager picks them up.
export const ACTION_SOUNDS = [
  { key: 'player_walk',   label: 'Player Walk / Run',     category: 'player',  description: 'Plays in loop while the player moves' },
  { key: 'player_attack', label: 'Player Attack',         category: 'player',  description: 'Plays when the player swings (L-click / F)' },
  { key: 'player_hit',    label: 'Player Takes Damage',   category: 'player',  description: 'Plays when an enemy lands a hit on the player' },
  { key: 'player_jump',   label: 'Player Jump',           category: 'player',  description: 'Plays on jump (Space)' },
  { key: 'enemy_attack',  label: 'Enemy Attack',          category: 'enemy',   description: 'Plays when an enemy swings at the player' },
  { key: 'enemy_hit',     label: 'Enemy Takes Damage',    category: 'enemy',   description: 'Plays when an enemy is struck' },
  { key: 'enemy_death',   label: 'Enemy Death',           category: 'enemy',   description: 'Plays when an enemy dies' },
  { key: 'level_up',      label: 'Level Up',              category: 'system',  description: 'Plays when the player gains a level' },
  { key: 'quest_accept',  label: 'Quest Accepted',        category: 'system',  description: 'Plays when a quest is accepted' },
  { key: 'quest_complete',label: 'Quest Completed',       category: 'system',  description: 'Plays when a quest reward is claimed' },
];

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

export function getActionSound(key) {
  return map[key] || null;
}

export function getAllActionSounds() {
  return { ...map };
}

export function setActionSound(key, url) {
  map = { ...map, [key]: url };
  persist();
  emit();
}

export function clearActionSound(key) {
  const next = { ...map };
  delete next[key];
  map = next;
  persist();
  emit();
}

export function subscribeActionSounds(fn) {
  listeners.add(fn);
  fn(map);
  return () => listeners.delete(fn);
}

// Lightweight runtime player. Reuses a small pool so rapid-fire sounds
// (e.g. swings) don't cut each other off.
const POOL_SIZE = 4;
const audioPool = {};

export function playActionSound(key, { volume = 0.7 } = {}) {
  const url = map[key];
  if (!url) return;
  if (!audioPool[key]) audioPool[key] = [];
  // Find an unused (or finished) pool slot
  let audio = audioPool[key].find((a) => a.paused || a.ended);
  if (!audio) {
    if (audioPool[key].length < POOL_SIZE) {
      audio = new Audio(url);
      audioPool[key].push(audio);
    } else {
      audio = audioPool[key][0];
    }
  }
  // If the URL changed (admin replaced the file), refresh src
  if (audio.src !== url) audio.src = url;
  audio.volume = volume;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// Loop helpers (for walk SFX). Returns a stop function.
const loopInstances = {};

export function startLoopSound(key, { volume = 0.5 } = {}) {
  if (loopInstances[key]) return; // already looping
  const url = map[key];
  if (!url) return;
  const audio = new Audio(url);
  audio.loop = true;
  audio.volume = volume;
  audio.play().catch(() => {});
  loopInstances[key] = audio;
}

export function stopLoopSound(key) {
  const audio = loopInstances[key];
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    delete loopInstances[key];
  }
}