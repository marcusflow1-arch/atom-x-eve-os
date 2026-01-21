import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This function is intended to be called by an Entity Automation
        // Payload: { event: { type, entity_name, entity_id }, data: { ... } }
        const payload = await req.json();
        const { event, data } = payload;

        if (event.entity_name !== 'VoiceRoom' || event.type !== 'update') {
            return Response.json({ message: 'Ignored event' });
        }

        const room = data;

        // Auto-destroy logic
        if (room.isTemporary && (!room.participants || room.participants.length === 0)) {
            console.log(`VoiceRoom ${room.id} is empty and temporary. Deleting...`);
            
            // Use service role to delete as it's a system action
            await base44.asServiceRole.entities.VoiceRoom.delete(room.id);
            
            return Response.json({ message: `VoiceRoom ${room.id} deleted` });
        }

        return Response.json({ message: 'No action taken' });
    } catch (error) {
        console.error('Error in voiceRoomLifecycle:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});