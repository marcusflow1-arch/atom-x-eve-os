/**
 * TransformGizmo — Translate arrows + Rotation rings for each axis.
 * Arrows: drag to move along axis.
 * Rings: drag to rotate around axis.
 * Hit meshes carry userData: { isGizmoHit, axis, mode: 'translate' | 'rotate' }
 */
import * as THREE from 'three';

const AXIS_LENGTH = 0.4;
const AXIS_THICKNESS = 0.015;
const HEAD_SIZE = 0.06;
const RING_RADIUS = 0.3;
const RING_TUBE = 0.012;

const COLORS = {
  x: 0xff4444,
  y: 0x44ff44,
  z: 0x4488ff,
};

function makeArrow(axis, color) {
  const group = new THREE.Group();
  group.userData.axis = axis;

  const mat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 });

  // Shaft
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(AXIS_THICKNESS, AXIS_THICKNESS, AXIS_LENGTH, 8), mat);
  shaft.position.y = AXIS_LENGTH / 2;
  group.add(shaft);

  // Cone head
  const head = new THREE.Mesh(new THREE.ConeGeometry(HEAD_SIZE, HEAD_SIZE * 2.5, 8), mat.clone());
  head.position.y = AXIS_LENGTH + HEAD_SIZE;
  group.add(head);

  // Invisible hit area for translate
  const hitGeo = new THREE.CylinderGeometry(0.05, 0.05, AXIS_LENGTH + HEAD_SIZE * 3, 8);
  const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }));
  hitMesh.position.y = (AXIS_LENGTH + HEAD_SIZE) / 2;
  hitMesh.userData = { axis, isGizmoHit: true, mode: 'translate' };
  group.add(hitMesh);

  // Orient
  if (axis === 'x') group.rotation.z = -Math.PI / 2;
  else if (axis === 'z') group.rotation.x = Math.PI / 2;

  group.renderOrder = 9999;
  return group;
}

function makeRing(axis, color) {
  const group = new THREE.Group();
  group.userData.axis = axis;

  // Visible ring
  const ringGeo = new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 12, 48);
  const ringMat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.6 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  group.add(ring);

  // Wider invisible hit torus
  const hitGeo = new THREE.TorusGeometry(RING_RADIUS, RING_TUBE * 4, 8, 32);
  const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }));
  hitMesh.userData = { axis, isGizmoHit: true, mode: 'rotate' };
  group.add(hitMesh);

  // Orient ring so it wraps around the correct axis
  if (axis === 'x') {
    group.rotation.y = Math.PI / 2;
  } else if (axis === 'z') {
    group.rotation.x = Math.PI / 2;
  }
  // y ring stays flat (default torus is in XY plane → rotated to XZ by rotating x)
  if (axis === 'y') {
    group.rotation.x = Math.PI / 2;
  }

  group.renderOrder = 9998;
  return group;
}

export function createGizmo() {
  const gizmo = new THREE.Group();
  gizmo.name = '__transform_gizmo__';
  gizmo.renderOrder = 9999;

  // Translate arrows
  gizmo.add(makeArrow('x', COLORS.x));
  gizmo.add(makeArrow('y', COLORS.y));
  gizmo.add(makeArrow('z', COLORS.z));

  // Rotate rings
  gizmo.add(makeRing('x', COLORS.x));
  gizmo.add(makeRing('y', COLORS.y));
  gizmo.add(makeRing('z', COLORS.z));

  // Center sphere (free rotate indicator)
  const centerGeo = new THREE.SphereGeometry(0.035, 12, 12);
  const centerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.7 });
  const center = new THREE.Mesh(centerGeo, centerMat);
  center.userData = { isGizmoHit: true, axis: 'free', mode: 'rotate' };
  center.renderOrder = 9999;
  gizmo.add(center);

  gizmo.visible = false;
  return gizmo;
}

export function getGizmoHitMeshes(gizmo) {
  const hits = [];
  gizmo.traverse(child => {
    if (child.userData.isGizmoHit) hits.push(child);
  });
  return hits;
}

export function positionGizmo(gizmo, worldPos) {
  gizmo.position.copy(worldPos);
  gizmo.visible = true;
}

export function hideGizmo(gizmo) {
  gizmo.visible = false;
}