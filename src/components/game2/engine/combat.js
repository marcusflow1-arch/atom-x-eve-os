/* eslint-disable */
// Combat resolution: blade-vs-blade clashes, blade-vs-body hits, thrown saber, blaster bolts (and saber reflection),
// the floating practice remote, and flung props hitting people.
import { v3, clamp, lerp } from './math.js';
import { geo } from './gl.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const BLOCKS = ['block1', 'block2', 'block3', 'block4', 'block5', 'block6', 'block7', 'block8', 'block9'];
const BOUNCES = ['bounce1', 'bounce2', 'bounce3'];

export function segSeg(p1, q1, p2, q2) { // closest points between two segments
  const d1 = v3.sub(q1, p1), d2 = v3.sub(q2, p2), r = v3.sub(p1, p2);
  const a = v3.dot(d1, d1), e = v3.dot(d2, d2), f = v3.dot(d2, r); let s, t; const EPS = 1e-9;
  if (a <= EPS && e <= EPS) { s = t = 0; }
  else if (a <= EPS) { s = 0; t = clamp(f / e, 0, 1); }
  else {
    const c = v3.dot(d1, r);
    if (e <= EPS) { t = 0; s = clamp(-c / a, 0, 1); }
    else {
      const b = v3.dot(d1, d2), den = a * e - b * b;
      s = den > EPS ? clamp((b * f - c * e) / den, 0, 1) : 0; t = (b * s + f) / e;
      if (t < 0) { t = 0; s = clamp(-c / a, 0, 1); } else if (t > 1) { t = 1; s = clamp((b - c) / a, 0, 1); }
    }
  }
  const c1 = v3.addS(p1, d1, s), c2 = v3.addS(p2, d2, t); return { d: v3.dist(c1, c2), a: c1, b: c2, s, t };
}
// Continuous contact along the moving blade AND the moving target. Subframe sampling
// stops a fast strafe, crouch or jump from passing between three discrete hit tests.
// Both combat and visual effects use exactly the same weapon base/tip.
export function sweptBladeContact(fromBlade, toBlade, fromBody, toBody, extraRadius = 0.04) {
  if (!toBlade || !toBody) return null;
  const beforeBlade = fromBlade || toBlade;
  const beforeBody = fromBody && v3.dist(fromBody.a, toBody.a) < 3.5 ? fromBody : toBody;
  const movement = Math.max(
    v3.dist(beforeBlade[0], toBlade[0]), v3.dist(beforeBlade[1], toBlade[1]),
    v3.dist(beforeBody.a, toBody.a), v3.dist(beforeBody.b, toBody.b),
  );
  const steps = Math.min(24, Math.max(4, Math.ceil(movement / 0.13)));
  for (let j = 0; j <= steps; j++) {
    const t = j / steps;
    const base = v3.lerp(beforeBlade[0], toBlade[0], t);
    const tip = v3.lerp(beforeBlade[1], toBlade[1], t);
    const ca = v3.lerp(beforeBody.a, toBody.a, t);
    const cb = v3.lerp(beforeBody.b, toBody.b, t);
    const contact = segSeg(base, tip, ca, cb);
    if (contact.d <= toBody.r + extraRadius) return contact;
  }
  return null;
}
export const hostile = (a, b) => (a.team === 'player' && b.team === 'enemy') || (a.team === 'enemy' && b.team === 'player');

