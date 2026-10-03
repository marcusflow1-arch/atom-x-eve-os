// @refresh reset
// Remount consumers on edits: matchmaking hook additions must not reuse old hook slots.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client';
import { useAuth } from '@/components/auth/AuthContext';
import { showInfo } from '@/components/error/ErrorToast';
import { dashboardSession, joinDashboard, useDashboardSession } from '@/components/social/dashboardSession';
import { useCompanionIdentity } from '@/components/onboarding/CompanionIdentityContext';
import { getActiveCharacter, subscribeCharacters } from '@/components/game3d/characterStore';
import { requestAIBattle, withoutDismissed } from './battleClient';
import { aiBattleQueryKey, battleDeadline, createBattleRefresh, matchSignal, mergeBattleSnapshot, queueSignal, RETRYABLE_BATTLE_ACTIONS, scheduleBattleDeadline } from './battleSync';
export { aiBattleQueryKey } from './battleSync';
export { dismissAIBattleResult } from './battleClient';

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
const ACTIVE_MATCH_STATUSES = ['connecting', 'countdown', 'fighting'];
let heartbeatTimer = null;
let heartbeatBusy = false;
let joinInFlightPromise = null;
let heartbeatUserId = '';
let lastNoticeShown = '';

const sessionData = (extra = {}) => ({ client_session_id: PAGE_QUEUE_SESSION_ID, ...extra });

// Base44 answers 429 when the app sends too many requests. That is a "try again
// shortly", not a real failure: the Queue button used to give up silently on it
// and flip back to Q.
export const isRateLimited = (error) => Number(error?.status) === 429
  || /rate limit|too many requests|too many attempts/i.test(String(error?.message || error || ''));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const RETRY_DELAYS_MS = [1500, 3000, 5000];
// Only for actions that are safe to repeat (join/cancel/reconnect converge on
// the same server state). Combat actions are never retried automatically.
async function invokeWithRetry(userId, action, data) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await requestAIBattle(userId, action, data);
    } catch (error) {
      if (!RETRYABLE_BATTLE_ACTIONS.has(action) || !isRateLimited(error) || attempt >= RETRY_DELAYS_MS.length) throw error;
      await wait(RETRY_DELAYS_MS[attempt]);
    }
  }
}
const queueIsActive = (body) => ['waiting', 'matched'].includes(String(body?.queue?.status || ''));
const matchIsActive = (body) => ACTIVE_MATCH_STATUSES.includes(String(body?.match?.status || ''));

// The server explains queue changes it made on the player's behalf (for example
// "your opponent left, you are back in the queue"). Show each one once.
export function announceAIBattleNotice(text) {
  const notice = String(text || '');
  if (!notice || notice === lastNoticeShown) return;
  lastNoticeShown = notice;
  showInfo(notice);
  window.setTimeout(() => { if (lastNoticeShown === notice) lastNoticeShown = ''; }, 10000);
}
export const OPPONENT_LEFT_NOTICE = 'Your opponent left before the fight started. You are back in the queue with your original place.';
const announce = (body) => announceAIBattleNotice(body?.notice);

/**
 * The one status fetcher for the matchmaking cache. Every observer of
 * ['ai-battle-matchmaking', userId] must use this queryFn — including passive
 * observers that never poll. React Query keeps the options of whichever
 * observer rendered last, so a placeholder queryFn on a passive observer used
 * to turn any invalidate/refetch into `{}` and wipe the live match from the
 * cache, which unmounted the arena mid-match.
 */
export async function fetchAIBattleStatus(context, options) {
  const userId = context?.queryKey?.[1] || heartbeatUserId;
  const body = await requestAIBattle(userId, 'status', sessionData({ position: typeof window !== 'undefined' ? window.__lunaPvPPosition || null : null }), options);
  announce(body);
  return withoutDismissed(body);
}

// Merge a server response into the shared cache. A failed request never reaches
// this function, so a network hiccup can no longer clear the queue or match.
function writeStatus(queryClient, userId, body) {
  if (!userId || !body) return;
  const next = withoutDismissed(body);
  queryClient.setQueryData(aiBattleQueryKey(userId), (prev) => mergeBattleSnapshot(prev, next));
}

