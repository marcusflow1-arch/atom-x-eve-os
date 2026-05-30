// worldStateStore.js — Persistent world state, flags, trust, reputation

const STORAGE_KEY = 'npc_world_state_v1';

const DEFAULT = {
  // Global flags set by player choices
  flags: {},
  // NPC trust: -100 (hostile) → 0 (neutral) → 100 (ally)
  trust: {
    npc_artemis:  0,
    npc_skadi:    0,
    npc_kali:     0,
    npc_system:   0,
    npc_stranger: 0,
  },
  // Aggregate path scores
  pathScores: { combat: 0, control: 0, mercy: 0, chaos: 0 },
  // Reputation title
  reputation: 'Unknown',
  // World changes
  world: {
    chaosLevel:   0,   // 0–100
    safeZoneActive: false,
    newEnemiesSpawned: false,
  },
  // Gameplay modifiers derived from choices
  modifiers: {
    damageBonus:    0,
    controlBonus:   0,
    chainDuration:  0,
    chainScaling:   0,
  },
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT));
}

let _state = load();
const _listeners = new Set();

function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_state)); } catch {} }
function notify() { _listeners.forEach(fn => fn({ ..._state })); }

export function subscribeWorld(fn) {
  _listeners.add(fn);
  fn({ ..._state });
  return () => _listeners.delete(fn);
}

export function getWorldState() { return { ..._state }; }

// ── Flags ─────────────────────────────────────────────────────────────────────
export function setFlag(key, value = true) {
  _state = { ..._state, flags: { ..._state.flags, [key]: value } };
  _recalcReputation();
  save(); notify();
}

export function getFlag(key) { return _state.flags[key] ?? false; }

// ── Trust ─────────────────────────────────────────────────────────────────────
export function adjustTrust(npcId, delta) {
  const current = _state.trust[npcId] ?? 0;
  _state = {
    ..._state,
    trust: { ..._state.trust, [npcId]: Math.max(-100, Math.min(100, current + delta)) },
  };
  save(); notify();
}

export function getTrust(npcId) { return _state.trust[npcId] ?? 0; }

// ── Path scores ───────────────────────────────────────────────────────────────
export function addPathScore(path, amount = 1) {
  _state = {
    ..._state,
    pathScores: { ..._state.pathScores, [path]: (_state.pathScores[path] || 0) + amount },
  };
  _recalcModifiers();
  _recalcReputation();
  save(); notify();
}

// ── World changes ─────────────────────────────────────────────────────────────
export function adjustChaos(delta) {
  const next = Math.max(0, Math.min(100, _state.world.chaosLevel + delta));
  _state = {
    ..._state,
    world: {
      ..._state.world,
      chaosLevel: next,
      newEnemiesSpawned: next >= 60,
      safeZoneActive: next <= 20,
    },
  };
  save(); notify();
}

// ── Internal: recalc modifiers from path scores ───────────────────────────────
function _recalcModifiers() {
  const { combat, control, mercy, chaos } = _state.pathScores;
  _state = {
    ..._state,
    modifiers: {
      damageBonus:   combat * 5,
      controlBonus:  mercy  * 4,
      chainDuration: (control + mercy) * 2,
      chainScaling:  combat * 3,
    },
  };
}

// ── Internal: derive reputation title ────────────────────────────────────────
function _recalcReputation() {
  const { combat, mercy, control, chaos } = _state.pathScores;
  const flags = _state.flags;
  let title = 'Unknown';
  if (flags.betrayed_artemis && flags.killed_first_target) title = 'The Destroyer';
  else if (flags.spared_all_targets) title = 'The Guardian';
  else if (flags.interrogated_all) title = 'The Inquisitor';
  else if (control > 5) title = 'System Operative';
  else if (mercy > 5) title = 'Peacekeeper';
  else if (combat > 5) title = 'Warlord';
  else if (chaos > 3) title = 'Agent of Chaos';
  _state = { ..._state, reputation: title };
}

// ── Reset ─────────────────────────────────────────────────────────────────────
export function resetWorldState() {
  _state = JSON.parse(JSON.stringify(DEFAULT));
  localStorage.removeItem(STORAGE_KEY);
  notify();
}