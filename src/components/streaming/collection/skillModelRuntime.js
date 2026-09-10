import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export function fitSkillModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  if (box.isEmpty()) return false;
  const size = box.getSize(new THREE.Vector3());
  const extent = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(extent) || extent <= 0) return false;
  const scale = 2 / extent;
  model.scale.multiplyScalar(scale);
  model.position.sub(new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3()));
  return true;
}

function disposeModel(model) {
  const materials = new Set(), textures = new Set(), geometries = new Set();
  model?.traverse((node) => {
    if (node.geometry) geometries.add(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : node.material ? [node.material] : []) materials.add(material);
    node.skeleton?.dispose?.();
  });
  materials.forEach((material) => { Object.values(material).forEach((value) => { if (value?.isTexture) textures.add(value); }); material.dispose(); });
  geometries.forEach((geometry) => geometry.dispose());
  textures.forEach((texture) => { texture.dispose(); texture.image?.close?.(); });
}

export function createSkillPreview(canvas, { url, animationClip, onReady, onError }) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, .01, 100);
  const initialPosition = new THREE.Vector3(2.5, 1.25, 3.4);
  camera.position.copy(initialPosition);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false; controls.minDistance = 1.4; controls.maxDistance = 8; controls.enableDamping = false;
  const environment = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(renderer), environmentMap = pmrem.fromScene(environment);
  scene.environment = environmentMap.texture; environment.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xc7ecff, 0x24263a, 1.8));
  const key = new THREE.DirectionalLight(0xffffff, 2.5); key.position.set(3, 4, 2); scene.add(key);
  const rim = new THREE.DirectionalLight(0x7ecbea, 1.5); rim.position.set(-3, 2, -2); scene.add(rim);
  let disposed = false, active = false, playing = true, model, mixer, action, frame = null, previous = 0;
  const render = () => { if (!disposed && active) renderer.render(scene, camera); };
  const tick = (time) => {
    frame = null;
    if (disposed || !active || !playing || !mixer) return;
    mixer.update(previous ? Math.min((time - previous) / 1000, .05) : 0); previous = time; render();
    frame = requestAnimationFrame(tick);
  };
  const schedule = () => { cancelAnimationFrame(frame); frame = null; previous = 0; render(); if (active && playing && mixer) frame = requestAnimationFrame(tick); };
  controls.addEventListener('change', render);
  const resize = () => {
    const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); render();
  };
  const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
  const abort = new AbortController();
  (async () => {
    try {
      const response = await fetch(url, { signal: abort.signal });
      if (!response.ok) throw new Error('Model unavailable');
      const buffer = await response.arrayBuffer();
      if (disposed) return;
      const basePath = new URL('.', url).href;
      const isFbx = /\.fbx$/i.test(new URL(url).pathname);
      const asset = isFbx ? new FBXLoader().parse(buffer, basePath) : await new GLTFLoader().parseAsync(buffer, basePath);
      const loaded = isFbx ? asset : asset.scene;
      if (disposed) { disposeModel(loaded); return; }
      if (!fitSkillModel(loaded)) { disposeModel(loaded); throw new Error('Empty model'); }
      model = loaded; scene.add(model);
      const animations = asset.animations || [];
      const clip = animations.find((item) => item.name === animationClip) || animations[0];
      if (clip) { mixer = new THREE.AnimationMixer(model); action = mixer.clipAction(clip); action.setLoop(THREE.LoopRepeat, Infinity); action.play(); }
      onReady({ animated: Boolean(clip), animationName: clip?.name || '' }); schedule();
    } catch (error) { if (!disposed && error.name !== 'AbortError') onError(); }
  })();
  return {
    setActive(value) { active = value; controls.enabled = value; schedule(); },
    setPlaying(value) { playing = value; schedule(); },
    rotate(direction) { camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), direction * Math.PI / 8); controls.update(); render(); },
    zoom(direction) { camera.position.multiplyScalar(direction > 0 ? .85 : 1.15); controls.update(); render(); },
    reset() { camera.position.copy(initialPosition); controls.target.set(0, 0, 0); controls.update(); action?.reset(); render(); },
    dispose() { disposed = true; abort.abort(); cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); mixer?.stopAllAction(); if (model) mixer?.uncacheRoot(model); disposeModel(model); environmentMap.dispose(); renderer.dispose(); renderer.forceContextLoss(); },
  };
}
