import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { dashboardSession, joinDashboard, useDashboardSession } from '@/components/social/dashboardSession';

const requestId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const PAGE_QUEUE_SESSION_ID = globalThis.crypto?.randomUUID?.() || `battle-surface-${Date.now()}-${Math.random().toString(36).slice(2)}`;
let heartbeatTimer = null;
let heartbeatBusy = false;

const unwrap = (response) => {
  const body = response?.data ?? response ?? {};
  if (body?.error) {
    const error = new Error(body.error);
    error.status = response?.status || response?.response?.status || 400;
    error.body = body;
    throw error;
  }
  return body;
};
const invoke = async (action, data = {}) => unwrap(await base44.functions.invoke('aiBattleMatchmaker', { action, data }));
const sessionData = (extra = {}) => ({ client_session_id: PAGE_QUEUE_SESSION_ID, ...extra });
const queueIsActive = (body) => ['waiting', 'matched'].includes(String(body?.queue?.status || ''));

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
    const body = await invoke('status', sessionData({ position: window.__lunaPvPPosition || null }));
    if (!queueIsActive(body) && body?.match?.status !== 'fighting' && body?.match?.status !== 'countdown') stopAIBattleQueueHeartbeat();
    return body;
  } finally { heartbeatBusy = false; }
}
export function startAIBattleQueueHeartbeat() {
  if (typeof window === 'undefined' || heartbeatTimer) return;
  heartbeatTimer = window.setInterval(() => heartbeatOnce().catch((error) => console.warn('[AI Battle] heartbeat retry', error)), 8000);
}
export async function touchAIBattleQueueSession() {
  const body = await heartbeatOnce();
  if (queueIsActive(body)) startAIBattleQueueHeartbeat();
  return body;
}

