import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { buildSync } from 'esbuild';
import { makeRewardFixture } from './helpers/reward-fixture.mjs';

const db = makeRewardFixture(), svc = db.entities(), handlers = {};
const sessions = new Map(), lines = new Map(), attempts = new Map(), providerCalls = [];
let clock = 1700000000100, providerLostResponse = false, webhookSecret = 'signed-test-secret';
class ClockDate extends Date { constructor(...args) { super(...(args.length ? args : [clock])); } static now() { return clock; } }
const clone = value => structuredClone(value);
const stripe = {
  checkout: { sessions: {
    create: async (params, options) => {
      providerCalls.push({ params: clone(params), options: clone(options) });
      const key = options.idempotencyKey;
      if (!attempts.has(key)) {
        const id = 'cs_test_' + (sessions.size + 1);
        const data = params.line_items.map((line, index) => ({
          id: 'li_' + index, amount_total: line.price_data.unit_amount, amount_subtotal: line.price_data.unit_amount,
          quantity: 1, currency: 'usd', description: line.price_data.product_data.name,
          price: { currency: 'usd', unit_amount: line.price_data.unit_amount, product: { id: 'product_' + index, ...line.price_data.product_data } },
        }));
        const total = data.reduce((sum, item) => sum + item.amount_total, 0);
        const session = { id, status: 'open', mode: 'payment', payment_status: 'unpaid', currency: 'usd',
          amount_total: total, amount_subtotal: total, metadata: clone(params.metadata), client_reference_id: params.client_reference_id,
          url: 'https://checkout.stripe.com/c/pay/' + id };
        sessions.set(id, session); lines.set(id, data); attempts.set(key, id);
      }
      if (providerLostResponse) { providerLostResponse = false; throw new Error('Provider response lost'); }
      return clone(sessions.get(attempts.get(key)));
    },
    retrieve: async id => { assert.ok(sessions.has(id), 'missing mocked session'); return clone(sessions.get(id)); },
    listLineItems: async (id, options) => {
      const all = lines.get(id); assert.ok(all);
      assert.deepEqual(Array.from(options.expand), ['data.price.product']);
      const offset = options.starting_after ? all.findIndex(item => item.id === options.starting_after) + 1 : 0;
      // Intentionally return one item per page to exercise pagination.
      return { data: clone(all.slice(offset, offset + 1)), has_more: offset + 1 < all.length };
    },
  } },
  webhooks: { constructEventAsync: async (raw, signature, secret) => {
    if (signature !== 'valid-test-signature' || secret !== webhookSecret) throw new Error('Invalid signature');
    return JSON.parse(raw);
  } },
};
for (const name of ['createCheckoutSession', 'verifyStripeSession', 'stripeCheckoutWebhook', 'claimFreeGame']) {
  const context = {
    module: { exports: {} }, Response, Request, URL, Date: ClockDate, crypto: webcrypto,
    console: { warn() {}, error() {} },
    Deno: { serve: handler => { handlers[name] = handler; }, env: { get: key => key === 'STRIPE_CHECKOUT_WEBHOOK_SECRET' ? webhookSecret : 'test-key' } },
    require: id => {
      if (id.startsWith('npm:stripe@')) return function Stripe() { return stripe; };
      assert.equal(id, 'npm:@base44/sdk@0.8.51');
      return { createClientFromRequest: req => ({
        auth: { me: async () => req.headers.get('test-user') === 'none' ? null : { id: req.headers.get('test-user') || 'a' } },
        asServiceRole: { entities: svc },
      }) };
    },
  };
  context.exports = context.module.exports;
  vm.runInNewContext(buildSync({ entryPoints: ['base44/functions/' + name + '/entry.ts'], bundle: true, write: false, platform: 'node', format: 'cjs', external: ['npm:*'] }).outputFiles[0].text, context);
}
function seed() {
  db.rows('User').push({ id: 'a' }, { id: 'b' });
  db.rows('Game').push({ id: 'game', title: 'The Test Game', genre: 'rpg', description: 'Test', cover_image: '', status: 'available', price: 20, starter_card_ids: ['card'] });
  db.rows('TradingCard').push({ id: 'card', name: 'Starter', card_type: 'ability', image_url: '', game_id: 'game', rarity: 'Rare', status: 'live', tradable: true, stackable: true });
}
const cartBody = (patch = {}) => ({
  items: [{ id: 'game', type: 'game', price: 0.01 }], checkoutKey: 'checkout-attempt-0001',
  successUrl: 'https://app.example/OrderConfirmation?session_id={CHECKOUT_SESSION_ID}', cancelUrl: 'https://app.example/Checkout', ...patch,
});
async function request(name, body, status = 200, { actor = 'a', signature, method = 'POST' } = {}) {
  const response = await handlers[name](new Request('https://test.local/', {
    method, headers: { 'test-user': actor, 'stripe-signature': signature || '' }, ...(method === 'GET' ? {} : { body: JSON.stringify(body) }),
  }));
  const data = await response.json();
  assert.equal(response.status, status, JSON.stringify({ error: data.error, code: data.code }));
  return data;
}
const verify = (sessionId, status = 200, options) => request('verifyStripeSession', { sessionId }, status, options);
function pay(id) {
  const session = sessions.get(id);
  Object.assign(session, { status: 'complete', payment_status: 'paid', payment_intent: {
    id: 'pi_' + id, status: 'succeeded', currency: 'usd', amount_received: session.amount_total,
    latest_charge: { id: 'ch_' + id, refunded: false, amount_refunded: 0, disputed: false },
  } });
}
async function checkout() { const result = await request('createCheckoutSession', cartBody()); pay(result.sessionId); return result.sessionId; }
beforeEach(() => { db.reset(); sessions.clear(); lines.clear(); attempts.clear(); providerCalls.length = 0; providerLostResponse = false; clock = 1700000000100; webhookSecret = 'signed-test-secret'; seed(); });

