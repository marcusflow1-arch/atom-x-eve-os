/* eslint-disable */
// Dark Jedi brain. Saber fencing (approach / attack / strafe / guard / retreat) like the duelist, plus Force powers.
// It plays with the same Force class and the same costs as the player: it only "presses the buttons"
// (Force.cast() and the `want` hold flags). Whether a push / pull / grip actually lands is decided by the shared
// rules (forcerules.js via Game.applyThrow), and the player gets the same chances to answer it.
import { wrapPi } from './math.js';
import { GRIP_MAX_DIST } from './forcerules.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const clear = c => { c.fwd = c.right = c.up = 0; c.walk = c.crouch = c.attack = c.alt = c.jump = c.jumpPressed = c.crouchPressed = false; };
const toward = (f, P) => Math.atan2(P.pos[0] - f.pos[0], P.pos[2] - f.pos[2]);
const newBrain = () => ({ mode: 'approach', t: 0, think: 1.2, react: 0, strafe: 1, style: 2, atkDir: 0, holdT: 0, gripT: 0, gripPlan: undefined, gripWait: 0, cd: { push: 3, pull: 2, grip: 6, lightning: 5, heal: 0, speed: 8, rage: 0, protect: 10, absorb: 0 } });

export function aiDarkJedi(g, f, dt) {
  const P = g.player, c = f.cmd, F = f.force; clear(c);
  const a = f.ai ??= newBrain();
  for (const k in a.cd) a.cd[k] = Math.max(0, a.cd[k] - dt);
  a.think -= dt; a.t -= dt; a.react -= dt;
  if (f.status === 'dead') { F.want = {}; return; }
  if (f.status === 'gripped') { gripReaction(f, a, F, dt); return; }
  a.gripT = 0; a.gripPlan = undefined;
  if (f.status !== 'normal') { F.want = {}; return; }
  if (f.saber.holstered) f.igniteNow();
  f.targetYaw = toward(f, P);
  const dx = P.pos[0] - f.pos[0], dz = P.pos[2] - f.pos[2], dist = Math.hypot(dx, dz);
  if (g.round.state !== 'fight' || P.status === 'dead') { F.want = {}; return; } // intro / round over: stand and watch
  const hpf = f.hp / f.maxHp, facing = Math.abs(wrapPi(f.targetYaw - f.yaw)) < 0.5;
  // ---- channelled powers: keep the pose, stop on a timer / when out of reach
  if (F.holding) {
    a.holdT -= dt;
    if (F.holding === 'lightning' && (a.holdT <= 0 || F.fp < 6 || dist > 11.5 || !facing || P.status !== 'normal')) F.want.lightning = false;
    else if (F.holding === 'grip' && a.holdT <= 0) F.want.grip = false;
    else if (F.holding === 'heal' && (a.holdT <= 0 || hpf > 0.72 || dist < 5)) F.want.heal = false;
    return;
  }
  F.want = {};
  // ---- reactive defence: the player is draining / zapping me -> raise Force Absorb
  const PF = g.force, hostile = (PF.holding === 'lightning' && PF.ltTargets && PF.ltTargets.some(h => h.t.ref === f)) || (PF.holding === 'drain' && PF.target && PF.target.ref === f);
  if (hostile && !F.active.absorb && F.fp >= 25 && f.forceUntil <= g.t && F.gcd <= 0 && a.react <= 0) {
    a.react = rnd(0.25, 0.7);
    if (Math.random() < 0.7) { F.cast('absorb'); return; }
  }
  // ---- Force powers (picked by distance, Force left and cooldowns)
  const canForce = f.forceUntil <= g.t && f.saber.weaponTime <= 0 && F.gcd <= 0 && f.onGround;
  if (canForce && a.think <= 0) { a.think = rnd(0.3, 0.6); if (decideForce(f, a, F, P, dist, hpf, facing)) return; }
  // ---- fencing
  if (hpf < 0.4 && a.cd.heal <= 0 && F.fp >= 35 && dist < 7.5 && a.mode !== 'attack') { a.mode = 'flee'; }
  if (a.mode === 'flee') { if (dist > 7.5 || hpf >= 0.4 || a.cd.heal > 0) a.mode = 'approach'; else { c.fwd = -1; return; } }
  f.blockSkill = a.mode === 'guard' ? 0.85 : a.mode === 'attack' ? 0.4 : 0.55;
  if (a.mode === 'approach') { c.fwd = 1; if (dist < 2.6) { a.mode = 'attack'; a.t = rnd(0.5, 1.2); a.atkDir = Math.floor(Math.random() * 4); a.style = 1 + Math.floor(Math.random() * 3); f.setStyle(a.style); } return; }
  if (a.t <= 0) {
    const r = Math.random();
    if (dist > 3.8) { a.mode = 'approach'; return; }
    if (hpf < 0.3) a.mode = r < 0.4 ? 'guard' : r < 0.7 ? 'retreat' : 'attack'; else a.mode = r < 0.5 ? 'attack' : r < 0.7 ? 'strafe' : r < 0.82 ? 'guard' : 'retreat';
    a.t = a.mode === 'attack' ? rnd(0.4, 1.4) : a.mode === 'guard' ? rnd(0.5, 1.1) : rnd(0.7, 1.4); a.strafe = Math.random() < 0.5 ? 1 : -1; a.atkDir = Math.floor(Math.random() * 4);
    if (a.mode === 'attack' && Math.random() < 0.25) f.setStyle(a.style = 1 + Math.floor(Math.random() * 3));
  }
  switch (a.mode) {
    case 'attack': c.attack = true; c.right = [0, 1, -1, 0][a.atkDir]; c.fwd = [1, 0, 0, 1][a.atkDir] * (dist > 2.3 ? 1 : 0.5); if (dist > 2.7) c.fwd = 1; break;
    case 'strafe': c.right = a.strafe; c.walk = true; if (dist > 3) c.fwd = 1; if (dist < 1.8) c.fwd = -1; break;
    case 'retreat': c.fwd = -1; c.walk = true; break;
    default: break;
  }
}

