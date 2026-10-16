// Preferences only: not an inventory grant or multiplayer authority.
import { normalizeLoadout, sameLoadout } from './loadout';
const failure = code => Object.assign(new Error(code), { code });
export function createCompanionCloud(client) {
  const entity = () => client.entities.Game3DCompanionLoadout;
  async function authorize(scope) {
    const me = await client.auth.me();
    if (!me?.id || me.id !== scope.userId) throw failure('ACCOUNT_CHANGED');
    return me;
  }
  async function read(scope) {
    await authorize(scope);
    const records = await entity().filter({ owner_id: scope.userId, character_id: scope.characterId }, '-created_date', 2);
    if (!Array.isArray(records)) throw failure('CLOUD_UNAVAILABLE');
    // No arbitrary winner if two devices created their first save together.
    if (records.length > 1) throw failure('DUPLICATE_SAVES');
    const row = records[0];
    if (!row) return null;
    if (row.owner_id !== scope.userId || row.character_id !== scope.characterId || !row.id ||
        !Number.isSafeInteger(row.revision) || row.revision < 1 || !row.loadout || typeof row.loadout !== 'object') {
      throw failure('INVALID_CLOUD_SAVE');
    }
    return { id: row.id, revision: row.revision, loadout: normalizeLoadout(row.loadout) };
  }
  async function write(scope, loadout, expected, current) {
    // Recover a lost acknowledgement without committing the same change twice.
    if (current && sameLoadout(current.loadout, loadout)) return current;
    if (current?.id !== expected?.id || current?.revision !== expected?.revision) throw failure('CONFLICT');
    await authorize(scope);
    if (current) {
      const result = await entity().updateMany({ id: current.id, owner_id: scope.userId,
        character_id: scope.characterId, revision: current.revision },
      { $set: { loadout: normalizeLoadout(loadout) }, $inc: { revision: 1 } });
      if (!result?.success || result.updated !== 1) throw failure('CONFLICT');
      return { id: current.id, revision: current.revision + 1, loadout: normalizeLoadout(loadout) };
    }
    await entity().create({ owner_id: scope.userId, character_id: scope.characterId,
      revision: 1, loadout: normalizeLoadout(loadout) });
    // No verified unique-key schema support: detect duplicate creates and stop.
    // Never delete either device's record to pretend the conflict is repaired.
    const committed = await read(scope);
    if (!committed || !sameLoadout(committed.loadout, loadout)) throw failure('CONFLICT');
    return committed;
  }
  return { read, write, async legacy(scope) { return (await authorize(scope)).companion_state; } };
}
