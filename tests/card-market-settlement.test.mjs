import assert from 'node:assert/strict';
import Module from 'node:module';
import { buildSync } from 'esbuild';
import { makeRewardFixture } from './helpers/reward-fixture.mjs';

function bundle(entry) {
  const filename = process.cwd() + '/tests/__card_market_settlement_bundle.cjs';
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

const { finalizeFixedPriceCardPurchase } = bundle('./base44/shared/cardMarketSettlement.ts');

function seed(fx, suffix = '1') {
  const buyerId = `buyer-${suffix}`;
  const sellerId = `seller-${suffix}`;
  const cardId = `card-${suffix}`;
  const listingId = `listing-${suffix}`;
  fx.rows('User').push(
    { id: buyerId, avatar_gamer_points: 500, market_debit_receipts: [], market_credit_receipts: [] },
    { id: sellerId, avatar_gamer_points: 25, market_debit_receipts: [], market_credit_receipts: [] },
  );
  fx.rows('UserCard').push({
    id: cardId,
    user_id: sellerId,
    trading_card_id: `definition-${suffix}`,
    card_type: 'ability',
    card_name: `Test Card ${suffix}`,
    card_rarity: 'Rare',
    acquisition_method: 'unlocked',
    acquired_at: '2026-09-29T12:00:00.000Z',
    is_equipped: false,
    equipped_to: 'none',
    trade_status: 'locked_in_trade',
    last_trade_id: listingId,
    quantity: 1,
  });
  fx.rows('CardProgression').push({
    id: `progression-${suffix}`,
    user_id: sellerId,
    user_card_id: cardId,
    card_name: `Test Card ${suffix}`,
    system_version: 2,
    enhancement_percent: 72,
    ascension: 1,
    stack_level: 2,
    permanent_stats: {},
    current_cycle_stats: {},
    base_stats: { attack: 100 },
    power_score: 120,
    migration_power_multiplier: 1,
    mastery_visual: 'standard',
    revision: 4,
  });
  fx.rows('CardTrade').push({
    id: listingId,
    seller_id: sellerId,
    buyer_id: '',
    card_id: cardId,
    listing_type: 'fixed_price',
    asking_price: 120,
    status: 'active',
    card_snapshot: { name: `Test Card ${suffix}` },
    views: 0,
  });
  return { buyerId, sellerId, cardId, listingId };
}

function row(fx, table, id) {
  return fx.rows(table).find((item) => item.id === id);
}

{
  const fx = makeRewardFixture();
  const ids = seed(fx, 'normal');
  const svc = fx.entities();
  const listing = await finalizeFixedPriceCardPurchase(svc, row(fx, 'CardTrade', ids.listingId), ids.buyerId);
  assert.equal(listing.status, 'sold');
  assert.equal(listing.settlement_state, 'completed');
  assert.equal(row(fx, 'User', ids.buyerId).avatar_gamer_points, 380);
  assert.equal(row(fx, 'User', ids.sellerId).avatar_gamer_points, 145);
  assert.equal(row(fx, 'UserCard', ids.cardId).user_id, ids.buyerId);
  assert.equal(row(fx, 'CardProgression', 'progression-normal').user_id, ids.buyerId);
  assert.equal(fx.rows('MarketTransaction').length, 1);
  const passport = fx.rows('CardPassport')[0];
  assert.equal(passport.current_owner_id, ids.buyerId);

  await finalizeFixedPriceCardPurchase(svc, row(fx, 'CardTrade', ids.listingId), ids.buyerId);
  assert.equal(row(fx, 'User', ids.buyerId).avatar_gamer_points, 380, 'retry must not debit buyer twice');
  assert.equal(row(fx, 'User', ids.sellerId).avatar_gamer_points, 145, 'retry must not credit seller twice');
  assert.equal(fx.rows('MarketTransaction').length, 1, 'retry must not duplicate transaction journal');
}

{
  const fx = makeRewardFixture();
  const ids = seed(fx, 'debit-crash');
  const svc = fx.entities();
  fx.failOnce(({ name, operation, phase, data }) =>
    name === 'User'
    && operation === 'updateMany'
    && phase === 'after'
    && Number(data?.$inc?.avatar_gamer_points || 0) < 0
  );
  await assert.rejects(
    () => finalizeFixedPriceCardPurchase(svc, row(fx, 'CardTrade', ids.listingId), ids.buyerId),
    /Injected after User updateMany failure/,
  );
  assert.equal(row(fx, 'User', ids.buyerId).avatar_gamer_points, 380, 'crash happened after the buyer debit persisted');
  assert.equal(row(fx, 'CardTrade', ids.listingId).status, 'processing');
  assert.equal(row(fx, 'CardTrade', ids.listingId).settlement_state, 'needs_recovery');

  await finalizeFixedPriceCardPurchase(svc, row(fx, 'CardTrade', ids.listingId), ids.buyerId);
  assert.equal(row(fx, 'User', ids.buyerId).avatar_gamer_points, 380, 'recovery must recognize persisted debit receipt');
  assert.equal(row(fx, 'User', ids.sellerId).avatar_gamer_points, 145);
  assert.equal(row(fx, 'CardTrade', ids.listingId).status, 'sold');
  assert.equal(fx.rows('MarketTransaction').length, 1);
}

{
  const fx = makeRewardFixture();
  const ids = seed(fx, 'journal-crash');
  const svc = fx.entities();
  fx.failOnce(({ name, operation, phase }) => name === 'MarketTransaction' && operation === 'create' && phase === 'after');
  await assert.rejects(
    () => finalizeFixedPriceCardPurchase(svc, row(fx, 'CardTrade', ids.listingId), ids.buyerId),
    /Injected after MarketTransaction create failure/,
  );
  assert.equal(fx.rows('MarketTransaction').length, 1, 'transaction exists despite response-path crash');
  await finalizeFixedPriceCardPurchase(svc, row(fx, 'CardTrade', ids.listingId), ids.buyerId);
  assert.equal(fx.rows('MarketTransaction').length, 1, 'recovery must reuse existing settlement transaction');
  assert.equal(row(fx, 'User', ids.buyerId).avatar_gamer_points, 380);
  assert.equal(row(fx, 'User', ids.sellerId).avatar_gamer_points, 145);
  assert.equal(row(fx, 'CardTrade', ids.listingId).status, 'sold');
}

console.log('PASS: Trading Post settlement is serialized, idempotent, and recoverable across partial failures.');
