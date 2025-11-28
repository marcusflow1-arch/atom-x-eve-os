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

        const { action } = await req.json();

        switch (action) {
            case 'getCurrentEvent':
                const event = await getCurrentWorldEvent();
                return new Response(JSON.stringify(event), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            case 'joinEvent':
                const { eventId } = await req.json();
                const participation = await joinWorldEvent(user.id, eventId);
                return new Response(JSON.stringify(participation), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            case 'getEventProgress':
                const { eventId: progressEventId } = await req.json();
                const progress = await getEventProgress(user.id, progressEventId);
                return new Response(JSON.stringify(progress), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            case 'completeEventQuest':
                const { questId } = await req.json();
                const completion = await completeEventQuest(user.id, questId);
                return new Response(JSON.stringify(completion), {
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

async function getCurrentWorldEvent() {
    // Simulate current world event
    return {
        id: 'leviathan_rise_2024',
        name: "Leviathan's Rise",
        description: "An ancient sea monster has awakened across multiple game worlds",
        status: 'active',
        startDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        participants: 15420,
        globalProgress: 65,
        worldBoss: {
            name: "Abyssal Leviathan",
            health: 42,
            timeRemaining: "02:15:34",
            totalDamage: 7800000,
            targetDamage: 10000000
        },
        quests: [
            {
                id: 'damage_leviathan',
                title: 'Damage the Leviathan',
                description: 'Deal damage to the world boss',
                progress: 7800000,
                target: 10000000,
                reward: '500 AGP',
                type: 'damage'
            },
            {
                id: 'find_cache',
                title: 'Find a Leviathan Cache',
                description: 'Discover a hidden treasure cache',
                progress: 0,
                target: 1,
                reward: 'Legendary Item',
                type: 'exploration'
            }
        ],
        rewards: {
            participation: '200 AGP',
            completion: 'Exclusive Leviathan Mount',
            topDamage: 'Mythic Trident of the Deep'
        }
    };
}

async function joinWorldEvent(userId, eventId) {
    // Record user participation in world event
    const participation = {
        userId,
        eventId,
        joinedAt: new Date().toISOString(),
        contribution: 0,
        questsCompleted: 0,
        rewards: []
    };

    return {
        success: true,
        participation,
        message: 'Successfully joined the world event!',
        initialReward: '50 AGP'
    };
}

async function getEventProgress(userId, eventId) {
    // Get user's progress in the event
    return {
        userId,
        eventId,
        personalDamage: 125000,
        questsCompleted: 1,
        rank: 342,
        contribution: 8.5,
        rewards: [
            { type: 'agp', amount: 250, claimed: true },
            { type: 'item', name: 'Leviathan Scale', claimed: false }
        ]
    };
}

async function completeEventQuest(userId, questId) {
    const questRewards = {
        'damage_leviathan': { agp: 500, experience: 1000 },
        'find_cache': { item: 'Legendary Treasure Chest', agp: 300 }
    };

    const reward = questRewards[questId];
    if (!reward) {
        throw new Error('Quest not found');
    }

    // Update user rewards
    const user = await base44.auth.me();
    if (reward.agp) {
        await base44.entities.User.updateMyUserData({
            avatar_gamer_points: (user.avatar_gamer_points || 0) + reward.agp
        });
    }

    return {
        success: true,
        quest: questId,
        rewards: reward,
        message: `Quest completed! Earned ${reward.agp ? reward.agp + ' AGP' : reward.item}!`
    };
}