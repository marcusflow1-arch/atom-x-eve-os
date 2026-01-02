import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { operation, avatarId, avatarData, targetUserId } = body;
    
    switch (operation) {
      case 'get':
        // Get own avatar
        const avatars = await base44.asServiceRole.entities.Avatar.filter({ user_id: user.id });
        return Response.json({ success: true, data: avatars[0] || null });
        
      case 'getByUserId':
        // Public read of another user's avatar (limited fields)
        if (!targetUserId) {
          return Response.json({ error: 'Target user ID required' }, { status: 400 });
        }
        
        const targetAvatars = await base44.asServiceRole.entities.Avatar.filter({ user_id: targetUserId });
        if (!targetAvatars || targetAvatars.length === 0) {
          return Response.json({ success: true, data: null });
        }
        
        // Return only public fields
        const publicAvatar = {
          id: targetAvatars[0].id,
          name: targetAvatars[0].name,
          level: targetAvatars[0].level,
          gender: targetAvatars[0].gender,
          model_url: targetAvatars[0].model_url,
          skin_tone: targetAvatars[0].skin_tone,
          hair_color: targetAvatars[0].hair_color
        };
        
        return Response.json({ success: true, data: publicAvatar });
        
      case 'create':
        // Ensure user doesn't already have an avatar
        const existing = await base44.asServiceRole.entities.Avatar.filter({ user_id: user.id });
        if (existing && existing.length > 0) {
          return Response.json({ error: 'Avatar already exists' }, { status: 400 });
        }
        
        const newAvatar = await base44.asServiceRole.entities.Avatar.create({
          ...avatarData,
          user_id: user.id
        });
        
        return Response.json({ success: true, data: newAvatar });
        
      case 'update':
        if (!avatarId) {
          return Response.json({ error: 'Avatar ID required' }, { status: 400 });
        }
        
        // Verify ownership
        const avatar = await base44.asServiceRole.entities.Avatar.filter({ id: avatarId });
        if (!avatar || avatar.length === 0 || avatar[0].user_id !== user.id) {
          return Response.json({ error: 'Forbidden: Not your avatar' }, { status: 403 });
        }
        
        const updated = await base44.asServiceRole.entities.Avatar.update(avatarId, avatarData);
        return Response.json({ success: true, data: updated });
        
      default:
        return Response.json({ error: 'Invalid operation' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Avatar Access Error:', error.message);
    return Response.json({ 
      error: 'Operation failed. Please try again.' 
    }, { status: 500 });
  }
});