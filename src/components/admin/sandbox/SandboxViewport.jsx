// ─── Sandbox Viewport ─────────────────────────────────────────────────────
// Standalone three.js scene for editing. NOT the live game scene.
//   • Flat ground plane (matches the in-game world surface)
//   • OrbitControls camera
//   • TransformControls gizmo on the selected placement
//   • Drag-drop from the asset library lands at the cursor on the plane
//   • Grid + rotation snapping applied on commit
//
// Performance: only loads asset sources as needed (assetLoaderCache reuses
// the same global cache as the in-game world). Each placement is a single
// cloned root — for a sandbox editor with tens-to-low-hundreds of objects
// this is plenty fast. Heavy duplication is reserved for the runtime
// (TerrainArea) which still uses InstancedMesh.

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { instantiate } from '../../game3d/terrain/assetLoaderCache';
import { useSandboxStore } from './sandboxStore';
import { getAssetMeta } from './sandboxAssetCatalog';

export default function SandboxViewport() {
  const mountRef = useRef(null);
  const [glError, setGlError] = useState(null);
  const stateRef = useRef({
    placementNodes: new Map(), // id -> THREE.Object3D
  });

  // We use a ref to expose store actions to imperative three.js callbacks
  // without re-running the whole effect on every state change.
  const storeRef = useRef(useSandboxStore.getState());
  useEffect(() => useSandboxStore.subscribe((s) => { storeRef.current = s; }), []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ─── Scene & renderer ────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1f2e);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    // Probe WebGL availability first to fail gracefully instead of crashing React.
    let renderer;
    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl') || probe.getContext('experimental-webgl');
      if (!gl) {
        setGlError('WebGL is not available in this browser/tab. Close other 3D tabs or enable hardware acceleration.');
        return;
      }
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mount.appendChild(renderer.domElement);
    } catch (err) {
      console.error('SandboxViewport: failed to create WebGL context', err);
      setGlError('Could not create a 3D viewport. The browser may have too many active WebGL contexts open — try closing other game/3D tabs and reload.');
      return;
    }

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(30, 50, 20);
    scene.add(sun);

    // Flat ground plane (the sandbox world surface)
    const initialState = storeRef.current;
    let groundSize = initialState.groundSize || 200;
    let groundColor = initialState.groundColor || '#4a6a3e';
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(groundColor) });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.name = 'sandbox_ground';
    scene.add(ground);

    // Grid helper
    let grid = new THREE.GridHelper(groundSize, Math.max(10, Math.round(groundSize / 2)), 0x666666, 0x333333);
    grid.position.y = 0.01;
    scene.add(grid);

    const applyTerrain = (s) => {
      if (s.groundColor !== groundColor) {
        groundColor = s.groundColor;
        groundMat.color.set(groundColor);
      }
      if (s.groundSize !== groundSize) {
        groundSize = s.groundSize;
        ground.geometry.dispose();
        const g = new THREE.PlaneGeometry(groundSize, groundSize);
        g.rotateX(-Math.PI / 2);
        ground.geometry = g;
        scene.remove(grid);
        grid = new THREE.GridHelper(groundSize, Math.max(10, Math.round(groundSize / 2)), 0x666666, 0x333333);
        grid.position.y = 0.01;
        scene.add(grid);
      }
    };

    // Controls
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.target.set(0, 0, 0);

    const transform = new TransformControls(camera, renderer.domElement);
    transform.addEventListener('dragging-changed', (e) => { orbit.enabled = !e.value; });
    scene.add(transform);

    // Commit transform changes back to the store on each drag tick
    transform.addEventListener('objectChange', () => {
      const obj = transform.object;
      if (!obj) return;
      const { id } = obj.userData;
      if (!id) return;
      const s = storeRef.current;
      let { position, rotation, scale } = obj;

      // Apply snaps
      let x = position.x, y = position.y, z = position.z;
      if (s.gridSnap) {
        const g = s.gridSize || 1;
        x = Math.round(x / g) * g;
        z = Math.round(z / g) * g;
      }
      if (s.groundSnap) y = 0;

      let rx = rotation.x, ry = rotation.y, rz = rotation.z;
      if (s.rotSnap) {
        const step = (s.rotSnapDeg || 15) * Math.PI / 180;
        ry = Math.round(ry / step) * step;
      }

      obj.position.set(x, y, z);
      obj.rotation.set(rx, ry, rz);

      s.updatePlacement(id, {
        x, y, z,
        rotX: rx, rotY: ry, rotZ: rz,
        scaleX: scale.x, scaleY: scale.y, scaleZ: scale.z,
      });
    });

    // ─── Resize handler ──────────────────────────────────────────────
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // ─── Picking (click to select) ───────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    const pickAt = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const nodes = Array.from(stateRef.current.placementNodes.values());
      const hits = raycaster.intersectObjects(nodes, true);
      if (hits.length === 0) return null;
      // Walk up to the placement root
      let n = hits[0].object;
      while (n && !n.userData.id) n = n.parent;
      return n;
    };

    const pickGround = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObject(ground, false);
      return hits[0]?.point || null;
    };

    const onPointerDown = (e) => {
      // Only respond to left-click without modifier (so OrbitControls keeps right-click rotate)
      if (e.button !== 0) return;
      // Ignore clicks that fall on the transform gizmo
      if (transform.dragging) return;
      const node = pickAt(e.clientX, e.clientY);
      const s = storeRef.current;
      if (node?.userData?.id) {
        s.select(node.userData.id);
      } else {
        s.clearSelection();
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // ─── Drag-drop from asset library ────────────────────────────────
    const onDragOver = (e) => {
      if (e.dataTransfer.types.includes('application/x-sandbox-asset')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    };
    const onDrop = (e) => {
      const assetKey = e.dataTransfer.getData('application/x-sandbox-asset');
      if (!assetKey) return;
      e.preventDefault();
      const hit = pickGround(e.clientX, e.clientY);
      const meta = getAssetMeta(assetKey);
      const s = storeRef.current;
      const x = hit ? hit.x : 0;
      const z = hit ? hit.z : 0;
      let fx = x, fz = z;
      if (s.gridSnap) {
        const g = s.gridSize || 1;
        fx = Math.round(fx / g) * g;
        fz = Math.round(fz / g) * g;
      }
      s.addPlacement(assetKey, { meta, x: fx, y: 0, z: fz });
    };
    renderer.domElement.addEventListener('dragover', onDragOver);
    renderer.domElement.addEventListener('drop', onDrop);

    // ─── Sync placements (add/remove/update nodes) ───────────────────
    const ensureNode = async (p) => {
      const nodes = stateRef.current.placementNodes;
      let node = nodes.get(p.id);
      if (!node) {
        try {
          node = await instantiate(p.assetKey);
        } catch (err) {
          console.warn('Sandbox: failed to load', p.assetKey, err);
          return null;
        }
        node.userData.id = p.id;
        nodes.set(p.id, node);
        scene.add(node);
      }
      node.position.set(p.x || 0, p.y || 0, p.z || 0);
      node.rotation.set(p.rotX || 0, p.rotY || 0, p.rotZ || 0);
      // Compose with the asset's auto-fit scale (already on node.scale from loader)
      // — we treat user scale as a multiplier on top of that.
      const fit = node.userData.__fitApplied;
      if (!fit) {
        const sx = node.scale.x;
        node.userData.__fitBase = sx;
        node.userData.__fitApplied = true;
      }
      const base = node.userData.__fitBase || node.scale.x;
      node.scale.set((p.scaleX || 1) * base, (p.scaleY || 1) * base, (p.scaleZ || 1) * base);
      return node;
    };

    const syncFromStore = (s) => {
      const nodes = stateRef.current.placementNodes;
      const seen = new Set();
      for (const p of s.placements) {
        seen.add(p.id);
        ensureNode(p);
      }
      // Remove nodes that are no longer in the placement list
      for (const [id, node] of nodes) {
        if (!seen.has(id)) {
          scene.remove(node);
          nodes.delete(id);
          if (transform.object === node) transform.detach();
        }
      }
      // Update gizmo
      const sel = s.placements.find((p) => p.id === s.selectedId);
      if (sel && !sel.locked) {
        const node = nodes.get(sel.id);
        if (node) {
          if (transform.object !== node) transform.attach(node);
          transform.setMode(s.tool === 'rotate' ? 'rotate' : s.tool === 'scale' ? 'scale' : 'translate');
        }
      } else {
        transform.detach();
      }
    };

    const syncAll = (s) => { applyTerrain(s); syncFromStore(s); };
    syncAll(storeRef.current);
    const unsub = useSandboxStore.subscribe(syncAll);

    // ─── Render loop ─────────────────────────────────────────────────
    let raf = 0;
    const tick = () => {
      orbit.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      unsub();
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('dragover', onDragOver);
      renderer.domElement.removeEventListener('drop', onDrop);
      transform.dispose();
      orbit.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      stateRef.current.placementNodes.clear();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full min-h-[500px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative"
    >
      {glError && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-3">
            <div className="text-amber-400 text-sm font-semibold uppercase tracking-wider">3D Viewport Unavailable</div>
            <p className="text-slate-300 text-sm leading-relaxed">{glError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}