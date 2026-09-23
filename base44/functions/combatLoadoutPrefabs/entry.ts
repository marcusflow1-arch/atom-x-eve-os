import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

type Row = Record<string, any>;
const json = (body: unknown, status = 200) => Response.json(body, { status });
const clean = (v: any) => String(v || '').trim();
const now = () => new Date().toISOString();

function normalizeRows(rows: any[]) {
  return Array.from({ length: 3 }, (_, rowIndex) => {
    const row = rows?.[rowIndex];
    const slots = row?.skill_slots || row?.slots || {};
    return Array.from({ length: 4 }, (_, slotIndex) => clean(slots[String(slotIndex)] || row?.[slotIndex] || ''));
  });
}

async function skillRowsForUser(svc: any, userId: string) {
  const rows = await svc.Loadout.filter({ user_id: userId, loadout_type: 'skills' }, 'created_date', 50);
  return rows
    .filter((r: Row) => !r.prefab_kind || r.prefab_kind === 'dashboard_row')
    .sort((a: Row, b: Row) => Number(a.skill_set_order || 0) - Number(b.skill_set_order || 0))
    .slice(0, 3);
}

async function listState(svc: any, userId: string) {
  const rows = await svc.Loadout.filter({ user_id: userId }, '-updated_date', 200);
  return {
    skill_prefabs: rows.filter((r: Row) => r.loadout_type === 'skills' && r.prefab_kind === 'skill_prefab'),
    equipment_prefabs: rows.filter((r: Row) => r.loadout_type === 'equipment' && r.prefab_kind === 'equipment_prefab'),
  };
}

