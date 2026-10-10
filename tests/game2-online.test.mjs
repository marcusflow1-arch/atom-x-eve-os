import test from 'node:test';
import assert from 'node:assert/strict';
import { NetSession, freeSlot, sideCounts } from '../src/components/game2/net/session.js';
import { Base44Signaling, freshRooms, makePeerId, userOfPeer, NET_VERSION, MAX_PLAYERS, ROOM_STALE_MS } from '../src/components/game2/net/signaling.js';
import { NetGame, SN, packArgs, unpackArgs } from '../src/components/game2/engine/netgame.js';

// In-memory stand-ins for WebRTC and the signaling backend, so the real Mesh / NetSession code runs under node.
class FakeChannel {
  constructor(label) { this.label = label; this.readyState = 'connecting'; }
  open() { if (this.readyState !== 'connecting') return; this.readyState = 'open'; this.onopen && this.onopen(); }
  send(s) { if (this.readyState !== 'open') throw new Error('not open'); const t = this.twin; FakeChannel.sent++; queueMicrotask(() => t && t.readyState === 'open' && t.onmessage && t.onmessage({ data: s })); }
  close() { if (this.readyState === 'closed') return; this.readyState = 'closed'; this.onclose && this.onclose(); if (this.twin) this.twin.close(); }
}
FakeChannel.sent = 0;
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
class Bus { // signaling: rooms + offer / answer delivery by peer id
  constructor() { this.rooms = new Map(); this.peers = new Map(); }
  client(self) {
    const bus = this; const c = {
      self, onSignal: null, room: null,
      async listRooms() { return freshRooms([...bus.rooms.values()]); },
      async createRoom(f) { const r = { ...f, id: 'r' + bus.rooms.size, host_peer: self, version: NET_VERSION, status: 'open', last_seen: Date.now() }; bus.rooms.set(r.id, r); return r; },
      async updateRoom(id, f) { const r = bus.rooms.get(id); if (r) Object.assign(r, f, { last_seen: Date.now() }); return r; },
      async deleteRoom(id) { bus.rooms.delete(id); },
      listen(room) { c.room = room; }, stopListening() { }, close() { bus.peers.delete(self); },
      async send(to, type, payload) { const d = bus.peers.get(to); if (d) queueMicrotask(() => d.onSignal && d.onSignal({ type, from: self, to, payload: { ...payload, from: self, to } })); },
    };
    bus.peers.set(self, c); return c;
  }
}
// RTC constructor that tags each connection with its owner, so a test can block one pair (forces the relay path)
const rtcFor = (owner) => function RTC() { const pc = new FakePC(); pc.owner = owner; return pc; };
const settle = async (n = 30) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };
function player(bus, role, name, side, room) {
  const id = makePeerId(name); const s = new NetSession({ role, selfId: id, name, side, room, signaling: bus.client(id), iceServers: [], RTC: rtcFor(id) });
  s.got = []; s.onMessage = (from, m) => s.got.push([from, m]); s.ended = false; s.onEnd = (why) => { s.endReason = why; };
  return s;
}

test('players join the host, are given a side slot and open direct links to each other (full mesh)', async () => {
  const bus = new Bus(), host = player(bus, 'host', 'Kyle', 'light'); await host.start();
  const room = (await bus.client('x').listRooms())[0]; assert.equal(room.name, "Kyle's arena"); assert.equal(room.max_players, MAX_PLAYERS);
  const g = [player(bus, 'guest', 'Tavion', 'dark', room), player(bus, 'guest', 'Jan', 'light', room), player(bus, 'guest', 'Desann', 'dark', room)];
  for (const s of g) { await s.start(); await settle(); }
  assert.equal(host.roster.size, 4);
  assert.deepEqual(host.list().map(e => [e.name, e.side, e.slot]), [['Kyle', 'light', 0], ['Tavion', 'dark', 0], ['Jan', 'light', 1], ['Desann', 'dark', 1]]);
  for (const s of g) { assert.equal(s.state, 'live'); assert.equal(s.roster.size, 4); for (const o of [host, ...g]) if (o !== s) assert.ok(s.direct(o.self), s.o.name + ' -> ' + o.o.name); }
  assert.deepEqual({ ...(await bus.client('y').listRooms())[0] }.players, 4);
  g[0].broadcast({ k: 'hi', n: 1 }, true); await settle();
  for (const o of [host, g[1], g[2]]) assert.deepEqual(o.got.at(-1)[1], { k: 'hi', n: 1 });
  for (const s of [...g, host]) s.leave();
});

test('the room holds 10 players: the 11th is refused with "full"', async () => {
  const bus = new Bus(), host = player(bus, 'host', 'H', 'light'); await host.start(); const room = (await bus.client('x').listRooms())[0];
  const g = []; for (let i = 0; i < 9; i++) { const s = player(bus, 'guest', 'P' + i, i % 2 ? 'dark' : 'light', room); g.push(s); await s.start(); await settle(); }
  assert.equal(host.roster.size, 10); assert.equal((await bus.client('y').listRooms())[0].status, 'full');
  const late = player(bus, 'guest', 'Late', 'dark', room); await late.start(); await settle();
  assert.equal(late.state, 'ended'); assert.match(late.endReason, /full/); assert.equal(host.roster.size, 10);
  for (const s of [...g, host]) s.leave();
});