export class Combat {
  constructor(g) {
    this.g = g; this.bolts = []; this.pair = new Map(); this.remote = null; this.kills = 0; this.reflected = 0;
    const m = geo(); m.sphere(0, 0, 0, 0.27, [0.30, 0.31, 0.36, 1], 18).cyl(0, -0.02, 0, 0.30, 0.04, [0.18, 0.18, 0.22, 1], 18).sphere(0, 0, 0.22, 0.075, [0.9, 0.12, 0.08, 1], 8);
    this.remoteMesh = g.R.uploadStatic(m.build());
    if (g.mode === 'explorer') this.spawnRemote(); // the floating practice remote belongs to the free-roam explorer only
  }
  spawnRemote() { this.remote = { pos: [4, 2.4, 4], vel: [0, 0, 0], hp: 24, cool: 2.2, ang: Math.random() * 6, charge: 0, dead: false, respawn: 0, flash: 0, yaw: 0 }; }
  // ---------- geometry helpers
  capsule(f) {
    const p = f.pos;
    if (f.status === 'down' || f.status === 'dead' || f.status === 'getup') { const c = [p[0], p[1] + 0.35, p[2]]; return { a: c, b: c, r: 0.65 }; }
    if (f.status === 'flung') { const c = [p[0], p[1] + 0.8, p[2]]; return { a: c, b: c, r: 0.7 }; }
    return { a: [p[0], p[1] + 0.15, p[2]], b: [p[0], p[1] + (f.ducked ? 1.05 : 1.75), p[2]], r: 0.42 };
  }
  sideOf(T, pt, proj) { // parry direction relative to defender (JO blocked codes)
    const sy = Math.sin(T.yaw), cy = Math.cos(T.yaw); const dx = pt[0] - T.pos[0], dz = pt[2] - T.pos[2];
    const lat = dx * (-cy) + dz * sy; // + = defender's right
    const hh = pt[1] - T.pos[1]; const up = hh > (T.ducked ? 0.55 : 1.05);
    let s; if (up && Math.abs(lat) < 0.18) s = 'T'; else if (up) s = lat > 0 ? 'UR' : 'UL'; else s = lat > 0 ? 'LR' : 'LL';
    return proj ? s + '_P' : s;
  }
  canBlock(T, from) {
    if (!T.hasSaber || T.saber.holstered || T.status !== 'normal' || T.thrown || T.blade.len < 0.8) return false;
    const fwd = [Math.sin(T.yaw), Math.cos(T.yaw)]; const d = v3.norm([from[0] - T.pos[0], 0, from[2] - T.pos[2]]);
    return fwd[0] * d[0] + fwd[1] * d[2] > 0.25; // parry requires facing the attacking blade
  }
  blockProb(T) {
    const S = T.saber; let p;
    if (S.inParry(S.move) || S.inReflect(S.move)) p = 0.96; else if (S.isActiveSwing()) p = 0.3; else p = T.isPlayer ? 0.68 : (T.blockSkill ?? 0.5);
    if (T.isPlayer) p += S.level === 1 ? 0.15 : S.level === 3 ? -0.06 : 0;
    // Sprinting or rapidly strafing does not grant a stationary perfect parry.
    if (Math.hypot(T.vel?.[0] || 0, T.vel?.[2] || 0) > 2) p *= 0.45;
    return clamp(p, 0, 0.97);
  }
  bladeDamage(A) { const S = A.saber; let d = [0, 12, 18, 28][S.level]; if (S.inSpecial(S.move)) d *= 1.6; return d * A.damageMul * (A.isPlayer ? 1 : (A.dmgScale ?? 0.55)); }
  // ---------- per-step update
  step(dt) {
    const g = this.g; const F = [g.player, ...g.npcs];
    const caps = new Map(F.map(f => [f, this.capsule(f)]));
    for (const [k, v] of this.pair) { if (v - dt <= 0) this.pair.delete(k); else this.pair.set(k, v - dt); }
    // blade clashes + body hits
    for (const A of F) {
      const seg = A.bladeSeg(); const prev = A._prev; A._prev = seg ? [seg[0].slice(), seg[1].slice()] : null;
      if (!seg || A.status === 'dead') continue;
      if (A.hitMove !== A.saber.moveStart) { A.hitSet.clear(); A.hitMove = A.saber.moveStart; }
      const swing = A.swingActive() || (A.thrown && false);
      for (const B of F) {
        if (B === A || !hostile(A, B) || B.status === 'dead') continue;
        const bs = B.bladeSeg();
        if (bs && (swing || B.swingActive()) && A.status === 'normal') { // clash
          const key = A.name + '|' + B.name; const key2 = B.name + '|' + A.name;
          if (!this.pair.has(key) && !this.pair.has(key2)) {
            const r = segSeg(seg[0], seg[1], bs[0], bs[1]);
            if (r.d < 0.2) { this.pair.set(key, 0.32); this.clash(A, B, v3.lerp(r.a, r.b, 0.5), swing, B.swingActive()); }
          }
        }
        if (swing && !A.hitSet.has(B)) {
          const cap = caps.get(B);
          const hit = sweptBladeContact(prev, seg, B._prevCap, cap);
          if (hit) { A.hitSet.add(B); this.bladeHit(A, B, hit.a); }
        }
      }
      // remote droid
      const rm = this.remote;
      if (swing && rm && !rm.dead && !A.hitSet.has('remote') && A.team === 'player') { const r = segSeg(seg[0], seg[1], rm.pos, rm.pos); if (r.d < 0.42) { A.hitSet.add('remote'); this.hitRemote(40, rm.pos); } }
      // thrown saber
      if (A.thrown) {
        const T = A.thrown; for (const B of F) {
          if (B === A || !hostile(A, B) || B.status === 'dead' || (T.hit.get(B) || 0) > g.t) continue;
          const contact = sweptBladeContact([T.prevPos || T.pos, T.prevPos || T.pos], [T.pos, T.pos], B._prevCap, caps.get(B), 0.45);
          if (contact) {
            T.hit.set(B, g.t + 0.4); // spinning near a moving enemy continues to make contact while held
            this.damage(A, B, contact.a, 14 * A.damageMul, { spark: true });
          }
        }
        if (rm && !rm.dead && A.team === 'player' && segSeg(T.prevPos || T.pos, T.pos, rm.pos, rm.pos).d < 0.7) this.hitRemote(40, rm.pos);
      }
    }
    for (const f of F) { const cap = caps.get(f); f._prevCap = { a: cap.a.slice(), b: cap.b.slice(), r: cap.r }; }
    this.props(dt); this.updateBolts(dt); this.updateRemote(dt);
  }
  clash(A, B, pt, aSwing, bSwing) {
    const g = this.g; g.fx.sparks(pt, [0, 1, 0], 18, [1, 0.92, 0.6, 1]); g.sfxAt(BLOCKS[Math.floor(Math.random() * BLOCKS.length)], pt, 1); g.flashLight(pt, A.blade.color, 0.25);
    if (aSwing) A.saber.blocked = 'BOUNCE'; else A.saber.blocked = this.sideOf(A, pt);
    if (bSwing) B.saber.blocked = 'BOUNCE'; else if (B.canParry !== false) B.saber.blocked = this.sideOf(B, pt);
    if (A.isPlayer || B.isPlayer) g.shake(0.12);
    if (aSwing) A.hitSet.add(B);
  }
  bladeHit(A, B, pt) {
    const g = this.g;
    if (this.canBlock(B, A.pos) && Math.random() < this.blockProb(B)) { // blocked
      g.fx.sparks(pt, [0, 1, 0], 14, [1, 0.9, 0.55, 1]); g.sfxAt(BLOCKS[Math.floor(Math.random() * BLOCKS.length)], pt, 1); g.flashLight(pt, A.blade.color, 0.2);
      B.saber.blocked = B.saber.isActiveSwing() ? 'BOUNCE' : this.sideOf(B, pt); A.saber.blocked = 'BOUNCE'; if (A.isPlayer || B.isPlayer) g.shake(0.1); return;
    }
    this.damage(A, B, pt, this.bladeDamage(A), { spark: true, saber: true });
  }
  damage(A, B, pt, dmg, o = {}) {
    const g = this.g; if (B.isPlayer && g.force.active.protect) { g.sfxAt('protecthit', B.pos, 0.8); }
    const died = B.hurt(dmg, A); g.fx.sparks(pt, [0, 1, 0], 10, [1, 0.5, 0.2, 1]); g.sfxAt(['hit1', 'hit2', 'hit3'][Math.floor(Math.random() * 3)], pt, 0.9);
    if (o.saber && A.saber.level === 3 && !died && Math.random() < 0.35 && B.status === 'normal') { const d = v3.norm([B.pos[0] - A.pos[0], 0, B.pos[2] - A.pos[2]]); B.push(d, 4.5, 2.5); }
    if (B.isPlayer) { g.hud.hit(dmg); g.shake(0.2); }
    if (died && !B.isPlayer) { this.kills++; g.hud.msg('Defeated ' + B.label); }
  }
  // ---------- flung props hurt people
  props(dt) {
    const g = this.g; for (const b of g.world.bodies) {
      const sp = Math.hypot(b.vel[0], b.vel[2]); if (sp < 6.5 || b.lifted > 0) continue; b.hitCool = (b.hitCool ?? 0) - dt; if (b.hitCool > 0) continue;
      for (const n of g.npcs) { if (n.team === 'ally' || n.status === 'dead') continue; const dx = n.pos[0] - b.pos[0], dz = n.pos[2] - b.pos[2]; if (Math.hypot(dx, dz) < b.r + 0.45 && b.pos[1] < n.pos[1] + 1.8 && b.pos[1] + 1 > n.pos[1]) {
        b.hitCool = 0.5; const d = v3.norm([b.vel[0], 0, b.vel[2]]); n.push(d, 5 + sp * 0.4, 3); n.hurt(8 + sp, null, { noFlinch: true }); g.fx.sparks([b.pos[0], b.pos[1] + 0.6, b.pos[2]], [0, 1, 0], 10, [1, 0.7, 0.4, 1]); g.sfxAt('hit1', b.pos, 0.9); b.vel[0] *= 0.35; b.vel[2] *= 0.35; b.flash = 1; if (n.status === 'dead') this.kills++; break; } }
    }
  }
  // ---------- blaster bolts
  shoot(f, target, o = {}) { // fire from f's right hand at the target point
    const g = this.g; const from = f.actor.bonePos('rhand'); const to = target || g.player.chest(); const err = o.err ?? 0.07;
    const dir = v3.norm([to[0] - from[0] + rnd(-1, 1) * err * v3.dist(to, from), to[1] - from[1] + rnd(-0.6, 0.6) * err * v3.dist(to, from), to[2] - from[2] + rnd(-1, 1) * err * v3.dist(to, from)]);
    const muz = v3.addS(from, dir, 0.25); this.bolts.push({ p: muz, v: v3.scale(dir, o.speed ?? 19), team: f.team, owner: f, dmg: o.dmg ?? 6, col: o.col ?? [1, 0.18, 0.12], life: 3.2, reflected: false });
    g.fx.sparks(muz, dir, 3, [1, 0.4, 0.2, 1]); g.sfxAt('hit', muz, 0.25);
  }
  updateBolts(dt) {
    const g = this.g, P = g.player;
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i]; b.life -= dt; const sp = v3.len(b.v);
      let dead = b.life <= 0; const old = b.p.slice(); b.p = v3.addS(b.p, b.v, dt);
      if (!dead && (b.p[1] < 0.02 || b.p[1] > 14 || g.world.boltBlocked(old, b.p))) { dead = true; g.fx.sparks(b.p, [0, 1, 0], 5, [b.col[0], b.col[1], b.col[2], 1]); }
      if (!dead) for (const pl of g.world.pillars) { if (b.p[1] < 8.5 && Math.hypot(b.p[0] - pl.x, b.p[2] - pl.z) < pl.r) { dead = true; g.fx.sparks(b.p, [0, 1, 0], 6, [b.col[0], b.col[1], b.col[2], 1]); break; } }
      if (!dead && b.team === 'enemy') { // vs player
        const cap = this.capsule(P);
        if (P.status !== 'dead') { const r = segSeg(old, b.p, cap.a, cap.b); const near = segSeg(old, b.p, P.chest(), P.chest()).d;
          if (r.d < cap.r + 0.35 || near < 1.0) { if (r.d < cap.r + 0.35 || near < 0.7) dead = this.boltAtPlayer(b, r.a); } }
      } else if (!dead && b.team === 'player') { // reflected: hits enemies / remote
        for (const n of g.npcs) { if (n.team !== 'enemy' || n.status === 'dead') continue; const cap = this.capsule(n); const r = segSeg(old, b.p, cap.a, cap.b);
          if (r.d < cap.r + 0.2) { if (n.hasSaber && this.canBlock(n, b.owner ? b.owner.pos : n.pos) && Math.random() < 0.6) { this.deflectNPC(n, b); } else { this.damage(P, n, r.a, b.dmg, {}); dead = true; } break; } }
        const rm = this.remote; if (!dead && rm && !rm.dead && segSeg(old, b.p, rm.pos, rm.pos).d < 0.4) { this.hitRemote(40, rm.pos); dead = true; }
      }
      if (dead) this.bolts.splice(i, 1);
    }
  }
  boltAtPlayer(b, pt) { // returns true when the bolt is consumed
    const g = this.g, P = g.player, F = g.force;
    if (F.active.absorb) { g.sfxAt('absorbhit', P.pos, 0.9); F.fp = Math.min(F.max, F.fp + 6); g.fx.sparks(P.chest(), [0, 1, 0], 8, [0.7, 0.4, 1, 1]); g.hud.msg('Absorbed (+FP)'); return true; }
    const S = P.saber;
    if (!S.holstered && P.status === 'normal' && !P.thrown && P.blade.len > 0.8) {
      const p = (S.isActiveSwing() ? 0.95 : S.inReflect(S.move) || S.inParry(S.move) ? 0.98 : 0.8) + (S.level === 1 ? 0.05 : 0);
      if (Math.random() < p) { // reflect (JO: LS_REFLECT_*)
        S.blocked = this.sideOf(P, b.p, true); this.reflect(b, P); return false;
      }
    }
    if (g.force.active.protect) g.sfxAt('protecthit', P.pos, 0.8);
    P.hurt(b.dmg, b.owner); g.hud.hit(b.dmg); g.shake(0.15); g.fx.sparks(pt, [0, 1, 0], 6, [1, 0.4, 0.2, 1]); g.sfxAt('hit1', P.pos, 0.6); return true;
  }
  reflect(b, P) {
    const g = this.g; const tgt = b.owner && b.owner.status !== 'dead' ? b.owner.chest() : [b.p[0] - b.v[0], b.p[1] + 0.5, b.p[2] - b.v[2]];
    const dir = v3.norm([tgt[0] - b.p[0] + rnd(-0.25, 0.25), tgt[1] - b.p[1] + rnd(-0.2, 0.2), tgt[2] - b.p[2] + rnd(-0.25, 0.25)]);
    b.v = v3.scale(dir, v3.len(b.v) * 1.1); b.team = 'player'; b.dmg = 40; b.col = [0.4, 0.7, 1]; b.reflected = true; this.reflected++;
    g.fx.sparks(b.p, [0, 1, 0], 14, [1, 0.95, 0.6, 1]); g.sfxAt(BOUNCES[Math.floor(Math.random() * 3)], b.p, 1); g.flashLight(b.p, [0.5, 0.7, 1], 0.25);
  }
  deflectNPC(n, b) { n.saber.blocked = this.sideOf(n, b.p, true); const dir = v3.norm([rnd(-1, 1), rnd(0.1, 0.8), rnd(-1, 1)]); b.v = v3.scale(dir, v3.len(b.v)); b.team = 'none'; this.g.fx.sparks(b.p, [0, 1, 0], 10, [1, 0.9, 0.6, 1]); this.g.sfxAt('bounce1', b.p, 0.8); }
  // ---------- practice remote
  hitRemote(dmg, pt) {
    const r = this.remote; if (!r || r.dead) return; r.hp -= dmg; r.flash = 1; this.g.fx.sparks(r.pos, [0, 1, 0], 14, [1, 0.8, 0.5, 1]); this.g.sfxAt('hit2', r.pos, 0.9);
    if (r.hp <= 0) { r.dead = true; r.respawn = 6; this.kills++; this.g.hud.msg('Remote destroyed'); this.g.fx.burst(r.pos, 40, { s0: 2, s1: 7, l0: 0.4, l1: 1, z0: 0.03, z1: 0.09, c0: [1, 0.7, 0.3, 1], c1: [1, 0.2, 0.05, 0], grav: -6 }); this.g.fx.ring({ p: r.pos, n: [0, 1, 0], r0: 0.2, r1: 2.2, life: 0.4, w: 0.1, c: [1, 0.6, 0.2, 0.9] }); this.g.sfxAt('hit3', r.pos, 1); }
  }
  updateRemote(dt) {
    const g = this.g, r = this.remote, P = g.player; if (!r) return;
    if (r.dead) { r.respawn -= dt; if (r.respawn <= 0) this.spawnRemote(); return; }
    r.flash = Math.max(0, r.flash - dt * 4); r.ang += dt * 0.55;
    const tx = P.pos[0] + Math.cos(r.ang) * 5.2, tz = P.pos[2] + Math.sin(r.ang) * 5.2, ty = 1.7 + Math.sin(g.t * 1.7) * 0.25;
    r.vel[0] += (tx - r.pos[0]) * 2.4 * dt; r.vel[1] += (ty - r.pos[1]) * 3 * dt; r.vel[2] += (tz - r.pos[2]) * 2.4 * dt; const k = Math.max(0, 1 - 1.8 * dt); r.vel[0] *= k; r.vel[1] *= k; r.vel[2] *= k;
    for (let i = 0; i < 3; i++) r.pos[i] += r.vel[i] * dt; g.world.collide(r.pos, 0.3); r.yaw = Math.atan2(P.pos[0] - r.pos[0], P.pos[2] - r.pos[2]);
    r.cool -= dt;
    if (P.status !== 'dead' && v3.dist(r.pos, P.pos) < 20) {
      if (r.cool <= 0 && r.charge <= 0) { r.charge = 0.45; r.cool = rnd(1.6, 2.8); g.sfxAt('hit', r.pos, 0.2); }
      if (r.charge > 0) { r.charge -= dt; if (r.charge <= 0) { const from = r.pos, to = P.chest(); const dir = v3.norm([to[0] - from[0] + rnd(-0.5, 0.5), to[1] - from[1] + rnd(-0.4, 0.4), to[2] - from[2] + rnd(-0.5, 0.5)]); this.bolts.push({ p: v3.addS(from, dir, 0.3), v: v3.scale(dir, 15), team: 'enemy', owner: { chest: () => r.pos.slice(), status: 'normal', pos: r.pos }, dmg: 4, col: [1, 0.25, 0.1], life: 3, reflected: false }); g.sfxAt('hit', r.pos, 0.35); } }
    }
  }
  drawRemote(R) {
    const r = this.remote; if (!r || r.dead) return; const m = new Float32Array(16); m.fill(0); const c = Math.cos(r.yaw), s = Math.sin(r.yaw);
    m[0] = c; m[2] = -s; m[5] = 1; m[8] = s; m[10] = c; m[12] = r.pos[0]; m[13] = r.pos[1]; m[14] = r.pos[2]; m[15] = 1;
    R.drawMesh(this.remoteMesh, m, { spec: 0.5, emis: [r.flash * 0.9 + (r.charge > 0 ? 0.6 : 0.08), r.flash * 0.6 + (r.charge > 0 ? 0.1 : 0.0), r.flash * 0.5] });
    const eye = v3.addS(r.pos, [Math.sin(r.yaw), 0, Math.cos(r.yaw)], 0.24); R.billboard(eye, r.charge > 0 ? 0.3 + (0.45 - r.charge) * 0.4 : 0.1, [1, 0.2, 0.1, r.charge > 0 ? 0.9 : 0.6], 0);
  }
  drawBolts(R) {
    for (const b of this.bolts) { const d = v3.norm(b.v), tail = v3.addS(b.p, d, -0.85); const c = b.col; R.beam(tail, b.p, 0.11, [c[0], c[1], c[2], 0.0], [c[0], c[1], c[2], 0.55]); R.beam(tail, b.p, 0.04, [1, 1, 1, 0.2], [1, 0.95, 0.95, 1]); R.billboard(b.p, 0.22, [c[0], c[1], c[2], 0.7], 0); }
  }
}
