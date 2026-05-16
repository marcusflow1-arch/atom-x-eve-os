// Run skill — Shift-to-sprint, default-owned passive movement skill.
// Stores upgrade level + computed speed multiplier; persists to localStorage.
// Read from GameWorld3D each frame to multiply RUN_SPEED.

const STORAGE_KEY = 'wwm_run_skill_v1';
const MAX_LEVEL = 5;
const BASE_MULT = 1.0;
const MULT_PER_LEVEL = 0.15; // +15% per level → up to +75% at lv 5

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { level: Math.max(1, Math.min(MAX_LEVEL, parsed.level || 1)) };
    }
  } catch {}
  return { level: 1 };
};

let state = load();
const listeners = new Set();
const emit = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  listeners.forEach((fn) => fn(state));
};

export function getRunSkill() {
  return { ...state, maxLevel: MAX_LEVEL, multiplier: getRunMultiplier() };
}

export function getRunMultiplier() {
  return BASE_MULT + (state.level - 1) * MULT_PER_LEVEL;
}

export function upgradeRunSkill() {
  if (state.level >= MAX_LEVEL) return false;
  state = { level: state.level + 1 };
  emit();
  return true;
}

export function subscribeRunSkill(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}