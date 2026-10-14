import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CreatorFace, REACTIONS } from '../src/components/onboarding/creatorFace.js';

// The creator stage's living face (src/components/onboarding/creatorFace.js) on both v5 bodies, playing the creator's
// Stand clip the way genesisScene's frame loop does: restore() before the mixer, update() after it.
const BODIES = [['male', 'Getsuga_Tensho_Character_v5'], ['female', 'Artemis_Character_v5']];
const DEG = 180 / Math.PI;

async function load(file) {
  globalThis.self = globalThis;
  const loader = new GLTFLoader();
  loader.register(() => ({ name: 'NO_IMAGE_DECODE', loadTexture: () => Promise.resolve(new THREE.Texture()) }));
  const bytes = fs.readFileSync(`public/models/characters/${file}.glb`);
  return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
}

async function stage(file) {
  const gltf = await load(file), root = gltf.scene, mixer = new THREE.AnimationMixer(root);
  mixer.clipAction(gltf.animations.find((c) => c.name === 'Stand')).play();
  mixer.update(0.5);
  root.updateMatrixWorld(true);
  const camera = new THREE.PerspectiveCamera();
  const face = CreatorFace.attach(root, { camera });
  // the face's own directions in this pose (what the layer calibrates from), and each eye's gaze axis in eye space
  const [l, r] = face.eyes.map((e) => e.getWorldPosition(new THREE.Vector3()));
  const mid = l.clone().add(r).multiplyScalar(0.5), lateral = l.clone().sub(r).setY(0).normalize(), forward = new THREE.Vector3().crossVectors(lateral, new THREE.Vector3(0, 1, 0));
  const headAxis = forward.clone().applyQuaternion(face.head.getWorldQuaternion(new THREE.Quaternion()).invert());
  const irises = ['EYE_Iris_L', 'EYE_Iris_R'].map((name) => root.getObjectByName(name));
  // a camera `yaw` degrees around the face, a little above the eyes
  const place = (yaw, distance = 2.5) => camera.position.copy(mid).add(forward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw / DEG).multiplyScalar(distance)).add(new THREE.Vector3(0, 0.15, 0));
  const frames = (n, opts = {}, dt = 1 / 60) => { for (let i = 0; i < n; i++) { face.restore(); mixer.update(dt); face.update(dt, opts); } root.updateMatrixWorld(true); };
  const toCamera = (node, axis) => {
    const at = node.getWorldPosition(new THREE.Vector3()), gaze = axis.clone().applyQuaternion(node.getWorldQuaternion(new THREE.Quaternion()));
    return gaze.angleTo(camera.position.clone().sub(at)) * DEG;
  };
  // where each eye looks as rendered: from the eyeball's centre (its bone) through the centre of the skinned iris
  const eyeError = () => Math.max(...irises.map((mesh, i) => {
    const centre = new THREE.Vector3(), v = new THREE.Vector3(), count = mesh.geometry.getAttribute('position').count;
    for (let k = 0; k < count; k++) centre.add(mesh.getVertexPosition(k, v).applyMatrix4(mesh.matrixWorld));
    centre.multiplyScalar(1 / count);
    const pivot = face.eyes[i].getWorldPosition(new THREE.Vector3());
    return centre.clone().sub(pivot).angleTo(camera.position.clone().sub(pivot)) * DEG;
  }));
  const headError = () => toCamera(face.head, headAxis);
  const offset = () => Math.max(0, ...[...face.shownBones.values()].map((o) => o.raw.angleTo(o.shown) * DEG));
  return { gltf, root, mixer, camera, face, place, frames, headError, eyeError, offset };
}

for (const [body, file] of BODIES) {
  test(`${body}: keeps eye contact as the camera orbits (eyes on target, the head most of the way)`, async (t) => {
    const s = await stage(file);
    assert.ok(s.face, 'the body has a head and eye bones');
    for (const yaw of [35, -45, 20]) {
      s.place(yaw);
      const before = s.headError();
      s.frames(120);
      const head = s.headError(), eyes = s.eyeError();
      t.diagnostic(`camera ${yaw} deg: head ${before.toFixed(1)} -> ${head.toFixed(1)} deg off, eyes ${eyes.toFixed(1)} deg off`);
      assert.ok(before > Math.abs(yaw) * 0.6, 'the clip alone looks away');
      assert.ok(head < Math.abs(yaw) * 0.35 + 3, `head turns most of the way toward the camera (${head.toFixed(1)} deg off)`);
      assert.ok(eyes < 4, `eyes meet the camera (${eyes.toFixed(1)} deg off)`);
    }
  });

  test(`${body}: lets go when the camera goes behind it or while it runs`, async () => {
    const s = await stage(file);
    s.place(30); s.frames(90);
    assert.ok(s.offset() > 10, 'looking while in front');
    s.place(165); s.frames(150);
    assert.ok(s.offset() < 1, `back to the clip's pose with the camera behind (${s.offset().toFixed(2)} deg left)`);
    s.place(30); s.frames(150, { speed: 3.2 });
    assert.ok(s.offset() < 1.5, `no looking while running (${s.offset().toFixed(2)} deg)`);
    s.frames(150, { speed: 0, busy: true });
    assert.ok(s.offset() < 1.5, 'no looking while a skill owns the body');
  });

  test(`${body}: never accumulates on bones or morphs the clip leaves untouched`, async () => {
    const s = await stage(file);
    s.mixer.timeScale = 0; // a paused clip writes nothing, frame after frame
    const nodes = [s.face.head, s.face.head.parent, ...s.face.eyes], start = nodes.map((n) => n.quaternion.clone());
    const smile = s.face.face.morphTargetDictionary.Smile_Left, startSmile = s.face.face.morphTargetInfluences[smile];
    s.place(40); s.face.react('pleased'); s.frames(300);
    assert.ok(s.offset() < 60, `the look stays within its limits (${s.offset().toFixed(1)} deg)`);
    s.face.restore();
    nodes.forEach((n, i) => assert.ok(n.quaternion.equals(start[i]), n.name + ' back to the clip value exactly'));
    assert.equal(s.face.face.morphTargetInfluences[smile], startSmile, 'smile back to the clip value');
  });

  test(`${body}: reacts with a short expression, then hands the face back to the clip`, async () => {
    const s = await stage(file);
    s.place(0);
    const morphs = s.face.face.morphTargetInfluences, dict = s.face.face.morphTargetDictionary;
    assert.equal(s.face.react(), 'pleased');
    s.frames(40);
    const raw = s.face.shownMorphs.get(dict.Smile_Left).raw;
    assert.ok(morphs[dict.Smile_Left] > raw + REACTIONS.pleased.morphs.Smile_Left * 0.9, 'smiling');
    assert.equal(s.face.react(), 'pleased', 'a change during the smile holds it');
    s.frames(200);
    assert.equal(s.face.reaction, null);
    assert.equal(s.face.shownMorphs.size, 0, 'no expression left on the face');
    assert.equal(s.face.react(), 'curious', 'the next change brings the next expression');
    s.frames(40);
    assert.ok(morphs[dict.Brow_Inner_Up] > s.face.shownMorphs.get(dict.Brow_Inner_Up).raw + 0.3, 'brows up');
  });
}
