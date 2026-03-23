import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get users that the current user follows
        // format: { follower_id: user.id }
        const follows = await base44.entities.Follow.filter({ follower_id: user.id });
        const followedIds = follows.data.map(f => f.followed_id);
        
        // Include current user's own posts
        followedIds.push(user.id);

        // 2. Fetch memories from these users
        // limit to 20 for now
        // Using simple filtering. If list is huge, this might need optimization later.
        // Since we can't do "IN" queries easily in all filters, we might fetch recent memories and filter in code 
        // OR (better) if the SDK supports it. Assuming standard filter doesn't support IN array yet unless specified.
        // Let's try to fetch most recent global memories and filter by user_id (inefficient but works for MVP)
        // OR fetch for each user (bad for many users).
        // BEST APPROACH for MVP: Just list all memories sorted by date desc, then filter in code (if dataset is small)
        // OR: Use a loop if we assume few followed users.
        
        // Let's try listing all memories (limit 50) and filtering. 
        // Real production app would need a better query or "Feed" entity.
        const memoriesResult = await base44.entities.Memory.list('-created_date', 50);
        
        let feed = memoriesResult.data.filter(m => followedIds.includes(m.user_id));

        // 3. Enrich with User data and Likes/Comments status
        const enrichedFeed = await Promise.all(feed.map(async (memory) => {
            // Fetch Author
            // Optimization: Cache users in a map to avoid duplicate requests
            const author = await base44.entities.User.get(memory.user_id);
            
            // Check if current user liked this memory
            // We need to check the Reaction entity
            const reactions = await base44.entities.Reaction.filter({ 
                target_id: memory.id, 
                user_id: user.id,
                type: 'like'
            });
            
            return {
                ...memory,
                author: {
                    username: author.username || author.full_name || 'Unknown',
                    avatar_url: author.avatar_url,
                    level: author.level || 1, // Assuming level is on user
                    archetype: author.archetype
                },
                is_liked: reactions.data.length > 0
            };
        }));

        return Response.json({ data: enrichedFeed });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});