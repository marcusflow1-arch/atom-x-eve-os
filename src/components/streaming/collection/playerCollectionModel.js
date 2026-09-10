const key = (value) => String(value || '').trim().toLowerCase();
const finite = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null;

export function buildPlayerCollection({ user, ownedCards = [], userAchievements = [], achievements = [], tradingCards = [], games = [], libraryEntries = [] }) {
  const definitions = new Map(achievements.map((item) => [item.id, item]));
  const templates = new Map(tradingCards.map((item) => [item.id, item]));
  const progress = new Map(userAchievements.map((item) => [item.achievement_id, item]));
  const rewards = new Map((user?.achievement_rewards || []).map((item) => [item.achievement_id, item]));
  const gameById = new Map(games.map((item) => [item.id, item]));
  const gameByName = new Map(games.map((item) => [key(item.title), item]));
  const grouped = new Map();
  const addGame = (name, id, genre, image) => {
    const source = gameById.get(id) || gameByName.get(key(name));
    const title = source?.title || name || 'Unassigned game';
    const gameKey = source?.id || id || key(title);
    if (!grouped.has(gameKey)) grouped.set(gameKey, { id: gameKey, title, genre: source?.genre || genre || 'Other', image: source?.cover_image || source?.banner_image || image, cards: [] });
    return grouped.get(gameKey);
  };
  const added = new Set();
  const makeCard = (achievementId, owned) => {
    if (achievementId && added.has(achievementId)) return;
    if (achievementId) added.add(achievementId);
    const definition = definitions.get(achievementId);
    const record = progress.get(achievementId);
    const template = templates.get(owned?.trading_card_id);
    const reward = record?.progress?.reward || rewards.get(achievementId);
    const status = record?.status || ((user?.unlocked_achievements || []).includes(achievementId) || reward ? 'unlocked' : owned?.acquisition_method === 'unlocked' ? 'unlocked' : 'collected');
    const game = addGame(owned?.game_name || definition?.game || reward?.game, owned?.game_id, owned?.genre, owned?.card_image);
    const current = finite(record?.progress?.current);
    const total = finite(record?.progress?.total);
    const card = {
      id: achievementId ? `achievement:${achievementId}` : `card:${owned.id}`,
      name: definition?.title || owned?.card_name || template?.name || reward?.name || 'Saved achievement',
      description: definition?.description || template?.description || reward?.description || 'No description has been saved for this achievement.',
      rarity: definition?.rarity || owned?.card_rarity || template?.rarity || reward?.rarity || 'Common',
      category: definition?.category || owned?.card_type || 'Achievement',
      image: owned?.card_image || template?.image_url || definition?.reward?.environment_thumbnail || game.image,
      game: { id: game.id, title: game.title }, status,
      unlockDate: owned?.unlocked_date || reward?.granted_at || null,
      current, total,
      percent: total > 0 && current !== null ? Math.min(100, Math.max(0, current / total * 100)) : status === 'unlocked' ? 100 : null,
      points: finite(record?.progress?.xp_awarded ?? definition?.points ?? reward?.xp),
      proofUrl: record?.proof_media_url || null,
      acquisition: owned?.acquisition_method || null,
    };
    const existing = game.cards.findIndex((item) => item.id === card.id);
    if (existing < 0) game.cards.push(card);
    return card;
  };
  ownedCards.forEach((owned) => makeCard(templates.get(owned.trading_card_id)?.achievement_id, owned));
  const achievementIds = new Set([...progress.keys(), ...(user?.unlocked_achievements || []), ...rewards.keys()]);
  achievementIds.forEach((id) => makeCard(id));
  for (const id of [...(user?.purchased_items || []), user?.current_activity?.gameId].filter(Boolean)) {
    const game = gameById.get(id);
    if (game) addGame(game.title, game.id);
  }
  for (const entry of libraryEntries) {
    if (entry.last_played || entry.play_time_minutes > 0) addGame(entry.game_title, entry.game_id, entry.game_genre, entry.game_cover);
  }
  return [...grouped.values()].sort((a, b) => a.title.localeCompare(b.title));
}

export function filterCollectionGames(games, search, genre) {
  const needle = key(search);
  return games.filter((game) => (!needle || key(game.title).includes(needle)) && (genre === 'All genres' || game.genre === genre));
}

export function measureCollectionDock(chrome, height, width) {
  let top = 64;
  let bottom = 53;
  for (const rect of chrome) {
    if (rect.width < width * 0.6 || rect.height <= 0 || rect.height > height * 0.35) continue;
    if (rect.top <= 1 && rect.bottom > 0) top = Math.max(top, rect.bottom);
    if (rect.bottom >= height - 1 && rect.top < height) bottom = Math.max(bottom, height - rect.top);
  }
  return { top, bottom };
}
