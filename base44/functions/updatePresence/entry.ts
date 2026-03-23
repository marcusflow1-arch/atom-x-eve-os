import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { status, activity } = await req.json();
        
        // 1. Prepare User Update
        const updates = {
            last_seen: new Date().toISOString()
        };
        if (status) updates.presence_status = status;
        if (activity) updates.current_activity = activity;

        const oldActivity = user.current_activity || {};
        const newActivity = activity || oldActivity;

        // 2. Update User
        await base44.auth.updateMe(updates);

        // 3. Side Effects: Game Workspace Tracking
        // If workspace changed, update the workspace entity's active list
        if (oldActivity.workspaceId !== newActivity.workspaceId) {
            
            // Remove from old
            if (oldActivity.workspaceId) {
                const oldWs = await base44.entities.GameWorkspace.get(oldActivity.workspaceId);
                if (oldWs) {
                    const newActive = (oldWs.active_member_ids || []).filter(id => id !== user.id);
                    await base44.entities.GameWorkspace.update(oldWs.id, { active_member_ids: newActive });
                }
            }

            // Add to new
            if (newActivity.workspaceId) {
                const newWs = await base44.entities.GameWorkspace.get(newActivity.workspaceId);
                if (newWs) {
                    const currentActive = newWs.active_member_ids || [];
                    if (!currentActive.includes(user.id)) {
                        await base44.entities.GameWorkspace.update(newWs.id, { 
                            active_member_ids: [...currentActive, user.id],
                            last_active_at: new Date().toISOString()
                        });
                    }
                }
            }
        }

        // 4. Side Effects: Clan Last Active
        if (newActivity.clanId) {
            const memberRecords = await base44.entities.ClanMember.filter({
                clan_id: newActivity.clanId,
                user_id: user.id
            });
            if (memberRecords.length > 0) {
                await base44.entities.ClanMember.update(memberRecords[0].id, {
                    last_active: new Date().toISOString()
                });
            }
        }

        return Response.json({ success: true });

    } catch (error) {
        console.error('updatePresence error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});