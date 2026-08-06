// Centralized tuning for scripted boss attack patterns.
// Each pattern is a self-contained descriptor so the controller code stays
// state-machine-only and the numbers live in one place.
export const BOSS_PATTERNS = {
  tornado_lift_beam: {
    id: 'tornado_lift_beam',
    introDelay: 0.5,              // tornado spins up before it starts pulling
    beamDelayAfterCapture: 2.0,   // how long the player is trapped before the beam
    tickDamage: 14,               // damage per tick while captured/lifted
    tickInterval: 0.45,           // seconds between trap damage ticks
    beamDamage: 42,               // one-shot beam hit
    knockbackDistance: 8,        // how far the player is blasted out of the funnel
    recoverLock: 0.75,            // (reserved) brief control lock after landing
    line: {
      name: 'Kali',
      text: 'Let the storm carry you upward.',
      duration: 3.2,
    },
  },
};