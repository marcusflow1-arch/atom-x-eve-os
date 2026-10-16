// Server-rolled item upgrades (docs/game3d/SERVER_UPGRADES.md), shared by the itemUpgrade
// function, the Character Vault and the game.
//
// Reinforcement, over-enchant, refine and ultimate can fail, downgrade, fracture, seal or
// destroy an item. The server rolls them, keeps each item's result (Game3DItemUpgrade), and
// the Character Vault puts that result back into any save that says otherwise, so a reloaded
// browser save can't undo a bad roll and an edited one can't add levels.
import { resolveReinforcement, resolveOverEnchant } from './axeItemEnhancement.ts';
import { resolveRefine, resolveUltimate } from './axeItemAdvancement.ts';

type Rec = Record<string, any>;
type Save = Record<string, string>;

export const SERVER_ROLLED_UPGRADES = Object.freeze(['reinforcement', 'over_enchant', 'refine', 'ultimate']);

// an item's whole advancement entry, as the game's advancement store starts it
export const DEFAULT_ADVANCEMENT = Object.freeze({
  combine: { count: 0 },
  stage: { rank: 0, id: 'stage_0', label: 'Base' },
  refine: { level: 0 },
  ultimate: { level: 0, sealed: false },
});

// where each upgrade lives in a character save: the key, the field inside the item's entry
// (none: the entry itself), and the record an item has before its first upgrade
const PLACES: Record<string, { key: string; field: string | null; base: Rec }> = {
  reinforcement: { key: 'axe_reinforcement_v1', field: null, base: { percent: 0 } },
  over_enchant: { key: 'axe_over_enchant_v1', field: null, base: { level: 0, fractured: false } },
  refine: { key: 'axe_item_advancement_v2', field: 'refine', base: { level: 0 } },
  ultimate: { key: 'axe_item_advancement_v2', field: 'ultimate', base: { level: 0, sealed: false } },
};
const INVENTORY_KEY = 'axe_equipment_inventory_v2';

export const upgradeBase = (service: string): Rec => ({ ...(PLACES[service]?.base || {}) });

const parse = (raw: unknown): any => { try { return typeof raw === 'string' ? JSON.parse(raw) : null; } catch { return null; } };
const sorted = (rec: Rec): string => JSON.stringify(Object.keys(rec).sort().map((k) => [k, rec[k]]));
const same = (service: string, a: Rec | null | undefined, b: Rec | null | undefined) =>
  sorted({ ...PLACES[service].base, ...(a || {}) }) === sorted({ ...PLACES[service].base, ...(b || {}) });

export function inventoryItems(save: Save | null | undefined): Rec[] {
  const items = parse(save?.[INVENTORY_KEY])?.items;
  return Array.isArray(items) ? items : [];
}

export function findItem(save: Save | null | undefined, itemId: string): Rec | null {
  return inventoryItems(save).find((i) => i?.instanceId === itemId || (!i?.instanceId && i?.id === itemId)) || null;
}

// the item's record for one upgrade, or null when it has never had one
export function readUpgrade(save: Save | null | undefined, service: string, itemId: string): Rec | null {
  const place = PLACES[service];
  const entry = parse(save?.[place.key])?.[itemId];
  if (!entry) return null;
  return (place.field ? entry[place.field] : entry) || null;
}

function writeUpgrade(save: Save, service: string, itemId: string, record: Rec): Save {
  const place = PLACES[service];
  const map = parse(save[place.key]) || {};
  const entry = place.field ? { ...DEFAULT_ADVANCEMENT, ...(map[itemId] || {}), [place.field]: record } : record;
  return { ...save, [place.key]: JSON.stringify({ ...map, [itemId]: entry }) };
}

// the game's own rules, with the server's roll; `after` is the record the item keeps
export function rollUpgrade(service: string, before: Rec, { roll, protectedAttempt = false, item = null }: { roll: number; protectedAttempt?: boolean; item?: Rec | null }) {
  const opts = { roll, protectedAttempt };
  let result: Rec;
  if (service === 'reinforcement') result = resolveReinforcement(before, opts);
  else if (service === 'over_enchant') result = resolveOverEnchant(before, opts);
  else if (service === 'refine') result = resolveRefine(before, opts);
  else if (service === 'ultimate') result = resolveUltimate(item, before, opts);
  else return { ok: false, reason: 'not_a_server_rolled_upgrade' };
  // at the cap, or an item that can't take it: nothing rolled, nothing changes
  if (result.reason) return { ok: false, reason: result.reason, before, after: before };
  const after = result.destroyed ? { ...before, destroyed: true } : result.record;
  return { ok: !!result.ok, outcome: result.outcome, chance: result.chance ?? null, destroyed: !!result.destroyed, before, after };
}

export type LedgerRow = { item_id: string; service: string; record: Rec };

// The Vault's rule: for every item the save owns, each server-rolled upgrade is the server's.
// With a ledger row, the record must be that row's. Without one, it may not change from the
// previous server save (the first save is the starting point). An item the server destroyed
// leaves the inventory. Returns the save to keep and what was put back.
export function enforceUpgradeLedger(save: Save, previous: Save | null, ledger: LedgerRow[] = []) {
  const corrections: string[] = [];
  const owned = new Set(inventoryItems(save).map((i) => String(i?.instanceId || i?.id || '')).filter(Boolean));
  if (!owned.size) return { data: save, corrections };
  const byKey = new Map(ledger.filter((r) => r && SERVER_ROLLED_UPGRADES.includes(r.service)).map((r) => [`${r.item_id}::${r.service}`, r.record || {}]));
  let data = save;

  const destroyed = [...owned].filter((id) => byKey.get(`${id}::refine`)?.destroyed);
  if (destroyed.length) {
    const inv = parse(data[INVENTORY_KEY]) || {};
    const gone = new Set(destroyed);
    const items = (inv.items || []).filter((i: Rec) => !gone.has(String(i?.instanceId || i?.id || '')));
    const active = gone.has(String(inv.activeWeaponInstanceId || '')) ? null : inv.activeWeaponInstanceId ?? null;
    data = { ...data, [INVENTORY_KEY]: JSON.stringify({ ...inv, items, activeWeaponInstanceId: active }) };
    destroyed.forEach((id) => { owned.delete(id); corrections.push(`${id}: destroyed by refine`); });
  }

  for (const service of SERVER_ROLLED_UPGRADES) {
    // a record deleted from the save counts too (deleting a fracture or a seal is a change)
    const ids = [...owned].filter((id) => byKey.has(`${id}::${service}`) || readUpgrade(data, service, id) || readUpgrade(previous, service, id));
    for (const id of ids) {
      const current = readUpgrade(data, service, id);
      const allowed = byKey.has(`${id}::${service}`) ? byKey.get(`${id}::${service}`)! : previous ? readUpgrade(previous, service, id) : current;
      if (same(service, current, allowed)) continue;
      data = writeUpgrade(data, service, id, { ...PLACES[service].base, ...(allowed || {}) });
      corrections.push(`${id}: ${service} ${JSON.stringify(current)} -> ${JSON.stringify(allowed || PLACES[service].base)}`);
    }
  }
  return { data, corrections };
}

// a restore brings back its own item records; the ledger follows it, so the restored items
// are not put back to what the ledger held before
export function ledgerRecordsFor(save: Save, rows: LedgerRow[]) {
  return rows.map((r) => ({ row: r, record: { ...PLACES[r.service]?.base, ...(readUpgrade(save, r.service, r.item_id) || {}) } }));
}
