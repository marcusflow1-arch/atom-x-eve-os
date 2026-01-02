import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Admin-only entities
const ADMIN_ENTITIES = [
  'Model3D', 'AnimationFBX', 'ModelFBX', 'Model3DScript',
  'HeroBackground', 'PlatformUpdate', 'AgentJob', 'AgentLog'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Admin check
    if (user.role !== 'admin') {
      return Response.json({ 
        error: 'Forbidden: Admin access required' 
      }, { status: 403 });
    }
    
    const body = await req.json();
    const { operation, entityName, entityId, entityData, filter, limit, sort } = body;
    
    // Validate entity is admin-only
    if (!ADMIN_ENTITIES.includes(entityName)) {
      return Response.json({ error: 'Invalid entity' }, { status: 400 });
    }
    
    let result;
    
    switch (operation) {
      case 'list':
        // Enforce max limit
        const maxLimit = 100;
        const safeLimit = Math.min(limit || 50, maxLimit);
        
        result = await base44.asServiceRole.entities[entityName].filter(
          filter || {},
          sort || '-created_date',
          safeLimit
        );
        break;
        
      case 'get':
        if (!entityId) {
          return Response.json({ error: 'Entity ID required' }, { status: 400 });
        }
        result = await base44.asServiceRole.entities[entityName].filter({ id: entityId });
        break;
        
      case 'create':
        result = await base44.asServiceRole.entities[entityName].create(entityData);
        break;
        
      case 'update':
        if (!entityId) {
          return Response.json({ error: 'Entity ID required' }, { status: 400 });
        }
        result = await base44.asServiceRole.entities[entityName].update(entityId, entityData);
        break;
        
      case 'delete':
        if (!entityId) {
          return Response.json({ error: 'Entity ID required' }, { status: 400 });
        }
        result = await base44.asServiceRole.entities[entityName].delete(entityId);
        break;
        
      default:
        return Response.json({ error: 'Invalid operation' }, { status: 400 });
    }
    
    // Log admin action
    console.log(`Admin Action - User: ${user.email}, Entity: ${entityName}, Operation: ${operation}`);
    
    return Response.json({ success: true, data: result });
    
  } catch (error) {
    console.error('Admin Access Error:', error.message);
    return Response.json({ 
      error: 'Operation failed. Please try again.' 
    }, { status: 500 });
  }
});