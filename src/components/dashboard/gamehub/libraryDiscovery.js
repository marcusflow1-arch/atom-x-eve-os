const alphabet = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
export const titleOrder = (a, b) => alphabet.compare(String(a.title || a.name || ''), String(b.title || b.name || '')) || alphabet.compare(String(a.id || ''), String(b.id || ''));
export const normalizedText = (value) => String(value || '').trim().toLocaleLowerCase();
export const isAdamXe = (game) => normalizedText(game?.title).replace(/[^a-z0-9]/g, '') === 'adamxe';
export function libraryGenres(item) {
  if (!Array.isArray(item?.genres) && isAdamXe(item)) return ['AdamXE'];
  const source = Array.isArray(item?.genres) ? item.genres : String(item?.genre || '').split(/\s*[/,|]\s*/);
  const names = source.map((value) => String(value).trim()).filter(Boolean);
  return names.length ? names : ['Uncategorized'];
}
export const genreMatches = (item, genre) => !genre || genre === 'all' || libraryGenres(item).some((value) => normalizedText(value) === normalizedText(genre));
export function genreOptions(items) {
  const names = new Map();
  items.flatMap(libraryGenres).forEach((name) => { if (!names.has(normalizedText(name))) names.set(normalizedText(name), name); });
  return [...names.values()].sort(alphabet.compare);
}
export function filterLibraryGames(games, { search = '', genre = 'all' } = {}) {
  const query = normalizedText(search);
  return games.filter((game) => genreMatches(game, genre) && normalizedText(game.title).includes(query)).slice().sort(titleOrder);
}
export function filterLibraryCards(cards, { search = '', genre = 'all', gameId = null } = {}) {
  const query = normalizedText(search);
  return cards.filter((card) => (!gameId || String(card.gameId) === String(gameId))
    && genreMatches(card, genre)
    && normalizedText([card.title, card.series, card.card_type].filter(Boolean).join(' ')).includes(query)).slice().sort(titleOrder);
}
export function enrichLibraryCards(cards, games) {
  const byId = new Map(games.map((game) => [String(game.id), game]));
  return cards.map((card) => {
    const game = byId.get(String(card.gameId || card.game_id || ''));
    return {
      ...card, title: card.title || card.name || 'Untitled card',
      series: isAdamXe(game) ? 'AdamXE' : game?.title || card.series || card.game_name || '',
      genre: isAdamXe(game) ? 'AdamXE' : game?.genre || card.genre || '',
      genres: game ? libraryGenres(game) : libraryGenres(card),
    };
  }).sort(titleOrder);
}
export function libraryScrollFrame(anchor, boundary, viewport) {
  if (!anchor || !anchor.width || !anchor.height) return null;
  const right = Math.min(boundary?.right || viewport.width - 16, viewport.width - 16);
  const left = anchor.right;
  // The unfolded game-card surface owns the vertical band directly beneath the
  // Environment Hub. Its top is the hub's true bottom edge; its bottom stops at
  // the Luna bottom-header line so it never overlaps dashboard navigation.
  const top = Math.max(72, Number(boundary?.bottom || anchor.top || 72));
  const bottom = Math.max(top, viewport.height - 48);
  const height = Math.max(0, bottom - top);
  const width = Math.max(0, right - left);
  return { left, top, width, height, inline: width < 210 || height < 160 };
}
