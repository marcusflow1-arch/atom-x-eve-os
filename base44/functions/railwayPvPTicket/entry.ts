import { createClientFromRequest } from 'npm:@base44/sdk@0.8.51';

import { pvpMembers, signPvPClaims } from '../../shared/railwayPvP.ts';
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 });
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.id) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    const body = await req.json().catch(() => null);
    if (typeof body?.matchId !== 'string' || !body.matchId || body.matchId.length > 160)
      return Response.json({ error: 'MATCH_REQUIRED' }, { status: 400 });
    const match = await base44.asServiceRole.entities.AIBattleMatch.get(body.matchId);
    const playerIds = pvpMembers(match);
    if (!playerIds.includes(String(user.id))) return Response.json({ error: 'MATCH_FORBIDDEN' }, { status: 403 });
    if (!['matched', 'connecting', 'countdown', 'fighting'].includes(match.status))
      return Response.json({ error: 'MATCH_INACTIVE' }, { status: 409 });
    const secret = Deno.env.get('RAILWAY_PVP_TICKET_SECRET');
    if (!secret || secret.length < 32) return Response.json({ error: 'RAILWAY_PVP_NOT_CONFIGURED' }, { status: 503 });
    const now = Math.floor(Date.now() / 1000);
    const claims = { sub: String(user.id), aud: 'atomxe-railway-pvp', matchId: match.id, playerIds,
      iat: now, exp: now + 90, nonce: crypto.randomUUID() };
    return Response.json({ ticket: await signPvPClaims(claims, secret), expiresAt: (now + 90) * 1000 },
      { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = Number(error?.status || 500);
    return Response.json({ error: status === 404 ? 'MATCH_FORBIDDEN' : 'TICKET_UNAVAILABLE' },
      { status: status === 404 ? 403 : status === 401 ? 401 : 503 });
  }
});
