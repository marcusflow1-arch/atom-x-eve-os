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
export const DOMINANCE_RANGE = 15;
export const EXECUTION_NAMES = { crush: 'Grip · crush', bisect: 'Pull · Lightning · Speed cut', dominance: 'Mind Dominance' };
const BISECT = { pull: 0.45, zap: 1.3, cut: 1.42, dashEnd: 1.55, end: 2.05 }, CRUSH = { lift: 0.5, crush: 1.25, end: 1.95 };
// Mind Dominance: the hilt comes into both hands and turns around (turn..held), they tremble, then ignite it through
// themselves (stab), and fall (die); the caster holds a hand out at them (Jedi Outcast's mind trick at its peak)
const DOMINATE = { turn: 0.2, held: 0.75, stab: 1.4, die: 1.95, end: 2.5 }, DOM_CASTER = ['BOTH_MINDTRICK1', 0.27], DOM_VICTIM = ['BOTH_WALK9', 0.02]; // WALK9's first frame: feet together, hands together in front of the solar plexus
const ok = new Set(['normal', 'down', 'getup', 'shocked', 'levitated', 'roll']), domOk = new Set(['normal', 'shocked', 'roll', 'open']);
const PAINS = ['BOTH_PAIN1', 'BOTH_PAIN2', 'BOTH_PAIN3', 'BOTH_PAIN4', 'BOTH_PAIN5', 'BOTH_PAIN6'];
const ease = x => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
const holdPose = (a, [anim, at], blend) => a.setBoth(anim, { blend, restart: true, loop: false, speed: 0.02, startAt: at / 0.02 });
// turn unit vector a toward unit vector b by the fraction k of the angle between them
function slerpDir(a, b, k) {
  const d = clamp(v3.dot(a, b), -1, 1), ang = Math.acos(d); if (ang < 1e-3) return b.slice();
  let ax = v3.cross(a, b); const l = v3.len(ax); ax = l < 1e-4 ? [0, 1, 0] : v3.scale(ax, 1 / l);
  const t = ang * k, c = Math.cos(t), s = Math.sin(t), kv = v3.cross(ax, a), kd = v3.dot(ax, a);
  return v3.norm([a[0] * c + kv[0] * s + ax[0] * kd * (1 - c), a[1] * c + kv[1] * s + ax[1] * kd * (1 - c), a[2] * c + kv[2] * s + ax[2] * kd * (1 - c)]);
}
// a hilt matrix (Blade: local -Y is the blade) centred at c with the blade along dir
function hiltMatrix(M, c, dir) {
  const Y = v3.scale(dir, -1); let X = v3.cross([0, 1, 0], Y); X = v3.len(X) < 1e-3 ? [1, 0, 0] : v3.norm(X); const Z = v3.cross(X, Y);
  M.fill(0); M[0] = X[0]; M[1] = X[1]; M[2] = X[2]; M[4] = Y[0]; M[5] = Y[1]; M[6] = Y[2]; M[8] = Z[0]; M[9] = Z[1]; M[10] = Z[2]; M[12] = c[0]; M[13] = c[1]; M[14] = c[2]; M[15] = 1; return M;
}

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
// whether `att` could turn `vic`'s own lightsaber on them (Mind Dominance): any foe on their feet with a saber in hand or
// on the belt, in front of `att` and within DOMINANCE_RANGE, at any health
export function dominanceFor(g, att, vic) {
  if (!att || !vic || att === vic || vic.status === 'dead' || !hostile(att, vic) || !domOk.has(vic.status)) return false;
  if (!vic.hasSaber || vic.thrown || vic.spawnShield > g.t || vic.executor || vic.cut) return false;
  if (att.status !== 'normal' || !att.onGround || att.executing) return false;
  const dx = vic.pos[0] - att.pos[0], dz = vic.pos[2] - att.pos[2], d = Math.hypot(dx, dz);
  if (d > DOMINANCE_RANGE || d < 0.05 || Math.abs(vic.pos[1] - att.pos[1]) > 4) return false;
  return (Math.sin(att.yaw) * dx + Math.cos(att.yaw) * dz) / d >= EXECUTE_COS;
}
export function findDominated(g, att) {
  let best = null, score = -Infinity;
  for (const f of g.foesOf(att)) {
    if (!dominanceFor(g, att, f)) continue;
    const dx = f.pos[0] - att.pos[0], dz = f.pos[2] - att.pos[2], d = Math.hypot(dx, dz), s = (Math.sin(att.yaw) * dx + Math.cos(att.yaw) * dz) / d * 4 - d * 0.1;
    if (s > score) { score = s; best = f; }
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
    this.hold = o.hold || (kind === 'dominance' ? vic.pos.slice() : [att.pos[0] + this.fwd[0] * (kind === 'crush' ? 2.0 : 2.5), fl + (kind === 'crush' ? 0.9 : 1.05), att.pos[2] + this.fwd[2] * (kind === 'crush' ? 2.0 : 2.5)]); // dominated: they stay where they stand
    if (kind === 'dominance') this.hm = new Float32Array(16);
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
      vic.endForce(); vic.cancelAttackState();
      if (kind === 'dominance') { if (vic.blade.lit) { vic.blade.set(false); g.sfxAt('saberoff', vic.pos, 0.8); g.humStop && g.humStop(vic); } } // the blade goes out; the hilt stays to be turned on them
      else if (vic.hasSaber && !vic.saber.holstered) vic.extinguish(); // helpless: the blade goes out
      vic.status = 'executed'; vic.statusT = 0; vic.vel = [0, 0, 0]; vic.shoveV = [0, 0, 0]; vic.onGround = kind === 'dominance'; vic.yaw = vic.targetYaw = yaw + Math.PI;
    }
    vic.executor = att; vic.markAttacker?.(att);
    if (kind === 'dominance') { if (att.isPlayer || vic.isPlayer) g.banner(vic.isPlayer ? 'DOMINATED' : 'MIND DOMINANCE', vic.isPlayer ? [1, 0.4, 0.35] : [0.85, 0.6, 1], 1.6); }
    else if (att.isPlayer || vic.isPlayer) g.banner(vic.isPlayer ? 'EXECUTED' : 'EXECUTION', vic.isPlayer ? [1, 0.4, 0.35] : [1, 0.85, 0.55], 1.6);
  }
  step(k, fn) { if (!this.once.has(k)) { this.once.add(k); fn(); } }
  hands() { const a = this.att.actor; return [a.bonePos('lhand'), a.bonePos('rhand')]; }
  update(dt) {
    if (this.done) return;
    const g = this.g, att = this.att, vic = this.vic; this.t += dt;
    const gone = att.status === 'dead' || (this.driveAtt && att.status !== 'executing') || (!this.driveAtt && !g.fighters().includes(att));
    if (gone && !(this.kind === 'dominance' && this.once.has('stab'))) return this.cancel(); // once their own blade is through them it is too late
    if (this.kind === 'bisect') this.bisect(dt); else if (this.kind === 'dominance') this.dominance(dt); else this.crush(dt);
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
  // ---------------- Mind Dominance: they turn their own lightsaber on themselves
  // the hilt held in both hands at the solar plexus, the blade pointing through the spine (it comes out of the back)
  selfStab(push = 0) {
    const vic = this.vic, a = vic.actor, L = a.bonePos('lhand'), R = a.bonePos('rhand'), c = [(L[0] + R[0]) / 2, (L[1] + R[1]) / 2, (L[2] + R[2]) / 2];
    // between the wrists, aimed at the spine and straight back out of them (the two agree on an upright body; the second
    // keeps it level whatever the grip offsets put the palms), a little upward
    const spine = v3.norm(v3.sub(v3.addS(a.bonePos('upper_lumbar'), [0, 1, 0], 0.05), c)), back = [-Math.sin(vic.yaw), 0.1, -Math.cos(vic.yaw)];
    const dir = v3.norm(v3.add(spine, v3.norm(back)));
    return { c: v3.addS(c, dir, push - 0.05), dir };
  }
  dominance(dt) {
    const g = this.g, att = this.att, vic = this.vic, T = this.t, D = DOMINATE;
    this.step('seize', () => {
      if (this.driveAtt) holdPose(att.actor, DOM_CASTER, 0.12);
      g.sfxAt('distract', att.pos, 1); g.sfxAt('see', vic.pos, 0.8);
      if (this.driveVic) holdPose(vic.actor, DOM_VICTIM, 0.45);
    });
    if (this.driveAtt && att.status === 'executing') att.yaw = att.targetYaw = Math.atan2(vic.pos[0] - att.pos[0], vic.pos[2] - att.pos[2]);
    // the hilt: from the hand (or the belt) into both hands, turned around on them
    if (T >= D.turn && T < D.die + 0.3) {
      if (!this.hilt0) { const M = vic.hiltMat; this.hilt0 = { c: [M[12], M[13], M[14]], dir: v3.norm([-M[4], -M[5], -M[6]]) }; }
      const tgt = this.selfStab(T >= D.stab ? 0.04 : 0), k = ease((T - D.turn) / (D.held - D.turn));
      let c = v3.lerp(this.hilt0.c, tgt.c, k); const dir = slerpDir(this.hilt0.dir, tgt.dir, k);
      if (T >= D.held && T < D.stab) c = v3.addS(c, [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5], 0.012 * (T - D.held) / (D.stab - D.held)); // fighting it, shaking more and more
      vic.hiltPose = hiltMatrix(this.hm, c, dir);
    } else if (vic.hiltPose === this.hm) vic.hiltPose = null;
    if (this.driveVic && vic.status === 'executed') vic.pos = T < D.stab ? [this.hold[0] + (Math.random() - 0.5) * 0.012 * ease(T / D.stab), this.hold[1], this.hold[2] + (Math.random() - 0.5) * 0.012 * ease(T / D.stab)] : this.hold.slice();
    if (T >= D.stab) this.step('stab', () => { // ignited through themselves
      if (this.driveVic) { vic.blade.set(true); g.humStart && g.humStart(vic); }
      const p = this.selfStab(), out = v3.addS(p.c, p.dir, 0.42), front = v3.addS(p.c, p.dir, 0.1);
      g.sfxAt('saberon', vic.pos, 1); g.sfxAt('hit3', front, 1); g.sfxAt('hit2', out, 0.7);
      g.fx.sparks(out, p.dir, 22, [1, 0.75, 0.4, 1]); g.fx.sparks(front, v3.scale(p.dir, -1), 8, [1, 0.6, 0.3, 1]); g.flashLight(out, vic.blade.color, 0.4);
      vic.dmgFlash = 1; this.exit = out;
      if (att.isPlayer || vic.isPlayer) { g.shake(0.4); if (!g.net) g.slowMo = { until: g.t + 0.5, scale: 0.35 }; }
    });
    if (this.exit && T < D.die + 0.3 && Math.random() < 0.5) g.fx.emit({ p: v3.addS(this.exit, [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5], 0.08), v: [0, 0.6, 0], life: 0.7, size: 0.05, grow: 0.25, c0: [0.35, 0.33, 0.32, 0.45], c1: [0.2, 0.2, 0.2, 0] }); // cauterized
    if (T >= D.die) this.step('die', () => {
      if (this.driveAtt && att.status === 'executing') { att.actor.followLegs(); att.actor.torso.cur = null; }
      if (!this.driveVic || vic.status === 'dead') return;
      vic.blade.set(false); g.sfxAt('saberoff', vic.pos, 0.8); g.humStop && g.humStop(vic); vic.saber.holstered = true;
      vic.hp = 0; vic.status = 'normal'; vic.die(att, { deathAnim: 'BOTH_DEATH18' }); // sinks to the knees, then forward onto the face vic.executor = null;
    });
    if (T >= D.end) this.finish();
  }
  finish() {
    if (this.done) return; this.done = true; this.bolts = []; this.beam = null; if (this.loop) { this.loop.stop(0.1); this.loop = null; }
    if (this.hm && this.vic.hiltPose === this.hm) this.vic.hiltPose = null;
    const att = this.att; att.executing = null;
    if (this.driveAtt && att.status === 'executing') { att.status = 'normal'; att.endForce(); att.actor.followLegs(); att.actor.torso.cur = null; att.vel = [0, 0, 0]; }
    if (this.vic.executor === att) this.vic.executor = null;
  }
  cancel() { // the executor died (or left): the victim drops, alive
    const vic = this.vic; this.finish();
    if (this.driveVic && vic.status === 'executed' && this.kind === 'dominance') { vic.status = 'normal'; vic.statusT = 0; vic.actor.followLegs(); vic.actor.torso.cur = null; if (!vic.saber.holstered) vic.extinguish(); } // the hold on their mind is broken
    else if (this.driveVic && vic.status === 'executed') { vic.status = 'flung'; vic.statusT = 0; vic.vel = [0, -0.5, 0]; vic.playWhole('BOTH_KNOCKDOWN1', { blend: 0.08 }); }
  }
  draw(R) {
    if (this.kind === 'dominance' && !this.done && this.t < DOMINATE.die) { // a haze over the mind they no longer own
      const h = this.vic.actor.bonePos('cranium'), w = 0.75 + 0.25 * Math.sin(this.t * 9); R.billboard(h, 0.62, [0.7, 0.4, 1, 0.22 * w], 0); R.billboard(h, 0.36, [0.85, 0.6, 1, 0.25 * w], 0);
      const hand = this.att.actor.bonePos('lhand'); R.billboard(hand, 0.3, [0.75, 0.5, 1, 0.3 * w], 0);
    }
    for (const b of this.bolts) drawBolt(R, b, [0.55, 0.75, 1], 1);
    if (this.beam) { const pts = bolt(this.beam.a, this.beam.b, 12, 0.05); for (let i = 0; i < pts.length - 1; i++) { R.beam(pts[i], pts[i + 1], 0.06, [1, 0.25, 0.12, 0.3]); R.beam(pts[i], pts[i + 1], 0.018, [1, 0.85, 0.8, 0.9]); } }
  }
}

