// Navigation grid for authored levels: walkable cells are sampled from the real collision (floors, walls, solids),
// connected when the height step is small enough to walk; doors block their cells while closed.
// A* (octile, binary heap) + line-of-walk smoothing. Pure maths: unit tests build it headless.

const SQRT2 = Math.SQRT2;
const MAX_STEP = 0.6;        // height difference two neighbouring cells may have and still be walkable
const AGENT_R = 0.42;        // same radius Fighter uses
const PASS_R = 0.36;         // clearance a straight walk keeps from solid boxes

export class NavGrid {
  constructor(space, bounds, step = 1, probe = 3.2) {
    this.space = space; this.step = step;
    const [x0, z0, x1, z1] = bounds; this.x0 = x0; this.z0 = z0;
    this.w = Math.max(1, Math.round((x1 - x0) / step)); this.h = Math.max(1, Math.round((z1 - z0) / step));
    const N = this.w * this.h; this.y = new Float32Array(N).fill(NaN); this.door = new Array(N).fill(null);
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) {
      const x = this.cx(i), z = this.cz(j);
      const y = space.floorAt(x, z, probe); if (y === null) continue;
      if (space.insideSolid(x, y + 0.9, z, 0.2)) continue;
      const p = [x, y, z]; space.collision.collide(p, AGENT_R); if (Math.hypot(p[0] - x, p[2] - z) > 0.08) continue;
      this.y[j * this.w + i] = y;
    }
    for (const d of space.doors.values()) { // cells in (or right next to) a doorway follow the door state
      for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) {
        const x = this.cx(i), z = this.cz(j);
        if (x > d.min[0] - 0.5 && x < d.max[0] + 0.5 && z > d.min[2] - 0.5 && z < d.max[2] + 0.5) { const k = j * this.w + i; if (Number.isNaN(this.y[k])) this.y[k] = d.min[1]; this.door[k] = d.id; }
      }
    }
    this.g = new Float32Array(N); this.f = new Float32Array(N); this.from = new Int32Array(N); this.seen = new Uint32Array(N); this.closed = new Uint32Array(N); this.stamp = 0;
    this.heap = new Int32Array(N + 1);
  }
  cx(i) { return this.x0 + (i + 0.5) * this.step; }
  cz(j) { return this.z0 + (j + 0.5) * this.step; }
  cell(x, z) { const i = Math.floor((x - this.x0) / this.step), j = Math.floor((z - this.z0) / this.step); if (i < 0 || j < 0 || i >= this.w || j >= this.h) return -1; return j * this.w + i; }
  open(k) { if (k < 0 || Number.isNaN(this.y[k])) return false; const d = this.door[k]; return !d || this.space.doorOpen(d); }
  walkable(x, z) { return this.open(this.cell(x, z)); }
  // nearest open cell to a point, preferring cells at a similar height
  nearest(p, maxR = 4) {
    const k0 = this.cell(p[0], p[2]); if (this.open(k0) && Math.abs(this.y[k0] - p[1]) < 1.3) return k0;
    const i0 = Math.floor((p[0] - this.x0) / this.step), j0 = Math.floor((p[2] - this.z0) / this.step); let best = -1, bd = 1e9;
    const R = Math.ceil(maxR / this.step);
    for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
      const i = i0 + di, j = j0 + dj; if (i < 0 || j < 0 || i >= this.w || j >= this.h) continue; const k = j * this.w + i; if (!this.open(k)) continue;
      const d = Math.hypot(this.cx(i) - p[0], this.cz(j) - p[2]) + Math.abs(this.y[k] - p[1]) * 2; if (d < bd) { bd = d; best = k; }
    }
    return best;
  }
  point(k) { const i = k % this.w, j = (k - i) / this.w; return [this.cx(i), this.y[k], this.cz(j)]; }
  // A* between two world points; returns a smoothed list of waypoints (excluding the start) or null
  findPath(a, b, maxIter = 9000) {
    const s = this.nearest(a), t = this.nearest(b); if (s < 0 || t < 0) return null; if (s === t) return [b.slice()];
    const W = this.w, st = ++this.stamp, G = this.g, F = this.f, from = this.from, seen = this.seen, closed = this.closed, heap = this.heap; let n = 0;
    const ti = t % W, tj = (t - ti) / W;
    const hfn = k => { const i = k % W, j = (k - i) / W, dx = Math.abs(i - ti), dz = Math.abs(j - tj); return (dx + dz + (SQRT2 - 2) * Math.min(dx, dz)) * this.step; };
    const push = k => { let c = ++n; heap[c] = k; while (c > 1) { const p = c >> 1; if (F[heap[p]] <= F[heap[c]]) break; const x = heap[p]; heap[p] = heap[c]; heap[c] = x; c = p; } };
    const pop = () => { const top = heap[1]; heap[1] = heap[n--]; let c = 1; for (;;) { const l = c * 2, r = l + 1; let m = c; if (l <= n && F[heap[l]] < F[heap[m]]) m = l; if (r <= n && F[heap[r]] < F[heap[m]]) m = r; if (m === c) break; const x = heap[m]; heap[m] = heap[c]; heap[c] = x; c = m; } return top; };
    G[s] = 0; F[s] = hfn(s); seen[s] = st; from[s] = -1; push(s); let it = 0, found = false;
    while (n > 0 && it++ < maxIter) {
      const k = pop(); if (closed[k] === st) continue; closed[k] = st; if (k === t) { found = true; break; }
      const i = k % W, j = (k - i) / W, yk = this.y[k];
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= W || nj >= this.h) continue;
        const nk = nj * W + ni; if (closed[nk] === st || !this.open(nk) || Math.abs(this.y[nk] - yk) > MAX_STEP) continue;
        if (di && dj && (!this.open(j * W + ni) || !this.open(nj * W + i) || this.space.insideSolid(this.cx(i) + di * this.step / 2, yk + 0.9, this.cz(j) + dj * this.step / 2, PASS_R))) continue; // no corner cutting, not through thin posts
        const g = G[k] + (di && dj ? SQRT2 : 1) * this.step + Math.abs(this.y[nk] - yk) * 0.5;
        if (seen[nk] !== st || g < G[nk]) { seen[nk] = st; G[nk] = g; F[nk] = g + hfn(nk); from[nk] = k; push(nk); }
      }
    }
    if (!found) return null;
    const cells = []; for (let k = t; k !== -1; k = from[k]) cells.push(k); cells.reverse();
    const pts = cells.map(k => this.point(k)); pts[pts.length - 1] = [b[0], pts[pts.length - 1][1], b[2]];
    return this.smooth([a[0], this.y[s], a[2]], pts);
  }
  // can an agent walk straight from a to b (sampled every 0.35 m: open cells, small height changes)?
  walkLine(a, b) {
    const d = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(1, Math.ceil(d / 0.35)); let prevY = null;
    for (let s = 0; s <= n; s++) {
      const x = a[0] + (b[0] - a[0]) * s / n, z = a[2] + (b[2] - a[2]) * s / n, k = this.cell(x, z); if (!this.open(k)) return false;
      const y = this.y[k]; if (prevY !== null && Math.abs(y - prevY) > MAX_STEP) return false; prevY = y;
      if (this.space.insideSolid(x, y + 0.9, z, PASS_R)) return false; // posts and pillars thinner than a cell
      // stay off walls: the four neighbours at half a cell must be open too
      for (const [ox, oz] of [[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]]) if (!this.open(this.cell(x + ox, z + oz))) return false;
    }
    return true;
  }
  smooth(start, pts) {
    const out = []; let cur = start, i = 0;
    while (i < pts.length) {
      let j = pts.length - 1; while (j > i && !this.walkLine(cur, pts[j])) j--;
      out.push(pts[j]); cur = pts[j]; i = j + 1;
    }
    return out;
  }
  // random open point within r of p that is reachable on the same height layer (for search / repositioning)
  randomNear(p, r, rng = Math.random) {
    for (let n = 0; n < 24; n++) { const a = rng() * Math.PI * 2, d = rng() * r, x = p[0] + Math.cos(a) * d, z = p[2] + Math.sin(a) * d, k = this.cell(x, z); if (this.open(k) && Math.abs(this.y[k] - p[1]) < 0.7) return [x, this.y[k], z]; }
    return null;
  }
}

