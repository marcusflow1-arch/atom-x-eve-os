import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

type AnyObj = Record<string, any>;
const json = (body: unknown, status = 200) => Response.json(body, { status });
const nowIso = () => new Date().toISOString();

const RARITY_POWER: Record<string, number> = {
  Common: 5,
  Uncommon: 10,
  Rare: 20,
  Epic: 35,
  Legendary: 55,
  Mythic: 80,
  Unique: 100,
};

const DEFAULT_ACTIVITIES = [
  {
    activity_key: 'training_sentinels',
    mode: 'pve',
    activity_type: 'mob',
    title: 'Sentinel Trial',
    subtitle: 'Solo combat drill',
    description: 'Test your four-card loadout against a controlled pack of combat sentinels.',
    difficulty: 'normal',
    enemy_name: 'Sentinel Pack',
    enemy_level: 8,
    max_hp: 420,
    current_hp: 420,
    recommended_power: 180,
    objective_text: 'Defeat the sentinel pack',
    objective_target: 1,
    region: 'Arena Annex',
    biome: 'Simulation Chamber',
    reward_xp: 120,
    reward_card_xp: 35,
    reward_agp: 40,
    reward_description: '120 Avatar XP · 35 Card XP · 40 AGP',
    status: 'active',
    participants_count: 0,
    revision: 1,
  },
  {
    activity_key: 'ironmaw_hunt',
    mode: 'pve',
    activity_type: 'boss',
    title: 'Ironmaw Hunt',
    subtitle: 'One player · one boss',
    description: 'Face a heavy boss encounter designed to expose weaknesses in your card synergy.',
    difficulty: 'hard',
    enemy_name: 'Ironmaw',
    enemy_level: 24,
    max_hp: 2200,
    current_hp: 2200,
    recommended_power: 460,
    objective_text: 'Defeat Ironmaw',
    objective_target: 1,
    region: 'Broken Gate',
    biome: 'Ash Wastes',
    reward_xp: 420,
    reward_card_xp: 100,
    reward_agp: 160,
    reward_description: '420 Avatar XP · 100 Card XP · 160 AGP',
    status: 'active',
    participants_count: 0,
    revision: 1,
  },
  {
    activity_key: 'relic_cache_run',
    mode: 'pvwe',
    activity_type: 'treasure',
    title: 'Relic Cache Run',
    subtitle: 'Explore · search · extract',
    description: 'Push through a hostile world zone, locate hidden caches, and extract before the route collapses.',
    difficulty: 'normal',
    enemy_name: '',
    enemy_level: 10,
    max_hp: 0,
    current_hp: 0,
    recommended_power: 160,
    objective_text: 'Locate 3 treasure caches',
    objective_target: 3,
    region: 'Shattered Reach',
    biome: 'Ruined Highlands',
    reward_xp: 180,
    reward_card_xp: 45,
    reward_agp: 75,
    reward_description: '180 Avatar XP · 45 Card XP · 75 AGP',
    status: 'active',
    participants_count: 0,
    revision: 1,
  },
  {
    activity_key: 'rift_patrol',
    mode: 'pvwe',
    activity_type: 'quest',
    title: 'Rift Patrol',
    subtitle: 'World quest chain',
    description: 'Clear corrupted zones, defeat elite patrols, and secure the route for the wider world.',
    difficulty: 'elite',
    enemy_name: 'Rift Vanguard',
    enemy_level: 32,
    max_hp: 1600,
    current_hp: 1600,
    recommended_power: 620,
    objective_text: 'Complete 4 world objectives',
    objective_target: 4,
    region: 'Void Frontier',
    biome: 'Dimensional Scar',
    reward_xp: 650,
    reward_card_xp: 150,
    reward_agp: 220,
    reward_description: '650 Avatar XP · 150 Card XP · 220 AGP',
    status: 'active',
    participants_count: 0,
    revision: 1,
  },
  {
    activity_key: 'abyssal_leviathan',
    mode: 'pvwe',
    activity_type: 'world_boss',
    title: 'Abyssal Leviathan',
    subtitle: 'Shared world boss',
    description: 'A persistent world threat. Every player damages the same boss health pool with their current card loadout.',
    difficulty: 'mythic',
    enemy_name: 'Abyssal Leviathan',
    enemy_level: 60,
    max_hp: 250000,
    current_hp: 250000,
    recommended_power: 900,
    objective_text: 'Break the Leviathan world-health pool',
    objective_target: 250000,
    region: 'Leviathan Trench',
    biome: 'World Rift',
    reward_xp: 1200,
    reward_card_xp: 250,
    reward_agp: 500,
    reward_description: '1,200 Avatar XP · 250 Card XP · 500 AGP',
    status: 'active',
    participants_count: 0,
    revision: 1,
  },
];

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function compactCard(card: AnyObj, progression?: AnyObj | null) {
  const level = safeNumber(progression?.level, 1);
  const progressionPower = safeNumber(progression?.power_score);
  const rarityPower = RARITY_POWER[String(card.card_rarity || 'Common')] || 5;
  const power = Math.max(15, progressionPower || (level * 12 + rarityPower));
  return {
    id: card.id,
    user_card_id: card.id,
    name: card.card_name || 'Card',
    card_name: card.card_name || 'Card',
    type: card.card_type || 'Ability',
    rarity: card.card_rarity || 'Common',
    image: card.card_image || '',
    game_name: card.game_name || '',
    level,
    power,
    active_perks: progression?.active_perks || [],
  };
}

