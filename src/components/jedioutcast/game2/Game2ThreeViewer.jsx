import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { Loader2, Zap, Shield, Swords, HeartPulse, Wind, Hand, Brain, ArrowUp } from 'lucide-react';
import { useGameAvatar } from '@/components/game3d/useGameAvatar';
import { loadAvatarModel, disposeAvatarModel } from '@/components/onboarding/avatarAssetRuntime';
import { loadPlayerAnimationClips } from '@/components/game3d/player/playerAnimationLibrary';
import { createPlayerAnimationController } from '@/components/game3d/player/PlayerAnimationController';
import { CorePlayerStateMachine } from '@/components/game3d/player/CorePlayerStateMachine';
import { PlayerMovementSystem, PlayerRotationSystem } from '@/components/game3d/player/PlayerMovementSystem';
import { PlayerCameraSystem } from '@/components/game3d/player/PlayerCameraSystem';
import { Game2JediController, GAME2_FORCE_POWERS } from './Game2JediController';

const POWER_ICONS = {
  heal: HeartPulse,
  jump: ArrowUp,
  speed: Wind,
  push: Hand,
  pull: Hand,
  telepathy: Brain,
  grip: Hand,
  lightning: Zap,
  saberThrow: Swords,
  saberDefense: Shield,
  saberOffense: Swords,
};

function normalizeAnimationName(value = '') {
  return value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function extendClipMap(model, clipsByKey) {
  const clips = model?.animations || [];
  const find = (...patterns) => clips.find((clip) => {
    const name = normalizeAnimationName(clip.name);
    return patterns.some((pattern) => pattern.test(name));
  });

  const mappings = [
    ['attack', /saber.*attack/, /slash/, /swing/, /attack/],
    ['jumpStart', /jump.*start/, /^jump$/],
    ['jumpLoop', /jump.*loop/, /jump.*air/, /^jump$/],
    ['jumpLand', /jump.*land/, /land/],
    ['blockHold', /block.*hold/, /^block$/],
    ['roll', /roll/],
    ['dodge', /dodge/],
    ['hurt', /hurt/, /hit.*react/],
  ];

  for (const [key, ...patterns] of mappings) {
    if (!clipsByKey[key]) {
      const clip = find(...patterns);
      if (clip) clipsByKey[key] = clip;
    }
  }

  clipsByKey.attack ||= clipsByKey.drawArrow;
  return clipsByKey;
}

function createTrainingTarget(position, color) {
  const group = new THREE.Group();
  group.position.copy(position);

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x343b46,
    metalness: 0.7,
    roughness: 0.35,
    transparent: false,
    opacity: 1,
  });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.15, 6, 10), bodyMaterial);
  body.position.y = 0.82;
  body.castShadow = true;
  group.add(body);

  const coreMaterial = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.8,
    metalness: 0.3,
    roughness: 0.22,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), coreMaterial);
  core.position.y = 1.05;
  group.add(core);

  return {
    group,
    body,
    core,
    velocity: new THREE.Vector3(),
    baseY: position.y,
    baseCoreColor: color,
    gripTimer: 0,
    mindTimer: 0,
    flashTimer: 0,
  };
}

function disposeScene(root) {
  root.traverse((node) => {
    node.geometry?.dispose?.();
    const mats = node.material ? (Array.isArray(node.material) ? node.material : [node.material]) : [];
    mats.forEach((material) => material?.dispose?.());
  });
}

