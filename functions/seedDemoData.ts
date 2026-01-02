import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Seeds demo data for Atom x Eve platform
 * Can be called once to populate initial catalog
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const results = {
            games: 0,
            achievements: 0,
            errors: []
        };

        // Seed Games
        const demoGames = [
            {
                title: "Cyberpunk 2088",
                description: "A neon-soaked action RPG where your AI companion adapts to your every decision. Navigate the megacity, hack corporate systems, and uncover the truth.",
                genre: "RPG",
                price: 59.99,
                rating: 4.8,
                original_year: 2025,
                status: "available",
                cover_image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=1200&fit=crop",
                screenshots: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200"],
                aiEnhanced: true
            },
            {
                title: "Neon Legends",
                description: "Fast-paced multiplayer combat in a vibrant cyberpunk world. Master weapons, dominate arenas, and climb the leaderboards.",
                genre: "Action",
                price: 29.99,
                rating: 4.5,
                original_year: 2024,
                status: "available",
                cover_image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=1200&fit=crop",
                screenshots: ["https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200"],
                aiEnhanced: false
            },
            {
                title: "Stellar Odyssey",
                description: "Explore the cosmos in this epic space adventure. Your AI co-pilot learns your exploration style and helps discover hidden systems.",
                genre: "Sci-Fi",
                price: 49.99,
                rating: 4.9,
                original_year: 2024,
                status: "available",
                cover_image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&h=1200&fit=crop",
                screenshots: ["https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=1200"],
                aiEnhanced: true
            },
            {
                title: "Horror House VR",
                description: "A terrifying survival horror experience. Every sound, every shadow could be your last. Your AI companion fears the dark as much as you do.",
                genre: "Horror",
                price: 19.99,
                rating: 4.2,
                original_year: 2023,
                status: "available",
                cover_image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&h=1200&fit=crop",
                screenshots: ["https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200"],
                aiEnhanced: true
            },
            {
                title: "Retro Racer X",
                description: "High-speed arcade racing rebuilt with modern graphics. Your AI learns racing lines and helps you master every track.",
                genre: "Racing",
                price: 24.99,
                rating: 4.6,
                original_year: 2022,
                status: "reconstructed",
                cover_image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&h=1200&fit=crop",
                screenshots: ["https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200"],
                aiEnhanced: true
            }
        ];

        for (const game of demoGames) {
            try {
                // Check if game already exists
                const existing = await base44.asServiceRole.entities.Game.filter({ title: game.title });
                if (existing.length === 0) {
                    await base44.asServiceRole.entities.Game.create(game);
                    results.games++;
                }
            } catch (error) {
                results.errors.push(`Game ${game.title}: ${error.message}`);
            }
        }

        // Seed Achievements
        const demoAchievements = [
            {
                title: "First Steps",
                description: "Complete your first mission in any game",
                game: "All Games",
                category: "standard",
                rarity: "Common",
                points: 10,
                icon: "🎮"
            },
            {
                title: "AI Awakening",
                description: "Unlock your AI companion's first ability",
                game: "All Games",
                category: "ability",
                rarity: "Uncommon",
                points: 25,
                icon: "🤖"
            },
            {
                title: "Cyberpunk Master",
                description: "Complete all main missions in Cyberpunk 2088",
                game: "Cyberpunk 2088",
                category: "standard",
                rarity: "Epic",
                points: 100,
                icon: "🏆"
            },
            {
                title: "Speed Demon",
                description: "Win 50 races in Retro Racer X",
                game: "Retro Racer X",
                category: "standard",
                rarity: "Rare",
                points: 50,
                icon: "🏁"
            },
            {
                title: "Genre Explorer",
                description: "Play games from 5 different genres",
                game: "All Games",
                category: "standard",
                rarity: "Legendary",
                points: 200,
                icon: "🌟"
            }
        ];

        for (const achievement of demoAchievements) {
            try {
                const existing = await base44.asServiceRole.entities.Achievement.filter({ 
                    title: achievement.title,
                    game: achievement.game
                });
                if (existing.length === 0) {
                    await base44.asServiceRole.entities.Achievement.create(achievement);
                    results.achievements++;
                }
            } catch (error) {
                results.errors.push(`Achievement ${achievement.title}: ${error.message}`);
            }
        }

        return Response.json({
            success: true,
            message: 'Demo data seeded successfully',
            results
        });

    } catch (error) {
        console.error('Seed error:', error);
        return Response.json({ 
            error: 'Failed to seed demo data',
            details: error.message 
        }, { status: 500 });
    }
});