// render a fighter that was cut in half: both halves keep the pose of the moment of the cut; the lower half buckles, the
// upper half slides off along the cut and falls, both with a cauterized cut face
export function cutTransforms(f, now) {
  const c = f.cut, t = Math.max(0, now - c.t), lat = v3.norm(v3.cross([0, 1, 0], c.dir)); // axis the halves tip over
  if (c.vertical) { // split down the middle (the Counter's strike): the halves part and fall away to either side
    const feet = [f.pos[0], c.floor, f.pos[2]], d = lat[0] * feet[0] + lat[1] * feet[1] + lat[2] * feet[2], ang = Math.min(1.5, 3.6 * Math.max(0, t - 0.12) ** 2 * 3);
    const half = s => { // s = +1 the side lat points to, -1 the other; rotating about the cut direction by -s tips it toward s
      const r = m4.trs([0, 0, 0], Q.axisAngle(c.dir, -s * ang), [1, 1, 1]), sl = Math.min(0.22, t * 0.7) * s;
      return m4.mul(m4.trs([feet[0] + lat[0] * sl, feet[1], feet[2] + lat[2] * sl], [0, 0, 0, 1], [1, 1, 1]), m4.mul(r, m4.trs([-feet[0], -feet[1], -feet[2]], [0, 0, 0, 1], [1, 1, 1])));
    };
    return { lower: half(1), upper: half(-1), lowerClip: new Float32Array([lat[0], lat[1], lat[2], -d]), upperClip: new Float32Array([-lat[0], -lat[1], -lat[2], d]) };
  }
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
