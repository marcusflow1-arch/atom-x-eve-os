import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

type AnyObj = Record<string, any>;

function cardType(category: string) {
  const map: Record<string, string> = {
    equipment: 'Equipment',
    ability: 'Ability',
    companion: 'Companion',
    environment: 'Environment',
    teacher: 'Teacher'
  };
  return map[category] || 'Achievement';
}

function uniqueByAchievement(items: AnyObj[] = [], achievementId: string, next: AnyObj) {
  const without = items.filter((item) => item?.achievement_id !== achievementId);
  return [...without, next];
}

async function ensureReward(base44: any, user: AnyObj, achievement: AnyObj) {
  const reward = achievement.reward || {};
  const rewardName = reward.name || achievement.title;
  const category = achievement.category || 'standard';
  const now = new Date().toISOString();

  const [masterCards, games] = await Promise.all([
    base44.asServiceRole.entities.TradingCard.filter({ achievement_id: achievement.id }, '-created_date', 1).catch(() => []),
    achievement.game ? base44.asServiceRole.entities.Game.filter({ title: achievement.game }, '-created_date', 1).catch(() => []) : Promise.resolve([]),
  ]);
  const masterCard = masterCards?.[0] || null;
  const gameRecord = games?.[0] || null;

  const existingCards = await base44.asServiceRole.entities.UserCard.filter({
    user_id: user.id,
    card_name: rewardName,
    game_name: achievement.game
  }, '-created_date', 1);

  const userCard = existingCards[0] || await base44.asServiceRole.entities.UserCard.create({
    user_id: user.id,
    trading_card_id: masterCard?.id || '',
    card_type: cardType(category),
    card_name: rewardName,
    card_rarity: achievement.rarity === 'Mythical' ? 'Mythic' : (achievement.rarity || 'Common'),
    card_image: reward.image || reward.environment_thumbnail || '',
    game_name: achievement.game,
    game_id: gameRecord?.id || '',
    genre: reward.genre || gameRecord?.genre || '',
    acquisition_method: 'unlocked',
    unlocked_date: now,
    is_equipped: false,
    trade_status: 'available'
  });

  const rewardRecord = {
    achievement_id: achievement.id,
    achievement_title: achievement.title,
    user_card_id: userCard.id,
    type: category,
    name: rewardName,
    description: reward.description || achievement.description || '',
    rarity: achievement.rarity || 'Common',
    game: achievement.game,
    stats: reward.stats || {},
    abilities: reward.abilities || [],
    granted_at: now
  };

  const patch: AnyObj = {
    achievement_rewards: uniqueByAchievement(user.achievement_rewards || [], achievement.id, rewardRecord)
  };

  if (category === 'equipment') {
    patch.unlocked_gear = uniqueByAchievement(user.unlocked_gear || [], achievement.id, rewardRecord);
  } else if (category === 'ability') {
    patch.unlocked_abilities = uniqueByAchievement(user.unlocked_abilities || [], achievement.id, rewardRecord);
  } else if (category === 'companion') {
    patch.companions = uniqueByAchievement(user.companions || [], achievement.id, rewardRecord);
  } else if (category === 'environment') {
    patch.unlocked_environments = uniqueByAchievement(user.unlocked_environments || [], achievement.id, {
      ...rewardRecord,
      environment_id: reward.environment_id || '',
      thumbnail: reward.environment_thumbnail || reward.image || ''
    });
  } else if (category === 'teacher') {
    patch.teachers = uniqueByAchievement(user.teachers || [], achievement.id, {
      ...rewardRecord,
      perks: reward.abilities || reward.perks || []
    });
  }

  await base44.asServiceRole.entities.User.update(user.id, patch);

  const avatars = await base44.asServiceRole.entities.Avatar.filter({ user_id: user.id }, '-created_date', 1);
  if (avatars[0]) {
    const avatar = avatars[0];
    const avatarPatch: AnyObj = {};
    if (category === 'ability' && !((avatar.unlocked_abilities || []).includes(userCard.id))) {
      avatarPatch.unlocked_abilities = [...(avatar.unlocked_abilities || []), userCard.id];
    }
    if (category === 'companion' && !((avatar.active_companions || []).includes(userCard.id))) {
      // Companions are unlocked here, but not automatically activated in combat.
      avatarPatch.active_companions = avatar.active_companions || [];
    }
    if (Object.keys(avatarPatch).length) await base44.asServiceRole.entities.Avatar.update(avatar.id, avatarPatch);

    const homes = await base44.asServiceRole.entities.AvatarHomeState.filter({ avatarId: avatar.id }, '-created_date', 1);
    if (homes[0]) {
      const currentLog = homes[0].activityLog || [];
      const activity = {
        type: 'achievement_reward',
        achievement_id: achievement.id,
        user_card_id: userCard.id,
        reward_type: category,
        reward_name: rewardName,
        timestamp: now
      };
      await base44.asServiceRole.entities.AvatarHomeState.update(homes[0].id, {
        activityLog: [...currentLog.slice(-49), activity],
        achievements: [...(homes[0].achievements || []).filter((x: AnyObj) => x?.achievement_id !== achievement.id), rewardRecord]
      });
    }
  }

  return { userCard, rewardRecord };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, achievementId } = await req.json();

    if (action === 'awardAchievement') {
      if (!achievementId) return Response.json({ error: 'Missing achievementId' }, { status: 400 });
      const achievement = await base44.asServiceRole.entities.Achievement.get(achievementId).catch(() => null);
      if (!achievement) return Response.json({ error: 'Achievement not found' }, { status: 404 });

      const existing = await base44.asServiceRole.entities.UserAchievement.filter({ user_id: user.id, achievement_id: achievementId }, '-created_date', 1);
      const userAchievement = existing[0] || await base44.asServiceRole.entities.UserAchievement.create({
        user_id: user.id,
        achievement_id: achievementId,
        status: 'unlocked',
        progress: { current: 100, total: 100, reward: achievement.reward || null },
        unlocked_at: new Date().toISOString()
      });

      const freshUser = await base44.asServiceRole.entities.User.get(user.id);
      const currentUnlocked = freshUser.unlocked_achievements || [];
      if (!currentUnlocked.includes(achievementId)) {
        await base44.asServiceRole.entities.User.update(user.id, {
          unlocked_achievements: [...currentUnlocked, achievementId]
        });
      }

      const latestUser = await base44.asServiceRole.entities.User.get(user.id);
      const { userCard, rewardRecord } = await ensureReward(base44, latestUser, achievement);

      return Response.json({
        success: true,
        unlocked: true,
        already_unlocked: existing.length > 0,
        message: existing.length ? `Reward synced: ${achievement.title}` : `Unlocked: ${achievement.title}`,
        achievement,
        userAchievement,
        userCard,
        reward: rewardRecord
      });
    }

    if (action === 'getUserAchievements') {
      const [userAchievements, allAchievements] = await Promise.all([
        base44.asServiceRole.entities.UserAchievement.filter({ user_id: user.id }, '-unlocked_at', 1000),
        base44.asServiceRole.entities.Achievement.list('title', 5000)
      ]);
      const achievementMap = new Map(allAchievements.map((a: AnyObj) => [a.id, a]));
      const enriched = userAchievements.map((ua: AnyObj) => {
        const def: AnyObj = achievementMap.get(ua.achievement_id) || {};
        return {
          ...ua,
          title: def.title || 'Unknown',
          description: def.description || '',
          icon: def.icon || '🏆',
          points: def.points || 0,
          rarity: def.rarity || 'Common',
          category: def.category || 'standard',
          reward: def.reward || null
        };
      });
      return Response.json({ achievements: enriched });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});