export default function Game2ThreeViewer() {
  const avatarConfig = useGameAvatar();
  const containerRef = useRef(null);
  const runtimeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPower, setSelectedPower] = useState(GAME2_FORCE_POWERS.find((power) => power.id === 'push'));
  const [status, setStatus] = useState('Game 3D camera active');

  useEffect(() => {
    if (!containerRef.current) return undefined;
    let disposed = false;
    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05080d);
    scene.fog = new THREE.Fog(0x05080d, 18, 42);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Intentionally identical to the working GameWorld3D camera initialization.
    const camera = new THREE.PerspectiveCamera(
      55,
      (container.clientWidth || 1) / (container.clientHeight || 1),
      0.1,
      3200,
    );
    camera.position.set(0, 3, -5);

    const orbit = { current: { yaw: 0, pitch: 0.4, distance: 4.5 } };
    const keys = { current: {} };
    const modelRef = { current: null };
    const playerAnimRef = { current: null };
    const lockOnTargetRef = { current: null };
    const oneShotRef = { current: false };

    const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x273142, 1.15);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(8, 14, -4);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x5ed8ff, 1.25);
    rim.position.set(-7, 6, 8);
    scene.add(rim);

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x111821,
      metalness: 0.15,
      roughness: 0.82,
    });
    const ground = new THREE.Mesh(new THREE.CircleGeometry(15, 64), groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(30, 30, 0x28475a, 0x142530);
    grid.position.y = 0.006;
    scene.add(grid);

    const targetDefs = [
      createTrainingTarget(new THREE.Vector3(0, 0, 5.5), 0xff756c),
      createTrainingTarget(new THREE.Vector3(-4.8, 0, 2.8), 0xffb45e),
      createTrainingTarget(new THREE.Vector3(4.8, 0, 2.8), 0xae78ff),
    ];
    targetDefs.forEach((target) => scene.add(target.group));
    lockOnTargetRef.current = targetDefs[0];

    // IMPORTANT: this is the existing working Game 3D camera class. It is not modified.
    const playerCameraSystem = new PlayerCameraSystem({
      camera,
      orbit,
      modelRef,
      lockOnTargetRef,
    });
    const playerStateMachine = new CorePlayerStateMachine();

    let model = null;
    let mixer = null;
    let playerMovementSystem = null;
    let playerRotationSystem = null;
    let jediController = null;
    let frameId = 0;
    const clock = new THREE.Clock();

    const activeStatusTimer = { id: 0 };
    const reportStatus = (text) => {
      if (disposed) return;
      setStatus(text);
      clearTimeout(activeStatusTimer.id);
      activeStatusTimer.id = setTimeout(() => {
        if (!disposed) setStatus('Game 3D camera active');
      }, 1800);
    };

    const attachPlayer = async () => {
      try {
        model = await loadAvatarModel(avatarConfig, 1.7);
        if (disposed) {
          disposeAvatarModel(model);
          return;
        }
        model.position.set(0, 0, 0);
        model.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = !node.isSkinnedMesh;
            node.receiveShadow = true;
          }
        });
        scene.add(model);
        modelRef.current = model;

        mixer = new THREE.AnimationMixer(model);
        const playerAnim = createPlayerAnimationController({ mixer, oneShotRef });
        playerAnimRef.current = playerAnim;

        const { clipsByKey } = await loadPlayerAnimationClips(new FBXLoader(), model);
        if (disposed) return;
        extendClipMap(model, clipsByKey);
        playerAnim.bindClips(clipsByKey);

        playerMovementSystem = new PlayerMovementSystem({
          keys,
          orbit,
          modelRef,
          stateMachine: playerStateMachine,
          sampleGroundY: () => 0,
          playerAnim: playerAnimRef,
          getSpeed: () => 4.8,
          arenaRadius: 13.25,
        });
        playerRotationSystem = new PlayerRotationSystem({
          modelRef,
          keys,
          stateMachine: playerStateMachine,
          lockOnTargetRef,
        });

        jediController = new Game2JediController({
          scene,
          modelRef,
          playerAnimRef,
          targets: targetDefs,
          onSelectedPower: (power) => {
            if (!disposed) setSelectedPower(power);
          },
          onStatus: reportStatus,
        });
        jediController.attachModel(model);
        runtimeRef.current = { jediController };

        setLoading(false);
      } catch (cause) {
        console.error('Game 2 Three.js player sandbox failed to load:', cause);
        if (!disposed) {
          setError(cause?.message || String(cause));
          setLoading(false);
        }
      }
    };

    attachPlayer();

    const directForceKey = (event) => {
      if (!jediController) return false;
      if (jediController.handleDirectKey(event.code)) {
        event.preventDefault();
        return true;
      }
      return false;
    };

    const onKeyDown = (event) => {
      if (event.target?.matches?.('input, textarea, select, button')) return;
      const keyName = event.key.toLowerCase();
      keys.current[keyName] = true;

      if (event.code === 'Space') {
        jediController?.forceJump();
        event.preventDefault();
        return;
      }
      if (directForceKey(event)) return;
      if (keyName === 'z') {
        jediController?.cyclePower(-1);
        event.preventDefault();
      } else if (keyName === 'x') {
        jediController?.cyclePower(1);
        event.preventDefault();
      } else if (keyName === 'f') {
        jediController?.cast();
        event.preventDefault();
      }
    };

    const onKeyUp = (event) => {
      keys.current[event.key.toLowerCase()] = false;
    };

    const drag = { active: false, x: 0, y: 0, moved: false };
    const onMouseDown = (event) => {
      if (event.button === 0) {
        jediController?.attack();
        event.preventDefault();
      } else if (event.button === 2) {
        drag.active = true;
        drag.x = event.clientX;
        drag.y = event.clientY;
        drag.moved = false;
        event.preventDefault();
      }
    };
    const onMouseMove = (event) => {
      if (!drag.active) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.x = event.clientX;
      drag.y = event.clientY;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) drag.moved = true;

      // Same camera orbit values used by GameWorld3D.
      orbit.current.yaw -= dx * 0.005;
      orbit.current.pitch = Math.max(0.1, Math.min(Math.PI / 2.2, orbit.current.pitch + dy * 0.005));
    };
    const onMouseUp = (event) => {
      if (event.button === 2 && !drag.moved) jediController?.block();
      drag.active = false;
      drag.moved = false;
    };
    const onWheel = (event) => {
      orbit.current.distance = Math.max(2, Math.min(12, orbit.current.distance + event.deltaY * 0.003));
      event.preventDefault();
    };
    const onContextMenu = (event) => event.preventDefault();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('contextmenu', onContextMenu);

    const resize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', resize);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    observer?.observe(container);

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);

      if (mixer) mixer.update(delta);
      if (model && playerMovementSystem && playerRotationSystem && jediController) {
        const multiplier = jediController.getSpeedMultiplier();
        playerMovementSystem.walkSpeed = 4.8 * multiplier;
        playerMovementSystem.runSpeed = 8.0 * multiplier;
        playerMovementSystem.sprintSpeed = 10.8 * multiplier;

        const intent = playerMovementSystem.update(delta);
        playerStateMachine.update(delta);
        playerRotationSystem.update(delta, intent, orbit);

        playerAnimRef.current?.updateActionState?.({
          moving: intent.moveAmount > 0,
          running: intent.runHeld,
          sprinting: intent.sprintHeld,
          direction: intent.direction,
        });

        jediController.update(delta);

        // The camera is updated last by the unchanged Game 3D camera system.
        playerCameraSystem.update(delta, intent);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      clearTimeout(activeStatusTimer.id);
      cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);

      jediController?.dispose();
      runtimeRef.current = null;
      if (model) {
        scene.remove(model);
        disposeAvatarModel(model);
      }
      targetDefs.forEach((target) => disposeScene(target.group));
      ground.geometry.dispose();
      groundMaterial.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [avatarConfig.model_url]);

  const selectPower = (power) => {
    runtimeRef.current?.jediController?.selectPower(power.id);
    setSelectedPower(power);
  };

  const castSelected = () => runtimeRef.current?.jediController?.cast(selectedPower?.id);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#05080d]">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-cyan-200/10 bg-black/55 px-4 py-3 backdrop-blur-md">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
          Game 2 · Game 3D camera
        </div>
        <div className="mt-1 text-xs text-white/65">
          WASD move · Shift run · Ctrl sprint · Space Force Jump · Left click saber · Right drag camera
        </div>
        <div className="mt-1 text-[11px] text-white/40">
          F1–F7 direct Force · Z/X cycle · F cast selected · Right-click tap block
        </div>
      </div>

      <div className="pointer-events-none absolute right-4 top-4 rounded-lg border border-white/10 bg-black/55 px-3 py-2 text-xs text-white/70 backdrop-blur-md">
        {status}
      </div>

      <div className="absolute bottom-4 left-1/2 z-20 w-[min(1050px,calc(100%-24px))] -translate-x-1/2">
        <div className="rounded-2xl border border-white/10 bg-[#071019]/82 p-3 shadow-2xl backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Force Power
              </div>
              <div className="text-sm font-semibold text-cyan-100">{selectedPower?.label}</div>
            </div>
            <button
              type="button"
              onClick={castSelected}
              className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/18"
            >
              Cast · F
            </button>
          </div>

          <div className="grid grid-cols-6 gap-1.5 max-lg:grid-cols-4 max-md:grid-cols-3">
            {GAME2_FORCE_POWERS.map((power) => {
              const Icon = POWER_ICONS[power.id] || Zap;
              const active = selectedPower?.id === power.id;
              return (
                <button
                  key={power.id}
                  type="button"
                  onClick={() => selectPower(power)}
                  onDoubleClick={() => runtimeRef.current?.jediController?.cast(power.id)}
                  className={`flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${active
                    ? 'border-cyan-300/40 bg-cyan-300/14 text-cyan-50'
                    : 'border-white/8 bg-white/[0.035] text-white/55 hover:border-white/15 hover:bg-white/[0.07]'}`}
                  title={`${power.label} · ${power.source}${power.directKey ? ` · ${power.directKey}` : ''}`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0 truncate text-[11px]">{power.label}</span>
                  {power.directKey && (
                    <span className="ml-auto shrink-0 text-[9px] text-white/30">{power.directKey}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-white/70">
            <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
            <span className="text-sm">Loading active Game 3D avatar…</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 grid place-items-center bg-black/75 p-8">
          <div className="max-w-xl rounded-xl border border-red-300/20 bg-red-950/20 p-5 text-sm text-red-100">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
