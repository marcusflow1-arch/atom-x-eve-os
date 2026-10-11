// Local Game Two team modes: CTF (1 human + 6 AI vs 7 AI) and
// Sudden Death (1 human + 7 AI vs 8 AI; no respawns).
// Reuses Game Two's actual Fighter, saber, Force, collision and rendering.
// These are OFFLINE AI matches, not 16-human Railway rooms.
const distance = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const isAlive = f => f && f.status !== 'dead' && f.hp > 0;
const opposite = team => team === 'blue' ? 'red' : 'blue';
const copy = p => p.slice();
const colors = { blue: [0.1, 0.68, 1, 0.75], red: [1, 0.19, 0.17, 0.75] };

export const TEAM_MODES = Object.freeze({
  ctf: { id: 'ctf', label: 'Capture the Flag', members: 7, respawn: 5, captureTarget: 3 },
  sudden: { id: 'sudden', label: 'Sudden Death 8v8', members: 8, respawn: null },
});

export function chooseTeamHomes(world, fallbackBlue, fallbackRed) {
  const original = (world.map?.spawns || []).filter(s => s.kind === 'info_player_deathmatch');
  // The native Drive-sourced BSP supplies authentic deathmatch start locations.
  // Keep equal-height, floor-supported starts; prefer widely separated positions.
  let best = null, separation = 0;
  for (const a of original) for (const b of original) {
    if (a === b || Math.abs(a.pos[1] - b.pos[1]) > 0.7) continue;
    const d = distance(a.pos, b.pos);
    if (d < 5 || d <= separation) continue;
    const floorA = world.floorAt(a.pos[0], a.pos[2], a.pos[1] + 1.6);
    const floorB = world.floorAt(b.pos[0], b.pos[2], b.pos[1] + 1.6);
    if (floorA === null || floorB === null) continue;
    if (Math.abs(floorA - floorB) > 0.8) continue;
    separation = d;
    best = [ [a.pos[0], floorA, a.pos[2]], [b.pos[0], floorB, b.pos[2]] ];
  }
  return { blue: best ? best[0] : copy(fallbackBlue), red: best ? best[1] : copy(fallbackRed) };
}

export function spawnNearby(world, home, index, participants) {
  // Use real collision/floor probes before placing anyone. No teleporting
  // through walls. The source BSP has only 3 deathmatch spawns, but team
  // modes need up to 16 safe distinct positions.
  const golden = 2.399963229728653;
  for (let attempt = 0; attempt < 46; attempt++) {
    const ring = 1.5 + ((index + attempt) % 6) * 0.85;
    const angle = (index + attempt * 0.65 + participants * 0.11) * golden;
    const x = home[0] + Math.cos(angle) * ring, z = home[2] + Math.sin(angle) * ring;
    const y = world.floorAt(x, z, home[1] + 1.5);
    if (y === null || Math.abs(y - home[1]) > 0.75) continue;
    const p = [x, y, z], before = copy(p);
    world.collide(p, 0.46);
    if (distance(p, before) < 0.08) return p;
  }
  return copy(home); // always keep fighters within their own floor section
}

export class Game2TeamMatch {
  constructor(game, mode, mapId = 'training') {
    if (!TEAM_MODES[mode]) throw new Error('Unknown Game 2 team mode: ' + mode);
    this.g = game;
    this.config = TEAM_MODES[mode];
    this.mode = mode;
    this.mapId = mapId;
    this.homes = chooseTeamHomes(game.world, game.playerSpawn, game.enemySpawn);
    this.scores = { blue: 0, red: 0 };
    this.flags = {
      blue: { home: copy(this.homes.blue), pos: copy(this.homes.blue), state: 'base', carrier: null, dropTime: 0 },
      red: { home: copy(this.homes.red), pos: copy(this.homes.red), state: 'base', carrier: null, dropTime: 0 },
    };
    this.ended = false;
    this.winner = null;
    this.message = '';
    this.playerRespawnAt = null;
    this.spawnTeams();
  }

