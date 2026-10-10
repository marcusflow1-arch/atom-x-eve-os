import { createClientFromRequest } from 'npm:@base44/sdk@0.8.51';

// Backend-only: authenticated, short-lived identity ticket for Railway PvP.
const encoder = new TextEncoder();
const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 });
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.id) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    const secret = Deno.env.get('RAILWAY_PVP_TICKET_SECRET');
    if (!secret || secret.length < 32) return Response.json({ error: 'RAILWAY_PVP_NOT_CONFIGURED' }, { status: 503 });
    const now = Math.floor(Date.now() / 1000);
    const claims = { sub: String(user.id), aud: 'atomxe-railway-pvp', iat: now, exp: now + 90, nonce: crypto.randomUUID() };
    const payload = base64url(encoder.encode(JSON.stringify(claims)));
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload))));
    return Response.json({ ticket: payload + '.' + signature, expiresAt: (now + 90) * 1000 });
  } catch {
    return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
});
