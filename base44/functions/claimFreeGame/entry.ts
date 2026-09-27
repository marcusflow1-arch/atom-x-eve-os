import { createClientFromRequest } from 'npm:@base44/sdk@0.8.51';
import { grantEntitlement } from '../../shared/entitlements.ts';
import { grantCard } from '../../shared/rewardEngine.ts';
import { rewardKey } from '../../shared/rewardJournal.ts';
import { catalogCents, starterIds } from '../../shared/checkoutFulfillment.ts';

const json = (body: unknown, status = 200) => Response.json(body, { status });
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const base44 = createClientFromRequest(req), user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const { game_id, action = 'claim' } = await req.json().catch(() => ({}));
    const gameId = typeof game_id === 'string' ? game_id.trim() : '';
    if (!gameId || !['claim', 'status'].includes(action)) return json({ error: 'A game_id and valid action are required' }, 400);
    const svc = base44.asServiceRole.entities;
    let entitlement = (await svc.Entitlement.filter({ user_id: user.id, item_type: 'game', item_id: gameId, revoked: false }, '-granted_at', 1))[0];
    if (action === 'status') {
      if (!entitlement || entitlement.source !== 'free') return json({ success: true, owned: Boolean(entitlement), rewards_pending: false, can_retry: false });
      if (entitlement.starter_reward_version !== 1) return json({ success: true, owned: true, legacy_rewards_unverified: true, can_retry: false });
      const pending = [];
      for (const cardId of entitlement.starter_card_ids || []) {
        const receipts = await svc.RewardGrant.filter({ user_id: user.id, grant_key: rewardKey('game-starter', user.id, gameId, cardId) }, 'created_date', 2);
        if (receipts.length !== 1 || receipts[0].status !== 'completed') pending.push(cardId);
      }
      return json({ success: true, owned: true, rewards_pending: pending.length > 0, can_retry: pending.length > 0, pending_card_ids: pending });
    }
    const alreadyOwned = Boolean(entitlement);
    if (entitlement && entitlement.source !== 'free') return json({ error: 'Use order history to review rewards for this purchase' }, 409);
    if (!entitlement) {
      const game = await svc.Game.get(gameId).catch(() => null);
      if (!game || game.status !== 'available' || (game.release_date && Date.parse(game.release_date) > Date.now())) return json({ error: 'Game is unavailable' }, 404);
      if (catalogCents(game) > 0) return json({ error: 'Paid games must be purchased through checkout' }, 402);
      ({ entitlement } = await grantEntitlement(svc, user.id, 'game', game.id, { source: 'free', game_id: game.id, starter_card_ids: starterIds(game) }));
    }
    // Existing free claims resume their saved rewards even after a price/status change.
    if (entitlement.starter_reward_version !== 1) return json({ success: true, owned: true, already_owned: true, entitlement, legacy_rewards_unverified: true, can_retry: false });
    const starterCards = [], pendingCards = [];
    for (const cardId of entitlement.starter_card_ids || []) {
      try {
        const card = await grantCard(svc, user.id, cardId, { source: 'starter', grant_key: rewardKey('game-starter', user.id, gameId, cardId) });
        if (card) starterCards.push(card);
      } catch (error) {
        console.warn('Starter card grant pending', cardId, error);
        pendingCards.push(cardId);
      }
    }
    return json({ success: true, owned: true, already_owned: alreadyOwned, entitlement, starter_cards: starterCards,
      rewards_pending: pendingCards.length > 0, can_retry: pendingCards.length > 0, pending_card_ids: pendingCards }, pendingCards.length ? 202 : 200);
  } catch (error) {
    console.error('claimFreeGame failed', error);
    return json({ error: error.message || 'Unable to claim game' }, error.status || 500);
  }
});
