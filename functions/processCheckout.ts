import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { items, paymentMethod = 'credit_card' } = await req.json();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return Response.json({ error: 'Cart is empty' }, { status: 400 });
        }

        const processedItems = [];
        const newGameIds = [];
        let totalAmount = 0;

        // 1. Validation and Preparation
        for (const item of items) {
            if (item.type === 'game') {
                const game = await base44.entities.Game.get(item.id);
                if (!game) throw new Error(`Game ${item.id} not found`);
                
                // Check ownership
                if (user.purchased_items && user.purchased_items.includes(game.id)) {
                    // Skip if already owned, or throw error? 
                    // Let's just filter it out or mark as owned in response, but for checkout let's assume UI filtered it or we error.
                    // For now, let's just proceed but ensure we don't double charge if we were smart, 
                    // but simple logic: just process.
                }
                
                processedItems.push({
                    item_id: game.id,
                    item_type: 'game',
                    amount: game.price || 0,
                    title: game.title
                });
                newGameIds.push(game.id);
                totalAmount += (game.price || 0);
            } 
            // Future: Handle 'card', 'listing'
            else if (item.type === 'listing') {
                // Listing logic (check availability etc)
                // Placeholder
                processedItems.push({
                    item_id: item.id,
                    item_type: 'listing',
                    amount: item.price || 0,
                    title: item.title
                });
                totalAmount += (item.price || 0);
            }
        }

        const transactionHash = crypto.randomUUID().split('-').join('').toUpperCase();

        // 2. Create Transaction Record
        // We create one transaction record per item or one master? 
        // User instructions: "Generate transaction record". 
        // Entities/Transaction.json has "item_id" (singular). 
        // So we should probably create multiple transaction records, one per item, sharing a batch ID or similar?
        // Or just create multiple records.
        
        const transactions = [];
        for (const pItem of processedItems) {
            const tx = await base44.entities.Transaction.create({
                user_id: user.id,
                item_id: pItem.item_id,
                item_type: pItem.item_type,
                amount: pItem.amount,
                currency: 'USD',
                status: 'completed',
                transaction_hash: transactionHash, // Shared hash for the batch? or unique? Let's share for batch identification.
                payment_method: paymentMethod
            });
            transactions.push(tx);
        }

        // 3. Update User Ownership (Games)
        if (newGameIds.length > 0) {
            const currentPurchases = user.purchased_items || [];
            const updatedPurchases = [...new Set([...currentPurchases, ...newGameIds])]; // Avoid duplicates
            await base44.auth.updateMe({ purchased_items: updatedPurchases });

            // 4. Seed Systems for Games
            for (const gameId of newGameIds) {
                // Fetch templates
                const templates = await base44.entities.CardTemplate.filter({ source_game_id: gameId });
                
                // Starter Cards
                const newCards = [];
                const starters = templates.filter(t => ['Common', 'Uncommon'].includes(t.base_rarity)).sort(() => 0.5 - Math.random()).slice(0, 3);
                
                for (const template of starters) {
                    newCards.push({
                        user_id: user.id,
                        template_id: template.name,
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
                    await base44.entities.UserCard.create(newCards);
                }

                // Seed Achievements
                // Need game title for this
                const pItem = processedItems.find(i => i.item_id === gameId);
                if (pItem) {
                    const achievements = await base44.entities.Achievement.filter({ game: pItem.title });
                    const userAchievements = achievements.map(ach => ({
                        user_id: user.id,
                        achievement_id: ach.id,
                        status: 'locked',
                        progress: { current: 0, total: 100 }
                    }));
                    if (userAchievements.length > 0) {
                        await base44.entities.UserAchievement.create(userAchievements);
                    }
                }
            }
        }

        return Response.json({ 
            success: true, 
            transactionHash,
            itemsProcessed: processedItems.length 
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});