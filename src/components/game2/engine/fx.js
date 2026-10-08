/* eslint-disable */
// Visual effects: particles, lightning, rings, saber blade + trail, shadows.
import { v3 } from './math.js';

const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);
export class FX {
  constructor(R) { this.R = R; this.parts = []; this.rings = []; this.flashes = []; this.cap = 3500; }
  emit(o) {
    if (this.parts.length >= this.cap) this.parts.shift();
    this.parts.push({ p: o.p.slice(), v: o.v ? o.v.slice() : [0, 0, 0], life: o.life, max: o.life, size: o.size ?? 0.1, grow: o.grow ?? 0, c0: o.c0 ?? [1, 1, 1, 1], c1: o.c1 ?? [1, 1, 1, 0], drag: o.drag ?? 0, grav: o.grav ?? 0, mode: o.mode ?? 0, rot: o.rot ?? 0, spin: o.spin ?? 0 });
  }
  burst(p, n, o) { for (let i = 0; i < n; i++) { const d = v3.norm([rnd(-1, 1), rnd(-0.3, 1), rnd(-1, 1)]); const s = rnd(o.s0 ?? 1, o.s1 ?? 4); this.emit({ ...o, p, v: v3.scale(d, s), life: rnd(o.l0 ?? 0.3, o.l1 ?? 0.7), size: rnd(o.z0 ?? 0.03, o.z1 ?? 0.07) }); } }
  sparks(p, dir, n = 14, c = [1, 0.85, 0.5, 1]) {
    for (let i = 0; i < n; i++) { const d = v3.norm([dir[0] + rnd(-0.8, 0.8), dir[1] + rnd(-0.5, 0.9), dir[2] + rnd(-0.8, 0.8)]); this.emit({ p, v: v3.scale(d, rnd(2, 7)), life: rnd(0.25, 0.6), size: rnd(0.012, 0.03), c0: c, c1: [c[0], c[1] * 0.4, 0.1, 0], grav: -9, drag: 0.8 }); }
    this.flashes.push({ p: p.slice(), t: 0, life: 0.14, size: 0.35, c: c });
  }
  ring(o) { this.rings.push({ p: o.p.slice(), n: o.n ? v3.norm(o.n) : [0, 1, 0], r0: o.r0 ?? 0.2, r1: o.r1 ?? 2, t: 0, life: o.life ?? 0.5, w: o.w ?? 0.12, c: o.c ?? [0.7, 0.85, 1, 1], move: o.move ? o.move.slice() : [0, 0, 0], seg: o.seg ?? 40 }); }
  update(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const q = this.parts[i]; q.life -= dt; if (q.life <= 0) { this.parts.splice(i, 1); continue; }
      const k = Math.max(0, 1 - q.drag * dt); q.v[0] *= k; q.v[1] = q.v[1] * k + q.grav * dt; q.v[2] *= k; q.p[0] += q.v[0] * dt; q.p[1] += q.v[1] * dt; q.p[2] += q.v[2] * dt; q.size += q.grow * dt; q.rot += q.spin * dt;
      if (q.p[1] < 0.01 && q.grav < 0) { q.p[1] = 0.01; q.v[1] *= -0.3; }
    }
    for (let i = this.rings.length - 1; i >= 0; i--) { const r = this.rings[i]; r.t += dt; if (r.t >= r.life) this.rings.splice(i, 1); }
    for (let i = this.flashes.length - 1; i >= 0; i--) { const f = this.flashes[i]; f.t += dt; if (f.t >= f.life) this.flashes.splice(i, 1); }
  }
  draw() {
    const R = this.R;
    for (const q of this.parts) { const t = 1 - q.life / q.max; const c = [q.c0[0] + (q.c1[0] - q.c0[0]) * t, q.c0[1] + (q.c1[1] - q.c0[1]) * t, q.c0[2] + (q.c1[2] - q.c0[2]) * t, q.c0[3] + (q.c1[3] - q.c0[3]) * t]; R.billboard(q.p, q.size, c, q.mode, q.rot); }
    for (const f of this.flashes) { const t = f.t / f.life; R.billboard(f.p, f.size * (0.6 + t), [f.c[0], f.c[1], f.c[2], 1 - t], 0); }
    for (const r of this.rings) {
      const t = r.t / r.life, e = 1 - (1 - t) * (1 - t), rad = r.r0 + (r.r1 - r.r0) * e, a = 1 - t; const n = r.n;
      let u = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : v3.norm(v3.cross([0, 1, 0], n)); const w = v3.cross(n, u); const ctr = v3.addS(r.p, r.move, t * r.life);
      let prev = null;
      for (let i = 0; i <= r.seg; i++) { const ang = i / r.seg * Math.PI * 2, cs = Math.cos(ang) * rad, sn = Math.sin(ang) * rad; const p = [ctr[0] + u[0] * cs + w[0] * sn, ctr[1] + u[1] * cs + w[1] * sn, ctr[2] + u[2] * cs + w[2] * sn]; if (prev) R.beam(prev, p, r.w * (0.4 + a), [r.c[0], r.c[1], r.c[2], a * r.c[3]]); prev = p; }
    }
  }
  disc(p, r, c, mode = 1) { // flat ground disc (shadow / glow)
    const R = this.R; const P = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
    for (const [u, v] of P) R._push(mode, p[0] + u * r, p[1] + 0.012, p[2] + v * r, u, v, c[0], c[1], c[2], c[3]);
  }
}