function decideForce(f, a, F, P, dist, hpf, facing) {
  const fp = F.fp, r = Math.random(), up = P.status === 'normal'; // push / pull / lightning are wasted on a target that is already down
  if (hpf < 0.4 && dist > 7 && a.cd.heal <= 0 && fp >= 35) { a.cd.heal = 16; a.holdT = 3.4; F.want.heal = true; if (F.cast('heal')) return true; F.want.heal = false; }
  if (hpf < 0.55 && !F.active.rage && a.cd.rage <= 0 && fp >= 70) { a.cd.rage = 30; if (F.cast('rage')) return true; }
  if (dist > 13 && !F.active.speed && a.cd.speed <= 0 && fp >= 85 && r < 0.3) { a.cd.speed = 25; if (F.cast('speed')) return true; }
  if (dist < 6 && !F.active.protect && a.cd.protect <= 0 && fp >= 70 && r < 0.25) { a.cd.protect = 22; if (F.cast('protect')) return true; }
  if (up && dist > 8 && a.cd.pull <= 0 && fp >= 45 && facing && r < 0.55) { a.cd.pull = rnd(7, 11); if (F.cast('pull')) return true; }
  if (up && dist > 3.5 && dist < 10.5 && a.cd.lightning <= 0 && fp >= 45 && facing && r < 0.4) { a.cd.lightning = rnd(9, 14); a.holdT = rnd(1.1, 2.2); F.want.lightning = true; if (F.cast('lightning')) return true; F.want.lightning = false; }
  if ((up || P.status === 'down') && dist > 2 && dist < GRIP_MAX_DIST - 0.5 && a.cd.grip <= 0 && fp >= 40 && facing && r < 0.4) { a.cd.grip = rnd(11, 16); a.holdT = 4.4; F.want.grip = true; if (F.cast('grip')) return true; F.want.grip = false; }
  if (up && dist < 4.2 && a.cd.push <= 0 && fp >= 35 && facing && r < 0.45) { a.cd.push = rnd(4.5, 8); if (F.cast('push')) return true; }
  return false;
}

// Gripped: after a short reaction time try to break free with a push (breaks the grip and hits the gripper, who is busy
// and cannot counter) or raise Absorb (cancels the grip). Sometimes it just takes the choke.
function gripReaction(f, a, F, dt) {
  a.gripT += dt;
  if (a.gripPlan === undefined) { const r = Math.random(); a.gripPlan = r < 0.5 ? 'push' : r < 0.78 ? 'absorb' : 'none'; a.gripWait = rnd(0.5, 1.5); }
  if (a.gripPlan !== 'none' && a.gripT >= a.gripWait && F.gcd <= 0) {
    const plan = a.gripPlan; a.gripPlan = 'none';
    if (plan === 'push' && F.fp >= 20) F.cast('push'); else if (F.fp >= 25) F.cast('absorb');
  }
}
