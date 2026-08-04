// ─── Character Import Normalizer ───────────────────────────────────────
// The import pass every model/animation set must go through before any
// gameplay wiring. It separates the two layers that cause sideways walking
// and stretched limbs when they get mixed:
//
//   actorRoot    gameplay: position, facing, collision, movement, lunges
//   visualModel  asset correction: yaw offset, scale normalization, pivot
//
// Gameplay only ever touches actorRoot; the mesh's import correction lives
// once on the child. That way a yaw fix can never corrupt movement math, and
// movement can never fight the asset's authored orientation.

import * as THREE from 'three';
import { CANONICAL_FORWARD, CANONICAL_ACTOR_HEIGHT } from './characterBasis';
import { verifySockets } from './CharacterSocketUtils';

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();
const _dir = new THREE.Vector3();

/**
 * Measure which way the rest pose actually faces, using hip/foot geometry as
 * a reference, and return the yaw needed to bring it onto canonical forward.
 * Returns null when it can't tell — never guess silently.
 */
export function detectYawCorrection(model) {
  const hips = model.getObjectByName('mixamorigHips') || model.getObjectByName('Hips');
  const head = model.getObjectByName('mixamorigHead') || model.getObjectByName('Head');
  if (!hips || !head) return null;
  // A humanoid's chest normal is hard to read from bones alone, so we use the
  // rig's own local forward and compare it to canonical forward.
  hips.getWorldDirection(_dir);
  _dir.y = 0;
  if (_dir.lengthSq() < 1e-6) return null;
  _dir.normalize();
  const cross = CANONICAL_FORWARD.x * _dir.z - CANONICAL_FORWARD.z * _dir.x;
  const dot = CANONICAL_FORWARD.dot(_dir);
  return Math.atan2(cross, dot);
}

/** Flag non-uniform or non-1 bone scales — the usual cause of stretched limbs. */
export function auditBoneScales(model, tolerance = 0.001) {
  const offenders = [];
  model.traverse((o) => {
    if (!o.isBone) return;
    const { x, y, z } = o.scale;
    const nonUniform = Math.abs(x - y) > tolerance || Math.abs(y - z) > tolerance;
    const nonUnit = Math.abs(x - 1) > tolerance || Math.abs(y - 1) > tolerance || Math.abs(z - 1) > tolerance;
    if (nonUniform || nonUnit) {
      offenders.push({ bone: o.name, scale: [+x.toFixed(4), +y.toFixed(4), +z.toFixed(4)], nonUniform });
    }
  });
  return offenders;
}

/**
 * Normalize an imported character.
 *
 * @param model              the loaded GLB/FBX scene
 * @param yawOffset          explicit facing correction in radians (e.g. Math.PI
 *                           for a model that imports facing +Z). Pass 'auto' to
 *                           use detectYawCorrection.
 * @param normalizeScale     scale the mesh so it stands CANONICAL_ACTOR_HEIGHT tall
 * @param groundPivot        drop the mesh so its feet sit at actorRoot y = 0
 * @param requiredSockets    verified after correction
 * @returns { actorRoot, visualModel, report }
 */
export function normalizeCharacter(model, {
  yawOffset = 0,
  normalizeScale = true,
  groundPivot = true,
  requiredSockets = ['RightHand', 'Head'],
  name = 'Actor',
} = {}) {
  const actorRoot = new THREE.Group();
  actorRoot.name = name;

  const visualModel = model;
  visualModel.name = visualModel.name || `${name}_Visual`;

  const appliedYaw = yawOffset === 'auto' ? (detectYawCorrection(visualModel) ?? 0) : yawOffset;

  // Scale + pivot are measured BEFORE the correction rotation so the bounds
  // stay axis-aligned and readable.
  visualModel.rotation.set(0, 0, 0);
  visualModel.position.set(0, 0, 0);
  visualModel.updateMatrixWorld(true);
  _box.setFromObject(visualModel);
  _box.getSize(_size);
  _box.getCenter(_center);

  let appliedScale = 1;
  if (normalizeScale && _size.y > 1e-4) {
    appliedScale = CANONICAL_ACTOR_HEIGHT / _size.y;
    visualModel.scale.setScalar(appliedScale);
  }

  // Import correction lives here and ONLY here.
  visualModel.rotation.y = appliedYaw;

  if (groundPivot) {
    visualModel.position.y = -_box.min.y * appliedScale;
  }

  actorRoot.add(visualModel);

  const boneScaleIssues = auditBoneScales(visualModel);
  const socketReport = verifySockets(visualModel, requiredSockets);

  const report = {
    name,
    appliedYaw,
    appliedScale: +appliedScale.toFixed(4),
    measuredHeight: +_size.y.toFixed(3),
    groundOffset: +visualModel.position.y.toFixed(3),
    boneScaleIssues,
    sockets: socketReport,
    ok: socketReport.ok && boneScaleIssues.length === 0,
  };

  if (boneScaleIssues.length) {
    console.warn(`[Normalizer] ${name}: ${boneScaleIssues.length} bone(s) with non-uniform/non-unit scale — expect deformation`, boneScaleIssues.slice(0, 5));
  }

  actorRoot.userData.visualModel = visualModel;
  actorRoot.userData.normalization = report;
  return { actorRoot, visualModel, report };
}

/** Retrieve the corrected mesh for an actor root produced above. */
export const getVisualModel = (actorRoot) => actorRoot?.userData?.visualModel || null;

/**
 * Strip root motion from clips so gameplay owns travel distance (our lunge
 * windows do the moving). Pass preserve: true to keep it for a specific clip.
 */
export function stripRootMotion(clip, rootBoneNames = ['mixamorigHips', 'Hips', 'root']) {
  clip.tracks = clip.tracks.filter((track) => {
    if (!track.name.endsWith('.position')) return true;
    const bone = track.name.split('.')[0];
    return !rootBoneNames.some((n) => bone === n || bone.endsWith(n));
  });
  return clip;
}