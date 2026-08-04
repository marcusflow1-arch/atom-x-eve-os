// ─── Combat Action Definitions ─────────────────────────────────────────
// Single source of truth for every combat action — player and enemy alike.
// Nothing here is code: an action is pure data, so combos, hit timing and
// cancel rules can be tuned without touching the runner.
//
// All times are SECONDS measured from the moment the action starts, so every
// window is animation-progress based — never a setTimeout, never a guess.
//
//   duration      total length of the action (clip length)
//   clip          animation clip name to crossfade to
//   next          which actions this one may chain into
//   bufferWindow  [start,end] input pressed here queues the next chain step
//   cancelWindow  [start,end] generic early-out window
//   cancelRules    per-kind cancel windows (dodge/block/stagger/death)
//   movementLock  locomotion is suppressed while the action runs
//   superArmor    action cannot be staggered by incoming hits
//   lunge         code-driven forward travel (root-motion feel, no root motion)
//   hitWindows    the ONLY times this action can deal damage

export const ACTION_PRIORITY = {
  death: 100,
  stagger: 90,
  dodge: 80,
  attack: 60,
  block: 50,
  locomotion: 10,
  idle: 0,
};

export const PLAYER_ACTIONS = {
  light_1: {
    kind: 'attack',
    clip: 'Sword_Hit_1',
    duration: 0.82,
    next: ['light_2'],
    bufferWindow: [0.42, 0.72],
    cancelWindow: [0.58, 0.82],
    cancelRules: { dodge: [0.30, 0.82], block: [0.58, 0.82], stagger: [0, 0.82] },
    movementLock: true,
    superArmor: false,
    hitWindows: [
      { start: 0.24, end: 0.38, socket: 'WeaponTip', radius: 1.35, damageScale: 1.0, hitStun: 0.18, knockback: 2.0 },
    ],
  },
  light_2: {
    kind: 'attack',
    clip: 'Sword_Hit_2',
    duration: 0.88,
    next: ['light_3'],
    bufferWindow: [0.44, 0.76],
    cancelWindow: [0.62, 0.88],
    cancelRules: { dodge: [0.34, 0.88], block: [0.62, 0.88], stagger: [0, 0.88] },
    movementLock: true,
    superArmor: false,
    lunge: { start: 0.18, end: 0.34, distance: 1.7 },
    hitWindows: [
      { start: 0.30, end: 0.45, socket: 'WeaponTip', radius: 1.5, damageScale: 1.15, hitStun: 0.22, knockback: 2.8 },
    ],
  },
  light_3: {
    kind: 'attack',
    clip: 'Sword_Slam_3',
    duration: 1.06,
    next: [],
    bufferWindow: null,
    cancelWindow: [0.78, 1.06],
    cancelRules: { dodge: [0.62, 1.06], block: null, stagger: [0, 1.06] },
    movementLock: true,
    superArmor: true,
    lunge: { start: 0.22, end: 0.40, distance: 1.1 },
    hitWindows: [
      { start: 0.36, end: 0.58, socket: 'WeaponTip', radius: 1.8, damageScale: 1.45, hitStun: 0.35, knockback: 4.5 },
    ],
  },
};

export const ENEMY_ACTIONS = {
  claw_1: {
    kind: 'attack',
    clip: 'Claw_1',
    duration: 0.78,
    next: ['claw_2'],
    bufferWindow: [0.36, 0.60],
    cancelRules: { stagger: [0, 0.78] },
    movementLock: true,
    hitWindows: [
      { start: 0.22, end: 0.34, socket: 'RightHand', radius: 1.2, damageScale: 1.0, hitStun: 0.12, knockback: 1.2 },
    ],
  },
  claw_2: {
    kind: 'attack',
    clip: 'Claw_2',
    duration: 0.92,
    next: ['bite'],
    bufferWindow: [0.42, 0.68],
    cancelRules: { stagger: [0, 0.55] },
    movementLock: true,
    lunge: { start: 0.16, end: 0.32, distance: 1.2 },
    hitWindows: [
      { start: 0.28, end: 0.46, socket: 'LeftHand', radius: 1.3, damageScale: 1.1, hitStun: 0.16, knockback: 1.8 },
    ],
  },
  bite: {
    kind: 'attack',
    clip: 'Bite',
    duration: 1.05,
    next: [],
    bufferWindow: null,
    cancelRules: { stagger: null },   // finisher has super armor
    movementLock: true,
    superArmor: true,
    hitWindows: [
      { start: 0.40, end: 0.56, socket: 'Head', radius: 1.5, damageScale: 1.4, hitStun: 0.22, knockback: 3.2 },
    ],
  },
};

// Entry point of each chain — the brains ask for these by name.
export const PLAYER_COMBO_OPENER = 'light_1';
export const ENEMY_COMBO_OPENER = 'claw_1';

export const inWindow = (t, w) => Array.isArray(w) && t >= w[0] && t <= w[1];