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

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return Response.json({ 
        error: 'Payment not completed' 
      }, { status: 400 });
    }

    // Parse items from metadata
    const items = JSON.parse(session.metadata.items);

    // Create Order in Database
    const order = await base44.asServiceRole.entities.Order.create({
      user_id: user.id,
      total_amount: session.amount_total / 100, // Convert from cents
      status: 'completed',
      items: items,
      transaction_id: session.payment_intent,
      stripe_session_id: sessionId
    });

    // Add games to user's library
    const gameItems = items.filter(item => item.type === 'game');
    if (gameItems.length > 0) {
      const currentPurchased = user.purchased_items || [];
      const newPurchased = [...new Set([...currentPurchased, ...gameItems.map(g => g.id)])];
      
      await base44.auth.updateMe({
        purchased_items: newPurchased
      });
    }

    // Add marketplace items to user's inventory (if applicable)
    const marketplaceItems = items.filter(item => item.type === 'marketplace_item');
    for (const item of marketplaceItems) {
      // Create inventory entry or update existing
      // This would depend on your Item/Inventory entity structure
    }

    return Response.json({ 
      success: true,
      order: order
    });
  } catch (error) {
    console.error('Verify session error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});