// PayPal Order Capture Function
Deno.serve(async (req) => {
  try {
    const { orderID } = await req.json();

    // Use the provided credentials with fallback to environment variables
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID') || 'ARMojCSyuu5G4I7qt2LPCKWJgThbdEhuYGi7HRWllL4G-VnKceWWdKQgO-vNuDJTNypiI5WUIUT5qIYt';
    const clientSecret = Deno.env.get('PAYPAL_APP_SECRET') || 'ELYubSOWpMLB_tHFUo7OZCO2arKBIJ8JRCE5rQQPl7FD1u-FV0GGVuXA7ZYwNG2j0puExlKk8hn3KOA7';

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
      throw new Error('Failed to get PayPal access token');
    }

    // Capture the PayPal order
    const captureResponse = await fetch(`https://api.paypal.com/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.access_token}`
      }
    });

    const captureData = await captureResponse.json();
    
    if (captureData.status === 'COMPLETED') {
      return new Response(JSON.stringify({ 
        status: 'success',
        transactionID: captureData.id,
        amount: captureData.purchase_units[0].payments.captures[0].amount
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error('Payment capture failed');
    }

  } catch (error) {
    console.error('PayPal Order Capture Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});