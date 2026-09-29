import { conditionalUpdate, rewardError } from './rewardJournal.ts';

type Row = Record<string, any>;

export const CARD_TRADE_PAIR_LOCK_MS = 30_000;
const nowIso = () => new Date().toISOString();
const expiryIso = (ttlMs = CARD_TRADE_PAIR_LOCK_MS) => new Date(Date.now() + ttlMs).toISOString();

export const tradePairKey = (a: string, b: string) => [String(a || ''), String(b || '')].sort().join('::');

export type CardTradePairLock = {
  row_id: string;
  pair_key: string;
  token: string;
  kind: string;
  expires_at: string;
};

async function ensurePairRow(svc: any, pairKey: string) {
  if (!pairKey || pairKey === '::') throw rewardError('A valid player pair is required', 400);
  await svc.CardTradePairLock.upsert([{ pair_key: pairKey }], { key: ['pair_key'] });
  const rows = await svc.CardTradePairLock.filter({ pair_key: pairKey }, '-created_date', 2);
  if ((rows || []).length > 1) throw rewardError('Duplicate card-trade pair locks require reconciliation', 409);
  if (!rows?.[0]) throw rewardError('Card-trade pair lock is unavailable', 503);
  return rows[0];
}

export async function acquireCardTradePairLock(
  svc: any,
  userA: string,
  userB: string,
  kind = 'trade_pair_create',
  token = crypto.randomUUID(),
  ttlMs = CARD_TRADE_PAIR_LOCK_MS,
): Promise<CardTradePairLock> {
  const pairKey = tradePairKey(userA, userB);
  const row = await ensurePairRow(svc, pairKey);
  const lockToken = String(token || '').trim() || crypto.randomUUID();
  const current = nowIso();
  const expires = expiryIso(ttlMs);
  const claimed = await conditionalUpdate(svc.CardTradePairLock, {
    id: row.id,
    $or: [
      { mutation_lock_id: { $exists: false } },
      { mutation_lock_id: '' },
      { mutation_lock_id: lockToken },
      { mutation_lock_until: { $lt: current } },
    ],
  }, {
    $set: {
      mutation_lock_id: lockToken,
      mutation_lock_kind: String(kind || 'trade_pair_create'),
      mutation_lock_until: expires,
    },
  });
  if (!claimed) throw rewardError('A trade between these players is being started somewhere else. Retry in a moment.', 409);
  const live = await svc.CardTradePairLock.get(row.id);
  if (String(live?.mutation_lock_id || '') !== lockToken) throw rewardError('Card-trade pair lock could not be verified', 409);
  return { row_id: row.id, pair_key: pairKey, token: lockToken, kind: String(kind || 'trade_pair_create'), expires_at: expires };
}

export async function releaseCardTradePairLock(svc: any, lock: CardTradePairLock | null | undefined) {
  if (!lock?.row_id || !lock?.token) return false;
  return conditionalUpdate(svc.CardTradePairLock, {
    id: lock.row_id,
    mutation_lock_id: lock.token,
  }, {
    $set: {
      mutation_lock_id: '',
      mutation_lock_kind: '',
      mutation_lock_until: '',
    },
  }).catch(() => false);
}

export async function findActiveCardTradeSessionForPair(svc: any, userA: string, userB: string) {
  const a = String(userA || '');
  const b = String(userB || '');
  for (const status of ['accepted', 'pending']) {
    const rows = await svc.TradeSession.filter({ status }, '-created_date', 100).catch(() => []);
    const matches = (rows || []).filter((session: Row) =>
      (String(session.initiator_id) === a && String(session.recipient_id) === b)
      || (String(session.initiator_id) === b && String(session.recipient_id) === a)
    );
    if (matches.length > 1) throw rewardError('Multiple active trade sessions exist for this player pair and require reconciliation', 409);
    if (matches[0]) return matches[0];
  }
  return null;
}
