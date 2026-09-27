import React, { useState } from 'react';
import { Heart, Swords, Shield, Brain, Sparkles, Wind, Plus, RefreshCw } from 'lucide-react';
import useAvatarCombatStats from './useAvatarCombatStats';
import AvatarPracticeCombat from './AvatarPracticeCombat';
const pct=value=>`${(Number(value||0)*100).toFixed(1)}%`;
const attributes=[
  {key:'strength',label:'Strength',icon:Swords,effect:'+7 attack · +0.2% weapon attack'},
  {key:'defense',label:'Defense',icon:Shield,effect:'+8 armor · diminishing damage reduction'},
  {key:'vitality',label:'Vitality',icon:Heart,effect:'+25 maximum HP'},
  {key:'agility',label:'Agility',icon:Wind,effect:'+3 dodge rating · +0.2% attack speed'},
  {key:'intelligence',label:'Intelligence',icon:Brain,effect:'0.1% cooldown reduction · 40% total cap'},
  {key:'wisdom',label:'Wisdom',icon:Sparkles,effect:'+0.2% ability damage'},
];
export default function AvatarCombatStatsPanel() {
  const {state,isLoading,error,refetch,save,saving,saveError}=useAvatarCombatStats();
  const [count,setCount]=useState(1),[saved,setSaved]=useState('');
  if(isLoading)return <p role="status" className="p-6 text-sm text-white/60">Loading avatar combat stats…</p>;
  if(error||!state)return <div role="alert" className="rounded-2xl border border-rose-300/20 p-5 text-sm text-rose-100"><p>{error?.message||'Sign in to view your avatar.'}</p><button type="button" onClick={()=>refetch()} className="mt-3 flex items-center gap-2"><RefreshCw size={14}/>Try again</button></div>;
  const s=state.combat,p=state.progression,level=s.level,cap=state.rules.level_cap;
  const xp=Math.max(0,Number(p.global_xp||0)-(level-1)*state.rules.xp_per_level);
  const summaries=[
    ['Max HP',s.max_hp.toLocaleString()],['Attack',s.attack.toLocaleString()],['Armor',s.defense.toLocaleString()],
    ['Damage reduction',pct(s.damage_reduction)],['Dodge chance',pct(s.dodge_chance)],['Attack speed',`${s.attack_speed.toFixed(3)}×`],
    ['Cooldown reduction',pct(s.cooldown_reduction)],['Ability bonus',pct(s.ability_damage_bonus)],['Critical chance',pct(s.crit_chance)],
  ];
  async function allocate(key) {
    setSaved('');
    try { await save({data:{stat:key,points:count}});setSaved(`Saved ${count} point${count===1?'':'s'} to ${key}.`); } catch { /* shared error renders below */ }
  }
  return <section aria-label="Avatar combat stats" className="space-y-5 text-white">
    <div className="flex flex-wrap items-end justify-between gap-5 rounded-2xl border border-cyan-200/15 bg-cyan-200/[0.035] p-5">
      <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-100/60">AI avatar · Combat core</p><h2 className="mt-2 text-3xl font-bold">Level {level}<span className="ml-2 text-sm font-normal text-white/35">/ {cap}</span></h2><p className="mt-2 text-xs text-white/55">Avatar XP drives these stats. Driver level stays separate.</p></div>
      <div className="text-right"><p className="text-xs text-white/50">Available stat points</p><strong data-testid="available-stat-points" className="text-3xl text-cyan-200">{state.available}</strong><p className="text-[11px] text-white/45">+{state.rules.points_per_level} each avatar level</p></div>
      <div className="w-full"><div className="mb-2 flex justify-between text-xs text-white/50"><span>{level===cap?'Maximum avatar level':`${Math.min(xp,1000).toLocaleString()} / 1,000 XP`}</span><span>{level===cap?'':`${Math.max(0,1000-xp).toLocaleString()} XP to next level`}</span></div><div role="progressbar" aria-label="Avatar level progress" aria-valuemin={0} aria-valuemax={1000} aria-valuenow={level===cap?1000:Math.min(xp,1000)} className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-cyan-300" style={{width:`${level===cap?100:Math.min(100,xp/10)}%`}}/></div></div>
    </div>
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">{summaries.map(([label,value])=><div key={label} className="bg-[#0a111b] p-4"><p className="text-[11px] text-white/50">{label}</p><strong data-stat={label} className="mt-1 block text-xl tabular-nums">{value}</strong></div>)}</div>
    <p className="rounded-xl bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/55">Every level gained: <span className="text-white/85">+100 HP · +20 armor · +1 dodge rating · +0.3% attack speed.</span> Attack also grows with level so it keeps pace with health and armor.</p>
    <div className="flex items-end justify-between gap-4"><div><h3 className="font-semibold">Shape your build</h3><p className="mt-1 text-xs text-white/50">Effects below are per point. Equipment adds to your final stats.</p></div><label className="shrink-0 text-xs text-white/60">Points <select aria-label="Points per allocation" value={count} onChange={e=>setCount(Number(e.target.value))} className="ml-2 rounded-lg border border-white/15 bg-[#0a111b] p-2">{[1,5,10].map(n=><option key={n} value={n}>{n}</option>)}</select></label></div>
    {state.allocation_locked&&<p role="status" className="text-sm text-amber-200">Your combat build is locked until the match ends.</p>}
    {saveError&&<p role="alert" className="text-sm text-rose-200">{saveError.message}</p>}
    <p role="status" aria-live="polite" className="text-xs text-cyan-200">{saved}</p>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{attributes.map(({key,label,icon:Icon,effect})=><div key={key} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-cyan-200/70"/><h4 className="font-semibold">{label}</h4><span className="ml-auto font-mono text-lg" data-attribute={key}>{state.allocations[key]}</span></div><p className="mt-2 min-h-8 text-[11px] leading-4 text-white/55">{effect}</p><button type="button" aria-label={`Add ${count} to ${label}`} disabled={saving||state.available<count||state.allocation_locked} onClick={()=>allocate(key)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-100/10 py-2 text-xs text-cyan-100 transition hover:bg-cyan-100/20 disabled:cursor-not-allowed disabled:opacity-30"><Plus size={13}/>Add {count} · {count} point{count===1?'':'s'}</button></div>)}</div>
    <details className="rounded-xl border border-white/10 p-4 text-xs leading-6 text-white/55"><summary className="cursor-pointer font-semibold text-white/80">How cards, weapons, and defense work</summary><p className="mt-2">Only equipped gear adds passive stats. The first weapon slot is active; secondary weapons are swap choices. Card upgrades add to their base values, then avatar Strength, Wisdom, and Intelligence shape their combat output. Ability previews show damage before the opponent’s defenses and critical hits.</p><p>Armor blocks at most 70% of a hit. Dodge rating has diminishing returns and stays below 35%; accuracy counters it. Critical hits start at 5% chance and deal 1.5× damage. Attack speed shortens basic attack recovery; it does not grant extra PvP turns.</p></details>
    <AvatarPracticeCombat />
  </section>;
}
