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
                // Use LLM to find image with better targeting
                const llmResponse = await base44.integrations.Core.InvokeLLM({
                    prompt: `Find a high-quality DIRECT IMAGE URL for the official cover art/box art of the game "${game.title}".

                    SEARCH STRATEGY:
                    - Prioritize searching these domains for stable images: steamstatic.com, upload.wikimedia.org, static.wikia.nocookie.net, igdb.com, playstation.com, xbox.com, media.rawg.io.
                    - The URL MUST be a direct link to the image file (ending in .jpg, .jpeg, .png, .webp).
                    - It MUST be the vertical/portrait box art.
                    - Avoid "encrypted-tbn0" or "base64" or "googleusercontent" links if possible as they expire.
                    
                    If you absolutely cannot find a real official image, fallback to generating a URL that you are 100% sure works.

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