/* eslint-disable */
// Force powers (Jedi Outcast MP set: push, pull, grip, lightning, heal, speed, mind trick, rage, protect, absorb, drain,
// sight, team heal, team energize, force jump, saber throw) with the original animations.
// One class drives both the player (keyboard / power selector) and the dark Jedi (AI sets `want` flags and calls cast()),
// so the enemy really uses the same powers, effects and costs. Push / pull / grip / lightning outcomes come from
// forcerules.js (ported from w_force.c) via Game.applyThrow().
import { v3, clamp } from './math.js';
import { bolt, drawBolt } from './fx.js';
import { GRIP_MAX_DIST, gripBlocker, gripPhase, gripEffectiveLevel, gripBroken, lightningMul } from './forcerules.js';

const rnd = (a, b) => a + Math.random() * (b - a);
export const POWERS = [
  { id: 'push', name: 'Force Push', cost: 20 }, { id: 'pull', name: 'Force Pull', cost: 20 },
  { id: 'grip', name: 'Force Grip', cost: 12, hold: true }, { id: 'lightning', name: 'Force Lightning', cost: 8, hold: true },
  { id: 'heal', name: 'Force Heal', cost: 10, hold: true }, { id: 'speed', name: 'Force Speed', cost: 50 },
  { id: 'mind', name: 'Mind Trick', cost: 20 }, { id: 'rage', name: 'Force Rage', cost: 50 },
  { id: 'protect', name: 'Force Protect', cost: 25 }, { id: 'absorb', name: 'Force Absorb', cost: 25 },
  { id: 'drain', name: 'Force Drain', cost: 10, hold: true }, { id: 'see', name: 'Force Sight', cost: 20 },
  { id: 'teamheal', name: 'Team Heal', cost: 25 }, { id: 'teamforce', name: 'Team Energize', cost: 25 },
];
export const POWER_BY_ID = Object.fromEntries(POWERS.map(p => [p.id, p]));
// Ten direct-cast slots. Remaining powers stay reachable in the mouse-wheel selector.
export const FORCE_QUICK_SLOTS = Object.freeze([
  ['1', 'push'], ['2', 'pull'], ['3', 'grip'], ['4', 'lightning'], ['5', 'heal'],
  ['6', 'speed'], ['7', 'mind'], ['8', 'rage'], ['9', 'protect'], ['0', 'absorb'],
]);
export const FORCE_QUICK_BINDINGS = Object.freeze(FORCE_QUICK_SLOTS.flatMap(([digit, id]) => [
  { code: 'Digit' + digit, id }, { code: 'Numpad' + digit, id },
]));
export const FORCE_HOTKEY_LABELS = Object.freeze(Object.fromEntries(FORCE_QUICK_SLOTS.map(([digit, id]) => [id, digit])));
// Scrollable force menu: all 10 quick-slot abilities plus Drain and Sight.
export const SELECT_ORDER = [...FORCE_QUICK_SLOTS.map(([, id]) => id), 'drain', 'see'];
export const SELECT_ALL = [...SELECT_ORDER, 'teamheal', 'teamforce'];
export const FORCE_DUR = { speed: 10, rage: 12, protect: 15, absorb: 12, see: 15 };
const DUR = FORCE_DUR;
const GRIP_ALLOWED = new Set(['push', 'pull', 'absorb', 'protect']); // what a gripped fighter can still do (push / pull break the grip)
const GRIP_WHY = { busy: 'Force Grip: busy', 'mid-swing': 'Force Grip: finish the swing first', 'low Force': 'Not enough Force', 'no target': 'Force Grip: no target', 'already gripped': 'Already gripped', recovering: 'Target just broke free', down: 'Force Grip: down', 'out of range': 'Force Grip: out of range (' + GRIP_MAX_DIST.toFixed(1) + ' m)' };

