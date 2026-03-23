
// PayPal Order Creation Function
Deno.serve(async (req) => {
  try {
    const { amount, currency = 'USD', description = 'Donation to Atom x Eve Project' } = await req.json();

    // Use the provided credentials with fallback to environment variables
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID') || 'ARMojCSyuu5G4I7qt2LPCKWJgThbdEhuYGi7HRWllL4G-VnKceWWdKQgO-vNuDJTNypiI5WUIUT5qIYt';
    const clientSecret = Deno.env.get('PAYPAL_APP_SECRET') || 'ELYubSOWpMLB_tHFUo7OZCO2arKBIJ8JRCE5rQQPl7FD1u-FV0GGVuXA7ZYgNG2j0puExlKk8hn3KOA7';

    // Get PayPal access token
    const authResponse = await fetch('https://api.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    const authData = await authResponse.json();
    
    if (!authData.access_token) {
      console.error('PayPal auth failed:', authData);
      throw new Error('Failed to get PayPal access token');
    }

    // Create PayPal order
    const orderResponse = await fetch('https://api.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.access_token}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toString()
          },
          description: description,
          payee: {
            email_address: 'lordemblemblue@gmail.com'
          }
        }],
        application_context: {
          return_url: `${Deno.env.get('BASE44_APP_URL')}/AdamXEve?payment=success`,
          cancel_url: `${Deno.env.get('BASE44_APP_URL')}/AdamXEve?payment=cancelled`,
          brand_name: 'Atom x Eve Project',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW'
        }
      })
    });

    const orderData = await orderResponse.json();
    
    if (orderData.id) {
      return new Response(JSON.stringify({ 
        orderID: orderData.id,
        status: 'success',
        approveUrl: orderData.links.find(link => link.rel === 'approve')?.href
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.error('PayPal order creation failed:', orderData);
      throw new Error('Failed to create PayPal order');
    }

  } catch (error) {
    console.error('PayPal Order Creation Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
