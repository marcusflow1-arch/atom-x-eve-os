// Pure selectors for the profile's seven-column game shelf.
// Kept independent of React so keyboard behavior and per-game card filtering can be regression tested.
export const GAME_SHELF_COLUMNS = 7;

export const gameLabel = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function belongsToGame(item, game) {
  if (!item || !game) return false;
  const gameId = String(game.id || '').trim();
  const itemId = String(item.game_id || '').trim();
  if (gameId && itemId) return gameId === itemId;
  const name = gameLabel(game.title || game.name);
  return Boolean(name && [item.game_name, item.game].some(value => gameLabel(value) === name));
}

export function gameArtifacts(profile, game) {
  const achievements = (profile?.achievements || []).filter(item => belongsToGame(item, game));
  const cards = (profile?.cards || []).filter(item => belongsToGame(item, game));
  return { achievements, cards };
}

export function nextGameIndex(key, current, length, columns = GAME_SHELF_COLUMNS) {
  if (length <= 0) return -1;
  const delta = ({
    a: -1, A: -1, ArrowLeft: -1,
    d: 1, D: 1, ArrowRight: 1,
    w: -columns, W: -columns, ArrowUp: -columns,
    s: columns, S: columns, ArrowDown: columns,
  })[key];
  if (key === 'Home') return 0;
  if (key === 'End') return length - 1;
  if (delta === undefined) return current;
  return Math.max(0, Math.min(length - 1, current + delta));
}

export function gameMedia(game) {
  if (!game) return { stills: [], video: '' };
  const accept = value => typeof value === 'string' && (/^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value));
  const stills = [...new Set([game.banner_image, ...(game.screenshots || []), game.cover_image].filter(accept))];
  const video = (game.video_urls || []).find(url => accept(url) && /\.(mp4|webm)(?:[?#]|$)/i.test(url)) || '';
  return { stills, video };
}
