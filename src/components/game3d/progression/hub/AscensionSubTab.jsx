// Wuxia blueprint v3 §4 — Taurus Chosen Ascension in the Character Hub: the one-time
// ritual, the three Natures (re-attuning has a cooldown) and the Angel Cloak toggle.
import { useEffect, useState } from 'react';
import { subscribeCharacterChange } from '../../characterStorage';
import { subscribePlayerHUD } from '../../playerHUDStore';
import ProgressionReview from './ProgressionReview';
import {
  ascendAXECharacter,
  setAXEAngelCloakHidden,
  setAXEAscensionNature,
  subscribeAXEAscension,
} from '../../axe/progression/AXEAscensionStore';
import {
  AXE_ASCENSION_CONFIG,
  AXE_ASCENSION_NATURES,
  AXE_ASCENSION_NATURE_ORDER,
} from '../../axe/progression/AXEAscensionSystem';

const CLOAK = AXE_ASCENSION_CONFIG.angelCloak;
const minutesLeft = (ms) => Math.max(0, Math.ceil(ms / 60000));
const describe = (r) => (r.ok ? r.message || 'Done.' : ({
  LEVEL_TOO_LOW: `Ascension requires level ${r.required}.`,
  REATTUNE_COOLDOWN: `Your Nature can change again in ${minutesLeft((r.readyAt || 0) - Date.now())} min.`,
}[r.reason] || r.reason?.replaceAll('_', ' ')));

