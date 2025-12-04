import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { game_id, settings } = await req.json();

        if (!game_id) {
            return Response.json({ error: 'Game ID is required' }, { status: 400 });
        }

        // Check if game is owned/installed (optional validation)
        const ownership = await base44.entities.UserGame.filter({ user_id: user.id, game_id });
        if (ownership.length === 0) {
             // Allow streaming if it's a shared library or just warn
        }

        // Create Session
        const session = await base44.entities.RemotePlaySession.create({
            user_id: user.id,
            game_id: game_id,
            status: 'initializing',
            quality_settings: settings || { resolution: '1080p', framerate: 60, bitrate_mbps: 10 },
            host_device_name: 'My PC', // In real app, select from registered devices
            started_at: new Date().toISOString()
        });

        // Simulate connection delay for demo
        // In real app, this would trigger the desktop host to start capturing
        
        return Response.json({ success: true, session });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});