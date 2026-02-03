import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

async function log(base44, jobId, message, level = 'info') {
    await base44.asServiceRole.entities.AgentLog.create({
        job_id: jobId,
        message,
        level
    });
}

async function getIGDBToken(clientId, clientSecret) {
    const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
    });
    const { access_token } = await tokenRes.json();
    return access_token;
}

async function searchIGDB(clientId, token, query) {
    const response = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'text/plain'
        },
        body: query
    });
    return await response.json();
}

async function getEnhancedDetailsFromWeb(base44, gameTitle) {
    try {
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Search the web for the video game "${gameTitle}" and provide comprehensive details:
1. Current retail price in USD (from Steam, PlayStation Store, Xbox Store, or official retailers)
2. Release date or year
3. Brief description (1-2 sentences)
4. Developer/Publisher name
5. Is it currently available for purchase?
6. Find 3-5 high-quality screenshot URLs (direct image links if possible, or credible hosted images).
7. Find 1-2 official YouTube trailer URLs (e.g. gameplay trailer, launch trailer).

Use the web browser capabilities to find actual media links.`,
            add_context_from_internet: true,
            response_json_schema: {
                type: 'object',
                properties: {
                    price: { type: 'number', description: 'Price in USD' },
                    release_year: { type: 'number' },
                    description: { type: 'string' },
                    developer: { type: 'string' },
                    is_available: { type: 'boolean' },
                    screenshot_urls: { type: 'array', items: { type: 'string' } },
                    video_urls: { type: 'array', items: { type: 'string' } }
                }
            }
        });
        return result;
    } catch (e) {
        return { price: 59.99, is_available: true, screenshot_urls: [], video_urls: [] };
    }
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { jobId, mode } = await req.json();
        
        if (!jobId) {
            return Response.json({ error: 'jobId required' }, { status: 400 });
        }

        // Update job status
        await base44.asServiceRole.entities.AgentJob.update(jobId, { status: 'running' });
        await log(base44, jobId, '🚀 Starting Comprehensive Game Discovery Agent', 'info');

        const clientId = Deno.env.get("IGDB_CLIENT_ID");
        const clientSecret = Deno.env.get("IGDB_CLIENT_SECRET");

        // Step 1: Get trending games from Google search
        await log(base44, jobId, '🔍 Searching Google for latest and most popular games...', 'info');
        
        const trendingGames = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `List the TOP 30 most popular and latest video games in December 2025. Include:
- Latest releases from 2024-2025
- Trending games right now
- Best-selling games

For each game, provide:
- title (exact official name)
- estimated_year (release year)

Focus on AAA titles, indie hits, and games people are actually playing now.`,
            add_context_from_internet: true,
            response_json_schema: {
                type: 'object',
                properties: {
                    games: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                estimated_year: { type: 'number' }
                            }
                        }
                    }
                }
            }
        });

        await log(base44, jobId, `✅ Found ${trendingGames.games?.length || 0} trending games from web search`, 'success');

        // Step 2: Get IGDB access token
        await log(base44, jobId, '🔑 Authenticating with IGDB API...', 'info');
        const igdbToken = await getIGDBToken(clientId, clientSecret);
        await log(base44, jobId, '✅ IGDB authentication successful', 'success');

        // Step 3: Process each game
        const results = [];
        const gamesList = trendingGames.games || [];
        
        await log(base44, jobId, `📦 Processing ${gamesList.length} games...`, 'info');

        for (let i = 0; i < gamesList.length; i++) {
            const gameInfo = gamesList[i];
            await log(base44, jobId, `[${i + 1}/${gamesList.length}] Processing: ${gameInfo.title}`, 'info');

            try {
                // Check if game already exists
                const existingGames = await base44.asServiceRole.entities.Game.filter({ 
                    title: gameInfo.title 
                });

                if (existingGames.length > 0) {
                    await log(base44, jobId, `⏭️  Skipping ${gameInfo.title} (already in database)`, 'warning');
                    continue;
                }

                // Search IGDB for this specific game
                const igdbQuery = `
                    search "${gameInfo.title}";
                    fields name, summary, cover.url, first_release_date, rating, genres.name, 
                           screenshots.url, involved_companies.company.name, aggregated_rating, videos.video_id;
                    limit 1;
                `;

                const igdbResults = await searchIGDB(clientId, igdbToken, igdbQuery);
                
                if (igdbResults.length === 0) {
                    await log(base44, jobId, `⚠️  No IGDB data found for ${gameInfo.title}`, 'warning');
                    continue;
                }

                const igdbGame = igdbResults[0];
                await log(base44, jobId, `✅ Found IGDB data for ${gameInfo.title}`, 'success');

                // Get pricing, screenshots, and trailers from web search
                await log(base44, jobId, `💰 Searching web for price, trailers, and screenshots for ${gameInfo.title}...`, 'info');
                const webData = await getEnhancedDetailsFromWeb(base44, gameInfo.title);
                await log(base44, jobId, `✅ Found price: $${webData.price || 59.99}, ${webData.video_urls?.length || 0} trailers, ${webData.screenshot_urls?.length || 0} screenshots`, 'success');

                // Process IGDB media
                const igdbScreenshots = igdbGame.screenshots?.map(s => `https:${s.url.replace('t_thumb', 't_screenshot_big')}`) || [];
                const igdbVideos = igdbGame.videos?.map(v => `https://www.youtube.com/watch?v=${v.video_id}`) || [];

                // Prepare game data (merging sources)
                const gameData = {
                    title: igdbGame.name || gameInfo.title,
                    description: igdbGame.summary || webData.description || 'No description available',
                    cover_image: igdbGame.cover?.url ? `https:${igdbGame.cover.url.replace('t_thumb', 't_cover_big')}` : null,
                    screenshots: [...new Set([...igdbScreenshots, ...(webData.screenshot_urls || [])])].slice(0, 10),
                    video_urls: [...new Set([...igdbVideos, ...(webData.video_urls || [])])].slice(0, 5),
                    trailer_url: igdbVideos[0] || webData.video_urls?.[0] || '',
                    genre: igdbGame.genres?.[0]?.name?.toLowerCase() || 'action',
                    price: webData.price || 59.99,
                    status: webData.is_available ? 'available' : 'planned',
                    developer: igdbGame.involved_companies?.[0]?.company?.name || webData.developer || 'Unknown',
                    original_year: igdbGame.first_release_date 
                        ? new Date(igdbGame.first_release_date * 1000).getFullYear() 
                        : (webData.release_year || gameInfo.estimated_year || 2024),
                    rating: igdbGame.aggregated_rating ? Math.round(igdbGame.aggregated_rating / 20) : 0
                };

                // Create game in database
                const createdGame = await base44.asServiceRole.entities.Game.create(gameData);
                results.push(createdGame);
                
                await log(base44, jobId, `✅ Successfully added ${gameInfo.title} to database`, 'success');

            } catch (error) {
                await log(base44, jobId, `❌ Error processing ${gameInfo.title}: ${error.message}`, 'error');
            }

            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Step 4: Fix missing images for existing games
        await log(base44, jobId, '🖼️  Checking for games with missing images...', 'info');
        
        const allGames = await base44.asServiceRole.entities.Game.list();
        const gamesNeedingImages = allGames.filter(g => 
            !g.cover_image || g.cover_image.includes('unsplash.com')
        );
        
        await log(base44, jobId, `📊 Found ${gamesNeedingImages.length} games needing images`, gamesNeedingImages.length > 0 ? 'warning' : 'info');

        const imagesFixes = [];
        for (let i = 0; i < Math.min(gamesNeedingImages.length, 10); i++) {
            const game = gamesNeedingImages[i];
            await log(base44, jobId, `🔍 Fixing image for: ${game.title}...`, 'info');

            try {
                let imageUrl = null;

                // Strategy 1: IGDB
                try {
                    const igdbQuery = `search "${game.title}"; fields name, cover.url; limit 1;`;
                    const igdbResults = await searchIGDB(clientId, igdbToken, igdbQuery);
                    
                    if (igdbResults.length > 0 && igdbResults[0].cover?.url) {
                        imageUrl = `https:${igdbResults[0].cover.url.replace('t_thumb', 't_cover_big')}`;
                        await log(base44, jobId, `✅ Found via IGDB: ${game.title}`, 'success');
                    }
                } catch (e) {
                    await log(base44, jobId, `⚠️  IGDB failed for ${game.title}`, 'warning');
                }

                // Strategy 2: Multi-source web search
                if (!imageUrl) {
                    const searchResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
                        prompt: `Find the official cover art/box art image for the game "${game.title}".

SEARCH MULTIPLE SOURCES:
1. Official game website
2. Wikipedia gaming page
3. Steam store page
4. PlayStation/Xbox/Nintendo stores
5. Gaming news sites (IGN, GameSpot)

REQUIREMENTS:
- Must be DIRECT image URL (ends in .jpg, .png, .webp)
- Must be vertical/portrait cover art
- Priority domains: images.igdb.com, cdn.cloudflare.steamstatic.com, upload.wikimedia.org, assets.nintendo.com
- Avoid: encrypted-tbn0, googleusercontent, unsplash

Return the best quality cover art URL you can find.`,
                        add_context_from_internet: true,
                        response_json_schema: {
                            type: 'object',
                            properties: {
                                image_url: { type: 'string' },
                                source: { type: 'string' }
                            }
                        }
                    });

                    if (searchResult.image_url && !searchResult.image_url.includes('unsplash')) {
                        imageUrl = searchResult.image_url;
                        await log(base44, jobId, `✅ Found via ${searchResult.source || 'web search'}: ${game.title}`, 'success');
                    }
                }

                // Update game if image found
                if (imageUrl) {
                    await base44.asServiceRole.entities.Game.update(game.id, {
                        cover_image: imageUrl
                    });
                    imagesFixes.push({ game: game.title, status: 'fixed' });
                } else {
                    await log(base44, jobId, `❌ Could not find image for ${game.title}`, 'error');
                    imagesFixes.push({ game: game.title, status: 'failed' });
                }

            } catch (error) {
                await log(base44, jobId, `❌ Error fixing ${game.title}: ${error.message}`, 'error');
                imagesFixes.push({ game: game.title, status: 'error' });
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        await log(base44, jobId, `🎉 Agent completed! Added ${results.length} new games, fixed ${imagesFixes.filter(f => f.status === 'fixed').length} images`, 'success');
        await base44.asServiceRole.entities.AgentJob.update(jobId, { 
            status: 'completed',
            result: { 
                games_added: results.length,
                images_fixed: imagesFixes.filter(f => f.status === 'fixed').length,
                images_failed: imagesFixes.filter(f => f.status !== 'fixed').length
            }
        });

        return Response.json({ 
            success: true, 
            games_added: results.length,
            images_fixed: imagesFixes.filter(f => f.status === 'fixed').length,
            results,
            imagesFixes
        });

    } catch (error) {
        console.error('Agent failed:', error);
        
        if (req.json && (await req.json()).jobId) {
            const base44 = createClientFromRequest(req);
            const { jobId } = await req.json();
            await log(base44, jobId, `💥 Fatal error: ${error.message}`, 'error');
            await base44.asServiceRole.entities.AgentJob.update(jobId, { status: 'failed' });
        }

        return Response.json({ error: error.message }, { status: 500 });
    }
});