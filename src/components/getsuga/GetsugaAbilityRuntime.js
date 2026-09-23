import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

// Exact character/animation runtime from the uploaded Getsuga Tensho package.
// The packaged GLB is stored as gzip+base64 public chunks so Base44 can serve it
// without altering the binary rig. Skill Slot 1 uses its embedded GetsugaTensho
// clip and this same character remains on-screen in a generated idle between casts.
const FPS = 24;
const RELEASE_FRAME = 84;
const DURATION = 7;
const IMPACT_TIME = 5.02;
const RELEASE_TIME = (RELEASE_FRAME - 1) / FPS;
const MODEL_PARTS = [
  '/getsuga/runtime/part-00.txt',
  '/getsuga/runtime/part-01.txt',
  '/getsuga/runtime/part-02.txt',
  '/getsuga/runtime/part-03.txt',
  '/getsuga/runtime/part-04.txt',
  '/getsuga/runtime/part-05.txt',
  '/getsuga/runtime/part-06.txt',
  '/getsuga/runtime/tail/tail-00.txt',
];
let packagedModelBytesPromise = null;

async function packagedModelBytes() {
  if (!packagedModelBytesPromise) {
    packagedModelBytesPromise = (async () => {
      const encoded = (await Promise.all(MODEL_PARTS.map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Getsuga model segment failed: ${url}`);
        return response.text();
      }))).join('').replace(/\s+/g, '');
      const compressed = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
      if (typeof DecompressionStream === 'undefined') {
        throw new Error('This browser does not support the Getsuga model decompressor.');
      }
      return new Response(
        new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip')),
      ).arrayBuffer();
    })();
  }
  return packagedModelBytesPromise;
}

async function loadPackagedCharacter() {
  const bytes = await packagedModelBytes();
  return new GLTFLoader().parseAsync(bytes, '');
}

function createIdleClip(attackClip) {
  const duration = 2.8;
  const times = [0, duration * .5, duration];
  const tracks = attackClip.tracks.map((source) => {
    const interpolant = source.createInterpolant();
    const base = Array.from(interpolant.evaluate(0));
    const middle = [...base];
    const name = String(source.name || '').toLowerCase();

    if (source instanceof THREE.VectorKeyframeTrack && /pelvis.*position/.test(name) && middle.length >= 3) {
      middle[1] += .008;
    }
    if (source instanceof THREE.QuaternionKeyframeTrack && /(spine_01|spine_02|neck_01).*quaternion/.test(name) && middle.length >= 4) {
      const q = new THREE.Quaternion(...middle);
      const amount = name.includes('neck_01') ? .006 : .012;
      q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(amount, 0, 0)));
      middle.splice(0, 4, q.x, q.y, q.z, q.w);
    }

    const values = [...base, ...middle, ...base];
    return new source.constructor(source.name, times, values);
  });
  return new THREE.AnimationClip('GetsugaIdle', duration, tracks);
}

const FX_CURVES = {
  bladeGlow: [[1, 0], [12, 0], [26, 1], [128, 1], [158, 0]],
  energyBlade: [[1, 0], [20, 0], [24, .45], [30, .6], [44, 1], [84, 1], [86, .4], [100, .55], [128, .5], [148, 0]],
  aura: [[1, 0], [20, 0], [26, .75], [34, .5], [50, .8], [66, 1], [84, 1], [92, .6], [118, .35], [142, 0]],
  groundCrack: [[1, 0], [26, 0], [44, .5], [76, 1], [100, 1], [168, .35]],
  flash: [[1, 0], [83, 0], [84, 1], [87, .35], [95, 0]],
};

const EVENTS = [
  { frame: 21, name: 'ignite' },
  { frame: 26, name: 'auraFlare' },
  { frame: 40, name: 'lift' },
  { frame: 60, name: 'overhead' },
  { frame: 80, name: 'strike' },
  { frame: RELEASE_FRAME, name: 'release' },
];

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

function curve(keys, frame, linear = false) {
  if (frame <= keys[0][0]) return keys[0][1];
  for (let index = 0; index < keys.length - 1; index += 1) {
    const [f0, v0] = keys[index];
    const [f1, v1] = keys[index + 1];
    if (frame <= f1) {
      let u = (frame - f0) / Math.max(.0001, f1 - f0);
      if (!linear) u = smooth(u);
      return v0 + (v1 - v0) * u;
    }
  }
  return keys[keys.length - 1][1];
}

function seeded(seed = 1) {
  let value = seed >>> 0;
  return () => {
    value |= 0;
    value = (value + 0x6D2B79F5) | 0;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function canonical(value = '') {
  return String(value)
    .replace(/^mixamorig[:_]?/i, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

function findBone(root, names) {
  const wanted = names.map(canonical);
  let result = null;
  root?.traverse((node) => {
    if (result || !node.isBone) return;
    const key = canonical(node.name);
    if (wanted.some((entry) => key === entry || key.endsWith(entry))) result = node;
  });
  return result;
}

function crescentGeometry(outer = 1.28, thickness = .34, start = -1.02, end = 1.02, segments = 48) {
  const shape = new THREE.Shape();
  for (let index = 0; index <= segments; index += 1) {
    const u = index / segments;
    const angle = start + (end - start) * u;
    const x = Math.sin(angle) * outer;
    const y = Math.cos(angle) * outer;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  for (let index = segments; index >= 0; index -= 1) {
    const u = index / segments;
    const angle = start + (end - start) * u;
    const inner = outer - thickness * (1 - .18 * Math.cos(angle * 2));
    shape.lineTo(Math.sin(angle) * inner, Math.cos(angle) * inner);
  }
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape, 12);
  geometry.center();
  return geometry;
}

function makeLineCracks() {
  const random = seeded(73);
  const vertices = [];
  for (let branch = 0; branch < 22; branch += 1) {
    const angle = random() * Math.PI * 2;
    const length = .42 + random() * 1.8;
    let x = 0;
    let z = 0;
    const steps = 3 + Math.floor(random() * 4);
    for (let step = 0; step < steps; step += 1) {
      const nextX = Math.cos(angle + (random() - .5) * .38) * length * ((step + 1) / steps);
      const nextZ = Math.sin(angle + (random() - .5) * .38) * length * ((step + 1) / steps);
      vertices.push(x, .014, z, nextX, .014, nextZ);
      x = nextX;
      z = nextZ;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return geometry;
}

function setCylinderBetween(mesh, start, end) {
  const midpoint = start.clone().add(end).multiplyScalar(.5);
  const direction = end.clone().sub(start);
  const length = Math.max(.001, direction.length());
  mesh.position.copy(midpoint);
  mesh.scale.set(1, length, 1);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
}

function disposableMaterial(material, target) {
  target.push(material);
  return material;
}

export class GetsugaAbilityRuntime {
  constructor({ scene, camera = null, getPlayer, onEvent = null, impactDistance = 7.2 } = {}) {
    this.scene = scene;
    this.camera = camera;
    this.getPlayer = getPlayer;
    this.onEvent = onEvent || (() => {});
    this.impactDistance = impactDistance;
    this.active = false;
    this.time = 0;
    this.lastFrame = -1;
    this.original = null;
    this.proxy = null;
    this.localFx = null;
    this.worldFx = null;
    this.released = false;
    this.impacted = false;
    this.disposed = false;
    this.materials = [];
    this.geometries = [];
    this.tmp = new THREE.Vector3();
    this.tmp2 = new THREE.Vector3();
    this.tmpQ = new THREE.Quaternion();
    this.origin = new THREE.Vector3();
    this.originQ = new THREE.Quaternion();
    this.forward = new THREE.Vector3(0, 0, 1);
    this.up = new THREE.Vector3(0, 1, 0);
    this.bones = {};
    this.rest = new Map();
  }

  isPlaying() {
    return this.active;
  }

  emit(name) {
    this.onEvent(name, { time: this.time, frame: this.time * FPS + 1 });
  }

  play() {
    if (this.disposed || !this.scene) return false;
    if (this.active) this.finish(false);
    const player = this.getPlayer?.();
    if (!player) return false;

    this.original = player;
    this.proxy = cloneSkeleton(player);
    this.proxy.name = 'Getsuga_PlayerCastProxy';
    this.proxy.traverse((node) => {
      if (node.isMesh) {
        node.frustumCulled = false;
        node.castShadow = true;
      }
    });
    player.parent?.add(this.proxy);
    player.visible = false;

    this.localFx = new THREE.Group();
    this.localFx.name = 'Getsuga_LocalFX';
    this.worldFx = new THREE.Group();
    this.worldFx.name = 'Getsuga_WorldFX';
    this.scene.add(this.localFx, this.worldFx);

    this.captureBones();
    this.setupEffects();
    this.time = 0;
    this.lastFrame = -1;
    this.released = false;
    this.impacted = false;
    this.active = true;
    this.syncLocalFrame();
    this.emit('castStart');
    return true;
  }

  captureBones() {
    const root = this.proxy;
    this.bones = {
      hips: findBone(root, ['Hips', 'pelvis']),
      spine: findBone(root, ['Spine', 'spine01']),
      chest: findBone(root, ['Spine1', 'Spine2', 'chest', 'spine02']),
      leftShoulder: findBone(root, ['LeftShoulder', 'claviclel']),
      leftArm: findBone(root, ['LeftArm', 'upperarml']),
      leftForeArm: findBone(root, ['LeftForeArm', 'lowerarml']),
      leftHand: findBone(root, ['LeftHand', 'handl']),
      rightShoulder: findBone(root, ['RightShoulder', 'clavicler']),
      rightArm: findBone(root, ['RightArm', 'upperarmr']),
      rightForeArm: findBone(root, ['RightForeArm', 'lowerarmr']),
      rightHand: findBone(root, ['RightHand', 'handr', 'weaponr']),
      leftUpLeg: findBone(root, ['LeftUpLeg', 'thighl']),
      rightUpLeg: findBone(root, ['RightUpLeg', 'thighr']),
    };
    for (const bone of Object.values(this.bones)) {
      if (bone && !this.rest.has(bone)) {
        this.rest.set(bone, {
          quaternion: bone.quaternion.clone(),
          position: bone.position.clone(),
        });
      }
    }
  }

  setupEffects() {
    const red = 0xff173d;
    const hot = 0xff8078;
    const dark = 0x280008;
    const random = seeded(19);

    // Energy blade: bright red shell with a dark core, updated from the hand.
    const bladeGeo = new THREE.CylinderGeometry(.032, .052, 1.2, 10, 1, true);
    this.geometries.push(bladeGeo);
    const bladeMat = disposableMaterial(new THREE.MeshBasicMaterial({ color: red, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), this.materials);
    const bladeCoreMat = disposableMaterial(new THREE.MeshBasicMaterial({ color: dark, transparent: true, opacity: 0, depthWrite: false }), this.materials);
    this.bladeGlow = new THREE.Mesh(bladeGeo, bladeMat);
    this.bladeCore = new THREE.Mesh(bladeGeo, bladeCoreMat);
    this.bladeGlow.renderOrder = 16;
    this.bladeCore.renderOrder = 15;
    this.localFx.add(this.bladeGlow, this.bladeCore);

    // Aura particles encircle the body during the charge.
    const auraCount = 230;
    const auraBase = new Float32Array(auraCount * 3);
    for (let index = 0; index < auraCount; index += 1) {
      const angle = random() * Math.PI * 2;
      const radius = .18 + random() * .56;
      auraBase[index * 3] = Math.cos(angle) * radius;
      auraBase[index * 3 + 1] = .08 + random() * 1.85;
      auraBase[index * 3 + 2] = Math.sin(angle) * radius;
    }
    this.auraBase = auraBase;
    const auraGeo = new THREE.BufferGeometry();
    auraGeo.setAttribute('position', new THREE.BufferAttribute(auraBase.slice(), 3));
    this.geometries.push(auraGeo);
    this.auraMat = disposableMaterial(new THREE.PointsMaterial({ color: red, size: .045, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }), this.materials);
    this.aura = new THREE.Points(auraGeo, this.auraMat);
    this.aura.renderOrder = 12;
    this.localFx.add(this.aura);

    // Rising embers use a second dynamic point cloud.
    const emberCount = 150;
    this.emberSeed = Array.from({ length: emberCount }, (_, index) => ({
      x: (random() - .5) * 1.05,
      z: (random() - .5) * .72,
      y: random() * 1.65,
      speed: .45 + random() * 1.05,
      phase: random() * Math.PI * 2,
      delay: random() * 2.8,
      index,
    }));
    const emberGeo = new THREE.BufferGeometry();
    emberGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(emberCount * 3), 3));
    this.geometries.push(emberGeo);
    this.emberMat = disposableMaterial(new THREE.PointsMaterial({ color: hot, size: .033, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), this.materials);
    this.embers = new THREE.Points(emberGeo, this.emberMat);
    this.embers.renderOrder = 14;
    this.localFx.add(this.embers);

    // Ground fissures and floating stones reproduce the package's charge stage.
    const crackGeo = makeLineCracks();
    this.geometries.push(crackGeo);
    this.crackMat = disposableMaterial(new THREE.LineBasicMaterial({ color: red, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), this.materials);
    this.cracks = new THREE.LineSegments(crackGeo, this.crackMat);
    this.localFx.add(this.cracks);

    const rockGeo = new THREE.IcosahedronGeometry(.085, 0);
    this.geometries.push(rockGeo);
    const rockMat = disposableMaterial(new THREE.MeshStandardMaterial({ color: 0x302225, roughness: .92, metalness: 0, flatShading: true }), this.materials);
    const rockCount = 34;
    this.rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    this.rocks.castShadow = true;
    this.rockData = Array.from({ length: rockCount }, (_, index) => {
      const angle = random() * Math.PI * 2;
      const radius = .55 + random() * 1.55;
      return {
        index,
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        lift: .15 + random() * 1.15,
        start: 1.1 + random() * 1.15,
        size: .45 + random() * 1.35,
        spin: new THREE.Vector3(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1),
      };
    });
    this.localFx.add(this.rocks);

    // Baked-looking slash arc, ground and air shockwave rings.
    const trailGeo = new THREE.TorusGeometry(1.05, .055, 8, 72, Math.PI * 1.24);
    this.geometries.push(trailGeo);
    this.trailMat = disposableMaterial(new THREE.MeshBasicMaterial({ color: red, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), this.materials);
    this.trail = new THREE.Mesh(trailGeo, this.trailMat);
    this.trail.position.set(.08, 1.0, .16);
    this.trail.rotation.set(Math.PI / 2, -.32, -.62);
    this.localFx.add(this.trail);

    const ringGeo = new THREE.RingGeometry(.78, 1, 72);
    this.geometries.push(ringGeo);
    const ringMat1 = disposableMaterial(new THREE.MeshBasicMaterial({ color: red, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), this.materials);
    const ringMat2 = disposableMaterial(ringMat1.clone(), this.materials);
    this.ringGround = new THREE.Mesh(ringGeo, ringMat1);
    this.ringGround.rotation.x = -Math.PI / 2;
    this.ringGround.position.set(.05, .025, .45);
    this.ringAir = new THREE.Mesh(ringGeo, ringMat2);
    this.ringAir.position.set(.08, 1.05, .7);
    this.ringAir.rotation.y = .12;
    this.localFx.add(this.ringGround, this.ringAir);

    // Travelling crescent plus three fading echoes.
    const waveGeo = crescentGeometry();
    const waveGlowGeo = crescentGeometry(1.34, .5);
    this.geometries.push(waveGeo, waveGlowGeo);
    this.waveParts = [];
    const makeWave = (geometry, opacity, scale = 1) => {
      const material = disposableMaterial(new THREE.MeshBasicMaterial({ color: red, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), this.materials);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.setScalar(scale);
      mesh.visible = false;
      mesh.renderOrder = 20;
      this.worldFx.add(mesh);
      this.waveParts.push({ mesh, material, baseOpacity: opacity });
      return mesh;
    };
    this.waveCore = makeWave(waveGeo, 1, 1);
    this.waveGlow = makeWave(waveGlowGeo, .34, 1.05);
    this.echo1 = makeWave(waveGeo, .28, .94);
    this.echo2 = makeWave(waveGeo, .15, .88);
    this.echo3 = makeWave(waveGeo, .08, .82);

    // The glowing trench progressively grows underneath the travelling crescent.
    const trenchGeo = new THREE.PlaneGeometry(.55, this.impactDistance, 1, 18);
    this.geometries.push(trenchGeo);
    this.trenchMat = disposableMaterial(new THREE.MeshBasicMaterial({ color: 0x9d001f, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), this.materials);
    this.trench = new THREE.Mesh(trenchGeo, this.trenchMat);
    this.trench.rotation.x = -Math.PI / 2;
    this.trench.position.set(0, .018, this.impactDistance / 2);
    this.trench.visible = false;
    this.worldFx.add(this.trench);

    // Impact dome, vertical energy pillar and debris cloud.
    const domeGeo = new THREE.SphereGeometry(1, 30, 18, 0, Math.PI * 2, 0, Math.PI / 2);
    const pillarGeo = new THREE.CylinderGeometry(.42, .95, 4.8, 28, 1, true);
    this.geometries.push(domeGeo, pillarGeo);
    this.impactMat = disposableMaterial(new THREE.MeshBasicMaterial({ color: red, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), this.materials);
    this.pillarMat = disposableMaterial(new THREE.MeshBasicMaterial({ color: hot, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), this.materials);
    this.impactDome = new THREE.Mesh(domeGeo, this.impactMat);
    this.impactPillar = new THREE.Mesh(pillarGeo, this.pillarMat);
    this.impactDome.visible = false;
    this.impactPillar.visible = false;
    this.worldFx.add(this.impactDome, this.impactPillar);

    const debrisGeo = new THREE.IcosahedronGeometry(.09, 0);
    this.geometries.push(debrisGeo);
    this.debris = new THREE.InstancedMesh(debrisGeo, rockMat, 46);
    this.debrisData = Array.from({ length: 46 }, (_, index) => {
      const angle = random() * Math.PI * 2;
      const speed = 1.5 + random() * 4.8;
      return {
        index,
        vx: Math.cos(angle) * speed,
        vz: Math.sin(angle) * speed,
        vy: 3.2 + random() * 5.8,
        spin: new THREE.Vector3(random() * 5, random() * 5, random() * 5),
        scale: .35 + random() * 1.25,
      };
    });
    this.debris.visible = false;
    this.worldFx.add(this.debris);

    // Dynamic lights mirror the original package's blade/release/wave/impact lights.
    this.bladeLight = new THREE.PointLight(red, 0, 4.5, 2);
    this.flashLight = new THREE.PointLight(hot, 0, 8, 2);
    this.waveLight = new THREE.PointLight(red, 0, 7, 2);
    this.impactLight = new THREE.PointLight(red, 0, 15, 2);
    this.localFx.add(this.bladeLight, this.flashLight);
    this.worldFx.add(this.waveLight, this.impactLight);
  }

  syncLocalFrame() {
    if (!this.proxy || !this.localFx) return;
    this.proxy.updateMatrixWorld(true);
    this.proxy.getWorldPosition(this.localFx.position);
    this.proxy.getWorldQuaternion(this.localFx.quaternion);
    this.localFx.updateMatrixWorld(true);
  }

  applyPose(frame) {
    if (!this.proxy) return;
    const charge = smooth((frame - 18) / 28);
    const lift = smooth((frame - 36) / 30);
    const strike = smooth((frame - 72) / 14);
    const recover = smooth((frame - 91) / 50);
    const blend = 1 - recover;

    const set = (bone, x = 0, y = 0, z = 0) => {
      if (!bone) return;
      const rest = this.rest.get(bone);
      if (!rest) return;
      const delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(x * blend, y * blend, z * blend, 'XYZ'));
      bone.quaternion.copy(rest.quaternion).multiply(delta);
    };

    set(this.bones.hips, -.08 * charge + .12 * strike, 0, .06 * charge);
    set(this.bones.spine, -.14 * charge + .24 * strike, -.05 * strike, -.06 * charge);
    set(this.bones.chest, -.1 * charge + .34 * strike, -.12 * strike, -.08 * charge);
    set(this.bones.leftShoulder, -.12 * lift + .3 * strike, -.18 * lift, -.12 * lift);
    set(this.bones.leftArm, -.35 * lift + .48 * strike, -.18 * lift, -.68 * lift + .28 * strike);
    set(this.bones.leftForeArm, -.35 * lift + .55 * strike, 0, -.28 * lift);
    set(this.bones.rightShoulder, -.2 * lift + .38 * strike, .15 * lift, .16 * lift);
    set(this.bones.rightArm, -1.08 * lift + 1.95 * strike, .18 * lift - .35 * strike, 1.18 * lift - .74 * strike);
    set(this.bones.rightForeArm, -.82 * lift + 1.18 * strike, -.1 * strike, .25 * lift);
    set(this.bones.rightHand, .2 * lift + .55 * strike, 0, -.12 * lift);
    set(this.bones.leftUpLeg, -.08 * charge, 0, .04 * charge);
    set(this.bones.rightUpLeg, .12 * charge, 0, -.04 * charge);

    if (this.bones.hips) {
      const rest = this.rest.get(this.bones.hips);
      this.bones.hips.position.copy(rest.position);
      this.bones.hips.position.y -= .045 * charge * (1 - recover);
      this.bones.hips.position.z += .035 * strike * (1 - recover);
    }
    this.proxy.updateMatrixWorld(true);
  }

  updateBlade(frame) {
    if (!this.bladeGlow) return;
    const intensity = curve(FX_CURVES.energyBlade, frame);
    const glow = curve(FX_CURVES.bladeGlow, frame);
    const hand = this.bones.rightHand;
    this.localFx.updateMatrixWorld(true);
    const start = hand
      ? this.localFx.worldToLocal(hand.getWorldPosition(new THREE.Vector3()))
      : new THREE.Vector3(.38, 1.05, .12);
    const forward = new THREE.Vector3(0, .06, 1).normalize();
    const end = start.clone().add(forward.multiplyScalar(1.2));
    setCylinderBetween(this.bladeGlow, start, end);
    setCylinderBetween(this.bladeCore, start, end);
    this.bladeGlow.material.opacity = intensity * .9;
    this.bladeCore.material.opacity = intensity * .68;
    this.bladeGlow.scale.x = this.bladeGlow.scale.z = .7 + glow * .8;
    this.bladeCore.scale.x = this.bladeCore.scale.z = .45 + glow * .42;
    this.bladeLight.position.copy(start.clone().lerp(end, .58));
    this.bladeLight.intensity = (intensity * .8 + glow * .35) * 4.5;
  }

  updateAura(frame) {
    const aura = curve(FX_CURVES.aura, frame);
    this.auraMat.opacity = aura * .7;
    this.emberMat.opacity = aura * .88;
    this.crackMat.opacity = curve(FX_CURVES.groundCrack, frame) * .58;

    const auraPos = this.aura.geometry.attributes.position.array;
    for (let index = 0; index < this.auraBase.length / 3; index += 1) {
      const base = index * 3;
      const y = this.auraBase[base + 1];
      const wobble = Math.sin(this.time * (4.5 + (index % 7) * .14) + index * .72) * .035 * aura;
      auraPos[base] = this.auraBase[base] + wobble;
      auraPos[base + 1] = y + ((this.time * (.24 + (index % 5) * .025)) % .3) * aura;
      auraPos[base + 2] = this.auraBase[base + 2] + Math.cos(this.time * 4 + index) * .025 * aura;
    }
    this.aura.geometry.attributes.position.needsUpdate = true;

    const emberPos = this.embers.geometry.attributes.position.array;
    for (const ember of this.emberSeed) {
      const localTime = Math.max(0, this.time - ember.delay);
      const life = (localTime * ember.speed) % 2.0;
      const index = ember.index * 3;
      emberPos[index] = ember.x + Math.sin(ember.phase + localTime * 4) * .07 * life;
      emberPos[index + 1] = ember.y + life;
      emberPos[index + 2] = ember.z + Math.cos(ember.phase * 1.3 + localTime * 3) * .045 * life;
    }
    this.embers.geometry.attributes.position.needsUpdate = true;
  }

  updateRocks(frame) {
    if (!this.rocks) return;
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const position = new THREE.Vector3();
    const euler = new THREE.Euler();
    for (const rock of this.rockData) {
      const rise = smooth((this.time - rock.start) / Math.max(.2, RELEASE_TIME - rock.start));
      const fall = this.time > RELEASE_TIME ? clamp01((this.time - RELEASE_TIME) / 1.1) : 0;
      position.set(
        rock.x + Math.sin(this.time * 2.2 + rock.index) * .025,
        .03 + rock.lift * rise * (1 - fall),
        rock.z + Math.cos(this.time * 1.9 + rock.index) * .025,
      );
      euler.set(rock.spin.x * this.time, rock.spin.y * this.time, rock.spin.z * this.time);
      quaternion.setFromEuler(euler);
      scale.setScalar(rock.size * (frame < 18 ? 0 : 1));
      matrix.compose(position, quaternion, scale);
      this.rocks.setMatrixAt(rock.index, matrix);
    }
    this.rocks.instanceMatrix.needsUpdate = true;
  }

  updateSwing(frame) {
    const trail = frame > 77 && frame < 94;
    this.trail.visible = trail;
    this.trailMat.opacity = trail ? curve([[77, 0], [81, .95], [87, .62], [94, 0]], frame) : 0;
    const ringFade = frame >= 82 && frame <= 98 ? curve([[82, 0], [84, 1], [90, .55], [98, 0]], frame) : 0;
    this.ringGround.visible = ringFade > .01;
    this.ringAir.visible = ringFade > .01;
    this.ringGround.material.opacity = ringFade * .55;
    this.ringAir.material.opacity = ringFade * .42;
    const ringProgress = clamp01((frame - 82) / 16);
    this.ringGround.scale.setScalar(.35 + ringProgress * 7.4);
    this.ringAir.scale.setScalar(.25 + ringProgress * 4.4);
    this.flashLight.position.set(.05, 1.05, .7);
    this.flashLight.intensity = curve(FX_CURVES.flash, frame, true) * 18;
  }

  releaseWave() {
    if (this.released) return;
    this.released = true;
    this.localFx.getWorldPosition(this.origin);
    this.localFx.getWorldQuaternion(this.originQ);
    this.forward.set(0, 0, 1).applyQuaternion(this.originQ).normalize();
    this.worldFx.position.copy(this.origin);
    this.worldFx.quaternion.copy(this.originQ);
    this.worldFx.updateMatrixWorld(true);
    this.emit('release');
  }

  updateWave() {
    if (!this.released) return;
    const travel = clamp01((this.time - RELEASE_TIME) / Math.max(.05, IMPACT_TIME - RELEASE_TIME));
    const eased = 1 - Math.pow(1 - travel, 1.45);
    const distance = .75 + eased * (this.impactDistance - .75);
    const scale = .52 + (1 - Math.exp(-travel * 4.2)) * 2.45;
    const fade = this.time > IMPACT_TIME ? Math.max(0, 1 - (this.time - IMPACT_TIME) / .46) : 1;

    const offsets = [0, -.28, -.52, -.74, -.94];
    this.waveParts.forEach((part, index) => {
      part.mesh.visible = fade > .01;
      part.mesh.position.set(.04, .72 + scale * .22, Math.max(.2, distance + offsets[index]));
      part.mesh.scale.setScalar(scale * (1 - index * .045));
      part.material.opacity = part.baseOpacity * fade;
    });
    this.waveCore.rotation.z = -1.39;
    this.waveGlow.rotation.z = -1.39;
    this.echo1.rotation.z = this.echo2.rotation.z = this.echo3.rotation.z = -1.39;

    this.trench.visible = true;
    this.trenchMat.opacity = .24 + .34 * Math.min(1, travel * 2);
    this.trench.scale.set(1, Math.max(.02, travel), 1);
    this.trench.position.z = this.impactDistance * travel * .5;

    this.waveLight.position.set(.05, .75, distance);
    this.waveLight.intensity = fade * 11;

    if (travel >= 1 && !this.impacted) {
      this.impacted = true;
      this.emit('impact');
    }
    this.updateImpact();
  }

  updateImpact() {
    if (!this.impacted) return;
    const age = Math.max(0, this.time - IMPACT_TIME);
    const p = clamp01(age / .86);
    const fade = Math.max(0, 1 - age / 1.55);
    const targetZ = this.impactDistance;
    this.impactDome.visible = fade > .01;
    this.impactPillar.visible = fade > .01;
    this.impactDome.position.set(0, 0, targetZ);
    this.impactPillar.position.set(0, 2.15, targetZ);
    this.impactDome.scale.setScalar(.25 + p * 3.7);
    this.impactPillar.scale.set(1 + p * 1.25, 1 + p * .8, 1 + p * 1.25);
    this.impactMat.opacity = fade * .42;
    this.pillarMat.opacity = fade * .26;
    this.impactLight.position.set(0, 1.4, targetZ);
    this.impactLight.intensity = fade * 26;

    this.debris.visible = age < 2.1;
    if (!this.debris.visible) return;
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const scale = new THREE.Vector3();
    const position = new THREE.Vector3();
    for (const item of this.debrisData) {
      const t = age;
      position.set(item.vx * t, .08 + item.vy * t - 4.9 * t * t, targetZ + item.vz * t);
      if (position.y < .02) position.y = .02;
      euler.set(item.spin.x * t, item.spin.y * t, item.spin.z * t);
      quaternion.setFromEuler(euler);
      scale.setScalar(item.scale * Math.max(.1, 1 - t / 2.2));
      matrix.compose(position, quaternion, scale);
      this.debris.setMatrixAt(item.index, matrix);
    }
    this.debris.instanceMatrix.needsUpdate = true;
  }

  update(dt) {
    if (!this.active || this.disposed) return;
    this.time += Math.min(.05, Math.max(0, dt));
    const frame = this.time * FPS + 1;

    this.applyPose(frame);
    this.syncLocalFrame();
    this.updateBlade(frame);
    this.updateAura(frame);
    this.updateRocks(frame);
    this.updateSwing(frame);

    if (!this.released && frame >= RELEASE_FRAME) this.releaseWave();
    this.updateWave();

    if (this.lastFrame >= 0) {
      for (const event of EVENTS) {
        if (event.name === 'release') continue;
        if (this.lastFrame < event.frame && frame >= event.frame) this.emit(event.name);
      }
    }
    this.lastFrame = frame;

    if (this.time >= DURATION) this.finish(true);
  }

  finish(emitEnd = true) {
    if (!this.active && !this.proxy && !this.localFx && !this.worldFx) return;
    if (this.original) this.original.visible = true;
    if (this.proxy?.parent) this.proxy.parent.remove(this.proxy);
    if (this.localFx) this.scene?.remove(this.localFx);
    if (this.worldFx) this.scene?.remove(this.worldFx);
    this.proxy = null;
    this.localFx = null;
    this.worldFx = null;
    this.original = null;
    this.rest.clear();
    this.bones = {};
    for (const geometry of this.geometries) geometry?.dispose?.();
    for (const material of this.materials) material?.dispose?.();
    this.geometries = [];
    this.materials = [];
    this.active = false;
    if (emitEnd) this.emit('end');
  }

  dispose() {
    this.finish(false);
    this.disposed = true;
  }
}

export default GetsugaAbilityRuntime;