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
        // We look for games with:
        // - No image, empty image, or placeholder/unsplash images
        // - Less than 3 screenshots
        // - No video URLs or trailers
        const gamesToFix = games.filter(g => 
            !g.cover_image || 
            g.cover_image === '' || 
            g.cover_image.includes('unsplash.com') ||
            !g.screenshots || g.screenshots.length < 3 ||
            !g.video_urls || g.video_urls.length === 0
        );

        if (gamesToFix.length === 0) {
             return Response.json({ 
                 message: "No games found that need media fixing.", 
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
                let updates = {};
                let foundAny = false;

                // 1. Fetch Media from IGDB if possible
                let igdbData = null;
                if (igdbToken) {
                    try {
                        const igdbQuery = `
                            search "${game.title}"; 
                            fields name, cover.url, screenshots.url, videos.video_id; 
                            limit 1;
                        `;
                        const igdbRes = await fetch('https://api.igdb.com/v4/games', {
                            method: 'POST',
                            headers: {
                                'Client-ID': clientId,
                                'Authorization': `Bearer ${igdbToken}`,
                                'Content-Type': 'text/plain'
                            },
                            body: igdbQuery
                        });
                        const igdbResults = await igdbRes.json();
                        if (igdbResults.length > 0) igdbData = igdbResults[0];
                    } catch (e) {
                        console.log(`IGDB lookup failed for ${game.title}:`, e.message);
                    }
                }

                // 2. Determine what's missing
                const needsCover = !game.cover_image || game.cover_image.includes('unsplash.com');
                const needsScreenshots = !game.screenshots || game.screenshots.length < 3;
                const needsVideos = !game.video_urls || game.video_urls.length === 0;

                // 3. Process IGDB Data
                if (igdbData) {
                    if (needsCover && igdbData.cover?.url) {
                        updates.cover_image = `https:${igdbData.cover.url.replace('t_thumb', 't_cover_big')}`;
                        foundAny = true;
                    }
                    if (igdbData.screenshots?.length > 0) {
                        const newScreens = igdbData.screenshots.map(s => `https:${s.url.replace('t_thumb', 't_screenshot_big')}`);
                        updates.screenshots = [...new Set([...(game.screenshots || []), ...newScreens])];
                        if (updates.screenshots.length >= 3) foundAny = true;
                    }
                    if (igdbData.videos?.length > 0) {
                        const newVideos = igdbData.videos.map(v => `https://www.youtube.com/watch?v=${v.video_id}`);
                        updates.video_urls = [...new Set([...(game.video_urls || []), ...newVideos])];
                        if (!game.trailer_url && updates.video_urls.length > 0) {
                            updates.trailer_url = updates.video_urls[0];
                        }
                        foundAny = true;
                    }
                }

                // 4. Fallback to LLM Web Search if still missing items
                const stillNeedsCover = needsCover && !updates.cover_image;
                const stillNeedsScreenshots = needsScreenshots && (!updates.screenshots || updates.screenshots.length < 3);
                const stillNeedsVideos = needsVideos && (!updates.video_urls || updates.video_urls.length === 0);

                if (stillNeedsCover || stillNeedsScreenshots || stillNeedsVideos) {
                    const llmResponse = await base44.integrations.Core.InvokeLLM({
                        prompt: `Perform a strict, deterministic media search for the game: "${game.title}".

                        1. YOUTUBE TRAILERS (Max 2):
                           - Search query: "${game.title} official trailer"
                           - Find EXACTLY 2 official videos (e.g. "Official Trailer", "Launch Trailer", "Gameplay Trailer").
                           - Prioritize official publisher channels (PlayStation, Xbox, Nintendo, IGN, Gamespot, Developer channels).
                           - REJECT: Reviews, Let's Plays, Walkthroughs, Fan Edits, "All Bosses", "Ending".
                           - If no official trailer exists, return empty list.

                        2. SCREENSHOTS (Fill remaining slots):
                           - Search query: "${game.title} official screenshots"
                           - Find 5-8 high-quality IN-GAME screenshots.
                           - NO box art, NO logos, NO posters, NO fan art, NO wallpapers with text.
                           - Must be clean UI or gameplay action shots.
                           - Must be DIRECT image URLs (jpg/png/webp).

                        3. BOX ART (If needed):
                           - Official vertical cover art only.

                        CRITICAL:
                        - Videos must be standard YouTube watch URLs (https://www.youtube.com/watch?v=...).
                        - Images must be distinct (no duplicates).
                        - Do NOT use generic browser scraping results if they don't match the game exactly.`,
                        add_context_from_internet: true,
                        response_json_schema: {
                            type: "object",
                            properties: {
                                cover_url: { type: "string" },
                                screenshot_urls: { 
                                    type: "array", 
                                    items: { type: "string" },
                                    description: "List of in-game screenshot URLs (no logos/posters)"
                                },
                                video_urls: { 
                                    type: "array", 
                                    items: { type: "string" },
                                    description: "List of official YouTube trailer URLs (max 2)"
                                }
                            }
                        }
                    });

                    if (stillNeedsCover && llmResponse.cover_url) {
                        updates.cover_image = llmResponse.cover_url;
                        foundAny = true;
                    }
                    if (stillNeedsScreenshots && llmResponse.screenshot_urls?.length > 0) {
                        updates.screenshots = [...new Set([...(updates.screenshots || game.screenshots || []), ...llmResponse.screenshot_urls])];
                        foundAny = true;
                    }
                    if (stillNeedsVideos && llmResponse.video_urls?.length > 0) {
                        updates.video_urls = [...new Set([...(updates.video_urls || game.video_urls || []), ...llmResponse.video_urls])];
                        if (!game.trailer_url && updates.video_urls.length > 0) {
                            updates.trailer_url = updates.video_urls[0];
                        }
                        foundAny = true;
                    }
                }

                // 5. Apply Updates
                if (foundAny && Object.keys(updates).length > 0) {
                    await base44.entities.Game.update(game.id, updates);
                    results.push({ id: game.id, title: game.title, status: 'fixed', updates });
                } else {
                    results.push({ id: game.id, title: game.title, status: 'skipped_no_data' });
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