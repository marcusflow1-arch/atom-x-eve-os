import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect';
import { applyCompanionAppearance, getAvatarStylePreset } from '@/components/onboarding/genesisAssets';
import { createEmbeddedAvatarController } from '@/components/onboarding/embeddedAvatarController';
import { retargetAvatarClip } from '@/components/onboarding/retargetAvatarClip';
import { ensureRuntimeHumanoidRig } from '@/components/onboarding/runtimeHumanoidRig';


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
  let secondaryRoot = null, secondaryModel = null, secondaryMixer = null, secondaryAction = null, secondaryBasePosition = null;
  let secondaryMotionRoot = null, secondaryMotionMixer = null, secondaryMotionAction = null, secondaryMotionBridge = null;
  let embeddedController = null, preserveAppearance = false, atomxeRuntimeRig = false, runtimeBoneCount = 0, runtimeRigGenerated = false;
  const lockedBonePositions = new Map();

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

  const normalizeBoneName = (value = '') => String(value)
    .replace(/^mixamorig[:_]?/i, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

  const retargetClipToModel = (clip) => {
    if (!options.retargetExternalMotions || !model || !clip?.tracks?.length) return clip;

    const targetBones = new Map();
    model.traverse((node) => {
      if (!node.isBone) return;
      const key = normalizeBoneName(node.name);
      if (key && !targetBones.has(key)) targetBones.set(key, node.name);
    });
    if (!targetBones.size) return clip;

    clip.tracks.forEach((track) => {
      const separator = track.name.lastIndexOf('.');
      if (separator <= 0) return;
      const sourceBone = track.name.slice(0, separator);
      const property = track.name.slice(separator + 1);
      const targetName = targetBones.get(normalizeBoneName(sourceBone));
      if (targetName) track.name = targetName + '.' + property;
    });
    return clip;
  };

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
    // Female Artemis must stay anchored to the character-creation platform.
    // Idle is rotation-only: restore the model root and every bone's bind
    // translation after the mixer runs, preventing any retargeted FBX position
    // channel from lifting the character out of the circle.
    if (options.lockModelPosition && model && basePosition) {
      model.position.copy(basePosition);
    }
    if (options.lockRootTranslation && lockedBonePositions.size) {
      lockedBonePositions.forEach((position, bone) => {
        bone.position.copy(position);
      });
      model?.updateMatrixWorld(true);
    }
    secondaryMixer?.update(dt);
    secondaryMotionMixer?.update(dt);

    if (secondaryMotionBridge && secondaryModel) {
      const { hips, spine, restHipsPosition, restHipsQuaternion, restSpineQuaternion, basePosition: childBasePosition, baseQuaternion } = secondaryMotionBridge;
      const hipsDeltaQuaternion = restHipsQuaternion.clone().invert().multiply(hips.quaternion);
      const spineDeltaQuaternion = restSpineQuaternion.clone().invert().multiply(spine.quaternion);
      const hipsEuler = new THREE.Euler().setFromQuaternion(hipsDeltaQuaternion, 'YXZ');
      const spineEuler = new THREE.Euler().setFromQuaternion(spineDeltaQuaternion, 'YXZ');
      const motionEuler = new THREE.Euler(
        THREE.MathUtils.clamp((hipsEuler.x * 0.16) + (spineEuler.x * 0.24), -0.08, 0.08),
        THREE.MathUtils.clamp((hipsEuler.y * 0.12) + (spineEuler.y * 0.16), -0.10, 0.10),
        THREE.MathUtils.clamp((hipsEuler.z * 0.18) + (spineEuler.z * 0.28), -0.09, 0.09),
        'YXZ',
      );
      const motionQuaternion = new THREE.Quaternion().setFromEuler(motionEuler);
      secondaryModel.quaternion.copy(baseQuaternion).multiply(motionQuaternion);

      const sourceBob = hips.position.y - restHipsPosition.y;
      const bob = THREE.MathUtils.clamp(sourceBob * 0.0035, -0.022, 0.022);
      secondaryModel.position.copy(childBasePosition);
      secondaryModel.position.y += bob;
    }

    if (options.portrait && model) { const head = model.getObjectByName('Head'); if (head) { const p = head.getWorldPosition(new THREE.Vector3()); const shift = p.y - controls.target.y; controls.target.y = p.y; camera.position.y += shift; } }
    controls.update();
    outline.render(scene, camera);
  };
  animate();

  async function loadAnimationAsset(motion) {
    if (/\.(glb|gltf)(?:\?|$)/i.test(motion.url)) return gltf.loadAsync(motion.url);
    return fbx.loadAsync(motion.url);
  }

  async function loadSecondaryCharacter(config) {
    if (!config?.modelUrl || disposed) return;

    try {
      const asset = await loadAnimationAsset({ url: config.modelUrl });
      secondaryModel = asset.scene || asset;
      if (disposed) { disposeModel(secondaryModel); secondaryModel = null; return; }

      let box = new THREE.Box3().setFromObject(secondaryModel);
      const size = box.getSize(new THREE.Vector3());
      const targetHeight = Number(config.height || 1.28);
      secondaryModel.scale.setScalar(targetHeight / (size.y || 1));

      box = new THREE.Box3().setFromObject(secondaryModel);
      const center = box.getCenter(new THREE.Vector3());
      secondaryModel.position.set(-center.x, -box.min.y, -center.z);

      secondaryRoot = new THREE.Group();
      secondaryRoot.position.set(
        Number(config.offsetX ?? 0.9),
        Number(config.offsetY ?? 0),
        Number(config.offsetZ ?? 0),
      );
      secondaryRoot.rotation.y = Number(config.yaw || 0);
      secondaryRoot.add(secondaryModel);

      secondaryModel.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = true;
        node.receiveShadow = true;
        if (node.isSkinnedMesh) node.frustumCulled = false;
        (Array.isArray(node.material) ? node.material : [node.material]).filter(Boolean).forEach((material) => {
          material.side = THREE.DoubleSide;
        });
      });

      scene.add(secondaryRoot);
      secondaryMixer = new THREE.AnimationMixer(secondaryModel);
      secondaryBasePosition = secondaryRoot.position.clone();

      if (model && Number.isFinite(config.parentOffsetX)) {
        model.position.x += Number(config.parentOffsetX);
        basePosition = model.position.clone();
      }

      controls.target.x = Number.isFinite(config.targetX)
        ? Number(config.targetX)
        : ((model?.position.x || 0) + secondaryRoot.position.x) / 2;
      if (!options.portrait) camera.position.z = Math.max(camera.position.z, Number(config.cameraDistance || 4.2));
      controls.update();

      const embeddedIdle = (asset.animations || []).find((clip) => /^idle$/i.test(clip.name || '')) || asset.animations?.[0];

      if (config.animationUrl) {
        const animationAsset = await loadAnimationAsset({ url: config.animationUrl });
        const animationRoot = animationAsset.scene || animationAsset;
        const clips = animationAsset.animations?.length ? animationAsset.animations : (animationRoot.animations || []);
        if (clips.length) {
          const requested = String(config.animationName || 'Idle').trim().toLowerCase();
          const sourceClip = clips.find((clip) => String(clip?.name || '').trim().toLowerCase() === requested)
            || clips.find((clip) => String(clip?.name || '').trim().toLowerCase().includes(requested))
            || clips[0];

          let targetBoneCount = 0;
          secondaryModel.traverse((node) => {
            if (node.isBone) targetBoneCount += 1;
          });

          if (targetBoneCount > 0) {
            let retargeted = sourceClip.clone();
            try {
              retargeted = retargetAvatarClip(animationRoot, secondaryModel, sourceClip);
            } catch (error) {
              console.warn('Adaptive child animation retarget fallback:', error);
            }

            secondaryAction = secondaryMixer.clipAction(retargeted);
            secondaryAction.setLoop(config.loop === false ? THREE.LoopOnce : THREE.LoopRepeat, config.loop === false ? 1 : Infinity);
            secondaryAction.clampWhenFinished = config.loop === false;
            secondaryAction.reset().play();

            if (animationRoot !== secondaryModel) disposeModel(animationRoot);
          } else {
            // The current caieshioa GLB is an unskinned static mesh. Keep the
            // Admin Idle FBX as a hidden motion source and drive a lightweight
            // runtime rig bridge from its Hips/Spine motion. This keeps the
            // exact child model while still using the Admin animation library.
            secondaryMotionRoot = animationRoot;
            secondaryMotionMixer = new THREE.AnimationMixer(secondaryMotionRoot);
            secondaryMotionAction = secondaryMotionMixer.clipAction(sourceClip);
            secondaryMotionAction.setLoop(config.loop === false ? THREE.LoopOnce : THREE.LoopRepeat, config.loop === false ? 1 : Infinity);
            secondaryMotionAction.clampWhenFinished = config.loop === false;
            secondaryMotionAction.reset().play();

            const sourceBones = new Map();
            secondaryMotionRoot.traverse((node) => {
              if (node.isBone) sourceBones.set(normalizeBoneName(node.name), node);
            });

            const hips = sourceBones.get('hips');
            const spine = sourceBones.get('spine')
              || sourceBones.get('spine1')
              || sourceBones.get('spine2')
              || hips;

            if (hips && spine) {
              secondaryMotionBridge = {
                hips,
                spine,
                restHipsPosition: hips.position.clone(),
                restHipsQuaternion: hips.quaternion.clone(),
                restSpineQuaternion: spine.quaternion.clone(),
                basePosition: secondaryModel.position.clone(),
                baseQuaternion: secondaryModel.quaternion.clone(),
              };
            }
          }
        }
      } else if (embeddedIdle) {
        secondaryAction = secondaryMixer.clipAction(embeddedIdle);
        secondaryAction.setLoop(THREE.LoopRepeat, Infinity).play();
      }

      secondaryModel.visible = true;
    } catch (error) {
      console.warn('Adaptive child failed to load in Luna viewer:', error);
      if (secondaryRoot) scene.remove(secondaryRoot);
      if (secondaryModel) disposeModel(secondaryModel);
      if (secondaryMotionRoot) disposeModel(secondaryMotionRoot);
      secondaryRoot = null;
      secondaryModel = null;
      secondaryMixer = null;
      secondaryAction = null;
      secondaryBasePosition = null;
      secondaryMotionRoot = null;
      secondaryMotionMixer = null;
      secondaryMotionAction = null;
      secondaryMotionBridge = null;
    }
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
      const availableClips = asset.animations?.length ? asset.animations : (animationRoot.animations || []);
      if (!availableClips.length) throw new Error('No animation available');
      const requestedClip = String(motion?.clipName || motion?.name || '').trim().toLowerCase();
      const sourceClip = availableClips.find((candidate) => String(candidate?.name || '').trim().toLowerCase() === requestedClip)
        || availableClips.find((candidate) => String(candidate?.name || '').trim().toLowerCase().includes(requestedClip))
        || availableClips[0];
      let clip = sourceClip.clone();
      if (model && runtimeBoneCount > 0) {
        try {
          // Retarget from the source animation skeleton into the actual loaded
          // Artemis/Admin skeleton using each rig's rest pose.
          clip = retargetAvatarClip(animationRoot, model, sourceClip);
        } catch (error) {
          console.warn('Avatar skeleton retarget fallback:', error);
          clip = retargetClipToModel(sourceClip.clone());
        }
      } else {
        clip = retargetClipToModel(sourceClip.clone());
      }
      if (options.lockRootTranslation) {
        // The Admin Idle FBX carries large positional channels (the source Hips
        // sits around Y≈99). Retargeting may rename those channels, so filtering
        // only "Hips.position" is not sufficient. For Artemis creation, keep
        // Idle rotation-only and remove every translation track.
        clip.tracks = clip.tracks.filter((track) => !/\.position$/i.test(track.name));
      } else {
        clip.tracks.forEach((track) => {
          if (/Hips\.position$/i.test(track.name) || /mixamorig:Hips\.position$/i.test(track.name)) {
            for (let index = 0; index < track.values.length; index += 3) {
              track.values[index] = track.values[0];
              track.values[index + 2] = track.values[2];
            }
          }
        });
      }
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

      if (options.autoRigSingleMesh) {
        const rigResult = ensureRuntimeHumanoidRig(model);
        runtimeRigGenerated = Boolean(rigResult?.generated);
      }

      model.traverse((node) => {
        preserveAppearance ||= node.userData?.avatarRig === 'luna-hi3d-v1';
        atomxeRuntimeRig ||= node.userData?.avatarRig === 'atomxe-mixamo-v1';
        if (node.isBone) runtimeBoneCount += 1;
        if (node.isSkinnedMesh) atomxeRuntimeRig = true;
      });
      // Admin-uploaded Artemis is a raw GLB and may not contain Atom XE userData.
      // A real bone hierarchy is sufficient to treat it as an animatable runtime rig.
      if (runtimeBoneCount > 0) atomxeRuntimeRig = true;

      if (options.lockRootTranslation) {
        model.traverse((node) => {
          if (node.isBone) lockedBonePositions.set(node, node.position.clone());
        });
      }

      let box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      model.scale.setScalar(1.8 / (size.y || 1));
      box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.set(-center.x, -box.min.y, -center.z);
      if (Number.isFinite(options.initialYaw)) model.rotation.y = options.initialYaw;
      basePosition = model.position.clone();
      const framingOffsetY = Number(options.framingOffsetY || 0);
      camera.position.set(0, options.portrait ? 1.64 : 1.08, options.portrait ? 1.15 : 3.75);
      controls.target.set(0, (options.portrait ? 1.62 : .96) + framingOffsetY, 0);
      controls.update();

      const materials = [], morphs = [];
      let hood = false, weapon = false, eyes = false, eyelashes = false, hair = false;
      model.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = true;
        node.receiveShadow = true;
        // Poses extend beyond the bind-pose bounds (wave, sitting, lean back).
        if ((preserveAppearance || atomxeRuntimeRig) && node.isSkinnedMesh) node.frustumCulled = false;
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

      model.visible = preserveAppearance || atomxeRuntimeRig;
      scene.add(model);
      mixer = new THREE.AnimationMixer(model);
      applyStyle(appearance);
      applyCompanionAppearance(model, appearance);
      if (preserveAppearance) {
        embeddedController = createEmbeddedAvatarController(model, asset.animations || [], mixer, (state) => onStatus('ready', state.clip));
      } else if (atomxeRuntimeRig) {
        // Both selectable female bodies ship with an embedded Idle fallback and
        // standard Mixamo bone names. Start the fallback immediately so the
        // avatar never appears frozen while an external motion clip is loading.
        const idleClip = (asset.animations || []).find((clip) => /^idle$/i.test(clip.name || '')) || asset.animations?.[0];
        if (idleClip) {
          action = mixer.clipAction(idleClip);
          action.setLoop(THREE.LoopRepeat, Infinity).play();
          onStatus('ready', idleClip.name || 'Idle');
        }
      }
      if (options.secondaryCharacter?.modelUrl) {
        await loadSecondaryCharacter(options.secondaryCharacter);
      }

      onReady({ hi3d: preserveAppearance, runtimeRig: atomxeRuntimeRig, runtimeRigGenerated, boneCount: runtimeBoneCount, faceFit: true, materials: preserveAppearance ? [] : materials, morphs, hood, weapon: preserveAppearance ? false : weapon, eyes: preserveAppearance ? false : eyes, eyelashes, hair: preserveAppearance || hair, embeddedClips: (preserveAppearance || atomxeRuntimeRig) ? (asset.animations || []).map(clip => clip.name) : [] });
      
    } catch (error) {
      console.error('Avatar model failed:', error);
      if (!disposed) onStatus('error');
    }
  })();

  const move = (x = 0, z = 0, distance = .05) => {
    if (!model || !basePosition) return;
    if (paused || (embeddedController && !embeddedController.canMove())) return;

    const previous = model.position.clone();
    model.position.x = THREE.MathUtils.clamp(model.position.x + (x * distance), basePosition.x - 1.65, basePosition.x + 1.65);
    model.position.z = THREE.MathUtils.clamp(model.position.z + (z * distance), basePosition.z - 1.05, basePosition.z + 1.05);

    if (secondaryRoot) {
      secondaryRoot.position.x += model.position.x - previous.x;
      secondaryRoot.position.z += model.position.z - previous.z;
    }

    if (x || z) {
      const yaw = Math.atan2(x, z);
      model.rotation.y = yaw;
      if (secondaryRoot) secondaryRoot.rotation.y = yaw;
    }
  };
  const resetPosition = () => {
    if (model && basePosition) {
      model.position.copy(basePosition);
      model.rotation.y = 0;
    }
    if (secondaryRoot && secondaryBasePosition) {
      secondaryRoot.position.copy(secondaryBasePosition);
      secondaryRoot.rotation.y = 0;
    }
  };
  const setPaused = (value) => {
    paused = Boolean(value);
    if (mixer) mixer.timeScale = paused ? 0 : 1;
    if (secondaryMixer) secondaryMixer.timeScale = paused ? 0 : 1;
    if (secondaryMotionMixer) secondaryMotionMixer.timeScale = paused ? 0 : 1;
    return paused;
  };
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
    rotate: (amount) => {
      if (model) model.rotation.y += amount;
      if (secondaryRoot) secondaryRoot.rotation.y += amount;
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility?.disconnect();
      controls.dispose();
      embeddedController?.dispose();
      mixer?.stopAllAction();
      secondaryMixer?.stopAllAction();
      secondaryMotionMixer?.stopAllAction();

      if (secondaryRoot) scene.remove(secondaryRoot);
      if (secondaryModel) disposeModel(secondaryModel);
      if (secondaryMotionRoot) disposeModel(secondaryMotionRoot);
      secondaryRoot = null;
      secondaryModel = null;
      secondaryMixer = null;
      secondaryAction = null;
      secondaryBasePosition = null;
      secondaryMotionRoot = null;
      secondaryMotionMixer = null;
      secondaryMotionAction = null;
      secondaryMotionBridge = null;

      disposeModel(model);
      shadowPlane.geometry.dispose();
      shadowMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
