import * as THREE from 'three';
import { HumanoidRig } from './ultimate/thunderRush/humanoidRig';
import { ARENA_CHIDORI, ARENA_CHIDORI_END, ArenaChidori, attackerPush, victimKnock } from './ultimate/thunderRush/arenaChidori';
import { fxFragment, fxVertex } from './ultimate/thunderRush/fxShaders';
import { FX_STRIDE } from './ultimate/thunderRush/vfx';

// PvP arena presentation of Chidori (see ultimate/thunderRush/arenaChidori.js):
// charge, cross the net, palm strike, flash-step home; the struck opponent
// falls with lightning running through them, lies stunned, then gets up.
// The server still owns damage, stun and turns; this is presentation only.

export const CHIDORI_SOUND_URL = '/sfx/chidori-arena.mp3';
export { ARENA_CHIDORI, attackerPush as chidoriAttackerPush, victimKnock as chidoriVictimKnock };

/**
 * Remember every bone's rest transform before any clip plays. The pose solver
 * measures limbs from the rest pose, whatever animation is running later.
 */
export function captureRestPose(root) {
  root?.traverse?.((node) => {
    if (!node.isBone || node.userData.__restPose) return;
    node.userData.__restPose = { p: node.position.toArray(), q: node.quaternion.toArray(), s: (node.scale.x + node.scale.y + node.scale.z) / 3 };
  });
}

function skeletonBones(model) {
  let best = null;
  model?.traverse?.((node) => {
    if (node.isSkinnedMesh && node.skeleton && (!best || node.skeleton.bones.length > best.skeleton.bones.length)) best = node;
  });
  return best?.skeleton?.bones || null;
}

const tmpQ = new THREE.Quaternion();
const tmpV = new THREE.Vector3();

// A posable view of an arena fighter: its skeleton as a HumanoidRig whose actor
// space is the fighter's ground position and facing (+Z toward the opponent).
function makeActor(fighter) {
  const model = fighter?.model || fighter?.root;
  const bones = skeletonBones(model);
  if (!bones?.length) return null;
  fighter.root.updateMatrixWorld(true);
  const rootPos = fighter.root.getWorldPosition(new THREE.Vector3());
  const frame = new THREE.Matrix4().compose(new THREE.Vector3(rootPos.x, 0, rootPos.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), fighter.root.rotation.y), new THREE.Vector3(1, 1, 1));
  const inverse = frame.clone().invert();
  const joints = bones.map((bone) => {
    const rest = bone.userData.__restPose;
    return {
      name: bone.name,
      parent: bones.indexOf(bone.parent),
      position: rest ? [...rest.p] : bone.position.toArray(),
      quaternion: rest ? [...rest.q] : bone.quaternion.toArray(),
      scale: rest ? rest.s : 1,
    };
  });
  const rootParents = new Map();
  joints.forEach((joint, index) => {
    if (joint.parent >= 0) return;
    const parent = bones[index].parent;
    const matrix = parent ? inverse.clone().multiply(parent.matrixWorld) : inverse.clone();
    rootParents.set(index, matrix.toArray());
  });
  try {
    const rig = new HumanoidRig(joints, rootParents);
    return { fighter, bones, rig, restPositions: joints.map((joint) => new THREE.Vector3().fromArray(joint.position)), materials: null, posed: false, released: false };
  } catch (error) {
    console.warn('[PvP] Chidori rig unavailable', error);
    return null;
  }
}

function placeOf(fighter) {
  const p = fighter.root.getWorldPosition(tmpV);
  return { x: p.x, z: p.z, yaw: fighter.root.rotation.y };
}

function applyPose(actor, weight) {
  const { bones, rig, restPositions } = actor;
  for (let i = 0; i < bones.length; i += 1) {
    const bone = bones[i];
    const r = rig.localRot[i];
    tmpQ.set(r[0], r[1], r[2], r[3]);
    if (weight >= 1) bone.quaternion.copy(tmpQ); else bone.quaternion.slerp(tmpQ, weight);
    const target = rig.role[i] === 'hips' ? tmpV.fromArray(rig.localPos[i]) : restPositions[i];
    if (weight >= 1) bone.position.copy(target); else bone.position.lerp(target, weight);
  }
}

