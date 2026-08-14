import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// PayPal checkout is intentionally disabled until merchant credentials are
// configured exclusively as Base44 secrets and catalog-backed pricing is used.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const clientSecret = Deno.env.get('PAYPAL_APP_SECRET');
    if (!clientId || !clientSecret) {
      return Response.json({ error: 'PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_APP_SECRET as server secrets before enabling PayPal checkout.' }, { status: 503 });
    }

    return Response.json({ error: 'PayPal catalog checkout is temporarily disabled while payment security is being upgraded.' }, { status: 503 });
  } catch (error) {
    console.error('PayPal Order Creation Error:', error);
    return Response.json({ error: error?.message || 'PayPal checkout unavailable' }, { status: 500 });
  }
});
