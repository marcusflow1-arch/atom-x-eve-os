import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Legacy direct checkout endpoint disabled.
// All paid checkout must go through the verified Stripe flow.
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json({
    error: 'Legacy checkout is disabled. Use createCheckoutSession and verifyStripeSession.'
  }, { status: 410 });
});
