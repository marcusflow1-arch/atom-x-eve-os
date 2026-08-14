import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// PayPal capture is intentionally disabled until the merchant integration is
// rebuilt around authenticated, catalog-backed orders and server-side secrets.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const clientSecret = Deno.env.get('PAYPAL_APP_SECRET');
    if (!clientId || !clientSecret) {
      return Response.json({ error: 'PayPal is not configured. Add merchant credentials as server secrets before enabling capture.' }, { status: 503 });
    }

    return Response.json({ error: 'PayPal capture is temporarily disabled while payment security is being upgraded.' }, { status: 503 });
  } catch (error) {
    console.error('PayPal Order Capture Error:', error);
    return Response.json({ error: error?.message || 'PayPal capture unavailable' }, { status: 500 });
  }
});
