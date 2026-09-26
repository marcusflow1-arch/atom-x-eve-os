import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { ownedItemIds } from '../../shared/entitlements.ts';

const json = (body: unknown, status = 200) => Response.json(body, { status });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const svc = base44.asServiceRole.entities;
    const [gameIds, dlcIds] = await Promise.all([ownedItemIds(svc, user.id, 'game'), ownedItemIds(svc, user.id, 'dlc')]);
    const games = [];
    for (const id of gameIds) {
      const game = await svc.Game.get(id).catch(() => null);
      if (game) games.push(game);
    }
    return json({ success: true, games, game_ids: gameIds, dlc_ids: dlcIds });
  } catch (error) {
    console.error('ownedGames failed', error);
    return json({ error: error instanceof Error ? error.message : 'Owned games unavailable' }, 500);
  }
});
