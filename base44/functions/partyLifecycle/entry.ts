import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        const { event, data } = payload;

        if (event.entity_name !== 'Party' || event.type !== 'update') {
            return Response.json({ message: 'Ignored event' });
        }

        const party = data;

        // Auto-expire logic: Delete if empty
        if (!party.members || party.members.length === 0) {
            console.log(`Party ${party.id} is empty. Deleting...`);
            await base44.asServiceRole.entities.Party.delete(party.id);
            return Response.json({ message: `Party ${party.id} deleted (empty)` });
        }

        // Logic to update status based on size could go here too
        // e.g., if full -> status = 'full'

        return Response.json({ message: 'No action taken' });
    } catch (error) {
        console.error('Error in partyLifecycle:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});