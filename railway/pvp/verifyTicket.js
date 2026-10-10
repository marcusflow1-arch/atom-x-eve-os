const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const id = (value) => typeof value === 'string' && value.length > 0 && value.length <= 160;
function decode64url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Malformed ticket');
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}
export async function verifyPvPClaims(ticket, secret, audience, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!secret || secret.length < 32) throw new Error('PvP signing secret not configured');
  if (typeof ticket !== 'string' || ticket.length > (audience === 'atomxe-railway-pvp' ? 4096 : 60000)) throw new Error('Malformed ticket');
  const parts = ticket.split('.');
  if (parts.length !== 2) throw new Error('Malformed ticket');
  const [payload, signature] = parts;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  if (!await crypto.subtle.verify('HMAC', key, decode64url(signature), encoder.encode(payload))) throw new Error('Invalid PvP signature');
  const c = JSON.parse(decoder.decode(decode64url(payload)));
  if (c.aud !== audience || !id(c.sub) || !id(c.nonce) || !id(c.matchId)
    || !Array.isArray(c.playerIds) || c.playerIds.length !== 2 || !c.playerIds.every(id)
    || c.playerIds[0] === c.playerIds[1] || !c.playerIds.includes(c.sub)
    || !Number.isSafeInteger(c.iat) || !Number.isSafeInteger(c.exp)
    || c.iat > nowSeconds + 10 || c.exp <= nowSeconds || c.exp <= c.iat || c.exp - c.iat > 90)
    throw new Error('Expired or invalid PvP ticket');
  return c;
}
export async function verifyPvPTicket(ticket, secret, nowSeconds) {
  const c = await verifyPvPClaims(ticket, secret, 'atomxe-railway-pvp', nowSeconds);
  return { userId: c.sub, matchId: c.matchId, playerIds: c.playerIds, nonce: c.nonce, expiresAt: c.exp };
}
