// AXE Prompt 034 — character-scoped Mount progression and ride state.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import { setActiveCompanion, setMounted } from '../../companionStore';
import { advanceMountSpiritualWeapon, getMountSpiritualProfile } from './AXEMountSpiritualSystem';
import {
  AXE_MOUNT_FUSION_CONFIG,
  getAXEMountCombinationShare,
  getAXEMountGearStageCost,
  getAXEMountSoulPalette,
  refineAXEMountGearSlot,
} from './AXEMountFusionSystem';
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
    absorption_pill_s: 3, // starter pills so Mount Soul Fusion can be tried (provisional; existing saves receive them once)
    absorption_pill_600: 0,
  },
  fusion: null, // { mountId, until } while a mount is absorbed (Mount Soul Fusion)
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
      fusion: parsed.fusion && Number(parsed.fusion.until) > Date.now() && mounts.some((m) => m.instanceId === parsed.fusion.mountId)
        ? { mountId: parsed.fusion.mountId, until: Number(parsed.fusion.until) } : null,
    };
  } catch {
    return starter();
  }
};

let state = load();
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

const emit = () => {
  storage.set(JSON.stringify(persistedState()));
  const snapshot = getAXEMountState();
  listeners.forEach((fn) => fn(snapshot));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axeMountChanged', { detail: snapshot }));
    window.dispatchEvent(new CustomEvent('axeMountFusionChanged', { detail: getAXEMountFusionState() }));
  }
  scheduleFusionExpiry();
};

// ---- Mount Soul Fusion (AXEMountFusionSystem) --------------------------------
let fusionTimer = null;
function scheduleFusionExpiry() {
  if (fusionTimer) clearTimeout(fusionTimer);
  fusionTimer = null;
  if (!state.fusion) return;
  const wait = Math.max(0, Math.min(2 ** 31 - 1, state.fusion.until - Date.now()));
  fusionTimer = setTimeout(() => tickAXEMountFusion(), wait + 25);
  fusionTimer?.unref?.(); // never keeps a Node test process alive
}

// End the fusion once its time is up (also checked by the expiry timer).
export function tickAXEMountFusion(now = Date.now()) {
  if (!state.fusion || state.fusion.until > now) return false;
  appendAudit('fusion_ended', state.fusion.mountId, { reason: 'expired' });
  state = { ...state, fusion: null };
  emit();
  return true;
}

export function getAXEMountFusionState(now = Date.now()) {
  const f = state.fusion;
  const mount = f && f.until > now ? state.mounts.find((m) => m.instanceId === f.mountId) : null;
  if (!mount) return { active: false, mountId: null, until: null, remainingMs: 0, share: 0, palette: null, mountName: null };
  const def = getAXEMountDefinition(mount.definitionId);
  return {
    active: true,
    mountId: mount.instanceId,
    until: f.until,
    remainingMs: f.until - now,
    share: getAXEMountCombinationShare(mount).total,
    palette: getAXEMountSoulPalette(def),
    mountName: def?.name || 'Mount',
  };
}

// While absorbed, the share multiplies the character's equipment stats.
export function getAXEMountFusionGearScale(now = Date.now()) {
  const f = getAXEMountFusionState(now);
  return f.active ? 1 + f.share / 100 : 1;
}

// Absorb the registered mount with a pill; another pill while absorbed adds its time.
export function absorbAXEMount(pillId, { now = Date.now() } = {}) {
  const pill = AXE_MOUNT_FUSION_CONFIG.pills[pillId];
  if (!pill) return { ok: false, reason: 'UNKNOWN_PILL' };
  if (Number(state.materials?.[pillId] || 0) < 1) return { ok: false, reason: 'NO_ABSORPTION_PILL' };
  const mount = state.mounts.find((m) => m.instanceId === state.registeredMountId);
  if (!mount) return { ok: false, reason: 'NO_REGISTERED_MOUNT' };
  const current = state.fusion && state.fusion.until > now && state.fusion.mountId === mount.instanceId ? state.fusion.until : now;
  if (state.ridingMountId) setAXEMountRiding(false); // the absorbed mount cannot be ridden
  // the game world keeps its own mounted flag: tell it to get off the mount it just absorbed
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('axeMountForceDismount', { detail: { reason: 'absorbed' } }));
  consumeMountMaterials({ [pillId]: 1 });
  state = { ...state, fusion: { mountId: mount.instanceId, until: current + pill.minutes * 60_000 } };
  appendAudit('fusion_absorb', mount.instanceId, { pillId, until: state.fusion.until });
  emit();
  return { ok: true, until: state.fusion.until, message: `${getAXEMountDefinition(mount.definitionId)?.name || 'Mount'} absorbed for ${pill.minutes} minutes.` };
}

// End the fusion early (the pill is spent).
export function releaseAXEMountFusion() {
  if (!state.fusion) return { ok: true, reason: 'NOT_ABSORBED' };
  appendAudit('fusion_ended', state.fusion.mountId, { reason: 'released' });
  state = { ...state, fusion: null };
  emit();
  return { ok: true, message: 'Mount Soul Fusion released.' };
}

