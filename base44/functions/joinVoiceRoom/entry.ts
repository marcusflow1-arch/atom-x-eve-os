import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { roomId } = await req.json();

        if (!roomId) {
            return Response.json({ error: 'Room ID is required' }, { status: 400 });
        }

        // 1. Fetch Room
        const room = await base44.entities.VoiceRoom.get(roomId);
        if (!room) {
            return Response.json({ error: 'Room not found' }, { status: 404 });
        }

        // 2. Fetch Clan Member status to check Role
        const clanMembers = await base44.entities.ClanMember.filter({
            clan_id: room.clanId,
            user_id: user.id
        });
        
        const clanMember = clanMembers[0];
        if (!clanMember) {
             return Response.json({ error: 'Not a member of this clan' }, { status: 403 });
        }

        const roleHierarchy = { 'member': 1, 'officer': 2, 'leader': 3 };
        const userRoleLevel = roleHierarchy[clanMember.role] || 0;
        const requiredRoleLevel = roleHierarchy[room.minRole || 'member'];

        // 3. Permission Checks
        
        // Locked check (Leaders/Officers can bypass lock usually, or maybe just creator/admins. Let's assume Officers+ bypass)
        if (room.isLocked && userRoleLevel < 2) {
             return Response.json({ error: 'Room is locked' }, { status: 403 });
        }

        // Role check
        if (userRoleLevel < requiredRoleLevel) {
            return Response.json({ error: `Requires ${room.minRole} role` }, { status: 403 });
        }

        // Capacity check
        if (room.participants && room.participants.length >= room.maxParticipants) {
             return Response.json({ error: 'Room is full' }, { status: 409 });
        }

        // Assignment check
        if (room.allowedAssignmentId) {
            // Check if user has this assignment
            const assignments = await base44.entities.ClanAssignment.filter({
                id: room.allowedAssignmentId,
                assigneeId: user.id
            });
            // Also need to check if it's an "open" assignment for the clan? 
            // For now assuming direct assignment or checking if the user is linked to it.
            // Simplified: If logic requires user to be explicitly assigned:
            if (assignments.length === 0) {
                 // Check if it's a generic assignment for the clan that the user has accepted?
                 // Let's rely on specific check. If entity ClanAssignment has assigneeId as user.id.
                 // If assigneeId is null (open), then maybe check status? 
                 // Let's assume strict check for now.
                 return Response.json({ error: 'Restricted to assignment participants' }, { status: 403 });
            }
        }

        // 4. Update Presence (Join)
        // Remove user from other rooms in this clan/game first? 
        // For now, just add to this one. The lifecycle function/frontend handles leaving others.
        
        // Add user to participants if not already there
        if (!room.participants.includes(user.id)) {
            const updatedParticipants = [...(room.participants || []), user.id];
            await base44.entities.VoiceRoom.update(roomId, {
                participants: updatedParticipants
            });
        }

        return Response.json({ success: true, roomId });

    } catch (error) {
        console.error('Error joining voice room:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});