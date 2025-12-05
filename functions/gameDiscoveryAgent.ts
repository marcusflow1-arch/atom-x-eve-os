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

        // Helper to download and upload image
        const persistImage = async (url, title) => {
            if (!url) return null;
            // If it's already one of our files (hosted on supabase/base44), skip
            if (url.includes('supabase.co') || url.includes('base44')) {
                return url;
            }

            try {
                await log(`Downloading image for ${title}...`, 'info');
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
                
                const blob = await response.blob();
                const contentType = response.headers.get('content-type') || 'image/jpeg';
                const ext = contentType.split('/')[1] || 'jpg';
                const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                const filename = `${cleanTitle}_${Date.now()}.${ext}`;
                
                const file = new File([blob], filename, { type: contentType });
                
                const uploadRes = await base44.integrations.Core.UploadFile({ file });
                await log(`Saved image for ${title} to file system.`, 'success');
                return uploadRes.file_url;
            } catch (error) {
                await log(`Failed to persist image for ${title}: ${error.message}`, 'warning');
                return url; // Fallback to original URL
            }
        };

        await log("Initializing Game Discovery & Maintenance Agent...", "info");

        // --- Phase 1: Process Existing Games ---
        await log("Phase 1: Checking existing games for external images...", "info");
        
        // In a real app with thousands of games, we'd paginate. For now, fetching top 100 recently added.
        const existingGames = await base44.entities.Game.list('-created_date', 100);
        let updatedCount = 0;

        for (const game of existingGames) {
            if (game.cover_image && !game.cover_image.includes('supabase') && !game.cover_image.includes('base44')) {
                await log(`Migrating image for existing game: ${game.title}`, "info");
                const newUrl = await persistImage(game.cover_image, game.title);
                
                if (newUrl && newUrl !== game.cover_image) {
                    await base44.entities.Game.update(game.id, { cover_image: newUrl });
                    updatedCount++;
                }
            }
        }
        
        await log(`Phase 1 Complete. Updated ${updatedCount} existing games.`, "success");


        // --- Phase 2: Discovery ---
        await log("Phase 2: Searching for new trending games...", "info");
        
        const searchResponse = await base44.integrations.Core.InvokeLLM({
            prompt: `Search for the top 15 trending, new, or upcoming video games (late 2024/2025) across Steam, PS5, Xbox, and Switch.
            Return a JSON object with a list of game titles.`,
            add_context_from_internet: true,
            response_json_schema: {
                type: "object",
                properties: {
                    games: { type: "array", items: { type: "string" } }
                }
            }
        });

        const foundGames = searchResponse.games || [];
        await log(`Found ${foundGames.length} candidates: ${foundGames.join(', ')}`, "info");

        let newGamesCount = 0;

        for (const gameTitle of foundGames) {
            // Check if exists (simple title check)
            const existing = existingGames.find(g => g.title.toLowerCase() === gameTitle.toLowerCase());
            
            if (existing) {
                await log(`Skipping "${gameTitle}" - already exists.`, "info");
                continue;
            }

            await log(`Analyzing "${gameTitle}"...`, "info");

            const details = await base44.integrations.Core.InvokeLLM({
                prompt: `Get details for game "${gameTitle}".
                Find:
                1. Official cover art URL (high quality).
                2. Description.
                3. Genre.
                4. Developer.
                5. Price (USD).
                6. Release Year.
                7. Rating (0-5).
                8. Platform compatibility (e.g. PC, PS5).
                
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
                        cover_image: { type: "string" },
                        platforms: { type: "string" }
                    }
                }
            });

            // Persist the image immediately
            const localImageUrl = await persistImage(details.cover_image, details.title || gameTitle);

            const newGame = await base44.entities.Game.create({
                title: details.title || gameTitle,
                description: details.description || "No description available.",
                genre: details.genre || "Action",
                price: details.price || 59.99,
                developer: details.developer || "Unknown",
                original_year: details.releaseYear || 2025,
                rating: details.rating || 0,
                cover_image: localImageUrl,
                status: "available",
                // storing platform info in description for now as Game entity doesn't have platform field explicitly in schema shown previously, 
                // but we can add it or just append to description
            });

            newGamesCount++;
            await log(`Imported "${newGame.title}" to catalog.`, "success");
        }

        await base44.entities.AgentJob.update(jobId, {
            status: "completed",
            summary: `Updated ${updatedCount} existing images. Imported ${newGamesCount} new games.`
        });
        
        await log(`Agent finished successfully.`, "success");

        return Response.json({ success: true });

    } catch (error) {
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