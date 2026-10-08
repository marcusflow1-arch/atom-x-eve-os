import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { Loader2 } from 'lucide-react';
import { PlayerCameraSystem } from '@/components/game3d/player/PlayerCameraSystem';
import { createYBotJediAnimationAdapter } from './YBotJediAnimationAdapter';
import { JediOutcastYBotController } from './JediOutcastYBotController';
import { JediEnemyAI } from './JediEnemyAI';
import JediForceSelector from './JediForceSelector';
import { resolveYBotModelAsset } from './YBotModelResolver';

function normalizeYBot(model, height = 1.8) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const scale = height / Math.max(0.001, size.y);
  model.scale.multiplyScalar(scale);
  model.updateMatrixWorld(true);
  const normalized = new THREE.Box3().setFromObject(model);
  const center = normalized.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -normalized.min.y, -center.z);
  model.traverse((node) => {
    if (node.isSkinnedMesh) node.frustumCulled = false;
    if (node.isMesh) {
      node.castShadow = !node.isSkinnedMesh;
      node.receiveShadow = true;
    }
  });
  return model;
}

function disposeModel(model) {
  const materials = new Set();
  const geometries = new Set();
  const textures = new Set();
  model?.traverse?.((node) => {
    if (node.geometry) geometries.add(node.geometry);
    const mats = node.material ? (Array.isArray(node.material) ? node.material : [node.material]) : [];
    mats.forEach((material) => materials.add(material));
  });
  materials.forEach((material) => {
    Object.values(material || {}).forEach((value) => {
      if (value?.isTexture) textures.add(value);
    });
    material?.dispose?.();
  });
  geometries.forEach((geometry) => geometry?.dispose?.());
  textures.forEach((texture) => texture?.dispose?.());
}