export default function AscensionSubTab() {
  const [state, setState] = useState(null);
  const [level, setLevel] = useState(1);
  const [review, setReview] = useState(null);
  const [result, setResult] = useState(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => subscribeAXEAscension(setState), []);
  useEffect(() => subscribePlayerHUD((hud) => setLevel(Number(hud?.level) || 1)), []);
  useEffect(() => subscribeCharacterChange(() => { setReview(null); setResult(null); }), []);
  const cooling = !!(state?.nature && state.attunedAt && now - state.attunedAt < AXE_ASCENSION_CONFIG.reattuneCooldownMs);
  useEffect(() => {
    if (!cooling) return undefined;
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [cooling]);
  if (!state) return null;

  const eligible = level >= AXE_ASCENSION_CONFIG.minLevel;
  const readyAt = (state.attunedAt || 0) + AXE_ASCENSION_CONFIG.reattuneCooldownMs;

  const requestAscend = () => setReview({
    action: 'ascend', confirmLabel: 'Ascend', cost: {},
    title: 'Undergo Taurus Chosen Ascension',
    description: 'You become an Enlightened Being: you levitate above the ground (+12% movement), gain the Angel Cloak '
      + `(+${CLOAK.flat.hp} HP, +${CLOAK.flat.defense} defense, +${CLOAK.flat.attributionDefense} attribution defense, +${Math.round(CLOAK.moveSpeedPct * 100)}% movement) `
      + 'and choose one of three Natures. Ascension is permanent.',
  });
  const requestNature = (id) => {
    const def = AXE_ASCENSION_NATURES[id];
    setReview({
      action: 'nature', nature: id, confirmLabel: state.nature ? 'Re-attune' : 'Choose', cost: {},
      title: state.nature ? `Re-attune to the ${def.label}` : `Walk the ${def.label}`,
      description: `${def.summary} After choosing, your Nature cannot change again for ${AXE_ASCENSION_CONFIG.reattuneCooldownMs / 60000} minutes.`,
    });
  };
  const confirm = (pending) => {
    const r = pending.action === 'ascend'
      ? ascendAXECharacter({ level, confirmed: true })
      : setAXEAscensionNature(pending.nature);
    setResult(r);
    setReview(null);
    setNow(Date.now());
  };

  return (
    <div className="space-y-4 text-white">
      <section className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-amber-200/70">Taurus Chosen Ascension</div>
            <h3 className="mt-1 text-lg font-semibold">{state.ascended ? 'Enlightened Being' : 'Mortal'}</h3>
            {state.ascended && (
              <div className="text-sm text-amber-100/90">{state.nature ? AXE_ASCENSION_NATURES[state.nature].label : 'No Nature chosen yet'}</div>
            )}
            <p className="mt-1 max-w-2xl text-sm text-white/60">
              At the peak of mortal progression a hero transcends: they float inches above the terrain, wear the Angel Cloak
              and walk one Nature: Destroyer, Balanced or Defensive.
            </p>
          </div>
          {!state.ascended && (
            <div className="text-right">
              <div className="text-3xl font-semibold tabular-nums">{level}<span className="text-base text-white/45">/{AXE_ASCENSION_CONFIG.minLevel}</span></div>
              <div className="text-xs text-white/50">level required</div>
            </div>
          )}
        </div>
        {!state.ascended && (
          <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-amber-200/70" style={{ width: `${Math.min(1, level / AXE_ASCENSION_CONFIG.minLevel) * 100}%` }} />
            </div>
            <button type="button" disabled={!eligible} onClick={requestAscend}
              className="mt-4 rounded-lg bg-amber-200/90 px-4 py-2 text-sm font-semibold text-slate-950 disabled:bg-white/10 disabled:text-white/40">
              {eligible ? 'Undergo Taurus Chosen Ascension' : `Reach level ${AXE_ASCENSION_CONFIG.minLevel} to ascend`}
            </button>
          </>
        )}
        <ProgressionReview review={review} onCancel={() => setReview(null)} onConfirm={confirm} />
        {result && (
          <div role="status" className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80">
            {describe(result)}
          </div>
        )}
      </section>

      {state.ascended && (
        <section className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs uppercase tracking-[0.35em] text-amber-200/70">Nature</div>
            {cooling && <div className="text-xs text-white/50">Re-attune in {minutesLeft(readyAt - now)} min</div>}
          </div>
          {!state.nature && <p className="mt-2 text-sm text-amber-100/80">Choose the Nature your ascended self will walk.</p>}
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            {AXE_ASCENSION_NATURE_ORDER.map((id) => {
              const def = AXE_ASCENSION_NATURES[id];
              const chosen = state.nature === id;
              return (
                <div key={id} className={`flex flex-col rounded-xl border p-3 ${chosen ? 'border-amber-200/40 bg-amber-200/[0.07]' : 'border-white/10 bg-white/[0.03]'}`}>
                  <div className="text-sm font-semibold text-white/90">{def.label}</div>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-white/60">{def.summary}</p>
                  <button type="button" disabled={chosen || cooling} onClick={() => requestNature(id)}
                    className="mt-3 rounded-lg bg-white/10 px-2 py-1.5 text-xs font-semibold text-white/75 disabled:opacity-50">
                    {chosen ? 'Current Nature' : state.nature ? 'Re-attune' : 'Choose'}
                  </button>
                </div>
              );
            })}
          </div>
          {state.nature === 'defensive' && (
            <p className="mt-3 text-xs text-white/45">The Defensive shield protects you for now; sharing it with party members comes with party combat.</p>
          )}
        </section>
      )}

      {state.ascended && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/55 p-4">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-amber-200/70">{CLOAK.label}</div>
            <p className="mt-1 text-sm text-white/60">
              +{CLOAK.flat.hp} HP · +{CLOAK.flat.defense} defense · +{CLOAK.flat.attributionDefense} attribution defense · +{Math.round(CLOAK.moveSpeedPct * 100)}% movement.
              Hiding the cloak keeps its bonuses.
            </p>
          </div>
          <button type="button" onClick={() => setResult(setAXEAngelCloakHidden(!state.cloakHidden))}
            className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/75">
            {state.cloakHidden ? 'Show cloak' : 'Hide cloak'}
          </button>
        </section>
      )}

      <p className="text-xs text-white/35">Level {AXE_ASCENSION_CONFIG.minLevel} is a provisional threshold until Game 3D has a level cap.</p>
    </div>
  );
}
