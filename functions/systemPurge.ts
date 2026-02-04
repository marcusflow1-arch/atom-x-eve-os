import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function normalizeTags(rec) {
  const tags = rec?.tags || rec?.labels || rec?.tag || [];
  if (Array.isArray(tags)) return tags.map((t) => String(t).toLowerCase());
  if (typeof tags === 'string') return tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  return [];
}

function shouldArchive(rec, entityName) {
  const json = JSON.stringify(rec || {});
  const reasons = [];
  if (json.includes('var ')) reasons.push('contains_var_keyword');
  if (json.toLowerCase().includes('oldui')) reasons.push('contains_oldui_marker');

  const tagSet = new Set(normalizeTags(rec));
  const okTags = ['current', 'current_build', 'current-build', 'v0.8.6', '0.8.6', 'latest'];
  const tagged = okTags.some((t) => tagSet.has(t));
  if (!tagged) reasons.push('not_tagged_for_current_build');

  return reasons;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date().toISOString();

    // Fetch all records
    const [scripts, layouts] = await Promise.all([
      base44.asServiceRole.entities.Model3DScript?.list?.().catch(() => []),
      base44.asServiceRole.entities.SceneLayout.list(),
    ]);

    const archived = [];

    async function processRecord(entityName, rec) {
      const reasons = shouldArchive(rec, entityName);
      if (reasons.length === 0) return null;

      // Create LegacyVault snapshot first
      const nameField = rec.name || rec.title || `${entityName} ${rec.id}`;
      const prefixedName = nameField.startsWith('[LEGACY_ARCHIVE]') ? nameField : `[LEGACY_ARCHIVE] ${nameField}`;

      await base44.asServiceRole.entities.LegacyVault.create({
        name: prefixedName,
        entity_type: entityName,
        original_id: rec.id,
        archived_at: now,
        reasons,
        data_snapshot: rec,
      });

      // Prepare update to original record: prefix name and deactivate if possible
      const updatePayload = {};
      if (rec.name && !rec.name.startsWith('[LEGACY_ARCHIVE]')) {
        updatePayload.name = prefixedName;
      }
      if (entityName === 'SceneLayout') {
        updatePayload.is_active = false;
      }
      // Try common active flags for scripts
      if (entityName === 'Model3DScript') {
        if (typeof rec.is_active === 'boolean') updatePayload.is_active = false;
        if (typeof rec.enabled === 'boolean') updatePayload.enabled = false;
        if (typeof rec.active === 'boolean') updatePayload.active = false;
      }

      try {
        await base44.asServiceRole.entities[entityName].update(rec.id, updatePayload);
      } catch (_) {
        // Best-effort; continue even if update fails
      }

      return { entity: entityName, id: rec.id, reasons };
    }

    const tasks = [];
    for (const s of scripts || []) tasks.push(processRecord('Model3DScript', s));
    for (const l of layouts || []) tasks.push(processRecord('SceneLayout', l));

    const results = (await Promise.all(tasks)).filter(Boolean);

    return Response.json({
      status: 'ok',
      archived_count: results.length,
      items: results,
      timestamp: now,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});