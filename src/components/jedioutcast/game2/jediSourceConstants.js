// Source-grounded Jedi Outcast gameplay constants adapted from Raven's GPL source.
// Quake/Jedi world units are converted to the Three.js meter-scale viewer at 64 units = 1 meter.
export const JEDI_SOURCE_COMMIT = '85f58467344d3ccbc6e2501a9af573ff4488a898';
export const JEDI_SOURCE_UNITS_PER_METER = 64;

export const RAVEN_PMOVE = Object.freeze({
  sourcePath: 'code/game/bg_pmove.cpp',
  clientInputPath: 'code/client/cl_input.cpp',
  gMainPath: 'code/game/g_main.cpp',
  saberPath: 'code/game/wp_saber.cpp',
  speedUnits: 250,
  speed: 250 / JEDI_SOURCE_UNITS_PER_METER,
  stopSpeed: 100 / JEDI_SOURCE_UNITS_PER_METER,
  acceleration: 12,
  airAcceleration: 4,
  friction: 6,
  gravity: 800 / JEDI_SOURCE_UNITS_PER_METER,
  jumpVelocity: 225 / JEDI_SOURCE_UNITS_PER_METER,
  walkCommand: 64,
  runCommand: 127,
  clRun: 1,
  forceJumpStrength: Object.freeze([225, 420, 590, 840].map((v) => v / JEDI_SOURCE_UNITS_PER_METER)),
  forceJumpHeight: Object.freeze([32, 96, 192, 384].map((v) => v / JEDI_SOURCE_UNITS_PER_METER)),
  forcePushPullRadius: Object.freeze([0, 384, 448, 512].map((v) => v / JEDI_SOURCE_UNITS_PER_METER)),
  forcePushCone: Object.freeze([1, 1, 0.8, 0.6]),
  forcePullCone: Object.freeze([1, 1, 1, 0.8]),
  forceSpeedTimeScale: Object.freeze([1, 0.75, 0.5, 0.25]),
});

export const YBOT_MODEL_URL =
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/c6b99bc5a_ybot.fbx';

export const RAVEN_SABER_ASSETS = Object.freeze({
  model: 'models/weapons2/saber/saber_w.md3',
  icon: 'gfx/hud/w_icon_lightsaber',
  hum: 'sound/weapons/saber/saberhum1.wav',
  bladeLengthUnits: 40,
  bladeLength: 40 / JEDI_SOURCE_UNITS_PER_METER,
  sourcePath: 'code/base/ext_data/weapons.dat',
});

export const RAVEN_GAMEPLAY_FORCE_POWERS = Object.freeze([
  { id: 'heal', label: 'Heal', enum: 'FP_HEAL', key: 'F5', hudName: 'HEAL2' },
  { id: 'speed', label: 'Speed', enum: 'FP_SPEED', key: 'F3', hudName: 'SPEED2' },
  { id: 'push', label: 'Push', enum: 'FP_PUSH', key: 'F1', hudName: 'PUSH2' },
  { id: 'pull', label: 'Pull', enum: 'FP_PULL', key: 'F2', hudName: 'PULL2' },
  { id: 'telepathy', label: 'Mind Trick', enum: 'FP_TELEPATHY', key: 'F4', hudName: 'MINDTRICK2' },
  { id: 'grip', label: 'Grip', enum: 'FP_GRIP', key: 'F6', hudName: 'GRIP2' },
  { id: 'lightning', label: 'Lightning', enum: 'FP_LIGHTNING', key: 'F7', hudName: 'LIGHTNING2' },
]);

export const RAVEN_ALL_FORCE_POWERS = Object.freeze([
  { id: 'heal', enum: 'FP_HEAL', level: 3 },
  { id: 'levitation', enum: 'FP_LEVITATION', level: 3 },
  { id: 'speed', enum: 'FP_SPEED', level: 3 },
  { id: 'push', enum: 'FP_PUSH', level: 3 },
  { id: 'pull', enum: 'FP_PULL', level: 3 },
  { id: 'telepathy', enum: 'FP_TELEPATHY', level: 3 },
  { id: 'grip', enum: 'FP_GRIP', level: 3 },
  { id: 'lightning', enum: 'FP_LIGHTNING', level: 3 },
  { id: 'saberThrow', enum: 'FP_SABERTHROW', level: 3 },
  { id: 'saberDefense', enum: 'FP_SABER_DEFENSE', level: 3 },
  { id: 'saberOffense', enum: 'FP_SABER_OFFENSE', level: 3 },
]);

export function ravenCmdScale(forwardMove, rightMove, speed = RAVEN_PMOVE.speed) {
  const forward = Number(forwardMove) || 0;
  const right = Number(rightMove) || 0;
  const max = Math.max(Math.abs(forward), Math.abs(right));
  if (!max) return 0;
  const total = Math.hypot(forward, right);
  return speed * max / (RAVEN_PMOVE.runCommand * total);
}

export function ravenMovementDir(forwardMove, rightMove, previous = 0) {
  const f = Math.sign(Number(forwardMove) || 0);
  const r = Math.sign(Number(rightMove) || 0);
  if (r === 0 && f > 0) return 0;
  if (r < 0 && f > 0) return 1;
  if (r < 0 && f === 0) return 2;
  if (r < 0 && f < 0) return 3;
  if (r === 0 && f < 0) return 4;
  if (r > 0 && f < 0) return 5;
  if (r > 0 && f === 0) return 6;
  if (r > 0 && f > 0) return 7;
  if (previous === 2) return 1;
  if (previous === 6) return 7;
  return previous;
}
