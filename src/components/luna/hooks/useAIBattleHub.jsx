import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

const unwrap = (value) => value?.data ?? value ?? {};

export default function useAIBattleHub() {
  const { user } = useAuth();
  const client = useQueryClient();
  const queryKey = ['luna-ai-battle', user?.id];

  const query = useQuery({
    queryKey,
    enabled: Boolean(user?.id),
    staleTime: 5000,
    refetchInterval: 10000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await base44.functions.invoke('aiBattleHub', { action: 'getState', data: {} });
      const body = unwrap(response);
      if (body?.error) throw new Error(body.error);
      return body;
    },
  });

  useEffect(() => {
    if (!user?.id) return undefined;
    let timer;
    const refresh = () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => client.invalidateQueries({ queryKey }), 350);
    };
    const cleanups = [];
    for (const name of ['AIBattleActivity', 'AIBattleSession', 'DuelSession', 'SocialRequest', 'Loadout', 'UserCard', 'CardProgression']) {
      try { cleanups.push(base44.entities[name].subscribe(refresh)); } catch { /* interval refresh remains active */ }
    }
    return () => {
      clearTimeout(timer);
      cleanups.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [client, user?.id]);

  const mutation = useMutation({
    mutationFn: async ({ action, data }) => {
      const response = await base44.functions.invoke('aiBattleHub', { action, data });
      const body = unwrap(response);
      if (body?.error) throw new Error(body.error);
      return body;
    },
    onSuccess: (body) => {
      if (body?.state) client.setQueryData(queryKey, body.state);
      else client.invalidateQueries({ queryKey });
      client.invalidateQueries({ queryKey: ['luna-skill-book', user?.id] });
      client.invalidateQueries({ queryKey: ['luna-leaderboard-duels'] });
      client.invalidateQueries({ queryKey: ['luna-leaderboard-progression'] });
    },
  });

  return {
    state: query.data || null,
    activities: query.data?.activities || [],
    sessions: query.data?.sessions || [],
    duels: query.data?.duels || [],
    opponents: query.data?.opponents || [],
    loadout: query.data?.loadout || { cards: [], player_power: 0, player_hp: 100 },
    pvp: query.data?.pvp || { wins: 0, losses: 0, matches: 0, active_duel: null },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isActing: mutation.isPending,
    startActivity: (activityId) => mutation.mutateAsync({ action: 'startActivity', data: { activity_id: activityId } }),
    act: (sessionId) => mutation.mutateAsync({ action: 'act', data: { session_id: sessionId } }),
    abandon: (sessionId) => mutation.mutateAsync({ action: 'abandon', data: { session_id: sessionId } }),
    refetch: query.refetch,
  };
}
