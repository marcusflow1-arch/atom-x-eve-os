// Keeps the server's copy of the active character in step with this browser
// (characterVault; docs/game3d/CHARACTER_VAULT.md).
//
// The game keeps playing from browser storage. This engine:
//  • uploads the character's save when it changes (checked every 20 s), building on the
//    revision it last saw, so a stale device can never overwrite newer progress;
//  • on loading a character, takes the server's copy when it is newer and this device has
//    nothing new (another device played it, or browser data was cleared);
//  • when both changed, does neither on its own: it reports a conflict and the player
//    chooses which save to keep;
//  • before replacing anything on this device, keeps this device's save in a local backup.
// The first upload of a character is its migration; the server keeps that save as a backup.
import { CHARACTER_SAVE_EXCLUDED_KEYS, fingerprintCharacterSave } from '../../../../base44/shared/characterSaveRules.ts';

export const VAULT_SYNC = Object.freeze({ intervalMs: 20_000, offlineRetryMs: 60_000 });
const META_BASE = 'axe_character_vault_meta';
const BACKUP_BASE = 'axe_character_vault_local_backup';
const LOCAL_ONLY_USERS = new Set(['__anon__']);
const LOCAL_ONLY_CHARACTERS = new Set(['__default__']);

const parse = (raw) => { try { return JSON.parse(raw); } catch { return null; } };

// a short description of a save for the conflict choice
export function summarizeCharacterSave(data = {}) {
  const hero = parse(data.wwm_player_progression_v1) || {};
  const shop = parse(data.axe_shop_state_v1) || {};
  const items = (parse(data.axe_equipment_inventory_v2)?.items || []).length;
  return { level: Number(hero.level) || 1, silver: Number(shop.gold) || 0, items };
}

// a device that has never really played this character
const isFresh = (data) => {
  const hero = parse(data.wwm_player_progression_v1);
  return !hero || (Number(hero.level) <= 1 && !Number(hero.xp));
};

