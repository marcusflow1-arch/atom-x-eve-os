import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, friend_id, friend_email } = await req.json();

    if (action === 'invite') {
      // Invite friend to Lunar Dashboard
      // This creates a record linking the friend to user's lunar dashboard
      const lunarInvite = await base44.entities.Friend.create({
        user_id: user.id,
        friend_id: friend_id,
        friend_email: friend_email,
        lunar_dashboard_invited: true,
        lunar_dashboard_invite_date: new Date().toISOString()
      });

      // Also send platform invite if email provided
      if (friend_email) {
        try {
          await base44.auth.inviteUser(friend_email, 'user');
        } catch (inviteErr) {
          console.log('Platform invite may already exist:', inviteErr);
        }
      }

      return Response.json({ 
        success: true, 
        message: 'Lunar Dashboard invitation sent!',
        invite: lunarInvite 
      });

    } else if (action === 'join') {
      // Join friend's Lunar Dashboard
      // This creates a record that user has joined friend's dashboard
      const joinRecord = await base44.entities.Friend.create({
        user_id: user.id,
        friend_id: friend_id,
        lunar_dashboard_joined: true,
        lunar_dashboard_join_date: new Date().toISOString()
      });

      return Response.json({ 
        success: true, 
        message: 'Joined Lunar Dashboard!',
        join: joinRecord 
      });

    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});