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

        // 1. Validate Clan
        if (activity.clanId) {
            const clan = await base44.entities.Clan.get(activity.clanId);
            if (!clan) {
                activity.clanId = null;
                hasChanges = true;
                log.push('Clan not found, cleared');
            }
        }

        // 2. Validate Workspace
        if (activity.workspaceId) {
             const ws = await base44.entities.GameWorkspace.get(activity.workspaceId);
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
            const party = await base44.entities.Party.get(activity.partyId);
            if (!party) {
                activity.partyId = null;
                hasChanges = true;
                log.push('Party not found, cleared');
            } else {
                const members = party.members || [];
                if (!members.includes(user.id)) {
                    // If party exists but I'm not in it -> I was kicked or left.
                    // But if I just disconnected, I might have been removed by cleanup?
                    // If cleanup removed me, I want to rejoin?
                    // Usually parties are stricter. If I'm out, I'm out.
                    // But for "State Recovery", maybe we trust the party entity over the stale user context?
                    // YES. If I'm not in party list, I shouldn't think I am.
                    activity.partyId = null;
                    hasChanges = true;
                    log.push('User not in party member list, cleared context');
                }
            }
        }
        
        // 4. Validate Voice
        if (activity.voiceRoomId) {
             const room = await base44.entities.VoiceRoom.get(activity.voiceRoomId);
             if (!room) {
                 activity.voiceRoomId = null;
                 hasChanges = true;
                 log.push('Voice room not found, cleared');
             }
             // We don't force-add to voice participants here, 
             // because voice requires active WebRTC connection which must be re-established by client.
             // Keeping the ID allows client to attempt auto-rejoin.
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
         return Response.json({ error: error.message }, { status: 500 });
    }
});