export const getAIBattleClientSessionId = () => PAGE_QUEUE_SESSION_ID;
export function stopAIBattleQueueHeartbeat() {
  if (heartbeatTimer && typeof window !== 'undefined') window.clearInterval(heartbeatTimer);
  heartbeatTimer = null;
  heartbeatBusy = false;
}
async function heartbeatOnce({ force = false } = {}) {
  if (heartbeatBusy) return null;
  // While the dashboard's own poller is running it already keeps the queue
  // alive. Skipping here halves the request rate that was triggering Base44's
  // rate limit (429).
  if (!force && heartbeatUserId) {
    const updatedAt = Number(queryClientInstance.getQueryState(aiBattleQueryKey(heartbeatUserId))?.dataUpdatedAt || 0);
    if (Date.now() - updatedAt < 9000) return null;
  }
  heartbeatBusy = true;
  try {
    const body = await fetchAIBattleStatus();
    // The heartbeat keeps running when the dashboard is not on screen (another
    // page, a hidden tab). Publishing its result keeps "Return to match" and the
    // queue indicator accurate everywhere without a second poller.
    writeStatus(queryClientInstance, heartbeatUserId, body);
    if (!queueIsActive(body) && !matchIsActive(body)) stopAIBattleQueueHeartbeat();
    return body;
  } finally { heartbeatBusy = false; }
}
export function startAIBattleQueueHeartbeat() {
  if (typeof window === 'undefined' || heartbeatTimer) return;
  heartbeatTimer = window.setInterval(() => heartbeatOnce().catch((error) => console.warn('[AI Battle] heartbeat retry', error)), 10000);
}
export async function touchAIBattleQueueSession(userId = '') {
  if (userId) heartbeatUserId = String(userId);
  const body = await heartbeatOnce({ force: true });
  if (queueIsActive(body) || matchIsActive(body)) startAIBattleQueueHeartbeat();
  return body;
}

// Whether the queue popup is on screen, so the compact queue indicator can step
// aside instead of showing the same status twice.
let overlayOpen = false;
const overlayListeners = new Set();
export function setAIBattleOverlayOpen(open) {
  overlayOpen = Boolean(open);
  overlayListeners.forEach((listener) => listener());
}
export function useAIBattleOverlayOpen() {
  return useSyncExternalStore(
    (listener) => { overlayListeners.add(listener); return () => overlayListeners.delete(listener); },
    () => overlayOpen,
    () => false,
  );
}

/**
 * Read-only view of the shared matchmaking cache. It never polls on its own;
 * AIBattleHost owns the polling cadence. It uses the real fetcher so a refetch
 * triggered anywhere can never replace the cache with an empty object.
 */
