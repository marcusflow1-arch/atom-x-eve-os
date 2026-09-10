import { normalizeText } from '../../hub/discoveryModel';

const timestamp = (value) => Date.parse(value) || 0;
const recentFirst = (a, b) => b.publishedAt - a.publishedAt || String(a.id).localeCompare(String(b.id));
const hasMedia = (value) => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };

export function formatEditionDate(value) {
  const date = typeof value === 'number' ? value : timestamp(value);
  return date > 0 ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date) : '';
}

export function formatVideoDuration(seconds) {
  if (!Number.isFinite(Number(seconds)) || Number(seconds) <= 0) return '';
  const total = Math.floor(Number(seconds)), minutes = Math.floor(total / 60), remainder = String(total % 60).padStart(2, '0');
  return minutes < 60 ? `${minutes}:${remainder}` : `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${remainder}`;
}

export function buildAuraDailyEdition(raw = {}, categories = [], now = Date.now(), videoLimit = 6) {
  const data = raw || {};
  const gameMap = new Map(categories.map((game) => [game.id, game]));
  const profileMap = new Map();
  for (const profile of data.profiles || []) { profileMap.set(profile.user_id, profile); profileMap.set(profile.id, profile); }
  const updates = (data.updates || []).filter((update) => update.published === true && update.title && timestamp(update.created_date) <= now).map((update) => ({
    id: `update:${update.id}`, kind: 'article', title: update.title, description: update.description || '', content: update.full_content || '',
    image: update.image_url, label: update.update_type === 'feature' ? 'Platform feature' : update.update_type === 'announcement' ? 'Announcement' : 'Platform update', publishedAt: timestamp(update.created_date), source: 'Atom x Eve',
  })).sort(recentFirst).slice(0, 4);
  const posts = (data.posts || []).filter((post) => post.title && !post.challenge_target_user_id && timestamp(post.created_date) <= now).map((post) => ({
    id: `post:${post.id}`, kind: 'article', title: post.title, description: post.game_title || '', content: post.content || '', image: post.image_url,
    label: post.community === 'farming' || post.community === 'achievements' ? 'Achievement stories' : 'Community guide', publishedAt: timestamp(post.created_date), source: 'Community',
  })).sort(recentFirst).slice(0, 3);
  const schedules = (data.schedules || []).filter((schedule) => schedule.status === 'scheduled' && schedule.user_id && timestamp(schedule.scheduled_start) >= now && timestamp(schedule.scheduled_start) <= now + 7 * 86400000 && (!schedule.scheduled_end || timestamp(schedule.scheduled_end) >= timestamp(schedule.scheduled_start))).map((schedule) => {
    const profile = profileMap.get(schedule.user_id);
    return { id: schedule.id, title: schedule.title || 'Scheduled stream', startsAt: timestamp(schedule.scheduled_start), creator: profile?.display_name || 'Channel', avatar: profile?.avatar_url, game: gameMap.get(schedule.game_id)?.title || '', href: `/streaminghome?${new URLSearchParams({ streamerId: profile?.user_id || schedule.user_id })}` };
  }).sort((a, b) => a.startsAt - b.startsAt).slice(0, 6);
  const videos = (data.videos || []).filter((video) => video.visibility === 'public' && video.title && hasMedia(video.video_url) && timestamp(video.created_date) <= now).map((video) => ({
    id: `video:${video.id}`, kind: 'video', title: video.title, description: video.description || '', image: video.thumbnail_url || categories.find((game) => normalizeText(game.title) === normalizeText(video.game_category))?.image,
    url: video.video_url, label: video.game_category || 'Community video', duration: formatVideoDuration(video.duration), views: Math.max(0, Number(video.view_count) || 0), publishedAt: timestamp(video.created_date), source: 'Public video library',
  })).sort(recentFirst).slice(0, videoLimit);
  const newGames = categories.filter((game) => game.addedAt > 0 && game.addedAt <= now).slice().sort((a, b) => b.addedAt - a.addedAt || a.title.localeCompare(b.title)).slice(0, 4);
  return { updates, posts, schedules, videos, newGames, failures: data.failures || [] };
}