async function ensureActivities(base44: any) {
  const svc = base44.asServiceRole.entities;
  const out = [];
  for (const seed of DEFAULT_ACTIVITIES) {
    const existing = await svc.AIBattleActivity.filter({ activity_key: seed.activity_key }, '-created_date', 1);
    if (existing?.[0]) {
      out.push(existing[0]);
      continue;
    }
    out.push(await svc.AIBattleActivity.create({
      ...seed,
      starts_at: nowIso(),
      ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    }));
  }
  return out;
}

async function loadSnapshot(base44: any, userId: string) {
  const svc = base44.asServiceRole.entities;
  const [loadouts, cards, progressions, avatarRows] = await Promise.all([
    svc.Loadout.filter({ user_id: userId, loadout_type: 'skills' }, '-created_date', 1),
    svc.UserCard.filter({ user_id: userId }, '-created_date', 1000),
    svc.CardProgression.filter({ user_id: userId }, '-updated_date', 1500).catch(() => []),
    svc.AvatarProgression.filter({ user_id: userId }, '-created_date', 1).catch(() => []),
  ]);

  const loadout = loadouts?.[0] || null;
  const slots = loadout?.skill_slots || {};
  const cardById = new Map((cards || []).map((card: AnyObj) => [String(card.id), card]));
  const progressionByCard = new Map((progressions || []).map((row: AnyObj) => [String(row.user_card_id), row]));

  const cardSnapshot = Array.from({ length: 4 }, (_, index) => {
    const id = slots[String(index)] || slots[index];
    if (!id) return null;
    const card = cardById.get(String(id));
    if (!card) return null;
    return compactCard(card, progressionByCard.get(String(id)) || null);
  }).filter(Boolean);

  const avatar = avatarRows?.[0] || null;
  const stats = avatar?.stats || {};
  const level = safeNumber(avatar?.global_level, 1);
  const avatarPower = Math.round(
    safeNumber(stats.hp, 100) * 0.2 +
    safeNumber(stats.strength, 10) * 2.2 +
    safeNumber(stats.intelligence, 10) * 2.1 +
    safeNumber(stats.will, 10) * 1.7 +
    safeNumber(stats.tenacity, 10) * 1.8 +
    level * 10
  );
  const cardPower = cardSnapshot.reduce((sum: number, card: AnyObj) => sum + safeNumber(card.power), 0);
  const playerPower = Math.max(50, avatarPower + cardPower);
  const playerHp = Math.max(100, safeNumber(stats.hp, 100) + level * 8);

  return {
    loadout,
    cardSnapshot,
    avatar,
    avatarSnapshot: {
      level,
      global_xp: safeNumber(avatar?.global_xp),
      stats: { ...stats },
    },
    playerPower,
    playerHp,
  };
}

