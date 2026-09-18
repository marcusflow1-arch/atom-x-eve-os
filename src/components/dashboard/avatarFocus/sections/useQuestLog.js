import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useQuestLog(userId) {
  const client = useQueryClient();
  const key = ['avatar-quest-log', userId];
  const query = useQuery({
    queryKey: key,
    queryFn: () => base44.entities.UserTask.filter({ user_id: userId }, '-created_date', 100),
    enabled: !!userId,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const [, tick] = useState(0);
  const rateLimited = Number(query.error?.status || query.error?.response?.status) === 429 || /rate limit/i.test(query.error?.message || '');
  const retryAfter = query.error?.response?.headers?.['retry-after'];
  const delay = retryAfter && Number.isFinite(Number(retryAfter)) ? Number(retryAfter) * 1000 : Math.max(0, Date.parse(retryAfter) - query.errorUpdatedAt) || 60_000;
  const retryAt = rateLimited ? query.errorUpdatedAt + Math.max(60_000, delay) : 0;
  const coolingDown = Date.now() < retryAt;
  useEffect(() => {
    if (!coolingDown) return;
    const timer = setTimeout(() => tick(value => value + 1), retryAt - Date.now());
    return () => clearTimeout(timer);
  }, [coolingDown, retryAt]);
  return {
    quests: query.data ?? null,
    setQuests: update => client.setQueryData(key, update),
    load: () => userId && !coolingDown && !query.isFetching ? query.refetch() : undefined,
    error: query.error,
    rateLimited,
    retryDisabled: coolingDown || query.isFetching || !userId,
  };
}