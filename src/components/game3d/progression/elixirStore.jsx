import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';
import { ELIXIR_CAPS, ELIXIR_DEFINITIONS } from '../twelvesky/modernizationData';

const storage = characterScopedStorage('twelvesky_elixirs_v1');
const listeners = new Set();

const blankCounts = () => Object.fromEntries(
  Object.keys(ELIXIR_DEFINITIONS).map((id) => [id, { normal: 0, expansion: 0, banked: 0 }]),
);

function loadState() {
  const base = { counts: blankCounts() };
  try {
    const raw = storage.get();
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    Object.keys(base.counts).forEach((id) => {
      const saved = parsed?.counts?.[id] || {};
      base.counts[id] = {
        normal: Math.max(0, Math.min(ELIXIR_CAPS.normal, Number(saved.normal) || 0)),
        expansion: Math.max(0, Math.min(ELIXIR_CAPS.expansion, Number(saved.expansion) || 0)),
        banked: Math.max(0, Number(saved.banked) || 0),
      };
    });
  } catch {}
  return base;
}

let state = loadState();

function save() { storage.set(JSON.stringify(state)); }
function emit() {
  const snapshot = getElixirState();
  listeners.forEach((fn) => fn(snapshot));
}

subscribeCharacterChange(() => {
  state = loadState();
  emit();
});

export function getElixirBonuses() {
  const out = {
    hp: 0,
    force: 0,
    hit: 0,
    dodge: 0,
    damage: 0,
    attributeAttack: 0,
    attributeDefense: 0,
  };

  Object.entries(state.counts).forEach(([id, count]) => {
    const def = ELIXIR_DEFINITIONS[id];
    if (!def) return;
    const doses = count.normal + count.expansion;
    Object.entries(def.perDose || {}).forEach(([key, value]) => {
      out[key] = (out[key] || 0) + value * doses;
    });
  });
  return out;
}

export function getElixirState() {
  const rows = Object.fromEntries(Object.entries(state.counts).map(([id, counts]) => {
    const total = counts.normal + counts.expansion;
    return [id, {
      ...ELIXIR_DEFINITIONS[id],
      ...counts,
      total,
      normalRemaining: Math.max(0, ELIXIR_CAPS.normal - counts.normal),
      expansionRemaining: Math.max(0, ELIXIR_CAPS.expansion - counts.expansion),
      isMaxed: total >= ELIXIR_CAPS.total,
    }];
  }));
  return { rows, bonuses: getElixirBonuses(), caps: ELIXIR_CAPS };
}

export function subscribeElixirs(fn) {
  listeners.add(fn);
  fn(getElixirState());
  return () => listeners.delete(fn);
}

// Adds physical elixir items to the character bank. Loot/shop code can call
// this without directly touching permanent progression.
export function grantElixir(type, amount = 1) {
  if (!state.counts[type]) return false;
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (!n) return false;
  state.counts[type].banked += n;
  save(); emit();
  return true;
}

// Consumes banked items. Normal doses must be filled before expansion doses,
// matching the documented TwelveSky2 expansion rule.
export function consumeElixir(type, requested = 1) {
  const row = state.counts[type];
  if (!row) return { ok: false, reason: 'Unknown elixir.' };
  let amount = Math.max(1, Math.floor(Number(requested) || 1));
  amount = Math.min(amount, row.banked);
  if (amount <= 0) return { ok: false, reason: 'No elixirs banked.' };

  let used = 0;
  const normalRoom = Math.max(0, ELIXIR_CAPS.normal - row.normal);
  const normalUse = Math.min(amount, normalRoom);
  row.normal += normalUse;
  row.banked -= normalUse;
  amount -= normalUse;
  used += normalUse;

  // Expansion unlocks only when the normal cap has been completed.
  if (amount > 0 && row.normal >= ELIXIR_CAPS.normal) {
    const expansionRoom = Math.max(0, ELIXIR_CAPS.expansion - row.expansion);
    const expansionUse = Math.min(amount, expansionRoom);
    row.expansion += expansionUse;
    row.banked -= expansionUse;
    used += expansionUse;
  }

  save(); emit();
  return used > 0
    ? { ok: true, used, total: row.normal + row.expansion }
    : { ok: false, reason: 'This elixir is already maxed.' };
}

export function consumeElixirMax(type) {
  const row = state.counts[type];
  if (!row) return { ok: false, reason: 'Unknown elixir.' };
  return consumeElixir(type, row.banked || 1);
}

// Admin/import helper for migrations and test fixtures.
export function setElixirProgress(type, normal = 0, expansion = 0, banked = 0) {
  if (!state.counts[type]) return false;
  state.counts[type] = {
    normal: Math.max(0, Math.min(ELIXIR_CAPS.normal, Math.floor(normal))),
    expansion: Math.max(0, Math.min(ELIXIR_CAPS.expansion, Math.floor(expansion))),
    banked: Math.max(0, Math.floor(banked)),
  };
  save(); emit();
  return true;
}
