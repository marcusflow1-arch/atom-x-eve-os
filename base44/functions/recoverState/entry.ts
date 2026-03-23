import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // If no activity, nothing to recover
        if (!user.current_activity) {
             return Response.json({ restored: false, activity: null });
        }

        const activity = { ...user.current_activity };
        let hasChanges = false;
        const log = [];

        // Safe fetch helper
        const safeGet = async (entityName, id) => {
            try {
                if (!id) return null;
                return await base44.entities[entityName].get(id);
            } catch (e) {
                console.warn(`Failed to fetch ${entityName} ${id}`, e);
                return null;
            }
        };

        // 1. Validate Clan
        if (activity.clanId) {
            const clan = await safeGet('Clan', activity.clanId);
            if (!clan) {
                activity.clanId = null;
                hasChanges = true;
                log.push('Clan not found, cleared');
            }
        }

        // 2. Validate Workspace
        if (activity.workspaceId) {
             const ws = await safeGet('GameWorkspace', activity.workspaceId);
             if (!ws) {
                 activity.workspaceId = null;
                 hasChanges = true;
                 log.push('Workspace not found, cleared');
             } else {
                 // Self-heal: Ensure user is in active list
                 const activeMembers = ws.active_member_ids || [];
                 if (!activeMembers.includes(user.id)) {
                     // Restore presence in workspace
                     await base44.entities.GameWorkspace.update(ws.id, {
                         active_member_ids: [...activeMembers, user.id],
                         last_active_at: new Date().toISOString()
                     });
                     log.push('Restored to workspace member list');
                 }
             }
        }

        // 3. Validate Party
        if (activity.partyId) {
            const party = await safeGet('Party', activity.partyId);
            if (!party) {
                activity.partyId = null;
                hasChanges = true;
                log.push('Party not found, cleared');
            } else {
                const members = party.members || [];
                if (!members.includes(user.id)) {
                    activity.partyId = null;
                    hasChanges = true;
                    log.push('User not in party member list, cleared context');
                }
            }
        }
        
        // 4. Validate Voice
        if (activity.voiceRoomId) {
             const room = await safeGet('VoiceRoom', activity.voiceRoomId);
             if (!room) {
                 activity.voiceRoomId = null;
                 hasChanges = true;
                 log.push('Voice room not found, cleared');
             }
        }

        // Update user if needed or just confirm presence
        const updates = {
            presence_status: 'online',
            last_seen: new Date().toISOString()
        };
        if (hasChanges) {
            updates.current_activity = activity;
        }

        await base44.auth.updateMe(updates);

        return Response.json({ 
            restored: true, 
            activity, 
            changes: log 
        });

    } catch (error) {
         console.error('recoverState error:', error);
         // Don't fail the whole app if recovery fails, just return null activity
         return Response.json({ restored: false, error: error.message });
    }
});