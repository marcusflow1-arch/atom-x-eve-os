/* eslint-disable */
// Small WebGL2 renderer: skinned characters (vertex-colour), static meshes, additive/alpha FX batches.
import { m4 } from './math.js';

const LIGHTING = `
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uAmbTop; uniform vec3 uAmbBot;
uniform vec4 uLP[4]; uniform vec3 uLC[4]; uniform vec3 uCam; uniform vec3 uFogCol; uniform float uFogD;
vec3 lightIt(vec3 base, vec3 n, vec3 wp, float spec){
  n = normalize(n);
  float hemi = 0.5 + 0.5 * n.y;
  vec3 c = base * (mix(uAmbBot, uAmbTop, hemi) + uSunCol * max(dot(n, uSunDir), 0.0));
  for (int i = 0; i < 4; i++) {
    vec3 d = uLP[i].xyz - wp; float dist = length(d); float r = uLP[i].w;
    if (r > 0.0) { float a = clamp(1.0 - dist / r, 0.0, 1.0); a *= a; c += base * uLC[i] * a * (0.35 + 0.65 * max(dot(n, d / max(dist, 1e-3)), 0.0)); }
  }
  vec3 v = normalize(uCam - wp);
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  c += rim * 0.10 * uAmbTop;
  c += spec * pow(max(dot(n, normalize(uSunDir + v)), 0.0), 40.0) * uSunCol * 0.35;
  float f = 1.0 - exp(-length(uCam - wp) * uFogD);
  return mix(c, uFogCol, clamp(f, 0.0, 1.0));
}`;

