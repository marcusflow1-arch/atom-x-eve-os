import { base44 } from '@/api/base44Client';

export async function lunarDashboardInvite({ action, friend_id }) {
  const me = await base44.auth.me();
  const targetId = String(friend_id || '').trim();
  if (!me?.id || !targetId || targetId === String(me.id)) {
    throw new Error('A valid dashboard player is required.');
  }

  const isInvite = action === 'invite';
  const isJoin = action === 'join';
  if (!isInvite && !isJoin) throw new Error(`Unsupported dashboard action: ${action}`);

  const request = {
    request_type: isInvite ? 'invite' : 'join_request',
    requester_id: me.id,
    requester_name: me.full_name || me.username || me.email?.split('@')?.[0] || 'Player',
    target_user_id: targetId,
    host_user_id: isInvite ? me.id : targetId,
    status: 'pending',
  };

  const existing = await base44.entities.LunarDashboardRequest.filter({
    request_type: request.request_type,
    requester_id: request.requester_id,
    target_user_id: request.target_user_id,
    host_user_id: request.host_user_id,
    status: 'pending',
  });

  const row = (existing || [])[0] || await base44.entities.LunarDashboardRequest.create(request);
  return { data: { success: true, request: row } };
}
