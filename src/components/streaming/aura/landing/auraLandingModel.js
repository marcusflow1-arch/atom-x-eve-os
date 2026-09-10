import { matchesStyle, selectChannels } from '../../hub/discoveryModel';

export const RECENT_STREAM_WINDOW = 30 * 60 * 1000;

const isRelaxed = (stream) => matchesStyle(stream, 'active chill') || matchesStyle(stream, 'no commentary');

function variety(streams, limit, perGame) {
  const counts = new Map();
  const selected = [];
  const selectedIds = new Set();
  for (const stream of streams) {
    if ((counts.get(stream.gameId) || 0) >= perGame) continue;
    selected.push(stream);
    selectedIds.add(stream.id);
    counts.set(stream.gameId, (counts.get(stream.gameId) || 0) + 1);
    if (selected.length === limit) return selected;
  }
  for (const stream of streams) {
    if (selectedIds.has(stream.id)) continue;
    selected.push(stream);
    if (selected.length === limit) break;
  }
  return selected;
}

export function buildAuraLanding(channels, categories, now = Date.now()) {
  const live = channels.filter((stream) => stream.isLive === true);
  const ranked = selectChannels(live);
  const hotTitles = categories.filter((game) => game.liveCount > 0)
    .slice().sort((a, b) => b.viewers - a.viewers || b.liveCount - a.liveCount || a.title.localeCompare(b.title));
  return {
    featured: variety(ranked, 6, 1),
    liveNow: variety(ranked, 12, 2),
    competitive: ranked.filter((stream) => matchesStyle(stream, 'competitive')).slice(0, 12),
    relaxed: ranked.filter(isRelaxed).slice(0, 12),
    justStarted: live.filter((stream) => stream.startedAt > 0 && stream.startedAt <= now && now - stream.startedAt <= RECENT_STREAM_WINDOW)
      .sort((a, b) => b.startedAt - a.startedAt || b.viewers - a.viewers).slice(0, 12),
    hotTitles: hotTitles.slice(0, 5),
    browseGames: categories.slice().sort((a, b) => b.liveCount - a.liveCount || b.viewers - a.viewers || a.title.localeCompare(b.title)).slice(0, 12),
    pulse: {
      channels: live.length,
      viewers: live.reduce((total, stream) => total + (Number.isFinite(stream.viewers) ? Math.max(0, stream.viewers) : 0), 0),
      games: new Set(live.map((stream) => stream.gameId)).size,
    },
  };
}

export function selectAuraChannels(channels, filters) {
  const source = filters.style === 'relaxed' ? channels.filter(isRelaxed) : channels;
  const selected = selectChannels(source, {
    ...filters,
    style: filters.style === 'relaxed' ? 'all' : filters.style,
    sort: filters.sort === 'started' ? 'watching' : filters.sort,
  });
  return filters.sort === 'started' ? selected.sort((a, b) => b.startedAt - a.startedAt || b.viewers - a.viewers) : selected;
}
