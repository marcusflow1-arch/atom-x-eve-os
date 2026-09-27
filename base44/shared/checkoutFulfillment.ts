import { grantEntitlement, ownsItem } from './entitlements.ts';
import { grantCard } from './rewardEngine.ts';
import { conditionalUpdate, findKeyedRecord, rewardError, rewardKey } from './rewardJournal.ts';

export const CHECKOUT_VERSION = 1;
const itemKey = (item: any) => JSON.stringify([item.item_type, item.item_id]);
const fail = (message: string, status = 409, code?: string) => Object.assign(rewardError(message, status), { code });
export function catalogCents(row: any) {
  if (typeof row?.price !== 'number' || !Number.isFinite(row.price) || row.price < 0) throw fail('Catalog price is unavailable');
  const sale = row.sale_price;
  const price = typeof sale === 'number' && Number.isFinite(sale) && sale >= 0 && sale < row.price ? sale : row.price;
  const cents = Math.round(price * 100);
  if (!Number.isSafeInteger(cents) || (price > 0 && cents === 0)) throw fail('Catalog price is invalid');
  return cents;
}
export function starterIds(game: any): string[] {
  const ids = game?.starter_card_ids ?? [];
  if (!Array.isArray(ids) || ids.some((id: any) => typeof id !== 'string' || !id.trim())) throw fail('Game starter rewards are unavailable');
  return [...new Set<string>(ids)];
}
export function requestedItems(items: any) {
  if (!Array.isArray(items) || !items.length || items.length > 50) throw fail('Choose between 1 and 50 catalog items', 400);
  if (items.some((item: any) => typeof item?.id !== 'string' || !item.id.trim() || !['game', 'dlc'].includes(item.type))) throw fail('Unsupported catalog item', 400);
  return [...new Map(items.map((item: any) => [JSON.stringify([item.type, item.id]), { id: item.id, type: item.type }])).values()] as any[];
}
export async function snapshotCart(svc: any, userId: string, requested: any[]) {
  const items = [];
  for (const item of requested) {
    const row = await svc[item.type === 'game' ? 'Game' : 'DLC'].get(item.id);
    if (!row || row.status !== (item.type === 'game' ? 'available' : 'active')) throw fail('A cart item is unavailable', 404);
    if (item.type === 'game' && row.release_date && Date.parse(row.release_date) > Date.now()) throw fail('This game is not released yet');
    const cents = catalogCents(row);
    if (cents <= 0) throw fail('Claim free games from the cart before checkout', 400, 'FREE_CLAIM_REQUIRED');
    if (await ownsItem(svc, userId, item.type, row.id)) throw fail('You already own ' + (row.title || row.name));
    if (item.type === 'dlc' && !await ownsItem(svc, userId, 'game', row.game_id)) throw fail('Add the base game to your library before purchasing this DLC');
    items.push({
      item_id: row.id, item_type: item.type, game_id: item.type === 'game' ? row.id : row.game_id,
      title: String(row.title || row.name), price: cents / 100, quantity: 1, image: row.cover_image || '',
      starter_card_ids: item.type === 'game' ? starterIds(row) : [],
    });
  }
  return items;
}
export function sameCart(order: any, requested: any[]) {
  const expected = order.items.map(itemKey).sort();
  const actual = requested.map((item: any) => JSON.stringify([item.type, item.id])).sort();
  return JSON.stringify(expected) === JSON.stringify(actual);
}
export function checkoutParams(order: any) {
  return {
    payment_method_types: ['card'], mode: 'payment',
    client_reference_id: order.user_id,
    success_url: order.checkout_success_url, cancel_url: order.checkout_cancel_url,
    metadata: { user_id: order.user_id, order_id: order.id, fulfillment_version: String(CHECKOUT_VERSION) },
    line_items: order.items.map((item: any) => ({
      price_data: { currency: 'usd', unit_amount: Math.round(item.price * 100),
        product_data: { name: item.title, ...(item.image ? { images: [item.image] } : {}),
          metadata: { item_id: item.item_id, item_type: item.item_type, game_id: item.game_id } } },
      quantity: 1,
    })),
  };
}
function assertOwner(session: any, userId: string) {
  const ids = [session.client_reference_id, session.metadata?.user_id].filter(Boolean);
  if (!ids.length || ids.some(id => id !== userId)) throw fail('Session does not belong to this user', 403);
}
async function paidItems(stripe: any, session: any) {
  const result = [], seen = new Set<string>();
  let after: string | undefined;
  do {
    const page = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100, expand: ['data.price.product'], ...(after ? { starting_after: after } : {}) });
    if (!Array.isArray(page.data) || !page.data.length) throw fail('Payment items are unavailable');
    for (const line of page.data) {
      const product = line.price?.product, meta = product?.metadata;
      const key = JSON.stringify([meta?.item_type, meta?.item_id]);
      if (!meta?.item_id || !['game','dlc'].includes(meta.item_type) || seen.has(key) ||
          line.quantity !== 1 || line.currency !== 'usd' || line.price?.currency !== 'usd' ||
          !Number.isSafeInteger(line.amount_total) || line.amount_total <= 0 ||
          line.amount_total !== line.price.unit_amount || line.amount_subtotal !== line.amount_total) throw fail('Payment item details do not match this store');
      seen.add(key);
      result.push({ item_id: meta.item_id, item_type: meta.item_type,
        game_id: meta.item_type === 'game' ? meta.item_id : meta.game_id,
        title: line.description || product.name || meta.item_id, image: product.images?.[0] || '',
        price: line.amount_total / 100, quantity: 1, starter_card_ids: [] });
    }
    if (result.length > 100) throw fail('Payment contains too many items');
    const next = page.data.at(-1)?.id;
    if (page.has_more && (!next || next === after)) throw fail('Payment items could not be paginated');
    after = page.has_more ? next : undefined;
  } while (after);
  const total = result.reduce((sum, item) => sum + Math.round(item.price * 100), 0);
  if (total !== session.amount_total || session.amount_subtotal !== total) throw fail('Paid amount does not match the purchased items');
  return result;
}
function validateSnapshot(order: any, lines: any[], session: any) {
  if (!Array.isArray(order.items) || order.items.length !== lines.length ||
      order.currency !== 'USD' || Math.round(order.total_amount * 100) !== session.amount_total) throw fail('Order does not match the payment');
  const expected = new Map(order.items.map((item: any) => [itemKey(item), item]));
  if (expected.size !== lines.length) throw fail('Order contains duplicate items');
  for (const line of lines) {
    const item: any = expected.get(itemKey(line));
    if (!item || item.quantity !== 1 || item.game_id !== line.game_id ||
        Math.round(item.price * 100) !== Math.round(line.price * 100)) throw fail('Purchased items do not match the saved order');
    starterIds(item);
  }
}

