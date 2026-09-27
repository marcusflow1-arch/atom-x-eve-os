import { createClientFromRequest } from 'npm:@base44/sdk@0.8.51';
import Stripe from 'npm:stripe@16.12.0';
import { fulfillCheckout } from '../../shared/checkoutFulfillment.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
Deno.serve(async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const secret = Deno.env.get('STRIPE_CHECKOUT_WEBHOOK_SECRET');
  if (!secret) return Response.json({ error: 'Checkout webhook is not configured' }, { status: 503 });
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), req.headers.get('stripe-signature') || '', secret);
  } catch {
    return Response.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }
  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) return Response.json({ received: true });
  if (event.data.object.payment_status !== 'paid') return Response.json({ received: true });
  try {
    const base44 = createClientFromRequest(req);
    const result = await fulfillCheckout(base44.asServiceRole.entities, stripe, event.data.object.id);
    // Non-2xx asks Stripe to retry delivery; partial fulfillment is not acknowledged.
    return Response.json({ received: !result.rewards_pending }, { status: result.rewards_pending ? 503 : 200 });
  } catch (error) {
    console.error('Checkout webhook delivery pending', event.id, error);
    return Response.json({ error: 'Payment delivery is pending' }, { status: 503 });
  }
});
