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

        // Get IGDB credentials
        const clientId = Deno.env.get("IGDB_CLIENT_ID");
        const clientSecret = Deno.env.get("IGDB_CLIENT_SECRET");
        
        // Get IGDB token
        let igdbToken = null;
        try {
            const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
            });
            const tokenData = await tokenRes.json();
            igdbToken = tokenData.access_token;
        } catch (e) {
            console.error("Failed to get IGDB token:", e);
        }

        for (const game of chunk) {
            try {
                let imageUrl = null;
                
                // Strategy 1: Try IGDB first (most reliable for game cover art)
                if (igdbToken) {
                    try {
                        const igdbQuery = `search "${game.title}"; fields name, cover.url; limit 1;`;
                        const igdbRes = await fetch('https://api.igdb.com/v4/games', {
                            method: 'POST',
                            headers: {
                                'Client-ID': clientId,
                                'Authorization': `Bearer ${igdbToken}`,
                                'Content-Type': 'text/plain'
                            },
                            body: igdbQuery
                        });
                        const igdbData = await igdbRes.json();
                        
                        if (igdbData.length > 0 && igdbData[0].cover?.url) {
                            imageUrl = `https:${igdbData[0].cover.url.replace('t_thumb', 't_cover_big')}`;
                            console.log(`Found IGDB image for ${game.title}`);
                        }
                    } catch (e) {
                        console.log(`IGDB lookup failed for ${game.title}:`, e.message);
                    }
                }
                
                // Strategy 2: If IGDB fails, use grounded search
                if (!imageUrl) {
                    const llmResponse = await base44.integrations.Core.InvokeLLM({
                        prompt: `Find the official box art/cover image for the game "${game.title}".
                        
                        CRITICAL REQUIREMENTS:
                        - Must be a DIRECT image URL (ends in .jpg, .png, .webp)
                        - Must be vertical/portrait orientation (cover art)
                        - Prioritize: images.igdb.com, cdn.cloudflare.steamstatic.com, assets.nintendo.com, image.api.playstation.com
                        - Avoid: encrypted-tbn0, googleusercontent, unsplash, base64
                        
                        Return ONLY a working, direct image URL.`,
                        add_context_from_internet: true,
                        response_json_schema: {
                            type: "object",
                            properties: {
                                imageUrl: { type: "string" }
                            }
                        }
                    });
                    imageUrl = llmResponse.imageUrl;
                }

                // Update game with found image
                if (imageUrl && !imageUrl.includes('unsplash.com')) {
                    await base44.entities.Game.update(game.id, {
                        cover_image: imageUrl
                    });
                    results.push({ id: game.id, title: game.title, status: 'fixed', url: imageUrl });
                } else {
                    results.push({ id: game.id, title: game.title, status: 'failed_invalid_url', url: imageUrl });
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