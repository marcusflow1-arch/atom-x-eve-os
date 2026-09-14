import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect';
import { applyCompanionAppearance, getAvatarStylePreset } from '@/components/onboarding/genesisAssets';
import { createEmbeddedAvatarController } from '@/components/onboarding/embeddedAvatarController';


export function createGenesisScene(container, url, onReady, onStatus, options = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .01, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.minDistance = options.portrait ? .6 : 2;
  controls.maxDistance = 6;
  controls.maxPolarAngle = Math.PI * .68;
  controls.enableDamping = true;
  controls.dampingFactor = .065;

  scene.add(new THREE.HemisphereLight(0xdfefff, 0x20283a, 2.15));
  const key = new THREE.DirectionalLight(0xfff4e7, 3.4);
  key.position.set(2.6, 4.6, 3.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -3; key.shadow.camera.right = 3; key.shadow.camera.top = 4; key.shadow.camera.bottom = -1;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x78a9d7, 1.25);
  fill.position.set(-3, 2.5, 2.2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x70d8ff, 2.35);
  rim.position.set(-1.5, 2.8, -3.5);
  scene.add(rim);
  const face = new THREE.PointLight(0xffcfb0, 1.35, 5);
  face.position.set(.25, 2.2, 2.5);
  scene.add(face);

  const shadowMaterial = new THREE.ShadowMaterial({ opacity: .22 });
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 3.5), shadowMaterial);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -.012;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  let disposed = false, model, mixer, action, frame, appearance = {}, animationVersion = 0, basePosition = null, paused = false;
  let embeddedController = null, preserveAppearance = false;

  let outline = new OutlineEffect(renderer, { defaultThickness: .0022, defaultColor: [0.025, 0.035, 0.055], defaultAlpha: .75, defaultKeepAlive: true });
  const fbx = new FBXLoader(), gltf = new GLTFLoader(), clock = new THREE.Clock();

  const disposeModel = (object) => object?.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry?.dispose();
    (Array.isArray(node.material) ? node.material : [node.material]).filter(Boolean).forEach((material) => {
      Object.values(material).forEach((value) => { if (value?.isTexture) value.dispose(); });
      material.dispose();
    });
  });

  const resize = () => {
    const width = Math.max(1, container.clientWidth), height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  const applyStyle = (value = {}) => {
    const style = getAvatarStylePreset(value.style_preset);
    renderer.toneMappingExposure = style.exposure;
    outline = new OutlineEffect(renderer, {
      defaultThickness: style.outline,
      defaultColor: style.id === 'grounded_rpg' ? [0.06, 0.07, 0.09] : [0.018, 0.025, 0.045],
      defaultAlpha: style.id === 'grounded_rpg' ? .35 : .82,
      defaultKeepAlive: true,
    });
  };

  let visible = true;
  const visibility = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting !== false; });
  visibility?.observe(container);
  const animate = () => {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), .05);
    if (!visible || document.hidden) return;
    mixer?.update(dt);
    if (options.portrait && model) { const head = model.getObjectByName('Head'); if (head) { const p = head.getWorldPosition(new THREE.Vector3()); const shift = p.y - controls.target.y; controls.target.y = p.y; camera.position.y += shift; } }
    controls.update();
    outline.render(scene, camera);
  };
  animate();

  async function loadAnimationAsset(motion) {
    if (/\.(glb|gltf)(?:\?|$)/i.test(motion.url)) return gltf.loadAsync(motion.url);
    return fbx.loadAsync(motion.url);
  }

  async function play(motion) {
    if (embeddedController) { embeddedController.command(motion?.command || 'idle'); return; }
    if (!motion?.url) return;
    const version = ++animationVersion;
    onStatus('animation-loading');
    try {
      const asset = await loadAnimationAsset(motion);
      const animationRoot = asset.scene || asset;
      if (disposed || version !== animationVersion) { if (animationRoot !== model) disposeModel(animationRoot); return; }
      if (!asset.animations?.length && !animationRoot.animations?.length) throw new Error('No animation available');
      const sourceClip = asset.animations?.[0] || animationRoot.animations?.[0];
      const clip = sourceClip.clone();
      clip.tracks.forEach((track) => {
        if (/Hips\.position$/i.test(track.name) || /mixamorig:Hips\.position$/i.test(track.name)) {
          for (let index = 0; index < track.values.length; index += 3) {
            track.values[index] = track.values[0];
            track.values[index + 2] = track.values[2];
          }
        }
      });
      const next = mixer.clipAction(clip);
      if (motion.loop === false) { next.setLoop(THREE.LoopOnce, 1); next.clampWhenFinished = true; }
      else next.setLoop(THREE.LoopRepeat, Infinity);
      action?.fadeOut(.22);
      next.reset().fadeIn(.28).play();
      action = next;
      model.visible = true;
      onStatus('ready', motion.name);
      if (animationRoot !== model) disposeModel(animationRoot);
    } catch (error) {
      console.warn('Avatar animation failed:', motion?.name, error);
      if (!disposed) { if (model) model.visible = true; onStatus('animation-error'); }
    }
  }

  (async () => {
    try {
      const asset = /\.fbx(?:\?|$)/i.test(url) ? await fbx.loadAsync(url) : await gltf.loadAsync(url);
      model = asset.scene || asset;
      if (disposed) { disposeModel(model); return; }
      model.traverse((node) => { preserveAppearance ||= node.userData?.avatarRig === 'luna-hi3d-v1'; });
      let box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      model.scale.setScalar(1.8 / (size.y || 1));
      box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.set(-center.x, -box.min.y, -center.z);
      basePosition = model.position.clone();
      camera.position.set(0, options.portrait ? 1.64 : 1.08, options.portrait ? 1.15 : 3.75);
      controls.target.set(0, options.portrait ? 1.62 : .96, 0);
      controls.update();

      const materials = [], morphs = [];
      let hood = false, weapon = false, eyes = false, eyelashes = false, hair = false;
      model.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = true;
        node.receiveShadow = true;
        // Poses extend beyond the bind-pose bounds (wave, sitting, lean back).
        if (preserveAppearance && node.isSkinnedMesh) node.frustumCulled = false;
        const signature = `${node.name || ''} ${(Array.isArray(node.material) ? node.material : [node.material]).map((item) => item?.name || '').join(' ')}`.toLowerCase();
        hood ||= /hood|cowl/.test(signature);
        weapon ||= /bow|quiver|arrow|sword|weapon/.test(signature);
        eyes ||= /eye(?!lash)|iris/.test(signature);
        eyelashes ||= /lash/.test(signature);
        hair ||= /hair/.test(signature);
        (Array.isArray(node.material) ? node.material : [node.material]).filter(Boolean).forEach((material, index) => {
          material.side = THREE.DoubleSide;
          if (material.color) materials.push({ key: `${node.name}:${index}`, label: (material.name || node.name || `Material ${index + 1}`).replace(/_/g, ' '), color: '#' + material.color.getHexString() });
        });
        if (node.morphTargetDictionary) Object.keys(node.morphTargetDictionary).forEach((name) => morphs.push({ key: `${node.name}:${name}`, label: name }));
      });

      model.visible = preserveAppearance;
      scene.add(model);
      mixer = new THREE.AnimationMixer(model);
      applyStyle(appearance);
      applyCompanionAppearance(model, appearance);
      if (preserveAppearance) {
        embeddedController = createEmbeddedAvatarController(model, asset.animations || [], mixer, (state) => onStatus('ready', state.clip));
      }
      onReady({ hi3d: preserveAppearance, faceFit: true, materials: preserveAppearance ? [] : materials, morphs, hood, weapon: preserveAppearance ? false : weapon, eyes: preserveAppearance ? false : eyes, eyelashes, hair: preserveAppearance || hair, embeddedClips: preserveAppearance ? (asset.animations || []).map(clip => clip.name) : [] });
      
    } catch (error) {
      console.error('Avatar model failed:', error);
      if (!disposed) onStatus('error');
    }
  })();

  const move = (x = 0, z = 0, distance = .05) => {
    if (!model || !basePosition) return;
    if (paused || (embeddedController && !embeddedController.canMove())) return;
    model.position.x = THREE.MathUtils.clamp(model.position.x + (x * distance), basePosition.x - 1.65, basePosition.x + 1.65);
    model.position.z = THREE.MathUtils.clamp(model.position.z + (z * distance), basePosition.z - 1.05, basePosition.z + 1.05);
    if (x || z) model.rotation.y = Math.atan2(x, z);
  };
  const resetPosition = () => { if (model && basePosition) { model.position.copy(basePosition); model.rotation.y = 0; } };
  const setPaused = (value) => { paused = Boolean(value); if (mixer) mixer.timeScale = paused ? 0 : 1; return paused; };
  const togglePaused = () => setPaused(!paused);

  return {
    appearance: (value) => { appearance = value || {}; applyStyle(appearance); if (model) applyCompanionAppearance(model, appearance);  },
    play,
    command: (value) => { setPaused(false); embeddedController?.command(value); },
    setArmLift: (value) => { setPaused(false); return embeddedController?.setArmLift(value); },
    animationState: () => embeddedController?.snapshot(),
    move,
    resetPosition,
    setPaused,
    togglePaused,
    isPaused: () => paused,
    rotate: (amount) => { if (model) model.rotation.y += amount; },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility?.disconnect();
      controls.dispose();
      embeddedController?.dispose();
      mixer?.stopAllAction();



      disposeModel(model);
      shadowPlane.geometry.dispose();
      shadowMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