// Shared by the signed webhook and the authenticated confirmation/retry action.
// Per-order leases reduce overlapping work; this is not a cross-entity transaction.
export async function fulfillCheckout(svc: any, stripe: any, sessionId: string, userId?: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent.latest_charge'] });
  const owner = userId || session.metadata?.user_id || session.client_reference_id;
  if (!owner) throw fail('Payment owner is unavailable', 403);
  assertOwner(session, owner);
  if (session.id !== sessionId || session.mode !== 'payment' || session.currency !== 'usd') throw fail('Unsupported payment session');
  if (session.payment_status !== 'paid' || session.status !== 'complete') throw fail('Payment is not complete yet. Check its status again shortly.', 409, 'PAYMENT_PENDING');
  const intent = session.payment_intent, charge = intent?.latest_charge;
  if (!intent || typeof intent !== 'object' || intent.status !== 'succeeded' || intent.currency !== 'usd' ||
      intent.amount_received !== session.amount_total || !charge || typeof charge !== 'object') throw fail('Payment confirmation is unavailable', 503);
  if (charge.refunded || charge.amount_refunded > 0 || charge.disputed) throw fail('This payment requires support review', 409, 'PAYMENT_REVIEW_REQUIRED');

  let order;
  const linked = await findKeyedRecord(svc.Order, { stripe_session_id: sessionId });
  if (session.metadata?.fulfillment_version === String(CHECKOUT_VERSION)) {
    if (!session.metadata.order_id) throw fail('Payment is missing its saved order');
    order = await svc.Order.get(session.metadata.order_id);
    if (linked && linked.id !== order.id) throw fail('Payment is linked to conflicting orders');
  } else {
    order = linked;
  }
  if (order && (order.user_id !== owner || (order.stripe_session_id && order.stripe_session_id !== sessionId))) throw fail('Order does not belong to this payment', 403);
  if (order?.status === 'refunded' || order?.status === 'failed') throw fail('This order requires support review', 409, 'ORDER_REVIEW_REQUIRED');
  if (order?.fulfillment_version === CHECKOUT_VERSION && order.status === 'completed') {
    return { success: true, order, alreadyProcessed: true, rewards_pending: false, legacy_rewards_unverified: Boolean(order.legacy_rewards_unverified) };
  }
  const lines = await paidItems(stripe, session);
  if (session.metadata?.fulfillment_version === String(CHECKOUT_VERSION)) {
    if (order?.fulfillment_version !== CHECKOUT_VERSION) throw fail('Saved checkout version is unavailable');
    validateSnapshot(order, lines, session);
  } else if (!order || order.fulfillment_version !== CHECKOUT_VERSION) {
    // Old sessions have no trustworthy starter-reward snapshot. Recover licenses,
    // but do not mint historical rewards again or infer them from today's catalog.
    const legacyItems = JSON.parse(session.metadata?.items || '[]');
    if (!Array.isArray(legacyItems) || legacyItems.length !== lines.length ||
      lines.some(line => !legacyItems.some((item: any) => item.id === line.item_id && item.type === line.item_type && Math.round(Number(item.price) * 100) === Math.round(line.price * 100)))) throw fail('Historical payment needs reconciliation');
    const fields = {
      user_id: owner, total_amount: session.amount_total / 100, currency: 'USD', items: lines,
      status: 'pending', payment_status: 'paid', fulfillment_version: CHECKOUT_VERSION,
      legacy_rewards_unverified: true, stripe_session_id: sessionId, transaction_id: intent.id,
    };
    if (!order) order = await svc.Order.create(fields);
    else {
      await conditionalUpdate(svc.Order, { id: order.id, fulfillment_version: { $exists: false }, status: order.status }, { $set: fields });
      order = await svc.Order.get(order.id);
    }
  } else validateSnapshot(order, lines, session);

  const token = crypto.randomUUID(), leaseMs = 120000;
  const acquired = await conditionalUpdate(svc.Order, {
    id: order.id, status: 'pending',
    $or: [{ fulfillment_lock_until: { $exists: false } }, { fulfillment_lock_until: { $lt: Date.now() } }],
  }, { $set: { fulfillment_lock_token: token, fulfillment_lock_until: Date.now() + leaseMs,
    payment_status: 'paid', stripe_session_id: sessionId, transaction_id: intent.id } });
  if (!acquired) {
    order = await svc.Order.get(order.id);
    if (order.status === 'completed') return { success: true, order, alreadyProcessed: true, rewards_pending: false, legacy_rewards_unverified: Boolean(order.legacy_rewards_unverified) };
    return { success: true, order, rewards_pending: true, delivery_in_progress: true };
  }
  const pendingItems: string[] = [], entitlements = [], cards = [];
  async function renew() {
    const renewed = await conditionalUpdate(svc.Order, { id: order.id, status: 'pending', fulfillment_lock_token: token, fulfillment_lock_until: { $gte: Date.now() } },
      { $set: { fulfillment_lock_until: Date.now() + leaseMs } });
    if (!renewed) throw fail('Delivery is being resumed by another request', 503);
  }
  try {
    order = await svc.Order.get(order.id);
    for (const item of order.items) {
      const key = itemKey(item);
      if ((order.fulfilled_item_keys || []).includes(key)) continue;
      try {
        await renew();
        const revoked = await svc.Entitlement.filter({ user_id: owner, item_type: item.item_type, item_id: item.item_id, order_id: order.id, revoked: true }, '-granted_at', 1);
        if (revoked.length) throw fail('Revoked access needs support review');
        const { entitlement } = await grantEntitlement(svc, owner, item.item_type, item.item_id, {
          source: 'stripe', order_id: order.id, game_id: item.game_id,
          ...(!order.legacy_rewards_unverified && item.item_type === 'game' ? { starter_card_ids: item.starter_card_ids } : {}),
        });
        entitlements.push(entitlement);
        for (const cardId of item.starter_card_ids || []) {
          await renew();
          const card = await grantCard(svc, owner, cardId, { source: 'starter', grant_key: rewardKey('game-starter', owner, item.item_id, cardId) });
          if (card) cards.push(card);
        }
        await renew();
        if (!await conditionalUpdate(svc.Order, { id: order.id, status: 'pending', fulfillment_lock_token: token }, { $addToSet: { fulfilled_item_keys: key } })) throw fail('Delivery checkpoint could not be saved', 503);
      } catch (error) {
        console.warn('Order item delivery pending', order.id, item.item_id, error);
        pendingItems.push(item.item_id);
      }
    }
    if (!pendingItems.length) {
      await renew();
      if (!await conditionalUpdate(svc.Order, { id: order.id, status: 'pending', fulfillment_lock_token: token }, { $set: { status: 'completed', fulfilled_at: new Date().toISOString() } })) throw fail('Order completion could not be saved', 503);
    }
    order = await svc.Order.get(order.id);
    return { success: true, order, entitlements, starter_cards: cards, alreadyProcessed: false,
      rewards_pending: order.status !== 'completed', pending_item_ids: pendingItems,
      legacy_rewards_unverified: Boolean(order.legacy_rewards_unverified) };
  } finally {
    await conditionalUpdate(svc.Order, { id: order.id, fulfillment_lock_token: token }, { $set: { fulfillment_lock_until: 0 } }).catch(() => {});
  }
}
