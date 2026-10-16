// Wuxia blueprint v3 §4 — Taurus Chosen Ascension state, scoped per character.
// The level is passed in by the caller (the Character Hub reads the player HUD), so this
// store never imports playerHUDStore, which reads it for derived stats.
import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';
import {
  AXE_ASCENSION_CONFIG,
  AXE_ASCENSION_NATURES,
  bankAXEAscensionShield,
  canAXECharacterAscend,
  isAXEAscensionNature,
} from './AXEAscensionSystem';

const storage = characterScopedStorage('axe_ascension_v1');
const empty = () => ({ ascended: false, ascendedAt: null, nature: null, attunedAt: null, cloakHidden: false });

const load = () => {
  try {
    const raw = storage.get();
    if (!raw) return empty();
    const p = JSON.parse(raw);
    return {
      ascended: !!p.ascended,
      ascendedAt: Number(p.ascendedAt) || null,
      nature: p.ascended && isAXEAscensionNature(p.nature) ? p.nature : null,
      attunedAt: Number(p.attunedAt) || null,
      cloakHidden: !!p.cloakHidden,
    };
  } catch {
    return empty();
  }
};

let state = load();
let shield = null; // { amount, expiresAt } — combat-only, never saved
const listeners = new Set();

export function getAXEAscensionState() {
  return { ...state, shield: getAXEAscensionShield() };
}

const emit = () => {
  storage.set(JSON.stringify(state));
  const snapshot = getAXEAscensionState();
  listeners.forEach((fn) => fn(snapshot));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('axeAscensionChanged', { detail: getAXEAscensionProfile() }));
};

subscribeCharacterChange(() => {
  state = load();
  shield = null;
  listeners.forEach((fn) => fn(getAXEAscensionState()));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('axeAscensionChanged', { detail: getAXEAscensionProfile() }));
});

export function subscribeAXEAscension(fn) {
  listeners.add(fn);
  fn(getAXEAscensionState());
  return () => listeners.delete(fn);
}

export function getAXEAscensionProfile() {
  return {
    ascended: state.ascended,
    nature: state.nature,
    natureDef: state.nature ? AXE_ASCENSION_NATURES[state.nature] : null,
    cloakVisible: state.ascended && !state.cloakHidden,
    hoverHeight: state.ascended ? AXE_ASCENSION_CONFIG.hoverHeight : 0,
  };
}

// The one-time ritual. `level` is the character's current level.
export function ascendAXECharacter({ level, confirmed = false, now = Date.now() } = {}) {
  const check = canAXECharacterAscend({ level, ascended: state.ascended });
  if (!check.ok) return check;
  if (!confirmed) return { ok: false, reason: 'CONFIRMATION_REQUIRED' };
  state = { ...state, ascended: true, ascendedAt: now };
  emit();
  return { ok: true, message: 'Taurus Chosen Ascension complete: choose your Nature.' };
}

// Choose (or, after the cooldown, change) the Nature.
export function setAXEAscensionNature(nature, { now = Date.now() } = {}) {
  if (!state.ascended) return { ok: false, reason: 'NOT_ASCENDED' };
  if (!isAXEAscensionNature(nature)) return { ok: false, reason: 'UNKNOWN_NATURE' };
  if (state.nature === nature) return { ok: true, reason: 'UNCHANGED' };
  if (state.nature && state.attunedAt && now - state.attunedAt < AXE_ASCENSION_CONFIG.reattuneCooldownMs) {
    return { ok: false, reason: 'REATTUNE_COOLDOWN', readyAt: state.attunedAt + AXE_ASCENSION_CONFIG.reattuneCooldownMs };
  }
  state = { ...state, nature, attunedAt: now };
  shield = null;
  emit();
  return { ok: true, message: `${AXE_ASCENSION_NATURES[nature].label} chosen.` };
}

export function setAXEAngelCloakHidden(hidden) {
  state = { ...state, cloakHidden: !!hidden };
  emit();
  return { ok: true };
}

// ---- combat hooks ----------------------------------------------------------------
export function getAXEAscensionSkillMultiplier() {
  return (state.ascended && AXE_ASCENSION_NATURES[state.nature]?.skillDamageMult) || 1;
}

export function hasAXEAscensionShockwave() {
  return !!(state.ascended && AXE_ASCENSION_NATURES[state.nature]?.shockwave);
}

// Levitation (and the Angel Cloak's movement bonus while it is worn).
export function getAXEAscensionMoveSpeedMult() {
  if (!state.ascended) return 1;
  return AXE_ASCENSION_CONFIG.levitationMoveSpeedMult * (1 + AXE_ASCENSION_CONFIG.angelCloak.moveSpeedPct);
}

// The Angel Cloak's static bonuses (kept while the cloak mesh is hidden, like any outfit).
export function getAXEAscensionFlatBonuses() {
  return state.ascended ? { ...AXE_ASCENSION_CONFIG.angelCloak.flat } : {};
}

export function getAXEAscensionShield(now = Date.now()) {
  return shield && shield.expiresAt > now ? shield.amount : 0;
}

// Defensive Nature: a share of every blow the hero lands becomes a shield.
export function bankAXEAscensionDamage(damage, { maxHP = 0, now = Date.now() } = {}) {
  if (!state.ascended || state.nature !== 'defensive') return 0;
  shield = bankAXEAscensionShield(shield, { damage, maxHP, now });
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('axeAscensionShield', { detail: { amount: shield.amount, expiresAt: shield.expiresAt } }));
  return shield.amount;
}

// Incoming damage drains the shield first; returns what it absorbed.
export function absorbAXEAscensionShield(incoming, { now = Date.now() } = {}) {
  const pool = getAXEAscensionShield(now);
  if (pool <= 0) return 0;
  const absorbed = Math.min(pool, Math.max(0, Number(incoming) || 0));
  shield = { ...shield, amount: pool - absorbed };
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('axeAscensionShield', { detail: { amount: shield.amount, expiresAt: shield.expiresAt } }));
  return absorbed;
}