async function requireOwnedPrefab(svc: any, userId: string, id: string, kind: string) {
  const row = await svc.Loadout.get(id).catch(() => null);
  if (!row || String(row.user_id) !== String(userId) || row.prefab_kind !== kind) throw new Error('Prefab not found');
  return row;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const svc = base44.asServiceRole.entities;
    const body = await req.json().catch(() => ({}));
    const action = clean(body?.action || 'list');
    const data = body?.data || {};

    if (action === 'list') return json({ success: true, ...(await listState(svc, user.id)) });

    if (action === 'saveSkillPrefab') {
      const name = clean(data.name);
      if (!name) return json({ error: 'Prefab Name is required.' }, 400);
      const rows = await skillRowsForUser(svc, user.id);
      const skillRows = normalizeRows(rows);
      const row = await svc.Loadout.create({
        user_id: user.id,
        name,
        description: clean(data.description) || 'Three-row Skill Book combat prefab.',
        loadout_type: 'skills',
        prefab_kind: 'skill_prefab',
        prefab_id: 'skill-prefab-' + crypto.randomUUID(),
        equipped_items: {},
        skill_slots: Object.fromEntries(skillRows[0].map((id, i) => [String(i), id]).filter(([, id]) => id)),
        skill_rows: skillRows,
        linked_skill_prefab_id: '',
        is_active: false,
        tags: ['Atom X Eve', 'Skill Prefab'],
      });
      return json({ success: true, prefab: row, ...(await listState(svc, user.id)) });
    }

    if (action === 'loadSkillPrefab') {
      const prefab = await requireOwnedPrefab(svc, user.id, clean(data.prefab_id), 'skill_prefab');
      const rows = await skillRowsForUser(svc, user.id);
      const skillRows = normalizeRows(prefab.skill_rows);
      while (rows.length < 3) {
        const idx = rows.length;
        rows.push(await svc.Loadout.create({
          user_id: user.id,
          name: ['Genre I', 'Genre II', 'Genre III'][idx],
          description: 'Persistent Luna Skill Book dashboard row.',
          loadout_type: 'skills',
          prefab_kind: 'dashboard_row',
          equipped_items: {},
          skill_slots: {},
          skill_set_id: 'skill-set-' + (idx + 1),
          skill_set_name: ['Genre I', 'Genre II', 'Genre III'][idx],
          skill_set_genre: '',
          skill_set_order: idx,
          jawan_id: 'jawan-' + (idx + 1),
          jawan_name: 'Jawan ' + ['I', 'II', 'III'][idx],
          jawan_role: ['Balanced', 'Assault', 'Guard'][idx],
          is_active: idx === 0,
          tags: ['Luna', 'Skill Book', 'Dashboard Row'],
        }));
      }
      for (let i = 0; i < 3; i += 1) {
        await svc.Loadout.update(rows[i].id, {
          skill_slots: Object.fromEntries(skillRows[i].map((id, j) => [String(j), id]).filter(([, id]) => id)),
          skill_rows: [skillRows[i]],
          is_active: i === 0,
        });
      }
      return json({ success: true, loaded: true, prefab, ...(await listState(svc, user.id)) });
    }

    if (action === 'renameSkillPrefab' || action === 'renameEquipmentPrefab') {
      const kind = action === 'renameSkillPrefab' ? 'skill_prefab' : 'equipment_prefab';
      const prefab = await requireOwnedPrefab(svc, user.id, clean(data.prefab_id), kind);
      const name = clean(data.name);
      if (!name) return json({ error: 'Prefab Name is required.' }, 400);
      const updated = await svc.Loadout.update(prefab.id, { name, updated_date: now() });
      return json({ success: true, prefab: updated, ...(await listState(svc, user.id)) });
    }

    if (action === 'deleteSkillPrefab' || action === 'deleteEquipmentPrefab') {
      const kind = action === 'deleteSkillPrefab' ? 'skill_prefab' : 'equipment_prefab';
      const prefab = await requireOwnedPrefab(svc, user.id, clean(data.prefab_id), kind);
      await svc.Loadout.delete(prefab.id);
      return json({ success: true, deleted_id: prefab.id, ...(await listState(svc, user.id)) });
    }

    if (action === 'duplicateSkillPrefab' || action === 'duplicateEquipmentPrefab') {
      const kind = action === 'duplicateSkillPrefab' ? 'skill_prefab' : 'equipment_prefab';
      const prefab = await requireOwnedPrefab(svc, user.id, clean(data.prefab_id), kind);
      const copy = { ...prefab };
      delete copy.id; delete copy.created_date; delete copy.updated_date;
      copy.name = clean(data.name) || prefab.name + ' Copy';
      copy.prefab_id = kind + '-' + crypto.randomUUID();
      const created = await svc.Loadout.create(copy);
      return json({ success: true, prefab: created, ...(await listState(svc, user.id)) });
    }

    if (action === 'saveEquipmentPrefab') {
      const name = clean(data.name);
      if (!name) return json({ error: 'Prefab Name is required.' }, 400);
      const equipmentSlots = data.equipment_slots && typeof data.equipment_slots === 'object' ? data.equipment_slots : {};
      const linkedSkillPrefabId = clean(data.linked_skill_prefab_id);
      if (linkedSkillPrefabId) await requireOwnedPrefab(svc, user.id, linkedSkillPrefabId, 'skill_prefab');
      const created = await svc.Loadout.create({
        user_id: user.id,
        name,
        description: clean(data.description) || 'Equipment / Inventory combat prefab.',
        loadout_type: 'equipment',
        prefab_kind: 'equipment_prefab',
        prefab_id: 'equipment-prefab-' + crypto.randomUUID(),
        equipped_items: equipmentSlots,
        skill_slots: {},
        linked_skill_prefab_id: linkedSkillPrefabId,
        is_active: false,
        tags: ['Atom X Eve', 'Equipment Prefab'],
      });
      return json({ success: true, prefab: created, ...(await listState(svc, user.id)) });
    }

    if (action === 'linkEquipmentPrefab' || action === 'unlinkEquipmentPrefab') {
      const prefab = await requireOwnedPrefab(svc, user.id, clean(data.prefab_id), 'equipment_prefab');
      const linked = action === 'unlinkEquipmentPrefab' ? '' : clean(data.linked_skill_prefab_id);
      if (linked) await requireOwnedPrefab(svc, user.id, linked, 'skill_prefab');
      const updated = await svc.Loadout.update(prefab.id, { linked_skill_prefab_id: linked, updated_date: now() });
      return json({ success: true, prefab: updated, ...(await listState(svc, user.id)) });
    }

    return json({ error: 'Unknown prefab action' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Prefab request failed.' }, 500);
  }
});
