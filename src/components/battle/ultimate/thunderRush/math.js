// Small, allocation-friendly vector/quaternion/matrix helpers.
// The Thunder Rush core is engine-agnostic so the in-game three.js cinematic
// and the offline preview renderer run exactly the same choreography.
// Conventions match three.js: quaternions are [x, y, z, w], matrices are
// column-major Float32/Float64 arrays of length 16.

export const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { const x = clamp(t); return x * x * (3 - 2 * x); };
export const smoother = (t) => { const x = clamp(t); return x * x * x * (x * (x * 6 - 15) + 10); };
export const easeOut = (t, p = 2) => 1 - Math.pow(1 - clamp(t), p);
export const easeIn = (t, p = 2) => Math.pow(clamp(t), p);
export const easeOutBack = (t, s = 1.7) => { const x = clamp(t) - 1; return 1 + x * x * ((s + 1) * x + s); };
// 0..1 progress of t inside [a, b].
export const span = (t, a, b) => clamp((t - a) / (b - a));
// Rises over [a, b], holds, falls over [c, d].
export const window4 = (t, a, b, c, d) => (t < a || t > d ? 0 : t < b ? smooth((t - a) / (b - a)) : t <= c ? 1 : 1 - smooth((t - c) / (d - c)));

export const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  scale: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  addScaled: (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  dist: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]),
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
  // Component of a perpendicular to unit vector n.
  perp: (a, n) => { const d = a[0] * n[0] + a[1] * n[1] + a[2] * n[2]; return [a[0] - n[0] * d, a[1] - n[1] * d, a[2] - n[2] * d]; },
  // Any unit vector perpendicular to unit vector n.
  anyPerp: (n) => { const t = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; const c = v3.cross(n, t); return v3.norm(c); },
};

export const q = {
  identity: () => [0, 0, 0, 1],
  mul: (a, b) => [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ],
  conj: (a) => [-a[0], -a[1], -a[2], a[3]],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2], a[3]) || 1; return [a[0] / l, a[1] / l, a[2] / l, a[3] / l]; },
  rotate: (a, v) => {
    const [x, y, z, w] = a;
    const ix = w * v[0] + y * v[2] - z * v[1];
    const iy = w * v[1] + z * v[0] - x * v[2];
    const iz = w * v[2] + x * v[1] - y * v[0];
    const iw = -x * v[0] - y * v[1] - z * v[2];
    return [
      ix * w + iw * -x + iy * -z - iz * -y,
      iy * w + iw * -y + iz * -x - ix * -z,
      iz * w + iw * -z + ix * -y - iy * -x,
    ];
  },
  axisAngle: (axis, angle) => { const n = v3.norm(axis); const s = Math.sin(angle / 2); return [n[0] * s, n[1] * s, n[2] * s, Math.cos(angle / 2)]; },
  // Intrinsic Y (yaw) then X (pitch) then Z (roll), like three.js 'YXZ'.
  euler: (pitch = 0, yaw = 0, roll = 0) => {
    const c1 = Math.cos(pitch / 2), c2 = Math.cos(yaw / 2), c3 = Math.cos(roll / 2);
    const s1 = Math.sin(pitch / 2), s2 = Math.sin(yaw / 2), s3 = Math.sin(roll / 2);
    return [
      s1 * c2 * c3 + c1 * s2 * s3,
      c1 * s2 * c3 - s1 * c2 * s3,
      c1 * c2 * s3 - s1 * s2 * c3,
      c1 * c2 * c3 + s1 * s2 * s3,
    ];
  },
  slerp: (a, b, t) => {
    let [bx, by, bz, bw] = b;
    let cos = a[0] * bx + a[1] * by + a[2] * bz + a[3] * bw;
    if (cos < 0) { cos = -cos; bx = -bx; by = -by; bz = -bz; bw = -bw; }
    if (cos > 0.9995) return q.norm([a[0] + (bx - a[0]) * t, a[1] + (by - a[1]) * t, a[2] + (bz - a[2]) * t, a[3] + (bw - a[3]) * t]);
    const theta = Math.acos(cos), sin = Math.sin(theta);
    const wa = Math.sin((1 - t) * theta) / sin, wb = Math.sin(t * theta) / sin;
    return [a[0] * wa + bx * wb, a[1] * wa + by * wb, a[2] * wa + bz * wb, a[3] * wa + bw * wb];
  },
  // Rotation matrix (columns c0, c1, c2) to quaternion.
  fromBasis: (c0, c1, c2) => {
    const m11 = c0[0], m12 = c1[0], m13 = c2[0];
    const m21 = c0[1], m22 = c1[1], m23 = c2[1];
    const m31 = c0[2], m32 = c1[2], m33 = c2[2];
    const trace = m11 + m22 + m33;
    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1);
      return [(m32 - m23) * s, (m13 - m31) * s, (m21 - m12) * s, 0.25 / s];
    }
    if (m11 > m22 && m11 > m33) {
      const s = 2 * Math.sqrt(1 + m11 - m22 - m33);
      return [0.25 * s, (m12 + m21) / s, (m13 + m31) / s, (m32 - m23) / s];
    }
    if (m22 > m33) {
      const s = 2 * Math.sqrt(1 + m22 - m11 - m33);
      return [(m12 + m21) / s, 0.25 * s, (m23 + m32) / s, (m13 - m31) / s];
    }
    const s = 2 * Math.sqrt(1 + m33 - m11 - m22);
    return [(m13 + m31) / s, (m23 + m32) / s, 0.25 * s, (m21 - m12) / s];
  },
  // Rotation taking the orthonormal frame (u0, p0) onto (u1, p1).
  // p is orthogonalised against u. Fully determines twist, unlike shortest-arc.
  alignFrames: (u0, p0, u1, p1) => {
    const a0 = v3.norm(u0); let b0 = v3.perp(p0, a0); b0 = v3.len(b0) < 1e-6 ? v3.anyPerp(a0) : v3.norm(b0);
    const a1 = v3.norm(u1); let b1 = v3.perp(p1, a1); b1 = v3.len(b1) < 1e-6 ? v3.anyPerp(a1) : v3.norm(b1);
    const r0 = q.fromBasis(a0, b0, v3.cross(a0, b0));
    const r1 = q.fromBasis(a1, b1, v3.cross(a1, b1));
    return q.norm(q.mul(r1, q.conj(r0)));
  },
  fromUnitVectors: (a, b) => {
    const d = v3.dot(a, b);
    if (d < -0.999999) return q.axisAngle(v3.anyPerp(a), Math.PI);
    const c = v3.cross(a, b);
    return q.norm([c[0], c[1], c[2], 1 + d]);
  },
};

