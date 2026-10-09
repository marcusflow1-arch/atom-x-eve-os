/* eslint-disable */
// Fighter: a character with Jedi-Outcast-style locomotion, jump/roll/crouch, saber state machine and reaction states.
// Used for the player (input driven), the sparring droids / duelist / ally (AI driven).
import { Actor } from './actor.js';
import { SaberLogic } from './saber.js';
import { Blade } from './fx.js';
import { m4, v3, clamp, wrapPi, DEG, lerp } from './math.js';

const G = 20;                                   // gravity m/s^2 (JO 800 u/s^2)
const FORCE_JUMP_HEIGHT = [0.8, 3.3, 5.7, 10.4]; // JO forceJumpHeight[] in metres
export const emptyCmd = () => ({ fwd: 0, right: 0, up: 0, walk: false, crouch: false, attack: false, alt: false, jump: false, jumpPressed: false, crouchPressed: false });
const DEATHS = ['BOTH_DEATH1', 'BOTH_DEATH2', 'BOTH_DEATH3', 'BOTH_DEATH4', 'BOTH_DEATH5', 'BOTH_DEATH6', 'BOTH_DEATH7', 'BOTH_DEATH8', 'BOTH_DEATH9'];
const PAINS = ['BOTH_PAIN2', 'BOTH_PAIN3', 'BOTH_PAIN1', 'BOTH_PAIN4', 'BOTH_PAIN5', 'BOTH_PAIN6'];
const animLen = (a) => a.n / Math.abs(a.fps);

