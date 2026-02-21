/**
 * TransformGizmo — Creates translate/rotate/scale gizmo arrows in the Three.js scene.
 * When a user clicks an attached object, the gizmo appears around it.
 * Dragging the gizmo axes updates the object's transform.
 */
import * as THREE from 'three';

const AXIS_LENGTH = 0.4;
const AXIS_THICKNESS = 0.015;
const HEAD_SIZE = 0.06;

const COLORS = {
  x: 0xff4444,
  y: 0x44ff44,
  z: 0x4488ff,
  xHover: 0xff8888,
  yHover: 0x88ff88,
  zHover: 0x88bbff,
};

function makeArrow(axis, color) {
  const group = new THREE.Group();
  group.userData.axis = axis;

  // Shaft
  const shaftGeo = new THREE.CylinderGeometry(AXIS_THICKNESS, AXIS_THICKNESS, AXIS_LENGTH, 8);
  const mat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 });
  const shaft = new THREE.Mesh(shaftGeo, mat);
  shaft.position.y = AXIS_LENGTH / 2;
  group.add(shaft);

  // Head (cone)
  const headGeo = new THREE.ConeGeometry(HEAD_SIZE, HEAD_SIZE * 2.5, 8);
  const head = new THREE.Mesh(headGeo, mat.clone());
  head.position.y = AXIS_LENGTH + HEAD_SIZE;
  group.add(head);

  // Invisible wider hit area
  const hitGeo = new THREE.CylinderGeometry(0.05, 0.05, AXIS_LENGTH + HEAD_SIZE * 3, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.position.y = (AXIS_LENGTH + HEAD_SIZE) / 2;
  hitMesh.userData.axis = axis;
  hitMesh.userData.isGizmoHit = true;
  group.add(hitMesh);

  // Orient based on axis
  if (axis === 'x') {
    group.rotation.z = -Math.PI / 2;
  } else if (axis === 'z') {
    group.rotation.x = Math.PI / 2;
  }

  group.renderOrder = 9999;
  return group;
}

export function createGizmo() {
  const gizmo = new THREE.Group();
  gizmo.name = '__transform_gizmo__';
  gizmo.renderOrder = 9999;

  const xArrow = makeArrow('x', COLORS.x);
  const yArrow = makeArrow('y', COLORS.y);
  const zArrow = makeArrow('z', COLORS.z);

  gizmo.add(xArrow, yArrow, zArrow);

  // Center sphere
  const centerGeo = new THREE.SphereGeometry(0.03, 12, 12);
  const centerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.8 });
  const center = new THREE.Mesh(centerGeo, centerMat);
  center.renderOrder = 9999;
  gizmo.add(center);

  gizmo.visible = false;
  return gizmo;
}

/**
 * Get all hit-testable meshes from gizmo for raycasting
 */
export function getGizmoHitMeshes(gizmo) {
  const hits = [];
  gizmo.traverse(child => {
    if (child.userData.isGizmoHit) hits.push(child);
  });
  return hits;
}

/**
 * Position the gizmo at a world-space position (usually the attached object's world pos)
 */
export function positionGizmo(gizmo, worldPos) {
  gizmo.position.copy(worldPos);
  gizmo.visible = true;
}

export function hideGizmo(gizmo) {
  gizmo.visible = false;
}