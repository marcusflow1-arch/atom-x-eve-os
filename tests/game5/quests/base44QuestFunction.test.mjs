import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createBase44QuestFunction } from '../../../src/game5/quests/base44QuestFunction.mjs';
import { DEV_WORLD } from '../../../src/game5/gameplay/world.mjs';
import { FileQuestRepository } from '../../../src/game5/quests/fileQuestRepository.mjs';

const origin = 'https://game5.example.test';
const now = 1791900000000;
const blank = () => ({ schema_version: 'game5.quest.player.v1', quests: {}, wallet: {}, rewardLedger: {}, outbox: {} });

class AtomicTestStore {
  constructor(rows = new Map()) {
    this.rows = rows;
    this.pending = new Map();
    this.fail = false;
    this.down = false;
  }
  async read(id) {
    if (this.down) throw Error('offline');
    return structuredClone(this.rows.get(id) ?? blank());
  }
  async transact(id, mutate) {
    const prev = this.pending.get(id) ?? Promise.resolve();
    const operation = prev.catch(() => {}).then(async () => {
      const value = await this.read(id);
      const response = await mutate(value);
      if (this.fail) {
        this.fail = false;
        throw Error('injected crash before commit');
      }
      if (this.down) throw Error('offline');
      this.rows.set(id, structuredClone(value));
      return response;
    });
    this.pending.set(id, operation);
    return operation;
  }
}
function mockSDK(req) {
  const token = req.headers.get('authorization');
  return {
    auth: {
      async me() {
        if (token === 'Bearer expired') throw { status: 401 };
        if (token === 'Bearer offline') throw Error('auth provider offline');
        if (token === 'Bearer alice') return { id: 'alice' };
        if (token === 'Bearer bob') return { id: 'bob' };
        return null;
      },
    },
  };
}
function location(target) {
  return {
    authoritative: true, worldId: 'game5-lost-card-world', observedAt: now,
    position: { x: target.x, z: target.z },
  };
}
function setup({ storage = new AtomicTestStore(), movement = true } = {}) {
  const positions = new Map([
    ['base44:alice', location(DEV_WORLD.npc)],
    ['base44:bob', location(DEV_WORLD.npc)],
  ]);
  const functionHandler = createBase44QuestFunction({
    createClientFromRequest: mockSDK,
    repository: storage,
    allowedOrigins: [origin],
    clock: () => now,
    getAuthoritativePosition: movement ? async ({ playerId }) => positions.get(playerId) : undefined,
  });
  async function call(action = 'state', {
    as = 'alice', payload, method = 'POST', requestOrigin = origin,
    contentType = 'application/json', fetchSite = 'same-origin',
  } = {}) {
    const body = payload ?? (action === 'state' ? {} :
      action === 'pickup' ? { pickupId: DEV_WORLD.card.id } : { npcId: DEV_WORLD.npc.id });
    const headers = { 'authorization': `Bearer ${as}` };
    if (requestOrigin != null) headers.origin = requestOrigin;
    if (fetchSite !== undefined) headers['sec-fetch-site'] = fetchSite;
    if (contentType !== undefined) headers['content-type'] = contentType;
    const response = await functionHandler(new Request('https://host.internal/functions/game5Quest', {
      method, headers, body: method === 'POST' ? JSON.stringify({ action, ...body }) : undefined,
    }));
    return { status: response.status, contentType: response.headers.get('content-type'), ...await response.json() };
  }
  return { call, functionHandler, positions, storage };
}

test('requires named Base44 hosted SDK auth and exact HTTPS origin config', () => {
  assert.throws(() => createBase44QuestFunction(), /createClientFromRequest/);
  assert.throws(() => createBase44QuestFunction({
    createClientFromRequest: mockSDK, repository: new AtomicTestStore(), allowedOrigins: [],
  }), /HTTPS Origin/);
  assert.throws(() => createBase44QuestFunction({
    createClientFromRequest: mockSDK, repository: new AtomicTestStore(), allowedOrigins: ['http://localhost:4178'],
  }), /HTTPS Origin/);
  assert.throws(() => createBase44QuestFunction({
    createClientFromRequest: mockSDK,
    repository: Object.create(FileQuestRepository.prototype),
    allowedOrigins: [origin],
  }), /cannot be hosted/);
});

test('named Base44 endpoint resolves state to JSON, not SPA HTML', async () => {
  const { call } = setup();
  const state = await call('state');
  assert.equal(state.status, 200);
  assert.match(state.contentType, /^application\/json/);
  assert.equal(state.snapshot.quest.status, 'not_started');
  assert.equal(state.snapshot.testWallet, 0);
});

test('missing, invalid and expired sessions are unauthorized; outages fail closed', async () => {
  const { call } = setup();
  for (const as of ['missing', 'expired']) {
    const r = await call('state', { as });
    assert.equal(r.status, 401);
    assert.equal(r.error, 'UNAUTHORIZED');
    assert.equal(r.snapshot, undefined);
  }
  const offline = await call('state', { as: 'offline' });
  assert.equal(offline.status, 503);
  assert.equal(offline.error, 'AUTH_BACKEND_UNAVAILABLE');
});

test('POST is denied without valid Origin or with cross-site request metadata', async () => {
  const { call } = setup();
  assert.equal((await call('accept', { requestOrigin: null })).status, 403);
  assert.equal((await call('accept', { requestOrigin: 'null' })).status, 403);
  assert.equal((await call('accept', { requestOrigin: 'https://evil.example' })).status, 403);
  assert.equal((await call('accept', { fetchSite: 'cross-site' })).status, 403);
  assert.equal((await call('state', { method: 'GET' })).status, 405);
});

