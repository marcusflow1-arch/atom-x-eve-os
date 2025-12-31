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

    const { items, successUrl, cancelUrl } = await req.json();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.title,
            description: `${item.type === 'game' ? 'Game' : 'Marketplace Item'}${item.rarity ? ` - ${item.rarity}` : ''}`,
            images: item.image ? [item.image] : [],
            metadata: {
              item_id: item.id,
              item_type: item.type,
              game: item.game || '',
              rarity: item.rarity || ''
            }
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: 1,
      })),
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        items: JSON.stringify(items.map(i => ({ id: i.id, type: i.type, title: i.title })))
      }
    });

    return Response.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});