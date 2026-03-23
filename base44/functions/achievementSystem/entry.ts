import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, achievementId, gameId } = await req.json();

        if (action === 'awardAchievement') {
            if (!achievementId) {
                return Response.json({ error: 'Missing achievementId' }, { status: 400 });
            }

            // 1. Check if already unlocked
            const existing = await base44.entities.UserAchievement.filter({
                user_id: user.id,
                achievement_id: achievementId
            });

            if (existing.length > 0) {
                return Response.json({ message: 'Already unlocked', unlocked: true });
            }

            // 2. Get Achievement details
            const achievement = await base44.entities.Achievement.get(achievementId);
            if (!achievement) {
                return Response.json({ error: 'Achievement not found' }, { status: 404 });
            }

            // 3. Create UserAchievement record
            const userAchievement = await base44.entities.UserAchievement.create({
                user_id: user.id,
                achievement_id: achievementId,
                status: 'unlocked',
                progress: { current: 100, total: 100 },
                unlocked_at: new Date().toISOString()
            });

            // 4. Update User (legacy array + points)
            // We update the user's points and the array for easy frontend access if needed
            const currentUnlocked = user.unlocked_achievements || [];
            const newUnlocked = [...currentUnlocked, achievementId];
            
            // Assume user has a points field, or we just use avatar_gamer_points if it exists
            // Checking Profile.js, it calculates power level from many sources, but let's save points too.
            const currentPoints = user.avatar_gamer_points || 0;
            
            await base44.auth.updateMe({
                unlocked_achievements: newUnlocked,
                avatar_gamer_points: currentPoints + (achievement.points || 0)
            });

            return Response.json({ 
                success: true, 
                message: `Unlocked: ${achievement.title}`,
                achievement: achievement,
                userAchievement: userAchievement
            });
        }

        if (action === 'getUserAchievements') {
            // Fetch all user achievements
            const userAchievements = await base44.entities.UserAchievement.filter({ user_id: user.id });
            
            // Fetch all achievement definitions to enrich data
            // Note: In a real app with thousands of achievements, we'd want to be more selective
            const allAchievements = await base44.entities.Achievement.list();
            const achievementMap = new Map(allAchievements.map(a => [a.id, a]));

            const enriched = userAchievements.map(ua => {
                const def = achievementMap.get(ua.achievement_id);
                return {
                    ...ua,
                    title: def?.title || 'Unknown',
                    description: def?.description || '',
                    icon: def?.icon || '🏆',
                    points: def?.points || 0,
                    rarity: def?.rarity || 'Common'
                };
            });

            return Response.json({ achievements: enriched });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});