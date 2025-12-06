import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query, limit = 10 } = await req.json();

        const clientId = Deno.env.get("IGDB_CLIENT_ID");
        const clientSecret = Deno.env.get("IGDB_CLIENT_SECRET");

        // Get Twitch OAuth token
        const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
        });

        const { access_token } = await tokenRes.json();

        // Fetch games from IGDB
        const igdbQuery = query || `
            fields name, summary, cover.url, first_release_date, rating, genres.name, screenshots.url, involved_companies.company.name;
            where rating > 70 & first_release_date > ${Math.floor(Date.now() / 1000) - 31536000};
            sort rating desc;
            limit ${limit};
        `;

        const gamesRes = await fetch('https://api.igdb.com/v4/games', {
            method: 'POST',
            headers: {
                'Client-ID': clientId,
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'text/plain'
            },
            body: igdbQuery
        });

        const games = await gamesRes.json();

        // Transform data to match our format
        const transformedGames = games.map(game => ({
            title: game.name,
            description: game.summary || 'No description available',
            cover_image: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
            screenshots: game.screenshots?.map(s => `https:${s.url.replace('t_thumb', 't_screenshot_big')}`) || [],
            rating: game.rating ? Math.round(game.rating / 20) : 0, // Convert to 5-star scale
            genre: game.genres?.[0]?.name || 'Unknown',
            release_date: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString() : null,
            developer: game.involved_companies?.[0]?.company?.name || 'Unknown',
            igdb_id: game.id
        }));

        return Response.json({ games: transformedGames });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});