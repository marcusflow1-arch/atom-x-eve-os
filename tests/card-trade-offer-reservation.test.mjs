import assert from 'node:assert/strict';
import Module from 'node:module';
import { buildSync } from 'esbuild';
import { makeRewardFixture } from './helpers/reward-fixture.mjs';

function bundle(entry) {
  const filename = process.cwd() + '/tests/__card_trade_offer_reservation_bundle.cjs';
  const result = buildSync({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    target: 'node20',
  });
  const mod = new Module(filename);
  mod.paths = Module._nodeModulePaths(process.cwd());
  mod._compile(result.outputFiles[0].text, filename);
  return mod.exports;
}

const { commitTradeOfferReservationSet } = bundle('./base44/shared/cardTradeOfferReservation.ts');

function seed(fx, suffix) {
  const userId = `user-${suffix}`;
  const sessionId = `session-${suffix}`;
  const oldCardId = `old-${suffix}`;
  const newCardId = `new-${suffix}`;
  fx.rows('UserCard').push(
    {
      id: oldCardId,
      user_id: userId,
      card_name: 'Old Offer Card',
      trade_status: 'locked_in_trade',
      last_trade_id: sessionId,
    },
    {
      id: newCardId,
      user_id: userId,
      card_name: 'New Offer Card',
      trade_status: 'available',
      last_trade_id: '',
    },
  );
  fx.rows('TradeSession').push({
    id: sessionId,
    initiator_id: userId,
    recipient_id: `partner-${suffix}`,
    status: 'accepted',
    initiator_offer_card_ids: [oldCardId],
    initiator_offer_snapshot: [{ id: oldCardId, card_name: 'Old Offer Card' }],
    recipient_offer_card_ids: ['partner-card'],
    recipient_offer_snapshot: [{ id: 'partner-card' }],
    initiator_confirmed: true,
    recipient_confirmed: true,
  });
  return { userId, sessionId, oldCardId, newCardId };
}

function row(fx, table, id) {
  return fx.rows(table).find((item) => item.id === id);
}

{
  const fx = makeRewardFixture();
  const ids = seed(fx, 'success');
  const svc = fx.entities();
  const session = row(fx, 'TradeSession', ids.sessionId);
  const updated = await commitTradeOfferReservationSet(svc, {
    session,
    user_id: ids.userId,
    card_ids: [ids.newCardId],
    snapshots: [{ id: ids.newCardId, card_name: 'New Offer Card' }],
    is_initiator: true,
  });

  assert.deepEqual(updated.initiator_offer_card_ids, [ids.newCardId]);
  assert.equal(updated.initiator_confirmed, false);
  assert.equal(updated.recipient_confirmed, false);
  assert.equal(row(fx, 'UserCard', ids.oldCardId).trade_status, 'available');
  assert.equal(row(fx, 'UserCard', ids.oldCardId).last_trade_id, '');
  assert.equal(row(fx, 'UserCard', ids.newCardId).trade_status, 'locked_in_trade');
  assert.equal(row(fx, 'UserCard', ids.newCardId).last_trade_id, ids.sessionId);
}

{
  const fx = makeRewardFixture();
  const ids = seed(fx, 'rollback');
  const svc = fx.entities();
  const session = row(fx, 'TradeSession', ids.sessionId);
  fx.failOnce(({ name, operation, phase, data }) =>
    name === 'TradeSession'
    && operation === 'update'
    && phase === 'after'
    && Array.isArray(data?.initiator_offer_card_ids)
    && data.initiator_offer_card_ids.includes(ids.newCardId)
  );

  await assert.rejects(
    () => commitTradeOfferReservationSet(svc, {
      session,
      user_id: ids.userId,
      card_ids: [ids.newCardId],
      snapshots: [{ id: ids.newCardId, card_name: 'New Offer Card' }],
      is_initiator: true,
    }),
    /Injected after TradeSession update failure/,
  );

  const restored = row(fx, 'TradeSession', ids.sessionId);
  assert.deepEqual(restored.initiator_offer_card_ids, [ids.oldCardId], 'failed offer write must restore previous session offer');
  assert.equal(restored.initiator_confirmed, true, 'failed offer write must restore previous confirmation state');
  assert.equal(restored.recipient_confirmed, true, 'failed offer write must restore counterparty confirmation state');
  assert.equal(row(fx, 'UserCard', ids.oldCardId).trade_status, 'locked_in_trade', 'old reservation must be restored');
  assert.equal(row(fx, 'UserCard', ids.oldCardId).last_trade_id, ids.sessionId);
  assert.equal(row(fx, 'UserCard', ids.newCardId).trade_status, 'available', 'new reservation must be rolled back');
  assert.equal(row(fx, 'UserCard', ids.newCardId).last_trade_id, '');
}

console.log('PASS: Friend-trade offer edits keep TradeSession state and card reservations aligned and roll back partial writes.');
