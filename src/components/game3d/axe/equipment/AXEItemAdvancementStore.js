// AXE Prompt 020 persistence/transaction adapter.

import {
  resolveCombine,
  resolveStageAdvance,
  resolveRefine,
  resolveUltimate,
} from './AXEItemAdvancementSystem';

const STORAGE_KEY = 'axe_item_advancement_v1';
const AUDIT_KEY = 'axe_item_advancement_audit_v1';

const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
};

let state = load(STORAGE_KEY, {});
let audit = load(AUDIT_KEY, []);

const save = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(AUDIT_KEY, JSON.stringify(audit.slice(-250)));
  } catch {}
};

const tx = (type, itemId, payload, result) => {
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
  save();
  return entry;
};

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
  const current = getAXEAdvancementState(target?.instanceId || target?.id);
  const result = resolveCombine({ ...target, combine: current.combine }, donor, options);
  const itemId = target?.instanceId || target?.id;
  if (result.ok && itemId) {
    state = {
      ...state,
      [itemId]: { ...current, combine: result.target.combine },
    };
  }
  tx('combine', itemId, { donorId: donor?.instanceId || donor?.id || null }, result);
  return result;
}

export function applyAXEStage(itemId, options = {}) {
  const current = getAXEAdvancementState(itemId);
  const result = resolveStageAdvance(current.stage, options);
  if (result.ok) state = { ...state, [itemId]: { ...current, stage: result.record } };
  tx('stage', itemId, {}, result);
  return result;
}

export function applyAXERefine(itemId, options = {}) {
  const current = getAXEAdvancementState(itemId);
  const result = resolveRefine(current.refine, options);
  if (!result.destroyed) state = { ...state, [itemId]: { ...current, refine: result.record } };
  else state = { ...state, [itemId]: { ...current, refine: { ...current.refine, destroyed: true } } };
  tx('refine', itemId, { protectedAttempt: !!options.protectedAttempt }, result);
  return result;
}

export function applyAXEUltimate(item, options = {}) {
  const itemId = item?.instanceId || item?.id;
  const current = getAXEAdvancementState(itemId);
  const result = resolveUltimate(item, current.ultimate, options);
  state = { ...state, [itemId]: { ...current, ultimate: result.record } };
  tx('ultimate', itemId, { protectedAttempt: !!options.protectedAttempt }, result);
  return result;
}