async function applyRewards(base44: any, user: AnyObj, session: AnyObj, activity: AnyObj) {
  if (session.rewards_applied) return session.reward_summary || {};
  const svc = base44.asServiceRole.entities;
  const avatarXp = safeNumber(activity.reward_xp);
  const cardXp = safeNumber(activity.reward_card_xp);
  const agp = safeNumber(activity.reward_agp);
  const snapshot = Array.isArray(session.card_snapshot) ? session.card_snapshot : [];

  const avatarRows = await svc.AvatarProgression.filter({ user_id: user.id }, '-created_date', 1);
  const avatar = avatarRows?.[0];
  if (avatar) {
    const nextXp = safeNumber(avatar.global_xp) + avatarXp;
    const nextLevel = Math.max(safeNumber(avatar.global_level, 1), 1 + Math.floor(nextXp / 1000));
    await svc.AvatarProgression.update(avatar.id, {
      global_xp: nextXp,
      global_level: nextLevel,
    });
  } else {
    await svc.AvatarProgression.create({
      user_id: user.id,
      global_level: 1 + Math.floor(avatarXp / 1000),
      global_xp: avatarXp,
    });
  }

  for (const card of snapshot) {
    const rows = await svc.CardProgression.filter({ user_card_id: card.user_card_id }, '-updated_date', 1);
    const progress = rows?.[0];
    if (!progress) continue;
    let xp = safeNumber(progress.xp) + cardXp;
    let level = safeNumber(progress.level, 1);
    let xpToNext = Math.max(1, safeNumber(progress.xp_to_next, 120));
    let skillPoints = safeNumber(progress.skill_points, 0);
    while (xp >= xpToNext && level < safeNumber(progress.max_level, 10)) {
      xp -= xpToNext;
      level += 1;
      skillPoints += 1;
      xpToNext = Math.max(120, Math.round(xpToNext * 1.22));
    }
    await svc.CardProgression.update(progress.id, {
      xp,
      level,
      xp_to_next: xpToNext,
      skill_points: skillPoints,
      last_action: 'ai_battle_reward',
      last_action_at: nowIso(),
      revision: safeNumber(progress.revision, 0) + 1,
    });
  }

  if (agp > 0) {
    await svc.User.update(user.id, {
      avatar_gamer_points: safeNumber(user.avatar_gamer_points) + agp,
    });
  }

  const summary = { avatar_xp: avatarXp, card_xp_each: cardXp, agp };
  await svc.AIBattleSession.update(session.id, { rewards_applied: true, reward_summary: summary });
  return summary;
}

async function completeSession(base44: any, user: AnyObj, session: AnyObj, activity: AnyObj, patch: AnyObj = {}) {
  const svc = base44.asServiceRole.entities;
  const updated = await svc.AIBattleSession.update(session.id, {
    ...patch,
    status: 'completed',
    completed_at: nowIso(),
    last_action: patch.last_action || 'completed',
    last_action_at: nowIso(),
  });
  const rewards = await applyRewards(base44, user, updated, activity);
  return { ...updated, reward_summary: rewards, rewards_applied: true };
}

