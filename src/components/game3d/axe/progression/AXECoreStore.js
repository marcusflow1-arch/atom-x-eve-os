// AXE Prompt 024 — character-scoped Core persistence and transactions.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import {
  AXE_CORE_CONFIG,
  AXE_CORE_DEFINITIONS,
  addAXECoreXP,
  combineAXECoreBonuses,
  createAXECoreInstance,
  normalizeAXECoreInstance,
} from './AXECoreSystem';

const storage = characterScopedStorage('axe_core_progression_v1');

const starterState = () => ({
  essence: 500,
  cores: [
    createAXECoreInstance('axe_core_assault', 'axe_core_starter_assault'),
    createAXECoreInstance('axe_core_bastion', 'axe_core_starter_bastion'),
    createAXECoreInstance('axe_core_precision', 'axe_core_starter_precision'),
  ],
});

const load = () => {
  try {
    const raw = storage.get();
    if (!raw) return starterState();
    const parsed = JSON.parse(raw);
    return {
      essence: Math.max(0, Number(parsed.essence) || 0),
      cores: (parsed.cores || []).map(normalizeAXECoreInstance).filter(Boolean),
    };
  } catch {
    return starterState();
  }
};

let state = load();
const listeners = new Set();

const persist = () => storage.set(JSON.stringify(state));
const emit = () => {
  persist();
  listeners.forEach((fn) => fn(getAXECoreState()));
};

subscribeCharacterChange(() => {
  state = load();
  listeners.forEach((fn) => fn(getAXECoreState()));
});

export function getAXECoreState() {
  return {
    essence: state.essence,
    cores: state.cores.map((core) => ({ ...core })),
  };
}

export function subscribeAXECores(fn) {
  listeners.add(fn);
  fn(getAXECoreState());
  return () => listeners.delete(fn);
}

export function getRegisteredAXECores() {
  return state.cores.filter((core) => core.registered);
}

export function getRegisteredAXECoreBonuses() {
  return combineAXECoreBonuses(getRegisteredAXECores());
}

export function registerAXECore(instanceId) {
  const index = state.cores.findIndex((core) => core.instanceId === instanceId);
  if (index < 0) return { ok: false, reason: 'CORE_MISSING' };
  if (state.cores[index].registered) return { ok: true, reason: 'ALREADY_REGISTERED' };
  if (getRegisteredAXECores().length >= AXE_CORE_CONFIG.maxRegistered) {
    return { ok: false, reason: 'REGISTER_LIMIT' };
  }

  state = {
    ...state,
    cores: state.cores.map((core, i) => i === index ? { ...core, registered: true } : core),
  };
  emit();
  return { ok: true };
}

export function unregisterAXECore(instanceId) {
  const exists = state.cores.some((core) => core.instanceId === instanceId);
  if (!exists) return { ok: false, reason: 'CORE_MISSING' };
  state = {
    ...state,
    cores: state.cores.map((core) =>
      core.instanceId === instanceId ? { ...core, registered: false } : core
    ),
  };
  emit();
  return { ok: true };
}

export function upgradeAXECore(instanceId, {
  essencePerXP = 1,
  xpAmount = 100,
} = {}) {
  const index = state.cores.findIndex((core) => core.instanceId === instanceId);
  if (index < 0) return { ok: false, reason: 'CORE_MISSING' };

  const xp = Math.max(1, Number(xpAmount) || 1);
  const cost = Math.max(1, Math.ceil(xp * Math.max(0.01, Number(essencePerXP) || 1)));
  if (state.essence < cost) return { ok: false, reason: 'INSUFFICIENT_ESSENCE', cost };

  const result = addAXECoreXP(state.cores[index], xp);
  if (!result.ok) return result;

  state = {
    essence: state.essence - cost,
    cores: state.cores.map((core, i) => i === index ? result.core : core),
  };
  emit();
  return { ...result, cost };
}

export function grantAXECore(definitionId) {
  if (!AXE_CORE_DEFINITIONS[definitionId]) return { ok: false, reason: 'DEFINITION_MISSING' };
  const core = createAXECoreInstance(definitionId);
  state = { ...state, cores: [...state.cores, core] };
  emit();
  return { ok: true, core };
}

export function grantAXECoreEssence(amount) {
  state = { ...state, essence: state.essence + Math.max(0, Number(amount) || 0) };
  emit();
  return state.essence;
}
