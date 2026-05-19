// ─── MapBuilderViewport ────────────────────────────────────────────────
// A self-contained Three.js scene:
//   • Blank flat ground (200×200) with a faint grid
//   • First-person-ish WASD walking from a slightly elevated head height
//   • Mouse drag rotates the camera (yaw + pitch)
//   • Drag-drop from the asset library lands at the cursor on the plane
//   • Click an object → select + show transform gizmo (T / R / S to switch
//     translate / rotate / scale; Delete to remove)
//
// This editor is deliberately ISOLATED from the live game world — it is a
// standalone "build your own map" sandbox.

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { instantiateAsset } from './mapBuilderLoader';
import { buildDefaultCabin } from './buildDefaultCabin';
import { Loader2 } from 'lucide-react';

const WALK_SPEED = 6;
const RUN_SPEED = 12;
const EYE_HEIGHT = 1.7;

export default function MapBuilderViewport({ onSelectionChange }) {
  const mountRef = useRef(null);
  const [glError, setGlError] = useState(null);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const apiRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ─── WebGL probe ────────────────────────────────────────────────
    let renderer;
    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!gl) {
        setGlError('WebGL is not available. Close other 3D tabs or enable hardware acceleration.');
        return;
      }
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.domElement.style.display = 'block';
      mount.appendChild(renderer.domElement);
    } catch (err) {
      console.error('MapBuilderViewport: failed to create WebGL context', err);
      setGlError('Could not create a 3D viewport. Too many WebGL contexts open — close other 3D tabs and reload.');
      return;
    }

    // ─── Scene ─────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x88c4e8);
    scene.fog = new THREE.Fog(0x88c4e8, 80, 250);

    // Lights
    scene.add(new THREE.HemisphereLight(0xcfe4ff, 0x4a3a2a, 0.9));
    const sun = new THREE.DirectionalLight(0xfff4d6, 1.4);
    sun.position.set(30, 50, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    scene.add(sun);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x6b8e4e, roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'mapbuilder_ground';
    scene.add(ground);

    // Soft grid overlay
    const grid = new THREE.GridHelper(200, 100, 0x4a6a3a, 0x3a5a2a);
    grid.position.y = 0.01;
    grid.material.transparent = true;
    grid.material.opacity = 0.35;
    scene.add(grid);

    // Default cabin — pre-placed so the map isn't completely empty
    const cabin = buildDefaultCabin();
    cabin.position.set(0, 0, -10);
    scene.add(cabin);

    // Camera — first-person eye height
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
    camera.position.set(0, EYE_HEIGHT, 8);

    // Yaw/pitch from mouse drag
    const view = { yaw: 0, pitch: 0 };

    // ─── Placement bookkeeping ──────────────────────────────────────
    let nextId = 1;
    const placements = new Map(); // id -> THREE.Object3D
    let selectedId = null;

    // Transform gizmo
    const transform = new TransformControls(camera, renderer.domElement);
    const dragGuard = { active: false };
    transform.addEventListener('dragging-changed', (e) => { dragGuard.active = e.value; });
    scene.add(transform);

    const setMode = (mode) => transform.setMode(mode);
    const select = (id) => {
      selectedId = id;
      const node = id ? placements.get(id) : null;
      if (node) transform.attach(node);
      else transform.detach();
      onSelectionChange?.(id ? { id, node } : null);
    };
    const removeSelected = () => {
      if (!selectedId) return;
      const node = placements.get(selectedId);
      if (node) scene.remove(node);
      placements.delete(selectedId);
      select(null);
    };

    // ─── Resize ─────────────────────────────────────────────────────
    const resize = () => {
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // ─── Input ──────────────────────────────────────────────────────
    const keys = {};
    const onKeyDown = (e) => {
      if (e.target?.matches?.('input, textarea')) return;
      keys[e.key.toLowerCase()] = true;
      if (e.key === 'Delete' || e.key === 'Backspace') removeSelected();
      if (e.key.toLowerCase() === 't') setMode('translate');
      if (e.key.toLowerCase() === 'r') setMode('rotate');
      if (e.key.toLowerCase() === 'g') setMode('scale'); // G = grow (size)
      if (e.key === 'Escape') select(null);
    };
    const onKeyUp = (e) => { keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Mouse look (right-click drag, OR left-click drag on empty space)
    const drag = { active: false, x: 0, y: 0, moved: false };
    const onMouseDown = (e) => {
      if (dragGuard.active) return; // gizmo is handling
      // Only start a look-drag on right-click, or on left-click in empty space.
      // (Left-clicks that hit an object are handled in onClick → select.)
      if (e.button === 2) {
        drag.active = true;
        drag.x = e.clientX;
        drag.y = e.clientY;
        drag.moved = false;
      }
    };
    const onMouseMove = (e) => {
      if (!drag.active) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
      view.yaw -= dx * 0.004;
      view.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, view.pitch - dy * 0.004));
    };
    const onMouseUp = () => { drag.active = false; };
    const onContext = (e) => e.preventDefault();
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('contextmenu', onContext);

    // ─── Picking ────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    const screenToNDC = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const pickObject = (clientX, clientY) => {
      screenToNDC(clientX, clientY);
      raycaster.setFromCamera(ndc, camera);
      const nodes = Array.from(placements.values());
      const hits = raycaster.intersectObjects(nodes, true);
      if (hits.length === 0) return null;
      let n = hits[0].object;
      while (n && !n.userData.placementId) n = n.parent;
      return n;
    };

    const pickGround = (clientX, clientY) => {
      screenToNDC(clientX, clientY);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObject(ground, false);
      return hits[0]?.point || null;
    };

    const onClick = (e) => {
      if (dragGuard.active) return;
      if (e.button !== 0) return;
      // Ignore clicks that are actually look-drag releases (right-button or moved drag)
      const node = pickObject(e.clientX, e.clientY);
      if (node?.userData?.placementId) {
        select(node.userData.placementId);
      } else {
        select(null);
      }
    };
    renderer.domElement.addEventListener('click', onClick);

    // ─── Drag-drop ──────────────────────────────────────────────────
    const onDragOver = (e) => {
      if (e.dataTransfer.types.includes('application/x-mapbuilder-asset')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    };
    const onDrop = async (e) => {
      const payload = e.dataTransfer.getData('application/x-mapbuilder-asset');
      if (!payload) return;
      e.preventDefault();
      const hit = pickGround(e.clientX, e.clientY);
      const px = hit?.x || 0;
      const pz = hit?.z || 0;
      setLoadingAsset(true);
      try {
        const node = await instantiateAsset(payload);
        node.position.set(px, 0, pz);
        const id = `p${nextId++}`;
        node.userData.placementId = id;
        node.userData.assetPayload = payload;
        node.traverse((n) => {
          if (n.isMesh) {
            n.castShadow = !n.isSkinnedMesh;
            n.receiveShadow = true;
          }
        });
        scene.add(node);
        placements.set(id, node);
        select(id);
      } catch (err) {
        console.error('MapBuilder: failed to instantiate asset', payload, err);
      } finally {
        setLoadingAsset(false);
      }
    };
    renderer.domElement.addEventListener('dragover', onDragOver);
    renderer.domElement.addEventListener('drop', onDrop);

    // ─── Render loop ────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      const dt = Math.min(0.05, clock.getDelta());

      // Walk on flat ground
      const isRun = !!keys['shift'];
      const speed = (isRun ? RUN_SPEED : WALK_SPEED) * dt;
      const fwd = new THREE.Vector3(-Math.sin(view.yaw), 0, -Math.cos(view.yaw));
      const right = new THREE.Vector3(-Math.cos(view.yaw), 0, Math.sin(view.yaw));
      const move = new THREE.Vector3();
      if (keys['w']) move.add(fwd);
      if (keys['s']) move.sub(fwd);
      if (keys['a']) move.add(right);
      if (keys['d']) move.sub(right);
      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(speed);
        camera.position.x += move.x;
        camera.position.z += move.z;
      }
      camera.position.y = EYE_HEIGHT;

      // Apply yaw/pitch
      const target = new THREE.Vector3(
        camera.position.x - Math.sin(view.yaw) * Math.cos(view.pitch),
        camera.position.y + Math.sin(view.pitch),
        camera.position.z - Math.cos(view.yaw) * Math.cos(view.pitch),
      );
      camera.lookAt(target);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    apiRef.current = { setMode, removeSelected, deselect: () => select(null) };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('contextmenu', onContext);
      renderer.domElement.removeEventListener('dragover', onDragOver);
      renderer.domElement.removeEventListener('drop', onDrop);
      transform.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      placements.clear();
      apiRef.current = null;
    };
  }, [onSelectionChange]);

  // Expose simple imperative actions to parent via global hook (kept minimal)
  useEffect(() => {
    window.__mapBuilder = {
      setMode: (m) => apiRef.current?.setMode(m),
      remove: () => apiRef.current?.removeSelected(),
      deselect: () => apiRef.current?.deselect(),
    };
    return () => { delete window.__mapBuilder; };
  }, []);

  return (
    <div ref={mountRef} className="w-full h-full bg-slate-950 relative overflow-hidden">
      {glError && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-slate-950">
          <div className="max-w-md space-y-3">
            <div className="text-amber-400 text-sm font-semibold uppercase tracking-wider">3D Viewport Unavailable</div>
            <p className="text-slate-300 text-sm leading-relaxed">{glError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm"
            >
              Reload page
            </button>
          </div>
        </div>
      )}
      {loadingAsset && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 text-cyan-200 text-xs">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading asset…
        </div>
      )}
    </div>
  );
}