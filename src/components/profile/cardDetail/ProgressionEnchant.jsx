import React, { useState } from 'react';

export default function ProgressionEnchant({ state, act, disabled, busy }) {
  const [enchantment,setEnchantment] = useState('');
  const [risk,setRisk] = useState(0);
  const [protect,setProtect] = useState(false);
  const p = state.progression, next=p.over_enchant_rank+1;
  const safe=next<=5;
  const chance=safe ? 100 : Math.max(15,Math.min(95,85-(next-6)*12+p.stage*2+(p.active_perks.includes('enchanter_focus')?8:0)-risk*10));
  const quantity = type => state.materials.filter(m=>m.material_type===type).reduce((sum,m)=>sum+m.quantity,0);
  const selected=state.enchantments.find(e=>e.id===enchantment);
  const costs=selected ? (Object.keys(selected.material_cost || {}).length ? selected.material_cost : {resonance_fragment:1}) : {};
  const slots=1+Math.floor(p.stage/2)+Math.min(2,p.ascension);
  return <div className="space-y-5"><section className="cr-panel"><p className="cr-label">Elemental modifiers · {p.enchantments.length} / {slots} slots</p><h3 className="mt-2 text-xl">Enchant card</h3><div className="mt-4 flex flex-wrap gap-2">{p.enchantments.map((e,i)=><span key={`${e.id}-${i}`} className="text-xs rounded border border-primary/30 px-3 py-2">{e.name} · {e.element}</span>)}</div>
    <label className="block text-xs text-muted-foreground mt-4">Enchantment<select className="cr-input mt-2" aria-label="Enchantment" value={enchantment} onChange={e=>setEnchantment(e.target.value)}><option value="">Choose a modifier</option>{state.enchantments.map(e=><option key={e.id} value={e.id}>{e.name} · {e.element}</option>)}</select></label>
    {!state.enchantments.length && <p className="text-xs text-muted-foreground mt-3">No enchantments have been added to the catalog yet.</p>}
    {selected && <p className="text-xs text-muted-foreground mt-3">{selected.description} Cost: {Object.entries(costs).map(([key,value])=>`${value} ${key.replaceAll('_',' ')}`).join(', ')}.</p>}
    <button className="cr-action mt-4" disabled={disabled || !selected || p.enchantments.length>=slots || Object.entries(costs).some(([key,value])=>quantity(key)<value)} onClick={()=>act('enchant',{enchantmentId:enchantment})}>Apply enchantment</button></section>
    <section className="cr-panel"><p className="cr-label">{safe?'Safe enhancement':'Over-enchanting'} · +{p.over_enchant_rank} / +10</p><h3 className="text-xl mt-2">{next>10?'Maximum rank reached':`Attempt +${next}`}</h3><p className="text-sm text-muted-foreground mt-3">Ranks +1 through +5 always succeed. Above +5, failure reduces stability: below 50% corrupts the card (half power); 0% fractures it (no power).</p>
      {!safe && next<=10 && <><label className="block text-xs text-muted-foreground mt-5">Risk intensity: {risk} / 3<input className="w-full mt-3" aria-label="Over-enchantment risk" type="range" min="0" max="3" step="1" value={risk} onChange={e=>setRisk(Number(e.target.value))}/></label><label className="flex items-center gap-2 text-xs mt-3"><input type="checkbox" checked={protect} onChange={e=>setProtect(e.target.checked)}/> Stabilize attempt · 1 Resonance Fragment (protects condition, not success)</label></>}
      <div className="grid grid-cols-3 gap-3 mt-5 text-sm"><div><p className="cr-label">Success</p>{chance}%</div><div><p className="cr-label">Failure</p>{100-chance}%</div><div><p className="cr-label">Gain per stat</p>+{safe?2:2*next*(1+risk*.5)}</div></div>
      <p className="text-xs text-muted-foreground mt-4">Cost: {next} Adaptive Shards{!safe&&protect?' + 1 Resonance Fragment':''}. Materials are consumed on failure too.</p><button className="cr-action mt-4" disabled={disabled || next>10 || !p.enchantments.length || quantity('adaptive_shard')<next || (!safe&&protect&&quantity('resonance_fragment')<1)} onClick={()=>act('overEnchant',{risk,useStabilizer:protect})}>{safe?'Enhance enchantment':'Over-enchant card'}</button>
    </section><section className="cr-panel"><p className="cr-label">Stability recovery · {p.over_enchant_stability}%</p><p className="text-sm text-muted-foreground my-3">Restore full stability for 3 Resonance Fragments, including corrupted or fractured cards.</p><button className="cr-action" disabled={busy || state.userCard.is_equipped || state.userCard.trade_status==='locked_in_trade' || p.over_enchant_stability>=100 || quantity('resonance_fragment')<3} onClick={()=>act('stabilize')}>Restore stability</button></section></div>;
}