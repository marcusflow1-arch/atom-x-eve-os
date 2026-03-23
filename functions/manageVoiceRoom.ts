import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, ...payload } = await req.json();

        // Helper: Check Role
        const checkRole = async (clanId, minRole = 'officer') => {
            const members = await base44.entities.ClanMember.filter({
                divisionId: clanId, // Legacy field name in Member entity might be 'divisionId' or 'clan_id'. 
                // Context snapshot says 'clan_id'. Let's check both or use 'clan_id' based on schema.
                // Schema says: 'clan_id'. But existing code in clanSystem uses 'divisionId'. 
                // I will use query with both to be safe or check schema reference. 
                // Schema in snapshot for ClanMember says `clan_id`.
                clan_id: clanId,
                user_id: user.id
            });
            
            // Fallback for potential schema mismatch in legacy data
            if (members.length === 0) {
                 const legacyMembers = await base44.entities.ClanMember.filter({
                    divisionId: clanId,
                    userId: user.id
                });
                if (legacyMembers.length > 0) return checkRoleFromMember(legacyMembers[0], minRole);
            }

            const member = members[0];
            if (!member) return false;
            return checkRoleFromMember(member, minRole);
        };

        const checkRoleFromMember = (member, minRole) => {
            const roles = { 'member': 1, 'officer': 2, 'leader': 3 };
            const memberRole = member.role || 'member';
            return (roles[memberRole] || 1) >= (roles[minRole] || 1);
        }

        // --- ACTIONS ---

        // JOIN (Anyone)
        if (action === 'join') {
            const { roomId } = payload;
            const room = await base44.entities.VoiceRoom.get(roomId);
            if (!room) return Response.json({ error: 'Room not found' }, { status: 404 });

            if (room.isLocked) {
                const isAuthorized = await checkRole(room.clanId, 'officer');
                if (!isAuthorized) {
                    return Response.json({ error: 'Room is locked' }, { status: 403 });
                }
            }

            // Add user to participants
            const participants = room.participants || [];
            if (!participants.some(p => p.id === user.id)) {
                participants.push({
                    id: user.id,
                    name: user.username || 'User',
                    speaking: false,
                    muted: false
                });
                await base44.entities.VoiceRoom.update(roomId, { participants });
            }
            return Response.json({ success: true });
        }

        // KICK PARTICIPANT (Officer+)
        if (action === 'kick') {
            const { roomId, targetUserId } = payload;
            const room = await base44.entities.VoiceRoom.get(roomId);
            if (!room) return Response.json({ error: 'Room not found' }, { status: 404 });

            // Allow user to kick themselves (leave)
            if (targetUserId !== user.id) {
                if (!await checkRole(room.clanId, 'officer')) {
                    return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
                }
            }

            const participants = (room.participants || []).filter(p => p.id !== targetUserId);
            
            // Check if room should be deleted (temporary and empty)
            if (room.isTemporary && participants.length === 0) {
                 await base44.entities.VoiceRoom.delete(roomId);
            } else {
                 await base44.entities.VoiceRoom.update(roomId, { participants });
            }
            
            return Response.json({ success: true });
        }

        // MUTE PARTICIPANT (Officer+)
        if (action === 'mute_participant') {
            const { roomId, targetUserId, state } = payload; // state = true/false
            const room = await base44.entities.VoiceRoom.get(roomId);
            if (!room) return Response.json({ error: 'Room not found' }, { status: 404 });

            if (targetUserId !== user.id) {
                if (!await checkRole(room.clanId, 'officer')) {
                    return Response.json({ error: 'Insufficient permissions to mute others' }, { status: 403 });
                }
            }

            const participants = (room.participants || []).map(p => {
                if (p.id === targetUserId) {
                    return { ...p, muted: state };
                }
                return p;
            });
            await base44.entities.VoiceRoom.update(roomId, { participants });
            return Response.json({ success: true });
        }

        // LOCK ROOM (Officer+)
        if (action === 'lock') {
            const { roomId, locked } = payload;
            const room = await base44.entities.VoiceRoom.get(roomId);
            if (!room) return Response.json({ error: 'Room not found' }, { status: 404 });

            if (!await checkRole(room.clanId, 'officer')) {
                return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
            }

            await base44.entities.VoiceRoom.update(roomId, { isLocked: locked });
            return Response.json({ success: true });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('manageVoiceRoom error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});