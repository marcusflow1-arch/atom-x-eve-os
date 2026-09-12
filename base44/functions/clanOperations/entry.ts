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

    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const data = body?.data || {};

    const getMembership = async (clanId: string) => {
      if (!clanId) return null;
      const rows = await base44.asServiceRole.entities.ClanMember.filter({ clan_id: clanId, user_id: user.id });
      return rows?.[0] || null;
    };

    const requireMember = async (clanId: string) => {
      const member = await getMembership(clanId);
      if (!member) throw Object.assign(new Error('Clan membership required'), { status: 403 });
      return member;
    };

    const requireOfficer = async (clanId: string) => {
      const member = await requireMember(clanId);
      if (!['leader', 'officer'].includes(member.role)) {
        throw Object.assign(new Error('Leader or officer permission required'), { status: 403 });
      }
      return member;
    };

    const completeFinishedUpgrades = async (clanId: string) => {
      const rows = await base44.asServiceRole.entities.ClanUpgrade.filter({ clan_id: clanId });
      const now = Date.now();
      for (const upgrade of rows || []) {
        if (upgrade.status !== 'in_progress' || !upgrade.started_at) continue;
        const durationMs = Math.max(1, Number(upgrade.build_seconds || 0)) * 1000;
        if (new Date(upgrade.started_at).getTime() + durationMs > now) continue;
        await base44.asServiceRole.entities.ClanUpgrade.update(upgrade.id, {
          status: 'active',
          tier: Math.min(Number(upgrade.max_tier || 5), Number(upgrade.tier || 0) + 1),
          progress_seconds: Number(upgrade.build_seconds || 0),
          completed_at: new Date().toISOString(),
        });
      }
      return await base44.asServiceRole.entities.ClanUpgrade.filter({ clan_id: clanId });
    };

    if (action === 'list_messages') {
      const { clanId, channelId } = data;
      const member = await requireMember(clanId);
      if (channelId === 'clan_leaders' && !['leader', 'officer'].includes(member.role)) {
        return json({ success: false, error: 'Leader channel is restricted' }, 403);
      }
      const rows = await base44.asServiceRole.entities.ClanMessage.filter(
        { divisionId: clanId, channelId: channelId || 'clan_global' },
        'created_date',
        250,
      );
      return json({ success: true, messages: rows || [], role: member.role });
    }

    if (action === 'send_message') {
      const { clanId, channelId, content } = data;
      const member = await requireMember(clanId);
      const clean = String(content || '').trim();
      if (!clean) return json({ success: false, error: 'Message is required' }, 400);
      if (clean.length > 4000) return json({ success: false, error: 'Message is too long' }, 400);
      if (channelId === 'clan_leaders' && !['leader', 'officer'].includes(member.role)) {
        return json({ success: false, error: 'Leader channel is restricted' }, 403);
      }
      const message = await base44.asServiceRole.entities.ClanMessage.create({
        divisionId: clanId,
        channelId: channelId || 'clan_global',
        author: user.full_name || user.username || user.email?.split('@')?.[0] || 'Player',
        authorAvatar: user.avatar_url || '',
        content: clean,
        userId: user.id,
        role: member.role,
        isAnnouncement: false,
        isPinned: false,
      });
      return json({ success: true, message });
    }

    if (action === 'admin_state') {
      const { clanId } = data;
      await requireOfficer(clanId);
      const [inventory, upgrades, assignments, events, members] = await Promise.all([
        base44.asServiceRole.entities.ClanVaultItem.filter({ clan_id: clanId }),
        completeFinishedUpgrades(clanId),
        base44.asServiceRole.entities.ClanAssignment.filter({ clanId }),
        base44.asServiceRole.entities.ClanEvent.filter({ divisionId: clanId }),
        base44.asServiceRole.entities.ClanMember.filter({ clan_id: clanId }),
      ]);
      const completedAssignments = (assignments || []).filter((row: any) => row.status === 'completed').length;
      return json({
        success: true,
        inventory: inventory || [],
        upgrades: upgrades || [],
        assignments: assignments || [],
        events: events || [],
        members: members || [],
        progress: {
          memberCount: members?.length || 0,
          inventoryUnits: (inventory || []).reduce((sum: number, row: any) => sum + Number(row.quantity || 1), 0),
          activeUpgrades: (upgrades || []).filter((row: any) => row.status === 'active').length,
          assignmentsCompleted: completedAssignments,
          assignmentsTotal: assignments?.length || 0,
          upcomingEvents: (events || []).filter((row: any) => new Date(row.startTime || row.start_time || 0).getTime() >= Date.now()).length,
        },
      });
    }

    if (action === 'create_assignment') {
      const { clanId, assignment = {} } = data;
      await requireOfficer(clanId);
      const row = await base44.asServiceRole.entities.ClanAssignment.create({
        clanId,
        divisionId: clanId,
        type: assignment.type || 'objective',
        targetId: assignment.gameId || assignment.targetId || 'general',
        targetName: assignment.targetName || assignment.title || 'Clan Directive',
        title: assignment.targetName || assignment.title || 'Clan Directive',
        priority: assignment.priority || 'recommended',
        assigneeId: assignment.assigneeId || 'all',
        dueDate: assignment.dueDate || null,
        notes: assignment.notes || '',
        status: 'pending',
        createdBy: user.id,
        created_by_user_id: user.id,
      });
      return json({ success: true, assignment: row });
    }

    if (action === 'set_assignment_status') {
      const { clanId, assignmentId, status } = data;
      const member = await requireMember(clanId);
      const row = await base44.asServiceRole.entities.ClanAssignment.get(assignmentId);
      if (!row || (row.clanId !== clanId && row.divisionId !== clanId)) return json({ success: false, error: 'Assignment not found' }, 404);
      const officer = ['leader', 'officer'].includes(member.role);
      if (!officer && row.assigneeId !== 'all' && String(row.assigneeId) !== String(user.id)) {
        return json({ success: false, error: 'Assignment is not assigned to you' }, 403);
      }
      await base44.asServiceRole.entities.ClanAssignment.update(assignmentId, { status });
      return json({ success: true });
    }

    if (action === 'create_event') {
      const { clanId, event = {} } = data;
      await requireOfficer(clanId);
      if (!event.title || !event.startTime) return json({ success: false, error: 'Title and start time are required' }, 400);
      const row = await base44.asServiceRole.entities.ClanEvent.create({
        divisionId: clanId,
        creatorId: user.id,
        title: event.title,
        description: event.description || '',
        eventType: event.eventType || 'meeting',
        startTime: event.startTime,
        maxParticipants: Math.max(1, Number(event.maxParticipants || 20)),
        game: event.game || '',
        participants: [user.id],
      });
      return json({ success: true, event: row });
    }

    if (action === 'join_event') {
      const { clanId, eventId } = data;
      await requireMember(clanId);
      const event = await base44.asServiceRole.entities.ClanEvent.get(eventId);
      if (!event || event.divisionId !== clanId) return json({ success: false, error: 'Event not found' }, 404);
      const participants = Array.from(new Set([...(event.participants || []), user.id]));
      if (participants.length > Number(event.maxParticipants || 9999)) return json({ success: false, error: 'Event is full' }, 400);
      await base44.asServiceRole.entities.ClanEvent.update(eventId, { participants });
      return json({ success: true });
    }

    if (action === 'deposit_inventory') {
      const { clanId, item = {} } = data;
      await requireMember(clanId);
      if (!item.item_name) return json({ success: false, error: 'Item name is required' }, 400);
      const row = await base44.asServiceRole.entities.ClanVaultItem.create({
        clan_id: clanId,
        item_id: item.item_id || '',
        item_name: item.item_name,
        item_icon: item.item_icon || '',
        rarity: item.rarity || 'common',
        category: item.category || 'material',
        quantity: Math.max(1, Number(item.quantity || 1)),
        stash_tab: Number(item.stash_tab || 0),
        deposited_by: user.id,
        deposited_at: new Date().toISOString(),
        note: item.note || '',
      });
      return json({ success: true, item: row });
    }

    if (action === 'withdraw_inventory') {
      const { clanId, itemId, quantity = 1 } = data;
      await requireOfficer(clanId);
      const item = await base44.asServiceRole.entities.ClanVaultItem.get(itemId);
      if (!item || item.clan_id !== clanId) return json({ success: false, error: 'Vault item not found' }, 404);
      const take = Math.max(1, Math.min(Number(quantity || 1), Number(item.quantity || 1)));
      if (take >= Number(item.quantity || 1)) await base44.asServiceRole.entities.ClanVaultItem.delete(itemId);
      else await base44.asServiceRole.entities.ClanVaultItem.update(itemId, { quantity: Number(item.quantity || 1) - take });
      return json({ success: true, withdrawn: take });
    }

    if (action === 'start_upgrade') {
      const { clanId, upgrade = {} } = data;
      await requireOfficer(clanId);
      const key = upgrade.key || upgrade.upgrade_key;
      if (!key) return json({ success: false, error: 'Upgrade key is required' }, 400);
      const existing = await base44.asServiceRole.entities.ClanUpgrade.filter({ clan_id: clanId, upgrade_key: key });
      const current = existing?.[0];
      if (current?.status === 'in_progress') return json({ success: false, error: 'Upgrade already in progress' }, 400);
      if (current && Number(current.tier || 0) >= Number(current.max_tier || 5)) return json({ success: false, error: 'Maximum tier reached' }, 400);
      const patch = {
        clan_id: clanId,
        upgrade_key: key,
        upgrade_name: upgrade.name || upgrade.upgrade_name || key,
        category: upgrade.category || 'operations',
        max_tier: Number(upgrade.maxTier || upgrade.max_tier || 5),
        status: 'in_progress',
        progress_seconds: 0,
        build_seconds: Math.max(5, Number(upgrade.buildSeconds || upgrade.build_seconds || 300)),
        cost_favor: Number(upgrade.costFavor || 0),
        cost_aetherium: Number(upgrade.costAetherium || 0),
        started_at: new Date().toISOString(),
      };
      const row = current
        ? await base44.asServiceRole.entities.ClanUpgrade.update(current.id, patch)
        : await base44.asServiceRole.entities.ClanUpgrade.create({ ...patch, tier: 0 });
      return json({ success: true, upgrade: row });
    }

    if (action === 'list_exploration') {
      const { clanId, gameId } = data;
      await requireMember(clanId);
      const rows = await base44.asServiceRole.entities.ExplorationIntel.filter({ clan_id: clanId, game_id: gameId }, '-created_date', 250);
      return json({ success: true, intel: rows || [] });
    }

    if (action === 'create_exploration') {
      const { clanId, gameId, intel = {} } = data;
      await requireMember(clanId);
      if (!intel.title && !intel.location_name) return json({ success: false, error: 'Location name is required' }, 400);
      const row = await base44.asServiceRole.entities.ExplorationIntel.create({
        clan_id: clanId,
        game_id: gameId,
        title: intel.title || intel.location_name,
        location_name: intel.location_name || intel.title,
        description: intel.description || '',
        location_type: intel.location_type || 'discovery',
        coordinates: intel.coordinates || '',
        media_urls: intel.media_urls || [],
        tags: intel.tags || [],
        discovered_by: user.id,
        discovered_by_name: user.full_name || user.username || 'Player',
        verified: false,
      });
      return json({ success: true, intel: row });
    }

    if (action === 'create_party') {
      const { clanId, gameId, party = {} } = data;
      await requireMember(clanId);
      if (!party.goal) return json({ success: false, error: 'Party goal is required' }, 400);
      const row = await base44.asServiceRole.entities.Party.create({
        clanId,
        gameId,
        leaderId: user.id,
        goal: party.goal,
        description: party.context || 'general',
        context: party.context || 'general',
        maxSize: Math.max(2, Math.min(12, Number(party.maxSize || 4))),
        status: 'forming',
        micRequired: !!party.micRequired,
        assignmentId: party.assignmentId || null,
        members: [user.id],
        lastActive: new Date().toISOString(),
      });
      return json({ success: true, party: row });
    }

    return json({ success: false, error: 'Invalid action' }, 400);
  } catch (error) {
    console.error('Clan operations error:', error);
    return json({ success: false, error: error?.message || 'Clan operation failed' }, error?.status || 500);
  }
});
