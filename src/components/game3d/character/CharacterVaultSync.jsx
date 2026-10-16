import { useEffect, useMemo, useState } from 'react';
import { Cloud, CloudOff, AlertTriangle } from 'lucide-react';
import { callGameServer } from '../social/socialServer';
import { getActiveId, getStorageUser, notifyCharacterChange, subscribeCharacterChange } from '../characterStorage';
import { getCharacterState, mergeCharactersFromServer } from '../characterStore';
import { reloadPlayerHUDFromSave } from '../playerHUDStore';
import { setAXEServiceDiceSource } from '../axe/services/AXEServiceTransactionGateway';
import { createCharacterVaultSync, createServerDice } from './characterVault';

/**
 * CharacterVaultSync — keeps the server's copy of the active character in step
 * (docs/game3d/CHARACTER_VAULT.md). Shows a small save status next to the online
 * pill, and asks the player which save to keep when this device and the server both
 * changed the same character.
 */
const STATUS = {
  syncing: { text: 'Loading save…', Icon: Cloud, tone: 'text-white/55' },
  saving: { text: 'Saving…', Icon: Cloud, tone: 'text-white/55' },
  saved: { text: 'Saved', Icon: Cloud, tone: 'text-emerald-300/80' },
  offline: { text: 'Saved on this device only', Icon: CloudOff, tone: 'text-amber-200/80' },
  rejected: { text: 'Server did not accept this save', Icon: AlertTriangle, tone: 'text-red-300/90' },
  error: { text: 'Save needs support', Icon: AlertTriangle, tone: 'text-red-300/90' },
};

export default function CharacterVaultSync() {
  const engine = useMemo(() => createCharacterVaultSync({
    call: (action, data) => callGameServer('characterVault', action, data),
    getIdentity: () => ({ userId: getStorageUser(), characterId: getActiveId() }),
    // the HUD first, so the stores reloading after it never save its old level back
    reloadCharacter: () => { reloadPlayerHUDFromSave(); notifyCharacterChange(); },
    getRosterEntry: (id) => getCharacterState().roster.find((c) => c.id === id) || null,
    mergeRoster: mergeCharactersFromServer,
  }), []);
  const [vault, setVault] = useState(engine.get());
  useEffect(() => engine.subscribe(setVault), [engine]);
  // reinforcement, over-enchant, refine and ultimate are rolled by the server for this character
  useEffect(() => setAXEServiceDiceSource(createServerDice(engine, {
    call: (fn, action, data) => callGameServer(fn, action, data),
    getIdentity: () => ({ userId: getStorageUser(), characterId: getActiveId() }),
  })), [engine]);
  useEffect(() => {
    let pending = null;
    // another account or character; the vault's own reload of the same character is not a restart
    const restart = () => { clearTimeout(pending); pending = setTimeout(() => engine.refresh(), 300); };
    engine.start();
    const unsub = subscribeCharacterChange(restart);
    return () => { clearTimeout(pending); unsub(); engine.stop(); };
  }, [engine]);

  const chip = STATUS[vault.status];
  const conflict = vault.status === 'conflict' ? vault.conflict : null;
  const when = conflict?.remote?.saved_at ? new Date(conflict.remote.saved_at).toLocaleString() : '';
  return (
    <>
      {chip && (
        <div
          className={`fixed bottom-4 left-[10.5rem] z-40 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${chip.tone}`}
          style={{ background: 'rgba(10, 14, 20, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
          title={vault.errors?.length ? vault.errors.join('\n') : 'Your character is kept on the server and follows you to other devices.'}
          role="status"
        >
          <chip.Icon className="h-3 w-3" />
          <span>{chip.text}</span>
        </div>
      )}
      {conflict && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-labelledby="vault-conflict-title">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/95 p-5 text-white shadow-2xl">
            <h2 id="vault-conflict-title" className="text-base font-semibold">This character was also played somewhere else</h2>
            <p className="mt-1 text-sm text-white/60">
              This device and the server each have newer progress for this character. Choose the one to keep; the other is kept as a backup.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {[['This device', conflict.local], [`Saved copy${when ? ` · ${when}` : ''}`, conflict.saved]].map(([label, s]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="text-[11px] uppercase tracking-wider text-white/45">{label}</div>
                  <div className="mt-1">Level {s?.level ?? 1}</div>
                  <div className="text-white/70">{(s?.silver ?? 0).toLocaleString()} Silver · {s?.items ?? 0} items</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => engine.resolve('keep_device')} className="rounded-lg border border-white/20 px-3 py-2 text-sm">Keep this device's</button>
              <button type="button" onClick={() => engine.resolve('use_saved')} className="rounded-lg bg-amber-200 px-3 py-2 text-sm font-semibold text-slate-950">Use the saved copy</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
