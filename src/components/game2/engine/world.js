/* eslint-disable */
// Arena: pillars, braziers, physics props (crates / barrels) for the force powers to play with.
// Three sources of geometry: the procedural explorer arena, an imported Raven BSP (duel) or an authored mission
// level (level/builder.js) with its own collision space, navigation grid, doors and lamps.
import { geo } from './gl.js';
import { m4, q as Q, clamp } from './math.js';
import { BSPCollision } from './rbsp.js';
import { LevelSpace } from './level/space.js';
import { NavGrid } from './level/nav.js';

export const ARENA_R = 23.5;
export class World {
  constructor(R, map = null, level = null) {
    this.R = R; this.pillars = []; this.bodies = []; this.time = 0; this.braziers = []; this.lamps = [];
    this.map = map;
    if (level) { this.initLevel(R, level); return; }
    if (map) {
      this.mapCollision = new BSPCollision(map);
      this.spawns = this.mapCollision.chooseSpawns();
      this.mapMeshes = map.texturedMeshes.map(({shader,mesh}) => ({
        shader, mesh: R.uploadStatic(mesh),
        tex: map.textureBitmaps?.has(shader) && R.uploadTexture ? R.uploadTexture(map.textureBitmaps.get(shader)) : null,
      }));
      for (const bitmap of map.textureBitmaps?.values() || []) bitmap.close?.();
      return; // The actual imported level replaces the procedural circle completely.
    }
    const stone = [0.30, 0.28, 0.33, 1], dark = [0.16, 0.15, 0.19, 1], metal = [0.35, 0.37, 0.42, 1];
    const g = geo();
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.15, x = Math.cos(a) * 21, z = Math.sin(a) * 21; this.pillars.push({ x, z, r: 0.95 });
      g.box(x, 0.25, z, 2.6, 0.5, 2.6, dark).cyl(x, 0.5, z, 0.95, 7.5, stone, 24).box(x, 8.15, z, 2.3, 0.35, 2.3, dark).box(x, 8.5, z, 1.9, 0.3, 1.9, stone); }
    // low rim wall
    for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, x = Math.cos(a) * 24.6, z = Math.sin(a) * 24.6; g.box(x, 0.35, z, 1.6, 0.7, 1.0, [0.2, 0.19, 0.24, 1]); }
    // central dais ring
    g.cyl(0, 0, 0, 5.6, 0.12, [0.16, 0.18, 0.24, 1], 40).cyl(0, 0.12, 0, 5.2, 0.04, [0.22, 0.30, 0.42, 1], 40);
    // braziers
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4, x = Math.cos(a) * 13, z = Math.sin(a) * 13; this.braziers.push([x, 1.45, z]); this.pillars.push({ x, z, r: 0.45 });
      g.cyl(x, 0, z, 0.35, 1.1, metal, 14).cyl(x, 1.1, z, 0.6, 0.25, [0.25, 0.25, 0.3, 1], 14); }
    this.staticMesh = R.uploadStatic(g.build());
    this.ground = R.uploadStatic(geo().plane(0, 0, 0, 160, 160, [0.2, 0.2, 0.25, 1]).build());
    this.uploadPropMeshes(R);
    const spots = [[4, 3, 'crate'], [-3.5, 4.5, 'crate'], [6, -3, 'barrel'], [-6, -2.5, 'barrel'], [2, -6.5, 'crate'], [-1.5, 8, 'barrel'], [8.5, 5, 'crate'], [-9, 4, 'crate']];
    spots.forEach(([x, z, k], i) => this.bodies.push(this.makeBody(k, x, z, i)));
  }
  uploadPropMeshes(R) {
    const crate = geo(); const w = [0.50, 0.36, 0.22, 1], w2 = [0.32, 0.22, 0.13, 1];
    crate.box(0, 0.5, 0, 1, 1, 1, w).box(0, 0.5, 0, 1.03, 0.1, 1.03, w2).box(0, 0.12, 0, 1.03, 0.1, 1.03, w2).box(0, 0.88, 0, 1.03, 0.1, 1.03, w2);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) crate.box(sx * 0.46, 0.5, sz * 0.46, 0.1, 1.03, 0.1, w2);
    this.crateMesh = R.uploadStatic(crate.build());
    const barrel = geo(); barrel.cyl(0, 0, 0, 0.42, 1.0, [0.22, 0.34, 0.42, 1], 20).cyl(0, 0.15, 0, 0.445, 0.07, [0.45, 0.47, 0.5, 1], 20).cyl(0, 0.78, 0, 0.445, 0.07, [0.45, 0.47, 0.5, 1], 20);
    this.barrelMesh = R.uploadStatic(barrel.build());
  }
  // ---------- authored mission level
  initLevel(R, level) {
    this.level = level; this.space = new LevelSpace(level); this.nav = new NavGrid(this.space, level.navBounds, 1);
    this.levelMeshes = { base: R.uploadStatic(level.render.base), glows: level.render.glows.map(g => ({ emis: g.glow.map(k => k * 0.75), mesh: R.uploadStatic(g.mesh) })) };
    this.doorMeshes = level.doorMeshes.map(d => ({ id: d.id, origin: d.origin, mesh: R.uploadStatic(d.mesh) }));
    this.lamps = level.lamps.map(l => l.p);
    this.uploadPropMeshes(R);
    level.props.forEach((p, i) => { const b = this.makeBody(p.kind, p.x, p.z, i); b.pos[1] = b.home[1] = this.floorAt(p.x, p.z, 3) ?? 0; this.bodies.push(b); });
    if (level.env) Object.assign(R.env, level.env);
  }
  resetProps() { for (const w of this.bodies) { w.pos = w.home.slice(); w.vel = [0, 0, 0]; w.w = [0, 0, 0]; w.grounded = true; w.lifted = 0; w.rot = [0, Math.random() * 6, 0]; w.hp = 100; } }
  lineOfSight(a, b) { return this.space ? this.space.lineOfSight(a, b) : true; }
  // does a blaster bolt moving a -> b leave the play space? (level geometry, or the old arena radius)
  boltBlocked(a, b) { return this.space ? this.space.raycast(a, b) !== null : Math.hypot(b[0], b[2]) > 24.2; }
  cameraClip(target, eye) { return this.space ? this.space.cameraClip(target, eye) : eye; }
  makeBody(kind, x, z, id) {
    const crate = kind === 'crate'; const h = 1.0;
    return { kind, id, home: [x, 0, z], pos: [x, 0, z], vel: [0, 0, 0], r: crate ? 0.62 : 0.45, h, rot: [0, Math.random() * 6, 0], w: [0, 0, 0], grounded: true, lifted: 0, flash: 0, hp: 100, mass: crate ? 1.3 : 1, center: 0.5, glow: 0 };
  }
  floorAt(x, z, ceiling = Infinity) { if (this.space) return this.space.floorAt(x, z, ceiling); return this.mapCollision ? this.mapCollision.floorAt(x, z, ceiling) : 0; }
  collide(pos, r) { // actual BSP wall triangles when a map is loaded; old arena otherwise
    if (this.space) return this.space.collide(pos, r);
    if (this.mapCollision) return this.mapCollision.collide(pos, r);
    for (const p of this.pillars) { const dx = pos[0] - p.x, dz = pos[2] - p.z, d = Math.hypot(dx, dz), m = p.r + r; if (d < m && d > 1e-4) { pos[0] = p.x + dx / d * m; pos[2] = p.z + dz / d * m; } }
    const d = Math.hypot(pos[0], pos[2]), m = ARENA_R - r; if (d > m) { pos[0] *= m / d; pos[2] *= m / d; }
  }
  impulse(b, v) { b.vel[0] += v[0] / b.mass; b.vel[1] += v[1] / b.mass; b.vel[2] += v[2] / b.mass; b.grounded = false; b.w = [(Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 8]; }
  update(dt) {
    this.time += dt;
    if (this.space) this.space.update(dt);
    if (this.mapCollision) return;
    for (const b of this.bodies) {
      b.flash = Math.max(0, b.flash - dt * 3); b.glow = Math.max(0, b.glow - dt * 2);
      if (b.lifted > 0) { b.vel[0] *= 0.9; b.vel[2] *= 0.9; b.vel[1] *= 0.9; b.rot[1] += dt * 1.6; b.rot[0] = Math.sin(this.time * 2 + b.id) * 0.25; b.rot[2] = Math.cos(this.time * 1.7 + b.id) * 0.25; b.pos[0] += b.vel[0] * dt; b.pos[1] += b.vel[1] * dt; b.pos[2] += b.vel[2] * dt; b.lifted -= dt; continue; }
      b.vel[1] -= 20 * dt; b.pos[0] += b.vel[0] * dt; b.pos[1] += b.vel[1] * dt; b.pos[2] += b.vel[2] * dt;
      const fl = this.space ? (this.space.floorAt(b.pos[0], b.pos[2], b.pos[1] + 0.6) ?? 0) : 0;
      if (b.pos[1] <= fl) { b.pos[1] = fl; if (b.vel[1] < -2) { b.vel[1] *= -0.28; b.vel[0] *= 0.82; b.vel[2] *= 0.82; this.onThud && this.onThud(b); } else { b.vel[1] = 0; b.grounded = true; } }
      if (b.grounded) { const f = Math.max(0, 1 - 5 * dt); b.vel[0] *= f; b.vel[2] *= f; for (let k = 0; k < 3; k++) { b.w[k] *= Math.max(0, 1 - 6 * dt); } b.rot[0] *= Math.max(0, 1 - 8 * dt); b.rot[2] *= Math.max(0, 1 - 8 * dt); }
      for (let k = 0; k < 3; k++) b.rot[k] += b.w[k] * dt;
      const before = [b.pos[0], b.pos[2]]; this.collide(b.pos, b.r); if (b.pos[0] !== before[0] || b.pos[2] !== before[1]) { b.vel[0] *= -0.35; b.vel[2] *= -0.35; }
    }
    for (let i = 0; i < this.bodies.length; i++) for (let j = i + 1; j < this.bodies.length; j++) {
      const a = this.bodies[i], c = this.bodies[j]; if (Math.abs(a.pos[1] - c.pos[1]) > 1) continue; const dx = c.pos[0] - a.pos[0], dz = c.pos[2] - a.pos[2], d = Math.hypot(dx, dz), m = a.r + c.r;
      if (d < m && d > 1e-4) { const nx = dx / d, nz = dz / d, push = (m - d) / 2; a.pos[0] -= nx * push; a.pos[2] -= nz * push; c.pos[0] += nx * push; c.pos[2] += nz * push; const rv = (c.vel[0] - a.vel[0]) * nx + (c.vel[2] - a.vel[2]) * nz; if (rv < 0) { const j2 = -rv * 0.6; a.vel[0] -= nx * j2; a.vel[2] -= nz * j2; c.vel[0] += nx * j2; c.vel[2] += nz * j2; } }
    }
  }
  draw() {
    const R = this.R;
    if (this.levelMeshes) {
      const I = m4.ident(); R.drawMesh(this.levelMeshes.base, I, { spec: 0.12 });
      for (const g of this.levelMeshes.glows) R.drawMesh(g.mesh, I, { spec: 0, emis: g.emis });
      for (const d of this.doorMeshes) { const D = this.space.doors.get(d.id), h = D.max[1] - D.min[1], M = m4.ident(); M[12] = d.origin[0]; M[13] = d.origin[1] + D.lift * h * 0.96; M[14] = d.origin[2]; R.drawMesh(d.mesh, M, { spec: 0.35 }); }
      this.drawBodies(R); return;
    }
    if (this.mapMeshes) {
      const identity = m4.ident();
      for (const part of this.mapMeshes) R.drawMesh(part.mesh, identity, { spec: 0.08, tex: part.tex });
      return;
    }
    R.drawMesh(this.ground, m4.ident(), { ground: true }); R.drawMesh(this.staticMesh, m4.ident(), { spec: 0.1 });
    this.drawBodies(R);
  }
  drawBodies(R) {
    for (const b of this.bodies) {
      const m = new Float32Array(16); const qy = Q.axisAngle([0, 1, 0], b.rot[1]), qx = Q.axisAngle([1, 0, 0], b.rot[0]), qz = Q.axisAngle([0, 0, 1], b.rot[2]);
      // rotate about the prop centre: translate(pos+centre) * rot * translate(-centre)
      const rq = Q.mul(Q.mul(qy, qx), qz); const t = [b.pos[0], b.pos[1] + b.center, b.pos[2]]; m4.trs(t, rq, [1, 1, 1], m);
      const off = m4.ident(); off[13] = -b.center; const mm = m4.mul(m, off);
      R.drawMesh(b.kind === 'crate' ? this.crateMesh : this.barrelMesh, mm, { spec: 0.15, emis: [b.flash * 0.3 + b.glow * 0.3, b.flash * 0.45 + b.glow * 0.22, b.flash * 0.9 + b.glow * 0.6] });
    }
  }
}