export default function Game2ThreeViewer() {
  const containerRef = useRef(null);
  const runtimeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedForce, setSelectedForce] = useState({ id: 'push', label: 'Push' });
  const [forceHudVisible, setForceHudVisible] = useState(false);
  const [status, setStatus] = useState('Raven player controller · Y Bot rig');
  const [vitals, setVitals] = useState({ health: 100, maxHealth: 100, force: 100 });

  useEffect(() => {
    if (!containerRef.current) return undefined;
    let disposed = false;
    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05080d);
    scene.fog = new THREE.Fog(0x05080d, 18, 44);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // CAMERA CONTRACT: this is the already-working Game 3D camera setup.
    // The Jedi controller below receives only getViewYaw(); it never owns/mutates this camera.
    const camera = new THREE.PerspectiveCamera(55, (container.clientWidth || 1) / (container.clientHeight || 1), 0.1, 3200);
    camera.position.set(0, 3, -5);
    const orbit = { current: { yaw: 0, pitch: 0.4, distance: 4.5 } };
    const modelRef = { current: null };
    const lockOnTargetRef = { current: null };
    const playerCameraSystem = new PlayerCameraSystem({ camera, orbit, modelRef, lockOnTargetRef });

    scene.add(new THREE.HemisphereLight(0xcfe4ff, 0x273142, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(8, 14, -4);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x5ed8ff, 1.25);
    rim.position.set(-7, 6, 8);
    scene.add(rim);

    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x111821, metalness: 0.12, roughness: 0.86 });
    const ground = new THREE.Mesh(new THREE.CircleGeometry(16, 64), groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    const grid = new THREE.GridHelper(32, 32, 0x28475a, 0x142530);
    grid.position.y = 0.006;
    scene.add(grid);

    let player = null;
    let playerAnimation = null;
    let controller = null;
    let enemyModel = null;
    let enemyAnimation = null;
    let enemyAI = null;
    let frameId = 0;
    let hudTimer = 0;
    const clock = new THREE.Clock();
    const loader = new FBXLoader();

    const showForceSelection = (power, showHud) => {
      if (disposed) return;
      setSelectedForce(power);
      if (showHud) {
        setForceHudVisible(true);
        clearTimeout(hudTimer);
        hudTimer = window.setTimeout(() => {
          if (!disposed) setForceHudVisible(false);
        }, 2500);
      }
    };

    const reportStatus = (text) => {
      if (!disposed && text) setStatus(text);
    };

    const boot = async () => {
      try {
        const yBotAsset = await resolveYBotModelAsset();
        reportStatus(`Loading Admin model · ${yBotAsset.name}`);
        player = normalizeYBot(await loader.loadAsync(yBotAsset.file_url), 1.8);
        if (disposed) return;
        scene.add(player);
        modelRef.current = player;

        playerAnimation = await createYBotJediAnimationAdapter(player);
        if (disposed) return;

        enemyModel = normalizeYBot(await loader.loadAsync(yBotAsset.file_url), 1.8);
        if (disposed) return;
        enemyModel.position.set(0, 0, 6);
        enemyModel.traverse((node) => {
          if (!node.isMesh) return;
          const mats = node.material ? (Array.isArray(node.material) ? node.material : [node.material]) : [];
          mats.forEach((material) => {
            if (material?.color) material.color.multiplyScalar(0.62);
          });
        });
        scene.add(enemyModel);
        enemyAnimation = await createYBotJediAnimationAdapter(enemyModel);

        enemyAI = new JediEnemyAI({
          model: enemyModel,
          animation: enemyAnimation,
          playerRef: modelRef,
          onAttack: () => controller?.takeDamage(10),
          onForcePush: () => {
            if (!controller || !player) return;
            const direction = new THREE.Vector3().subVectors(player.position, enemyModel.position).setY(0).normalize();
            controller.velocity.addScaledVector(direction, 4.25);
            reportStatus('Enemy Jedi used Force Push');
          },
        });

        controller = new JediOutcastYBotController({
          scene,
          modelRef,
          animation: playerAnimation,
          getViewYaw: () => orbit.current.yaw,
          enemies: [enemyAI],
          onForceSelect: showForceSelection,
          onStatus: reportStatus,
          onHealth: (next) => {
            if (!disposed) setVitals(next);
          },
        });
        runtimeRef.current = { controller, enemyAI };
        controller.attachCanonicalSaber();
        reportStatus(`Y Bot loaded from Admin Model3D · ${yBotAsset.name}`);
        setLoading(false);
      } catch (cause) {
        console.error('Game 2 Y Bot Jedi reconstruction failed:', cause);
        if (!disposed) {
          setError(cause?.message || String(cause));
          setLoading(false);
        }
      }
    };
    boot();

    const onKeyDown = (event) => {
      if (event.target?.matches?.('input, textarea, select, button')) return;
      if (controller?.handleKeyDown(event)) event.preventDefault();
    };
    const onKeyUp = (event) => controller?.handleKeyUp(event);

    const drag = { active: false, x: 0, y: 0, moved: false };
    const onMouseDown = (event) => {
      if (event.button === 0) {
        controller?.primaryAttack();
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
      orbit.current.yaw -= dx * 0.005;
      orbit.current.pitch = Math.max(0.1, Math.min(Math.PI / 2.2, orbit.current.pitch + dy * 0.005));
    };
    const onMouseUp = (event) => {
      if (event.button === 2 && !drag.moved) controller?.altAttack();
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
      playerAnimation?.update(delta);
      enemyAnimation?.update(delta);

      if (controller && player) {
        const cameraIntent = controller.update(delta);
        const enemyTimeScale = controller.forceSpeedTimer > 0 ? 0.25 : 1;
        enemyAI?.update(delta, enemyTimeScale);

        // Existing camera remains the final authority and is not rewritten by the Jedi controller.
        playerCameraSystem.update(delta, cameraIntent);
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      clearTimeout(hudTimer);
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
      controller?.dispose();
      playerAnimation?.dispose();
      enemyAnimation?.dispose();
      if (player) {
        scene.remove(player);
        disposeModel(player);
      }
      if (enemyModel) {
        scene.remove(enemyModel);
        disposeModel(enemyModel);
      }
      ground.geometry.dispose();
      groundMaterial.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#05080d]">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-xl border border-cyan-200/10 bg-black/55 px-4 py-3 backdrop-blur-md">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
          Game 2 · Y Bot + Raven player source
        </div>
        <div className="mt-1 text-xs text-white/65">
          WASD move · Shift walk/run modifier · Space / hold Force Jump · Mouse 1 saber · Mouse 2 tap saber throw
        </div>
        <div className="mt-1 text-[11px] text-white/40">
          Right-drag camera · Z/X Force select · F use Force · F1–F7 direct powers · L saber style
        </div>
      </div>

      <div className="pointer-events-none absolute right-4 top-4 z-20 min-w-52 rounded-xl border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-md">
        <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">Player</div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-red-300/80" style={{ width: `${Math.max(0, Math.min(100, vitals.health / vitals.maxHealth * 100))}%` }} />
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-cyan-300/80" style={{ width: `${Math.max(0, Math.min(100, vitals.force))}%` }} />
        </div>
        <div className="mt-2 text-[10px] text-white/50">{status}</div>
      </div>

      <JediForceSelector selectedId={selectedForce.id} visible={forceHudVisible} />

      {loading && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/55 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-white/70">
            <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
            <span className="text-sm">Loading Y Bot + Jedi Outcast controller…</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black/80 p-8">
          <div className="max-w-xl rounded-xl border border-red-300/20 bg-red-950/20 p-5 text-sm text-red-100">{error}</div>
        </div>
      )}
    </div>
  );
}
