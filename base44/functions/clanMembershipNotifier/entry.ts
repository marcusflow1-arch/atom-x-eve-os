// Entity automation handler for ClanMember create/delete events.
// Posts a system message into the clan's default chat channel whenever a member
// joins or leaves the guild. Triggered automatically by base44 automations.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data, old_data } = payload;

    const row = data || old_data;
    if (!row?.clan_id) return Response.json({ ok: true, skipped: 'no clan_id' });

    // Resolve the user's display name
    let userName = 'A player';
    try {
      const users = await base44.asServiceRole.entities.User.filter({ id: row.user_id });
      if (users[0]) userName = users[0].full_name || users[0].username || users[0].email?.split('@')[0] || 'A player';
    } catch {}

    // Find the default channel for this clan
    const channels = await base44.asServiceRole.entities.ClanChannel.filter({ divisionId: row.clan_id });
    const ch = channels[0];
    if (!ch) return Response.json({ ok: true, skipped: 'no channel' });

    const verb = event.type === 'create' ? 'joined the guild' : 'left the guild';

    await base44.asServiceRole.entities.ClanMessage.create({
      divisionId: row.clan_id,
      channelId: ch.id,
      author: 'System',
      authorAvatar: '',
      content: `${userName} has ${verb}.`,
      userId: row.user_id,
      role: row.role || 'member',
      isAnnouncement: true,
      isPinned: false,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[clanMembershipNotifier] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});