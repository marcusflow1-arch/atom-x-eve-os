import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { joinDashboard, useDashboardSession } from '@/components/social/dashboardSession';

const requestId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const PAGE_QUEUE_SESSION_ID = globalThis.crypto?.randomUUID?.() || `battle-session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
let heartbeatTimer = null;
let heartbeatBusy = false;

const unwrap = (response) => {
  const body = response?.data ?? response ?? {};
  if (body?.error) throw new Error(body.error);
  return body;
};
const invoke = async (action, data = {}) => unwrap(await base44.functions.invoke('aiBattleMatchmaker', { action, data }));
const sessionData = (extra = {}) => ({ client_session_id: PAGE_QUEUE_SESSION_ID, ...extra });
const isActiveQueue = (body) => ['waiting', 'matched'].includes(String(body?.queue?.status || ''));

export const getAIBattleClientSessionId = () => PAGE_QUEUE_SESSION_ID;

export function stopAIBattleQueueHeartbeat() {
  if (heartbeatTimer && typeof window !== 'undefined') window.clearInterval(heartbeatTimer);
  heartbeatTimer = null;
  heartbeatBusy = false;
}

async function heartbeatOnce() {
  if (heartbeatBusy) return null;
  heartbeatBusy = true;
  try {
    const body = await invoke('status', sessionData());
    if (!isActiveQueue(body)) stopAIBattleQueueHeartbeat();
    return body;
  } finally {
    heartbeatBusy = false;
  }
}

export function startAIBattleQueueHeartbeat() {
  if (typeof window === 'undefined' || heartbeatTimer) return;
  heartbeatTimer = window.setInterval(() => {
    heartbeatOnce().catch((error) => {
      console.warn('[AI Battle] queue heartbeat will retry', error);
    });
  }, 10000);
}

/**
 * Called by the always-mounted dashboard stage. This is deliberately a status
 * touch, never a join: opening/reloading the dashboard cannot put the user into
 * matchmaking. A new page session invalidates a queue created by the old page.
 */
export async function touchAIBattleQueueSession() {
  const body = await invoke('status', sessionData());
  if (isActiveQueue(body)) startAIBattleQueueHeartbeat();
  else stopAIBattleQueueHeartbeat();
  return body;
}

export default function useAIBattleQueue() {
  const { user } = useAuth();
  const session = useDashboardSession();
  const queryClient = useQueryClient();
  const readyAttempt = useRef('');
  const joinAttempt = useRef('');
  const key = ['ai-battle-matchmaking', user?.id];

  const state = useQuery({
    queryKey: key,
    enabled: !!user?.id,
    queryFn: () => invoke('status', sessionData()),
    refetchInterval: (query) => {
      const status = query.state.data;
      if (status?.queue?.status === 'waiting' || status?.match?.status === 'matched') return 5000;
      if (status?.match?.status === 'ready') return 3000;
      return 15000;
    },
    refetchOnWindowFocus: true,
    retry: false,
    staleTime: 1500,
  });

  const mutation = useMutation({
    mutationFn: ({ action, data }) => invoke(action, sessionData(data)),
    retry: false,
    onSuccess: (body) => queryClient.setQueryData(key, (prev = {}) => ({ ...prev, ...body })),
  });

  const match = state.data?.match || null;
  const queue = state.data?.queue || null;

  useEffect(() => {
    if (queue?.status === 'waiting' || queue?.status === 'matched') startAIBattleQueueHeartbeat();
    else if (!match || match.status === 'ended') stopAIBattleQueueHeartbeat();
  }, [queue?.status, match?.status]);

  useEffect(() => {
    if (!match?.id || !user?.id || match.status === 'ended') return;
    const token = `${match.id}:${match.host_id}`;
    if (joinAttempt.current === token && session.host_id === match.host_id) return;
    joinAttempt.current = token;

    if (String(user.id) === String(match.host_id)) {
      if (String(session.host_id || '') !== String(match.host_id)) {
        window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', {
          detail: { channelId: match.dashboard_channel, hostId: match.host_id, hostName: match.host_name || 'My', aiBattle: true },
        }));
      }
    } else if (String(session.host_id || '') !== String(match.host_id)) {
      joinDashboard({ id: match.host_id, name: match.host_name || 'Player' }).catch((error) => {
        console.warn('[AI Battle] dashboard join is retrying', error);
        joinAttempt.current = '';
      });
    }
  }, [match?.id, match?.host_id, match?.host_name, match?.dashboard_channel, match?.status, session.host_id, user?.id]);

  useEffect(() => {
    if (!match?.id || match.status === 'ready') return;
    if (String(session.channel_id || '') !== String(match.dashboard_channel || '')) return;
    const present = new Set((session.players || []).map((player) => String(player.player_id)));
    if (!(match.player_ids || []).every((id) => present.has(String(id)))) return;
    if (readyAttempt.current === match.id) return;
    readyAttempt.current = match.id;
    invoke('ready', sessionData({ match_id: match.id }))
      .then((body) => queryClient.setQueryData(key, (prev = {}) => ({ ...prev, match: body.match || prev.match })))
      .catch((error) => {
        console.warn('[AI Battle] ready check will retry', error);
        window.setTimeout(() => { readyAttempt.current = ''; }, 3000);
      });
  }, [match?.id, match?.status, match?.dashboard_channel, match?.player_ids, session.channel_id, session.players, queryClient, key]);

  const join = async (mode) => {
    const body = await mutation.mutateAsync({ action: 'join', data: { mode, request_id: requestId() } });
    if (isActiveQueue(body)) startAIBattleQueueHeartbeat();
    return body;
  };

  const cancel = async () => {
    const body = await mutation.mutateAsync({ action: 'cancel', data: {} });
    stopAIBattleQueueHeartbeat();
    readyAttempt.current = '';
    joinAttempt.current = '';
    return body;
  };

  const reset = async () => {
    const body = await mutation.mutateAsync({ action: 'reset', data: {} });
    stopAIBattleQueueHeartbeat();
    readyAttempt.current = '';
    joinAttempt.current = '';
    return body;
  };

  return {
    queue,
    match,
    isLoading: state.isLoading,
    error: state.error || mutation.error,
    busy: mutation.isPending,
    refresh: () => state.refetch(),
    join,
    cancel,
    reset,
  };
}
