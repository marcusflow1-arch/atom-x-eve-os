import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAuthenticatedQuestHandler, createBase44SessionAuthenticator } from '../../../src/game5/quests/authenticatedQuestApi.mjs';
import { FileQuestRepository } from '../../../src/game5/quests/fileQuestRepository.mjs';
import { DEV_WORLD } from '../../../src/game5/gameplay/world.mjs';

const now = 1791900000000;
const initial = () => ({ schema_version: 'game5.quest.player.v1', quests: {}, wallet: {}, rewardLedger: {}, outbox: {} });
class AtomicTestRepository {
  constructor(records = new Map()) { this.records = records; this.queues = new Map(); this.failAfterMutation = false; this.unavailable = false; }
  async read(id) {
    if (this.unavailable) throw Error('STORAGE_OFFLINE');
    return structuredClone(this.records.get(id) ?? initial());
  }
  async transact(id, mutate) {
    const prev = this.queues.get(id) ?? Promise.resolve();
    const pending = prev.catch(() => {}).then(async () => {
      const snapshot = await this.read(id);
      const result = await mutate(snapshot);
      if (this.failAfterMutation) { this.failAfterMutation = false; throw Error('SIMULATED_CRASH_BEFORE_COMMIT'); }
      if (this.unavailable) throw Error('STORAGE_OFFLINE');
      this.records.set(id, structuredClone(snapshot));
      return result;
    });
    this.queues.set(id, pending);
    return pending;
  }
}
const auth = createBase44SessionAuthenticator({
  createClientFromRequest: (req) => ({
    auth: { me: async () => {
      const token = req.headers.get('authorization');
      if (token === 'Bearer offline') throw Error('AUTH_OFFLINE');
      if (token === 'Bearer alice') return { id: 'alice' };
      if (token === 'Bearer bob') return { id: 'bob' };
      return null;
    } },
  }),
});
const npc = { npcId: DEV_WORLD.npc.id };
const pickup = { pickupId: DEV_WORLD.card.id };
const at = (target) => ({
  position: { x: target.x, z: target.z },
  observedAt: now,
  worldId: 'game5-lost-card-world',
  authoritative: true,
});
function rig({ repository = new AtomicTestRepository(), movement = true } = {}) {
  const positions = new Map([['base44:alice', at(DEV_WORLD.npc)], ['base44:bob', at(DEV_WORLD.npc)]]);
  const handler = createAuthenticatedQuestHandler({
    repository, authenticate: auth, clock: () => now, allowedOrigins: ['https://atom.example'],
    getAuthoritativePosition: movement ? async ({ playerId }) => positions.get(playerId) : undefined,
  });
  const send = async (action, { token = 'alice', body, origin, method, raw } = {}) => {
    const headers = { authorization: `Bearer ${token}` };
    if (origin) headers.origin = origin;
    const verb = method ?? (action === 'state' ? 'GET' : 'POST');
    if (verb === 'POST') headers['content-type'] = 'application/json';
    const request = new Request(`https://atom.example/api/game5/quest/${action}`, {
      method: verb,
      headers,
      body: verb === 'POST' ? raw ?? JSON.stringify(body ?? (action === 'pickup' ? pickup : npc)) : undefined,
    });
    const response = await handler(request);
    return { status: response.status, ...await response.json() };
  };
  return { send, positions, repository, handler };
}

test('Base44 identity requires auth.me; no browser-provided identity is trusted', async () => {
  const { send } = rig();
  assert.equal((await send('state', { token: 'none' })).status, 401);
  assert.equal((await send('state', { token: 'offline' })).status, 503);
  assert.equal((await send('state', { token: 'alice' })).snapshot.quest.status, 'not_started');
  assert.equal((await send('accept', { body: { ...npc, actor: { authenticated: true, playerId: 'base44:bob' } } })).error, 'FORBIDDEN_CLIENT_FIELDS');
  assert.equal((await send('accept', { body: { ...npc, playerId: 'base44:bob' } })).status, 400);
  assert.equal((await send('accept', { body: { ...npc, authenticated: true } })).status, 400);
  assert.equal((await send('state', { origin: 'https://foreign.example' })).status, 403);
  assert.equal((await send('state', { origin: 'https://atom.example' })).status, 200);
});

test('each identity has independent persistent quest progress and test rewards', async () => {
  const r = rig();
  assert.equal((await r.send('accept')).snapshot.quest.status, 'active');
  assert.equal((await r.send('state', { token: 'bob' })).snapshot.quest.status, 'not_started');
  assert.equal((await r.send('accept', { token: 'bob' })).snapshot.quest.status, 'active');
  r.positions.set('base44:alice', at(DEV_WORLD.card));
  assert.equal((await r.send('pickup')).snapshot.quest.status, 'ready_to_complete');
  assert.equal((await r.send('state', { token: 'bob' })).snapshot.quest.status, 'active');
  r.positions.set('base44:alice', at(DEV_WORLD.npc));
  assert.equal((await r.send('complete')).snapshot.testWallet, 1);
  assert.equal((await r.send('state', { token: 'bob' })).snapshot.testWallet, 0);
});

