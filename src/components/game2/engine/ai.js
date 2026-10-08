/* eslint-disable */
// Simple brains for the training droids (blaster), the red-saber duelist and the friendly Jedi.
import { v3, clamp, wrapPi } from './math.js';
const rnd = (a, b) => a + Math.random() * (b - a);
const clear = c => { c.fwd = c.right = c.up = 0; c.walk = c.crouch = c.attack = c.alt = c.jump = c.jumpPressed = c.crouchPressed = false; };
const toward = (f, P) => Math.atan2(P.pos[0] - f.pos[0], P.pos[2] - f.pos[2]);

export function aiDroid(g, f, dt) {
  const P = g.player, c = f.cmd; clear(c); const a = f.ai ??= { strafe: Math.random() < 0.5 ? 1 : -1, strafeT: rnd(1, 2.5), shootT: rnd(1.5, 4), wander: rnd(0, 6) };
  if (f.status !== 'normal') return;
  const dx = P.pos[0] - f.pos[0], dz = P.pos[2] - f.pos[2], dist = Math.hypot(dx, dz);
  a.strafeT -= dt; a.shootT -= dt;
  const aware = dist < 17 && f.distracted <= 0 && P.status !== 'dead' && f.provoked !== false;
  if (!aware) { // idle: sway and look around
    a.wander -= dt; if (a.wander <= 0) { a.wander = rnd(3, 7); f.targetYaw = f.yaw + rnd(-1.2, 1.2); } return;
  }
  f.targetYaw = toward(f, P); f.speedMul = 0.75;
  if (a.strafeT <= 0) { a.strafeT = rnd(1.2, 3); a.strafe = Math.random() < 0.5 ? 1 : -1; }
  if (dist > 10) { c.fwd = 1; c.walk = true; } else if (dist < 5) { c.fwd = -1; c.walk = true; } else { c.right = a.strafe; c.walk = true; }
  if (a.shootT <= 0 && dist < 18 && f.forceUntil <= g.t && f.onGround) {
    a.shootT = rnd(2.2, 4.2); f.playForce('BOTH_ATTACK2', { durMs: 520 }); f.after(0.2, () => { if (f.status === 'normal' || f.status === 'shocked') g.combat.shoot(f, null, { dmg: 6 }); });
  }
}

export function aiDuelist(g, f, dt) {
  const P = g.player, c = f.cmd; clear(c); const a = f.ai ??= { mode: 'dormant', t: 0, strafe: 1, pushT: rnd(6, 10), style: 2 };
  if (f.status !== 'normal') { return; }
  if (f.saber.holstered) f.igniteNow();
  const dx = P.pos[0] - f.pos[0], dz = P.pos[2] - f.pos[2], dist = Math.hypot(dx, dz);
  if (P.status === 'dead') { a.mode = 'dormant'; return; }
  if (a.mode === 'dormant') { if ((dist < 11 && f.distracted <= 0) || f.hp < f.maxHp) { a.mode = 'approach'; g.hud.msg('The duelist ignites a crimson blade'); } else { f.targetYaw = toward(f, P); return; } }
  if (f.distracted > 0) { f.targetYaw = f.yaw; return; } // mind-tricked: loses track of the player
  f.targetYaw = toward(f, P); a.t -= dt; a.pushT -= dt;
  const lowHp = f.hp < f.maxHp * 0.3;
  if (a.mode === 'approach') { c.fwd = 1; if (dist < 2.5) { a.mode = 'attack'; a.t = rnd(0.5, 1.2); a.atkDir = Math.floor(Math.random() * 4); a.style = 1 + Math.floor(Math.random() * 3); f.setStyle(a.style); } return; }
  if (a.t <= 0) {
    const r = Math.random();
    if (dist > 3.6) { a.mode = 'approach'; return; }
    if (lowHp) a.mode = r < 0.4 ? 'guard' : r < 0.7 ? 'retreat' : 'attack'; else a.mode = r < 0.5 ? 'attack' : r < 0.7 ? 'strafe' : r < 0.82 ? 'guard' : 'retreat';
    a.t = a.mode === 'attack' ? rnd(0.4, 1.4) : a.mode === 'guard' ? rnd(0.5, 1.1) : rnd(0.7, 1.4); a.strafe = Math.random() < 0.5 ? 1 : -1; a.atkDir = Math.floor(Math.random() * 4);
    if (a.mode === 'attack' && Math.random() < 0.25) f.setStyle(a.style = 1 + Math.floor(Math.random() * 3));
  }
  switch (a.mode) {
    case 'attack': c.attack = true; c.right = [0, 1, -1, 0][a.atkDir]; c.fwd = [1, 0, 0, 1][a.atkDir] * (dist > 2.3 ? 1 : 0.5); if (dist > 2.7) { c.fwd = 1; } break;
    case 'strafe': c.right = a.strafe; c.walk = true; if (dist > 3) c.fwd = 1; if (dist < 1.8) c.fwd = -1; break;
    case 'retreat': c.fwd = -1; c.walk = true; break;
    default: break;
  }
  // force push now and then when the player is close
  if (a.pushT <= 0 && dist < 5.5 && f.forceUntil <= g.t && f.saber.weaponTime <= 0 && !f.saber.isActiveSwing()) {
    a.pushT = rnd(8, 14); f.playForce('BOTH_FORCEPUSH', { durMs: 680 }); g.sfxAt('push', f.pos, 0.9);
    f.after(0.14, () => { if (f.status !== 'normal') return; const d = v3.norm([P.pos[0] - f.pos[0], 0, P.pos[2] - f.pos[2]]); const m = v3.addS(f.chest(), d, 0.6); g.fx.ring({ p: m, n: d, r0: 0.25, r1: 2.6, life: 0.5, w: 0.18, c: [1, 0.5, 0.45, 0.9], move: v3.scale(d, 13) });
      if (v3.dist(P.pos, f.pos) < 7 && P.status !== 'dead') { if (g.force.active.absorb) { g.force.fp = Math.min(g.force.max, g.force.fp + 15); g.hud.msg('Force Absorb negated the push'); g.sfxAt('absorbhit', P.pos, 1); } else { P.push(d, 11, 4.5); P.hurt(5, f, { noFlinch: true }); g.hud.hit(5); g.shake(0.3); } } });
  }
}

export function aiAlly(g, f, dt) {
  const P = g.player; clear(f.cmd); if (f.status !== 'normal') return;
  const dist = Math.hypot(P.pos[0] - f.pos[0], P.pos[2] - f.pos[2]);
  if (f.saber.holstered) f.igniteNow();
  if (dist < 16) f.targetYaw = toward(f, P);
  if (f.energized > 0) { f.energized -= dt; f.glow = 0.12 + 0.05 * Math.sin(g.t * 6); f.glowCol = [0.35, 0.6, 1]; if (f.energized <= 0) f.glow = 0; }
}
