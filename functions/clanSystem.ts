import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const base44 = createClientFromRequest(req);
        const { action, data } = await req.json();
        const user = await base44.auth.me();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        // --- CREATE CLAN ---
        if (action === 'create_clan') {
            const { name, description, icon, banner, gameTags } = data;
            
            // Check if user is already in a clan (optional rule, but good for simplicity)
            const existingMember = await base44.entities.ClanMember.filter({ userId: user.id });
            if (existingMember.length > 0) {
                 return new Response(JSON.stringify({ error: 'You are already in a clan' }), { status: 400, headers: corsHeaders });
            }

            const newDivision = await base44.entities.Division.create({
                name,
                description,
                leaderId: user.id,
                icon: icon || 'https://via.placeholder.com/150',
                banner: banner || 'https://via.placeholder.com/800x200',
                gameTags: gameTags || [],
                level: 1,
                memberCount: 1
            });

            await base44.entities.ClanMember.create({
                divisionId: newDivision.id,
                userId: user.id,
                role: 'leader',
                joinedAt: new Date().toISOString()
            });

            return new Response(JSON.stringify({ success: true, division: newDivision }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- INVITE MEMBER ---
        if (action === 'invite_member') {
            const { divisionId, inviteeEmail } = data;
            
            // Resolve email to ID
            const users = await base44.asServiceRole.entities.User.filter({ email: inviteeEmail });
            if (users.length === 0) {
                 return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: corsHeaders });
            }
            const invitee = users[0];

            // Check if already invited or member
            const existingInvite = await base44.entities.ClanInvite.filter({ divisionId, inviteeId: invitee.id, status: 'pending' });
            if (existingInvite.length > 0) {
                return new Response(JSON.stringify({ error: 'Invite already pending' }), { status: 400, headers: corsHeaders });
            }
            
            // Create Invite
            await base44.entities.ClanInvite.create({
                divisionId,
                inviterId: user.id,
                inviteeId: invitee.id,
                status: 'pending',
                createdAt: new Date().toISOString()
            });

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- JOIN EVENT ---
        if (action === 'join_event') {
            const { eventId } = data;
            const event = await base44.entities.ClanEvent.get(eventId);
            if (!event) return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404, headers: corsHeaders });

            let participants = event.participants || [];
            if (participants.includes(user.id)) {
                return new Response(JSON.stringify({ error: 'Already joined' }), { status: 400, headers: corsHeaders });
            }
            
            if (participants.length >= event.maxParticipants) {
                 return new Response(JSON.stringify({ error: 'Event full' }), { status: 400, headers: corsHeaders });
            }

            participants.push(user.id);
            await base44.entities.ClanEvent.update(eventId, { participants });

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- UPDATE CLAN ---
        if (action === 'update_clan') {
            const { divisionId, updates } = data;
            
            // Verify user is leader
            const member = await base44.entities.ClanMember.filter({ divisionId, userId: user.id });
            if (!member.length || member[0].role !== 'leader') {
                 return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403, headers: corsHeaders });
            }

            await base44.entities.Division.update(divisionId, updates);
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- DELETE CLAN ---
        if (action === 'delete_clan') {
            const { divisionId } = data;
             // Verify user is leader
            const member = await base44.entities.ClanMember.filter({ divisionId, userId: user.id });
            if (!member.length || member[0].role !== 'leader') {
                 return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403, headers: corsHeaders });
            }

            // Delete Division (Cascading deletes would ideally be handled, but for now we just delete the main record)
            // In a real app, we'd delete all members, messages, channels, etc.
            await base44.entities.Division.delete(divisionId);
            
            // Clean up members
            const members = await base44.entities.ClanMember.filter({ divisionId });
            for(const m of members) {
                await base44.entities.ClanMember.delete(m.id);
            }

            // Clean up channels
            const channels = await base44.entities.ClanChannel.filter({ divisionId });
            for(const c of channels) {
                await base44.entities.ClanChannel.delete(c.id);
            }

            // Clean up messages (optional, might be too many to delete one by one without bulk delete)
            // For now, let's leave messages or delete a batch. 
            // In a real production app, we'd use a cascade delete or a background job.
            // Let's delete at least the recent ones to be tidy.
            const messages = await base44.entities.ClanMessage.filter({ divisionId });
            for(const msg of messages) {
                await base44.entities.ClanMessage.delete(msg.id);
            }

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- CREATE CHANNEL ---
        if (action === 'create_channel') {
             const { divisionId, name, type } = data;
             // Verify permissions (leader/officer)
             const member = await base44.entities.ClanMember.filter({ divisionId, userId: user.id });
             if (!member.length || (member[0].role !== 'leader' && member[0].role !== 'officer')) {
                  return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403, headers: corsHeaders });
             }

             const newChannel = await base44.entities.ClanChannel.create({
                 divisionId,
                 name: name.toLowerCase().replace(/\s+/g, '-'), // Discord style slugs
                 type: type || 'text',
                 position: 0 // Simplification
             });
             
             return new Response(JSON.stringify({ success: true, channel: newChannel }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });

    } catch (error) {
        console.error("Clan function error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});