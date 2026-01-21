import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, ...payload } = await req.json();

        // Helper to check clan role
        const checkRole = async (clanId, minRole = 'officer') => {
            const members = await base44.entities.ClanMember.filter({
                clan_id: clanId,
                user_id: user.id
            });
            const member = members[0];
            if (!member) return false;
            
            const roles = { 'member': 1, 'officer': 2, 'leader': 3 };
            return roles[member.role] >= roles[minRole];
        };

        if (action === 'create') {
            const { clanId, gameId, title, description, priority, targetId, targetType, assignedMemberIds, dueDate } = payload;
            
            if (!await checkRole(clanId, 'officer')) {
                return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
            }

            const newAssignment = await base44.entities.Assignment.create({
                clanId,
                gameId,
                title,
                description,
                priority,
                targetId,
                targetType,
                assignedMemberIds: assignedMemberIds || [],
                dueDate,
                status: 'pending',
                auditLog: [{
                    action: 'created',
                    userId: user.id,
                    timestamp: new Date().toISOString(),
                    details: 'Assignment created'
                }]
            });

            // Ensure GameWorkspace exists or is active
            if (gameId) {
                const workspaces = await base44.entities.GameWorkspace.filter({ clan_id: clanId, game_id: gameId });
                if (workspaces.length > 0) {
                    const ws = workspaces[0];
                    // Add to active assignments if not there
                    const currentActive = ws.active_assignment_ids || [];
                    if (!currentActive.includes(newAssignment.id)) {
                        await base44.entities.GameWorkspace.update(ws.id, {
                            active_assignment_ids: [...currentActive, newAssignment.id],
                            last_active_at: new Date().toISOString()
                        });
                    }
                }
            }

            return Response.json(newAssignment);
        }

        if (action === 'respond') {
            const { assignmentId, response } = payload; // accepted, declined
            
            const assignment = await base44.entities.Assignment.get(assignmentId);
            if (!assignment) return Response.json({ error: 'Not found' }, { status: 404 });

            // Check if user is assigned
            if (!assignment.assignedMemberIds.includes(user.id)) {
                // Alternatively, leaders can force status? Let's stick to members responding for this action.
                return Response.json({ error: 'Not assigned to this task' }, { status: 403 });
            }

            const newStatus = response === 'accepted' ? 'accepted' : 'declined';
            
            const updatedAssignment = await base44.entities.Assignment.update(assignmentId, {
                status: newStatus,
                auditLog: [
                    ...(assignment.auditLog || []),
                    {
                        action: response,
                        userId: user.id,
                        timestamp: new Date().toISOString(),
                        details: `User ${response} the assignment`
                    }
                ]
            });

            // If declined, logic to notify leadership could be here (e.g. create a notification entity)
            // For now, the status change is the notification.

            return Response.json(updatedAssignment);
        }

        if (action === 'updateStatus') {
            const { assignmentId, status } = payload;
            const assignment = await base44.entities.Assignment.get(assignmentId);
            if (!assignment) return Response.json({ error: 'Not found' }, { status: 404 });

            // Allow member to complete/start their OWN assignment, or officers to manage all
            let isAllowed = false;
            if (await checkRole(assignment.clanId, 'officer')) {
                isAllowed = true;
            } else if (assignment.assignedMemberIds.includes(user.id)) {
                // Assignee can mark in_progress or completed (or maybe pending if resetting?)
                // Let's allow status changes for assignee
                isAllowed = true;
            }

            if (!isAllowed) {
                 return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
            }

            const updatedAssignment = await base44.entities.Assignment.update(assignmentId, {
                status,
                completedAt: status === 'completed' ? new Date().toISOString() : assignment.completedAt,
                auditLog: [
                    ...(assignment.auditLog || []),
                    {
                        action: 'status_change',
                        userId: user.id,
                        timestamp: new Date().toISOString(),
                        details: `Status changed to ${status}`
                    }
                ]
            });

            return Response.json(updatedAssignment);
        }

        if (action === 'delete') {
            const { assignmentId } = payload;
            const assignment = await base44.entities.Assignment.get(assignmentId);
            if (!assignment) return Response.json({ error: 'Not found' }, { status: 404 });

            if (!await checkRole(assignment.clanId, 'officer')) {
                return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
            }

            await base44.entities.Assignment.delete(assignmentId);
            return Response.json({ success: true });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('manageAssignment error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});