import { createClientFromRequest } from 'npm:@base44/sdk@0.8.51';
import { grantEntitlement, ownsItem } from '../../shared/entitlements.ts';
import { grantCard } from '../../shared/rewardEngine.ts';
import { rewardKey } from '../../shared/rewardJournal.ts';

const json = (body: unknown, status = 200) => Response.json(body, { status });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const { game_id } = await req.json().catch(() => ({}));
    const gameId = String(game_id || '').trim();
    if (!gameId) return json({ error: 'game_id is required' }, 400);
    const svc = base44.asServiceRole.entities;
    const game = await svc.Game.get(gameId).catch(() => null);
    if (!game || game.status !== 'available') return json({ error: 'Game is unavailable' }, 404);
    if (typeof game.price !== 'number' || !Number.isFinite(game.price) || game.price < 0) return json({ error: 'Game price is unavailable; please try again later' }, 409);
    if (game.price > 0) return json({ error: 'Paid games must be purchased through checkout' }, 402);
    const alreadyOwned = await ownsItem(svc, user.id, 'game', game.id);
    if (game.starter_card_ids != null && (!Array.isArray(game.starter_card_ids) || game.starter_card_ids.some((id: any) => typeof id !== 'string' || !id))) return json({ error: 'Game starter rewards are unavailable' }, 409);
    const { entitlement } = await grantEntitlement(svc, user.id, 'game', game.id, { source: 'free', game_id: game.id, starter_card_ids: [...new Set<string>(game.starter_card_ids || [])] });
    if (entitlement.starter_reward_version !== 1) return json({ success: true, already_owned: true, entitlement, legacy_rewards_unverified: true });
    const starterCards = [], pendingCards = [];
    for (const cardId of entitlement.starter_card_ids || []) {
      try {
        const card = await grantCard(svc, user.id, cardId, { source: 'starter', grant_key: rewardKey('game-starter', user.id, game.id, cardId) });
        if (card) starterCards.push(card);
      } catch (error) {
        console.warn('Starter card grant pending', cardId, error);
        pendingCards.push(cardId);
      }
    }
    return json({ success: true, already_owned: alreadyOwned, entitlement, starter_cards: starterCards, rewards_pending: pendingCards.length > 0, pending_card_ids: pendingCards }, pendingCards.length ? 202 : 200);
  } catch (error) {
    console.error('claimFreeGame failed', error);
    return json({ error: error instanceof Error ? error.message : 'Unable to claim game' }, 500);
  }
});
