import { createClient } from 'npm:@base44/sdk@0.1.0';
import Stripe from 'npm:stripe@^14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
    const { gameId, gameName, amount } = await req.json();

    try {
        const base44 = createClient({
            appId: Deno.env.get('BASE44_APP_ID'),
        });
        
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                user_id: user.id,
                user_email: user.email,
                game_id: gameId,
                game_name: gameName,
            }
        });

        return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Stripe Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});