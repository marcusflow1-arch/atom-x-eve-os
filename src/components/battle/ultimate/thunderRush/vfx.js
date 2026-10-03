// Procedural lightning and impact effects, emitted as a flat triangle stream
// (position, uv, rgba, shape) that both renderers draw with fxFragment.
// Everything is a pure function of time and a seed, so a given frame always
// renders the same way (the preview video and the game match).

import { clamp, rng, v3 } from './math.js';

export const FX_STRIDE = 10;

export const SHAPE = { glow: 0, ribbon: 1, ring: 2, sparkle: 3, puff: 4, streak: 5, shadow: 6 };

export const COLORS = {
  core: [0.93, 0.98, 1.0],
  bolt: [0.45, 0.78, 1.0],
  haze: [0.16, 0.38, 1.0],
  deep: [0.1, 0.18, 0.85],
  spark: [0.75, 0.92, 1.0],
  star: [1.0, 0.93, 0.45],
  dust: [0.62, 0.6, 0.55],
  smoke: [0.55, 0.62, 0.75],
};

export class FxBuffer {
  constructor(maxVertices = 60000) {
    this.data = new Float32Array(maxVertices * FX_STRIDE);
    this.max = maxVertices;
    this.count = 0;
  }

  reset() { this.count = 0; }

  vertex(p, u, v, c, a, shape) {
    if (this.count >= this.max) return;
    const o = this.count * FX_STRIDE;
    const d = this.data;
    d[o] = p[0]; d[o + 1] = p[1]; d[o + 2] = p[2];
    d[o + 3] = u; d[o + 4] = v;
    d[o + 5] = c[0]; d[o + 6] = c[1]; d[o + 7] = c[2]; d[o + 8] = a;
    d[o + 9] = shape;
    this.count += 1;
  }

  // p0..p3 counter-clockwise; uv (0,0) (1,0) (1,1) (0,1).
  quad(p0, p1, p2, p3, c, a, shape, uv = [0, 0, 1, 1]) {
    if (a <= 0.002 || this.count + 6 > this.max) return;
    const [u0, v0, u1, v1] = uv;
    this.vertex(p0, u0, v0, c, a, shape); this.vertex(p1, u1, v0, c, a, shape); this.vertex(p2, u1, v1, c, a, shape);
    this.vertex(p0, u0, v0, c, a, shape); this.vertex(p2, u1, v1, c, a, shape); this.vertex(p3, u0, v1, c, a, shape);
  }
}

// Camera-aware emitter used by the director each frame.
export class FxPainter {
  constructor(camera) {
    this.additive = new FxBuffer(90000);
    this.alpha = new FxBuffer(20000);
    this.setCamera(camera);
  }

  setCamera(camera) {
    this.eye = camera.position;
    const fwd = v3.norm(v3.sub(camera.target, camera.position));
    this.right = v3.norm(v3.cross(fwd, [0, 1, 0]));
    this.up = v3.cross(this.right, fwd);
    this.fwd = fwd;
    this.pixel = Math.tan(((camera.fov || 40) * Math.PI) / 360) * 2 / 720;
  }

  reset() { this.additive.reset(); this.alpha.reset(); }

  // World-space width that is never thinner than ~px pixels on screen.
  minWidth(p, width, px = 1.6) {
    const dist = Math.max(0.3, v3.dot(v3.sub(p, this.eye), this.fwd));
    return Math.max(width, dist * this.pixel * px);
  }

  billboard(buffer, center, size, color, alpha, shape, angle = 0, stretch = 1) {
    // Sprites that would swallow the lens fade out instead of whiting the frame.
    const d = v3.dist(center, this.eye);
    alpha *= clamp((d - size * 0.6) / (size * 1.2 + 0.2));
    if (alpha <= 0.002) return;
    const c = Math.cos(angle), s = Math.sin(angle);
    const rx = v3.add(v3.scale(this.right, c * size * stretch), v3.scale(this.up, s * size * stretch));
    const ry = v3.add(v3.scale(this.right, -s * size), v3.scale(this.up, c * size));
    buffer.quad(
      v3.sub(v3.sub(center, rx), ry), v3.sub(v3.add(center, rx), ry),
      v3.add(v3.add(center, rx), ry), v3.add(v3.sub(center, rx), ry),
      color, alpha, shape,
    );
  }

  glow(center, size, color, alpha) { this.billboard(this.additive, center, size, color, alpha, SHAPE.glow); }

  sparkle(center, size, color, alpha, angle = 0) { this.billboard(this.additive, center, size, color, alpha, SHAPE.sparkle, angle); }

  puff(center, size, color, alpha, angle = 0) { this.billboard(this.alpha, center, size, color, alpha, SHAPE.puff, angle); }

