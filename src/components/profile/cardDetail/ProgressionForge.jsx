import React, { useState } from 'react';
import ProgressionLevel from '@/components/profile/cardDetail/ProgressionLevel';
import ProgressionFusion from '@/components/profile/cardDetail/ProgressionFusion';
import ProgressionEnchant from '@/components/profile/cardDetail/ProgressionEnchant';

export default function ProgressionForge({ state, act, disabled, busy }) {
  const [tab,setTab]=useState('Level');
  const materials=Object.entries(state.materials.reduce((out,m)=>{out[m.material_type]=(out[m.material_type]||0)+Number(m.quantity||0);return out;},{}));
  return <div className="space-y-5" data-testid="progression-forge">
    <header className="cr-panel"><p className="cr-label">The Forge · permanent progression</p><h2 className="text-2xl mt-2">Shape your card’s potential</h2><nav aria-label="Forge systems" className="flex flex-wrap gap-2 mt-5">{['Level','Fusion','Enchant'].map(name=><button key={name} className={`cr-action ${tab===name?'bg-primary/15':''}`} aria-pressed={tab===name} onClick={()=>setTab(name)}>{name}</button>)}</nav></header>
    {tab==='Level' && <ProgressionLevel state={state} act={act} disabled={disabled}/>}
    {tab==='Fusion' && <ProgressionFusion state={state} act={act} disabled={disabled}/>}
    {tab==='Enchant' && <ProgressionEnchant state={state} act={act} disabled={disabled} busy={busy}/>}
    <section className="cr-panel"><p className="cr-label">Your saved materials</p>{materials.length?<div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">{materials.map(([name,quantity])=><div key={name}><span className="capitalize text-xs text-muted-foreground">{name.replaceAll('_',' ')}</span><strong className="block text-lg">{quantity}</strong></div>)}</div>:<p className="text-sm text-muted-foreground mt-3">No materials in your inventory. Upgrades require earned materials; demo balances are not used.</p>}</section>
  </div>;
}