import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLostCardQuestService, LOST_CARD_QUEST } from '../../../src/game5/quests/lostCardQuest.mjs';
import { FileQuestRepository } from '../../../src/game5/quests/fileQuestRepository.mjs';

const actor = (playerId = 'player-one') => ({ authenticated: true, playerId });
const pickup = (overrides = {}) => ({
  type: 'game5.inventory.card_collected.v1',
  eventId: 'inventory-pickup-123',
  cardId: LOST_CARD_QUEST.targetCardId,
  cardInstanceId: 'card-copy-abc',
  ...overrides,
});

async function setup(t, { verifyCollection = async () => true } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'game5-lost-card-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const repository = new FileQuestRepository({ directory });
  return { directory, repository, service: createLostCardQuestService({ repository, verifyCollection }) };
}

test('untrusted clients cannot enter quest APIs without authenticated actor', async (t) => {
  const { service } = await setup(t);
  await assert.rejects(() => service.acceptQuest({ actor: { playerId: 'player-one' } }), /Authenticated/);
  await assert.rejects(() => service.getQuestState({ actor: null }), /Authenticated/);
  await assert.rejects(() => service.completeQuest({ actor: {} }), /Authenticated/);
});

test('quest must be accepted, and acceptance is idempotent', async (t) => {
  const { service } = await setup(t);
  assert.equal((await service.getQuestState({ actor: actor() })).status, 'not_started');
  assert.equal((await service.recordItemCollection({ actor: actor(), event: pickup() })).progressed, false);
  const first = await service.acceptQuest({ actor: actor() });
  assert.equal(first.accepted, true);
  assert.equal(first.state.status, 'active');
  const repeated = await service.acceptQuest({ actor: actor() });
  assert.equal(repeated.accepted, false);
  assert.equal(repeated.state.objective.current, 0);
});

test('wrong card, invalid collection and unsupported event cannot progress the objective', async (t) => {
  let checks = 0;
  const { service } = await setup(t, { verifyCollection: async () => { checks++; return false; } });
  await service.acceptQuest({ actor: actor() });
  assert.equal((await service.recordItemCollection({ actor: actor(), event: pickup({ cardId: 'game5:another-card' }) })).progressed, false);
  assert.equal(checks, 0);
  assert.equal((await service.recordItemCollection({ actor: actor(), event: pickup() })).progressed, false);
  assert.equal(checks, 1);
  await assert.rejects(() => service.recordItemCollection({ actor: actor(), event: pickup({ eventId: '' }) }), /valid server/);
  assert.equal((await service.getQuestState({ actor: actor() })).status, 'active');
});

test('verified collection advances exactly once and persists its output event contract', async (t) => {
  let checks = 0;
  const { service, repository } = await setup(t, { verifyCollection: async ({ playerId, event }) => {
    checks++;
    return playerId === 'player-one' && event.cardInstanceId === 'card-copy-abc';
  } });
  await service.acceptQuest({ actor: actor() });
  const first = await service.recordItemCollection({ actor: actor(), event: pickup() });
  assert.equal(first.progressed, true);
  assert.equal(first.state.status, 'ready_to_complete');
  assert.equal(first.state.objective.current, 1);
  assert.equal(first.emittedEvent.schema_version, 'game5.quest.item_collected.v1');
  assert.equal(first.emittedEvent.sourceEventId, 'inventory-pickup-123');
  assert.equal((await service.recordItemCollection({ actor: actor(), event: pickup() })).progressed, false);
  assert.equal((await service.recordItemCollection({ actor: actor(), event: pickup({ eventId: 'different-event' }) })).progressed, false);
  assert.equal(checks, 1);
  const record = await repository.read('player-one');
  assert.equal(Object.keys(record.outbox).length, 1);
  assert.deepEqual(Object.values(record.outbox)[0], first.emittedEvent);
});

