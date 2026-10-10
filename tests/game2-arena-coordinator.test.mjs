import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeGame2Coordinator, liveGame2Rooms, validPeerForUser,
} from '../base44/functions/game2Arena/coordinator.mjs';

function sharedDatabase() {
  const rows = new Map();
  let sequence = 0;
  let clock = 100000;
  const api = {
    filter: async () => [...rows.values()].map(x => ({ ...x })),
    get: async id => rows.get(id) ? { ...rows.get(id) } : null,
    create: async fields => {
      const row = { ...fields, id: 'room-' + ++sequence, created_date: new Date(clock++).toISOString() };
      rows.set(row.id, row);
      return { ...row };
    },
    update: async (id, fields) => {
      const row = rows.get(id);
      if (!row) throw new Error('Not found');
      Object.assign(row, fields);
      return { ...row };
    },
    delete: async id => { rows.delete(id); },
  };
  return { api, rows };
}

test('separate signed-in accounts discover the same live Game 2 room through service-role', async () => {
  const db = sharedDatabase();
  const host = makeGame2Coordinator(db.api, { now: () => 100000, pause: async () => {} });
  const visitor = makeGame2Coordinator(db.api, { now: () => 100000, pause: async () => {} });
  const first = await host.claim('user1', 'user1~abcdef', { host_name: 'Light Jedi', light: 1 });
  const joined = await visitor.claim('user2', 'user2~abcdef', { host_name: 'Dark Jedi', dark: 1 });
  assert.equal(first.created, true);
  assert.equal(joined.created, false);
  assert.equal(joined.room.id, first.room.id);
  assert.equal((await visitor.list()).length, 1);
  assert.equal(joined.room.host_peer, 'user1~abcdef');
});

test('simultaneous entrants converge to the same oldest canonical room', async () => {
  const db = sharedDatabase();
  const now = () => 100000, pause = async () => {};
  const [a, b] = await Promise.all([
    makeGame2Coordinator(db.api, { now, pause }).claim('alpha', 'alpha~qwerty'),
    makeGame2Coordinator(db.api, { now, pause }).claim('bravo', 'bravo~qwerty'),
  ]);
  assert.equal(a.room.id, b.room.id);
  assert.equal(db.rows.size, 1);
  assert.equal([a, b].filter(x => x.created).length, 1);
});

test('arena host alone can heartbeat, close, or alter shared room state', async () => {
  const db = sharedDatabase();
  const a = makeGame2Coordinator(db.api, { now: () => 100000, pause: async () => {} });
  const r = (await a.claim('alpha', 'alpha~qwerty')).room;
  await assert.rejects(a.heartbeat(r.id, 'bravo', 'bravo~qwerty', { players: 10 }), /Only the current arena host/);
  await assert.rejects(a.leave(r.id, 'bravo', 'bravo~qwerty'), /Only the current arena host/);
  const updated = await a.heartbeat(r.id, 'alpha', 'alpha~qwerty', { players: 2, dark: 1, light: 1, name: 'Injected room', host_id: 'bravo' });
  assert.equal(updated.players, 2);
  assert.equal(updated.host_id, 'alpha');
  assert.equal(updated.name, 'Lightsaber Training');
  await a.leave(r.id, 'alpha', 'alpha~qwerty');
  assert.equal(db.rows.size, 0);
});

test('stale and closed arena beacons are not advertised to players', () => {
  assert.deepEqual(liveGame2Rooms([
    { id: 'expired', version: 2, status: 'open', last_seen: 84000 },
    { id: 'closed', version: 2, status: 'closed', last_seen: 99999 },
    { id: 'v1', version: 1, status: 'open', last_seen: 99999 },
    { id: 'current', version: 2, status: 'open', last_seen: 99999 },
  ], 100000).map(x => x.id), ['current']);
  assert.equal(validPeerForUser('other~qwerty', 'alpha'), false);
  assert.equal(validPeerForUser('alpha~qwerty', 'alpha'), true);
});
