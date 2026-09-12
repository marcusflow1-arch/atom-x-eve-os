import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ success: false, error: 'Unauthorized' }, 401);
    const { action, data = {} } = await req.json();
    const { clanId, gameId } = data;

    const memberships = clanId ? await base44.asServiceRole.entities.ClanMember.filter({ clan_id: clanId, user_id: user.id }) : [];
    const member = memberships?.[0] || null;
    if (!member) return json({ success: false, error: 'Clan membership required' }, 403);
    const privileged = ['leader', 'officer'].includes(member.role);

    const validateChannel = async (channelId: string) => {
      const channel = await base44.asServiceRole.entities.ClanFormChannel.get(channelId);
      if (!channel || (gameId && channel.game_id !== gameId)) throw Object.assign(new Error('Forum channel not found'), { status: 404 });
      const shared = channel.access_scope === 'all_clans';
      if (!shared && channel.clan_id && channel.clan_id !== clanId) throw Object.assign(new Error('Forum channel is not available to this clan'), { status: 403 });
      const channelName = String(channel.name || channel.channel_name || '').toLowerCase();
      const leaderChannel = channelName.includes('leader') || String(channel.visibility_scope || '').toLowerCase() === 'leaders';
      if (leaderChannel && !privileged) throw Object.assign(new Error('Leader forum is restricted'), { status: 403 });
      return { channel, leaderChannel };
    };

    if (action === 'create_topic') {
      const { channelId, title, visibilityScope = 'clan' } = data;
      await validateChannel(channelId);
      const normalizedVisibility = visibilityScope === 'shared' ? 'both' : visibilityScope;
      if (normalizedVisibility === 'leaders' && !privileged) return json({ success: false, error: 'Leader topics require officer permission' }, 403);
      const cleanTitle = String(title || '').trim();
      if (!cleanTitle) return json({ success: false, error: 'Topic title is required' }, 400);
      const topic = await base44.asServiceRole.entities.ClanFormTopic.create({
        channel_id: channelId,
        game_id: gameId,
        clan_id: clanId,
        title: cleanTitle,
        created_by_user_id: user.id,
        status: 'open',
        visibility_scope: normalizedVisibility,
      });
      return json({ success: true, topic });
    }

    if (action === 'send_message') {
      const { channelId, topicId, content } = data;
      const { leaderChannel } = await validateChannel(channelId);
      const topic = await base44.asServiceRole.entities.ClanFormTopic.get(topicId);
      if (!topic || topic.channel_id !== channelId || topic.game_id !== gameId) return json({ success: false, error: 'Topic not found' }, 404);
      if ((leaderChannel || topic.visibility_scope === 'leaders') && !privileged) return json({ success: false, error: 'Leader forum is restricted' }, 403);
      const clean = String(content || '').trim();
      if (!clean) return json({ success: false, error: 'Message is required' }, 400);
      if (clean.length > 6000) return json({ success: false, error: 'Message is too long' }, 400);
      const message = await base44.asServiceRole.entities.ClanFormMessage.create({
        topic_id: topicId,
        channel_id: channelId,
        game_id: gameId,
        user_id: user.id,
        clan_id: clanId,
        username: user.full_name || user.username || user.email?.split('@')?.[0] || 'Player',
        content: clean,
      });
      return json({ success: true, message });
    }

    return json({ success: false, error: 'Invalid action' }, 400);
  } catch (error) {
    console.error('Clan forum operations error:', error);
    return json({ success: false, error: error?.message || 'Clan forum operation failed' }, error?.status || 500);
  }
});
