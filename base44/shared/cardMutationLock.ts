import { conditionalUpdate, rewardError } from './rewardJournal.ts';

type Row = Record<string, any>;

export const CARD_MUTATION_LOCK_MS = 45_000;
const nowIso = () => new Date().toISOString();
const expiryIso = (ttlMs = CARD_MUTATION_LOCK_MS) => new Date(Date.now() + ttlMs).toISOString();

export type CardMutationLock = {
  card_id: string;
  token: string;
  kind: string;
  expires_at: string;
};

export async function acquireCardMutationLock(
  svc: any,
  cardId: string,
  ownerId: string | null,
  kind: string,
  token = crypto.randomUUID(),
  ttlMs = CARD_MUTATION_LOCK_MS,
): Promise<CardMutationLock> {
  const id = String(cardId || '').trim();
  if (!id) throw rewardError('Card mutation lock requires a card ID', 400);
  const lockToken = String(token || '').trim() || crypto.randomUUID();
  const current = nowIso();
  const expires = expiryIso(ttlMs);
  const query: Row = {
    id,
    ...(ownerId ? { user_id: String(ownerId) } : {}),
    $or: [
      { mutation_lock_id: { $exists: false } },
      { mutation_lock_id: '' },
      { mutation_lock_id: lockToken },
      { mutation_lock_until: { $lt: current } },
    ],
  };
  const claimed = await conditionalUpdate(svc.UserCard, query, {
    $set: {
      mutation_lock_id: lockToken,
      mutation_lock_kind: String(kind || 'card_mutation'),
      mutation_lock_until: expires,
    },
  });
  if (!claimed) throw rewardError('This card is being changed somewhere else. Retry in a moment.', 409);
  const live = await svc.UserCard.get(id);
  if (String(live?.mutation_lock_id || '') !== lockToken) {
    throw rewardError('Card mutation lock could not be verified', 409);
  }
  return { card_id: id, token: lockToken, kind: String(kind || 'card_mutation'), expires_at: expires };
}

export async function refreshCardMutationLock(svc: any, lock: CardMutationLock, ttlMs = CARD_MUTATION_LOCK_MS) {
  const expires = expiryIso(ttlMs);
  const refreshed = await conditionalUpdate(svc.UserCard, {
    id: lock.card_id,
    mutation_lock_id: lock.token,
  }, {
    $set: { mutation_lock_until: expires },
  });
  if (!refreshed) throw rewardError('Card mutation lock expired before the operation completed', 409);
  lock.expires_at = expires;
  return lock;
}

export async function releaseCardMutationLock(svc: any, lock: CardMutationLock | null | undefined) {
  if (!lock?.card_id || !lock?.token) return false;
  return conditionalUpdate(svc.UserCard, {
    id: lock.card_id,
    mutation_lock_id: lock.token,
  }, {
    $set: {
      mutation_lock_id: '',
      mutation_lock_kind: '',
      mutation_lock_until: '',
    },
  }).catch(() => false);
}

export async function acquireCardMutationLocks(
  svc: any,
  cards: Array<{ id: string; owner_id?: string | null }>,
  kind: string,
  operationToken = crypto.randomUUID(),
) {
  const unique = new Map<string, { id: string; owner_id?: string | null }>();
  for (const card of cards || []) {
    const id = String(card?.id || '').trim();
    if (id) unique.set(id, { id, owner_id: card.owner_id ?? null });
  }
  const ordered = [...unique.values()].sort((a, b) => a.id.localeCompare(b.id));
  const locks: CardMutationLock[] = [];
  try {
    for (const card of ordered) {
      locks.push(await acquireCardMutationLock(
        svc,
        card.id,
        card.owner_id ? String(card.owner_id) : null,
        kind,
        `${operationToken}:${card.id}`,
      ));
    }
    return locks;
  } catch (error) {
    for (const lock of [...locks].reverse()) await releaseCardMutationLock(svc, lock);
    throw error;
  }
}

export async function releaseCardMutationLocks(svc: any, locks: CardMutationLock[] = []) {
  for (const lock of [...locks].reverse()) await releaseCardMutationLock(svc, lock);
}
