// ─── PlayerHaloAura ──────────────────────────────────────────────────────
// Liquid-glass angelic halo floating directly above the local player's head.
// Mounts a Three.js group into the live scene (window.__gw3dScene) and each
// frame anchors it to the player's world position (window.__localPlayerPos),
// keeping the halo perfectly centered above the model's head as the player
// moves and rotates.
//
// Detail tiers (visual quality) — more ornate as Halo level rises:
//   L1–29   → tier 1 (single liquid-glass ring, ~70% smaller than before)
//   L30–69  → tier 2 (adds inner concentric ring)
//   L70–99  → tier 3 (adds orbiting glass shards / motes)
//   L100–129→ tier 4 (adds a second elevated ring layer)
//   L130–169→ tier 5 (adds delicate cross-band arcs)
//   L170+   → tier 6 (full celestial — more motes, more layers, brighter)
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { subscribeHalo } from './progression/haloStore';

// Player model head offset (matches the archer scaling in GameWorld3D — 1.7u tall).
const HEAD_OFFSET_Y = 2.05;

// Decide visual tier from halo level.
const tierForLevel = (lvl) => {
  if (lvl >= 170) return 6;
  if (lvl >= 130) return 5;
  if (lvl >= 100) return 4;
  if (lvl >= 70)  return 3;
  if (lvl >= 30)  return 2;
  return 1;
};

