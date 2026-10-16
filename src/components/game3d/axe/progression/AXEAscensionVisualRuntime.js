import * as THREE from 'three';

// Wuxia blueprint v3 §4.1 — the ascended hero: floats a little above the ground over a
// soft glow, wears the Angel Cloak, sends a shockwave out from single-hit skills
// (Destroyer) and shows the Defensive shield as a bubble. Procedural, like the halo
// runtime, until authored assets exist.
//
// The hover only lifts the model's children (the skeleton, attached effects): the model
// root, which the game snaps to the ground and collides with, is never moved. The skin
// follows the bones, so the lift runs in lateUpdate(), after the animation mixer.
const CLOAK_H = 1.05, CLOAK_SEG_X = 10, CLOAK_SEG_Y = 14, FLOOR_FX_Y = 0.1;
const CLOAK_TOP_W = 0.36, CLOAK_HEM_W = 0.76; // narrow at the shoulders, flared at the hem
const CLOAK_WRAP_TOP = 0.15, CLOAK_WRAP_HEM = 0.05; // how far the edges wrap forward round the body

function embroideryTexture() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const g = c.getContext('2d'); if (!g) return null;
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#fbf7ee'); grad.addColorStop(1, '#e9e1cf');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 256);
  g.fillStyle = '#c9a24a';
  g.fillRect(0, 0, 9, 256); g.fillRect(119, 0, 9, 256); g.fillRect(0, 230, 128, 26); // gold trim and hem band
  g.fillStyle = '#e9cf86'; g.fillRect(12, 0, 2, 226); g.fillRect(114, 0, 2, 226); g.fillRect(0, 222, 128, 3);
  g.fillRect(62, 0, 4, 222); // the centre seam
  g.fillStyle = '#c9a24a';
  for (let i = 0; i < 8; i++) { // stars either side of the seam: the celestial embroidery
    const x = i % 2 ? 88 : 40, y = 30 + i * 25;
    g.beginPath();
    for (let k = 0; k < 10; k++) { const r = k % 2 ? 3.4 : 8.5, a = (k / 10) * Math.PI * 2 - Math.PI / 2; g[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); }
    g.closePath(); g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function radialTexture() { // soft-edged pool of light
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const g = c.getContext('2d'); if (!g) return null;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.55, 'rgba(255,255,255,0.45)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function createAXEAscensionVisualRuntime({ model, initialState = null } = {}) {
  if (!model) return { update() {}, dispose() {} };

  const group = new THREE.Group();
  group.name = 'AXE_Ascension_Runtime';
  model.add(group);
  const ground = new THREE.Group(); // stays on the floor while the body hovers
  ground.name = 'AXE_Ascension_Ground';
  ground.userData.axeNoHover = true;
  model.add(ground);
  // the avatar loader scales the model to the character's height: effects are sized in metres
  const unit = 1 / (model.scale.y || 1);
  group.scale.setScalar(unit); ground.scale.setScalar(unit);

  const additive = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });

  // levitation glow under the feet
  const glowGeo = new THREE.CircleGeometry(0.6, 40);
  const glowTex = radialTexture();
  const glowMat = additive(0xfff1c9, 0.42);
  glowMat.map = glowTex;
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = -Math.PI / 2; glow.position.y = FLOOR_FX_Y; // above road and path decals, which sit up to ~7 cm high
  ground.add(glow);

  // the Angel Cloak: hangs from the shoulders down the back and sways
  const cloakGeo = new THREE.PlaneGeometry(1, 1, CLOAK_SEG_X, CLOAK_SEG_Y);
  { // taper it and wrap the edges forward round the body; the top edge sits at the shoulders
    const p = cloakGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i), v = 0.5 - p.getY(i); // u: -0.5..0.5 across, v: 0 at the top .. 1 at the hem
      p.setXYZ(i, u * (CLOAK_TOP_W + (CLOAK_HEM_W - CLOAK_TOP_W) * v), -v * CLOAK_H,
        (2 * u) ** 2 * (CLOAK_WRAP_TOP + (CLOAK_WRAP_HEM - CLOAK_WRAP_TOP) * v));
    }
    cloakGeo.computeVertexNormals();
  }
  const basePos = Float32Array.from(cloakGeo.attributes.position.array);
  const cloakTex = embroideryTexture();
  // partly self-lit, so it still reads as ivory and gold in a night scene
  const cloakMat = new THREE.MeshStandardMaterial({
    color: 0xfaf6ec, map: cloakTex, emissive: 0xffffff, emissiveMap: cloakTex, emissiveIntensity: 0.35,
    roughness: 0.6, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.96,
  });
  const cloak = new THREE.Mesh(cloakGeo, cloakMat);
  cloak.position.set(0, 1.42, -0.17);
  cloak.rotation.x = 0.12;
  group.add(cloak);

  // Defensive shield bubble
  const bubbleGeo = new THREE.SphereGeometry(0.95, 24, 16);
  const bubbleMat = additive(0x9fe7ff, 0);
  const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
  bubble.position.y = 0.95;
  group.add(bubble);

  // Destroyer shockwaves
  const waveGeo = new THREE.RingGeometry(0.9, 1, 64);
  const waves = [];
  const onStrike = (event) => {
    if (!event?.detail?.ascensionShockwave || !active) return;
    const mat = additive(0xffe2a0, 0.8); mat.side = THREE.DoubleSide;
    const ring = new THREE.Mesh(waveGeo, mat);
    ring.rotation.x = -Math.PI / 2; ring.position.y = FLOOR_FX_Y + 0.01;
    ring.userData = { t: 0, life: 0.45 };
    ground.add(ring); waves.push(ring);
  };

  let active = false, cloakVisible = false, hover = 0, elapsed = 0, shieldAmount = 0, shieldUntil = 0, lift = 0;
  const applyState = (s = {}) => {
    active = !!s.ascended;
    cloakVisible = active && s.cloakVisible !== false;
    hover = active ? Number(s.hoverHeight || 0) : 0;
    group.visible = active; ground.visible = active;
    cloak.visible = cloakVisible;
    if (!active) shieldAmount = 0;
  };
  applyState(initialState || {});
  const onChange = (e) => applyState(e?.detail || {});
  const onShield = (e) => { shieldAmount = Number(e?.detail?.amount) || 0; shieldUntil = Number(e?.detail?.expiresAt) || Infinity; };
  if (typeof window !== 'undefined') {
    window.addEventListener('axeAscensionChanged', onChange);
    window.addEventListener('axeAscensionShield', onShield);
    window.addEventListener('playerSkillStrike', onStrike);
  }

  // A child the mixer rewrote since the last lift (an animated root bone) takes its new
  // height as the base; one nobody touched keeps the base it had.
  const liftChildren = (offset) => {
    for (const child of model.children) {
      const ud = child.userData;
      if (ud.axeNoHover) continue;
      const base = ud.axeHoverWritten === child.position.y ? ud.axeHoverBase : child.position.y;
      ud.axeHoverBase = base;
      ud.axeHoverWritten = child.position.y = base + offset * unit;
    }
  };

  return {
    update(delta = 0) {
      const dt = Math.min(0.1, Math.max(0, Number(delta) || 0));
      elapsed += dt;
      lift = active ? hover + Math.sin(elapsed * 1.6) * 0.03 : 0;
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i]; w.userData.t += dt;
        const k = Math.min(1, w.userData.t / w.userData.life);
        w.scale.setScalar(0.3 + 3.2 * k); w.material.opacity = 0.8 * (1 - k);
        if (k >= 1) { ground.remove(w); w.material.dispose(); waves.splice(i, 1); }
      }
      if (!active) return;
      glowMat.opacity = 0.38 + Math.sin(elapsed * 2.2) * 0.08;
      const shieldTarget = shieldAmount > 0 && Date.now() < shieldUntil ? 0.22 : 0; // the shield fades on its own, without an event
      bubbleMat.opacity += (shieldTarget - bubbleMat.opacity) * Math.min(1, dt * 6);
      bubble.visible = bubbleMat.opacity > 0.01;
      if (cloakVisible) { // the cloth sways more toward the hem
        const pos = cloakGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const y = basePos[i * 3 + 1], x = basePos[i * 3], depth = -y / CLOAK_H;
          pos.array[i * 3 + 2] = basePos[i * 3 + 2] - depth * depth * (0.12 + Math.sin(elapsed * 2.4 + x * 3 + y * 2) * 0.05);
        }
        pos.needsUpdate = true;
      }
    },
    // after the animation mixer has posed the skeleton for this frame
    lateUpdate() { liftChildren(lift); },
    dispose() {
      if (typeof window !== 'undefined') {
        window.removeEventListener('axeAscensionChanged', onChange);
        window.removeEventListener('axeAscensionShield', onShield);
        window.removeEventListener('playerSkillStrike', onStrike);
      }
      liftChildren(0);
      model.children.forEach((c) => { delete c.userData.axeHoverBase; delete c.userData.axeHoverWritten; });
      waves.forEach((w) => w.material.dispose());
      if (group.parent) group.parent.remove(group);
      if (ground.parent) ground.parent.remove(ground);
      [glowGeo, cloakGeo, bubbleGeo, waveGeo].forEach((g) => g.dispose());
      [glowMat, cloakMat, bubbleMat].forEach((m) => m.dispose());
      cloakTex?.dispose(); glowTex?.dispose();
    },
  };
}