// ---- lightning channel
export function bolt(a, b, segs = 10, jit = 0.18, out = []) {
  out.length = 0; out.push(a);
  const d = v3.sub(b, a), L = v3.len(d), dir = v3.scale(d, 1 / (L || 1));
  let u = Math.abs(dir[1]) > 0.9 ? [1, 0, 0] : v3.norm(v3.cross([0, 1, 0], dir)); const w = v3.cross(dir, u);
  for (let i = 1; i < segs; i++) { const t = i / segs, f = Math.sin(t * Math.PI), j = jit * f * (L / 4 > 1 ? 1 : Math.max(0.35, L / 4)); out.push([a[0] + d[0] * t + (u[0] * rnd(-1, 1) + w[0] * rnd(-1, 1)) * j, a[1] + d[1] * t + (u[1] * rnd(-1, 1) + w[1] * rnd(-1, 1)) * j, a[2] + d[2] * t + (u[2] * rnd(-1, 1) + w[2] * rnd(-1, 1)) * j]); }
  out.push(b); return out;
}
export function drawBolt(R, pts, col = [0.55, 0.75, 1], scale = 1) {
  for (let i = 0; i < pts.length - 1; i++) {
    R.beam(pts[i], pts[i + 1], 0.07 * scale, [col[0], col[1], col[2], 0.35], [col[0], col[1], col[2], 0.35]);
    R.beam(pts[i], pts[i + 1], 0.028 * scale, [col[0] * 0.8 + 0.2, col[1] * 0.8 + 0.2, col[2], 0.9], [col[0] * 0.8 + 0.2, col[1] * 0.8 + 0.2, col[2], 0.9]);
    R.beam(pts[i], pts[i + 1], 0.01 * scale, [1, 1, 1, 1], [1, 1, 1, 1]);
  }
}

// ---- lightsaber blade (visual only): base/tip from hilt matrix, ignition, glow, swing trail
export class Blade {
  constructor(color) { this.color = color; this.len = 0; this.target = 0; this.maxLen = 1.02; this.trail = []; this.base = [0, 0, 0]; this.tip = [0, 0, 0]; this.lit = false; this.trailOn = 0; }
  set(on) { this.lit = on; this.target = on ? 1 : 0; }
  update(dt, hiltM, hiltLen, scaleY, now, dirOverride) {
    const sp = this.target > this.len ? 5.5 : 4.5; this.len += Math.sign(this.target - this.len) * Math.min(Math.abs(this.target - this.len), sp * dt);
    // hilt local -Y axis is the blade direction; emitter at local y = -L/2
    const dir = dirOverride ?? v3.norm([-hiltM[4], -hiltM[5], -hiltM[6]]);
    const base = dirOverride ? this.base : [hiltM[12] + hiltM[4] * (-hiltLen / 2), hiltM[13] + hiltM[5] * (-hiltLen / 2), hiltM[14] + hiltM[6] * (-hiltLen / 2)];
    this.base = base; this.dir = dir; this.tip = v3.addS(base, dir, this.maxLen * this.len);
    this.tick = (this.tick || 0) + 1;
    if (this.len > 0.05) { this.trail.push({ b: base.slice(), t: this.tip.slice(), age: 0 }); } 
    for (const s of this.trail) s.age += dt; while (this.trail.length && this.trail[0].age > 0.22) this.trail.shift();
  }
  draw(R, flicker = 1) {
    if (this.len < 0.02) return; const c = this.color; const a = this.base, b = this.tip; const f = flicker;
    // trail ribbon
    for (let i = 1; i < this.trail.length; i++) {
      const s0 = this.trail[i - 1], s1 = this.trail[i]; const k0 = Math.max(0, 1 - s0.age / 0.22), k1 = Math.max(0, 1 - s1.age / 0.22);
      if (v3.dist(s0.t, s1.t) < 0.02 && v3.dist(s0.b, s1.b) < 0.02) continue;
      const c0 = [c[0], c[1], c[2], 0.5 * k0 * k0 * this.trailOn], c1 = [c[0], c[1], c[2], 0.5 * k1 * k1 * this.trailOn];
      R._push(0, ...s0.b, 2, 0, ...c0); R._push(0, ...s0.t, 2, 0, ...c0); R._push(0, ...s1.t, 2, 0, ...c1); R._push(0, ...s0.b, 2, 0, ...c0); R._push(0, ...s1.t, 2, 0, ...c1); R._push(0, ...s1.b, 2, 0, ...c1);
    }
    R.beam(a, b, 0.10 * f, [c[0], c[1], c[2], 0.30], [c[0], c[1], c[2], 0.30]);
    R.beam(a, b, 0.055 * f, [c[0], c[1], c[2], 0.75], [c[0], c[1], c[2], 0.75]);
    R.beam(a, b, 0.024, [c[0] * 0.5 + 0.5, c[1] * 0.5 + 0.5, c[2] * 0.5 + 0.5, 1], [c[0] * 0.5 + 0.5, c[1] * 0.5 + 0.5, c[2] * 0.5 + 0.5, 1]);
    R.billboard(b, 0.07, [c[0], c[1], c[2], 0.65]); R.billboard(a, 0.06, [c[0], c[1], c[2], 0.6]);
  }
}