test('a player with no direct link to another is reached through the host (relay)', async () => {
  const bus = new Bus(), host = player(bus, 'host', 'H', 'light'); await host.start(); const room = (await bus.client('x').listRooms())[0];
  const a = player(bus, 'guest', 'A', 'light', room); await a.start(); await settle();
  const b = player(bus, 'guest', 'B', 'dark', room); FakePC.block.add(b.self + '|' + a.self); await b.start(); await settle();
  assert.equal(a.direct(b.self), false); assert.ok(b.direct(host.self));
  b.send(a.self, { k: 'hit', dmg: 18 }, true); await settle();
  assert.deepEqual(a.got.at(-1), [b.self, { k: 'hit', dmg: 18 }], 'arrives as if sent directly');
  for (const s of [a, b, host]) s.leave();
});

test('when the host leaves the match ends for everyone and the room is removed', async () => {
  const bus = new Bus(), host = player(bus, 'host', 'H', 'light'); await host.start(); const room = (await bus.client('x').listRooms())[0];
  const a = player(bus, 'guest', 'A', 'dark', room); await a.start(); await settle();
  host.leave(); await settle();
  assert.equal(a.state, 'ended'); assert.match(a.endReason, /host/i); assert.equal(bus.rooms.size, 0);
  a.leave();
});

test('slots and side counts', () => {
  const r = new Map([['a', { side: 'light', slot: 0 }], ['b', { side: 'light', slot: 2 }], ['c', { side: 'dark', slot: 0 }]]);
  assert.equal(freeSlot(r, 'light'), 1); assert.equal(freeSlot(r, 'dark'), 1); assert.deepEqual(sideCounts(r), { light: 2, dark: 1 });
});

test('room list: open, current protocol and a recent host heartbeat only; peer ids address the account', () => {
  const now = 1e7, R = (o) => ({ status: 'open', version: NET_VERSION, last_seen: now - 1000, players: 1, ...o });
  const list = freshRooms([R({ id: 'a', players: 2 }), R({ id: 'old', last_seen: now - ROOM_STALE_MS - 1 }), R({ id: 'closed', status: 'closed' }), R({ id: 'v0', version: 0 }), R({ id: 'b', players: 5 })], now);
  assert.deepEqual(list.map(r => r.id), ['b', 'a']);
  const id = makePeerId('user123'); assert.equal(userOfPeer(id), 'user123'); assert.notEqual(makePeerId('user123'), id);
});

test('Base44 signaling: records go to the target account, only our own signals are taken, handled ones are deleted', async () => {
  const made = [], deleted = [];
  const api = { entities: { Game2Signal: { create: async (d) => { made.push(d); return d; }, delete: async (id) => { deleted.push(id); }, filter: async () => [], subscribe: () => () => { } }, Game2Room: {} } };
  const me = makePeerId('u1'), other = makePeerId('u2'), s = new Base44Signaling(api, me, { pollMs: 1e9 }); s.listen('room1');
  await s.send(other, 'offer', { sdp: { type: 'offer', sdp: 'x' } });
  assert.deepEqual([made[0].sender_id, made[0].target_id, made[0].room_id, made[0].payload.from, made[0].payload.to], ['u1', 'u2', 'room1', me, other]);
  const got = []; s.onSignal = (x) => got.push(x);
  const row = (o) => ({ id: Math.random().toString(36), created_date: new Date().toISOString(), room_id: 'room1', target_id: 'u1', type: 'answer', payload: { from: other, to: me }, ...o });
  s.take(row({ id: 'ok' })); s.take(row({ id: 'ok' })); s.take(row({ target_id: 'u9' })); s.take(row({ payload: { from: other, to: makePeerId('u1') } })); s.take(row({ room_id: 'room2' }));
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

test('rounds: both sides present -> intro; a side with nobody standing loses the round; an empty side waits', () => {
  const sent = []; const fighters = new Map();
  const ctx = Object.create(NetGame.prototype);
  Object.assign(ctx, { isHost: true, g: { npcs: [], banner() { }, hud: { msg() { } }, round: {} }, byId: fighters, score: { light: 0, dark: 0 }, round: { n: 0, state: 'waiting', t: 0 },
    session: { roster: new Map([['a', { id: 'a', side: 'light' }], ['b', { id: 'b', side: 'dark' }]]), broadcast: (m) => sent.push(m) }, appliedIntro: 0, me: null });
  fighters.set('a:p', { status: 'normal' }); fighters.set('b:p', { status: 'normal' });
  ctx.checkRound(); assert.equal(ctx.round.state, 'intro'); assert.equal(ctx.round.n, 1); assert.equal(sent.at(-1).state, 'intro');
  ctx.startRoundState('fight'); ctx.checkRound(); assert.equal(ctx.round.state, 'fight');
  fighters.get('b:p').status = 'dead'; ctx.checkRound(); assert.equal(ctx.round.state, 'end'); assert.equal(ctx.round.winner, 'light'); assert.deepEqual(ctx.score, { light: 1, dark: 0 });
  assert.equal(ctx.g.noDamage, true, 'no damage between rounds');
  ctx.session.roster.delete('b'); ctx.checkRound(); assert.equal(ctx.round.state, 'waiting');
});
