import test from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { createGame2ArenaServer } from '../arena.mjs';
import { RailwayGameSession } from '../../../src/components/game2/net/railway.js';

async function fixture(t, o = {}) {
  const arena = createGame2ArenaServer({
    host: '127.0.0.1', ...o,
    authenticate: async token => token.startsWith('user-') ? { id: token.slice(5) } : null,
  });
  const addr = await arena.listen();
  t.after(async () => await arena.close());
  return { arena, url: 'ws://127.0.0.1:' + addr.port + '/ws/game2', http: 'http://127.0.0.1:' + addr.port };
}
const tick = () => new Promise(resolve => setTimeout(resolve, 20));
async function eventually(test, message, timeout = 3000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (test()) return;
    await tick();
  }
  throw new Error(message);
}
function player(url, id, side = 'light', ai = 0, mapId) {
  const peer = id + '~abc123';
  const session = new RailwayGameSession({
    selfId: peer, name: 'Character ' + id, side, ai, mapId,
    token: 'user-' + id, url, WebSocketImpl: WebSocket,
  });
  session.received = [];
  session.onMessage = (from, body) => session.received.push({ from, body });
  return session;
}

test('two separate browser identities spawn two human players in one Railway arena', async t => {
  const { arena, url, http } = await fixture(t);
  const a = player(url, 'alice', 'light'), b = player(url, 'bob', 'dark');
  await a.start();
  assert.equal(a.state, 'live');
  assert.equal(a.isHost, true);
  assert.equal(a.roster.size, 1);
  assert.equal(arena.report().ai, 0, 'AI bot is not a replacement for other humans');

  await b.start();
  await eventually(() => a.roster.size === 2 && b.roster.size === 2, 'Both browsers must see two human fighters');
  assert.equal(b.isHost, false);
  assert.equal(a.hostId, b.hostId);
  assert.equal(arena.report().players, 2);
  assert.equal(arena.report().light, 1);
  assert.equal(arena.report().dark, 1);
  const status = await (await fetch(http + '/status')).json();
  assert.equal(status.players, 2);

  // A full per-frame position/animation packet reaches the other player.
  const snap = { k: 's', t: 1.2, f: [[a.self + ':p', 0, 'Character alice', 3, 0, 7]] };
  assert.equal(a.broadcast(snap, false), 1);
  await eventually(() => b.received.some(x => x.body.k === 's'), 'Opponent position snapshot not received');
  assert.deepEqual(b.received.find(x => x.body.k === 's').body, snap);
  assert.equal(b.received.find(x => x.body.k === 's').from, a.self);

  // Reliable saber hit and Force power messages travel through the same connection.
  const hurt = { k: 'rpc', fid: b.self + ':p', m: 'hurt', a: [25] };
  assert.equal(a.send(b.self, hurt, true), true);
  const lightning = { k: 'fx', e: 'cast', fid: a.self + ':p', id: 'lightning' };
  assert.equal(a.broadcast(lightning, true), 1);
  await eventually(() => b.received.some(x => x.body.k === 'rpc') && b.received.some(x => x.body.k === 'fx'), 'Combat events missing');
  assert.deepEqual(b.received.find(x => x.body.k === 'rpc').body, hurt);
  a.leave(); b.leave();
});

test('both tabs signed in with the same account get distinct controllable characters', async t => {
  const { url, arena } = await fixture(t);
  const a = player(url, 'same'), b = player(url, 'same');
  b.self = 'same~second9';
  const me = await a.start();
  await b.start();
  await eventually(() => a.roster.size === 2, 'Same user different tabs should both join');
  assert.equal(arena.report().players, 2);
  a.leave(); b.leave();
});

