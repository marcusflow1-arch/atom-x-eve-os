// ─── PlayerHaloAura ──────────────────────────────────────────────────────
// 3D angelic halo + wings that float directly above the local player's head.
// Mounts a Three.js group into the live scene (window.__gw3dScene) and each
// frame anchors it to the player's world position (window.__localPlayerPos),
// keeping the halo perfectly centered above the model's head as the player
// moves and rotates.
//
// Scales with Halo level — at level 0 nothing is drawn. As the level rises
// the halo grows, brightens, and the wings extend.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { subscribeHalo } from './progression/haloStore';

// Player model height (matches the archer scaling in GameWorld3D — 1.7u tall).
const HEAD_OFFSET_Y = 2.05;

export default function PlayerHaloAura() {
  const levelRef = useRef(0);

  useEffect(() => {
    let frameId = null;
    let mounted = true;
    let scene = null;
    let group = null;
    let halo = null;
    let haloGlow = null;
    let leftWing = null;
    let rightWing = null;
    let timeRef = 0;

    const buildHaloGroup = () => {
      const g = new THREE.Group();

      // ── Halo ring (the floating golden circle) ──
      const ringGeo = new THREE.TorusGeometry(0.32, 0.05, 14, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfff2a8,
        transparent: true,
        opacity: 0.95,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2; // Lay flat, like a halo above the head.
      g.add(ring);
      halo = ring;

      // ── Soft halo glow (slightly larger ring, additive blend) ──
      const glowGeo = new THREE.TorusGeometry(0.36, 0.10, 14, 48);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xfff4c0,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.rotation.x = Math.PI / 2;
      g.add(glow);
      haloGlow = glow;

      // ── Angel wings (each side: a fan of soft feather planes) ──
      const makeWing = (mirror) => {
        const wing = new THREE.Group();
        const feathers = 5;
        for (let i = 0; i < feathers; i++) {
          const t = i / (feathers - 1); // 0 → 1
          const len = 0.35 + t * 0.25;   // feather length
          const w = 0.14 - t * 0.04;     // feather width

          // Use a plane with a soft emissive white material.
          const geo = new THREE.PlaneGeometry(w, len);
          const mat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.75 - t * 0.10,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
          const feather = new THREE.Mesh(geo, mat);

          // Position feathers in a fan: each one rotates further outward + back.
          const angle = (t - 0.5) * 0.9; // -0.45 .. +0.45 rad spread
          const x = (0.08 + t * 0.35) * (mirror ? -1 : 1);
          const y = -t * 0.05;
          const z = -t * 0.08; // sweep back slightly

          feather.position.set(x, y, z);
          // Feathers point outward + tilt back a bit
          feather.rotation.z = (mirror ? -angle : angle) - Math.PI / 2;
          feather.rotation.y = mirror ? 0.15 : -0.15;
          wing.add(feather);
        }
        return wing;
      };

      const lw = makeWing(false);
      const rw = makeWing(true);
      // Position wings just below the halo, attached to upper-back area
      lw.position.set(0, -0.10, 0);
      rw.position.set(0, -0.10, 0);
      g.add(lw);
      g.add(rw);
      leftWing = lw;
      rightWing = rw;

      // Start hidden until level > 0
      g.visible = false;
      return g;
    };

    const attachToScene = () => {
      scene = window.__gw3dScene;
      if (!scene) return false;
      group = buildHaloGroup();
      scene.add(group);
      return true;
    };

    // Try to attach immediately, otherwise wait for the scene-ready event.
    if (!attachToScene()) {
      const onReady = () => {
        if (!mounted) return;
        if (attachToScene()) {
          window.removeEventListener('gw3dSceneReady', onReady);
        }
      };
      window.addEventListener('gw3dSceneReady', onReady);
    }

    // Subscribe to halo state — drives visibility/scale/glow intensity.
    const unsubHalo = subscribeHalo((s) => {
      levelRef.current = s.level || 0;
    });

    let last = performance.now();
    const tick = () => {
      if (!mounted) return;
      frameId = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      timeRef += dt;

      if (!group) return;
      const pos = window.__localPlayerPos;
      const level = levelRef.current;

      if (!pos || level <= 0) {
        group.visible = false;
        return;
      }
      group.visible = true;

      // Anchor directly above the player's head (player.y is feet).
      group.position.set(pos.x, pos.y + HEAD_OFFSET_Y, pos.z);

      // Gentle bob + slow spin
      const bob = Math.sin(timeRef * 1.6) * 0.04;
      group.position.y += bob;
      if (halo) halo.rotation.z = timeRef * 0.6;
      if (haloGlow) haloGlow.rotation.z = -timeRef * 0.35;

      // Wing flutter
      const flutter = Math.sin(timeRef * 4.2) * 0.10;
      if (leftWing)  leftWing.rotation.z =  flutter;
      if (rightWing) rightWing.rotation.z = -flutter;

      // Scale slightly with halo level (caps at ~1.5x by L10).
      const scale = 1 + Math.min(0.5, level * 0.05);
      group.scale.setScalar(scale);

      // Brightness pulse synced to level — higher level = brighter halo.
      if (halo && halo.material) {
        halo.material.opacity = 0.85 + Math.sin(timeRef * 2) * 0.10 + Math.min(0.1, level * 0.01);
      }
      if (haloGlow && haloGlow.material) {
        haloGlow.material.opacity = 0.30 + Math.sin(timeRef * 1.4) * 0.10 + Math.min(0.2, level * 0.02);
      }
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      mounted = false;
      if (frameId) cancelAnimationFrame(frameId);
      unsubHalo();
      if (group && group.parent) group.parent.remove(group);
      // Dispose geometries/materials
      if (group) {
        group.traverse((n) => {
          if (n.geometry) n.geometry.dispose?.();
          if (n.material) {
            const mats = Array.isArray(n.material) ? n.material : [n.material];
            mats.forEach((m) => m.dispose?.());
          }
        });
      }
    };
  }, []);

  return null;
}