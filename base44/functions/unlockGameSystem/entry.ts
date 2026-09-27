import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// This legacy endpoint recorded purchases without verifying a payment.
// Current storefront clients use claimFreeGame or verified checkout instead.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    return Response.json({
      error: "This unlock flow has been retired. Use the game's purchase or free-claim button.",
      code: 'LEGACY_UNLOCK_RETIRED',
    }, { status: 410 });
  } catch {
    return Response.json({ error: 'Unable to verify your session' }, { status: 500 });
  }
});
