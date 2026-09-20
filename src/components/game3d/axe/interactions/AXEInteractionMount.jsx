import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { AXEInteractionSystem, createAXEInteractable } from './AXEInteractionSystem';

function makeMarker(scene, { id, position, color = 0x63d5ff, size = [1.2, 1.6, 1.2] }) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.15 }),
  );
  mesh.name = id;
  mesh.position.set(position.x, position.y + size[1] / 2, position.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

export default function AXEInteractionMount() {
  const [snapshot, setSnapshot] = useState({ target: null, count: 0 });

  useEffect(() => {
    let disposed = false;
    let raf = 0;
    let setupTimer = 0;
    let scene = null;
    const createdMeshes = [];

    const system = new AXEInteractionSystem();
    window.__axeInteractions = system;
    const unsubscribe = system.subscribe(setSnapshot);

    const registerWorldPrototype = ({
      id, name, type, position, prompt, priority = 0, color, size, onInteract, metadata = {},
    }) => {
      const marker = makeMarker(scene, { id, position, color, size });
      createdMeshes.push(marker);
      const item = createAXEInteractable({
        id, name, type, position, prompt, priority, metadata,
        onInteract: async (ctx) => onInteract?.({ ...ctx, marker }),
      });
      system.register(item);
      return item;
    };

    const setup = () => {
      if (disposed || scene) return;
      scene = window.__gw3dScene;
      if (!scene) return;

      registerWorldPrototype({
        id: 'AXE_Interact_NPC_Guide',
        name: 'Capital Guide',
        type: 'Talk',
        position: { x: -6, y: 0, z: -30 },
        prompt: 'Talk to Capital Guide',
        priority: 10,
        color: 0x65b7ff,
        onInteract: () => {
          window.dispatchEvent(new CustomEvent('axeNPCDialogueRequested', {
            detail: { npcId: 'AXE_NPC_CapitalGuide', name: 'Capital Guide' },
          }));
        },
      });

      registerWorldPrototype({
        id: 'AXE_Interact_Door_Test',
        name: 'Workshop Door',
        type: 'Open',
        position: { x: 7, y: 0, z: -30 },
        prompt: 'Open Workshop Door',
        color: 0x8a6c4a,
        size: [1.4, 2.4, 0.3],
        onInteract: ({ item, marker }) => {
          const opening = item.metadata.open !== true;
          item.metadata.open = opening;
          item.type = opening ? 'Close' : 'Open';
          item.prompt = `${opening ? 'Close' : 'Open'} Workshop Door`;
          marker.rotation.y = opening ? Math.PI / 2 : 0;
          return { state: 'idle' };
        },
        metadata: { open: false },
      });

      registerWorldPrototype({
        id: 'AXE_Interact_CapitalGate',
        name: 'Capital Gate',
        type: 'Open',
        position: { x: 0, y: 0, z: 68 },
        prompt: 'Open Capital Gate',
        priority: 4,
        color: 0x52667a,
        size: [8, 8, 1],
        onInteract: ({ item, marker }) => {
          const opening = item.metadata.open !== true;
          item.metadata.open = opening;
          item.type = opening ? 'Close' : 'Open';
          item.prompt = `${opening ? 'Close' : 'Open'} Capital Gate`;
          marker.position.y = opening ? 8.5 : 4;
          window.dispatchEvent(new CustomEvent('axeGateStateChanged', {
            detail: { id: item.id, open: opening },
          }));
          return { state: 'idle' };
        },
        metadata: { open: false, futureSiegeHealth: true },
      });

      registerWorldPrototype({
        id: 'AXE_Interact_Blacksmith',
        name: 'Blacksmith Services',
        type: 'Craft',
        position: { x: -12, y: 0, z: -22 },
        prompt: 'Open Blacksmith Services',
        priority: 5,
        color: 0xe3a54f,
        onInteract: () => {
          window.dispatchEvent(new CustomEvent('axeServiceRequested', {
            detail: { service: 'blacksmith' },
          }));
        },
      });

      registerWorldPrototype({
        id: 'AXE_Interact_Chest',
        name: 'Training Chest',
        type: 'Open',
        position: { x: 13, y: 0, z: -22 },
        prompt: 'Open Training Chest',
        color: 0xb4864b,
        size: [1.4, 0.8, 0.9],
        onInteract: ({ item, marker }) => {
          item.metadata.open = true;
          item.type = 'Inspect';
          item.prompt = 'Inspect Training Chest';
          marker.rotation.x = -0.2;
          window.dispatchEvent(new CustomEvent('axeContainerOpened', {
            detail: { containerId: item.id },
          }));
          return { state: 'idle' };
        },
        metadata: { open: false },
      });

      const teleports = [
        {
          id: 'AXE_Interact_Teleport_Starter',
          name: 'Settlement Teleport',
          position: { x: -18, y: 0, z: -18 },
          target: { x: -500, z: 650, spawnId: 'AXE_Travel_FutureSettlement' },
        },
        {
          id: 'AXE_Interact_Teleport_Return',
          name: 'Capital Return Teleport',
          position: { x: -500, y: 0, z: 650 },
          target: { x: -18, z: -18, spawnId: 'AXE_Travel_CapitalReturn' },
        },
      ];
      teleports.forEach((tp) => registerWorldPrototype({
        id: tp.id,
        name: tp.name,
        type: 'Teleport',
        position: tp.position,
        prompt: `Teleport: ${tp.name}`,
        priority: 7,
        color: 0x7b64ff,
        size: [2.4, 0.18, 2.4],
        onInteract: () => {
          window.dispatchEvent(new CustomEvent('playerRespawn', {
            detail: { ...tp.target, source: 'axe-teleport' },
          }));
        },
      }));

      window.dispatchEvent(new CustomEvent('axeInteractionLayerReady', {
        detail: { count: system.snapshot().count },
      }));
    };

    setup();
    setupTimer = window.setInterval(setup, 250);

    const onKey = (e) => {
      if (e.repeat || e.key.toLowerCase() !== 'e') return;
      if (e.target?.matches?.('input, textarea, select')) return;
      if (!system.snapshot().target) return;
      system.interact({ playerPosition: window.__localPlayerPos || { x: 0, y: 0, z: 0 } });
    };
    window.addEventListener('keydown', onKey);

    const tick = () => {
      if (!disposed) {
        const p = window.__localPlayerPos;
        if (p) system.updateTarget(p);
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      unsubscribe?.();
      window.removeEventListener('keydown', onKey);
      window.clearInterval(setupTimer);
      cancelAnimationFrame(raf);
      createdMeshes.forEach((mesh) => {
        mesh.parent?.remove(mesh);
        mesh.geometry?.dispose?.();
        mesh.material?.dispose?.();
      });
      if (window.__axeInteractions === system) window.__axeInteractions = null;
    };
  }, []);

  if (!snapshot.target) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 bottom-24 z-[120] -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-full border border-cyan-300/35 bg-slate-950/75 px-4 py-2 text-sm text-white shadow-2xl backdrop-blur-xl">
        <span className="rounded border border-cyan-300/40 bg-cyan-400/15 px-2 py-0.5 font-mono text-xs text-cyan-100">E</span>
        <span>{snapshot.target.prompt}</span>
      </div>
    </div>
  );
}
