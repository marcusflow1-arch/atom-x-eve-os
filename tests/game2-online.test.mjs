import test from 'node:test';
import assert from 'node:assert/strict';
import { NetSession, sideCounts } from '../src/components/game2/net/session.js';
import { Base44Signaling, freshRooms, pickArena, makePeerId, userOfPeer, NET_VERSION, MAX_PLAYERS, ROOM_STALE_MS, ARENA } from '../src/components/game2/net/signaling.js';
import { NetGame, SN, packArgs, unpackArgs, pickSpawn, RESPAWN_S, SHIELD_S } from '../src/components/game2/engine/netgame.js';
import { hostile } from '../src/components/game2/engine/combat.js';

// In-memory stand-ins for WebRTC and the signaling backend, so the real Mesh / NetSession code runs under node.
class FakeChannel {
  constructor(label) { this.label = label; this.readyState = 'connecting'; }
  open() { if (this.readyState !== 'connecting') return; this.readyState = 'open'; this.onopen && this.onopen(); }
  send(s) { if (this.readyState !== 'open') throw new Error('not open'); const t = this.twin; queueMicrotask(() => t && t.readyState === 'open' && t.onmessage && t.onmessage({ data: s })); }
  close() { if (this.readyState === 'closed') return; this.readyState = 'closed'; this.onclose && this.onclose(); if (this.twin) this.twin.close(); }
}
class FakePC {
  constructor() { this.id = Math.random().toString(36).slice(2); this.chs = []; this.iceGatheringState = 'complete'; this.connectionState = 'new'; FakePC.all.set(this.id, this); }
  createDataChannel(label) { const c = new FakeChannel(label); this.chs.push(c); return c; }
  async createOffer() { return { type: 'offer', sdp: 'fake:' + this.id }; }
  async createAnswer() { return { type: 'answer', sdp: 'fake:' + this.id }; }
  async setLocalDescription(d) { this.localDescription = d; }
  async setRemoteDescription(d) {
    this.currentRemoteDescription = d; const other = FakePC.all.get(d.sdp.slice(5));
    if (d.type === 'answer' && other && !FakePC.blocked(this, other)) {
      for (const c of this.chs) { const t = new FakeChannel(c.label); c.twin = t; t.twin = c; other.ondatachannel && other.ondatachannel({ channel: t }); }
      queueMicrotask(() => { for (const c of this.chs) { c.open(); c.twin.open(); } });
    }
  }
  addEventListener() { }
  close() { this.connectionState = 'closed'; for (const c of this.chs) c.close(); }
}
FakePC.all = new Map(); FakePC.block = new Set(); FakePC.blocked = (a, b) => FakePC.block.has(a.owner + '|' + b.owner) || FakePC.block.has(b.owner + '|' + a.owner);
class Bus { // signaling backend: arena records + offer / answer delivery by peer id
  constructor() { this.rooms = new Map(); this.peers = new Map(); this.n = 0; }
  client(self) {
    const bus = this; const c = {
      self, onSignal: null, room: ARENA,
      async listRooms() { return freshRooms([...bus.rooms.values()]); },
      async createRoom(f) { const r = { ...f, id: 'r' + bus.n++, host_peer: self, version: NET_VERSION, status: 'open', last_seen: Date.now(), created_date: new Date(Date.now() + bus.n).toISOString() }; bus.rooms.set(r.id, r); return r; },
      async updateRoom(id, f) { const r = bus.rooms.get(id); if (r) Object.assign(r, f, { last_seen: Date.now() }); return r; },
      async deleteRoom(id) { bus.rooms.delete(id); },
      listen(room = ARENA) { c.room = room; }, stopListening() { }, close() { bus.peers.delete(self); },
      async send(to, type, payload) { const d = bus.peers.get(to); if (d) queueMicrotask(() => d.onSignal && d.onSignal({ type, from: self, to, payload: { ...payload, from: self, to } })); },
    };
    bus.peers.set(self, c); return c;
  }
}
const rtcFor = (owner) => function RTC() { const pc = new FakePC(); pc.owner = owner; return pc; };
const settle = async (n = 30) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };
const wait = (ms) => new Promise(r => setTimeout(r, ms));
function player(bus, name, side = 'light', o = {}) {
  const id = makePeerId(name); const s = new NetSession({ selfId: id, name, side, signaling: bus.client(id), iceServers: [], RTC: rtcFor(id), settleMs: o.settleMs ?? 1e9 });
  s.got = []; s.onMessage = (from, m) => s.got.push([from, m]); s.onEnd = (why) => { s.endReason = why; }; s.hostChanges = []; s.onHostChange = (h, mine) => s.hostChanges.push([h, mine]);
  return s;
}
const arrive = async (bus, name, side, o) => { const s = player(bus, name, side, o); await s.start(); await settle(); return s; };

