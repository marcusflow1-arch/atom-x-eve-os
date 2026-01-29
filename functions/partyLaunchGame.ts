import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { partyId, gameId } = await req.json().catch(() => ({}));
    if (!partyId || !gameId) return Response.json({ error: 'Missing params' }, { status: 400 });

    const party = await base44.entities.Party.get(partyId);
    if (!party) return Response.json({ error: 'Party not found' }, { status: 404 });
    if (party.leaderId !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const members = party.members || [];
    const events = await Promise.all(members.map(async (uid) => {
      return await base44.entities.PartyEvent.create({
        party_id: partyId,
        game_id: gameId,
        type: 'launch',
        target_user_id: uid,
        status: 'pending'
      });
    }));

    return Response.json({ ok: true, count: events.length });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});