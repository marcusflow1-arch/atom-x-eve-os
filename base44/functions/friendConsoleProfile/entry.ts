import { createClientFromRequest } from 'npm:@base44/sdk@0.8.51';

type Row = Record<string, any>;

const json = (body: any, status = 200) => Response.json(body, { status });
const asArray = (value: any) => Array.isArray(value) ? value : (Array.isArray(value?.data) ? value.data : []);
const nameOf = (user: Row | null, fallback = 'Player') =>
  user?.full_name || user?.display_name || user?.username || user?.email?.split?.('@')?.[0] || fallback;
const avatarOf = (user: Row | null) => user?.avatar_url || user?.profile_image || '';

function publicAvatar(row: Row | null) {
  if (!row) return null;
  const keys = [
    'name','gender','female_model_variant','model_url','base_body_gender','base_body_model_url',
    'appearance_version','style_preset','skin_tone','eye_color','hair_color','complexion',
    'facial_hair','facial_hair_color','tattoo_style','tattoo_placement','tattoo_color',
    'tattoo_opacity','hair_style','hair_length','hair_volume','face_shape','height_scale',
    'body_proportions','material_colors','morph_targets','eyelash_style','hood_enabled','weapon_visible',
    'level','experience',
  ];
  return Object.fromEntries(keys.filter((key) => row[key] !== undefined).map((key) => [key, row[key]]));
}

function publicCard(row: Row) {
  return {
    id: row.id,
    name: row.card_name || 'Card',
    type: row.card_type || 'collectible',
    rarity: row.card_rarity || 'Common',
    image: row.card_image || '',
    game_id: row.game_id || '',
    game_name: row.game_name || '',
    genre: row.genre || '',
    acquired_at: row.acquired_at || row.unlocked_date || row.created_date || null,
    equipped: Boolean(row.is_equipped || (row.equipped_to && row.equipped_to !== 'none')),
  };
}

function publicGame(row: Row) {
  return {
    id: row.id,
    title: row.title || 'Game',
    genre: row.genre || 'other',
    cover_image: row.cover_image || row.image || '',
    banner_image: row.banner_image || '',
    status: row.status || 'available',
  };
}

