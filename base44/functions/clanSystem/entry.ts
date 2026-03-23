import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

        // --- RESOLVE ENTRY (determine where to send user) ---
        if (action === 'resolve_entry') {
            // Check if the user is a member of any clan
            const myMemberships = await base44.entities.ClanMember.filter({ user_id: user.id });
            if (!myMemberships || myMemberships.length === 0) {
                return new Response(JSON.stringify({ state: 'intro' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            // Prefer the most recently updated membership if multiple
            let selected = myMemberships[0];
            try {
                selected = myMemberships.sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date))[0];
            } catch (_) {}

            return new Response(JSON.stringify({ state: 'clan', clanId: selected.clan_id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- CREATE CLAN ---
        if (action === 'create_clan') {
            const { 
                name, tag, motto, description, 
                playstyles, genres, gameTags, activities, 
                icon, banner, primaryColor, secondaryColor, 
                recruitmentStatus, sizeLimit, customRoles, 
                searchTags, enableStronghold, clanAchievements 
            } = data;
            
            if (!name || name.trim().length === 0) {
                return new Response(JSON.stringify({ success: false, error: 'Clan name is required' }), { 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            const newDivision = await base44.asServiceRole.entities.Division.create({
                name: name.trim(),
                tag: tag || '',
                motto: motto || '',
                description: description || '',
                leaderId: user.id,
                playstyles: playstyles || [],
                genres: genres || [],
                gameTags: gameTags || [],
                activities: activities || [],
                icon: icon || '',
                banner: banner || '',
                primaryColor: primaryColor || '#000000',
                secondaryColor: secondaryColor || '#000000',
                recruitmentStatus: recruitmentStatus || 'Public',
                sizeLimit: parseInt(sizeLimit) || 100,
                isPrivate: recruitmentStatus === 'Invite Only' || recruitmentStatus === 'Request to Join',
                customRoles: customRoles || [],
                searchTags: searchTags || [],
                enableStronghold: enableStronghold || false,
                clanAchievements: clanAchievements || [],
                level: 1,
                xp: 0,
                reputation: 0,
                memberCount: 1
            });

            // Ensure membership is created before returning success
            const membership = await base44.asServiceRole.entities.ClanMember.create({
                clan_id: newDivision.id,
                user_id: user.id,
                role: 'leader',
                joined_at: new Date().toISOString()
            });

            // Create default global chat channel "Adam X Eve" for every new clan
            await base44.asServiceRole.entities.ClanChannel.create({
                divisionId: newDivision.id,
                name: 'adam-x-eve',
                type: 'text',
                position: 0
            });

            return new Response(JSON.stringify({ success: true, clanId: newDivision.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- INVITE MEMBER ---
        if (action === 'invite_member') {
            const { divisionId, inviteeEmail } = data;

            // Verify permissions (leader/officer)
            const actor = await base44.entities.ClanMember.filter({ clan_id: divisionId, user_id: user.id });
            if (!actor.length || (actor[0].role !== 'leader' && actor[0].role !== 'officer')) {
                 return new Response(JSON.stringify({ error: 'Not authorized to invite' }), { status: 403, headers: corsHeaders });
            }
            
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

            // Verify clan membership
            const member = await base44.entities.ClanMember.filter({ divisionId: event.divisionId, userId: user.id });
            if (!member.length) {
                return new Response(JSON.stringify({ error: 'Must be a clan member to join event' }), { status: 403, headers: corsHeaders });
            }

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
            const member = await base44.entities.ClanMember.filter({ clan_id: divisionId, user_id: user.id });
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
            const member = await base44.entities.ClanMember.filter({ clan_id: divisionId, user_id: user.id });
            if (!member.length || member[0].role !== 'leader') {
                 return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403, headers: corsHeaders });
            }

            // Delete Division (Cascading deletes would ideally be handled, but for now we just delete the main record)
            // In a real app, we'd delete all members, messages, channels, etc.
            await base44.entities.Division.delete(divisionId);
            
            // Clean up members
            const members = await base44.entities.ClanMember.filter({ clan_id: divisionId });
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
             const member = await base44.entities.ClanMember.filter({ clan_id: divisionId, user_id: user.id });
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

        // --- JOIN CLAN ---
        if (action === 'join_clan') {
            const { divisionId } = data;
            
            if (!divisionId) {
                return new Response(JSON.stringify({ success: false, error: 'Division ID is required' }), { 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }
            
            const division = await base44.asServiceRole.entities.Division.get(divisionId);
            if (!division) {
                return new Response(JSON.stringify({ success: false, error: 'Clan not found' }), { 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            // Check if already a member
            const existingMember = await base44.asServiceRole.entities.ClanMember.filter({ user_id: user.id, clan_id: divisionId });
            if (existingMember.length > 0) {
                return new Response(JSON.stringify({ success: false, error: 'Already a member' }), { 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            if (division.isPrivate) {
                return new Response(JSON.stringify({ success: false, error: 'Clan is private. Please request to join.' }), { 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            // Ensure membership creation completes before returning
            const membership = await base44.asServiceRole.entities.ClanMember.create({
                clan_id: divisionId,
                user_id: user.id,
                role: 'member',
                joined_at: new Date().toISOString()
            });

            // Ensure default global chat channel exists for this clan
            const defaultChannel = await base44.asServiceRole.entities.ClanChannel.filter({ divisionId, name: 'adam-x-eve' });
            if (defaultChannel.length === 0) {
                await base44.asServiceRole.entities.ClanChannel.create({
                    divisionId,
                    name: 'adam-x-eve',
                    type: 'text',
                    position: 0
                });
            }

            // Update member count (non-blocking but awaited for consistency)
            await base44.asServiceRole.entities.Division.update(divisionId, { memberCount: (division.memberCount || 0) + 1 });

            return new Response(JSON.stringify({ success: true, clanId: divisionId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- REQUEST JOIN (Private Clans) ---
        if (action === 'request_join') {
            const { divisionId, message } = data;
            
            if (!divisionId) {
                return new Response(JSON.stringify({ success: false, error: 'Division ID is required' }), { 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }
            
            const division = await base44.asServiceRole.entities.Division.get(divisionId);
            if (!division) {
                return new Response(JSON.stringify({ success: false, error: 'Clan not found' }), { 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            // Check if already a member
            const existingMember = await base44.asServiceRole.entities.ClanMember.filter({ user_id: user.id, clan_id: divisionId });
            if (existingMember.length > 0) {
                return new Response(JSON.stringify({ success: false, error: 'Already a member' }), { 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            // Check if already pending
            const existingApp = await base44.asServiceRole.entities.ClanApplication.filter({ userId: user.id, divisionId, status: 'pending' });
            if (existingApp.length > 0) {
                return new Response(JSON.stringify({ success: false, error: 'Application already pending' }), { 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            await base44.asServiceRole.entities.ClanApplication.create({
                divisionId,
                userId: user.id,
                message: message || '',
                status: 'pending',
                createdAt: new Date().toISOString()
            });

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- LEAVE CLAN ---
        if (action === 'leave_clan') {
            const { divisionId } = data;
            
            if (!divisionId) {
                return new Response(JSON.stringify({ success: false, error: 'Division ID is required' }), { 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }
            
            const member = await base44.asServiceRole.entities.ClanMember.filter({ clan_id: divisionId, user_id: user.id });
            if (!member.length) {
                return new Response(JSON.stringify({ success: false, error: 'Not a member' }), { 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            if (member[0].role === 'leader') {
                return new Response(JSON.stringify({ success: false, error: 'Leader cannot leave. Transfer ownership or dismantle clan.' }), { 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                });
            }

            await base44.asServiceRole.entities.ClanMember.delete(member[0].id);

            // Update member count
            const division = await base44.asServiceRole.entities.Division.get(divisionId);
            if (division) {
                await base44.asServiceRole.entities.Division.update(divisionId, { memberCount: Math.max(0, (division.memberCount || 1) - 1) });
            }

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- KICK MEMBER ---
        if (action === 'kick_member') {
            const { divisionId, targetUserId } = data;

            // Verify permissions (leader/officer)
            const actor = await base44.entities.ClanMember.filter({ clan_id: divisionId, user_id: user.id });
            if (!actor.length || (actor[0].role !== 'leader' && actor[0].role !== 'officer')) {
                 return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403, headers: corsHeaders });
            }

            const target = await base44.entities.ClanMember.filter({ clan_id: divisionId, user_id: targetUserId });
            if (!target.length) {
                return new Response(JSON.stringify({ error: 'Target not found' }), { status: 404, headers: corsHeaders });
            }

            // Cannot kick leader
            if (target[0].role === 'leader') {
                return new Response(JSON.stringify({ error: 'Cannot kick leader' }), { status: 403, headers: corsHeaders });
            }

            // Officer cannot kick officer
            if (actor[0].role === 'officer' && target[0].role === 'officer') {
                return new Response(JSON.stringify({ error: 'Officers cannot kick other officers' }), { status: 403, headers: corsHeaders });
            }

            await base44.entities.ClanMember.delete(target[0].id);

            // Update member count
            const division = await base44.entities.Division.get(divisionId);
            if (division) {
                await base44.entities.Division.update(divisionId, { memberCount: Math.max(0, (division.memberCount || 1) - 1) });
            }

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- PROMOTE / DEMOTE MEMBER ---
        if (action === 'promote_member') {
            const { divisionId, targetUserId, newRole } = data; // newRole: 'officer' or 'member'

            // Verify permissions (leader only)
            const actor = await base44.entities.ClanMember.filter({ clan_id: divisionId, user_id: user.id });
            if (!actor.length || actor[0].role !== 'leader') {
                 return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403, headers: corsHeaders });
            }

            const target = await base44.entities.ClanMember.filter({ clan_id: divisionId, user_id: targetUserId });
            if (!target.length) {
                return new Response(JSON.stringify({ error: 'Target not found' }), { status: 404, headers: corsHeaders });
            }

            if (target[0].role === 'leader') {
                 return new Response(JSON.stringify({ error: 'Cannot change leader role this way' }), { status: 400, headers: corsHeaders });
            }

            await base44.entities.ClanMember.update(target[0].id, { role: newRole });

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- MODERATION: DELETE MESSAGE ---
        if (action === 'delete_message') {
            const { messageId } = data;
            const message = await base44.entities.ClanMessage.get(messageId);
            if (!message) return new Response(JSON.stringify({ error: 'Message not found' }), { status: 404, headers: corsHeaders });

            // If own message, allow delete. If not, check Officer+
            if (message.author !== user.id) {
                const actor = await base44.entities.ClanMember.filter({ clan_id: message.divisionId, user_id: user.id });
                if (!actor.length || (actor[0].role !== 'leader' && actor[0].role !== 'officer')) {
                    return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403, headers: corsHeaders });
                }
            }

            await base44.entities.ClanMessage.delete(messageId);
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- MODERATION: MUTE MEMBER (Using ModerationAction entity) ---
        if (action === 'mute_member') {
            const { divisionId, targetUserId, durationMinutes, reason } = data;
            
            const actor = await base44.entities.ClanMember.filter({ clan_id: divisionId, user_id: user.id });
            if (!actor.length || (actor[0].role !== 'leader' && actor[0].role !== 'officer')) {
                 return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403, headers: corsHeaders });
            }

            // Create Moderation Action
            await base44.entities.ModerationAction.create({
                type: 'mute',
                target_user_id: targetUserId,
                moderator_id: user.id,
                scope_type: 'clan',
                scope_id: divisionId,
                reason: reason || 'Violation of clan rules',
                expires_at: new Date(Date.now() + (durationMinutes || 60) * 60000).toISOString()
            });

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