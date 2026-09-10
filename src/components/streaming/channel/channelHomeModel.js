import { normalizeGallery } from '../gallery/galleryModel';
import { safeShowcaseUrl } from '../collection/playerCollectionModel';

const DAY = 86400000;
const time = (value) => Date.parse(value) || 0;
const localDay = (value) => { const date = new Date(value); return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-'); };

export function channelScheduleCalendar(scheduleData = {}, broadcasts = []) {
  const calendar = { ...scheduleData };
  for (const broadcast of broadcasts) {
    const date = time(broadcast.scheduled_start);
    if (!date || broadcast.status !== 'scheduled') continue;
    const key = localDay(date), title = broadcast.title || 'Scheduled stream';
    const existing = calendar[key];
    if (existing?.title?.includes(title)) continue;
    const label = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
    calendar[key] = { ...existing, title: [existing?.title, title].filter(Boolean).join(' · '), time: [existing?.time, label].filter(Boolean).join(' / ') };
  }
  return calendar;
}

export function buildChannelOverview(data = {}, layout = {}, profile = {}, now = Date.now()) {
  const moments = normalizeGallery(layout.gallery_images || []).filter((item) => !item.isSample && safeShowcaseUrl(item.url) && item.visibility !== 'private' && item.visibility !== 'draft' && (item.date === 'undated' || item.date <= new Date(now).toISOString().slice(0, 10))).map((item) => ({
    ...item, kind: item.type === 'video' ? 'video' : 'article', image: item.type === 'image' ? item.url : item.thumbnail_url || '',
    label: item.game || 'Channel moment', source: profile.display_name || 'Channel gallery', publishedAt: item.date === 'undated' ? 0 : time(`${item.date}T12:00:00`),
  })).sort((a, b) => b.publishedAt - a.publishedAt || a.id.localeCompare(b.id)).slice(0, 12);
  const events = (data.schedules || []).filter((entry) => entry.status === 'scheduled' && time(entry.scheduled_start) >= now && time(entry.scheduled_start) <= now + 14 * DAY).map((entry) => ({ id: entry.id, title: entry.title || 'Scheduled stream', startsAt: time(entry.scheduled_start), game: '', timeLabel: '' }));
  for (const [date, entry] of Object.entries(layout.schedule_data || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !entry?.title) continue;
    const startsAt = time(`${date}T12:00:00`);
    if (!startsAt || localDay(startsAt) !== date || date < localDay(now) || startsAt > now + 14 * DAY) continue;
    events.push({ id: `calendar:${date}`, title: entry.title, startsAt, game: entry.game || '', timeLabel: entry.time || 'Time to be announced' });
  }
  const scheduled = events.sort((a, b) => a.startsAt - b.startsAt).filter((event, index, all) => all.findIndex((item) => item.title === event.title && new Date(item.startsAt).toDateString() === new Date(event.startsAt).toDateString()) === index).slice(0, 6);
  const definitions = new Map((data.achievements || []).map((item) => [item.id, item]));
  const activity = [
    ...moments.filter((item) => item.publishedAt > 0).map((item) => ({ id: item.id, kind: 'moment', title: `Shared ${item.title}`, date: item.publishedAt })),
    ...(data.unlocks || []).filter((item) => item.status === 'unlocked').map((item) => ({ id: `unlock:${item.id}`, kind: 'card', title: `Achievement card: ${definitions.get(item.achievement_id)?.title || 'Unlocked achievement'}`, date: time(item.updated_date || item.created_date) })),
    ...(data.streams || []).filter((item) => time(item.started_at) > 0).map((item) => ({ id: `stream:${item.id}`, kind: 'stream', title: `Streamed ${item.title || 'a live session'}`, date: time(item.started_at) })),
  ].filter((item) => item.date > 0 && item.date <= now).sort((a, b) => b.date - a.date).slice(0, 6);
  const followers = Math.max(0, Number(profile.follower_count) || 0);
  const target = [100, 500, 1000, 5000, 10000, 50000, 100000].find((value) => value > followers) || (Math.floor(followers / 100000) + 1) * 100000;
  const contributors = [...new Set(moments.map((item) => item.contributor).filter(Boolean))].slice(0, 6);
  return { moments, scheduled, activity, followers, target, contributors };
}

export function publicChatMessages(rows, streamId) {
  return rows.filter((row) => row.stream_id === streamId && !row.is_deleted && ['text', 'system'].includes(row.message_type || 'text') && typeof row.content === 'string' && row.content.trim()).sort((a, b) => time(a.created_date) - time(b.created_date)).slice(-30);
}
