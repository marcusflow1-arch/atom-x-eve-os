import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const STANDARD_TOPICS = [
  'General',
  'Farming',
  'Grinding',
  'LFG'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { game_id, clan_id, channel_id, desired_name, desired_capacity, create_new_channel, access_scope, join_password, channel_type } = await req.json();
    if (!game_id || !clan_id) {
      return Response.json({ error: 'game_id and clan_id are required' }, { status: 400 });
    }

    // Fetch candidate channels for this game
    let channels = await base44.asServiceRole.entities.ClanFormChannel.filter({ game_id });

    // If client specified a channel, prioritize it
    let targetChannel = channel_id ? channels.find(c => c.id === channel_id) : null;

    const withinCapacity = (ch) => {
      const cap = typeof ch.capacity === 'number' ? ch.capacity : 50;
      const count = Array.isArray(ch.active_member_ids) ? ch.active_member_ids.length : 0;
      return count < cap;
    };

    // Helper: ensure clan participation list contains caller clan
    const ensureParticipation = async (ch) => {
      const list = Array.isArray(ch.participating_clan_ids) ? ch.participating_clan_ids : [];
      if (!list.includes(clan_id)) {
        const updated = await base44.asServiceRole.entities.ClanFormChannel.update(ch.id, {
          participating_clan_ids: [...list, clan_id]
        });
        return updated;
      }
      return ch;
    };

    // Helper: add user to active_member_ids
    const ensurePresence = async (ch) => {
      const current = Array.isArray(ch.active_member_ids) ? ch.active_member_ids : [];
      if (!current.includes(user.id)) {
        const updated = await base44.asServiceRole.entities.ClanFormChannel.update(ch.id, {
          active_member_ids: [...current, user.id]
        });
        return updated;
      }
      return ch;
    };

    // Ensure default topics exist
    const ensureDefaultTopics = async (chId) => {
      const existing = await base44.asServiceRole.entities.ClanFormTopic.filter({ channel_id: chId });
      const existingTitles = new Set((existing || []).map(t => (t.title || '').toLowerCase()));
      const toCreate = STANDARD_TOPICS.filter(t => !existingTitles.has(t.toLowerCase())).map(title => ({
        channel_id: chId,
        game_id,
        title,
        created_by_user_id: user.id,
        status: 'open'
      }));
      if (toCreate.length) {
        await base44.asServiceRole.entities.ClanFormTopic.bulkCreate(toCreate);
      }
    };

    // Choose channel logic
    if (targetChannel && !withinCapacity(targetChannel)) {
      targetChannel = null; // force selection/creation
    }

    if (create_new_channel) {
      const baseName = desired_name?.trim() || 'Clan Forms';
      const index = channels.filter(c => (c.name || '').toLowerCase().startsWith(baseName.toLowerCase())).length + 1;
      const newName = index === 1 ? baseName : `${baseName} #${index}`;
      targetChannel = await base44.asServiceRole.entities.ClanFormChannel.create({
        game_id,
        name: newName,
        description: 'Custom channel',
        created_by_clan_id: clan_id,
        participating_clan_ids: [clan_id],
        is_open: (access_scope || 'all_clans') === 'all_clans',
        access_scope: access_scope || 'all_clans',
        join_password: join_password || '',
        channel_type: channel_type || 'chat',
        capacity: typeof desired_capacity === 'number' ? desired_capacity : 50,
        active_member_ids: []
      });
      channels = [...channels, targetChannel];
    } else if (!targetChannel) {
      // Try find any channel with capacity
      const withRoom = channels.find((c) => withinCapacity(c));
      if (withRoom) {
        targetChannel = withRoom;
      } else {
        // Create new channel
        const baseName = desired_name?.trim() || 'Clan Forms';
        const index = channels.filter(c => (c.name || '').toLowerCase().startsWith(baseName.toLowerCase())).length + 1;
        const newName = index === 1 ? baseName : `${baseName} #${index}`;
        targetChannel = await base44.asServiceRole.entities.ClanFormChannel.create({
          game_id,
          name: newName,
          description: 'Auto-scaled channel',
          created_by_clan_id: clan_id,
          participating_clan_ids: [clan_id],
          capacity: 50,
          active_member_ids: []
        });
        channels = [...channels, targetChannel];
      }
    }

    // Access gating for clan_only and password-protected channels
    if (targetChannel) {
      const scope = targetChannel.access_scope || (targetChannel.is_open ? 'all_clans' : 'clan_only');
      const alreadyParticipant = Array.isArray(targetChannel.participating_clan_ids) && targetChannel.participating_clan_ids.includes(clan_id);
      if (scope === 'clan_only' && targetChannel.created_by_clan_id !== clan_id && !alreadyParticipant) {
        if (targetChannel.join_password && (join_password || '') !== (targetChannel.join_password || '')) {
          return Response.json({ error: 'Forbidden: Password required or invalid' }, { status: 403 });
        }
        if (!targetChannel.join_password) {
          return Response.json({ error: 'Forbidden: This channel is restricted to the creator clan' }, { status: 403 });
        }
      }
    }

    // Ensure participation and presence
    targetChannel = await ensureParticipation(targetChannel);
    targetChannel = await ensurePresence(targetChannel);

    // Default topics
    await ensureDefaultTopics(targetChannel.id);

    // Fetch topics to return (help UI choose default General)
    const topics = await base44.asServiceRole.entities.ClanFormTopic.filter({ channel_id: targetChannel.id }, '-updated_date', 100);

    return Response.json({ channel: targetChannel, topics });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});