const SKIN_VS = `#version 300 es
precision highp float; precision highp int;
in vec3 aPos; in vec3 aNrm; in vec4 aCol; in uvec4 aJ; in vec4 aW;
uniform mat4 uVP; uniform mat4 uModel; uniform highp sampler2D uJT;
out vec3 vN; out vec4 vC; out vec3 vW;
mat4 jm(uint j){ int b = int(j) * 4; return mat4(texelFetch(uJT, ivec2(b, 0), 0), texelFetch(uJT, ivec2(b + 1, 0), 0), texelFetch(uJT, ivec2(b + 2, 0), 0), texelFetch(uJT, ivec2(b + 3, 0), 0)); }
void main(){
  mat4 s = jm(aJ.x) * aW.x + jm(aJ.y) * aW.y + jm(aJ.z) * aW.z + jm(aJ.w) * aW.w;
  vec4 p = s * vec4(aPos, 1.0); vec4 wp = uModel * p;
  vN = mat3(uModel) * (mat3(s) * aNrm); vC = aCol; vW = wp.xyz;
  gl_Position = uVP * wp;
}`;
const SKIN_FS = `#version 300 es
precision highp float;
in vec3 vN; in vec4 vC; in vec3 vW; out vec4 o;
uniform vec3 uTint; uniform float uTintAmt; uniform float uAlpha; uniform float uGlow;
${LIGHTING}
void main(){
  vec3 base = vC.rgb; base = mix(base, uTint, uTintAmt);
  vec3 c = lightIt(base, vN, vW, 0.25);
  c += uGlow * uTint;
  o = vec4(c, uAlpha);
}`;
const MESH_VS = `#version 300 es
precision highp float;
in vec3 aPos; in vec3 aNrm; in vec4 aCol;
uniform mat4 uVP; uniform mat4 uModel;
out vec3 vN; out vec4 vC; out vec3 vW;
void main(){ vec4 wp = uModel * vec4(aPos, 1.0); vN = mat3(uModel) * aNrm; vC = aCol; vW = wp.xyz; gl_Position = uVP * wp; }`;
const MESH_FS = `#version 300 es
precision highp float;
in vec3 vN; in vec4 vC; in vec3 vW; out vec4 o;
uniform float uSpec; uniform vec3 uEmis;
${LIGHTING}
void main(){ vec3 c = lightIt(vC.rgb, vN, vW, uSpec) + uEmis; o = vec4(c, vC.a); }`;
const GROUND_FS = `#version 300 es
precision highp float;
in vec3 vN; in vec4 vC; in vec3 vW; out vec4 o;
uniform float uTime;
${LIGHTING}
float line(float x, float w){ float d = abs(fract(x - 0.5) - 0.5) / fwidth(x); return 1.0 - clamp(d / w, 0.0, 1.0); }
void main(){
  vec2 p = vW.xz; float r = length(p);
  vec3 base = vec3(0.09, 0.10, 0.12);
  float g1 = max(line(p.x, 1.2), line(p.y, 1.2)); float g2 = max(line(p.x * 0.2, 1.4), line(p.y * 0.2, 1.4));
  base += vec3(0.05, 0.06, 0.08) * g1 * 0.5 + vec3(0.10, 0.12, 0.16) * g2;
  float ring = max(line(r * 0.25, 1.5), 0.0) * 0.6;
  base += vec3(0.05, 0.12, 0.20) * ring * smoothstep(40.0, 10.0, r);
  float checker = mod(floor(p.x * 0.5) + floor(p.y * 0.5), 2.0);
  base *= 0.9 + 0.12 * checker;
  float edge = smoothstep(26.0, 24.0, r); // arena platform
  base = mix(vec3(0.03, 0.035, 0.05), base, edge);
  vec3 c = lightIt(base, vec3(0.0, 1.0, 0.0), vW, 0.15);
  o = vec4(c, 1.0);
}`;
const SKY_VS = `#version 300 es
in vec2 aP; out vec2 vP; void main(){ vP = aP; gl_Position = vec4(aP, 0.9999, 1.0); }`;
const SKY_FS = `#version 300 es
precision highp float;
in vec2 vP; out vec4 o; uniform mat4 uInvVP; uniform vec3 uCam; uniform float uTime;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec4 a = uInvVP * vec4(vP, 1.0, 1.0); vec3 d = normalize(a.xyz / a.w - uCam);
  float t = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 hor = vec3(0.30, 0.20, 0.34), mid = vec3(0.07, 0.07, 0.17), top = vec3(0.015, 0.02, 0.06);
  vec3 c = mix(hor, mid, smoothstep(0.45, 0.62, t)); c = mix(c, top, smoothstep(0.62, 0.95, t));
  c = mix(vec3(0.05, 0.04, 0.08), c, smoothstep(0.44, 0.50, t));
  vec2 g = vec2(atan(d.z, d.x) * 60.0, d.y * 120.0); vec2 id = floor(g); float st = step(0.985, h(id)) * smoothstep(0.1, 0.4, d.y);
  c += vec3(0.8, 0.85, 1.0) * st * (0.5 + 0.5 * sin(uTime * 2.0 + h(id) * 30.0));
  vec3 pd = normalize(vec3(-0.45, 0.30, -0.80)); float pl = smoothstep(0.972, 0.975, dot(d, pd)); // planet
  c = mix(c, vec3(0.55, 0.33, 0.26) * (0.4 + 0.8 * clamp(dot(d, normalize(pd + vec3(0.6, 0.3, 0.2))) * 8.0 - 6.4, 0.0, 1.0)), pl);
  c += vec3(0.5, 0.35, 0.6) * pow(max(dot(d, pd), 0.0), 18.0) * 0.25;
  o = vec4(c, 1.0);
}`;
const FX_VS = `#version 300 es
precision highp float;
in vec3 aPos; in vec2 aUV; in vec4 aCol; uniform mat4 uVP; out vec2 vUV; out vec4 vC;
void main(){ vUV = aUV; vC = aCol; gl_Position = uVP * vec4(aPos, 1.0); }`;
const FX_FS = `#version 300 es
precision highp float;
in vec2 vUV; in vec4 vC; out vec4 o; uniform float uMode;
void main(){
  float r2 = dot(vUV, vUV); float a;
  if (uMode > 0.5) { a = clamp(1.0 - r2, 0.0, 1.0); a *= a; }       // soft round
  else { a = clamp(1.0 - r2, 0.0, 1.0); a = a * a * (3.0 - 2.0 * a); }
  if (vUV.x > 1.5) { a = 1.0; }                                       // solid (uv.x = 2)
  o = vec4(vC.rgb * (vC.a * a), vC.a * a);                            // premultiplied-ish; blend func decides
}`;

function compile(gl, type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + '\n' + src.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n')); return s; }
function program(gl, vs, fs) {
  const p = gl.createProgram(); gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); const nm = info.name.replace(/\[0\]$/, ''); u[nm] = gl.getUniformLocation(p, info.name); }
  return { p, u };
}