test('the first player opens the arena; everybody after joins it and links directly to every other player', async () => {
  const bus = new Bus(), host = await arrive(bus, 'Kyle', 'light');
  assert.equal(host.isHost, true); assert.equal(bus.rooms.size, 1); const rec = [...bus.rooms.values()][0];
  assert.equal(rec.name, 'Lightsaber Training'); assert.equal(rec.max_players, MAX_PLAYERS);
  const g = [await arrive(bus, 'Tavion', 'dark'), await arrive(bus, 'Jan', 'light'), await arrive(bus, 'Desann', 'dark')];
  assert.equal(bus.rooms.size, 1, 'no second arena'); assert.equal(host.roster.size, 4);
  for (const s of g) { assert.equal(s.state, 'live'); assert.equal(s.isHost, false); assert.equal(s.roster.size, 4); for (const o of [host, ...g]) if (o !== s) assert.ok(s.direct(o.self), s.o.name + ' -> ' + o.o.name); }
  assert.deepEqual({ players: rec.players, light: rec.light, dark: rec.dark }, { players: 4, light: 2, dark: 2 });
  g[0].broadcast({ k: 'hi', n: 1 }, true); await settle();
  for (const o of [host, g[1], g[2]]) assert.deepEqual(o.got.at(-1)[1], { k: 'hi', n: 1 });
  g[1].leave(); await settle(); assert.equal(host.roster.size, 3); assert.equal(g[0].roster.size, 3, 'leaving is fine at any time'); assert.equal(rec.players, 3);
  for (const s of [g[0], g[2], host]) s.leave();
});

test('the arena holds 10 players: the 11th is told it is full and no second arena opens', async () => {
  const bus = new Bus(), host = await arrive(bus, 'H'); const g = []; for (let i = 0; i < 9; i++) g.push(await arrive(bus, 'P' + i, i % 2 ? 'dark' : 'light'));
  assert.equal(host.roster.size, 10); assert.equal([...bus.rooms.values()][0].status, 'full');
  const late = await arrive(bus, 'Late'); assert.equal(late.state, 'ended'); assert.match(late.endReason, /full/); assert.equal(bus.rooms.size, 1); assert.equal(host.roster.size, 10);
  for (const s of [...g, host]) s.leave();
});

test('a player with no direct link to another is reached through the host (relay)', async () => {
  const bus = new Bus(), host = await arrive(bus, 'H'), a = await arrive(bus, 'A');
  const b = player(bus, 'B', 'dark'); FakePC.block.add(b.self + '|' + a.self); await b.start(); await settle();
  assert.equal(a.direct(b.self), false); assert.ok(b.direct(host.self));
  b.send(a.self, { k: 'hit', dmg: 18 }, true); await settle();
  assert.deepEqual(a.got.at(-1), [b.self, { k: 'hit', dmg: 18 }], 'arrives as if sent directly');
  for (const s of [a, b, host]) s.leave();
});

test('when the host leaves, the player in longest takes over and the arena carries on; newcomers join the new host', async () => {
  const bus = new Bus(), host = await arrive(bus, 'H'), a = await arrive(bus, 'A', 'dark'); await wait(2); const b = await arrive(bus, 'B');
  host.leave(); await settle(60);
  assert.equal(a.isHost, true, 'A was in before B'); assert.equal(b.hostId, a.self); assert.equal(a.state, 'live'); assert.equal(b.state, 'live');
  assert.equal(a.roster.size, 2); assert.equal(b.roster.size, 2); assert.ok(a.direct(b.self));
  assert.equal(bus.rooms.size, 1); assert.equal([...bus.rooms.values()][0].host_peer, a.self);
  assert.deepEqual(b.hostChanges.at(-1), [a.self, false]); assert.deepEqual(a.hostChanges.at(-1), [a.self, true]);
  const c = await arrive(bus, 'C'); assert.equal(c.hostId, a.self); assert.equal(a.roster.size, 3); await settle(); assert.ok(c.direct(b.self), 'the newcomer links to everyone');
  for (const s of [a, b, c]) s.leave(); await settle(); assert.equal(bus.rooms.size, 0, 'the last one out closes the arena');
});

test('two players opening the arena at the same moment end up in one arena', async () => {
  const bus = new Bus(), x = player(bus, 'X', 'light', { settleMs: 20 }), y = player(bus, 'Y', 'dark', { settleMs: 20 });
  await Promise.all([x.start(), y.start()]); assert.equal(bus.rooms.size, 2);
  await wait(60); await settle(60);
  assert.equal(bus.rooms.size, 1); const host = x.isHost ? x : y, other = host === x ? y : x;
  assert.equal(other.isHost, false); assert.equal(other.hostId, host.self); assert.equal(host.roster.size, 2); assert.equal(other.state, 'live');
  x.leave(); y.leave();
});

