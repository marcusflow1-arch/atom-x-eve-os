// Companion brain (Jan Ors): follows the player through the level on the navigation grid, keeps a few metres back,
// shoots enemies she can see. 'hold' keeps her at a point (e.g. locked outside a door). Her bolts count as the
// player's side, so the regular bolt rules decide what they hit.
import { PathFollower } from '../level/nav.js';
import { rnd, clearCmd, yawTo, flatDist, steer, eyeOf } from './common.js';

export function aiCompanion(g, f, dt) {
  const c = f.cmd; clearCmd(c); const P = g.player, nav = g.world.nav;
  const a = f.ai ??= { path: new PathFollower(), shootT: rnd(1, 2), target: null, scanT: 0, mode: 'follow', hold: null };
  if (f.status !== 'normal') return;
  a.shootT -= dt; a.scanT -= dt;
  // ---- pick a target: nearest visible enemy within range
  if (a.scanT <= 0) {
    a.scanT = 0.3; a.target = null; let bd = 22;
    for (const n of g.npcs) { if (n.team !== 'enemy' || n.status === 'dead') continue; const d = flatDist(n.pos, f.pos); if (d < bd && g.world.lineOfSight(eyeOf(f), n.chest())) { bd = d; a.target = n; } }
  }
  // ---- move
  let goal = null, arrive = 0.9;
  if (a.mode === 'hold' && a.hold) goal = a.hold;
  else if (P.status !== 'dead') {
    const d = flatDist(f.pos, P.pos);
    if (d > 32 && !g.world.lineOfSight(eyeOf(f), P.chest())) { teleportNear(g, f, P.pos); return; } // fell far behind: catch up out of sight
    if (d > 5.5) { goal = P.pos; arrive = 4; }
  }
  const dir = goal ? a.path.dir(nav, f, goal, dt, arrive) : null;
  if (dir) { steer(f, dir, c); }
  // ---- face and shoot
  if (a.target && a.target.status !== 'dead') {
    f.targetYaw = yawTo(f, a.target.pos);
    if (a.shootT <= 0 && Math.abs(wrap(f.targetYaw - f.yaw)) < 0.35 && f.onGround) {
      a.shootT = rnd(1.5, 2.6); const T = a.target; f.playForce('BOTH_ATTACK2', { durMs: 520 });
      f.after(0.18, () => { if (f.status !== 'normal' || T.status === 'dead') return; g.combat.shoot(f, T.chest(), { dmg: 9, err: 0.09, col: [1, 0.55, 0.18] }); const b = g.combat.bolts[g.combat.bolts.length - 1]; if (b) b.team = 'player'; });
    }
  } else if (dir) f.targetYaw = Math.atan2(dir[0], dir[2]);
  else if (P.status !== 'dead') f.targetYaw = yawTo(f, P.pos);
}

export function teleportNear(g, f, p) {
  const nav = g.world.nav; const spot = nav.randomNear(p, 3.5) || p.slice();
  f.pos = [spot[0], spot[1], spot[2]]; f.vel = [0, 0, 0]; f.onGround = true; if (f.ai) f.ai.path.clear();
}

const wrap = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