export function createCharacterVaultSync({
  call, // (action, data) => Promise<body>; throws Error { code, status, body }
  storage = globalThis.localStorage,
  getIdentity, // () => { userId, characterId }
  reloadCharacter, // () => void: makes every store re-read the active character
  getRosterEntry = () => null, // (characterId) => roster card
  mergeRoster = () => 0, // (entries) => number added
  setTimer = (fn, ms) => setInterval(fn, ms),
  clearTimer = (t) => clearInterval(t),
}) {
  let state = { status: 'idle' };
  let identity = null;
  let generation = 0;
  let timer = null;
  let busy = false;
  let rejectedFingerprint = null;
  let retryAt = 0;
  const listeners = new Set();
  const set = (patch) => { state = { ...state, ...patch }; listeners.forEach((fn) => fn(state)); };
  const suffix = (id) => `::${id.userId}::${id.characterId}`;
  const keyOf = (base, id) => `${base}${suffix(id)}`;

  const collect = (id) => {
    const out = {};
    const end = suffix(id);
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (!k || !k.endsWith(end)) continue;
      const base = k.slice(0, -end.length);
      if (base.includes('::') || CHARACTER_SAVE_EXCLUDED_KEYS.includes(base)) continue;
      out[base] = storage.getItem(k);
    }
    return out;
  };
  const readMeta = (id) => parse(storage.getItem(keyOf(META_BASE, id)));
  const writeMeta = (id, revision, fingerprint) => { try { storage.setItem(keyOf(META_BASE, id), JSON.stringify({ revision, fingerprint })); } catch { /* sync again later */ } };

  // replace this device's save with the server's, keeping this device's in a local backup
  const apply = (id, remote) => {
    try { storage.setItem(keyOf(BACKUP_BASE, id), JSON.stringify({ saved_at: new Date().toISOString(), data: collect(id) })); } catch { /* best effort */ }
    for (const [k, v] of Object.entries(remote.data || {})) storage.setItem(`${k}${suffix(id)}`, v);
    writeMeta(id, remote.revision, fingerprintCharacterSave(remote.data || {}));
    reloadCharacter();
    set({ status: 'saved', revision: remote.revision, conflict: null, replacedFromServer: true });
  };

  const upload = async (id, gen, expectedRevision, { overwrite = false } = {}) => {
    const data = collect(id);
    const fingerprint = fingerprintCharacterSave(data);
    if (fingerprint === rejectedFingerprint) return;
    busy = true;
    set({ status: 'saving' });
    try {
      const body = await call('put', { characterId: id.characterId, data, expectedRevision, rosterEntry: getRosterEntry(id.characterId), ...(overwrite ? { overwrite: true } : {}) });
      if (gen !== generation) return;
      writeMeta(id, body.save.revision, fingerprint);
      rejectedFingerprint = null;
      set({ status: 'saved', revision: body.save.revision, savedAt: Date.now(), errors: null });
    } catch (e) {
      if (gen !== generation) return;
      if (e.code === 'conflict') {
        const remote = e.body?.save;
        // nothing changed here since the last sync: the newer save simply wins
        const meta = readMeta(id);
        if (remote && meta && fingerprint === meta.fingerprint) apply(id, remote);
        else set({ status: 'conflict', conflict: { remote, local: summarizeCharacterSave(data), saved: summarizeCharacterSave(remote?.data) } });
      } else if (e.code === 'rejected' || e.code === 'invalid') {
        rejectedFingerprint = fingerprint; // not again until the save changes
        set({ status: 'rejected', errors: e.body?.errors || [e.message] });
      } else if (e.code === 'duplicate_saves' || e.body?.code === 'duplicate_saves') {
        set({ status: 'error', errors: [e.message] });
      } else {
        retryAt = Date.now() + VAULT_SYNC.offlineRetryMs;
        set({ status: 'offline' });
      }
    } finally {
      busy = false;
    }
  };

  const tick = async () => {
    const id = identity;
    if (!id || busy || ['conflict', 'error', 'local_only'].includes(state.status)) return;
    if (state.status === 'offline' && Date.now() < retryAt) return;
    const meta = readMeta(id);
    if (meta && fingerprintCharacterSave(collect(id)) === meta.fingerprint) return;
    await upload(id, generation, meta?.revision ?? 0);
  };

  async function start() {
    stop();
    const id = getIdentity();
    const gen = ++generation;
    identity = id;
    rejectedFingerprint = null;
    const signedIn = Boolean(id?.userId) && !LOCAL_ONLY_USERS.has(id.userId);
    const onServer = signedIn && Boolean(id?.characterId) && !LOCAL_ONLY_CHARACTERS.has(id.characterId);
    if (onServer) { busy = true; set({ status: 'syncing', conflict: null, replacedFromServer: false }); }
    else set({ status: 'local_only', conflict: null });
    // characters this device has never seen; a new device has none picked yet, so this comes first
    if (signedIn) {
      try { mergeRoster(((await call('list', {})).saves || []).map((s) => s.roster_entry).filter(Boolean)); } catch { /* the roster can wait */ }
      if (gen !== generation) return;
    }
    if (!onServer) return;
    try {
      const remote = (await call('get', { characterId: id.characterId })).save;
      if (gen !== generation) return;
      const local = collect(id);
      const fingerprint = fingerprintCharacterSave(local);
      const meta = readMeta(id);
      busy = false;
      if (!remote) {
        if (Object.keys(local).length) await upload(id, gen, 0); // the first upload: the migration
        else set({ status: 'saved' });
      } else if (fingerprint === remote.fingerprint) {
        writeMeta(id, remote.revision, fingerprint);
        set({ status: 'saved', revision: remote.revision });
      } else if (meta && meta.revision === remote.revision) {
        await upload(id, gen, remote.revision); // played here since the last sync
      } else if (isFresh(local) || (meta && fingerprint === meta.fingerprint)) {
        apply(id, remote); // newer on the server, nothing new here
      } else {
        set({ status: 'conflict', conflict: { remote, local: summarizeCharacterSave(local), saved: summarizeCharacterSave(remote.data) } });
      }
    } catch (e) {
      if (gen !== generation) return;
      if (e.code === 'duplicate_saves' || e.body?.code === 'duplicate_saves') set({ status: 'error', errors: [e.message] });
      else { retryAt = Date.now() + VAULT_SYNC.offlineRetryMs; set({ status: 'offline' }); }
    } finally {
      if (gen === generation) busy = false;
    }
    if (gen === generation) timer = setTimer(tick, VAULT_SYNC.intervalMs);
  }

  // the account or character may have changed; the same one (this engine's own reload) carries on
  function refresh() {
    const id = getIdentity();
    if (id?.userId === identity?.userId && id?.characterId === identity?.characterId) return Promise.resolve();
    return start();
  }

  function stop() {
    if (timer) clearTimer(timer);
    timer = null;
    generation++;
    busy = false;
  }

  // the player's choice in a conflict
  async function resolve(choice) {
    const id = identity;
    const remote = state.conflict?.remote;
    if (!id || state.status !== 'conflict') return;
    if (choice === 'use_saved' && remote) apply(id, remote);
    else if (choice === 'keep_device') {
      set({ conflict: null, status: 'saving' });
      await upload(id, generation, remote?.revision ?? 0, { overwrite: true }); // the server keeps the save it replaces
    }
    if (!timer) timer = setTimer(tick, VAULT_SYNC.intervalMs);
  }

  return {
    start, refresh, stop, resolve, tick,
    get: () => state,
    subscribe: (fn) => { listeners.add(fn); fn(state); return () => listeners.delete(fn); },
  };
}
