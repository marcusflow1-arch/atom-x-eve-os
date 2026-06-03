// cinematicCamera.js — Frames the player + Living Quest NPC together during the
// in-world dialogue, then restores normal gameplay camera on exit.
// Self-contained: reads the globals GameWorld3D exposes (__gw3dCamera, the NPC
// group, and __localPlayerPos) and runs its own short rAF tween. It does NOT
// fight the gameplay camera because GameWorld3D's PlayerCameraSystem only runs
// while the player is moving input — during a modal dialogue the player is idle.

import * as THREE from 'three';

let rafId = null;
let active = false;

export function startCinematicCamera() {
  const camera = window.__gw3dCamera;
  const npc = window.__gw3dLivingQuestNPC;
  if (!camera) return;
  active = true;

  const lookTarget = new THREE.Vector3();
  const desiredPos = new THREE.Vector3();

  const tick = () => {
    if (!active) return;
    rafId = requestAnimationFrame(tick);

    const p = window.__localPlayerPos || { x: 0, y: 1, z: 0 };
    const npcPos = npc ? npc.position : { x: p.x + 2, y: p.y + 1, z: p.z };

    // Midpoint between player and NPC — what the camera looks at.
    lookTarget.set((p.x + npcPos.x) / 2, (p.y + npcPos.y) / 2 + 1.1, (p.z + npcPos.z) / 2);

    // Place the camera off to the side of the pair for an over-the-shoulder framing.
    const dx = npcPos.x - p.x;
    const dz = npcPos.z - p.z;
    const len = Math.hypot(dx, dz) || 1;
    // Perpendicular offset direction (rotate 90°) so we see both faces in profile.
    const perpX = -dz / len;
    const perpZ = dx / len;
    const dist = 3.6;
    desiredPos.set(
      lookTarget.x + perpX * dist,
      lookTarget.y + 1.6,
      lookTarget.z + perpZ * dist,
    );

    // Smoothly ease toward the cinematic framing.
    camera.position.lerp(desiredPos, 0.08);
    camera.lookAt(lookTarget);
  };
  tick();
}

export function stopCinematicCamera() {
  active = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}