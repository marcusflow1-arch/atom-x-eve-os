/* eslint-disable */
// Executions (Atom X Eve): a foe at or under EXECUTE_HP of their health, in front of you and in reach, can be finished
// with R. Two finishers, picked by distance:
//   'crush'  (up to CRUSH_RANGE m) Force Grip lifts them off the ground and crushes their throat.
//   'bisect' (up to EXECUTE_RANGE m) Force Pull drags them in, Force Lightning holds them in the air, then a Force Speed
//            dash goes straight through them and the saber cuts them in half.
// Both fighters are locked into the sequence (status 'executing' / 'executed'); the victim takes no other damage. The
// executor can still be hurt by others, and dying cancels the execution. Online, the executor's game drives the executor
// and the victim's game drives the victim (Fighter.executedBy, an RPC on another player's fighter) from the same start,
// hold point and timeline; the cut is shown to everyone (net fx 'cut').
import { v3, clamp, m4, q as Q } from './math.js';
import { bolt, drawBolt } from './fx.js';
import { hostile } from './combat.js';

export const EXECUTE_HP = 0.25, EXECUTE_RANGE = 10, CRUSH_RANGE = 3.6, EXECUTE_COS = 0.57; // in front: within ~55 degrees
export const EXECUTION_NAMES = { crush: 'Grip · crush', bisect: 'Pull · Lightning · Speed cut' };
const BISECT = { pull: 0.45, zap: 1.3, cut: 1.42, dashEnd: 1.55, end: 2.05 }, CRUSH = { lift: 0.5, crush: 1.25, end: 1.95 };
const ok = new Set(['normal', 'down', 'getup', 'shocked', 'levitated', 'roll']);
const PAINS = ['BOTH_PAIN1', 'BOTH_PAIN2', 'BOTH_PAIN3', 'BOTH_PAIN4', 'BOTH_PAIN5', 'BOTH_PAIN6'];
const ease = x => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };

// which execution `att` could do on `vic` right now (null = none)
export function executionFor(g, att, vic) {
  if (!att || !vic || att === vic || vic.status === 'dead' || !hostile(att, vic) || !ok.has(vic.status)) return null;
  if (vic.hp <= 0 || vic.hp > EXECUTE_HP * vic.maxHp || vic.spawnShield > g.t || vic.executor) return null;
  if (att.status !== 'normal' || !att.onGround || att.executing || !att.hasSaber) return null;
  const dx = vic.pos[0] - att.pos[0], dz = vic.pos[2] - att.pos[2], d = Math.hypot(dx, dz);
  if (d > EXECUTE_RANGE || d < 0.05 || Math.abs(vic.pos[1] - att.pos[1]) > 2.6) return null;
  if ((Math.sin(att.yaw) * dx + Math.cos(att.yaw) * dz) / d < EXECUTE_COS) return null;
  return d <= CRUSH_RANGE ? 'crush' : 'bisect';
}
// the best foe `att` could execute: the most in front, then the closest
export function findExecutable(g, att) {
  let best = null, score = -Infinity;
  for (const f of g.foesOf(att)) {
    const kind = executionFor(g, att, f); if (!kind) continue;
    const dx = f.pos[0] - att.pos[0], dz = f.pos[2] - att.pos[2], d = Math.hypot(dx, dz), s = (Math.sin(att.yaw) * dx + Math.cos(att.yaw) * dz) / d * 4 - d * 0.1;
    if (s > score) { score = s; best = { victim: f, kind }; }
  }
  return best;
}