async function getState(base44: any, user: AnyObj) {
  const svc = base44.asServiceRole.entities;
  const activities = await ensureActivities(base44);
  const snapshot = await loadSnapshot(base44, user.id);

  const [sessions, duelA, duelB, friends] = await Promise.all([
    svc.AIBattleSession.filter({ user_id: user.id }, '-created_date', 50).catch(() => []),
    svc.DuelSession.filter({ challenger_id: user.id }, '-created_date', 50).catch(() => []),
    svc.DuelSession.filter({ opponent_id: user.id }, '-created_date', 50).catch(() => []),
    svc.Friend.filter({ user_id: user.id }, '-favorite', 250).catch(() => []),
  ]);

  const duelMap = new Map<string, AnyObj>();
  for (const duel of [...(duelA || []), ...(duelB || [])]) duelMap.set(String(duel.id), duel);
  const duels = [...duelMap.values()].sort((a, b) => Date.parse(b.created_date || '') - Date.parse(a.created_date || ''));

  const finished = duels.filter((duel) => duel.status === 'finished');
  const wins = finished.filter((duel) => String(duel.winner_id) === String(user.id)).length;
  const losses = finished.filter((duel) => String(duel.loser_id) === String(user.id)).length;

  return {
    success: true,
    activities: (activities || []).filter((row: AnyObj) => row.status !== 'completed'),
    sessions: sessions || [],
    duels,
    opponents: (friends || []).map((friend: AnyObj) => ({
      id: friend.friend_id,
      name: friend.friend_name || 'Player',
      avatar: friend.friend_avatar || '',
      status: friend.status || 'offline',
      current_game: friend.current_game || '',
      favorite: Boolean(friend.favorite),
    })),
    loadout: {
      cards: snapshot.cardSnapshot,
      player_power: snapshot.playerPower,
      player_hp: snapshot.playerHp,
      avatar: snapshot.avatarSnapshot,
    },
    pvp: {
      wins,
      losses,
      matches: finished.length,
      active_duel: duels.find((duel) => duel.status === 'active') || null,
    },
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'getState');
    const data = body?.data || {};
    const svc = base44.asServiceRole.entities;

    if (action === 'getState') return json(await getState(base44, user));

    if (action === 'startActivity') {
      const activityId = String(data.activity_id || '');
      const activity = activityId ? await svc.AIBattleActivity.get(activityId).catch(() => null) : null;
      if (!activity || activity.status !== 'active') return json({ error: 'Battle activity is not available.' }, 404);

      const active = await svc.AIBattleSession.filter({ user_id: user.id, status: 'active' }, '-created_date', 10);
      const same = (active || []).find((row: AnyObj) => String(row.activity_id) === String(activity.id));
      if (same) return json({ success: true, session: same, state: await getState(base44, user) });

      const snapshot = await loadSnapshot(base44, user.id);
      if (!snapshot.cardSnapshot.length) return json({ error: 'Equip at least one card in the Skill Book before entering battle.' }, 409);

      const sharedHp = activity.activity_type === 'world_boss'
        ? Math.max(0, safeNumber(activity.current_hp, activity.max_hp))
        : Math.max(0, safeNumber(activity.max_hp, 100));

      const session = await svc.AIBattleSession.create({
        user_id: user.id,
        mode: activity.mode,
        activity_id: activity.id,
        activity_title: activity.title,
        activity_type: activity.activity_type,
        status: 'active',
        started_at: nowIso(),
        player_power: snapshot.playerPower,
        player_hp_max: snapshot.playerHp,
        player_hp_current: snapshot.playerHp,
        enemy_hp_max: safeNumber(activity.max_hp),
        enemy_hp_current: sharedHp,
        damage_dealt: 0,
        damage_taken: 0,
        objective_progress: 0,
        objective_target: Math.max(1, safeNumber(activity.objective_target, 1)),
        card_snapshot: snapshot.cardSnapshot,
        avatar_snapshot: snapshot.avatarSnapshot,
        rewards_applied: false,
        reward_summary: {},
        last_action: 'started',
        last_action_at: nowIso(),
      });
      await svc.AIBattleActivity.update(activity.id, {
        participants_count: safeNumber(activity.participants_count) + 1,
        revision: safeNumber(activity.revision, 0) + 1,
      });
      return json({ success: true, session, state: await getState(base44, user) });
    }

    if (action === 'act') {
      const sessionId = String(data.session_id || '');
      const session = sessionId ? await svc.AIBattleSession.get(sessionId).catch(() => null) : null;
      if (!session || String(session.user_id) !== String(user.id)) return json({ error: 'Battle session not found.' }, 404);
      if (session.status !== 'active') return json({ error: 'This encounter is no longer active.' }, 409);

      const activity = await svc.AIBattleActivity.get(session.activity_id).catch(() => null);
      if (!activity) return json({ error: 'Battle activity no longer exists.' }, 404);

      if (['treasure', 'quest'].includes(String(activity.activity_type))) {
        const nextProgress = Math.min(
          safeNumber(session.objective_target, 1),
          safeNumber(session.objective_progress) + 1
        );
        if (nextProgress >= safeNumber(session.objective_target, 1)) {
          const completed = await completeSession(base44, user, session, activity, {
            objective_progress: nextProgress,
            last_action: activity.activity_type === 'treasure' ? 'cache_found' : 'objective_completed',
          });
          return json({ success: true, session: completed, state: await getState(base44, user) });
        }
        const updated = await svc.AIBattleSession.update(session.id, {
          objective_progress: nextProgress,
          last_action: activity.activity_type === 'treasure' ? 'cache_found' : 'objective_progress',
          last_action_at: nowIso(),
        });
        return json({ success: true, session: updated, state: await getState(base44, user) });
      }

      const power = Math.max(50, safeNumber(session.player_power));
      const difficulty = String(activity.difficulty || 'normal');
      const difficultyScale = difficulty === 'mythic' ? 1.45 : difficulty === 'elite' ? 1.25 : difficulty === 'hard' ? 1.1 : 0.9;
      const playerDamage = Math.max(10, Math.round(power * (0.15 + Math.random() * 0.08)));
      const enemyDamage = Math.max(5, Math.round((safeNumber(activity.enemy_level, 1) * 3.6 + safeNumber(activity.recommended_power) * 0.018) * difficultyScale * (0.85 + Math.random() * 0.3)));

      let enemyHp = safeNumber(session.enemy_hp_current, activity.max_hp);
      if (activity.activity_type === 'world_boss') enemyHp = safeNumber(activity.current_hp, activity.max_hp);
      const nextEnemyHp = Math.max(0, enemyHp - playerDamage);
      const nextPlayerHp = Math.max(0, safeNumber(session.player_hp_current, session.player_hp_max) - (nextEnemyHp > 0 ? enemyDamage : 0));

      if (activity.activity_type === 'world_boss') {
        await svc.AIBattleActivity.update(activity.id, {
          current_hp: nextEnemyHp,
          status: nextEnemyHp <= 0 ? 'completed' : activity.status,
          revision: safeNumber(activity.revision, 0) + 1,
        });
      }

      if (nextPlayerHp <= 0) {
        const failed = await svc.AIBattleSession.update(session.id, {
          player_hp_current: 0,
          enemy_hp_current: nextEnemyHp,
          damage_dealt: safeNumber(session.damage_dealt) + playerDamage,
          damage_taken: safeNumber(session.damage_taken) + enemyDamage,
          status: 'failed',
          completed_at: nowIso(),
          last_action: 'defeated',
          last_action_at: nowIso(),
        });
        return json({ success: true, session: failed, state: await getState(base44, user) });
      }

      if (nextEnemyHp <= 0) {
        const completed = await completeSession(base44, user, session, activity, {
          player_hp_current: nextPlayerHp,
          enemy_hp_current: 0,
          damage_dealt: safeNumber(session.damage_dealt) + playerDamage,
          damage_taken: safeNumber(session.damage_taken) + (nextEnemyHp > 0 ? enemyDamage : 0),
          objective_progress: safeNumber(session.objective_target, 1),
          last_action: 'victory',
        });
        return json({ success: true, session: completed, state: await getState(base44, user) });
      }

      const updated = await svc.AIBattleSession.update(session.id, {
        player_hp_current: nextPlayerHp,
        enemy_hp_current: nextEnemyHp,
        damage_dealt: safeNumber(session.damage_dealt) + playerDamage,
        damage_taken: safeNumber(session.damage_taken) + enemyDamage,
        last_action: 'attack',
        last_action_at: nowIso(),
      });
      return json({ success: true, session: updated, state: await getState(base44, user) });
    }

    if (action === 'abandon') {
      const sessionId = String(data.session_id || '');
      const session = sessionId ? await svc.AIBattleSession.get(sessionId).catch(() => null) : null;
      if (!session || String(session.user_id) !== String(user.id)) return json({ error: 'Battle session not found.' }, 404);
      const updated = await svc.AIBattleSession.update(session.id, {
        status: 'abandoned',
        completed_at: nowIso(),
        last_action: 'abandoned',
        last_action_at: nowIso(),
      });
      return json({ success: true, session: updated, state: await getState(base44, user) });
    }

    if (action === 'snapshotDuel') {
      const duelId = String(data.duel_id || '');
      const duel = duelId ? await svc.DuelSession.get(duelId).catch(() => null) : null;
      if (!duel || ![String(duel.challenger_id), String(duel.opponent_id)].includes(String(user.id))) {
        return json({ error: 'Duel not found.' }, 404);
      }
      const [challenger, opponent] = await Promise.all([
        loadSnapshot(base44, duel.challenger_id),
        loadSnapshot(base44, duel.opponent_id),
      ]);
      const updated = await svc.DuelSession.update(duel.id, {
        challenger_loadout: challenger.cardSnapshot,
        opponent_loadout: opponent.cardSnapshot,
        challenger_power: challenger.playerPower,
        opponent_power: opponent.playerPower,
        battle_format: 'card_duel',
      });
      return json({ success: true, duel: updated });
    }

    return json({ error: 'Unknown AI Battle action.' }, 400);
  } catch (error) {
    console.error('aiBattleHub failed', error);
    return json({ error: error instanceof Error ? error.message : 'AI Battle request failed.' }, 500);
  }
});
