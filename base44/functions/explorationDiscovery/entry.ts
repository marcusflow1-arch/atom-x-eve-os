import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { DISCOVERY_DROP_PREFIX, DISCOVERY_RULES, claimFromRow, discoveryAvailability, discoveryUnit, getDiscovery, nextDiscoveryClaim, rollDiscoveryRewards, withinReach } from '../../shared/explorationDiscoveries.ts';

// The server decides what a Game 3D hero finds out in the land (docs/game3d/EXPLORATION_DISCOVERIES.md).
// A claim is checked against the server's copy of the character and the discovery ledger
// (Game3DDiscoveryClaim): a one-time find is claimed once, a respawning node waits out its
// cooldown. The reward is rolled here with the discovery's own table, recorded, and returned;
// the Character Vault delivers it into the next save and keeps every save equal to the ledger.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

export const CLAIM_RULES = Object.freeze({
  characterIdPattern: /^[A-Za-z0-9_-]{1,128}$/,
  localOnlyCharacters: Object.freeze(['__default__', '__anon__']),
});

// a uniform roll in [0, 1) that the browser can't choose or predict
const serverRoll = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
const levelOf = (save: any) => {
  try { return Number(JSON.parse(save?.wwm_player_progression_v1 || 'null')?.level) || 1; } catch { return 1; }
};
// the first row of a discovery wins when two first claims landed at once
const earliest = (rows: any[]) => [...rows].sort((a, b) => String(a.created_date || '').localeCompare(String(b.created_date || '')) || String(a.id).localeCompare(String(b.id)))[0] || null;

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
    if (!CLAIM_RULES.characterIdPattern.test(characterId) || CLAIM_RULES.localOnlyCharacters.includes(characterId)) {
      return json({ error: 'That character is kept on this device only', code: 'local_only' }, 400);
    }
    const rowsOf = () => svc.Game3DDiscoveryClaim.filter({ owner_id: ownerId, character_id: characterId }, '-created_date', 1000);

    if (action === 'list') {
      const rows = await rowsOf();
      return json({ success: true, claims: (rows || []).map((r: any) => ({ discovery_id: r.discovery_id, claim: claimFromRow(r), skills: r.skills || [] })) });
    }

    if (action === 'claim') {
      const def = getDiscovery(String(data.discoveryId || ''));
      if (!def) return json({ error: 'Unknown discovery', code: 'invalid' }, 400);
      const transactionId = data.transactionId ? String(data.transactionId).slice(0, 200) : '';
      const [saves, rows] = await Promise.all([
        svc.Game3DCharacterSave.filter({ owner_id: ownerId, character_id: characterId }, '-created_date', 1),
        rowsOf(),
      ]);
      const row = earliest((rows || []).filter((r: any) => r.discovery_id === def.id));
      // the same claim again (a lost answer): the same result, never a second reward
      if (row && transactionId && row.last_transaction_id === transactionId && row.last_result) {
        return json({ success: true, result: row.last_result, repeated: true });
      }
      const save = (saves || [])[0];
      if (!save) return json({ error: 'Saving your character first; try again in a moment', code: 'not_synced' }, 409);
      if (!withinReach(def, data.position)) return json({ error: 'Too far away to reach it', code: 'too_far' }, 409);
      if (def.minLevel && levelOf(save.data) < def.minLevel) {
        return json({ success: true, result: { ok: false, reason: 'level_too_low', minLevel: def.minLevel, discoveryId: def.id } });
      }
      const claim = row ? claimFromRow(row) : null;
      const now = Date.now();
      const open = discoveryAvailability(def, claim, now);
      if (!open.available) return json({ success: true, result: { ok: false, reason: open.reason, nextAvailableAt: open.nextAvailableAt ?? null, claim, discoveryId: def.id } });
      // one claim at a time per character; a gather takes longer than this
      const latest = Math.max(0, ...(rows || []).map((r: any) => Date.parse(r.last_claimed_at) || 0));
      if (now - latest < DISCOVERY_RULES.minClaimIntervalMs) return json({ error: 'Too fast', code: 'too_fast' }, 429);

      const rolled = rollDiscoveryRewards(def, serverRoll);
      const next = nextDiscoveryClaim(def, claim, now);
      const tag = `${now.toString(36)}${Math.floor(serverRoll() * 2 ** 32).toString(36)}`;
      let n = 0;
      const units = rolled.materials.flatMap((m) => Array.from({ length: m.count }, () =>
        discoveryUnit(m.id, `${DISCOVERY_DROP_PREFIX}${def.id}_${next.count}_${n++}_${tag}`, now)));
      const result = { ok: true, discoveryId: def.id, kind: def.kind, units, skills: rolled.skills, claim: next };
      const patch = {
        kind: def.kind, claims: next.count, first_claimed_at: next.firstClaimedAt, last_claimed_at: next.lastClaimedAt,
        ...(next.nextAvailableAt ? { next_available_at: next.nextAvailableAt } : {}),
        skills: [...new Set([...(row?.skills || []), ...rolled.skills])],
        pending: [...(row?.pending || []), ...units],
        granted: [...(row?.granted || []), ...units].slice(-DISCOVERY_RULES.grantHistory),
        granted_count: Number(row?.granted_count || 0) + units.length,
        last_transaction_id: transactionId, last_result: result,
      };
      if (row) {
        await svc.Game3DDiscoveryClaim.update(row.id, patch);
      } else {
        const created = await svc.Game3DDiscoveryClaim.create({ owner_id: ownerId, character_id: characterId, discovery_id: def.id, ...patch });
        // Base44 has no transactions: two first claims at once leave two rows. The earliest keeps
        // the find; this one is withdrawn and answers as a claim that came second.
        const all = await svc.Game3DDiscoveryClaim.filter({ owner_id: ownerId, character_id: characterId, discovery_id: def.id }, '-created_date', 10);
        const first = earliest(all || []);
        if (first && first.id !== created.id) {
          await svc.Game3DDiscoveryClaim.delete(created.id);
          const kept = claimFromRow(first);
          const again = discoveryAvailability(def, kept, now);
          return json({ success: true, result: { ok: false, reason: again.available ? 'respawning' : again.reason, nextAvailableAt: kept.nextAvailableAt, claim: kept, discoveryId: def.id } });
        }
      }
      return json({ success: true, result });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    console.error('[explorationDiscovery]', error);
    return json({ error: (error as Error)?.message || 'Discovery failed' }, 500);
  }
});
