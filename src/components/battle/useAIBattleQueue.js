// @refresh reset
// Remount consumers on edits: matchmaking hook additions must not reuse old hook slots.
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { dashboardSession, joinDashboard, useDashboardSession } from '@/components/social/dashboardSession';
import { useCompanionIdentity } from '@/components/onboarding/CompanionIdentityContext';
import { getActiveCharacter, subscribeCharacters } from '@/components/game3d/characterStore';

const normalize = (value) => String(value || '').trim().toLowerCase();
const detectAvatarGender = (avatar) => {
  const variant = normalize(avatar?.female_model_variant);
  const model = normalize(avatar?.model_url || avatar?.base_body_model_url);
  if (variant.includes('artemis') || model.includes('artemis')) return 'female';
  if (model.includes('getsuga')) return 'male';
  const gender = normalize(avatar?.gender);
  return gender === 'female' || gender === 'male' ? gender : '';
};
const PAGE_QUEUE_SESSION_ID = globalThis.crypto?.randomUUID?.() || `battle-surface-${Date.now()}-${Math.random().toString(36).slice(2)}`;
let heartbeatTimer = null;
let heartbeatBusy = false;
let joinInFlightPromise = null;

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
const invoke = async (action, data = {}) => {
  try {
    return unwrap(await base44.functions.invoke('aiBattleMatchmaker', { action, data }));
  } catch (error) {
    const body = error?.response?.data?.data ?? error?.response?.data ?? error?.body ?? null;
    const next = new Error(body?.error || body?.message || error?.message || 'AI Battle request failed.');
    next.status = error?.response?.status || error?.status || 500;
    next.body = body;
    throw next;
  }
};
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
  const companion = useCompanionIdentity();
  const [activeCharacter, setActiveCharacter] = useState(() => getActiveCharacter());
  useEffect(() => subscribeCharacters(() => setActiveCharacter(getActiveCharacter())), []);
  const companionGender = detectAvatarGender(companion);
  const selectedAvatar = companionGender
    ? companion
    : activeCharacter && !activeCharacter.isDevTest
      ? activeCharacter
      : companion;
  const selectedGender = detectAvatarGender(selectedAvatar) || 'male';
  const selectedModelUrl = selectedAvatar?.model_url || selectedAvatar?.base_body_model_url || '';
  const selectedAppearance = selectedAvatar ? { ...selectedAvatar, gender: selectedGender, model_url: selectedModelUrl || selectedAvatar.model_url || '' } : { gender: selectedGender, model_url: selectedModelUrl };
  const session = useDashboardSession();
  const queryClient = useQueryClient();
  const joinAttempt = useRef('');
  const [roomRetryTick, setRoomRetryTick] = useState(0);
  const key = ['ai-battle-matchmaking', user?.id];

  const state = useQuery({
    queryKey: key,
    enabled: Boolean(user?.id),
    queryFn: () => invoke('status', sessionData({ position: window.__lunaPvPPosition || null })),
    refetchInterval: polling ? (query) => {
      const body = query.state.data || {};
      const status = String(body?.match?.status || '');
      // Combat damage is authoritative on the match record. Poll fighting more
      // frequently so resolved skill hits and HP changes appear on both clients
      // close to their actual hit frame instead of waiting up to 1.5 seconds.
      if (status === 'fighting') return 500;
      if (['matched', 'connecting', 'countdown'].includes(status)) return 750;
      if (body?.queue?.status === 'waiting') return 1000;
      // If the arena temporarily vanished from cache during a room/network drop,
      // keep looking for the durable server-side active match instead of waiting
      // 15 seconds or forcing the player to press Queue again.
      if (typeof window !== 'undefined' && sessionStorage.getItem('luna_pvp_active_match_id')) return 1000;
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const status = String(match?.status || '');
    if (match?.id && ['connecting','countdown','fighting'].includes(status)) {
      sessionStorage.setItem('luna_pvp_active_match_id', String(match.id));
    } else if (status === 'ended') {
      sessionStorage.removeItem('luna_pvp_active_match_id');
    }
  }, [match?.id, match?.status]);
  const serverOffsetMs = serverTime - Date.now();

  useEffect(() => {
    if (queue?.status === 'waiting' || queue?.status === 'matched' || ['connecting','countdown','fighting'].includes(String(match?.status || ''))) startAIBattleQueueHeartbeat();
    else if (!match || match.status === 'ended') stopAIBattleQueueHeartbeat();
  }, [queue?.status, match?.status]);

  // A normal status heartbeat is the reservation acknowledgement now. Do an
  // immediate refresh on `matched` for every queue surface (including the popup,
  // which intentionally has sessionBridge=false) so both browsers can confirm
  // the same match without waiting for the background heartbeat interval.
  useEffect(() => {
    if (!user?.id || queue?.status !== 'matched' || match?.status !== 'matched' || !match?.id) return undefined;
    let cancelled = false;
    invoke('status', sessionData({ position: window.__lunaPvPPosition || null }))
      .then((body) => {
        if (!cancelled) queryClient.setQueryData(key, (prev = {}) => ({ ...prev, ...body }));
      })
      .catch((error) => {
        if (!cancelled) console.warn('[AI Battle] reservation heartbeat retry', error);
      });
    return () => { cancelled = true; };
  }, [user?.id, queue?.status, match?.id, match?.status, queryClient]);

  // The always-mounted dashboard bridge joins both users into the host dashboard
  // only after BOTH browser clients acknowledged the reserved match.
  useEffect(() => {
    if (!sessionBridge || !match?.id || !user?.id || !['connecting','countdown','fighting'].includes(String(match.status || ''))) return undefined;
    const channelId = String(match.dashboard_channel || `dashboard_${match.host_id}`);
    const hostId = String(match.host_id || '');
    const token = `${match.id}:${hostId}`;
    const requiredIds = (match.player_ids || []).map(String).filter(Boolean);
    const currentPlayers = Array.isArray(session.players) ? session.players : [];
    const currentById = new Map(currentPlayers.map((p) => [String(p.player_id), p]));
    const matchById = new Map((match.players || []).map((p) => [String(p.id || p.player_id || ''), p]));
    const channelMatches = String(session.channel_id || '') === channelId;
    const hasWholePair = requiredIds.length === 2 && requiredIds.every((id) => currentById.has(id));

    const roomHealthy = channelMatches && hasWholePair && session.status === 'connected';
    if (roomHealthy) joinAttempt.current = token;
    else {
      const joinDetail = { channelId, hostId, hostName: match.host_name || 'Player', aiBattle: true, matchId: String(match.id) };
      window.__lunaPendingDashboardJoin = joinDetail;
      // A prior successful join must not permanently suppress reconnects. If the
      // shared room drops later, retry the exact same match/channel automatically.
      if (joinAttempt.current !== token || !channelMatches || session.status !== 'connected' || !hasWholePair) {
        joinAttempt.current = token;
        if (String(user.id) === hostId) window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: joinDetail }));
        else joinDashboard({ id: hostId, name: match.host_name || 'Player' })
          .then(() => window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: joinDetail })))
          .catch((error) => { console.warn('[AI Battle] dashboard join retry', error); joinAttempt.current = ''; });
      }
    }

    let retryTimer = null;
    if (!roomHealthy && ['connecting','countdown','fighting'].includes(String(match.status || ''))) {
      retryTimer = window.setTimeout(() => {
        joinAttempt.current = '';
        setRoomRetryTick((value) => value + 1);
      }, 2500);
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
    return () => { if (retryTimer) window.clearTimeout(retryTimer); };
  }, [sessionBridge, match?.id, match?.host_id, match?.host_name, match?.dashboard_channel, match?.status, match?.player_ids, match?.players, session.channel_id, session.status, session.players, user?.id, user?.full_name, user?.username, roomRetryTick]);

  // Reliable peer cast is only visual prediction. Damage remains server-owned.
  useEffect(() => {
    if (!sessionBridge || typeof window === 'undefined' || !match?.id || !user?.id) return undefined;
    const localId = String(user.id), matchId = String(match.id), ids = new Set((match.player_ids || []).map(String));
    const receive = (event) => {
      const detail = event?.detail || {};
      const sourcePlayerId = String(detail.player_id || detail.sourcePlayerId || '');
      if (!sourcePlayerId || sourcePlayerId === localId || !ids.has(sourcePlayerId) || String(detail.matchId || '') !== matchId) return;
      if (!['pvp_cast', 'pvp_melee', 'ai_battle_card_cast'].includes(String(detail.kind || ''))) return;
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

  const join = async (mode) => {
    // Guard at module scope, not component scope. The queue popup and persistent
    // dashboard bridge share this module, so even a remount or duplicated key
    // handler cannot fire parallel join creates before React state catches up.
    if (joinInFlightPromise) return joinInFlightPromise;
    const promise = mutation.mutateAsync({
      action: 'join',
      data: {
        mode,
        // Stable for this browser session + mode. Repeated join attempts are the
        // same intent rather than brand-new queue requests.
        request_id: `${PAGE_QUEUE_SESSION_ID}:${mode}`,
        avatar_gender: selectedGender,
        avatar_model_url: selectedModelUrl,
        avatar_appearance: selectedAppearance,
      },
    });
    joinInFlightPromise = promise;
    try {
      return await promise;
    } finally {
      if (joinInFlightPromise === promise) joinInFlightPromise = null;
    }
  };
  const reconnect = async () => {
    joinAttempt.current = '';
    const body = await mutation.mutateAsync({ action: 'reconnect', data: { position: window.__lunaPvPPosition || null } });
    if (body?.match?.id && typeof window !== 'undefined') {
      sessionStorage.setItem('luna_pvp_active_match_id', String(body.match.id));
      window.dispatchEvent(new CustomEvent('lunaAIBattleStageEntered', {
        detail: { matchId: body.match.id, mode: body.match.mode || 'pvp', reconnect: true },
      }));
    }
    return body;
  };
  const cancel = async () => mutation.mutateAsync({ action: 'cancel', data: {} });
  const reset = async () => mutation.mutateAsync({ action: 'reset', data: {} });
  const forfeit = async () => match?.id ? mutation.mutateAsync({ action: 'forfeit', data: { match_id: match.id } }) : null;
  const dodge = async () => match?.id ? mutation.mutateAsync({ action: 'dodge', data: { match_id: match.id } }) : null;
  const useSkill = async (slot, castId, attackerPos, targetPos) => match?.id ? mutation.mutateAsync({ action: 'use_skill', data: { match_id: match.id, slot, cast_id: castId, attacker_pos: attackerPos, target_pos: targetPos } }) : null;

  return {
    queue, match, serverOffsetMs,
    isLoading: state.isLoading, isFetching: state.isFetching, error: state.error || mutation.error, busy: mutation.isPending,
    refresh: () => state.refetch(), join, reconnect, cancel, reset, forfeit, dodge, useSkill,
  };
}