Deno.serve(async (req) => {
  try {
    const client = createClientFromRequest(req);
    const user = await client.auth.me();
    if (!user) return json({ error: 'Sign in to view a friend profile.' }, 401);

    const payload = await req.json().catch(() => ({}));
    const targetId = String(payload?.target_user_id || payload?.data?.target_user_id || '').trim();
    if (!targetId) return json({ error: 'Friend profile requires a player.' }, 400);

    const svc = client.asServiceRole.entities;
    const self = targetId === String(user.id);

    let friendship: Row | null = null;
    if (!self) {
      const mine = await svc.Friend.filter({ user_id: String(user.id), friend_id: targetId }, '-created_date', 1).catch(() => []);
      friendship = mine?.[0] || null;
      if (!friendship) return json({ error: 'This console profile is available to friends only.' }, 403);
    }

    const [
      targetUser,
      avatarRows,
      progressionRows,
      achievementRows,
      cardRows,
      entitlementRows,
      genreRows,
      presenceRows,
      allAchievements,
      allGames,
    ] = await Promise.all([
      svc.User.get(targetId).catch(() => null),
      svc.Avatar.filter({ user_id: targetId }, '-updated_date', 1).catch(() => []),
      svc.AvatarProgression.filter({ user_id: targetId }, '-updated_date', 1).catch(() => []),
      svc.UserAchievement.filter({ user_id: targetId, status: 'unlocked' }, '-unlocked_at', 250).catch(() => []),
      svc.UserCard.filter({ user_id: targetId }, '-acquired_at', 250).catch(() => []),
      svc.Entitlement.filter({ user_id: targetId, item_type: 'game' }, '-granted_at', 250).catch(() => []),
      svc.GenreSkillProgress.filter({ user_id: targetId }, '-updated_date', 50).catch(() => []),
      svc.PlayerState.filter({ player_id: targetId }, '-last_update', 10).catch(() => []),
      svc.Achievement.list('title', 5000).catch(() => []),
      svc.Game.list('title', 5000).catch(() => []),
    ]);

    const avatar = avatarRows?.[0] || null;
    const progression = progressionRows?.[0] || null;
    const presence = [...asArray(presenceRows)].sort((a, b) => Number(b.last_update || 0) - Number(a.last_update || 0))[0] || null;
    const online = Boolean(presence && presence.status !== 'offline' && Number(presence.last_update || 0) > Date.now() - 120000);

    const achievementMap = new Map(asArray(allAchievements).map((row: Row) => [String(row.id), row]));
    const achievements = asArray(achievementRows).map((row: Row) => {
      const definition = achievementMap.get(String(row.achievement_id)) || {};
      return {
        id: row.id,
        achievement_id: row.achievement_id,
        title: definition.title || 'Achievement',
        description: definition.description || '',
        game: definition.game || '',
        game_id: definition.game_id || '',
        category: definition.category || 'standard',
        rarity: definition.rarity || 'Common',
        points: Number(definition.points || 0),
        icon: definition.icon || '',
        unlocked_at: row.unlocked_at || null,
      };
    });

    const cards = asArray(cardRows).map(publicCard);
    const gameMap = new Map(asArray(allGames).map((row: Row) => [String(row.id), row]));
    const gameIds = new Set<string>();

    for (const row of asArray(entitlementRows)) {
      if (row.revoked) continue;
      const id = String(row.game_id || row.item_id || '');
      if (id) gameIds.add(id);
    }
    for (const card of cards) if (card.game_id) gameIds.add(String(card.game_id));
    for (const achievement of achievements) if (achievement.game_id) gameIds.add(String(achievement.game_id));

    const games = [...gameIds]
      .map((id) => gameMap.get(id))
      .filter(Boolean)
      .map(publicGame)
      .slice(0, 24);

    const progressionGenres = asArray(progression?.genres).map((genre: Row) => ({
      id: String(genre.id || genre.name || '').toLowerCase().replace(/\s+/g, '_'),
      name: genre.name || genre.id || 'Genre',
      level: Number(genre.level || 1),
      xp: Number(genre.xp || genre.current_xp || 0),
    }));

    const skillGenres = asArray(genreRows).map((genre: Row) => ({
      id: String(genre.genre_id || ''),
      name: String(genre.genre_id || 'Genre').replace(/[_-]+/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      level: Number(genre.genre_level_snapshot || 1),
      xp: 0,
      skill_points: Number(genre.available_points || 0),
    }));

    const genreMap = new Map<string, Row>();
    for (const genre of [...progressionGenres, ...skillGenres]) {
      const key = String(genre.id || genre.name).toLowerCase();
      const prior = genreMap.get(key);
      genreMap.set(key, prior ? { ...prior, ...genre, level: Math.max(Number(prior.level || 1), Number(genre.level || 1)) } : genre);
    }
    const genres = [...genreMap.values()].sort((a, b) => Number(b.level || 1) - Number(a.level || 1));

    const unlockedPoints = achievements.reduce((sum: number, row: Row) => sum + Number(row.points || 0), 0);
    const currentActivity = targetUser?.current_activity || {};
    const currentGame = currentActivity.gameTitle || currentActivity.game || friendship?.current_game || '';

    return json({
      success: true,
      profile: {
        id: targetId,
        name: nameOf(targetUser, friendship?.friend_name || presence?.display_name || 'Player'),
        avatar_url: avatarOf(targetUser) || friendship?.friend_avatar || presence?.avatar_url || '',
        online,
        status: online ? (presence?.status || 'online') : 'offline',
        current_game: currentGame,
        avatar: publicAvatar(avatar) || (presence?.appearance ? { ...presence.appearance } : null),
        level: Number(progression?.global_level || avatar?.level || targetUser?.avatar_level || targetUser?.level || 1),
        xp: Number(progression?.global_xp || avatar?.experience || 0),
        prestige: Number(progression?.prestige_score || 0),
        genre_ranks: genres,
        achievements,
        achievement_points: unlockedPoints,
        cards,
        games,
        counts: {
          achievements: achievements.length,
          cards: cards.length,
          games: games.length,
          genres: genres.length,
        },
      },
    });
  } catch (error) {
    console.error('[friendConsoleProfile]', error);
    return json({ error: error?.message || 'Friend profile could not load.' }, Number(error?.status || 500));
  }
});