// Path following for a Fighter: keeps a path to a goal, replans when the goal moves or time runs out.
export class PathFollower {
  constructor() { this.path = null; this.i = 0; this.goal = null; this.replanT = 0; this.stuckT = 0; this.lastPos = null; }
  clear() { this.path = null; this.goal = null; }
  // returns a unit world direction [x, 0, z] to walk, or null when arrived / no route
  dir(nav, f, goal, dt, arrive = 0.7) {
    this.replanT -= dt;
    const moved = !this.goal || Math.hypot(goal[0] - this.goal[0], goal[2] - this.goal[2]) > 1.5;
    if (!this.path || moved || this.replanT <= 0) { this.goal = goal.slice(); this.path = nav.findPath(f.pos, goal); this.i = 0; this.replanT = 0.9 + Math.random() * 0.4; }
    if (!this.path) return null;
    if (Math.hypot(goal[0] - f.pos[0], goal[2] - f.pos[2]) < arrive) return null;
    while (this.i < this.path.length) { const w = this.path[this.i], d = Math.hypot(w[0] - f.pos[0], w[2] - f.pos[2]); if (d > (this.i === this.path.length - 1 ? arrive : 0.55)) break; this.i++; }
    if (this.i >= this.path.length) return null;
    // stuck detection: barely moving while trying -> force a replan
    if (this.lastPos) { const m = Math.hypot(f.pos[0] - this.lastPos[0], f.pos[2] - this.lastPos[2]); this.stuckT = m < 0.4 * dt ? this.stuckT + dt : 0; if (this.stuckT > 0.8) { this.stuckT = 0; this.replanT = 0; } }
    this.lastPos = f.pos.slice();
    const w = this.path[this.i], dx = w[0] - f.pos[0], dz = w[2] - f.pos[2], l = Math.hypot(dx, dz) || 1;
    return [dx / l, 0, dz / l];
  }
}
