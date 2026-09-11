import React, { useState } from 'react';

export default function ProgressionFusion({ state, act, disabled }) {
  const [selected,setSelected] = useState([]);
  const [wildcard,setWildcard] = useState(false);
  const [confirm,setConfirm] = useState(false);
  const p = state.progression;
  const needed = Math.min(3,p.stage + 1);
  const availableWildcards = state.materials.filter(m => m.material_type === 'wildcard').reduce((sum,m) => sum + m.quantity,0);
  const ready = wildcard ? availableWildcards > 0 : selected.length === needed;
  const stage = async () => { if (await act('combine',{ sacrificeUserCardIds:selected, useWildcard:wildcard })) { setSelected([]); setConfirm(false); } };
  return <section className="cr-panel"><p className="cr-label">Synthesis pedestal · Stage {p.stage} / 5</p><h3 className="text-xl mt-2">Stage & fuse</h3><p className="text-sm text-muted-foreground mt-3">Consume {needed} compatible cards or 1 Wildcard to gain a stage, +5 level cap, 1 Skill Point, and a stronger stat multiplier. Perk capacity also grows with stage.</p>
    <label className="flex items-center gap-2 text-sm mt-5"><input type="checkbox" checked={wildcard} disabled={disabled || confirm} onChange={e => setWildcard(e.target.checked)}/> Use a Wildcard ({availableWildcards} available)</label>
    {!wildcard && <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">{Array.from({length:needed},(_,i) => <label className="rounded-xl border border-dashed border-primary/30 p-4 text-xs text-muted-foreground" key={i}>Fusion slot {String.fromCharCode(65+i)}<select aria-label={`Fusion slot ${String.fromCharCode(65+i)}`} className="cr-input mt-3" disabled={disabled || confirm} value={selected[i] || ''} onChange={e => { const next=[...selected]; next[i]=e.target.value; setSelected(next); }}><option value="">Select sacrifice card</option>{state.compatibleCards.filter(c => !selected.includes(c.id) || selected[i] === c.id).map(c => <option key={c.id} value={c.id}>{c.card_name} · {c.card_rarity}</option>)}</select></label>)}</div>}
    {!wildcard && state.compatibleCards.length < needed && <p className="text-xs text-muted-foreground mt-4">Not enough compatible unequipped cards. Cards reserved in trades are excluded.</p>}
    {confirm ? <div className="mt-5 rounded-lg border border-secondary/50 p-4" role="alert"><p className="text-sm">{wildcard ? 'One Wildcard' : `${needed} selected cards`} will be permanently consumed. This cannot be undone.</p><div className="mt-4 flex gap-3"><button className="cr-action" disabled={disabled} onClick={stage}>Confirm fusion</button><button className="cr-action" disabled={disabled} onClick={() => setConfirm(false)}>Cancel fusion</button></div></div> : <button className="cr-action mt-5" disabled={disabled || p.stage >= 5 || !ready || (!wildcard && selected.filter(Boolean).length !== needed)} onClick={() => setConfirm(true)}>Stage card</button>}
  </section>;
}