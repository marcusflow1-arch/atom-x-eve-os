// Mission director: runs a mission definition (missions/*.js) on top of the unchanged Game 2 combat.
//   objectives  ordered goals; each may set a checkpoint, run actions on start / completion and finish 'until'
//               { zone } the player stands in a zone · { cleared: [groups] } every member dead · { interact } 'E' used
//               { hold, seconds, radius } stay near a terminal while it works (progress events fire waves)
//   triggers    { zone, after, do } one-shot actions when the player first enters a zone (after an objective)
//   actions     say · spawn · open / close · alert · boss · companion · banner · complete
//   checkpoints dying restarts the current checkpoint: its enemies, doors and triggers go back to how they were
// The director only spawns, scripts and reports; every fight is decided by Fighter / SaberLogic / Combat / Force.
import { alertTrooper } from '../brains/trooper.js';
import { teleportNear } from '../brains/companion.js';

const SPEAKER = { KYLE: '#9fd0ff', JAN: '#ffd59a', REBORN: '#ff8f80', OFFICER: '#d8e0c8', TROOPER: '#e8ecf4' };
const rr = (x, a, b, c, d, r) => { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + c, b, a + c, b + d, r); x.arcTo(a + c, b + d, a, b + d, r); x.arcTo(a, b + d, a, b, r); x.arcTo(a, b, a + c, b, r); x.closePath(); };