export function useAIBattleSnapshot() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: aiBattleQueryKey(user?.id),
    queryFn: fetchAIBattleStatus,
    enabled: false,
    structuralSharing: mergeBattleSnapshot,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
  const match = data?.match || null;
  const isParticipant = Boolean(match?.id && user?.id && (match.player_ids || []).map(String).includes(String(user.id)));
  return {
    queue: data?.queue || null,
    match,
    serverTime: Number(data?.server_time || 0),
    isParticipant,
    // `matched` is only a reservation. The arena appears once both clients have
    // acknowledged it (`connecting`) and stays up through the results screen.
    arenaActive: isParticipant && [...ACTIVE_MATCH_STATUSES, 'ended'].includes(String(match?.status || '')),
  };
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
  // Leave the gender blank when the avatar has not resolved yet. The server then
  // uses the saved Avatar row. Defaulting to "male" here used to queue female
  // players as male, which removed their Artemis abilities from the PvP hotbar
  // and loaded the wrong fighter.
  const selectedGender = detectAvatarGender(selectedAvatar);
  const selectedModelUrl = selectedAvatar?.model_url || selectedAvatar?.base_body_model_url || '';
  const selectedAppearance = selectedAvatar
    ? { ...selectedAvatar, gender: selectedGender, model_url: selectedModelUrl || selectedAvatar.model_url || '' }
    : null;
  const session = useDashboardSession();
  const queryClient = useQueryClient();
  const joinAttempt = useRef('');
  const roomJoinBusy = useRef(false);
  const roomJoinAt = useRef(0);
  const refreshSignal = useRef(null);
  const [roomRetryTick, setRoomRetryTick] = useState(0);
  const key = aiBattleQueryKey(user?.id);

  useEffect(() => { if (user?.id) heartbeatUserId = String(user.id); }, [user?.id]);

  const state = useQuery({
    queryKey: key,
    enabled: Boolean(user?.id),
    queryFn: fetchAIBattleStatus,
    structuralSharing: mergeBattleSnapshot,
    // Realtime and hit deadlines wake this cache promptly; polling is recovery.
    // Poll only as fast as each phase needs. Every status call costs several
    // database operations, and the previous 0.5-1 s cadence (x every open tab)
    // pushed the app over Base44's rate limit, which is what made Queue fail.
    refetchInterval: polling ? (query) => {
      if (isRateLimited(query.state.error)) return 6000;
      const body = query.state.data || {};
      const status = String(body?.match?.status || '');
      // The fight is turn based. Your own actions update from their response;
      // realtime, the hit deadline and the opponent's relayed action wake the
      // cache right away, so this poll is only recovery. 1 s polling from two
      // clients hit Base44's rate limit ("Rate limit exceeded" in matches).
      if (status === 'fighting') return 2000;
      if (['matched', 'connecting', 'countdown'].includes(status)) return 1500;
      if (body?.queue?.status === 'waiting') return 3000;
      // If the arena temporarily vanished from cache during a room/network drop,
      // keep looking for the durable server-side active match instead of
      // forcing the player to press Queue again.
      if (typeof window !== 'undefined' && sessionStorage.getItem('luna_pvp_active_match_id')) return 3000;
      return 30000;
    } : false,
    refetchOnWindowFocus: polling,
    retry: false,
    staleTime: polling ? 500 : Infinity,
  });

  const mutation = useMutation({
    mutationFn: ({ action, data }) => invokeWithRetry(user?.id, action, sessionData(data)),
    retry: false,
    onSuccess: (body) => {
      announce(body);
      writeStatus(queryClient, user?.id, body);
    },
  });

  const queue = state.data?.queue || null;
  const match = state.data?.match || null;
  const serverOffsetMs = Number(state.data?._server_offset_ms || 0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const status = String(match?.status || '');
    if (match?.id && ACTIVE_MATCH_STATUSES.includes(status)) {
      sessionStorage.setItem('luna_pvp_active_match_id', String(match.id));
    } else if (status === 'ended' || (state.data?.server_time && !match && !queue)) {
      sessionStorage.removeItem('luna_pvp_active_match_id');
    }
  }, [match?.id, match?.status, queue, state.data?.server_time]);
  // Subscribe once on the persistent host. Other queue surfaces only observe
  // the cache. Entity RLS restricts these events to this player's queue/matches.
  useEffect(() => {
    if (!polling || !user?.id) return undefined;
    const userId = String(user.id);
    const snapshot = () => queryClient.getQueryData(aiBattleQueryKey(userId));
    const refresh = createBattleRefresh({ refresh: async () => {
      const body = await fetchAIBattleStatus({ queryKey: aiBattleQueryKey(userId) }, { afterCurrent: true });
      writeStatus(queryClient, userId, body);
    } });
    refreshSignal.current = refresh.schedule;
    let lastQueue = queueSignal(snapshot()?.queue), lastMatch = matchSignal(snapshot()?.match);
    const stops = [];
    try {
      stops.push(base44.entities.AIBattleQueueEntry.subscribe((event) => {
        const row = event?.data, current = snapshot();
        if (String(row?.user_id || '') !== userId && String(event?.id || '') !== String(current?.queue?.id || '')) return;
        const signature = queueSignal(row);
        if (signature !== lastQueue && signature !== queueSignal(current?.queue)) refresh.schedule();
        lastQueue = signature;
      }));
      stops.push(base44.entities.AIBattleMatch.subscribe((event) => {
        const current = snapshot();
        const matchId = current?.match?.id || current?.queue?.match_id;
        if (!matchId || String(event?.id || event?.data?.id) !== String(matchId)) return;
        const signature = matchSignal(event?.data);
        if (signature !== lastMatch && signature !== matchSignal(current?.match)) refresh.schedule();
        lastMatch = signature;
      }));
    } catch (error) { console.warn('[AI Battle] realtime unavailable; polling continues', error); }
    return () => {
      refresh.stop();
      if (refreshSignal.current === refresh.schedule) refreshSignal.current = null;
      stops.forEach((stop) => { if (typeof stop === 'function') stop(); });
    };
  }, [polling, user?.id, queryClient]);

  const deadline = battleDeadline(match);
  useEffect(() => {
    if (!polling || !user?.id || !deadline) return undefined;
    return scheduleBattleDeadline({
      match, offset: serverOffsetMs,
      refresh: () => fetchAIBattleStatus({ queryKey: aiBattleQueryKey(user.id) }, { afterCurrent: true }),
    });
  }, [polling, user?.id, match?.id, match?.status, deadline, serverOffsetMs]);

  useEffect(() => {
    if (queue?.status === 'waiting' || queue?.status === 'matched' || ACTIVE_MATCH_STATUSES.includes(String(match?.status || ''))) startAIBattleQueueHeartbeat();
    else if (!match || match.status === 'ended') stopAIBattleQueueHeartbeat();
  }, [queue?.status, match?.status]);

  // A normal status heartbeat is the reservation acknowledgement now. Do an
  // immediate refresh on `matched` for every queue surface (including the popup,
  // which intentionally has sessionBridge=false) so both browsers can confirm
  // the same match without waiting for the background heartbeat interval.
  useEffect(() => {
    if (!polling || !user?.id || queue?.status !== 'matched' || match?.status !== 'matched' || !match?.id) return undefined;
    let cancelled = false;
    fetchAIBattleStatus()
      .then((body) => {
        if (!cancelled) writeStatus(queryClient, user.id, body);
      })
      .catch((error) => {
        if (!cancelled) console.warn('[AI Battle] reservation heartbeat retry', error);
      });
    return () => { cancelled = true; };
  }, [polling, user?.id, queue?.status, match?.id, match?.status, queryClient]);

  // The always-mounted battle host joins both users into the host dashboard
  // only after BOTH browser clients acknowledged the reserved match.
  useEffect(() => {
    if (!sessionBridge || !match?.id || !user?.id || !ACTIVE_MATCH_STATUSES.includes(String(match.status || ''))) return undefined;
    const channelId = String(match.dashboard_channel || `dashboard_${match.host_id}`);
    const hostId = String(match.host_id || '');
    const token = `${match.id}:${hostId}`;
    const requiredIds = (match.player_ids || []).map(String).filter(Boolean);
    const currentPlayers = Array.isArray(session.players) ? session.players : [];
    const currentById = new Map(currentPlayers.map((p) => [String(p.player_id), p]));
    const matchById = new Map((match.players || []).map((p) => [String(p.id || p.player_id || ''), p]));
    const channelMatches = String(session.channel_id || '') === channelId;
    const hasWholePair = requiredIds.length === 2 && requiredIds.every((id) => currentById.has(id));

    // 'reconnecting' is a missed heartbeat (often a rate limit) while presence is
    // still valid; rejoining the room then only adds more requests.
    const roomHealthy = channelMatches && hasWholePair && ['connected', 'reconnecting'].includes(session.status);
    if (roomHealthy) joinAttempt.current = token;
    else {
      const joinDetail = { channelId, hostId, hostName: match.host_name || 'Player', aiBattle: true, matchId: String(match.id) };
      window.__lunaPendingDashboardJoin = joinDetail;
      // A prior successful join must not permanently suppress reconnects. If the
      // shared room drops later, retry the exact same match/channel automatically.
      if (!roomJoinBusy.current && Date.now() - roomJoinAt.current >= 2500 && (joinAttempt.current !== token || !channelMatches || session.status !== 'connected' || !hasWholePair)) {
        roomJoinAt.current = Date.now();
        joinAttempt.current = token;
        if (String(user.id) === hostId) window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: joinDetail }));
        else {
          roomJoinBusy.current = true;
          joinDashboard({ id: hostId, name: match.host_name || 'Player' })
            .then(() => window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: joinDetail })))
            .catch((error) => { console.warn('[AI Battle] dashboard join retry', error); joinAttempt.current = ''; })
            .finally(() => { roomJoinBusy.current = false; });
        }
      }
    }

    let retryTimer = null;
    if (!roomHealthy && ACTIVE_MATCH_STATUSES.includes(String(match.status || ''))) {
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
      // A dodge ends the opponent's turn: fetch the new turn right away.
      if (String(detail.kind || '') === 'pvp_dodge') { refreshSignal.current?.(); return; }
      if (!['pvp_cast', 'pvp_melee', 'ai_battle_card_cast'].includes(String(detail.kind || ''))) return;
      window.dispatchEvent(new CustomEvent('lunaAIBattleRemoteCardCast', { detail: { ...detail, sourcePlayerId, targetPlayerId: localId, network: true } }));
      refreshSignal.current?.();
    };
    window.addEventListener('webrtcRemoteAction', receive);
    return () => window.removeEventListener('webrtcRemoteAction', receive);
  }, [sessionBridge, match?.id, match?.player_ids, user?.id]);

  useEffect(() => {
    if (!sessionBridge || typeof window === 'undefined') return undefined;
    window.__lunaPvPMatch = match ? { ...match, serverOffsetMs } : null;
    return () => { if (window.__lunaPvPMatch?.id === match?.id) delete window.__lunaPvPMatch; };
  }, [sessionBridge, match, serverOffsetMs]);

  const join = async (mode) => {
    // Guard at module scope, not component scope. The queue popup and persistent
    // battle host share this module, so even a remount or duplicated key
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
        ...(selectedAppearance ? { avatar_appearance: selectedAppearance } : {}),
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