test('checkout snapshots server prices and rewards before payment; metadata stays small', async () => {
  const result = await request('createCheckoutSession', cartBody());
  const order = db.rows('Order')[0];
  assert.equal(order.total_amount, 20); assert.equal(order.payment_status, 'unpaid'); assert.equal(order.status, 'pending');
  assert.deepEqual(order.items[0].starter_card_ids, ['card']);
  assert.equal(providerCalls[0].params.line_items[0].price_data.unit_amount, 2000);
  assert.equal(providerCalls[0].params.metadata.items, undefined);
  assert.equal(providerCalls[0].params.metadata.order_id, order.id);
  assert.equal(order.stripe_session_id, result.sessionId);
});
test('current sale price is authorized on the server', async () => {
  db.rows('Game')[0].sale_price = 12.34;
  await request('createCheckoutSession', cartBody());
  assert.equal(providerCalls[0].params.line_items[0].price_data.unit_amount, 1234);
});
test('repeating checkout reuses one session and does not create a new order', async () => {
  const a = await request('createCheckoutSession', cartBody()), b = await request('createCheckoutSession', cartBody());
  assert.equal(a.sessionId, b.sessionId); assert.equal(providerCalls.length, 1); assert.equal(db.rows('Order').length, 1);
});
test('lost provider response is recovered with the same Stripe idempotency key', async () => {
  providerLostResponse = true; await request('createCheckoutSession', cartBody(), 500);
  const result = await request('createCheckoutSession', cartBody());
  assert.equal(sessions.size, 1); assert.equal(result.sessionId, 'cs_test_1');
  assert.deepEqual(providerCalls[0], providerCalls[1]);
});
test('lost session-link acknowledgement reuses the saved session', async () => {
  db.failOnce(op => op.name === 'Order' && op.operation === 'updateMany' && op.phase === 'after' && op.data.$set?.stripe_session_id);
  await request('createCheckoutSession', cartBody(), 503);
  await request('createCheckoutSession', cartBody());
  assert.equal(sessions.size, 1); assert.equal(providerCalls.length, 1);
});
test('lost order creation acknowledgement resumes the original order', async () => {
  db.failOnce(op => op.name === 'Order' && op.operation === 'create' && op.phase === 'after');
  await request('createCheckoutSession', cartBody(), 503); await request('createCheckoutSession', cartBody());
  assert.equal(db.rows('Order').length, 1); assert.equal(sessions.size, 1);
});
test('old checkout without a saved session cannot reuse an expired idempotency guarantee', async () => {
  providerLostResponse = true; await request('createCheckoutSession', cartBody(), 500);
  clock += 24 * 60 * 60 * 1000;
  const result = await request('createCheckoutSession', cartBody(), 409);
  assert.equal(result.code, 'CHECKOUT_REVIEW_REQUIRED'); assert.equal(providerCalls.length, 1);
});
test('a completed checkout routes back to verification rather than another charge', async () => {
  const id = await checkout(); const result = await request('createCheckoutSession', cartBody());
  assert.equal(result.verify, true); assert.equal(result.sessionId, id); assert.equal(providerCalls.length, 1);
});
test('an expired session requires a new checkout attempt', async () => {
  const result = await request('createCheckoutSession', cartBody()); sessions.get(result.sessionId).status = 'expired';
  assert.equal((await request('createCheckoutSession', cartBody(), 409)).code, 'CHECKOUT_EXPIRED');
});
test('changed catalog price, title, availability and starter list do not alter a paid snapshot', async () => {
  const id = await checkout();
  Object.assign(db.rows('Game')[0], { price: 99, status: 'planned', title: 'Changed', starter_card_ids: ['new-card'] });
  const result = await verify(id);
  assert.equal(result.order.total_amount, 20); assert.equal(result.order.items[0].title, 'The Test Game');
  assert.equal(result.order.status, 'completed'); assert.equal(db.rows('UserCard')[0].trading_card_id, 'card');
});
test('completed verification is a no-op; transferred rewards are never reminted', async () => {
  const id = await checkout(); await verify(id);
  db.rows('UserCard')[0].user_id = 'b'; const before = db.writes.length;
  const repeat = await verify(id);
  assert.equal(repeat.alreadyProcessed, true); assert.equal(db.writes.length, before); assert.equal(db.rows('UserCard').length, 1);
});
const failures = [
  ['license write', 'Entitlement', 'create', 'before', () => true],
  ['license acknowledgement', 'Entitlement', 'create', 'after', () => true],
  ['reward receipt', 'RewardGrant', 'upsert', 'after', () => true],
  ['card write', 'UserCard', 'create', 'before', () => true],
  ['card acknowledgement', 'UserCard', 'create', 'after', () => true],
  ['item checkpoint', 'Order', 'updateMany', 'after', data => Boolean(data.$addToSet)],
];
for (const [label, name, operation, phase, check] of failures) test('partial ' + label + ' resumes without duplicate delivery', async () => {
  const id = await checkout();
  db.failOnce(op => op.name === name && op.operation === operation && op.phase === phase && check(op.data));
  const partial = await verify(id, 202);
  assert.equal(partial.order.status, 'pending'); assert.equal(partial.order.payment_status, 'paid');
  const final = await verify(id); await verify(id);
  assert.equal(final.order.status, 'completed'); assert.equal(db.rows('Entitlement').length, 1);
  assert.equal(db.rows('UserCard').length, 1); assert.equal(db.rows('UserCard')[0].quantity, 1); assert.equal(providerCalls.length, 1);
});
test('lost completion acknowledgement is recognized on retry', async () => {
  const id = await checkout();
  db.failOnce(op => op.name === 'Order' && op.operation === 'updateMany' && op.phase === 'after' && op.data.$set?.status === 'completed');
  await verify(id, 503); const result = await verify(id);
  assert.equal(result.alreadyProcessed, true); assert.equal(db.rows('UserCard').length, 1);
});
test('a busy delivery lease is visible and an abandoned lease can recover', async () => {
  const id = await checkout(), order = db.rows('Order')[0];
  order.fulfillment_lock_token = 'other'; order.fulfillment_lock_until = clock + 120000;
  assert.equal((await verify(id, 202)).delivery_in_progress, true); assert.equal(db.rows('UserCard').length, 0);
  clock += 120001; assert.equal((await verify(id)).order.status, 'completed');
});
test('multiple paid items are fully paginated and checkpointed separately', async () => {
  db.rows('Game').push({ ...db.rows('Game')[0], id: 'game-two', title: 'Second', price: 10, starter_card_ids: [] });
  const result = await request('createCheckoutSession', cartBody({ items: [{ id: 'game', type: 'game' }, { id: 'game-two', type: 'game' }] }));
  pay(result.sessionId); await verify(result.sessionId);
  assert.equal(db.rows('Entitlement').length, 2); assert.equal(db.rows('Order')[0].fulfilled_item_keys.length, 2);
});
for (const change of ['owner', 'owner-conflict', 'unpaid', 'mode', 'currency', 'total', 'line-item', 'quantity', 'refund', 'dispute', 'order-owner', 'order-session']) test('rejects invalid payment: ' + change, async () => {
  const id = await checkout(), session = sessions.get(id), order = db.rows('Order')[0]; let status = 409;
  if (change === 'owner') { session.client_reference_id = 'b'; session.metadata.user_id = 'b'; status = 403; }
  if (change === 'owner-conflict') { session.metadata.user_id = 'b'; status = 403; }
  if (change === 'unpaid') session.payment_status = 'unpaid';
  if (change === 'mode') session.mode = 'subscription';
  if (change === 'currency') session.currency = 'eur';
  if (change === 'total') { session.amount_total += 1; session.payment_intent.amount_received += 1; }
  if (change === 'line-item') lines.get(id)[0].price.product.metadata.item_id = 'other';
  if (change === 'quantity') lines.get(id)[0].quantity = 2;
  if (change === 'refund') session.payment_intent.latest_charge.amount_refunded = 1;
  if (change === 'dispute') session.payment_intent.latest_charge.disputed = true;
  if (change === 'order-owner') { order.user_id = 'b'; status = 403; }
  if (change === 'order-session') { order.stripe_session_id = 'cs_other'; status = 403; }
  await verify(id, status);
  assert.equal(db.rows('Entitlement').length, 0); assert.equal(db.rows('UserCard').length, 0);
});
test('refunded orders and revoked licenses are never reactivated by a retry', async () => {
  const id = await checkout(), order = db.rows('Order')[0];
  order.status = 'refunded'; await verify(id, 409); order.status = 'pending';
  db.rows('Entitlement').push({ id: 'revoked', user_id: 'a', item_type: 'game', item_id: 'game', source: 'stripe', order_id: order.id, revoked: true });
  await verify(id, 202);
  assert.equal(db.rows('Entitlement').length, 1); assert.equal(db.rows('UserCard').length, 0);
});
test('legacy paid orders recover missing licenses without minting uncertain historical rewards', async () => {
  const id = await checkout(), session = sessions.get(id), order = db.rows('Order')[0];
  session.metadata = { user_id: 'a', items: JSON.stringify([{ id: 'game', type: 'game', price: 20 }]) };
  delete order.fulfillment_version; order.status = 'completed'; delete order.payment_status;
  const result = await verify(id);
  assert.equal(result.legacy_rewards_unverified, true); assert.equal(db.rows('Entitlement').length, 1); assert.equal(db.rows('UserCard').length, 0);
  await verify(id); assert.equal(db.rows('Entitlement').length, 1);
});
test('legacy sessions without orders use the paid line items and do not use current catalog prices', async () => {
  const id = await checkout(), session = sessions.get(id);
  session.metadata = { user_id: 'a', items: JSON.stringify([{ id: 'game', type: 'game', price: 20 }]) };
  db.rows('Order').length = 0; db.rows('Game')[0].price = 99;
  const result = await verify(id);
  assert.equal(result.order.total_amount, 20); assert.equal(result.order.status, 'completed'); assert.equal(result.legacy_rewards_unverified, true);
});
test('duplicate order identities require reconciliation before grants', async () => {
  const id = await checkout(); db.rows('Order').push({ ...db.rows('Order')[0], id: 'duplicate' });
  await verify(id, 409); assert.equal(db.rows('Entitlement').length, 0);
});
test('untrusted callers cannot create or update payment records', async () => {
  await checkout(); const client = db.entities({ id: 'a', role: 'user' });
  await assert.rejects(client.Order.update(db.rows('Order')[0].id, { status: 'completed' }), /Forbidden/);
  await assert.rejects(client.Order.create({ user_id: 'a', total_amount: 0, items: [], status: 'completed' }), /Forbidden/);
  assert.equal((await db.entities({ id: 'b', role: 'user' }).Order.list()).length, 0);
});
test('authentication and request validation precede payment calls', async () => {
  await request('createCheckoutSession', cartBody(), 401, { actor: 'none' });
  await request('createCheckoutSession', cartBody({ items: [{ id: 'game', type: 'card' }] }), 400);
  await request('createCheckoutSession', cartBody({ checkoutKey: '' }), 400);
  await request('createCheckoutSession', cartBody({ successUrl: 'javascript:alert(1)' }), 400);
  await request('createCheckoutSession', cartBody(), 405, { method: 'GET' });
  await verify('bad', 400); await verify('cs_test_1', 401, { actor: 'none' });
  assert.equal(providerCalls.length, 0);
});
test('paid checkout rejects free games and missing DLC base-game ownership', async () => {
  db.rows('Game')[0].price = 0;
  await request('createCheckoutSession', cartBody(), 400);
  db.rows('DLC').push({ id: 'dlc', game_id: 'game', name: 'Expansion', price: 5, status: 'active' });
  await request('createCheckoutSession', cartBody({ items: [{ id: 'dlc', type: 'dlc' }] }), 409);
  assert.equal(providerCalls.length, 0);
});
test('signed webhook retries partial delivery and acknowledges only completion', async () => {
  const id = await checkout(), event = { id: 'evt_test', type: 'checkout.session.completed', data: { object: sessions.get(id) } };
  await request('stripeCheckoutWebhook', event, 400);
  db.failOnce(op => op.name === 'UserCard' && op.operation === 'create' && op.phase === 'before');
  await request('stripeCheckoutWebhook', event, 503, { actor: 'none', signature: 'valid-test-signature' });
  await request('stripeCheckoutWebhook', event, 200, { actor: 'none', signature: 'valid-test-signature' });
  await verify(id); assert.equal(db.rows('UserCard').length, 1);
});
test('webhook without configuration fails closed', async () => {
  webhookSecret = undefined;
  await request('stripeCheckoutWebhook', {}, 503); assert.equal(db.writes.length, 0);
});
test('free claim status is read-only and survives a reload while rewards are pending', async () => {
  db.rows('Game')[0].price = 0;
  db.failOnce(op => op.name === 'UserCard' && op.operation === 'create' && op.phase === 'before');
  await request('claimFreeGame', { game_id: 'game' }, 202);
  const before = db.writes.length;
  const status = await request('claimFreeGame', { action: 'status', game_id: 'game' });
  assert.equal(status.can_retry, true); assert.equal(status.owned, true); assert.equal(db.writes.length, before);
  db.rows('Game')[0].price = 40; db.rows('Game')[0].status = 'planned';
  await request('claimFreeGame', { game_id: 'game' });
  const done = await request('claimFreeGame', { action: 'status', game_id: 'game' });
  assert.equal(done.can_retry, false); assert.equal(db.rows('UserCard').length, 1);
});
test('free claim endpoint does not grant paid-order rewards', async () => {
  const id = await checkout(); await verify(id);
  const result = await request('claimFreeGame', { action: 'status', game_id: 'game' });
  assert.equal(result.can_retry, false);
  await request('claimFreeGame', { game_id: 'game' }, 409);
});
