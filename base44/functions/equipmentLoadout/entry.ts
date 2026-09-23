import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

type Row = Record<string, any>;
const json = (body: unknown, status = 200) => Response.json(body, { status });
const SLOT_IDS = new Set([
  'helmet','armor','pants','boots','gloves','ring-left','ring-right','earring-left','earring-right',
  'weapon-1','weapon-2','weapon-3','aspect-1','aspect-2','aspect-3','genre-1','genre-2','genre-3','genre-4',
  'artifact-1','artifact-2','artifact-3','artifact-4','artifact-5',
]);
const cleanText = (value: any, max = 240) => String(value || '').slice(0, max);

function sanitizeItem(input: Row = {}) {
  const stats = input.stats && typeof input.stats === 'object' && !Array.isArray(input.stats)
    ? Object.fromEntries(Object.entries(input.stats).slice(0, 24).map(([key, value]) => [cleanText(key, 60), typeof value === 'number' ? value : cleanText(value, 80)]))
    : {};
  return {
    id: cleanText(input.id || input.itemId || input.user_card_id, 120),
    itemId: cleanText(input.itemId || input.id, 120),
    name: cleanText(input.name || input.title, 160),
    type: cleanText(input.type || input.itemType || input.inventoryCategory, 80),
    subtype: cleanText(input.subtype || input.slot || input.equip_slot, 80),
    rarity: cleanText(input.rarity || input.card_rarity, 60),
    icon_url: cleanText(input.icon_url || input.icon || input.image, 1200),
    model_url: cleanText(input.model_url || input.modelUrl, 1200),
    genre: cleanText(input.genre, 100),
    genreCompatibility: Array.isArray(input.genreCompatibility) ? input.genreCompatibility.slice(0, 12).map((value: any) => cleanText(value, 80)) : [],
    levelRequirement: Number(input.levelRequirement || input.level_requirement || 0) || 0,
    stats,
  };
}

async function ensureLoadout(svc: any, userId: string) {
  const rows = await svc.Loadout.filter({ user_id: userId, loadout_type: 'equipment' }, '-updated_date', 20);
  let active = rows.find((row: Row) => row.is_active) || rows[0] || null;
  if (!active) {
    active = await svc.Loadout.create({
      user_id: userId,
      name: 'Dashboard Equipment',
      description: 'Canonical Luna dashboard equipment used by AI Battle and the 3D avatar.',
      loadout_type: 'equipment',
      prefab_kind: 'dashboard_row',
      equipped_items: {},
      skill_slots: {},
      is_active: true,
      tags: ['Luna', 'Dashboard', 'Combat'],
    });
  } else if (!active.is_active) {
    active = await svc.Loadout.update(active.id, { is_active: true });
  }
  return active;
}

function serialize(loadout: Row | null) {
  return {
    id: loadout?.id || '',
    name: loadout?.name || 'Dashboard Equipment',
    equipped_items: loadout?.equipped_items || {},
    is_active: Boolean(loadout?.is_active),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const { action = 'getState', data = {} } = await req.json().catch(() => ({}));
    const svc = base44.asServiceRole.entities;
    const loadout = await ensureLoadout(svc, user.id);

    if (action === 'getState') return json({ success: true, loadout: serialize(loadout) });

    if (action === 'equip') {
      const slot = cleanText(data.slot, 80);
      if (!SLOT_IDS.has(slot)) return json({ error: 'Unknown equipment slot' }, 400);
      const item = sanitizeItem(data.item || {});
      if (!item.id || !item.name) return json({ error: 'A valid inventory item is required' }, 400);
      const next = { ...(loadout.equipped_items || {}), [slot]: item };
      const updated = await svc.Loadout.update(loadout.id, { equipped_items: next, is_active: true });
      return json({ success: true, loadout: serialize(updated) });
    }

    if (action === 'unequip') {
      const slot = cleanText(data.slot, 80);
      if (!SLOT_IDS.has(slot)) return json({ error: 'Unknown equipment slot' }, 400);
      const next = { ...(loadout.equipped_items || {}) };
      delete next[slot];
      const updated = await svc.Loadout.update(loadout.id, { equipped_items: next, is_active: true });
      return json({ success: true, loadout: serialize(updated) });
    }

    if (action === 'clear') {
      const updated = await svc.Loadout.update(loadout.id, { equipped_items: {}, is_active: true });
      return json({ success: true, loadout: serialize(updated) });
    }

    return json({ error: 'Unknown equipment action' }, 400);
  } catch (error) {
    console.error('equipmentLoadout failed', error);
    return json({ error: error instanceof Error ? error.message : 'Equipment request failed' }, 500);
  }
});
