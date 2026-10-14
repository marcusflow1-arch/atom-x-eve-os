import React,{useCallback,useEffect,useRef,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowLeft,CarFront,Flag,Music2,Play,Pause,SkipBack,Upload,Volume2,VolumeX,Film,SkipForward,RotateCcw,Gauge} from 'lucide-react';
import {createPageUrl} from '@/utils';
import Game3Scene from '@/components/game3/Game3Scene';
import { useRevoAvatar } from '@/components/onboarding/useRevoAvatar';
import mediaManifest from '@/components/game3/mediaManifest.json';
import {CARS,STORY_SCENES,makeRaceState,applyPerfectLaunch,shiftGear,activateGhost} from '@/components/game3/physics';

const TRACKS=mediaManifest.filter(item=>item.kind==='music');
const VIDEOS=mediaManifest.filter(item=>item.kind==='video');
const buttonBase='rounded-lg border px-3 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400';
const cardBase='rounded-2xl border border-white/10 bg-[#101c2c]/80 p-4';
const useUrlFile = () => {
 const [url,setUrl]=useState('');
 const last=useRef('');
 const select=(file)=>{
  if(last.current)URL.revokeObjectURL(last.current);
  const next=file?URL.createObjectURL(file):'';
  last.current=next; setUrl(next);
 };
 useEffect(()=>()=>{if(last.current)URL.revokeObjectURL(last.current);},[]);
 return [url,select];
};
function Starter({go}){
 return <svg viewBox="0 0 144 134" width="126" height="115" role="img" aria-label="Race starter holding two flags">
  <path d="M48 41Q72 8 95 43L98 82L45 80Z" fill="#1d2840"/>
  <circle cx="72" cy="37" r="16" fill="#d5a68f"/>
  <path d="M58 32Q51 8 73 15Q95 11 90 35Q79 25 59 33Z" fill="#13151f"/>
  <path d="M60 53L83 53L94 114H50Z" fill="#2b415c"/>
  <g style={{transformOrigin:'63px 58px',transform:go?'rotate(48deg)':'rotate(-18deg)',transition:'transform .45s'}}>
   <path d="M61 58L28 33" stroke="#d5a68f" strokeWidth="8" strokeLinecap="round"/>
   <path d="M28 33L10 7" stroke="#d8e8f0" strokeWidth="2"/>
   <path d="M10 7L38 7L23 28Z" fill="#11cfe0"/>
  </g>
  <g style={{transformOrigin:'82px 58px',transform:go?'rotate(-48deg)':'rotate(18deg)',transition:'transform .45s'}}>
   <path d="M82 58L116 34" stroke="#d5a68f" strokeWidth="8" strokeLinecap="round"/>
   <path d="M116 34L135 7" stroke="#d8e8f0" strokeWidth="2"/>
   <path d="M135 7L106 7L121 28Z" fill="#f5f5f5"/>
  </g>
 </svg>;
}
function Meter({title,value,color='#26e2ed',note}){
 return <div className="min-w-0"><div className="mb-1 flex justify-between gap-2 text-[10px] uppercase tracking-widest text-white/65"><span>{title}</span><span>{note}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-all" style={{width:String(Math.min(100,Math.max(0,value)))+'%',background:color}}/></div></div>;
}
function RaceHUD({data,gaugeStyle,slipColor,shiftColor,driverName}){
 const speed=Math.round(data.speed*2.23694);
 return <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
  <div className="w-[min(290px,54vw)] rounded-xl border border-white/10 bg-[#07121d]/75 p-3 backdrop-blur-lg">
   <div className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-cyan-200/80">Revo driver · {driverName || 'Saved avatar required'}</div>
   <div className="flex items-end justify-between gap-2">
    <div><div className="text-[10px] uppercase tracking-[.3em] text-white/45">{gaugeStyle==='classic'?'CLASSIC GAUGE':'VELOCITY'}</div><div className={'font-bold leading-none '+(gaugeStyle==='minimal'?'font-mono text-4xl':'text-5xl')} style={{color:gaugeStyle==='classic'?'#f3f4f6':'#ffffff'}}>{speed}<span className="ml-1 text-xs font-light text-white/50">MPH</span></div></div>
    <div className="text-right"><div className="text-[10px] text-white/50">GEAR</div><div className="text-4xl font-black text-cyan-300">{data.gear}</div></div>
   </div>
   <div className="mt-2 space-y-2">
    <Meter title="RPM · SHIFT AT 80–95%" value={data.rpm*100} color={data.rpm>0.77&&data.rpm<0.97?shiftColor:'#83a1b8'}/>
    <Meter title="NITROUS" value={data.nitrous} color="#ffa366"/>
    <Meter title={'SLIPSTREAM · STAGE '+data.slipLevel} value={data.slipSeconds/8*100} color={slipColor} note={data.slipLevel===2?'G TO PHASE':Math.round(data.slipSeconds*10)/10+' / 8 S'}/>
   </div>
  </div>
  <div className="text-right">
   <div className="mb-1 text-[10px] uppercase tracking-widest text-white/50">{Math.floor(data.distance)} / 1500 M</div>
   <div className="text-xs font-medium text-white/85">{data.jump>0?'AIRTIME · '+data.jump.toFixed(1)+' S':data.drift?'DRIFTING':data.ghost>0?'GHOST PHASE':'NIGHT RUN'}</div>
   <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-white/15"><div className="h-full bg-cyan-400" style={{width:Math.min(100,data.distance/1500*100)+'%'}}/></div>
  </div>
 </div>;
}
export default function Game3(){
 const navigate=useNavigate();
 const revo = useRevoAvatar('game3');
 const [tab,setTab]=useState('race');
 const [selectedCar,setSelectedCar]=useState('sls');
 const [paint,setPaint]=useState('#24c9e4');
 const [slipColor,setSlipColor]=useState('#37d8ff');
 const [shiftColor,setShiftColor]=useState('#a7f7f7');
 const [underglow,setUnderglow]=useState('#00d8ef');
 const [rimColor,setRimColor]=useState('#c3d0db');
 const [route,setRoute]=useState('city');
 const [winCount,setWinCount]=useState(()=>{try{return Math.max(0,Number(localStorage.getItem('game3-race-wins')||0));}catch{return 0;}});
 const countedFinish=useRef(false);
 const [gaugeStyle,setGaugeStyle]=useState('sport');
 const [modelUrls,setModelUrls]=useState({});
 const objectUrls=useRef([]);
 const [audioUrl,setAudioUrl]=useUrlFile();
 const [localVideoUrl,setLocalVideoUrl]=useUrlFile();
 const [selectedVideoUrl,setSelectedVideoUrl]=useState('');
 const videoUrl=selectedVideoUrl||localVideoUrl;
 const [soundName,setSoundName]=useState('');
 const [trackIndex,setTrackIndex]=useState(Math.max(0,TRACKS.findIndex(t=>t.title==='Set It Off.mp3')));
 const [musicVolume,setMusicVolume]=useState(0.85);
 const [isPlaying,setPlaying]=useState(false);
 const [muted,setMuted]=useState(false);
 const [storyIndex,setStoryIndex]=useState(-1);
 const [snapshot,setSnapshot]=useState(makeRaceState());
 const [count,setCount]=useState(null);
 const [introRev,setIntroRev]=useState(0);
 const [shakeEnabled,setShakeEnabled]=useState(true);
 const audio=useRef(null);
 const race=useRef(makeRaceState());
 const input=useRef({forward:false,back:false,left:false,right:false,drift:false,nitro:false,dodge:false,shakeEnabled:true});
 const goClock=useRef(0);const countdownTimer=useRef(null);const rev=useRef(0);
 const car=CARS.find(c=>c.id===selectedCar)||CARS[0];
 const scene=storyIndex>=0?STORY_SCENES[storyIndex]:null;
 const soundSource=audioUrl||TRACKS[trackIndex]?.url||'';
 const displayedTrack=soundName||TRACKS[trackIndex]?.title||'No song selected';
 const musicLevel=muted?0:(scene?scene.kind==='dialogue'?0.13:0.9:race.current.phase==='race'?0.78:0.5)*musicVolume*(snapshot.ghost>0?0.45:1);
 useEffect(()=>{
  input.current.shakeEnabled=shakeEnabled;
 },[shakeEnabled]);
 useEffect(()=>{
  if(!audio.current)return undefined;
  let handle;
  const mix=()=>{
   const player=audio.current;if(!player)return;
   player.volume+=(musicLevel-player.volume)*0.11;
  };
  handle=setInterval(mix,45);return()=>clearInterval(handle);
 },[musicLevel]);
 useEffect(()=>()=>{objectUrls.current.forEach(u=>URL.revokeObjectURL(u));clearInterval(countdownTimer.current);},[]);
 const loadCar=useCallback((id,file)=>{
  if(!file)return;
  const url=URL.createObjectURL(file);
  objectUrls.current.push(url);
  setModelUrls(old=>({...old,[id]:url}));
 },[]);
 useEffect(()=>{
  if(snapshot.phase==='finish'&&!countedFinish.current){
   countedFinish.current=true;
   setWinCount(previous=>{const next=previous+1;try{localStorage.setItem('game3-race-wins',String(next));}catch{}return next;});
  }
 },[snapshot.phase]);
 const restart=useCallback(()=>{
  countedFinish.current=false;
  clearInterval(countdownTimer.current);
  const s=makeRaceState();s.phase='countdown';
  race.current=s;setSnapshot({...s});setStoryIndex(-1);setTab('race');
  setCount(3);rev.current=0;setIntroRev(0);
  const start=performance.now();
  goClock.current=start+3200;
  countdownTimer.current=setInterval(()=>{
   const remaining=goClock.current-performance.now();
   if(remaining<=0){
    clearInterval(countdownTimer.current);setCount(0);
    applyPerfectLaunch(race.current,rev.current);
    setSnapshot({...race.current});
    setTimeout(()=>setCount(null),850);
   }else setCount(Math.min(3,Math.max(1,Math.ceil(remaining/1066.67))));
  },45);
 },[]);
 useEffect(()=>{
  const update=(event,down)=>{
   if(event.target&&['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
   const k=event.key.toLowerCase();
   const mapping={w:'forward',arrowup:'forward',s:'back',arrowdown:'back',a:'left',arrowleft:'left',d:'right',arrowright:'right',' ':'drift',n:'nitro'};
   if(mapping[k]){event.preventDefault();input.current[mapping[k]]=down;}
   if(!down||event.repeat)return;
   if(k==='e'){event.preventDefault();shiftGear(race.current);setSnapshot({...race.current});}
   if(k==='g'){event.preventDefault();activateGhost(race.current);setSnapshot({...race.current});}
   if(k==='n'&&(input.current.left||input.current.right))input.current.dodge=true;
  };
  const onDown=e=>update(e,true),onUp=e=>update(e,false);
  const blur=()=>{Object.keys(input.current).forEach(k=>{if(k!=='shakeEnabled')input.current[k]=false;});};
  window.addEventListener('keydown',onDown);window.addEventListener('keyup',onUp);window.addEventListener('blur',blur);
  return()=>{window.removeEventListener('keydown',onDown);window.removeEventListener('keyup',onUp);window.removeEventListener('blur',blur);};
 },[]);
 useEffect(()=>{
  if(race.current.phase!=='countdown')return undefined;
  const id=setInterval(()=>{rev.current=Math.min(1,Math.max(0,rev.current+(input.current.forward?0.023:-0.027)));setIntroRev(rev.current);},40);
  return()=>clearInterval(id);
 },[count]);
 const onAudioFile=(file)=>{if(!file)return;setAudioUrl(file);setSoundName(file.name);setPlaying(true);};
 const chooseTrack=(index)=>{setAudioUrl(null);setSoundName('');setTrackIndex((index+TRACKS.length)%TRACKS.length);setPlaying(true);};
 const skipTrack=(direction)=>chooseTrack(trackIndex+direction);
 const onVideoFile=(file)=>{if(file){setSelectedVideoUrl('');setLocalVideoUrl(file);}};
 const selectVideoTrack=(src)=>{setLocalVideoUrl(null);setSelectedVideoUrl(src);};
 useEffect(()=>{
  const a=audio.current;if(!a||!soundSource)return;
  a.load();
  if(isPlaying) a.play().catch(()=>setPlaying(false));
 // The track changes independently from the user's explicit play/pause intent.
 },[soundSource]);
 const toggleAudio=()=>{
  const a=audio.current;if(!a||!soundSource)return;
  if(a.paused)a.play().then(()=>setPlaying(true)).catch(()=>{});else{a.pause();setPlaying(false);}
 };
 const enterStory=()=>{setStoryIndex(0);setTab('story');};
 const advanceStory=()=>{
  if(storyIndex>=STORY_SCENES.length-1){setStoryIndex(-1);restart();}
  else setStoryIndex(v=>v+1);
 };
 const buttons=[{id:'race',title:'Race',Icon:Gauge},{id:'garage',title:'Garage',Icon:CarFront},{id:'story',title:'Story',Icon:Film},{id:'music',title:'Music',Icon:Music2}];
 return <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#060d17] text-white">
  <header className="z-20 flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#081321] px-3 sm:px-5">
   <button onClick={()=>navigate(createPageUrl('LunaTemplate'))} className={buttonBase+' flex items-center gap-1 border-white/15 bg-white/5 text-white/75 hover:bg-white/10'}><ArrowLeft size={15}/> Luna</button>
   <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold tracking-wider">GAME 3 <span className="text-cyan-300">/ NIGHT RUN</span></div><div className="hidden text-[10px] text-white/45 sm:block">Original street-racing prototype · Story / Garage / Race</div></div>
   <div className="hidden gap-1 sm:flex">{buttons.map(b=><button key={b.id} onClick={()=>setTab(b.id)} className={buttonBase+' flex items-center gap-1.5 '+(tab===b.id?'border-cyan-400/40 bg-cyan-400/20 text-cyan-200':'border-white/10 bg-white/5 text-white/60 hover:bg-white/10')}><b.Icon size={14}/>{b.title}</button>)}</div>
   <div className="hidden max-w-[225px] items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-1 md:flex"><button title="Previous song" aria-label="Previous song" onClick={()=>skipTrack(-1)} className="p-1 text-cyan-200"><SkipBack size={16}/></button><button title={isPlaying?'Pause':'Play'} aria-label={isPlaying?'Pause song':'Play song'} onClick={toggleAudio} className="p-1 text-cyan-200">{isPlaying?<Pause size={16}/>:<Play size={16}/>}</button><button title="Next song" aria-label="Next song" onClick={()=>skipTrack(1)} className="p-1 text-cyan-200"><SkipForward size={16}/></button><span title={displayedTrack} className="min-w-0 truncate text-[10px] text-white/60">{displayedTrack.replace(/\.mp3$/i,'')}</span></div>
   <button aria-label="Toggle music" onClick={()=>setMuted(x=>!x)} className="rounded-lg border border-white/10 p-2 text-cyan-200">{muted?<VolumeX size={17}/>:<Volume2 size={17}/>}</button>
  </header>
  <div className="flex shrink-0 gap-1 border-b border-white/10 bg-[#081321] p-2 sm:hidden">{buttons.map(b=><button key={b.id} onClick={()=>setTab(b.id)} className={'flex-1 rounded-lg px-2 py-2 text-xs '+(tab===b.id?'bg-cyan-500/20 text-cyan-300':'text-white/60')}>{b.title}</button>)}</div>
  <audio ref={audio} src={soundSource||undefined} preload="metadata" onEnded={()=>skipTrack(1)} onError={()=>setPlaying(false)}/>
  <div className="relative min-h-0 flex-1">
   <div className="absolute inset-0"><Game3Scene stateRef={race} inputRef={input} car={{...car,color:paint}} carSrc={modelUrls[car.id]||'/game3/models/'+car.file} route={route} customization={{slipColor,shiftColor,underglow,rimColor}} onSnapshot={setSnapshot}/></div>
   <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#03101a]/50 via-transparent to-[#03101a]/50"/>
   {snapshot.ghost>0&&<div className="pointer-events-none absolute inset-0 border-[7px] border-cyan-300/30 bg-black/10" style={{boxShadow:'inset 0 0 90px '+slipColor+'55'}}/>}
   {snapshot.perfectLanding>0&&<div className="pointer-events-none absolute left-1/2 top-1/4 -translate-x-1/2 text-xl font-black italic tracking-widest text-cyan-300">PERFECT LANDING + NITROUS</div>}
   {snapshot.damageFlash>0&&<div className="pointer-events-none absolute inset-0 bg-red-500/20"/>}
   {snapshot.perfectShift>0&&<div className="pointer-events-none absolute inset-y-10 left-0 w-1/3 opacity-50" style={{background:'linear-gradient(90deg,'+shiftColor+'88,transparent)'}}/>}
   {snapshot.shiftFlash>0&&<div className="pointer-events-none absolute left-1/2 top-[18%] -translate-x-1/2 whitespace-nowrap text-xl font-black italic tracking-[.15em]" style={{color:snapshot.shiftStatus==='PERFECT SHIFT'?shiftColor:'#ffffff'}}>{snapshot.launchStatus&&snapshot.raceTime<2?snapshot.launchStatus:snapshot.shiftStatus}</div>}
   {tab==='race'&&<React.Fragment>
    {snapshot.phase==='race'&&<RaceHUD data={snapshot} gaugeStyle={gaugeStyle} slipColor={slipColor} shiftColor={shiftColor} driverName={revo?.name}/>}
    {snapshot.phase==='idle'&&<div className="absolute left-1/2 top-1/2 w-[min(540px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-cyan-400/20 bg-[#081523]/90 p-6 text-center shadow-2xl backdrop-blur-xl">
     <p className="text-[11px] font-bold uppercase tracking-[.35em] text-cyan-300">The street is yours</p><h1 className="my-3 text-3xl font-black uppercase sm:text-5xl">Night Run</h1><p className="mb-5 text-sm text-slate-300">Two starter cars. An original racing story. Perfect starts, timed shifts, nitrous dodges, drifting and ghost slipstream. Your Luna/Revo AI avatar is your driver identity.</p>
     <div className="flex flex-wrap justify-center gap-2"><button onClick={restart} className={buttonBase+' flex items-center gap-2 border-cyan-300/50 bg-cyan-500/25 px-5 py-3 text-cyan-100'}><Play size={17}/> Start race</button><button onClick={enterStory} className={buttonBase+' border-white/20 bg-white/10 px-5 py-3'}>Story mode</button><button onClick={()=>setTab('garage')} className={buttonBase+' border-white/20 bg-white/10 px-5 py-3'}>Garage</button></div>
    </div>}
    {snapshot.phase==='countdown'&&<div className="absolute left-1/2 top-[32%] flex -translate-x-1/2 flex-col items-center rounded-2xl border border-white/10 bg-black/50 px-7 py-3 backdrop-blur-md">
     <Starter go={count===0}/><div className="flex gap-3 py-1">{['#eb465c','#ebba4a','#17dc7c'].map((c,i)=><span key={i} className="h-6 w-6 rounded-full border border-white/20" style={{background:i===(3-count)?c:'#1a2937',boxShadow:i===(3-count)?'0 0 20px '+c:'none'}}/>)}</div>
     <div className="text-6xl font-black italic text-white">{count===0?'GO!':count}</div>
     <div className="mt-2 text-center text-xs tracking-wide text-cyan-100/80">HOLD W OR ↑ TO REV · IDEAL LAUNCH 55–85%</div><div className="mt-2 h-2 w-52 overflow-hidden rounded-full bg-white/15"><div className="h-full bg-cyan-400" style={{width:introRev*100+'%'}}/></div>
    </div>}
    {snapshot.phase==='finish'&&<div className="absolute left-1/2 top-1/2 w-[min(480px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#081523]/95 p-6 text-center shadow-2xl"><Flag size={36} className="mx-auto text-cyan-300"/><h2 className="my-3 text-3xl font-black">FINISH LINE</h2><p className="mb-4 text-white/65">{snapshot.raceTime.toFixed(1)}s · Chapter 1 complete</p><button className={buttonBase+' bg-cyan-500/30'} onClick={restart}><RotateCcw size={14} className="inline"/> Race again</button></div>}
    <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-[10px] text-white/70 backdrop-blur"><div className="text-cyan-300">W/↑ ACCEL · S/↓ BRAKE · A/D STEER</div><div>E SHIFT · SPACE DRIFT · N NITRO · N + DIRECTION DODGE · G GHOST</div></div>
   </React.Fragment>}
   {tab==='garage'&&<div className="absolute inset-y-0 right-0 w-[min(500px,100%)] overflow-y-auto border-l border-white/10 bg-[#091522]/95 p-4 shadow-2xl backdrop-blur-xl">
     <div className="mb-3 flex items-center gap-2"><CarFront size={20} className="text-cyan-300"/><h2 className="text-xl font-bold">Garage / Collection</h2></div>
     <p className="mb-3 text-xs text-white/60">Your five supplied car models are installed. Win races to unlock the advanced vehicles. Collection progress is currently saved on this device.</p>
     <div className="mb-4 rounded-lg border border-cyan-300/20 bg-cyan-500/10 p-3 text-xs text-cyan-100">Race victories: <strong>{winCount}</strong> · Next unlock: {winCount>=3?'Collection complete':CARS[winCount+2]?.name||'Collection complete'}</div>
     <div className="space-y-2">{CARS.map((c,i)=>{const required=Math.max(0,i-1);const unlocked=!c.locked||winCount>=required;return <div key={c.id} className={'rounded-xl border p-3 '+(car.id===c.id?'border-cyan-400/60 bg-cyan-500/10':'border-white/10 bg-white/5')}>
       <button disabled={!unlocked} className="w-full text-left disabled:opacity-50" onClick={()=>setSelectedCar(c.id)}>
         <div className="flex items-center justify-between gap-2"><span className="font-semibold">{c.name}</span><span className="text-[10px] text-cyan-300">{car.id===c.id?'SELECTED':unlocked?'AVAILABLE':required+' RACE '+(required===1?'WIN':'WINS')}</span></div>
         <div className="mt-1 text-[10px] text-white/50">Acceleration {Math.round(c.accel*100)} · Handling {Math.round(c.handling*100)} · Provided 3D asset</div>
       </button>
       <label className="mt-2 inline-flex cursor-pointer items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white/75"><Upload size={12}/>{modelUrls[c.id]?'Restore personal imported model':'Replace supplied model'}<input aria-label={'Import '+c.name+' model'} type="file" accept=".glb,.gltf,.fbx" className="hidden" onChange={e=>loadCar(c.id,e.target.files?.[0])}/></label>
     </div>;})}</div>
     <div className={cardBase+' mt-4'}>
       <h3 className="mb-3 text-sm font-semibold">Paint / Effect customization</h3>
       {[[paint,setPaint,'Car paint'],[rimColor,setRimColor,'Rim color'],[underglow,setUnderglow,'Neon underglow'],[slipColor,setSlipColor,'Slipstream aura'],[shiftColor,setShiftColor,'Perfect Shift airflow']].map(([value,setter,label])=><label key={label} className="mb-2 flex items-center justify-between gap-3 text-xs text-white/70">{label}<input type="color" value={value} onChange={e=>setter(e.target.value)} className="h-8 w-14 cursor-pointer rounded border-0 bg-transparent"/></label>)}
       <label className="mt-3 flex items-center justify-between gap-3 text-xs text-white/70">Speedometer style<select value={gaugeStyle} onChange={e=>setGaugeStyle(e.target.value)} className="rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-xs"><option value="sport">Sport</option><option value="classic">Classic</option><option value="minimal">Digital</option></select></label>
       <p className="mt-3 text-[11px] text-white/40">Car-paint and rim tint apply where the model exposes separately named materials. Physical bumpers and custom vinyl placements require separate meshes or a UV editing workflow.</p>
     </div>
     <div className={cardBase+' mt-4'}><h3 className="mb-2 text-sm font-semibold">Race route / Environment</h3>
       <select value={route} onChange={e=>setRoute(e.target.value)} className="w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-sm"><option value="city">City Night · Arcade Test Course</option><option value="dam">Glen Canyon Dam · Supplied Environment Preview</option></select>
       <p className="mt-2 text-[11px] text-white/50">Dam model and textures are included. Its precise road/collision layout still needs authoring before it can become a complete course.</p>
     </div>
   </div>}
   {tab==='story'&&<div className="absolute inset-0 flex items-center justify-center bg-[#030813]/65 p-4 backdrop-blur-md">
     <div className="w-[min(700px,100%)] rounded-2xl border border-cyan-300/20 bg-[#081522]/95 p-5 shadow-2xl sm:p-8">
       <div className="mb-3 flex items-center gap-2 text-xs tracking-widest text-cyan-300"><Film size={16}/> ORIGINAL STORY MODE</div>
       {scene?<><p className="text-xs uppercase tracking-widest text-white/45">Scene {storyIndex+1} of {STORY_SCENES.length} · {scene.kind==='dialogue'?'Dialogue · music soft':'Cinematic · music louder'}</p>
         <h2 className="my-4 text-2xl font-black">{scene.title}</h2><p className="mb-2 text-sm font-bold text-cyan-300">{scene.speaker}</p><p className="min-h-[120px] text-base leading-relaxed text-slate-200 sm:text-lg">{scene.text}</p>
         <div className="flex flex-wrap gap-2"><button className={buttonBase+' bg-cyan-500/25'} onClick={advanceStory}><SkipForward size={14} className="inline"/> {storyIndex===STORY_SCENES.length-1?'Launch chapter race':'Next scene'}</button><button onClick={()=>{setStoryIndex(-1);setTab('race');}} className={buttonBase+' bg-white/5'}>Close story</button></div>
       </>:<><h2 className="mb-3 text-3xl font-black">An original racing story</h2><p className="mb-5 text-sm leading-relaxed text-slate-300">Meet the crew, find the first starting line, and discover why the city’s fastest racers leave ghostly trails. The music rises for cinematic narration and smoothly ducks whenever characters speak.</p>
         <button className={buttonBase+' bg-cyan-500/25'} onClick={()=>setStoryIndex(0)}><Play size={14} className="inline"/> Begin prologue</button></>}
       {videoUrl&&<video controls src={videoUrl} className="mt-4 max-h-44 w-full rounded-lg"/>}
     </div>
   </div>}
   {tab==='music'&&<div className="absolute inset-y-0 right-0 w-[min(520px,100%)] overflow-y-auto border-l border-white/10 bg-[#091522]/95 p-5 backdrop-blur-xl">
    <div className="mb-3 flex items-center gap-2"><Music2 size={19} className="text-cyan-300"/><h2 className="text-xl font-bold">Music / Cinematic audio</h2></div>
    <p className="mb-4 text-xs text-white/60">Choose from your imported playlist, skip tracks during a race, and control volume. Music rises for cinematics and ducks softly beneath conversations.</p>
    <div className={cardBase+' space-y-3'}>
      <p className="truncate text-sm font-semibold text-cyan-200" title={displayedTrack}>{displayedTrack.replace(/\\.mp3$/i,'')}</p>
      <div className="flex justify-center gap-3">
        <button aria-label="Previous song" onClick={()=>skipTrack(-1)} className={buttonBase+' border-white/15 bg-white/10'}><SkipBack size={17}/></button>
        <button aria-label={isPlaying?'Pause music':'Play music'} onClick={toggleAudio} className={buttonBase+' border-cyan-300/50 bg-cyan-400/20 px-6'}>{isPlaying?<Pause size={19}/>:<Play size={19}/>}</button>
        <button aria-label="Next song" onClick={()=>skipTrack(1)} className={buttonBase+' border-white/15 bg-white/10'}><SkipForward size={17}/></button>
      </div>
      <label className="flex items-center justify-between gap-3 text-xs text-white/70">Music volume <input aria-label="Music volume" type="range" min="0" max="100" value={Math.round(musicVolume*100)} onChange={e=>setMusicVolume(Number(e.target.value)/100)} className="w-2/3 accent-cyan-400"/></label>
      <Meter title="Active audio mix" value={musicLevel*100} note={scene?.kind==='dialogue'?'Dialogue ducking':scene?'Cinematic':race.current.phase==='race'?'Driving':'Menu'}/>
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs"><Upload size={15}/> Play a personal local file instead <input type="file" accept="audio/*,.mp3" className="hidden" onChange={e=>onAudioFile(e.target.files?.[0])}/></label>
    </div>
    <h3 className="mb-2 mt-5 text-sm font-semibold">Imported playlist · {TRACKS.length} songs</h3>
    <div className="space-y-1">{TRACKS.map((track,i)=><button type="button" key={track.url} onClick={()=>chooseTrack(i)} className={'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-xs transition '+(!audioUrl&&trackIndex===i?'border-cyan-400/50 bg-cyan-400/15 text-cyan-100':'border-transparent bg-white/5 text-white/70 hover:bg-white/10')}>
      <span className="font-mono text-cyan-400">{String(i+1).padStart(2,'0')}</span><span className="min-w-0 flex-1 truncate">{track.title.replace(/\\.mp3$/i,'')}</span>{!audioUrl&&trackIndex===i?<Music2 size={14}/>:<Play size={12}/>}
    </button>)}</div>
    <h3 className="mb-2 mt-5 text-sm font-semibold">Reference cinematics</h3>
    <div className="flex flex-wrap gap-2">{VIDEOS.map((video,i)=><button key={video.url} onClick={()=>selectVideoTrack(video.url)} className={buttonBase+' border-white/15 bg-white/5'}>Video {i+1}</button>)}</div>
    <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs"><Film size={15}/> Load another local video <input type="file" accept="video/*,.mp4" className="hidden" onChange={e=>onVideoFile(e.target.files?.[0])}/></label>
    {videoUrl&&<video src={videoUrl} controls className="mt-3 w-full rounded-lg" />}
    <p className="mt-4 text-[11px] text-white/40">Provided commercial recordings are for private prototyping. Obtain appropriate rights before releasing the soundtrack publicly.</p>
    <label className="mt-4 flex items-center gap-2 text-xs text-white/60"><input type="checkbox" checked={shakeEnabled} onChange={e=>setShakeEnabled(e.target.checked)}/> Allow high-speed camera shake</label>
   </div>}
  </div>
 </main>;
}
