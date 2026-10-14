import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { readGlb, readAccessor } from '../tools/avatar-motion/glb-io.mjs';
import { CreatorLocomotion, clipExtras } from '../src/components/onboarding/creatorLocomotion.js';

const BODIES = [
  ['male', 'Getsuga_Tensho_Character', null],
  // Artemis' right upper arm is re-skinned in place (tools/avatar-motion/locomotion.mjs, reskinUpperArm)
  ['female', 'Artemis_Character', 'Artemis_Body'],
];
const path = (name, v) => `public/models/characters/${name}_v${v}.glb`;
const DEG = 180 / Math.PI;

async function load(file) {
  globalThis.self = globalThis;
  const loader = new GLTFLoader();
  loader.register(() => ({ name: 'NO_IMAGE_DECODE', loadTexture: () => Promise.resolve(new THREE.Texture()) }));
  const bytes = fs.readFileSync(file);
  return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
}

for (const [body, name, reskinned] of BODIES) {
  test(`${body}: v4 is v3 plus the Walk, Run and Stand clips${reskinned ? ' and the right-arm skin fix' : ''}, nothing else changed`, () => {
    const v3 = readGlb(path(name, 3)), v4 = readGlb(path(name, 4));
    const a = v3.bin, b = Buffer.from(v4.bin.subarray(0, v3.bin.length));
    if (reskinned) {
      // the only bytes allowed to differ: the body's own joint / weight data
      const prim = v3.json.meshes.find((m) => m.name === reskinned).primitives[0];
      for (const attr of ['JOINTS_0', 'WEIGHTS_0']) {
        const view = v3.json.bufferViews[v3.json.accessors[prim.attributes[attr]].bufferView];
        b.set(a.subarray(view.byteOffset, view.byteOffset + view.byteLength), view.byteOffset);
      }
    }
    assert.ok(a.equals(b), 'every other v3 byte is kept in place');
    for (const key of Object.keys(v3.json)) {
      if (['accessors', 'bufferViews', 'animations', 'buffers'].includes(key)) continue;
      assert.deepEqual(v4.json[key], v3.json[key], key);
    }
    assert.deepEqual(v4.json.accessors.slice(0, v3.json.accessors.length), v3.json.accessors);
    assert.deepEqual(v4.json.bufferViews.slice(0, v3.json.bufferViews.length), v3.json.bufferViews);
    assert.deepEqual(v4.json.animations.slice(0, v3.json.animations.length), v3.json.animations);
    assert.deepEqual(v4.json.animations.slice(v3.json.animations.length).map((a) => a.name), ['Walk', 'Run', 'Stand']);
  });

  if (reskinned) test(`${body}: the skin fix only moves right-upper-arm vertices onto the upper arm, weights stay normalized`, () => {
    const v3 = readGlb(path(name, 3)), v4 = readGlb(path(name, 4));
    const prim = v4.json.meshes.find((m) => m.name === reskinned).primitives[0], mi = v4.json.meshes.findIndex((m) => m.name === reskinned);
    const names = v4.json.skins[v4.json.nodes.find((n) => n.mesh === mi).skin].joints.map((j) => v4.json.nodes[j].name);
    const pos = readAccessor(v4, prim.attributes.POSITION), j3 = readAccessor(v3, prim.attributes.JOINTS_0), w3 = readAccessor(v3, prim.attributes.WEIGHTS_0);
    const j4 = readAccessor(v4, prim.attributes.JOINTS_0), w4 = readAccessor(v4, prim.attributes.WEIGHTS_0);
    const wOf = (j, w, i, n) => j[i].reduce((s, x, k) => s + (names[x] === n ? w[i][k] : 0), 0);
    let changed = 0;
    for (let i = 0; i < pos.length; i++) {
      assert.ok(Math.abs(w4[i].reduce((s, x) => s + x, 0) - 1) < 1e-5, 'normalized');
      if (j3[i].every((x, k) => x === j4[i][k]) && w3[i].every((x, k) => Math.abs(x - w4[i][k]) < 1e-7)) continue;
      changed++;
      assert.ok(pos[i][0] < -0.06 && pos[i][1] > 1.0 && pos[i][1] < 1.45, `vertex ${i} outside the right upper arm`);
      assert.ok(wOf(j4, w4, i, 'upperarm_r') > wOf(j3, w3, i, 'upperarm_r'), 'only gains upper-arm weight');
    }
    assert.ok(changed > 200 && changed < 800, `${changed} vertices re-skinned`);
  });

  test(`${body}: arms stay natural: elbows never fold past a running bend, arms hang close to the body when standing`, async (t) => {
    const gltf = await load(path(name, 4)), root = gltf.scene, mixer = new THREE.AnimationMixer(root);
    const P = (n) => root.getObjectByName(n).getWorldPosition(new THREE.Vector3());
    for (const [clipName, maxBend, maxOut] of [['Stand', 25, 16], ['Walk', 35, 20], ['Run', 95, 24]]) {
      const clip = gltf.animations.find((c) => c.name === clipName), action = mixer.clipAction(clip).play();
      let bendMax = 0, outMax = 0;
      for (let k = 0; k < 24; k++) {
        action.time = (k / 24) * clip.duration; mixer.update(0); root.updateMatrixWorld(true);
        for (const s of ['l', 'r']) {
          const u = P('lowerarm_' + s).sub(P('upperarm_' + s)).normalize(), f = P('hand_' + s).sub(P('lowerarm_' + s)).normalize();
          bendMax = Math.max(bendMax, Math.acos(Math.min(1, u.dot(f))) * DEG);
          outMax = Math.max(outMax, Math.atan2(Math.abs(u.x), -u.y) * DEG);
        }
      }
      action.stop();
      t.diagnostic(`${clipName}: largest elbow bend ${bendMax.toFixed(0)} deg, arm out from vertical up to ${outMax.toFixed(0)} deg`);
      assert.ok(bendMax < maxBend, `${clipName} elbow bends ${bendMax.toFixed(0)} deg`);
      assert.ok(outMax < maxOut, `${clipName} arm held ${outMax.toFixed(0)} deg out`);
    }
  });

  test(`${body}: Stand keeps both feet planted, barely moves and loops seamlessly`, async (t) => {
    const gltf = await load(path(name, 4)), root = gltf.scene, mixer = new THREE.AnimationMixer(root), extras = clipExtras(gltf);
    const clip = gltf.animations.find((c) => c.name === 'Stand'), info = extras.get('Stand');
    assert.ok(info.idle && info.loop && info.speed === 0, 'Stand extras');
    const action = mixer.clipAction(clip).play(), feet = ['foot_l', 'foot_r', 'ball_l', 'ball_r'].map((n) => root.getObjectByName(n));
    const first = [], drift = [0, 0, 0, 0], bones = ['spine_02', 'head', 'upperarm_l', 'upperarm_r', 'pelvis'].map((n) => root.getObjectByName(n));
    let prev = null, fastest = 0;
    for (let k = 0; k <= 160; k++) {
      action.time = (k / 160) * clip.duration; mixer.update(0); root.updateMatrixWorld(true);
      feet.forEach((f, i) => { const p = f.getWorldPosition(new THREE.Vector3()); if (!first[i]) first[i] = p; drift[i] = Math.max(drift[i], p.distanceTo(first[i])); });
      const q = bones.map((b) => b.quaternion.clone());
      if (prev) q.forEach((x, i) => { fastest = Math.max(fastest, x.angleTo(prev[i]) * DEG / (clip.duration / 160) / 30); });
      prev = q;
    }
    t.diagnostic(`Stand: feet drift ${(Math.max(...drift) * 1000).toFixed(2)} mm; body joints move at most ${fastest.toFixed(2)} deg per 30 fps frame`);
    assert.ok(Math.max(...drift) < 0.002, 'planted feet');
    assert.ok(fastest < 1.0, 'a calm idle: no joint moves more than a degree per frame');
  });

  test(`${body}: Walk and Run loop seamlessly and keep planted feet still at their authored speed`, async (t) => {
    const gltf = await load(path(name, 4)), extras = clipExtras(gltf);
    for (const clipName of ['Walk', 'Run']) {
      const clip = gltf.animations.find((c) => c.name === clipName), info = extras.get(clipName);
      assert.ok(info?.loop && info.inPlace && info.speed > 0.5 && info.cycleSeconds > 0.4, clipName + ' extras');
      assert.ok(Math.abs(clip.duration - info.cycles * info.cycleSeconds) < 1e-3, clipName + ' holds whole cycles');
      // seam: the last key equals the first on every rotation track
      for (const track of clip.tracks) {
        if (!track.name.endsWith('.quaternion')) continue;
        const n = track.values.length, a = new THREE.Quaternion().fromArray(track.values, 0), b = new THREE.Quaternion().fromArray(track.values, n - 4);
        assert.ok(a.angleTo(b) * DEG < 0.5, `${clipName} ${track.name} seam ${(a.angleTo(b) * DEG).toFixed(2)} deg`);
      }
      // planted feet: while a foot is flat on the ground its ankle moves back at exactly the authored speed
      const root = gltf.scene, mixer = new THREE.AnimationMixer(root), action = mixer.clipAction(clip).play();
      const flat = clipName === 'Walk' ? [0.2, 0.45] : [0.18, 0.36];
      for (const [side, start] of [['l', 0], ['r', 0.5]]) {
        const ankle = root.getObjectByName('foot_' + side), samples = [];
        const [stanceStart, stanceEnd] = info.footContacts[side === 'l' ? 'left' : 'right'];
        assert.equal(stanceStart, start);
        const duty = ((stanceEnd - stanceStart) % 1 + 1) % 1;
        for (let k = 0; k <= 12; k++) {
          const q = flat[0] + (flat[1] - flat[0]) * (k / 12), t = (start + q * duty + 1) * info.cycleSeconds;
          action.time = t; mixer.update(0); root.updateMatrixWorld(true);
          const p = ankle.getWorldPosition(new THREE.Vector3());
          samples.push(p.z + info.speed * t);
        }
        const drift = Math.max(...samples) - Math.min(...samples);
        assert.ok(drift < 0.01, `${clipName} ${side} foot drifts ${(drift * 100).toFixed(2)} cm while planted`);
        t.diagnostic(`${clipName} ${side}: planted drift ${(drift * 1000).toFixed(2)} mm at ${info.speed.toFixed(2)} m/s`);
      }
    }
  });

  test(`${body}: creator locomotion changes gait without pops and stops on a heel strike`, async (t) => {
    const gltf = await load(path(name, 4)), root = gltf.scene, mixer = new THREE.AnimationMixer(root);
    const idleClip = gltf.animations.find((c) => c.name === 'Stand'); // the creator stage's idle
    let idle = mixer.clipAction(idleClip).play();
    const loco = new CreatorLocomotion({ root, mixer, clips: gltf.animations, extras: clipExtras(gltf), onIdle: () => { idle = mixer.clipAction(idleClip); idle.reset().setEffectiveWeight(1).play(); } });
    assert.deepEqual(loco.names(), ['Walk', 'Run']);
    const watched = ['pelvis', 'spine_01', 'spine_02', 'neck_01', 'head', 'thigh_l', 'calf_l', 'foot_l', 'thigh_r', 'calf_r', 'foot_r', 'upperarm_l', 'lowerarm_l', 'upperarm_r', 'lowerarm_r'].map((n) => root.getObjectByName(n));
    const dt = 1 / 60;
    // compare rendered frame with rendered frame (a request between frames may touch bones that the next frame
    // overwrites before anything is drawn)
    let shown = watched.map((b) => b.quaternion.clone());
    const run = (seconds, onFrame) => {
      let worst = 0;
      for (let i = 0; i < Math.round(seconds / dt); i++) {
        loco.drive(dt); mixer.update(dt); loco.settle(dt);
        watched.forEach((b, k) => { worst = Math.max(worst, b.quaternion.angleTo(shown[k]) * DEG); });
        shown = watched.map((b) => b.quaternion.clone());
        onFrame?.();
      }
      return worst;
    };
    // the steady clips themselves set the bar: no transition may move a joint faster than the gaits already do
    run(1);
    loco.request('Run'); run(1.2); const steadyRun = run(1.5);
    loco.request('Idle'); run(2);
    assert.equal(loco.moving(), false);

    const worst = {};
    loco.request('Walk'); worst.idleToWalk = run(0.6); run(1.4);
    loco.request('Run'); worst.walkToRun = run(0.8); run(1);
    loco.request('Walk'); worst.runToWalk = run(0.8); run(1);
    let stopPhase = null; const phaseBefore = () => loco.phase;
    loco.request('Idle'); let last = phaseBefore();
    worst.walkToIdle = run(1.5, () => { if (stopPhase === null && !loco.moving()) stopPhase = last; last = loco.phase; });
    for (const [key, value] of Object.entries(worst)) assert.ok(value < steadyRun * 1.05, `${key}: ${value.toFixed(2)} deg/frame (steady run ${steadyRun.toFixed(2)})`);
    assert.ok(stopPhase !== null, 'the stop reached Idle');
    const frac = ((stopPhase % 0.5) + 0.5) % 0.5;
    assert.ok(frac > 0.45 || frac < 0.05, `stopped at cycle phase ${stopPhase.toFixed(3)}, not on a heel strike`);
    assert.ok(idle.isRunning() && idle.getEffectiveWeight() === 1, 'the body idle owns the mixer again');

    // without the inertial blend, the same hard switch from Idle to Walk pops
    mixer.stopAllAction();
    const hard = new THREE.AnimationMixer(root), still = hard.clipAction(idleClip).play();
    hard.update(dt);
    const before = watched.map((b) => b.quaternion.clone());
    still.stop(); hard.clipAction(gltf.animations.find((c) => c.name === 'Walk')).play(); hard.update(dt);
    const hardPop = Math.max(...watched.map((b, k) => b.quaternion.angleTo(before[k]) * DEG));
    assert.ok(hardPop > worst.idleToWalk * 2, `a hard switch pops ${hardPop.toFixed(1)} deg, the blend ${worst.idleToWalk.toFixed(2)} deg`);
    t.diagnostic(`largest joint move per 60 fps frame: steady run ${steadyRun.toFixed(1)} deg; ` + Object.entries(worst).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(', ') + `; hard switch ${hardPop.toFixed(1)}; stopped at phase ${stopPhase.toFixed(3)}`);
  });
}
