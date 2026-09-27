import React,{useEffect,useState} from 'react';
import {base44} from '@/api/base44Client';
const unwrap=r=>r?.data??r;
export default function AvatarPracticeCombat(){
  const [fight,setFight]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[now,setNow]=useState(Date.now());
  async function command(action,data={}){
    setBusy(true);setError('');
    try{
      const result=unwrap(await base44.functions.invoke('combatDamage',{action,data:{...data,expected_revision:fight?.revision||0,request_id:crypto.randomUUID()}}));
      if(result?.error)throw new Error(result.error);
      setFight(result.encounter);setNow(result.server_time||Date.now());
    }catch(e){setError(e?.response?.data?.error||e.message||'Practice encounter unavailable.');}
    finally{setBusy(false);}
  }
  useEffect(()=>{void command('getState');},[]);
  useEffect(()=>{if(fight?.status!=='active')return;const timer=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(timer);},[fight?.status]);
  const active=fight?.status==='active', recovering=Number(fight?.next_action_at||0)>now;
  const health=(label,fighter)=><div><div className="mb-1 flex justify-between text-xs text-white/60"><span>{label}</span><span>{fighter.hp} / {fighter.stats.max_hp} HP</span></div><div role="progressbar" aria-label={`${label} health`} aria-valuemin={0} aria-valuemax={fighter.stats.max_hp} aria-valuenow={fighter.hp} className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-cyan-300 transition-all" style={{width:`${Math.max(0,fighter.hp/fighter.stats.max_hp)*100}%`}}/></div></div>;
  return <details className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
    <summary className="cursor-pointer font-semibold">Test your build · PvE practice</summary>
    <p className="my-3 text-xs leading-5 text-white/50">Fight a training sentinel at your avatar level using your equipped gear and Skill Book. Each practice freezes your current build. Practice does not award XP or items.</p>
    {error&&<p role="alert" className="my-3 text-sm text-rose-200">{error} <button type="button" onClick={()=>command('getState')} className="underline">Refresh encounter</button></p>}
    {!active&&<button disabled={busy} onClick={()=>command('start')} className="rounded-lg bg-cyan-100/10 px-4 py-2 text-sm text-cyan-100 disabled:opacity-40">{fight?.status==='won'?'Victory · Practice again':fight?.status==='lost'?'Defeated · Try a new build':'Start practice'}</button>}
    {fight?.player?.stats&&<div className="mt-4 space-y-3">{health('Your avatar',fight.player)}{health('Training sentinel',fight.enemy)}</div>}
    {active&&<div className="mt-4 flex flex-wrap gap-2"><button disabled={busy||recovering} onClick={()=>command('attack',{slot:-1})} className="rounded-lg bg-cyan-100/10 px-3 py-2 text-xs disabled:opacity-30">Basic attack</button>{(fight.skills||[]).map(skill=><button key={skill.slot} disabled={busy||recovering||Number(fight.cooldowns?.[skill.slot]||0)>now} onClick={()=>command('attack',{slot:skill.slot})} className="rounded-lg bg-violet-200/10 px-3 py-2 text-xs disabled:opacity-30">{skill.name}{Number(fight.cooldowns?.[skill.slot]||0)>now?` · ${Math.ceil((fight.cooldowns[skill.slot]-now)/1000)}s`:''}</button>)}<button disabled={busy} onClick={()=>command('abandon')} className="ml-auto px-3 py-2 text-xs text-white/50">End practice</button></div>}
    <ol aria-live="polite" aria-label="Practice combat log" className="mt-4 space-y-1 text-xs text-white/55">{(fight?.log||[]).slice(-6).map((hit,i)=><li key={`${fight.revision}-${i}`}>{hit.actor==='player'?'You':'Sentinel'} · {hit.missed?'Dodged':`${hit.damage} damage`}{hit.crit?' · Critical':''}</li>)}</ol>
  </details>;
}