export class Execution {
  // o.fwd / o.hold: given when another player's game started it (both games use the same points)
  constructor(g, att, vic, kind, o = {}) {
    this.g = g; this.att = att; this.vic = vic; this.kind = kind; this.t = 0; this.done = false; this.once = new Set(); this.bolts = [];
    const dx = vic.pos[0] - att.pos[0], dz = vic.pos[2] - att.pos[2], d = Math.hypot(dx, dz) || 1;
    this.fwd = o.fwd ? v3.norm([o.fwd[0], 0, o.fwd[2]]) : [dx / d, 0, dz / d];
    const fl = g.world.floorAt(att.pos[0], att.pos[2], att.pos[1] + 0.6) ?? att.pos[1];
    this.hold = o.hold || [att.pos[0] + this.fwd[0] * (kind === 'crush' ? 2.0 : 2.5), fl + (kind === 'crush' ? 0.9 : 1.05), att.pos[2] + this.fwd[2] * (kind === 'crush' ? 2.0 : 2.5)];
    this.start = { att: att.pos.slice(), vic: vic.pos.slice() };
    this.dashEnd = v3.addS([this.hold[0], fl, this.hold[2]], this.fwd, 3.2);
    this.driveAtt = !att.remote; this.driveVic = !vic.remote;
    const yaw = Math.atan2(this.fwd[0], this.fwd[2]);
    if (this.driveAtt) {
      const F = g.forceOf(att); if (F) { F.release(true); F.charging = null; }
      att.endForce(); att.cancelAttackState(); att.status = 'executing'; att.statusT = 0; att.vel = [0, 0, 0]; att.yaw = att.targetYaw = yaw; att.executing = this;
      if (kind === 'bisect' && att.saber.holstered) att.igniteNow();
    }
    if (this.driveVic) {
      const F = g.forceOf(vic); if (F) { F.releaseAll?.(true); }
      vic.endForce(); vic.cancelAttackState(); if (vic.hasSaber && !vic.saber.holstered) vic.extinguish(); // helpless: the blade goes out
      vic.status = 'executed'; vic.statusT = 0; vic.vel = [0, 0, 0]; vic.shoveV = [0, 0, 0]; vic.onGround = false; vic.yaw = vic.targetYaw = yaw + Math.PI;
    }
    vic.executor = att; vic.markAttacker?.(att);
    if (att.isPlayer || vic.isPlayer) g.banner(vic.isPlayer ? 'EXECUTED' : 'EXECUTION', vic.isPlayer ? [1, 0.4, 0.35] : [1, 0.85, 0.55], 1.6);
  }
  step(k, fn) { if (!this.once.has(k)) { this.once.add(k); fn(); } }
  hands() { const a = this.att.actor; return [a.bonePos('lhand'), a.bonePos('rhand')]; }
  update(dt) {
    if (this.done) return;
    const g = this.g, att = this.att, vic = this.vic; this.t += dt;
    if (att.status === 'dead' || (this.driveAtt && att.status !== 'executing') || (!this.driveAtt && !g.fighters().includes(att))) return this.cancel();
    if (this.kind === 'bisect') this.bisect(dt); else this.crush(dt);
  }
  // ---------------- Pull, Lightning, Speed cut
  bisect(dt) {
    const g = this.g, att = this.att, vic = this.vic, T = this.t, B = BISECT;
    // 1. Force Pull: dragged in front of the executor
    this.step('pull', () => { if (this.driveAtt) att.playForce('BOTH_FORCEPULL', { durMs: 560, whole: true }); g.sfxAt('pull', att.pos, 1); if (this.driveVic) vic.playWhole('BOTH_KNOCKDOWN3', { blend: 0.06 }); });
    if (this.driveVic && T < B.pull) vic.pos = v3.lerp(this.start.vic, this.hold, ease(T / B.pull));
    // 2. Force Lightning: held in the air, convulsing
    if (T >= B.pull && T < B.zap) {
      this.step('zap', () => { if (this.driveAtt) att.playForce('BOTH_FORCELIGHTNING_HOLD', { durMs: 300, hold: true, loop: true, whole: true }); g.sfxAt('lightning', att.pos, 1); this.loop = g.sfx.loop('lightning2', { vol: 0.35 }); });
      if (this.driveVic) {
        vic.pos = [this.hold[0] + (Math.random() - 0.5) * 0.04, this.hold[1] + Math.sin(T * 40) * 0.02, this.hold[2] + (Math.random() - 0.5) * 0.04];
        if ((this.painAt ?? 0) <= T) { this.painAt = T + 0.22; vic.playWhole(PAINS[Math.floor(Math.random() * PAINS.length)], { blend: 0.04 }); }
      }
      vic.elecUntil = g.t + 0.2; if (Math.random() < 0.5) g.bodyArc(vic); if (Math.random() < 0.5) g.fx.sparks(vic.chest(), [0, 1, 0], 2, [0.6, 0.8, 1, 1]);
      if ((this.boltAt ?? 0) <= T) { this.boltAt = T + 0.045; const h = this.hands(), c = vic.chest(); this.bolts = [bolt(h[0], c, 9, 0.22), bolt(h[1], v3.addS(c, [0, 0.2, 0], 1), 9, 0.22)]; }
      g.lightFlash = 0.6; g.lightFlashPos = this.hands()[0];
    }
    // 3. Force Speed dash straight through them; the cut
    if (T >= B.zap) {
      this.step('dash', () => {
        this.bolts = []; if (this.loop) { this.loop.stop(0.1); this.loop = null; } g.lightFlash = 0;
        g.sfxAt('speed', att.pos, 1); if (this.driveAtt) { att.endForce(); att.playWhole('BOTH_A3__L__R', { blend: 0.04, speed: 1.6 }); att.blade.trailOn = 1; }
        if (this.driveVic) vic.playWhole('BOTH_PAIN2', { blend: 0.04 });
        this.dashFrom = att.pos.slice();
      });
      if (this.driveAtt && T < B.dashEnd) { att.pos = v3.lerp(this.dashFrom, this.dashEnd, ease((T - B.zap) / (B.dashEnd - B.zap))); att.blade.trailOn = 1; for (let i = 0; i < 3; i++) g.fx.emit({ p: [att.pos[0] + (Math.random() - 0.5) * 0.4, att.pos[1] + Math.random() * 1.7, att.pos[2] + (Math.random() - 0.5) * 0.4], v: v3.scale(this.fwd, -3), life: 0.35, size: 0.1, grow: 0.3, c0: [0.5, 0.8, 1, 0.7], c1: [0.3, 0.5, 1, 0] }); }
      if (T >= B.cut) this.step('cut', () => this.cut());
      if (T >= B.end) this.finish();
    }
  }
  cut() {
    const g = this.g, att = this.att, vic = this.vic, fl = g.world.floorAt(this.hold[0], this.hold[2], this.hold[1] + 0.5) ?? this.hold[1] - 1.05;
    const y = vic.pos[1] + 1.0, at = [vic.pos[0], y, vic.pos[2]];
    g.fx.sparks(at, this.fwd, 26, [1, 0.75, 0.4, 1]); g.flashLight(at, att.blade.color, 0.35); g.sfxAt('hit3', at, 1); g.sfxAt('hit2', at, 0.8);
    for (let i = 0; i < 18; i++) { const a = Math.random() * 6.28; g.fx.emit({ p: at, v: [Math.cos(a) * 2, Math.random() * 1.5, Math.sin(a) * 2], life: 0.6, size: 0.05, c0: [1, 0.55, 0.2, 0.9], c1: [0.6, 0.1, 0.05, 0] }); }
    if (att.isPlayer || vic.isPlayer) { g.shake(0.45); if (!g.net) g.slowMo = { until: g.t + 0.55, scale: 0.35 }; }
    if (!this.driveVic) { g.cutFighter(vic, { y, dir: this.fwd, floor: fl }, true); return; } // shown here now; their game cuts them for real
    g.cutFighter(vic, { y, dir: this.fwd, floor: fl });
    vic.hp = 0; vic.status = 'normal'; vic.die(att, { deathAnim: 'BOTH_PAIN2' }); vic.executor = null;
  }
  // ---------------- Grip, crush
  crush(dt) {
    const g = this.g, att = this.att, vic = this.vic, T = this.t, C = CRUSH;
    this.step('grip', () => { if (this.driveAtt) att.playForce('BOTH_FORCEGRIP3', { durMs: C.crush * 1000, hold: true, whole: true }); g.sfxAt('grip', att.pos, 1); if (this.driveVic) vic.playWhole('BOTH_CHOKE1', { loop: true, blend: 0.1 }); });
    if (this.driveVic && T < C.crush) { const k = ease(T / C.lift); vic.pos = v3.lerp(this.start.vic, this.hold, k); vic.pos[1] += Math.sin(T * 9) * 0.015 * k; }
    if (T < C.crush) { const h = this.hands()[1], c = vic.headPos ? v3.addS(vic.headPos(), [0, -0.18, 0], 1) : vic.chest(); this.beam = { a: h, b: c }; if (Math.random() < 0.6) g.fx.emit({ p: v3.lerp(h, c, Math.random()), v: [0, 0.3, 0], life: 0.35, size: 0.04, c0: [1, 0.35, 0.1, 0.9], c1: [0.8, 0.1, 0.05, 0] }); }
    if (T >= C.crush) this.step('crush', () => {
      this.beam = null; const c = vic.chest(); g.sfxAt('hit3', c, 1); g.sfxAt('grip', c, 0.8);
      g.fx.ring({ p: v3.addS(c, [0, 0.35, 0], 1), n: [0, 1, 0], r0: 0.5, r1: 0.05, life: 0.3, w: 0.08, c: [1, 0.25, 0.1, 1] }); g.fx.sparks(v3.addS(c, [0, 0.35, 0], 1), [0, 1, 0], 10, [1, 0.3, 0.15, 1]);
      if (att.isPlayer || vic.isPlayer) g.shake(0.35);
      if (this.driveAtt) att.playForce('BOTH_FORCEGRIP3THROW', { durMs: 700, whole: true });
      if (this.driveVic) { vic.hp = 0; vic.status = 'normal'; vic.die(att, { deathAnim: 'BOTH_FALLDEATH1INAIR' }); vic.landAnim = 'BOTH_FALLDEATH1LAND'; vic.executor = null; vic.vel = [this.fwd[0] * 2.5, 0.5, this.fwd[2] * 2.5]; } // thrown aside as he lets go, limp
    });
    if (T >= C.end) this.finish();
  }
  finish() {
    if (this.done) return; this.done = true; this.bolts = []; this.beam = null; if (this.loop) { this.loop.stop(0.1); this.loop = null; }
    const att = this.att; att.executing = null;
    if (this.driveAtt && att.status === 'executing') { att.status = 'normal'; att.endForce(); att.actor.followLegs(); att.actor.torso.cur = null; att.vel = [0, 0, 0]; }
    if (this.vic.executor === att) this.vic.executor = null;
  }
  cancel() { // the executor died (or left): the victim drops, alive
    const vic = this.vic; this.finish();
    if (this.driveVic && vic.status === 'executed') { vic.status = 'flung'; vic.statusT = 0; vic.vel = [0, -0.5, 0]; vic.playWhole('BOTH_KNOCKDOWN1', { blend: 0.08 }); }
  }
  draw(R) {
    for (const b of this.bolts) drawBolt(R, b, [0.55, 0.75, 1], 1);
    if (this.beam) { const pts = bolt(this.beam.a, this.beam.b, 12, 0.05); for (let i = 0; i < pts.length - 1; i++) { R.beam(pts[i], pts[i + 1], 0.06, [1, 0.25, 0.12, 0.3]); R.beam(pts[i], pts[i + 1], 0.018, [1, 0.85, 0.8, 0.9]); } }
  }
}

