import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const ACTIVE_STATUSES = new Set(['forming', 'full', 'active']);
const displayName = (user: any) => user?.full_name || user?.username || 'Player';
const avatarUrl = (user: any) => user?.avatar_url || user?.profile_image || '';
const expiresIn = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();
const isExpired = (value?: string) => !!value && new Date(value).getTime() <= Date.now();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const payload = await req.json().catch(() => ({}));
    const action = payload?.action;
    const data = payload?.data || {};
    const svc = base44.asServiceRole.entities;

    const activePartyFor = async (userId: string) => {
      const memberships = await svc.PartyMember.filter({ user_id: userId });
      for (const membership of memberships || []) {
        try {
          const party = await svc.Party.get(membership.party_id);
          if (party && ACTIVE_STATUSES.has(party.status || 'forming')) return { party, membership };
        } catch (_) {}
      }
      return { party: null, membership: null };
    };

    const rosterFor = async (partyId: string) => svc.PartyMember.filter({ party_id: partyId });

    const syncRoster = async (party: any) => {
      const roster = await rosterFor(party.id);
      const ids = roster.map((m: any) => m.user_id);
      const max = Number(party.maxSize || 4);
      await svc.Party.update(party.id, {
        members: ids,
        status: ids.length >= max ? 'full' : 'active',
        lastActive: new Date().toISOString(),
      });
      return roster;
    };

    const createParty = async () => {
      const existing = await activePartyFor(user.id);
      if (existing.party) return existing;

      const party = await svc.Party.create({
        leaderId: user.id,
        partyName: `${displayName(user)}'s Party`,
        goal: 'Play together',
        maxSize: 4,
        members: [user.id],
        status: 'forming',
        micRequired: false,
        lastActive: new Date().toISOString(),
      });
      const voiceRoomId = `party_${party.id}`;
      await svc.Party.update(party.id, { voiceRoomId });
      const membership = await svc.PartyMember.create({
        party_id: party.id,
        user_id: user.id,
        user_name: displayName(user),
        user_avatar: avatarUrl(user),
        role: 'leader',
        voice_enabled: true,
        is_ready: false,
        joined_date: new Date().toISOString(),
      });
      return { party: { ...party, voiceRoomId }, membership };
    };

    if (action === 'get_state') {
      const { party, membership } = await activePartyFor(user.id);
      let members: any[] = [];
      if (party) members = await rosterFor(party.id);

      const invitations = await svc.PartyInvite.filter({ invitee_id: user.id, status: 'pending' }, '-created_date', 20);
      const launchInvites = await svc.PartyLaunchInvite.filter({ recipient_id: user.id, status: 'pending' }, '-created_date', 20);

      const activeInvitations = [];
      for (const invite of invitations || []) {
        if (isExpired(invite.expires_at)) {
          await svc.PartyInvite.update(invite.id, { status: 'expired' });
        } else activeInvitations.push(invite);
      }

      const activeLaunchInvites = [];
      for (const invite of launchInvites || []) {
        if (isExpired(invite.expires_at)) {
          await svc.PartyLaunchInvite.update(invite.id, { status: 'expired' });
        } else activeLaunchInvites.push(invite);
      }

      return json({
        party,
        membership,
        members,
        invitations: activeInvitations,
        launchInvites: activeLaunchInvites,
      });
    }

    if (action === 'create_party') {
      const state = await createParty();
      const members = await rosterFor(state.party.id);
      return json({ success: true, party: state.party, membership: state.membership, members });
    }

    if (action === 'invite_member') {
      const inviteeId = String(data.inviteeId || '');
      if (!inviteeId) return json({ error: 'Invitee is required' }, 400);
      if (inviteeId === user.id) return json({ error: 'You cannot invite yourself' }, 400);

      const friendship = await svc.Friend.filter({ user_id: user.id, friend_id: inviteeId });
      if (!friendship?.length) return json({ error: 'Only friends can be invited to a party' }, 403);

      const targetState = await activePartyFor(inviteeId);
      if (targetState.party) return json({ error: 'That friend is already in an active party' }, 409);

      const { party } = await createParty();
      const roster = await rosterFor(party.id);
      if (roster.some((m: any) => m.user_id === inviteeId)) return json({ error: 'That friend is already in your party' }, 409);
      if (roster.length >= Number(party.maxSize || 4)) return json({ error: 'Party is full' }, 409);

      const duplicates = await svc.PartyInvite.filter({ party_id: party.id, invitee_id: inviteeId, status: 'pending' });
      for (const duplicate of duplicates || []) {
        if (!isExpired(duplicate.expires_at)) return json({ error: 'Party invite already pending' }, 409);
        await svc.PartyInvite.update(duplicate.id, { status: 'expired' });
      }

      const invite = await svc.PartyInvite.create({
        party_id: party.id,
        inviter_id: user.id,
        inviter_name: displayName(user),
        invitee_id: inviteeId,
        status: 'pending',
        expires_at: expiresIn(10),
        message: data.message || `${displayName(user)} invited you to a party`,
      });
      return json({ success: true, party, invite });
    }

    if (action === 'accept_invite') {
      const invite = await svc.PartyInvite.get(String(data.inviteId || ''));
      if (!invite || invite.invitee_id !== user.id) return json({ error: 'Invite not found' }, 404);
      if (invite.status !== 'pending') return json({ error: 'Invite is no longer pending' }, 409);
      if (isExpired(invite.expires_at)) {
        await svc.PartyInvite.update(invite.id, { status: 'expired' });
        return json({ error: 'Invite expired' }, 410);
      }

      const existing = await activePartyFor(user.id);
      if (existing.party) return json({ error: 'Leave your current party first' }, 409);
      const party = await svc.Party.get(invite.party_id);
      if (!party || !ACTIVE_STATUSES.has(party.status || 'forming')) return json({ error: 'Party is no longer active' }, 409);
      const roster = await rosterFor(party.id);
      if (roster.length >= Number(party.maxSize || 4)) return json({ error: 'Party is full' }, 409);

      await svc.PartyMember.create({
        party_id: party.id,
        user_id: user.id,
        user_name: displayName(user),
        user_avatar: avatarUrl(user),
        role: 'member',
        voice_enabled: true,
        is_ready: false,
        joined_date: new Date().toISOString(),
      });
      await svc.PartyInvite.update(invite.id, { status: 'accepted' });
      const members = await syncRoster(party);
      return json({ success: true, party: await svc.Party.get(party.id), members });
    }

    if (action === 'decline_invite') {
      const invite = await svc.PartyInvite.get(String(data.inviteId || ''));
      if (!invite || invite.invitee_id !== user.id) return json({ error: 'Invite not found' }, 404);
      if (invite.status === 'pending') await svc.PartyInvite.update(invite.id, { status: 'declined' });
      return json({ success: true });
    }

    if (action === 'remove_member') {
      const { party } = await activePartyFor(user.id);
      if (!party || party.leaderId !== user.id) return json({ error: 'Only the party leader can remove members' }, 403);
      const targetId = String(data.userId || '');
      if (!targetId || targetId === user.id) return json({ error: 'Use leave or disband for yourself' }, 400);
      const records = await svc.PartyMember.filter({ party_id: party.id, user_id: targetId });
      if (!records?.length) return json({ error: 'Member not found' }, 404);
      await svc.PartyMember.delete(records[0].id);
      const members = await syncRoster(party);
      return json({ success: true, members });
    }

    if (action === 'leave_party') {
      const { party, membership } = await activePartyFor(user.id);
      if (!party || !membership) return json({ success: true });
      const roster = await rosterFor(party.id);
      const remaining = roster.filter((m: any) => m.user_id !== user.id);
      await svc.PartyMember.delete(membership.id);

      if (!remaining.length) {
        await svc.Party.update(party.id, { status: 'disbanded', members: [], lastActive: new Date().toISOString() });
      } else {
        if (party.leaderId === user.id) {
          const nextLeader = remaining.sort((a: any, b: any) => new Date(a.joined_date || a.created_date).getTime() - new Date(b.joined_date || b.created_date).getTime())[0];
          await svc.Party.update(party.id, { leaderId: nextLeader.user_id });
          await svc.PartyMember.update(nextLeader.id, { role: 'leader' });
        }
        await syncRoster(await svc.Party.get(party.id));
      }
      return json({ success: true });
    }

    if (action === 'disband_party') {
      const { party } = await activePartyFor(user.id);
      if (!party || party.leaderId !== user.id) return json({ error: 'Only the party leader can disband the party' }, 403);
      const roster = await rosterFor(party.id);
      for (const member of roster) await svc.PartyMember.delete(member.id);
      const pending = await svc.PartyInvite.filter({ party_id: party.id, status: 'pending' });
      for (const invite of pending || []) await svc.PartyInvite.update(invite.id, { status: 'cancelled' });
      await svc.Party.update(party.id, { status: 'disbanded', members: [], lastActive: new Date().toISOString() });
      return json({ success: true });
    }

    if (action === 'set_voice') {
      const { membership } = await activePartyFor(user.id);
      if (membership) await svc.PartyMember.update(membership.id, { voice_enabled: !!data.enabled });
      return json({ success: true });
    }

    if (action === 'broadcast_game_launch') {
      const { party } = await activePartyFor(user.id);
      if (!party) return json({ success: true, notified: 0 });
      const title = String(data.gameTitle || '').trim();
      if (!title) return json({ error: 'Game title is required' }, 400);
      const roster = await rosterFor(party.id);
      const recipients = roster.filter((m: any) => m.user_id !== user.id);
      const cover = String(data.gameCover || '');
      const gameId = String(data.gameId || '');
      const launchUrl = String(data.launchUrl || '');

      await svc.Party.update(party.id, {
        activeGameId: gameId,
        activeGameTitle: title,
        activeGameCover: cover,
        gameId,
        status: roster.length >= Number(party.maxSize || 4) ? 'full' : 'active',
        lastActive: new Date().toISOString(),
      });

      let notified = 0;
      for (const member of recipients) {
        const existing = await svc.PartyLaunchInvite.filter({
          party_id: party.id,
          sender_id: user.id,
          recipient_id: member.user_id,
          game_title: title,
          status: 'pending',
        });
        for (const oldInvite of existing || []) await svc.PartyLaunchInvite.update(oldInvite.id, { status: 'cancelled' });
        await svc.PartyLaunchInvite.create({
          party_id: party.id,
          sender_id: user.id,
          sender_name: displayName(user),
          recipient_id: member.user_id,
          game_id: gameId,
          game_title: title,
          game_cover: cover,
          launch_url: launchUrl,
          status: 'pending',
          expires_at: expiresIn(5),
        });
        notified += 1;
      }
      return json({ success: true, notified });
    }

    if (action === 'respond_launch_invite') {
      const invite = await svc.PartyLaunchInvite.get(String(data.inviteId || ''));
      if (!invite || invite.recipient_id !== user.id) return json({ error: 'Game invite not found' }, 404);
      if (invite.status !== 'pending') return json({ error: 'Game invite is no longer pending' }, 409);
      if (isExpired(invite.expires_at)) {
        await svc.PartyLaunchInvite.update(invite.id, { status: 'expired' });
        return json({ error: 'Game invite expired' }, 410);
      }
      const accepted = data.response === 'accepted';
      await svc.PartyLaunchInvite.update(invite.id, { status: accepted ? 'accepted' : 'declined' });
      return json({ success: true, accepted, launchUrl: accepted ? invite.launch_url : '', gameTitle: invite.game_title });
    }

    return json({ error: 'Unknown party action' }, 400);
  } catch (error) {
    console.error('[partySystem]', error);
    return json({ error: error?.message || 'Party service failed' }, 500);
  }
});