export const m4 = {
  identity: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  compose: (p, r, s) => {
    const [x, y, z, w] = r; const sx = Array.isArray(s) ? s[0] : s, sy = Array.isArray(s) ? s[1] : s, sz = Array.isArray(s) ? s[2] : s;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
    return [
      (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
      (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
      (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
      p[0], p[1], p[2], 1,
    ];
  },
  mul: (a, b) => {
    const out = new Array(16);
    for (let c = 0; c < 4; c += 1) {
      for (let r = 0; r < 4; r += 1) {
        out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
    }
    return out;
  },
  point: (m, p) => [
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
  ],
  dir: (m, p) => [
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2],
  ],
  invert: (m) => {
    const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = m;
    const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) return m4.identity();
    det = 1 / det;
    return [
      (a11 * b11 - a12 * b10 + a13 * b09) * det, (a02 * b10 - a01 * b11 - a03 * b09) * det, (a31 * b05 - a32 * b04 + a33 * b03) * det, (a22 * b04 - a21 * b05 - a23 * b03) * det,
      (a12 * b08 - a10 * b11 - a13 * b07) * det, (a00 * b11 - a02 * b08 + a03 * b07) * det, (a32 * b02 - a30 * b05 - a33 * b01) * det, (a20 * b05 - a22 * b02 + a23 * b01) * det,
      (a10 * b10 - a11 * b08 + a13 * b06) * det, (a01 * b08 - a00 * b10 - a03 * b06) * det, (a30 * b04 - a31 * b02 + a33 * b00) * det, (a21 * b02 - a20 * b04 - a23 * b00) * det,
      (a11 * b07 - a10 * b09 - a12 * b06) * det, (a00 * b09 - a01 * b07 + a02 * b06) * det, (a31 * b01 - a30 * b03 - a32 * b00) * det, (a20 * b03 - a21 * b01 + a22 * b00) * det,
    ];
  },
  // Rotation (unit quaternion) and uniform scale of an affine matrix.
  rotationOf: (m) => {
    const sx = Math.hypot(m[0], m[1], m[2]) || 1, sy = Math.hypot(m[4], m[5], m[6]) || 1, sz = Math.hypot(m[8], m[9], m[10]) || 1;
    return q.norm(q.fromBasis([m[0] / sx, m[1] / sx, m[2] / sx], [m[4] / sy, m[5] / sy, m[6] / sy], [m[8] / sz, m[9] / sz, m[10] / sz]));
  },
  scaleOf: (m) => (Math.hypot(m[0], m[1], m[2]) + Math.hypot(m[4], m[5], m[6]) + Math.hypot(m[8], m[9], m[10])) / 3,
  translationOf: (m) => [m[12], m[13], m[14]],
  perspective: (fovY, aspect, near, far) => {
    const f = 1 / Math.tan(fovY / 2), nf = 1 / (near - far);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
  },
  lookAt: (eye, target, up = [0, 1, 0]) => {
    // Returns the camera's WORLD matrix (like three's Object3D.lookAt for cameras).
    const z = v3.norm(v3.sub(eye, target));
    let x = v3.cross(up, z); if (v3.len(x) < 1e-6) x = [1, 0, 0]; x = v3.norm(x);
    const y = v3.cross(z, x);
    return [x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, eye[0], eye[1], eye[2], 1];
  },
};

// Deterministic PRNG (mulberry32) so every render of a frame is identical.
export function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