export class Renderer {
  constructor(canvas) {
    const gl = this.gl = canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL2 not available');
    this.canvas = canvas;
    this.progs = { skin: program(gl, SKIN_VS, SKIN_FS), mesh: program(gl, MESH_VS, MESH_FS), ground: program(gl, MESH_VS, GROUND_FS), sky: program(gl, SKY_VS, SKY_FS), fx: program(gl, FX_VS, FX_FS) };
    // joint texture
    this.jt = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.jt);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 256, 1, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // sky quad
    this.skyVao = gl.createVertexArray(); gl.bindVertexArray(this.skyVao); const sb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, sb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); const al = gl.getAttribLocation(this.progs.sky.p, 'aP'); gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
    // fx dynamic batches
    this.fxCap = 60000; this.fx = [0, 1].map(() => { const vao = gl.createVertexArray(); gl.bindVertexArray(vao); const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
      gl.bufferData(gl.ARRAY_BUFFER, this.fxCap * 9 * 4, gl.DYNAMIC_DRAW); const P = this.progs.fx.p; const st = 36;
      const a = n => gl.getAttribLocation(P, n); gl.enableVertexAttribArray(a('aPos')); gl.vertexAttribPointer(a('aPos'), 3, gl.FLOAT, false, st, 0);
      gl.enableVertexAttribArray(a('aUV')); gl.vertexAttribPointer(a('aUV'), 2, gl.FLOAT, false, st, 12); gl.enableVertexAttribArray(a('aCol')); gl.vertexAttribPointer(a('aCol'), 4, gl.FLOAT, false, st, 20);
      return { vao, vb, data: new Float32Array(this.fxCap * 9), n: 0 }; });
    this.view = m4.ident(); this.proj = m4.ident(); this.vp = m4.ident(); this.cam = [0, 2, 5]; this.time = 0;
    this.env = { sunDir: [0.4, 0.8, 0.45], sunCol: [0.55, 0.52, 0.62], ambTop: [0.30, 0.34, 0.46], ambBot: [0.10, 0.09, 0.12], fogCol: [0.05, 0.05, 0.10], fogD: 0.012 };
    this.lights = Array.from({ length: 4 }, () => ({ p: [0, 0, 0], r: 0, c: [0, 0, 0] }));
    this.jbuf = new Float32Array(256 * 4);
  }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr || 1.5); const w = Math.floor(this.canvas.clientWidth * dpr), h = Math.floor(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
    this.gl.viewport(0, 0, w, h); this.aspect = w / h;
  }
  setCamera(eye, target, fov = 62 * Math.PI / 180) {
    this.cam = eye; m4.lookAt(eye, target, [0, 1, 0], this.view); m4.perspective(fov, this.aspect || 1, 0.05, 400, this.proj); m4.mul(this.proj, this.view, this.vp);
    this.camR = [this.view[0], this.view[4], this.view[8]]; this.camU = [this.view[1], this.view[5], this.view[9]]; this.camF = [-this.view[2], -this.view[6], -this.view[10]];
  }
  begin() {
    const gl = this.gl; gl.clearColor(0.03, 0.03, 0.07, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); gl.disable(gl.BLEND);
    // sky
    const S = this.progs.sky; gl.useProgram(S.p); const inv = invert(this.vp); gl.uniformMatrix4fv(S.u.uInvVP, false, inv); gl.uniform3fv(S.u.uCam, this.cam); gl.uniform1f(S.u.uTime, this.time);
    gl.disable(gl.DEPTH_TEST); gl.bindVertexArray(this.skyVao); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.enable(gl.DEPTH_TEST);
    for (const f of this.fx) f.n = 0; this.fxMode = 0;
  }
  _commonUniforms(P) {
    const gl = this.gl, u = P.u, e = this.env;
    if (u.uVP) gl.uniformMatrix4fv(u.uVP, false, this.vp);
    if (u.uSunDir) { gl.uniform3fv(u.uSunDir, e.sunDir); gl.uniform3fv(u.uSunCol, e.sunCol); gl.uniform3fv(u.uAmbTop, e.ambTop); gl.uniform3fv(u.uAmbBot, e.ambBot); gl.uniform3fv(u.uCam, this.cam); gl.uniform3fv(u.uFogCol, e.fogCol); gl.uniform1f(u.uFogD, e.fogD); }
    if (u.uLP) { const lp = new Float32Array(16), lc = new Float32Array(12); this.lights.forEach((l, i) => { lp.set(l.p, i * 4); lp[i * 4 + 3] = l.r; lc.set(l.c, i * 3); }); gl.uniform4fv(u.uLP, lp); gl.uniform3fv(u.uLC, lc); }
    if (u.uTime) gl.uniform1f(u.uTime, this.time);
  }
  // ---- meshes
  uploadSkinned(att) { // att: {pos,nrm,col,joints,weights,idx}
    const gl = this.gl, P = this.progs.skin.p; const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const buf = (data, target = gl.ARRAY_BUFFER) => { const b = gl.createBuffer(); gl.bindBuffer(target, b); gl.bufferData(target, data, gl.STATIC_DRAW); return b; };
    const al = n => gl.getAttribLocation(P, n);
    buf(att.pos); gl.enableVertexAttribArray(al('aPos')); gl.vertexAttribPointer(al('aPos'), 3, gl.FLOAT, false, 0, 0);
    buf(att.nrm); gl.enableVertexAttribArray(al('aNrm')); gl.vertexAttribPointer(al('aNrm'), 3, gl.FLOAT, false, 0, 0);
    buf(att.col); gl.enableVertexAttribArray(al('aCol')); gl.vertexAttribPointer(al('aCol'), 4, gl.UNSIGNED_BYTE, true, 0, 0);
    buf(att.joints); gl.enableVertexAttribArray(al('aJ')); gl.vertexAttribIPointer(al('aJ'), 4, gl.UNSIGNED_BYTE, 0, 0);
    buf(att.weights); gl.enableVertexAttribArray(al('aW')); gl.vertexAttribPointer(al('aW'), 4, gl.UNSIGNED_BYTE, true, 0, 0);
    buf(att.idx, gl.ELEMENT_ARRAY_BUFFER);
    return { vao, count: att.idx.length };
  }
  uploadStatic(m) { // {pos,nrm,col(Float32 or Uint8 rgba),idx}
    const gl = this.gl, P = this.progs.mesh.p; const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const buf = (data, target = gl.ARRAY_BUFFER) => { const b = gl.createBuffer(); gl.bindBuffer(target, b); gl.bufferData(target, data, gl.STATIC_DRAW); return b; };
    const al = n => gl.getAttribLocation(P, n);
    buf(m.pos); gl.enableVertexAttribArray(al('aPos')); gl.vertexAttribPointer(al('aPos'), 3, gl.FLOAT, false, 0, 0);
    buf(m.nrm); gl.enableVertexAttribArray(al('aNrm')); gl.vertexAttribPointer(al('aNrm'), 3, gl.FLOAT, false, 0, 0);
    buf(m.col); gl.enableVertexAttribArray(al('aCol')); gl.vertexAttribPointer(al('aCol'), 4, gl.UNSIGNED_BYTE, true, 0, 0);
    buf(m.idx, gl.ELEMENT_ARRAY_BUFFER);
    // same layout works for the ground program (same attribute names)
    return { vao, count: m.idx.length, type: m.idx instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT };
  }
  drawSkinned(mesh, actor, o = {}) {
    const gl = this.gl, P = this.progs.skin; gl.useProgram(P.p); this._commonUniforms(P);
    gl.uniformMatrix4fv(P.u.uModel, false, actor.model);
    const nb = actor.nBones; const jb = this.jbuf; jb.set(actor.skin.subarray(0, nb * 16));
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.jt); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, nb * 4, 1, gl.RGBA, gl.FLOAT, jb.subarray(0, nb * 16)); gl.uniform1i(P.u.uJT, 0);
    gl.uniform3fv(P.u.uTint, o.tint || actor.tint); gl.uniform1f(P.u.uTintAmt, o.tintAmt ?? actor.tintAmt); gl.uniform1f(P.u.uAlpha, o.alpha ?? 1); gl.uniform1f(P.u.uGlow, o.glow || 0);
    gl.bindVertexArray(mesh.vao); gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_INT, 0);
  }
  drawMesh(mesh, model, o = {}) {
    const gl = this.gl, P = this.progs[o.ground ? 'ground' : 'mesh']; gl.useProgram(P.p); this._commonUniforms(P);
    gl.uniformMatrix4fv(P.u.uModel, false, model); if (P.u.uSpec) gl.uniform1f(P.u.uSpec, o.spec ?? 0.2); if (P.u.uEmis) gl.uniform3fv(P.u.uEmis, o.emis || [0, 0, 0]);
    gl.bindVertexArray(mesh.vao); gl.drawElements(gl.TRIANGLES, mesh.count, mesh.type, 0);
  }
  // ---- fx batch (mode 0 = additive, 1 = alpha)
  _push(b, x, y, z, u, v, r, g, bl, a) { const f = this.fx[b]; if (f.n >= this.fxCap) return; const d = f.data, o = f.n * 9; d[o] = x; d[o + 1] = y; d[o + 2] = z; d[o + 3] = u; d[o + 4] = v; d[o + 5] = r; d[o + 6] = g; d[o + 7] = bl; d[o + 8] = a; f.n++; }
  billboard(p, size, c, mode = 0, rot = 0) {
    const R = this.camR, U = this.camU, s = size, cs = Math.cos(rot) * s, sn = Math.sin(rot) * s;
    const ax = R[0] * cs + U[0] * sn, ay = R[1] * cs + U[1] * sn, az = R[2] * cs + U[2] * sn, bx = -R[0] * sn + U[0] * cs, by = -R[1] * sn + U[1] * cs, bz = -R[2] * sn + U[2] * cs;
    const P = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
    for (const [u, v] of P) this._push(mode, p[0] + ax * u + bx * v, p[1] + ay * u + by * v, p[2] + az * u + bz * v, u, v, c[0], c[1], c[2], c[3]);
  }
  beam(a, b, w, c0, c1 = c0, mode = 0) { // camera-facing quad from a to b
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const f = this.camF || [0, 0, -1];
    let sx = dy * f[2] - dz * f[1], sy = dz * f[0] - dx * f[2], sz = dx * f[1] - dy * f[0]; const l = Math.hypot(sx, sy, sz) || 1; sx *= w / l; sy *= w / l; sz *= w / l;
    this._push(mode, a[0] - sx, a[1] - sy, a[2] - sz, 0, -1, ...c0); this._push(mode, a[0] + sx, a[1] + sy, a[2] + sz, 0, 1, ...c0); this._push(mode, b[0] + sx, b[1] + sy, b[2] + sz, 0, 1, ...c1);
    this._push(mode, a[0] - sx, a[1] - sy, a[2] - sz, 0, -1, ...c0); this._push(mode, b[0] + sx, b[1] + sy, b[2] + sz, 0, 1, ...c1); this._push(mode, b[0] - sx, b[1] - sy, b[2] - sz, 0, -1, ...c1);
  }
  quad(p0, p1, p2, p3, c, mode = 0, solid = false) { // arbitrary quad (world), uv gradient
    const u = solid ? 2 : 0; const V = [[p0, -1], [p1, -1], [p2, 1], [p0, -1], [p2, 1], [p3, 1]];
    for (const [p, v] of V) this._push(mode, p[0], p[1], p[2], u, v, ...c);
  }
  tri(p0, p1, p2, c0, c1, c2, mode = 0) { this._push(mode, ...p0, 2, 0, ...c0); this._push(mode, ...p1, 2, 0, ...c1); this._push(mode, ...p2, 2, 0, ...c2); }
  flushFx() {
    const gl = this.gl, P = this.progs.fx; gl.useProgram(P.p); gl.uniformMatrix4fv(P.u.uVP, false, this.vp);
    gl.enable(gl.BLEND); gl.depthMask(false); gl.disable(gl.CULL_FACE);
    const draw = (i, mode) => { const f = this.fx[i]; if (!f.n) return; gl.uniform1f(P.u.uMode, mode); gl.bindVertexArray(f.vao); gl.bindBuffer(gl.ARRAY_BUFFER, f.vb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, f.data, 0, f.n * 9); gl.drawArrays(gl.TRIANGLES, 0, f.n); };
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.uniform1f(P.u.uMode, 0);
    // alpha batch: shadows etc. (rgb already multiplied by alpha in shader -> use premultiplied blend)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); draw(1, 1);
    gl.blendFunc(gl.ONE, gl.ONE); draw(0, 1);
    gl.depthMask(true); gl.disable(gl.BLEND); gl.enable(gl.CULL_FACE);
  }
}
export function invert(m) {
  const a = m, o = new Float32Array(16);
  const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; det = 1 / det;
  o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det; o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det; o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det; o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det; o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det; o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det; o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det; o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det; o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det; o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det; o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det; o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det; o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return o;
}

