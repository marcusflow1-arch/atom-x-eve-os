import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * YBotPlayerViewer
 * Loads Y Bot FBX + separate animation FBXs, then executes the PlayerController
 * script so keyboard input (WASD/Shift/Space) drives the character.
 */

const MODEL_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/608211a0f_YBot1.fbx';

const ANIMATION_MAP = {
  idle: {
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/9922e6dd0_Idle.fbx',
    loop: true,
  },
  run: {
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/4edd51169_Running.fbx',
    loop: true,
  },
  walk: {
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/4edd51169_Running.fbx',
    loop: true,
    timeScale: 0.5, // slow run = walk
  },
  jump: {
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/b1e388a25_Jumping.fbx',
    loop: false,
  },
  roll: {
    url: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/b105df4c7_SprintingForwardRoll.fbx',
    loop: false,
  },
};

export default function YBotPlayerViewer({ className, style }) {
  const canvasRef = useRef(null);
  const cleanupRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ─── RENDERER ───
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // ─── SCENE ───
    const scene = new THREE.Scene();
    scene.background = null;

    // ─── CAMERA ───
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    // ─── CONTROLS ───
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.target.set(0, 1, 0);

    // Right-click drag to orbit, scroll wheel to zoom
    controls.mouseButtons = {
      LEFT: null,               // disable left-click orbit (used for canvas focus)
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    controls.enableZoom = true;
    controls.enablePan = false;  // disable pan to keep camera centred on character
    controls.minDistance = 2;
    controls.maxDistance = 20;

    // ─── LIGHTING ───
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(2, 3, 2);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(-2, 2, -1);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
    rimLight.position.set(0, 1.5, -3);
    scene.add(rimLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // Ground grid for spatial reference
    const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    scene.add(grid);

    // ─── LOADER ───
    const fbxLoader = new FBXLoader();
    let mixer = null;
    const actions = {};
    let model = null;
    const clock = new THREE.Clock();
    const updateCallbacks = [];
    const cleanupCallbacks = [];

    const registerUpdate = (fn) => updateCallbacks.push(fn);
    const registerCleanup = (fn) => cleanupCallbacks.push(fn);

    // Load model first, then animations, then attach the script
    fbxLoader.load(MODEL_URL, (fbx) => {
      model = fbx;

      // Scale & position
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      model.scale.setScalar(scale);
      model.position.set(0, 0, 0);

      // Fix materials
      model.traverse((node) => {
        if (node.isMesh && node.material) {
          node.material.side = THREE.DoubleSide;
          node.material.envMapIntensity = 1.2;
          node.material.needsUpdate = true;
        }
      });

      scene.add(model);
      mixer = new THREE.AnimationMixer(model);

      // Play any embedded idle animation while external ones load
      if (fbx.animations && fbx.animations.length > 0) {
        const embeddedAction = mixer.clipAction(fbx.animations[0]);
        embeddedAction.play();
        actions['_embedded'] = embeddedAction;
      }

      // Load all external animations
      const entries = Object.entries(ANIMATION_MAP);
      let loaded = 0;

      entries.forEach(([name, cfg]) => {
        fbxLoader.load(cfg.url, (animFbx) => {
          if (animFbx.animations && animFbx.animations.length > 0) {
            const clip = animFbx.animations[0];
            clip.name = name;
            const action = mixer.clipAction(clip);

            if (!cfg.loop) {
              action.setLoop(THREE.LoopOnce);
              action.clampWhenFinished = true;
            }
            if (cfg.timeScale) {
              action.setEffectiveTimeScale(cfg.timeScale);
            }

            actions[name] = action;
          }

          loaded++;
          if (loaded === entries.length) {
            // All animations loaded — execute the controller script
            executePlayerController();
          }
        }, undefined, () => {
          loaded++;
          if (loaded === entries.length) executePlayerController();
        });
      });
    }, undefined, (err) => console.error('Error loading Y Bot model:', err));

    function executePlayerController() {
      if (!model || !mixer) return;

      // Stop the embedded anim so controller takes over
      if (actions['_embedded']) {
        actions['_embedded'].fadeOut(0.3);
      }

      // ──── INLINE PLAYER CONTROLLER (matches DB script) ────
      console.log("PlayerController Active on:", model.name);

      const WALK_SPEED = 2.5;
      const RUN_SPEED = 6.0;
      const ROTATION_SMOOTHING = 0.15;
      const BLEND_DURATION = 0.2;

      const keys = { w: false, a: false, s: false, d: false, shift: false, space: false };
      let currentActionName = 'idle';

      // Setup jump as LoopOnce
      if (actions.jump) {
        actions.jump.setLoop(THREE.LoopOnce);
        actions.jump.clampWhenFinished = true;
      }
      if (actions.roll) {
        actions.roll.setLoop(THREE.LoopOnce);
        actions.roll.clampWhenFinished = true;
      }

      // Start with idle
      if (actions.idle) {
        actions.idle.reset().fadeIn(0.2).play();
        currentActionName = 'idle';
      }

      const onKeyDown = (e) => {
        if (e.target.matches('input, textarea')) return;
        const k = e.key.toLowerCase();
        if (k === 'w') keys.w = true;
        if (k === 'a') keys.a = true;
        if (k === 's') keys.s = true;
        if (k === 'd') keys.d = true;
        if (k === 'shift') keys.shift = true;
        if (k === ' ') {
          if (!keys.space && actions.jump) {
            actions.jump.reset().fadeIn(0.1).play();
          }
          keys.space = true;
          e.preventDefault();
        }
        if (k === 'q') {
          // Roll
          if (actions.roll) {
            actions.roll.reset().fadeIn(0.1).play();
          }
        }
      };

      const onKeyUp = (e) => {
        const k = e.key.toLowerCase();
        if (k === 'w') keys.w = false;
        if (k === 'a') keys.a = false;
        if (k === 's') keys.s = false;
        if (k === 'd') keys.d = false;
        if (k === 'shift') keys.shift = false;
        if (k === ' ') keys.space = false;
      };

      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);

      registerCleanup(() => {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        Object.values(actions).forEach(a => a?.stop());
      });

      registerUpdate((delta) => {
        if (!model || !camera || !controls) return;

        const isMoving = keys.w || keys.a || keys.s || keys.d;
        const isRunning = keys.shift;

        if (isMoving) {
          const speed = isRunning ? RUN_SPEED : WALK_SPEED;

          // Camera-relative direction
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
          forward.y = 0;
          forward.normalize();

          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
          right.y = 0;
          right.normalize();

          const moveVec = new THREE.Vector3();
          if (keys.w) moveVec.add(forward);
          if (keys.s) moveVec.sub(forward);
          if (keys.d) moveVec.add(right);
          if (keys.a) moveVec.sub(right);

          if (moveVec.lengthSq() > 0) {
            moveVec.normalize();
            model.position.addScaledVector(moveVec, speed * delta);

            // Smooth rotation
            const targetRotation = Math.atan2(moveVec.x, moveVec.z);
            const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetRotation);
            model.quaternion.slerp(targetQuat, ROTATION_SMOOTHING);
          }
        }

        // Camera tracks model
        if (controls) {
          const currentTarget = controls.target.clone();
          controls.target.lerp(model.position.clone().add(new THREE.Vector3(0, 1, 0)), 0.1);
          const targetDelta = new THREE.Vector3().subVectors(controls.target, currentTarget);
          camera.position.add(targetDelta);
        }

        // Animation state machine
        let targetActionName = 'idle';
        if (isMoving) targetActionName = isRunning ? 'run' : 'walk';

        if (targetActionName !== currentActionName) {
          const nextAction = actions[targetActionName];
          const prevAction = actions[currentActionName];

          if (nextAction) {
            nextAction.enabled = true;
            nextAction.setEffectiveTimeScale(targetActionName === 'walk' ? 0.5 : 1);
            nextAction.setEffectiveWeight(1);
            nextAction.reset().fadeIn(BLEND_DURATION).play();

            if (prevAction) {
              prevAction.fadeOut(BLEND_DURATION);
            }

            currentActionName = targetActionName;
          }
        }
      });
    }

    // ─── RENDER LOOP ───
    let frameId;
    function animate() {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (mixer) mixer.update(delta);
      updateCallbacks.forEach((fn) => fn(delta));
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // ─── RESIZE ───
    const handleResize = () => {
      if (!canvas.parentElement) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // Focus canvas for keyboard
    canvas.setAttribute('tabindex', '1');
    canvas.addEventListener('click', () => canvas.focus());

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      cleanupCallbacks.forEach((fn) => fn());
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className || 'w-full h-full'}
      style={{
        background: 'transparent',
        outline: 'none',
        cursor: 'grab',
        ...style,
      }}
    />
  );
}