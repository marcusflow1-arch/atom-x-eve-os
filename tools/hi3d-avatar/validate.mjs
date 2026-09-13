import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createEmbeddedAvatarController } from '../../src/components/onboarding/embeddedAvatarController.js';
import { readGLB } from './glb.mjs';

globalThis.self = globalThis;
const path = process.argv[2] || 'public/models/luna-hi3d/warrior.glb';
const source = readGLB(path), bytes = fs.readFileSync(path);
const loader = new GLTFLoader();
loader.register(() => ({ name: 'OFFLINE_TEXTURES', loadTexture: () => Promise.resolve(new THREE.Texture()) }));
const asset = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
const model = asset.scene; let mesh;
model.traverse(node => { if (node.isSkinnedMesh) mesh = node; });
assert(mesh, 'GLTFLoader must create a SkinnedMesh');
assert.equal(mesh.skeleton.bones.length, 23);
assert.equal(asset.animations.length, 11);
assert(mesh.geometry.index.count <= 300000, 'Web triangle budget');
const { skinWeight, skinIndex, position } = mesh.geometry.attributes;
let maxWeightError = 0, maxBindError = 0;
model.updateMatrixWorld(true); mesh.skeleton.update();
for (let i = 0; i < position.count; i++) {
  let total = 0;
  for (let c = 0; c < 4; c++) { const w = skinWeight.getComponent(i, c); assert(Number.isFinite(w) && w >= 0); total += w; assert(skinIndex.getComponent(i, c) < 23); }
  maxWeightError = Math.max(maxWeightError, Math.abs(total - 1));
  const original = new THREE.Vector3().fromBufferAttribute(position, i);
  maxBindError = Math.max(maxBindError, mesh.getVertexPosition(i, new THREE.Vector3()).distanceTo(original));
}
assert(maxWeightError < 1e-6); assert(maxBindError < 1e-6);
for (const clip of asset.animations) {
  assert(clip.validate(), `${clip.name} track data must be valid`);
  for (const track of clip.tracks) for (const value of track.values) assert(Number.isFinite(value));
}

const mixer = new THREE.AnimationMixer(model);
const controller = createEmbeddedAvatarController(model, asset.animations, mixer);
function advance(seconds) { for (let t = 0; t < seconds; t += 1 / 60) mixer.update(1 / 60); model.updateMatrixWorld(true); mesh.skeleton.update(); }
controller.command('wave'); advance(3.5); assert.equal(controller.snapshot().clip, 'Idle');
controller.command('lean'); assert.equal(controller.snapshot().clip, 'Sit_Down'); assert(!controller.canMove());
advance(2.8); assert.equal(controller.snapshot().clip, 'Lean_Back');
advance(2.5); assert.equal(controller.snapshot().clip, 'Lean_Back_Idle');
assert.equal(controller.snapshot().posture, 'reclined');
for (const side of ['Left', 'Right']) {
  const wrist = model.getObjectByName(`${side}Hand`).getWorldPosition(new THREE.Vector3());
  assert(Math.abs(wrist.y - .057) < .008, `${side} support wrist must reach its floor target`);
}
assert.equal(controller.setArmLift(.5), false, 'Manual arm is disabled while seated');
controller.command('walk'); assert.equal(controller.snapshot().clip, 'Sit_Forward'); assert(!controller.canMove());
advance(2.4); assert.equal(controller.snapshot().clip, 'Stand_Up'); assert(!controller.canMove());
advance(2.9); assert.equal(controller.snapshot().clip, 'Walk'); assert(controller.canMove());
controller.command('sit'); advance(.6); controller.command('walk'); assert.equal(controller.snapshot().clip, 'Sit_Down');
advance(2.2); assert.equal(controller.snapshot().clip, 'Stand_Up'); advance(2.9); assert(controller.canMove());
controller.command('idle'); advance(.5);
const hand = model.getObjectByName('RightHand'); const initialHand = hand.getWorldPosition(new THREE.Vector3());
assert(controller.setArmLift(1)); advance(.4);
assert(hand.getWorldPosition(new THREE.Vector3()).y > initialHand.y + .4, 'Arm slider must move the actual skeleton');
controller.setArmLift(0); advance(.4); assert(hand.getWorldPosition(new THREE.Vector3()).distanceTo(initialHand) < .04);
controller.command('afk'); advance(.8); assert.equal(controller.snapshot().clip, 'AFK');
controller.dispose(); mixer.stopAllAction();

// Sample every animation for finite skinning, floor contact, and isolated outliers.
const poseChecks = [];
for (const clip of asset.animations) {
  const action = mixer.clipAction(clip); action.reset().setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.play();
  for (const fraction of [0, .25, .5, .75, 1]) {
    mixer.setTime(clip.duration * fraction); model.updateMatrixWorld(true); mesh.skeleton.update();
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < position.count; i++) {
      const v = mesh.getVertexPosition(i, new THREE.Vector3());
      assert(v.toArray().every(Number.isFinite), `${clip.name}: invalid posed vertex`);
      assert(Math.abs(v.x) < 2 && Math.abs(v.z) < 2, `${clip.name}: skinning outlier`);
      minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
    }
    poseChecks.push({ clip: clip.name, time: +(clip.duration * fraction).toFixed(3), minY: +minY.toFixed(4), maxY: +maxY.toFixed(4) });
    assert(minY > -.035, `${clip.name}: geometry penetrates the floor`);
  }
  action.stop();
}
const result = { passed: true, triangles: mesh.geometry.index.count / 3, vertices: position.count, joints: 23, clips: 11, maxWeightError, maxBindError, transitionChecks: 'wave return, recline chain, stand before walking, queued interruption, arm slider', poseChecks };
fs.writeFileSync(process.argv[3] || 'public/models/luna-hi3d/validation.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ...result, poseChecks: `${poseChecks.length} poses sampled` }));
