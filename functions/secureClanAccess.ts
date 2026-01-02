import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function checkClanMembership(base44, userId, divisionId) {
  const membership = await base44.asServiceRole.entities.ClanMember.filter({
    divisionId,
    userId
  });
  
  return membership && membership.length > 0 ? membership[0] : null;
}

async function isClanLeader(base44, userId, divisionId) {
  const division = await base44.asServiceRole.entities.Division.filter({ id: divisionId });
  return division && division.length > 0 && division[0].leaderId === userId;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { operation, entityType, divisionId, entityId, entityData, filter, limit } = body;
    
    // Validate clan membership for all operations
    if (divisionId && operation !== 'listPublic') {
      const membership = await checkClanMembership(base44, user.id, divisionId);
      
      if (!membership) {
        return Response.json({ error: 'Forbidden: Not a clan member' }, { status: 403 });
      }
    }
    
    let result;
    
    switch (operation) {
      case 'listPublic':
        // Public clan list
        result = await base44.asServiceRole.entities.Division.filter(
          filter || {},
          '-created_date',
          limit || 20
        );
        break;
        
      case 'getMessages':
        // Get clan messages (members only)
        if (!divisionId) {
          return Response.json({ error: 'Division ID required' }, { status: 400 });
        }
        
        // Enforce max limit
        const maxLimit = 100;
        const safeLimit = Math.min(limit || 50, maxLimit);
        
        result = await base44.asServiceRole.entities.ClanMessage.filter(
          { divisionId, channelId: entityData?.channelId || null },
          '-created_date',
          safeLimit
        );
        break;
        
      case 'postMessage':
        // Post message (members only)
        if (!divisionId) {
          return Response.json({ error: 'Division ID required' }, { status: 400 });
        }
        
        result = await base44.asServiceRole.entities.ClanMessage.create({
          ...entityData,
          divisionId,
          author: user.id
        });
        break;
        
      case 'deleteMessage':
        // Delete message (author or leader only)
        if (!entityId) {
          return Response.json({ error: 'Message ID required' }, { status: 400 });
        }
        
        const message = await base44.asServiceRole.entities.ClanMessage.filter({ id: entityId });
        if (!message || message.length === 0) {
          return Response.json({ error: 'Message not found' }, { status: 404 });
        }
        
        const isAuthor = message[0].author === user.id;
        const isLeader = await isClanLeader(base44, user.id, message[0].divisionId);
        
        if (!isAuthor && !isLeader && user.role !== 'admin') {
          return Response.json({ error: 'Forbidden: Cannot delete this message' }, { status: 403 });
        }
        
        result = await base44.asServiceRole.entities.ClanMessage.delete(entityId);
        break;
        
      case 'getMembers':
        // Get clan members
        if (!divisionId) {
          return Response.json({ error: 'Division ID required' }, { status: 400 });
        }
        
        result = await base44.asServiceRole.entities.ClanMember.filter({ divisionId });
        break;
        
      case 'updateClan':
        // Update clan (leader only)
        if (!divisionId) {
          return Response.json({ error: 'Division ID required' }, { status: 400 });
        }
        
        const isLeaderUpdate = await isClanLeader(base44, user.id, divisionId);
        if (!isLeaderUpdate && user.role !== 'admin') {
          return Response.json({ error: 'Forbidden: Only clan leader can update' }, { status: 403 });
        }
        
        result = await base44.asServiceRole.entities.Division.update(divisionId, entityData);
        break;
        
      default:
        return Response.json({ error: 'Invalid operation' }, { status: 400 });
    }
    
    return Response.json({ success: true, data: result });
    
  } catch (error) {
    console.error('Clan Access Error:', error.message);
    return Response.json({ 
      error: 'Operation failed. Please try again.' 
    }, { status: 500 });
  }
});