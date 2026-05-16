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
  damageBonusExpiresAt: 0,

  critDamageBonusPct: 0,      // % added to crit multiplier
  critDamageBonusExpiresAt: 0,

  attackSpeedBonusPct: 0,     // % attack speed multiplier (0.20 = +20%)
  attackSpeedExpiresAt: 0,

  reflectChancePct: 0,        // 0..1 — chance to reflect 100% damage back
  reflectExpiresAt: 0,

  // Power Charge — next N hits deal +100% damage AND the player's hands glow.
  // Separate from `focus` so visual aura and combat math are decoupled.
  powerChargePct: 0,
  powerChargeHitsLeft: 0,
  powerChargeExpiresAt: 0,    // safety timer (skill expires even if hits unused)

  // Dodge / Evade — chance to be missed entirely by enemy attacks.
  dodgeChancePct: 0,
  dodgeExpiresAt: 0,

  castVisuals: {},
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
  state = {
    ...state,
    shield: Math.max(state.shield, amount),
    shieldExpiresAt: now() + durationSec * 1000,
    castVisuals: { ...state.castVisuals, aegis_shield: now() + durationSec * 1000 },
  };
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
export function applyDamageBuff(pct, hits, durationSec = 180) {
  state = {
    ...state,
    damageBonusPct: pct,
    damageBonusHitsLeft: hits,
    damageBonusExpiresAt: now() + durationSec * 1000,
    castVisuals: { ...state.castVisuals, focus: now() + durationSec * 1000 },
  };
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
  state = {
    ...state,
    critDamageBonusPct: pct,
    critDamageBonusExpiresAt: now() + durationSec * 1000,
    castVisuals: { ...state.castVisuals, decisive_blow: now() + durationSec * 1000 },
  };
  emit();
}

// ─── Attack Speed Buff (Haste) ──────────────────────────────────────────
export function applyAttackSpeedBuff(pct, durationSec = 15) {
  state = {
    ...state,
    attackSpeedBonusPct: pct,
    attackSpeedExpiresAt: now() + durationSec * 1000,
    castVisuals: { ...state.castVisuals, haste: now() + durationSec * 1000 },
  };
  emit();
}

export function getAttackSpeedMultiplier() {
  if (state.attackSpeedExpiresAt < now()) return 1;
  return 1 / (1 + state.attackSpeedBonusPct); // higher % = shorter cooldown
}

// ─── Reflect (God's Deflection) ─────────────────────────────────────────
export function applyReflectBuff(chancePct, durationSec = 20) {
  state = {
    ...state,
    reflectChancePct: chancePct,
    reflectExpiresAt: now() + durationSec * 1000,
    castVisuals: { ...state.castVisuals, gods_deflection: now() + durationSec * 1000 },
  };
  emit();
}

// Roll: returns true if the incoming hit should be reflected back at attacker.
export function rollReflect() {
  if (state.reflectExpiresAt < now()) return false;
  return Math.random() < state.reflectChancePct;
}

// ─── Power Charge (hand glow + +100% dmg for next N hits) ───────────────
export function applyPowerCharge(pct, hits, durationSec = 90) {
  state = {
    ...state,
    powerChargePct: pct,
    powerChargeHitsLeft: hits,
    powerChargeExpiresAt: now() + durationSec * 1000,
    castVisuals: { ...state.castVisuals, power_charge: now() + durationSec * 1000 },
  };
  emit();
}

// Returns multiplier (1 + pct) and consumes one hit. Combines with focus buff.
export function consumePowerChargeMultiplier() {
  if (state.powerChargeHitsLeft <= 0 || state.powerChargeExpiresAt < now()) return 1;
  const mult = 1 + state.powerChargePct;
  const hitsLeft = state.powerChargeHitsLeft - 1;
  state = {
    ...state,
    powerChargeHitsLeft: hitsLeft,
    powerChargePct: hitsLeft <= 0 ? 0 : state.powerChargePct,
  };
  emit();
  return mult;
}

// True while Power Charge is active — drives the glowing-hands aura visual.
export function isPowerChargeActive() {
  return state.powerChargeHitsLeft > 0 && state.powerChargeExpiresAt >= now();
}

export function isRepulsionActive() {
  return isCastVisualActive('repulsion');
}

export function isBarrierActive() {
  return isCastVisualActive('barrier_aura') || isCastVisualActive('guardian_wall') || isCastVisualActive('iron_fortress') || isCastVisualActive('counter_pulse') || isCastVisualActive('aegis_shield');
}

export function isDestructionActive() {
  return isCastVisualActive('heavens_destruction');
}

export function isCastVisualActive(skillId) {
  return (state.castVisuals?.[skillId] || 0) >= now();
}

// ─── Dodge (Defense skill — chance to be missed) ────────────────────────
export function applyDodgeBuff(chancePct, durationSec = 180) {
  state = {
    ...state,
    dodgeChancePct: chancePct,
    dodgeExpiresAt: now() + durationSec * 1000,
    castVisuals: { ...state.castVisuals, evasion: now() + durationSec * 1000 },
  };
  emit();
}

export function rollDodgeBuff() {
  if (state.dodgeExpiresAt < now()) return false;
  return Math.random() < state.dodgeChancePct;
}

// ─── Tick — clear expired timed buffs every frame ───────────────────────
export function tickBuffs() {
  const n = now();
  let changed = false;
  const next = { ...state };
  if (next.shield > 0 && next.shieldExpiresAt < n) { next.shield = 0; changed = true; }
  if (next.damageBonusHitsLeft > 0 && next.damageBonusExpiresAt < n) { next.damageBonusHitsLeft = 0; next.damageBonusPct = 0; changed = true; }
  if (next.critDamageBonusPct > 0 && next.critDamageBonusExpiresAt < n) { next.critDamageBonusPct = 0; changed = true; }
  if (next.attackSpeedBonusPct > 0 && next.attackSpeedExpiresAt < n) { next.attackSpeedBonusPct = 0; changed = true; }
  if (next.reflectChancePct > 0 && next.reflectExpiresAt < n) { next.reflectChancePct = 0; changed = true; }
  if (next.powerChargeHitsLeft > 0 && next.powerChargeExpiresAt < n) { next.powerChargeHitsLeft = 0; next.powerChargePct = 0; changed = true; }
  if (next.dodgeChancePct > 0 && next.dodgeExpiresAt < n) { next.dodgeChancePct = 0; changed = true; }
  const nextCastVisuals = Object.fromEntries(Object.entries(next.castVisuals || {}).filter(([, expiresAt]) => expiresAt >= n));
  if (Object.keys(nextCastVisuals).length !== Object.keys(next.castVisuals || {}).length) { next.castVisuals = nextCastVisuals; changed = true; }
  if (changed) { state = next; emit(); }
}