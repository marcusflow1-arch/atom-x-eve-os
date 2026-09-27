import { conditionalUpdate, ensureGrant, ensureKeyedRecord, findKeyedRecord, ownedDeliveredCard, rewardError, rewardKey } from './rewardJournal.ts';

type Row = Record<string, any>;
const now = () => new Date().toISOString();
const lower = (value: any) => String(value || '').trim().toLowerCase();
const rarityMultiplier: Record<string, number> = { common: 1, uncommon: 1.15, rare: 1.35, epic: 1.7, legendary: 2.2, mythical: 3, mythic: 3, unique: 4, limitless: 6 };

export async function grantCard(svc: any, userId: string, tradingCardId: string, options: Row = {}) {
  const source = String(options.source || 'achievement');
  const key = options.grant_key || rewardKey('card', userId, source, String(options.achievement_id || ''), String(tradingCardId));
  let grant = await findKeyedRecord(svc.RewardGrant, { user_id: userId, grant_key: key });
  if (grant?.payload && (grant.payload.kind !== 'card' || String(grant.payload.trading_card_id) !== String(tradingCardId))) throw rewardError('Reward key does not match the card');
  if (grant?.status === 'completed') return ownedDeliveredCard(svc, userId, grant.user_card_id || '');
  if (!grant?.payload) {
    const card = await svc.TradingCard.get(String(tradingCardId || ''));
    if (!card || (card.status !== undefined && card.status !== 'live')) throw rewardError('Reward card is not available');
    const quantity = Number(options.quantity ?? 1);
    if (!Number.isSafeInteger(quantity) || quantity < 1) throw rewardError('Invalid reward quantity');
    const game = card.game_id ? await svc.Game.get(card.game_id) : null;
    grant = await ensureGrant(svc, userId, key, {
      kind: 'card', trading_card_id: card.id, quantity, stackable: Boolean(card.stackable),
      fields: {
        user_id: userId, trading_card_id: card.id,
        achievement_id: String(options.achievement_id || card.achievement_id || ''),
        quantity, source, equipped_to: 'none', acquired_at: now(),
        card_type: lower(card.card_type || 'collectible'), card_name: card.name || 'Unnamed Card',
        card_rarity: card.rarity === 'Mythical' ? 'Mythic' : (card.rarity || 'Common'),
        card_image: card.image_url || '', game_id: card.game_id || '', game_name: game?.title || '', genre: game?.genre || '',
        acquisition_method: source === 'purchase' ? 'purchased' : source === 'trade' ? 'traded' : 'unlocked',
        unlocked_date: now(), is_equipped: false,
        trade_status: options.tradable === false || card.tradable === false ? 'locked_in_trade' : 'available',
        animation_effect: card.animation_effect || null,
      },
    });
  }
  if (grant.payload.kind !== 'card' || String(grant.payload.trading_card_id) !== String(tradingCardId)) throw rewardError('Reward key does not match the card');
  const payload = grant.payload;
  // Check the delivery marker across owners: transferring the reward does not
  // authorize a replacement if the acknowledgement was interrupted.
  let delivered = await findKeyedRecord(svc.UserCard, { reward_grant_keys: { $in: [key] } });
  if (!delivered) {
    const existing = await svc.UserCard.filter({ user_id: userId, trading_card_id: payload.trading_card_id }, 'created_date', 20);
    const owned = existing.find((row: Row) => payload.stackable ? row.trade_status !== 'locked_in_trade' : Number(row.quantity ?? 1) > 0);
    if (owned) {
      const quantity = Number(owned.quantity ?? 1);
      if (!Number.isSafeInteger(quantity) || quantity < 0 || !Number.isSafeInteger(quantity + payload.quantity)) throw rewardError('Card quantity requires reconciliation');
      if (owned.quantity === undefined) {
        await conditionalUpdate(svc.UserCard, { id: owned.id, user_id: userId, quantity: { $exists: false } }, { $set: { quantity: 1 } });
      }
      const changed = await conditionalUpdate(svc.UserCard, {
        id: owned.id, user_id: userId, quantity,
        reward_grant_keys: { $nin: [key] },
        ...(payload.stackable ? { trade_status: { $ne: 'locked_in_trade' } } : {}),
      }, {
        $addToSet: { reward_grant_keys: key },
        ...(payload.stackable ? { $inc: { quantity: payload.quantity } } : {}),
      });
      delivered = await findKeyedRecord(svc.UserCard, { reward_grant_keys: { $in: [key] } });
      if (!changed && !delivered) throw rewardError('Card changed during delivery; retry the reward', 503);
    } else {
      delivered = await svc.UserCard.create({ ...payload.fields, reward_grant_keys: [key] });
    }
  }
  if (!delivered) throw rewardError('Reward card delivery is incomplete', 503);
  await svc.RewardGrant.update(grant.id, { status: 'completed', user_card_id: delivered.id, completed_at: now() });
  return String(delivered.user_id) === String(userId) ? delivered : null;
}

