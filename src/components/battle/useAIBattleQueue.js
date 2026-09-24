import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { dashboardSession, joinDashboard, useDashboardSession } from '@/components/social/dashboardSession';

const requestId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
// This id identifies one browser surface for diagnostics only. Queue ownership is
// account-level, so editor preview and published/live surfaces for the same user
// are allowed to observe and keep the same queue/match alive.
const PAGE_QUEUE_SESSION_ID = globalThis.crypto?.randomUUID?.() || `battle-surface-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
 * Always-mounted dashboard surfaces call this as a status touch only. It never
 * creates a queue. Reopening, reloading, editor preview and published/live can
 * all recover the same account-level queue/match until the user explicitly
 * cancels or every active surface disappears long enough for the server TTL.
 */
export async function touchAIBattleQueueSession() {
  const body = await invoke('status', sessionData());
  if (isActiveQueue(body)) startAIBattleQueueHeartbeat();
  else stopAIBattleQueueHeartbeat();
  return body;
}

export default function useAIBattleQueue({ sessionBridge = true } = {}) {
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

  // Match joining is deliberately part of the always-mounted bridge instead of
  // the AI Battle menu. Any dashboard surface therefore enters the exact same
  // PvP room even when the menu is closed, including Base44 editor preview.
  //
  // Important: DashboardAvatarScene used to require the dashboard room heartbeat
  // to finish before it would render the PvP staging. In editor preview the match
  // could already be READY while that room snapshot was still the user's default
  // dashboard, so the editor showed the home screen even though the popup said
  // "Match connected". Publish the server-authored match roster provisionally so
  // the battle stage appears immediately, then let the real dashboard heartbeat
  // replace it with authoritative PlayerState/appearance data.
  useEffect(() => {
    if (!sessionBridge || !match?.id || !user?.id || match.status === 'ended') return undefined;

    const channelId = String(match.dashboard_channel || `dashboard_${match.host_id}`);
    const hostId = String(match.host_id || '');
    const token = `${match.id}:${hostId}`;
    const requiredIds = (match.player_ids || []).map(String).filter(Boolean);
    const currentPlayers = Array.isArray(session.players) ? session.players : [];
    const currentById = new Map(currentPlayers.map((player) => [String(player.player_id), player]));
    const matchById = new Map((match.players || []).map((player) => [String(player.id || player.player_id || ''), player]));
    const channelMatches = String(session.channel_id || '') === channelId;
    const hasWholePair = requiredIds.length === 2 && requiredIds.every((id) => currentById.has(id));

    // If the real dashboard heartbeat already owns the full room, leave it alone.
    if (channelMatches && hasWholePair && session.status === 'connected') {
      joinAttempt.current = token;
      return undefined;
    }

    const joinDetail = {
      channelId,
      hostId,
      hostName: match.host_name || 'Player',
      aiBattle: true,
      matchId: String(match.id),
    };

    // Keep a durable hand-off for Base44 editor preview. If MultiplayerSystem has
    // not installed its event listener yet, it consumes this pending join when it
    // mounts instead of falling back to dashboard_<local user>.
    window.__lunaPendingDashboardJoin = joinDetail;

    if (joinAttempt.current !== token || !channelMatches) {
      joinAttempt.current = token;
      if (String(user.id) === hostId) {
        window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: joinDetail }));
      } else {
        joinDashboard({ id: hostId, name: match.host_name || 'Player' })
          .then(() => {
            window.__lunaPendingDashboardJoin = joinDetail;
            window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: joinDetail }));
          })
          .catch((error) => {
            console.warn('[AI Battle] dashboard join is retrying', error);
            joinAttempt.current = '';
          });
      }
    }

    if (!channelMatches || !hasWholePair) {
      const provisionalPlayers = requiredIds.map((id, index) => {
        const existing = currentById.get(id);
        if (existing) return { ...existing, channel_id: channelId };

        const meta = matchById.get(id) || {};
        const isLocal = id === String(user.id);
        return {
          player_id: id,
          display_name: meta.name || meta.display_name || (isLocal ? (user.full_name || user.username || 'You') : 'Opponent'),
          avatar_url: meta.avatar_url || '',
          model_url: meta.model_url || '',
          appearance: meta.appearance || { gender: 'male', name: meta.name || meta.display_name || (isLocal ? 'Player' : 'Opponent') },
          channel_id: channelId,
          last_update: Date.now(),
          dashboard_joined_at: Date.now() + index,
          x: -0.9 * index,
          y: -0.5,
          z: 0,
          yaw: 0,
          anim: 'idle',
          status: 'connecting',
        };
      });

      dashboardSession.publish({
        channel_id: channelId,
        host_id: hostId,
        host_name: match.host_name || 'Player',
        players: provisionalPlayers,
        status: 'connecting',
        error: '',
        ai_battle_match_id: String(match.id),
      });
    }

    return undefined;
  }, [
    sessionBridge,
    match?.id,
    match?.host_id,
    match?.host_name,
    match?.dashboard_channel,
    match?.status,
    match?.player_ids,
    match?.players,
    session.channel_id,
    session.status,
    session.players,
    user?.id,
    user?.full_name,
    user?.username,
  ]);

  useEffect(() => {
    if (!sessionBridge || !match?.id || match.status === 'ready') return undefined;
    if (session.status !== 'connected') return undefined;
    if (String(session.channel_id || '') !== String(match.dashboard_channel || '')) return undefined;
    const present = new Set((session.players || []).map((player) => String(player.player_id)));
    if (!(match.player_ids || []).every((id) => present.has(String(id)))) return undefined;
    if (readyAttempt.current === match.id) return undefined;
    readyAttempt.current = match.id;
    invoke('ready', sessionData({ match_id: match.id }))
      .then((body) => {
        queryClient.setQueryData(key, (prev = {}) => ({ ...prev, match: body.match || prev.match }));
        if (body?.ready !== true && body?.match?.status !== 'ready') {
          window.setTimeout(() => { readyAttempt.current = ''; }, 1500);
        }
      })
      .catch((error) => {
        console.warn('[AI Battle] ready check will retry', error);
        window.setTimeout(() => { readyAttempt.current = ''; }, 3000);
      });
    return undefined;
  }, [sessionBridge, match?.id, match?.status, match?.dashboard_channel, match?.player_ids, session.channel_id, session.status, session.players, queryClient, key]);

  // Relay confirmed local damage to the other dashboard peer. DashboardAvatarScene
  // remains the place that computes the current prototype damage amount; this
  // layer only mirrors the result so editor and published/live see the same hit.
  useEffect(() => {
    if (!sessionBridge || typeof window === 'undefined' || !match?.id || !user?.id) return undefined;
    const localId = String(user.id);
    const matchId = String(match.id);

    const relayDamage = (event) => {
      const detail = event?.detail || {};
      if (detail.network === true) return;
      if (String(detail.matchId || '') !== matchId) return;
      if (String(detail.sourcePlayerId || '') !== localId) return;
      const targetPlayerId = String(detail.targetPlayerId || '');
      const damage = Math.max(0, Number(detail.damage) || 0);
      if (!targetPlayerId || !damage) return;

      window.dispatchEvent(new CustomEvent('multiplayerLocalAction', {
        detail: {
          kind: 'ai_battle_damage',
          matchId,
          effectId: detail.effectId || '',
          sourcePlayerId: localId,
          targetPlayerId,
          damage,
          autoHit: detail.autoHit !== false,
        },
      }));
    };

    window.addEventListener('lunaAIBattleDamageApplied', relayDamage);
    return () => window.removeEventListener('lunaAIBattleDamageApplied', relayDamage);
  }, [sessionBridge, match?.id, user?.id]);

  // Consume PvP actions arriving from the WebRTC dashboard channel. This is what
  // makes an editor player and a published/live player behave as two peers in
  // the same match rather than two unrelated UI previews.
  useEffect(() => {
    if (!sessionBridge || typeof window === 'undefined' || !match?.id || !user?.id) return undefined;
    const localId = String(user.id);
    const matchId = String(match.id);
    const matchIds = new Set((match.player_ids || []).map(String));

    const receiveRemoteAction = (event) => {
      const detail = event?.detail || {};
      const sourcePlayerId = String(detail.player_id || detail.sourcePlayerId || '');
      if (!sourcePlayerId || sourcePlayerId === localId || !matchIds.has(sourcePlayerId)) return;
      if (String(detail.matchId || '') !== matchId) return;

      if (detail.kind === 'ai_battle_card_cast') {
        if (String(detail.targetPlayerId || '') !== localId) return;
        window.dispatchEvent(new CustomEvent('lunaAIBattleRemoteCardCast', {
          detail: {
            ...detail,
            sourcePlayerId,
            targetPlayerId: localId,
            network: true,
          },
        }));
        return;
      }

      if (detail.kind === 'ai_battle_damage') {
        if (String(detail.targetPlayerId || '') !== localId) return;
        const damage = Math.max(0, Number(detail.damage) || 0);
        if (!damage) return;
        window.dispatchEvent(new CustomEvent('lunaAIBattleDamageApplied', {
          detail: {
            effectId: detail.effectId || '',
            sourcePlayerId,
            targetPlayerId: localId,
            damage,
            autoHit: detail.autoHit !== false,
            matchId,
            network: true,
          },
        }));
      }
    };

    window.addEventListener('webrtcRemoteAction', receiveRemoteAction);
    return () => window.removeEventListener('webrtcRemoteAction', receiveRemoteAction);
  }, [sessionBridge, match?.id, match?.player_ids, user?.id]);

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