test('host disconnect elects another connected player instead of spawning a second world', async t => {
  const { url, arena } = await fixture(t);
  const a = player(url, 'alice', 'light', 1);
  const b = player(url, 'bob', 'dark');
  const c = player(url, 'charlie', 'light');
  await a.start(); await b.start(); await c.start();
  assert.equal(arena.report().ai, 1);
  assert.equal(arena.report().players, 3);
  a.leave();
  await eventually(() => b.isHost && c.hostId === b.self && b.roster.size === 2, 'Host migration failed');
  assert.equal(arena.report().players, 2);
  assert.equal(arena.report().ai, 1, 'AI setting preserved on host migration');
  const d = player(url, 'denise', 'dark');
  await d.start();
  await eventually(() => c.roster.size === 3 && b.roster.size === 3, 'New arrival must join the existing arena');
  assert.equal(d.hostId, b.self);
  b.leave(); c.leave(); d.leave();
});

test('every map is its own arena: players on another map are never seen or reached; the status counts each', async t => {
  const { url, arena, http } = await fixture(t);
  const a = player(url, 'alice', 'light', 0, 'skybridge'), b = player(url, 'bob', 'dark', 0, 'skybridge');
  const c = player(url, 'carol', 'light', 0, 'hangar'), d = player(url, 'dave', 'dark'); // no map: the original training arena
  await a.start(); await b.start(); await c.start(); await d.start();
  await eventually(() => a.roster.size === 2 && b.roster.size === 2, 'Skybridge players see each other');
  assert.equal(c.roster.size, 1, 'alone on the hangar map'); assert.equal(c.isHost, true, 'and its host');
  assert.equal(d.roster.size, 1); assert.equal(d.isHost, true);
  const snap = { k: 's', t: 1, f: [[a.self + ':p', 0, 'Character alice', 1, 0, 2]] };
  a.broadcast(snap, false); a.send(c.self, { k: 'rpc', fid: c.self + ':p', m: 'hurt', a: [25] }, true);
  await eventually(() => b.received.some(x => x.body.k === 's'), 'Snapshot within the arena');
  await tick(); await tick();
  assert.equal(c.received.length + d.received.length, 0, 'nothing crosses to another map');
  const status = await (await fetch(http + '/status')).json();
  assert.equal(status.rooms, true); assert.equal(status.arenas.skybridge.players, 2); assert.equal(status.arenas.hangar.players, 1);
  assert.equal(status.players, 1, 'top-level numbers are the training arena (for clients from before map arenas)');
  a.leave(); b.leave(); c.leave(); d.leave();
});

test('the player ceiling counts per arena', async t => {
  const { url } = await fixture(t, { maxPlayers: 2 });
  const a = player(url, 'alice', 'light', 0, 'carbon'), b = player(url, 'bob', 'dark', 0, 'carbon'), c = player(url, 'carol', 'light', 0, 'carbon'), d = player(url, 'dave', 'dark', 0, 'skybridge');
  await a.start(); await b.start(); await c.start(); await d.start();
  assert.equal(a.state, 'live'); assert.equal(b.state, 'live');
  assert.ok(c.ended, 'the third on that map is turned away'); assert.equal(d.state, 'live', 'another map still has room');
  a.leave(); b.leave(); d.leave();
});

test('an invalid token cannot create a fake fighter or hijack another account', async t => {
  const { url, arena } = await fixture(t);
  const bad = new WebSocket(url);
  await new Promise(resolve => bad.on('open', resolve));
  bad.send(JSON.stringify({ t: 'join', version: 2, peer: 'alice~abc123', token: 'invalid', side: 'dark' }));
  await eventually(() => bad.readyState === WebSocket.CLOSED, 'Unauthorized WebSocket stayed connected');
  assert.equal(arena.report().players, 0);
  const forged = new WebSocket(url);
  await new Promise(resolve => forged.on('open', resolve));
  forged.send(JSON.stringify({ t: 'join', version: 2, peer: 'alice~abc123', token: 'user-bob' }));
  await eventually(() => forged.readyState === WebSocket.CLOSED, 'Identity spoofing accepted');
  assert.equal(arena.report().players, 0);
});
