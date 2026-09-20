// AXE Prompt 030 — Halo prestige integration.
// The existing 0–200 Halo progression remains the source of level/stat math.
// This AXE layer adds service access, visible prestige state, elixir-capacity
// expansion, and performance-aware VFX tiers.

export const AXE_HALO_SERVICE_DESCRIPTOR = Object.freeze({
  id: 'halo',
  label: 'Halo',
  category: 'progression',
  remoteAccessible: true,
});

export const AXE_HALO_ELIXIR_CAPACITY = Object.freeze([
  Object.freeze({ minLevel: 0, bonusCapacity: 0 }),
  Object.freeze({ minLevel: 31, bonusCapacity: 10 }),
  Object.freeze({ minLevel: 61, bonusCapacity: 20 }),
  Object.freeze({ minLevel: 101, bonusCapacity: 35 }),
  Object.freeze({ minLevel: 141, bonusCapacity: 50 }),
  Object.freeze({ minLevel: 171, bonusCapacity: 75 }),
  Object.freeze({ minLevel: 200, bonusCapacity: 100 }),
]);

export const AXE_HALO_VFX_PROFILES = Object.freeze({
  bronze: Object.freeze({ rings: 1, particles: 16, pulse: false }),
  silver: Object.freeze({ rings: 1, particles: 24, pulse: false }),
  gold: Object.freeze({ rings: 2, particles: 32, pulse: true }),
  mythic: Object.freeze({ rings: 2, particles: 48, pulse: true }),
  divine: Object.freeze({ rings: 3, particles: 64, pulse: true }),
  celestial: Object.freeze({ rings: 4, particles: 80, pulse: true }),
});

export function getAXEHaloElixirCapacityBonus(level = 0) {
  const lvl = Math.max(0, Number(level) || 0);
  let bonus = 0;
  for (const band of AXE_HALO_ELIXIR_CAPACITY) {
    if (lvl >= band.minLevel) bonus = band.bonusCapacity;
  }
  return bonus;
}

export function getAXEHaloVisualProfile(tierId, {
  hidden = false,
  lowEffects = false,
} = {}) {
  if (hidden) return { visible: false, rings: 0, particles: 0, pulse: false };
  const base = AXE_HALO_VFX_PROFILES[tierId] || AXE_HALO_VFX_PROFILES.bronze;
  if (!lowEffects) return { visible: true, ...base };
  return {
    visible: true,
    rings: Math.min(1, base.rings),
    particles: Math.min(12, base.particles),
    pulse: false,
  };
}
