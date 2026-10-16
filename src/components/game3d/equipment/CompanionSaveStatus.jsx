import { useEffect, useState } from 'react';
import { getCompanionState, subscribeCompanion, syncCompanion } from '../companionStore';
export default function CompanionSaveStatus() {
  const [state, setState] = useState(getCompanionState);
  useEffect(() => subscribeCompanion(setState), []);
  const { phase, message } = state.sync;
  const attention = ['error', 'conflict', 'save-error'].includes(phase);
  return (
    <div className={`my-3 rounded-lg border px-3 py-2 text-xs ${attention
      ? 'border-amber-400/30 bg-amber-500/10 text-amber-100'
      : 'border-white/10 bg-black/20 text-white/60'}`}>
      <div role="status" aria-label="Companion equipment save" aria-live="polite"><span className="font-semibold">Companion equipment · </span>{message}</div>
      {phase === 'error' && <button className="mt-2 rounded border border-white/20 px-3 py-1.5 hover:bg-white/10"
        onClick={() => void syncCompanion()}>Retry cloud sync</button>}
      {phase === 'conflict' && <div className="mt-2 flex flex-wrap gap-2">
        <button className="rounded border border-amber-300/40 px-3 py-1.5 hover:bg-amber-300/10"
          onClick={() => void syncCompanion('device')}>Keep this device’s equipment</button>
        <button className="rounded border border-white/20 px-3 py-1.5 hover:bg-white/10"
          onClick={() => void syncCompanion('cloud')}>Replace with cloud equipment</button>
      </div>}
    </div>
  );
}
