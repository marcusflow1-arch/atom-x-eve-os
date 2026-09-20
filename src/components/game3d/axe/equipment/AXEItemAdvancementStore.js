// AXE Prompt 020 persistence / transaction adapter.
// Character-scoped and subscribable so advancement changes immediately feed
// Services, equipment details and live combat stats.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import {
  resolveCombine,
  resolveStageAdvance,
  resolveRefine,
  resolveUltimate,
} from './AXEItemAdvancementSystem';

const storage = characterScopedStorage('axe_item_advancement_v2');
const auditStorage = characterScopedStorage('axe_item_advancement_audit_v2');

function loadJSON(store, fallback) {
  try {
    const raw = store.get();
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

let state = loadJSON(storage, {});
let audit = loadJSON(auditStorage, []);
const listeners = new Set();

function snapshot() {
  return {
    state: JSON.parse(JSON.stringify(state || {})),
    audit: [...audit],
  };
}

function save() {
  storage.set(JSON.stringify(state));
  auditStorage.set(JSON.stringify(audit.slice(-250)));
}

function emit() {
  save();
  const snap = snapshot();
  listeners.forEach((fn) => fn(snap));
}

subscribeCharacterChange(() => {
  state = loadJSON(storage, {});
  audit = loadJSON(auditStorage, []);
  const snap = snapshot();
  listeners.forEach((fn) => fn(snap));
});

function tx(type, itemId, payload, result) {
  const entry = {
    id: `axe_tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    itemId,
    payload,
    result: {
      ok: !!result?.ok,
      outcome: result?.outcome || result?.reason || null,
    },
    at: Date.now(),
  };
  audit = [...audit, entry].slice(-250);
  return entry;
}

export function subscribeAXEItemAdvancement(fn) {
  listeners.add(fn);
  fn(snapshot());
  return () => listeners.delete(fn);
}

export function getAXEAdvancementState(itemId) {
  return state[itemId] || {
    combine: { count: 0 },
    stage: { rank: 0, id: 'stage_0', label: 'Base' },
    refine: { level: 0 },
    ultimate: { level: 0, sealed: false },
  };
}

export function getAXEAdvancementAudit() {
  return [...audit];
}

export function applyAXECombine(target, donor, options = {}) {
  const itemId = target?.instanceId || target?.id;
  if (!itemId) return { ok: false, reason: 'ITEM_MISSING' };
  const current = getAXEAdvancementState(itemId);
  const donorWithIdentity = donor
    ? { ...donor, instanceId: donor.instanceId || donor.id, templateId: donor.templateId || donor.id }
    : donor;
  const targetWithIdentity = {
    ...target,
    instanceId: itemId,
    templateId: target?.templateId || target?.id,
    combine: current.combine,
  };
  const result = resolveCombine(targetWithIdentity, donorWithIdentity, options);
  if (result.ok) {
    state = {
      ...state,
      [itemId]: { ...current, combine: result.target.combine },
    };
  }
  tx('combine', itemId, { donorId: donorWithIdentity?.instanceId || null }, result);
  emit();
  return result;
}

export function applyAXEStage(itemId, options = {}) {
  if (!itemId) return { ok: false, reason: 'ITEM_MISSING' };
  const current = getAXEAdvancementState(itemId);
  const result = resolveStageAdvance(current.stage, options);
  if (result.ok) state = { ...state, [itemId]: { ...current, stage: result.record } };
  tx('stage', itemId, {}, result);
  emit();
  return result;
}

export function applyAXERefine(itemId, options = {}) {
  if (!itemId) return { ok: false, reason: 'ITEM_MISSING' };
  const current = getAXEAdvancementState(itemId);
  const result = resolveRefine(current.refine, options);
  if (!result.destroyed) {
    state = { ...state, [itemId]: { ...current, refine: result.record } };
  } else {
    state = {
      ...state,
      [itemId]: { ...current, refine: { ...current.refine, destroyed: true } },
    };
  }
  tx('refine', itemId, { protectedAttempt: !!options.protectedAttempt }, result);
  emit();
  return result;
}

export function applyAXEUltimate(item, options = {}) {
  const itemId = item?.instanceId || item?.id;
  if (!itemId) return { ok: false, reason: 'ITEM_MISSING' };
  const current = getAXEAdvancementState(itemId);
  const result = resolveUltimate(item, current.ultimate, options);
  state = { ...state, [itemId]: { ...current, ultimate: result.record } };
  tx('ultimate', itemId, { protectedAttempt: !!options.protectedAttempt }, result);
  emit();
  return result;
}
