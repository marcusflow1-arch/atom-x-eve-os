/* eslint-disable */
// Force clashes (Atom X Eve). Two fighters who push each other at the same moment (one within CLASH_WINDOW s of the
// other), or pour Force Lightning into each other, lock in a contest of will for CLASH_S s. Both mash the attack button
// (the player clicks; an AI clicks at its own pace, by skill): the energy between their hands drifts toward whoever is
// losing, and when time is up the side with more clicks wins. The loser is blasted away (push) or electrocuted and thrown
// down (lightning); a tie throws both back. A hit or push from anyone else, or a death, breaks it. Offline only.
import { v3, clamp } from './math.js';
import { bolt } from './fx.js';

export const CLASH_S = 3, CLASH_WINDOW = 0.5, CLASH_RANGE = 13;
const COL = { push: [0.65, 0.85, 1], lightning: [0.6, 0.75, 1] };
const handsMid = f => { const h = f.force?.hands ? f.force.hands() : [f.actor.bonePos('lhand'), f.actor.bonePos('rhand')]; return v3.lerp(h[0], h[1], 0.5); };

// can a and b clash: both alive, on their feet, in range and facing each other
export function canClash(a, b) {
  if (!a || !b || a === b || a.status === 'dead' || b.status === 'dead' || a.remote || b.remote || !a.force || !b.force) return false;
  if (!['normal', 'roll', 'clash'].includes(a.status) || !['normal', 'roll'].includes(b.status) || !a.onGround || !b.onGround) return false;
  const dx = b.pos[0] - a.pos[0], dz = b.pos[2] - a.pos[2], L = Math.hypot(dx, dz); if (L > CLASH_RANGE || L < 0.8) return false;
  const fa = (Math.sin(a.yaw) * dx + Math.cos(a.yaw) * dz) / L, fb = -(Math.sin(b.yaw) * dx + Math.cos(b.yaw) * dz) / L;
  return fa > 0.3 && fb > 0.3;
}

