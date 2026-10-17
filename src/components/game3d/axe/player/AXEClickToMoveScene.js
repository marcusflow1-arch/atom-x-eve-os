// three.js side of click-to-move (logic: AXEClickToMove.js): the ground marker at the move
// target and the click ray that tells ground from an enemy, NPC or player under the cursor.

import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

/**
 * Casts the click ray. Returns the ground point it lands on and the ray distances to the ground
 * and to the nearest visible entity mesh, for classifyAXEClick().
 *   groundMeshes: the terrain meshes (the same list sampleGroundY casts against)
 *   entityRoots: enemy, boss, rogue, NPC, companion and remote-player objects; hidden ones are skipped
 */
export function pickAXEClickToMoveGround({ event, element, camera, groundMeshes, entityRoots = [] }) {
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return { point: null, groundDistance: null, entityDistance: null };
  ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const groundHit = raycaster.intersectObjects(groundMeshes, true)[0] || null;
  const meshes = [];
  entityRoots.forEach((root) => {
    if (root?.visible) root.traverseVisible((node) => { if (node.isMesh) meshes.push(node); });
  });
  const entityHit = meshes.length > 0 ? raycaster.intersectObjects(meshes, false)[0] || null : null;
  return {
    point: groundHit ? groundHit.point.clone() : null,
    groundDistance: groundHit ? groundHit.distance : null,
    entityDistance: entityHit ? entityHit.distance : null,
  };
}

/** A small pulsing ring on the ground at the move target. */
export function createAXEClickToMoveMarker(scene) {
  const group = new THREE.Group();
  group.name = 'AXE_ClickToMoveMarker';
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
  const dotMat = ringMat.clone();
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.34, 32), ringMat);
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), dotMat);
  [ring, dot].forEach((mesh) => { mesh.rotation.x = -Math.PI / 2; mesh.renderOrder = 2; group.add(mesh); });
  group.visible = false;
  scene.add(group);
  let t = 0;
  return {
    show(point, groundY = null) {
      group.position.set(point.x, (groundY ?? point.y ?? 0) + 0.03, point.z);
      group.visible = true;
      t = 0;
    },
    hide() { group.visible = false; },
    update(delta) {
      if (!group.visible) return;
      t += delta;
      ring.scale.setScalar(1 + 0.12 * Math.sin(t * 6));
      ringMat.opacity = 0.65 + 0.2 * Math.sin(t * 6);
    },
    dispose() {
      scene.remove(group);
      ring.geometry.dispose();
      dot.geometry.dispose();
      ringMat.dispose();
      dotMat.dispose();
    },
  };
}
