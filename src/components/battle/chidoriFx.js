// Chidori FX: procedural cartoon lightning for the Chidori_Ultimate clip.
// Rig-agnostic: it only reads bone positions (hand_r / fingers_r of the attacker, a few bones of the victim), so the
// same effect plays identically on every character. Deterministic: everything is a function of the clip time
// (bolts re-roll "on twos", like hand-drawn anime lightning).
//
//   const fx = createChidoriFx(THREE, scene, { lights: true });
//   each frame:  const out = fx.update({ ta, tv, camera, att: { bone: (n) => Vector3, fwd: Vector3 }, vic: { bone, root } });
//   out = { flash, invert, lines, linesCenter (world Vector3 or null), shake, aberration, exposure }
export function createChidoriFx(THREE, scene, opts = {}) {
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const win = (t, a, b) => sstep(a, b, t);
  const bump = (t, a, m, b) => win(t, a, m) * (1 - win(t, m, b));
  const lerp = (a, b, u) => a + (b - a) * u;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash = (...k) => k.reduce((h, x) => Math.imul(h ^ Math.floor(x * 1000 + 7919), 2654435761) >>> 0, 2166136261);
  const COL = { core: new THREE.Color(1.0, 1.0, 1.0), mid: new THREE.Color(0.28, 0.72, 1.0), glow: new THREE.Color(0.06, 0.26, 1.0) };
  const group = new THREE.Group(); group.name = 'ChidoriFX'; scene.add(group);

  // ------------------------------------------------------------------------------------------ ribbon batch (bolts)
  const MAXV = 24000;
  const rPos = new Float32Array(MAXV * 3), rUv = new Float32Array(MAXV * 2), rI = new Float32Array(MAXV);
  const rIdx = new Uint32Array(MAXV * 3);
  const rGeo = new THREE.BufferGeometry();
  rGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3).setUsage(THREE.DynamicDrawUsage));
  rGeo.setAttribute('uv', new THREE.BufferAttribute(rUv, 2).setUsage(THREE.DynamicDrawUsage));
  rGeo.setAttribute('aI', new THREE.BufferAttribute(rI, 1).setUsage(THREE.DynamicDrawUsage));
  rGeo.setIndex(new THREE.BufferAttribute(rIdx, 1).setUsage(THREE.DynamicDrawUsage));
  const rMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide,
    uniforms: { uCore: { value: COL.core }, uMid: { value: COL.mid }, uGlow: { value: COL.glow }, uGain: { value: 1.0 } },
    vertexShader: `attribute float aI; varying vec2 vUv; varying float vI;
      void main(){ vUv = uv; vI = aI; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uCore, uMid, uGlow; uniform float uGain; varying vec2 vUv; varying float vI;
      void main(){
        float a = abs(vUv.y * 2.0 - 1.0);
        float core = 1.0 - smoothstep(0.16, 0.24, a);            // hard-edged white core (cel look)
        float mid = 1.0 - smoothstep(0.40, 0.50, a);             // hard-edged cyan band
        float glow = pow(max(1.0 - a, 0.0), 2.2);
        vec3 c = uGlow * glow * 0.55;
        c = mix(c, uMid * 0.95, mid);
        c = mix(c, uCore * 1.5, core);
        gl_FragColor = vec4(c * vI * uGain, 1.0);
      }` });
  const ribbons = new THREE.Mesh(rGeo, rMat); ribbons.frustumCulled = false; ribbons.renderOrder = 5; group.add(ribbons);
  let nv = 0, ni = 0;
  const _t = V(), _s = V(), _v = V();
  function strip(pts, width, inten, cam, taper = true) {
    const n = pts.length; if (n < 2 || nv + n * 2 >= MAXV) return;
    const base = nv;
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      if (i === 0) _t.subVectors(pts[1], pts[0]); else if (i === n - 1) _t.subVectors(pts[n - 1], pts[n - 2]); else _t.subVectors(pts[i + 1], pts[i - 1]);
      _v.subVectors(p, cam); _s.crossVectors(_t, _v).normalize();
      const u = i / (n - 1);
      const w = (typeof width === 'function' ? width(u) : width) * (taper ? (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, u * 1.1 + 0.05))) : 1);
      for (const sg of [-1, 1]) {
        rPos[nv * 3] = p.x + _s.x * w * sg; rPos[nv * 3 + 1] = p.y + _s.y * w * sg; rPos[nv * 3 + 2] = p.z + _s.z * w * sg;
        rUv[nv * 2] = u; rUv[nv * 2 + 1] = sg < 0 ? 0 : 1; rI[nv] = inten; nv++;
      }
      if (i < n - 1) { const a = base + i * 2; rIdx[ni++] = a; rIdx[ni++] = a + 1; rIdx[ni++] = a + 2; rIdx[ni++] = a + 1; rIdx[ni++] = a + 3; rIdx[ni++] = a + 2; }
    }
  }
  // jagged bolt from a to b (midpoint displacement) with optional branches
  function boltPath(a, b, r, jag = 0.22, depth = 5) {
    let pts = [a.clone(), b.clone()];
    const d = V().subVectors(b, a); const L = d.length(); const dn = d.clone().normalize();
    const ax1 = V().crossVectors(dn, Math.abs(dn.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0)).normalize(); const ax2 = V().crossVectors(dn, ax1);
    let amp = L * jag;
    for (let k = 0; k < depth; k++) {
      const np = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const m = V().addVectors(pts[i], pts[i + 1]).multiplyScalar(0.5);
        m.addScaledVector(ax1, (r() - 0.5) * amp).addScaledVector(ax2, (r() - 0.5) * amp);
        np.push(m, pts[i + 1]);
      }
      pts = np; amp *= 0.52;
    }
    return pts;
  }
  function bolt(a, b, seed, { w = 0.02, inten = 1, jag = 0.22, branches = 2, depth = 5, cam }) {
    const r = rng(seed);
    const pts = boltPath(a, b, r, jag, depth);
    strip(pts, w, inten, cam);
    const L = a.distanceTo(b);
    for (let k = 0; k < branches; k++) {
      const i = 2 + Math.floor(r() * (pts.length - 4)); if (i >= pts.length - 1) continue;
      const p = pts[i]; const dir = V().subVectors(pts[Math.min(i + 2, pts.length - 1)], p).normalize();
      dir.add(V(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(1.6)).normalize();
      const e = p.clone().addScaledVector(dir, L * (0.15 + r() * 0.3));
      strip(boltPath(p, e, r, jag * 1.1, depth - 2), w * 0.6, inten * 0.8, cam);
    }
  }

  // ------------------------------------------------------------------------------------------ glow sprites
  function radialTex(stops) {
    const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    for (const [o, c] of stops) gr.addColorStop(o, c);
    g.fillStyle = gr; g.fillRect(0, 0, S, S); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const texOrb = radialTex([[0, 'rgba(255,255,255,1)'], [0.14, 'rgba(230,248,255,1)'], [0.26, 'rgba(90,190,255,0.8)'], [0.55, 'rgba(20,90,255,0.25)'], [1, 'rgba(0,30,255,0)']]);
  const texSoft = radialTex([[0, 'rgba(90,170,255,0.7)'], [0.4, 'rgba(30,100,255,0.25)'], [1, 'rgba(0,20,255,0)']]);
  function sprite(tex, scale = 1) {
    const m = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false });
    const s = new THREE.Sprite(m); s.scale.setScalar(scale); s.renderOrder = 6; group.add(s); return s;
  }
  const orb = sprite(texOrb), orbHalo = sprite(texSoft), impactGlow = sprite(texOrb), impactHalo = sprite(texSoft), fistGlow = sprite(texOrb);

  // ------------------------------------------------------------------------------------------ sparks (points)
  const MAXP = 1400;
  const pPos = new Float32Array(MAXP * 3), pSize = new Float32Array(MAXP), pI = new Float32Array(MAXP);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
  pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSize, 1).setUsage(THREE.DynamicDrawUsage));
  pGeo.setAttribute('aI', new THREE.BufferAttribute(pI, 1).setUsage(THREE.DynamicDrawUsage));
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { uScale: { value: 600 } },
