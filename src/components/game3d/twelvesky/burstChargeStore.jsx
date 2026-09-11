// Short-lived charge window inspired by TwelveSky2 burst play: prime a charge,
// then consume it with a single-hit skill for a critical-style damage spike.
// Kept separate from visual skills so any future weapon family can reuse it.

let charge = null;
const listeners = new Set();

function snapshot() {
  const now = Date.now();
  if (charge && charge.expiresAt <= now) charge = null;
  return charge ? { ...charge, active: true, remainingMs: Math.max(0, charge.expiresAt - now) } : { active: false, remainingMs: 0, multiplier: 1 };
}

function emit() {
  const s = snapshot();
  listeners.forEach((fn) => fn(s));
}

export function primeBurstCharge({ durationMs = 5000, multiplier = 3 } = {}) {
  charge = {
    multiplier: Math.max(1, Number(multiplier) || 3),
    expiresAt: Date.now() + Math.max(250, Number(durationMs) || 5000),
  };
  emit();
  return snapshot();
}

export function consumeBurstCharge() {
  const s = snapshot();
  if (!s.active) return null;
  charge = null;
  emit();
  return s;
}

export function clearBurstCharge() {
  charge = null;
  emit();
}

export function getBurstCharge() { return snapshot(); }

export function subscribeBurstCharge(fn) {
  listeners.add(fn);
  fn(snapshot());
  return () => listeners.delete(fn);
}
