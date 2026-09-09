import { CATEGORY_META, CLIPS, COMMUNITY_CLIPS } from './galleryClipData';

export const GAME_ART = {
  'The Elder Scrolls': 'https://cdn.cloudflare.steamstatic.com/steam/apps/306130/header.jpg',
  'SMITE 2': 'https://cdn.cloudflare.steamstatic.com/steam/apps/2687550/header.jpg',
  Fallout: 'https://cdn.cloudflare.steamstatic.com/steam/apps/377160/header.jpg',
  'Cyberpunk 2077': 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg',
  'Destiny 2': 'https://cdn.cloudflare.steamstatic.com/steam/apps/1085660/header.jpg',
};

// Keep legacy uploads stable when another upload is removed or reordered.
function mediaId(url) {
  let hash = 2166136261;
  let hash2 = 5381;
  for (const character of url) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    hash2 = Math.imul(hash2, 33) ^ character.charCodeAt(0);
  }
  return `upload-${(hash >>> 0).toString(36)}-${(hash2 >>> 0).toString(36)}`;
}

export function normalizeGallery(items = []) {
  const uploaded = items.flatMap((item, uploadIndex) => {
    const media = typeof item === 'string' ? { url: item } : item;
    if (!media?.url) return [];
    return [{
      ...media,
      id: media.id || mediaId(media.url),
      uploadIndex,
      date: validDay(media.date || media.created_date),
      time: media.time || '',
      title: media.title || `Saved moment ${uploadIndex + 1}`,
      category: CATEGORY_META[media.category] ? media.category : 'SAVED',
      game: media.game || 'Stream Highlight',
      type: media.type || (/\.(mp4|webm|mov|m4v|ogg)([?#]|$)/i.test(media.url) ? 'video' : 'image'),
      collection: media.contributor ? 'community' : 'moments',
      description: media.description || 'A saved moment from the broadcast.',
    }];
  });
  return [
    ...uploaded,
    ...CLIPS.map((clip) => ({ ...clip, collection: 'moments', isSample: true })),
    ...COMMUNITY_CLIPS.map((clip) => ({ ...clip, date: validDay(clip.date), type: 'video', collection: 'community', description: clip.note, isSample: true })),
  ];
}

export function validDay(value) {
  const day = typeof value === 'string' ? value.slice(0, 10) : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return 'undated';
  const date = new Date(`${day}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(day) ? day : 'undated';
}

export function galleryDays(clips) {
  const grouped = new Map();
  clips.forEach((clip) => grouped.set(clip.date, [...(grouped.get(clip.date) || []), clip]));
  return [...grouped.entries()].sort(([a], [b]) => a === 'undated' ? 1 : b === 'undated' ? -1 : b.localeCompare(a)).map(([key, items]) => ({
    key,
    count: items.length,
    categories: [...new Set(items.map((clip) => clip.category))],
    label: key === 'undated' ? 'Undated' : new Date(`${key}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weekday: key === 'undated' ? 'Saved clips' : new Date(`${key}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
  }));
}

export function chooseInitialClip(clips) {
  return clips.find((clip) => clip.url) || clips.filter((clip) => clip.collection === 'moments').at(-1) || clips[0] || null;
}

export const clipTarget = (channelId, clipId) => channelId && clipId ? `gallery:${channelId}:${clipId}` : null;
