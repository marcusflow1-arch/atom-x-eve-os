import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const nameOf = (user: any) => user?.full_name || user?.username || user?.email?.split?.('@')?.[0] || 'Player';
const avatarOf = (user: any) => user?.avatar_url || user?.profile_image || '';
const conversationIdFor = (a: string, b: string) => [String(a), String(b)].sort().join('::');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const payload = await req.json().catch(() => ({}));
    const action = String(payload?.action || '');
    const data = payload?.data || {};
    const svc = base44.asServiceRole.entities;

    const createNotification = async (input: any) => {
      const existing = await svc.SocialNotification.filter({recipient_id:input.recipient_id,type:input.type,related_entity_id:input.related_entity_id || ''},'-created_date',1);
      if (existing.length) return existing[0];
      return await svc.SocialNotification.create({
          recipient_id: input.recipient_id,
          actor_id: user.id,
          actor_name: input.actor_name || nameOf(user),
          actor_avatar: input.actor_avatar || avatarOf(user),
          type: input.type,
          title: input.title,
          body: input.body || '',
          related_entity_id: input.related_entity_id || '',
          conversation_id: input.conversation_id || '',
          status: 'unread',
          action_kind: input.action_kind || 'none',
        });
    };

    // Friend relationships are consumed by two parts of Atom x Eve: Luna's
    // Friend rows and the shared game-world SocialFriendship row. Keep both in
    // sync through service-role writes so every UI sees the same result.
    const ensureFriendshipBetween = async (input: {
      senderId: string;
      senderName?: string;
      senderAvatar?: string;
      receiverId: string;
      receiverName?: string;
      receiverAvatar?: string;
    }) => {
      const senderId = String(input.senderId || '').trim();
      const receiverId = String(input.receiverId || '').trim();
      if (!senderId || !receiverId) throw new Error('Friendship is missing a user ID');

      const [receiverRows, senderRows] = await Promise.all([
        svc.Friend.filter({ user_id: receiverId, friend_id: senderId }, '-created_date', 1),
        svc.Friend.filter({ user_id: senderId, friend_id: receiverId }, '-created_date', 1),
      ]);

      if (!receiverRows?.length) {
        await svc.Friend.create({
          user_id: receiverId,
          friend_id: senderId,
          friend_name: input.senderName || 'Player',
          friend_avatar: input.senderAvatar || '',
          status: 'offline',
        });
      }
      if (!senderRows?.length) {
        await svc.Friend.create({
          user_id: senderId,
          friend_id: receiverId,
          friend_name: input.receiverName || 'Player',
          friend_avatar: input.receiverAvatar || '',
          status: 'offline',
        });
      }

      const [forward, reverse] = await Promise.all([
        svc.SocialFriendship.filter({ user_a_id: senderId, user_b_id: receiverId }, '-created_date', 1).catch(() => []),
        svc.SocialFriendship.filter({ user_a_id: receiverId, user_b_id: senderId }, '-created_date', 1).catch(() => []),
      ]);
      if (!(forward?.length || reverse?.length)) {
        await svc.SocialFriendship.create({
          user_a_id: senderId,
          user_a_name: input.senderName || 'Player',
          user_b_id: receiverId,
          user_b_name: input.receiverName || 'Player',
        });
      }
    };

    if (action === 'send_friend_request') {
      const targetId = String(data.target_user_id || '').trim();
      if (!targetId) return json({ error: 'Target user is required' }, 400);
      if (targetId === String(user.id)) return json({ error: 'You cannot add yourself' }, 400);

      const existingFriend = await svc.Friend.filter({ user_id: user.id, friend_id: targetId }, '-created_date', 1);
      if (existingFriend?.length) return json({ success: true, already_friends: true });

      const pending = await svc.FriendRequest.filter({ sender_id: user.id, receiver_id: targetId, status: 'pending' }, '-created_date', 1);
      if (pending?.length) {
        await createNotification({recipient_id:targetId,type:'friend_request',title:'Friend request',body:`${nameOf(user)} sent you a friend request.`,related_entity_id:pending[0].id,action_kind:'friend_request'});
        return json({success:true,request:pending[0],already_pending:true});
      }

      const reverse = await svc.FriendRequest.filter({ sender_id: targetId, receiver_id: user.id, status: 'pending' }, '-created_date', 1);
      if (reverse?.length) {
        // Clicking Add Friend when that player has already requested you means
        // both users have expressed the same intent. Complete the friendship
        // immediately instead of returning a misleading "sent" state.
        const incoming = reverse[0];
        await ensureFriendshipBetween({
          senderId: targetId,
          senderName: incoming.sender_name || 'Player',
          senderAvatar: incoming.sender_avatar || '',
          receiverId: String(user.id),
          receiverName: nameOf(user),
          receiverAvatar: avatarOf(user),
        });
        const updated = await svc.FriendRequest.update(incoming.id, { status: 'accepted' });
        const notices = await svc.SocialNotification.filter({ recipient_id: user.id, related_entity_id: incoming.id });
        for (const notice of notices || []) await svc.SocialNotification.update(notice.id, { status: 'actioned' });
        await createNotification({
          recipient_id: targetId,
          type: 'friend_accepted',
          title: 'Friend request accepted',
          body: `${nameOf(user)} accepted your friend request.`,
          related_entity_id: incoming.id,
          action_kind: 'none',
        });
        return json({ success: true, request: updated, accepted: true, mutual: true });
      }

      const request = await svc.FriendRequest.create({
        sender_id: user.id,
        sender_name: nameOf(user),
        sender_avatar: avatarOf(user),
        receiver_id: targetId,
        status: 'pending',
        message: String(data.message || 'Would like to add you as a friend').slice(0, 300),
      });
      await createNotification({
        recipient_id: targetId,
        type: 'friend_request',
        title: 'Friend request',
        body: `${nameOf(user)} sent you a friend request.`,
        related_entity_id: request.id,
        action_kind: 'friend_request',
      });
      return json({ success: true, request });
    }

    if (action === 'respond_friend_request') {
      const requestId = String(data.request_id || '').trim();
      const accepting = data.decision === 'accept';
      const decision = accepting ? 'accepted' : 'declined';
      const request = await svc.FriendRequest.get(requestId).catch(() => null);
      if (!request || String(request.receiver_id) !== String(user.id)) return json({ error: 'Friend request not found' }, 404);

      const ensureFriendship = async () => ensureFriendshipBetween({
        senderId: String(request.sender_id || ''),
        senderName: request.sender_name || 'Player',
        senderAvatar: request.sender_avatar || '',
        receiverId: String(user.id || ''),
        receiverName: nameOf(user),
        receiverAvatar: avatarOf(user),
      });

      // If an older build already marked the request accepted before failing to
      // create the Friend rows, accepting it again repairs the relationship.
      if (request.status === 'accepted' && accepting) {
        await ensureFriendship();
        return json({ success: true, request, accepted: true, repaired: true });
      }
      if (request.status !== 'pending') return json({ success: true, request, accepted: request.status === 'accepted' });

      if (accepting) {
        // Persist the friendship first. Only mark the request accepted after all
        // friendship stores succeed, so a transient failure leaves a retryable
        // pending request instead of a disappearing request with no friend.
        await ensureFriendship();
      }

      const updated = await svc.FriendRequest.update(request.id, { status: decision });
      if (accepting) {
        await createNotification({
          recipient_id: request.sender_id,
          type: 'friend_accepted',
          title: 'Friend request accepted',
          body: `${nameOf(user)} accepted your friend request.`,
          related_entity_id: request.id,
          action_kind: 'none',
        });
      }

      const notices = await svc.SocialNotification.filter({ recipient_id: user.id, related_entity_id: request.id });
      for (const notice of notices || []) await svc.SocialNotification.update(notice.id, { status: 'actioned' });
      return json({ success: true, request: updated, accepted: accepting });
    }

    if (action === 'send_dashboard_invite') {
      const targetId = String(data.target_user_id || '').trim();
      if (!targetId) return json({ error: 'Target user is required' }, 400);
      if (targetId === String(user.id)) return json({ error: 'You are already on your own dashboard' }, 400);

      const duplicate = await svc.LunarDashboardRequest.filter({
        request_type: 'invite', requester_id: user.id, target_user_id: targetId, host_user_id: user.id, status: 'pending'
      }, '-created_date', 1);
      const request = duplicate?.[0] || await svc.LunarDashboardRequest.create({
        request_type: 'invite',
        requester_id: user.id,
        requester_name: nameOf(user),
        target_user_id: targetId,
        host_user_id: user.id,
        status: 'pending',
      });
      {
        await createNotification({
          recipient_id: targetId,
          type: 'dashboard_invite',
          title: 'Dashboard invitation',
          body: `${nameOf(user)} invited you to join their Luna dashboard.`,
          related_entity_id: request.id,
          action_kind: 'dashboard_invite',
        });
      }
      return json({ success: true, request, already_pending: !!duplicate?.length });
    }

    if (action === 'respond_dashboard_invite') {
      const requestId = String(data.request_id || '').trim();
      const decision = data.decision === 'accept' ? 'accepted' : 'declined';
      const request = await svc.LunarDashboardRequest.get(requestId).catch(() => null);
      if (!request || String(request.target_user_id) !== String(user.id)) return json({ error: 'Dashboard invitation not found' }, 404);
      if (request.status !== 'pending') return json({success:true,accepted:request.status === 'accepted',host_user_id:request.host_user_id,host_name:request.requester_name});
      await svc.LunarDashboardRequest.update(request.id, { status: decision });
      const notices = await svc.SocialNotification.filter({ recipient_id: user.id, related_entity_id: request.id });
      for (const notice of notices || []) await svc.SocialNotification.update(notice.id, { status: 'actioned' });
      return json({ success: true, accepted: decision === 'accepted', host_user_id: request.host_user_id, host_name: request.requester_name });
    }

    if (action === 'get_dashboard_join') {
      const targetId = String(data.target_user_id || '').trim();
      if (!targetId) return json({ error: 'Target user is required' }, 400);
      const expectedChannel = `dashboard_${targetId}`;
      const rows = await svc.PlayerState.filter({ player_id: targetId }, '-last_update', 50);
      const sorted = (rows || []).sort((a: any, b: any) => Number(b.last_update || 0) - Number(a.last_update || 0));
      const dashboardState = sorted.find((row: any) => String(row.channel_id || '') === expectedChannel) || null;
      const live = dashboardState || sorted[0] || null;
      return json({
        success: true,
        target_user_id: targetId,
        channel_id: expectedChannel,
        online: !!live && live.status !== 'offline' && Number(live.last_update) > Date.now() - 20000,
        player_state: live ? {
          player_id: live.player_id,
          display_name: live.display_name,
          status: live.status,
          // Join Dashboard must never follow a player into a game/world channel.
          channel_id: expectedChannel,
          env_url: dashboardState?.env_url || '',
          model_url: live.model_url,
          last_update: live.last_update,
        } : null,
      });
    }

    if (action === 'send_message') {
      const targetId = String(data.target_user_id || '').trim();
      const content = String(data.content || '').trim().slice(0, 5000);
      const mediaUrl = String(data.media_url || '').trim();
      if (!targetId) return json({ error: 'Recipient is required' }, 400);
      if (targetId === String(user.id)) return json({ error: 'You cannot message yourself' }, 400);
      if (!content && !mediaUrl) return json({ error: 'Message is empty' }, 400);
      const conversationId = conversationIdFor(user.id, targetId);
      const type = ['image', 'screenshot', 'video', 'file', 'call'].includes(data.message_type) ? data.message_type : 'text';
      const message = await svc.DirectMessage.create({
        sender_id: user.id,
        receiver_id: targetId,
        conversation_id: conversationId,
        content,
        is_read: false,
        message_type: type,
        media_url: mediaUrl,
        media_name: String(data.media_name || '').slice(0, 300),
        media_mime: String(data.media_mime || '').slice(0, 150),
        ...(data.call_mode ? { call_mode: data.call_mode } : {}),
        ...(data.call_status ? { call_status: data.call_status } : {}),
      });
      let notification_warning = '';
      try {
        await createNotification({
          recipient_id: targetId,
          type: 'message',
          title: nameOf(user),
          body: content || (type === 'screenshot' ? 'Sent a screenshot.' : type === 'image' ? 'Sent a picture.' : 'Sent an attachment.'),
          related_entity_id: message.id,
          conversation_id: conversationId,
          action_kind: 'open_message',
        });
      } catch (notificationError) {
        // The message is already committed. Notification delivery is secondary;
        // never tell the sender their message failed after it was persisted.
        notification_warning = notificationError?.message || 'Notification delivery was delayed.';
        console.warn('[socialActions] message notification failed', notificationError);
      }
      return json({ success: true, message, conversation_id: conversationId, notification_warning });
    }

    if (action === 'get_thread') {
      const targetId = String(data.target_user_id || '').trim();
      if (!targetId) return json({ error: 'Conversation user is required' }, 400);
      const conversationId = conversationIdFor(user.id, targetId);
      const rows = await svc.DirectMessage.filter({ conversation_id: conversationId }, 'created_date', 1000);
      const messages = (rows || []).filter((m: any) => String(m.sender_id) === String(user.id) || String(m.receiver_id) === String(user.id));
      return json({ success: true, conversation_id: conversationId, messages });
    }

    if (action === 'mark_thread_read') {
      const targetId = String(data.target_user_id || '').trim();
      if (!targetId) return json({ error: 'Conversation user is required' }, 400);
      const conversationId = conversationIdFor(user.id, targetId);
      const rows = await svc.DirectMessage.filter({ conversation_id: conversationId, receiver_id: user.id, is_read: false }, '-created_date', 500);
      const readAt = new Date().toISOString();
      for (const message of rows || []) await svc.DirectMessage.update(message.id, { is_read: true, read_at: readAt });
      const notices = await svc.SocialNotification.filter({ recipient_id: user.id, conversation_id: conversationId, type: 'message', status: 'unread' }, '-created_date', 500);
      for (const notice of notices || []) await svc.SocialNotification.update(notice.id, { status: 'read' });
      return json({ success: true, marked: rows?.length || 0 });
    }

    if (action === 'get_inbox') {
      const [received, sent, friends] = await Promise.all([
        svc.DirectMessage.filter({ receiver_id: user.id }, '-created_date', 1000),
        svc.DirectMessage.filter({ sender_id: user.id }, '-created_date', 1000),
        svc.Friend.filter({ user_id: user.id }, '-created_date', 1000),
      ]);
      const friendIds = new Set((friends || []).map((f: any) => String(f.friend_id)));
      const all = [...(received || []), ...(sent || [])].sort((a: any, b: any) => new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime());
      const byConversation = new Map<string, any>();
      for (const message of all) {
        if (!message?.conversation_id || byConversation.has(message.conversation_id)) continue;
        const partnerId = String(message.sender_id) === String(user.id) ? String(message.receiver_id) : String(message.sender_id);
        byConversation.set(message.conversation_id, { message, partnerId });
      }
      const unreadByPartner = new Map<string, number>();
      for (const message of received || []) {
        if (message.is_read) continue;
        const key = String(message.sender_id);
        unreadByPartner.set(key, (unreadByPartner.get(key) || 0) + 1);
      }
      const profiles = new Map<string, any>();
      for (const { partnerId } of byConversation.values()) {
        if (profiles.has(partnerId)) continue;
        profiles.set(partnerId, await svc.User.get(partnerId).catch(() => null));
      }
      const conversations = [...byConversation.values()].map(({ message, partnerId }) => {
        const profile = profiles.get(partnerId);
        return {
          conversation_id: message.conversation_id,
          partner_id: partnerId,
          partner_name: nameOf(profile),
          partner_avatar: avatarOf(profile),
          is_friend: friendIds.has(partnerId),
          unread_count: unreadByPartner.get(partnerId) || 0,
          last_message: message.content || (message.message_type === 'screenshot' ? 'Screenshot' : message.message_type === 'image' ? 'Photo' : message.message_type === 'video' ? 'Video' : 'Attachment'),
          last_message_type: message.message_type || 'text',
          last_message_at: message.created_date,
          last_sender_id: message.sender_id,
        };
      });
      const friendUnread = conversations.filter((c: any) => c.is_friend).reduce((sum: number, c: any) => sum + Number(c.unread_count || 0), 0);
      const nonfriendUnread = conversations.filter((c: any) => !c.is_friend).reduce((sum: number, c: any) => sum + Number(c.unread_count || 0), 0);
      return json({ success: true, conversations, unread_total: friendUnread + nonfriendUnread, friend_unread: friendUnread, nonfriend_unread: nonfriendUnread });
    }

    if (action === 'get_pending_actions') {
      const [friendRequests, dashboardInvites, notifications, partyInvites] = await Promise.all([
        svc.FriendRequest.filter({receiver_id:user.id,status:'pending'},'-created_date',100),
        svc.LunarDashboardRequest.filter({target_user_id:user.id,request_type:'invite',status:'pending'},'-created_date',100),
        svc.SocialNotification.filter({recipient_id:user.id},'-created_date',100),
        svc.PartyInvite.filter({invitee_id:user.id,status:'pending'},'-created_date',100),
      ]);
      const parties = partyInvites.filter((p:any)=>!p.expires_at || Date.parse(p.expires_at)>Date.now());
      // Pending records remain actionable even if an older build failed to write its notification.
      const pending = [
        ...friendRequests.map((r:any)=>({type:'friend_request',action_kind:'friend_request',related_entity_id:r.id,actor_id:r.sender_id,actor_name:r.sender_name,actor_avatar:r.sender_avatar,title:'Friend request',body:`${r.sender_name} sent you a friend request.`,created_date:r.created_date})),
        ...dashboardInvites.map((r:any)=>({type:'dashboard_invite',action_kind:'dashboard_invite',related_entity_id:r.id,actor_id:r.requester_id,actor_name:r.requester_name,title:'Dashboard invitation',body:`${r.requester_name} invited you to their dashboard.`,created_date:r.created_date})),
        ...parties.map((r:any)=>({type:'party_invite',action_kind:'party_invite',related_entity_id:r.id,actor_id:r.inviter_id,actor_name:r.inviter_name,title:'Party invitation',body:`${r.inviter_name} invited you to a party.`,created_date:r.created_date})),
      ];
      const keys=new Set(pending.map(p=>p.type+':'+p.related_entity_id));
      const actionable = pending.map(p=>{
        const notice=notifications.find((n:any)=>n.type===p.type&&n.related_entity_id===p.related_entity_id);
        return {...p,id:notice?.id || 'pending:'+p.related_entity_id,status:notice?.status==='read'?'read':'unread',actionable:true};
      });
      const history = notifications.filter((n:any)=>!keys.has(n.type+':'+n.related_entity_id)).map((n:any)=>({...n,actionable:false}));
      return json({success:true,friend_requests:friendRequests,dashboard_invites:dashboardInvites,party_invites:parties,notifications:[...actionable,...history].sort((a,b)=>Date.parse(b.created_date||0)-Date.parse(a.created_date||0))});
    }

    if (action === 'mark_notification_read') {
      const id = String(data.notification_id || '').trim();
      const notice = await svc.SocialNotification.get(id).catch(() => null);
      if (!notice || String(notice.recipient_id) !== String(user.id)) return json({ error: 'Notification not found' }, 404);
      await svc.SocialNotification.update(id, { status: 'read' });
      return json({ success: true });
    }

    return json({ error: 'Unknown social action' }, 400);
  } catch (error) {
    console.error('[socialActions]', error);
    return json({ error: error?.message || 'Social service failed' }, 500);
  }
});