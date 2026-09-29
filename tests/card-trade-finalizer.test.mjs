import assert from 'node:assert/strict';
import Module from 'node:module';
import { buildSync } from 'esbuild';
import { makeRewardFixture } from './helpers/reward-fixture.mjs';

function bundle(entry) {
  const filename = process.cwd() + '/tests/__card_trade_finalizer_bundle.cjs';
  const result = buildSync({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    target: 'node20',
    external: ['npm:*'],
  });
  const mod = new Module(filename);
  mod.paths = Module._nodeModulePaths(process.cwd());
  mod._compile(result.outputFiles[0].text, filename);
  return mod.exports;
}

const { finalizeCardTradeSession } = bundle('./base44/shared/cardTradeFinalizer.ts');
const {
  acquireTradeSessionMutationLock,
  releaseTradeSessionMutationLock,
} = bundle('./base44/shared/tradeSessionMutationLock.ts');

function seedTwoWay(fx, suffix = 'normal') {
  const a = `user-a-${suffix}`;
  const b = `user-b-${suffix}`;
  const sessionId = `trade-${suffix}`;
  const cardA = `card-a-${suffix}`;
  const cardB = `card-b-${suffix}`;
  fx.rows('UserCard').push(
    {
      id: cardA, user_id: a, trading_card_id: 'def-a', card_type: 'ability', card_name: 'Alpha',
      card_rarity: 'Rare', acquisition_method: 'unlocked', is_equipped: false, equipped_to: 'none',
      trade_status: 'locked_in_trade', last_trade_id: sessionId, quantity: 1,
    },
    {
      id: cardB, user_id: b, trading_card_id: 'def-b', card_type: 'ability', card_name: 'Beta',
      card_rarity: 'Rare', acquisition_method: 'unlocked', is_equipped: false, equipped_to: 'none',
      trade_status: 'locked_in_trade', last_trade_id: sessionId, quantity: 1,
    },
  );
  fx.rows('CardProgression').push(
    {
      id: `progress-a-${suffix}`, user_id: a, user_card_id: cardA, card_name: 'Alpha', system_version: 2,
      enhancement_percent: 80, ascension: 1, stack_level: 2, permanent_stats: {}, current_cycle_stats: {},
      base_stats: { attack: 100 }, migration_power_multiplier: 1, mastery_visual: 'standard', revision: 3,
    },
    {
      id: `progress-b-${suffix}`, user_id: b, user_card_id: cardB, card_name: 'Beta', system_version: 2,
      enhancement_percent: 40, ascension: 0, stack_level: 1, permanent_stats: {}, current_cycle_stats: {},
      base_stats: { attack: 90 }, migration_power_multiplier: 1, mastery_visual: 'standard', revision: 2,
    },
  );
  fx.rows('TradeSession').push({
    id: sessionId,
    initiator_id: a,
    recipient_id: b,
    status: 'accepted',
    initiator_offer_card_ids: [cardA],
    recipient_offer_card_ids: [cardB],
    initiator_offer_snapshot: [],
    recipient_offer_snapshot: [],
    initiator_confirmed: true,
    recipient_confirmed: true,
  });
  return { a, b, sessionId, cardA, cardB };
}

function row(fx, table, id) {
  return fx.rows(table).find((item) => item.id === id);
}

{
  const fx = makeRewardFixture();
  const ids = seedTwoWay(fx, 'normal');
  const svc = fx.entities();
  const completed = await finalizeCardTradeSession(svc, row(fx, 'TradeSession', ids.sessionId), {
    method: 'friend_trade',
    progression_action: 'friend_trade_transfer',
  });
  assert.equal(completed.status, 'completed');
  assert.equal(row(fx, 'UserCard', ids.cardA).user_id, ids.b);
  assert.equal(row(fx, 'UserCard', ids.cardB).user_id, ids.a);
  assert.equal(row(fx, 'CardProgression', 'progress-a-normal').user_id, ids.b);
  assert.equal(row(fx, 'CardProgression', 'progress-b-normal').user_id, ids.a);
  assert.equal(fx.rows('CardPassport').find((p) => p.user_card_id === ids.cardA).current_owner_id, ids.b);
  assert.equal(fx.rows('CardPassport').find((p) => p.user_card_id === ids.cardB).current_owner_id, ids.a);
  assert.equal(fx.rows('CardProvenanceEvent').filter((event) => event.event_type === 'ownership_transfer').length, 2);

  await finalizeCardTradeSession(svc, row(fx, 'TradeSession', ids.sessionId), {
    method: 'friend_trade',
    progression_action: 'friend_trade_transfer',
  });
  assert.equal(
    fx.rows('CardProvenanceEvent').filter((event) => event.event_type === 'ownership_transfer').length,
    2,
    'completed-trade retry must not duplicate ownership provenance',
  );
}

{
  const fx = makeRewardFixture();
  const ids = seedTwoWay(fx, 'crash');
  const svc = fx.entities();
  fx.failOnce(({ name, operation, phase, data }) =>
    name === 'UserCard'
    && operation === 'update'
    && phase === 'after'
    && data?.user_id === ids.b
  );
  await assert.rejects(
    () => finalizeCardTradeSession(svc, row(fx, 'TradeSession', ids.sessionId), {
      method: 'friend_trade', progression_action: 'friend_trade_transfer',
    }),
    /Injected after UserCard update failure/,
  );
  assert.equal(row(fx, 'UserCard', ids.cardA).user_id, ids.b, 'first ownership move persisted before the simulated crash');
  assert.equal(row(fx, 'TradeSession', ids.sessionId).status, 'accepted');

  const recovered = await finalizeCardTradeSession(svc, row(fx, 'TradeSession', ids.sessionId), {
    method: 'friend_trade', progression_action: 'friend_trade_transfer',
  });
  assert.equal(recovered.status, 'completed');
  assert.equal(row(fx, 'UserCard', ids.cardA).user_id, ids.b);
  assert.equal(row(fx, 'UserCard', ids.cardB).user_id, ids.a);
  assert.equal(fx.rows('CardProvenanceEvent').filter((event) => event.event_type === 'ownership_transfer').length, 2);
}

{
  const fx = makeRewardFixture();
  const ids = seedTwoWay(fx, 'duplicate');
  const session = row(fx, 'TradeSession', ids.sessionId);
  session.recipient_offer_card_ids = [ids.cardA];
  const svc = fx.entities();
  await assert.rejects(
    () => finalizeCardTradeSession(svc, session),
    /same card cannot appear twice/i,
  );
  assert.equal(row(fx, 'UserCard', ids.cardA).user_id, ids.a);
  assert.equal(row(fx, 'TradeSession', ids.sessionId).status, 'accepted');
}

{
  const fx = makeRewardFixture();
  const ids = seedTwoWay(fx, 'lease');
  const svc = fx.entities();
  const lease = await acquireTradeSessionMutationLock(svc, ids.sessionId, 'test_offer_edit');
  try {
    await assert.rejects(
      () => finalizeCardTradeSession(svc, row(fx, 'TradeSession', ids.sessionId)),
      /trade is being changed somewhere else/i,
    );
  } finally {
    await releaseTradeSessionMutationLock(svc, lease);
  }
  const completed = await finalizeCardTradeSession(svc, row(fx, 'TradeSession', ids.sessionId));
  assert.equal(completed.status, 'completed');
}

console.log('PASS: Friend-card trade finalization is session-serialized, card-serialized, idempotent, and recoverable.');
