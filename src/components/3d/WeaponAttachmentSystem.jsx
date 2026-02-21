/**
 * WeaponAttachmentSystem
 * 
 * Manages attaching a weapon (GLB model) to a character's bone (back/spine),
 * and re-parenting it to the hand bone during a draw animation.
 * Also handles spawning a GLB visual effect at the back during the draw.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const gltfLoader = new GLTFLoader();
const fbxLoader = new FBXLoader();

/**
 * Find a bone by partial name match (case-insensitive).
 * Mixamo skeletons use names like "mixamorigSpine2", "mixamorigRightHand", etc.
 */
function findBone(root, partialName) {
  let found = null;
  const lower = partialName.toLowerCase();
  root.traverse((child) => {
    if (found) return;
    if (child.isBone && child.name.toLowerCase().includes(lower)) {
      found = child;
    }
  });
  return found;
}

/**
 * Load a 3D model (GLB/GLTF or FBX) and return { scene, animations }.
 */
async function loadModel(url) {
  const lower = url.toLowerCase();
  if (lower.endsWith('.fbx')) {
    return new Promise((resolve, reject) => {
      fbxLoader.load(url, (fbx) => {
        resolve({ scene: fbx, animations: fbx.animations || [] });
      }, undefined, reject);
    });
  }
  // Default: GLB/GLTF
  return new Promise((resolve, reject) => {
    gltfLoader.load(url, (gltf) => {
      resolve({ scene: gltf.scene, animations: gltf.animations || [] });
    }, undefined, reject);
  });
}

/**
 * Attach weapon to a character model.
 * Returns a controller object with methods to manage the weapon.
 * 
 * @param {THREE.Object3D} characterModel - The loaded character (FBX/GLB)
 * @param {string} weaponUrl - URL to the weapon GLB file
 * @param {Object} options
 * @param {string} options.backBone - Partial bone name for back attachment (default: "Spine2")
 * @param {string} options.handBone - Partial bone name for hand attachment (default: "RightHand")
 * @param {number} options.scale - Weapon scale (default: 0.15)
 */
export async function attachWeapon(characterModel, weaponUrl, options = {}) {
  const {
    backBone = 'Spine2',
    handBone = 'RightHand',
    scale = 0.15,
  } = options;

  const loaded = await loadModel(weaponUrl);
  const weaponMesh = loaded.scene;

  // Scale the weapon
  weaponMesh.scale.setScalar(scale);

  // Find bones
  const spineBone = findBone(characterModel, backBone);
  const rightHandBone = findBone(characterModel, handBone);

  if (!spineBone) {
    console.warn('[WeaponAttach] Could not find back bone:', backBone);
    return null;
  }

  // Position on back: offset slightly behind and up relative to spine
  weaponMesh.position.set(0, 15, -10); // In bone-local space (cm units for Mixamo)
  weaponMesh.rotation.set(0, 0, Math.PI * 0.75); // Angled on back

  spineBone.add(weaponMesh);
  console.log('[WeaponAttach] Sword attached to', spineBone.name);

  let isInHand = false;

  return {
    mesh: weaponMesh,
    spineBone,
    rightHandBone,
    isInHand: () => isInHand,

    /** Move weapon from back to hand */
    moveToHand() {
      if (isInHand || !rightHandBone) return;
      spineBone.remove(weaponMesh);
      weaponMesh.position.set(0, 5, 0);
      weaponMesh.rotation.set(Math.PI * 0.5, 0, 0);
      rightHandBone.add(weaponMesh);
      isInHand = true;
      console.log('[WeaponAttach] Sword moved to hand:', rightHandBone.name);
    },

    /** Move weapon from hand back to back */
    moveToBack() {
      if (!isInHand) return;
      rightHandBone.remove(weaponMesh);
      weaponMesh.position.set(0, 15, -10);
      weaponMesh.rotation.set(0, 0, Math.PI * 0.75);
      spineBone.add(weaponMesh);
      isInHand = false;
      console.log('[WeaponAttach] Sword returned to back');
    },

    /** Remove weapon entirely */
    dispose() {
      const parent = weaponMesh.parent;
      if (parent) parent.remove(weaponMesh);
      weaponMesh.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(m => m?.dispose());
        }
      });
    }
  };
}

/**
 * Load and attach a GLB visual effect to a bone.
 * Plays any embedded animations in the GLB.
 * Returns a controller to show/hide/dispose.
 */
export async function attachEffect(characterModel, effectUrl, options = {}) {
  const {
    boneName = 'Spine2',
    scale = 0.15,
    offset = { x: 0, y: 20, z: -15 },
  } = options;

  const gltf = await loadGLB(effectUrl);
  const effectMesh = gltf.scene;
  effectMesh.scale.setScalar(scale);

  const bone = findBone(characterModel, boneName);
  if (!bone) {
    console.warn('[EffectAttach] Could not find bone:', boneName);
    return null;
  }

  effectMesh.position.set(offset.x, offset.y, offset.z);
  effectMesh.visible = false; // Hidden until triggered
  bone.add(effectMesh);

  // Set up animation mixer if the GLB has animations
  let mixer = null;
  let actions = [];
  if (gltf.animations && gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(effectMesh);
    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      actions.push(action);
    });
    console.log(`[EffectAttach] Loaded ${gltf.animations.length} animations from effect GLB`);
  }

  // Make effect materials emissive / glowing
  effectMesh.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = false;
      // Add glow by boosting emissive
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => {
          if (m.emissive) m.emissive.setHex(0x00ccff);
          if ('emissiveIntensity' in m) m.emissiveIntensity = 2.0;
          m.transparent = true;
          m.opacity = 0.85;
        });
      }
    }
  });

  console.log('[EffectAttach] Effect attached to', bone.name);

  return {
    mesh: effectMesh,
    mixer,
    bone,

    /** Show the effect and play animations */
    play() {
      effectMesh.visible = true;
      if (mixer && actions.length > 0) {
        actions.forEach(a => {
          a.reset();
          a.play();
        });
      }
      console.log('[EffectAttach] Effect playing');
    },

    /** Hide the effect */
    hide() {
      effectMesh.visible = false;
      if (mixer) mixer.stopAllAction();
    },

    /** Update mixer (call in render loop) */
    update(delta) {
      if (mixer && effectMesh.visible) {
        mixer.update(delta);
      }
    },

    /** Clean up */
    dispose() {
      const parent = effectMesh.parent;
      if (parent) parent.remove(effectMesh);
      if (mixer) mixer.stopAllAction();
      effectMesh.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(m => m?.dispose());
        }
      });
    }
  };
}