async function grantXp(svc: any, userId: string, key: string, xp: number) {
  if (!xp) return false;
  const record = await ensureKeyedRecord(svc.AvatarProgression, { user_id: userId });
  let credited = false, applied = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await svc.AvatarProgression.get(record.id);
    if ((current.reward_grant_keys || []).includes(key)) { applied = true; break; }
    const balance = Number(current.global_xp ?? 0);
    if (!Number.isSafeInteger(balance) || balance < 0 || !Number.isSafeInteger(balance + xp)) throw rewardError('Avatar XP requires reconciliation');
    credited = await conditionalUpdate(svc.AvatarProgression, {
      id: record.id, user_id: userId, reward_grant_keys: { $nin: [key] },
      global_xp: current.global_xp === undefined ? { $exists: false } : current.global_xp,
    }, { $inc: { global_xp: xp }, $addToSet: { reward_grant_keys: key } });
    if (credited) { applied = true; break; }
  }
  if (!applied) throw rewardError('Avatar XP changed during delivery; retry the reward', 503);
  const saved = await svc.AvatarProgression.get(record.id);
  await conditionalUpdate(svc.AvatarProgression, { id: record.id, user_id: userId }, {
    $max: { global_level: Math.min(50, Math.max(1, Math.floor(Number(saved.global_xp || 0) / 1000) + 1)) },
  });
  return credited;
}

export async function grantAchievement(svc: any, userId: string, achievementId: string, source = 'platform', meta: Row = {}) {
  const definition = await svc.Achievement.get(String(achievementId || ''));
  if (!definition) throw rewardError('Achievement not found', 404);
  const key = rewardKey('achievement', userId, String(definition.id));
  let grant = await findKeyedRecord(svc.RewardGrant, { user_id: userId, grant_key: key });
  const existing = await findKeyedRecord(svc.UserAchievement, { user_id: userId, achievement_id: definition.id });
  if (existing?.status === 'unlocked' && !grant) {
    // Old unlocks have no delivery evidence. Do not guess whether XP was already
    // paid or a missing card was legitimately transferred/consumed.
    const cards = await svc.UserCard.filter({ user_id: userId, achievement_id: definition.id }, 'created_date', 1);
    return { achievement: existing, definition, userCard: cards[0] || null, xp: 0, alreadyUnlocked: true, legacyDelivery: true };
  }
  if (grant?.status === 'completed') return {
    achievement: existing, definition, userCard: await ownedDeliveredCard(svc, userId, grant.user_card_id || ''),
    xp: 0, alreadyUnlocked: true,
  };
  if (!grant?.payload) {
    const xp = Math.round(Number(definition.points || 0) * (rarityMultiplier[lower(definition.rarity)] || 1));
    const quantity = Number(definition.reward?.quantity ?? 1);
    if (!Number.isSafeInteger(xp) || xp < 0 || !Number.isSafeInteger(quantity) || quantity < 1) throw rewardError('Achievement reward configuration is invalid');
    grant = await ensureGrant(svc, userId, key, {
      kind: 'achievement', achievement_id: definition.id, card_id: definition.card_id || '', quantity, xp, source,
      title: definition.title,
      progress: { ...(existing?.progress || {}), ...(meta.progress || {}), current: meta.current ?? existing?.progress?.current ?? 1, total: meta.total ?? existing?.progress?.total ?? 1 },
    });
  }
  const payload = grant.payload;
  if (payload.kind !== 'achievement' || String(payload.achievement_id) !== String(definition.id)) throw rewardError('Reward key does not match the achievement');
  const record = existing || await ensureKeyedRecord(svc.UserAchievement, { user_id: userId, achievement_id: definition.id });
  const userCard = payload.card_id ? await grantCard(svc, userId, payload.card_id, {
    source: 'achievement', achievement_id: definition.id, quantity: payload.quantity,
    grant_key: rewardKey('achievement-card', userId, String(definition.id)),
  }) : null;
  const credited = await grantXp(svc, userId, key, payload.xp);
  // Publish the unlock only after both economic effects have delivery evidence.
  const userAchievement = await svc.UserAchievement.update(record.id, {
    status: 'unlocked', source: payload.source, unlocked_at: existing?.unlocked_at || now(),
    progress: payload.progress, reward_grant_key: key,
  });
  const completed = await conditionalUpdate(svc.RewardGrant, { id: grant.id, status: { $ne: 'completed' } }, {
    $set: { status: 'completed', user_card_id: userCard?.id || '', completed_at: now() },
  });
  if (completed) {
    // Presentation failures must not turn a delivered economic reward into an error.
    try {
      const avatars = await svc.Avatar.filter({ user_id: userId }, '-updated_date', 1);
      if (avatars[0]) {
        const homes = await svc.AvatarHomeState.filter({ avatarId: avatars[0].id }, '-updated_date', 1);
        if (homes[0]) await svc.AvatarHomeState.update(homes[0].id, { activityLog: [
          ...(homes[0].activityLog || []).slice(-49),
          { type: 'achievement_unlocked', achievement_id: definition.id, card_id: payload.card_id, user_card_id: userCard?.id || '', title: payload.title, timestamp: now() },
        ] });
      }
      if (userCard) await svc.SocialNotification.create({
        recipient_id: userId, actor_id: userId, actor_name: 'Atom X Eve', type: 'message',
        title: `New card: ${userCard.card_name}`, body: `Unlocked from ${payload.title}.`,
        related_entity_id: userCard.id, status: 'unread', action_kind: 'none',
      });
    } catch (error) { console.warn('Reward delivered; presentation update failed', error); }
  }
  return { achievement: userAchievement, definition, userCard, xp: credited ? payload.xp : 0, alreadyUnlocked: false };
}