export default function useAIBattleQueue({ sessionBridge = true, polling = true } = {}) {
  const { user } = useAuth();
  const session = useDashboardSession();
  const queryClient = useQueryClient();
  const readyAttempt = useRef('');
  const joinAttempt = useRef('');
  const key = ['ai-battle-matchmaking', user?.id];

  const state = useQuery({
    queryKey: key,
    enabled: Boolean(user?.id),
    queryFn: () => invoke('status', sessionData({ position: window.__lunaPvPPosition || null })),
    refetchInterval: polling ? (query) => {
      const body = query.state.data || {};
      const status = String(body?.match?.status || '');
      if (['matched', 'countdown', 'fighting'].includes(status)) return 1500;
      if (body?.queue?.status === 'waiting') return 3000;
      return 15000;
    } : false,
    refetchOnWindowFocus: polling,
    retry: false,
    staleTime: polling ? 500 : Infinity,
  });

  const mutation = useMutation({
    mutationFn: ({ action, data }) => invoke(action, sessionData(data)),
    retry: false,
    onSuccess: (body) => queryClient.setQueryData(key, (prev = {}) => ({ ...prev, ...body })),
  });

  const queue = state.data?.queue || null;
  const match = state.data?.match || null;
  const serverTime = Number(state.data?.server_time || Date.now());
  const serverOffsetMs = serverTime - Date.now();

  useEffect(() => {
    if (queue?.status === 'waiting' || queue?.status === 'matched' || ['countdown','fighting'].includes(String(match?.status || ''))) startAIBattleQueueHeartbeat();
    else if (!match || match.status === 'ended') stopAIBattleQueueHeartbeat();
  }, [queue?.status, match?.status]);

  // The always-mounted dashboard bridge joins both users into the host dashboard.
  useEffect(() => {
    if (!sessionBridge || !match?.id || !user?.id || match.status === 'ended') return undefined;
    const channelId = String(match.dashboard_channel || `dashboard_${match.host_id}`);
    const hostId = String(match.host_id || '');
    const token = `${match.id}:${hostId}`;
    const requiredIds = (match.player_ids || []).map(String).filter(Boolean);
    const currentPlayers = Array.isArray(session.players) ? session.players : [];
    const currentById = new Map(currentPlayers.map((p) => [String(p.player_id), p]));
    const matchById = new Map((match.players || []).map((p) => [String(p.id || p.player_id || ''), p]));
    const channelMatches = String(session.channel_id || '') === channelId;
    const hasWholePair = requiredIds.length === 2 && requiredIds.every((id) => currentById.has(id));

    if (channelMatches && hasWholePair && session.status === 'connected') joinAttempt.current = token;
    else {
      const joinDetail = { channelId, hostId, hostName: match.host_name || 'Player', aiBattle: true, matchId: String(match.id) };
      window.__lunaPendingDashboardJoin = joinDetail;
      if (joinAttempt.current !== token || !channelMatches) {
        joinAttempt.current = token;
        if (String(user.id) === hostId) window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: joinDetail }));
        else joinDashboard({ id: hostId, name: match.host_name || 'Player' })
          .then(() => window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: joinDetail })))
          .catch((error) => { console.warn('[AI Battle] dashboard join retry', error); joinAttempt.current = ''; });
      }
    }

    if (!channelMatches || !hasWholePair) {
      const provisionalPlayers = requiredIds.map((id, index) => {
        const existing = currentById.get(id); const meta = matchById.get(id) || {};
        return existing || {
          player_id: id,
          display_name: meta.name || (id === String(user.id) ? (user.full_name || user.username || 'You') : 'Opponent'),
          avatar_url: meta.avatar_url || '', model_url: meta.model_url || '', appearance: meta.appearance || { gender: meta.gender || 'male' },
          channel_id: channelId, last_update: Date.now(), dashboard_joined_at: Date.now() + index, status: 'connecting', x: 0, y: -0.5, z: 0, yaw: 0, anim: 'idle',
        };
      });
      dashboardSession.publish({ channel_id: channelId, host_id: hostId, host_name: match.host_name || 'Player', players: provisionalPlayers, status: 'connecting', error: '', ai_battle_match_id: String(match.id) });
    }
    return undefined;
  }, [sessionBridge, match?.id, match?.host_id, match?.host_name, match?.dashboard_channel, match?.status, match?.player_ids, match?.players, session.channel_id, session.status, session.players, user?.id, user?.full_name, user?.username]);

  // Both models must be present before the server begins the shared countdown.
  useEffect(() => {
    if (!sessionBridge || !match?.id || match.status !== 'matched') return undefined;
    if (session.status !== 'connected' || String(session.channel_id || '') !== String(match.dashboard_channel || '')) return undefined;
    const present = new Set((session.players || []).map((p) => String(p.player_id)));
    if (!(match.player_ids || []).every((id) => present.has(String(id)))) return undefined;
    if (readyAttempt.current === match.id) return undefined;
    readyAttempt.current = match.id;
    invoke('ready', sessionData({ match_id: match.id }))
      .then((body) => queryClient.setQueryData(key, (prev = {}) => ({ ...prev, match: body.match || prev.match, server_time: body.server_time || prev.server_time })))
      .catch((error) => { console.warn('[AI Battle] ready retry', error); window.setTimeout(() => { readyAttempt.current = ''; }, 1500); });
    return undefined;
  }, [sessionBridge, match?.id, match?.status, match?.dashboard_channel, match?.player_ids, session.channel_id, session.status, session.players, queryClient, key]);

  // Reliable peer cast is only visual prediction. Damage remains server-owned.
  useEffect(() => {
    if (!sessionBridge || typeof window === 'undefined' || !match?.id || !user?.id) return undefined;
    const localId = String(user.id), matchId = String(match.id), ids = new Set((match.player_ids || []).map(String));
    const receive = (event) => {
      const detail = event?.detail || {};
      const sourcePlayerId = String(detail.player_id || detail.sourcePlayerId || '');
      if (!sourcePlayerId || sourcePlayerId === localId || !ids.has(sourcePlayerId) || String(detail.matchId || '') !== matchId) return;
      if (!['pvp_cast', 'ai_battle_card_cast'].includes(String(detail.kind || ''))) return;
      window.dispatchEvent(new CustomEvent('lunaAIBattleRemoteCardCast', { detail: { ...detail, sourcePlayerId, targetPlayerId: localId, network: true } }));
    };
    window.addEventListener('webrtcRemoteAction', receive);
    return () => window.removeEventListener('webrtcRemoteAction', receive);
  }, [sessionBridge, match?.id, match?.player_ids, user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.__lunaPvPMatch = match ? { ...match, serverOffsetMs } : null;
    return () => { if (window.__lunaPvPMatch?.id === match?.id) delete window.__lunaPvPMatch; };
  }, [match, serverOffsetMs]);

  const join = async (mode) => mutation.mutateAsync({ action: 'join', data: { mode, request_id: requestId() } });
  const cancel = async () => mutation.mutateAsync({ action: 'cancel', data: {} });
  const reset = async () => mutation.mutateAsync({ action: 'reset', data: {} });
  const forfeit = async () => match?.id ? mutation.mutateAsync({ action: 'forfeit', data: { match_id: match.id } }) : null;
  const dodge = async () => match?.id ? mutation.mutateAsync({ action: 'dodge', data: { match_id: match.id } }) : null;
  const useSkill = async (slot, castId, attackerPos, targetPos) => match?.id ? mutation.mutateAsync({ action: 'use_skill', data: { match_id: match.id, slot, cast_id: castId, attacker_pos: attackerPos, target_pos: targetPos } }) : null;

  return {
    queue, match, serverOffsetMs,
    isLoading: state.isLoading, isFetching: state.isFetching, error: state.error || mutation.error, busy: mutation.isPending,
    refresh: () => state.refetch(), join, cancel, reset, forfeit, dodge, useSkill,
  };
}