export class MissionDirector {
  constructor(g, def) {
    this.g = g; this.def = def; this.space = g.world.space;
    this.doorStart = new Map([...this.space.doors].map(([id, d]) => [id, d.want]));
    this.dialog = []; this.line = null; this.barks = []; this.barkT = 0;
    this.toast = null; this.boss = null; this.state = 'play'; this.endT = 0; this.introT = 0; this.deadT = 0;
    this.companion = def.companion ? g.spawnArchetype(def.companion.archetype, def.companion.at, def.companion.yaw ?? 0, { name: 'companion' }) : null;
    if (this.companion) this.companion.ai = null;
    this.companionMode = 'follow'; this.companionAt = null;
    g.round = { state: 'fight', t: 0 }; // the Game 2 Dark Jedi brain only fights during a 'fight' round
    this.resetRun();
    this.start(0);
  }
  resetRun() {
    this.obj = -1; this.fired = new Set(); this.flags = new Set(); this.spawned = new Set(); this.cp = null; this.hold = null;
    this.stats = { time: 0, deaths: 0, dmg: 0, kills0: this.g.combat.kills, refl0: this.g.combat.reflected }; this.lastHp = this.g.player.hp;
  }
  get objective() { return this.def.objectives[this.obj] || null; }
  // ---------------- objectives
  start(i) {
    const o = this.def.objectives[i]; this.obj = i; this.objT = 0;
    this.hold = o.until.hold ? { id: o.until.hold, need: o.until.seconds, radius: o.until.radius ?? 7, t: 0, started: false, done: new Set(), lostT: 0 } : null;
    if (o.checkpoint) this.saveCheckpoint(i, o.checkpoint);
    this.run(o.onStart);
    if (i > 0) this.g.banner('NEW OBJECTIVE', [0.65, 0.9, 1], 1.6);
  }
  finished(o) {
    const P = this.g.player, u = o.until; if (P.status === 'dead') return false;
    if (u.zone) return this.space.inZone(u.zone, P.pos);
    if (u.cleared) return u.cleared.every(id => this.spawned.has(id) && this.alive(id) === 0);
    if (u.interact) return this.flags.has('use:' + u.interact);
    if (u.hold) return this.hold.t >= this.hold.need;
    return false;
  }
  completeObjective() {
    const o = this.objective; this.run(o.onComplete); if (this.state !== 'play') return;
    if (this.obj + 1 < this.def.objectives.length) this.start(this.obj + 1); else this.missionComplete();
  }
  missionComplete() { if (this.state === 'complete') return; this.state = 'complete'; this.endT = 0; this.boss = null; this.dialog.length = 0; this.line = null; }
  // ---------------- actions
  run(list) {
    for (const a of list || []) {
      if (a.say) for (const [who, text] of a.say) this.dialog.push({ who, text, t: Math.max(2.6, 1.2 + text.length * 0.055) });
      if (a.spawn) this.spawnGroup(a.spawn);
      if (a.open) this.space.setDoor(a.open, true);
      if (a.close) this.space.setDoor(a.close, false);
      if (a.alert) for (const n of this.members(a.alert)) if (n.status !== 'dead') alertTrooper(this.g, n, this.g.player.pos);
      if (a.boss) this.boss = this.members(a.boss)[0] || null;
      if (a.companion && this.companion) this.setCompanion(a.companion, a.at);
      if (a.banner) this.g.banner(a.banner, [1, 0.9, 0.6], 2);
      if (a.complete) this.missionComplete();
    }
  }
  spawnGroup(id) {
    const list = this.def.groups[id]; if (!list) throw new Error('mission group missing: ' + id);
    list.forEach((e, i) => {
      const f = this.g.spawnArchetype(e.a, e.at, e.yaw ?? 0, { name: id + '_' + i });
      f.group = id; f.spawnObj = this.obj; f.post = { pos: e.at.slice(), yaw: e.yaw ?? 0 }; f.patrol = e.patrol || null;
    });
    this.spawned.add(id);
  }
  members(id) { return this.g.npcs.filter(n => n.group === id); }
  alive(id) { return this.members(id).filter(n => n.status !== 'dead').length; }
  setCompanion(mode, at) {
    this.companionMode = mode; this.companionAt = at || null;
    if (mode === 'hold' && at) teleportNear(this.g, this.companion, at);
  }
  reviveCompanion(at) { const c = this.companion; c.revive(at); c.takeMul = 0; c.ai = null; } // revive() resets takeMul; she stays unhurtable
  // ---------------- checkpoints
  saveCheckpoint(i, c) {
    this.cp = { obj: i, pos: c.pos, yaw: c.yaw ?? 0, doors: new Map([...this.space.doors].map(([id, d]) => [id, d.want])), fired: new Set(this.fired), flags: new Set(this.flags), spawned: new Set(this.spawned), companionMode: this.companionMode, companionAt: this.companionAt };
    if (i > 0) this.toast = { text: 'Checkpoint', t: 2.2 };
  }
  restoreCheckpoint() {
    const g = this.g, cp = this.cp;
    for (const n of [...g.npcs]) if (n !== this.companion && n.spawnObj >= cp.obj) g.removeNpc(n);
    g.combat.bolts.length = 0; g.arcs.length = 0; this.boss = null; this.dialog.length = 0; this.line = null; this.barks.length = 0;
    for (const [id, open] of cp.doors) this.space.snapDoor(id, open);
    this.fired = new Set(cp.fired); this.flags = new Set(cp.flags); this.spawned = new Set(cp.spawned);
    g.respawnPlayerAt(cp.pos, cp.yaw); this.lastHp = g.player.hp; this.deadT = 0;
    this.companionMode = cp.companionMode; this.companionAt = cp.companionAt;
    if (this.companion) { this.reviveCompanion(this.companion.pos); teleportNear(g, this.companion, this.companionMode === 'hold' && this.companionAt ? this.companionAt : cp.pos); }
    for (const n of g.npcs) if (n.ai && n.kind === 'trooper' && n.status !== 'dead') { n.ai.state = 'post'; n.ai.lastSeen = null; } // survivors lose track
    this.start(cp.obj); g.hud.msg('Restarting from the checkpoint');
  }
  replay() {
    const g = this.g;
    for (const n of [...g.npcs]) if (n !== this.companion) g.removeNpc(n);
    g.combat.bolts.length = 0; g.arcs.length = 0; this.boss = null; this.dialog.length = 0; this.line = null; this.barks.length = 0;
    for (const [id, open] of this.doorStart) this.space.snapDoor(id, open);
    g.world.resetProps(); g.combat.kills = 0; g.combat.reflected = 0;
    const L = g.world.level; g.respawnPlayerAt(L.playerSpawn, L.playerYaw); this.state = 'play'; this.companionMode = 'follow'; this.companionAt = null;
    if (this.companion) this.reviveCompanion(this.def.companion.at);
    this.resetRun(); this.introT = 0; this.start(0);
  }
  // ---------------- per step
  update(dt) {
    const g = this.g, P = g.player;
    this.introT += dt; if (this.toast) { this.toast.t -= dt; if (this.toast.t <= 0) this.toast = null; }
    for (const b of this.barks) b.life -= dt; this.barks = this.barks.filter(b => b.life > 0); this.barkT -= dt;
    if (!this.line && this.dialog.length) { const next = this.dialog.shift(); this.line = { ...next, age: 0, t: this.dialog.length ? next.t * 0.75 : next.t }; } // a backlog plays faster so lines keep up with the action
    if (this.line) { this.line.age += dt; if (this.line.age >= this.line.t) this.line = null; }
    if (this.companion && this.companion.ai) { this.companion.ai.mode = this.companionMode === 'hold' ? 'hold' : 'follow'; this.companion.ai.hold = this.companionAt; }
    if (this.state !== 'play') { this.endT += dt; return; }
    if (P.status === 'dead') { this.deadT += dt; return; }
    this.stats.time += dt; this.objT += dt;
    if (P.hp < this.lastHp) this.stats.dmg += this.lastHp - P.hp; this.lastHp = P.hp;
    // one-shot zone triggers
    for (const tr of this.def.triggers || []) {
      if (this.fired.has(tr.id)) continue; if (tr.after && this.obj < this.indexOf(tr.after)) continue;
      if (this.space.inZone(tr.zone, P.pos)) { this.fired.add(tr.id); this.run(tr.do); }
    }
    // hold-to-download objectives: progress while the player stays near the terminal
    const h = this.hold;
    if (h && h.started && h.t < h.need) {
      const it = this.space.interactables.get(h.id), near = Math.hypot(P.pos[0] - it.p[0], P.pos[2] - it.p[2]) < h.radius;
      if (near) { h.t = Math.min(h.need, h.t + dt); h.lostT = 0; } else h.lostT += dt;
      for (const ev of this.objective.progress || []) if (!h.done.has(ev.at) && h.t / h.need >= ev.at) { h.done.add(ev.at); this.run(ev.do); }
    }
    if (this.objective && this.finished(this.objective)) this.completeObjective();
  }
  indexOf(id) { const i = this.def.objectives.findIndex(o => o.id === id); if (i < 0) throw new Error('unknown objective ' + id); return i; }
  // the use point the player may act on right now (current objective only)
  usable() {
    const o = this.objective, P = this.g.player; if (!o || this.state !== 'play' || P.status !== 'normal') return null;
    const id = o.until.interact || (o.until.hold && !this.hold.started ? o.until.hold : null); if (!id) return null;
    const it = this.space.interactables.get(id); return Math.hypot(P.pos[0] - it.p[0], P.pos[2] - it.p[2]) < it.r && Math.abs(P.pos[1] - it.p[1]) < 1.5 ? it : null;
  }
  // called once per rendered frame with the raw input; returns true when it consumed the frame
  frameInput(i) {
    const P = this.g.player;
    if (this.state === 'complete') { if (this.endT > 1.5 && i.pressed('Enter')) this.replay(); return true; }
    if (P.status === 'dead') { if (this.deadT > 0.9 && i.pressed('Enter')) this.restoreCheckpoint(); return true; }
    if (i.pressed('KeyE')) {
      const it = this.usable();
      if (it && this.objective.until.interact === it.id) { this.flags.add('use:' + it.id); this.g.sfxAt('push', it.p, 0.35); }
      else if (it && this.hold && this.hold.id === it.id) { this.hold.started = true; this.g.hud.msg(this.objective.holdStart || 'Working…'); this.g.sfxAt('push', it.p, 0.35); }
    }
    return false;
  }
  onDeath(f) {
    if (f.isPlayer) { this.stats.deaths++; this.deadT = 0; return; }
    if (f.group && f.kind === 'trooper' && Math.random() < 0.5) { const near = this.g.npcs.find(n => n !== f && n.group && n.kind === 'trooper' && n.status !== 'dead' && Math.hypot(n.pos[0] - f.pos[0], n.pos[2] - f.pos[2]) < 14); if (near) this.bark(near, Math.random() < 0.5 ? 'Man down!' : 'Take him out!'); }
  }
  bark(f, text) { if (this.barkT > 0 || this.barks.some(b => b.f === f)) return; this.barkT = 1.1; this.barks.push({ f, text, life: 1.9 }); }
  marker() {
    const o = this.objective; if (!o || this.state !== 'play') return null;
    if (o.marker) return o.marker;
    const id = o.until.interact || o.until.hold; if (id) { const p = this.space.interactables.get(id).p; return [p[0], p[1] + 1.2, p[2]]; }
    if (o.until.zone) { const z = this.space.zones.get(o.until.zone); return [(z.x0 + z.x1) / 2, 1.2, (z.z0 + z.z1) / 2]; }
    if (o.until.cleared) { // nearest living member
      const P = this.g.player; let best = null, bd = 1e9;
      for (const id of o.until.cleared) for (const n of this.members(id)) if (n.status !== 'dead') { const d = Math.hypot(n.pos[0] - P.pos[0], n.pos[2] - P.pos[2]); if (d < bd) { bd = d; best = n; } }
      return best ? [best.pos[0], best.pos[1] + 2.3, best.pos[2]] : null;
    }
    return null;
  }
  // ---------------- 3D: a soft light beam over the objective
  draw(R) {
    const m = this.marker(), P = this.g.player; if (!m || Math.hypot(m[0] - P.pos[0], m[2] - P.pos[2]) < 4) return;
    const o = this.objective; if (o.until.cleared) return; // enemies get the HUD marker only
    const pulse = 0.75 + 0.25 * Math.sin(this.g.t * 3);
    R.beam([m[0], m[1] - 1.2, m[2]], [m[0], m[1] + 7, m[2]], 0.22, [0.35 * pulse, 0.75 * pulse, 1 * pulse, 0.5], [0.2, 0.5, 1, 0], 0);
  }
  // ---------------- 2D overlay
  drawHud(H, x, W, Hh, dt) {
    const g = this.g, P = g.player, o = this.objective;
    // objective panel (top right)
    if (o && this.state === 'play') {
      const pw = Math.min(340, W - 380), px = W - pw - 16, py = 38;
      if (pw > 180) {
        const lines = wrap(x, o.text, pw - 28, '600 13px system-ui,sans-serif'); const ph = 34 + lines.length * 17 + (this.hold ? 22 : 0);
        x.fillStyle = 'rgba(6,12,24,0.66)'; rr(x, px, py, pw, ph, 10); x.fill(); x.strokeStyle = 'rgba(140,200,255,0.35)'; x.lineWidth = 1; rr(x, px + .5, py + .5, pw - 1, ph - 1, 10); x.stroke();
        x.textAlign = 'left'; x.textBaseline = 'top'; x.font = '700 10px system-ui,sans-serif'; x.fillStyle = '#8fc3ff'; x.fillText(this.def.title.toUpperCase() + '  ·  OBJECTIVE ' + (this.obj + 1) + '/' + this.def.objectives.length, px + 14, py + 10);
        x.font = '600 13px system-ui,sans-serif'; x.fillStyle = '#f2f6ff'; lines.forEach((l, i) => x.fillText(l, px + 14, py + 26 + i * 17));
        if (this.hold) { const k = this.hold.t / this.hold.need, by = py + 30 + lines.length * 17; H.bar(x, px + 14, by, pw - 28, 10, k, ['#1d6fd6', '#7fe0ff'], null); x.font = '600 10px system-ui,sans-serif'; x.fillStyle = '#cfe6ff'; x.textAlign = 'right'; x.fillText(Math.floor(k * 100) + '%', px + pw - 16, by - 1); x.textAlign = 'left'; }
      }
    }
    if (this.toast) { x.save(); x.globalAlpha = Math.min(1, this.toast.t); x.textAlign = 'right'; x.font = '700 12px system-ui,sans-serif'; x.fillStyle = '#9dffb8'; x.fillText('✓ ' + this.toast.text.toUpperCase(), W - 20, 20 + 0); x.restore(); }
    // objective marker on screen / at the screen edge
    const m = this.marker();
    if (m && P.status !== 'dead') {
      const s = H.project(g.R, m), dist = Math.hypot(m[0] - P.pos[0], m[2] - P.pos[2]);
      const on = s && s[0] > 30 && s[0] < W - 30 && s[1] > 30 && s[1] < Hh - 30;
      x.save();
      if (on) { const y = s[1]; x.fillStyle = 'rgba(120,210,255,0.95)'; x.beginPath(); x.moveTo(s[0], y - 9); x.lineTo(s[0] + 7, y); x.lineTo(s[0], y + 9); x.lineTo(s[0] - 7, y); x.closePath(); x.fill(); x.font = '600 11px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'top'; x.fillStyle = '#d8f0ff'; x.fillText(Math.round(dist) + ' m', s[0], y + 12); }
      else { // arrow on the screen edge toward the objective
        const c = g.cam, dx = m[0] - c.eye[0], dz = m[2] - c.eye[2], rel = Math.atan2(dx, dz) - c.yaw; const a = -rel;
        const r = Math.min(W, Hh) * 0.42, ax = W / 2 + Math.sin(a) * r, ay = Hh / 2 - Math.cos(a) * r;
        x.translate(ax, ay); x.rotate(a); x.fillStyle = 'rgba(120,210,255,0.9)'; x.beginPath(); x.moveTo(0, -12); x.lineTo(9, 6); x.lineTo(-9, 6); x.closePath(); x.fill();
      }
      x.restore();
    }
    // barks over heads
    for (const b of this.barks) { if (b.f.status === 'dead') continue; const hp = b.f.headPos(), s = H.project(g.R, [hp[0], hp[1] + 0.55, hp[2]]); if (!s || s[2] > 30) continue; x.save(); x.globalAlpha = Math.min(1, b.life * 2); x.font = '600 12px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'bottom'; x.lineWidth = 4; x.strokeStyle = 'rgba(0,0,0,0.6)'; x.strokeText(b.text, s[0], s[1] - 8); x.fillStyle = '#ffe4c8'; x.fillText(b.text, s[0], s[1] - 8); x.restore(); }
    // boss bar (same look as the duel)
    const B = this.boss;
    if (B && B.status !== 'dead') {
      const pw = Math.min(380, W - 40), px = Math.max(W < 1100 ? 360 : 0, (W - pw) / 2), py = 12, BF = B.force;
      x.fillStyle = 'rgba(8,6,14,0.62)'; rr(x, px - 10, py - 4, pw + 20, BF ? 52 : 40, 10); x.fill();
      x.textAlign = 'center'; x.textBaseline = 'top'; x.font = '700 13px system-ui,sans-serif'; x.fillStyle = '#ff9a90'; x.fillText(B.label.toUpperCase(), px + pw / 2, py);
      H.bar(x, px, py + 17, pw, 14, Math.max(0, B.hp) / B.maxHp, ['#8e1010', '#ff5a3a'], null); if (BF) H.bar(x, px, py + 36, pw, 8, BF.fp / BF.max, ['#2b3fa8', '#7ab8ff'], null); x.textAlign = 'left';
    }
    H.drawBanners(x, W, Hh, dt); H.drawGripHint(g, x, W, Hh);
    const PW = g.pistol; // Bryar charge meter around the crosshair
    if (g.playerWeapon === 'bryar' && PW && PW.charge > 0) { const k = Math.min(1, PW.charge / 1.0); x.save(); x.strokeStyle = k >= 1 ? '#ffd27a' : '#ff9a5a'; x.lineWidth = 3; x.beginPath(); x.arc(W / 2, Hh / 2, 14, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); x.stroke(); x.restore(); }
    // use prompt / download status
    const it = this.usable();
    let prompt = it ? '[E]  ' + it.prompt : null;
    if (this.hold && this.hold.started && this.hold.t < this.hold.need) prompt = this.hold.lostT > 0.2 ? 'Signal lost — get back to the terminal' : (this.objective.holdText || 'Working') + '…  ' + Math.floor(this.hold.t / this.hold.need * 100) + '%';
    if (prompt && P.status !== 'dead') { x.font = '700 14px system-ui,sans-serif'; const tw = x.measureText(prompt).width + 30; x.fillStyle = 'rgba(6,14,28,0.78)'; rr(x, W / 2 - tw / 2, Hh * 0.6, tw, 30, 15); x.fill(); x.fillStyle = this.hold && this.hold.lostT > 0.2 ? '#ffb08a' : '#bfe8ff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(prompt, W / 2, Hh * 0.6 + 15); x.textAlign = 'left'; }
    // dialogue subtitle
    if (this.line && this.state === 'play') {
      const L = this.line, a = Math.min(1, L.age * 4, (L.t - L.age) * 3), bw = Math.min(720, W - 40), lines = wrap(x, L.text, bw - 40, '15px system-ui,sans-serif'), bh = 34 + lines.length * 20, by = Math.min(Hh * 0.82, Hh - 120) - bh; // below the pointer-lock hint, above the Force chips
      x.save(); x.globalAlpha = a; x.fillStyle = 'rgba(4,8,16,0.72)'; rr(x, (W - bw) / 2, by, bw, bh, 10); x.fill();
      x.textAlign = 'left'; x.textBaseline = 'top'; x.font = '800 11px system-ui,sans-serif'; x.fillStyle = SPEAKER[L.who] || '#fff'; x.fillText(L.who, (W - bw) / 2 + 20, by + 10);
      x.font = '15px system-ui,sans-serif'; x.fillStyle = '#f4f6ff'; lines.forEach((l, i) => x.fillText(l, (W - bw) / 2 + 20, by + 26 + i * 20)); x.restore();
    }
    // mission title card
    if (this.introT < 5 && this.state === 'play') {
      const k = Math.min(1, this.introT * 1.5, (5 - this.introT) * 1.2); x.save(); x.globalAlpha = Math.max(0, k); x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '700 14px system-ui,sans-serif'; x.fillStyle = '#9fc8ff'; x.fillText(this.def.kicker.toUpperCase(), W / 2, Hh * 0.3 - 34);
      x.font = '800 46px system-ui,sans-serif'; x.lineWidth = 6; x.strokeStyle = 'rgba(0,0,0,0.6)'; x.strokeText(this.def.title.toUpperCase(), W / 2, Hh * 0.3); x.fillStyle = '#f4ecd8'; x.fillText(this.def.title.toUpperCase(), W / 2, Hh * 0.3);
      x.font = '600 14px system-ui,sans-serif'; x.fillStyle = '#d8dcf0'; x.fillText(this.def.subtitle, W / 2, Hh * 0.3 + 36); x.restore();
    }
    // fallen / complete overlays
    if (P.status === 'dead' && this.state === 'play') {
      x.fillStyle = 'rgba(30,0,0,0.5)'; x.fillRect(0, 0, W, Hh); x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = '#ffd8d0'; x.font = '800 38px system-ui,sans-serif'; x.fillText('You have fallen', W / 2, Hh * 0.42);
      x.font = '16px system-ui,sans-serif'; if (this.deadT > 0.9) x.fillText('Press Enter to restart from the last checkpoint', W / 2, Hh * 0.42 + 38); x.textAlign = 'left';
    }
    if (this.state === 'complete') {
      const a = Math.min(1, this.endT / 1.2), s = this.stats, mm = Math.floor(s.time / 60), ss = Math.floor(s.time % 60);
      x.save(); x.globalAlpha = a; x.fillStyle = 'rgba(0,14,10,0.62)'; x.fillRect(0, 0, W, Hh); x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      x.fillStyle = '#c8ffd8'; x.font = '800 40px system-ui,sans-serif'; x.fillText('MISSION COMPLETE', W / 2, Hh * 0.34); x.font = '600 16px system-ui,sans-serif'; x.fillStyle = '#e4f4ea'; x.fillText(this.def.title + ' · ' + this.def.subtitle, W / 2, Hh * 0.34 + 32);
      const rows = [['Time', mm + ':' + String(ss).padStart(2, '0')], ['Enemies defeated', String(g.combat.kills - s.kills0)], ['Bolts reflected', String(g.combat.reflected - s.refl0)], ['Damage taken', String(Math.round(s.dmg))], ['Falls', String(s.deaths)]];
      x.font = '15px system-ui,sans-serif'; rows.forEach(([k, v], i) => { const y = Hh * 0.34 + 74 + i * 24; x.textAlign = 'right'; x.fillStyle = '#9fc8b0'; x.fillText(k, W / 2 - 12, y); x.textAlign = 'left'; x.fillStyle = '#ffffff'; x.fillText(v, W / 2 + 12, y); });
      x.textAlign = 'center'; x.fillStyle = '#ffd76a'; if (this.endT > 1.5) x.fillText('Press Enter to play again  ·  Main menu (top left) for the duel', W / 2, Hh * 0.34 + 74 + rows.length * 24 + 24); x.restore(); x.textAlign = 'left';
    }
  }
}

function wrap(x, text, w, font) {
  x.save(); x.font = font; const out = []; let cur = '';
  for (const word of text.split(' ')) { const t = cur ? cur + ' ' + word : word; if (x.measureText(t).width > w && cur) { out.push(cur); cur = word; } else cur = t; }
  if (cur) out.push(cur); x.restore(); return out;
}
