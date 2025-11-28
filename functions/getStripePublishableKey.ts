Deno.serve(async (_req) => {
  try {
    const key = Deno.env.get('STRIPE_PUBLISHABLE_KEY');
    if (!key) {
      throw new Error("Stripe publishable key is not set in environment variables.");
    }
    return new Response(JSON.stringify({ publishableKey: key }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error fetching Stripe publishable key:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});