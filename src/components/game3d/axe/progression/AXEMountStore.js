// AXE Prompt 034 — character-scoped Mount progression and ride state.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import { setActiveCompanion, setMounted } from '../../companionStore';
import {
  AXE_MOUNT_CONFIG,
  AXE_MOUNT_DEFINITIONS,
  addAXEMountXP,
  canRideAXEMount,
  createAXEMountInstance,
  getAXEMountBonuses,
  getAXEMountDefinition,
  getAXEMountSpeedMultiplier,
  getAXEMountXPReward,
  normalizeAXEMountInstance,
} from './AXEMountSystem';

const storage = characterScopedStorage('axe_mount_progression_v1');

const starterMount = () => ({
  ...createAXEMountInstance('axe_mount_war_wolf', 'axe_mount_starter_war_wolf'),
  registered: true,
  active: true,
});

const starter = () => ({
  mounts: [starterMount()],
  registeredMountId: 'axe_mount_starter_war_wolf',
  activeMountId: 'axe_mount_starter_war_wolf',
  ridingMountId: null,
  pvpVictimCooldowns: {},
});

const load = () => {
  try {
    const raw = storage.get();
    if (!raw) return starter();
    const parsed = JSON.parse(raw);
    const mounts = (parsed.mounts || []).map(normalizeAXEMountInstance).filter(Boolean);
    return {
      ...starter(),
      ...parsed,
      mounts: mounts.length ? mounts : starter().mounts,
      pvpVictimCooldowns: parsed.pvpVictimCooldowns || {},
      ridingMountId: null,
    };
  } catch {
    return starter();
  }
};

let state = load();
const listeners = new Set();
let rideActivity = { seconds: 0, distanceMeters: 0 };

const persistedState = () => ({
  ...state,
  ridingMountId: null,
  mounts: state.mounts.map((mount) => ({ ...mount, riding: false })),
});

const emit = () => {
  storage.set(JSON.stringify(persistedState()));
  const snapshot = getAXEMountState();
  listeners.forEach((fn) => fn(snapshot));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeMountChanged', { detail: snapshot }));
  }
};

subscribeCharacterChange(() => {
  state = load();
  rideActivity = { seconds: 0, distanceMeters: 0 };
  listeners.forEach((fn) => fn(getAXEMountState()));
});

export function getAXEMountState() {
  return {
    ...state,
    mounts: state.mounts.map((mount) => ({
      ...mount,
      definition: getAXEMountDefinition(mount.definitionId),
      bonuses: getAXEMountBonuses(mount),
      speedMultiplier: getAXEMountSpeedMultiplier(mount),
    })),
    pvpVictimCooldowns: { ...state.pvpVictimCooldowns },
  };
}

export function subscribeAXEMounts(fn) {
  listeners.add(fn);
  fn(getAXEMountState());
  return () => listeners.delete(fn);
}

export function getActiveAXEMount() {
  return state.mounts.find((mount) => mount.instanceId === state.activeMountId) || null;
}

export function getRegisteredAXEMount() {
  return state.mounts.find((mount) => mount.instanceId === state.registeredMountId) || null;
}

export function getRegisteredAXEMountBonuses() {
  const mount = getRegisteredAXEMount();
  return mount ? getAXEMountBonuses(mount) : { hp: 0, damage: 0, defense: 0, attributionAttack: 0, attributionDefense: 0 };
}

export function getActiveAXEMountSpeedMultiplier() {
  const mount = getActiveAXEMount();
  return mount ? getAXEMountSpeedMultiplier(mount) : null;
}

export function registerAXEMount(instanceId) {
  const mount = state.mounts.find((entry) => entry.instanceId === instanceId);
  if (!mount) return { ok: false, reason: 'MOUNT_MISSING' };
  state = {
    ...state,
    registeredMountId: instanceId,
    mounts: state.mounts.map((entry) => ({ ...entry, registered: entry.instanceId === instanceId })),
  };
  emit();
  return { ok: true };
}

export function activateAXEMount(instanceId) {
  const mount = state.mounts.find((entry) => entry.instanceId === instanceId);
  if (!mount) return { ok: false, reason: 'MOUNT_MISSING' };
  const def = getAXEMountDefinition(mount.definitionId);
  state = {
    ...state,
    activeMountId: instanceId,
    ridingMountId: null,
    mounts: state.mounts.map((entry) => ({
      ...entry,
      active: entry.instanceId === instanceId,
      riding: false,
    })),
  };
  setMounted(false);
  if (def?.modelRef) setActiveCompanion(def.modelRef);
  emit();
  return { ok: true };
}

