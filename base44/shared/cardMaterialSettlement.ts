import { conditionalUpdate, rewardError } from './rewardJournal.ts';

type Row = Record<string, any>;

export const CARD_MATERIAL_RECEIPT_FIELD = 'card_consumption_receipts';

function receipts(row: Row | null | undefined) {
  return Array.isArray(row?.[CARD_MATERIAL_RECEIPT_FIELD])
    ? row[CARD_MATERIAL_RECEIPT_FIELD].map(String)
    : [];
}

export function hasCardMaterialReceipt(row: Row | null | undefined, receipt: string) {
  return Boolean(receipt) && receipts(row).includes(String(receipt));
}

export type CardMaterialSpend = {
  user_id: string;
  user_material_id: string;
  material_id?: string;
  receipt: string;
  quantity: number;
};

/**
 * Atomically consumes enhancement material and records the logical mutation
 * receipt on the same UserMaterial row. A retry is successful only when its
 * own receipt exists; observing another request's post-spend quantity is never
 * enough to claim success.
 */
export async function applyCardMaterialSpend(svc: any, spend: CardMaterialSpend) {
  const userId = String(spend?.user_id || '').trim();
  const stackId = String(spend?.user_material_id || '').trim();
  const materialId = String(spend?.material_id || '').trim();
  const receipt = String(spend?.receipt || '').trim();
  const quantity = Math.floor(Number(spend?.quantity || 0));

  if (!userId || !stackId || !receipt || !Number.isSafeInteger(quantity) || quantity < 1) {
    throw rewardError('Card material settlement descriptor is invalid', 400);
  }

  let stack = await svc.UserMaterial.get(stackId).catch(() => null);
  if (!stack || String(stack.user_id || '') !== userId) {
    throw rewardError('Enhancement material not found', 404);
  }
  if (materialId && String(stack.material_id || '') !== materialId) {
    throw rewardError('Enhancement material identity changed before settlement', 409);
  }
  if (hasCardMaterialReceipt(stack, receipt)) return stack;

  const query: Row = {
    id: stackId,
    user_id: userId,
    quantity: { $gte: quantity },
    [CARD_MATERIAL_RECEIPT_FIELD]: { $nin: [receipt] },
  };
  if (materialId) query.material_id = materialId;

  const applied = await conditionalUpdate(svc.UserMaterial, query, {
    $inc: { quantity: -quantity },
    $addToSet: { [CARD_MATERIAL_RECEIPT_FIELD]: receipt },
  });

  stack = await svc.UserMaterial.get(stackId).catch(() => null);
  if (stack && hasCardMaterialReceipt(stack, receipt)) return stack;

  if (!stack || String(stack.user_id || '') !== userId) {
    throw rewardError('Enhancement material disappeared during settlement', 409);
  }
  if (materialId && String(stack.material_id || '') !== materialId) {
    throw rewardError('Enhancement material identity changed during settlement', 409);
  }
  if (!applied && Number(stack.quantity || 0) < quantity) {
    throw rewardError('Not enough enhancement material remains for this request', 409);
  }

  throw rewardError('Enhancement material changed concurrently; retry the card action', 503);
}
