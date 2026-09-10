import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { buildDiscovery } from './discoveryModel';

export const DIRECTORY_KEY = ['live-discovery-directory'];
export const PUBLIC_FIELDS = {
  Game: ['id', 'title', 'genre', 'cover_image', 'banner_image', 'created_date', 'release_date', 'original_year'],
  StreamerProfile: ['id', 'user_id', 'display_name', 'bio', 'tagline', 'avatar_url', 'cover_image_url', 'follower_count', 'personality_traits', 'created_date'],
  Stream: ['id', 'streamer_id', 'title', 'game_id', 'tags', 'mode', 'started_at', 'ended_at', 'is_live', 'viewer_count', 'preview_image_url', 'playback_url', 'preview_video_url', 'max_viewers', 'created_date'],
  AuraStream: ['id', 'streamer_id', 'title', 'game_id', 'category', 'tags', 'started_at', 'is_live', 'viewer_count', 'thumbnail_url', 'video_url', 'created_date'],
};

export async function readDirectoryRows(name, signal) {
  const rows = [];
  let page;
  do {
    signal?.throwIfAborted();
    const entity = base44.entities[name];
    const result = ['Stream', 'AuraStream'].includes(name)
      ? await entity.filter({ is_live: true }, 'created_date', 500, rows.length, PUBLIC_FIELDS[name])
      : await entity.list('created_date', 500, rows.length, PUBLIC_FIELDS[name]);
    page = Array.isArray(result) ? result : result?.data || [];
    rows.push(...page);
  } while (page.length === 500);
  return rows;
}

export default function useLiveDirectory() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: DIRECTORY_KEY, staleTime: 60000, gcTime: 10 * 60000, retry: 1,
    refetchInterval: 60000, refetchIntervalInBackground: false,
    queryFn: async ({ signal }) => {
      const names = Object.keys(PUBLIC_FIELDS);
      const results = await Promise.allSettled(names.map((name) => readDirectoryRows(name, signal)));
      signal.throwIfAborted();
      if (results.every((result) => result.status === 'rejected')) throw new Error('Live discovery is unavailable.');
      const data = Object.fromEntries(names.map((name, index) => [name, results[index].status === 'fulfilled' ? results[index].value : []]));
      return { ...buildDiscovery({ games: data.Game, profiles: data.StreamerProfile, streams: data.Stream, auraStreams: data.AuraStream }), incomplete: results.some((result) => result.status === 'rejected') };
    },
  });
  useEffect(() => {
    let timer;
    const cleanups = [];
    const refresh = () => { clearTimeout(timer); timer = setTimeout(() => client.invalidateQueries({ queryKey: DIRECTORY_KEY }), 1500); };
    for (const name of ['Stream', 'AuraStream']) {
      try { cleanups.push(base44.entities[name].subscribe(refresh)); } catch { /* Timed refresh also keeps viewer counts current. */ }
    }
    return () => { clearTimeout(timer); cleanups.forEach((unsubscribe) => unsubscribe?.()); };
  }, [client]);
  const channels = useMemo(() => query.data?.channels || [], [query.data?.channels]);
  const categories = useMemo(() => query.data?.categories || [], [query.data?.categories]);
  return { ...query, channels, categories };
}
