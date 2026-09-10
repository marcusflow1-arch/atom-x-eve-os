import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export const AURA_DAILY_KEY = ['aura-daily-edition'];
const rowsOf = (value) => Array.isArray(value) ? value : value?.data || [];
const SOURCES = ['PlatformUpdate', 'Post', 'AuraStreamSchedule', 'StreamVideo'];

export async function readAuraDailyFeed(signal, now = Date.now()) {
  const requests = [
    ['updates', () => base44.entities.PlatformUpdate.filter({ published: true }, '-created_date', 4, 0, ['id', 'title', 'description', 'full_content', 'update_type', 'image_url', 'published', 'created_date'])],
    ['posts', () => base44.entities.Post.filter({ community: { $in: ['guide', 'tips', 'achievements', 'farming'] } }, '-created_date', 4, 0, ['id', 'title', 'content', 'community', 'game_title', 'image_url', 'challenge_target_user_id', 'created_date'])],
    ['schedules', () => base44.entities.AuraStreamSchedule.filter({ status: 'scheduled', scheduled_start: { $gte: new Date(now).toISOString(), $lte: new Date(now + 7 * 86400000).toISOString() } }, 'scheduled_start', 6, 0, ['id', 'user_id', 'game_id', 'title', 'scheduled_start', 'scheduled_end', 'status'])],
    ['videos', () => base44.entities.StreamVideo.filter({ visibility: 'public' }, '-created_date', 6, 0, ['id', 'title', 'description', 'thumbnail_url', 'video_url', 'game_category', 'duration', 'visibility', 'view_count', 'created_date'])],
  ];
  const results = await Promise.allSettled(requests.map(([, read]) => read()));
  signal?.throwIfAborted();
  if (results.every((result) => result.status === 'rejected')) throw new Error('The daily edition is unavailable.');
  const failures = [];
  const data = Object.fromEntries(requests.map(([name], index) => {
    if (results[index].status === 'rejected') failures.push(name);
    return [name, results[index].status === 'fulfilled' ? rowsOf(results[index].value) : []];
  }));
  const owners = [...new Set(data.schedules.map((schedule) => schedule.user_id).filter(Boolean))];
  let profiles = [];
  if (owners.length) {
    try {
      profiles = rowsOf(await base44.entities.StreamerProfile.filter({ $or: [{ user_id: { $in: owners } }, { id: { $in: owners } }] }, '-created_date', 12, 0, ['id', 'user_id', 'display_name', 'avatar_url']));
    } catch { failures.push('profiles'); }
  }
  signal?.throwIfAborted();
  return { ...data, profiles, failures };
}

export default function useAuraDailyFeed() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: AURA_DAILY_KEY, queryFn: ({ signal }) => readAuraDailyFeed(signal), staleTime: 120000, gcTime: 10 * 60000, refetchInterval: 120000, refetchIntervalInBackground: false, retry: 1 });
  useEffect(() => {
    let timer;
    const cleanups = [];
    const refresh = () => { clearTimeout(timer); timer = setTimeout(() => client.invalidateQueries({ queryKey: AURA_DAILY_KEY }), 1500); };
    for (const name of SOURCES) {
      try { cleanups.push(base44.entities[name].subscribe(refresh)); } catch { /* The timed refresh also updates this edition. */ }
    }
    return () => { clearTimeout(timer); cleanups.forEach((cleanup) => cleanup?.()); };
  }, [client]);
  return query;
}
