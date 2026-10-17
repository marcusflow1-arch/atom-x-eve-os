import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { checkCharacterSave, fingerprintCharacterSave } from '../../shared/characterSaveRules.ts';
import { enforceUpgradeLedger, ledgerRecordsFor } from '../../shared/itemUpgradeLedger.ts';
import { enforceDiscoveryLedger, pendingAfterRestore } from '../../shared/explorationDiscoveries.ts';

// The server's copy of every Game 3D character (docs/game3d/CHARACTER_VAULT.md).
// The browser still plays from its own storage; this keeps a checked copy, so a character
// follows its player to another device, survives cleared browser data, and can be rolled
// back. Saves are written only here: each one is checked (characterSaveRules), must build
// on the revision it names, and is backed up on first upload, at most hourly after that,
// and before any restore.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

export const VAULT_RULES = Object.freeze({
  backupEveryMs: 60 * 60 * 1000,
  maxRosterEntryBytes: 8_000,
  characterIdPattern: /^[A-Za-z0-9_-]{1,128}$/,
  localOnlyCharacters: Object.freeze(['__default__', '__anon__']),
});
const ROSTER_FIELDS = ['id', 'name', 'appearance', 'appearance_version', 'model_url', 'gender', 'female_model_variant', 'faction_id', 'factionId',
  'starting_weapon_style_id', 'startingWeaponStyleId', 'weapon_role', 'style_preset', 'skin_tone', 'eye_color', 'hair_color', 'height_scale',
  'body_proportions', 'face_scan_generated', 'tripo_model_id', 'createdAt'];

const levelOf = (save: any) => {
  try { return Number(JSON.parse(save?.wwm_player_progression_v1 || 'null')?.level) || 1; } catch { return 1; }
};

