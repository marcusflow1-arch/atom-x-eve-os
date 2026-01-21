import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { gameId, clanId } = await req.json();

        if (!gameId) {
            return Response.json({ error: 'gameId is required' }, { status: 400 });
        }

        // 1. Fetch all routes for the game
        // Ideally we would filter in the DB query, but "OR" queries might be limited depending on the backend.
        // If we can't do complex OR, we fetch all for game and filter in memory, or make two queries.
        // Let's try two queries for safety and merge.
        
        // A. Public Routes
        const publicRoutes = await base44.entities.FarmRoute.filter({
            gameId: gameId,
            visibility: 'public'
        });

        let clanRoutes = [];
        // B. Clan Routes (if clanId provided)
        if (clanId) {
            // Verify user is actually in the clan?
            // For now assuming the frontend passes valid context, but strictly we should check membership.
            // Let's check membership if user is authenticated.
            const user = await base44.auth.me();
            if (user) {
                 const membership = await base44.entities.ClanMember.filter({
                     clan_id: clanId,
                     user_id: user.id
                 });
                 
                 if (membership.length > 0) {
                     clanRoutes = await base44.entities.FarmRoute.filter({
                        gameId: gameId,
                        visibility: 'clan',
                        clanId: clanId
                    });
                 }
            }
        }

        // Merge and deduplicate (just in case)
        const allRoutes = [...publicRoutes, ...clanRoutes];
        
        // Sort by created date or something if available? Default is fine.
        
        return Response.json({ routes: allRoutes });

    } catch (error) {
        console.error('getFarmRoutes error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});