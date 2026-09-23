/*!
 * Getsuga Tenshō — real-time three.js effects & controller
 * Character, animation and effects recreated from the Blender cinematic.
 * Requires: three (r155+; built/tested against r170).
 */
import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  Constants & small helpers
 * ------------------------------------------------------------------ */
export const FPS = 24;
export const CLIP_FRAMES = 168;               // frames 1..168
export const RELEASE_FRAME = 84;              // wave leaves the blade
const frameToTime = (f) => (f - 1) / FPS;
const timeToFrame = (t) => t * FPS + 1;

// Blender (Z-up, -Y forward) -> three (Y-up, +Z forward)
const b2t = (x, y, z) => new THREE.Vector3(x, z, -y);

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// keyframe curve: [[frame, value], ...]
function curve(keys, f, linear = false) {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i], [f1, v1] = keys[i + 1];
    if (f <= f1) {
      let u = (f - f0) / (f1 - f0);
      if (!linear) u = u * u * (3 - 2 * u);
      return v0 + (v1 - v0) * u;
    }
  }
  return keys[keys.length - 1][1];
}
function curveVec(keys, f, linear = false) {
  const a = [];
  for (let c = 0; c < keys[0][1].length; c++) a.push(curve(keys.map((k) => [k[0], k[1][c]]), f, linear));
  return a;
}
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/* Effect timeline — identical keys to the Blender FX_Control object */
export const FX_CURVES = {
  bladeGlow:   [[1, 0], [12, 0], [26, 1], [128, 1], [158, 0]],
  energyBlade: [[1, 0], [20, 0], [24, 0.45], [30, 0.6], [44, 1.0], [84, 1.0], [86, 0.4], [100, 0.55], [128, 0.5], [148, 0]],
  aura:        [[1, 0], [20, 0], [26, 0.75], [34, 0.5], [50, 0.8], [66, 1.0], [84, 1.0], [92, 0.6], [118, 0.35], [142, 0]],
  groundCrack: [[1, 0], [26, 0], [44, 0.5], [76, 1.0], [100, 1.0], [168, 0.35]],
  flash:       [[1, 0], [83, 0], [84, 1.0], [87, 0.35], [95, 0]],     // linear
};
export const EVENTS = [
  { frame: 21, name: 'ignite' }, { frame: 26, name: 'auraFlare' }, { frame: 40, name: 'lift' },
  { frame: 60, name: 'overhead' }, { frame: 80, name: 'strike' }, { frame: RELEASE_FRAME, name: 'release' },
];

export const PALETTES = {
  crimson: { core: [0.05, 0.0, 0.004], coreEmit: 0.4, rim: [0.85, 0.0, 0.015], rimEmit: 3.8, hot: [1.0, 0.25, 0.18], light: [1.0, 0.08, 0.05] },
  blue:    { core: [0.55, 0.8, 1.0],   coreEmit: 2.0, rim: [0.08, 0.45, 1.0],  rimEmit: 4.0, hot: [0.85, 0.95, 1.0], light: [0.3, 0.6, 1.0] },
};

/* ------------------------------------------------------------------ *
 *  GLSL: 4D simplex noise (Ashima Arts / Stefan Gustavson, MIT) + fbm
 * ------------------------------------------------------------------ */
const NOISE = /* glsl */`
vec4 gt_mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
float gt_mod289(float x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 gt_permute(vec4 x){return gt_mod289(((x*34.0)+10.0)*x);}
float gt_permute(float x){return gt_mod289(((x*34.0)+10.0)*x);}
vec4 gt_tis(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
float gt_tis(float r){return 1.79284291400159 - 0.85373472095314*r;}
vec4 gt_grad4(float j, vec4 ip){
  const vec4 ones = vec4(1.0,1.0,1.0,-1.0);
  vec4 p,s;
  p.xyz = floor(fract(vec3(j)*ip.xyz)*7.0)*ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz*2.0 - 1.0)*s.www;
  return p;
}
float gt_snoise(vec4 v){
  const vec4 C = vec4(0.138196601125011, 0.276393202250021, 0.414589803375032, -0.447213595499958);
  vec4 i = floor(v + dot(v, vec4(0.309016994374947451)));
  vec4 x0 = v - i + dot(i, C.xxxx);
  vec4 i0;
  vec3 isX = step(x0.yzw, x0.xxx);
  vec3 isYZ = step(x0.zww, x0.yyz);
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;
  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;
  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;
  vec4 i3 = clamp(i0, 0.0, 1.0);
  vec4 i2 = clamp(i0-1.0, 0.0, 1.0);
  vec4 i1 = clamp(i0-2.0, 0.0, 1.0);
  vec4 x1 = x0 - i1 + C.xxxx;
  vec4 x2 = x0 - i2 + C.yyyy;
  vec4 x3 = x0 - i3 + C.zzzz;
  vec4 x4 = x0 + C.wwww;
  i = gt_mod289(i);
  float j0 = gt_permute(gt_permute(gt_permute(gt_permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = gt_permute(gt_permute(gt_permute(gt_permute(
      i.w + vec4(i1.w, i2.w, i3.w, 1.0))
    + i.z + vec4(i1.z, i2.z, i3.z, 1.0))
    + i.y + vec4(i1.y, i2.y, i3.y, 1.0))
    + i.x + vec4(i1.x, i2.x, i3.x, 1.0));
  vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0);
  vec4 p0 = gt_grad4(j0, ip);
  vec4 p1 = gt_grad4(j1.x, ip);
  vec4 p2 = gt_grad4(j1.y, ip);
  vec4 p3 = gt_grad4(j1.z, ip);
  vec4 p4 = gt_grad4(j1.w, ip);
  vec4 norm = gt_tis(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  p4 *= gt_tis(dot(p4,p4));
  vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
  vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)), 0.0);
  m0 = m0*m0; m1 = m1*m1;
  return 49.0*(dot(m0*m0, vec3(dot(p0,x0), dot(p1,x1), dot(p2,x2))) + dot(m1*m1, vec2(dot(p3,x3), dot(p4,x4))));
}
// Blender-like "Noise Texture" factor: ~0.5 centred, 0..1
float gt_fbm(vec4 p, int oct, float rough){
  float s = 0.0, a = 1.0, n = 0.0;
  for (int i = 0; i < 5; i++){
    if (i >= oct) break;
    s += a*gt_snoise(p); n += a;
    p = vec4(p.xyz*2.0, p.w*1.5 + 3.1); a *= rough;
  }
  return clamp(0.5 + 0.36*s/n, 0.0, 1.0);
}
`;

const OUTPUT_CHUNK = /* glsl */`
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`;

/* ------------------------------------------------------------------ *
 *  Materials
 * ------------------------------------------------------------------ */
const _paletteMats = new Set();
function paletteUniforms(pal) {
  return {
    uCore: { value: new THREE.Vector3(...pal.core) }, uCoreEmit: { value: pal.coreEmit },
    uRim: { value: new THREE.Vector3(...pal.rim) }, uRimEmit: { value: pal.rimEmit },
    uHot: { value: new THREE.Vector3(...pal.hot) },
  };
}
function applyPalette(mat, pal) {
  const u = mat.uniforms;
  if (!u || !u.uCore) return;
  u.uCore.value.set(...pal.core); u.uCoreEmit.value = pal.coreEmit;
  u.uRim.value.set(...pal.rim); u.uRimEmit.value = pal.rimEmit; u.uHot.value.set(...pal.hot);
}

/**
 * Energy-flame surface shader (energy blade, crescent wave, impact dome/pillar).
 *  inside=true  -> dark core with a ragged glowing outline (Bankai look)
 *  inside=false -> flames licking off the silhouette
 * Works on SkinnedMesh too (skinning chunks are included).
 */
