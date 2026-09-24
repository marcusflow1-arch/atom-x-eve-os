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
  if (body?.error) throw new Error(body.error);
  return body;
};
const invoke = async (action, data = {}) => unwrap(await base44.functions.invoke('aiBattleMatchmaker', { action, data }));
const sessionData = (extra = {}) => ({ client_session_id: PAGE_QUEUE_SESSION_ID, ...extra });
const isActiveQueue = (body) => ['waiting', 'matched'].includes(String(body?.queue?.status || ''));
const numericHp = (value, fallback = 1000) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

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
  const resolveAttempt = useRef('');
  const serverHpRef = useRef({ matchId: '', hp: null });
  const key = ['ai-battle-matchmaking', user?.id];

  const state = useQuery({
    queryKey: key,
    enabled: !!user?.id,
    queryFn: () => invoke('status', sessionData()),
    refetchInterval: (query) => {
      const status = query.state.data;
      if (status?.queue?.status === 'waiting' || status?.match?.status === 'matched') return 3000;
      if (status?.match?.status === 'ready') return 1000;
      return 15000;
    },
    refetchOnWindowFocus: true,
    retry: false,
    staleTime: 500,
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
        const meta = matchById.get(id) || {};
        if (existing) {
          return {
            ...existing,
            channel_id: channelId,
            hp: numericHp(meta.hp, existing.hp ?? 1000),
            max_hp: numericHp(meta.max_hp ?? meta.maxHp, existing.max_hp ?? existing.maxHp ?? 1000),
          };
        }

        const isLocal = id === String(user.id);
        return {
          player_id: id,
          display_name: meta.name || meta.display_name || (isLocal ? (user.full_name || user.username || 'You') : 'Opponent'),
          avatar_url: meta.avatar_url || '',
          model_url: meta.model_url || '',
          appearance: meta.appearance || { gender: meta.gender || 'male', name: meta.name || meta.display_name || (isLocal ? 'Player' : 'Opponent') },
          hp: numericHp(meta.hp, 1000),
          max_hp: numericHp(meta.max_hp ?? meta.maxHp, 1000),
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

  // The server is authoritative for turn ownership. Every time the shared match
  // changes, announce that same actor locally so both clients render opposite
  // states: one sees "Your turn" while the other sees "Your opponent's turn".
  useEffect(() => {
    if (!sessionBridge || typeof window === 'undefined' || !match?.id || match.status !== 'ready' || !match.current_turn_id) return undefined;
    window.dispatchEvent(new CustomEvent('lunaAIBattleTurnChanged', {
      detail: {
        matchId: String(match.id),
        actorId: String(match.current_turn_id),
        revision: Number(match.turn_revision || 0),
        authoritative: true,
      },
    }));
    return undefined;
  }, [sessionBridge, match?.id, match?.status, match?.current_turn_id, match?.turn_revision]);

  // A local confirmed hit is resolved through the matchmaking function instead
  // of WebRTC. Damage and the turn pass are one atomic server update, so there is
  // no state where both clients believe they are waiting on the other player.
  useEffect(() => {
    if (!sessionBridge || typeof window === 'undefined' || !match?.id || !user?.id || match.status !== 'ready') return undefined;
    const localId = String(user.id);
    const matchId = String(match.id);

    const resolveLocalHit = async (event) => {
      const detail = event?.detail || {};
      if (detail.network === true || detail.authoritative === true) return;
      if (String(detail.matchId || '') !== matchId) return;
      if (String(detail.sourcePlayerId || '') !== localId) return;
      if (String(match.current_turn_id || '') !== localId) return;

      const targetPlayerId = String(detail.targetPlayerId || '');
      const damage = Math.max(0, Number(detail.damage) || 0);
      if (!targetPlayerId || !damage) return;

      const attemptKey = `${matchId}:${Number(match.turn_revision || 0)}:${detail.effectId || 'attack'}:${targetPlayerId}`;
      if (resolveAttempt.current === attemptKey) return;
      resolveAttempt.current = attemptKey;

      try {
        const body = await invoke('end_turn', sessionData({
          match_id: matchId,
          expected_revision: Number(match.turn_revision || 0),
          target_player_id: targetPlayerId,
          damage,
          effect_id: detail.effectId || '',
        }));

        queryClient.setQueryData(key, (prev = {}) => ({ ...prev, match: body.match || prev.match }));
        const actorId = String(body?.match?.current_turn_id || body?.current_turn_id || '');
        if (actorId) {
          window.dispatchEvent(new CustomEvent('lunaAIBattleTurnChanged', {
            detail: {
              matchId,
              actorId,
              revision: Number(body?.match?.turn_revision || 0),
              authoritative: true,
            },
          }));
        }
      } catch (error) {
        console.warn('[AI Battle] server hit resolution will reconcile from status', error);
        queryClient.invalidateQueries({ queryKey: key });
      }
    };

    window.addEventListener('lunaAIBattleDamageApplied', resolveLocalHit);
    return () => window.removeEventListener('lunaAIBattleDamageApplied', resolveLocalHit);
  }, [sessionBridge, match?.id, match?.status, match?.current_turn_id, match?.turn_revision, user?.id, queryClient, key]);

  // Reconcile this client's own HP from the server roster. This replaces the old
  // peer-only damage path, so editor/live, live/live and delayed WebRTC sessions
  // all receive the same damage. On reload, the difference from max HP restores
  // cumulative damage instead of visually healing the player back to 1000.
  useEffect(() => {
    if (!sessionBridge || typeof window === 'undefined' || !match?.id || !user?.id) return undefined;
    const localId = String(user.id);
    const localPlayer = (match.players || []).find((player) => String(player.id || player.player_id || '') === localId);
    if (!localPlayer) return undefined;

    const maxHp = Math.max(1, numericHp(localPlayer.max_hp ?? localPlayer.maxHp, 1000));
    const serverHp = Math.min(maxHp, numericHp(localPlayer.hp, maxHp));
    const previous = serverHpRef.current.matchId === String(match.id)
      ? serverHpRef.current.hp
      : maxHp;

    if (previous !== null && serverHp < previous) {
      window.dispatchEvent(new CustomEvent('lunaAIBattleDamageApplied', {
        detail: {
          effectId: match.last_attack?.effect_id || '',
          sourcePlayerId: String(match.last_attack?.source_player_id || ''),
          targetPlayerId: localId,
          damage: previous - serverHp,
          hpAfter: serverHp,
          maxHp,
          autoHit: true,
          matchId: String(match.id),
          network: true,
          authoritative: true,
          attackRevision: Number(match.attack_revision || 0),
        },
      }));
    }

    serverHpRef.current = { matchId: String(match.id), hp: serverHp };
    return undefined;
  }, [sessionBridge, match?.id, match?.players, match?.attack_revision, match?.last_attack, user?.id]);

  // WebRTC remains useful for showing the remote card cast/animation quickly,
  // but it no longer owns damage or turns. Those are server authoritative above.
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
      if (detail.kind !== 'ai_battle_card_cast') return;
      if (String(detail.targetPlayerId || '') !== localId) return;

      window.dispatchEvent(new CustomEvent('lunaAIBattleRemoteCardCast', {
        detail: {
          ...detail,
          sourcePlayerId,
          targetPlayerId: localId,
          network: true,
        },
      }));
    };

    window.addEventListener('webrtcRemoteAction', receiveRemoteAction);
    return () => window.removeEventListener('webrtcRemoteAction', receiveRemoteAction);
  }, [sessionBridge, match?.id, match?.player_ids, user?.id]);

  useEffect(() => {
    if (!match?.id) {
      resolveAttempt.current = '';
      serverHpRef.current = { matchId: '', hp: null };
    }
  }, [match?.id]);

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
    resolveAttempt.current = '';
    serverHpRef.current = { matchId: '', hp: null };
    return body;
  };

  const reset = async () => {
    const body = await mutation.mutateAsync({ action: 'reset', data: {} });
    stopAIBattleQueueHeartbeat();
    readyAttempt.current = '';
    joinAttempt.current = '';
    resolveAttempt.current = '';
    serverHpRef.current = { matchId: '', hp: null };
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
