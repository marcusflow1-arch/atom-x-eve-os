// spawnLivingQuestNPC.js — Spawns the oversized "Living Quest" NPC (Eve) into the
// 3D world, away from the archer cluster. Returns a handle the game loop uses for
// proximity detection, head-label projection, and idle animation.

import * as THREE from 'three';

export const LIVING_QUEST_POS = [16, 5, -14];

/**
 * @param {object} o
 * @param {THREE.Scene} o.scene
 * @param {FBXLoader} o.loader
 * @param {string} o.archerUrl
 * @param {(obj:THREE.Object3D, off?:number)=>void} o.snapToGround
 * @param {THREE.AnimationClip|null} [o.idleClip] — optional idle clip to play
 * @param {(handle:object)=>void} o.onReady — called once the model is in the scene
 */
export function spawnLivingQuestNPC({ scene, loader, archerUrl, snapToGround, idleClip, onReady }) {
  loader.load(archerUrl, (fbx) => {
    const box = new THREE.Box3().setFromObject(fbx);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = (1.7 / maxDim) * 1.6; // 60% bigger than regular NPCs
    fbx.scale.setScalar(scale);
    fbx.position.set(LIVING_QUEST_POS[0], LIVING_QUEST_POS[1], LIVING_QUEST_POS[2]);
    fbx.rotation.y = Math.atan2(-LIVING_QUEST_POS[0], -LIVING_QUEST_POS[2]);

    fbx.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = !node.isSkinnedMesh;
        node.receiveShadow = true;
        if (node.material) {
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          mats.forEach((m) => { m.color?.setHex(0xa855f7); });
        }
      }
    });

    // Purple aura ring under feet
    const ringGeo = new THREE.RingGeometry(1.0 / scale, 1.4 / scale, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02 / scale;
    fbx.add(ring);

    scene.add(fbx);
    snapToGround(fbx, 0);

    const mixer = new THREE.AnimationMixer(fbx);
    if (idleClip) {
      const action = mixer.clipAction(idleClip);
      action.reset().fadeIn(0.2).play();
    }

    onReady({ group: fbx, mixer, ringMesh: ring });
  });
}