import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { grantEntitlement } from '../../shared/entitlements.ts';

const json = (body: unknown, status = 200) => Response.json(body, { status });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return json({ error: 'Admin access required' }, 403);
    const body = await req.json().catch(() => ({}));
    const apply = Boolean(body.apply);
    const svc = base44.asServiceRole.entities;
    const users = await svc.User.list('-created_date', 5000);
    const planned:any[] = [];
    for (const row of users) {
      for (const gameId of [...new Set((row.purchased_items || []).map(String).filter(Boolean))]) planned.push({ user_id: row.id, item_type: 'game', item_id: gameId, game_id: gameId });
      for (const dlcId of [...new Set((row.purchased_dlc || []).map(String).filter(Boolean))]) {
        const dlc = await svc.DLC.get(dlcId).catch(() => null);
        planned.push({ user_id: row.id, item_type: 'dlc', item_id: dlcId, game_id: dlc?.game_id || '' });
      }
    }
    if (!apply) return json({ success: true, dry_run: true, planned_count: planned.length, preview: planned.slice(0, 100) });
    let created = 0;
    for (const item of planned) {
      const result = await grantEntitlement(svc, item.user_id, item.item_type, item.item_id, { source: 'migration', game_id: item.game_id });
      if (result.created) created += 1;
    }
    return json({ success: true, dry_run: false, planned_count: planned.length, created });
  } catch (error) {
    console.error('migrateEntitlements failed', error);
    return json({ error: error instanceof Error ? error.message : 'Entitlement migration failed' }, 500);
  }
});