export function previewAXEMountGearRefine(instanceId, slotId) {
  const mount = state.mounts.find((m) => m.instanceId === instanceId);
  if (!mount) return { ok: false, reason: 'MOUNT_MISSING' };
  const r = refineAXEMountGearSlot(mount, slotId);
  if (!r.ok) return r;
  return { ok: true, cost: r.cost, nextStage: r.stage, canAfford: canAffordMountMaterials(r.cost) };
}

// Refine one gear slot by a stage (confirmed, from the stage that was reviewed).
export function refineAXEMountGear(instanceId, slotId, { confirmed = false, expectedStage } = {}) {
  const index = state.mounts.findIndex((m) => m.instanceId === instanceId);
  if (index < 0) return { ok: false, reason: 'MOUNT_MISSING' };
  if (!confirmed) return { ok: false, reason: 'CONFIRMATION_REQUIRED' };
  const r = refineAXEMountGearSlot(state.mounts[index], slotId, expectedStage);
  if (!r.ok) return r;
  if (!canAffordMountMaterials(r.cost)) return { ok: false, reason: 'INSUFFICIENT_MATERIALS' };
  consumeMountMaterials(r.cost);
  state = { ...state, mounts: state.mounts.map((m, i) => (i === index ? r.mount : m)) };
  appendAudit('refine_mount_gear', instanceId, { slotId, stage: r.stage, cost: r.cost });
  emit();
  return { ok: true, stage: r.stage, cost: r.cost, message: `Refined to Stage ${r.stage}.` };
}

export { getAXEMountGearStageCost };
scheduleFusionExpiry(); // a fusion saved before a reload still ends on time

subscribeCharacterChange(() => {
  state = load();
  rideActivity = { seconds: 0, distanceMeters: 0 };
  listeners.forEach((fn) => fn(getAXEMountState()));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('axeMountFusionChanged', { detail: getAXEMountFusionState() }));
  scheduleFusionExpiry();
});

export function getAXEMountState() {
  return structuredClone({
    ...state,
    mounts: state.mounts.map((mount) => ({
      ...mount,
      definition: getAXEMountDefinition(mount.definitionId),
      bonuses: getAXEMountBonuses(mount),
      combination: getAXEMountCombinationShare(mount),
      speedMultiplier: getAXEMountSpeedMultiplier(mount),
      spiritualProfile: getMountSpiritualProfile(mount),
    })),
    pvpVictimCooldowns: { ...state.pvpVictimCooldowns },
    materials: { ...(state.materials || {}) },
    audit: [...(state.audit || [])],
    fusionState: getAXEMountFusionState(),
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
  if (riding && getAXEMountFusionState().mountId === mount.instanceId) return { ok: false, reason: 'MOUNT_ABSORBED' };

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
  emit();
  return structuredClone(result);
}

export function setAXEMountSpiritualMode(instanceId, mode) {
  if (!['offensive', 'utility'].includes(mode)) return { ok: false, reason: 'INVALID_SPIRITUAL_MODE' };
  const mount = state.mounts.find((entry) => entry.instanceId === instanceId);
  if (!mount) return { ok: false, reason: 'MOUNT_MISSING' };
  const profile = getMountSpiritualProfile(mount);
  state = { ...state, mounts: state.mounts.map((entry) => entry.instanceId === instanceId
    ? { ...entry, spiritualWeapon: { rank: profile.rank, mode } } : entry) };
  emit();
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
  emit();
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
  emit();
  return { ok: true, mount: state.mounts[index], legendary: result.legendary, cost: preview.cost };
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
  emit();
  return { ok: true, ability: result.ability, cost };
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
  emit();
  return { ok: true, ability: result.ability, cost };
}

const GRANTABLE_MOUNT_MATERIALS = Object.freeze(['legendary_mount_soul', 'ascension_core', 'mount_ability_seal', 'gold', ...Object.keys(AXE_MOUNT_FUSION_CONFIG.pills)]);
export function grantAXEMountMaterials(delta = {}) {
  const current = state.materials || {};
  const next = { ...current }; // keeps every other material (absorption pills used to be dropped here)
  for (const id of GRANTABLE_MOUNT_MATERIALS) next[id] = Number(current[id] || 0) + Math.max(0, Number(delta[id] || 0));
  state = { ...state, materials: next };
  emit();
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
  if (state.activeMountId === instanceId || state.registeredMountId === instanceId || state.ridingMountId === instanceId || state.fusion?.mountId === instanceId) {
    return { ok: false, reason: 'MOUNT_IN_USE' };
  }

  appendAudit('release_mount', instanceId, {
    legendary: !!mount.legendary?.isLegendary,
    growthPercent: mount.growthPercent,
  });
  state = { ...state, mounts: state.mounts.filter((entry) => entry.instanceId !== instanceId) };
  emit();
  return { ok: true };
}
