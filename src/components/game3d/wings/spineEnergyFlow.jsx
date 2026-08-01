// ─── spineEnergyFlow ───────────────────────────────────────────────────────
// Builds the energy conduit that runs down the player's spine and streams
// outward into each wing root — so the wings read as *powered by* the spine
// rather than floating behind the body.
//
// Pieces:
//   • spine ribbon — a thin vertical additive bar sitting on the spine that
//     pulses light up and down its length
//   • flow motes — small additive sparks that spawn at a random point on the
//     spine and travel outward + slightly back along each wing root, fading
//     as they go (the "air coming out of the back")
//
// createSpineEnergyFlow({ parent, colorHex, tier }) → { update(t, dt, alpha), dispose() }
// alpha (0..1) lets the caller sync the flow brightness with the wing fade.
// ─────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';

const MOTE_COUNT = 14;

export function createSpineEnergyFlow({ parent, colorHex, tier = 1 }) {
  const color = new THREE.Color(colorHex);
  const nodes = [];

  // ── Spine ribbon ────────────────────────────────────────────────────
  const spineH = 0.62 + tier * 0.03;
  const ribbonGeo = new THREE.PlaneGeometry(0.05, spineH, 1, 1);
  const ribbonMat = new THREE.MeshBasicMaterial({
    color: color.clone(),
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbon.position.set(0, -0.02, -0.015);
  parent.add(ribbon);
  nodes.push(ribbon);

  // A brighter travelling pulse that slides along the spine.
  const pulseGeo = new THREE.PlaneGeometry(0.09, 0.14, 1, 1);
  const pulseMat = new THREE.MeshBasicMaterial({
    color: color.clone(),
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const pulse = new THREE.Mesh(pulseGeo, pulseMat);
  pulse.position.set(0, 0, -0.02);
  parent.add(pulse);
  nodes.push(pulse);

  // ── Flow motes ──────────────────────────────────────────────────────
  const moteGeo = new THREE.SphereGeometry(0.016 + tier * 0.001, 6, 6);
  const motes = [];
  for (let i = 0; i < MOTE_COUNT; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: color.clone(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const m = new THREE.Mesh(moteGeo, mat);
    m.userData = {
      side: i % 2 === 0 ? 1 : -1,
      // stagger so motes stream continuously instead of in one burst
      t: i / MOTE_COUNT,
      speed: 0.85 + Math.random() * 0.5,
      startY: (Math.random() - 0.5) * spineH * 0.8,
      rise: 0.10 + Math.random() * 0.22,
      reach: 0.42 + Math.random() * 0.34 + tier * 0.03,
    };
    parent.add(m);
    motes.push(m);
    nodes.push(m);
  }

  const update = (time, dt, alpha = 1) => {
    // Spine ribbon breathes with the flow.
    ribbonMat.opacity = (0.30 + 0.18 * Math.sin(time * 3.0)) * alpha;

    // Pulse slides up the spine and wraps.
    const pu = (time * 0.9) % 1;
    pulse.position.y = -spineH / 2 + pu * spineH;
    pulseMat.opacity = Math.sin(Math.PI * pu) * 0.8 * alpha;

    // Motes: spine → outward along the wing root, fading out at the tip.
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const u = m.userData;
      u.t += dt * u.speed * 0.55;
      if (u.t >= 1) {
        u.t -= 1;
        u.startY = (Math.random() - 0.5) * spineH * 0.8;
        u.reach = 0.42 + Math.random() * 0.34;
        u.rise = 0.10 + Math.random() * 0.22;
      }
      const p = u.t;
      // ease outward so motes accelerate away from the spine
      const out = p * p * 0.6 + p * 0.4;
      m.position.set(
        out * u.reach * u.side,
        u.startY + out * u.rise,
        -0.02 - out * 0.16,          // drift back, away from the body
      );
      // fade in fast at the spine, fade out toward the wing tip
      const fade = Math.min(1, p * 5) * (1 - p) * 1.4;
      m.material.opacity = Math.max(0, Math.min(1, fade)) * 0.85 * alpha;
      const s = 0.7 + (1 - p) * 0.6;
      m.scale.setScalar(s);
    }
  };

  const dispose = () => {
    nodes.forEach((n) => {
      parent.remove(n);
      n.geometry?.dispose?.();
      n.material?.dispose?.();
    });
    nodes.length = 0;
    motes.length = 0;
  };

  return { update, dispose };
}

export default createSpineEnergyFlow;