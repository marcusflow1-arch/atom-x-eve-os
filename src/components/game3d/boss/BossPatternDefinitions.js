// Centralized tuning for scripted world-boss attack patterns.
// Each pattern is self-contained so boss logic never borrows quest/NPC identity.
export const BOSS_PATTERNS = {
  tornado_lift_beam: {
    id: 'tornado_lift_beam',
    introDelay: 0.5,
    beamDelayAfterCapture: 2.0,
    tickDamage: 14,
    tickInterval: 0.45,
    beamDamage: 42,
    knockbackDistance: 8,
    recoverLock: 0.75,
    line: {
      name: 'Ironmaw the Devourer',
      text: 'Let the storm carry you upward.',
      duration: 3.2,
    },
  },
};