// Fade a fighter out and back in (the flash step). Materials are restored after.
function setOpacity(actor, opacity) {
  if (!actor.materials) {
    actor.materials = [];
    actor.fighter.root.traverse((node) => {
      if (!node.isMesh) return;
      (Array.isArray(node.material) ? node.material : [node.material]).filter(Boolean).forEach((material) => {
        actor.materials.push({ material, transparent: material.transparent, opacity: material.opacity, depthWrite: material.depthWrite, node, castShadow: node.castShadow });
      });
    });
  }
  const faded = opacity < 0.999;
  for (const entry of actor.materials) {
    if (entry.material.transparent !== (faded || entry.transparent)) {
      entry.material.transparent = faded || entry.transparent;
      entry.material.needsUpdate = true;
    }
    entry.material.opacity = entry.opacity * opacity;
    entry.material.depthWrite = faded ? opacity > 0.5 && entry.depthWrite : entry.depthWrite;
    entry.node.castShadow = opacity > 0.5 && entry.castShadow;
  }
}

function restoreOpacity(actor) {
  if (!actor?.materials) return;
  for (const entry of actor.materials) {
    entry.material.transparent = entry.transparent;
    entry.material.opacity = entry.opacity;
    entry.material.depthWrite = entry.depthWrite;
    entry.material.needsUpdate = true;
    entry.node.castShadow = entry.castShadow;
  }
  actor.materials = null;
}

