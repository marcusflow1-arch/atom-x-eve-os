import { createClientFromRequest } from 'npm:@base44/sdk@0.8.51';
import Stripe from 'npm:stripe@16.12.0';
import { fulfillCheckout } from '../../shared/checkoutFulfillment.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
    const base44 = createClientFromRequest(req), user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { sessionId } = await req.json();
    if (typeof sessionId !== 'string' || !/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) return Response.json({ error: 'A valid sessionId is required' }, { status: 400 });
    const result = await fulfillCheckout(base44.asServiceRole.entities, stripe, sessionId, user.id);
    return Response.json(result, { status: result.rewards_pending ? 202 : 200 });
  } catch (error) {
    console.error('Verify session error', error);
    return Response.json({ error: error.message || 'Unable to verify payment', code: error.code }, { status: error.status || 500 });
  }
});
