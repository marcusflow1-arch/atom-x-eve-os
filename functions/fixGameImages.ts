import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get all games
        const games = await base44.entities.Game.list({ limit: 100 }); // Fetch up to 100 games

        // 2. Identify games to fix
        // We look for games with no image, empty image, or placeholder/unsplash images
        const gamesToFix = games.filter(g => 
            !g.cover_image || 
            g.cover_image === '' || 
            g.cover_image.includes('unsplash.com')
        );

        if (gamesToFix.length === 0) {
             return Response.json({ 
                 message: "No games found that need image fixing.", 
                 fixedCount: 0,
                 remaining: 0
            });
        }

        // 3. Fix a batch (limit to 5 to prevent timeouts)
        const BATCH_SIZE = 5;
        const chunk = gamesToFix.slice(0, BATCH_SIZE);
        const results = [];
        
        console.log(`Found ${gamesToFix.length} games to fix. Processing batch of ${chunk.length}...`);

        for (const game of chunk) {
            try {
                // Use LLM to find image
                const llmResponse = await base44.integrations.Core.InvokeLLM({
                    prompt: `Find a direct URL for the official cover art, box art, or main poster for the video game "${game.title}". 
                    
                    CRITICAL INSTRUCTIONS:
                    - The URL must be a direct link to an image file (ending in .jpg, .png, .webp, etc) if possible.
                    - Search for "official cover art ${game.title}".
                    - Prefer vertical/portrait orientation (like a movie poster or box art).
                    - Do not use generic placeholder images.
                    - Do not use Unsplash images.
                    
                    Return the result as a JSON object with the "imageUrl".`,
                    add_context_from_internet: true,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            imageUrl: { type: "string" }
                        },
                        required: ["imageUrl"]
                    }
                });

                if (llmResponse.imageUrl && !llmResponse.imageUrl.includes('unsplash.com')) {
                    await base44.entities.Game.update(game.id, {
                        cover_image: llmResponse.imageUrl
                    });
                    results.push({ id: game.id, title: game.title, status: 'fixed', url: llmResponse.imageUrl });
                } else {
                    results.push({ id: game.id, title: game.title, status: 'failed_invalid_url', url: llmResponse.imageUrl });
                }
            } catch (e) {
                console.error(`Failed to fix ${game.title}:`, e);
                results.push({ id: game.id, title: game.title, status: 'error', error: e.message });
            }
        }

        return Response.json({ 
            message: `Processed ${chunk.length} games.`, 
            remaining: gamesToFix.length - chunk.length,
            results 
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});