const meta = (row: any) => row && ({
  id: row.id, character_id: row.character_id, revision: row.revision, fingerprint: row.fingerprint,
  byte_size: row.byte_size, saved_at: row.saved_at, flags: row.flags || [], roster_entry: row.roster_entry || null,
});

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
    const isAdmin = user.role === 'admin';
    // an admin may act on another account's character (support, rollback); everyone else only on their own
    const ownerId = String(isAdmin && data.ownerId ? data.ownerId : user.id);
    const characterId = String(data.characterId || '');
    const needsCharacter = action !== 'list';
    if (needsCharacter && (!VAULT_RULES.characterIdPattern.test(characterId) || VAULT_RULES.localOnlyCharacters.includes(characterId))) {
      return json({ error: 'That character is kept on this device only', code: 'local_only' }, 400);
    }
    const now = Date.now();
    const iso = new Date(now).toISOString();

    const savesOf = async (character: string) => svc.Game3DCharacterSave.filter({ owner_id: ownerId, character_id: character }, '-created_date', 2);
    const current = async () => {
      const rows = await savesOf(characterId);
      // two devices created a first save at once: stop, keep both for a person to sort out
      if ((rows || []).length > 1) return { duplicate: true };
      return { row: (rows || [])[0] || null };
    };
    const backup = (row: any, reason: string) => svc.Game3DCharacterSaveBackup.create({
      owner_id: ownerId, character_id: row.character_id, save_revision: row.revision, data: row.data,
      fingerprint: row.fingerprint, byte_size: row.byte_size, roster_entry: row.roster_entry || null, reason,
    });
    const rosterEntry = () => {
      const raw = data.rosterEntry && typeof data.rosterEntry === 'object' ? data.rosterEntry : null;
      if (!raw) return null;
      const entry = Object.fromEntries(ROSTER_FIELDS.filter((k) => raw[k] !== undefined).map((k) => [k, raw[k]]));
      entry.id = characterId;
      return JSON.stringify(entry).length <= VAULT_RULES.maxRosterEntryBytes ? entry : { id: characterId, name: String(raw.name || 'Character').slice(0, 40) };
    };

    if (action === 'list') {
      const rows = await svc.Game3DCharacterSave.filter({ owner_id: ownerId }, '-created_date', 100);
      return json({ success: true, saves: (rows || []).map(meta) });
    }

    if (action === 'get') {
      const { row, duplicate } = await current();
      if (duplicate) return json({ error: 'This character has two first saves; support needs to choose one', code: 'duplicate_saves' }, 409);
      return json({ success: true, save: row ? { ...meta(row), data: row.data } : null });
    }

    if (action === 'put') {
      const { row, duplicate } = await current();
      if (duplicate) return json({ error: 'This character has two first saves; support needs to choose one', code: 'duplicate_saves' }, 409);
      const save = data.data;
      const minutes = row?.saved_at ? (now - Date.parse(row.saved_at)) / 60000 : Infinity;
      const check = checkCharacterSave(save, row?.data || null, { minutesSincePrevious: minutes });
      if (!check.ok) return json({ error: 'The server did not accept this save', code: 'rejected', errors: check.errors }, 422);
      // rolled upgrades are the server's (itemUpgrade): a save that says otherwise is put right,
      // and the device is sent the save as kept
      const [ledger, finds] = await Promise.all([
        svc.Game3DItemUpgrade.filter({ owner_id: ownerId, character_id: characterId }, '-created_date', 1000),
        svc.Game3DDiscoveryClaim.filter({ owner_id: ownerId, character_id: characterId }, '-created_date', 1000),
      ]);
      const enforced = enforceUpgradeLedger(save, row?.data || null, ledger || []);
      // discoveries are the server's too (explorationDiscovery): claims, elite skills and the
      // units it granted; granted units this save doesn't hold yet are delivered into it
      const found = enforceDiscoveryLedger(enforced.data, row?.data || null, finds || []);
      const kept = found.data;
      const corrections = [...enforced.corrections, ...found.corrections];
      const corrected = corrections.length ? { corrected: true, data: kept, corrections } : {};
      const checkFlags = [...check.flags,
        ...(enforced.corrections.length ? [`upgrade_corrected: ${enforced.corrections.length} item record(s)`] : []),
        ...(found.flagged ? [`discovery_corrected: ${found.flagged} unit(s) or skill(s) the server did not grant`] : [])];
      // once a save holds a row's granted units they are no longer pending (re-read first: a
      // claim may have added more since)
      const delivered = async () => {
        for (const id of found.delivered) {
          const fresh = await svc.Game3DDiscoveryClaim.get(id).catch(() => null);
          if (!fresh) continue;
          const pending = (fresh.pending || []).filter((u: any) => !found.deliveredDropIds.includes(u.dropId));
          await svc.Game3DDiscoveryClaim.update(id, { pending, delivered_at: iso });
        }
      };
      const fingerprint = fingerprintCharacterSave(kept);
      const expected = Number(data.expectedRevision);

      if (!row) {
        if (expected !== 0) return json({ error: 'This character has no saved copy yet', code: 'conflict', save: null }, 409);
        const created = await svc.Game3DCharacterSave.create({
          owner_id: ownerId, character_id: characterId, revision: 1, data: kept, fingerprint, byte_size: check.bytes,
          roster_entry: rosterEntry(), flags: checkFlags, flag_count: checkFlags.length, saved_at: iso, last_backup_at: iso,
        });
        // the browser's save as it was before the server ever held it: the migration's rollback point
        await backup({ ...created, character_id: characterId, revision: 1, data: save, fingerprint: fingerprintCharacterSave(save), byte_size: check.bytes }, 'first_upload');
        // two first uploads at once leave two rows; report it rather than pick one
        const after = await savesOf(characterId);
        if ((after || []).length > 1) return json({ error: 'This character has two first saves; support needs to choose one', code: 'duplicate_saves' }, 409);
        await delivered();
        return json({ success: true, save: meta(created), flags: checkFlags, ...corrected });
      }
      // the same save again (a lost acknowledgement, a retry): nothing to change
      if (row.fingerprint === fingerprint) {
        // put right to exactly the save already kept: nothing new to store, but the attempt is recorded
        if (corrections.length) await svc.Game3DCharacterSave.update(row.id, { flags: checkFlags, flag_count: Number(row.flag_count || 0) + 1 });
        await delivered();
        return json({ success: true, save: meta(row), unchanged: true, ...corrected });
      }
      if (expected !== row.revision) {
        return json({ error: 'This character was saved from somewhere else', code: 'conflict', save: { ...meta(row), data: row.data } }, 409);
      }
      // the player chose this device's save over the server's: keep the one being replaced
      const overwriting = data.overwrite === true;
      // play never lowers a level; a save that does (a device that lost its data and saved its
      // fresh start) is accepted but the higher save is always kept first, whatever the hour
      const levelDrop = levelOf(kept) < levelOf(row.data);
      const flags = levelDrop ? [...checkFlags, `level_drop: ${levelOf(row.data)} -> ${levelOf(kept)}`] : checkFlags;
      const dueBackup = overwriting || levelDrop || !row.last_backup_at || now - Date.parse(row.last_backup_at) >= VAULT_RULES.backupEveryMs;
      if (dueBackup) await backup(row, overwriting ? 'before_overwrite' : levelDrop ? 'before_level_drop' : 'hourly');
      const patch = {
        revision: row.revision + 1, data: kept, fingerprint, byte_size: check.bytes, roster_entry: rosterEntry() || row.roster_entry || null,
        flags, flag_count: Number(row.flag_count || 0) + flags.length, saved_at: iso,
        ...(dueBackup ? { last_backup_at: iso } : {}),
      };
      const updated = { ...row, ...patch, ...((await svc.Game3DCharacterSave.update(row.id, patch)) || {}) };
      await delivered();
      return json({ success: true, save: meta(updated), flags, ...corrected });
    }

    if (action === 'backups') {
      const rows = await svc.Game3DCharacterSaveBackup.filter({ owner_id: ownerId, character_id: characterId }, '-created_date', 50);
      return json({ success: true, backups: (rows || []).map((b: any) => ({ id: b.id, save_revision: b.save_revision, reason: b.reason, byte_size: b.byte_size, created_date: b.created_date })) });
    }

    if (action === 'restore') {
      const { row, duplicate } = await current();
      if (duplicate) return json({ error: 'This character has two first saves; support needs to choose one', code: 'duplicate_saves' }, 409);
      const chosen = await svc.Game3DCharacterSaveBackup.get(String(data.backupId || '')).catch(() => null);
      if (!chosen || chosen.owner_id !== ownerId || chosen.character_id !== characterId) return json({ error: 'Backup not found' }, 404);
      if (!row) return json({ error: 'This character has no saved copy to restore over', code: 'no_save' }, 409);
      await backup(row, 'before_restore'); // a restore can itself be undone
      const patch = {
        revision: row.revision + 1, data: chosen.data, fingerprint: chosen.fingerprint || fingerprintCharacterSave(chosen.data),
        byte_size: chosen.byte_size, roster_entry: chosen.roster_entry || row.roster_entry || null, flags: [], saved_at: iso, last_backup_at: iso,
      };
      const updated = { ...row, ...patch, ...((await svc.Game3DCharacterSave.update(row.id, patch)) || {}) };
      // the restored items keep their restored upgrades: the ledger follows the restore
      const ledger = await svc.Game3DItemUpgrade.filter({ owner_id: ownerId, character_id: characterId }, '-created_date', 1000);
      for (const { row: upgrade, record, spent } of ledgerRecordsFor(chosen.data, ledger || [])) {
        await svc.Game3DItemUpgrade.update((upgrade as any).id, { record, spent, restored_at: iso });
      }
      // what the hero found stays found; units granted after this backup are delivered again
      const finds = await svc.Game3DDiscoveryClaim.filter({ owner_id: ownerId, character_id: characterId }, '-created_date', 1000);
      for (const { row: find, pending } of pendingAfterRestore(chosen.data, finds || [], chosen.created_date)) {
        const already = new Set(((find as any).pending || []).map((u: any) => u.dropId));
        await svc.Game3DDiscoveryClaim.update((find as any).id, { pending: [...((find as any).pending || []), ...pending.filter((u) => !already.has(u.dropId))], restored_at: iso });
      }
      return json({ success: true, save: meta(updated), restored_revision: chosen.save_revision });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    console.error('[characterVault]', error);
    return json({ error: (error as Error)?.message || 'Character save failed' }, 500);
  }
});
