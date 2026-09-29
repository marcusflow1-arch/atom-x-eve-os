import assert from 'node:assert/strict';
import Module from 'node:module';
import { buildSync } from 'esbuild';
import { makeRewardFixture } from './helpers/reward-fixture.mjs';

function bundle(entry) {
  const filename = process.cwd() + '/tests/__card_trade_negotiation_bundle.cjs';
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

const { openCardTradeNegotiation } = bundle('./base44/shared/cardListingNegotiation.ts');
const { finalizeCardTradeSession } = bundle('./base44/shared/cardTradeFinalizer.ts');

function seed(fx, suffix = 'normal') {
  const seller = `seller-${suffix}`;
  const buyer = `buyer-${suffix}`;
  const cardId = `card-${suffix}`;
  const listingId = `listing-${suffix}`;
  fx.rows('UserCard').push({
    id: cardId,
    user_id: seller,
    trading_card_id: `def-${suffix}`,
    card_type: 'ability',
    card_name: `Negotiated Card ${suffix}`,
    card_rarity: 'Rare',
    acquisition_method: 'unlocked',
    is_equipped: false,
    equipped_to: 'none',
    trade_status: 'locked_in_trade',
    last_trade_id: listingId,
    quantity: 1,
  });
  fx.rows('CardProgression').push({
    id: `progress-${suffix}`,
    user_id: seller,
    user_card_id: cardId,
    card_name: `Negotiated Card ${suffix}`,
    system_version: 2,
    enhancement_percent: 60,
    ascension: 1,
    stack_level: 1,
    permanent_stats: {},
    current_cycle_stats: {},
    base_stats: { attack: 100 },
    migration_power_multiplier: 1,
    mastery_visual: 'standard',
    revision: 1,
  });
  fx.rows('CardTrade').push({
    id: listingId,
    seller_id: seller,
    buyer_id: '',
    card_id: cardId,
    card_snapshot: { name: `Negotiated Card ${suffix}` },
    listing_type: 'fixed_price',
    asking_price: 100,
    status: 'active',
    views: 0,
  });
  return { seller, buyer, cardId, listingId };
}

function row(fx, table, id) {
  return fx.rows(table).find((item) => item.id === id);
}

{
  const fx = makeRewardFixture();
  const ids = seed(fx, 'normal');
  const svc = fx.entities();
  const session = await openCardTradeNegotiation(svc, row(fx, 'CardTrade', ids.listingId), ids.buyer);
  assert.equal(session.status, 'pending');
  assert.deepEqual(session.recipient_offer_card_ids, [ids.cardId]);
  assert.equal(row(fx, 'CardTrade', ids.listingId).status, 'cancelled', 'negotiated listing must leave the public buyable market');
  assert.equal(row(fx, 'UserCard', ids.cardId).trade_status, 'locked_in_trade');
  assert.equal(row(fx, 'UserCard', ids.cardId).last_trade_id, session.id, 'card reservation must move from listing ID to trade-session ID');

  await svc.TradeSession.update(session.id, {
    status: 'accepted',
    initiator_confirmed: true,
    recipient_confirmed: true,
  });
  const completed = await finalizeCardTradeSession(svc, await svc.TradeSession.get(session.id), {
    method: 'friend_trade',
    progression_action: 'friend_trade_transfer',
  });
  assert.equal(completed.status, 'completed');
  assert.equal(row(fx, 'UserCard', ids.cardId).user_id, ids.buyer);
  assert.equal(row(fx, 'CardProgression', 'progress-normal').user_id, ids.buyer);
}

{
  const fx = makeRewardFixture();
  const ids = seed(fx, 'rollback');
  const svc = fx.entities();
  fx.failOnce(({ name, operation, phase, data }) =>
    name === 'UserCard'
    && operation === 'update'
    && phase === 'after'
    && data?.last_trade_id?.startsWith('TradeSession-')
  );
  await assert.rejects(
    () => openCardTradeNegotiation(svc, row(fx, 'CardTrade', ids.listingId), ids.buyer),
    /Injected after UserCard update failure/,
  );
  assert.equal(row(fx, 'CardTrade', ids.listingId).status, 'active', 'failed handoff must restore the public listing');
  assert.equal(row(fx, 'UserCard', ids.cardId).last_trade_id, ids.listingId, 'failed handoff must restore listing reservation');
  assert.equal(row(fx, 'UserCard', ids.cardId).trade_status, 'locked_in_trade');
  assert.equal(fx.rows('TradeSession')[0].status, 'cancelled');
}

{
  const fx = makeRewardFixture();
  const ids = seed(fx, 'existing');
  const svc = fx.entities();
  fx.rows('TradeSession').push({
    id: 'existing-session',
    initiator_id: ids.buyer,
    recipient_id: ids.seller,
    status: 'accepted',
    initiator_offer_card_ids: [], recipient_offer_card_ids: [],
    initiator_offer_snapshot: [], recipient_offer_snapshot: [],
    initiator_confirmed: false, recipient_confirmed: false,
  });
  await assert.rejects(
    () => openCardTradeNegotiation(svc, row(fx, 'CardTrade', ids.listingId), ids.buyer),
    /already have an active trade/i,
  );
  assert.equal(row(fx, 'CardTrade', ids.listingId).status, 'active');
  assert.equal(row(fx, 'UserCard', ids.cardId).last_trade_id, ids.listingId);
}

console.log('PASS: Trading Post negotiations safely hand card reservations into shared trade sessions and recover on failure.');