  spawnTeams() {
    const g = this.g, count = this.config.members;
    g.player.team = 'blue';
    g.playerSpawn = copy(this.homes.blue);
    g.enemySpawn = copy(this.homes.red);
    g.player.pos = copy(this.homes.blue);
    g.player.spawn = copy(this.homes.blue);
    g.player.label = 'You · Blue';
    g.readySaber(g.player);

    const roles = ['attacker', 'defender', 'support'];
    for (const team of ['blue', 'red']) {
      const botCount = team === 'blue' ? count - 1 : count;
      for (let i = 0; i < botCount; i++) {
        const p = spawnNearby(g.world, this.homes[team], i + 1, botCount);
        const f = g.addNpc('duelist', p[0], p[2], {
          name: team + '_bot_' + (i + 1),
          label: (team === 'blue' ? 'Blue' : 'Red') + ' ' + (i + 1),
          team, hp: 100,
          tint: team === 'blue' ? [0.3, 0.74, 1] : [0.94, 0.22, 0.18],
          tintAmt: 0.5, saber: true,
          blade: team === 'blue' ? [0.22, 0.52, 1] : [1, 0.13, 0.08],
          yaw: team === 'blue' ? 0 : Math.PI, dmgScale: 0.6, blockSkill: 0.38,
        });
        f.pos[1] = p[1]; f.spawn = copy(p);
        f.matchRole = roles[i % roles.length];
        f.reaction = 0.46;
      }
    }
    g.hud.msg(this.config.label + ' · ' + count + ' vs ' + count + ' · ' + this.mapId);
  }

  drop(flag, now) {
    if (flag.state !== 'carried') return;
    flag.pos = copy(flag.carrier.pos);
    flag.carrier = null;
    flag.state = 'dropped';
    flag.dropTime = now;
  }
  reset(flag) {
    flag.pos = copy(flag.home);
    flag.carrier = null;
    flag.state = 'base';
  }
  finish(team) {
    if (this.ended) return;
    this.ended = true;
    this.winner = team;
    this.message = (team === 'blue' ? 'BLUE TEAM WINS' : 'RED TEAM WINS');
    this.g.hud.msg(this.message + ' · Return to the main menu for a rematch');
  }
  onDeath(f) {
    for (const flag of Object.values(this.flags)) if (flag.carrier === f) this.drop(flag, this.g.t);
    if (f.isPlayer && this.mode === 'ctf') this.playerRespawnAt = this.g.t + this.config.respawn;
  }

  update(dt) {
    if (this.ended) return;
    const g = this.g, now = g.t;
    if (this.mode === 'sudden') {
      // No respawns. The entire opposing team must be eliminated.
      const blue = g.fighters().some(f => f.team === 'blue' && isAlive(f));
      const red = g.fighters().some(f => f.team === 'red' && isAlive(f));
      if (!blue || !red) this.finish(blue ? 'blue' : 'red');
      return;
    }
    if (this.playerRespawnAt !== null && now >= this.playerRespawnAt) {
      this.playerRespawnAt = null;
      g.respawnPlayer();
      g.hud.msg('Respawned · recover your flag');
    }
    for (const n of g.npcs) {
      if (!isAlive(n) && now - n.deadAt >= this.config.respawn) g.respawnNpc(n);
    }

    for (const [team, flag] of Object.entries(this.flags)) {
      if (flag.state === 'carried') {
        if (!isAlive(flag.carrier)) this.drop(flag, now);
        else flag.pos = copy(flag.carrier.pos);
      }
      if (flag.state === 'dropped' && now - flag.dropTime >= 20) this.reset(flag);
      // Teammates immediately return their own dropped flag.
      if (flag.state === 'dropped' && g.fighters().some(f => f.team === team && isAlive(f) && distance(f.pos, flag.pos) < 1.6)) {
        this.reset(flag);
        g.hud.msg(team.toUpperCase() + ' flag returned');
      }
      if (flag.state !== 'carried') {
        const carrier = g.fighters().find(f => f.team === opposite(team) && isAlive(f) && distance(f.pos, flag.pos) < 1.65);
        if (carrier) {
          flag.carrier = carrier;
          flag.state = 'carried';
          g.hud.msg((carrier.isPlayer ? 'You' : carrier.label) + ' took the ' + team.toUpperCase() + ' flag');
        }
      }
    }

    for (const team of ['blue', 'red']) {
      const stolen = this.flags[opposite(team)], own = this.flags[team];
      if (stolen.state !== 'carried' || stolen.carrier?.team !== team || own.state !== 'base') continue;
      if (distance(stolen.carrier.pos, own.home) < 2.2) {
        this.scores[team]++;
        this.reset(stolen);
        this.reset(own);
        g.hud.msg(team.toUpperCase() + ' CAPTURE · ' + this.scores.blue + ':' + this.scores.red);
        if (this.scores[team] >= this.config.captureTarget) this.finish(team);
      }
    }
  }