// ---- procedural static geometry
export function geo() {
  const G = { pos: [], nrm: [], col: [], idx: [] };
  const col8 = c => [Math.round(c[0] * 255), Math.round(c[1] * 255), Math.round(c[2] * 255), Math.round((c[3] ?? 1) * 255)];
  function vtx(p, n, c) { G.pos.push(...p); G.nrm.push(...n); G.col.push(...col8(c)); return G.pos.length / 3 - 1; }
  const api = {
    box(cx, cy, cz, sx, sy, sz, c) {
      const faces = [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, 1, 0], [0, 0, -1]], [[0, 1, 0], [0, 0, 1], [1, 0, 0]], [[0, -1, 0], [0, 0, -1], [1, 0, 0]], [[0, 0, 1], [0, 1, 0], [-1, 0, 0]], [[0, 0, -1], [0, 1, 0], [1, 0, 0]]];
      for (const [n, u, v] of faces) {
        const cc = [0, 1, 2].map(k => [cx + (n[0] + (-u[0] - v[0])) * sx / 2, cy + (n[1] + (-u[1] - v[1])) * sy / 2, cz + (n[2] + (-u[2] - v[2])) * sz / 2]);
        const P = (a, b) => [cx + (n[0] + a * u[0] + b * v[0]) * sx / 2, cy + (n[1] + a * u[1] + b * v[1]) * sy / 2, cz + (n[2] + a * u[2] + b * v[2]) * sz / 2];
        const i0 = vtx(P(-1, -1), n, c), i1 = vtx(P(1, -1), n, c), i2 = vtx(P(1, 1), n, c), i3 = vtx(P(-1, 1), n, c);
        // winding: ensure outward
        const e1 = [P(1, -1)[0] - P(-1, -1)[0], P(1, -1)[1] - P(-1, -1)[1], P(1, -1)[2] - P(-1, -1)[2]], e2 = [P(1, 1)[0] - P(1, -1)[0], P(1, 1)[1] - P(1, -1)[1], P(1, 1)[2] - P(1, -1)[2]];
        const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; const d = cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2];
        if (d > 0) G.idx.push(i0, i1, i2, i0, i2, i3); else G.idx.push(i0, i2, i1, i0, i3, i2);
      }
      return api;
    },
    cyl(cx, y0, cz, r, h, c, seg = 20, cap = true) {
      const base = G.pos.length / 3;
      for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2, x = Math.cos(a), z = Math.sin(a); vtx([cx + x * r, y0, cz + z * r], [x, 0, z], c); vtx([cx + x * r, y0 + h, cz + z * r], [x, 0, z], c); }
      for (let i = 0; i < seg; i++) { const a = base + i * 2; G.idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
      if (cap) { const t = vtx([cx, y0 + h, cz], [0, 1, 0], c); const s0 = G.pos.length / 3; for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; vtx([cx + Math.cos(a) * r, y0 + h, cz + Math.sin(a) * r], [0, 1, 0], c); } for (let i = 0; i < seg; i++) G.idx.push(t, s0 + i + 1, s0 + i); }
      return api;
    },
    sphere(cx, cy, cz, r, c, seg = 16) {
      const base = G.pos.length / 3;
      for (let j = 0; j <= seg; j++) { const t = j / seg * Math.PI; for (let i = 0; i <= seg * 2; i++) { const a = i / (seg * 2) * Math.PI * 2; const n = [Math.sin(t) * Math.cos(a), Math.cos(t), Math.sin(t) * Math.sin(a)]; vtx([cx + n[0] * r, cy + n[1] * r, cz + n[2] * r], n, c); } }
      const w = seg * 2 + 1; for (let j = 0; j < seg; j++) for (let i = 0; i < seg * 2; i++) { const a = base + j * w + i; G.idx.push(a, a + w, a + 1, a + 1, a + w, a + w + 1); }
      return api;
    },
    plane(cx, cy, cz, sx, sz, c) { const n = [0, 1, 0]; const a = vtx([cx - sx, cy, cz - sz], n, c), b = vtx([cx + sx, cy, cz - sz], n, c), d = vtx([cx + sx, cy, cz + sz], n, c), e = vtx([cx - sx, cy, cz + sz], n, c); G.idx.push(a, e, d, a, d, b); return api; },
    build() { return { pos: new Float32Array(G.pos), nrm: new Float32Array(G.nrm), col: new Uint8Array(G.col), idx: new Uint32Array(G.idx) }; },
  };
  return api;
}
