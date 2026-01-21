import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // 1. Cleanup Inactive Game Workspaces
        // Criteria: Active status, no active members, last active > 24h ago
        const staleWorkspaces = await base44.asServiceRole.entities.GameWorkspace.filter({
            status: 'active'
        });

        const now = new Date();
        const WORKSPACE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

        let archivedWorkspaces = 0;

        for (const ws of staleWorkspaces) {
            const isEmpty = !ws.active_member_ids || ws.active_member_ids.length === 0;
            const lastActive = new Date(ws.last_active_at || ws.updated_date || 0);
            
            if (isEmpty && (now - lastActive > WORKSPACE_TIMEOUT)) {
                await base44.asServiceRole.entities.GameWorkspace.update(ws.id, {
                    status: 'inactive'
                });
                archivedWorkspaces++;
            }
        }

        // 2. Cleanup Zombie Parties
        // Criteria: Active/Forming status, last active > 24h ago
        // (Even if they have members, if no update in 24h, they are likely dead)
        const staleParties = await base44.asServiceRole.entities.Party.filter({
            status: { $in: ['forming', 'active', 'full'] }
        });

        const PARTY_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
        let closedParties = 0;

        for (const party of staleParties) {
            const lastActive = new Date(party.lastActive || party.updated_date || 0);
            
            if (now - lastActive > PARTY_TIMEOUT) {
                // Mark as completed instead of deleting to keep history, or delete? 
                // Let's mark completed to be safe.
                await base44.asServiceRole.entities.Party.update(party.id, {
                    status: 'completed',
                    members: [] // Force empty members
                });
                closedParties++;
            }
        }

        return Response.json({ 
            success: true, 
            archivedWorkspaces, 
            closedParties 
        });

    } catch (error) {
        console.error('cleanupSystem error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});