test('arena records: live, current protocol only; the fullest (then oldest) is the arena; peer ids address the account', () => {
  const now = 1e7, R = (o) => ({ status: 'open', version: NET_VERSION, last_seen: now - 1000, players: 1, created_date: '2026-01-01T00:00:00Z', ...o });
  const list = freshRooms([R({ id: 'a', players: 2 }), R({ id: 'old', last_seen: now - ROOM_STALE_MS - 1 }), R({ id: 'closed', status: 'closed' }), R({ id: 'v1', version: 1 }), R({ id: 'b', players: 5 })], now);
  assert.deepEqual(list.map(r => r.id), ['b', 'a']);
  assert.equal(pickArena([R({ id: 'young', created_date: '2026-01-02T00:00:00Z' }), R({ id: 'older' })], now).id, 'older');
  assert.equal(pickArena([], now), null);
  assert.deepEqual(sideCounts(new Map([['a', { side: 'light' }], ['b', { side: 'dark' }], ['c', { side: 'dark' }]])), { light: 1, dark: 2 });
  const id = makePeerId('user123'); assert.equal(userOfPeer(id), 'user123'); assert.notEqual(makePeerId('user123'), id);
});

test('Base44 signaling: records go to the target account on the arena channel, only our own are taken, handled ones are deleted', async () => {
  const made = [], deleted = [];
  const api = { entities: { Game2Signal: { create: async (d) => { made.push(d); return d; }, delete: async (id) => { deleted.push(id); }, filter: async () => [], subscribe: () => () => { } }, Game2Room: {} } };
  const me = makePeerId('u1'), other = makePeerId('u2'), s = new Base44Signaling(api, me, { pollMs: 1e9 }); s.listen();
  await s.send(other, 'offer', { sdp: { type: 'offer', sdp: 'x' } });
  assert.deepEqual([made[0].sender_id, made[0].target_id, made[0].room_id, made[0].payload.from, made[0].payload.to], ['u1', 'u2', ARENA, me, other]);
  const got = []; s.onSignal = (x) => got.push(x);
  const row = (o) => ({ id: Math.random().toString(36), created_date: new Date().toISOString(), room_id: ARENA, target_id: 'u1', type: 'answer', payload: { from: other, to: me }, ...o });
  s.take(row({ id: 'ok' })); s.take(row({ id: 'ok' })); s.take(row({ target_id: 'u9' })); s.take(row({ payload: { from: other, to: makePeerId('u1') } })); s.take(row({ room_id: 'elsewhere' }));
  s.take(row({ id: 'stale', created_date: new Date(Date.now() - 120000).toISOString() }));
  assert.equal(got.length, 1, 'one signal for this session, once'); assert.equal(got[0].from, other);
  assert.ok(deleted.includes('ok')); s.close();
});

test('remote calls pack fighters as ids and unpack them on the other side', () => {
  const kyle = { fid: 'p1:p', actor: {} }, desann = { fid: 'p2:p', actor: {} };
  const packed = packArgs([12.34567, kyle, { noFlinch: true, carry: () => 0, from: desann }, [0.1234567, 0, 1]]);
  assert.deepEqual(packed, [12.346, { $f: 'p1:p' }, { noFlinch: true, carry: true, from: { $f: 'p2:p' } }, [0.123, 0, 1]]);
  const back = unpackArgs(JSON.parse(JSON.stringify(packed)), id => ({ 'p1:p': kyle, 'p2:p': desann }[id]));
  assert.equal(back[1], kyle); assert.equal(back[2].from, desann); assert.equal(back[2].carry, true);
});

