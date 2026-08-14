import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@16.12.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== 'string') {
      return Response.json({ error: 'Missing Stripe session ID' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Prevent a user from verifying another user's checkout session.
    if (session.client_reference_id !== user.id && session.metadata?.user_id !== user.id) {
      return Response.json({ error: 'Session does not belong to this user' }, { status: 403 });
    }

    if (session.payment_status !== 'paid') {
      return Response.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const items = JSON.parse(session.metadata?.items || '[]');
    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Checkout contains no valid items' }, { status: 400 });
    }

    // Idempotency: refreshing the confirmation page must never create another order.
    const existingOrders = await base44.asServiceRole.entities.Order.filter({
      stripe_session_id: sessionId
    });

    if (existingOrders?.length) {
      return Response.json({ success: true, order: existingOrders[0], alreadyProcessed: true });
    }

    // Reconcile the paid amount against the server catalog before granting ownership.
    let catalogTotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      if (item.type !== 'game') {
        return Response.json({ error: 'Unsupported paid item type' }, { status: 400 });
      }

      const game = await base44.asServiceRole.entities.Game.get(item.id);
      if (!game || game.price == null) {
        return Response.json({ error: `Catalog item ${item.id} is unavailable` }, { status: 400 });
      }

      const price = Number(game.price);
      catalogTotal += price;
      verifiedItems.push({
        id: game.id,
        type: 'game',
        title: game.title,
        price
      });
    }

    const paidTotal = Number(session.amount_total || 0) / 100;
    if (Math.round(catalogTotal * 100) !== Math.round(paidTotal * 100)) {
      console.error('Stripe/catalog amount mismatch', { sessionId, catalogTotal, paidTotal });
      return Response.json({ error: 'Payment amount does not match the current catalog' }, { status: 409 });
    }

    const order = await base44.asServiceRole.entities.Order.create({
      user_id: user.id,
      total_amount: paidTotal,
      status: 'completed',
      items: verifiedItems,
      transaction_id: session.payment_intent,
      stripe_session_id: sessionId
    });

    const gameIds = verifiedItems.map((item) => item.id);
    const currentPurchased = user.purchased_items || [];
    const newPurchased = [...new Set([...currentPurchased, ...gameIds])];

    if (newPurchased.length !== currentPurchased.length) {
      await base44.asServiceRole.entities.User.update(user.id, {
        purchased_items: newPurchased
      });
    }

    return Response.json({ success: true, order, alreadyProcessed: false });
  } catch (error) {
    console.error('Verify session error:', error);
    return Response.json({ error: error?.message || 'Unable to verify payment' }, { status: 500 });
  }
});
