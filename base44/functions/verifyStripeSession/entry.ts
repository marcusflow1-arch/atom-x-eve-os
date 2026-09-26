import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@16.12.0';
import { grantEntitlement, ownsItem } from '../../shared/entitlements.ts';
import { grantCard } from '../../shared/rewardEngine.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== 'string') return Response.json({ error: 'Missing Stripe session ID' }, { status: 400 });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.client_reference_id !== user.id && session.metadata?.user_id !== user.id) return Response.json({ error: 'Session does not belong to this user' }, { status: 403 });
    if (session.payment_status !== 'paid') return Response.json({ error: 'Payment not completed' }, { status: 400 });
    const items = JSON.parse(session.metadata?.items || '[]');
    if (!Array.isArray(items) || !items.length) return Response.json({ error: 'Checkout contains no valid items' }, { status: 400 });
    const svc = base44.asServiceRole.entities;
    const existingOrders = await svc.Order.filter({ stripe_session_id: sessionId }, '-created_date', 1);
    if (existingOrders[0]) return Response.json({ success: true, order: existingOrders[0], alreadyProcessed: true });

    let catalogTotal = 0;
    const verifiedItems:any[] = [];
    for (const item of items) {
      if (!['game','dlc'].includes(item.type)) return Response.json({ error: 'Unsupported paid item type' }, { status: 400 });
      if (item.type === 'game') {
        const game = await svc.Game.get(item.id).catch(() => null);
        const price = Number(game?.price);
        if (!game || game.status !== 'available' || !Number.isFinite(price) || price <= 0) return Response.json({ error: `Game ${item.id} is unavailable` }, { status: 400 });
        catalogTotal += price;
        verifiedItems.push({ item_id: game.id, game_id: game.id, item_type: 'game', title: game.title, price, quantity: 1, image: game.cover_image || '' });
      } else {
        const dlc = await svc.DLC.get(item.id).catch(() => null);
        const price = Number(dlc?.price);
        if (!dlc || dlc.status !== 'active' || !Number.isFinite(price) || price <= 0) return Response.json({ error: `DLC ${item.id} is unavailable` }, { status: 400 });
        if (!(await ownsItem(svc, user.id, 'game', dlc.game_id))) return Response.json({ error: `Base game ownership required for ${dlc.name}` }, { status: 409 });
        catalogTotal += price;
        verifiedItems.push({ item_id: dlc.id, game_id: dlc.game_id, item_type: 'dlc', title: dlc.name, price, quantity: 1, image: dlc.cover_image || '' });
      }
    }
    const paidTotal = Number(session.amount_total || 0) / 100;
    if (Math.round(catalogTotal * 100) !== Math.round(paidTotal * 100)) return Response.json({ error: 'Payment amount does not match the current catalog' }, { status: 409 });

    const order = await svc.Order.create({ user_id: user.id, total_amount: paidTotal, currency: String(session.currency || 'usd').toUpperCase(), status: 'completed', items: verifiedItems, transaction_id: String(session.payment_intent || ''), stripe_session_id: sessionId });
    const entitlements:any[] = [];
    const starterCards:any[] = [];
    for (const item of verifiedItems) {
      const result = await grantEntitlement(svc, user.id, item.item_type, item.item_id, { source: 'stripe', order_id: order.id, game_id: item.game_id });
      entitlements.push(result.entitlement);
      if (item.item_type === 'game' && result.created) {
        const game = await svc.Game.get(item.item_id).catch(() => null);
        for (const cardId of game?.starter_card_ids || []) {
          try { starterCards.push(await grantCard(svc, user.id, cardId, { source: 'starter' })); } catch (error) { console.warn('Starter card grant failed', cardId, error); }
        }
      }
    }
    return Response.json({ success: true, order, entitlements, starter_cards: starterCards, alreadyProcessed: false });
  } catch (error) {
    console.error('Verify session error:', error);
    return Response.json({ error: error?.message || 'Unable to verify payment' }, { status: 500 });
  }
});
