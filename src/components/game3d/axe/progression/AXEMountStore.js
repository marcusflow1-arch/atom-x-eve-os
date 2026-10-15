// AXE Prompt 034 — character-scoped Mount progression and ride state.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import { setActiveCompanion, setMounted } from '../../companionStore';
import { advanceMountSpiritualWeapon, getMountSpiritualProfile } from './AXEMountSpiritualSystem';
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
import {
  AXE_LEGENDARY_MOUNT_CONFIG,
  addAXELegendaryMountExtraAbility,
  createAXELegendaryMountState,
  rerollAXELegendaryMountAbility,
  validateAXELegendaryMountCraft,
} from './AXELegendaryMountSystem';

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
  materials: {
    legendary_mount_soul: 1,
    ascension_core: 2,
    mount_ability_seal: 1,
    gold: 20000,
  },
  audit: [],
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
      materials: { ...starter().materials, ...(parsed.materials || {}) },
      audit: Array.isArray(parsed.audit) ? parsed.audit.slice(-100) : [],
      ridingMountId: null,
    };
  } catch {
    return starter();
  }
};

let state = load();
let committedState = structuredClone(state);
const saveFailure = () => ({ ok: false, reason: 'SAVE_FAILED',
  message: 'Could not save your changes. Nothing was spent. Check browser storage and try again.' });
const listeners = new Set();
let rideActivity = { seconds: 0, distanceMeters: 0 };

