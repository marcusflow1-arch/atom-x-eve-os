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

    const body = await req.json();
    const { items, successUrl, cancelUrl } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Never trust client-supplied prices, titles, or payment amounts.
    // The client may only submit catalog item IDs and supported types.
    const requestedItems = items.map((item) => ({
      id: String(item?.id || ''),
      type: String(item?.type || 'game')
    })).filter((item) => item.id);

    if (requestedItems.length === 0 || requestedItems.some((item) => item.type !== 'game')) {
      return Response.json({ error: 'Only catalog games are currently supported by secure checkout' }, { status: 400 });
    }

    const uniqueIds = [...new Set(requestedItems.map((item) => item.id))];
    const games = [];

    for (const id of uniqueIds) {
      const game = await base44.entities.Game.get(id);
      if (!game) {
        return Response.json({ error: `Game ${id} not found` }, { status: 404 });
      }
      if (game.price == null || Number(game.price) < 0) {
        return Response.json({ error: `Game ${id} has an invalid catalog price` }, { status: 400 });
      }
      if (user.purchased_items?.includes(game.id)) {
        return Response.json({ error: `You already own ${game.title}` }, { status: 409 });
      }
      games.push(game);
    }

    const lineItems = games.map((game) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: game.title,
          description: `Game${game.genre ? ` - ${game.genre}` : ''}`,
          images: game.image ? [game.image] : [],
          metadata: {
            item_id: game.id,
            item_type: 'game'
          }
        },
        // Authoritative amount comes from the Base44 Game entity.
        unit_amount: Math.round(Number(game.price) * 100)
      },
      quantity: 1
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        user_email: user.email || '',
        items: JSON.stringify(games.map((game) => ({
          id: game.id,
          type: 'game',
          title: game.title,
          price: Number(game.price)
        })))
      }
    });

    return Response.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return Response.json({ error: error?.message || 'Unable to create checkout session' }, { status: 500 });
  }
});
