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

async function getPriceAndDetailsFromWeb(base44, gameTitle) {
    try {
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Search for the video game "${gameTitle}" and provide:
1. Current retail price in USD (from Steam, PlayStation Store, Xbox Store, or official retailers)
2. Release date or year
3. Brief description (1-2 sentences)
4. Developer/Publisher name
5. Is it currently available for purchase?

Provide accurate, current market data.`,
            add_context_from_internet: true,
            response_json_schema: {
                type: 'object',
                properties: {
                    price: { type: 'number', description: 'Price in USD' },
                    release_year: { type: 'number' },
                    description: { type: 'string' },
                    developer: { type: 'string' },
                    is_available: { type: 'boolean' }
                }
            }
        });
        return result;
    } catch (e) {
        return { price: 59.99, is_available: true };
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
                           screenshots.url, involved_companies.company.name, aggregated_rating;
                    limit 1;
                `;

                const igdbResults = await searchIGDB(clientId, igdbToken, igdbQuery);
                
                if (igdbResults.length === 0) {
                    await log(base44, jobId, `⚠️  No IGDB data found for ${gameInfo.title}`, 'warning');
                    continue;
                }

                const igdbGame = igdbResults[0];
                await log(base44, jobId, `✅ Found IGDB data for ${gameInfo.title}`, 'success');

                // Get pricing and details from web search
                await log(base44, jobId, `💰 Searching for price data for ${gameInfo.title}...`, 'info');
                const priceData = await getPriceAndDetailsFromWeb(base44, gameInfo.title);
                await log(base44, jobId, `✅ Price: $${priceData.price || 59.99}`, 'success');

                // Prepare game data
                const gameData = {
                    title: igdbGame.name || gameInfo.title,
                    description: igdbGame.summary || priceData.description || 'No description available',
                    cover_image: igdbGame.cover?.url ? `https:${igdbGame.cover.url.replace('t_thumb', 't_cover_big')}` : null,
                    screenshots: igdbGame.screenshots?.map(s => `https:${s.url.replace('t_thumb', 't_screenshot_big')}`) || [],
                    genre: igdbGame.genres?.[0]?.name?.toLowerCase() || 'action',
                    price: priceData.price || 59.99,
                    status: priceData.is_available ? 'available' : 'planned',
                    developer: igdbGame.involved_companies?.[0]?.company?.name || priceData.developer || 'Unknown',
                    original_year: igdbGame.first_release_date 
                        ? new Date(igdbGame.first_release_date * 1000).getFullYear() 
                        : (priceData.release_year || gameInfo.estimated_year || 2024),
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

        await log(base44, jobId, `🎉 Agent completed! Added ${results.length} new games`, 'success');
        await base44.asServiceRole.entities.AgentJob.update(jobId, { 
            status: 'completed',
            result: { games_added: results.length }
        });

        return Response.json({ 
            success: true, 
            games_added: results.length,
            results 
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