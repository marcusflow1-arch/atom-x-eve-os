import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, friend_id } = await req.json();

    if (action === 'invite') {
      const request = await base44.entities.LunarDashboardRequest.create({
        request_type: 'invite',
        requester_id: user.id,
        requester_name: user.full_name || user.email || 'A friend',
        target_user_id: friend_id,
        host_user_id: user.id,
        status: 'pending'
      });

      return Response.json({
        success: true,
        message: 'Lunar Dashboard invitation sent!',
        request
      });

    } else if (action === 'join') {
      const request = await base44.entities.LunarDashboardRequest.create({
        request_type: 'join_request',
        requester_id: user.id,
        requester_name: user.full_name || user.email || 'A friend',
        target_user_id: friend_id,
        host_user_id: friend_id,
        status: 'pending'
      });

      return Response.json({
        success: true,
        message: 'Join request sent!',
        request
      });

    } else if (action === 'respond') {
      const { request_id, decision } = await req.json();
      const requests = await base44.entities.LunarDashboardRequest.filter({ id: request_id, target_user_id: user.id });
      const request = requests[0];

      if (!request) {
        return Response.json({ error: 'Request not found' }, { status: 404 });
      }

      const updated = await base44.entities.LunarDashboardRequest.update(request.id, {
        status: decision === 'accept' ? 'accepted' : 'declined'
      });

      return Response.json({ success: true, request: updated });

    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});