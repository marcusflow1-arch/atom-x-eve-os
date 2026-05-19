// ─── Soul Essence Store ───────────────────────────────────────────────────
// Persistent player currency used to enchant weapons. Souls are earned as
// random drops from enemy AI kills (chance-based). They are NOT gold —
// enchantment requires BOTH soul essence (the rare material) AND gold.

const STORAGE_KEY = 'soul_essence_store_v1';

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { souls: typeof p.souls === 'number' ? p.souls : 0 };
    }
  } catch {}
  return { souls: 0 };
};

let state = load();
const listeners = new Set();
const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} };
const emit = () => { save(); listeners.forEach((fn) => fn(state)); };

export function getSouls() { return state.souls; }
export function getSoulState() { return state; }
export function subscribeSouls(fn) { listeners.add(fn); fn(state); return () => listeners.delete(fn); }

export function addSouls(amount) {
  state = { ...state, souls: Math.max(0, state.souls + amount) };
  emit();
}

export function spendSouls(amount) {
  if (state.souls < amount) return false;
  state = { ...state, souls: state.souls - amount };
  emit();
  return true;
}