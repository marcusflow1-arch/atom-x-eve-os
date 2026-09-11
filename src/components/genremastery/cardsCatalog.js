export const cardKey = (value) => String(value || '').trim().toLowerCase();
export function gameMatchesGenre(game, genre) {
  const words = (value) => ` ${cardKey(value).replace(/[^a-z0-9]+/g, ' ').trim()} `;
  return genre.matchGenres.some((match) => words(game.genre).includes(words(match)));
}
export const RARITY_COLORS = { Common: '#9aa7bc', Uncommon: '#70cfa4', Rare: '#7abaff', Epic: '#c2a0fa', Legendary: '#e5bc77', Mythic: '#ec94c7', Unique: '#86dedd' };

export async function readCardPages(read) {
  const records = new Map();
  for (let skip = 0; ; skip += 200) {
    const response = await read(200, skip);
    const page = Array.isArray(response) ? response : response?.data || [];
    const before = records.size;
    page.forEach((item) => records.set(item.id, item));
    if (page.length < 200 || records.size === before) break;
  }
  return [...records.values()];
}

export function buildCardCatalog({ games = [], achievements = [], masters = [], owned = [], unlocked = [] }) {
  const gameByName = new Map(games.map((game) => [cardKey(game.title), game]));
  const achievementById = new Map(achievements.map((item) => [item.id, item]));
  const linked = new Set(masters.map((item) => item.achievement_id).filter(Boolean));
  const rows = [
    ...masters.map((master) => {
      const achievement = achievementById.get(master.achievement_id);
      return { master, achievement, id: `card:${master.id}`, title: master.name, series: achievement?.game || master.series };
    }),
    ...achievements.filter((item) => !linked.has(item.id)).map((achievement) => ({ achievement, id: `achievement:${achievement.id}`, title: achievement.reward?.name || achievement.title, series: achievement.game })),
  ];
  const usedOwned = new Set();
  const cards = rows.map(({ master, achievement, ...row }) => {
    const game = gameByName.get(cardKey(row.series));
    const reward = achievement?.reward || {};
    const copies = owned.filter((item) => (master && item.trading_card_id === master.id) || (cardKey(item.game_name) === cardKey(row.series) && cardKey(item.card_name) === cardKey(row.title)));
    copies.forEach((item) => usedOwned.add(item.id));
    const type = cardKey(reward.type || copies[0]?.card_type);
    const group = /companion|pet|mount/.test(type) ? 'companion' : /equip|material|gear|weapon|armor/.test(type) ? 'equipment' : /abilit|skill/.test(type) ? 'skill' : 'achievement';
    const isUnlocked = Boolean(achievement && unlocked.includes(achievement.id));
    return { ...row, gameId: game?.id, genre: game?.genre, rarity: master?.rarity || achievement?.rarity || 'Common', image: master?.image_url || reward.image_url || copies[0]?.card_image || achievement?.image_url || game?.cover_image || game?.cover, description: master?.description || reward.description || achievement?.description, stats: reward.stats || {}, group, ownedCopies: copies, isOwned: copies.length > 0 || isUnlocked, isUnlocked, isPurchased: copies.some((item) => item.acquisition_method === 'purchased'), achievement_id: achievement?.id, showcase: master?.showcase || achievement?.showcase };
  });
  // Inventory can contain cards whose original catalog record has been retired.
  owned.filter((item) => !usedOwned.has(item.id)).forEach((item) => {
    const game = gameByName.get(cardKey(item.game_name));
    const existing = cards.find((card) => cardKey(card.title) === cardKey(item.card_name) && cardKey(card.series) === cardKey(item.game_name));
    if (existing) { existing.ownedCopies.push(item); existing.isOwned = true; return; }
    cards.push({ id: `owned:${item.id}`, title: item.card_name, series: item.game_name, gameId: game?.id || item.game_id, genre: game?.genre || item.genre, rarity: item.card_rarity || 'Common', image: item.card_image || game?.cover_image, group: ({ Equipment: 'equipment', Ability: 'skill', Companion: 'companion' })[item.card_type] || 'achievement', ownedCopies: [item], isOwned: true });
  });
  return cards;
}
