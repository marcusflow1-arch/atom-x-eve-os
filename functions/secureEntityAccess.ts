import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Helper to check clan membership
async function isClanMember(base44, userId, divisionId) {
  const membership = await base44.asServiceRole.entities.ClanMember.filter({
    divisionId,
    userId
  }, null, 1);
  return membership.length > 0;
}

// Helper to check if user is clan leader/officer
async function hasClanRole(base44, userId, divisionId, requiredRole = 'officer') {
  const membership = await base44.asServiceRole.entities.ClanMember.filter({
    divisionId,
    userId
  }, null, 1);
  
  if (membership.length === 0) return false;
  
  const member = membership[0];
  if (requiredRole === 'leader') {
    return member.role === 'leader';
  }
  return member.role === 'leader' || member.role === 'officer';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, entity, filters, data, entityId } = await req.json();

    // Validate pagination
    const limit = Math.min(filters?.limit || 50, 100);
    const sortBy = filters?.sortBy || '-created_date';

    switch (entity) {
      case 'Avatar':
        return await handleAvatar(base44, user, operation, filters, data, entityId, limit);
      
      case 'UserAchievement':
        return await handleUserAchievement(base44, user, operation, filters, data, limit);
      
      case 'ClanMessage':
        return await handleClanMessage(base44, user, operation, filters, data, entityId, limit, sortBy);
      
      case 'Post':
        return await handlePost(base44, user, operation, filters, data, entityId, limit, sortBy);
      
      case 'TradeOffer':
        return await handleTradeOffer(base44, user, operation, filters, data, entityId, limit, sortBy);
      
      default:
        return Response.json({ error: 'Entity not supported' }, { status: 400 });
    }
  } catch (error) {
    console.error('Entity access error:', error);
    return Response.json({ 
      error: 'Request failed',
      details: Deno.env.get('NODE_ENV') === 'development' ? error.message : undefined
    }, { status: 500 });
  }
});

async function handleAvatar(base44, user, operation, filters, data, entityId, limit) {
  // Avatar is owner-only
  const scopedFilters = { ...filters, user_id: user.id };
  
  switch (operation) {
    case 'read':
      const avatars = await base44.asServiceRole.entities.Avatar.filter(scopedFilters, '-updated_date', limit);
      return Response.json({ success: true, data: avatars });
    
    case 'update':
      if (!entityId) {
        return Response.json({ error: 'Missing entityId' }, { status: 400 });
      }
      
      // Verify ownership
      const existing = await base44.asServiceRole.entities.Avatar.filter({ 
        id: entityId, 
        user_id: user.id 
      }, null, 1);
      
      if (existing.length === 0) {
        return Response.json({ error: 'Not found or access denied' }, { status: 404 });
      }
      
      const updated = await base44.asServiceRole.entities.Avatar.update(entityId, data);
      return Response.json({ success: true, data: updated });
    
    default:
      return Response.json({ error: 'Invalid operation' }, { status: 400 });
  }
}

async function handleUserAchievement(base44, user, operation, filters, data, limit) {
  // UserAchievement is owner-only
  const scopedFilters = { ...filters, user_id: user.id };
  
  if (operation === 'read') {
    const achievements = await base44.asServiceRole.entities.UserAchievement.filter(scopedFilters, '-updated_date', limit);
    return Response.json({ success: true, data: achievements });
  }
  
  return Response.json({ error: 'Invalid operation' }, { status: 400 });
}

async function handleClanMessage(base44, user, operation, filters, data, entityId, limit, sortBy) {
  // Must be clan member to access
  if (!filters.divisionId) {
    return Response.json({ error: 'divisionId required' }, { status: 400 });
  }
  
  const isMember = await isClanMember(base44, user.id, filters.divisionId);
  if (!isMember) {
    return Response.json({ error: 'Not a clan member' }, { status: 403 });
  }
  
  switch (operation) {
    case 'read':
      const messages = await base44.asServiceRole.entities.ClanMessage.filter(
        { divisionId: filters.divisionId },
        sortBy,
        limit
      );
      return Response.json({ success: true, data: messages });
    
    case 'create':
      const newMessage = await base44.asServiceRole.entities.ClanMessage.create({
        ...data,
        divisionId: filters.divisionId,
        author: user.email
      });
      return Response.json({ success: true, data: newMessage });
    
    case 'delete':
      // Only author or clan leader can delete
      const msg = await base44.asServiceRole.entities.ClanMessage.filter({ 
        id: entityId 
      }, null, 1);
      
      if (msg.length === 0) {
        return Response.json({ error: 'Message not found' }, { status: 404 });
      }
      
      const isAuthor = msg[0].author === user.email;
      const isLeader = await hasClanRole(base44, user.id, filters.divisionId, 'leader');
      
      if (!isAuthor && !isLeader) {
        return Response.json({ error: 'Not authorized to delete' }, { status: 403 });
      }
      
      await base44.asServiceRole.entities.ClanMessage.delete(entityId);
      return Response.json({ success: true });
    
    default:
      return Response.json({ error: 'Invalid operation' }, { status: 400 });
  }
}

async function handlePost(base44, user, operation, filters, data, entityId, limit, sortBy) {
  // Posts are public-read, owner-write
  switch (operation) {
    case 'read':
      // Anyone can read posts
      const posts = await base44.asServiceRole.entities.Post.filter(filters, sortBy, limit);
      return Response.json({ success: true, data: posts });
    
    case 'create':
      const newPost = await base44.asServiceRole.entities.Post.create({
        ...data,
        created_by: user.email
      });
      return Response.json({ success: true, data: newPost });
    
    case 'update':
      // Only owner can update
      const existing = await base44.asServiceRole.entities.Post.filter({ 
        id: entityId 
      }, null, 1);
      
      if (existing.length === 0) {
        return Response.json({ error: 'Post not found' }, { status: 404 });
      }
      
      if (existing[0].created_by !== user.email) {
        return Response.json({ error: 'Not authorized' }, { status: 403 });
      }
      
      const updated = await base44.asServiceRole.entities.Post.update(entityId, data);
      return Response.json({ success: true, data: updated });
    
    default:
      return Response.json({ error: 'Invalid operation' }, { status: 400 });
  }
}

async function handleTradeOffer(base44, user, operation, filters, data, entityId, limit, sortBy) {
  // Public read for active offers, owner-only for inactive
  switch (operation) {
    case 'read':
      let offers;
      if (filters.my_offers) {
        // User's own offers
        offers = await base44.asServiceRole.entities.TradeOffer.filter({
          trader_id: user.id
        }, sortBy, limit);
      } else {
        // Public active offers
        offers = await base44.asServiceRole.entities.TradeOffer.filter({
          status: 'active'
        }, sortBy, limit);
      }
      return Response.json({ success: true, data: offers });
    
    case 'create':
      const newOffer = await base44.asServiceRole.entities.TradeOffer.create({
        ...data,
        trader_id: user.id,
        status: 'active'
      });
      return Response.json({ success: true, data: newOffer });
    
    case 'update':
      // Only owner can update
      const existing = await base44.asServiceRole.entities.TradeOffer.filter({ 
        id: entityId,
        trader_id: user.id
      }, null, 1);
      
      if (existing.length === 0) {
        return Response.json({ error: 'Not found or not authorized' }, { status: 404 });
      }
      
      const updated = await base44.asServiceRole.entities.TradeOffer.update(entityId, data);
      return Response.json({ success: true, data: updated });
    
    default:
      return Response.json({ error: 'Invalid operation' }, { status: 400 });
  }
}