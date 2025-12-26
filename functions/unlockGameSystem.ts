import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { gameId } = await req.json();

        if (!gameId) {
            return Response.json({ error: 'Game ID is required' }, { status: 400 });
        }

        // 1. Verify Game Exists
        const game = await base44.entities.Game.get(gameId);
        if (!game) {
            return Response.json({ error: 'Game not found' }, { status: 404 });
        }

        // 2. Check if already owned
        const currentPurchases = user.purchased_items || [];
        if (currentPurchases.includes(gameId)) {
             return Response.json({ message: 'System already unlocked', alreadyOwned: true });
        }

        // 3. Record Transaction
        const transactionHash = crypto.randomUUID().split('-').join('').toUpperCase();
        await base44.entities.Transaction.create({
            user_id: user.id,
            item_id: gameId,
            item_type: 'game',
            amount: game.price || 0,
            currency: 'USD',
            status: 'completed',
            transaction_hash: transactionHash,
            payment_method: 'system_credits'
        });

        // 4. Update User Ownership
        const newPurchases = [...currentPurchases, gameId];
        await base44.auth.updateMe({ purchased_items: newPurchases });

        // 5. "Seed" the System
        // Fetch templates for this game
        const templates = await base44.entities.CardTemplate.filter({ source_game_id: gameId });
        
        const newCards = [];
        // Create 3 "Starter" cards if available (random selection of common/uncommon)
        const starters = templates.filter(t => ['Common', 'Uncommon'].includes(t.base_rarity)).sort(() => 0.5 - Math.random()).slice(0, 3);
        
        for (const template of starters) {
            newCards.push({
                user_id: user.id,
                template_id: template.name, // Using name as ID reference based on previous patterns or actual ID if available
                source_game_id: gameId,
                rarity: template.base_rarity,
                level: 1,
                xp: 0,
                enchant_level: 0,
                combine_level: 0,
                ascension_tier: 0,
                stats: template.base_stats || {},
                is_locked: false,
                obtained_at: new Date().toISOString()
            });
        }

        if (newCards.length > 0) {
            await base44.entities.UserCard.create(newCards); // Assuming bulk create works or use loop
        }

        // 6. Seed Achievements (Locked)
        const achievements = await base44.entities.Achievement.filter({ game: game.title }); // Assuming linkage by game title or ID
        const userAchievements = achievements.map(ach => ({
            user_id: user.id,
            achievement_id: ach.id,
            status: 'locked',
            progress: { current: 0, total: 100 }
        }));

        if (userAchievements.length > 0) {
             await base44.entities.UserAchievement.create(userAchievements);
        }

        return Response.json({ 
            success: true, 
            message: `System unlocked: ${game.title}`,
            cards_unlocked: newCards.length,
            achievements_seeded: userAchievements.length,
            transaction_id: transactionHash
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});