export class ForceClash {
  constructor(g, a, b, kind) {
    this.g = g; this.a = a; this.b = b; this.kind = kind; this.t0 = g.t; this.until = g.t + CLASH_S; this.ended = false; this.ringT = 0;
    this.clicks = new Map([[a, 0], [b, 0]]);
    this.rate = new Map([a, b].map(f => [f, 6 + 3.5 * clamp(f.blockSkill ?? 0.5, 0, 1)])); // an AI's clicks per second
    const an = kind === 'lightning' ? 'BOTH_FORCELIGHTNING_HOLD' : 'BOTH_FORCEPUSH';
    for (const [f, o] of [[a, b], [b, a]]) {
      f.force.release?.(true); f.force.charging = null; f.endForce?.(); f.cancelAttackState?.(); if (f.kata) f.endKata?.(true);
      f.status = 'clash'; f.statusT = 0; f.vel = [0, 0, 0]; f.yaw = f.targetYaw = Math.atan2(o.pos[0] - f.pos[0], o.pos[2] - f.pos[2]);
      // the arm held out at the push's full reach (or the lightning hold, looping)
      f.actor.setBoth(an, kind === 'lightning' ? { blend: 0.1, restart: true, loop: true } : { blend: 0.1, restart: true, loop: false, speed: 0.001, startAt: 0.08 / 0.001 });
    }
    const p = this.point(); g.sfxAt(kind === 'lightning' ? 'lightning' : 'push', p, 1); g.sfxAt('hit3', p, 0.7); g.shake?.(0.35);
    this.loop = g.sfx?.loop?.(kind === 'lightning' ? 'lightning2' : 'protectloop', { vol: 0.45 });
    if (a.isPlayer || b.isPlayer) g.banner?.('FORCE CLASH', [0.8, 0.9, 1], 1.4);
  }
  involves(f) { return f === this.a || f === this.b; }
  click(f) { if (!this.ended && this.clicks.has(f)) this.clicks.set(f, this.clicks.get(f) + 1); }
  // how far the meeting point sits from a toward b (0.5 when even; toward whoever is losing)
  balance() { const ca = this.clicks.get(this.a), cb = this.clicks.get(this.b); return clamp(0.5 + (ca - cb) / (ca + cb + 6) * 0.8, 0.15, 0.85); }
  point() { return v3.lerp(handsMid(this.a), handsMid(this.b), this.balance()); }
  update(dt) {
    const g = this.g, a = this.a, b = this.b; if (this.ended) return;
    if (a.status !== 'clash' || b.status !== 'clash') return this.finish(null, true); // knocked out of it, or dead
    for (const f of [a, b]) { if (!f.isPlayer && Math.random() < this.rate.get(f) * dt) this.click(f); f.vel[0] = f.vel[2] = 0; }
    if (this.kind === 'lightning') for (const f of [a, b]) f.force.fp = Math.max(0, f.force.fp - 6 * dt);
    this.ringT -= dt; if (this.ringT <= 0) { this.ringT = 0.16; const p = this.point(), n = v3.norm(v3.sub(b.pos, a.pos)); g.fx.ring({ p, n, r0: 0.1, r1: 0.9 + Math.random() * 0.4, life: 0.3, w: 0.07, c: [...COL[this.kind], 0.9] }); g.fx.sparks(p, [0, 1, 0], 4, [0.8, 0.9, 1, 1]); }
    if (this.kind === 'lightning') { g.lightFlash = Math.max(g.lightFlash, 0.5); g.lightFlashPos = this.point(); }
    if (g.t >= this.until) { const ca = this.clicks.get(a), cb = this.clicks.get(b); this.finish(ca === cb ? null : ca > cb ? a : b); }
  }
  finish(winner, broken = false) {
    if (this.ended) return; this.ended = true; const g = this.g, P = this.point();
    this.loop?.stop?.(0.2);
    for (const f of [this.a, this.b]) if (f.status === 'clash') { f.status = 'normal'; f.statusT = 0; f.endForce?.(); f.actor.followLegs?.(); f.actor.torso.cur = null; }
    if (g.clash === this) g.clash = null;
    if (broken) return;
    const blast = (L, W, k) => {
      const dx = L.pos[0] - W.pos[0], dz = L.pos[2] - W.pos[2], d = Math.hypot(dx, dz) || 1, dir = [dx / d, 0, dz / d]; L.markAttacker?.(W);
      if (this.kind === 'lightning') { L.electrify?.(1.2); L.hurt(30 * k, W, { noFlinch: true }); if (L.status !== 'dead') L.push(dir, 9 * k, 3.5, { keepYaw: false, anim: 'BOTH_KNOCKDOWN1' }); }
      else { L.hurt(18 * k, W, { noFlinch: true }); if (L.status !== 'dead') L.push(dir, 17 * k, 5, { keepYaw: false, anim: 'BOTH_KNOCKDOWN1' }); }
    };
    g.fx.ring({ p: P, n: [0, 1, 0], r0: 0.3, r1: 3.2, life: 0.5, w: 0.2, c: [1, 1, 1, 0.9] }); g.fx.sparks(P, [0, 1, 0], 24, [0.8, 0.9, 1, 1]); g.sfxAt('hit3', P, 1); g.shake?.(0.5);
    const mine = this.a.isPlayer || this.b.isPlayer;
    if (winner) {
      const loser = winner === this.a ? this.b : this.a; winner.playForce?.(this.kind === 'lightning' ? 'BOTH_FORCELIGHTNING_RELEASE' : 'BOTH_FORCEPUSH', { durMs: 600 }); blast(loser, winner, 1);
      if (mine) g.banner?.(winner.isPlayer ? 'CLASH WON' : 'CLASH LOST', winner.isPlayer ? [0.6, 1, 0.7] : [1, 0.5, 0.4], 1.4);
    } else { blast(this.a, this.b, 0.5); blast(this.b, this.a, 0.5); if (mine) g.banner?.('STALEMATE', [0.85, 0.9, 1], 1.2); }
  }
  draw(R) {
    if (this.ended) return; const g = this.g, P = this.point(), col = COL[this.kind], ha = handsMid(this.a), hb = handsMid(this.b), pulse = 0.85 + 0.15 * Math.sin(g.t * 40);
    for (const h of [ha, hb]) {
      if (this.kind === 'lightning') { const pts = bolt(h, P, 10, 0.14); for (let i = 0; i < pts.length - 1; i++) { R.beam(pts[i], pts[i + 1], 0.07, [col[0], col[1], col[2], 0.35]); R.beam(pts[i], pts[i + 1], 0.02, [1, 1, 1, 0.9]); } }
      else { R.beam(h, P, 0.22 * pulse, [col[0], col[1], col[2], 0.25]); R.beam(h, P, 0.06, [0.9, 0.97, 1, 0.8]); }
    }
    R.billboard(P, 0.55 * pulse, [col[0], col[1], col[2], 0.9], 0); R.billboard(P, 0.25, [1, 1, 1, 1], 0);
  }
  // the tug of war, when the player is in it
  drawHUD(x, W, H) {
    const me = this.a.isPlayer ? this.a : this.b.isPlayer ? this.b : null; if (!me || this.ended || !W) return;
    const them = me === this.a ? this.b : this.a, cm = this.clicks.get(me), ct = this.clicks.get(them), k = (cm + 3) / (cm + ct + 6), cx = W / 2, y = H * 0.66, w = 320;
    x.save(); x.textAlign = 'center'; x.font = '800 22px system-ui, sans-serif'; x.fillStyle = '#dff2ff';
    x.fillText('FORCE CLASH  ·  CLICK!', cx, y - 18);
    x.fillStyle = 'rgba(5,10,22,0.8)'; x.fillRect(cx - w / 2 - 3, y - 3, w + 6, 20);
    x.fillStyle = '#ff6a55'; x.fillRect(cx - w / 2, y, w, 14); x.fillStyle = '#7fd2ff'; x.fillRect(cx - w / 2, y, w * k, 14);
    x.font = '700 12px system-ui, sans-serif'; x.fillStyle = '#e8f2ff'; x.fillText(Math.max(0, this.until - this.g.t).toFixed(1) + ' s', cx, y + 34);
    x.restore();
  }
}