export default function PlayerHaloAura() {
  const levelRef = useRef(0);

  useEffect(() => {
    let frameId = null;
    let mounted = true;
    let scene = null;
    let group = null;
    let currentTier = 0;
    let parts = null; // { mainRing, innerRing, outerRing, motes:[], arcs:[], glow }
    let timeRef = 0;

    // ── Build a liquid-glass ring (physical-material with transmission) ──
    const makeGlassRing = (radius, tubeRadius, color = 0xfff2a8, opacity = 0.85) => {
      const geo = new THREE.TorusGeometry(radius, tubeRadius, 24, 96);
      // No `transmission` — it forces a full extra scene render pass per frame.
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.15,
        metalness: 0.0,
        emissive: color,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity,
      });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = Math.PI / 2; // Lay flat above the head.
      return m;
    };

    // ── Build a soft additive glow ring (gives the “light” feel) ──
    const makeGlowRing = (radius, tubeRadius, color = 0xfff4c0, opacity = 0.35) => {
      const geo = new THREE.TorusGeometry(radius, tubeRadius, 14, 48);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = Math.PI / 2;
      return m;
    };

    // ── A tiny glass mote (sphere) that orbits the halo ──
    const makeMote = (color = 0xfff4c0) => {
      const geo = new THREE.SphereGeometry(0.012, 10, 10);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.9,
      });
      return new THREE.Mesh(geo, mat);
    };

    // ── A delicate cross arc (a thin partial torus) ──
    const makeArc = (radius, color = 0xfff4c0) => {
      // Use a thin torus with reduced arc length for an "arc" feel.
      const geo = new THREE.TorusGeometry(radius, 0.008, 8, 64, Math.PI * 0.6);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return new THREE.Mesh(geo, mat);
    };

    // Dispose helper.
    const disposeNode = (n) => {
      if (!n) return;
      n.traverse?.((c) => {
        if (c.geometry) c.geometry.dispose?.();
        if (c.material) {
          const mats = Array.isArray(c.material) ? c.material : [c.material];
          mats.forEach((m) => m.dispose?.());
        }
      });
    };

    // (Re)build the halo for the given visual tier.
    const buildForTier = (tier) => {
      // Clear previous parts
      if (parts) {
        Object.values(parts).forEach((p) => {
          if (Array.isArray(p)) p.forEach((x) => { group.remove(x); disposeNode(x); });
          else if (p) { group.remove(p); disposeNode(p); }
        });
      }
      parts = { mainRing: null, innerRing: null, outerRing: null, motes: [], arcs: [], glow: null };

      // Base sizes — original was r=0.32. Reduced by ~70% → 0.10.
      const baseR = 0.10;
      const tubeR = 0.014;

      // Main liquid-glass halo (always present)
      parts.mainRing = makeGlassRing(baseR, tubeR, 0xfff2a8, 0.9);
      group.add(parts.mainRing);

      // Subtle outer glow (always present, but grows with tier)
      const glowR = baseR + 0.012;
      const glowTube = 0.026 + tier * 0.004;
      parts.glow = makeGlowRing(glowR, glowTube, 0xfff4c0, 0.30 + tier * 0.03);
      group.add(parts.glow);

      // Tier 2+: inner concentric ring
      if (tier >= 2) {
        parts.innerRing = makeGlassRing(baseR * 0.62, tubeR * 0.7, 0xfffbe0, 0.85);
        group.add(parts.innerRing);
      }

      // Tier 3+: orbiting glass motes — count scales with tier
      if (tier >= 3) {
        const moteCount = tier === 3 ? 6 : tier === 4 ? 8 : tier === 5 ? 10 : 14;
        for (let i = 0; i < moteCount; i++) {
          const mote = makeMote(0xfff4c0);
          mote.userData.phase = (i / moteCount) * Math.PI * 2;
          mote.userData.orbitR = baseR + 0.025;
          parts.motes.push(mote);
          group.add(mote);
        }
      }

      // Tier 4+: second elevated ring layer (slightly above the main)
      if (tier >= 4) {
        parts.outerRing = makeGlassRing(baseR * 1.18, tubeR * 0.6, 0xfff2a8, 0.7);
        parts.outerRing.position.y = 0.02;
        group.add(parts.outerRing);
      }

      // Tier 5+: cross-band arcs (3 arcs, gently tilted)
      if (tier >= 5) {
        for (let i = 0; i < 3; i++) {
          const arc = makeArc(baseR * 1.05, 0xfff4c0);
          arc.rotation.x = Math.PI / 2;
          arc.rotation.z = (i / 3) * Math.PI * 2;
          arc.userData.spin = 0.4 + i * 0.15;
          parts.arcs.push(arc);
          group.add(arc);
        }
      }

      // Tier 6: brighter overall + extra arcs
      if (tier >= 6) {
        for (let i = 0; i < 3; i++) {
          const arc = makeArc(baseR * 1.22, 0xffffff);
          arc.rotation.x = Math.PI / 2;
          arc.rotation.z = (i / 3) * Math.PI * 2 + Math.PI / 6;
          arc.userData.spin = -0.55 - i * 0.1;
          parts.arcs.push(arc);
          group.add(arc);
        }
        if (parts.glow?.material) parts.glow.material.opacity = 0.55;
      }

      currentTier = tier;
    };

    const attachToScene = () => {
      scene = window.__gw3dScene;
      if (!scene) return false;
      group = new THREE.Group();
      group.visible = false;
      scene.add(group);
      buildForTier(1);
      return true;
    };

    if (!attachToScene()) {
      const onReady = () => {
        if (!mounted) return;
        if (attachToScene()) window.removeEventListener('gw3dSceneReady', onReady);
      };
      window.addEventListener('gw3dSceneReady', onReady);
    }

    // Track halo level — rebuild visuals when the tier changes.
    const unsubHalo = subscribeHalo((s) => {
      const lvl = s.level || 0;
      levelRef.current = lvl;
      if (!group) return;
      const wantTier = tierForLevel(lvl);
      if (wantTier !== currentTier && lvl > 0) buildForTier(wantTier);
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

      // Anchor directly above the player's head.
      group.position.set(pos.x, pos.y + HEAD_OFFSET_Y, pos.z);

      // Gentle bob
      group.position.y += Math.sin(timeRef * 1.6) * 0.02;

      // Slow halo spin
      if (parts?.mainRing) parts.mainRing.rotation.z =  timeRef * 0.55;
      if (parts?.innerRing) parts.innerRing.rotation.z = -timeRef * 0.85;
      if (parts?.outerRing) parts.outerRing.rotation.z =  timeRef * 0.30;
      if (parts?.glow) parts.glow.rotation.z = -timeRef * 0.25;

      // Orbiting motes
      if (parts?.motes?.length) {
        for (let i = 0; i < parts.motes.length; i++) {
          const m = parts.motes[i];
          const ang = m.userData.phase + timeRef * 1.2;
          const r = m.userData.orbitR;
          m.position.set(Math.cos(ang) * r, Math.sin(timeRef * 2 + i) * 0.008, Math.sin(ang) * r);
        }
      }

      // Arcs spin
      if (parts?.arcs?.length) {
        for (let i = 0; i < parts.arcs.length; i++) {
          parts.arcs[i].rotation.z += parts.arcs[i].userData.spin * dt;
        }
      }

      // Subtle level-based brightness pulse
      if (parts?.mainRing?.material) {
        parts.mainRing.material.emissiveIntensity = 0.55 + Math.sin(timeRef * 2) * 0.10 + Math.min(0.4, level * 0.003);
      }
      if (parts?.glow?.material) {
        parts.glow.material.opacity = 0.28 + Math.sin(timeRef * 1.4) * 0.08 + Math.min(0.25, level * 0.002);
      }
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      mounted = false;
      if (frameId) cancelAnimationFrame(frameId);
      unsubHalo();
      if (group && group.parent) group.parent.remove(group);
      if (group) disposeNode(group);
    };
  }, []);

  return null;
}