function fxLayer(scene, capacity, blendDst, order) {
  const buffer = new THREE.InterleavedBuffer(new Float32Array(capacity * FX_STRIDE), FX_STRIDE);
  buffer.setUsage(THREE.DynamicDrawUsage);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.InterleavedBufferAttribute(buffer, 3, 0));
  geometry.setAttribute('uv', new THREE.InterleavedBufferAttribute(buffer, 2, 3));
  geometry.setAttribute('color', new THREE.InterleavedBufferAttribute(buffer, 4, 5));
  geometry.setAttribute('shape', new THREE.InterleavedBufferAttribute(buffer, 1, 9));
  geometry.setDrawRange(0, 0);
  const material = new THREE.RawShaderMaterial({
    vertexShader: fxVertex,
    fragmentShader: fxFragment,
    glslVersion: THREE.GLSL3,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = order;
  mesh.name = 'chidori-fx';
  scene.add(mesh);
  return { buffer, geometry, mesh, capacity };
}

function uploadLayer(layer, source) {
  const count = Math.min(source.count, layer.capacity);
  layer.buffer.array.set(source.data.subarray(0, count * FX_STRIDE));
  layer.buffer.clearUpdateRanges?.();
  layer.buffer.addUpdateRange?.(0, count * FX_STRIDE);
  layer.buffer.needsUpdate = true;
  layer.geometry.setDrawRange(0, count);
}

/**
 * Same surface as the previous Chidori caster:
 *   start({ attacker, victim?, startedAt? }) · strike(hit) · spareVictim()
 *   offset(fighter, now, gap) → { push, lift, handled }
 *   update(now, camera) → screen hints { flash, invert, shake, exposure } or null
 */
export function createChidoriArenaPresenter(scene, { sound = true } = {}) {
  const alpha = fxLayer(scene, 20000, THREE.OneMinusSrcAlphaFactor, 20);
  const additive = fxLayer(scene, 90000, THREE.OneFactor, 21);
  let cast = null;
  let serial = 0;

  const clear = () => {
    uploadLayer(alpha, { count: 0, data: alpha.buffer.array });
    uploadLayer(additive, { count: 0, data: additive.buffer.array });
  };

  // Hand the skeleton back to the fighter's own animation (idle).
  const release = (actor) => {
    if (!actor || actor.released) return;
    actor.released = true;
    restoreOpacity(actor);
    if (actor.posed) actor.fighter.runtime?.playIdle?.();
  };

  const stop = () => {
    if (!cast) return;
    release(cast.attacker);
    release(cast.victim);
    cast.audio?.pause?.();
    cast = null;
    clear();
  };

  return {
    start({ attacker, victim = null, startedAt = performance.now() } = {}) {
      stop();
      const a = attacker ? makeActor(attacker) : null;
      if (!a) return false;
      const v = victim ? makeActor(victim) : null;
      serial += 1;
      cast = {
        startedAt,
        attacker: a,
        victim: v,
        victimFighter: victim,
        presenter: new ArenaChidori({ attacker: a.rig, victim: v?.rig || null, seed: serial }),
        audio: null,
      };
      if (sound && typeof window !== 'undefined' && window.Audio) {
        try {
          const audio = new window.Audio(CHIDORI_SOUND_URL);
          audio.volume = 0.7;
          audio.play().catch(() => {});
          cast.audio = audio;
        } catch { /* sound is optional */ }
      }
      return true;
    },
    // Called at impact with the server's (or the dodge window's) verdict.
    strike(hit = true) {
      if (!cast) return;
      cast.presenter.setStruck(Boolean(hit && cast.victim));
    },
    spareVictim() { this.strike(false); },
    active() { return Boolean(cast); },
    elapsed(now = performance.now()) { return cast ? (now - cast.startedAt) / 1000 : -1; },
    // True while the move is driving this fighter's skeleton (no walking then).
    controls(fighter) {
      if (!cast || !fighter) return false;
      const owned = (actor) => Boolean(actor && actor.fighter === fighter && !actor.released && (actor.posed || actor === cast.attacker));
      return owned(cast.attacker) || owned(cast.victim);
    },
    isAttacker(fighter) { return Boolean(cast && cast.attacker.fighter === fighter); },
    isVictim(fighter) { return Boolean(cast && cast.victimFighter === fighter); },
    update(now, camera) {
      if (!cast || !camera) return null;
      const ta = (now - cast.startedAt) / 1000;
      if (ta < -0.5 || ta > ARENA_CHIDORI_END) { stop(); return null; }
      const attackerFighter = cast.attacker.fighter;
      const victimFighter = cast.victimFighter;
      if (!attackerFighter?.root) { stop(); return null; }
      const attackerPlace = placeOf(attackerFighter);
      const victimPlace = victimFighter?.root ? placeOf(victimFighter) : { ...attackerPlace, z: attackerPlace.z + 5 };
      let victimTorso = null;
      if (cast.victim) {
        const chest = cast.victim.rig.map.chest;
        if (chest >= 0) victimTorso = cast.victim.bones[chest].getWorldPosition(new THREE.Vector3()).toArray();
      }
      const state = cast.presenter.update(ta, {
        camera: { position: camera.position.toArray(), target: camera.getWorldDirection(new THREE.Vector3()).add(camera.position).toArray(), fov: camera.fov },
        attackerPlace,
        victimPlace,
        victimTorso,
      });
      const a = cast.attacker;
      if (!a.released) {
        if (state.attacker.weight > 0) { applyPose(a, state.attacker.weight); a.posed = true; setOpacity(a, state.attacker.opacity); }
        else if (a.posed) release(a);
      }
      const v = cast.victim;
      if (v && !v.released) {
        if (state.victim.weight > 0) { applyPose(v, state.victim.weight); v.posed = true; }
        else if (v.posed) release(v);
      }
      uploadLayer(alpha, state.fx.alpha);
      uploadLayer(additive, state.fx.additive);
      if (state.done) { stop(); return null; }
      return state.hints;
    },
    stop,
    dispose() {
      stop();
      for (const layer of [alpha, additive]) {
        layer.mesh.removeFromParent();
        layer.geometry.dispose();
        layer.mesh.material.dispose();
      }
    },
  };
}
