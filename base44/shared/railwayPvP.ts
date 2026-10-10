// Server-only attestations. Never expose the signing secret to a browser.
const encode = (value: string) => new TextEncoder().encode(value);
const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

export function pvpMembers(match: any): string[] {
  const ids = match?.player_ids;
  if (match?.mode !== 'pvp' || !Array.isArray(ids) || ids.length !== 2
    || ids.some((id: any) => typeof id !== 'string' || !id) || ids[0] === ids[1]) return [];
  return [...ids].sort();
}

export async function signPvPClaims(claims: any, secret: string) {
  if (!secret || secret.length < 32) throw new Error('PvP signing secret not configured');
  const payload = base64url(encode(JSON.stringify(claims)));
  const key = await crypto.subtle.importKey('raw', encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encode(payload))));
  return payload + '.' + signature;
}

export async function combatReceipt(match: any, userId: string, secret: string) {
  const playerIds = pvpMembers(match);
  if (!playerIds.includes(userId)) return null;
  const state = {
    status: match.status, attack_revision: Number(match.attack_revision || 0),
    last_cast: match.last_cast || null, hit_log: (match.hit_log || []).slice(-20),
    dodges: match.dodges || {}, turn_player_id: match.turn_player_id || '',
    hp: (match.players || []).map((p: any) => ({ id: p.id, hp: p.hp })),
    fight_starts_at: match.fight_starts_at || '', winner_id: match.winner_id || '',
  };
  const stateKey = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', encode(JSON.stringify(state)))));
  const now = Date.now(), iat = Math.floor(now / 1000);
  return signPvPClaims({ aud: 'atomxe-railway-combat', sub: userId, matchId: match.id,
    playerIds, iat, exp: iat + 90, nonce: crypto.randomUUID(), observedAt: now, stateKey, state }, secret);
}
