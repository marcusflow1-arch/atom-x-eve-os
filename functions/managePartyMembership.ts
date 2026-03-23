import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, partyId, targetUserId } = await req.json();

        if (!partyId || !action) {
            return Response.json({ error: 'Missing partyId or action' }, { status: 400 });
        }

        // Fetch party
        const party = await base44.entities.Party.get(partyId);
        if (!party) {
            return Response.json({ error: 'Party not found' }, { status: 404 });
        }

        let updatedMembers = [...(party.members || [])];
        let newStatus = party.status;
        let presenceUpdate = null;

        switch (action) {
            case 'join':
                if (updatedMembers.includes(user.id)) {
                    return Response.json({ message: 'Already joined', party });
                }
                
                // Verify clan membership for this party
                if (party.clanId) {
                    const clanMembers = await base44.entities.ClanMember.filter({ divisionId: party.clanId, userId: user.id });
                    if (!clanMembers.length) {
                        return Response.json({ error: 'Must be a clan member to join this party' }, { status: 403 });
                    }
                }

                if (updatedMembers.length >= party.maxSize) {
                    return Response.json({ error: 'Party is full' }, { status: 409 });
                }
                updatedMembers.push(user.id);
                
                // Sync presence
                presenceUpdate = {
                    current_activity: { 
                        type: 'party', 
                        id: partyId, 
                        gameId: party.gameId,
                        role: 'member'
                    }
                };
                break;

            case 'leave':
                if (!updatedMembers.includes(user.id)) {
                    return Response.json({ message: 'Not in party' });
                }
                updatedMembers = updatedMembers.filter(id => id !== user.id);
                
                // Sync presence
                presenceUpdate = {
                    current_activity: null
                };
                
                // If leader leaves, either disband or assign new leader
                // For now, if leader leaves, we'll let the auto-expire handle empty party, 
                // or if members remain, we should probably promote someone.
                if (party.leaderId === user.id && updatedMembers.length > 0) {
                    // Promote next member
                    await base44.entities.Party.update(partyId, { leaderId: updatedMembers[0] });
                }
                break;

            case 'kick':
                if (party.leaderId !== user.id) {
                    // Check if officer/leader of clan (Override)
                    // Note: clanSystem uses 'divisionId' for ClanMember.
                    const clanMembers = await base44.entities.ClanMember.filter({ divisionId: party.clanId, userId: user.id });
                    const isOfficer = clanMembers.length > 0 && ['leader', 'officer'].includes(clanMembers[0].role);
                    
                    if (!isOfficer) {
                        return Response.json({ error: 'Only party leader or clan officers can kick' }, { status: 403 });
                    }
                }
                if (!targetUserId) {
                    return Response.json({ error: 'Target user required for kick' }, { status: 400 });
                }
                updatedMembers = updatedMembers.filter(id => id !== targetUserId);
                // Cannot update kicked user's presence easily from here without service role + looking up user
                // We'll skip remote presence update for now, rely on frontend polling/subscription
                break;

            default:
                return Response.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Update Status logic
        if (updatedMembers.length >= party.maxSize) {
            newStatus = 'full';
        } else if (updatedMembers.length === 0) {
            // Will be cleaned up by automation, but we can mark it
            newStatus = 'completed'; 
        } else {
            // If it was full, now it's forming/active
            newStatus = 'active'; 
        }

        // Apply Party Update
        const updatedParty = await base44.entities.Party.update(partyId, {
            members: updatedMembers,
            status: newStatus,
            lastActive: new Date().toISOString()
        });

        // Apply Presence Update (Self)
        if (presenceUpdate) {
            await base44.auth.updateMe(presenceUpdate);
        }

        return Response.json({ success: true, party: updatedParty });

    } catch (error) {
        console.error('Error managing party:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});