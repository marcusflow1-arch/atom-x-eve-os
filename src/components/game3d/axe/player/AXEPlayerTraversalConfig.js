// AXE Prompt 006 — base player controller, movement, camera and traversal.

export const AXE_PLAYER_TRAVERSAL_CONFIG = Object.freeze({
  movement: Object.freeze({
    walkSpeed: 4,
    runSpeed: 9,
    sprintMultiplier: 1.35,
    crouchMultiplier: 0.58,
    acceleration: 24,
    deceleration: 20,
    rotationSmoothing: 0.18,
    airControl: 0.35,
  }),
  jump: Object.freeze({
    initialVelocity: 6,
    gravity: -18,
    coyoteTime: 0.1,
    inputBuffer: 0.12,
    minimumLandingSpeed: -1.2,
    hardLandingSpeed: -8,
  }),
  ground: Object.freeze({
    stepHeight: 0.45,
    maxWalkableSlopeDegrees: 44,
    groundSnapDistance: 0.25,
  }),
  camera: Object.freeze({
    minPitch: -0.25,
    maxPitch: 1.05,
    minDistance: 3.8,
    maxDistance: 11,
  }),
  states: Object.freeze([
    'idle',
    'walk',
    'run',
    'sprint',
    'jump_start',
    'jump_loop',
    'fall',
    'land',
    'crouch_idle',
    'crouch_walk',
    'mounted_idle',
    'mounted_walk',
    'mounted_run',
  ]),
});

export function classifyAXEAirState({ grounded, verticalVelocity = 0, justLanded = false }) {
  if (justLanded) return 'land';
  if (grounded) return null;
  if (verticalVelocity > 0.35) return 'jump_loop';
  return 'fall';
}
