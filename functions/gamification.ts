import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const XP_TABLE = {
    post_memory: 50,
    receive_like: 10,
    receive_follow: 20,
    complete_contract: 200,
    login_daily: 5
};

const LEVEL_THRESHOLDS = [
    0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 
    5500, 6600, 7800, 9100, 10500, 12000, 13600, 15300, 17100, 19000
];

const BADGES = {
    level_5: { id: 'novice_gamer', name: 'Novice Gamer', icon: '🎮' },
    level_10: { id: 'pro_gamer', name: 'Pro Gamer', icon: '🏆' },
    level_20: { id: 'elite_gamer', name: 'Elite Gamer', icon: '👑' },
    first_memory: { id: 'storyteller', name: 'Storyteller', icon: '📖' },
    popular: { id: 'influencer', name: 'Influencer', icon: '🌟' } // 100 likes?
};

export const getLevelFromXP = (xp) => {
    let level = 1;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            level = i + 1;
        }
    }
    return level;
};

export const getNextLevelXP = (level) => {
    if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] * 1.5;
    return LEVEL_THRESHOLDS[level]; // Threshold for next level (index level is next because index 0 is lvl 1)
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        
        // action: string
        // targetUserId: string (optional, if action affects someone else)
        const { action, targetUserId } = payload;
        
        // Authenticate caller
        const caller = await base44.auth.me();
        if (!caller && !payload.system_trigger) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Determine who gets XP
        // If I post, I get XP. If I like someone, THEY get XP (targetUserId).
        let userIdToUpdate = caller?.id;
        
        if (['receive_like', 'receive_follow'].includes(action)) {
            if (!targetUserId) return Response.json({ error: 'Target user required' }, { status: 400 });
            userIdToUpdate = targetUserId;
        }

        // For updating other users, we need service role
        const client = (userIdToUpdate === caller?.id) ? base44 : base44.asServiceRole;

        // Get current user data
        const userEntity = await client.entities.User.get(userIdToUpdate);
        if (!userEntity) return Response.json({ error: 'User not found' }, { status: 404 });

        const currentXP = userEntity.xp || 0;
        const xpGain = XP_TABLE[action] || 0;
        const newXP = currentXP + xpGain;
        const newLevel = getLevelFromXP(newXP);
        
        const updates = { xp: newXP };
        const newBadges = [...(userEntity.badges || [])];
        let leveledUp = false;

        // Level Up Check
        if (newLevel > (userEntity.level || 1)) {
            updates.level = newLevel;
            leveledUp = true;
            
            // Level badges
            if (newLevel >= 5 && !newBadges.includes(BADGES.level_5.id)) newBadges.push(BADGES.level_5.id);
            if (newLevel >= 10 && !newBadges.includes(BADGES.level_10.id)) newBadges.push(BADGES.level_10.id);
            if (newLevel >= 20 && !newBadges.includes(BADGES.level_20.id)) newBadges.push(BADGES.level_20.id);
        }

        // Activity Badges
        if (action === 'post_memory' && !newBadges.includes(BADGES.first_memory.id)) {
            newBadges.push(BADGES.first_memory.id);
        }

        if (newBadges.length > (userEntity.badges?.length || 0)) {
            updates.badges = newBadges;
        }

        // Update User
        await client.entities.User.update(userIdToUpdate, updates);

        return Response.json({ 
            success: true, 
            xpGained: xpGain, 
            newTotalXP: newXP,
            newLevel: newLevel,
            leveledUp: leveledUp,
            badges: newBadges
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});