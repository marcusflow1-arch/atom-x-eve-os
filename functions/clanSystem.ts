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

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });

    } catch (error) {
        console.error("Clan function error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});