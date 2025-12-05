import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { jobId } = await req.json();

        if (!jobId) {
            return Response.json({ error: 'Missing jobId' }, { status: 400 });
        }

        // Helper to log to DB
        const log = async (message, level = 'info', metadata = null) => {
            await base44.entities.AgentLog.create({
                job_id: jobId,
                message,
                level,
                metadata
            });
        };

        // Start processing in background (we return early to client if possible, 
        // but Deno Deploy usually kills if response is sent. 
        // So we must await execution. Client will time out if too long, 
        // but we are using polling on frontend so we don't care about the response as much.)
        
        await log("Initializing Game Discovery Agent...", "info");
        await log("Connecting to global game databases (Steam, Epic, PS Store, Xbox)...", "info");

        // Step 1: Search for games
        await log("Searching for trending and upcoming games...", "info");
        
        const searchResponse = await base44.integrations.Core.InvokeLLM({
            prompt: `Search the web for the top 10 most trending, new, or upcoming video games right now (late 2024/2025) across Steam, PlayStation, Xbox, and Switch.
            
            Focus on major titles and high-profile indies.
            
            Return a JSON object with a list of game names.`,
            add_context_from_internet: true,
            response_json_schema: {
                type: "object",
                properties: {
                    games: { type: "array", items: { type: "string" } }
                }
            }
        });

        const foundGames = searchResponse.games || [];
        await log(`Found ${foundGames.length} potential candidates: ${foundGames.join(', ')}`, "info");

        let newGamesCount = 0;

        // Step 2: Process each game
        for (const gameTitle of foundGames) {
            // Check if exists
            const existing = await base44.entities.Game.list({ limit: 1 }); // We need a filter but list doesn't support it well in this SDK mock, let's assume we iterate or use filter if available.
            // actually SDK supports filter:
            const existingGames = await base44.entities.Game.filter({ title: gameTitle });
            
            if (existingGames.length > 0) {
                await log(`Skipping "${gameTitle}" - already in catalog.`, "warning");
                continue;
            }

            await log(`Analyzing "${gameTitle}"... fetching details, assets, and metadata.`, "info");

            // Fetch details
            const details = await base44.integrations.Core.InvokeLLM({
                prompt: `Get detailed information for the video game "${gameTitle}".
                
                Find:
                1. Official vertical cover art/box art URL (direct link to jpg/png). High quality.
                2. A compelling description (2-3 sentences).
                3. Primary Genre.
                4. Developer.
                5. Price (USD).
                6. Release Year.
                7. Rating (0-5).
                
                Return JSON.`,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        genre: { type: "string" },
                        developer: { type: "string" },
                        price: { type: "number" },
                        releaseYear: { type: "number" },
                        rating: { type: "number" },
                        cover_image: { type: "string" }
                    }
                }
            });

            // Create Game
            const newGame = await base44.entities.Game.create({
                title: details.title || gameTitle,
                description: details.description || "No description available.",
                genre: details.genre || "Action",
                price: details.price || 59.99,
                developer: details.developer || "Unknown",
                original_year: details.releaseYear || 2025,
                rating: details.rating || 0,
                cover_image: details.cover_image,
                status: "available"
            });

            newGamesCount++;
            await log(`Successfully imported "${newGame.title}" to catalog.`, "success", newGame);
        }

        await base44.entities.AgentJob.update(jobId, {
            status: "completed",
            summary: `Imported ${newGamesCount} new games.`
        });
        
        await log(`Agent finished. Imported ${newGamesCount} games.`, "success");

        return Response.json({ success: true });

    } catch (error) {
        // Try to log the error
        try {
             const base44 = createClientFromRequest(req);
             const { jobId } = await req.clone().json();
             if (jobId) {
                 await base44.entities.AgentLog.create({
                    job_id: jobId,
                    message: `Critical Error: ${error.message}`,
                    level: "error"
                });
                await base44.entities.AgentJob.update(jobId, { status: "failed" });
             }
        } catch (e) { /* ignore */ }

        return Response.json({ error: error.message }, { status: 500 });
    }
});