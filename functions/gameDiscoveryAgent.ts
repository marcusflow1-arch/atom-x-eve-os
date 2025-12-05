import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    // Variables lifted to outer scope for error handling
    let jobId = null;
    let base44 = null;

    try {
        base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Read body once
        const body = await req.json();
        jobId = body.jobId;

        if (!jobId) {
            return Response.json({ error: 'Missing jobId' }, { status: 400 });
        }

        // Helper to log to DB
        const log = async (message, level = 'info', metadata = null) => {
            try {
                await base44.entities.AgentLog.create({
                    job_id: jobId,
                    message: String(message),
                    level,
                    metadata
                });
            } catch (e) {
                console.error("Logging failed:", e);
            }
        };

        // Helper to download and upload image
        const persistImage = async (url, title) => {
            if (!url) return null;
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

        const VALID_GENRES = [
            "shooting", "fighting", "sci-fi", "mmo", "mmorpg", "adventure", 
            "action", "fantasy", "rpg", "strategy", "simulation", "sports", 
            "racing", "horror", "puzzle", "platformer", "survival", "open_world", "sandbox"
        ];

        const normalizeGenre = (genre) => {
            if (!genre) return "action";
            const lower = genre.toLowerCase();
            if (VALID_GENRES.includes(lower)) return lower;
            // Simple mapping
            if (lower.includes('rpg') || lower.includes('role')) return 'rpg';
            if (lower.includes('shoot') || lower.includes('fps')) return 'shooting';
            if (lower.includes('fight')) return 'fighting';
            if (lower.includes('adventure')) return 'adventure';
            return "other";
        };

        // DEFAULT FALLBACK IMAGE (Placeholder)
        const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=800&fit=crop";

        await log("Initializing Game Discovery & Maintenance Agent...", "info");

        // --- Phase 1: Process Existing Games ---
        await log("Phase 1: Checking existing games for external images...", "info");
        
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
            prompt: `Search for the top 10 trending, new, or upcoming video games (late 2024/2025) across Steam, PS5, Xbox, and Switch.
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
            // Check if exists
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
                3. Genre (Action, RPG, Strategy, Simulation, Sports, Racing, Horror, Puzzle, Platformer, Survival).
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

            // Persist the image immediately
            let localImageUrl = await persistImage(details.cover_image, details.title || gameTitle);
            
            // Use fallback if no image found or persist failed to return a valid URL
            if (!localImageUrl) {
                 await log(`No image found for ${gameTitle}, using fallback.`, "warning");
                 localImageUrl = FALLBACK_IMAGE;
            }

            const normalizedGenre = normalizeGenre(details.genre);

            try {
                const newGame = await base44.entities.Game.create({
                    title: details.title || gameTitle,
                    description: details.description || "No description available.",
                    genre: normalizedGenre,
                    price: details.price || 59.99,
                    developer: details.developer || "Unknown",
                    original_year: details.releaseYear || 2025,
                    rating: details.rating || 0,
                    cover_image: localImageUrl,
                    status: "available",
                });
                newGamesCount++;
                await log(`Imported "${newGame.title}" to catalog.`, "success");
            } catch (err) {
                await log(`Failed to create game entity for ${gameTitle}: ${err.message}`, "error");
            }
        }

        await base44.entities.AgentJob.update(jobId, {
            status: "completed",
            summary: `Updated ${updatedCount} existing images. Imported ${newGamesCount} new games.`
        });
        
        await log(`Agent finished successfully.`, "success");

        return Response.json({ success: true });

    } catch (error) {
        console.error("Global Agent Error:", error);
        // Safe error logging
        if (base44 && jobId) {
            try {
                await base44.entities.AgentLog.create({
                   job_id: jobId,
                   message: `Critical Error: ${error.message}`,
                   level: "error"
               });
               await base44.entities.AgentJob.update(jobId, { status: "failed" });
            } catch (e) {
                console.error("Failed to log critical error:", e);
            }
        }

        return Response.json({ error: error.message }, { status: 500 });
    }
});