test('spoofed identity, receipts, coordinates, quest state and malformed JSON are refused', async () => {
  const { call, functionHandler } = setup();
  const forgeries = [
    { npcId: DEV_WORLD.npc.id, playerId: 'base44:bob' },
    { npcId: DEV_WORLD.npc.id, authenticated: true },
    { npcId: DEV_WORLD.npc.id, position: { x: 0, z: -5 } },
    { npcId: DEV_WORLD.npc.id, receipt: { eventId: 'forged' } },
    { npcId: DEV_WORLD.npc.id, quest: { status: 'completed' } },
    { npcId: DEV_WORLD.npc.id, reward: 999 },
  ];
  for (const payload of forgeries) {
    const r = await call('accept', { payload });
    assert.equal(r.status, 400);
    assert.equal(r.snapshot, undefined);
  }
  assert.equal((await call('unexpected')).status, 400);
  assert.equal((await call('accept', { contentType: 'text/plain' })).status, 415);
  const result = await functionHandler(new Request('https://host.internal/functions/game5Quest', {
    method: 'POST',
    headers: { origin, authorization: 'Bearer alice', 'content-type': 'application/json' },
    body: '{BAD JSON',
  }));
  assert.equal(result.status, 400);
  assert.equal((await result.json()).error, 'INVALID_JSON');
});

test('same authenticated account persists across requests; accounts are isolated', async () => {
  const { call } = setup();
  assert.equal((await call('accept')).snapshot.quest.status, 'active');
  assert.equal((await call('state')).snapshot.quest.status, 'active');
  assert.equal((await call('state', { as: 'bob' })).snapshot.quest.status, 'not_started');
  assert.equal((await call('accept', { as: 'bob' })).snapshot.quest.status, 'active');
  assert.equal((await call('state')).snapshot.quest.status, 'active');
});

test('server-only movement gates all quest mutation; browser movement cannot override', async () => {
  const absent = setup({ movement: false });
  assert.equal((await absent.call('state')).status, 200);
  assert.equal((await absent.call('accept')).error, 'MOVEMENT_AUTHORITY_NOT_CONFIGURED');
  const r = setup();
  await r.call('accept');
  assert.equal((await r.call('pickup')).error, 'NOT_NEAR_TARGET');
  r.positions.set('base44:alice', { ...location(DEV_WORLD.card), authoritative: false });
  assert.equal((await r.call('pickup')).error, 'AUTHORITATIVE_POSITION_UNAVAILABLE');
  r.positions.set('base44:alice', { ...location(DEV_WORLD.card), observedAt: now - 20000 });
  assert.equal((await r.call('pickup')).status, 503);
  r.positions.set('base44:alice', location(DEV_WORLD.card));
  assert.equal((await r.call('pickup')).snapshot.quest.status, 'ready_to_complete');
});

test('simultaneous duplicate pickup and completion requests grant once', async () => {
  const r = setup();
  await r.call('accept');
  r.positions.set('base44:alice', location(DEV_WORLD.card));
  const pickups = await Promise.all(Array.from({ length: 8 }, () => r.call('pickup')));
  assert.equal(pickups.filter((x) => x.changed).length, 1);
  r.positions.set('base44:alice', location(DEV_WORLD.npc));
  const results = await Promise.all(Array.from({ length: 16 }, () => r.call('complete')));
  assert.equal(results.filter((x) => x.changed).length, 1);
  assert.equal((await r.call('state')).snapshot.testWallet, 1);
  const record = await r.storage.read('base44:alice');
  assert.equal(Object.keys(record.rewardLedger).length, 1);
  assert.equal(Object.keys(record.questReceipts).length, 1);
});

test('interrupted transaction or unavailable store returns JSON 503 without false success', async () => {
  const r = setup();
  await r.call('accept');
  r.positions.set('base44:alice', location(DEV_WORLD.card));
  r.storage.fail = true;
  assert.equal((await r.call('pickup')).status, 503);
  const previous = await r.storage.read('base44:alice');
  assert.equal(previous.quests['G5-0001'].status, 'active');
  assert.equal(previous.questReceipts, undefined);
  assert.equal((await r.call('pickup')).snapshot.quest.status, 'ready_to_complete');
  r.storage.down = true;
  const down = await r.call('state');
  assert.equal(down.status, 503);
  assert.equal(down.error, 'QUEST_BACKEND_UNAVAILABLE');
  assert.equal(down.snapshot, undefined);
});

test('actual HTTP named function route can return server JSON without static SPA fallback', async (t) => {
  const { functionHandler } = setup();
  const server = createServer(async (incoming, outgoing) => {
    const chunks = [];
    for await (const chunk of incoming) chunks.push(chunk);
    const url = `http://127.0.0.1:${server.address().port}${incoming.url}`;
    const req = new Request(url, { method: incoming.method, headers: incoming.headers,
      body: incoming.method === 'POST' ? Buffer.concat(chunks) : undefined });
    const response = await functionHandler(req);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(await response.text());
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const res = await fetch(`http://127.0.0.1:${server.address().port}/functions/game5Quest`, {
    method: 'POST', headers: { 'origin': origin, authorization: 'Bearer alice', 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'state' }),
  });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^application\/json/);
  assert.equal((await res.json()).snapshot.quest.status, 'not_started');
});
