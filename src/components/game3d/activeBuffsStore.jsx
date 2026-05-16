// Active Buffs Store
// Tracks self-cast skill effects: shields, damage buffs, attack-speed buffs,
// crit damage bonus, and reflect-chance. The combat code reads from here to
// modify damage in/out. Buffs tick down each frame via tickBuffs(delta).

const listeners = new Set();

let state = {
  shield: 0,                  // absorbs damage before HP
  shieldExpiresAt: 0,         // performance.now() ms

  damageBonusPct: 0,          // % bonus damage dealt
  damageBonusHitsLeft: 0,     // when this hits 0, damageBonusPct → 0

  critDamageBonusPct: 0,      // % added to crit multiplier
  critDamageBonusExpiresAt: 0,

  attackSpeedBonusPct: 0,     // % attack speed multiplier (0.20 = +20%)
  attackSpeedExpiresAt: 0,

  reflectChancePct: 0,        // 0..1 — chance to reflect 100% damage back
  reflectExpiresAt: 0,
};

const emit = () => listeners.forEach((fn) => fn(state));
const now = () => performance.now();

export function getBuffs() { return state; }

export function subscribeBuffs(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

// ─── Shield ─────────────────────────────────────────────────────────────
export function applyShield(amount, durationSec = 15) {
  state = { ...state, shield: Math.max(state.shield, amount), shieldExpiresAt: now() + durationSec * 1000 };
  emit();
}

// Returns the amount of damage absorbed (so caller can subtract it from incoming dmg).
export function absorbShield(incoming) {
  if (state.shield <= 0) return 0;
  const absorbed = Math.min(state.shield, incoming);
  state = { ...state, shield: state.shield - absorbed };
  emit();
  return absorbed;
}

// ─── Damage Buff (Focus — next N hits) ──────────────────────────────────
export function applyDamageBuff(pct, hits) {
  state = { ...state, damageBonusPct: pct, damageBonusHitsLeft: hits };
  emit();
}

// Called after each player hit lands. Returns the multiplier to apply.
export function consumeDamageBuffMultiplier() {
  if (state.damageBonusHitsLeft <= 0) return 1;
  const mult = 1 + state.damageBonusPct;
  const hitsLeft = state.damageBonusHitsLeft - 1;
  state = {
    ...state,
    damageBonusHitsLeft: hitsLeft,
    damageBonusPct: hitsLeft <= 0 ? 0 : state.damageBonusPct,
  };
  emit();
  return mult;
}

// ─── Crit Damage Bonus (Decisive Blow) ──────────────────────────────────
export function applyCritDamageBonus(pct, durationSec = 20) {
  state = { ...state, critDamageBonusPct: pct, critDamageBonusExpiresAt: now() + durationSec * 1000 };
  emit();
}

// ─── Attack Speed Buff (Haste) ──────────────────────────────────────────
export function applyAttackSpeedBuff(pct, durationSec = 15) {
  state = { ...state, attackSpeedBonusPct: pct, attackSpeedExpiresAt: now() + durationSec * 1000 };
  emit();
}

export function getAttackSpeedMultiplier() {
  if (state.attackSpeedExpiresAt < now()) return 1;
  return 1 / (1 + state.attackSpeedBonusPct); // higher % = shorter cooldown
}

// ─── Reflect (God's Deflection) ─────────────────────────────────────────
export function applyReflectBuff(chancePct, durationSec = 20) {
  state = { ...state, reflectChancePct: chancePct, reflectExpiresAt: now() + durationSec * 1000 };
  emit();
}

// Roll: returns true if the incoming hit should be reflected back at attacker.
export function rollReflect() {
  if (state.reflectExpiresAt < now()) return false;
  return Math.random() < state.reflectChancePct;
}

// ─── Tick — clear expired timed buffs every frame ───────────────────────
export function tickBuffs() {
  const n = now();
  let changed = false;
  const next = { ...state };
  if (next.shield > 0 && next.shieldExpiresAt < n) { next.shield = 0; changed = true; }
  if (next.critDamageBonusPct > 0 && next.critDamageBonusExpiresAt < n) { next.critDamageBonusPct = 0; changed = true; }
  if (next.attackSpeedBonusPct > 0 && next.attackSpeedExpiresAt < n) { next.attackSpeedBonusPct = 0; changed = true; }
  if (next.reflectChancePct > 0 && next.reflectExpiresAt < n) { next.reflectChancePct = 0; changed = true; }
  if (changed) { state = next; emit(); }
}