export function setAXEMountRiding(riding, context = {}) {
  const mount = getActiveAXEMount();
  if (!mount) return { ok: false, reason: 'NO_ACTIVE_MOUNT' };

  if (riding) {
    const allowed = canRideAXEMount(mount, context);
    if (!allowed.ok) return allowed;
  }

  state = {
    ...state,
    ridingMountId: riding ? mount.instanceId : null,
    mounts: state.mounts.map((entry) => ({
      ...entry,
      riding: riding && entry.instanceId === mount.instanceId,
    })),
  };
  setMounted(!!riding);
  if (!riding) rideActivity = { seconds: 0, distanceMeters: 0 };
  emit();
  return { ok: true };
}

export function awardAXEMountXP(instanceId, amount, source = 'pve', context = {}) {
  const index = state.mounts.findIndex((mount) => mount.instanceId === instanceId);
  if (index < 0) return { ok: false, reason: 'MOUNT_MISSING' };

  if (source === 'pvp') {
    const opponentId = String(context.opponentId || '');
    if (!opponentId) return { ok: false, reason: 'PVP_TARGET_REQUIRED' };
    const now = Number(context.now || Date.now());
    const last = Number(state.pvpVictimCooldowns[opponentId] || 0);
    if (now - last < AXE_MOUNT_CONFIG.pvpRepeatTargetCooldownMs) {
      return { ok: false, reason: 'PVP_REPEAT_TARGET_COOLDOWN' };
    }
    state = {
      ...state,
      pvpVictimCooldowns: { ...state.pvpVictimCooldowns, [opponentId]: now },
    };
  }

  const result = addAXEMountXP(state.mounts[index], amount, source);
  if (!result.ok) return result;
  state = {
    ...state,
    mounts: state.mounts.map((mount, i) => i === index ? result.mount : mount),
  };
  emit();
  return result;
}

export function awardActiveAXEMountPvPXP({ opponentId, opponentLevel = 1 } = {}) {
  const mount = getActiveAXEMount();
  if (!mount) return { ok: false, reason: 'NO_ACTIVE_MOUNT' };
  return awardAXEMountXP(
    mount.instanceId,
    getAXEMountXPReward('pvp', { opponentLevel }),
    'pvp',
    { opponentId },
  );
}

export function awardActiveAXEMountPvEXP({ enemyLevel = 1 } = {}) {
  const mount = getActiveAXEMount();
  if (!mount) return { ok: false, reason: 'NO_ACTIVE_MOUNT' };
  return awardAXEMountXP(
    mount.instanceId,
    getAXEMountXPReward('pve', { enemyLevel }),
    'pve',
    { enemyLevel },
  );
}

export function tickAXEMountRideActivity(deltaSeconds, {
  moving = false,
  distanceMeters = 0,
} = {}) {
  if (!state.ridingMountId || !moving) return null;
  rideActivity.seconds += Math.max(0, Number(deltaSeconds) || 0);
  rideActivity.distanceMeters += Math.max(0, Number(distanceMeters) || 0);

  if (
    rideActivity.seconds < AXE_MOUNT_CONFIG.rideRewardWindowSeconds ||
    rideActivity.distanceMeters < AXE_MOUNT_CONFIG.rideRewardMinimumDistanceMeters
  ) return null;

  const mountId = state.ridingMountId;
  const result = awardAXEMountXP(
    mountId,
    getAXEMountXPReward('riding'),
    'riding',
    { activeSeconds: rideActivity.seconds, distanceMeters: rideActivity.distanceMeters },
  );
  rideActivity = { seconds: 0, distanceMeters: 0 };
  return result;
}

export function grantAXEMount(definitionId) {
  if (!AXE_MOUNT_DEFINITIONS[definitionId]) return { ok: false, reason: 'MOUNT_DEFINITION_MISSING' };
  const mount = createAXEMountInstance(definitionId);
  state = { ...state, mounts: [...state.mounts, mount] };
  emit();
  return { ok: true, mount };
}
