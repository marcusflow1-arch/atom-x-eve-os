import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { SERVER_ROLLED_UPGRADES, findItem, pickCostUnits, readUpgrade, rollUpgrade, spentCounts, upgradeBase, upgradeCost } from '../../shared/itemUpgradeLedger.ts';

// The server rolls Game 3D's risky item upgrades (docs/game3d/SERVER_UPGRADES.md):
// reinforcement, over-enchant, refine and ultimate. It rolls with the game's own rules
// (base44/shared/axeItemEnhancement.ts, axeItemAdvancement.ts) on the record it holds for
// the item, keeps the result (Game3DItemUpgrade), and the Character Vault puts that result
// back into any save that says otherwise. Each attempt is paid on the server: the cost is
// taken, unit by unit, from the server's copy of the save, and those units stay spent.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

export const UPGRADE_RULES = Object.freeze({
  characterIdPattern: /^[A-Za-z0-9_-]{1,128}$/,
  itemIdPattern: /^[\x21-\x7e]{1,200}$/,
  localOnlyCharacters: Object.freeze(['__default__', '__anon__']),
  minIntervalMs: 250, // per item and kind; the game's own button is slower
});

// a uniform roll in [0, 1) that the browser can't choose or predict
const serverRoll = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const payload = await req.json().catch(() => ({}));
    const action = String(payload?.action || '');
    const data = payload?.data || {};
    const svc = base44.asServiceRole.entities;
    // an admin may look at another account's character (support); everyone else only their own
    const ownerId = String(user.role === 'admin' && data.ownerId ? data.ownerId : user.id);
    const characterId = String(data.characterId || '');
    if (!UPGRADE_RULES.characterIdPattern.test(characterId) || UPGRADE_RULES.localOnlyCharacters.includes(characterId)) {
      return json({ error: 'That character is kept on this device only', code: 'local_only' }, 400);
    }

    if (action === 'list') {
      const rows = await svc.Game3DItemUpgrade.filter({ owner_id: ownerId, character_id: characterId }, '-created_date', 1000);
      return json({ success: true, upgrades: (rows || []).map((r: any) => ({ item_id: r.item_id, service: r.service, record: r.record, attempts: r.attempts || 0, last_outcome: r.last_outcome || null, rolled_at: r.rolled_at || null })) });
    }

    if (action === 'roll') {
      const serviceId = String(data.serviceId || '');
      const itemId = String(data.itemId || '');
      const transactionId = data.transactionId ? String(data.transactionId).slice(0, 200) : '';
      if (!SERVER_ROLLED_UPGRADES.includes(serviceId)) return json({ error: 'That upgrade is not rolled by the server', code: 'invalid' }, 400);
      if (!UPGRADE_RULES.itemIdPattern.test(itemId)) return json({ error: 'Unknown item', code: 'invalid' }, 400);

      const [saves, rows] = await Promise.all([
        svc.Game3DCharacterSave.filter({ owner_id: ownerId, character_id: characterId }, '-created_date', 1),
        svc.Game3DItemUpgrade.filter({ owner_id: ownerId, character_id: characterId }, '-created_date', 1000),
      ]);
      const save = (saves || [])[0];
      const rowOf = (service: string) => (rows || []).find((r: any) => r.item_id === itemId && r.service === service) || null;
      const row = rowOf(serviceId);
      // the same attempt again (a lost answer): the same result, never a second roll
      if (row && transactionId && row.last_transaction_id === transactionId && row.last_result) {
        return json({ success: true, result: row.last_result, repeated: true });
      }
      // a refine can destroy the item; the server's copy of the save may not know it yet
      if (rowOf('refine')?.record?.destroyed) return json({ error: 'This item was destroyed', code: 'item_destroyed' }, 409);
      // the server rolls on what it knows: the character's save must be on the server, item included
      const item = save ? findItem(save.data, itemId) : null;
      if (!item) return json({ error: 'Saving your character first; try again in a moment', code: 'not_synced' }, 409);
      const now = Date.now();
      if (row?.rolled_at && now - Date.parse(row.rolled_at) < UPGRADE_RULES.minIntervalMs) {
        return json({ error: 'Too fast', code: 'too_fast' }, 429);
      }

      const before = row ? { ...upgradeBase(serviceId), ...(row.record || {}) } : { ...upgradeBase(serviceId), ...(readUpgrade(save.data, serviceId, itemId) || {}) };
      const protectedAttempt = data.protectedAttempt === true;
      const roll = serverRoll();
      const rolled = rollUpgrade(serviceId, before, { roll, protectedAttempt, item });
      // at the cap, or an item that can't take this upgrade: nothing was rolled
      if (rolled.reason) return json({ success: true, result: { ok: false, reason: rolled.reason, serviceId, itemId } });
      // paid from the server's copy of the save; without the materials, nothing is rolled
      const cost = upgradeCost(serviceId, before, { protectedAttempt });
      const paid = pickCostUnits(save.data, cost, spentCounts(rows || []));
      if (!paid.ok) return json({ success: true, result: { ok: false, reason: 'insufficient_materials', cost, missing: paid.missing, serviceId, itemId } });

      const result = { ok: rolled.ok, outcome: rolled.outcome, chance: rolled.chance, destroyed: rolled.destroyed, roll, before: rolled.before, after: rolled.after, cost, spent: paid.dropIds, serviceId, itemId };
      const iso = new Date(now).toISOString();
      const patch = {
        record: rolled.after, attempts: Number(row?.attempts || 0) + 1, last_outcome: String(rolled.outcome || ''), last_roll: roll,
        last_transaction_id: transactionId, last_result: result, rolled_at: iso,
        spent: [...(row?.spent || []), ...paid.dropIds],
      };
      if (row) await svc.Game3DItemUpgrade.update(row.id, patch);
      else await svc.Game3DItemUpgrade.create({ owner_id: ownerId, character_id: characterId, item_id: itemId, service: serviceId, ...patch });
      return json({ success: true, result });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    console.error('[itemUpgrade]', error);
    return json({ error: (error as Error)?.message || 'Upgrade failed' }, 500);
  }
});