  // Flat quad lying on the ground (y) or on a plane with the given normal.
  plane(buffer, center, size, normal, color, alpha, shape, angle = 0) {
    const n = v3.norm(normal);
    let a = v3.norm(v3.cross(n, Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]));
    let b = v3.cross(n, a);
    const c = Math.cos(angle), s = Math.sin(angle);
    const a2 = v3.add(v3.scale(a, c), v3.scale(b, s));
    b = v3.add(v3.scale(a, -s), v3.scale(b, c));
    a = a2;
    const ax = v3.scale(a, size), bx = v3.scale(b, size);
    buffer.quad(
      v3.sub(v3.sub(center, ax), bx), v3.sub(v3.add(center, ax), bx),
      v3.add(v3.add(center, ax), bx), v3.add(v3.sub(center, ax), bx),
      color, alpha, shape,
    );
  }

  // Camera-facing ribbon through points with per-point widths and alphas.
  ribbon(buffer, points, widths, color, alphas, shape = SHAPE.ribbon) {
    const n = points.length;
    if (n < 2) return;
    let prevL = null, prevR = null;
    for (let i = 0; i < n; i += 1) {
      const p = points[i];
      const t = v3.sub(points[Math.min(n - 1, i + 1)], points[Math.max(0, i - 1)]);
      const toEye = v3.sub(this.eye, p);
      let side = v3.cross(t, toEye);
      side = v3.len(side) < 1e-8 ? this.right : v3.norm(side);
      const w = (Array.isArray(widths) ? widths[i] : widths) * 0.5;
      const L = v3.addScaled(p, side, w), R = v3.addScaled(p, side, -w);
      if (prevL) {
        const a0 = Array.isArray(alphas) ? alphas[i - 1] : alphas;
        const a1 = Array.isArray(alphas) ? alphas[i] : alphas;
        const u0 = (i - 1) / (n - 1), u1 = i / (n - 1);
        const alpha = (a0 + a1) / 2;
        if (alpha > 0.002 && buffer.count + 6 <= buffer.max) {
          buffer.vertex(prevR, u0, 0, color, a0, shape); buffer.vertex(R, u1, 0, color, a1, shape); buffer.vertex(L, u1, 1, color, a1, shape);
          buffer.vertex(prevR, u0, 0, color, a0, shape); buffer.vertex(L, u1, 1, color, a1, shape); buffer.vertex(prevL, u0, 1, color, a0, shape);
        }
      }
      prevL = L; prevR = R;
    }
  }

  // Spark streak from tail to head.
  streak(tail, head, width, color, alpha) {
    const w = this.minWidth(head, width, 1.2);
    this.ribbon(this.additive, [tail, head], [w * 0.4, w], color, [alpha * 0.2, alpha], SHAPE.streak);
  }

  // Three-layer lightning bolt: wide haze, blue glow, white-hot core.
  bolt(points, width, intensity = 1, colors = COLORS) {
    if (points.length < 2 || intensity <= 0.01) return;
    const mid = points[(points.length / 2) | 0];
    const core = this.minWidth(mid, width, 1.4);
    const n = points.length;
    const taper = points.map((_, i) => { const x = i / (n - 1); return 0.35 + 0.65 * Math.sin(Math.PI * clamp(x * 0.9 + 0.1)); });
    this.ribbon(this.additive, points, taper.map((k) => core * 14 * k), colors.haze, 0.1 * intensity);
    this.ribbon(this.additive, points, taper.map((k) => core * 5 * k), colors.bolt, 0.45 * intensity);
    this.ribbon(this.additive, points, taper.map((k) => core * 1.6 * k), colors.core, Math.min(1, 1.1 * intensity));
  }
}

// Jagged path from a to b by midpoint displacement.
export function boltPath(a, b, rand, { detail = 5, jag = 0.22, bias = null } = {}) {
  let pts = [a, b];
  const axis = v3.norm(v3.sub(b, a));
  const u = v3.anyPerp(axis);
  const w = v3.cross(axis, u);
  let amp = v3.dist(a, b) * jag;
  for (let level = 0; level < detail; level += 1) {
    const next = [pts[0]];
    for (let i = 1; i < pts.length; i += 1) {
      const p = pts[i - 1], q2 = pts[i];
      const m = v3.lerp(p, q2, 0.4 + rand() * 0.2);
      const ang = rand() * Math.PI * 2;
      const off = (rand() - 0.5) * 2 * amp;
      let disp = v3.add(v3.scale(u, Math.cos(ang) * off), v3.scale(w, Math.sin(ang) * off));
      if (bias) disp = v3.add(disp, v3.scale(bias, amp * 0.5 * rand()));
      next.push(v3.add(m, disp), q2);
    }
    pts = next;
    amp *= 0.52;
  }
  return pts;
}

// A bolt that wanders from a start point in a direction and may fork.
export function crackle(painter, from, dir, length, seed, { width = 0.006, intensity = 1, forks = 2, jag = 0.28, detail = 4 } = {}) {
  const rand = rng(seed);
  const end = v3.addScaled(from, v3.norm(dir), length);
  const main = boltPath(from, end, rand, { detail, jag });
  painter.bolt(main, width, intensity);
  for (let f = 0; f < forks; f += 1) {
    if (rand() > 0.7) continue;
    const at = main[1 + Math.floor(rand() * (main.length - 2))];
    const fdir = v3.norm(v3.add(v3.norm(dir), [(rand() - 0.5) * 1.8, (rand() - 0.5) * 1.8, (rand() - 0.5) * 1.8]));
    const fend = v3.addScaled(at, fdir, length * (0.25 + rand() * 0.35));
    painter.bolt(boltPath(at, fend, rand, { detail: detail - 1, jag }), width * 0.7, intensity * 0.8);
  }
  return main;
}

export function randomDir(rand, bias = null, spread = 1) {
  let d = [rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1];
  while (v3.len(d) < 0.2) d = [rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1];
  d = v3.norm(d);
  if (bias) d = v3.norm(v3.add(v3.scale(d, spread), bias));
  return d;
}
