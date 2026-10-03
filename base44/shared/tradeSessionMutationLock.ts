import { conditionalUpdate, rewardError } from './rewardJournal.ts';

type Row = Record<string, any>;

export const TRADE_SESSION_LOCK_MS = 45_000;
const nowIso = () => new Date().toISOString();
const expiryIso = (ttlMs = TRADE_SESSION_LOCK_MS) => new Date(Date.now() + ttlMs).toISOString();

export type TradeSessionMutationLock = {
  session_id: string;
  token: string;
  kind: string;
  expires_at: string;
};

export async function acquireTradeSessionMutationLock(
  svc: any,
  sessionId: string,
  kind: string,
  token = crypto.randomUUID(),
  ttlMs = TRADE_SESSION_LOCK_MS,
): Promise<TradeSessionMutationLock> {
  const id = String(sessionId || '').trim();
  if (!id) throw rewardError('Trade session mutation lock requires a session ID', 400);
  const lockToken = String(token || '').trim() || crypto.randomUUID();
  const current = nowIso();
  const expires = expiryIso(ttlMs);
  const claimed = await conditionalUpdate(svc.TradeSession, {
    id,
    $or: [
      { mutation_lock_id: { $exists: false } },
      { mutation_lock_id: '' },
      { mutation_lock_id: lockToken },
      { mutation_lock_until: { $lt: current } },
    ],
  }, {
    $set: {
      mutation_lock_id: lockToken,
      mutation_lock_kind: String(kind || 'trade_session_mutation'),
      mutation_lock_until: expires,
    },
  });
  if (!claimed) throw rewardError('This trade is being changed somewhere else. Retry in a moment.', 409);
  const live = await svc.TradeSession.get(id);
  if (String(live?.mutation_lock_id || '') !== lockToken) {
    throw rewardError('Trade session mutation lock could not be verified', 409);
  }
  return { session_id: id, token: lockToken, kind: String(kind || 'trade_session_mutation'), expires_at: expires };
}

export async function refreshTradeSessionMutationLock(
  svc: any,
  lock: TradeSessionMutationLock,
  ttlMs = TRADE_SESSION_LOCK_MS,
) {
  const expires = expiryIso(ttlMs);
  const refreshed = await conditionalUpdate(svc.TradeSession, {
    id: lock.session_id,
    mutation_lock_id: lock.token,
  }, {
    $set: { mutation_lock_until: expires },
  });
  if (!refreshed) throw rewardError('Trade session mutation lock expired before the operation completed', 409);
  lock.expires_at = expires;
  return lock;
}

export async function assertTradeSessionMutationLock(
  svc: any,
  sessionId: string,
  token: string,
  kind = 'trade_session_mutation',
) {
  const live = await svc.TradeSession.get(String(sessionId));
  if (String(live?.mutation_lock_id || '') !== String(token || '')) {
    throw rewardError('Trade session mutation lost its lease', 409);
  }
  return refreshTradeSessionMutationLock(svc, {
    session_id: String(sessionId),
    token: String(token),
    kind: String(live.mutation_lock_kind || kind),
    expires_at: String(live.mutation_lock_until || ''),
  });
}

export async function releaseTradeSessionMutationLock(
  svc: any,
  lock: TradeSessionMutationLock | null | undefined,
) {
  if (!lock?.session_id || !lock?.token) return false;
  return conditionalUpdate(svc.TradeSession, {
    id: lock.session_id,
    mutation_lock_id: lock.token,
  }, {
    $set: {
      mutation_lock_id: '',
      mutation_lock_kind: '',
      mutation_lock_until: '',
    },
  }).catch(() => false);
}