test('snapshot fields sit where the receiver reads them', () => {
  const layer = (name) => ({ name, cur: { t0: 9, speed: 1, loop: true } });
  const F = { active: { rage: { until: 99 } }, holding: 'grip', target: { ref: { fid: 'p2:p' } }, fp: 63.4, max: 100, gripBase: 3 };
  const f = { fid: 'p1:p', side: 'dark', label: 'Tavion', pos: [1, 2, 3], vel: [4, 5, 6], yaw: 0.5, status: 'gripped', hp: 77, maxHp: 100, ducked: true, glow: 0.2, dmgFlash: 0.3, isPlayer: true, cmd: { aimPitch: 0.4 }, kind: 'fighter', hilt: 'thrown', thrown: { pos: [7, 8, 9], ang: 1 }, blade: { lit: true },
    saber: { move: 10, level: 3, holstered: false }, actor: { now: 10, yaw: 0.25, spineYaw: 0.1, spinePitch: 0.2, legYaw: 0, matchPelvis: true, torsoFollow: false, legs: layer('BOTH_RUN1'), torso: layer('BOTH_A2_T__B_') } };
  const ctx = { g: { forceOf: () => F }, animIdx: { BOTH_RUN1: 5, BOTH_A2_T__B_: 7 }, layerOut: NetGame.prototype.layerOut };
  const e = NetGame.prototype.snap.call(ctx, f);
  assert.equal(e.length, SN.legYaw + 1);
  const at = (k) => e[SN[k]];
  assert.deepEqual([at('fid'), at('side'), at('name'), at('x'), at('y'), at('z'), at('vx'), at('vy'), at('vz'), at('yaw'), at('ayaw'), at('syaw'), at('spitch')], ['p1:p', 1, 'Tavion', 1, 2, 3, 4, 5, 6, 0.5, 0.25, 0.1, 0.2]);
  assert.deepEqual([at('status'), at('hp'), at('maxHp'), e[SN.legs], e[SN.legs + 1], e[SN.torso], at('move'), at('level'), at('holst'), at('lit'), at('hilt')], [5, 77, 100, 5, 1, 7, 10, 3, 0, 1, 2]);
  assert.deepEqual(at('thrown'), [7, 8, 9, 1]);
  assert.deepEqual([at('fp'), at('fmax'), at('bits'), at('hold'), at('tgt'), at('duck'), at('glow'), at('flash'), at('match'), at('gripBase'), at('pitch'), at('dj')], [63, 100, 2, 1, 'p2:p', 1, 0.2, 0.3, 1, 3, 0.4, 0]);
});

test('free-for-all: every player is hostile to every other fighter; the AI Reborn do not fight each other', () => {
  const p1 = { team: 'ffa' }, p2 = { team: 'ffa' }, ai1 = { team: 'enemy' }, ai2 = { team: 'enemy' };
  assert.ok(hostile(p1, p2) && hostile(p2, p1)); assert.ok(hostile(p1, ai1) && hostile(ai1, p1)); assert.equal(hostile(ai1, ai2), false); assert.equal(hostile(p1, p1), false);
  assert.ok(hostile({ team: 'player' }, { team: 'enemy' }), 'offline duel unchanged'); assert.equal(hostile({ team: 'ally' }, { team: 'enemy' }), false);
});

test('Fighter.hurt (the real one): damage applies, spawn protection blocks it, a lethal hit kills', async () => {
  const { Fighter } = await import('../src/components/game2/engine/fighter.js');
  const f = Object.create(Fighter.prototype); let died = null;
  Object.assign(f, { g: { t: 5 }, status: 'normal', hp: 100, maxHp: 100, takeMul: 1, force: null, die(from) { died = from; this.status = 'dead'; } });
  assert.equal(f.hurt(30, null, { noFlinch: true }), false); assert.equal(f.hp, 70);
  f.spawnShield = 6; f.hurt(30, null, { noFlinch: true }); assert.equal(f.hp, 70, 'shielded'); f.spawnShield = 0;
  const killer = { fid: 'k' }; assert.equal(f.hurt(100, killer, { noFlinch: true }), true); assert.equal(died, killer);
});

test('respawn: back after 3 s at the spawn point farthest from everyone, shielded for 1.5 s', () => {
  const pts = [{ pos: [0, 0, 0] }, { pos: [10, 0, 0] }, { pos: [20, 0, 0] }];
  assert.equal(pickSpawn(pts, [{ pos: [1, 0, 0] }, { pos: [9, 0, 0] }], () => 0).pos[0], 20);
  const g = { t: 10, player: { status: 'dead', deadAt: 8, fid: 'me:p' }, npcs: [], fighters() { return [this.player]; }, respawnPlayerAt(pos) { this.player.status = 'normal'; this.player.pos = pos; }, readySaber() { } };
  const ctx = Object.create(NetGame.prototype); Object.assign(ctx, { g, session: { state: 'live' }, spawns: pts, isHost: false });
  ctx.beforeStep(1 / 60); assert.equal(g.player.status, 'dead', 'still down after 2 s');
  g.t = 8 + RESPAWN_S + 0.01; ctx.beforeStep(1 / 60); assert.equal(g.player.status, 'normal');
  assert.ok(Math.abs(g.player.spawnShield - (g.t + SHIELD_S)) < 1e-9);
  g.t += SHIELD_S + 0.01; ctx.beforeStep(1 / 60); assert.equal(g.player.spawnShield, 0);
});