test('completion requires collected objective and awards test currency exactly once', async (t) => {
  const { service, repository } = await setup(t);
  assert.equal((await service.completeQuest({ actor: actor() })).rewarded, false);
  await service.acceptQuest({ actor: actor() });
  assert.equal((await service.completeQuest({ actor: actor() })).rewarded, false);
  await service.recordItemCollection({ actor: actor(), event: pickup() });
  const result = await service.completeQuest({ actor: actor() });
  assert.equal(result.rewarded, true);
  assert.equal(result.state.status, 'completed');
  assert.equal(result.state.rewarded, true);
  assert.equal((await service.completeQuest({ actor: actor() })).rewarded, false);
  const record = await repository.read('player-one');
  assert.equal(record.wallet.game5_quest_token, 1);
  assert.equal(Object.keys(record.rewardLedger).length, 1);
  assert.equal((await service.acceptQuest({ actor: actor() })).accepted, false);
});

test('quest status survives service and repository reconstruction / reload', async (t) => {
  const { directory, service } = await setup(t);
  await service.acceptQuest({ actor: actor() });
  const second = createLostCardQuestService({
    repository: new FileQuestRepository({ directory }), verifyCollection: async () => true,
  });
  assert.equal((await second.getQuestState({ actor: actor() })).status, 'active');
  await second.recordItemCollection({ actor: actor(), event: pickup() });
  const third = createLostCardQuestService({
    repository: new FileQuestRepository({ directory }), verifyCollection: async () => true,
  });
  assert.equal((await third.getQuestState({ actor: actor() })).objective.current, 1);
  assert.equal((await third.completeQuest({ actor: actor() })).rewarded, true);
  assert.equal((await service.getQuestState({ actor: actor() })).status, 'completed');
  assert.equal((await second.completeQuest({ actor: actor() })).rewarded, false);
});

test('concurrent clients, independent repository instances: only one reward and transition', async (t) => {
  const { directory, service, repository } = await setup(t);
  await service.acceptQuest({ actor: actor() });
  const otherClient = createLostCardQuestService({
    repository: new FileQuestRepository({ directory }), verifyCollection: async () => true,
  });
  const pickupResults = await Promise.all(Array.from({ length: 12 }, (_, i) =>
    (i % 2 ? service : otherClient).recordItemCollection({ actor: actor(), event: pickup({ eventId: `event-${i}` }) })
  ));
  assert.equal(pickupResults.filter((x) => x.progressed).length, 1);
  const completions = await Promise.all(Array.from({ length: 20 }, (_, i) =>
    (i % 2 ? service : otherClient).completeQuest({ actor: actor() })
  ));
  assert.equal(completions.filter((x) => x.rewarded).length, 1);
  const record = await repository.read('player-one');
  assert.equal(record.wallet.game5_quest_token, 1);
  assert.equal(Object.keys(record.rewardLedger).length, 1);
});

test('players have independent quests and completion rewards', async (t) => {
  const { service, repository } = await setup(t);
  for (const playerId of ['player-one', 'player-two']) {
    await service.acceptQuest({ actor: actor(playerId) });
    await service.recordItemCollection({ actor: actor(playerId), event: pickup() });
    assert.equal((await service.completeQuest({ actor: actor(playerId) })).rewarded, true);
  }
  assert.equal((await repository.read('player-one')).wallet.game5_quest_token, 1);
  assert.equal((await repository.read('player-two')).wallet.game5_quest_token, 1);
});

test('verifier exceptions roll back quest progress and do not emit outbox events', async (t) => {
  const { service, repository } = await setup(t, { verifyCollection: async () => { throw new Error('inventory offline'); } });
  await service.acceptQuest({ actor: actor() });
  await assert.rejects(() => service.recordItemCollection({ actor: actor(), event: pickup() }), /inventory offline/);
  assert.equal((await service.getQuestState({ actor: actor() })).status, 'active');
  assert.equal(Object.keys((await repository.read('player-one')).outbox).length, 0);
});

test('service requires explicit atomic persistence and a trusted inventory verifier', async () => {
  assert.throws(() => createLostCardQuestService(), /Transactional/);
  assert.throws(() => createLostCardQuestService({ repository: { read() {}, transact() {} } }), /Server-authoritative/);
});
