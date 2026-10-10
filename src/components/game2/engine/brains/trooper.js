// Imperial trooper / officer brain: perception -> state machine -> button presses.
//   post     stand guard or walk a patrol; looks around; notices the player by sight or by noise
//   combat   hold a firing distance, reposition to spots that see the player, fire aimed bursts, back off a saber,
//            roll away from swings, officers rally everyone nearby
//   search   lost sight: walk to the last known position, then sweep nearby, then return to post
// Movement uses the level's navigation grid (A* + smoothing); shots use Game 2's blaster bolts, so the player's
// saber reflection and Force Absorb rules apply unchanged.
import { PathFollower } from '../level/nav.js';
import { rnd, clearCmd, yawTo, flatDist, steer, canSee } from './common.js';

const BARK_SEE = ['There he is!', 'Intruder!', 'Open fire!', 'Rebel scum!', 'Contact!'];
const BARK_SABER = ['He has a lightsaber!', 'Jedi!', 'Watch that saber!'];
const BARK_LOST = ['Where did he go?', 'Spread out, find him!', 'Lost him!'];
const pick = a => a[Math.floor(Math.random() * a.length)];

export const TROOPER_DEFAULTS = { sight: 22, hear: 9, range: [7, 13], burst: 3, gap: 0.22, rest: [1.4, 2.5], dmg: 7, err: 0.075, speed: 0.82, officer: false };

function brainOf(f) {
  const cfg = { ...TROOPER_DEFAULTS, ...(f.brainCfg || {}) };
  return f.ai ??= {
    cfg, state: 'post', path: new PathFollower(), lastSeen: null, seenT: -99, sawAt: -99, shootT: rnd(0.6, 1.4), burstLeft: 0, burstT: 0,
    spot: null, spotT: 0, searchT: 0, lookT: rnd(2, 5), patrolI: 0, rollCd: rnd(2, 4), barkedSaber: false, think: 0, hurtSeen: f.lastHurt,
  };
}

export function alertTrooper(g, f, at) {
  if (f.status === 'dead' || !f.ai) brainOf(f);
  const a = f.ai; if (a.state !== 'combat') { a.state = 'combat'; a.spot = null; a.spotT = 0; a.shootT = Math.min(a.shootT, rnd(0.5, 1.1)); }
  a.lastSeen = (at || g.player.pos).slice(); a.seenT = g.t;
}

function rally(g, f, radius) { for (const n of g.npcs) if (n !== f && n.team === f.team && n.kind === 'trooper' && n.status !== 'dead' && flatDist(n.pos, f.pos) < radius && (!n.ai || n.ai.state !== 'combat')) alertTrooper(g, n, g.player.pos); }

export function aiTrooper(g, f, dt) {
  const c = f.cmd; clearCmd(c); const a = brainOf(f), cfg = a.cfg, P = g.player;
  f.speedMul = cfg.speed;
  if (f.status !== 'normal') { a.burstLeft = 0; return; }
  if (f.distracted > 0) { a.state = 'post'; a.lastSeen = null; return; } // Mind Trick: forgets the player
  a.rollCd -= dt; a.shootT -= dt; a.think -= dt;
  const d = flatDist(f.pos, P.pos);
  // ---- perception (throttled; real line of sight through the level)
  if (a.think <= 0) {
    a.think = 0.15 + Math.random() * 0.1;
    a.sees = P.status !== 'dead' && canSee(g, f, P, cfg.sight, a.state !== 'post');
    const heard = P.status !== 'dead' && d < cfg.hear * (P.saber.holstered ? 0.6 : 1) && Math.abs(P.pos[1] - f.pos[1]) < 3;
    const hurt = f.lastHurt !== a.hurtSeen; a.hurtSeen = f.lastHurt;
    if (a.sees || heard || hurt) {
      if (a.state !== 'combat') { g.bark?.(f, pick(BARK_SEE)); if (cfg.officer) { rally(g, f, 26); g.bark?.(f, 'All units, engage!'); } }
      alertTrooper(g, f, P.pos); a.sawAt = g.t;
    }
    if (a.sees && !a.barkedSaber && !P.saber.holstered && d < 16) { a.barkedSaber = true; if (Math.random() < 0.5) g.bark?.(f, pick(BARK_SABER)); }
  }
  if (P.status === 'dead' && a.state === 'combat') { a.state = 'post'; a.path.clear(); }
  if (a.state === 'post') return post(g, f, a, c, dt);
  if (a.state === 'combat') return combat(g, f, a, c, dt, d);
  return search(g, f, a, c, dt);
}

function post(g, f, a, c, dt) {
  const route = f.patrol;
  if (route && route.length > 1) { // walk the patrol, pause at each point
    const goal = route[a.patrolI % route.length]; const dir = a.path.dir(g.world.nav, f, goal, dt, 0.8);
    if (dir) { f.targetYaw = Math.atan2(dir[0], dir[2]); steer(f, dir, c); c.walk = true; return; }
    a.lookT -= dt; if (a.lookT <= 0) { a.lookT = rnd(1.5, 3); a.patrolI++; a.path.clear(); }
    return;
  }
  const home = f.post; // guard: return to the post, then look around now and then
  if (home && flatDist(f.pos, home.pos) > 1.2) { const dir = a.path.dir(g.world.nav, f, home.pos, dt, 0.9); if (dir) { f.targetYaw = Math.atan2(dir[0], dir[2]); steer(f, dir, c); c.walk = true; return; } }
  a.lookT -= dt; if (a.lookT <= 0) { a.lookT = rnd(2.5, 5.5); f.targetYaw = (home ? home.yaw : f.yaw) + rnd(-0.9, 0.9); }
}

