export const normalizeText = (value) => String(value || '').normalize('NFKC').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
export const formatCount = (value) => Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(Math.max(0, Number(value) || 0));
const timestamp = (value) => Date.parse(value) || 0;
const count = (value) => Math.max(0, Number(value) || 0);

export const STYLE_FILTERS = [
  ['all', 'All Streams'], ['no commentary', 'No Commentary'], ['no camera', 'No Camera'],
  ['talkative', 'Talkative'], ['active chill', 'Active / Chill'], ['competitive', 'Competitive'],
  ['educational', 'Educational'], ['interactive', 'Interactive'],
];

export function matchesStyle(stream, style) {
  if (style === 'all') return true;
  const tags = stream.tags.map(normalizeText);
  const aliases = { 'no commentary': ['no commentary', 'nocommentary', 'no mic', 'silent'], 'no camera': ['no camera', 'nocamera', 'no cam', 'nocam'], 'active chill': ['active', 'chill', 'casual', 'active / chill'], educational: ['educational', 'tutorial', 'tutorials', 'teaching'], competitive: ['competitive', 'ranked', 'tournament'] };
  return (aliases[style] || [style]).some((tag) => tags.includes(tag));
}

export function matchesGenre(game, genre) {
  if (genre === 'All genres') return true;
  const value = normalizeText(game.genre);
  const groups = { RPG: ['rpg', 'role playing', 'mmorpg'], Action: ['action', 'fighting', 'hack and slash'], Horror: ['horror'], FPS: ['fps', 'shooter', 'shooting', 'first person'] };
  return groups[genre] ? groups[genre].some((tag) => value.includes(tag)) : value === normalizeText(genre);
}

/** Join public broadcast metadata only. A media ingest key is never a playback source. */
export function buildDiscovery({ games = [], profiles = [], streams = [], auraStreams = [] }) {
  const gameMap = new Map();
  const gamesByName = new Map();
  for (const game of games) {
    const name = normalizeText(game.title);
    if (!name) continue;
    const existing = gamesByName.get(name);
    const category = existing || { id: game.id, title: game.title, genre: game.genre || 'Other', image: game.cover_image || game.banner_image, addedAt: timestamp(game.created_date), releaseDate: game.release_date || '', originalYear: Number(game.original_year) || 0, viewers: 0, liveCount: 0 };
    if (!existing) gamesByName.set(name, category);
    gameMap.set(game.id, category);
  }
  const profileMap = new Map();
  for (const profile of profiles) { profileMap.set(profile.user_id, profile); profileMap.set(profile.id, profile); }
  const broadcasts = new Map();
  const seen = new Set();
  // Native and Aura broadcasts can describe the same channel; count that channel once.
  for (const [source, rows] of [['Stream', streams], ['AuraStream', auraStreams]]) {
    for (const row of [...rows].sort((a, b) => timestamp(b.started_at || b.created_date) - timestamp(a.started_at || a.created_date))) {
      if (row.is_live !== true || row.ended_at || !row.streamer_id) continue;
      const profile = profileMap.get(row.streamer_id);
      const owner = profile?.user_id || row.streamer_id;
      if (seen.has(`${source}:${owner}`)) continue;
      seen.add(`${source}:${owner}`);
      const title = row.category || (row.mode === 'talking' ? 'Just Chatting' : 'Gaming');
      let game = gameMap.get(row.game_id) || gamesByName.get(normalizeText(title));
      if (!game) {
        const id = `category:${normalizeText(title)}`;
        game = gameMap.get(id) || { id, title, genre: 'Other', image: row.thumbnail_url || row.preview_image_url, addedAt: 0, viewers: 0, liveCount: 0 };
        gameMap.set(id, game);
      }
      const prior = broadcasts.get(owner);
      if (prior) {
        if (prior.source !== source) {
          prior.url ||= row.video_url || row.playback_url || '';
          prior.previewUrl ||= row.preview_video_url || row.video_url || row.playback_url || '';
          prior.tags = [...new Set([...prior.tags, ...(row.tags || [])])];
          prior.broadcastTags = [...new Set([...prior.broadcastTags, ...(row.tags || [])].filter((tag) => typeof tag === 'string'))];
          prior.category ||= row.category || '';
          prior.mode ||= row.mode || '';
          if (prior.gameId.startsWith('category:') && !game.id.startsWith('category:')) {
            prior.gameId = game.id; prior.game = game.title; prior.gameAddedAt = game.addedAt;
          }
        }
        continue;
      }
      broadcasts.set(owner, {
        id: `${source}:${row.id}`, recordId: row.id, source, streamerId: owner, profileId: profile?.id,
        name: profile?.display_name || 'Live channel', bio: profile?.bio || '', tagline: profile?.tagline || '',
        avatar: profile?.avatar_url, followers: count(profile?.follower_count),
        title: row.title || 'Live stream', gameId: game.id, game: game.title,
        mode: row.mode || '', category: row.category || '', broadcastTags: (row.tags || []).filter((tag) => typeof tag === 'string'),
        thumbnail: row.preview_image_url || row.thumbnail_url || game.image || profile?.cover_image_url,
        url: row.video_url || row.playback_url || '', previewUrl: row.preview_video_url || row.video_url || row.playback_url || '',
        viewers: count(row.viewer_count), maxViewers: count(row.max_viewers), isLive: true,
        tags: [...new Set([...(row.tags || []), ...(profile?.personality_traits || [])].filter((tag) => typeof tag === 'string'))],
        startedAt: timestamp(row.started_at), creatorAddedAt: timestamp(profile?.created_date), gameAddedAt: game.addedAt,
      });
    }
  }
  const channels = [...broadcasts.values()].map((stream) => ({ ...stream, searchText: normalizeText([stream.name, stream.title, stream.game, ...stream.tags].join(' ')) }));
  const categories = [...new Map([...gameMap.values()].map((game) => [game.id, game])).values()];
  const categoryMap = new Map(categories.map((game) => [game.id, game]));
  for (const stream of channels) {
    const game = categoryMap.get(stream.gameId);
    if (game) { game.viewers += stream.viewers; game.liveCount += 1; }
  }
  return { channels, categories: categories.sort((a, b) => b.liveCount - a.liveCount || b.viewers - a.viewers || a.title.localeCompare(b.title)) };
}

export function selectChannels(channels, { search = '', gameId = '', tag = '', style = 'all', sort = 'trending' } = {}) {
  const terms = normalizeText(search).split(' ').filter(Boolean);
  const filtered = channels.filter((stream) => (!gameId || stream.gameId === gameId) && (!tag || stream.tags.some((value) => normalizeText(value) === normalizeText(tag))) && matchesStyle(stream, style) && terms.every((term) => stream.searchText.includes(term)));
  const score = (stream) => {
    if (sort === 'watching') return stream.viewers;
    if (sort === 'new') return stream.creatorAddedAt;
    if (sort === 'games') return stream.gameAddedAt;
    // Trending balances audience size and current audience relative to the stream's peak.
    return Math.log1p(stream.viewers) + (stream.maxViewers > 0 ? stream.viewers / Math.max(stream.maxViewers, stream.viewers) : 0);
  };
  return filtered.sort((a, b) => score(b) - score(a) || b.viewers - a.viewers || a.id.localeCompare(b.id));
}

export function channelHref(stream) {
  const params = new URLSearchParams({ streamerId: stream.streamerId, streamId: stream.recordId, source: stream.source });
  return `/streaminghome?${params}`;
}