test('pickup requires fresh, authoritative, server-derived proximity; forged positions/receipts rejected', async () => {
  const r = rig();
  await r.send('accept');
  assert.equal((await r.send('pickup', { body: { ...pickup, position: { x: 14, z: -8 } } })).status, 400);
  assert.equal((await r.send('pickup', { body: { ...pickup, event: { eventId: 'forged', cardId: 'game5:lost-card' } } })).status, 400);
  assert.equal((await r.send('pickup', { body: { ...pickup, receipt: 'forged' } })).status, 400);
  assert.equal((await r.send('pickup')).error, 'NOT_NEAR_TARGET');
  r.positions.set('base44:alice', { ...at(DEV_WORLD.card), authoritative: false });
  assert.equal((await r.send('pickup')).status, 503);
  r.positions.set('base44:alice', { ...at(DEV_WORLD.card), observedAt: now - 100000 });
  assert.equal((await r.send('pickup')).status, 503);
  r.positions.set('base44:alice', at(DEV_WORLD.card));
  assert.equal((await r.send('pickup')).snapshot.quest.objective.current, 1);
  const persisted = await r.repository.read('base44:alice');
  assert.equal(Object.values(persisted.questReceipts).length, 1);
  assert.equal(Object.values(persisted.outbox).length, 1);
  assert.equal((await r.send('pickup')).changed, false);
});

test('server proximity required for NPC completion; cannot grant before pickup', async () => {
  const r = rig();
  assert.equal((await r.send('complete')).changed, false);
  await r.send('accept');
  assert.equal((await r.send('complete')).changed, false);
  r.positions.set('base44:alice', at(DEV_WORLD.card));
  await r.send('pickup');
  assert.equal((await r.send('complete')).error, 'NOT_NEAR_TARGET');
  r.positions.set('base44:alice', at(DEV_WORLD.npc));
  assert.equal((await r.send('complete')).changed, true);
});

test('duplicate requests and concurrent attempts grant only one test token', async () => {
  const r = rig();
  const accepts = await Promise.all(Array.from({ length: 12 }, () => r.send('accept')));
  assert.equal(accepts.filter((x) => x.changed).length, 1);
  r.positions.set('base44:alice', at(DEV_WORLD.card));
  const pickups = await Promise.all(Array.from({ length: 20 }, () => r.send('pickup')));
  assert.equal(pickups.filter((x) => x.changed).length, 1);
  r.positions.set('base44:alice', at(DEV_WORLD.npc));
  const completed = await Promise.all(Array.from({ length: 24 }, () => r.send('complete')));
  assert.equal(completed.filter((x) => x.changed).length, 1);
  assert.equal((await r.send('complete')).snapshot.testWallet, 1);
  assert.equal(Object.keys((await r.repository.read('base44:alice')).rewardLedger).length, 1);
});

test('interrupted atomic pickup does not leave a receipt without progress; retry recovers', async () => {
  const r = rig();
  await r.send('accept');
  r.positions.set('base44:alice', at(DEV_WORLD.card));
  r.repository.failAfterMutation = true;
  assert.equal((await r.send('pickup')).status, 503);
  let persisted = await r.repository.read('base44:alice');
  assert.equal(persisted.quests['G5-0001'].status, 'active');
  assert.equal(Object.keys(persisted.questReceipts ?? {}).length, 0);
  assert.equal(Object.keys(persisted.outbox).length, 0);
  assert.equal((await r.send('pickup')).status, 200);
  persisted = await r.repository.read('base44:alice');
  assert.equal(persisted.quests['G5-0001'].status, 'ready_to_complete');
  assert.equal(Object.keys(persisted.questReceipts).length, 1);
});

test('interrupted completion leaves no partial reward; later retry credits once', async () => {
  const r = rig();
  await r.send('accept');
  r.positions.set('base44:alice', at(DEV_WORLD.card));
  await r.send('pickup');
  r.positions.set('base44:alice', at(DEV_WORLD.npc));
  r.repository.failAfterMutation = true;
  assert.equal((await r.send('complete')).status, 503);
  assert.equal((await r.repository.read('base44:alice')).wallet.game5_quest_token, undefined);
  assert.equal((await r.send('complete')).snapshot.testWallet, 1);
  assert.equal((await r.send('complete')).changed, false);
});

test('unavailable movement authority, storage, and invalid bodies fail closed', async () => {
  const absent = rig({ movement: false });
  assert.equal((await absent.send('state')).status, 200);
  assert.equal((await absent.send('accept')).error, 'MOVEMENT_AUTHORITY_NOT_CONFIGURED');
  const r = rig();
  assert.equal((await r.send('accept', { raw: '{broken' })).status, 400);
  assert.equal((await r.send('accept', { body: { npcId: DEV_WORLD.npc.id, anything: 1 } })).status, 400);
  assert.equal((await r.send('accept', { body: { npcId: 'bogus' } })).status, 400);
  const stopped = new AtomicTestRepository();
  stopped.unavailable = true;
  assert.equal((await rig({ repository: stopped }).send('state')).status, 503);
});

test('real file adapter survives handler restart and one-time credit remains durable', { skip: process.platform !== 'linux' }, async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'game5-g50003-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const first = rig({ repository: new FileQuestRepository({ directory }) });
  await first.send('accept');
  first.positions.set('base44:alice', at(DEV_WORLD.card));
  assert.equal((await first.send('pickup')).status, 200);
  const second = rig({ repository: new FileQuestRepository({ directory }) });
  second.positions.set('base44:alice', at(DEV_WORLD.npc));
  assert.equal((await second.send('state')).snapshot.quest.status, 'ready_to_complete');
  assert.equal((await second.send('complete')).snapshot.testWallet, 1);
  const third = rig({ repository: new FileQuestRepository({ directory }) });
  assert.equal((await third.send('state')).snapshot.quest.status, 'completed');
  assert.equal((await third.send('complete')).changed, false);
  assert.equal((await third.send('state')).snapshot.testWallet, 1);
});