function combat(g, f, a, c, dt, d) {
  const P = g.player, cfg = a.cfg, nav = g.world.nav;
  if (a.sees) { a.lastSeen = P.pos.slice(); a.seenT = g.t; }
  const lostFor = g.t - a.seenT;
  if (lostFor > 1.6) { a.state = 'search'; a.searchT = 9; a.spot = a.lastSeen; a.path.clear(); g.bark?.(f, pick(BARK_LOST)); return; }
  f.targetYaw = yawTo(f, a.lastSeen);
  // ---- dodge a saber that is about to land (roll sideways)
  if (d < 3.2 && P.saber.isActiveSwing() && a.rollCd <= 0 && Math.random() < 0.5 && f.onGround) {
    a.rollCd = rnd(2.5, 4.5); c.crouchPressed = true; c.crouch = true; c.right = Math.random() < 0.5 ? 1 : -1; c.fwd = -0.4; return;
  }
  // ---- choose where to stand: keep the firing distance, keep line of sight, do not crowd other troopers
  a.spotT -= dt;
  const [rMin, rMax] = cfg.range;
  if (!a.spot || a.spotT <= 0 || d < rMin * 0.55 || (lostFor > 0.5 && a.spotT < 2)) {
    a.spotT = rnd(2.8, 4.8); a.spot = pickSpot(g, f, a, rMin, rMax) || null; a.path.clear();
  }
  let dir = null;
  if (d < 3.5) { // too close to a Jedi: back straight away (walk line permitting), else follow the spot
    const away = [f.pos[0] - P.pos[0], 0, f.pos[2] - P.pos[2]], l = Math.hypot(away[0], away[2]) || 1; const tgt = [f.pos[0] + away[0] / l * 2, f.pos[1], f.pos[2] + away[2] / l * 2];
    if (nav.walkLine(f.pos, tgt)) dir = [away[0] / l, 0, away[2] / l];
  }
  if (!dir && a.spot) dir = a.path.dir(nav, f, a.spot, dt, 0.8);
  if (dir) { steer(f, dir, c, d < 3.5 ? 1 : 0.85); c.walk = d > 5 && !a.sees; }
  // ---- fire: aimed bursts while facing the player with a clear shot
  const facing = Math.abs(wrap(f.targetYaw - f.yaw)) < 0.3;
  if (a.burstLeft > 0) {
    a.burstT -= dt;
    if (a.burstT <= 0) { a.burstLeft--; a.burstT = cfg.gap; if (a.sees && facing) fire(g, f, cfg); }
  } else if (a.shootT <= 0 && a.sees && facing && f.onGround && d < cfg.sight) {
    a.shootT = rnd(cfg.rest[0], cfg.rest[1]); a.burstLeft = cfg.burst; a.burstT = 0.18;
    f.playForce('BOTH_ATTACK2', { durMs: Math.round((cfg.burst * cfg.gap + 0.3) * 1000) });
  }
}

function fire(g, f, cfg) {
  const P = g.player, sp = Math.hypot(P.vel[0], P.vel[2]);
  const err = cfg.err * (1 + Math.min(1.2, sp / 6)) * (g.force.active.speed ? 1.8 : 1);
  g.combat.shoot(f, P.chest(), { dmg: cfg.dmg, err });
}

function search(g, f, a, c, dt) {
  const nav = g.world.nav; a.searchT -= dt;
  if (a.sees) { alertTrooper(g, f, g.player.pos); return; }
  if (a.searchT <= 0) { a.state = 'post'; a.path.clear(); return; }
  if (!a.spot || flatDist(f.pos, a.spot) < 1.2) { a.spot = nav.randomNear(a.lastSeen || f.pos, 7) || f.pos.slice(); a.path.clear(); }
  const dir = a.path.dir(nav, f, a.spot, dt, 1); if (dir) { f.targetYaw = Math.atan2(dir[0], dir[2]); steer(f, dir, c); c.walk = true; }
  else a.spot = null;
}

// sample reachable spots around the player in the firing ring; prefer ones with a clear shot and some spacing
function pickSpot(g, f, a, rMin, rMax) {
  const P = g.player, nav = g.world.nav; let best = null, bs = -1e9;
  for (let n = 0; n < 14; n++) {
    const ang = Math.random() * Math.PI * 2, r = rnd(rMin, rMax);
    const base = n < 7 ? P.pos : f.pos; const x = base[0] + Math.cos(ang) * (n < 7 ? r : rnd(1.5, 5)), z = base[2] + Math.sin(ang) * (n < 7 ? r : rnd(1.5, 5));
    const k = nav.cell(x, z); if (!nav.open(k)) continue; const y = nav.y[k];
    const dp = Math.hypot(x - P.pos[0], z - P.pos[2]); if (dp < rMin * 0.8 || dp > rMax * 1.3) continue;
    let s = -Math.abs(dp - (rMin + rMax) / 2) * 0.4 - Math.hypot(x - f.pos[0], z - f.pos[2]) * 0.25;
    if (g.world.lineOfSight([x, y + 1.55, z], P.chest())) s += 6;
    for (const o of g.npcs) if (o !== f && o.status !== 'dead' && o.team === f.team && Math.hypot(o.pos[0] - x, o.pos[2] - z) < 2.5) s -= 4;
    if (s > bs) { bs = s; best = [x, y, z]; }
  }
  return best;
}

const wrap = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