export class Fighter {
  constructor(game, o = {}) {
    this.g = game; this.name = o.name || 'fighter'; this.actor = new Actor(game.skel);
    this.actor.tint = o.tint || [1, 1, 1]; this.actor.tintAmt = o.tintAmt || 0;
    this.pos = (o.pos || [0, 0, 0]).slice(); this.spawn = this.pos.slice(); this.vel = [0, 0, 0]; this.yaw = o.yaw || 0; this.targetYaw = this.yaw; this.legYaw = 0;
    this.maxHp = o.hp || 100; this.hp = this.maxHp; this.isPlayer = !!o.isPlayer; this.team = o.team || 'neutral'; this.kind = o.kind || 'fighter';
    this.cmd = emptyCmd(); this.onGround = true; this.ducked = false; this.status = 'normal'; this.statusT = 0; this.statusAnim = null;
    this.saber = new SaberLogic(game.saberData, this._host()); this.saber.holstered = true;
    this.hasSaber = o.hasSaber !== false; this.blade = new Blade(o.bladeColor || [0.25, 0.55, 1]); this.hilt = this.hasSaber ? 'thigh' : 'none';
    this.hiltMat = new Float32Array(16); this.timers = []; this.forceUntil = 0; this.legsLockUntil = 0; this.landUntil = 0;
    this.speedMul = 1; this.damageMul = 1; this.takeMul = 1; this.radius = 0.38; this.thrown = null; this.airAnim = null; this.fjUsed = false; this.jumpAt = -9; this.rollDir = [0, 0, 1];
    this.hitSet = new Set(); this.hitMove = -1; this.idleSince = 0; this.alpha = 1; this.flash = 0; this.deadAt = 0; this.glow = 0; this.glowCol = [1, 0.2, 0.1]; this.dmgFlash = 0; this.lastHurt = -9; this.distracted = 0;
    this.jumpLevel = 3; this.facingLock = false;
    this.force = null; this.reaction = o.reaction ?? 0.8;               // Force instance (dark Jedi) + chance to react to a push/pull in time
    this.shoveV = [0, 0, 0]; this.elecUntil = 0; this.elecTick = 0;      // decaying slide from a weak push, lightning 'electrified' state
    this.gripCarry = null; this.gripCripple = -9; this.counterUntil = 0;  // level-3 grip carries the victim, brief immunity after a grip, counter-throw lockout
  }
  get now() { return this.g.t; }
  _host() {
    const me = this;
    return {
      hasAnim: n => !!me.actor.skel.anims[n], animInfo: n => me.actor.skel.anims[n], torsoIdleAnim: st => me.torsoIdle(st),
      playTorso: (a, o) => me.playTorso(a, o), event: (t, d) => me.onSaberEvent(t, d), requestDraw: () => me.quickDraw(),
    };
  }
  // ---------- anim helpers
  torsoIdle(stance) {
    const L = this.actor.legs.name || 'BOTH_STAND1';
    if (this.ducked || /^BOTH_(STAND|SABERFAST|SABERSLOW|CROUCH|GUARD)/.test(L) || /WALKBACK/.test(L)) return stance;
    return L;
  }
  playTorso(anim, o) {
    const a = this.actor, now = this.now;
    if (o.parts === 'both') { a.setBoth(anim, { blend: (o.blendMs || 100) / 1000, restart: true, loop: false, speed: o.rage || 1 }); this.legsLockUntil = now + o.durMs / 1000; return; }
    if (o.idle) {
      if (anim === a.legs.name) { a.followLegs(); a.torso.cur = null; } else a.setTorso(anim, { blend: (o.blendMs || 100) / 1000, loop: true, speed: 1 });
      return;
    }
    a.setTorso(anim, { blend: Math.max(0.04, (o.blendMs || 100) / 1000), restart: true, loop: false, speed: (o.rage || 1) });
  }
  playForce(anim, o = {}) { // force-power torso animation (JO: forceHandExtend)
    if (this.fidgetUntil > this.now) this.cancelFidget();
    const a = this.actor, info = a.skel.anims[anim]; const dur = (o.durMs ?? animLen(info) * 1000);
    if (o.whole) { a.setBoth(anim, { blend: (o.blend ?? 0.08), restart: true, loop: o.loop ?? false, speed: o.speed || 1 }); this.legsLockUntil = this.now + dur / 1000; } else a.setTorso(anim, { blend: o.blend ?? 0.07, restart: true, loop: o.loop ?? false, speed: o.speed || 1 });
    this.forceUntil = this.now + dur / 1000; this.forceHold = !!o.hold;
  }
  endForce() { this.forceUntil = 0; this.forceHold = false; if (!this.saber.holstered) this.saber.setMove(this.saber.I.LS_READY, this.now); else { this.actor.followLegs(); this.actor.torso.cur = null; } }
  cancelFidget() { this.fidgetUntil = 0; this.legsLockUntil = 0; this.actor.followLegs(); this.actor.torso.cur = null; }
  playWhole(anim, o = {}) { const info = this.actor.skel.anims[anim]; this.actor.setBoth(anim, { blend: o.blend ?? 0.1, restart: true, loop: o.loop ?? false, speed: o.speed || 1 }); return animLen(info) / (o.speed || 1); }
  after(sec, fn) { this.timers.push({ t: this.now + sec, fn }); }
  // ---------- saber handling
  onSaberEvent(type, d) { if (type === 'swing') { this.g.onSwing && this.g.onSwing(this, d.move); } }
  quickDraw() { if (this.saber.holstered && this.hasSaber && this.status === 'normal' && !this.thrown) { if (this.isPlayer) this.toggleSaber(); else this.igniteNow(); } }
  igniteNow() { const s = this.saber; s.holstered = false; this.hilt = 'hand'; this.blade.set(true); s.move = s.I.LS_READY; s.weaponTime = 0; this.g.sfxAt && this.g.sfxAt('saberon', this.pos, 0.8); this.g.humStart && this.g.humStart(this); }
  extinguish() { const s = this.saber; this.blade.set(false); this.g.sfxAt && this.g.sfxAt('saberoff', this.pos, 0.8); this.g.humStop && this.g.humStop(this); this.after(0.3, () => { if (!this.saber.holstered) return; this.hilt = this.thrown ? 'thrown' : 'thigh'; }); s.holstered = true; s.torsoTimer = 0; s.weaponTime = 0; s.move = s.I.LS_READY; this.hilt = 'thigh'; if (!this.forceUntil) { this.actor.followLegs(); this.actor.torso.cur = null; } }
  toggleSaber() {
    if (!this.hasSaber || this.status !== 'normal' || this.thrown) return; if (this.fidgetUntil > this.now) this.cancelFidget(); const s = this.saber, I = s.I;
    if (s.holstered) { s.holstered = false; s.setMove(I.LS_DRAW, this.now); s.weaponTime = s.torsoTimer; this.after(0.32, () => { this.hilt = 'hand'; this.blade.set(true); this.g.sfxAt('saberon', this.pos, 0.8); this.g.humStart(this); }); }
    else { s.setMove(I.LS_PUTAWAY, this.now); s.weaponTime = s.torsoTimer; this.after(0.42, () => { this.blade.set(false); this.g.sfxAt('saberoff', this.pos, 0.8); this.g.humStop(this); this.hilt = 'hand'; }); this.after(0.62, () => { this.hilt = 'thigh'; s.holstered = true; s.move = I.LS_READY; s.weaponTime = 0; if (!this.forceUntil) { this.actor.followLegs(); this.actor.torso.cur = null; } }); }
  }
  setStyle(lv) { this.saber.level = lv; if (!this.saber.holstered && this.saber.weaponTime <= 0 && this.saber.move === this.saber.I.LS_READY) this.saber.setMove(this.saber.I.LS_READY, this.now); }
  bladeSeg() { return this.blade.len > 0.3 ? [this.blade.base, this.blade.tip] : null; }
  swingPhase() { const s = this.saber; if (!s.isActiveSwing() || s.moveLen <= 0) return -1; return (this.now - s.moveStart) * 1000 / s.moveLen; }
  swingActive() { const p = this.swingPhase(); return p > 0.12 && p < 0.9 && (this.saber.inAttack(this.saber.move) || this.saber.inStart(this.saber.move) || this.saber.inTransition(this.saber.move)); }
  throwSaber(dir) {
    if (this.thrown || this.saber.holstered || !this.hasSaber) return false;
    const hp = this.actor.bonePos('rhand'); this.thrown = { pos: hp.slice(), prevPos: hp.slice(), dir: v3.norm(dir), t: 0, phase: 'out', ang: 0, hit: new Map() };
    this.saber.inFlight = true; this.hilt = 'thrown'; this.g.sfxAt('spin', this.pos, 0.8); this.thrownLoop = this.g.sfx.loop && this.g.sfx.loop('spin', { vol: 0.35 }); return true;
  }
  updateThrown(dt) {
    const T = this.thrown; if (!T) return;
    T.prevPos = T.pos.slice(); T.t += dt; T.ang += 24 * dt;
    const hand = this.actor.bonePos('rhand'); hand[1] += 0.05;
    const held = !!this.cmd.alt;
    // A held throw flies out, then tracks the camera direction while spinning at range.
    // Release sends it home. This also works when either fighter is airborne.
    if (!held) T.phase = 'back';
    if (T.phase === 'out') {
      const aim = this.isPlayer ? this.g.aimDir() : T.dir;
      T.dir = v3.norm(v3.lerp(T.dir, aim, Math.min(1, dt * 6)));
      T.pos = v3.addS(T.pos, T.dir, 19 * dt);
      if (v3.dist(T.pos, hand) >= 10.5 || T.pos[1] <= 0.35) T.phase = 'hover';
    } else if (T.phase === 'hover') {
      const aim = this.isPlayer ? this.g.aimDir() : T.dir;
      T.dir = v3.norm(v3.lerp(T.dir, aim, Math.min(1, dt * 8)));
      const goal = v3.addS(hand, T.dir, 9.5);
      goal[1] = Math.max(0.35, goal[1]);
      T.pos = v3.lerp(T.pos, goal, Math.min(1, dt * 8));
    } else {
      const d = v3.sub(hand, T.pos), L = v3.len(d);
      T.pos = v3.addS(T.pos, v3.scale(d, 1 / (L || 1)), Math.min(L, 26 * dt));
      if (L < 0.6) { this.catchSaber(); return; }
    }
    T.pos[1] = Math.max(0.35, T.pos[1]);
    // Reset per-target hit cooldowns only after they expire, not every return frame.
    for (const [target, next] of T.hit) if (next < this.now - 1) T.hit.delete(target);
  }
  catchSaber() { this.thrown = null; this.saber.inFlight = false; this.hilt = 'hand'; this.g.sfxAt('catch', this.pos, 0.8); if (this.thrownLoop) { this.thrownLoop.stop(0.05); this.thrownLoop = null; } this.saber.setMove(this.saber.I.LS_READY, this.now); this.saber.weaponTime = 150; }
  // ---------- state transitions (reactions)
  push(dirXZ, speed, up = 4.5, opts = {}) { // knocked away (JO: HANDEXTEND_KNOCKDOWN)
    if (this.status === 'dead') { this.vel[0] = dirXZ[0] * speed * 0.6; this.vel[2] = dirXZ[2] * speed * 0.6; return; }
    this.endForce(); this.cancelAttackState();
    this.status = 'flung'; this.statusT = 0; this.vel = [dirXZ[0] * speed, up, dirXZ[2] * speed]; this.onGround = false; this.ducked = false;
    const anim = opts.anim || ['BOTH_KNOCKDOWN1', 'BOTH_KNOCKDOWN2', 'BOTH_KNOCKDOWN4', 'BOTH_KNOCKDOWN5'][Math.floor(Math.random() * 4)];
    this.faceYaw = Math.atan2(-dirXZ[0], -dirXZ[2]) + Math.PI; // face the pusher (so they fall backward)
    if (!opts.keepYaw) this.yaw = Math.atan2(-dirXZ[0], -dirXZ[2]);
    this.statusAnim = anim; this.playWhole(anim, { blend: 0.06 });
  }
  pullTo(dirXZ, speed) { // dragged toward caster
    this.endForce(); this.cancelAttackState(); this.status = 'flung'; this.statusT = 0; this.vel = [dirXZ[0] * speed, 3.2, dirXZ[2] * speed]; this.onGround = false; this.ducked = false;
    this.yaw = Math.atan2(-dirXZ[0], -dirXZ[2]); this.statusAnim = 'BOTH_KNOCKDOWN3'; this.playWhole('BOTH_KNOCKDOWN3', { blend: 0.06 });
  }
  shove(dirXZ, speed) { // weak push: slide along the ground, keep control (separate from the knock-down fling)
    if (this.status === 'dead') return; const k = Math.min(9, speed); this.shoveV[0] += dirXZ[0] * k; this.shoveV[2] += dirXZ[2] * k;
    const l = Math.hypot(this.shoveV[0], this.shoveV[2]); if (l > 10) { this.shoveV[0] *= 10 / l; this.shoveV[2] *= 10 / l; }
  }
  stagger(dirXZ, speed) { // a push that was not stopped but did not knock the target over: breaks the swing, short flinch, slides back
    if (this.status !== 'normal') { this.shove(dirXZ, speed * 0.5); return; }
    this.endForce(); this.cancelAttackState(); this.shove(dirXZ, speed); this.ducked = false;
    const a = 'BOTH_PAIN' + (1 + Math.floor(Math.random() * 4)); const info = this.actor.skel.anims[a]; if (info) { this.actor.setBoth(a, { blend: 0.05, restart: true, loop: false }); const L = Math.min(0.55, animLen(info)); this.legsLockUntil = this.now + L; this.forceUntil = this.now + L; this.forceHold = false; }
  }
  electrify(sec) { this.elecUntil = Math.max(this.elecUntil, this.now + sec); }
  grip(on, liftTo = 1.35, o = {}) {
    if (on) { if (this.status === 'dead') return; this.endForce(); this.cancelAttackState(); this.status = 'gripped'; this.gripLift = liftTo; this.gripCarry = o.carry || null; this.statusT = 0; this.onGround = false; this.shoveV = [0, 0, 0]; this.playWhole('BOTH_CHOKE1', { loop: true, blend: 0.12 }); }
    else if (this.status === 'gripped') {
      this.gripCarry = null; this.gripCripple = this.now + 1.2;
      if (o.free) { this.status = 'normal'; this.vel = [0, 0, 0]; this.onGround = this.pos[1] < 0.05; this.actor.followLegs(); this.actor.torso.cur = null; this.airAnim = null; return; } // broke free: drop to the feet
      if (o.soft || this.pos[1] < 0.3) { this.status = 'normal'; this.pos[1] = 0; this.onGround = true; this.vel = [0, 0, 0]; const a = 'BOTH_PAIN2', info = this.actor.skel.anims[a]; this.actor.setBoth(a, { blend: 0.08, restart: true, loop: false }); const L = info ? animLen(info) : 0.5; this.legsLockUntil = this.forceUntil = this.now + L; this.forceHold = false; return; }
      this.status = 'flung'; this.statusT = 0; this.vel = [0, -1, 0]; this.statusAnim = 'BOTH_KNOCKDOWN1'; this.playWhole('BOTH_KNOCKDOWN1', { blend: 0.06 });
    }
  }
  shock(on) {
    if (on) { if (this.status === 'dead' || this.status === 'flung') return; if (this.status !== 'shocked') { this.endForce(); this.cancelAttackState(); this.status = 'shocked'; this.statusT = 0; this.nextPain = 0; this.onGround = true; } this.shockKeep = this.now + 0.15; }
  }
  cancelAttackState() { this.saber.weaponTime = 0; this.saber.torsoTimer = 0; this.saber.blocked = null; if (this.thrown) this.catchSaber(); }
  hurt(dmg, from, opts = {}) {
    if (this.status === 'dead' || this.hp <= 0) return false; dmg *= this.takeMul; this.hp -= dmg; this.lastHurt = this.now; this.dmgFlash = 1; this.flash = 0.25; if (this.force && this.force.onHurt) this.force.onHurt(dmg);
    if (this.hp <= 0) { this.die(from, opts); return true; }
    if (!opts.noFlinch && this.status === 'normal' && this.now - (this.lastFlinch || -9) > 0.5 && !this.forceUntil && !(this.saber.isActiveSwing() && !this.isPlayer)) {
      this.lastFlinch = this.now; const a = PAINS[Math.floor(Math.random() * PAINS.length)];
      const info = this.actor.skel.anims[a]; if (this.isPlayer) this.actor.setTorso(a, { blend: 0.05, restart: true, loop: false }), this.forceUntil = this.now + animLen(info), this.forceHold = false; else { this.actor.setBoth(a, { blend: 0.05, restart: true, loop: false }); this.legsLockUntil = this.now + animLen(info); this.forceUntil = this.now + animLen(info); this.forceHold = false; }
    }
    return false;
  }
  die(from, opts = {}) {
    if (this.force && this.force.releaseAll) this.force.releaseAll(true);
    this.hp = 0; this.endForce(); this.cancelAttackState(); const wasFlung = this.status === 'flung'; this.status = 'dead'; this.statusT = 0; this.deadAt = this.now; if (!this.saber.holstered) { this.saber.holstered = true; this.blade.set(false); this.g.humStop && this.g.humStop(this); }
    if (!wasFlung) this.playWhole(opts.deathAnim || DEATHS[Math.floor(Math.random() * DEATHS.length)], { blend: 0.08 }); else this.playWhole('BOTH_KNOCKDOWN1', { blend: 0.05 });
    this.g.onDeath && this.g.onDeath(this);
  }
  revive(at) { this.hp = this.maxHp; this.status = 'normal'; this.vel = [0, 0, 0]; this.shoveV = [0, 0, 0]; this.elecUntil = 0; this.gripCarry = null; this.gripCripple = -9; this.counterUntil = 0; this.forceUntil = 0; this.legsLockUntil = 0; this.thrown = null; this.saber.inFlight = false; this._prev = null; this._prevCap = null; this.hitSet.clear(); this.hitMove = -1; this.speedMul = this.damageMul = this.takeMul = 1; this.glow = 0; this.pos = (at || this.spawn).slice(); this.alpha = 1; this.cmd = emptyCmd(); this.actor.setBoth('BOTH_STAND1', { blend: 0 }); this.actor.followLegs(); this.onGround = true; this.ducked = false; }
  chest() { const y = this.status === 'down' || this.status === 'dead' ? 0.3 : this.ducked ? 0.75 : 1.15; return [this.pos[0], this.pos[1] + y, this.pos[2]]; }
  headPos() { return this.actor.bonePos('cranium', [0, 0, 0]); }
  // ---------- per-frame update
  update(dt) {
    const now = this.now; const a = this.actor;
    for (let i = this.timers.length - 1; i >= 0; i--) if (this.timers[i].t <= now) { const f = this.timers[i].fn; this.timers.splice(i, 1); f(); }
    this.statusT += dt; this.flash = Math.max(0, this.flash - dt); this.dmgFlash = Math.max(0, this.dmgFlash - dt * 2.5); this.distracted = Math.max(0, this.distracted - dt);
    switch (this.status) {
      case 'dead': this.frictionMove(dt, 6); this.updateAnimOnly(dt); return this.finish(dt);
      case 'flung': this.physicsFlung(dt); return this.finish(dt);
      case 'down':
        this.frictionMove(dt, 8);
        // JO quick-rise: Space while grounded cancels the prone wait and uses
        // the supplied Force Getup animation. Without input, use a normal getup.
        if (this.onGround && (this.cmd.jumpPressed || this.statusT > (this.downTime || 1.1))) {
          const quick = this.cmd.jumpPressed;
          const anim = quick && a.skel.anims.BOTH_FORCE_GETUP_B1 ? 'BOTH_FORCE_GETUP_B1' : 'BOTH_GETUP1';
          this.status = 'getup'; this.statusT = 0;
          this.getupLen = this.playWhole(anim, { blend: 0.08 });
          this.cmd.jumpPressed = false;
        }
        return this.finish(dt);
      case 'getup': this.frictionMove(dt, 8); if (this.statusT >= this.getupLen - 0.05) { this.status = 'normal'; this.actor.followLegs(); this.actor.torso.cur = null; this.actor.setLegs(this.saber.holstered ? 'BOTH_STAND1' : 'BOTH_STAND2', { blend: 0.15 }); } return this.finish(dt);
      case 'gripped': { const ty = this.gripLift ?? 1.3; this.pos[1] += (ty - this.pos[1]) * Math.min(1, dt * 4); this.vel[0] = this.vel[2] = 0; if (this.gripCarry) { const c = this.gripCarry(); const k = Math.min(1, dt * 3); this.pos[0] += (c[0] - this.pos[0]) * k; this.pos[2] += (c[2] - this.pos[2]) * k; this.g.world.collide(this.pos, this.radius); } this.pos[1] += Math.sin(now * 3.1) * 0.0025; this.yaw += Math.sin(now * 2.2) * 0.004; return this.finish(dt); }
      case 'shocked': {
        this.frictionMove(dt, 10); this.nextPain -= dt; if (this.nextPain <= 0) { this.nextPain = 0.28 + Math.random() * 0.2; const p = PAINS[Math.floor(Math.random() * PAINS.length)]; this.playWhole(p, { blend: 0.04 }); }
        this.pos[0] += (Math.random() - 0.5) * 0.02; this.pos[2] += (Math.random() - 0.5) * 0.02; if (now > this.shockKeep) { this.status = 'normal'; this.actor.followLegs(); this.actor.torso.cur = null; } return this.finish(dt);
      }
      case 'roll': { this.statusT; const k = clamp(this.statusT / this.rollLen, 0, 1); const sp = lerp(6.8, 2.5, k); this.vel[0] = this.rollDir[0] * sp; this.vel[2] = this.rollDir[2] * sp; this.integrate(dt, false); if (this.statusT >= this.rollLen - 0.02) { this.status = 'normal'; this.vel[0] *= 0.3; this.vel[2] *= 0.3; } return this.finish(dt); }
      default: break;
    }
    this.normalUpdate(dt); this.finish(dt);
  }
  updateAnimOnly(dt) { }
  frictionMove(dt, f) { const k = Math.max(0, 1 - f * dt); this.vel[0] *= k; this.vel[2] *= k; this.pos[0] += this.vel[0] * dt; this.pos[2] += this.vel[2] * dt; this.g.world.collide(this.pos, this.radius); }
  physicsFlung(dt) {
    this.vel[1] -= G * dt; this.pos[0] += this.vel[0] * dt; this.pos[1] += this.vel[1] * dt; this.pos[2] += this.vel[2] * dt;
    const before = [this.pos[0], this.pos[2]]; this.g.world.collide(this.pos, this.radius); if (before[0] !== this.pos[0] || before[1] !== this.pos[2]) { this.vel[0] *= -0.2; this.vel[2] *= -0.2; if (!this.hitWall) { this.hitWall = true; this.hurt(8, null, { noFlinch: true }); this.g.fx.sparks([this.pos[0], this.pos[1] + 1, this.pos[2]], [0, 1, 0], 6, [0.8, 0.8, 1, 1]); } }
    const floor = this.g.world.floorAt(this.pos[0], this.pos[2], this.pos[1] + 0.3);
    if (floor !== null && this.pos[1] <= floor) { this.pos[1] = floor; if (this.vel[1] < -1.5 && !this.bounced) { this.bounced = true; this.vel[1] = 0; this.g.onThud && this.g.onThud(this); } this.vel[1] = 0; this.onGround = true; const k = Math.max(0, 1 - 4 * dt); this.vel[0] *= k; this.vel[2] *= k;
      if (this.statusT > 0.25 && Math.hypot(this.vel[0], this.vel[2]) < 1.2) { this.status = this.hp <= 0 ? 'dead' : 'down'; this.statusT = 0; this.bounced = false; this.hitWall = false; this.downTime = 1.0 + Math.random() * 0.5; } }
  }
  integrate(dt, gravity = true) {
    if (gravity && !this.onGround) this.vel[1] -= G * dt;
    this.pos[0] += this.vel[0] * dt; this.pos[2] += this.vel[2] * dt; this.pos[1] += this.vel[1] * dt;
    this.g.world.collide(this.pos, this.radius); this.g.separate && this.g.separate(this);
  }
  // ---------- normal locomotion
  normalUpdate(dt) {
    const c = this.cmd, a = this.actor, now = this.now, S = this.saber;
    // facing
    const diff = wrapPi(this.targetYaw - this.yaw); const rate = (this.forceUntil > now || S.weaponTime > 0 || !S.holstered || Math.hypot(this.vel[0], this.vel[2]) > 0.5) ? 14 : 5; this.yaw += clamp(diff, -rate * dt, rate * dt);
    const frozen = this.status === 'whole';
    const busyForce = this.forceUntil > now && this.forceHold === 'freeze';
    // crouch / roll
    const wantDuck = c.crouch && this.onGround;
    if (c.crouchPressed && this.onGround && (c.fwd || c.right) && !c.walk && !this.ducked && !(S.isActiveSwing() && S.weaponTime > 0 && !this.isPlayer) && this.canRoll()) { this.startRoll(); return; }
    if (wantDuck !== this.ducked && this.onGround) { this.ducked = wantDuck; }
    // jumping
    if (this.trySpecialJumpAttack()) { c.jumpPressed = false; }
    if (c.jumpPressed && this.onGround && !this.ducked && !frozen) this.startJump();
    if (!this.onGround && c.jump && !this.fjUsed && this.now - this.jumpAt > 0.16 && this.now - this.jumpAt < 0.6 && this.vel[1] > 0.5 && this.canForceJump()) this.startForceJump();
    // wish velocity
    // With +Z as forward, +X is RIGHT. The old (-cosY,+sinY) vector
    // inverted A/D relative to the 'RUNSTRAFE_RIGHT/LEFT' Ghoul2 clips.
    const sinY = Math.sin(this.yaw), cosY = Math.cos(this.yaw);
    const fwd = [sinY, 0, cosY], right = [cosY, 0, -sinY];
    let f = c.fwd, r = c.right; const l = Math.hypot(f, r); if (l > 1) { f /= l; r /= l; }
    const crouched = this.ducked; const base = crouched ? 2.1 : c.walk ? 2.4 : 5.6; let sp = base * this.speedMul * (f < 0 ? 0.82 : 1);
    if (frozen || (this.forceUntil > now && this.forceHold === 'freeze') || (this.status === 'normal' && S.move === S.I.LS_PUTAWAY) || this.heavyLandUntil > now) sp *= 0.0;
    if (this.elecUntil > now) sp *= 0.72;                              // lightning slows the victim (they keep control)
    const wish = [(fwd[0] * f + right[0] * r) * sp, (fwd[2] * f + right[2] * r) * sp];
    if (this.onGround) {
      const tv = wish, acc = (f || r) ? 48 : 36; const dx = tv[0] - this.vel[0], dz = tv[1] - this.vel[2], dl = Math.hypot(dx, dz), st = acc * dt;
      if (dl <= st) { this.vel[0] = tv[0]; this.vel[2] = tv[1]; } else { this.vel[0] += dx / dl * st; this.vel[2] += dz / dl * st; }
      this.vel[1] = 0;
    } else {
      const airBlend = Math.min(1, 7 * dt * 0.35);
      this.vel[0] += (wish[0] - this.vel[0]) * airBlend;
      this.vel[2] += (wish[1] - this.vel[2]) * airBlend;
    }
    const wasGround = this.onGround; const preVy = this.vel[1];
    this.integrate(dt, true);
    if (this.shoveV[0] || this.shoveV[2]) { // slide from a weak / partly blocked push
      this.pos[0] += this.shoveV[0] * dt; this.pos[2] += this.shoveV[2] * dt; const k = Math.max(0, 1 - 5.5 * dt); this.shoveV[0] *= k; this.shoveV[2] *= k;
      if (Math.hypot(this.shoveV[0], this.shoveV[2]) < 0.15) this.shoveV[0] = this.shoveV[2] = 0; this.g.world.collide(this.pos, this.radius); this.g.separate && this.g.separate(this);
    }
    if (this.elecUntil > now) { this.elecTick -= dt; if (this.elecTick <= 0) { this.elecTick = 0.16 + Math.random() * 0.2; this.g.onElecTick && this.g.onElecTick(this); } }
    const floor = this.g.world.floorAt(this.pos[0], this.pos[2], this.pos[1] + 0.55);
    if (wasGround && this.onGround && floor !== null && floor >= this.pos[1] - 0.55 && floor <= this.pos[1] + 0.55) {
      this.pos[1] = floor; // walk up shallow imported BSP steps and ramps
    } else if (!this.onGround && floor !== null && this.pos[1] <= floor && this.vel[1] <= 0) {
      this.pos[1] = floor; this.land(-this.vel[1]); this.vel[1] = 0; this.onGround = true;
    } else if (this.onGround && (floor === null || Math.abs(this.pos[1] - floor) > 0.56)) this.onGround = false;
    this.selectLegs(dt, f, r);
    this.updateSaber(dt);
  }
  canRoll() { return this.hasSaber || true; }
  canForceJump() { return this.isPlayer ? this.g.force && this.g.force.canJump() : false; }
  startJump() {
    const c = this.cmd; this.vel[1] = 5.65; this.onGround = false; this.jumpAt = this.now; this.fjUsed = false;
    let an = 'BOTH_JUMP1'; if (c.fwd < 0) an = 'BOTH_JUMPBACK1'; else if (c.fwd === 0 && c.right > 0) an = 'BOTH_JUMPRIGHT1'; else if (c.fwd === 0 && c.right < 0) an = 'BOTH_JUMPLEFT1';
    this.airAnim = an; this.actor.setLegs(an, { restart: true, blend: 0.06, loop: false });
    // Jump legs should not kill an in-progress torso saber slash.
    if (this.saber.holstered || !this.saber.isActiveSwing()) this.actor.followLegs();
    this.g.sfxAt && this.g.sfxAt('jump', this.pos, 0.0);
  }
  startForceJump() {
    const c = this.cmd; this.fjUsed = true; const h = FORCE_JUMP_HEIGHT[this.jumpLevel]; const v = Math.sqrt(2 * G * h); this.vel[1] = Math.max(this.vel[1], v);
    // JO: FORCEJUMP1/BACK/LEFT/RIGHT anim chosen by movement direction
    let an = 'BOTH_FORCEJUMP1'; if (c.fwd < 0) an = 'BOTH_FORCEJUMPBACK1'; else if (c.fwd === 0 && c.right > 0) an = 'BOTH_FORCEJUMPRIGHT1'; else if (c.fwd === 0 && c.right < 0) an = 'BOTH_FORCEJUMPLEFT1';
    this.airAnim = an; this.actor.setLegs(an, { restart: true, blend: 0.05, loop: false });
    if (this.saber.holstered || !this.saber.isActiveSwing()) this.actor.followLegs();
    this.fjStart = this.now; this.g.onForceJump && this.g.onForceJump(this);
  }
  land(impact) {
    const air = this.airAnim || 'BOTH_JUMP1'; let an = 'BOTH_LAND1';
    const forceJ = /FORCE/.test(air) || this.fjUsed;
    if (forceJ) an = air.includes('BACK') ? 'BOTH_FORCELANDBACK1' : air.includes('LEFT') ? 'BOTH_FORCELANDLEFT1' : air.includes('RIGHT') ? 'BOTH_FORCELANDRIGHT1' : 'BOTH_FORCELAND1';
    else an = air.includes('BACK') ? 'BOTH_LANDBACK1' : air.includes('LEFT') ? 'BOTH_LANDLEFT1' : air.includes('RIGHT') ? 'BOTH_LANDRIGHT1' : 'BOTH_LAND1';
    // A Force Jump has its own landing clip; never replace it with the
    // generic heavy fall, which produced a conspicuous wrong landing bounce.
    if (impact > 14 && !forceJ) an = 'BOTH_LAND2';
    const info = this.actor.skel.anims[an];
    const duration = info ? animLen(info) : 0.3;
    this.landUntil = this.now + duration; // retain the complete source animation
    this.heavyLandUntil = an === 'BOTH_LAND2' ? this.landUntil : 0;
    this.actor.setLegs(an, { restart: true, blend: 0.04, loop: false });
    this.airAnim = null; this.fjUsed = false;
    this.g.onLand && this.g.onLand(this, impact);
  }
  startRoll() {
    const c = this.cmd, sinY = Math.sin(this.yaw), cosY = Math.cos(this.yaw); let an, d;
    if (c.fwd) { if (c.fwd < 0) { an = 'BOTH_ROLL_B'; d = [-sinY, 0, -cosY]; } else { an = 'BOTH_ROLL_F'; d = [sinY, 0, cosY]; } }
    else if (c.right > 0) { an = 'BOTH_ROLL_R'; d = [cosY, 0, -sinY]; } else { an = 'BOTH_ROLL_L'; d = [-cosY, 0, sinY]; }
    this.rollDir = d; this.status = 'roll'; this.statusT = 0; this.ducked = false; this.endForceKeepAnim(); this.cancelSwingForRoll();
    this.rollLen = animLen(this.actor.skel.anims[an]); this.actor.setBoth(an, { restart: true, blend: 0.08, loop: false }); this.g.sfxAt && this.g.sfxAt('jumpbuild', this.pos, 0.0);
  }
  endForceKeepAnim() { this.forceUntil = 0; }
  cancelSwingForRoll() { const S = this.saber; S.weaponTime = 0; S.torsoTimer = 0; S.move = S.I.LS_READY; }
  selectLegs(dt, f, r) {
    const a = this.actor, now = this.now, S = this.saber, out = !S.holstered; const speed = Math.hypot(this.vel[0], this.vel[2]);
    let twist = 0;
    if (!this.onGround) {
      // Do not replace full-body flip, lunge or aerial saber strikes with
      // INAIR until the original special-attack clip has finished playing.
      if (now < this.legsLockUntil && S.inSpecial(S.move)) return;
      // Ground strafe twist should not remain welded into an airborne pose.
      this.legYaw = (this.legYaw || 0) * Math.max(0, 1 - dt * 8);
      a.legYaw = this.legYaw;
      // Real JO Ghoul2 bank: finite JUMP/FORCEJUMP anticipation is followed
      // by the matching held INAIR pose, not a frozen last takeoff frame.
      if (this.airAnim && /^BOTH_(FORCE)?JUMP/.test(this.airAnim)) {
        const name = this.airAnim, info = a.skel.anims[name];
        const started = /^BOTH_FORCEJUMP/.test(name) ? this.fjStart : this.jumpAt;
        if (info && now - started >= animLen(info) / (a.legs.cur?.speed || 1)) {
          const next = name.replace('FORCEJUMP', 'FORCEINAIR').replace(/^BOTH_JUMP/, 'BOTH_INAIR');
          if (a.skel.anims[next]) {
            this.airAnim = next;
            a.setLegs(next, { blend: 0.1, loop: true });
          }
        }
      } else if (!this.airAnim) {
        this.airAnim = 'BOTH_INAIR1';
        a.setLegs(this.airAnim, { blend: 0.12, loop: true });
      }
      return;
    }
    const moving = speed > 0.6 && (f || r);
    if (this.fidgetUntil > now && (moving || out || this.ducked || this.cmd.attack || this.cmd.jumpPressed || this.forceUntil > now)) this.cancelFidget();
    if (now < this.legsLockUntil || now < this.landUntil) return;
    let an;
    if (this.ducked) an = !moving ? 'BOTH_CROUCH1IDLE' : (f < 0 ? 'BOTH_CROUCH1WALKBACK' : 'BOTH_CROUCH1WALK');
    else if (!moving) { an = out ? 'BOTH_STAND2' : 'BOTH_STAND1'; }
    else {
      const run = !this.cmd.walk; const fw = f > 0.25, bk = f < -0.25; const theta = Math.atan2(r, f); // + = moving right of facing
      if (!fw && !bk) { an = r > 0 ? 'BOTH_RUNSTRAFE_RIGHT1' : 'BOTH_RUNSTRAFE_LEFT1'; if (!run) an = r > 0 ? 'BOTH_RUNSTRAFE_RIGHT1' : 'BOTH_RUNSTRAFE_LEFT1'; }
      else if (bk) { an = run ? 'BOTH_RUNBACK1' : 'BOTH_WALKBACK1'; twist = clamp(theta > 0 ? theta - Math.PI : theta + Math.PI, -0.7, 0.7); }
      else { an = run ? (out ? 'BOTH_RUN2' : 'BOTH_RUN1') : 'BOTH_WALK1'; twist = clamp(theta, -0.7, 0.7); }
    }
    if (this.speedMul > 1.05 && /RUN|WALK|STRAFE/.test(an)) a.animSpeed = 1 + (this.speedMul - 1) * 0.55; else a.animSpeed = 1;
    if (this.status === 'normal' && this.airAnim) this.airAnim = null;
    a.setLegs(an, { blend: 0.14, loop: true });
    this.legYawT = twist; this.legYaw += (twist - this.legYaw) * Math.min(1, dt * 10); a.legYaw = this.legYaw;
    if (!moving && !this.ducked && !out) { // holstered idle fidget
      this.idleSince += dt; if (this.idleSince > 9 && !this.forceUntil) { this.idleSince = 0; const len = this.playWhole('BOTH_STAND1IDLE1', {}); this.legsLockUntil = this.fidgetUntil = now + len; }
    } else this.idleSince = 0;
    if (twist === 0 && Math.abs(this.legYaw) < 0.01) a.legYaw = 0;
  }
  updateSaber(dt) {
    const S = this.saber, now = this.now, a = this.actor;
    if (this.thrown) { this.updateThrown(dt); }
    const c = this.cmd;
    if (this.forceUntil > 0 && now >= this.forceUntil && !this.forceHold) { this.endForce(); }
    const busy = (this.forceUntil > now) || this.status === 'roll' || this.status === 'whole';
    // torso override / idle upkeep
    if (!S.holstered) {
      const cmdAttack = c.attack, move = S.move;
      const pos = this.ctxInfo();
      S.update(dt * 1000, { attack: cmdAttack && !this.thrown, alt: c.alt, aimPitch: c.aimPitch || 0, fwd: Math.sign(Math.round(c.fwd * 2) / 2), right: Math.sign(Math.round(c.right * 2) / 2), up: c.up, ducked: this.ducked, velZ: this.vel[1], groundDist: this.pos[1], enemyFront: pos.front, enemyBehind: pos.behind, busy }, now);
      if (S.move !== this.prevMove) { this.onMoveChanged(S.move); this.prevMove = S.move; }
      // idle torso: re-evaluate stance vs follow-legs each frame when nothing is playing
      if (S.move === S.I.LS_READY && S.torsoTimer <= 0 && !busy && !this.thrown) {
        const want = this.torsoIdle(S.stanceAnim()); if (want === a.legs.name) { if (!a.torsoFollow) { a.followLegs(); a.torso.cur = null; } } else if (!a.torso.cur || a.torsoFollow || a.torso.name !== want) a.setTorso(want, { blend: 0.12, loop: true });
      }
      if (S.moveLen > 0 && S.move !== S.I.LS_READY && S.torsoTimer <= 0 && S.weaponTime <= 0 && false) { }
    } else { S.update(dt * 1000, { attack: false, busy: true }, now); if (!busy && !a.torsoFollow && !this.thrown && S.move === S.I.LS_READY) { a.followLegs(); a.torso.cur = null; } }
    // special: moves that need whole-body physics
    const m = S.move; if (S.isActiveSwing() || S.inAttack(m)) { if (m === S.I.LS_A_LUNGE && this.statusT0 !== now) { } }
  }
  onMoveChanged(m) {
    const S = this.saber, I = S.I, sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
    if (m === I.LS_A_LUNGE) { this.vel[0] = sy * 3.75; this.vel[2] = cy * 3.75; }
    else if (m === I.LS_A_FLIP_STAB || m === I.LS_A_FLIP_SLASH) { this.vel[0] = sy * 1.4; this.vel[2] = cy * 1.4; this.vel[1] = 8.5; this.onGround = false; this.jumpAt = this.now; this.airAnim = 'BOTH_JUMP1'; this.g.sfxAt('jump', this.pos, 0.5); }
    else if (m === I.LS_A_JUMP_T__B_) { this.vel[0] = sy * 7.5; this.vel[2] = cy * 7.5; this.vel[1] = 7.0; this.onGround = false; this.jumpAt = this.now; this.airAnim = 'BOTH_JUMP1'; this.g.sfxAt('jump', this.pos, 0.5); }
  }
  trySpecialJumpAttack() { // JO PM_CheckJump: jump while an attack just started -> flip attack (medium) / jump attack (strong)
    const S = this.saber, I = S.I, c = this.cmd; if (S.holstered || !(c.jumpPressed && this.onGround) || !(S.weaponTime > 0 || c.attack)) return false;
    if (!S.inAttack(S.move) || S.inSpecial(S.move)) return false; if ((this.now - S.moveStart) > 0.5) return false;
    if (S.level === 2 && this.ctxInfo().front) { S.weaponTime = 0; S.setMove(Math.random() < 0.5 ? I.LS_A_FLIP_STAB : I.LS_A_FLIP_SLASH, this.now); S.weaponTime = S.torsoTimer; return true; }
    if (S.level === 3 && c.fwd > 0) { S.weaponTime = 0; S.setMove(I.LS_A_JUMP_T__B_, this.now); S.weaponTime = S.torsoTimer; return true; }
    return false;
  }
  ctxInfo() { return this.g.combatContext ? this.g.combatContext(this) : { front: false, behind: false }; }
  finish(dt) {
    const a = this.actor; a.pos[0] = this.pos[0]; a.pos[1] = this.pos[1]; a.pos[2] = this.pos[2]; a.yaw = this.yaw;
    a.update(this.now);
    this.updateHilt(dt);
  }
  updateHilt(dt) {
    const A = this.g.attach, a = this.actor; let M = this.hiltMat;
    if (this.hilt === 'hand') { const bm = a.boneMatrix(A.grip.bone); const loc = m4.trs(A.grip.t, A.grip.q, A.grip.s); m4.mul(bm, loc, M); this.hiltScaleY = A.grip.s[1]; }
    else if (this.hilt === 'thigh') { const bm = a.boneMatrix(A.holster.bone); const loc = m4.trs(A.holster.t, A.holster.q, [1, 1, 1]); m4.mul(bm, loc, M); this.hiltScaleY = 1; }
    else if (this.hilt === 'thrown' && this.thrown) {
      const T = this.thrown, d = [Math.cos(T.ang), 0, Math.sin(T.ang)]; const Y = v3.scale(d, -1), X = v3.norm(v3.cross([0, 1, 0], Y)), Z = v3.cross(X, Y);
      M.fill(0); M[0] = X[0]; M[1] = X[1]; M[2] = X[2]; M[4] = Y[0]; M[5] = Y[1]; M[6] = Y[2]; M[8] = Z[0]; M[9] = Z[1]; M[10] = Z[2]; M[12] = T.pos[0]; M[13] = T.pos[1]; M[14] = T.pos[2]; M[15] = 1; this.hiltScaleY = 1;
    }
    // Saber attacks already use their actual Ghoul2 directional arm/bone clips.
    // A limited camera correction helps third-person targeting without
    // twisting the blade 50+ degrees away from the animated hand and hilt.
    // Collision and rendering continue to sample this exact same direction.
    let bladeDir;
    if (this.isPlayer && this.hilt === 'hand' && this.swingActive()) {
      const pitch = clamp(this.g.cam.pitch * 0.24, -0.17, 0.25);
      const axis = [Math.cos(this.yaw), 0, -Math.sin(this.yaw)];
      const original = v3.norm([-M[4], -M[5], -M[6]]);
      const cross = v3.cross(axis, original), dot = v3.dot(axis, original);
      bladeDir = v3.norm(v3.add(v3.add(v3.scale(original, Math.cos(pitch)), v3.scale(cross, Math.sin(pitch))), v3.scale(axis, dot * (1 - Math.cos(pitch)))));
    }
    this.blade.update(dt, M, this.g.attach.hiltLen * (this.hiltScaleY || 1), 1, this.now, bladeDir);
    this.blade.trailOn = (this.swingActive() || (this.thrown ? 0 : 0)) ? 1 : Math.max(0, this.blade.trailOn - dt * 6);
    if (this.swingActive()) this.blade.trailOn = 1;
  }
}
