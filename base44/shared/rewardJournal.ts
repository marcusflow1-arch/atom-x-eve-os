type Row = Record<string, any>;

export function rewardError(message: string, status = 409): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

export const rewardKey = (...parts: string[]) => JSON.stringify(parts.map(String));

// Uses SDK 0.8.51 server-side predicates. This is not a multi-record transaction.
export async function conditionalUpdate(entity: any, query: Row, changes: Row) {
  if (typeof entity.updateMany !== 'function') throw rewardError('Reward storage does not support conditional updates', 503);
  const result = await entity.updateMany(query, changes);
  if (!result?.success || !Number.isSafeInteger(result.updated) || result.updated > 1) {
    throw rewardError('Reward storage returned an unexpected update result', 503);
  }
  return result.updated === 1;
}

export async function findKeyedRecord(entity: any, key: Row) {
  const rows = await entity.filter(key, 'created_date', 2);
  if (rows.length > 1) throw rewardError('Duplicate reward records require reconciliation');
  return rows[0] || null;
}

export async function ensureKeyedRecord(entity: any, key: Row) {
  const existing = await findKeyedRecord(entity, key);
  if (existing) return existing;
  if (typeof entity.upsert !== 'function') throw rewardError('Reward storage does not support keyed writes', 503);
  // Identity fields only: a retry must never reset a delivered reward or balance.
  await entity.upsert([key], { key: Object.keys(key) });
  const row = await findKeyedRecord(entity, key);
  if (!row) throw rewardError('Reward record is unavailable; retry the request', 503);
  return row;
}

export async function ensureGrant(svc: any, userId: string, key: string, payload: Row) {
  const row = await ensureKeyedRecord(svc.RewardGrant, { user_id: userId, grant_key: key });
  await conditionalUpdate(svc.RewardGrant, { id: row.id, payload: { $exists: false } }, {
    $set: { payload, status: 'pending' },
  });
  const saved = await svc.RewardGrant.get(row.id);
  if (!saved?.payload) throw rewardError('Reward delivery record is unavailable', 503);
  return saved;
}

export async function ownedDeliveredCard(svc: any, userId: string, cardId: string) {
  if (!cardId) return null;
  try {
    const card = await svc.UserCard.get(cardId);
    return card && String(card.user_id) === String(userId) ? card : null;
  } catch (error: any) {
    if (error?.status === 404 || error?.response?.status === 404) return null;
    throw error;
  }
}
