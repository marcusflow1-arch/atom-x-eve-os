/* eslint-disable */
// Minimal vec/quat/mat4 helpers (column-major Float32Array mat4, like WebGL expects)
export const DEG = Math.PI / 180;
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const wrapPi = a => { a %= Math.PI * 2; if (a > Math.PI) a -= Math.PI * 2; if (a < -Math.PI) a += Math.PI * 2; return a; };
export const angLerp = (a, b, t) => a + wrapPi(b - a) * t;
export const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  scale: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: a => Math.hypot(a[0], a[1], a[2]),
  dist: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]),
  norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
  addS: (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s],
};
export const m4 = {
  ident() { const o = new Float32Array(16); o[0] = o[5] = o[10] = o[15] = 1; return o; },
  mul(a, b, o = new Float32Array(16)) { // o = a*b
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    for (let i = 0; i < 4; i++) {
      const b0 = b[i * 4], b1 = b[i * 4 + 1], b2 = b[i * 4 + 2], b3 = b[i * 4 + 3];
      o[i * 4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      o[i * 4 + 1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      o[i * 4 + 2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      o[i * 4 + 3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    }
    return o;
  },
  perspective(fovy, asp, n, f, o = new Float32Array(16)) {
    const t = 1 / Math.tan(fovy / 2); o.fill(0);
    o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f); return o;
  },
  lookAt(e, c, up, o = new Float32Array(16)) {
    let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2]; let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
    let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx; l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    o[0] = xx; o[1] = yx; o[2] = zx; o[3] = 0; o[4] = xy; o[5] = yy; o[6] = zy; o[7] = 0; o[8] = xz; o[9] = yz; o[10] = zz; o[11] = 0;
    o[12] = -(xx * e[0] + xy * e[1] + xz * e[2]); o[13] = -(yx * e[0] + yy * e[1] + yz * e[2]); o[14] = -(zx * e[0] + zy * e[1] + zz * e[2]); o[15] = 1; return o;
  },
  trs(t, q, s, o = new Float32Array(16)) { // translation, quaternion xyzw, scale[3]
    const x = q[0], y = q[1], z = q[2], w = q[3], xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
    const sx = s ? s[0] : 1, sy = s ? s[1] : 1, sz = s ? s[2] : 1;
    o[0] = (1 - 2 * (yy + zz)) * sx; o[1] = 2 * (xy + wz) * sx; o[2] = 2 * (xz - wy) * sx; o[3] = 0;
    o[4] = 2 * (xy - wz) * sy; o[5] = (1 - 2 * (xx + zz)) * sy; o[6] = 2 * (yz + wx) * sy; o[7] = 0;
    o[8] = 2 * (xz + wy) * sz; o[9] = 2 * (yz - wx) * sz; o[10] = (1 - 2 * (xx + yy)) * sz; o[11] = 0;
    o[12] = t[0]; o[13] = t[1]; o[14] = t[2]; o[15] = 1; return o;
  },
  fromYaw(yaw, pos, o = new Float32Array(16)) { // rotation about +Y then translate
    const c = Math.cos(yaw), s = Math.sin(yaw); o.fill(0);
    o[0] = c; o[2] = -s; o[5] = 1; o[8] = s; o[10] = c; o[12] = pos[0]; o[13] = pos[1]; o[14] = pos[2]; o[15] = 1; return o;
  },
  transformPoint(m, p, o = [0, 0, 0]) {
    o[0] = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12]; o[1] = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13]; o[2] = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]; return o;
  },
  transformDir(m, p, o = [0, 0, 0]) {
    o[0] = m[0] * p[0] + m[4] * p[1] + m[8] * p[2]; o[1] = m[1] * p[0] + m[5] * p[1] + m[9] * p[2]; o[2] = m[2] * p[0] + m[6] * p[1] + m[10] * p[2]; return o;
  },
};
// quaternions are [x,y,z,w]
export const q = {
  slerp(a, b, t, o = [0, 0, 0, 1]) {
    let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]; let s = 1; if (d < 0) { d = -d; s = -1; }
    let k0, k1;
    if (d > 0.9995) { k0 = 1 - t; k1 = t * s; }
    else { const th = Math.acos(d), sn = Math.sin(th); k0 = Math.sin((1 - t) * th) / sn; k1 = Math.sin(t * th) / sn * s; }
    o[0] = a[0] * k0 + b[0] * k1; o[1] = a[1] * k0 + b[1] * k1; o[2] = a[2] * k0 + b[2] * k1; o[3] = a[3] * k0 + b[3] * k1;
    const l = Math.hypot(o[0], o[1], o[2], o[3]) || 1; o[0] /= l; o[1] /= l; o[2] /= l; o[3] /= l; return o;
  },
  mul(a, b, o = [0, 0, 0, 1]) {
    const ax = a[0], ay = a[1], az = a[2], aw = a[3], bx = b[0], by = b[1], bz = b[2], bw = b[3];
    o[0] = aw * bx + ax * bw + ay * bz - az * by; o[1] = aw * by - ax * bz + ay * bw + az * bx; o[2] = aw * bz + ax * by - ay * bx + az * bw; o[3] = aw * bw - ax * bx - ay * by - az * bz; return o;
  },
  axisAngle(ax, ang, o = [0, 0, 0, 1]) { const s = Math.sin(ang / 2); o[0] = ax[0] * s; o[1] = ax[1] * s; o[2] = ax[2] * s; o[3] = Math.cos(ang / 2); return o; },
};
export function rand(a = 0, b = 1) { return a + Math.random() * (b - a); }
// seedable PRNG (mulberry32) used where determinism helps testing
export function makeRng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
