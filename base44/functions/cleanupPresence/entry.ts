import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Find users marked online
        // Note: Filter might need pagination if many users, keeping simple for now
        const onlineUsers = await base44.asServiceRole.entities.User.filter({
            presence_status: 'online'
        }, 100);

        const now = new Date();
        const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

        let cleanedCount = 0;

        for (const user of onlineUsers) {
            const lastSeen = new Date(user.last_seen || 0);
            if (now - lastSeen > TIMEOUT_MS) {
                console.log(`Cleaning up stale user: ${user.id} (${user.email})`);
                
                // 1. Mark Offline
                // We can't use auth.updateMe for other users, use entity update via service role?
                // User entity is special. Usually strictly protected.
                // However, the instructions say "Regular users can only view and update their own user record."
                // "Security rules are automatically enforced and cannot be overridden."
                // THIS IS A PROBLEM for the cleanup script if it can't update other users.
                // But `base44.asServiceRole` usually bypasses RLS?
                // "Use service role (base44.asServiceRole) only when necessary for admin-level operations...".
                // I'll try to update the user via service role. If `User` entity blocks even service role, I might need another approach (e.g. `UserStatus` side entity), but usually service role works.
                
                // Wait, "CRUCIAL: The User entity has special built-in security rules...". 
                // It says "only allow admin users to list, update, or delete other users".
                // `asServiceRole` typically acts as admin or superuser. 
                // So if the function uses `asServiceRole`, it should work if it mimics an admin.
                
                // But let's assume `asServiceRole` works.
                // NOTE: `base44.asServiceRole.entities.User` is the way.
                
                try {
                    // Update User Status
                    // Note: 'current_activity' nulling might need to be careful not to break schema if strictly typed, but it's an object/null.
                    await base44.asServiceRole.entities.User.update(user.id, {
                        presence_status: 'offline',
                        current_activity: null
                    });

                    // 2. Clean up GameWorkspace
                    if (user.current_activity?.workspaceId) {
                        const ws = await base44.asServiceRole.entities.GameWorkspace.get(user.current_activity.workspaceId);
                        if (ws) {
                            const newActive = (ws.active_member_ids || []).filter(id => id !== user.id);
                            await base44.asServiceRole.entities.GameWorkspace.update(ws.id, { active_member_ids: newActive });
                        }
                    }

                    // 3. Clean up VoiceRoom
                    if (user.current_activity?.voiceRoomId) {
                        const room = await base44.asServiceRole.entities.VoiceRoom.get(user.current_activity.voiceRoomId);
                        if (room) {
                            const newParticipants = (room.participants || []).filter(p => p !== user.id && p.id !== user.id); // Handle both ID strings and objects if structure varies
                            // Actually VoiceRoom.participants is array of strings in schema.
                            await base44.asServiceRole.entities.VoiceRoom.update(room.id, { participants: newParticipants });
                        }
                    }

                     // 4. Clean up Party
                    if (user.current_activity?.partyId) {
                        const party = await base44.asServiceRole.entities.Party.get(user.current_activity.partyId);
                        if (party) {
                            const newMembers = (party.members || []).filter(id => id !== user.id);
                            await base44.asServiceRole.entities.Party.update(party.id, { members: newMembers });
                            // Note: The 'partyLifecycle' automation will handle deletion if it becomes empty on update
                        }
                    }

                    cleanedCount++;
                } catch (e) {
                    console.error(`Failed to cleanup user ${user.id}:`, e);
                }
            }
        }

        return Response.json({ success: true, cleaned: cleanedCount });
    } catch (error) {
        console.error('cleanupPresence error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});