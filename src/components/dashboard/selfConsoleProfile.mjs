// Signed-in player's profile data. This intentionally does not call the
// friends-only friendConsoleProfile cloud function, so the owner's popup
// works even when that cloud function has not been deployed.
const rows = value => Array.isArray(value) ? value : (Array.isArray(value?.data) ? value.data : []);
const safeMedia = value => typeof value === 'string' && (/^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value)) ? value : '';
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const gameData = row => ({
  id: String(row.id || ''), title: row.title || 'Game', genre: row.genre || 'other',
  description: String(row.description || '').slice(0, 400),
  cover_image: safeMedia(row.cover_image || row.image || ''),
  banner_image: safeMedia(row.banner_image || ''),
  screenshots: rows(row.screenshots).map(safeMedia).filter(Boolean).slice(0, 6),
  video_urls: [row.trailer_url, ...rows(row.video_urls)].map(safeMedia).filter(Boolean).slice(0, 2),
});

export function buildSelfConsoleProfile(user, avatar, data = {}) {
  const id = String(user?.id || '');
  const owned = rows(data.entitlements).filter(item => !item.revoked && (item.item_type === 'game' || item.game_id));
  const ownedIds = new Set(owned.map(item => String(item.game_id || item.item_id || '')).filter(Boolean));
  const history = rows(data.history);
  const playedIds = new Set(history.map(item => String(item.game_id || '')).filter(Boolean));
  const cards = rows(data.cards).map(card => ({
    id: card.id, name: card.card_name || card.name || 'Card',
    type: card.card_type || 'collectible', image: safeMedia(card.card_image),
    rarity: card.card_rarity || 'Common', game_id: card.game_id || '', game_name: card.game_name || '',
  }));
  const definitions = new Map(rows(data.definitions).map(item => [String(item.id), item]));
  const achievements = rows(data.achievements).map(unlock => {
    const record = definitions.get(String(unlock.achievement_id)) || {};
    return {
      id: unlock.id, game_id: record.game_id || '', game: record.game || '',
      title: record.title || unlock.title || 'Achievement', description: record.description || '',
      rarity: record.rarity || 'Common', points: number(record.points),
      icon: safeMedia(record.icon), unlocked_at: unlock.unlocked_at || '',
    };
  });
  for (const card of cards) if (card.game_id) ownedIds.add(String(card.game_id));
  for (const item of achievements) if (item.game_id) ownedIds.add(String(item.game_id));
  const catalog = rows(data.catalog).map(game => ({
    ...gameData(game), played: playedIds.has(String(game.id)),
    in_library: ownedIds.has(String(game.id)),
    last_played: history.find(item => String(item.game_id) === String(game.id))?.last_played || null,
  })).filter(game => game.id);
  catalog.sort((a, b) => Number(b.played) - Number(a.played) ||
    Number(b.in_library) - Number(a.in_library) || a.title.localeCompare(b.title));
  const progression = rows(data.progression)[0];
  return {
    id, name: user?.username || user?.display_name || user?.full_name || 'You',
    avatar_url: safeMedia(user?.avatar_url || user?.profile_image),
    bio: user?.bio || user?.social_profile?.tagline || '',
    online: true, status: 'online',
    current_game: user?.current_activity?.gameTitle || user?.current_activity?.game || '',
    avatar: avatar || null,
    gender: avatar?.gender || '',
    level: number(progression?.global_level || avatar?.level || user?.avatar_level || user?.level || 1),
    xp: number(progression?.global_xp || avatar?.experience),
    next_level_xp: number(progression?.next_level_xp),
    cards, achievements, games: catalog,
    counts: { games: catalog.filter(game => game.played).length, cards: cards.length,
      achievements: achievements.length, library_games: catalog.filter(game => game.in_library).length },
  };
}

export async function loadSelfConsoleProfile(client, user, avatar) {
  if (!user?.id) throw new Error('Sign in to view your profile.');
  const id = String(user.id);
  const safe = promise => Promise.resolve().then(promise).then(rows).catch(() => []);
  const [catalog, entitlements, history, cards, achievements, definitions, progression] = await Promise.all([
    safe(() => client.entities.Game.list('title', 250)),
    safe(() => client.entities.Entitlement.filter({ user_id: id, item_type: 'game' }, '-granted_at', 250)),
    safe(() => client.entities.StorePlayHistory.filter({ user_id: id }, '-last_played', 250)),
    safe(() => client.entities.UserCard.filter({ user_id: id }, '-acquired_at', 250)),
    safe(() => client.entities.UserAchievement.filter({ user_id: id, status: 'unlocked' }, '-unlocked_at', 250)),
    safe(() => client.entities.Achievement.list('title', 1500)),
    safe(() => client.entities.AvatarProgression.filter({ user_id: id }, '-updated_date', 1)),
  ]);
  return buildSelfConsoleProfile(user, avatar, { catalog, entitlements, history, cards, achievements, definitions, progression });
}
