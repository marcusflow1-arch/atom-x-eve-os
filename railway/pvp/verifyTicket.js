// Railway-side verification of Base44-issued HMAC session tickets.
// The Base44 server must mint these tickets after authenticating auth.me().
// Never expose RAILWAY_PVP_TICKET_SECRET to browser JavaScript.
const encoder = new TextEncoder();
const decoder = new TextDecoder();
function decode64url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Malformed ticket');
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}
export async function verifyPvPTicket(ticket, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!secret || secret.length < 32) throw new Error('PvP signing secret not configured');
  if (typeof ticket !== 'string' || ticket.length > 4096) throw new Error('Malformed ticket');
  const parts = ticket.split('.');
  if (parts.length !== 2) throw new Error('Malformed ticket');
  const [payload, signature] = parts;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('HMAC', key, decode64url(signature), encoder.encode(payload));
  if (!valid) throw new Error('Invalid PvP signature');
  const claims = JSON.parse(decoder.decode(decode64url(payload)));
  if (claims.aud !== 'atomxe-railway-pvp' || typeof claims.sub !== 'string' || !claims.sub
    || typeof claims.nonce !== 'string' || !claims.nonce
    || !Number.isSafeInteger(claims.iat) || !Number.isSafeInteger(claims.exp)
    || claims.iat > nowSeconds + 10 || claims.exp <= nowSeconds || claims.exp - claims.iat > 90)
    throw new Error('Expired or invalid PvP ticket');
  return { userId: claims.sub, nonce: claims.nonce, expiresAt: claims.exp };
}
