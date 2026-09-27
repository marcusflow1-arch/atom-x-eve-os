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
    vertexShader: `attribute float aSize; attribute float aI; varying float vI; uniform float uScale;
      void main(){ vI = aI; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vI; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; if (r > 1.0) discard;
      float core = 1.0 - smoothstep(0.25, 0.45, r); vec3 c = mix(vec3(0.15, 0.5, 1.0) * (1.0 - r), vec3(1.8), core); gl_FragColor = vec4(c * vI, 1.0); }` });
  const points = new THREE.Points(pGeo, pMat); points.frustumCulled = false; points.renderOrder = 6; group.add(points);
  let np = 0;
  function spark(p, size, inten) { if (np >= MAXP) return; pPos[np * 3] = p.x; pPos[np * 3 + 1] = p.y; pPos[np * 3 + 2] = p.z; pSize[np] = size; pI[np] = inten; np++; }
  // analytic burst: n sparks from p0 with speed v, drag, gravity; age = t - t0
  function burst(p0, t, t0, seed, n, speed, life, dir = null, cone = 1.0, size = 0.02, gravity = 3.0) {
    const age = t - t0; if (age < 0 || age > life * 1.4) return;
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      let d = V(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize();
      if (dir) d = dir.clone().addScaledVector(d, cone).normalize();
      const sp = speed * (0.35 + r() * 0.9); const lf = life * (0.5 + r() * 0.7);
      if (age > lf) continue;
      const k = 3.0; const s = sp * (1 - Math.exp(-k * age)) / k;
      const p = p0.clone().addScaledVector(d, s); p.y -= 0.5 * gravity * age * age * 0.5;
      if (p.y < 0.01) p.y = 0.01;
      const fl = 0.6 + 0.4 * ((hash(seed, i, Math.floor(t * 30)) % 100) / 100);
      spark(p, size * (0.6 + r() * 0.8), (1 - age / lf) * 1.6 * fl);
    }
  }

  // ------------------------------------------------------------------------------------------ ground disk + scorch + rings
  const noiseGLSL = `
    float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
    float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a * vn(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }`;
  const diskMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { uT: { value: 0 }, uI: { value: 0 }, uR: { value: 1.3 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT, uI, uR; varying vec2 vP; ${noiseGLSL}
      void main(){
        float r = length(vP) / uR; if (r > 1.0) discard;
        float ang = atan(vP.y, vP.x);
        vec2 q = vP * 2.2 + vec2(fbm(vP * 1.7 + uT), fbm(vP * 1.7 - uT)) * 1.6;
        float ridge = 1.0 - abs(fbm(q + uT * 0.5) * 2.0 - 1.0);
        float lines = pow(ridge, 14.0) * 2.2;
        float spokes = pow(max(0.0, 1.0 - abs(fract(ang * 3.0 / 3.14159 + fbm(vec2(r * 3.0, uT)) * 0.6) - 0.5) * 7.0), 3.0) * smoothstep(0.1, 0.5, r) * 0.6;
        float rim = smoothstep(0.84, 0.95, r) * (1.0 - smoothstep(0.95, 1.0, r)) * 2.2;
        float fill = (1.0 - r) * 0.35 + 0.08;
        float fillf = fill * (1.0 - smoothstep(0.3, 1.0, r) * 0.6);
        vec3 c = vec3(0.03, 0.16, 1.0) * fillf * 0.3 + vec3(0.25, 0.65, 1.0) * (lines + spokes) * 0.5 + vec3(0.3, 0.7, 1.0) * rim * 0.32;
        c += vec3(0.6, 0.9, 1.0) * pow(max(0.0, 1.0 - r * 2.6), 3.0) * 0.35;
        gl_FragColor = vec4(c * uI, 1.0);
      }` });
  const disk = new THREE.Mesh(new THREE.CircleGeometry(1.6, 64), diskMat); disk.rotation.x = -Math.PI / 2; disk.renderOrder = 3; group.add(disk);
  const scorchMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false,
    uniforms: { uDark: { value: 0 }, uGlow: { value: 0 }, uR: { value: 1.2 }, uSeed: { value: 3.0 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uDark, uGlow, uR, uSeed; varying vec2 vP; ${noiseGLSL}
      void main(){
        float r = length(vP) / uR; if (r > 1.0) discard;
        float ang = atan(vP.y, vP.x);
        float n = fbm(vec2(ang * 2.6, r * 2.0) + uSeed);
        float cr = 1.0 - smoothstep(0.0, 0.05, abs(fract(ang * 9.0 / 6.28318 + n * 0.9 + r * 0.35) - 0.5) - 0.44);
        cr *= smoothstep(1.0, 0.25, r) * step(0.12, r);
        float dark = smoothstep(1.0, 0.2, r + (fbm(vP * 4.0 + uSeed) - 0.5) * 0.4);
        vec3 glow = vec3(0.3, 0.7, 1.0) * cr * 1.6 * uGlow;
        float a = max(dark * 0.72 * uDark, cr * max(uGlow, uDark * 0.6));
        vec3 base = mix(vec3(0.02, 0.02, 0.04), glow, clamp(cr * uGlow * 2.0, 0.0, 1.0));
        gl_FragColor = vec4(base + glow, a);
      }` });
  const scorch = new THREE.Mesh(new THREE.CircleGeometry(1.4, 64), scorchMat); scorch.rotation.x = -Math.PI / 2; scorch.renderOrder = 2; group.add(scorch);
  const ringMat = () => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide,
    uniforms: { uI: { value: 0 }, uW: { value: 0.12 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uI, uW; varying vec2 vP; void main(){ float r = length(vP); float d = abs(r - (1.0 - uW)) / uW;
      float a = pow(max(0.0, 1.0 - d), 2.0); float core = 1.0 - smoothstep(0.15, 0.3, d);
      gl_FragColor = vec4((vec3(0.2, 0.55, 1.0) * a * 0.8 + vec3(1.6) * core) * uI, 1.0); }` });
  const mkRing = () => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 96), ringMat()); m.renderOrder = 4; group.add(m); return m; };
  const groundRing = mkRing(), impactRing = mkRing(), impactRing2 = mkRing(), blastRing = mkRing(), fizzRing = mkRing();
  groundRing.rotation.x = -Math.PI / 2; blastRing.rotation.x = -Math.PI / 2;
  // victim skid marks (two dark furrows left by the feet while blasted back)
  const skidMat = new THREE.MeshBasicMaterial({ color: 0x05060c, transparent: true, opacity: 0, depthWrite: false });
  const skids = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), skidMat); m.rotation.x = -Math.PI / 2; m.renderOrder = 2; group.add(m); return m; });
  // dash scar on the ground (a glowing furrow along the hand's path)
  const scarMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { uI: { value: 0 }, uHead: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uI, uHead; varying vec2 vUv; ${noiseGLSL}
      void main(){ if (vUv.x > uHead) discard; float a = abs(vUv.y * 2.0 - 1.0);
        float w = 0.35 + 0.35 * fbm(vec2(vUv.x * 30.0, 1.0));
        float core = 1.0 - smoothstep(w * 0.25, w * 0.4, a); float g = pow(max(0.0, 1.0 - a / w), 2.0);
        float fade = smoothstep(0.0, 0.25, vUv.x) * (0.4 + 0.6 * smoothstep(uHead - 0.5, uHead, vUv.x));
        gl_FragColor = vec4((vec3(0.1, 0.4, 1.0) * g * 0.8 + vec3(1.4) * core) * uI * fade, 1.0); }` });
  const scar = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), scarMat); scar.rotation.x = -Math.PI / 2; scar.renderOrder = 3; group.add(scar);
  const scarDark = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }));
  scarDark.rotation.x = -Math.PI / 2; scarDark.renderOrder = 2; group.add(scarDark);

  // ------------------------------------------------------------------------------------------ lights
  const handLight = new THREE.PointLight(0x8fd8ff, 0, 7, 1.6); group.add(handLight);
  const burstLight = new THREE.PointLight(0xc8ecff, 0, 12, 1.4); group.add(handLight, burstLight);

  // ------------------------------------------------------------------------------------------ state kept across frames
  const victimMats = [];
  let victimRef = null;

  function electrify(vicRoot, amount) {
    if (vicRoot !== victimRef) {
      victimRef = vicRoot; victimMats.length = 0;
      vicRoot?.traverse((o) => { if (o.isMesh && o.material && !/^FX/.test(o.material.name || '') && o.material.emissive) victimMats.push(o.material); });
      victimMats.forEach((m) => { m.userData.em0 = m.emissive.clone(); m.userData.ei0 = m.emissiveIntensity; });
    }
    for (const m of victimMats) {
      if (amount > 0.001) { m.emissive.setRGB(0.05, 0.3, 1.0); m.emissiveIntensity = amount; }
      else { m.emissive.copy(m.userData.em0); m.emissiveIntensity = m.userData.ei0; }
    }
  }

  function charge(ta) {
    return win(ta, 0.05, 0.3) * 0.35 + win(ta, 0.3, 0.42) * 0.35 + win(ta, 0.5, 1.0) * 0.3 - win(ta, 2.35, 2.6) * 0.55 - win(ta, 2.6, 3.0) * 0.25
      - win(ta, 3.0, 3.18) * 0.2;
  }
  function update(S) {
    const { ta, camera: cam } = S; const tv = S.tv ?? -1;
    nv = 0; ni = 0; np = 0;
    const camP = cam.getWorldPosition(V());
    const f2 = S.seedFrame ?? Math.floor(ta * 15 + 1000);            // on twos
    const since = S.since || ((e) => ta - e);            // video seconds since a clip time was reached (slow-mo safe)
    const out = { flash: 0, invert: 0, lines: 0, linesCenter: null, shake: 0, aberration: 0, exposure: 0 };
    const hand = S.att.bone('hand_r'), fing = S.att.bone('fingers_r');
    const palm = hand.clone().lerp(fing, 0.55);
    const fwd = S.att.fwd.clone();
    const active = ta > -0.01 && ta < 4.3;
    const path = S.att.pathAt;                           // (t) -> { palm, tip } world, from the precomputed clip path
    const c = active ? clamp(charge(ta), 0, 1) : 0;
    const flick = (k) => 0.75 + 0.25 * Math.sin(ta * 97 + k * 13.1) * Math.sin(ta * 61 + k * 5.7);

    // ---------------- orb + hand arcs
    const orbI = c * flick(1);
    orb.visible = orbHalo.visible = orbI > 0.01;
    if (orb.visible) {
      orb.position.copy(palm); orbHalo.position.copy(palm);
      const pulse = 1 + 0.12 * ((hash(f2, 3) % 100) / 100);
      orb.scale.setScalar((0.12 + 0.16 * c) * pulse); orbHalo.scale.setScalar((0.3 + 0.4 * c) * pulse);
      orb.material.opacity = Math.min(1, orbI * 1.1); orbHalo.material.opacity = orbI * 0.35;
      const nArc = Math.round(3 + 8 * c);
      const r = rng(hash(f2, 11));
      for (let i = 0; i < nArc; i++) {
        const d = V(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize();
        const L = (0.08 + (0.12 + 0.3 * r()) * c);
        bolt(palm, palm.clone().addScaledVector(d, L), hash(f2, i, 17), { w: 0.012 + 0.012 * c, inten: 0.9 + 0.6 * r(), jag: 0.35, branches: r() < 0.5 ? 1 : 0, depth: 4, cam: camP });
      }
      // arcs crawling up the forearm
      const elbow = S.att.bone('lowerarm_r');
      for (let i = 0; i < Math.round(2 + 3 * c); i++) {
        const a = hand.clone().lerp(elbow, r() * 0.9).add(V(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.12));
        const b = hand.clone().lerp(elbow, r()).add(V(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.12));
        bolt(a, b, hash(f2, i, 23), { w: 0.008, inten: 0.8 * c, jag: 0.4, branches: 0, depth: 3, cam: camP });
      }
      for (let i = 0; i < Math.round(8 + 18 * c); i++) {
        const d = V(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize();
        spark(palm.clone().addScaledVector(d, 0.05 + r() * (0.15 + 0.25 * c)), 0.01 + r() * 0.016, 0.5 + 0.8 * r());
      }
      handLight.position.copy(palm); handLight.intensity = (0.4 + 1.8 * c) * flick(2) * (opts.lights === false ? 0 : 1);
    } else handLight.intensity = 0;

    // ---------------- ground: slam, disk, rising bolts, hand -> ground bolts, scorch
    let g = null;
    if (ta >= 0.28 && active) { const q = path(0.30).palm; g = V(q.x, 0.012, q.z); }
    const diskI = g ? (win(ta, 0.28, 0.36) * 1.6 - win(ta, 0.36, 0.5) * 0.6 + bump(ta, 0.9, 1.0, 1.2) * 0.5) * (1 - win(ta, 1.35, 1.75)) : 0;
    disk.visible = diskI > 0.01;
    if (disk.visible) { disk.position.copy(g); diskMat.uniforms.uI.value = diskI * flick(4); diskMat.uniforms.uT.value = Math.floor(ta * 15) * 0.37; diskMat.uniforms.uR.value = 1.0 + 0.2 * win(ta, 0.3, 0.6); }
    scorch.visible = !!g && ta > 0.3;
    if (scorch.visible) { scorch.position.set(g.x, 0.008, g.z); scorchMat.uniforms.uDark.value = win(ta, 0.3, 0.5); scorchMat.uniforms.uGlow.value = win(ta, 0.3, 0.36) * (1 - win(ta, 1.2, 3.2)) * flick(5); }
    const ringU = (ta - 0.3) / 0.4;
    groundRing.visible = !!g && ringU > 0 && ringU < 1;
    if (groundRing.visible) { groundRing.position.set(g.x, 0.03, g.z); groundRing.scale.setScalar(0.3 + 2.6 * Math.sqrt(ringU)); groundRing.material.uniforms.uI.value = (1 - ringU) * 1.4; groundRing.material.uniforms.uW.value = 0.1; }
    if (g && ta > 0.3 && ta < 1.4) {
      const r = rng(hash(f2, 31));
      // palm -> ground
      const nG = 2 + Math.floor(r() * 2);
      for (let i = 0; i < nG; i++) {
        const e = g.clone().add(V((r() - 0.5) * 0.7, 0, (r() - 0.5) * 0.7));
        bolt(palm, e, hash(f2, i, 37), { w: 0.02, inten: 1.2, jag: 0.25, branches: 1, depth: 5, cam: camP });
      }
      // crawling along the ground
      for (let i = 0; i < 5; i++) {
        const a0 = r() * Math.PI * 2; const r0 = 0.1 + r() * 0.4; const r1 = 0.7 + r() * 1.0;
        const a = g.clone().add(V(Math.cos(a0) * r0, 0.02, Math.sin(a0) * r0)); const b = g.clone().add(V(Math.cos(a0 + (r() - 0.5) * 0.6) * r1, 0.02, Math.sin(a0 + (r() - 0.5) * 0.6) * r1));
        bolt(a, b, hash(f2, i, 41), { w: 0.014, inten: 0.9, jag: 0.3, branches: 1, depth: 4, cam: camP });
      }
      // rising bolts (the "pillar" of the charge): bursts right after the slam and at the glare
      const rise = win(ta, 0.33, 0.4) * (1 - win(ta, 0.62, 0.8)) + bump(ta, 0.92, 1.0, 1.25) * 1.2 + 0.25 * win(ta, 0.4, 0.6) * (1 - win(ta, 1.2, 1.4));
      const nR = Math.round(rise * 3.2);
      for (let i = 0; i < nR; i++) {
        const a0 = Math.PI * (0.62 + r() * 1.76); const r0 = 0.45 + r() * 0.8;      // sides and behind (never between the camera and the face)
        const a = g.clone().add(V(Math.sin(a0) * r0, 0.02, Math.cos(a0) * r0 - 0.35));
        const b = a.clone().add(V((r() - 0.5) * 1.2, 1.8 + r() * 2.6, (r() - 0.5) * 0.8 - 0.2));
        bolt(a, b, hash(f2, i, 43), { w: 0.022 + 0.014 * r(), inten: 1.0, jag: 0.2, branches: 2, depth: 6, cam: camP });
      }
      burst(g.clone().setY(0.05), ta, 0.3, 991, 120, 5.5, 0.55, V(0, 1, 0), 1.1, 0.03, 4.0);
      burst(g.clone().setY(0.05), ta, 0.95, 992, 70, 4.5, 0.5, V(0, 1, 0), 0.9, 0.025, 4.0);
    }
    if (g) {
      out.flash += Math.max(0, 1 - Math.abs(since(0.30)) / 0.07) * 0.22;
      out.shake += bump(ta, 0.29, 0.31, 0.6) * 0.6 + (ta > 0.3 && ta < 1.35 ? 0.08 : 0) + bump(ta, 0.93, 0.98, 1.2) * 0.3;
    }

    // ---------------- dash: trail + ground scar + speed lines
    const trailI = win(ta, 1.42, 1.5) * (1 - win(ta, 2.05, 2.5));
    if (active && ta > 1.42 && trailI > 0.01) {
      const recent = []; const tEnd = Math.min(ta, 2.0);
      for (let tt = Math.max(1.40, tEnd - 0.3); tt <= tEnd + 1e-6; tt += 1 / 60) recent.push(path(tt).palm);
      if (recent.length > 1) {
        const r = rng(hash(f2, 51));
        for (let k = 0; k < 3; k++) {
          const pts = recent.map((p, i) => p.clone().add(V(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.07 + 0.05 * k)));
          if (ta < 2.02) pts.push(palm.clone());
          strip(pts, 0.035 - k * 0.008, trailI * (1.2 - k * 0.3), camP, false);
        }
        // hand -> ground arcs behind
        for (let i = 0; i < 3; i++) {
          const s = recent[Math.floor(r() * recent.length)];
          bolt(s, V(s.x + (r() - 0.5) * 0.3, 0.01, s.z - r() * 0.3), hash(f2, i, 53), { w: 0.014, inten: trailI, jag: 0.3, branches: 1, depth: 4, cam: camP });
        }
      }
    }
    const scarI = win(ta, 1.45, 1.55) * (1 - win(ta, 2.4, 3.6));
    scar.visible = scarDark.visible = active && ta > 1.45 && scarI > 0.01;
    if (scar.visible) {
      const a = path(1.45).palm, b = path(Math.min(ta, 1.98)).palm;
      const len = Math.max(0.1, Math.hypot(b.x - a.x, b.z - a.z));
      scar.position.set((a.x + b.x) / 2, 0.015, (a.z + b.z) / 2); scar.scale.set(len, 0.42, 1);
      scar.rotation.set(-Math.PI / 2, 0, Math.atan2(-(b.z - a.z), b.x - a.x)); scarMat.uniforms.uI.value = scarI * flick(7);
      scarDark.position.copy(scar.position).setY(0.01); scarDark.scale.set(len, 0.3, 1); scarDark.rotation.copy(scar.rotation); scarDark.material.opacity = 0.55 * win(ta, 1.45, 1.6);
      scarMat.uniforms.uHead.value = 1.0;
    }
    if (ta > 1.42 && ta < 2.0) { out.lines = Math.max(out.lines, 0.75 * win(ta, 1.42, 1.5)); out.aberration = 0.004; }

    // ---------------- impact
    const P = active && ta >= 1.999 ? path(2.0).tip.clone() : null;
    if (P) {
      const ti = since(2.0);
      const fl = [1.0, 0.0, 0.85, 0.3];            // flash frames: white, inverted, white, fading
      const fi = Math.floor(ti * 30 + 1e-4);
      if (fi >= 0 && fi < 4) { if (fi === 1) out.invert = 1; else out.flash = Math.max(out.flash, fl[fi]); }
      out.shake += (ti < 0.4 ? 1.0 : 0) * (1 - clamp(ti / 0.5, 0, 1)) * 1.4;
      out.lines = Math.max(out.lines, 1.0 * (1 - win(ta, 2.25, 2.45))); out.linesCenter = P.clone();
      out.aberration = Math.max(out.aberration, 0.01 * (1 - win(ta, 2.0, 2.4)));
      const burstI = win(ta, 1.999, 2.02) * (1 - win(ta, 2.33, 2.5));
      if (burstI > 0.01) {
        const r = rng(hash(f2, 61));
        const n = Math.round(7 * burstI) + 3;
        for (let i = 0; i < n; i++) {
          const d = fwd.clone().add(V((r() - 0.5) * 1.8, (r() - 0.35) * 1.4, (r() - 0.5) * 1.8)).normalize();
          const L = 0.8 + r() * 2.8 * burstI;
          bolt(P, P.clone().addScaledVector(d, L), hash(f2, i, 67), { w: 0.026 + 0.02 * r(), inten: 1.1 * burstI, jag: 0.2, branches: 2, depth: 6, cam: camP });
        }
        for (let i = 0; i < 6; i++) {
          const d = V(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize();
          bolt(P, P.clone().addScaledVector(d, 0.4 + r() * 0.9), hash(f2, i, 71), { w: 0.02, inten: burstI, jag: 0.3, branches: 1, depth: 5, cam: camP });
        }
        impactGlow.visible = impactHalo.visible = true;
        impactGlow.position.copy(P); impactHalo.position.copy(P);
        impactGlow.scale.setScalar((0.55 + 0.35 * ((hash(f2, 5) % 100) / 100)) * burstI); impactHalo.scale.setScalar(1.6 * burstI);
        impactGlow.material.opacity = burstI; impactHalo.material.opacity = burstI * 0.45;
        burstLight.position.copy(P); burstLight.intensity = 22 * burstI * flick(9);
      } else { impactGlow.visible = impactHalo.visible = false; burstLight.intensity = 0; }
      burst(P, ta, 2.0, 1201, 150, 7.0, 0.6, fwd, 1.2, 0.024, 5.0);
      burst(P, ta, 2.1, 1202, 60, 5.0, 0.5, null, 1.0, 0.018, 3.0);
      // vertical impact rings facing the strike
      for (const [ring, t0, dur, s0, s1, w] of [[impactRing, 2.0, 0.3, 0.15, 1.5, 0.08], [impactRing2, 2.08, 0.35, 0.15, 2.3, 0.05]]) {
        const u = (ta - t0) / dur; ring.visible = u > 0 && u < 1;
        if (ring.visible) { ring.position.copy(P); ring.lookAt(P.clone().add(fwd)); ring.scale.setScalar(s0 + (s1 - s0) * (1 - (1 - u) * (1 - u))); ring.material.uniforms.uI.value = (1 - u) * 1.8; ring.material.uniforms.uW.value = w; }
      }
    } else { impactGlow.visible = impactHalo.visible = impactRing.visible = impactRing2.visible = false; burstLight.intensity = 0; }

    // ---------------- blast (victim thrown): radial explosion
    const B = active && ta >= 2.349 ? path(2.35).tip.clone() : null;
    if (B) {
      const tb = ta - 2.35; const bI = (1 - clamp(tb / 0.4, 0, 1));
      if (bI > 0.01) {
        const r = rng(hash(f2, 81));
        for (let i = 0; i < Math.round(9 * bI) + 2; i++) {
          const d = V(r() * 2 - 1, (r() * 2 - 1) * 0.8, r() * 2 - 1).normalize();
          bolt(B, B.clone().addScaledVector(d, 1.0 + r() * 2.8 * bI), hash(f2, i, 83), { w: 0.028 + 0.016 * r(), inten: 1.15 * bI, jag: 0.2, branches: 2, depth: 6, cam: camP });
        }
        burstLight.position.copy(B); burstLight.intensity = Math.max(burstLight.intensity, 30 * bI);
        impactHalo.visible = true; impactHalo.position.copy(B); impactHalo.scale.setScalar(2.2 * bI); impactHalo.material.opacity = bI * 0.5;
      }
      out.flash = Math.max(out.flash, Math.max(0, 1 - Math.abs(since(2.35)) / 0.08) * 0.35);
      out.shake += bI * 1.1;
      burst(B, ta, 2.35, 1301, 220, 8.0, 0.7, null, 1.0, 0.03, 4.0);
      const u = tb / 0.5; blastRing.visible = u > 0 && u < 1;
      if (blastRing.visible) { blastRing.position.set(B.x, 0.04, B.z); blastRing.scale.setScalar(0.4 + 4.5 * Math.sqrt(u)); blastRing.material.uniforms.uI.value = (1 - u) * 1.6; blastRing.material.uniforms.uW.value = 0.06; }
    } else blastRing.visible = false;

    // ---------------- fizzle when the fist closes (finisher)
    const tf = ta - 3.12;
    fistGlow.visible = tf > -0.05 && tf < 0.35;
    if (fistGlow.visible) {
      const u = clamp((tf + 0.05) / 0.4, 0, 1); fistGlow.position.copy(palm); fistGlow.scale.setScalar(0.32 * (1 - u) + 0.04); fistGlow.material.opacity = (1 - u) * 0.85;
      burst(palm, ta, 3.12, 1401, 60, 2.2, 0.45, null, 1.0, 0.016, 1.0);
      const r = rng(hash(f2, 91));
      for (let i = 0; i < 4; i++) { const d = V(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize(); bolt(palm, palm.clone().addScaledVector(d, 0.2 + r() * 0.3), hash(f2, i, 93), { w: 0.01, inten: 1 - u, jag: 0.4, branches: 0, depth: 3, cam: camP }); }
    }
    const uf = (ta - 3.12) / 0.35; fizzRing.visible = uf > 0 && uf < 1;
    if (fizzRing.visible) { fizzRing.position.copy(palm); fizzRing.lookAt(camP); fizzRing.scale.setScalar(0.08 + 0.3 * uf); fizzRing.material.uniforms.uI.value = (1 - uf) * 0.8; fizzRing.material.uniforms.uW.value = 0.1; }

    // ---------------- victim electrified
    let el = 0;
    if (tv >= 0 && S.vic) {
      el = (tv < 0.4 ? 1.0 : 0) + (tv >= 0.4 ? Math.max(0, 1 - (tv - 0.4) / 1.4) * 0.55 : 0);
      for (const t0 of [0.88, 1.08, 1.27, 2.42, 2.78]) el += bump(tv, t0 - 0.02, t0 + 0.02, t0 + 0.15) * 0.7;
      const r = rng(hash(f2, 101));
      const B_ = ['pelvis', 'spine_02', 'head', 'hand_l', 'hand_r', 'lowerarm_l', 'lowerarm_r', 'calf_l', 'calf_r', 'foot_l', 'foot_r', 'upperarm_l', 'upperarm_r', 'thigh_l', 'thigh_r'];
      const pos = B_.map((n) => S.vic.bone(n));
      const center = S.vic.bone('spine_01');
      const nb = Math.round(8 * clamp(el, 0, 1.3));
      for (let i = 0; i < nb; i++) {
        const a = pos[Math.floor(r() * pos.length)], b = pos[Math.floor(r() * pos.length)];
        if (a.distanceTo(b) < 0.15) continue;
        const pa = a.clone().add(a.clone().sub(center).normalize().multiplyScalar(0.06)), pb = b.clone().add(b.clone().sub(center).normalize().multiplyScalar(0.06));
        bolt(pa, pb, hash(f2, i, 103), { w: 0.014, inten: 0.9 * clamp(el, 0, 1.2), jag: 0.28, branches: 1, depth: 5, cam: camP });
      }
      for (let i = 0; i < Math.round(25 * clamp(el, 0, 1)); i++) { const a = pos[Math.floor(r() * pos.length)]; spark(a.clone().add(V(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.3)), 0.015, 1); }
      if (S.vic.bowPos && tv < 0.4) burst(S.vic.bowPos, tv, 0.02, 1501, 80, 2.5, 0.5, null, 1.0, 0.02, 2.0);
      // skid: sparks off the feet and dark furrows while the victim is blasted back
      if (S.vic.rootDelta && tv > 0.34) {
        const d = S.vic.rootDelta(0.34);
        ['ball_l', 'ball_r'].forEach((n, k) => {
          const p = S.vic.bone(n); const a0 = p.clone().sub(d);
          const L = Math.hypot(d.x, d.z);
          skids[k].visible = L > 0.05;
          if (skids[k].visible) {
            skids[k].position.set((a0.x + p.x) / 2, 0.006, (a0.z + p.z) / 2); skids[k].scale.set(0.09, L, 1);
            skids[k].rotation.set(-Math.PI / 2, 0, Math.atan2(d.x, d.z) + Math.PI);
          }
          if (tv < 0.86) { const r = rng(hash(f2, 131, k)); for (let i = 0; i < 14; i++) spark(p.clone().add(V((r() - 0.5) * 0.2, r() * 0.25, (r() - 0.5) * 0.25 + 0.1)), 0.012 + r() * 0.012, 1.2 * (1 - (tv - 0.34) / 0.52)); }
        });
        skidMat.opacity = 0.55;
      } else { skids.forEach((m) => { m.visible = false; }); }
    }
    electrify(S.vic?.root, S.vic ? clamp(el, 0, 1.2) * (0.4 + 0.6 * ((hash(f2, 7) % 100) / 100)) * (tv < 0.4 ? 0.35 : 0.16) : 0);

    // ---------------- bow dissolve / re-form (Artemis as the attacker)
    if (S.att.bowPos) {
      burst(S.att.bowPos, ta, 0.0, 1601, 70, 2.0, 0.45, V(0, 1, 0), 1.2, 0.018, -1.0);
      if (ta > 3.6 && ta < 3.95) { const r = rng(hash(f2, 111)); const u = (ta - 3.6) / 0.35; for (let i = 0; i < 40; i++) { const d = V(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize(); spark(S.att.bowPos.clone().addScaledVector(d, 0.6 * (1 - u) * r()), 0.015, 1.2 * (1 - u * 0.7)); } }
    }

    // ---------------- flush
    rGeo.setDrawRange(0, ni);
    for (const k of ['position', 'uv', 'aI']) rGeo.attributes[k].needsUpdate = true; rGeo.index.needsUpdate = true;
    pGeo.setDrawRange(0, np);
    for (const k of ['position', 'aSize', 'aI']) pGeo.attributes[k].needsUpdate = true;
    return out;
  }
  function dispose() { group.removeFromParent(); electrify(victimRef, 0); }
  return { update, dispose, group };
}
