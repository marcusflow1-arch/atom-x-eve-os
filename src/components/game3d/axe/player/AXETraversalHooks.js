// AXE Prompt 007 — traversal expansion, directional dodge, fall safety,
// interaction hooks, and reusable world trigger volumes.

export const AXE_DODGE_CONFIG = Object.freeze({
  durationSeconds: 0.45,
  cancelWindowSeconds: 0.18,
  travelDistanceMeters: 4.2,
  directions: Object.freeze(['forward', 'backward', 'left', 'right']),
  allowDiagonalInput: true,
  invulnerabilityWindowSeconds: 0.18,
});

export const AXE_FALL_CONFIG = Object.freeze({
  softLandingSpeed: -5.5,
  hardLandingSpeed: -9,
  severeLandingSpeed: -14,
  abyssY: -25,
  damageEnabled: false, // architecture hook only until fall damage is balanced.
});

export const AXE_INTERACTION_INTENTS = Object.freeze([
  'Talk',
  'Open',
  'Close',
  'Enter',
  'Exit',
  'Use',
  'Activate',
  'Gather',
  'Inspect',
  'Teleport',
]);

export function classifyAXEFall(verticalVelocity) {
  const v = Number(verticalVelocity) || 0;
  if (v <= AXE_FALL_CONFIG.severeLandingSpeed) return 'severe';
  if (v <= AXE_FALL_CONFIG.hardLandingSpeed) return 'hard';
  if (v <= AXE_FALL_CONFIG.softLandingSpeed) return 'medium';
  return 'soft';
}

export function createAXETriggerVolume({
  id,
  kind = 'generic',
  shape = 'circle',
  center = { x: 0, y: 0, z: 0 },
  radius = 5,
  halfExtents = { x: 5, y: 5, z: 5 },
  metadata = {},
}) {
  return Object.freeze({
    id,
    kind,
    shape,
    center: { ...center },
    radius,
    halfExtents: { ...halfExtents },
    metadata: { ...metadata },
  });
}

export function isPointInsideAXETrigger(point, trigger) {
  if (!point || !trigger) return false;
  if (trigger.shape === 'box') {
    return (
      Math.abs((point.x || 0) - trigger.center.x) <= trigger.halfExtents.x &&
      Math.abs((point.y || 0) - trigger.center.y) <= trigger.halfExtents.y &&
      Math.abs((point.z || 0) - trigger.center.z) <= trigger.halfExtents.z
    );
  }

  const dx = (point.x || 0) - trigger.center.x;
  const dz = (point.z || 0) - trigger.center.z;
  return Math.hypot(dx, dz) <= trigger.radius;
}

export const AXE_INITIAL_TRAVERSAL_TRIGGERS = Object.freeze([
  createAXETriggerVolume({
    id: 'AXE_Trigger_CapitalSafeZone',
    kind: 'safe-zone',
    center: { x: 0, y: 0, z: 420 },
    radius: 500,
    metadata: { pvpAllowed: false, hostileAIAllowed: false },
  }),
  createAXETriggerVolume({
    id: 'AXE_Trigger_StarterArrival',
    kind: 'first-arrival',
    center: { x: 0, y: 0, z: -35 },
    radius: 20,
  }),
]);
