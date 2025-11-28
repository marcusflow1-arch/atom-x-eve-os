import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Fetch all games
        const gamesReq = await base44.entities.Game.list(null, 100);
        const games = gamesReq.data;

        // Fetch all memories and contracts to aggregate
        // Note: Using list with high limit for MVP aggregation. 
        // Production would use database-level aggregation or cached counters.
        const memoriesReq = await base44.entities.Memory.list(null, 1000);
        const contractsReq = await base44.entities.Contract.list(null, 1000);

        const gameStats = games.map(game => {
            // Match by game title (case-insensitive for robustness)
            const relatedMemories = memoriesReq.data.filter(m => 
                m.game_name && m.game_name.toLowerCase() === game.title.toLowerCase()
            );
            const relatedContracts = contractsReq.data.filter(c => 
                c.game_name && c.game_name.toLowerCase() === game.title.toLowerCase()
            );
            
            // Calculate average rating from completed contracts
            const ratedContracts = relatedContracts.filter(c => c.rating && c.rating > 0);
            const avgRating = ratedContracts.length > 0 
                ? ratedContracts.reduce((acc, c) => acc + c.rating, 0) / ratedContracts.length 
                : 0;

            return {
                ...game,
                stats: {
                    memoriesCount: relatedMemories.length,
                    contractsCount: relatedContracts.length,
                    averageRating: parseFloat(avgRating.toFixed(1))
                }
            };
        });

        return Response.json({ data: gameStats });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});