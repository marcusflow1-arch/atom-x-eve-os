import { createClientFromRequest } from 'npm:@base44/sdk@0.8.51';
import { grantEntitlement, ownsItem } from '../../shared/entitlements.ts';
import { grantCard } from '../../shared/rewardEngine.ts';

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
    const price = Number(game.price || 0);
    if (price > 0) return json({ error: 'Paid games must be purchased through checkout' }, 402);
    if (await ownsItem(svc, user.id, 'game', game.id)) return json({ success: true, already_owned: true });

    const { entitlement } = await grantEntitlement(svc, user.id, 'game', game.id, { source: 'free', game_id: game.id });
    const starterCards = [];
    for (const cardId of game.starter_card_ids || []) {
      try { starterCards.push(await grantCard(svc, user.id, cardId, { source: 'starter' })); } catch (error) { console.warn('Starter card grant failed', cardId, error); }
    }
    return json({ success: true, entitlement, starter_cards: starterCards });
  } catch (error) {
    console.error('claimFreeGame failed', error);
    return json({ error: error instanceof Error ? error.message : 'Unable to claim game' }, 500);
  }
});
