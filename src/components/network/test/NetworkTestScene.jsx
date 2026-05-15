// Slice A — isolated three.js scene for the NetworkTest page.
// Local player = green cube. Remote players = blue cubes. Ground plane + grid.
// Reads from realtimeNetwork; never touches GameWorld3D or any gameplay store.

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { realtimeNetwork } from '@/components/network/realtimeNetworkManager';
import { LocalPlayerController } from './LocalPlayerController';

const ANIM_COLORS = {
  idle: 0x4488ff,
  walk: 0x44dd88,
  sprint: 0xddee44,
  jump: 0xff8844,
  fall: 0xcc4444,
  crouch: 0x884488,
};

export default function NetworkTestScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // --- three.js setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);
    scene.fog = new THREE.Fog(0x0b1020, 30, 80);

    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
    camera.position.set(0, 6, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 20, 10);
    scene.add(dir);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x1a2238 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    scene.add(ground);
    scene.add(new THREE.GridHelper(60, 60, 0x334466, 0x223355));

    // Local player mesh (green)
    const localMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x44dd88 })
    );
    scene.add(localMesh);

    // Local label
    const localLabel = makeTextSprite('YOU');
    localLabel.position.set(0, 1.2, 0);
    localMesh.add(localLabel);

    // Remote players map
    const remoteMeshes = new Map(); // id -> { mesh, label, lastAnim }

    function getOrCreateRemote(id) {
      let r = remoteMeshes.get(id);
      if (!r) {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshStandardMaterial({ color: 0x4488ff })
        );
        scene.add(mesh);
        const label = makeTextSprite(id.slice(-6));
        label.position.set(0, 1.2, 0);
        mesh.add(label);
        r = { mesh, label, lastAnim: 'idle' };
        remoteMeshes.set(id, r);
      }
      return r;
    }

    function removeRemote(id) {
      const r = remoteMeshes.get(id);
      if (!r) return;
      scene.remove(r.mesh);
      r.mesh.geometry.dispose();
      r.mesh.material.dispose();
      remoteMeshes.delete(id);
    }

    // Clean up remote meshes when network signals player_left
    const unsubLeft = realtimeNetwork.on('player_left', ({ id }) => removeRemote(id));

    // Controller
    const controller = new LocalPlayerController();
    controller.attach();

    // Resize
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    // --- main loop ---
    let last = performance.now();
    let raf;
    const cameraTarget = new THREE.Vector3();
    const cameraDesired = new THREE.Vector3();

    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      // 1) Read input, send to server through prediction manager
      const input = controller.step(dt);
      realtimeNetwork.sendInput(input);

      // 2) Render local player from predicted state (instant response)
      const local = realtimeNetwork.getLocalState();
      // Ground clamp on local prediction
      controller.postApply(local.pos);
      localMesh.position.set(local.pos.x, local.pos.y, local.pos.z);
      localMesh.rotation.y = local.rot.y;
      const localColor = ANIM_COLORS[local.anim] || ANIM_COLORS.idle;
      localMesh.material.color.setHex(localColor);

      // 3) Render remote players from interpolated state
      const ids = realtimeNetwork.getRemoteIds();
      const seen = new Set(ids);
      for (const id of ids) {
        const s = realtimeNetwork.getRemoteState(id);
        if (!s) continue;
        const r = getOrCreateRemote(id);
        r.mesh.position.set(s.pos.x, s.pos.y, s.pos.z);
        r.mesh.rotation.y = s.rot?.y || 0;
        if (s.anim !== r.lastAnim) {
          r.mesh.material.color.setHex(ANIM_COLORS[s.anim] || ANIM_COLORS.idle);
          r.lastAnim = s.anim;
        }
      }
      // GC removed remotes (in case left event was missed)
      for (const id of Array.from(remoteMeshes.keys())) {
        if (!seen.has(id)) removeRemote(id);
      }

      // 4) Smooth chase camera
      cameraDesired.set(local.pos.x, local.pos.y + 5, local.pos.z + 8);
      camera.position.lerp(cameraDesired, 0.08);
      cameraTarget.set(local.pos.x, local.pos.y + 1, local.pos.z);
      camera.lookAt(cameraTarget);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controller.detach();
      unsubLeft && unsubLeft();
      for (const id of Array.from(remoteMeshes.keys())) removeRemote(id);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}

// Tiny canvas-based text sprite (no external font deps)
function makeTextSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, 256, 64);
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.6, 0.4, 1);
  return sprite;
}