// ─── PlayerAngelWings ──────────────────────────────────────────────────────
// Detailed, sketched angel-wings visual that mounts behind the player's back
// in the live 3D world. Renders ONLY when a Wing path is equipped and has a
// level > 0. Visual detail (span, feather count, glow, trailing motes) tiers
// up with the equipped wing's level, and the plumage tints to the path's color.
//
// Anchoring:
//   • position — player world pos (window.__localPlayerPos) + a small back
//                offset along the player's facing (from playerPositionStore yaw)
//   • orientation — wings face backward with the player (rotation.y = yaw)
//   • height — shoulder height (~1.45u above the ground pos)
//
// Detail / lighting:
//   • Feathers are custom tapered leaf geometries (a sketched silhouette) with
//     MeshPhysicalMaterial (transmission + clearcoat + emissive) so they catch
//     light, read as glassy plumage, and glow softly.
//   • A small point light sits between the wing roots for specular highlights.
//   • Gentle flap animation (dihedral oscillation) + a soft feather shimmer.
//
// Tiers (visual detail rises with equipped wing level):
//   L1–29   → tier 1 — small span, 2 feather rows
//   L30–69  → tier 2 — +1 row, longer primaries
//   L70–99  → tier 3 — +flight-feather tips, brighter emissive
//   L100–129→ tier 4 — +glow halo + second covert layer
//   L130–169→ tier 5 — wider span, extra primaries
//   L170+   → tier 6 — full celestial: max span, trailing light motes, bright
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { subscribeWings } from './progression/wingsStore';
import { getWingPathById } from './progression/wingsData';
import { subscribePlayerPosition, getPlayerPosition } from './playerPositionStore';
import { createSpineEnergyFlow } from './wings/spineEnergyFlow';

// Anchor on the MID-BACK (shoulder-blade height), not up by the head/halo.
const BACK_Y = 1.02;          // above the player's ground position
const BACK_OFFSET = 0.34;     // behind the player along facing

// ── Flap cycle ────────────────────────────────────────────────────────
// Instead of a continuous oscillation, the wings step through stroke poses.
// Each step FADES IN at its pose, drifts a little, then FADES OUT — and the
// jump to the next pose happens while invisible, so the wings appear to
// "re-materialise" higher/lower on every beat, like a bird mid-flight.
const STROKE_POSES = [
  { dihedral:  0.66, sweep: -0.16, lift:  0.10 },  // high, thrown outward + up
  { dihedral:  0.36, sweep: -0.06, lift:  0.05 },
  { dihedral:  0.04, sweep:  0.02, lift:  0.00 },  // level
  { dihedral: -0.30, sweep:  0.10, lift: -0.05 },
  { dihedral: -0.52, sweep:  0.14, lift: -0.09 },  // bottom of the downstroke
  { dihedral: -0.24, sweep:  0.08, lift: -0.04 },
  { dihedral:  0.10, sweep:  0.00, lift:  0.01 },
  { dihedral:  0.42, sweep: -0.10, lift:  0.06 },
];
const STEP_DURATION = 1.40;   // seconds per slow fade-in → fade-out beat
const MIN_FADE = 0.35;        // never fully vanish — fade down, not blink off

const tierForLevel = (lvl) => {
  if (lvl >= 170) return 6;
  if (lvl >= 130) return 5;
  if (lvl >= 100) return 4;
  if (lvl >= 70)  return 3;
  if (lvl >= 30)  return 2;
  return 1;
};

