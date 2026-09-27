type AnyObj = Record<string, any>;
const now = () => new Date().toISOString();

export async function ownsItem(svc: any, userId: string, itemType: 'game' | 'dlc', itemId: string) {
  if (!userId || !itemId) return false;
  const rows = await svc.Entitlement.filter({ user_id: userId, item_type: itemType, item_id: itemId, revoked: false }, '-granted_at', 1);
  return rows.length > 0;
}

export async function ownedItemIds(svc: any, userId: string, itemType: 'game' | 'dlc') {
  const rows = await svc.Entitlement.filter({ user_id: userId, item_type: itemType, revoked: false }, '-granted_at', 5000);
  return [...new Set(rows.map((row: AnyObj) => String(row.item_id || '')).filter(Boolean))];
}

export async function grantEntitlement(svc: any, userId: string, itemType: 'game' | 'dlc', itemId: string, options: AnyObj = {}) {
  const existing = await svc.Entitlement.filter({ user_id: userId, item_type: itemType, item_id: itemId, revoked: false }, '-granted_at', 1);
  if (existing[0]) return { entitlement: existing[0], created: false };
  let gameId = String(options.game_id || '');
  if (!gameId && itemType === 'game') gameId = itemId;
  if (!gameId && itemType === 'dlc') {
    const dlc = await svc.DLC.get(itemId).catch(() => null);
    gameId = String(dlc?.game_id || '');
  }
  const entitlement = await svc.Entitlement.create({
    user_id: userId,
    item_type: itemType,
    item_id: itemId,
    game_id: gameId,
    source: options.source || 'admin_grant',
    order_id: options.order_id || '',
    granted_at: options.granted_at || now(),
    revoked: false,
    ...(Array.isArray(options.starter_card_ids) ? { starter_reward_version: 1, starter_card_ids: options.starter_card_ids } : {}),
  });
  return { entitlement, created: true };
}
