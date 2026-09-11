import {
  ELIXIR_TYPES,
  STANDARD_ELIXIR_CAP,
  OVER_ELIXIR_CAP,
  VANITY_ELIXIR_BONUS,
  VANITY_SET_PIECES,
  getElixirCap,
  getElixirPhase,
  getElixirType,
} from './elixirData';
import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';

const storage = characterScopedStorage('twelvesky_elixirs_v1');
const listeners = new Set();

const emptyMap = () => Object.fromEntries(ELIXIR_TYPES.map((type) => [type.id, 0]));
const makeDefault = () => ({ doses: emptyMap(), stock: emptyMap(), vanityPieces: 0 });

function load() {
  try {
    const raw = storage.get();
    if (!raw) return makeDefault();
    const parsed = JSON.parse(raw);
    return {
      doses: { ...emptyMap(), ...(parsed.doses || {}) },
      stock: { ...emptyMap(), ...(parsed.stock || {}) },
      vanityPieces: Math.max(0, Math.min(VANITY_SET_PIECES, Math.floor(Number(parsed.vanityPieces) || 0))),
    };
  } catch { return makeDefault(); }
}

let state = load();
const save = () => storage.set(JSON.stringify(state));
const emit = () => {
  save();
  const value = getElixirState();
  listeners.forEach((fn) => fn(value));
};

subscribeCharacterChange(() => { state = load(); emit(); });

export function getElixirFlatBonuses() {
  const out = {
    hp: 0,
    damage: 0,
    chi: 0,
    attackSuccess: 0,
    attackBlock: 0,
    attributionAttack: 0,
    attributionDefense: 0,
  };
  ELIXIR_TYPES.forEach((type) => {
    const count = Math.max(0, Number(state.doses[type.id]) || 0);
    Object.entries(type.perDose).forEach(([key, value]) => { out[key] = (out[key] || 0) + value * count; });
  });
  return out;
}

export function getElixirState() {
  const cap = getElixirCap(state.vanityPieces);
  return {
    doses: { ...state.doses },
    stock: { ...state.stock },
    vanityPieces: state.vanityPieces,
    vanityComplete: state.vanityPieces >= VANITY_SET_PIECES,
    standardCap: STANDARD_ELIXIR_CAP,
    overCap: OVER_ELIXIR_CAP,
    vanityBonus: VANITY_ELIXIR_BONUS,
    cap,
    types: ELIXIR_TYPES.map((type) => ({
      ...type,
      doses: state.doses[type.id] || 0,
      stock: state.stock[type.id] || 0,
      phase: getElixirPhase(state.doses[type.id] || 0),
    })),
    bonuses: getElixirFlatBonuses(),
  };
}

export function subscribeElixirs(fn) { listeners.add(fn); fn(getElixirState()); return () => listeners.delete(fn); }

export function grantElixirs(typeId, amount = 1) {
  if (!getElixirType(typeId)) return { ok: false, reason: 'unknown_elixir' };
  const count = Math.max(0, Math.floor(Number(amount) || 0));
  if (!count) return { ok: false, reason: 'invalid_amount' };
  state = { ...state, stock: { ...state.stock, [typeId]: (state.stock[typeId] || 0) + count } };
  emit();
  return { ok: true, count };
}

export function consumeElixir(typeId, amount = 1) {
  if (!getElixirType(typeId)) return { ok: false, reason: 'unknown_elixir' };
  const requested = Math.max(1, Math.floor(Number(amount) || 1));
  const have = state.stock[typeId] || 0;
  if (have < requested) return { ok: false, reason: 'insufficient_stock', have, need: requested };
  const current = state.doses[typeId] || 0;
  const cap = getElixirCap(state.vanityPieces);
  const room = Math.max(0, cap - current);
  if (room <= 0) return { ok: false, reason: 'cap_reached', cap };
  const used = Math.min(requested, room);
  state = {
    ...state,
    doses: { ...state.doses, [typeId]: current + used },
    stock: { ...state.stock, [typeId]: have - used },
  };
  emit();
  return { ok: true, used, doses: current + used, cap };
}

// Equipment integration hook. Gear/Vanity systems can call this as pieces are
// equipped; the full five-piece set unlocks +50 capacity on every elixir line.
export function setVanityPieces(count) {
  state = { ...state, vanityPieces: Math.max(0, Math.min(VANITY_SET_PIECES, Math.floor(Number(count) || 0))) };
  emit();
}

export function setElixirDoses(typeId, count) {
  if (!getElixirType(typeId)) return false;
  const cap = getElixirCap(state.vanityPieces);
  state = { ...state, doses: { ...state.doses, [typeId]: Math.max(0, Math.min(cap, Math.floor(Number(count) || 0))) } };
  emit();
  return true;
}