// render a fighter that was cut in half: both halves keep the pose of the moment of the cut; the lower half buckles, the
// upper half slides off along the cut and falls, both with a cauterized cut face
export function cutTransforms(f, now) {
  const c = f.cut, t = Math.max(0, now - c.t), lat = v3.norm(v3.cross([0, 1, 0], c.dir)); // axis the halves tip over
  const fall = (pivot, ang, dy, slide) => {
    const r = m4.trs([0, 0, 0], Q.axisAngle(lat, ang), [1, 1, 1]), T1 = m4.trs([pivot[0] + slide[0], pivot[1] + dy, pivot[2] + slide[2]], [0, 0, 0, 1], [1, 1, 1]), T0 = m4.trs([-pivot[0], -pivot[1], -pivot[2]], [0, 0, 0, 1], [1, 1, 1]);
    return m4.mul(T1, m4.mul(r, T0));
  };
  const feet = [f.pos[0], c.floor, f.pos[2]], top = [f.pos[0], c.y, f.pos[2]];
  const lowerAng = -Math.min(1.45, 2.6 * Math.max(0, t - 0.25) ** 2 * 4), lower = fall(feet, lowerAng, 0, [0, 0, 0]);
  const drop = Math.min(c.y - c.floor - 0.25, 0.5 * 9.8 * t * t), slide = v3.scale(c.dir, Math.min(0.55, t * 1.4));
  const upper = fall(top, Math.min(1.55, t * 2.4), -drop, slide);
  return { lower, upper, lowerClip: new Float32Array([0, -1, 0, c.y]), upperClip: new Float32Array([0, 1, 0, -c.y]) };
}