function makeFlameMaterial(pal, o) {
  const p = Object.assign({
    scale: 3, stretch: [1, 1, 1], flow: [0, 0, 0], wspeed: 1, octaves: 4, rough: 0.6,
    edgePow: 1.5, edgeW: 0.6, noiseW: 1.0, t0: 0.55, t1: 0.75, width: 0.08, emit: 1.0,
    inside: false, inflate: 0.0,
  }, o);
  const mat = new THREE.ShaderMaterial({
    uniforms: Object.assign(paletteUniforms(pal), {
      uTime: { value: 0 }, uIntensity: { value: 0 }, uAlpha: { value: 1 },
      uScale: { value: p.scale }, uStretch: { value: new THREE.Vector3(...p.stretch) },
      uFlow: { value: new THREE.Vector3(...p.flow) }, uWSpeed: { value: p.wspeed },
      uEdgePow: { value: p.edgePow }, uEdgeW: { value: p.edgeW }, uNoiseW: { value: p.noiseW },
      uT0: { value: p.t0 }, uT1: { value: p.t1 }, uWidth: { value: p.width }, uEmit: { value: p.emit },
      uInside: { value: p.inside ? 1 : 0 }, uInflate: { value: p.inflate },
    }),
    defines: { GT_OCTAVES: p.octaves, GT_ROUGH: p.rough.toFixed(3) },
    vertexShader: /* glsl */`
      #include <common>
      #include <skinning_pars_vertex>
      uniform float uInflate;
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){
        #include <beginnormal_vertex>
        #include <skinbase_vertex>
        #include <skinnormal_vertex>
        #include <begin_vertex>
        #include <skinning_vertex>
        transformed += normalize(objectNormal) * uInflate;
        vP = position;
        vec4 mv = modelViewMatrix * vec4(transformed, 1.0);
        vN = normalize(normalMatrix * objectNormal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uIntensity, uAlpha, uScale, uWSpeed, uEdgePow, uEdgeW, uNoiseW, uT0, uT1, uWidth, uEmit, uInside;
      uniform vec3 uStretch, uFlow, uCore, uRim, uHot; uniform float uCoreEmit, uRimEmit;
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      ${NOISE}
      void main(){
        if (uIntensity <= 0.001 || uAlpha <= 0.001) discard;
        float facing = 1.0 - abs(dot(normalize(vN), normalize(vV)));
        float e = uInside > 0.5 ? 1.0 - facing : facing;
        float edge = pow(max(e, 1e-4), uEdgePow);
        vec3 q = (vP * uStretch + uFlow * uTime) * uScale;
        float n = gt_fbm(vec4(q, uTime * uWSpeed), GT_OCTAVES, GT_ROUGH);
        float field = n * uNoiseW + edge * uEdgeW;
        float t0 = mix(uT0 + 0.6, uT0, uIntensity);
        float t1 = t0 + (uT1 - uT0);
        float outer = smoothstep(t0, t0 + uWidth, field);
        float inner = smoothstep(t1, t1 + uWidth, field);
        float a = outer * min(uIntensity, 1.0) * uAlpha;
        if (a < 0.004) discard;
        vec3 col = mix(uRim * uRimEmit, uCore * uCoreEmit, inner) * uEmit;
        gl_FragColor = vec4(col, a);
        ${OUTPUT_CHUNK}
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  _paletteMats.add(mat);
  return mat;
}

/* Flame cards (aura). Instanced camera-facing quads anchored on the body. */
function makeFlameCardMaterial(pal) {
  const mat = new THREE.ShaderMaterial({
    uniforms: Object.assign(paletteUniforms(pal), { uTime: { value: 0 }, uAura: { value: 0 } }),
    vertexShader: /* glsl */`
      attribute vec3 aPos; attribute vec3 aNrm; attribute float aRnd; attribute float aSize;
      uniform float uAura;
      varying vec2 vUv; varying float vRnd;
      void main(){
        vec3 V = cameraPosition - aPos;
        vec3 Vh = normalize(vec3(V.x, 0.0, V.z) + vec3(1e-5));
        vec3 up = vec3(0.0, 1.0, 0.0);
        vec3 right = normalize(cross(up, Vh));
        vec3 N = normalize(aNrm);
        float facing = abs(dot(N, normalize(V)));
        float sil = smoothstep(0.55, 0.15, facing);
        float upF = smoothstep(0.65, 0.95, N.y);
        float s = aSize * max(sil, upF) * uAura;
        vec3 up2 = normalize(up + right * ((aRnd - 0.5) * 0.5));
        vec3 p = aPos + right * (position.x * s) + up2 * ((position.y - 0.18) * s * 2.6);
        vUv = vec2(position.x + 0.5, position.y); vRnd = aRnd;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uCore, uRim, uHot; uniform float uCoreEmit, uRimEmit;
      varying vec2 vUv; varying float vRnd;
      ${NOISE}
      void main(){
        float u = vUv.x, v = vUv.y;
        float dx = abs(u - 0.5) * 2.0;
        float shape = (1.0 - dx) * pow(max(1.0 - v, 0.0), 0.9);
        vec4 nc = vec4(u * 1.6 * 3.2, (v - uTime * 2.2 + vRnd * 13.0) * 3.2, vRnd * 7.0, uTime * 1.1 + vRnd);
        float n = gt_fbm(nc, 3, 0.55);
        float field = shape * 1.3 + n;
        float outer = smoothstep(0.95, 1.12, field);
        float inner = smoothstep(1.12, 1.3, field);
        float a = outer * smoothstep(0.0, 0.12, v) * mix(1.0, 0.85, inner);
        if (a < 0.004) discard;
        vec3 col = mix(uRim * uRimEmit, uCore * uCoreEmit, inner) * 0.4;
        gl_FragColor = vec4(col, a);
        ${OUTPUT_CHUNK}
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  _paletteMats.add(mat);
  return mat;
}

/* Embers — additive soft points */
function makeEmberMaterial(pal) {
  const mat = new THREE.ShaderMaterial({
    uniforms: Object.assign(paletteUniforms(pal), { uViewportH: { value: 720 } }),
    vertexShader: /* glsl */`
      attribute float aLife; attribute float aSize;
      uniform float uViewportH;
      varying float vLife;
      void main(){
        vLife = aLife;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float alive = step(0.0, aLife) * step(aLife, 1.0);
        gl_PointSize = alive * aSize * projectionMatrix[1][1] * uViewportH * 0.5 / max(-mv.z, 0.05);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uRim, uHot; uniform float uRimEmit;
      varying float vLife;
      void main(){
        if (vLife < 0.0 || vLife > 1.0) discard;
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c) * 2.0;
        float a = smoothstep(1.0, 0.0, d);
        a *= smoothstep(0.0, 0.1, vLife) * (1.0 - smoothstep(0.6, 1.0, vLife));
        vec3 col = mix(uRim * uRimEmit, uHot * 3.0, 0.35) * a;
        gl_FragColor = vec4(col, a);
        ${OUTPUT_CHUNK}
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  _paletteMats.add(mat);
  return mat;
}

/* Ground cracks decal with radial reveal + scorch (premultiplied) */
function makeCrackMaterial(pal) {
  const mat = new THREE.ShaderMaterial({
    uniforms: Object.assign(paletteUniforms(pal), { uCrack: { value: 0 } }),
    vertexShader: /* glsl */`
      varying vec2 vP;
      void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uCrack; uniform vec3 uRim; uniform float uRimEmit;
      varying vec2 vP;
      ${NOISE}
      vec2 gt_h2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
      float gt_vorEdge(vec2 x){
        vec2 n = floor(x), f = fract(x), mg = vec2(0.0), mr = vec2(0.0); float md = 8.0;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
          vec2 g = vec2(float(i), float(j)); vec2 r = g + gt_h2(n + g) - f; float d = dot(r, r);
          if (d < md){ md = d; mr = r; mg = g; }
        }
        md = 8.0;
        for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++){
          vec2 g = mg + vec2(float(i), float(j)); vec2 r = g + gt_h2(n + g) - f;
          if (dot(mr - r, mr - r) > 1e-5) md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
        }
        return md;
      }
      void main(){
        if (uCrack <= 0.001) discard;
        vec2 p = vP;
        float n1 = gt_fbm(vec4(p * 2.5, 0.0, 1.3), 3, 0.5);
        float n2 = gt_fbm(vec4(p * 2.5, 5.2, 7.1), 3, 0.5);
        vec2 w = p + (vec2(n1, n2) - 0.5) * 0.5;
        float edge = gt_vorEdge(w * 1.1);
        float ck = 1.0 - smoothstep(0.0, 0.018, edge);
        float sparse = smoothstep(0.45, 0.58, gt_fbm(vec4(p * 1.3, 2.0, 0.0), 2, 0.5));
        float len = length(p);
        float rv = uCrack * 4.3 - (n1 * 0.8 + len);
        float rvm = clamp((rv + 0.2) / 0.8, 0.0, 1.0);
        float heat = clamp((3.0 - len) / 3.0, 0.0, 1.0);
        float glow = ck * sparse * rvm * heat;
        float scorch = rvm * 0.55 * smoothstep(4.5, 3.6, len);
        vec3 emi = uRim * uRimEmit * glow * 1.3;
        gl_FragColor = vec4(vec3(0.01) * scorch + emi, scorch);
      }`,
    transparent: true, depthWrite: false, premultipliedAlpha: true,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  _paletteMats.add(mat);
  return mat;
}

/* Slash trail ribbon (baked from the real swing) */
function makeTrailMaterial(pal) {
  const mat = new THREE.ShaderMaterial({
    uniforms: Object.assign(paletteUniforms(pal), { uFrame: { value: 0 } }),
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uFrame; uniform vec3 uCore, uRim; uniform float uCoreEmit, uRimEmit;
      varying vec2 vUv;
      ${NOISE}
      void main(){
        float head = (uFrame - 79.0) / 8.0;
        float d = head - vUv.x;
        float age = clamp((0.5 - d) / 0.5, 0.0, 1.0);
        float lead = clamp((d + 0.01) / 0.03, 0.0, 1.0);
        float vm = clamp((vUv.y - 0.1) / 0.75, 0.0, 1.0);
        float a2 = age * lead * vm;
        float n = gt_fbm(vec4(vUv.x * 14.0 * 1.5, vUv.y * 3.0 * 1.5, 0.0, uFrame * 0.3), 4, 0.5);
        float fld = n * 0.6 + a2;
        float outer = smoothstep(0.55, 0.65, fld);
        float inner = smoothstep(0.85, 1.0, fld);
        if (outer < 0.004) discard;
        vec3 col = mix(uRim * uRimEmit, uCore * uCoreEmit, inner);
        gl_FragColor = vec4(col, outer);
        ${OUTPUT_CHUNK}
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  _paletteMats.add(mat);
  return mat;
}

/* Ground gouge carved by the wave (premultiplied) */
function makeGougeMaterial(pal) {
  const mat = new THREE.ShaderMaterial({
    uniforms: Object.assign(paletteUniforms(pal), { uWaveDist: { value: -100 } }),
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vP;
      void main(){ vUv = uv; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uWaveDist; uniform vec3 uRim; uniform float uRimEmit;
      varying vec2 vUv; varying vec3 vP;
      ${NOISE}
      void main(){
        float behind = uWaveDist - vP.z;
        float rev = clamp((behind - 0.6) / 1.3, 0.0, 1.0);
        if (rev <= 0.0) discard;
        float heat = 0.12 + 0.88 * clamp((18.0 - behind) / 16.5, 0.0, 1.0);
        float nz = gt_fbm(vec4(vP * 2.5, 0.7), 4, 0.5);
        float c2 = abs(vUv.x - 0.5) * 2.0 + nz;
        float wid = clamp((1.35 - c2) / 0.35, 0.0, 1.0);
        float edge = clamp((c2 - 0.75) / 0.45, 0.0, 1.0);
        float a = rev * wid;
        vec3 col = vec3(0.006) + uRim * heat * edge * 9.0 * 0.45;
        gl_FragColor = vec4(col * a, a);
      }`,
    transparent: true, depthWrite: false, premultipliedAlpha: true,
    polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
  });
  _paletteMats.add(mat);
  return mat;
}

/* Shockwave ring (ground + air) */
function makeRingMaterial(pal) {
  const mat = new THREE.ShaderMaterial({
    uniforms: Object.assign(paletteUniforms(pal), { uFade: { value: 0 } }),
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vP;
      void main(){ vUv = uv; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uFade; uniform vec3 uRim; uniform float uRimEmit;
      varying vec2 vUv; varying vec3 vP;
      ${NOISE}
      void main(){
        if (uFade <= 0.001) discard;
        float band = sin(3.14159265 * vUv.y);
        float nz = gt_fbm(vec4(vP * 4.0, 0.0), 3, 0.5);
        float a = clamp(band * nz * uFade * 2.0, 0.0, 1.0);
        if (a < 0.004) discard;
        gl_FragColor = vec4(uRim * 4.0 * (uRimEmit / 3.8), a);
        ${OUTPUT_CHUNK}
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  _paletteMats.add(mat);
  return mat;
}

/* ------------------------------------------------------------------ *
 *  Geometry builders (ported from the Blender scene)
 * ------------------------------------------------------------------ */
// Crescent: arc in the local XY plane (three), travel along +Z, tips swept back (-Z).
function crescentGeometry({ R = 1.2, thmDeg = 76, T = 0.36, D = 0.16, bow = 0.55, NS = 90, NC = 16 } = {}) {
  const thm = THREE.MathUtils.degToRad(thmDeg);
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= NS; i++) {
    const s = i / NS, th = -thm + 2 * thm * s;
    const prof = Math.cos((th / thm) * Math.PI / 2);
    const thick = T * R * Math.pow(Math.max(prof, 0), 1.1) + 0.004;
    const dep = D * R * Math.pow(Math.max(prof, 0), 0.8) + 0.003;
    const rdx = Math.sin(th), rdz = Math.cos(th);                     // Blender radial dir (x,z)
    let cx = rdx * (R - thick * 0.5), cy = bow * R * Math.sin(th) ** 2, cz = rdz * (R - thick * 0.5) - R * 0.62;
    for (let k = 0; k < NC; k++) {
      const a = 2 * Math.PI * k / NC, rr = Math.cos(a), yy = Math.sin(a);
      const bx = cx + rdx * rr * thick * 0.5;
      const by = cy + yy * dep * 0.5 * (1 - 0.3 * Math.abs(rr));
      const bz = cz + rdz * rr * thick * 0.5;
      pos.push(bx, bz, -by);                                          // Blender -> three
      uv.push(s, k / NC);
    }
  }
  for (let i = 0; i < NS; i++) for (let k = 0; k < NC; k++) {
    const a = i * NC + k, b = (i + 1) * NC + k, c = (i + 1) * NC + (k + 1) % NC, d = i * NC + (k + 1) % NC;
    idx.push(a, b, c, a, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}

// Rocky chunk: noisy, flattened icosahedron
function rockGeometry(seed, detail = 1) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const r = mulberry32(seed), p = g.attributes.position, v = new THREE.Vector3();
  const f1 = [r() * 10, r() * 10, r() * 10], sq = 0.5 + r() * 0.4;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * 2.3 + f1[0]) * Math.sin(v.y * 2.9 + f1[1]) * Math.sin(v.z * 2.1 + f1[2]);
    v.multiplyScalar(1 + 0.4 * n); v.y *= sq;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

// Flat ring with radial v (0 inner -> 1 outer), lying in XY
function ringGeometry(inner = 0.8, outer = 1.0, seg = 96) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const a = 2 * Math.PI * i / seg, c = Math.cos(a), s = Math.sin(a);
    pos.push(c * inner, s * inner, 0, c * outer, s * outer, 0); uv.push(i / seg, 0, i / seg, 1);
  }
  for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/* Camera path sampled per frame from the Blender cinematic (three.js space, relative to the character).
   [px,py,pz, qw,qx,qy,qz, lens_mm] for frames 1..168 */
export const CAMERA_TRACK = [[2.1,1.05,3.3,0.95905,0.00629,0.28315,-0.00186,40.0],[2.0995,1.05,3.2993,0.95905,0.00629,0.28315,-0.00186,40.0],[2.098,1.05,3.2973,0.95906,0.0063,0.28313,-0.00186,40.0],[2.0955,1.0501,3.294,0.95906,0.00631,0.28311,-0.00186,40.0],[2.0922,1.0502,3.2896,0.95907,0.00632,0.28308,-0.00187,40.0],[2.0882,1.0504,3.2842,0.95908,0.00634,0.28304,-0.00187,40.0],[2.0834,1.0506,3.2779,0.9591,0.00637,0.283,-0.00188,40.0],[2.078,1.051,3.2707,0.95911,0.00641,0.28296,-0.00189,40.0],[2.0721,1.0515,3.2627,0.95912,0.00645,0.28291,-0.0019,40.0],[2.0656,1.0521,3.2542,0.95914,0.0065,0.28286,-0.00192,40.0],[2.0588,1.0529,3.2451,0.95915,0.00657,0.28281,-0.00194,40.0],[2.0516,1.0538,3.2355,0.95917,0.00664,0.28276,-0.00196,40.0],[2.0442,1.055,3.2256,0.95918,0.00673,0.28271,-0.00198,40.0],[2.0366,1.0563,3.2155,0.95919,0.00683,0.28266,-0.00201,40.0],[2.0289,1.0579,3.2052,0.9592,0.00694,0.28262,-0.00204,40.0],[2.0211,1.0597,3.1948,0.95921,0.00706,0.28259,-0.00208,40.0],[2.0134,1.0618,3.1845,0.95922,0.00721,0.28256,-0.00212,40.0],[2.0058,1.0641,3.1744,0.95923,0.00736,0.28254,-0.00217,40.0],[1.9984,1.0667,3.1645,0.95923,0.00754,0.28252,-0.00222,40.0],[1.9912,1.0697,3.1549,0.95923,0.00773,0.28252,-0.00228,40.0],[1.9844,1.073,3.1458,0.95922,0.00794,0.28254,-0.00234,40.0],[1.9779,1.0766,3.1373,0.95921,0.00817,0.28256,-0.00241,40.0],[1.972,1.0806,3.1293,0.9592,0.00843,0.2826,-0.00248,40.0],[1.9666,1.0849,3.1221,0.95918,0.0087,0.28266,-0.00256,40.0],[1.9618,1.0897,3.1158,0.95915,0.00899,0.28273,-0.00265,40.0],[1.9578,1.0948,3.1104,0.95912,0.00931,0.28282,-0.00274,40.0],[1.9545,1.1004,3.106,0.95909,0.00965,0.28293,-0.00285,40.0],[1.952,1.1065,3.1027,0.95904,0.01001,0.28307,-0.00295,40.0],[1.9505,1.113,3.1007,0.95899,0.01039,0.28322,-0.00307,40.0],[1.95,1.12,3.1,0.95893,0.0108,0.2834,-0.00319,40.0],[1.951,1.1276,3.1018,0.95888,0.01122,0.28358,-0.00332,40.0],[1.9539,1.136,3.107,0.95883,0.01165,0.28373,-0.00345,40.0],[1.9586,1.1451,3.1154,0.95879,0.01206,0.28385,-0.00357,40.0],[1.9648,1.1547,3.1267,0.95875,0.01248,0.28394,-0.0037,40.0],[1.9725,1.1648,3.1406,0.95873,0.01289,0.28401,-0.00382,39.94],[1.9816,1.1753,3.1568,0.95871,0.01329,0.28406,-0.00394,39.77],[1.9917,1.1862,3.1751,0.95869,0.01367,0.28408,-0.00405,39.49],[2.0028,1.1973,3.1951,0.95869,0.01405,0.28409,-0.00416,39.13],[2.0148,1.2086,3.2167,0.95868,0.01441,0.28408,-0.00427,38.69],[2.0275,1.22,3.2395,0.95868,0.01476,0.28406,-0.00437,38.17],[2.0407,1.2314,3.2632,0.95869,0.01509,0.28402,-0.00447,37.61],[2.0543,1.2427,3.2877,0.9587,0.0154,0.28397,-0.00456,36.99],[2.0681,1.2539,3.3125,0.95871,0.01569,0.28392,-0.00465,36.35],[2.0819,1.2649,3.3375,0.95872,0.01597,0.28386,-0.00473,35.68],[2.0957,1.2755,3.3623,0.95874,0.01623,0.28379,-0.0048,35.0],[2.1093,1.2858,3.3868,0.95875,0.01647,0.28372,-0.00487,34.32],[2.1225,1.2956,3.4105,0.95877,0.01668,0.28365,-0.00494,33.65],[2.1352,1.3049,3.4333,0.95879,0.01688,0.28358,-0.00499,33.01],[2.1472,1.3135,3.4549,0.95881,0.01706,0.28351,-0.00505,32.39],[2.1583,1.3214,3.4749,0.95882,0.01722,0.28344,-0.00509,31.83],[2.1684,1.3285,3.4932,0.95884,0.01736,0.28338,-0.00513,31.31],[2.1775,1.3347,3.5094,0.95885,0.01748,0.28332,-0.00516,30.87],[2.1852,1.34,3.5233,0.95886,0.01758,0.28327,-0.00519,30.51],[2.1914,1.3443,3.5346,0.95888,0.01765,0.28323,-0.00521,30.23],[2.1961,1.3474,3.543,0.95888,0.01771,0.2832,-0.00523,30.06],[2.199,1.3493,3.5482,0.95889,0.01774,0.28318,-0.00524,30.0],[2.2,1.35,3.55,0.95889,0.01775,0.28317,-0.00524,30.0],[-1.5458,0.5492,2.4449,0.95319,0.14766,-0.26074,0.04039,24.0],[-1.5408,0.5482,2.4389,0.95315,0.14835,-0.2605,0.04055,24.0],[-1.5341,0.5468,2.4309,0.95308,0.14928,-0.26018,0.04075,24.0],[-1.5258,0.5452,2.421,0.953,0.15043,-0.25978,0.04101,24.0],[-1.5162,0.5432,2.4094,0.9529,0.15178,-0.25931,0.0413,24.0],[-1.5054,0.5411,2.3965,0.95279,0.15331,-0.25877,0.04164,24.0],[-1.4936,0.5387,2.3823,0.95266,0.15501,-0.25817,0.04201,24.0],[-1.4809,0.5362,2.367,0.95251,0.15685,-0.25753,0.04241,24.0],[-1.4675,0.5335,2.351,0.95236,0.15881,-0.25683,0.04283,24.0],[-1.4536,0.5307,2.3343,0.95219,0.16087,-0.2561,0.04327,24.0],[-1.4394,0.5279,2.3173,0.95201,0.16301,-0.25534,0.04372,24.0],[-1.425,0.525,2.3,0.95182,0.1652,-0.25456,0.04418,24.0],[-1.4106,0.5221,2.2827,0.95162,0.16742,-0.25376,0.04464,24.0],[-1.3964,0.5193,2.2657,0.95142,0.16964,-0.25295,0.0451,24.0],[-1.3825,0.5165,2.249,0.95122,0.17184,-0.25216,0.04555,24.0],[-1.3691,0.5138,2.233,0.95101,0.17399,-0.25138,0.04599,24.0],[-1.3564,0.5113,2.2177,0.95081,0.17605,-0.25062,0.04641,24.0],[-1.3446,0.5089,2.2035,0.95062,0.178,-0.24991,0.04679,24.0],[-1.3338,0.5068,2.1906,0.95043,0.17979,-0.24925,0.04715,24.0],[-1.3242,0.5048,2.179,0.95027,0.1814,-0.24866,0.04747,24.0],[-1.3159,0.5032,2.1691,0.95012,0.1828,-0.24814,0.04774,24.0],[-1.3092,0.5018,2.1611,0.95,0.18394,-0.24771,0.04796,24.0],[-1.3042,0.5008,2.1551,0.94991,0.1848,-0.2474,0.04813,24.0],[-1.3011,0.5002,2.1513,0.94985,0.18534,-0.2472,0.04823,24.0],[2.6852,0.9963,5.2778,0.96408,0.01426,0.26521,-0.00392,30.0],[2.6688,0.9922,5.2531,0.96359,0.01439,0.26696,-0.00399,30.0],[2.6749,0.965,5.2073,0.9621,0.01666,0.27214,-0.00471,30.0],[2.6041,0.9789,5.178,0.96259,0.01502,0.27051,-0.00422,30.0],[2.597,0.9512,5.1567,0.96157,0.01728,0.27398,-0.00492,30.0],[2.602,0.981,5.1332,0.96028,0.01381,0.27868,-0.00401,30.0],[2.5312,0.9943,5.0619,0.96009,0.0122,0.27941,-0.00355,30.0],[2.5286,0.9418,5.0451,0.95904,0.01718,0.28271,-0.00506,30.0],[2.5167,0.9328,5.0267,0.9584,0.01782,0.28482,-0.00529,30.0],[2.5105,0.94,5.0008,0.95771,0.0169,0.28718,-0.00507,30.0],[-0.9495,1.5498,-2.8986,0.01594,0.0005,-0.99939,0.03111,32.0],[-0.9489,1.5496,-2.897,0.01593,0.0005,-0.99939,0.03114,32.0],[-0.9481,1.5492,-2.8947,0.01592,0.0005,-0.99939,0.03118,32.0],[-0.947,1.5488,-2.8917,0.0159,0.0005,-0.99939,0.03122,32.0],[-0.9458,1.5483,-2.8882,0.01589,0.0005,-0.99938,0.03128,32.0],[-0.9443,1.5477,-2.8841,0.01587,0.0005,-0.99938,0.03135,32.0],[-0.9426,1.5471,-2.8794,0.01584,0.0005,-0.99938,0.03142,32.0],[-0.9408,1.5463,-2.8742,0.01582,0.0005,-0.99938,0.03151,32.0],[-0.9387,1.5455,-2.8684,0.01579,0.0005,-0.99938,0.0316,32.0],[-0.9365,1.5446,-2.8622,0.01576,0.0005,-0.99937,0.0317,32.0],[-0.9341,1.5436,-2.8554,0.01572,0.0005,-0.99937,0.03181,32.0],[-0.9315,1.5426,-2.8481,0.01569,0.0005,-0.99937,0.03192,32.0],[-0.9287,1.5415,-2.8404,0.01565,0.0005,-0.99936,0.03205,32.0],[-0.9258,1.5403,-2.8323,0.01561,0.0005,-0.99936,0.03218,32.0],[-0.9228,1.5391,-2.8237,0.01557,0.0005,-0.99936,0.03232,32.0],[-0.9196,1.5378,-2.8147,0.01552,0.0005,-0.99935,0.03246,32.0],[-0.9162,1.5365,-2.8054,0.01547,0.00051,-0.99935,0.03262,32.0],[-0.9127,1.5351,-2.7956,0.01543,0.00051,-0.99934,0.03277,32.0],[-0.9091,1.5336,-2.7855,0.01538,0.00051,-0.99934,0.03294,32.0],[-0.9054,1.5322,-2.7751,0.01532,0.00051,-0.99933,0.03311,32.0],[-0.9016,1.5306,-2.7644,0.01527,0.00051,-0.99933,0.03328,32.0],[-0.8976,1.529,-2.7533,0.01522,0.00051,-0.99932,0.03346,32.0],[-0.8936,1.5274,-2.742,0.01516,0.00051,-0.99932,0.03364,32.0],[-0.8894,1.5258,-2.7304,0.0151,0.00051,-0.99931,0.03383,32.0],[-0.8852,1.5241,-2.7185,0.01504,0.00051,-0.99931,0.03402,32.0],[-0.8809,1.5223,-2.7064,0.01498,0.00051,-0.9993,0.03422,32.0],[-0.8765,1.5206,-2.6942,0.01492,0.00051,-0.9993,0.03442,32.0],[-0.872,1.5188,-2.6817,0.01486,0.00051,-0.99929,0.03462,32.0],[-0.8675,1.517,-2.669,0.01479,0.00052,-0.99928,0.03483,32.0],[-0.8629,1.5152,-2.6562,0.01473,0.00052,-0.99928,0.03504,32.0],[-0.8476,1.4991,-2.6429,0.0145,0.00051,-0.99927,0.03547,32.0],[-0.852,1.4953,-2.629,0.01457,0.00052,-0.99926,0.03571,32.0],[-0.8613,1.5085,-2.6212,0.01472,0.00053,-0.99925,0.03569,32.0],[-0.8431,1.5055,-2.591,0.01445,0.00052,-0.99925,0.03594,32.0],[-0.832,1.4948,-2.5929,0.01428,0.00052,-0.99924,0.03628,32.0],[-0.8363,1.4919,-2.5715,0.01436,0.00052,-0.99923,0.03652,32.0],[-0.8235,1.5041,-2.557,0.01417,0.00052,-0.99923,0.03653,32.0],[-0.8314,1.5081,-2.5419,0.0143,0.00052,-0.99923,0.03666,32.0],[-0.8185,1.501,-2.5261,0.01411,0.00052,-0.99922,0.03696,32.0],[-0.8168,1.5035,-2.5185,0.01408,0.00052,-0.99921,0.03711,32.0],[-0.8098,1.4952,-2.5205,0.01397,0.00052,-0.9992,0.03741,32.0],[-0.8171,1.4963,-2.4872,0.0141,0.00053,-0.99919,0.0376,32.0],[-0.7994,1.4792,-2.4778,0.01383,0.00053,-0.99918,0.03805,32.0],[-0.7988,1.4813,-2.478,0.01382,0.00053,-0.99917,0.03819,32.0],[-0.7871,1.4797,-2.454,0.01365,0.00052,-0.99917,0.03842,32.0],[-0.7803,1.4776,-2.4489,0.01355,0.00052,-0.99916,0.03862,32.0],[-0.7889,1.4791,-2.433,0.01369,0.00053,-0.99915,0.03879,32.0],[-0.7809,1.4748,-2.417,0.01357,0.00053,-0.99915,0.03904,32.0],[-0.771,1.4792,-2.408,0.01342,0.00053,-0.99914,0.03915,32.0],[-0.7694,1.476,-2.3938,0.01341,0.00053,-0.99913,0.03937,32.0],[-0.7648,1.4753,-2.382,0.01334,0.00053,-0.99913,0.03956,32.0],[-0.7604,1.4735,-2.3701,0.01328,0.00053,-0.99912,0.03976,32.0],[-0.7554,1.4712,-2.3596,0.0132,0.00053,-0.99911,0.03996,32.0],[-0.7526,1.471,-2.3475,0.01317,0.00053,-0.99911,0.04012,32.0],[-0.7484,1.4694,-2.3356,0.01311,0.00053,-0.9991,0.04031,32.0],[-0.7446,1.4678,-2.3249,0.01305,0.00053,-0.99909,0.04049,32.0],[-0.7409,1.4664,-2.3145,0.013,0.00053,-0.99909,0.04066,32.0],[-0.7373,1.4649,-2.3044,0.01295,0.00053,-0.99908,0.04083,32.0],[-0.7338,1.4635,-2.2946,0.0129,0.00053,-0.99908,0.04099,32.0],[-0.7304,1.4622,-2.2853,0.01285,0.00053,-0.99907,0.04115,32.0],[-0.7272,1.4609,-2.2763,0.0128,0.00053,-0.99906,0.0413,32.0],[-0.7242,1.4597,-2.2677,0.01276,0.00053,-0.99906,0.04144,32.0],[-0.7213,1.4585,-2.2596,0.01272,0.00053,-0.99905,0.04157,32.0],[-0.7185,1.4574,-2.2519,0.01268,0.00053,-0.99905,0.0417,32.0],[-0.7159,1.4564,-2.2446,0.01264,0.00053,-0.99904,0.04182,32.0],[-0.7135,1.4554,-2.2378,0.0126,0.00053,-0.99904,0.04194,32.0],[-0.7113,1.4545,-2.2316,0.01257,0.00053,-0.99904,0.04204,32.0],[-0.7092,1.4537,-2.2258,0.01254,0.00053,-0.99903,0.04214,32.0],[-0.7074,1.4529,-2.2206,0.01251,0.00053,-0.99903,0.04223,32.0],[-0.7057,1.4523,-2.2159,0.01249,0.00053,-0.99903,0.0423,32.0],[-0.7042,1.4517,-2.2118,0.01247,0.00053,-0.99902,0.04237,32.0],[-0.703,1.4512,-2.2083,0.01245,0.00053,-0.99902,0.04243,32.0],[-0.7019,1.4508,-2.2053,0.01244,0.00053,-0.99902,0.04248,32.0],[-0.7011,1.4504,-2.203,0.01242,0.00053,-0.99902,0.04252,32.0],[-0.7005,1.4502,-2.2014,0.01242,0.00053,-0.99902,0.04255,32.0],[-0.7001,1.45,-2.2003,0.01241,0.00053,-0.99902,0.04256,32.0],[-0.7,1.45,-2.2,0.01241,0.00053,-0.99902,0.04257,32.0]];

/* ------------------------------------------------------------------ *
 *  Crescent-wave motion (port of the Blender state() function)
 * ------------------------------------------------------------------ */
const WAVE_ROLL = -THREE.MathUtils.degToRad(80);          // 80° roll about the travel axis
const easeA = (f) => 1 - Math.pow(1 - clamp01((f - 84) / 2), 2);
function waveScale(f) { return f <= 86 ? 0.5 + 0.9 * easeA(f) : 1.4 + 2.4 * (1 - Math.exp(-(f - 86) / 11)); }
function waveDist(f) { return f <= 86 ? 1.0 + 2.2 * easeA(f) : 3.2 + 1.47 * (f - 86); }
function frameAtDist(d) { return d <= 3.2 ? 86 : 86 + (d - 3.2) / 1.47; }

/* ------------------------------------------------------------------ *
 *  Tempo: maps real time (s) -> animation frame. Everything (body, blade,
 *  aura, wave, camera) is driven by the frame, so it all stays in sync.
 *   cinematic : the Blender film's pacing (release at 3.46 s)
 *   anime     : short build-up, snap strike, faster wave (release at ~1.16 s)
 * ------------------------------------------------------------------ */
export const TEMPOS = {
  cinematic: null,
  anime: {
    // [real seconds, frame] — stance, ignite, lift, brief overhead hold, anticipation, strike, release
    knots: [[0, 1], [0.30, 24], [0.62, 50], [0.82, 60], [1.02, 76], [1.08, 79], [1.16, 84], [1.22, 86]],
    tailRate: FPS * 1.6,            // after the release: wave flight, impact and recovery at 1.6x
  },
};
function makeWarp(def) {
  if (!def) return { frameAt: (t) => t * FPS + 1, timeAt: (f) => (f - 1) / FPS };
  const k = def.knots.slice(), last = k[k.length - 1];
  k.push([last[0] + 10, last[1] + 10 * def.tailRate]);
  const n = k.length, X = k.map((a) => a[0]), Y = k.map((a) => a[1]), d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d[i] = (Y[i + 1] - Y[i]) / (X[i + 1] - X[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {                       // Fritsch–Carlson: keep it monotone (no going backwards)
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const tau = 3 / Math.sqrt(s); m[i] = tau * a * d[i]; m[i + 1] = tau * b * d[i]; }
  }
  const frameAt = (t) => {
    if (t <= X[0]) return Y[0];
    if (t >= X[n - 1]) return Y[n - 1] + (t - X[n - 1]) * def.tailRate;
    let i = 0; while (t > X[i + 1]) i++;
    const h = X[i + 1] - X[i], u = (t - X[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * Y[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * Y[i + 1] + (u3 - u2) * h * m[i + 1];
  };
  const timeAt = (f) => {
    if (f <= Y[0]) return 0;
    let lo = 0, hi = X[n - 1] + (f - Y[n - 1]) / def.tailRate + 1;
    for (let it = 0; it < 50; it++) { const mid = (lo + hi) / 2; if (frameAt(mid) < f) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  };
  return { frameAt, timeAt };
}

const BLADE_BASE_REST = new THREE.Vector3(-0.282, 0.852, 0.124);   // glTF bind-space points on the blade
const BLADE_TIP_REST = new THREE.Vector3(-0.282, 0.802, 1.224);
const BLADE_MID_REST = new THREE.Vector3(-0.282, 0.827, 0.674);

/* ------------------------------------------------------------------ *
 *  GetsugaTensho — attach to the loaded character and call update(dt)
 * ------------------------------------------------------------------ */
export class GetsugaTensho {
  /**
   * @param {object} o
   * @param {THREE.Scene} o.scene
   * @param {THREE.PerspectiveCamera} [o.camera]  needed for cinematic camera mode
   * @param {'crimson'|'blue'} [o.palette]
   * @param {number} [o.impactDistance=56]       metres in front of the character where the wave detonates
   * @param {boolean} [o.cinematicCamera=false]   drive the camera with the film's camera cuts
   * @param {boolean} [o.floatingRocks=true]
   * @param {'anime'|'cinematic'} [o.tempo='anime']  pacing preset (see TEMPOS)
   * @param {number} [o.speed=1]                  extra playback multiplier on top of the tempo
   * @param {(name:string)=>void} [o.onEvent]     'ignite','lift','strike','release','impact','end'
   */
  constructor(o = {}) {
    this.scene = o.scene; this.camera = o.camera || null;
    this.paletteName = o.palette || 'crimson'; this.pal = PALETTES[this.paletteName];
    this.impactDistance = o.impactDistance ?? 56;
    this.cinematicCamera = !!o.cinematicCamera;
    this.floatingRocks = o.floatingRocks !== false;
    this.onEvent = o.onEvent || (() => {});
    this.group = new THREE.Group(); this.group.name = 'GetsugaTensho';
    this.worldFx = new THREE.Group(); this.worldFx.name = 'GetsugaTensho_WorldFX';
    this.scene.add(this.group); this.scene.add(this.worldFx);
    this.time = 0; this.playing = false; this.speed = o.speed ?? 1; this.ready = false;
    this._mats = []; this._disposables = [];
    this._v = new THREE.Vector3(); this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion();
    this.fImp = frameAtDist(this.impactDistance);
    this.endFrame = Math.max(CLIP_FRAMES, this.fImp + 34);
    this.tempo = TEMPOS[o.tempo] !== undefined ? o.tempo : 'anime';
    this.warp = makeWarp(TEMPOS[this.tempo]);
    this.duration = this.warp.timeAt(this.endFrame);
    this._lastFrame = -1;
  }

  /** Switch pacing live ('cinematic' | 'anime'); keeps the current moment of the attack. */
  setTempo(name) {
    if (TEMPOS[name] === undefined || name === this.tempo) return;
    const f = this.frame;
    this.tempo = name; this.warp = makeWarp(TEMPOS[name]);
    this.duration = this.warp.timeAt(this.endFrame);
    if (this.ready) this.seek(this.warp.timeAt(f)); else this.time = this.warp.timeAt(f);
  }
  /** Real time (s) at which a given frame happens under the current tempo — handy for syncing sounds. */
  timeOfFrame(f) { return this.warp.timeAt(f); }
  get releaseTime() { return this.warp.timeAt(RELEASE_FRAME); }
  get impactTime() { return this.warp.timeAt(this.fImp); }

  /** Convenience: load the GLB with your GLTFLoader class and attach. */
  static async load(GLTFLoaderClass, url, opts) {
    const gltf = await new GLTFLoaderClass().loadAsync(url);
    const gt = new GetsugaTensho(opts);
    gt.attach(gltf);
    return gt;
  }

  _mat(m) { this._mats.push(m); return m; }

  attach(gltf) {
    this.gltf = gltf; this.root = gltf.scene; this.group.add(this.root);
    let body = null, maxV = 0;
    this.root.traverse((o) => {
      if (o.isMesh) { o.frustumCulled = false; o.castShadow = true; }
      if (o.isSkinnedMesh) {
        if (o.name === 'SK_EnergyBlade') { this.energyBlade = o; o.castShadow = false; return; }
        const n = o.geometry.attributes.position.count;
        if (o.name === 'SK_Character') { body = o; maxV = Infinity; } else if (n > maxV) { body = o; maxV = n; }
      }
    });
    this.body = body;
    if (!this.body) throw new Error('GetsugaTensho: character mesh (SK_Character) not found');
    this.skeleton = this.body.skeleton;
    this.clip = gltf.animations.find((a) => a.name === 'GetsugaTensho') || gltf.animations[0];
    this.mixer = new THREE.AnimationMixer(this.root);
    this.action = this.mixer.clipAction(this.clip);
    this.action.setLoop(THREE.LoopOnce, 1); this.action.clampWhenFinished = true; this.action.play();
    const bones = this.skeleton.bones;
    this.weaponIdx = bones.findIndex((b) => b.name === 'weapon_r');
    this._boneMats = bones.map(() => new THREE.Matrix4());

    this._setupEnergyBlade();
    this._setupAura();
    this._setupEmbers();
    this._setupCracks();
    this._setupFloatingRocks();
    this._setupTrail();
    this._setupRings();
    this._setupWave();
    this._setupTrench();
    this._setupDebris();
    this._setupImpact();
    this._setupLights();
    this.ready = true;
    this.seek(0);
    return this;
  }

  /* ---------------- pose / skinning helpers ---------------- */
  _pose(t) {
    this.action.time = Math.min(Math.max(t, 0), this.clip.duration);
    this.mixer.update(0);
    this.group.updateMatrixWorld(true);
    const bones = this.skeleton.bones, inv = this.skeleton.boneInverses;
    for (let i = 0; i < bones.length; i++) this._boneMats[i].multiplyMatrices(bones[i].matrixWorld, inv[i]);
  }
  _weaponPoint(rest, out) { return out.copy(rest).applyMatrix4(this._boneMats[this.weaponIdx]); }

  /* ---------------- energy blade ---------------- */
  _setupEnergyBlade() {
    const eb = this.energyBlade; if (!eb) return;
    eb.material = this._mat(makeFlameMaterial(this.pal, { scale: 7, stretch: [2.0, 1.5, 0.8], flow: [0, 0, -2.4], wspeed: 1.6, octaves: 4,
      edgePow: 0.5, edgeW: 1.0, noiseW: 1.0, t0: 0.66, t1: 1.08, width: 0.1, inside: true }));
    const glow = new THREE.SkinnedMesh(eb.geometry, this._mat(makeFlameMaterial(this.pal, { scale: 3.5, stretch: [1.5, 1.0, 0.3], flow: [0, 0, -3.0],
      wspeed: 1.8, octaves: 3, edgePow: 1.5, edgeW: 0.9, noiseW: 0.6, t0: 0.78, t1: 1.3, width: 0.25, emit: 0.7, inflate: 0.035 })));
    glow.name = 'SK_EnergyBlade_Glow';
    eb.parent.add(glow);
    glow.position.copy(eb.position); glow.quaternion.copy(eb.quaternion); glow.scale.copy(eb.scale);
    glow.bind(eb.skeleton, eb.bindMatrix); glow.frustumCulled = false;
    eb.renderOrder = 2; glow.renderOrder = 3;
    this.energyGlow = glow;
  }

  /* ---------------- aura flame cards ---------------- */
  _setupAura() {
    const g = this.body.geometry, rnd = mulberry32(4);
    const N = 340, P = g.attributes.position, Nm = g.attributes.normal;
    const SI = g.attributes.skinIndex, SW = g.attributes.skinWeight;
    const bind = this.body.bindMatrix, nb = new THREE.Matrix3().getNormalMatrix(bind);
    this.anchors = { n: N, base: new Float32Array(N * 3), nbase: new Float32Array(N * 3), si: new Uint16Array(N * 4), sw: new Float32Array(N * 4),
      pos: new Float32Array(N * 3), nrm: new Float32Array(N * 3) };
    const v = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const k = Math.floor(rnd() * P.count);
      v.fromBufferAttribute(P, k).applyMatrix4(bind); this.anchors.base.set([v.x, v.y, v.z], i * 3);
      v.fromBufferAttribute(Nm, k).applyMatrix3(nb).normalize(); this.anchors.nbase.set([v.x, v.y, v.z], i * 3);
      for (let j = 0; j < 4; j++) { this.anchors.si[i * 4 + j] = SI.getComponent(k, j); this.anchors.sw[i * 4 + j] = SW.getComponent(k, j); }
    }
    const quad = new THREE.InstancedBufferGeometry();
    quad.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
    quad.setIndex([0, 1, 2, 0, 2, 3]);
    this._aPos = new THREE.InstancedBufferAttribute(this.anchors.pos, 3); this._aPos.setUsage(THREE.DynamicDrawUsage);
    this._aNrm = new THREE.InstancedBufferAttribute(this.anchors.nrm, 3); this._aNrm.setUsage(THREE.DynamicDrawUsage);
    const rr = new Float32Array(N), ss = new Float32Array(N);
    for (let i = 0; i < N; i++) { rr[i] = rnd(); ss[i] = 0.06 + rnd() * 0.11; }
    quad.setAttribute('aPos', this._aPos); quad.setAttribute('aNrm', this._aNrm);
    quad.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rr, 1)); quad.setAttribute('aSize', new THREE.InstancedBufferAttribute(ss, 1));
    quad.instanceCount = N;
    this.auraMat = this._mat(makeFlameCardMaterial(this.pal));
    this.aura = new THREE.Mesh(quad, this.auraMat); this.aura.frustumCulled = false; this.aura.renderOrder = 4; this.aura.name = 'Aura';
    this.scene.add(this.aura); this._disposables.push(quad);
  }
  _updateAnchors() {
    const A = this.anchors, M = this._boneMats;
    for (let i = 0; i < A.n; i++) {
      let px = 0, py = 0, pz = 0, nx = 0, ny = 0, nz = 0;
      const bx = A.base[i * 3], by = A.base[i * 3 + 1], bz = A.base[i * 3 + 2];
      const qx = A.nbase[i * 3], qy = A.nbase[i * 3 + 1], qz = A.nbase[i * 3 + 2];
      for (let j = 0; j < 4; j++) {
        const w = A.sw[i * 4 + j]; if (w === 0) continue;
        const e = M[A.si[i * 4 + j]].elements;
        px += w * (e[0] * bx + e[4] * by + e[8] * bz + e[12]);
        py += w * (e[1] * bx + e[5] * by + e[9] * bz + e[13]);
        pz += w * (e[2] * bx + e[6] * by + e[10] * bz + e[14]);
        nx += w * (e[0] * qx + e[4] * qy + e[8] * qz);
        ny += w * (e[1] * qx + e[5] * qy + e[9] * qz);
        nz += w * (e[2] * qx + e[6] * qy + e[10] * qz);
      }
      const l = Math.hypot(nx, ny, nz) || 1;
      A.pos[i * 3] = px; A.pos[i * 3 + 1] = py; A.pos[i * 3 + 2] = pz;
      A.nrm[i * 3] = nx / l; A.nrm[i * 3 + 1] = ny / l; A.nrm[i * 3 + 2] = nz / l;
    }
    this._aPos.needsUpdate = true; this._aNrm.needsUpdate = true;
  }

  /* ---------------- embers ---------------- */
  _setupEmbers() {
    const N = 600, rnd = mulberry32(11);
    const E = this.embers = { n: N, fs: new Float32Array(N), life: new Float32Array(N), anchor: new Uint16Array(N),
      vel: new Float32Array(N * 3), p0: new Float32Array(N * 3), cap: new Uint8Array(N), ph: new Float32Array(N) };
    for (let i = 0; i < N; i++) {
      E.fs[i] = 22 + rnd() * 96; E.life[i] = 26 * (1 - 0.6 * rnd()); E.anchor[i] = Math.floor(rnd() * this.anchors.n);
      E.vel[i * 3] = (rnd() * 2 - 1) * 0.35; E.vel[i * 3 + 1] = 1.6 * (1 + (rnd() * 2 - 1) * 0.6); E.vel[i * 3 + 2] = (rnd() * 2 - 1) * 0.35;
      E.ph[i] = rnd() * 100;
    }
    const g = new THREE.BufferGeometry();
    this._ePos = new THREE.BufferAttribute(new Float32Array(N * 3), 3); this._ePos.setUsage(THREE.DynamicDrawUsage);
    this._eLife = new THREE.BufferAttribute(new Float32Array(N).fill(-1), 1); this._eLife.setUsage(THREE.DynamicDrawUsage);
    const sz = new Float32Array(N); for (let i = 0; i < N; i++) sz[i] = 0.012 + rnd() * 0.012;
    g.setAttribute('position', this._ePos); g.setAttribute('aLife', this._eLife); g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    this.emberMat = this._mat(makeEmberMaterial(this.pal));
    this.emberPts = new THREE.Points(g, this.emberMat); this.emberPts.frustumCulled = false; this.emberPts.renderOrder = 5;
    this.scene.add(this.emberPts); this._disposables.push(g);
  }
  _updateEmbers(F) {
    const E = this.embers, A = this.anchors, P = this._ePos.array, L = this._eLife.array;
    for (let i = 0; i < E.n; i++) {
      const age = (F - E.fs[i]) / E.life[i];
      if (age < 0 || age > 1) { L[i] = -1; if (age < 0) E.cap[i] = 0; continue; }
      if (!E.cap[i]) {
        const a = E.anchor[i] * 3;
        E.p0[i * 3] = A.pos[a] + A.nrm[a] * 0.03; E.p0[i * 3 + 1] = A.pos[a + 1] + A.nrm[a + 1] * 0.03; E.p0[i * 3 + 2] = A.pos[a + 2] + A.nrm[a + 2] * 0.03;
        E.cap[i] = 1;
      }
      const t = age * E.life[i] / FPS, ph = E.ph[i];
      P[i * 3] = E.p0[i * 3] + E.vel[i * 3] * t + Math.sin(ph + t * 5.0) * 0.05 * t;
      P[i * 3 + 1] = E.p0[i * 3 + 1] + E.vel[i * 3 + 1] * t;
      P[i * 3 + 2] = E.p0[i * 3 + 2] + E.vel[i * 3 + 2] * t + Math.cos(ph * 1.3 + t * 4.3) * 0.05 * t;
      L[i] = age;
    }
    this._ePos.needsUpdate = true; this._eLife.needsUpdate = true;
  }

  /* ---------------- ground cracks ---------------- */
  _setupCracks() {
    const g = new THREE.PlaneGeometry(9, 9, 1, 1);
    this.crackMat = this._mat(makeCrackMaterial(this.pal));
    this.cracks = new THREE.Mesh(g, this.crackMat); this.cracks.rotation.x = -Math.PI / 2; this.cracks.position.set(0, 0.006, 0.05);
    this.cracks.renderOrder = 1; this.cracks.name = 'GroundCracks'; this.group.add(this.cracks); this._disposables.push(g);
  }

  /* ---------------- floating debris during the charge ---------------- */
  _setupFloatingRocks() {
    const N = 44, rnd = mulberry32(42), R = [];
    for (let i = 0; i < N; i++) {
      let ang = rnd() * Math.PI * 2, r = 0.7 + rnd() * 2.1;
      // keep clear of the low camera used during the charge (Blender x=-1.55, y=-2.45)
      if (Math.hypot(Math.cos(ang) * r + 1.55, Math.sin(ang) * r + 2.45) < 1.3) { ang += Math.PI * 0.6; }
      const p0 = [Math.cos(ang) * r, Math.sin(ang) * r - 0.1, -0.02];
      const s = (0.035 + rnd() * 0.095) * (r > 1.8 ? 1.3 : 1.0);
      const rot0 = [rnd() * 6, rnd() * 6, rnd() * 6], spin = [rnd() * 0.1 - 0.05, rnd() * 0.1 - 0.05, rnd() * 0.1 - 0.05];
      const tStart = 30 + rnd() * 16, zmax = 0.25 + rnd() * 1.65;
      let dx = p0[0], dy = p0[1]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl; dy -= 0.9;
      const dl2 = Math.hypot(dx, dy); const sp = 0.25 + rnd() * 0.35;
      const vel = [dx / dl2 * sp, dy / dl2 * sp, 0.05 + rnd() * 0.2];
      R.push({ p0, s, rot0, spin, tStart, zmax, vel, i });
    }
    this.rockData = R;
    this.rockGeo = rockGeometry(7, 1);
    this.rockMat = new THREE.MeshStandardMaterial({ color: 0x3a2f29, roughness: 0.95, metalness: 0, flatShading: true });
    this.rocks = new THREE.InstancedMesh(this.rockGeo, this.rockMat, N); this.rocks.castShadow = true; this.rocks.frustumCulled = false;
    this.rocks.name = 'FloatingRocks'; this.rocks.visible = this.floatingRocks; this.group.add(this.rocks);
    this._disposables.push(this.rockGeo, this.rockMat);
  }
  _updateFloatingRocks(F) {
    const g = -9.81 / (FPS * FPS), m = this._m, q = this._q, e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
    for (const r of this.rockData) {
      let x = r.p0[0], y = r.p0[1], z = r.p0[2], rx = r.rot0[0], ry = r.rot0[1], rz = r.rot0[2];
      if (F >= r.tStart && F <= 83) {
        let a = (F - r.tStart) / (83 - r.tStart); a = 1 - (1 - a) ** 2;
        x += Math.sin(F * 0.3 + r.i) * 0.03; y += Math.cos(F * 0.27 + r.i) * 0.03; z += r.zmax * a;
        const k = F - r.tStart; rx += r.spin[0] * k; ry += r.spin[1] * k; rz += r.spin[2] * k;
      } else if (F > 83) {
        const pz = r.p0[2] + r.zmax; let tt = F - 83;
        const disc = r.vel[2] * r.vel[2] - 2 * g * (pz + 0.05);
        const tLand = (-r.vel[2] - Math.sqrt(Math.max(disc, 0))) / g;
        tt = Math.min(tt, tLand);
        x = r.p0[0] + r.vel[0] * tt; y = r.p0[1] + r.vel[1] * tt; z = pz + r.vel[2] * tt + 0.5 * g * tt * tt;
        const k = 83 - r.tStart; rx += r.spin[0] * (k + 6 * tt); ry += r.spin[1] * (k + 6 * tt); rz += r.spin[2] * (k + 6 * tt);
      }
      p.set(x, z, -y); e.set(rx, ry, rz); q.setFromEuler(e); s.setScalar(r.s);
      m.compose(p, q, s); this.rocks.setMatrixAt(r.i, m);
    }
    this.rocks.instanceMatrix.needsUpdate = true;
  }

  /* ---------------- slash trail (baked from the real swing) ---------------- */
  _setupTrail() {
    const NV = 6, pts = [], a = new THREE.Vector3(), b = new THREE.Vector3();
    for (let f = 79; f <= 87 + 1e-6; f += 0.25) {
      this._pose(frameToTime(f));
      this._weaponPoint(BLADE_BASE_REST, a); this._weaponPoint(BLADE_TIP_REST, b);
      pts.push([f, this.group.worldToLocal(a.clone()), this.group.worldToLocal(b.clone())]);
    }
    const pos = [], uv = [], idx = [];
    pts.forEach(([f, p, q], i) => {
      for (let j = 0; j < NV; j++) { const v = p.clone().lerp(q, j / (NV - 1)); pos.push(v.x, v.y, v.z); uv.push((f - 79) / 8, j / (NV - 1)); }
      if (i > 0) for (let j = 0; j < NV - 1; j++) {
        const c = i * NV + j, pr = (i - 1) * NV + j; idx.push(pr, c, c + 1, pr, c + 1, pr + 1);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    this.trailMat = this._mat(makeTrailMaterial(this.pal));
    this.trail = new THREE.Mesh(g, this.trailMat); this.trail.frustumCulled = false; this.trail.renderOrder = 6; this.trail.name = 'SlashTrail';
    this.group.add(this.trail); this._disposables.push(g);
  }

  /* ---------------- shockwave rings ---------------- */
  _setupRings() {
    const g = ringGeometry(0.8, 1.0, 96);
    this.ringMat = this._mat(makeRingMaterial(this.pal));
    this.ringGround = new THREE.Mesh(g, this.ringMat); this.ringGround.rotation.x = -Math.PI / 2; this.ringGround.position.set(0.2, 0.03, 0.6);
    this.ringAir = new THREE.Mesh(g, this.ringMat); this.ringAir.position.set(0.25, 1.1, 1.1); this.ringAir.rotation.z = THREE.MathUtils.degToRad(10);
    for (const r of [this.ringGround, this.ringAir]) { r.frustumCulled = false; r.renderOrder = 7; this.group.add(r); }
    this._disposables.push(g);
  }
  _updateRings(F) {
    const fade = curve([[83, 0], [84, 1], [88, 0.7], [96, 0]], F);
    this.ringMat.uniforms.uFade.value = F >= 83 && F <= 96 ? fade : 0;
    const vis = F >= 83 && F <= 96;
    this.ringGround.visible = this.ringAir.visible = vis;
    if (!vis) return;
    const sg = curve([[83, 0.3], [84, 0.6], [88, 5], [96, 11]], F), sa = curve([[83, 0.2], [84, 0.5], [87, 3.5], [92, 6]], F);
    this.ringGround.scale.set(sg, sg, 1); this.ringAir.scale.set(sa, sa, 1);
  }

  /* ---------------- crescent wave + echoes ---------------- */
  _setupWave() {
    const gCore = crescentGeometry(), gGlow = crescentGeometry({ T: 0.5, D: 0.34 });
    // lowest point after the roll -> ground contact / trench line
    const P = gCore.attributes.position, c = Math.cos(WAVE_ROLL), s = Math.sin(WAVE_ROLL);
    let zmin = 1e9, lowX = 0, lowZ = 0;
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      const yr = x * s + y * c;
      if (yr < zmin) { zmin = yr; lowX = x * c - y * s; lowZ = z; }
    }
    this.waveLow = { zmin, x: lowX, z: lowZ };
    this.waveCoreMat = this._mat(makeFlameMaterial(this.pal, { scale: 3.0, stretch: [1.4, 1.4, 0.35], flow: [0, 0, 6], wspeed: 2.0, octaves: 4,
      edgePow: 0.55, edgeW: 1.0, noiseW: 1.0, t0: 0.55, t1: 0.93, width: 0.2, inside: true }));
    this.waveGlowMat = this._mat(makeFlameMaterial(this.pal, { scale: 2.0, stretch: [1.2, 1.2, 0.3], flow: [0, 0, 8], wspeed: 2.5, octaves: 4,
      edgePow: 1.3, edgeW: 0.9, noiseW: 0.9, t0: 0.68, t1: 1.23, width: 0.2, emit: 0.9 }));
    const core = new THREE.Mesh(gCore, this.waveCoreMat), glow = new THREE.Mesh(gGlow, this.waveGlowMat);
    core.add(glow); core.name = 'GetsugaWave';
    this.waveParts = [{ mesh: core, dt: 0, alpha: 1, mats: [this.waveCoreMat, this.waveGlowMat] }];
    [[1.2, 0.35], [2.4, 0.18], [3.6, 0.08]].forEach(([dt, al], i) => {
      const m = this._mat(this.waveCoreMat.clone()); _paletteMats.add(m);
      const e = new THREE.Mesh(gCore, m); e.name = `GetsugaWave_Echo${i + 1}`;
      this.waveParts.push({ mesh: e, dt, alpha: al, mats: [m] });
    });
    for (const w of this.waveParts) { w.mesh.frustumCulled = false; w.mesh.visible = false; w.mesh.renderOrder = 8; this.worldFx.add(w.mesh); }
    glow.frustumCulled = false; glow.renderOrder = 9;
    this.waveCore = core;
    this._disposables.push(gCore, gGlow);
  }
  _waveState(fw, out) {
    const s = waveScale(fw), zg = -this.waveLow.zmin * s;
    const h = fw <= 86 ? 1.15 * (1 - easeA(fw)) + (zg - 0.07) * easeA(fw) : zg - 0.09;
    out.set(0.1, h, waveDist(fw));
    return s;
  }
  _updateWave(F, T) {
    const zq = this._q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), WAVE_ROLL);
    for (const w of this.waveParts) {
      const fw = F - w.dt;
      const alive = fw >= 84 && fw <= this.fImp + 3;
      w.mesh.visible = alive;
      if (!alive) continue;
      let s = this._waveState(fw, w.mesh.position);
      if (fw > this.fImp) s *= 1 + 0.15 * (fw - this.fImp);
      w.mesh.quaternion.copy(zq); w.mesh.scale.setScalar(s);
      const a = w.alpha * (fw <= this.fImp ? 1 : Math.max(0, 1 - (fw - this.fImp) / 3));
      for (const m of w.mats) { m.uniforms.uAlpha.value = a; m.uniforms.uIntensity.value = 1; m.uniforms.uTime.value = T; }
    }
  }

  /* ---------------- trench carved by the lower tip ---------------- */
  _setupTrench() {
    const rows = [], pos = [], uv = [], idx = [];
    for (let d = 1.2; d <= this.impactDistance + 0.6; d += 0.5) rows.push(d);
    rows.forEach((d, i) => {
      const s = waveScale(frameAtDist(d)), cx = 0.1 + this.waveLow.x * s, w = 0.28 * s;
      for (let j = 0; j < 5; j++) { pos.push(cx + (j / 4 - 0.5) * w, 0.012, d); uv.push(j / 4, i / (rows.length - 1)); }
      if (i > 0) for (let j = 0; j < 4; j++) { const a = (i - 1) * 5 + j, b = i * 5 + j; idx.push(a, b, b + 1, a, b + 1, a + 1); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    this.trenchMat = this._mat(makeGougeMaterial(this.pal));
    this.trench = new THREE.Mesh(g, this.trenchMat); this.trench.frustumCulled = false; this.trench.renderOrder = 1; this.trench.name = 'Trench';
    this.worldFx.add(this.trench); this._disposables.push(g);
  }

  /* ---------------- ballistic rock debris (trench + impact) ---------------- */
  _setupDebris() {
    const rnd = mulberry32(99), fImp = this.fImp;
    const make = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));
    const sphere = () => { let x, y, z; do { x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; } while (x * x + y * y + z * z > 1); return [x, y, z]; };
    this.gougeDebris = make(220, () => {
      const fs = 86 + rnd() * Math.max(1, fImp - 87), r = sphere();
      return { fs, life: 45, size: 0.07 * (1 - 0.8 * rnd()), v: [r[0] * 5, 7 + r[1] * 5, 0.15 * 1.47 * FPS + r[2] * 5], rot: [rnd() * 6, rnd() * 6, rnd() * 6], spin: [rnd() * 8, rnd() * 8, rnd() * 8] };
    });
    this.impactDebris = make(260, () => {
      const r = sphere();
      return { fs: fImp - 1 + rnd() * 2, life: 80, size: 0.35 * (1 - 0.85 * rnd()), off: [(rnd() - 0.5) * 4, 1.5, -2.5 + (rnd() - 0.5) * 4],
        v: [r[0] * 14, 22 + r[1] * 14, -9 + r[2] * 14], rot: [rnd() * 6, rnd() * 6, rnd() * 6], spin: [rnd() * 4, rnd() * 4, rnd() * 4] };
    });
    this.debrisGeo = rockGeometry(3, 0);
    this.debrisMesh = new THREE.InstancedMesh(this.debrisGeo, this.rockMat, this.gougeDebris.length + this.impactDebris.length);
    this.debrisMesh.frustumCulled = false; this.debrisMesh.name = 'Debris'; this.worldFx.add(this.debrisMesh);
    this._disposables.push(this.debrisGeo);
  }
  _updateDebris(F) {
    const m = this._m, q = this._q, e = new THREE.Euler(), sv = new THREE.Vector3(), p = new THREE.Vector3(), tip = new THREE.Vector3();
    const G = 9.81, fImp = this.fImp, impC = this.impactCenter;
    let k = 0;
    const put = (vis, x, y, z, r, sp, t, size) => {
      if (!vis) { m.makeScale(0, 0, 0); this.debrisMesh.setMatrixAt(k++, m); return; }
      p.set(x, y, z); e.set(r[0] + sp[0] * t, r[1] + sp[1] * t, r[2] + sp[2] * t); q.setFromEuler(e); sv.setScalar(size);
      m.compose(p, q, sv); this.debrisMesh.setMatrixAt(k++, m);
    };
    for (const d of this.gougeDebris) {
      const age = F - d.fs;
      if (age < 0 || age > d.life || !this._released) { put(false); continue; }
      const s = this._waveState(d.fs, tip);
      const x0 = 0.1 + this.waveLow.x * s, y0 = Math.max(0.02, tip.y + this.waveLow.zmin * s), z0 = tip.z + this.waveLow.z * s;
      const tLand = (d.v[1] + Math.sqrt(d.v[1] * d.v[1] + 2 * G * y0)) / G;
      const t = Math.min(age / FPS, tLand);
      put(true, x0 + d.v[0] * t, Math.max(d.size * 0.4, y0 + d.v[1] * t - 0.5 * G * t * t), z0 + d.v[2] * t, d.rot, d.spin, t, d.size);
    }
    for (const d of this.impactDebris) {
      const age = F - d.fs;
      if (age < 0 || age > d.life || !this._released) { put(false); continue; }
      const x0 = impC.x + d.off[0], y0 = d.off[1], z0 = impC.z + d.off[2];
      const tLand = (d.v[1] + Math.sqrt(d.v[1] * d.v[1] + 2 * G * y0)) / G;
      const t = Math.min(age / FPS, tLand);
      put(true, x0 + d.v[0] * t, Math.max(d.size * 0.4, y0 + d.v[1] * t - 0.5 * G * t * t), z0 + d.v[2] * t, d.rot, d.spin, t, d.size);
    }
    this.debrisMesh.instanceMatrix.needsUpdate = true;
  }

  /* ---------------- impact: dark dome + energy pillar ---------------- */
  _setupImpact() {
    this.impactCenter = new THREE.Vector3(0.3, 2.0, this.impactDistance - 0.6);
    const gd = new THREE.SphereGeometry(1, 64, 40);
    const gp = new THREE.CylinderGeometry(0.55, 1, 1, 48, 1, true); gp.translate(0, 0.5, 0);
    this.domeMat = this._mat(makeFlameMaterial(this.pal, { scale: 2.2, stretch: [1, 0.6, 1], flow: [0, -2, 0], wspeed: 1.5, octaves: 4,
      edgePow: 0.6, edgeW: 1.0, noiseW: 1.1, t0: 0.66, t1: 0.86, width: 0.12, inside: true }));
    this.pillarMat = this._mat(makeFlameMaterial(this.pal, { scale: 2.0, stretch: [1.2, 0.1, 1.2], flow: [0, -7, 0], wspeed: 2.0, octaves: 4,
      edgePow: 1.0, edgeW: 0.25, noiseW: 1.3, t0: 0.62, t1: 0.9, width: 0.12, emit: 0.6 }));
    this.dome = new THREE.Mesh(gd, this.domeMat); this.dome.position.copy(this.impactCenter);
    this.pillar = new THREE.Mesh(gp, this.pillarMat); this.pillar.position.set(this.impactCenter.x, -1, this.impactCenter.z + 0.1);
    for (const o of [this.dome, this.pillar]) { o.frustumCulled = false; o.visible = false; o.renderOrder = 10; this.worldFx.add(o); }
    this.dome.name = 'ImpactDome'; this.pillar.name = 'ImpactPillar';
    this._disposables.push(gd, gp);
  }
  _updateImpact(F, T) {
    const r = F - this.fImp;                               // 0 == impact frame (122 in the film)
    const vis = r >= -2 && r <= 36 && this._released;
    this.dome.visible = this.pillar.visible = vis;
    const inten = curve([[-2, 0], [0, 1], [4, 0.35], [24, 0]], r, true);
    this.impactValue = vis ? inten : 0;
    if (!vis) return;
    const ds = curveVec([[-2, [0.2, 0.2, 0.2]], [-1, [1, 0.8, 1]], [2, [8, 6.5, 8]], [10, [12.5, 10, 12.5]], [30, [15, 12, 15]]], r);
    const da = curve([[-2, 0], [-1, 1], [10, 0.9], [30, 0]], r);
    const ps = curveVec([[-2, [1, 0.1, 1]], [-1, [2.5, 6, 2.5]], [3, [4.5, 50, 4.5]], [18, [6, 62, 6]], [33, [7, 66, 7]]], r);
    const pa = curve([[-2, 0], [-1, 1], [12, 0.8], [34, 0]], r);
    this.dome.scale.set(...ds); this.pillar.scale.set(...ps);
    for (const [m, a] of [[this.domeMat, da], [this.pillarMat, pa]]) {
      m.uniforms.uIntensity.value = Math.max(inten, 0.35 * a); m.uniforms.uAlpha.value = a; m.uniforms.uTime.value = T;
    }
  }

  /* ---------------- lights ---------------- */
  _setupLights() {
    const col = new THREE.Color(...this.pal.light);
    this.bladeLight = new THREE.PointLight(col, 0, 7, 2);
    this.flashLight = new THREE.PointLight(col, 0, 30, 2); this.flashLight.position.set(0.4, 1.3, 2.2);
    this.waveLight = new THREE.PointLight(col, 0, 30, 2); this.waveLight.position.set(0, 0, -0.4);
    this.impactLight = new THREE.PointLight(col, 0, 220, 2); this.impactLight.position.copy(this.impactCenter).add(new THREE.Vector3(0, 2, -4));
    this.scene.add(this.bladeLight); this.group.add(this.flashLight); this.waveCore.add(this.waveLight); this.worldFx.add(this.impactLight);
    this.lights = [this.bladeLight, this.flashLight, this.waveLight, this.impactLight];
    this.lightScale = { blade: 3.0, flash: 32, wave: 45, impact: 7000 };
  }

  /* ---------------- public API ---------------- */
  play({ restart = true } = {}) {
    if (restart || this.time >= this.duration) this.seek(0);
    this.playing = true;
  }
  pause() { this.playing = false; }
  /** Jump to a time in seconds (particles are re-simulated so the frame is exact). */
  seek(t) {
    this.time = Math.max(0, Math.min(t, this.duration));
    this.embers.cap.fill(0); this._released = false; this._lastFrame = -1;
    for (let x = 0; x < this.time; x += 1 / FPS) this._evaluate(x, true);
    this._evaluate(this.time, true);
    this._lastFrame = this.warp.frameAt(this.time);
  }
  setPalette(name) {
    this.paletteName = name; this.pal = PALETTES[name];
    for (const m of this._mats) applyPalette(m, this.pal);
    for (const l of this.lights) l.color.setRGB(...this.pal.light);
  }
  /** Drawing-buffer height in pixels (for ember sizing). */
  setViewportHeight(px) { this.emberMat.uniforms.uViewportH.value = px; }
  get frame() { return this.warp.frameAt(this.time); }

  update(dt) {
    if (!this.ready) return;
    if (this.playing) {
      this.time += dt * this.speed;
      if (this.time >= this.duration) { this.time = this.duration; this.playing = false; this._evaluate(this.time); this.onEvent('end'); return; }
    }
    this._evaluate(this.time);
  }

  _evaluate(t, silent = false) {
    const F = this.warp.frameAt(t), T = t;          // F: animation frame (tempo-mapped); T: real seconds (flame flicker)
    this._pose(frameToTime(F));
    // release frame: effects that leave the character are placed in world space at the moment of release
    if (F >= RELEASE_FRAME && !this._released) {
      this.group.matrixWorld.decompose(this.worldFx.position, this.worldFx.quaternion, this._v);
      this.worldFx.updateMatrixWorld(true); this._released = true;
    }
    if (F < RELEASE_FRAME) this._released = false;
    // events
    if (!silent && this._lastFrame >= 0) {
      for (const ev of EVENTS) if (this._lastFrame < ev.frame && F >= ev.frame) this.onEvent(ev.name);
      if (this._lastFrame < this.fImp && F >= this.fImp) this.onEvent('impact');
    }
    this._lastFrame = F;

    const eb = curve(FX_CURVES.energyBlade, F), aura = curve(FX_CURVES.aura, F), glow = curve(FX_CURVES.bladeGlow, F);
    // energy blade
    if (this.energyBlade) {
      for (const m of [this.energyBlade.material, this.energyGlow.material]) { m.uniforms.uIntensity.value = eb; m.uniforms.uTime.value = T; }
    }
    // aura + embers (world space, driven by the skinned body)
    this._updateAnchors();
    this.auraMat.uniforms.uAura.value = aura; this.auraMat.uniforms.uTime.value = T;
    this.aura.visible = aura > 0.001;
    this._updateEmbers(F);
    // ground
    this.crackMat.uniforms.uCrack.value = curve(FX_CURVES.groundCrack, F);
    if (this.floatingRocks) this._updateFloatingRocks(F);
    // swing
    this.trailMat.uniforms.uFrame.value = F; this.trail.visible = F > 78.5 && F < 92;
    this._updateRings(F);
    // wave, trench, debris, impact
    this._updateWave(F, T);
    this.trenchMat.uniforms.uWaveDist.value = this._released ? waveDist(Math.min(F, this.fImp)) : -100;
    this.trench.visible = this._released;
    this._updateDebris(F);
    this._updateImpact(F, T);
    // lights
    const L = this.lightScale;
    this._weaponPoint(BLADE_MID_REST, this.bladeLight.position);
    this.bladeLight.intensity = (glow * 0.4 + eb * 0.6) * L.blade;
    this.flashLight.intensity = curve(FX_CURVES.flash, F, true) * L.flash;
    this.waveLight.intensity = this.waveCore.visible ? L.wave : 0;
    this.impactLight.intensity = (this.impactValue || 0) * L.impact;
    // cinematic camera
    if (this.cinematicCamera && this.camera) this._applyCameraTrack(F);
  }

  _applyCameraTrack(F) {
    const tr = CAMERA_TRACK, i0 = Math.max(0, Math.min(tr.length - 1, Math.floor(F) - 1)), i1 = Math.min(tr.length - 1, i0 + 1);
    let u = Math.min(1, Math.max(0, F - Math.floor(F)));
    const a = tr[i0], b = tr[i1];
    if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) > 1.0) u = 0;       // camera cut: don't blend
    const p = new THREE.Vector3(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u);
    const qa = new THREE.Quaternion(a[4], a[5], a[6], a[3]), qb = new THREE.Quaternion(b[4], b[5], b[6], b[3]);
    const q = qa.slerp(qb, u);
    const lens = a[7] + (b[7] - a[7]) * u;
    const cam = this.camera;
    cam.position.copy(this.group.localToWorld(p));
    this.group.getWorldQuaternion(this._q); cam.quaternion.copy(this._q).multiply(q);
    const hfov = 2 * Math.atan(18 / lens);
    cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hfov / 2) / cam.aspect));
    cam.updateProjectionMatrix();
  }

  dispose() {
    this.scene.remove(this.group, this.worldFx, this.aura, this.emberPts, this.bladeLight);
    if (this.root) this.root.traverse((o) => {
      if (o.geometry && o !== this.energyGlow) o.geometry.dispose();
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of ms) { for (const v of Object.values(m)) if (v && v.isTexture) v.dispose(); if (!this._mats.includes(m)) m.dispose(); }
    });
    for (const d of this._disposables) d.dispose && d.dispose();
    for (const m of this._mats) { m.dispose(); _paletteMats.delete(m); }
    this.mixer && this.mixer.stopAllAction();
  }
}

/* ------------------------------------------------------------------ *
 *  Optional demo environment (dusk wasteland + moon), matching the film
 * ------------------------------------------------------------------ */
export function createDemoEnvironment(scene, { impactDistance = 56, shadows = true } = {}) {
  const env = new THREE.Group(); env.name = 'GetsugaDemoEnvironment';
  scene.fog = new THREE.FogExp2(0x160b10, 0.0075);
  // sky dome with horizon glow + stars
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: `varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
      void main(){
        vec3 d = normalize(vD); float e = clamp(d.y, -0.05, 1.0);
        vec3 zen = vec3(0.004,0.004,0.012), hor = vec3(0.14,0.05,0.05), mid = vec3(0.035,0.015,0.03);
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.08, e)); c = mix(c, zen, smoothstep(0.08, 0.35, e));
        float warm = clamp((-d.z + 0.2)/1.2, 0.0, 1.0) * clamp((0.25 - e)/0.25, 0.0, 1.0);
        c += vec3(0.16,0.035,0.022) * warm;
        vec3 g = floor(d * 260.0); float s = h(g); float star = step(0.9965, s) * smoothstep(0.1, 0.4, e);
        c += vec3(0.8) * star * h(g + 1.7);
        gl_FragColor = vec4(c * 1.5, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  sky.renderOrder = -10; env.add(sky);
  // moon (in the direction the wave travels)
  const moon = new THREE.Mesh(new THREE.SphereGeometry(28, 48, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.9, 0.82).multiplyScalar(0.72), fog: false }));
  moon.position.set(12, 125, 420); env.add(moon);
  // ground with procedural detail texture
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const cx = cv.getContext('2d');
  const img = cx.createImageData(256, 256); const rr = mulberry32(5);
  for (let i = 0; i < 256 * 256; i++) { const v = 120 + rr() * 60 + (rr() < 0.02 ? -80 : 0); img.data.set([v, v * 0.85, v * 0.75, 255], i * 4); }
  cx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(160, 160); tex.colorSpace = THREE.SRGBColorSpace;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshStandardMaterial({ color: 0x4a3a32, map: tex, roughness: 1, metalness: 0 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; env.add(ground);
  // boulders + mesas
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x3d3029, roughness: 0.95, flatShading: true });
  const rnd = mulberry32(21);
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, r = 4 + rnd() * 18, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (z > 0 && Math.abs(x) < 3.5) continue;
    const s = 0.25 + rnd() * 0.85, m = new THREE.Mesh(rockGeometry(100 + i, 2), rockMat);
    m.position.set(x, -0.15 * s, z); m.scale.set(s, s * 0.7, s * (0.7 + rnd() * 0.6)); m.rotation.y = rnd() * 6; m.castShadow = m.receiveShadow = true; env.add(m);
  }
  const mesas = [[0.5, impactDistance + 6, 10, 6.5, 14], [-28, 80, 16, 10, 21], [30, 95, 19, 10, 27], [-55, 130, 25, 16, 30], [60, 40, 17, 12, 17], [-35, -45, 23, 16, 23], [40, -60, 27, 13, 19]];
  mesas.forEach(([x, z, sx, sz, h], i) => {
    const m = new THREE.Mesh(rockGeometry(200 + i, 3), rockMat); m.position.set(x, -0.5, z); m.scale.set(sx, h * 0.62, sz); env.add(m);
  });
  // lights
  const hemi = new THREE.HemisphereLight(0x3a3452, 0x1a120f, 0.9); env.add(hemi);
  const moonLight = new THREE.DirectionalLight(0x8ca6ff, 1.6); moonLight.position.set(1.2, 12, 40);
  if (shadows) {
    moonLight.castShadow = true; moonLight.shadow.mapSize.set(2048, 2048);
    const c = moonLight.shadow.camera; c.left = -6; c.right = 6; c.top = 6; c.bottom = -6; c.near = 1; c.far = 80; moonLight.shadow.bias = -0.0005;
  }
  env.add(moonLight, moonLight.target);
  const rim = new THREE.DirectionalLight(0xff6a4a, 1.1); rim.position.set(2.5, 5.0, -4.0); env.add(rim);
  const fill = new THREE.DirectionalLight(0x7088ff, 0.6); fill.position.set(-3.5, 2.0, 3.0); env.add(fill);
  scene.add(env);
  return env;
}
