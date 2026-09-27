import { createClientFromRequest } from 'npm:@base44/sdk@0.8.51';
import Stripe from 'npm:stripe@16.12.0';
import { CHECKOUT_VERSION, checkoutParams, requestedItems, sameCart, snapshotCart } from '../../shared/checkoutFulfillment.ts';
import { conditionalUpdate, findKeyedRecord, rewardError } from '../../shared/rewardJournal.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const base44 = createClientFromRequest(req), user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { items, successUrl, cancelUrl, checkoutKey } = await req.json();
    if (typeof checkoutKey !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(checkoutKey)) throw rewardError('A checkout request key is required', 400);
    const requested = requestedItems(items);
    let success: URL, cancel: URL;
    try { success = new URL(successUrl); cancel = new URL(cancelUrl); } catch { throw rewardError('Checkout return URLs are invalid', 400); }
    if (success.protocol !== 'https:' || cancel.protocol !== 'https:' || success.origin !== cancel.origin ||
        success.username || success.password || cancel.username || cancel.password ||
        success.pathname !== '/OrderConfirmation' || cancel.pathname !== '/Checkout' ||
        success.searchParams.get('session_id') !== '{CHECKOUT_SESSION_ID}') throw rewardError('Checkout return URLs are invalid', 400);
    const svc = base44.asServiceRole.entities;
    let order = await findKeyedRecord(svc.Order, { user_id: user.id, checkout_key: checkoutKey });
    if (!order) {
      let earlier = null, earlierSession = null;
      for (let skip = 0; ; skip += 100) {
        const page = await svc.Order.filter({ user_id: user.id, status: 'pending' }, '-created_date', 100, skip);
        for (const candidate of page) {
          if (!(candidate.items || []).some((item: any) => requested.some(request => request.id === item.item_id && request.type === item.item_type))) continue;
          const savedSession = candidate.stripe_session_id ? await stripe.checkout.sessions.retrieve(candidate.stripe_session_id) : null;
          if (savedSession?.status === 'complete') return Response.json({ sessionId: savedSession.id, orderId: candidate.id, verify: true });
          if (savedSession?.status === 'expired') continue;
          if (!earlier) { earlier = candidate; earlierSession = savedSession; }
        }
        if (page.length < 100) break;
      }
      if (earlier) {
        if (!sameCart(earlier, requested) || (!earlierSession && earlier.fulfillment_version !== CHECKOUT_VERSION)) {
          return Response.json({ error: 'An earlier checkout contains an item in this cart. Resume that checkout or return to its original cart before starting another.',
            code: 'CHECKOUT_IN_PROGRESS', orderId: earlier.id, resume_url: earlierSession?.url }, { status: 409 });
        }
        order = earlier;
      }
    }
    if (order) {
      if (!sameCart(order, requested)) throw rewardError('This checkout belongs to a different cart', 409);
      if (order.status === 'refunded' || order.status === 'failed') throw rewardError('This checkout requires support review');
    } else {
      const snapshot = await snapshotCart(svc, user.id, requested);
      order = await svc.Order.create({
        user_id: user.id, checkout_key: checkoutKey, items: snapshot,
        total_amount: snapshot.reduce((sum, item) => sum + Math.round(item.price * 100), 0) / 100,
        currency: 'USD', status: 'pending', payment_status: 'unpaid',
        fulfillment_version: CHECKOUT_VERSION, checkout_success_url: successUrl, checkout_cancel_url: cancelUrl,
      });
    }
    let session;
    if (order.stripe_session_id) session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
    else {
      // Never reuse a Stripe key beyond its documented retention window.
      if (!Number.isFinite(Date.parse(order.created_date)) || Date.now() - Date.parse(order.created_date) > 23 * 60 * 60 * 1000) throw Object.assign(rewardError('This older checkout needs a payment status review before retrying'), { code: 'CHECKOUT_REVIEW_REQUIRED' });
      session = await stripe.checkout.sessions.create(checkoutParams(order), { idempotencyKey: 'atom-checkout:' + user.id + ':' + order.checkout_key });
      await conditionalUpdate(svc.Order, { id: order.id, stripe_session_id: { $exists: false } }, { $set: { stripe_session_id: session.id } });
      const saved = await svc.Order.get(order.id);
      if (saved.stripe_session_id !== session.id) throw rewardError('Checkout session could not be saved', 503);
    }
    if (session.status === 'expired') return Response.json({ error: 'This checkout expired. Start a new checkout.', code: 'CHECKOUT_EXPIRED', orderId: order.id }, { status: 409 });
    if (session.status === 'complete') return Response.json({ sessionId: session.id, orderId: order.id, verify: true });
    return Response.json({ sessionId: session.id, orderId: order.id, url: session.url });
  } catch (error) {
    console.error('Create checkout session error', error);
    return Response.json({ error: error.message || 'Unable to create checkout session', code: error.code }, { status: error.status || 500 });
  }
});
