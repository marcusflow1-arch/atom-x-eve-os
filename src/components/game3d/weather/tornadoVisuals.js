import * as THREE from 'three';

/**
 * tornadoVisuals — the look of the funnel, kept separate from the physics.
 *
 * Three layers stacked to read as a real condensation funnel:
 *   1. STREAKS  — thousands of tiny white lines, each a short tangential arc of
 *                 gusty wind. This is what makes the rotation readable: the air
 *                 itself becomes visible where it's moving fastest.
 *   2. VAPOUR   — soft white cloud puffs packed along the funnel core, so the
 *                 spinning wind reads as a solid white spinning cloud.
 *   3. WALLCLOUD— big slow puffs at the cloud deck, mixing down into the funnel.
 *
 * createTornadoVisuals({ group, height }) → { setStrength, update, dispose }
 */

// Radius profile of the funnel: narrow rope at the ground, flaring to the deck.
export function funnelRadius(t, height) {
  const wobble = 1 + Math.sin(t * 9.0) * 0.05;
  return (1.1 + Math.pow(t, 1.7) * 13.5) * wobble;
}

function makePuffTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  // Two overlapping gradients => lumpy cloud edge instead of a clean disc.
  const base = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  base.addColorStop(0, 'rgba(255,255,255,0.95)');
  base.addColorStop(0.4, 'rgba(255,255,255,0.42)');
  base.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = base; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 5; i++) {
    const x = 40 + Math.random() * 48, y = 40 + Math.random() * 48, r = 18 + Math.random() * 22;
    const lg = g.createRadialGradient(x, y, 0, x, y, r);
    lg.addColorStop(0, 'rgba(255,255,255,0.30)');
    lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lg; g.fillRect(0, 0, 128, 128);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createTornadoVisuals({ group, height = 70 }) {
  const puffTex = makePuffTexture();
  const strengthRef = { value: 0 };

  // ─────────── 1. Wind streaks — the visible gusts ───────────
  const STREAKS = 2200;
  const streakPos = new Float32Array(STREAKS * 6);
  const streakCol = new Float32Array(STREAKS * 6);
  const streaks = [];
  for (let i = 0; i < STREAKS; i++) {
    streaks.push({
      ang: Math.random() * Math.PI * 2,
      t: Math.random(),                        // height along the funnel 0..1
      len: 0.18 + Math.random() * 0.5,         // arc length in radians
      spin: 2.6 + Math.random() * 3.4,         // faster near the rope
      climb: 0.05 + Math.random() * 0.22,      // fraction of height per second
      off: 0.85 + Math.random() * 0.45,        // radial jitter
      bright: 0.6 + Math.random() * 0.4,
    });
  }
  const streakGeo = new THREE.BufferGeometry();
  streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPos, 3));
  streakGeo.setAttribute('color', new THREE.BufferAttribute(streakCol, 3));
  const streakMat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 1,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const streakLines = new THREE.LineSegments(streakGeo, streakMat);
  streakLines.frustumCulled = false;
  group.add(streakLines);

  // ─────────── 2. Vapour core — the white spinning cloud ───────────
  const VAPOUR = 150;
  const vapour = [];
  for (let i = 0; i < VAPOUR; i++) {
    const t = Math.pow(i / (VAPOUR - 1), 0.85);
    const mat = new THREE.SpriteMaterial({
      map: puffTex, color: 0xffffff, transparent: true, opacity: 0,
      depthWrite: false, fog: true,
    });
    const s = new THREE.Sprite(mat);
    s.userData = {
      t,
      ang: Math.random() * Math.PI * 2,
      spin: 1.4 + Math.random() * 1.6,
      radMul: 0.55 + Math.random() * 0.7,
      size: 0.9 + Math.random() * 0.9,
      bright: 0.5 + Math.random() * 0.5,
    };
    vapour.push(s);
    group.add(s);
  }

  // ─────────── 3. Wall cloud at the deck ───────────
  const WALL = 16;
  const wall = [];
  for (let i = 0; i < WALL; i++) {
    const mat = new THREE.SpriteMaterial({
      map: puffTex, color: 0xdfe6f2, transparent: true, opacity: 0,
      depthWrite: false, fog: true,
    });
    const s = new THREE.Sprite(mat);
    const r = 14 + Math.random() * 16;
    s.userData = { ang: (i / WALL) * Math.PI * 2, rad: r, spin: 0.22 + Math.random() * 0.22, size: 22 + Math.random() * 16, yOff: Math.random() * 7 };
    s.scale.set(s.userData.size, s.userData.size * 0.62, 1);
    wall.push(s);
    group.add(s);
  }

  const setStrength = (s) => { strengthRef.value = s; };

  const update = (delta, timeSec) => {
    const s = strengthRef.value;

    // Streaks: ride the vortex, climbing as they spin. Each segment is drawn as
    // a short arc so it smears in the direction the wind is actually moving.
    for (let i = 0; i < STREAKS; i++) {
      const st = streaks[i];
      st.ang += delta * st.spin * (1.9 - st.t) * (0.35 + s);
      st.t += delta * st.climb * s;
      if (st.t > 1) st.t -= 1;

      // Funnel builds top-down: a streak is only lit once the funnel reaches it.
      const reach = THREE.MathUtils.clamp((s - (1 - st.t) * 0.5) / 0.5, 0, 1);
      const rad = funnelRadius(st.t, height) * st.off;
      const y = st.t * height;
      const a0 = st.ang, a1 = st.ang + st.len;
      const o = i * 6;
      streakPos[o] = Math.cos(a0) * rad;
      streakPos[o + 1] = y;
      streakPos[o + 2] = Math.sin(a0) * rad;
      streakPos[o + 3] = Math.cos(a1) * rad;
      streakPos[o + 4] = y + st.len * 0.6;
      streakPos[o + 5] = Math.sin(a1) * rad;

      // Bright at the leading end, fading along the tail — reads as motion blur.
      const b = reach * st.bright;
      streakCol[o] = streakCol[o + 1] = streakCol[o + 2] = b;
      const tail = b * 0.15;
      streakCol[o + 3] = streakCol[o + 4] = streakCol[o + 5] = tail;
    }
    streakGeo.attributes.position.needsUpdate = true;
    streakGeo.attributes.color.needsUpdate = true;

    // Vapour puffs packed along the core.
    for (let i = 0; i < VAPOUR; i++) {
      const sp = vapour[i];
      const u = sp.userData;
      u.ang += delta * u.spin * (1.8 - u.t) * (0.3 + s);
      const rad = funnelRadius(u.t, height) * u.radMul;
      const wob = (1 - u.t) * 1.5;
      sp.position.set(
        Math.cos(u.ang) * rad + Math.cos(timeSec * 1.3 + u.t * 6) * wob,
        u.t * height,
        Math.sin(u.ang) * rad + Math.sin(timeSec * 1.3 + u.t * 6) * wob,
      );
      const size = (2.6 + rad * 0.85) * u.size;
      sp.scale.set(size, size * 0.9, 1);
      const reach = THREE.MathUtils.clamp((s - (1 - u.t) * 0.5) / 0.5, 0, 1);
      sp.material.opacity = reach * 0.55 * u.bright;
      sp.material.rotation = u.ang * 0.6;
    }

    // Wall cloud slowly churning above, mixing down into the funnel.
    for (let i = 0; i < WALL; i++) {
      const sp = wall[i];
      const u = sp.userData;
      u.ang += delta * u.spin * (0.4 + s);
      sp.position.set(Math.cos(u.ang) * u.rad, height - 3 + u.yOff + Math.sin(timeSec * 0.5 + i) * 1.6, Math.sin(u.ang) * u.rad);
      sp.material.opacity = s * 0.4;
      sp.material.rotation = u.ang * 0.3;
    }
  };

  const dispose = () => {
    streakGeo.dispose(); streakMat.dispose();
    vapour.forEach((s) => s.material.dispose());
    wall.forEach((s) => s.material.dispose());
    puffTex.dispose();
  };

  return { setStrength, update, dispose };
}