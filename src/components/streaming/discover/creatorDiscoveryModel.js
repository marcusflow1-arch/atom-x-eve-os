import { matchesGenre, matchesStyle, normalizeText, STYLE_FILTERS } from '../hub/discoveryModel';

export const NEW_CREATOR_WINDOW = 30 * 24 * 60 * 60 * 1000;
export const SMALL_AUDIENCE = 100;
export const DISCOVER_PAGE_SIZE = 12;
export const DISCOVERY_FOCUS = [['rising', 'New & smaller'], ['new', 'New here'], ['small', 'Small communities'], ['all', 'All live creators']];
export const DISCOVERY_SORTS = [['discovery', 'Discovery mix'], ['newest', 'Newest creators'], ['smallest', 'Smallest audience']];
const genreGroups = {
  Adventure: ['adventure'], Strategy: ['strategy', 'tactical'], Simulation: ['simulation', 'simulator'],
  Racing: ['racing'], Indie: ['indie'], Sports: ['sports', 'sport'],
};

export function isNewCreator(creator, now = Date.now()) {
  return creator.creatorAddedAt > 0 && creator.creatorAddedAt <= now && now - creator.creatorAddedAt <= NEW_CREATOR_WINDOW;
}

export function creatorReason(creator, now = Date.now()) {
  return [isNewCreator(creator, now) && 'New here', creator.viewers <= SMALL_AUDIENCE && 'Small community'].filter(Boolean).join(' · ');
}

export function prepareCreators(channels, categories) {
  const genres = new Map(categories.map((game) => [game.id, game.genre]));
  return channels.filter((creator) => creator.isLive === true).map((creator) => ({
    ...creator,
    genre: genres.get(creator.gameId) || 'Other',
    discoverySearch: normalizeText([creator.searchText, creator.bio, creator.tagline].join(' ')),
  }));
}

export function matchesDiscoveryGenre(creator, genre) {
  if (!genre || genre === 'All genres') return true;
  return genreGroups[genre]
    ? genreGroups[genre].some((alias) => normalizeText(creator.genre).includes(alias))
    : matchesGenre(creator, genre);
}

export function discoveryGenres(creators) {
  const common = ['RPG', 'Action', 'FPS', 'Horror', ...Object.keys(genreGroups)];
  const available = common.filter((genre) => creators.some((creator) => matchesDiscoveryGenre(creator, genre)));
  const other = [...new Set(creators.filter((creator) => !common.some((genre) => matchesDiscoveryGenre(creator, genre))).map((creator) => creator.genre))];
  return ['All genres', ...available, ...other.sort((a, b) => a.localeCompare(b))];
}

export function readDiscoveryFilters(params) {
  const styles = STYLE_FILTERS.map(([id]) => id).filter((id) => id !== 'all');
  return {
    search: params.get('q') || '',
    genre: params.get('genre') || 'All genres',
    gameId: params.get('game') || '',
    styles: [...new Set(params.getAll('style').filter((style) => styles.includes(style)))],
    focus: DISCOVERY_FOCUS.some(([id]) => id === params.get('focus')) ? params.get('focus') : 'rising',
    sort: DISCOVERY_SORTS.some(([id]) => id === params.get('sort')) ? params.get('sort') : 'discovery',
    page: Math.max(1, Math.min(1000000, parseInt(params.get('page'), 10) || 1)),
  };
}

function dailyOrder(id, day) {
  const text = `${day}:${id}`;
  let hash = 2166136261;
  for (const letter of text) hash = Math.imul(hash ^ letter.charCodeAt(0), 16777619);
  return hash >>> 0;
}

export function filterCreators(creators, filters, now = Date.now()) {
  const terms = normalizeText(filters.search).split(' ').filter(Boolean);
  return creators.filter((creator) => {
    const isNew = isNewCreator(creator, now);
    const small = creator.viewers <= SMALL_AUDIENCE;
    const inFocus = filters.focus === 'all' || (filters.focus === 'new' ? isNew : filters.focus === 'small' ? small : isNew || small);
    return inFocus && matchesDiscoveryGenre(creator, filters.genre) && (!filters.gameId || creator.gameId === filters.gameId)
      && (filters.styles || []).every((style) => matchesStyle(creator, style))
      && terms.every((term) => creator.discoverySearch.includes(term));
  });
}

export function selectCreators(creators, filters, now = Date.now()) {
  const day = new Date(now).toISOString().slice(0, 10);
  return filterCreators(creators, filters, now).map((creator) => ({
    creator,
    priority: Number(isNewCreator(creator, now)) + Number(creator.viewers <= SMALL_AUDIENCE),
    joined: creator.creatorAddedAt > 0 && creator.creatorAddedAt <= now ? creator.creatorAddedAt : 0,
    rotation: dailyOrder(creator.streamerId, day),
  })).sort((a, b) => {
    const order = filters.sort === 'newest' ? b.joined - a.joined : filters.sort === 'smallest' ? a.creator.viewers - b.creator.viewers : b.priority - a.priority;
    return order || a.rotation - b.rotation || a.creator.id.localeCompare(b.creator.id);
  }).map(({ creator }) => creator);
}

export function chooseDailyCreators(creators, now = Date.now(), limit = 4) {
  const day = new Date(now).toISOString().slice(0, 10);
  const candidates = creators.filter((creator) => isNewCreator(creator, now) || creator.viewers <= SMALL_AUDIENCE)
    .map((creator) => ({ creator, rotation: dailyOrder(creator.streamerId, day) }))
    .sort((a, b) => a.rotation - b.rotation || a.creator.id.localeCompare(b.creator.id)).map(({ creator }) => creator);
  const picks = [], games = new Set(), ids = new Set();
  for (const creator of candidates) {
    if (games.has(creator.gameId)) continue;
    picks.push(creator); games.add(creator.gameId); ids.add(creator.id);
    if (picks.length === limit) return picks;
  }
  for (const creator of candidates) {
    if (ids.has(creator.id)) continue;
    picks.push(creator);
    if (picks.length === limit) break;
  }
  return picks;
}