  brain(f) {
    const g = this.g, c = f.cmd;
    c.fwd = c.right = c.up = 0;
    c.walk = c.crouch = c.attack = c.alt = c.jump = c.jumpPressed = c.crouchPressed = false;
    if (!isAlive(f) || this.ended) return;

    const foes = g.foesOf(f);
    const closest = foes.reduce((best, other) =>
      !best || distance(f.pos, other.pos) < distance(f.pos, best.pos) ? other : best, null);
    const near = closest && distance(f.pos, closest.pos) < 4.7 ? closest : null;
    const myFlag = this.flags[f.team], theirFlag = this.flags[opposite(f.team)];
    const carry = theirFlag.carrier === f;

    let objective = closest?.pos || this.homes[opposite(f.team)];
    if (this.mode === 'ctf') {
      if (carry) objective = this.homes[f.team];
      else if (myFlag.state === 'carried' && f.matchRole !== 'attacker') objective = myFlag.carrier?.pos || myFlag.pos;
      else if (f.matchRole === 'defender') objective = myFlag.state === 'dropped' ? myFlag.pos : myFlag.home;
      else if (f.matchRole === 'support' && theirFlag.carrier?.team === f.team) objective = theirFlag.carrier.pos;
      else objective = theirFlag.pos;
    }
    const target = near || (this.mode === 'sudden' ? closest : null);
    const destination = target?.pos || objective;
    if (!destination) return;
    const dx = destination[0] - f.pos[0], dz = destination[2] - f.pos[2];
    const d = Math.hypot(dx, dz);
    f.targetYaw = Math.atan2(dx, dz);
    if (target && d < 2.7) {
      c.attack = (g.t + f.humId * 0.29) % 1.15 < 0.75;
      c.right = Math.sin(g.t * 1.2 + f.humId) > 0 ? 0.35 : -0.35;
    }
    if (d > (target ? 1.8 : 1.3)) c.fwd = 1;

    // Basic collision-aware steering (a full waypoint/NavMesh brain follows).
    if (d > 2 && g.world.lineOfSight && !g.world.lineOfSight(f.chest(), [destination[0], destination[1] + 1, destination[2]])) {
      c.right = f.humId % 2 ? 0.7 : -0.7;
    }
  }

  drawWorld(renderer) {
    if (this.mode !== 'ctf') return;
    for (const [team, flag] of Object.entries(this.flags)) {
      if (flag.state === 'carried') continue;
      const pos = flag.state === 'base' ? flag.home : flag.pos;
      renderer.billboard([pos[0], pos[1] + 1.6, pos[2]], 0.78, colors[team], 0);
      this.g.fx.disc([pos[0], pos[1] + 0.04, pos[2]], 1.55, colors[team], 1);
    }
  }

  drawHUD(ctx, width, height) {
    if (!width || !height) return;
    const x = width / 2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(4,12,25,0.78)';
    ctx.fillRect(x - 195, 14, 390, 56);
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillStyle = '#8cddff';
    ctx.fillText(this.mode === 'ctf' ? 'CAPTURE THE FLAG · 7v7' : 'SUDDEN DEATH · 8v8', x, 34);
    ctx.font = 'bold 13px system-ui, sans-serif';
    if (this.mode === 'ctf') {
      ctx.fillStyle = '#f2f6ff';
      ctx.fillText('BLUE ' + this.scores.blue + '    —    ' + this.scores.red + ' RED', x, 54);
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = '#b7c5d9';
      ctx.fillText('Blue flag: ' + this.flags.blue.state + '   |   Red flag: ' + this.flags.red.state, x, 88);
    } else {
      const count = team => this.g.fighters().filter(f => f.team === team && isAlive(f)).length;
      ctx.fillStyle = '#f2f6ff';
      ctx.fillText('BLUE ' + count('blue') + ' ALIVE    —    ' + count('red') + ' RED ALIVE', x, 54);
    }
    if (this.ended) {
      ctx.fillStyle = 'rgba(3,8,18,0.82)';
      ctx.fillRect(x - 240, height * 0.36, 480, 118);
      ctx.font = 'bold 30px system-ui, sans-serif';
      ctx.fillStyle = this.winner === 'blue' ? '#96dcff' : '#ff9e91';
      ctx.fillText(this.message, x, height * 0.36 + 57);
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillStyle = '#d4e2ee';
      ctx.fillText('Return to the menu to play again', x, height * 0.36 + 82);
    }
    ctx.restore();
  }
}