// Build a tapered "feather" geometry — an elongated leaf/plume silhouette.
// Length along +Y, width across X, tapering to a point at the tip.
function makeFeatherGeometry(length, width) {
  const geo = new THREE.BufferGeometry();
  const hw = width / 2;
  const verts = new Float32Array([
    // base (quill root) — narrow
    -hw * 0.18, 0,        0,
     hw * 0.18, 0,        0,
     hw,       length * 0.45, 0,
    -hw,       length * 0.45, 0,
    // mid to tip — taper to a point
     hw,       length * 0.45, 0,
    -hw,       length * 0.45, 0,
     hw * 0.04, length, 0,
    -hw * 0.04, length, 0,
  ]);
  const uvs = new Float32Array([
    0.5, 0,   0.5, 0,   1, 0.45,
    0, 0.45,  1, 0.45,  0, 0.45,
    0.5, 1,   0.5, 1,
  ]);
  const idx = [0,1,2, 0,2,3, 4,5,6, 5,7,6];
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export default function PlayerAngelWings() {
  const equippedRef = useRef({ pathId: null, level: 0, color: '#fff2a8' });

  useEffect(() => {
    let mounted = true;
    let frameId = null;
    let scene = null;
    let group = null;          // anchor group (positioned/oriented on the back)
    let leftWing = null;       // left wing pivot
    let rightWing = null;      // right wing pivot
    let currentTier = 0;
    let currentColor = null;
    let parts = null;          // { feathers:[], motes:[], glow, light }
    let timeRef = 0;
    let baseSpan = 0;

    const disposeNode = (n) => {
      if (!n) return;
      n.traverse?.((c) => {
        if (c.geometry) c.geometry.dispose?.();
        if (c.material) {
          const mats = Array.isArray(c.material) ? c.material : [c.material];
          mats.forEach((m) => { m.map?.dispose?.(); m.dispose?.(); });
        }
      });
    };

    // Build ONE wing (a pivot group) with feathers fanning out to +X.
    const buildWing = (tier, colorHex, span, isLeft) => {
      const pivot = new THREE.Group();
      const color = new THREE.Color(colorHex);

      // Feather material — glassy, glowing, lit.
      const featherMat = new THREE.MeshPhysicalMaterial({
        color: color.clone(),
        roughness: 0.22,
        metalness: 0.0,
        transmission: 0.55,
        thickness: 0.25,
        ior: 1.35,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        emissive: color.clone(),
        emissiveIntensity: 0.35 + tier * 0.05,
        transparent: true,
        opacity: 0.94,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      // Row layout: [row, count, baseLen, width, fanDeg, yOffset, zOffset]
      // More rows / more feathers as tier rises.
      const rows = [];
      const rowCount = tier >= 5 ? 4 : tier >= 3 ? 3 : tier >= 2 ? 3 : 2;
      const tipCount = tier >= 3 ? (tier >= 5 ? 6 : 4) : 0;

      // Covert (shoulder) rows — short feathers near the root.
      for (let r = 0; r < rowCount; r++) {
        const t = r / Math.max(1, rowCount - 1);
        rows.push({
          count: 5 + r * 2 + (tier >= 4 ? 2 : 0),
          len: span * (0.30 + t * 0.42),
          width: 0.16 - r * 0.02,
          fanDeg: 70,
          y: 0.05 + r * 0.05,
          z: (r - rowCount / 2) * 0.03,
          pitch: -0.2 - r * 0.05,
        });
      }
      // Primary flight feathers — long, sweeping, at the wing tip.
      if (tipCount > 0) {
        rows.push({
          count: tipCount + 2,
          len: span * (0.85 + (tier >= 5 ? 0.18 : 0)),
          width: 0.13,
          fanDeg: 96,
          y: 0.04,
          z: 0.02,
          pitch: -0.05,
          primary: true,
        });
      }

      const featherGeoCache = [];
      rows.forEach((row) => {
        for (let i = 0; i < row.count; i++) {
          const t = row.count > 1 ? i / (row.count - 1) : 0.5;
          const fan = THREE.MathUtils.degToRad((t - 0.5) * row.fanDeg);
          const len = row.len * (row.primary ? (0.85 + t * 0.3) : (0.8 + Math.abs(t - 0.5) * 0.4));
          const geo = makeFeatherGeometry(len, row.width);
          featherGeoCache.push(geo);
          const m = new THREE.Mesh(geo, featherMat);
          // Place along +X fanning from the root, pitched slightly up/back.
          const dist = row.primary ? 0.04 : (0.02 + (row.y) * 0.2);
          m.position.set(
            Math.cos(fan) * dist,
            row.y,
            row.z + Math.sin(fan) * 0.02,
          );
          m.rotation.set(row.pitch, 0, fan - Math.PI / 2);
          m.userData = { baseRotZ: m.rotation.z, basePitch: row.pitch, fan, shimmer: Math.random() * Math.PI * 2 };
          pivot.add(m);
          if (!parts) parts = { feathers: [], motes: [], glow: null, light: null, spine: null };
          parts.feathers.push(m);
        }
      });

      // Neutral pose — the flap cycle drives rotation each frame.
      pivot.rotation.z = isLeft ? 0.22 : -0.22;
      // Mirror for left wing.
      if (isLeft) pivot.scale.x = -1;
      return { pivot, mat: featherMat, geos: featherGeoCache };
    };

    const clearParts = () => {
      if (!parts) return;
      parts.feathers.forEach((f) => { leftWing?.remove(f); rightWing?.remove(f); disposeNode(f); });
      parts.feathers = [];
      if (parts.motes.length) {
        parts.motes.forEach((m) => { group?.remove(m); disposeNode(m); });
        parts.motes = [];
      }
      if (parts.glow) { group?.remove(parts.glow); disposeNode(parts.glow); parts.glow = null; }
      if (parts.spine) { parts.spine.dispose(); parts.spine = null; }
    };

    const buildForTier = (tier, colorHex) => {
      clearParts();
      // Remove old wing pivots + their materials.
      [leftWing, rightWing].forEach((w) => {
        if (!w) return;
        group.remove(w);
        w.traverse((c) => {
          if (c.material) {
            const mats = Array.isArray(c.material) ? c.material : [c.material];
            mats.forEach((m) => m.dispose?.());
          }
          if (c.geometry) c.geometry.dispose?.();
        });
      });

      baseSpan = 0.55 + tier * 0.10;
      const builtL = buildWing(tier, colorHex, baseSpan, true);
      const builtR = buildWing(tier, colorHex, baseSpan, false);
      leftWing = builtL.pivot;
      rightWing = builtR.pivot;
      group.add(leftWing, rightWing);

      // Soft glow disc between the wing roots (tier 4+).
      if (tier >= 4) {
        const glowGeo = new THREE.CircleGeometry(0.18 + tier * 0.02, 28);
        const glowMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(colorHex),
          transparent: true,
          opacity: 0.22 + tier * 0.02,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(0, 0.02, -0.02);
        glow.rotation.x = -Math.PI / 2;
        parts.glow = glow;
        group.add(glow);
      }

      // Trailing light motes (tier 6).
      if (tier >= 6) {
        const moteGeo = new THREE.SphereGeometry(0.018, 8, 8);
        const moteMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(colorHex),
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        for (let i = 0; i < 8; i++) {
          const m = new THREE.Mesh(moteGeo, moteMat);
          m.userData = { phase: (i / 8) * Math.PI * 2, side: i % 2 === 0 ? 1 : -1 };
          parts.motes.push(m);
          group.add(m);
        }
      }

      // Point light between wing roots — gives specular highlights on feathers.
      if (!parts.light) {
        parts.light = new THREE.PointLight(new THREE.Color(colorHex), 0.8, 6, 2);
        parts.light.position.set(0, 0.1, 0);
        group.add(parts.light);
      } else {
        parts.light.color.set(colorHex);
      }
      parts.light.intensity = 0.6 + tier * 0.12;

      // Spine → wing energy conduit (always present; scales with tier).
      parts.spine = createSpineEnergyFlow({ parent: group, colorHex, tier });

      currentTier = tier;
      currentColor = new THREE.Color(colorHex);
    };

    const attachToScene = () => {
      scene = window.__gw3dScene;
      if (!scene) return false;
      group = new THREE.Group();
      group.visible = false;
      scene.add(group);
      parts = { feathers: [], motes: [], glow: null, light: null, spine: null };
      return true;
    };

    if (!attachToScene()) {
      const onReady = () => {
        if (!mounted) return;
        if (attachToScene()) window.removeEventListener('gw3dSceneReady', onReady);
      };
      window.addEventListener('gw3dSceneReady', onReady);
    }

    // Track equipped wing — rebuild visuals when path/level-tier changes.
    const unsubWings = subscribeWings((s) => {
      const eq = s.equippedPathId;
      const lvl = eq ? (s.paths[eq]?.level || 0) : 0;
      equippedRef.current = {
        pathId: eq,
        level: lvl,
        color: eq ? (getWingPathById(eq)?.color || '#fff2a8') : '#fff2a8',
      };
      if (!group) return;
      if (!eq || lvl <= 0) { group.visible = false; return; }
      const wantTier = tierForLevel(lvl);
      if (wantTier !== currentTier || !currentColor || !currentColor.equals(new THREE.Color(equippedRef.current.color))) {
        buildForTier(wantTier, equippedRef.current.color);
      }
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
      const { pathId, level } = equippedRef.current;
      if (!pathId || level <= 0) { group.visible = false; return; }

      const pos = window.__localPlayerPos;
      if (!pos) { group.visible = false; return; }
      group.visible = true;

      // Facing from the player position store (yaw in radians).
      const pp = getPlayerPosition();
      const yaw = pp.yaw || 0;
      // Forward vector (matches orbit yaw convention in GameWorld3D).
      const fwdX = Math.sin(yaw);
      const fwdZ = Math.cos(yaw);

      // Anchor on the mid-back: behind the player along facing, shoulder-blade height.
      group.position.set(
        pos.x - fwdX * BACK_OFFSET,
        pos.y + BACK_Y,
        pos.z - fwdZ * BACK_OFFSET,
      );
      group.rotation.y = yaw;

      // ── Fade-and-reposition flap ─────────────────────────────────────
      // Step through stroke poses. Within a step the wings fade in, drift
      // slightly toward the next pose, then fade out — so the jump to the
      // next pose lands while they're invisible and they "reappear" higher
      // or lower on the next beat.
      const cycle = timeRef / STEP_DURATION;
      const stepIdx = Math.floor(cycle) % STROKE_POSES.length;
      const u = cycle - Math.floor(cycle);                 // 0..1 within the step
      const pose = STROKE_POSES[stepIdx];
      const nextPose = STROKE_POSES[(stepIdx + 1) % STROKE_POSES.length];
      // Fade envelope: eased sine, floored so the wings dim and swell
      // smoothly instead of snapping off and back on.
      const s = Math.sin(Math.PI * u);
      const eased = s * s * (3 - 2 * s);                   // smoothstep on the sine
      const alpha = MIN_FADE + (1 - MIN_FADE) * eased;
      // Ease smoothly all the way into the next pose — no jump at the edge.
      const drift = u * u * (3 - 2 * u);
      const dihedral = pose.dihedral + (nextPose.dihedral - pose.dihedral) * drift;
      const sweep = pose.sweep + (nextPose.sweep - pose.sweep) * drift;
      const lift = pose.lift + (nextPose.lift - pose.lift) * drift;

      if (leftWing && rightWing) {
        leftWing.rotation.z = dihedral;
        rightWing.rotation.z = -dihedral;
        leftWing.rotation.y = sweep;
        rightWing.rotation.y = -sweep;
        leftWing.position.y = lift;
        rightWing.position.y = lift;
      }

      // Feather shimmer — subtle per-feather emissive + pitch wave.
      if (parts?.feathers?.length) {
        const shimmer = 0.32 + currentTier * 0.05;
        for (let i = 0; i < parts.feathers.length; i++) {
          const f = parts.feathers[i];
          const u = f.userData;
          const wave = Math.sin(timeRef * 1.6 + u.shimmer) * 0.04;
          f.rotation.x = u.basePitch + wave;
        }
        // Brightness pulse scaled with level, gated by the flap fade.
        const pulse = 0.10 * Math.sin(timeRef * 1.8) + Math.min(0.5, level * 0.0025);
        for (let i = 0; i < parts.feathers.length; i++) {
          const m = parts.feathers[i].material;
          if (!m) continue;
          m.emissiveIntensity = (shimmer + pulse) * (0.25 + alpha * 0.75);
          m.opacity = 0.94 * alpha;
        }
      }

      // Spine energy conduit — streams out of the back, brightest mid-stroke.
      if (parts?.spine) parts.spine.update(timeRef, dt, 0.45 + alpha * 0.55);

      // Root light pulses with the stroke.
      if (parts?.light) {
        parts.light.intensity = (0.6 + currentTier * 0.12) * (0.4 + alpha * 0.6);
      }

      // Trailing motes drift behind the wings.
      if (parts?.motes?.length) {
        for (let i = 0; i < parts.motes.length; i++) {
          const m = parts.motes[i];
          const u = m.userData;
          const ang = u.phase + timeRef * 0.9;
          const rad = 0.5 + Math.sin(timeRef * 0.7 + i) * 0.12;
          m.position.set(
            Math.cos(ang) * rad * u.side,
            0.1 + Math.sin(timeRef * 1.4 + i) * 0.08,
            -0.4 - Math.abs(Math.sin(ang)) * 0.3,
          );
          m.material.opacity = 0.4 + 0.3 * Math.sin(timeRef * 2 + i);
        }
      }

      // Glow disc pulse (also gated by the flap fade).
      if (parts?.glow?.material) {
        parts.glow.material.opacity =
          (0.18 + currentTier * 0.02 + 0.06 * Math.sin(timeRef * 1.5)) * (0.4 + alpha * 0.6);
      }
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      mounted = false;
      if (frameId) cancelAnimationFrame(frameId);
      unsubWings();
      clearParts();
      if (group && group.parent) group.parent.remove(group);
      if (group) disposeNode(group);
    };
  }, []);

  return null;
}