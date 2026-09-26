type AnyObj = Record<string, any>;

const now = () => new Date().toISOString();
const lower = (value: any) => String(value || '').trim().toLowerCase();
const rarityMultiplier: Record<string, number> = { common: 1, uncommon: 1.15, rare: 1.35, epic: 1.7, legendary: 2.2, mythical: 3, mythic: 3, unique: 4, limitless: 6 };

export async function grantCard(svc: any, userId: string, tradingCardId: string, options: AnyObj = {}) {
  const card = await svc.TradingCard.get(String(tradingCardId || '')).catch(() => null);
  if (!card || card.status === 'retired') throw new Error('Reward card not found');
  const source = String(options.source || 'achievement');
  const quantity = Math.max(1, Math.floor(Number(options.quantity || 1)));
  const achievementId = String(options.achievement_id || card.achievement_id || '');
  const existing = await svc.UserCard.filter({ user_id: userId, trading_card_id: card.id }, '-created_date', 20);
  const owned = achievementId ? existing.find((row: AnyObj) => String(row.achievement_id || '') === achievementId) || existing[0] : existing[0];
  const stackable = Boolean(card.stackable);
  if (owned) {
    if (stackable) return svc.UserCard.update(owned.id, { quantity: Math.max(1, Number(owned.quantity || 1)) + quantity, source: owned.source || source });
    return owned;
  }
  let game: AnyObj | null = null;
  if (card.game_id) game = await svc.Game.get(card.game_id).catch(() => null);
  const canonicalType = lower(card.card_type || 'collectible');
  return svc.UserCard.create({
    user_id: userId,
    trading_card_id: card.id,
    achievement_id: achievementId,
    quantity,
    source,
    equipped_to: 'none',
    acquired_at: now(),
    card_type: canonicalType,
    card_name: card.name || 'Unnamed Card',
    card_rarity: card.rarity === 'Mythical' ? 'Mythic' : (card.rarity || 'Common'),
    card_image: card.image_url || '',
    game_id: card.game_id || '',
    game_name: game?.title || '',
    genre: game?.genre || '',
    acquisition_method: source === 'purchase' ? 'purchased' : source === 'trade' ? 'traded' : 'unlocked',
    unlocked_date: now(),
    is_equipped: false,
    trade_status: options.tradable === false || card.tradable === false ? 'locked_in_trade' : 'available',
    animation_effect: card.animation_effect || null,
  });
}

export async function grantAchievement(svc: any, userId: string, achievementId: string, source = 'platform', meta: AnyObj = {}) {
  const achievement = await svc.Achievement.get(String(achievementId || '')).catch(() => null);
  if (!achievement) throw new Error('Achievement not found');
  const existingRows = await svc.UserAchievement.filter({ user_id: userId, achievement_id: achievement.id }, '-created_date', 10);
  const existing = existingRows[0] || null;
  const alreadyUnlocked = existing?.status === 'unlocked';
  if (alreadyUnlocked) {
    const existingCard = achievement.card_id ? (await svc.UserCard.filter({ user_id: userId, achievement_id: achievement.id }, '-created_date', 1))[0] || null : null;
    return { achievement, userCard: existingCard, xp: 0, alreadyUnlocked: true };
  }

  const progress = { ...(existing?.progress || {}), ...(meta.progress || {}), current: meta.current ?? existing?.progress?.current ?? 1, total: meta.total ?? existing?.progress?.total ?? 1 };
  let userAchievement: AnyObj;
  if (existing) userAchievement = await svc.UserAchievement.update(existing.id, { status: 'unlocked', source, unlocked_at: now(), progress });
  else userAchievement = await svc.UserAchievement.create({ user_id: userId, achievement_id: achievement.id, status: 'unlocked', source, unlocked_at: now(), progress });

  let userCard: AnyObj | null = null;
  if (achievement.card_id) {
    userCard = await grantCard(svc, userId, achievement.card_id, { source: 'achievement', achievement_id: achievement.id, quantity: achievement.reward?.quantity || 1 });
  }

  const xp = Math.max(0, Math.round(Number(achievement.points || 0) * (rarityMultiplier[lower(achievement.rarity)] || 1)));
  if (xp > 0) {
    const rows = await svc.AvatarProgression.filter({ user_id: userId }, '-updated_date', 1);
    const record = rows[0] || null;
    const nextXp = Number(record?.global_xp || 0) + xp;
    const nextLevel = Math.max(1, Math.floor(nextXp / 1000) + 1);
    if (record) await svc.AvatarProgression.update(record.id, { global_xp: nextXp, global_level: nextLevel });
    else await svc.AvatarProgression.create({ user_id: userId, global_xp: nextXp, global_level: nextLevel, available_stat_points: 0, stats: { hp: 100, strength: 10, intelligence: 10, will: 10, tenacity: 10 }, genres: [] });
  }

  const avatars = await svc.Avatar.filter({ user_id: userId }, '-updated_date', 1).catch(() => []);
  const avatar = avatars[0];
  if (avatar) {
    const homes = await svc.AvatarHomeState.filter({ avatarId: avatar.id }, '-updated_date', 1).catch(() => []);
    if (homes[0]) {
      const activity = { type: 'achievement_unlocked', achievement_id: achievement.id, card_id: achievement.card_id || '', user_card_id: userCard?.id || '', title: achievement.title, timestamp: now() };
      await svc.AvatarHomeState.update(homes[0].id, { activityLog: [...(homes[0].activityLog || []).slice(-49), activity] });
    }
  }

  if (userCard) {
    await svc.SocialNotification.create({ recipient_id: userId, actor_id: userId, actor_name: 'Atom X Eve', type: 'message', title: `New card: ${userCard.card_name}`, body: `Unlocked from ${achievement.title}.`, related_entity_id: userCard.id, status: 'unread', action_kind: 'none' }).catch(() => null);
  }
  return { achievement: userAchievement, definition: achievement, userCard, xp, alreadyUnlocked: false };
}
