import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const rowsOf = (result) => Array.isArray(result) ? result : result?.data || [];
export async function readChannelHomeData(channelId, profileId, signal, now = Date.now()) {
  if (!channelId) return { failures: [] };
  const owners = [...new Set([channelId, profileId].filter(Boolean))];
  const requests = [
    ['layouts', () => base44.entities.StreamLayoutConfig.filter({ user_id: channelId }, '-created_date', 1, 0, ['id', 'user_id', 'gallery_images', 'schedule_data', 'pinned_games'])],
    ['schedules', () => base44.entities.AuraStreamSchedule.filter({ user_id: { $in: owners }, status: 'scheduled', scheduled_start: { $gte: new Date(now).toISOString(), $lte: new Date(now + 14 * 86400000).toISOString() } }, 'scheduled_start', 6, 0, ['id', 'user_id', 'title', 'scheduled_start', 'status'])],
    ['streams', () => base44.entities.Stream.filter({ streamer_id: { $in: owners } }, '-started_at', 6, 0, ['id', 'streamer_id', 'title', 'is_live', 'started_at', 'ended_at'])],
    ['auraStreams', () => base44.entities.AuraStream.filter({ streamer_id: { $in: owners }, is_live: true }, '-started_at', 1, 0, ['id', 'streamer_id', 'title', 'is_live', 'started_at'])],
    ['unlocks', () => base44.entities.UserAchievement.filter({ user_id: channelId, status: 'unlocked' }, '-updated_date', 6, 0, ['id', 'achievement_id', 'user_id', 'status', 'updated_date', 'created_date'])],
    ['sponsors', () => base44.entities.AuraSponsor.filter({ user_id: channelId }, '-created_date', 6, 0, ['id', 'user_id', 'name', 'logo_url', 'affiliate_link'])],
  ];
  const results = await Promise.allSettled(requests.map(([, read]) => read()));
  signal?.throwIfAborted();
  if (results.every((result) => result.status === 'rejected')) throw new Error('Channel content unavailable');
  const failures = [];
  const data = Object.fromEntries(requests.map(([key], index) => {
    if (results[index].status === 'rejected') failures.push(key);
    return [key, results[index].status === 'fulfilled' ? rowsOf(results[index].value) : []];
  }));
  const ids = [...new Set(data.unlocks.map((row) => row.achievement_id).filter(Boolean))];
  let achievements = [];
  if (ids.length) { try { achievements = rowsOf(await base44.entities.Achievement.filter({ id: { $in: ids } }, 'title', 6, 0, ['id', 'title'])); } catch { failures.push('achievements'); } }
  signal?.throwIfAborted();
  return { ...data, achievements, failures };
}

export default function useChannelHomeData(channelId, profileId) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['channel-home-content', channelId, profileId], enabled: Boolean(channelId), queryFn: ({ signal }) => readChannelHomeData(channelId, profileId, signal), staleTime: 30000, refetchInterval: 60000, refetchIntervalInBackground: false, retry: 1 });
  useEffect(() => {
    if (!channelId) return;
    let timer;
    const cleanups = [], owners = [channelId, profileId].filter(Boolean);
    const refresh = (event) => {
      if (event.type !== 'delete' && !owners.includes(event.data?.user_id) && !owners.includes(event.data?.streamer_id)) return;
      clearTimeout(timer); timer = setTimeout(() => client.invalidateQueries({ queryKey: ['channel-home-content', channelId] }), 1000);
    };
    for (const name of ['StreamLayoutConfig', 'AuraStreamSchedule', 'Stream', 'AuraStream', 'UserAchievement', 'AuraSponsor']) { try { cleanups.push(base44.entities[name].subscribe(refresh)); } catch { /* Timed refresh remains available. */ } }
    return () => { clearTimeout(timer); cleanups.forEach((unsubscribe) => unsubscribe?.()); };
  }, [client, channelId, profileId]);
  return query;
}
