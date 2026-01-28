import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { channel_id } = await req.json();
    if (!channel_id) return Response.json({ error: 'channel_id is required' }, { status: 400 });

    const ch = await base44.asServiceRole.entities.ClanFormChannel.get(channel_id);
    if (!ch) return Response.json({ error: 'Channel not found' }, { status: 404 });

    const list = Array.isArray(ch.active_member_ids) ? ch.active_member_ids : [];
    const next = list.filter((id) => id !== user.id);
    const updated = await base44.asServiceRole.entities.ClanFormChannel.update(channel_id, { active_member_ids: next });

    return Response.json({ channel: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});