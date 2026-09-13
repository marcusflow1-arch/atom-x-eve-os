import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { createEmbeddedAvatarController, HI3D_COMMANDS } from '../../src/components/onboarding/embeddedAvatarController.js';

const mount = document.querySelector('#stage'), status = document.querySelector('#status');
const buttons = document.querySelector('#actions'), arm = document.querySelector('#arm');
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
catch { status.textContent = 'WebGL is unavailable. Open this file in a browser with 3D graphics enabled.'; throw new Error('WebGL unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; mount.appendChild(renderer.domElement);
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(34, 1, .01, 100);
camera.position.set(2.2, 1.5, 3.8);
const orbit = new OrbitControls(camera, renderer.domElement); orbit.target.set(0, .89, .05); orbit.enableDamping = true; orbit.minDistance = 1.8; orbit.maxDistance = 6; orbit.maxPolarAngle = Math.PI * .57;
scene.add(new THREE.HemisphereLight(0xe1f3ff, 0x243345, 2));
const key = new THREE.DirectionalLight(0xfff3e5, 3); key.position.set(-2.6, 4, 3); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); scene.add(key);
const fill = new THREE.DirectionalLight(0x94d8e7, 1.2); fill.position.set(3, 2, 1); scene.add(fill);
const rim = new THREE.DirectionalLight(0x8dc7dd, 1.5); rim.position.set(1, 3, -3); scene.add(rim);
const floor = new THREE.Mesh(new THREE.CircleGeometry(2.7, 96), new THREE.MeshStandardMaterial({ color: 0x172630, roughness: .98 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.015; floor.receiveShadow = true; scene.add(floor);
const outline = new OutlineEffect(renderer, { defaultThickness: .0015, defaultColor: [.02, .035, .045], defaultAlpha: .6 });
const observer = new ResizeObserver(() => { renderer.setSize(mount.clientWidth, mount.clientHeight); camera.aspect = mount.clientWidth / mount.clientHeight; camera.updateProjectionMatrix(); }); observer.observe(mount);
const bytes = Uint8Array.from(atob(document.querySelector('#avatar-data').textContent.trim()), char => char.charCodeAt(0));
const loader = new GLTFLoader();
loader.parse(bytes.buffer, '', asset => {
  const model = asset.scene; model.traverse(node => { if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; node.frustumCulled = false; } }); scene.add(model);
  const mixer = new THREE.AnimationMixer(model);
  const controller = createEmbeddedAvatarController(model, asset.animations, mixer, state => {
    status.textContent = state.clip.replaceAll('_', ' ');
    for (const button of buttons.children) button.setAttribute('aria-pressed', String(button.dataset.command === state.command));
    arm.disabled = state.posture !== 'standing' || state.transitioning;
  });
  const command = value => { mixer.timeScale = 1; document.querySelector('#pause').textContent = 'Pause'; arm.value = 0; document.querySelector('#arm-value').textContent = '0%'; controller.command(value); };
  for (const item of HI3D_COMMANDS) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = item.label; button.dataset.command = item.command;
    button.addEventListener('click', () => command(item.command)); buttons.appendChild(button);
  }
  document.querySelector('#pause').disabled = false;
  document.querySelector('#pause').onclick = event => { mixer.timeScale = mixer.timeScale ? 0 : 1; event.target.textContent = mixer.timeScale ? 'Pause' : 'Resume'; };
  arm.disabled = false;
  arm.oninput = () => { mixer.timeScale = 1; document.querySelector('#pause').textContent = 'Pause'; controller.setArmLift(Number(arm.value)); document.querySelector('#arm-value').textContent = `${Math.round(Number(arm.value) * 100)}%`; };
  const keys = new Set();
  window.addEventListener('keydown', event => { if (event.target.matches('input') || !'wasd'.includes(event.key.toLowerCase()) || event.key.length !== 1) return; event.preventDefault(); if (!keys.has(event.key.toLowerCase())) { keys.add(event.key.toLowerCase()); command('walk'); } });
  window.addEventListener('keyup', event => { keys.delete(event.key.toLowerCase()); if (!keys.size && controller.snapshot().clip === 'Walk') command('idle'); });
  window.addEventListener('blur', () => { if (keys.size) command('idle'); keys.clear(); });
  document.querySelector('#front').onclick = () => { camera.position.set(0, 1.15, 4.0); orbit.target.set(0, .89, 0); };
  document.querySelector('#back').onclick = () => { camera.position.set(0, 1.15, -4.0); orbit.target.set(0, .89, 0); };
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate); const dt = Math.min(clock.getDelta(), .05); mixer.update(dt);
    if (controller.canMove() && mixer.timeScale) {
      const direction = new THREE.Vector3(Number(keys.has('d')) - Number(keys.has('a')), 0, Number(keys.has('s')) - Number(keys.has('w')));
      if (direction.lengthSq()) { direction.normalize(); model.position.addScaledVector(direction, dt * .5); model.position.x = THREE.MathUtils.clamp(model.position.x, -1, 1); model.position.z = THREE.MathUtils.clamp(model.position.z, -.7, .7); model.rotation.y = Math.atan2(direction.x, direction.z); }
    }
    orbit.update(); outline.render(scene, camera);
  }
  command('idle'); animate();
}, error => { status.textContent = `Could not open the character: ${error.message}`; });
