// Shared catalog normalization for the game landing page.
export function mediaUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const text = value.trim();
  if (text.startsWith('/') && !text.startsWith('//')) return text;
  try {
    const url = new URL(text);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

export function trailerSource(value) {
  const source = mediaUrl(value);
  if (!source) return null;
  const url = new URL(source, 'https://local.invalid');
  const host = url.hostname.replace(/^www\./, '');
  if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'youtu.be'].includes(host)) {
    const id = host === 'youtu.be' ? url.pathname.slice(1).split('/')[0]
      : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    if (!/^[\w-]{11}$/.test(id || '')) return null;
    return { kind: 'embed', url: 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0', key: 'youtube:' + id };
  }
  if (['vimeo.com', 'player.vimeo.com'].includes(host)) {
    const id = url.pathname.match(/\/(\d+)(?:\/|$)/)?.[1];
    if (id) return { kind: 'embed', url: 'https://player.vimeo.com/video/' + id + '?autoplay=1', key: 'vimeo:' + id };
  }
  if (/\.(mp4|webm|ogv|ogg)$/i.test(url.pathname)) return { kind: 'video', url: source, key: source };
  return { kind: 'external', url: source, key: source };
}

export function gameArtwork(game) {
  return mediaUrl(game.banner_image) || (game.screenshots || []).map(mediaUrl).find(Boolean) || mediaUrl(game.cover_image);
}

export function gameMedia(game) {
  const media = [], seen = new Set();
  const videos = [...(Array.isArray(game.video_urls) ? game.video_urls : []), game.trailer_url];
  for (const value of videos) {
    const source = trailerSource(value);
    if (!source || seen.has(source.key)) continue;
    seen.add(source.key);
    media.push({ ...source, type: 'video', title: media.length ? 'Trailer ' + (media.length + 1) : 'Official trailer', image: gameArtwork(game) });
  }
  let count = 0;
  for (const value of Array.isArray(game.screenshots) ? game.screenshots : []) {
    const image = mediaUrl(value);
    if (!image || seen.has(image)) continue;
    seen.add(image);
    media.push({ key: image, type: 'image', image, title: 'Screenshot ' + (++count) });
  }
  if (!media.length && gameArtwork(game)) media.push({ key: 'artwork', type: 'image', image: gameArtwork(game), title: 'Game artwork' });
  return media;
}

export function releaseLabel(game) {
  if (game.release_date) {
    const date = new Date(game.release_date);
    if (Number.isFinite(date.getTime())) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }
  return game.original_year || game.release_year ? String(game.original_year || game.release_year) : 'To be announced';
}

export function requirementGroups(game) {
  const specs = game.system_requirements;
  if (!specs || typeof specs !== 'object') return [];
  const rows = data => [
    ['Operating system', data?.os], ['Processor', data?.processor || data?.cpu],
    ['Memory', data?.memory || data?.ram], ['Graphics', data?.graphics || data?.gpu],
    ['Storage', data?.storage], ['DirectX', data?.directx], ['Additional notes', data?.notes]
  ].filter(([, value]) => typeof value === 'string' && value.trim());
  if (specs.minimum || specs.recommended) return [
    { title: 'Minimum', rows: rows(specs.minimum) }, { title: 'Recommended', rows: rows(specs.recommended) }
  ].filter(group => group.rows.length);
  const published = rows(specs);
  return published.length ? [{ title: 'Published requirements', rows: published }] : [];
}
