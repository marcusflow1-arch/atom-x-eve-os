import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response('Unauthorized', { status: 401 });
        }
        
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        const user = await base44.auth.me();
        
        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { action, gameId, genre } = await req.json();

        switch (action) {
            case 'getGamesByGenre':
                const games = await getGamesByGenre(genre);
                return new Response(JSON.stringify({ games }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            case 'getGameDetails':
                const gameDetails = await getGameDetails(gameId);
                return new Response(JSON.stringify({ game: gameDetails }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            case 'updateGameProgress':
                const { completion, playTime } = await req.json();
                await updateUserGameProgress(user.id, gameId, completion, playTime);
                return new Response(JSON.stringify({ success: true }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            default:
                return new Response('Invalid action', { status: 400 });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

async function getGamesByGenre(genre) {
    // Simulate game data - in real app this would come from a database
    const gameLibrary = {
        fantasy: [
            {
                id: 'elder_scrolls_reborn',
                title: "Elder Scrolls: Reborn",
                genre: "Fantasy RPG",
                status: "reconstructed",
                difficulty: "medium",
                cover: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop",
                description: "A vast fantasy world where your choices shape destiny."
            }
        ],
        'sci-fi': [
            {
                id: 'cyberpunk_2088',
                title: "Cyberpunk 2088",
                genre: "Sci-Fi Action",
                status: "reconstructed",
                difficulty: "hard",
                cover: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=800&fit=crop",
                description: "An open-world adventure in Night City."
            }
        ]
    };
    
    return gameLibrary[genre] || [];
}

async function getGameDetails(gameId) {
    // Simulate detailed game data
    const games = {
        'elder_scrolls_reborn': {
            id: 'elder_scrolls_reborn',
            title: "Elder Scrolls: Reborn",
            description: "A vast fantasy world where your choices shape the destiny of kingdoms.",
            achievements: [
                {
                    id: 1,
                    title: "Dragon Slayer",
                    description: "Defeat the Ancient Dragon",
                    points: 250,
                    rarity: "Legendary",
                    category: "equipment"
                }
            ]
        }
    };
    
    return games[gameId] || null;
}

async function updateUserGameProgress(userId, gameId, completion, playTime) {
    // In a real app, this would update the database
    console.log(`Updated progress for user ${userId}, game ${gameId}: ${completion}% complete, ${playTime}h played`);
    return true;
}