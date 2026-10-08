/* eslint-disable */
// Game orchestration: arena, player + force, NPCs, camera, update loop, rendering, hooks used by fighter/force/combat.
import { m4, v3, clamp, lerp } from './math.js';
import { World } from './world.js';
import { FX } from './fx.js';
import { Sfx } from './audio.js';
import { Input } from './input.js';
import { Fighter } from './fighter.js';
import { Force, POWERS, SELECT_ORDER, SELECT_ALL } from './force.js';
import { resolveThrow } from './forcerules.js';
import { Combat } from './combat.js';
import { HUD, HELP_DUEL } from './hud.js';
import { aiDroid, aiDuelist, aiAlly } from './ai.js';
import { aiDarkJedi } from './darkjedi.js';
import { bolt, drawBolt } from './fx.js';
import { geo } from './gl.js';

const STEP = 1 / 60;
const rnd = (a, b) => a + Math.random() * (b - a);
const SPAWN = [0, 0, -9];
const clearCmd = c => { c.fwd = c.right = c.up = 0; c.walk = c.crouch = c.attack = c.alt = c.jump = c.jumpPressed = c.crouchPressed = false; };

export class Game {
  constructor(R, A, canvas, hudCanvas, opts = {}) {
    this.opts = opts; this.mode = opts.mode || 'explorer'; this.duel = this.mode === 'duel'; this.boss = null; this.round = { state: 'intro', t: 0 }; this.arcs = []; this.disposed = false;
    this.R = R; this.A = A; this.skel = A.skel; this.saberData = A.saberData; this.attach = A.attach; this.canvas = canvas;
    this.t = 0; this.dtFrame = STEP; this.fps = 60; this.acc = 0; this.started = false; this.flashes = []; this.lightFlash = 0; this.lightFlashPos = [0, 2, 0]; this.shakeAmt = 0; this.frameNo = 0;
    this.bodyMesh = R.uploadSkinned(A.body); this.hiltMesh = R.uploadStatic(A.hilt); this.lodMesh = A.lod ? R.uploadSkinned(A.lod) : this.bodyMesh;
    const gun = geo(); gun.box(0, 0.03, 0, 0.05, 0.13, 0.06, [0.16, 0.16, 0.19, 1]).box(0, -0.12, 0, 0.045, 0.2, 0.05, [0.32, 0.33, 0.38, 1]).box(0, -0.235, 0, 0.03, 0.05, 0.03, [0.9, 0.25, 0.15, 1]); this.gunMesh = R.uploadStatic(gun.build());
    this.world = new World(R); this.fx = new FX(R); this.sfx = new Sfx(opts.sfxBase); this.input = new Input(canvas); this.hud = new HUD(hudCanvas); this.npcs = [];
    this.input.onFirstGesture = () => this.startAudio();
    if (this.duel) { this.input.wheelThrottle = 90; const h = this.hud; h.helpList = HELP_DUEL; h.helpW = 820; h.title = 'DARK JEDI DUEL'; h.subtitle = 'Jedi Outcast Force rules  ·  click to start'; h.debug = false; }
    this.player = new Fighter(this, { name: 'player', isPlayer: true, team: 'player', pos: SPAWN, yaw: 0, hp: 100, bladeColor: [0.22, 0.52, 1] }); this.player.label = 'You'; this.player.humId = 0;
    this.force = new Force(this, this.player, { list: this.duel ? SELECT_ORDER : SELECT_ALL }); this.player.force = this.force; this.combat = new Combat(this);
    this.world.onThud = b => { if (b.vel[1] < -4) this.sfxAt('hit1', b.pos, 0.5); };
    this.populate();
    this.cam = { yaw: 0, pitch: 0.2, dist: 3.7, pos: [SPAWN[0], 1.4, SPAWN[2]], eye: [0, 2, -13], target: [0, 1.4, -9], fov: 62 * Math.PI / 180 };
    this.firstSub = true;
    const I = this.input; // 'Mouse1' = middle button (use the selected Force power)
    this.inp = { pressed: c => this.firstSub && (c === 'Mouse1' ? I.btnPressed[1] : I.pressed(c)), held: c => c === 'Mouse1' ? !!I.btn[1] : I.held(c), released: c => I.released(c) };
    this.fireT = 0;
  }
  populate() {
    if (this.duel) return this.populateDuel();
    const droidTints = [[0.55, 0.75, 1.0], [0.9, 0.8, 0.5], [0.7, 1.0, 0.75]];
    [[9, 3], [-9, 6], [4, 15]].forEach(([x, z], i) => this.addNpc('droid', x, z, { name: 'droid' + i, label: 'Training Droid', team: 'enemy', hp: 70, tint: droidTints[i], tintAmt: 0.42, saber: false, yaw: Math.PI + 0.4 * i }));
    this.duelist = this.addNpc('duelist', 0, 7, { name: 'duelist', label: 'Sith Duelist', team: 'enemy', hp: 170, tint: [0.62, 0.22, 0.22], tintAmt: 0.3, saber: true, blade: [1, 0.08, 0.06], yaw: Math.PI, dmgScale: 0.55, blockSkill: 0.5 });
    this.ally = this.addNpc('ally', -7, -4, { name: 'ally', label: 'Jedi Ally', team: 'ally', hp: 100, tint: [0.35, 0.7, 0.45], tintAmt: 0.3, saber: true, blade: [0.2, 1, 0.3], yaw: 0.6 }); this.ally.hp = 50;
  }
  populateDuel() {
    // one opponent: a Dark Jedi with the same Force powers, costs and rules as the player
    const b = this.addNpc('darkjedi', 0, 8, { name: 'darkjedi', label: 'Dark Jedi', team: 'enemy', hp: 220, tint: [0.12, 0.09, 0.17], tintAmt: 0.66, saber: true, blade: [1, 0.05, 0.04], yaw: Math.PI, dmgScale: 0.6, blockSkill: 0.55 });
    b.reaction = 0.7; b.maxHp = 220; b.hp = 220; b.spawn = [0, 0, 8]; b.setStyle(2);
    b.force = new Force(this, b, { npc: true, fp: 100, regen: 7, dmgScale: 0.75, healRate: 18, speedGain: 1.4, protectMul: 0.4, list: SELECT_ORDER });
    this.boss = b; this.readySaber(this.player);
    this.round = { state: 'intro', t: 0 };
  }
  readySaber(f) { f.saber.holstered = true; f.blade.set(false); f.blade.len = 0; f.hilt = 'thigh'; f.igniteNow(); }
  addNpc(kind, x, z, o) {
    const f = new Fighter(this, { name: o.name, kind, team: o.team, pos: [x, 0, z], yaw: o.yaw || 0, hp: o.hp, tint: o.tint, tintAmt: o.tintAmt, hasSaber: o.saber, bladeColor: o.blade });
    f.label = o.label; f.blockSkill = o.blockSkill; f.dmgScale = o.dmgScale; f.targetYaw = f.yaw; f.humId = this.npcs.length + 1; f.healFlash = 0; f.provoked = true;
    if (kind === 'duelist' || kind === 'darkjedi') f.setStyle(2);
    this.npcs.push(f); if (o.saber) { f.igniteNow(); f.quickIgnited = true; } return f;
  }
  // ---------------- hooks used by Fighter / Force / Combat
  sfxAt(name, pos, vol = 1) { if (vol <= 0) return; this.sfx.play(name, { pos, vol, vary: 0.06 }); }
  humStart(f) {
    if (f.hum) return; const base = f.isPlayer ? 0.17 : 0.07; f.humBase = base; f.hum = this.sfx.loop('hum' + (1 + (f.humId || 0) % 4), { vol: base, rate: 1 + (f.humId || 0) * 0.03 });
  }
  humStop(f) { if (f.hum) { f.hum.stop(0.1); f.hum = null; } }
  async startAudio() {
    this.sfx.resume(); try { await this.sfx.loading; } catch (e) { }
    for (const f of [this.player, ...this.npcs]) if (!f.saber.holstered && f.hasSaber) { f.hum = null; this.humStart(f); }
  }
  onSwing(f, move) { const lv = f.saber.level; this.sfx.play(Math.random() < 0.5 ? 'swing1' : 'swing2', { pos: f.pos, vol: f.isPlayer ? 0.8 : 0.55, rate: (lv === 1 ? 1.12 : lv === 3 ? 0.88 : 1) * (f.saber.rageMul > 1 ? 1.1 : 1), vary: 0.1 }); }
  onThud(f) { this.sfxAt('hit1', f.pos, 0.7); this.dust(f.pos, 0.9, 10); if (f.isPlayer) this.shake(0.18); }
  onLand(f, impact) { if (impact > 8) { this.dust(f.pos, 0.6 + impact * 0.03, 8); } if (f.isPlayer && impact > 12) this.shake(0.12 + impact * 0.01); if (impact > 15) this.sfxAt('hit1', f.pos, 0.5); }
  onDeath(f) { this.sfxAt('hit3', f.pos, 0.8); this.dust(f.pos, 1.0, 12); if (f.isPlayer) this.hud.msg(this.duel ? 'The Dark Jedi has bested you' : 'You were slain'); if (this.duel) { if (f === this.boss) this.endRound('won'); else if (f.isPlayer) this.endRound('lost'); } }
  endRound(state) { if (this.round.state === 'won' || this.round.state === 'lost') return; this.round = { state, t: 0 }; this.hud.banners.length = 0; } // the result overlay in hud.js replaces any banner
  onForceJump(f) { this.sfxAt('jump', f.pos, 0.9); this.sfxAt('jumpbuild', f.pos, 0.5); this.fx.ring({ p: [f.pos[0], 0.05, f.pos[2]], n: [0, 1, 0], r0: 0.3, r1: 2.2, life: 0.5, w: 0.14, c: [0.6, 0.85, 1, 0.9] }); this.dust(f.pos, 1.0, 14); if (f.isPlayer) this.shake(0.12); }
  dust(p, size = 0.8, n = 8) { for (let i = 0; i < n; i++) { const a = rnd(0, 6.28); this.fx.emit({ p: [p[0] + Math.cos(a) * 0.3, 0.08, p[2] + Math.sin(a) * 0.3], v: [Math.cos(a) * rnd(0.8, 2.6) * size, rnd(0.2, 0.9), Math.sin(a) * rnd(0.8, 2.6) * size], life: rnd(0.4, 0.9), size: rnd(0.12, 0.28), grow: 0.5, c0: [0.5, 0.48, 0.55, 0.22], c1: [0.4, 0.38, 0.45, 0], drag: 2.5 }); } }
  shake(a) { this.shakeAmt = Math.max(this.shakeAmt, a); }
  flashLight(p, c, dur = 0.2) { this.flashes.push({ p: p.slice(), c, t: dur, max: dur }); if (this.flashes.length > 6) this.flashes.shift(); }
  burstHeal(f) { const p = f.pos; for (let i = 0; i < 30; i++) { const a = rnd(0, 6.28), r = rnd(0.2, 0.7); this.fx.emit({ p: [p[0] + Math.cos(a) * r, rnd(0.1, 1.2), p[2] + Math.sin(a) * r], v: [0, rnd(0.8, 2.2), 0], life: rnd(0.8, 1.4), size: rnd(0.04, 0.1), c0: [0.4, 1, 0.55, 0.9], c1: [0.2, 0.9, 0.4, 0] }); } this.fx.ring({ p: [p[0], 0.05, p[2]], n: [0, 1, 0], r0: 0.2, r1: 1.6, life: 0.9, w: 0.1, c: [0.35, 1, 0.5, 0.8] }); }
  targets() {
    const out = []; for (const n of this.npcs) if (n.status !== 'dead') out.push({ type: 'npc', ref: n, center: () => n.chest() });
    for (const b of this.world.bodies) out.push({ type: 'prop', ref: b, center: () => [b.pos[0], b.pos[1] + 0.5, b.pos[2]] }); return out;
  }
  // ---------------- Force rules glue (rules live in forcerules.js; this builds the state they need and applies the outcome)
  forceOf(f) { return f.isPlayer ? this.force : (f.force || null); }
  forces() { const a = [this.force]; for (const n of this.npcs) if (n.force) a.push(n.force); return a; }
  gripperOf(f) { for (const F of this.forces()) if (F.holding === 'grip' && F.target && F.target.type === 'npc' && F.target.ref === f) return F; return null; }
  banner(text, col = [1, 1, 1], life = 1.5) { this.hud.banner(text, col, life); }
  gripSnap(f, fp, cost) { // state for gripBlocker() (ForceGrip)
    const now = this.t; return { alive: f.status !== 'dead' && f.hp > 0, busy: f.forceUntil > now || f.status === 'roll', swinging: f.saber.weaponTime > 0, fp, cost, gripped: f.status === 'gripped', crippled: f.gripCripple > now || f.status === 'flung' || f.status === 'getup' };
  }
  defSnapshot(f, att, pull) { // state of the defender for resolveThrow() (CanCounterThrow + ForceThrow)
    const now = this.t, F = this.forceOf(f), c = f.cmd, kind = pull ? 'pull' : 'push';
    const dx = att.pos[0] - f.pos[0], dz = att.pos[2] - f.pos[2], dl = Math.hypot(dx, dz) || 1;
    return {
      alive: f.status !== 'dead' && f.hp > 0, level: F ? F.lv[kind] : 0, moving: !!(c.fwd || c.right), busy: f.status !== 'normal' || f.forceUntil > now || f.counterUntil > now,
      swinging: f.saber.weaponTime > 0, onGround: f.onGround && f.pos[1] < 0.06, fp: F ? F.fp : 0, cost: 20,
      absorbActive: !!(F && F.active.absorb), absorbLevel: F ? F.lv.absorb : 0, facing: (Math.sin(f.yaw) * dx + Math.cos(f.yaw) * dz) / dl > 0.15,
      knockedDown: f.status === 'down' || f.status === 'flung', reaction: f.reaction,
    };
  }
  applyThrow(F, victim, pull, o = {}) {
    const att = F.p, kind = pull ? 'pull' : 'push', vp = victim.isPlayer, ap = att.isPlayer, VF = this.forceOf(victim);
    if (victim.status === 'dead' || victim.team === att.team) return null;
    const dist = o.dist ?? 5, fall = o.fall ?? clamp(1 - dist / 15, 0.2, 1), dir = o.dir;
    const def = this.defSnapshot(victim, att, pull);
    const res = resolveThrow({ attackerLevel: F.lv[kind], pull, def, dist, forceSpent: 20 });
    if (res.fpGain && VF) VF.fp = Math.min(VF.max, VF.fp + res.fpGain);
    const why = { moving: 'moving', 'mid-swing': 'mid-swing', airborne: 'airborne', 'low Force': 'low on Force', recovering: 'recovering', 'caught off guard': 'caught off guard', 'no Force': '' }[res.reason] ?? res.reason;
    const NAME = pull ? 'PULL' : 'PUSH', mid = victim.chest();
    const note = (txt, col, life) => { if (vp || ap) this.banner(txt, col, life); };
    if (res.countered) { // the defender answers with a push / pull of his own (no Force cost, short lockout)
      victim.counterUntil = this.t + (pull ? 0.6 : 1.0);
      if (victim.status === 'normal') victim.playForce(pull ? 'BOTH_FORCEPULL' : 'BOTH_FORCEPUSH', { durMs: pull ? 450 : 700 });
      this.sfxAt(pull ? 'pull' : 'push', victim.pos, 0.9);
      const back = [-dir[0], 0, -dir[2]]; this.fx.ring({ p: v3.addS(mid, back, 0.5), n: back, r0: 0.25, r1: 2.2, life: 0.45, w: 0.16, c: [0.75, 0.9, 1, 0.95], move: v3.scale(back, 12) });
    }
    switch (res.outcome) {
      case 'absorbed':
        this.sfxAt('absorbhit', victim.pos, 1); this.fx.sparks(mid, [0, 1, 0], 12, [0.7, 0.4, 1, 1]);
        note(vp ? 'ABSORBED  +' + res.fpGain + ' FP' : 'ABSORBED', [0.78, 0.5, 1]); break;
      case 'countered':
        this.sfxAt('hit2', mid, 0.4); this.fx.sparks(mid, [0, 1, 0], 8, [0.7, 0.85, 1, 1]);
        note(vp ? 'FORCE ' + NAME + ' BLOCKED' : 'COUNTERED', vp ? [0.55, 0.95, 1] : [1, 0.65, 0.35]); break;
      default: {
        const sc = res.scale, sp = pull ? clamp(((o.flatD ?? dist) - 1.3) / 0.48, 3, 26) : 0;
        if (VF) VF.interrupt();
        if (res.outcome === 'staggered') { // partly stopped: slides, keeps footing
          victim.shove(pull ? [-dir[0], 0, -dir[2]] : dir, (pull ? 9 : 8) * sc * (0.6 + 0.4 * fall)); this.sfxAt('hit1', victim.pos, 0.5);
          note(vp ? NAME + ' PARTLY BLOCKED' : 'PARTLY BLOCKED', [0.75, 0.95, 0.8]);
        } else if (pull) {
          victim.pullTo([-dir[0], 0, -dir[2]], Math.max(3, sp * (0.55 + 0.45 * sc))); this.sfxAt('hit1', victim.pos, 0.6);
          note(vp ? 'PULLED' + (why ? '  ·  ' + why : '') : (res.outcome === 'knockdown' ? 'KNOCKDOWN' : 'PULL HIT'), vp ? [1, 0.5, 0.4] : [0.7, 1, 0.75]);
          if (vp) { this.shake(0.25); this.hud.hit(3); }
        } else if (res.outcome === 'knockdown') {
          const k = 0.5 + 0.5 * sc; victim.push(dir, (6 + 7 * fall) * k, (3.6 + 2.4 * fall) * k, { keepYaw: false }); const dmg = 6 * (F.dmgScale ?? 1); victim.hurt(dmg, att, { noFlinch: true }); this.sfxAt('hit2', victim.pos, 0.6);
          note(vp ? 'KNOCKED DOWN' + (why ? '  ·  ' + why : '') : 'KNOCKDOWN', vp ? [1, 0.45, 0.35] : [0.7, 1, 0.75]); if (vp) { this.shake(0.35); this.hud.hit(dmg); }
        } else { // a hit that does not knock down: breaks the swing and slides the target back
          victim.stagger(dir, (9 + 4 * fall) * sc); const dmg = 3 * (F.dmgScale ?? 1); victim.hurt(dmg, att, { noFlinch: true }); this.sfxAt('hit1', victim.pos, 0.6);
          note(vp ? 'PUSHED' + (why ? '  ·  ' + why : '') : 'PUSH HIT' + (why ? '  ·  ' + why : ''), vp ? [1, 0.55, 0.4] : [0.7, 1, 0.75]); if (vp) { this.shake(0.28); this.hud.hit(dmg); }
        }
      }
    }
    return res;
  }
  bodyArc(n) { if (Math.random() < 0.5) return; const names = ['lhand', 'rhand', 'cranium', 'lradius', 'rradius', 'ltibia', 'rtibia', 'thoracic']; const a = n.actor.bonePos(names[Math.floor(Math.random() * names.length)]), b = n.actor.bonePos(names[Math.floor(Math.random() * names.length)]); this.arcs.push({ pts: bolt(a, b, 5, 0.15), t: 0.06 }); }
  drawArcs(R) { for (let i = this.arcs.length - 1; i >= 0; i--) { const b = this.arcs[i]; drawBolt(R, b.pts, [0.6, 0.8, 1], 0.5); b.t -= this.dtFrame; if (b.t <= 0) this.arcs.splice(i, 1); } }
  onElecTick(f) { this.bodyArc(f); this.fx.sparks(f.chest(), [0, 1, 0], 3, [0.6, 0.8, 1, 1]); this.sfxAt('lhit' + (1 + Math.floor(Math.random() * 3)), f.pos, 0.3); f.flash = Math.max(f.flash, 0.1); if (f.isPlayer) { this.shake(0.1); this.hud.hit(0); } }
  // ---------------- duel rounds
  updateRound(dt) {
    const r = this.round; r.t += dt;
    if (r.state === 'intro' && this.started && !this.hud.help && r.t > 2.2) { r.state = 'fight'; r.t = 0; this.banner('FIGHT', [1, 0.85, 0.5], 1.2); }
  }
  resetDuel() {
    const p = this.player, b = this.boss; this.force.reset(); b.force.reset();
    p.revive(SPAWN.slice()); p.status = 'normal'; p.speedMul = p.damageMul = p.takeMul = 1; p.glow = 0; p.saber.rageMul = 1; p.yaw = p.targetYaw = 0; p.actor.animSpeed = 1; this.readySaber(p); this.cam.yaw = 0; this.cam.pitch = 0.2;
    this.respawnNpc(b); b.force.fp = b.force.max; b.reaction = 0.7;
    for (const w of this.world.bodies) { w.pos = w.home.slice(); w.vel = [0, 0, 0]; w.w = [0, 0, 0]; w.grounded = true; w.lifted = 0; w.rot = [0, Math.random() * 6, 0]; w.hp = 100; }
    this.combat.bolts.length = 0; this.arcs.length = 0; this.hud.msgs.length = 0; this.hud.dmg = 0; this.round = { state: 'intro', t: 0 }; this.hud.msg('Rematch');
  }
  dispose() { this.disposed = true; try { this.input.dispose(); } catch (e) { } try { this.sfx.dispose(); } catch (e) { } }
  aimDir() { const c = this.cam; const cp = Math.cos(c.pitch), d = [Math.sin(c.yaw) * cp, -Math.sin(c.pitch), Math.cos(c.yaw) * cp]; const o = this.player.chest(); const pt = v3.addS(c.eye, d, c.dist + 14); return v3.norm([pt[0] - o[0], pt[1] - o[1], pt[2] - o[2]]); }
  combatContext(f) {
    const foes = f.team === 'player' ? this.npcs.filter(n => n.team === 'enemy' && n.status !== 'dead') : f.team === 'enemy' && this.player.status !== 'dead' ? [this.player] : [];
    let front = false, behind = false; const fw = [Math.sin(f.yaw), Math.cos(f.yaw)];
    for (const e of foes) { const dx = e.pos[0] - f.pos[0], dz = e.pos[2] - f.pos[2], d = Math.hypot(dx, dz); if (d > 2.7 || d < 0.01) continue; const dot = (fw[0] * dx + fw[1] * dz) / d; if (dot > 0.5) front = true; else if (dot < -0.45 && d < 2.3) behind = true; }
    return { front, behind };
  }
  separate(f) {
    if (f.status === 'dead' || f.status === 'gripped' || f.status === 'flung') return;
    for (const o of [this.player, ...this.npcs]) {
      if (o === f || o.status === 'dead' || o.status === 'gripped') continue; if (Math.abs(o.pos[1] - f.pos[1]) > 1.3) continue;
      const dx = f.pos[0] - o.pos[0], dz = f.pos[2] - o.pos[2], d = Math.hypot(dx, dz), m = f.radius + o.radius; if (d < m && d > 1e-4) { const k = (m - d) * 0.5; f.pos[0] += dx / d * k; f.pos[2] += dz / d * k; o.pos[0] -= dx / d * k; o.pos[2] -= dz / d * k; }
    }
    if (f.pos[1] < 0.8) for (const b of this.world.bodies) { if (b.lifted > 0 || b.pos[1] > 0.9) continue; const dx = f.pos[0] - b.pos[0], dz = f.pos[2] - b.pos[2], d = Math.hypot(dx, dz), m = f.radius + b.r; if (d < m && d > 1e-4) { f.pos[0] = b.pos[0] + dx / d * m; f.pos[2] = b.pos[2] + dz / d * m; } }
  }
  // ---------------- player input
  buildPlayerCmd() {
    const i = this.input, p = this.player, c = p.cmd; if (this.hud.help) { c.fwd = c.right = 0; c.attack = c.alt = c.jump = c.crouch = c.walk = false; c.jumpPressed = c.crouchPressed = false; return; }
    c.fwd = (i.held('KeyW') ? 1 : 0) - (i.held('KeyS') ? 1 : 0); c.right = (i.held('KeyD') ? 1 : 0) - (i.held('KeyA') ? 1 : 0);
    c.walk = i.held('ShiftLeft') || i.held('ShiftRight'); c.crouch = i.held('KeyC'); c.attack = !!i.btn[0]; c.alt = !!i.btn[2]; c.jump = i.held('Space');
    c.up = c.jump ? 1 : c.crouch ? -1 : 0; c.jumpPressed = this.firstSub && i.pressed('Space'); c.crouchPressed = this.firstSub && i.pressed('KeyC');
    if (p.status === 'normal' || p.status === 'roll') p.targetYaw = this.cam.yaw;
  }
  frameInput(dt) {
    const i = this.input, p = this.player, c = this.cam, h = this.hud;
    if (i.pressed('Tab')) h.help = !h.help; if (i.pressed('F3')) h.debug = !h.debug; if (i.pressed('KeyM')) { this.sfx.muted = !this.sfx.muted; h.msg(this.sfx.muted ? 'Sound off' : 'Sound on'); }
    if (h.help && (i.btnPressed[0]) && !i.pressedSet.has('Tab')) { h.help = false; this.started = true; }
    if (!h.help) this.started = true;
    if (i.locked || i.btn[1]) { c.yaw -= i.dx * i.sens; c.pitch += i.dy * i.sens; }
    const ar = 2.2 * dt; if (i.held('ArrowLeft')) c.yaw += ar; if (i.held('ArrowRight')) c.yaw -= ar; if (i.held('ArrowUp')) c.pitch -= ar * 0.7; if (i.held('ArrowDown')) c.pitch += ar * 0.7;
    c.pitch = clamp(c.pitch, -0.5, 1.3);
    if (this.duel) { // wheel / [ ] cycle the selected Force power; Ctrl+wheel or - = zoom
      if (i.wheel && !h.help) this.force.select(Math.max(-3, Math.min(3, i.wheel))); if (i.pressed('BracketRight') && !h.help) this.force.select(1); if (i.pressed('BracketLeft') && !h.help) this.force.select(-1);
      c.dist = clamp(c.dist + (i.zoom + (i.held('Equal') ? -dt * 4 : 0) + (i.held('Minus') ? dt * 4 : 0)) * 0.35, 1.9, 8.5);
    } else c.dist = clamp(c.dist + (i.wheel + i.zoom) * 0.35, 1.9, 8.5);
    if (h.help) return;
    if (this.duel) { if ((this.round.state === 'won' || this.round.state === 'lost') && this.round.t > 0.8 && i.pressed('Enter')) { this.resetDuel(); return; } if (p.status === 'dead') return; }
    else if (p.status === 'dead') { if (i.pressed('Enter') || this.t - p.deadAt > 12) this.respawnPlayer(); return; }
    if (i.pressed('KeyR')) p.toggleSaber(); if (i.pressed('Digit1')) { p.setStyle(1); h.msg('Saber style: FAST'); } if (i.pressed('Digit2')) { p.setStyle(2); h.msg('Saber style: MEDIUM'); } if (i.pressed('Digit3')) { p.setStyle(3); h.msg('Saber style: STRONG'); }
    if (i.btnPressed[2] && !p.saber.holstered && p.status === 'normal') { if (p.throwSaber(this.aimDir())) h.msg('Saber throw'); }
    for (const pw of POWERS) if (i.pressed(pw.key) && p.status === 'normal') p.yaw = p.targetYaw = c.yaw; // snap to the aim before casting
    if ((i.pressed('KeyZ') || i.btnPressed[1]) && p.status === 'normal') p.yaw = p.targetYaw = c.yaw;
  }
  respawnPlayer() {
    const p = this.player; this.force.releaseAll(); this.force.fp = this.force.max; p.revive(SPAWN.slice()); p.hilt = 'thigh'; p.thrown = null; p.speedMul = p.damageMul = p.takeMul = 1; p.glow = 0; p.saber.holstered = true; p.saber.rageMul = 1; p.blade.set(false); p.blade.len = 0; p.yaw = p.targetYaw = 0; this.cam.yaw = 0; this.cam.pitch = 0.2; this.hud.msg('You rise again');
  }
  respawnNpc(n) {
    n.revive(n.spawn.slice()); n.hilt = n.hasSaber ? 'thigh' : 'none'; n.saber.holstered = true; n.blade.len = 0; n.hitSet.clear(); n.ai = null; n.thrown = null; n.energized = 0; n.glow = 0;
    if (n.kind === 'ally') n.hp = 50; if (n.hasSaber) n.igniteNow(); this.fx.ring({ p: [n.pos[0], 0.05, n.pos[2]], n: [0, 1, 0], r0: 0.2, r1: 1.8, life: 0.8, w: 0.1, c: [0.7, 0.8, 1, 0.8] });
  }
  // ---------------- simulation
  step(dt) {
    this.t += dt; this.dtFrame = dt; const p = this.player;
    this.buildPlayerCmd(); p.update(dt); this.force.update(dt, this.inp);
    for (const n of this.npcs) {
      if (this.aiOff) { clearCmd(n.cmd); } else if (n.kind === 'droid') aiDroid(this, n, dt); else if (n.kind === 'duelist') aiDuelist(this, n, dt); else if (n.kind === 'darkjedi') aiDarkJedi(this, n, dt); else if (n.kind === 'ally') aiAlly(this, n, dt);
      n.update(dt); if (n.force) n.force.update(dt); if (n.healFlash > 0) n.healFlash = Math.max(0, n.healFlash - dt);
      if (n.status === 'dead' && this.t - n.deadAt > 8 && !this.duel) this.respawnNpc(n);
    }
    if (this.duel) this.updateRound(dt);
    this.combat.step(dt); this.world.update(dt); this.fx.update(dt); this.firstSub = false;
    for (const f of this.flashes) f.t -= dt; this.flashes = this.flashes.filter(f => f.t > 0); this.lightFlash = Math.max(0, this.lightFlash - dt * 3);
    if (p.healFlash > 0 && this.force.holding !== 'heal') p.healFlash = Math.max(0, p.healFlash - dt);
    // brazier fire
    this.fireT -= dt; if (this.fireT <= 0) { this.fireT = 0.03; for (const b of this.world.braziers) this.fx.emit({ p: [b[0] + rnd(-0.15, 0.15), b[1], b[2] + rnd(-0.15, 0.15)], v: [rnd(-0.2, 0.2), rnd(0.8, 1.6), rnd(-0.2, 0.2)], life: rnd(0.4, 0.8), size: rnd(0.08, 0.18), grow: -0.1, c0: [1, 0.55, 0.15, 0.55], c1: [0.8, 0.1, 0.02, 0] }); }
    // saber hum volume by distance
    for (const f of [p, ...this.npcs]) if (f.hum && f.hum.set) { const d = v3.dist(f.pos, this.cam.eye); f.hum.set((f.humBase || 0.1) / (1 + d * 0.25) * (this.sfx.muted ? 0 : 1)); }
  }
  update(dt) {
    dt = Math.min(dt, 0.1); this.fps += (1 / Math.max(dt, 1e-3) - this.fps) * 0.08;
    this.frameNo++; this.frameInput(dt); this.acc += dt; let n = 0; this.firstSub = true;
    if (this.duel && this.hud.help) this.acc = 0; // controls panel open: the duel waits
    while (this.acc >= STEP && n++ < 6) { this.step(STEP); this.acc -= STEP; }
    if (n >= 6) this.acc = 0;
    this.updateCamera(dt); this.input.endFrame();
  }
  updateCamera(dt) {
    const c = this.cam, P = this.player; const ty = 1.42 + (P.ducked ? -0.42 : 0) + (P.status === 'down' || P.status === 'getup' || P.status === 'dead' ? -0.7 : 0);
    const k = 1 - Math.exp(-16 * dt); c.pos[0] += (P.pos[0] - c.pos[0]) * k; c.pos[1] += (P.pos[1] + ty - c.pos[1]) * k; c.pos[2] += (P.pos[2] - c.pos[2]) * k;
    const cp = Math.cos(c.pitch), d = [Math.sin(c.yaw) * cp, -Math.sin(c.pitch), Math.cos(c.yaw) * cp]; const right = [-Math.cos(c.yaw), 0, Math.sin(c.yaw)];
    const tgt = [c.pos[0] + right[0] * 0.3, c.pos[1], c.pos[2] + right[2] * 0.3]; let eye = v3.addS(tgt, d, -c.dist);
    this.shakeAmt *= Math.exp(-5 * dt); const s = this.shakeAmt * 0.12; eye = [eye[0] + rnd(-s, s), eye[1] + rnd(-s, s), eye[2] + rnd(-s, s)];
    const rr = Math.hypot(eye[0], eye[2]); if (rr > 24.2) { eye[0] *= 24.2 / rr; eye[2] *= 24.2 / rr; } eye[1] = Math.max(0.25, eye[1]);
    c.eye = eye; c.target = tgt; const wantFov = (62 + (this.force.active.speed ? 8 : 0) + (this.force.active.rage ? 4 : 0)) * Math.PI / 180; c.fov += (wantFov - c.fov) * Math.min(1, dt * 5);
    this.sfx.listener = eye;
  }
  // ---------------- rendering
  setLights() {
    const L = this.R.lights, P = this.player; for (const l of L) { l.r = 0; l.c = [0, 0, 0]; }
    const bl = (f, i, k) => { if (f.blade.len > 0.3) { const m = v3.lerp(f.blade.base, f.blade.tip, 0.5); L[i].p = m; L[i].r = 4.2; L[i].c = [f.blade.color[0] * k, f.blade.color[1] * k, f.blade.color[2] * k]; } };
    bl(P, 0, 0.75 * P.blade.len);
    let fl = null; if (this.lightFlash > 0.02) fl = { p: this.lightFlashPos, c: [0.35 * this.lightFlash * 2, 0.55 * this.lightFlash * 2, 1.0 * this.lightFlash * 2], r: 10 }; else if (this.flashes.length) { const f = this.flashes[this.flashes.length - 1]; const k = f.t / f.max * 2.2; fl = { p: f.p, c: [f.c[0] * k, f.c[1] * k, f.c[2] * k], r: 6 }; }
    if (fl) { L[1].p = fl.p; L[1].r = fl.r; L[1].c = fl.c; }
    let best = null, bd = 1e9; for (const n of this.npcs) if (n.hasSaber && n.blade.len > 0.3) { const d = v3.dist(n.pos, P.pos); if (d < bd) { bd = d; best = n; } } if (best) bl(best, 2, 0.7 * best.blade.len);
    let bb = null, bbd = 1e9; for (const b of this.world.braziers) { const d = Math.hypot(b[0] - P.pos[0], b[2] - P.pos[2]); if (d < bbd) { bbd = d; bb = b; } }
    if (bb) { L[3].p = [bb[0], bb[1] + 0.4, bb[2]]; L[3].r = 14; const fk = 0.85 + 0.15 * Math.sin(this.t * 17) * Math.sin(this.t * 7.3); L[3].c = [1.5 * fk, 0.75 * fk, 0.28 * fk]; }
  }
  drawFighter(f) {
    const R = this.R, a = f.actor; let tint = a.tint, amt = a.tintAmt, glow = 0;
    if (f.glow > 0) { tint = f.glowCol; amt = 0; glow = f.glow; }
    if (f.healFlash > 0) { tint = [0.3, 1, 0.5]; amt = Math.min(0.45, f.healFlash * 0.4); }
    if (f.dmgFlash > 0) { tint = [1, 0.2, 0.15]; amt = Math.max(amt, f.dmgFlash * 0.55); }
    if (f.flash > 0 && f.status === 'shocked') { tint = [0.6, 0.8, 1]; amt = 0.5; }
    if (f.elecUntil > this.t && Math.sin(this.t * 55 + (f.humId || 0)) > 0) { tint = [0.6, 0.8, 1]; amt = 0.42; }
    const far = !f.isPlayer && v3.dist(this.cam.eye, f.pos) > 9;
    R.drawSkinned(far ? this.lodMesh : this.bodyMesh, a, { tint, tintAmt: amt, glow, alpha: f.alpha });
    if (f.hasSaber && f.hilt !== 'none') R.drawMesh(this.hiltMesh, f.hiltMat, { spec: 0.7 });
    else if (!f.hasSaber && f.kind === 'droid') { const bm = a.boneMatrix(this.attach.grip.bone); const loc = m4.trs(this.attach.grip.t, this.attach.grip.q, [1, 1, 1]); R.drawMesh(this.gunMesh, m4.mul(bm, loc), { spec: 0.6 }); }
    const sh = f.status === 'dead' || f.status === 'down' ? 0.8 : 0.55; if (f.pos[1] < 3) this.fx.disc([f.pos[0], 0, f.pos[2]], sh * (1 - Math.min(0.5, f.pos[1] * 0.15)), [0, 0, 0, 0.42], 1);
  }
  render() {
    const R = this.R, c = this.cam; R.resize(); R.time = this.t; this.setLights(); R.setCamera(c.eye, c.target, c.fov); R.begin();
    this.world.draw();
    const all = [this.player, ...this.npcs]; for (const f of all) this.drawFighter(f);
    this.combat.drawRemote(R);
    for (const b of this.world.braziers) R.billboard([b[0], b[1] + 0.35, b[2]], 0.9 + 0.1 * Math.sin(this.t * 13 + b[0]), [1, 0.5, 0.15, 0.22], 0);
    this.fx.draw();
    for (const f of all) f.blade.draw(R, 1 + 0.05 * Math.sin(this.t * 41 + (f.humId || 0) * 2));
    this.force.draw(R); for (const n of this.npcs) if (n.force) n.force.draw(R); this.drawArcs(R); this.combat.drawBolts(R);
    R.flushFx(); this.hud.draw(this, this.dtFrame);
  }
  frame(nowMs) { const now = nowMs / 1000; const dt = this.last ? now - this.last : STEP; this.last = now; this.update(dt); this.render(); }
}
