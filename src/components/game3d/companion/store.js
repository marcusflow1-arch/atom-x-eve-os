import { normalizeLoadout, validItem } from './loadout';
const copy = value => JSON.parse(JSON.stringify(value));
const cloudRef = row => row ? { id: row.id, revision: row.revision } : null;
const messages = {
  ACCOUNT_CHANGED: 'Sign in to this character’s account to sync. Your device save is retained.',
  CONFLICT: 'This character has a different cloud save. Choose which equipment to keep.',
  DUPLICATE_SAVES: 'Multiple cloud saves exist for this character. Your device save is safe; contact support before syncing.',
  INVALID_CLOUD_SAVE: 'The cloud save could not be read. Your device save is retained.',
  CLOUD_UNAVAILABLE: 'Cloud sync is unavailable. Your equipment is saved on this device. Retry when connected.',
};

// Injected boundaries exercise the production state machine in race/failure tests.
export function createCompanionStore({ storage, scope, onScopeChange, cloud, legacyFusion, delay = 600 }) {
  const listeners = new Set();
  let generation = 0, edits = 0, timer, running = null, disposed = false;
  let document, mounted = false, status = { phase: 'local', message: '' }, activeScope;
  const current = (g, e) => !disposed && g === generation && (e === undefined || e === edits);
  const snapshot = () => ({ ...copy(document.loadout), isMounted: mounted, sync: { ...status } });
  const publish = () => listeners.forEach(fn => fn(snapshot()));
  const setStatus = (phase, message = '') => { status = { phase, message }; publish(); };
  const save = (next, errorMessage = 'Equipment was not changed: device storage is full or blocked. Free space and try again.') => {
    if (!storage.setChecked(JSON.stringify(next))) { setStatus('save-error', errorMessage); return false; }
    document = next;
    return true;
  };
  const canSync = () => activeScope.userId !== '__anon__' && activeScope.characterId !== '__default__';
  const schedule = () => {
    clearTimeout(timer);
    if (canSync()) timer = setTimeout(() => { void sync(); }, delay);
  };
  async function sync(choice) {
    if (!canSync() || disposed) return;
    if (running?.generation === generation) return running.promise;
    clearTimeout(timer);
    const g = generation, e = edits, capturedScope = { ...activeScope };
    const task = { generation: g };
    running = task;
    task.promise = (async () => {
      setStatus('syncing', 'Syncing companion equipment…');
      try {
        const row = await cloud.read(capturedScope);
        if (!current(g, e)) return;
        // Account-wide legacy data belongs to Dev Test, never every new character.
        if (!row && !document.exists && capturedScope.characterId === '__dev_test__') {
          const legacy = await cloud.legacy(capturedScope);
          if (!current(g, e)) return;
          if (legacy && typeof legacy === 'object') {
            if (!save({ ...document, exists: true, dirty: true, loadout: normalizeLoadout(legacy) })) return;
          }
        }
        if (choice === 'cloud' || (!document.dirty && row)) {
          if (!row) { setStatus('error', 'No cloud save exists to load. Your device equipment is unchanged.'); return; }
          const previousActive = document.loadout.activeCompanionId;
          if (!save({ version: 2, exists: true, dirty: false, cloud: cloudRef(row), loadout: row.loadout },
            'Cloud equipment could not be saved on this device. Your current equipment is unchanged.')) return;
          if (previousActive !== row.loadout.activeCompanionId) mounted = false;
          setStatus('synced', 'Companion equipment synced.');
          return;
        }
        if (!document.exists) { setStatus('local', 'Choose equipment to save this character’s loadout.'); return; }
        const sent = copy(document);
        const result = await cloud.write(capturedScope, sent.loadout, choice === 'device' ? cloudRef(row) : sent.cloud, row);
        if (!current(g)) return;
        // Preserve edits made during the request, carrying forward its acknowledgement.
        if (!save({ ...document, dirty: edits !== e, cloud: cloudRef(result) },
          'Equipment is saved on this device, but the cloud confirmation could not be saved. Retry sync.')) return;
        if (edits === e) setStatus('synced', 'Companion equipment synced.');
      } catch (error) {
        if (!current(g)) return;
        const code = error?.code || 'CLOUD_UNAVAILABLE';
        setStatus(code === 'CONFLICT' ? 'conflict' : 'error', messages[code] || messages.CLOUD_UNAVAILABLE);
      } finally {
        if (running === task) running = null;
        if (current(g) && edits !== e) schedule();
      }
    })();
    return task.promise;
  }
  function reload() {
    clearTimeout(timer); generation++; edits = 0; mounted = false;
    activeScope = scope();
    let saved;
    try { saved = JSON.parse(storage.get() || 'null'); } catch { /* invalid local preference */ }
    // Scoped storage restricts old global keys to the legacy owner's Dev Test.
    // Canonical companion preferences win over the former separate Gear UI save.
    if (!saved) {
      let fusion;
      try { fusion = JSON.parse(legacyFusion?.get() || 'null'); } catch { /* optional legacy preference */ }
      if (fusion?.activeCompanionId && fusion?.equippedGear) {
        saved = { activeCompanionId: fusion.activeCompanionId, gear: { [fusion.activeCompanionId]: fusion.equippedGear } };
      }
    }
    document = { version: 2, exists: !!saved, dirty: saved?.version === 2 ? !!saved.dirty : !!saved,
      cloud: saved?.version === 2 ? saved.cloud || null : null,
      loadout: normalizeLoadout(saved?.version === 2 ? saved.loadout : saved) };
    status = { phase: 'local', message: canSync() ? 'Checking this character’s companion save…' : 'Equipment is saved on this device.' };
    publish();
    if (saved && saved.version !== 2 && !save(document)) return;
    if (canSync()) void sync();
  }
  function change(loadout) {
    const next = { ...document, exists: true, dirty: true, loadout: normalizeLoadout(loadout) };
    if (!save(next)) return { ok: false, reason: 'SAVE_FAILED' };
    edits++;
    setStatus('local', canSync() ? 'Equipment saved on this device; cloud sync pending.' : 'Equipment saved on this device.');
    schedule();
    return { ok: true };
  }
  const unsubscribe = onScopeChange(reload);
  reload();
  return {
    getState: snapshot,
    subscribe(fn) { listeners.add(fn); fn(snapshot()); return () => listeners.delete(fn); },
    setActive(companionId) {
      if (normalizeLoadout({ activeCompanionId: companionId }).activeCompanionId !== companionId) return { ok: false, reason: 'INVALID_COMPANION' };
      if (companionId === document.loadout.activeCompanionId) return { ok: true };
      const result = change({ ...document.loadout, activeCompanionId: companionId });
      if (result.ok) { mounted = false; publish(); }
      return result;
    },
    setMounted(value) { mounted = !!value; publish(); return { ok: true }; },
    equip(companionId, slot, item) {
      if (!validItem(companionId, slot, item)) return { ok: false, reason: 'INVALID_GEAR' };
      return change({ ...document.loadout, gear: { ...document.loadout.gear,
        [companionId]: { ...document.loadout.gear[companionId], [slot]: item } } });
    },
    sync,
    dispose() { disposed = true; clearTimeout(timer); unsubscribe(); listeners.clear(); },
  };
}
