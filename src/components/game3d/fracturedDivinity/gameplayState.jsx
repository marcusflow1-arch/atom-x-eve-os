// ─────────────────────────────────────────────────────────────────────────────
// DIVIDED: RECLAMATION — Core Game State + Save System
// ─────────────────────────────────────────────────────────────────────────────

const SAVE_KEY = 'divided_reclamation_save';

const DEFAULT_STATE = {
  level: 1,
  arc: 1,
  control: 100,          // 0–100: psychological stability
  perception: 'REALITY', // 'REALITY' | 'PERCEPTION'
  copyState: 'INTEGRATED', // 'INTEGRATED' | 'CONTROLLED' | 'DOMINATED' | 'SEPARATED'
  artemisState: 'STABLE',  // 'STABLE' | 'FADING' | 'STRONG'
  playerHP: 100,
  maxPlayerHP: 100,
  flags: {},
  history: [],           // arc-level decision log
  memoryFragments: 0,    // currency for ability upgrades
  unlockedAbilities: ['strike', 'dash', 'guard', 'focus'],
};

// Singleton mutable state
export const GameState = { ...DEFAULT_STATE };

// ── Subscribers ──────────────────────────────────────────────────────────────
const subscribers = new Set();

export function subscribeGameState(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function notify() {
  subscribers.forEach(fn => fn({ ...GameState }));
}

// ── Persistence ──────────────────────────────────────────────────────────────
export function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(GameState));
  } catch {}
}

export function loadGame() {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      Object.assign(GameState, parsed);
      notify();
    }
  } catch {}
}

export function resetGame() {
  Object.assign(GameState, { ...DEFAULT_STATE, flags: {}, history: [], unlockedAbilities: [...DEFAULT_STATE.unlockedAbilities] });
  localStorage.removeItem(SAVE_KEY);
  notify();
}

// ── Flag System ───────────────────────────────────────────────────────────────
export function setFlag(key, value = true) {
  GameState.flags[key] = value;
  saveGame();
  notify();
}

export function getFlag(key) {
  return GameState.flags[key] ?? false;
}

export function recordHistory(entry) {
  GameState.history.push({ arc: GameState.arc, level: GameState.level, ...entry, timestamp: Date.now() });
  saveGame();
}

// ── Control Meter ─────────────────────────────────────────────────────────────
export function modifyControl(amount) {
  GameState.control = Math.max(0, Math.min(100, GameState.control + amount));
  saveGame();
  notify();
  return GameState.control;
}

export function isLowControl() {
  return GameState.control < 30;
}

// ── Perception ────────────────────────────────────────────────────────────────
export function togglePerception() {
  GameState.perception = GameState.perception === 'REALITY' ? 'PERCEPTION' : 'REALITY';
  saveGame();
  notify();
}

// ── Copy State ────────────────────────────────────────────────────────────────
export function setCopyState(state) {
  GameState.copyState = state;
  recordHistory({ event: 'copy_state_set', value: state });
  saveGame();
  notify();
}

export function applyCopyPassive() {
  switch (GameState.copyState) {
    case 'INTEGRATED':
      modifyControl(+2);
      break;
    case 'CONTROLLED':
      // 20% chance of interrupt signal — consumers listen for this
      if (Math.random() < 0.2) notify();
      break;
    case 'DOMINATED':
      modifyControl(-2);
      break;
    case 'SEPARATED':
      // AI companion acts — consumers handle
      break;
  }
}

// ── Artemis State ─────────────────────────────────────────────────────────────
export function setArtemisState(state) {
  GameState.artemisState = state;
  saveGame();
  notify();
}

// ── HP ────────────────────────────────────────────────────────────────────────
export function setPlayerHP(hp) {
  GameState.playerHP = Math.max(0, Math.min(GameState.maxPlayerHP, hp));
  saveGame();
  notify();
}

// ── Abilities ─────────────────────────────────────────────────────────────────
export function unlockAbility(id) {
  if (!GameState.unlockedAbilities.includes(id)) {
    GameState.unlockedAbilities.push(id);
    saveGame();
    notify();
  }
}

export function hasAbility(id) {
  return GameState.unlockedAbilities.includes(id);
}

// ── Arc Progression ───────────────────────────────────────────────────────────
export function advanceArc() {
  GameState.arc = Math.min(10, GameState.arc + 1);
  GameState.level = (GameState.arc - 1) * 5 + 1;
  recordHistory({ event: 'arc_advanced' });
  saveGame();
  notify();
  return GameState.arc;
}

export function addMemoryFragments(n) {
  GameState.memoryFragments = (GameState.memoryFragments || 0) + n;
  saveGame();
  notify();
}