export class Force {
  constructor(game, p, o = {}) {
    this.g = game; this.p = p; this.npc = !!o.npc; this.fp = o.fp ?? 100; this.max = this.fp; this.regen = o.regen ?? 9; this.active = {}; this.holding = null; this.holdVia = 'key'; this.cool = {}; this.gcd = 0; this.loops = {}; this.pending = [];
    this.target = null; this.bolts = []; this.boltT = 0; this.beam = null; this.healT = 0; this.lt = 0; this.want = {}; this.bodyBolts = null;
    this.lv = Object.assign({ push: 3, pull: 3, grip: 3, lightning: 3, heal: 3, speed: 3, mind: 3, rage: 3, protect: 3, absorb: 3, drain: 3, see: 3 }, o.levels);
    this.list = (o.list || SELECT_ORDER).slice(); this.sel = Math.max(0, this.list.indexOf(o.select || 'push')); this.selShow = 0;
    this.dmgScale = o.dmgScale ?? 1; this.healRate = o.healRate ?? 24; this.spd = o.speedGain ?? 1.75; this.protectMul = o.protectMul ?? 0.2;
    this.gripLevel = 0; this.gripBase = 0; this.gripT = 0; this.gripCracked = false; this.brokenFree = false; this.absorbMsgT = 0;
  }
  // ---------------- selector (player)
  selId() { return this.list[this.sel]; }
  select(d) { const n = this.list.length; this.sel = ((this.sel + d) % n + n) % n; this.selShow = 2.4; }
  selectId(id) { const i = this.list.indexOf(id); if (i >= 0) { this.sel = i; this.selShow = 2.4; } }
  // ---------------- helpers
  say(t) { if (!this.npc) this.g.hud.msg(t); }
  shake(a) { if (!this.npc) this.g.shake(a); }
  alive() { const s = this.p.status; return s === 'normal' || s === 'roll' || s === 'gripped'; }
  anim(name, o) { if (this.p.status === 'gripped') return; this.p.playForce(name, o); } // a gripped fighter keeps the choke pose
  canJump() { return this.fp >= 10; }
  use(cost) { if (this.fp < cost) { this.say('Not enough Force'); return false; } this.fp -= cost; return true; }
  aim() {
    if (!this.npc) return this.g.aimDir();
    const o = this.origin(), c = this.g.player.chest(); return v3.norm([c[0] - o[0], c[1] - o[1] - 0.1, c[2] - o[2]]);
  }
  origin() { const c = this.p.chest(); return [c[0], c[1] + 0.25, c[2]]; }
  hands() { const a = this.p.actor; const l = a.bonePos('lhand'), r = a.bonePos('rhand'); const d = this.aim(); return [v3.addS(l, d, 0.12), v3.addS(r, d, 0.12)]; }
  targets() {
    const g = this.g; if (!this.npc) return g.targets();
    const P = g.player; return P.status === 'dead' ? [] : [{ type: 'npc', ref: P, center: () => P.chest() }];
  }
  cone(range, deg, opts = {}) {
    const o = this.origin(), d = this.aim(), cs = Math.cos(deg * Math.PI / 180); const out = [];
    for (const t of this.targets()) { if (opts.npcOnly && t.type !== 'npc') continue; if (opts.allies === undefined && t.type === 'npc' && t.ref.team === 'ally') continue; if (opts.allies !== undefined && t.type === 'npc' && (t.ref.team === 'ally') !== opts.allies) continue;
      const c = t.center(), v = v3.sub(c, o), L = v3.len(v); if (L > range || L < 0.2) continue; const dot = v3.dot(v3.scale(v, 1 / L), d); if (dot < cs) continue; out.push({ t, L, dot, v: v3.scale(v, 1 / L) }); }
    out.sort((a, b) => (b.dot * 3 - b.L * 0.05) - (a.dot * 3 - a.L * 0.05)); return out;
  }
  flat(v) { const l = Math.hypot(v[0], v[2]) || 1; return [v[0] / l, 0, v[2] / l]; }
  absorbDef(f) { const F = this.g.forceOf(f); return { absorbActive: !!(F && F.active.absorb), absorbLevel: F ? F.lv.absorb : 0 }; }
  // ---------------- per frame
  update(dt, input) {
    const g = this.g, p = this.p, now = g.t; this.gcd -= dt; this.selShow = Math.max(0, this.selShow - dt); this.absorbMsgT -= dt;
    if (p.status === 'dead') { this.releaseAll(true); return; }
    const free = p.status === 'normal' || p.status === 'roll', gripped = p.status === 'gripped';
    if (!this.npc && input) {
      if (this.gcd <= 0 && !this.holding && (free || gripped)) {
        const shortcut = FORCE_QUICK_BINDINGS.find(({ code, id }) => this.list.includes(id) && input.pressed(code));
        if (shortcut) this.tryCast(shortcut.id, shortcut.code);
        else if (input.pressed('KeyF')) this.tryCast(this.selId(), 'KeyF');
      }
      if (input.pressed('KeyJ')) { p.jumpLevel = p.jumpLevel % 3 + 1; g.hud.msg('Force Jump level ' + p.jumpLevel); }
    }
    // held powers
    if (this.holding) {
      const pw = POW(this.holding); let down;
      if (this.npc) down = !!this.want[pw.id]; else down = !!(input && input.held(this.holdVia));
      if (!down || p.status !== 'normal') this.release(); else this.tickHold(this.holding, dt);
    }
    // timed powers
    for (const k of Object.keys(this.active)) { if (now >= this.active[k].until) this.endTimed(k); else this.tickTimed(k, dt); }
    // delayed effects
    for (let i = this.pending.length - 1; i >= 0; i--) if (this.pending[i].t <= now) { const f = this.pending[i].fn; this.pending.splice(i, 1); f(); }
    // regen
    const busy = this.holding || Object.keys(this.active).length; this.fp = clamp(this.fp + (busy ? 2.2 : this.regen) * dt, 0, this.max);
    if (this.fp <= 0 && this.holding) this.release();
    // keep held-anim alive
    if (this.holding && p.forceHold) p.forceUntil = now + 0.25;
    // lightning bolt regen
    if (this.holding === 'lightning') { this.boltT -= dt; if (this.boltT <= 0) { this.boltT = 0.04; this.regenBolts(); } }
  }
  later(sec, fn) { this.pending.push({ t: this.g.t + sec, fn }); }
  tryCast(id, via) {
    if (this.p.status === 'gripped' && !GRIP_ALLOWED.has(id)) { this.say('Gripped: only Push, Pull, Absorb or Protect'); this.gcd = 0.3; return false; }
    return this.activate(id, via);
  }
  cast(id) { return this.activate(id, 'ai'); }
  activate(id, via = 'key') {
    const pw = POW(id); if (!pw) return false;
    if (!this.use(pw.cost)) { this.gcd = 0.3; return false; }
    this.gcd = 0.25; this.holdVia = via;
    const f = this['do_' + id]; if (f) f.call(this); return true;
  }
  onHurt(dmg) { if (this.npc && ((this.holding === 'heal' && dmg >= 4) || (this.holding === 'lightning' && dmg >= 10))) this.release(); } // a heal / lightning can be broken by a solid hit
  interrupt() { this.pending.length = 0; this.release(); } // a push / pull that lands cancels what the target was casting
  release(silent) { const id = this.holding; if (!id) return; this['end_' + id] && this['end_' + id](silent); this.holding = null; this.beam = null; this.bolts.length = 0; if (this.loops.hold) { this.loops.hold.stop(0.1); this.loops.hold = null; } }
  releaseAll(silent) { this.release(silent); for (const k of Object.keys(this.active)) this.endTimed(k); }
  reset() { this.releaseAll(true); this.pending.length = 0; this.want = {}; this.fp = this.max; this.gcd = 0; this.target = null; this.bodyBolts = null; this.absorbMsgT = 0; }
  // ---------------- grip bookkeeping
  gripperOf(f) { return this.g.gripperOf(f); }
  // a gripped fighter who pushes / pulls with a level >= the grip level breaks it (the gripper is busy, so he cannot counter)
  freeFromGrip(kind) {
    const p = this.p; if (p.status !== 'gripped') return;
    const gr = this.gripperOf(p);
    if (!gr) { p.grip(false, 0, { free: true }); return; }
    if (gripBroken(this.lv[kind], gr.gripBase)) { gr.brokenFree = true; gr.release(); this.g.banner('GRIP BROKEN', [0.55, 0.95, 1]); this.g.sfxAt('push', p.pos, 0.8); }
    else this.say('Too weak to break the grip');
  }
  // ---------------- instant powers
  do_push() {
    const g = this.g, p = this.p; this.freeFromGrip('push');
    const d = this.aim(); const col = this.npc ? [1, 0.5, 0.45] : [0.7, 0.86, 1];
    this.anim('BOTH_FORCEPUSH', { durMs: 680 }); g.sfxAt('push', p.pos, 1); this.shake(0.22);
    this.later(0, () => { // w_force.c ForceThrow: the push lands on the frame it is cast, no wind-up delay
      if (!this.alive()) return;
      const hands = this.hands(); const mid = v3.lerp(hands[0], hands[1], 0.5);
      g.fx.ring({ p: v3.addS(mid, d, 0.3), n: d, r0: 0.25, r1: 2.8, life: 0.55, w: 0.2, c: [col[0], col[1], col[2], 0.95], move: v3.scale(d, 15) });
      g.fx.ring({ p: v3.addS(mid, d, 0.1), n: d, r0: 0.15, r1: 2.0, life: 0.4, w: 0.12, c: [1, 1, 1, 0.8], move: v3.scale(d, 11) });
      for (let i = 0; i < 46; i++) { const sp = v3.norm([d[0] + rnd(-0.35, 0.35), d[1] + rnd(-0.25, 0.3), d[2] + rnd(-0.35, 0.35)]); g.fx.emit({ p: v3.addS(mid, d, 0.3), v: v3.scale(sp, rnd(8, 20)), life: rnd(0.25, 0.55), size: rnd(0.04, 0.1), c0: [col[0], col[1] + 0.05, col[2] + 0.1, 0.8], c1: [col[0] * 0.7, col[1] * 0.8, 1, 0], drag: 1.8 }); }
      for (let i = 0; i < 26; i++) { const a = rnd(-0.5, 0.5), dd = this.flat(d); const dir = [dd[0] * Math.cos(a) - dd[2] * Math.sin(a), 0, dd[0] * Math.sin(a) + dd[2] * Math.cos(a)]; g.fx.emit({ p: [p.pos[0] + dir[0] * rnd(0.5, 5), 0.1, p.pos[2] + dir[2] * rnd(0.5, 5)], v: [dir[0] * rnd(4, 12), rnd(0.5, 2), dir[2] * rnd(4, 12)], life: rnd(0.5, 1), size: rnd(0.15, 0.35), grow: 0.8, c0: [0.45, 0.42, 0.5, 0.3], c1: [0.4, 0.38, 0.45, 0], drag: 2.5, mode: 0 }); }
      for (const h of this.cone(13, 52)) {
        const t = h.t, fall = clamp(1 - h.L / 15, 0.2, 1); const dir = this.flat(h.v);
        if (t.type === 'npc') g.applyThrow(this, t.ref, false, { dir, dist: h.L, fall });
        else { g.world.impulse(t.ref, [dir[0] * (9 + 10 * fall), 3 + 3 * fall, dir[2] * (9 + 10 * fall)]); t.ref.glow = 1; }
      }
    });
  }
  do_pull() {
    const g = this.g, p = this.p; this.freeFromGrip('pull');
    const d = this.aim(); const col = this.npc ? [1, 0.55, 0.5] : [0.6, 0.8, 1];
    this.anim('BOTH_FORCEPULL', { durMs: 560 }); g.sfxAt('pull', p.pos, 1); this.shake(0.12);
    this.later(0, () => { // immediate, like the push
      if (!this.alive()) return;
      const hands = this.hands(); const mid = v3.lerp(hands[0], hands[1], 0.5);
      for (let k = 0; k < 3; k++) g.fx.ring({ p: v3.addS(mid, d, 5 - k * 0.7), n: d, r0: 2.0, r1: 0.2, life: 0.5, w: 0.14, c: [col[0], col[1], col[2], 0.8], move: v3.scale(d, -9) });
      for (let i = 0; i < 40; i++) { const dist = rnd(2, 9); const sp = v3.norm([d[0] + rnd(-0.5, 0.5), d[1] + rnd(-0.3, 0.4), d[2] + rnd(-0.5, 0.5)]); g.fx.emit({ p: v3.addS(mid, sp, dist), v: v3.scale(sp, -rnd(10, 22)), life: dist / 16, size: rnd(0.03, 0.08), c0: [col[0] + 0.1, col[1] + 0.05, 1, 0.9], c1: [col[0] + 0.1, col[1] + 0.05, 1, 0.2] }); }
      for (const h of this.cone(13, 52)) {
        const t = h.t, dir = this.flat(h.v); const flatD = Math.max(0.5, Math.hypot(t.center()[0] - p.pos[0], t.center()[2] - p.pos[2]));
        if (t.type === 'npc') g.applyThrow(this, t.ref, true, { dir, dist: h.L, flatD });
        else { const sp = clamp((flatD - 1.3) / 0.55, 3, 22); g.world.impulse(t.ref, [-dir[0] * sp * t.ref.mass, 4.5 * t.ref.mass, -dir[2] * sp * t.ref.mass]); t.ref.glow = 1; }
      }
    });
  }
  do_mind() {
    const g = this.g, p = this.p; this.anim('BOTH_MINDTRICK1', { durMs: 700 }); g.sfxAt('distract', p.pos, 1);
    this.later(0, () => {
      if (!this.alive()) return;
      const o = this.origin(); g.fx.ring({ p: [o[0], 1.0, o[2]], n: [0, 1, 0], r0: 0.4, r1: 7, life: 0.9, w: 0.12, c: [0.75, 0.5, 1, 0.9] }); g.fx.ring({ p: [o[0], 1.3, o[2]], n: [0, 1, 0], r0: 0.4, r1: 5, life: 0.7, w: 0.08, c: [0.9, 0.8, 1, 0.8] });
      for (const h of this.cone(14, 80, { npcOnly: true })) { const n = h.t.ref; if (n.team === 'enemy') {
        if (n.kind === 'darkjedi') { g.banner('MIND TRICK RESISTED', [1, 0.6, 0.6]); g.fx.ring({ p: [n.pos[0], n.pos[1] + 2.15, n.pos[2]], n: [0, 1, 0], r0: 0.1, r1: 0.5, life: 0.8, w: 0.05, c: [1, 0.3, 0.25, 1] }); g.sfxAt('distractstop', n.pos, 0.7); continue; }
        n.distracted = 8; g.fx.ring({ p: [n.pos[0], n.pos[1] + 2.15, n.pos[2]], n: [0, 1, 0], r0: 0.1, r1: 0.45, life: 1.2, w: 0.05, c: [0.8, 0.55, 1, 1] }); g.hud.msg('Mind trick: enemy confused'); } }
    });
  }
  do_see() {
    const g = this.g; if (this.active.see) { this.endTimed('see'); this.fp += 20; return; }
    this.anim('BOTH_MINDTRICK2', { durMs: 700 }); this.startTimed('see'); g.sfxAt('see', this.p.pos, 1);
  }
  do_speed() { this.anim('BOTH_FORCEHEAL_QUICK', { durMs: 700 }); this.startTimed('speed'); this.g.sfxAt('speed', this.p.pos, 1); }
  do_rage() { this.anim('BOTH_FORCEFOUNTAIN1_START', { durMs: 1100 }); this.startTimed('rage'); this.g.sfxAt('rage', this.p.pos, 1); this.shake(0.3); }
  do_protect() { this.anim('BOTH_FORCEHEAL_QUICK', { durMs: 800 }); this.startTimed('protect'); this.g.sfxAt('protect', this.p.pos, 1); }
  do_absorb() { this.anim('BOTH_FORCEHEAL_QUICK', { durMs: 800 }); this.startTimed('absorb'); this.g.sfxAt('absorb', this.p.pos, 1); }
  do_teamheal() {
    const g = this.g, p = this.p; this.anim('BOTH_FORCEHEAL_QUICK', { durMs: 800 }); g.sfxAt('teamheal', p.pos, 1);
    this.later(0.3, () => { const o = p.pos; g.fx.ring({ p: [o[0], 0.1, o[2]], n: [0, 1, 0], r0: 0.5, r1: 11, life: 1.0, w: 0.2, c: [0.3, 1, 0.5, 0.9] }); g.fx.ring({ p: [o[0], 0.1, o[2]], n: [0, 1, 0], r0: 0.3, r1: 8, life: 0.8, w: 0.1, c: [0.7, 1, 0.8, 0.8] });
      let n = 0; for (const f of g.npcs) if (f.team === 'ally' && f.status !== 'dead' && v3.dist(f.pos, o) < 11) { f.hp = Math.min(f.maxHp, f.hp + 60); f.healFlash = 1.5; n++; g.burstHeal(f); } g.hud.msg(n ? 'Team Heal: ' + n + ' ally healed' : 'Team Heal: no allies in range'); });
  }
  do_teamforce() {
    const g = this.g, p = this.p; this.anim('BOTH_FORCEFOUNTAIN1_START', { durMs: 1100 }); g.sfxAt('teamforce', p.pos, 1);
    this.later(0.5, () => { const o = p.pos; g.fx.ring({ p: [o[0], 0.1, o[2]], n: [0, 1, 0], r0: 0.5, r1: 11, life: 1.0, w: 0.2, c: [0.4, 0.6, 1, 0.9] }); g.fx.ring({ p: [o[0], 1.2, o[2]], n: [0, 1, 0], r0: 0.5, r1: 9, life: 0.9, w: 0.1, c: [0.8, 0.9, 1, 0.8] });
      let n = 0; for (const f of g.npcs) if (f.team === 'ally' && f.status !== 'dead' && v3.dist(f.pos, o) < 11) { f.energized = 8; n++; } g.hud.msg(n ? 'Team Energize: ' + n + ' ally empowered' : 'Team Energize: no allies in range'); });
  }
  // ---------------- timed
  startTimed(id) {
    const g = this.g, p = this.p, q = this.npc ? 0.4 : 1; this.active[id] = { until: g.t + DUR[id], t0: g.t };
    if (id === 'speed') { p.speedMul = this.spd; p.saber.rageMul = this.npc ? 1.2 : 1.35; this.loops.speed = g.sfx.loop('speedloop', { vol: 0.35 * q }); }
    if (id === 'rage') { p.damageMul = 1.7; p.speedMul = Math.max(p.speedMul, this.npc ? 1.2 : 1.3); p.saber.rageMul = this.npc ? 1.45 : 1.7; p.glow = 0.22; p.glowCol = [1, 0.12, 0.08]; this.loops.rage = g.sfx.loop('rageloop', { vol: 0.35 * q }); }
    if (id === 'protect') { p.takeMul = this.protectMul; this.loops.protect = g.sfx.loop('protectloop', { vol: 0.3 * q }); }
    if (id === 'absorb') { this.loops.absorb = g.sfx.loop('absorbloop', { vol: 0.3 * q }); }
    if (id === 'see') { this.loops.see = g.sfx.loop('seeloop', { vol: 0.25 }); }
    if (this.npc) g.hud.msg((p.label || 'Enemy') + ': ' + POW(id).name); else g.hud.msg(POW(id).name + ' active');
  }
  endTimed(id) {
    const p = this.p; delete this.active[id]; if (this.loops[id]) { this.loops[id].stop(0.3); delete this.loops[id]; }
    const rageSpd = this.npc ? 1.2 : 1.3, rageSab = this.npc ? 1.45 : 1.7, spdSab = this.npc ? 1.2 : 1.35;
    if (id === 'speed') { p.speedMul = this.active.rage ? rageSpd : 1; p.saber.rageMul = this.active.rage ? rageSab : 1; p.actor.animSpeed = 1; }
    if (id === 'rage') { p.damageMul = 1; p.speedMul = this.active.speed ? this.spd : 1; p.saber.rageMul = this.active.speed ? spdSab : 1; p.glow = 0; }
    if (id === 'protect') p.takeMul = 1;
  }
  tickTimed(id, dt) {
    const g = this.g, p = this.p, c = p.chest();
    if (id === 'speed') { if (Math.hypot(p.vel[0], p.vel[2]) > 2 && Math.random() < 0.7) g.fx.emit({ p: [p.pos[0] + rnd(-0.3, 0.3), rnd(0.3, 1.5), p.pos[2] + rnd(-0.3, 0.3)], v: [-p.vel[0] * 0.15, 0, -p.vel[2] * 0.15], life: 0.4, size: 0.09, grow: 0.2, c0: [0.5, 0.8, 1, 0.7], c1: [0.3, 0.5, 1, 0] }); }
    if (id === 'rage') { p.glow = 0.16 + 0.1 * Math.sin(g.t * 9); if (Math.random() < 0.8) g.fx.emit({ p: [p.pos[0] + rnd(-0.4, 0.4), rnd(0.1, 1.6), p.pos[2] + rnd(-0.4, 0.4)], v: [0, rnd(0.8, 2.2), 0], life: 0.6, size: rnd(0.05, 0.12), c0: [1, 0.2, 0.05, 0.8], c1: [0.6, 0, 0, 0] }); }
    if (id === 'protect' || id === 'absorb') {
      const col = id === 'protect' ? [0.3, 0.9, 0.7] : [0.7, 0.4, 1];
      if (Math.random() < 0.5) { const a = rnd(0, 6.28), b = rnd(-1, 1); g.fx.emit({ p: [c[0] + Math.cos(a) * 1.05, c[1] + b * 0.9, c[2] + Math.sin(a) * 1.05], v: [0, 0.5, 0], life: 0.5, size: 0.06, c0: [col[0], col[1], col[2], 0.8], c1: [col[0], col[1], col[2], 0] }); }
    }
  }
  // ---------------- held powers
  do_grip() {
    const g = this.g, p = this.p; const c = this.cone(14, 28)[0];
    if (!c) { this.fp += 12; this.say('Force Grip: no target'); return; }
    const t = c.t;
    if (t.type === 'npc') {
      const v = t.ref, VF = g.forceOf(v);
      const why = gripBlocker({ att: g.gripSnap(p, this.fp + 12, 12), tgt: g.gripSnap(v, VF ? VF.fp : 0, 12), dist: c.L, inFront: c.dot > 0.8 });
      if (why) { this.fp += 12; this.say(GRIP_WHY[why] || ('Force Grip: ' + why)); this.gcd = 0.35; if (why === 'out of range') g.banner('OUT OF GRIP RANGE', [1, 0.8, 0.5]); return; }
      const eff = gripEffectiveLevel(this.absorbDef(v), this.lv.grip, 12);
      if (eff.level <= 0) { // Force Absorb cancels the grip before it takes hold
        if (VF) VF.fp = Math.min(VF.max, VF.fp + eff.fpGain); g.banner('GRIP ABSORBED', [0.78, 0.5, 1]); g.sfxAt('absorbhit', v.pos, 1); g.fx.sparks(v.chest(), [0, 1, 0], 10, [0.7, 0.4, 1, 1]);
        this.anim('BOTH_FORCEGRIP_HOLD', { durMs: 450 }); this.gcd = 0.6; return;
      }
      this.gripBase = this.lv.grip; this.gripLevel = eff.level;
      const ph = gripPhase(this.gripLevel, 0);
      v.grip(true, ph.lift ? 1.45 : 0, { carry: ph.carry ? () => this.carryPoint() : null });
    }
    this.holding = 'grip'; this.target = t; this.gripT = 0; this.gripCracked = false; this.brokenFree = false;
    this.anim('BOTH_FORCEGRIP_HOLD', { durMs: 300, hold: true }); g.sfxAt('grip', p.pos, 1); this.loops.hold = g.sfx.loop('heal', { vol: 0.0 });
  }
  carryPoint() { const f = this.flat(this.aim()), p = this.p.pos; return [p[0] + f[0] * 2.4, 0, p[2] + f[2] * 2.4]; }
  tickHold(id, dt) { const f = this['tick_' + id]; if (f) f.call(this, dt); }
  tick_grip(dt) {
    const g = this.g, p = this.p, t = this.target; if (!t || (t.type === 'npc' && t.ref.status === 'dead')) { this.release(); return; }
    this.fp -= 14 * dt; this.gripT += dt;
    const c = t.center(), hands = this.hands(), h = v3.lerp(hands[0], hands[1], 0.5);
    if (t.type === 'npc') {
      const v = t.ref, VF = g.forceOf(v);
      if (v.status !== 'gripped') { this.release(); return; } // knocked out of it some other way
      if (VF && VF.active.absorb) { // Force Absorb raised while gripped lowers (or cancels) the grip
        const eff = gripEffectiveLevel(this.absorbDef(v), this.gripBase, 12);
        if (eff.level < this.gripLevel) { this.gripLevel = eff.level; if (eff.level <= 0) { VF.fp = Math.min(VF.max, VF.fp + eff.fpGain); g.banner('GRIP ABSORBED', [0.78, 0.5, 1]); g.sfxAt('absorbhit', v.pos, 1); this.brokenFree = true; this.release(); return; } }
      }
      const ph = gripPhase(this.gripLevel, this.gripT);
      v.gripLift = ph.lift ? 1.45 : 0; if (ph.carry && !v.gripCarry) v.gripCarry = () => this.carryPoint();
      v.hurt(ph.dps * dt * p.damageMul * this.dmgScale, p, { noFlinch: true });
      if (!this.gripCracked && this.gripT >= ph.crackAt && ph.crack > 0) {
        this.gripCracked = true; v.hurt(ph.crack * p.damageMul * this.dmgScale, p, { noFlinch: true }); g.sfxAt('hit3', v.pos, 0.9); g.fx.sparks(c, [0, 1, 0], 14, [1, 0.35, 0.15, 1]); g.fx.ring({ p: c, n: [0, 1, 0], r0: 0.2, r1: 1.4, life: 0.35, w: 0.08, c: [1, 0.3, 0.15, 0.95] });
        if (v.isPlayer) { g.hud.hit(ph.crack); this.g.shake(0.3); } else this.shake(0.15);
      }
      if (v.status === 'dead') { this.release(); return; }
      if (ph.end) { this.release(); return; }
    } else { const b = t.ref; b.lifted = 0.2; const ty = 1.7; b.vel[1] += (ty - b.pos[1]) * 6 * dt - b.vel[1] * 4 * dt; b.vel[0] += (p.pos[0] + this.flat(this.aim())[0] * 4.5 - b.pos[0]) * 2 * dt; b.vel[2] += (p.pos[2] + this.flat(this.aim())[2] * 4.5 - b.pos[2]) * 2 * dt; b.glow = 0.7; b.pos[1] += (ty - b.pos[1]) * Math.min(1, dt * 3); }
    this.beam = { a: h, b: c, col: [1, 0.25, 0.12] };
    if (Math.random() < 0.9) { const k = Math.random(); g.fx.emit({ p: v3.lerp(h, c, k), v: [rnd(-0.4, 0.4), rnd(-0.2, 0.4), rnd(-0.4, 0.4)], life: 0.4, size: rnd(0.03, 0.07), c0: [1, 0.35, 0.1, 0.9], c1: [0.8, 0.1, 0.05, 0] }); }
    if (Math.floor(this.gripT * 6) !== Math.floor((this.gripT - dt) * 6)) g.fx.ring({ p: c, n: v3.norm(v3.sub(h, c)), r0: 0.7, r1: 0.25, life: 0.35, w: 0.05, c: [1, 0.3, 0.15, 0.9], seg: 24 });
    if (t.type === 'npc' && v3.dist(c, p.chest()) > 16) this.release();
  }
  end_grip(silent) {
    const t = this.target; this.target = null;
    if (t && t.type === 'npc' && t.ref.status === 'gripped') t.ref.grip(false, 0, { free: this.brokenFree, soft: this.gripLevel <= 1 });
    if (t && t.type === 'prop') { t.ref.lifted = 0; }
    this.brokenFree = false; this.p.endForce();
  }
  do_lightning() {
    const g = this.g, p = this.p; this.holding = 'lightning'; this.anim('BOTH_FORCELIGHTNING_START', { durMs: 160, hold: true }); this.lt = 0; this.ltPhase = 'start';
    g.sfxAt('lightning', p.pos, 1); this.loops.hold = g.sfx.loop('lightning2', { vol: this.npc ? 0.18 : 0.35 }); this.regenBolts(); this.hitT = 0;
  }
  regenBolts() {
    const g = this.g, hands = this.hands(); const d = this.aim(); const list = this.cone(11, 52).slice(0, 3); this.bolts.length = 0;
    const mk = (a, b, w = 1, jit = 0.22) => { const pts = bolt(a, b, 9, jit); const br = []; if (Math.random() < 0.6) { const k = 2 + Math.floor(Math.random() * 5), s = pts[k]; const e = v3.addS(s, v3.norm([rnd(-1, 1), rnd(-0.5, 1), rnd(-1, 1)]), rnd(0.5, 1.4)); br.push(bolt(s, e, 4, 0.12)); } this.bolts.push({ pts, br, w }); };
    if (list.length) { for (const h of list) { const c = h.t.center(); mk(hands[0], c, 1); mk(hands[1], v3.addS(c, [rnd(-0.2, 0.2), rnd(-0.3, 0.3), rnd(-0.2, 0.2)], 1), 0.9); } }
    else { for (let i = 0; i < 3; i++) { const e = v3.addS(v3.addS(hands[i % 2], d, rnd(3, 6.5)), [rnd(-2.2, 2.2), rnd(-1.6, 0.8), rnd(-2.2, 2.2)], 1); e[1] = Math.max(0.05, e[1]); mk(hands[i % 2], e, 0.9, 0.3); } }
    this.ltTargets = list;
  }
  tick_lightning(dt) {
    const g = this.g, p = this.p; this.fp -= 14 * dt; this.lt += dt;
    if (this.ltPhase === 'start' && this.lt > 0.16) { this.ltPhase = 'hold'; this.anim('BOTH_FORCELIGHTNING_HOLD', { durMs: 300, hold: true, loop: true }); }
    this.hitT -= dt; const hands = this.hands();
    for (const h of (this.ltTargets || [])) {
      const t = h.t;
      if (t.type === 'npc') {
        const v = t.ref; if (v.status === 'dead') continue;
        const VF = g.forceOf(v), lm = lightningMul(this.absorbDef(v), this.lv.lightning, 1);
        if (lm.mul <= 0) { if (VF) VF.fp = Math.min(VF.max, VF.fp + 12 * dt); this.absorbFx(v, dt); continue; } // Force Absorb: no damage, the absorber gains Force
        if (v.kind === 'darkjedi' || v.isPlayer) v.electrify(0.25); else v.shock(true); // fighters keep control, training droids are stunned
        v.hurt(26 * dt * p.damageMul * this.dmgScale * lm.mul, p, { noFlinch: true });
        if (v.status === 'dead' && !v.zapped) { v.zapped = true; }
        if (!v.isPlayer && v.kind !== 'darkjedi') this.bodyArcs(v);
        if (this.hitT <= 0) { g.sfxAt('lhit' + (1 + Math.floor(Math.random() * 3)), t.center(), 0.7); }
        if (Math.random() < 0.6) g.fx.sparks(t.center(), [0, 1, 0], 2, [0.6, 0.8, 1, 1]);
      } else {
        t.ref.flash = 1; t.ref.hp -= 10 * dt;
        if (this.hitT <= 0) { g.sfxAt('lhit' + (1 + Math.floor(Math.random() * 3)), t.center(), 0.7); }
        if (Math.random() < 0.6) g.fx.sparks(t.center(), [0, 1, 0], 2, [0.6, 0.8, 1, 1]);
      }
    }
    if (this.hitT <= 0) this.hitT = 0.28;
    for (const hnd of hands) if (Math.random() < 0.5) g.fx.emit({ p: hnd, v: [rnd(-1, 1), rnd(-0.5, 1.2), rnd(-1, 1)], life: 0.25, size: 0.04, c0: [0.7, 0.85, 1, 1], c1: [0.4, 0.5, 1, 0] });
    g.lightFlash = 0.6; g.lightFlashPos = hands[0];
  }
  absorbFx(v, dt) {
    const g = this.g; if (Math.random() < 0.7) g.fx.sparks(v.chest(), [0, 1, 0], 2, [0.75, 0.45, 1, 1]);
    if (this.absorbMsgT <= 0) { this.absorbMsgT = 0.9; g.sfxAt('absorbhit', v.pos, 0.8); g.banner('LIGHTNING ABSORBED', [0.78, 0.5, 1]); }
  }
  bodyArcs(n) { this.g.bodyArc(n); }
  end_lightning(silent) { if (!silent) this.p.playForce('BOTH_FORCELIGHTNING_RELEASE', { durMs: 420 }); this.ltTargets = []; this.g.lightFlash = 0; }
  do_heal() {
    const g = this.g, p = this.p; this.holding = 'heal'; p.playForce('BOTH_FORCEHEAL_START', { durMs: 400, hold: true }); this.healT = 0; // torso only: keep moving while healing g.sfxAt('heal', p.pos, 1);
    this.later(0.0, () => { }); this.loops.hold = g.sfx.loop('heal2', { vol: 0.0 });
  }
  tick_heal(dt) {
    const g = this.g, p = this.p; this.healT += dt; this.fp -= 10 * dt; p.hp = Math.min(p.maxHp, p.hp + this.healRate * dt); p.healFlash = 0.6;
    if (Math.random() < 0.9) { const a = rnd(0, 6.28), r = rnd(0.2, 0.8); g.fx.emit({ p: [p.pos[0] + Math.cos(a) * r, rnd(0.1, 0.6), p.pos[2] + Math.sin(a) * r], v: [0, rnd(0.7, 1.8), 0], life: rnd(0.8, 1.4), size: rnd(0.04, 0.1), c0: [0.4, 1, 0.55, 0.9], c1: [0.2, 0.9, 0.4, 0] }); }
    if (Math.floor(this.healT * 1.4) !== Math.floor((this.healT - dt) * 1.4)) { g.fx.ring({ p: [p.pos[0], 0.05, p.pos[2]], n: [0, 1, 0], r0: 0.2, r1: 1.6, life: 0.9, w: 0.1, c: [0.35, 1, 0.5, 0.8] }); g.sfxAt('heal' + (1 + Math.floor(Math.random() * 4)), p.pos, 0.35); }
    if (p.hp >= p.maxHp && this.healT > 1.2) this.release();
  }
  end_heal(silent) { const p = this.p; p.forceHold = false; if (!silent) p.playForce('BOTH_FORCEHEAL_STOP', { durMs: 650 }); }
  do_drain() {
    const g = this.g, p = this.p; const c = this.cone(10, 30, { npcOnly: true })[0]; if (!c) { this.fp += 10; this.say('Force Drain: no target'); return; }
    this.holding = 'drain'; this.target = c.t; this.anim('BOTH_FORCEGRIP_HOLD', { durMs: 300, hold: true }); g.sfxAt('drain', p.pos, 1); this.dt2 = 0;
  }
  tick_drain(dt) {
    const g = this.g, p = this.p, t = this.target; if (!t || t.ref.status === 'dead') { this.release(); return; }
    const v = t.ref, VF = g.forceOf(v), lm = lightningMul(this.absorbDef(v), this.lv.drain, 1);
    const c = t.center(), hands = this.hands(), h = v3.lerp(hands[0], hands[1], 0.5);
    if (lm.mul <= 0) { if (VF) VF.fp = Math.min(VF.max, VF.fp + 12 * dt); g.banner('DRAIN ABSORBED', [0.78, 0.5, 1]); this.release(); return; }
    this.fp += 3 * dt; p.hp = Math.min(p.maxHp, p.hp + 9 * dt * lm.mul); v.hurt(15 * dt * p.damageMul * this.dmgScale * lm.mul, p, { noFlinch: true }); if (v.kind === 'darkjedi' || v.isPlayer) v.electrify(0.25); else v.shock(true); this.dt2 += dt;
    this.beam = { a: h, b: c, col: [0.8, 0.2, 1] };
    for (let i = 0; i < 2; i++) { const k = Math.random(); g.fx.emit({ p: v3.lerp(c, h, k), v: v3.scale(v3.norm(v3.sub(h, c)), 5), life: 0.3, size: 0.05, c0: [0.85, 0.3, 1, 0.9], c1: [0.5, 0.1, 0.8, 0] }); }
    if (this.dt2 > 0.5) { this.dt2 = 0; g.sfxAt('drained', v.pos, 0.5); }
    if (v3.dist(c, p.chest()) > 12) this.release();
  }
  end_drain() { this.p.endForce(); this.target = null; }
  // ---------------- drawing
  draw(R) {
    const g = this.g;
    if (this.beam) { const b = this.beam; const pts = bolt(b.a, b.b, 14, 0.06); for (let i = 0; i < pts.length - 1; i++) { R.beam(pts[i], pts[i + 1], 0.06, [b.col[0], b.col[1], b.col[2], 0.3]); R.beam(pts[i], pts[i + 1], 0.018, [1, 0.8 + b.col[1] * 0.2, 0.8, 0.9]); } }
    if (this.holding === 'lightning') for (const bl of this.bolts) { drawBolt(R, bl.pts, [0.55, 0.75, 1], bl.w); for (const br of bl.br) drawBolt(R, br, [0.55, 0.75, 1], 0.55); }
    const c = this.p.chest();
    for (const id of ['protect', 'absorb']) if (this.active[id]) { const col = id === 'protect' ? [0.3, 0.9, 0.7] : [0.7, 0.4, 1]; const pulse = 0.5 + 0.15 * Math.sin(g.t * 5); R.billboard(c, 1.55, [col[0], col[1], col[2], 0.20 * pulse], 0); R.billboard(c, 1.2, [col[0], col[1], col[2], 0.12], 0); }
    if (this.active.rage) R.billboard(c, 1.4, [1, 0.1, 0.05, 0.12 + 0.05 * Math.sin(g.t * 8)], 0);
    if (this.active.speed) R.billboard(c, 1.3, [0.4, 0.7, 1, 0.07], 0);
  }
}
function POW(id) { return POWER_BY_ID[id]; }
