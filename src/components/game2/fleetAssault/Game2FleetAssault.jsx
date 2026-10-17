import { useEffect, useReducer, useState } from 'react';
import { ArrowLeft, AudioLines, Check, ChevronRight, CircleHelp, Crosshair, Gauge, Radio, RotateCcw, Satellite, Shield, Ship, Swords, Zap } from 'lucide-react';
import FleetWorld from './FleetWorld';
import { FLEET_ROLES, commanderFocusDebuff, commanderMaxHP, currentObjective, dispatchFleetAction, getSecurityState, newFleetMatch } from './matchEngine';

const THEATERS=[
 {id:'orbit',name:'Orbital Fleet',icon:Ship,description:'Starfighters · shield bombardment'},
 {id:'boarding',name:'Ship Boarding',icon:Swords,description:'Jedi · bridge · reactor'},
 {id:'planet',name:'Planetary Front',icon:Satellite,description:'Ground invasion · comms relay'},
];
const COMMANDS={
 orbit:[{type:'TORPEDO',name:'Fire torpedo',hint:'Q · Strike shields / hull',icon:Crosshair},{type:'GO_BOARD',name:'Launch boarding party',hint:'B · Early boarding costs tickets',icon:Ship},{type:'GO_PLANET',name:'Deploy to surface',hint:'P · Secure fleet telemetry',icon:Satellite}],
 boarding:[{type:'CLEAR_GUARD',name:'Fight security',hint:'Q · Clear boarding troopers',icon:Crosshair},{type:'DEFEAT_JEDI',name:'Duel enemy Jedi',hint:'Q · Requires cleared corridor',icon:Swords},{type:'ATTACK_COMMANDER',name:'Strike commander',hint:'Q · Defeat Jedi first',icon:Zap},{type:'SABOTAGE',name:'Sabotage reactor',hint:'E · Clear guards first',icon:Gauge},{type:'GO_ORBIT',name:'Return to fleet',hint:'O · Orbital front',icon:Ship}],
 planet:[{type:'CLEAR_GROUND',name:'Fight invasion troops',hint:'Q · Deplete enemy reinforcements',icon:Crosshair},{type:'CAPTURE_RELAY',name:'Hack comms relay',hint:'E · Each hack adds 25%',icon:Satellite},{type:'GO_ORBIT',name:'Return to fleet',hint:'O · Use targeting telemetry',icon:Ship},{type:'GO_BOARD',name:'Join boarding party',hint:'B · Storm enemy flagship',icon:Swords}],
};
const styleBtn='rounded-xl border border-white/10 bg-white/[0.065] px-3 py-2 text-left text-xs transition hover:border-cyan-300/40 hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-35';
function Meter({label,value,color='cyan',suffix='%'}) {
 const bg=color==='red'?'from-rose-500 to-orange-400':color==='amber'?'from-yellow-500 to-amber-300':'from-cyan-600 to-cyan-300';
 return <div className="space-y-1.5">
  <div className="flex items-center justify-between text-[11px]"><span className="text-white/60">{label}</span><span className="font-mono tabular-nums text-white/90">{Math.round(value)}{suffix}</span></div>
  <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className={'h-full rounded-full bg-gradient-to-r '+bg+' transition-all duration-500'} style={{width:Math.max(0,Math.min(100,value))+'%'}} /></div>
 </div>;
}
export default function Game2FleetAssault({onExit}) {
 const [role,setRole]=useState('pilot'),[playing,setPlaying]=useState(false);
 const [match,dispatch]=useReducer(dispatchFleetAction,undefined,()=>newFleetMatch('pilot'));
 const [channel,setChannel]=useState('squad'),[message,setMessage]=useState(''),[showHelp,setShowHelp]=useState(false);
 const action=(type,extra={})=>dispatch({type,...extra});
 const theater=match.theater;
 const nextCombat=()=>theater==='orbit'?'TORPEDO':theater==='planet'?'CLEAR_GROUND':match.guards?'CLEAR_GUARD':match.jedi?'DEFEAT_JEDI':'ATTACK_COMMANDER';
 useEffect(()=>{
  if(!playing||match.status!=='active')return undefined;
  const onKey=e=>{
   if(e.repeat||e.target?.matches?.('input,textarea,select,button'))return;
   const commands={KeyB:'GO_BOARD',KeyP:'GO_PLANET',KeyO:'GO_ORBIT',KeyE:theater==='planet'?'CAPTURE_RELAY':'SABOTAGE',KeyQ:nextCombat()};
   if(commands[e.code]){e.preventDefault();action(commands[e.code]);}
  };
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 },[playing,match.status,theater,match.guards,match.jedi]);
 const begin=()=>{dispatch({type:'RESTART',role});setPlaying(true);};
 const security=getSecurityState(match.hull),hpCap=commanderMaxHP(match.hull);
 const unavailable=type=>type==='CLEAR_GUARD'&&!match.guards||type==='DEFEAT_JEDI'&&(!!match.guards||!match.jedi)||type==='ATTACK_COMMANDER'&&(!!match.guards||!!match.jedi)||type==='SABOTAGE'&&!!match.guards||type==='CAPTURE_RELAY'&&match.relay===100;
 const roleInfo=FLEET_ROLES.find(r=>r.id===role);
 if(!playing) return <div data-testid="game2-fleet-assault" className="absolute inset-0 overflow-y-auto bg-[#030713] text-white">
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_35%,rgba(22,86,139,0.24),transparent_55%)] pointer-events-none"/>
  <div className="relative mx-auto max-w-5xl px-5 py-8 sm:px-10 sm:py-12">
    <button onClick={onExit} className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white"><ArrowLeft size={15}/> Back to Game 2</button>
    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[.32em] text-cyan-300">NEW MODE · SINGLE-PLAYER PROTOTYPE</div>
    <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">FLEET <span className="text-cyan-300">ASSAULT</span></h1>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">A three-front battle for control of a hostile system. Strike a capital ship from orbit, lead a boarding party against Jedi defenders, and capture a planetary communications relay to turn the tide.</p>
    <div className="mt-8 grid gap-3 md:grid-cols-3">{THEATERS.map(({id,name,description,icon:Icon},i)=><div key={id} className="rounded-2xl border border-white/10 bg-white/[.045] p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-200"><Icon size={22}/></div>
      <div className="text-[10px] font-mono tracking-widest text-cyan-300/70">FRONT 0{i+1}</div>
      <div className="mt-1 font-bold">{name}</div><div className="mt-1 text-xs text-white/50">{description}</div>
    </div>)}</div>
    <div className="mt-8 text-[11px] font-semibold uppercase tracking-[.2em] text-white/45">Choose your tactical role</div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{FLEET_ROLES.map(r=><button key={r.id} onClick={()=>setRole(r.id)} aria-pressed={role===r.id} className={'rounded-xl p-4 text-left transition '+(role===r.id?'bg-cyan-300/15 ring-1 ring-cyan-300/65':'bg-white/[.045] ring-1 ring-white/10 hover:bg-white/10')}>
      <div className="flex items-center justify-between gap-3 text-sm font-semibold"><span>{r.name}</span>{role===r.id&&<Check size={16} className="text-cyan-200"/>}</div>
      <div className="mt-1 text-xs text-white/45">{r.description}</div></button>)}</div>
    <div className="mt-7 flex flex-wrap items-center gap-4">
      <button data-testid="fleet-deploy" onClick={begin} className="inline-flex items-center gap-3 rounded-xl bg-cyan-300 px-6 py-3.5 text-sm font-extrabold tracking-widest text-slate-950 hover:bg-cyan-200">DEPLOY AS {roleInfo?.name.toUpperCase()} <ChevronRight size={18}/></button>
      <div className="max-w-sm text-[11px] leading-relaxed text-amber-200/70">Offline gameplay prototype: roles have basic combat bonuses, but the full 50v50 networking, server-authoritative flight, and live WebRTC voice channels are not online yet.</div>
    </div>
  </div>
 </div>;
 return <div data-testid="game2-fleet-assault" className="absolute inset-0 flex flex-col overflow-hidden bg-[#030713] text-white">
  <header className="z-20 flex min-h-[62px] items-center justify-between gap-3 border-b border-white/10 bg-[#07121e]/95 px-3 sm:px-5">
   <div className="flex min-w-0 items-center gap-3"><button onClick={onExit} aria-label="Back to Game 2" className="rounded-lg p-2 text-white/70 hover:bg-white/10"><ArrowLeft size={17}/></button>
    <div><div className="text-[10px] font-bold tracking-[.22em] text-cyan-300">FLEET ASSAULT <span className="ml-1 text-amber-200/80">DEMO</span></div><div className="text-[11px] text-white/50">{FLEET_ROLES.find(r=>r.id===match.role)?.name} · Three-front operation</div></div></div>
   <div className="flex items-center gap-2"><button onClick={()=>setShowHelp(v=>!v)} className="rounded-lg p-2 text-white/50 hover:bg-white/10" aria-label="Controls"><CircleHelp size={17}/></button><button onClick={()=>{dispatch({type:'RESTART',role:match.role})}} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[11px] text-white/70 hover:bg-white/10"><RotateCcw size={13}/> Restart</button></div>
  </header>
  <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
   <section className="relative min-h-[280px] flex-1 overflow-hidden bg-[#020610]">
    <FleetWorld theater={theater} hull={match.hull} guards={match.guards} jedi={match.jedi} relay={match.relay}/>
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#020713]/55 via-transparent to-[#020713]/65"/>
    <div className="pointer-events-none absolute left-4 top-4 max-w-[85%] rounded-xl bg-slate-950/65 p-3 backdrop-blur-md sm:left-6 sm:top-6">
      <div className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-300">{THEATERS.find(t=>t.id===theater)?.name}</div>
      <div className="mt-1 max-w-md text-sm font-bold text-white">{currentObjective(match)}</div>
    </div>
    <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl bg-slate-950/65 px-3 py-2 text-[10px] leading-5 text-white/65 backdrop-blur-md sm:left-6">
      WASD / arrows: maneuver · Shift: boost · Q: attack · E: interact<br/>B: board · P: planet · O: orbit
    </div>
    {showHelp&&<div className="absolute inset-5 z-20 flex max-w-lg flex-col justify-center rounded-2xl border border-cyan-300/20 bg-[#071420]/95 p-6 text-sm shadow-2xl backdrop-blur-xl">
      <button onClick={()=>setShowHelp(false)} className="absolute right-4 top-3 text-white/60">Close ×</button>
      <h3 className="text-lg font-black">How to play Fleet Assault</h3>
      <p className="mt-3 text-white/65">Fly and move with WASD; boost with Shift. Use Q for the current combat action, E for mission interactions, B to board, P to land on the planet, or O to return to orbit. Tactical action buttons below work too.</p>
      <p className="mt-3 text-white/65">Destroy the flagship by torpedoes, destroy its reactor, defeat its Jedi commander, or eliminate enemy reinforcement tickets. Planetary relay control boosts torpedo damage; early boarding costs tickets.</p>
      <p className="mt-3 text-amber-200/70">This prototype uses simplified encounters and simulated communications, not live 100-player multiplayer or production Jedi animations.</p>
    </div>}
   </section>
   <aside className="z-10 w-full shrink-0 space-y-4 overflow-y-auto bg-[#07101b]/95 p-4 lg:w-[320px] lg:border-l lg:border-white/10 xl:w-[350px]">
     <div className="grid grid-cols-3 gap-1.5">{THEATERS.map(({id,name,icon:Icon})=><button key={id} onClick={()=>action(id==='orbit'?'GO_ORBIT':id==='boarding'?'GO_BOARD':'GO_PLANET')} aria-pressed={theater===id} className={'flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] font-semibold '+(theater===id?'bg-cyan-300/15 text-cyan-200 ring-1 ring-cyan-300/40':'bg-white/[.035] text-white/50 hover:bg-white/10')}><Icon size={16}/>{name.replace('Orbital ','').replace('Ship ','').replace('Planetary ','')}</button>)}</div>
     <div className="space-y-3 rounded-2xl bg-white/[.035] p-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/50"><Gauge size={14}/> Tactical telemetry</div>
      <Meter label="Enemy hull integrity" value={match.hull} color="red"/>
      <Meter label="Flagship shields" value={match.shields}/>
      <Meter label="Reactor stability" value={match.reactor} color="amber"/>
      <Meter label="Commander health" value={100*match.commanderHP/hpCap} color="red"/>
      <Meter label="Planetary comms control" value={match.relay}/>
      <div className="flex justify-between text-[10px] text-white/50"><span>Commander focus penalty <b className="text-amber-200">{commanderFocusDebuff(match.hull)}%</b></span><span>Turrets <b className="text-white/90">{security.turrets}%</b></span></div>
      <div className="flex justify-between text-[10px] text-white/50"><span>Friendly tickets: <b className="text-cyan-200">{match.tickets.friendly}</b></span><span>Enemy tickets: <b className="text-rose-200">{match.tickets.hostile}</b></span></div>
     </div>
     <div className="space-y-2">
      <div className="text-[10px] font-bold uppercase tracking-[.18em] text-white/50">Tactical actions</div>
      <div className="grid grid-cols-2 gap-2">{COMMANDS[theater].map(({type,name,hint,icon:Icon})=><button key={type} disabled={match.status!=='active'||unavailable(type)} onClick={()=>action(type)} className={styleBtn}>
       <Icon size={17} className="mb-2 text-cyan-300"/><span className="block font-semibold">{name}</span><span className="mt-1 block text-[10px] leading-snug text-white/45">{hint}</span>
      </button>)}</div>
     </div>
     <div className="rounded-2xl bg-white/[.035] p-3">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/50"><Radio size={14}/> Tactical communications</div>
      <div className="mt-3 flex gap-1">{['command','squad','proximity'].map(c=><button key={c} onClick={()=>setChannel(c)} aria-pressed={channel===c} className={'flex-1 rounded-lg py-1.5 text-[10px] capitalize '+(channel===c?'bg-cyan-300/15 text-cyan-200':'bg-white/[.04] text-white/50')}>{c}</button>)}</div>
      <form className="mt-2 flex gap-2" onSubmit={e=>{e.preventDefault();if(message.trim()){action('RADIO',{channel,message:message.trim()});setMessage('');}}}>
       <input aria-label="Tactical message" value={message} maxLength={130} onChange={e=>setMessage(e.target.value)} placeholder="Relay squad order…" className="min-w-0 flex-1 rounded-lg bg-black/20 px-2 py-2 text-[11px] text-white outline-none placeholder:text-white/25 focus:ring-1 focus:ring-cyan-300/50"/>
       <button type="submit" disabled={!message.trim()||match.status!=='active'} aria-label="Transmit tactical order" className="rounded-lg bg-cyan-300/15 px-3 text-cyan-200 disabled:opacity-35"><AudioLines size={16}/></button>
      </form>
      <p className="mt-2 text-[10px] text-white/35">Local tactical message feed only. Live voice routing is not connected.</p>
      <div className="mt-3 max-h-36 space-y-2 overflow-y-auto">{match.log.map((m,i)=><div key={match.turn+'-'+i} className="border-l-2 border-cyan-300/25 pl-2 text-[10px] leading-4 text-white/55"><span className="mr-1 uppercase tracking-wider text-cyan-300/65">{m.theater}</span>{m.text}</div>)}</div>
     </div>
   </aside>
  </div>
  {match.status!=='active'&&<div role="dialog" aria-modal="true" className="absolute inset-0 z-30 flex items-center justify-center bg-[#020610]/90 p-5 backdrop-blur-lg">
   <div className="max-w-lg rounded-3xl border border-cyan-300/25 bg-[#0a1926] p-8 text-center shadow-2xl">
    <Shield className="mx-auto h-11 w-11 text-cyan-300"/><div className="mt-4 text-xs font-bold uppercase tracking-[.24em] text-cyan-300">{match.status==='victory'?'Mission complete':'Mission failed'}</div>
    <div className="mt-2 text-2xl font-black">{match.victory||'The Fleet Has Fallen'}</div>
    <div className="mt-3 text-sm leading-6 text-white/55">Torpedoes fired: {match.actions.torpedoes} · Infantry victories: {match.actions.strikes} · Orders transmitted: {match.actions.broadcasts}</div>
    <div className="mt-6 flex justify-center gap-3"><button onClick={()=>action('RESTART',{role:match.role})} className="rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-bold text-slate-950">Play again</button><button onClick={onExit} className="rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold">Main menu</button></div>
   </div>
  </div>}
 </div>;
}
