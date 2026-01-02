import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Entity Access Control Rules
const ACCESS_RULES = {
  // Owner-only entities - must match user_id or created_by
  OWNER_ONLY: [
    'Avatar', 'UserAchievement', 'StreamSettings', 'StreamerProfile',
    'ViewerProfile', 'UserCard', 'UserTask', 'UserNote', 'UserEvent',
    'Loadout', 'AIBehaviorState', 'AIDecisionLog'
  ],
  
  // Public read, owner/admin write
  PUBLIC_READ_RESTRICTED_WRITE: [
    'Post', 'Comment', 'Memory', 'Stream', 'StreamVideo',
    'AchievementGuide', 'Contract', 'TradeOffer'
  ],
  
  // Members-only (clan/guild)
  MEMBERS_ONLY: [
    'ClanMessage', 'ClanChannel', 'ClanEvent', 'ClanQuest',
    'GuildMember', 'GuildResource'
  ],
  
  // Admin-only
  ADMIN_ONLY: [
    'Model3D', 'AnimationFBX', 'ModelFBX', 'Model3DScript',
    'HeroBackground', 'PlatformUpdate', 'AgentJob', 'AgentLog'
  ],
  
  // Public read-only
  PUBLIC_READ_ONLY: [
    'Game', 'Achievement', 'TradingCard', 'CardTemplate',
    'Ability', 'Equipment', 'Companion', 'Item', 'ItemSet'
  ]
};

// Check if user has access to an entity
async function checkEntityAccess(base44, user, entityName, operation, entityId = null, entityData = null) {
  // Admin bypass
  if (user?.role === 'admin') return true;
  
  // Public read-only entities
  if (ACCESS_RULES.PUBLIC_READ_ONLY.includes(entityName)) {
    return operation === 'read';
  }
  
  // Admin-only entities
  if (ACCESS_RULES.ADMIN_ONLY.includes(entityName)) {
    return false;
  }
  
  // Owner-only entities
  if (ACCESS_RULES.OWNER_ONLY.includes(entityName)) {
    if (operation === 'create') return true;
    
    if (entityId && (operation === 'read' || operation === 'update' || operation === 'delete')) {
      const entity = await base44.asServiceRole.entities[entityName].filter({ id: entityId });
      if (!entity || entity.length === 0) return false;
      
      const record = entity[0];
      return record.user_id === user.id || record.created_by === user.email;
    }
    
    return false;
  }
  
  // Public read, restricted write
  if (ACCESS_RULES.PUBLIC_READ_RESTRICTED_WRITE.includes(entityName)) {
    if (operation === 'read') return true;
    
    if (operation === 'create') return true;
    
    if (operation === 'update' || operation === 'delete') {
      const entity = await base44.asServiceRole.entities[entityName].filter({ id: entityId });
      if (!entity || entity.length === 0) return false;
      
      const record = entity[0];
      return record.created_by === user.email || record.user_id === user.id;
    }
  }
  
  // Members-only entities
  if (ACCESS_RULES.MEMBERS_ONLY.includes(entityName)) {
    // Check membership based on entity type
    if (entityName.startsWith('Clan')) {
      const divisionId = entityData?.divisionId || (entityId && (await base44.asServiceRole.entities[entityName].filter({ id: entityId }))?.[0]?.divisionId);
      if (!divisionId) return false;
      
      const membership = await base44.asServiceRole.entities.ClanMember.filter({
        divisionId,
        userId: user.id
      });
      
      return membership && membership.length > 0;
    }
    
    if (entityName.startsWith('Guild')) {
      const guildId = entityData?.guild_id || (entityId && (await base44.asServiceRole.entities[entityName].filter({ id: entityId }))?.[0]?.guild_id);
      if (!guildId) return false;
      
      const membership = await base44.asServiceRole.entities.GuildMember.filter({
        guild_id: guildId,
        user_id: user.id
      });
      
      return membership && membership.length > 0;
    }
  }
  
  return false;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { operation, entityName, entityId, entityData, filter, limit, sort } = body;
    
    // Validate input
    if (!operation || !entityName) {
      return Response.json({ error: 'Invalid parameters' }, { status: 400 });
    }
    
    // Check access
    const hasAccess = await checkEntityAccess(base44, user, entityName, operation, entityId, entityData);
    
    if (!hasAccess) {
      return Response.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }
    
    let result;
    
    switch (operation) {
      case 'read':
        if (entityId) {
          result = await base44.asServiceRole.entities[entityName].filter({ id: entityId });
        } else {
          // Apply user scoping to filter
          let scopedFilter = { ...filter };
          
          // For owner-only entities, always scope to current user
          if (ACCESS_RULES.OWNER_ONLY.includes(entityName)) {
            scopedFilter = { 
              ...scopedFilter,
              $or: [
                { user_id: user.id },
                { created_by: user.email }
              ]
            };
          }
          
          // Enforce max limit
          const maxLimit = 100;
          const safeLimit = Math.min(limit || 50, maxLimit);
          
          result = await base44.asServiceRole.entities[entityName].filter(
            scopedFilter,
            sort || '-created_date',
            safeLimit
          );
        }
        break;
        
      case 'create':
        // Auto-inject user_id/created_by
        const createData = {
          ...entityData,
          user_id: user.id,
          created_by: user.email
        };
        result = await base44.asServiceRole.entities[entityName].create(createData);
        break;
        
      case 'update':
        if (!entityId) {
          return Response.json({ error: 'Entity ID required for update' }, { status: 400 });
        }
        result = await base44.asServiceRole.entities[entityName].update(entityId, entityData);
        break;
        
      case 'delete':
        if (!entityId) {
          return Response.json({ error: 'Entity ID required for delete' }, { status: 400 });
        }
        result = await base44.asServiceRole.entities[entityName].delete(entityId);
        break;
        
      default:
        return Response.json({ error: 'Invalid operation' }, { status: 400 });
    }
    
    return Response.json({ success: true, data: result });
    
  } catch (error) {
    console.error('Entity Access Error:', error.message);
    return Response.json({ 
      error: 'Operation failed. Please try again.' 
    }, { status: 500 });
  }
});