const appendAudit = (action, mountId, detail = {}) => {
  state = {
    ...state,
    audit: [
      ...(state.audit || []),
      { id: `mount_audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, action, mountId, at: Date.now(), detail },
    ].slice(-100),
  };
};

const canAffordMountMaterials = (cost = {}) =>
  Object.entries(cost).every(([id, amount]) => Number(state.materials?.[id] || 0) >= Number(amount || 0));

const consumeMountMaterials = (cost = {}) => {
  const next = { ...(state.materials || {}) };
  for (const [id, amount] of Object.entries(cost)) {
    next[id] = Math.max(0, Number(next[id] || 0) - Number(amount || 0));
  }
  state = { ...state, materials: next };
};

const persistedState = () => ({
  ...state,
  ridingMountId: null,
  mounts: state.mounts.map((mount) => ({ ...mount, riding: false })),
});

const publish = () => {
  const snapshot = getAXEMountState();
  listeners.forEach((fn) => fn(snapshot));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeMountChanged', { detail: snapshot }));
  }
};

const emit = () => {
  let saved = false;
  try { saved = storage.setChecked(JSON.stringify(persistedState())); } catch { /* retain the last committed state */ }
  if (!saved) {
    state = structuredClone(committedState);
    return false;
  }
  committedState = structuredClone(state);
  publish();
  return true;
};

subscribeCharacterChange(() => {
  state = load();
  committedState = structuredClone(state);
  rideActivity = { seconds: 0, distanceMeters: 0 };
  listeners.forEach((fn) => fn(getAXEMountState()));
});

export function getAXEMountState() {
  return structuredClone({
    ...state,
    mounts: state.mounts.map((mount) => ({
      ...mount,
      definition: getAXEMountDefinition(mount.definitionId),
      bonuses: getAXEMountBonuses(mount),
      speedMultiplier: getAXEMountSpeedMultiplier(mount),
      spiritualProfile: getMountSpiritualProfile(mount),
    })),
    pvpVictimCooldowns: { ...state.pvpVictimCooldowns },
    materials: { ...(state.materials || {}) },
    audit: [...(state.audit || [])],
  });
}

export function subscribeAXEMounts(fn) {
  listeners.add(fn);
  fn(getAXEMountState());
  return () => listeners.delete(fn);
}

export function getActiveAXEMount() {
  return structuredClone(state.mounts.find((mount) => mount.instanceId === state.activeMountId) || null);
}

export function getRegisteredAXEMount() {
  return structuredClone(state.mounts.find((mount) => mount.instanceId === state.registeredMountId) || null);
}

export function getRegisteredAXEMountBonuses() {
  const mount = getRegisteredAXEMount();
  return mount ? getAXEMountBonuses(mount) : { hp: 0, damage: 0, defense: 0, attributionAttack: 0, attributionDefense: 0 };
}

export function getActiveAXEMountSpeedMultiplier() {
  const mount = state.mounts.find((entry) => entry.instanceId === state.activeMountId);
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
  if (!emit()) return saveFailure();
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
  if (!emit()) return saveFailure();
  setMounted(false);
  if (def?.modelRef) setActiveCompanion(def.modelRef);
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
  // Riding is transient, not a purchase. A full disk must never trap a rider
  // or prevent dismounting; no persistent field changed in this operation.
  committedState = structuredClone(state);
  publish();
  setMounted(!!riding);
  if (!riding) rideActivity = { seconds: 0, distanceMeters: 0 };
  return { ok: true };
}

export function awardAXEMountXP(instanceId, amount, source = 'pve', context = {}) {
  const index = state.mounts.findIndex((mount) => mount.instanceId === instanceId);
  if (index < 0) return { ok: false, reason: 'MOUNT_MISSING' };
  const result = addAXEMountXP(state.mounts[index], amount, source);
  if (!result.ok) return result;

  if (source === 'pvp') {
    const opponentId = String(context.opponentId || '');
    if (!opponentId) return { ok: false, reason: 'PVP_TARGET_REQUIRED' };
    const now = Number(context.now ?? Date.now());
    if (!Number.isFinite(now) || now < 0) return { ok: false, reason: 'INVALID_TIME' };
    const last = state.pvpVictimCooldowns[opponentId];
    if (last != null && now - last < AXE_MOUNT_CONFIG.pvpRepeatTargetCooldownMs) {
      return { ok: false, reason: 'PVP_REPEAT_TARGET_COOLDOWN' };
    }
    state = {
      ...state,
      pvpVictimCooldowns: { ...state.pvpVictimCooldowns, [opponentId]: now },
    };
  }

  state = {
    ...state,
    mounts: state.mounts.map((mount, i) => i === index ? result.mount : mount),
  };
  if (!emit()) return saveFailure();
  return structuredClone(result);
}

export function setAXEMountSpiritualMode(instanceId, mode) {
  if (!['offensive', 'utility'].includes(mode)) return { ok: false, reason: 'INVALID_SPIRITUAL_MODE' };
  const mount = state.mounts.find((entry) => entry.instanceId === instanceId);
  if (!mount) return { ok: false, reason: 'MOUNT_MISSING' };
  const profile = getMountSpiritualProfile(mount);
  state = { ...state, mounts: state.mounts.map((entry) => entry.instanceId === instanceId
    ? { ...entry, spiritualWeapon: { rank: profile.rank, mode } } : entry) };
  if (!emit()) return saveFailure();
  return { ok: true, message: `Spiritual weapon set to ${mode}.` };
}

export function strengthenAXEMountSpiritualWeapon(instanceId, { confirmed = false, expectedRank } = {}) {
  const mount = state.mounts.find((entry) => entry.instanceId === instanceId);
  if (!mount) return { ok: false, reason: 'MOUNT_MISSING' };
  if (!confirmed) return { ok: false, reason: 'CONFIRMATION_REQUIRED' };
  const result = advanceMountSpiritualWeapon(mount, expectedRank);
  if (!result.ok) return result;
  state = { ...state, mounts: state.mounts.map((entry) => entry.instanceId === instanceId ? result.mount : entry) };
  appendAudit('strengthen_spiritual_weapon', instanceId, { xpSpent: result.xpSpent, rank: result.mount.spiritualWeapon.rank });
  if (!emit()) return saveFailure();
  return { ok: true, message: `Spiritual weapon strengthened to rank ${result.mount.spiritualWeapon.rank}.`, xpSpent: result.xpSpent };
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
  if (result.ok) rideActivity = { seconds: 0, distanceMeters: 0 };
  return result;
}

export function grantAXEMount(definitionId) {
  if (!AXE_MOUNT_DEFINITIONS[definitionId]) return { ok: false, reason: 'MOUNT_DEFINITION_MISSING' };
  const mount = createAXEMountInstance(definitionId);
  state = { ...state, mounts: [...state.mounts, mount] };
  if (!emit()) return saveFailure();
  return { ok: true, mount: structuredClone(mount) };
}


export function previewLegendaryAXEMountCraft(instanceId) {
  const mount = state.mounts.find((entry) => entry.instanceId === instanceId);
  const valid = validateAXELegendaryMountCraft(mount);
  if (!valid.ok) return valid;
  const cost = { ...AXE_LEGENDARY_MOUNT_CONFIG.craftCost };
  return {
    ok: true,
    mountId: instanceId,
    cost,
    canAfford: canAffordMountMaterials(cost),
    abilityCount: AXE_LEGENDARY_MOUNT_CONFIG.baseAbilityCount,
  };
}

export function craftLegendaryAXEMount(instanceId, {
  confirmed = false,
  rng = Math.random,
} = {}) {
  const preview = previewLegendaryAXEMountCraft(instanceId);
  if (!preview.ok) return preview;
  if (!confirmed) return { ...preview, ok: false, reason: 'CONFIRMATION_REQUIRED' };
  if (!preview.canAfford) return { ...preview, ok: false, reason: 'INSUFFICIENT_MATERIALS' };

  const index = state.mounts.findIndex((entry) => entry.instanceId === instanceId);
  const result = createAXELegendaryMountState(state.mounts[index], rng);
  if (!result.ok) return result;

  consumeMountMaterials(preview.cost);
  state = {
    ...state,
    mounts: state.mounts.map((entry, i) =>
      i === index ? { ...entry, legendary: result.legendary } : entry
    ),
  };
  appendAudit('craft_legendary', instanceId, {
    cost: preview.cost,
    abilities: result.legendary.abilities,
    passiveId: result.legendary.passiveId,
  });
  if (!emit()) return saveFailure();
  return structuredClone({ ok: true, mount: state.mounts[index], legendary: result.legendary, cost: preview.cost });
}

export function addLegendaryAXEMountAbility(instanceId, {
  confirmed = false,
  rng = Math.random,
} = {}) {
  const index = state.mounts.findIndex((entry) => entry.instanceId === instanceId);
  if (index < 0) return { ok: false, reason: 'MOUNT_MISSING' };
  const mount = state.mounts[index];
  if (!mount.legendary?.isLegendary) return { ok: false, reason: 'NOT_LEGENDARY' };

  const cost = { ...AXE_LEGENDARY_MOUNT_CONFIG.extraAbilityCost };
  if (!confirmed) return { ok: false, reason: 'CONFIRMATION_REQUIRED', cost, canAfford: canAffordMountMaterials(cost) };
  if (!canAffordMountMaterials(cost)) return { ok: false, reason: 'INSUFFICIENT_MATERIALS', cost };

  const result = addAXELegendaryMountExtraAbility(mount.legendary, rng);
  if (!result.ok) return result;

  consumeMountMaterials(cost);
  state = {
    ...state,
    mounts: state.mounts.map((entry, i) =>
      i === index ? { ...entry, legendary: result.legendary } : entry
    ),
  };
  appendAudit('add_legendary_ability', instanceId, { cost, ability: result.ability });
  if (!emit()) return saveFailure();
  return structuredClone({ ok: true, ability: result.ability, cost });
}

export function rerollLegendaryAXEMountAbility(instanceId, abilityIndex, {
  confirmed = false,
  rng = Math.random,
} = {}) {
  const index = state.mounts.findIndex((entry) => entry.instanceId === instanceId);
  if (index < 0) return { ok: false, reason: 'MOUNT_MISSING' };
  const mount = state.mounts[index];
  if (!mount.legendary?.isLegendary) return { ok: false, reason: 'NOT_LEGENDARY' };

  const cost = { ...AXE_LEGENDARY_MOUNT_CONFIG.rerollAbilityCost };
  if (!confirmed) return { ok: false, reason: 'CONFIRMATION_REQUIRED', cost, canAfford: canAffordMountMaterials(cost) };
  if (!canAffordMountMaterials(cost)) return { ok: false, reason: 'INSUFFICIENT_MATERIALS', cost };

  const result = rerollAXELegendaryMountAbility(mount.legendary, abilityIndex, rng);
  if (!result.ok) return result;

  consumeMountMaterials(cost);
  state = {
    ...state,
    mounts: state.mounts.map((entry, i) =>
      i === index ? { ...entry, legendary: result.legendary } : entry
    ),
  };
  appendAudit('reroll_legendary_ability', instanceId, { abilityIndex, cost, ability: result.ability });
  if (!emit()) return saveFailure();
  return structuredClone({ ok: true, ability: result.ability, cost });
}

export function grantAXEMountMaterials(delta = {}) {
  const current = state.materials || {};
  state = {
    ...state,
    materials: {
      legendary_mount_soul: Number(current.legendary_mount_soul || 0) + Math.max(0, Number(delta.legendary_mount_soul || 0)),
      ascension_core: Number(current.ascension_core || 0) + Math.max(0, Number(delta.ascension_core || 0)),
      mount_ability_seal: Number(current.mount_ability_seal || 0) + Math.max(0, Number(delta.mount_ability_seal || 0)),
      gold: Number(current.gold || 0) + Math.max(0, Number(delta.gold || 0)),
    },
  };
  if (!emit()) return saveFailure();
  return { ...state.materials };
}

export function releaseAXEMount(instanceId, { confirmed = false } = {}) {
  const mount = state.mounts.find((entry) => entry.instanceId === instanceId);
  if (!mount) return { ok: false, reason: 'MOUNT_MISSING' };
  if (!confirmed) {
    return {
      ok: false,
      reason: 'CONFIRMATION_REQUIRED',
      highValue: !!mount.legendary?.isLegendary || Number(mount.growthPercent || 0) >= 20,
    };
  }
  if (state.activeMountId === instanceId || state.registeredMountId === instanceId || state.ridingMountId === instanceId) {
    return { ok: false, reason: 'MOUNT_IN_USE' };
  }

  appendAudit('release_mount', instanceId, {
    legendary: !!mount.legendary?.isLegendary,
    growthPercent: mount.growthPercent,
  });
  state = { ...state, mounts: state.mounts.filter((entry) => entry.instanceId !== instanceId) };
  if (!emit()) return saveFailure();
  return { ok: true };
}
