import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Film, Play, Square, Plus, Save, Trash2, ChevronRight, GripVertical, CircleDot, RotateCcw, Bell, GitBranch } from 'lucide-react';

const STORAGE_KEY='atomxe_animation_montages_v2';
const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
const timecode=s=>{const n=Math.max(0,Number(s)||0);return `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}.${Math.floor((n%1)*10)}`;};
const clipsFor=o=>{if(!o)return[];const out=[],seen=new Set(),add=c=>{if(c&&!seen.has(c.uuid||c.name)){seen.add(c.uuid||c.name);out.push(c);}};(o.animations||[]).forEach(add);o.traverse?.(x=>(x.animations||[]).forEach(add));return out;};
function Button({children,onClick,active,danger=false,className=''}){return <button type="button" onClick={onClick} className={`rounded-lg border px-2 py-1.5 text-[9px] ${danger?'border-red-300/10 bg-red-400/10 text-red-100':active?'border-cyan-300/30 bg-cyan-300/10 text-cyan-100':'border-white/10 bg-white/[.035] text-white/65 hover:bg-white/[.07]'} ${className}`}>{children}</button>;}

export default function AnimationMontageEditor({selected,onClose}){
  const [montages,setMontages]=useState(()=>read(STORAGE_KEY,[]));
  const [montageId,setMontageId]=useState('');
  const [segments,setSegments]=useState([]);
  const [sections,setSections]=useState([{id:uid(),name:'Default',start:0,next:''}]);
  const [notifies,setNotifies]=useState([]);
  const [playhead,setPlayhead]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [loop,setLoop]=useState(false);
  const [slot,setSlot]=useState('Default');
  const [linkMode,setLinkMode]=useState('absolute');
  const [playRate,setPlayRate]=useState(1);
  const timelineRef=useRef(null),dragRef=useRef(null),mixerRef=useRef(null),actionRef=useRef(null),lastFrame=useRef(0),playheadRef=useRef(0);
  const clips=useMemo(()=>clipsFor(selected),[selected]);
  const duration=Math.max(1,segments.reduce((m,s)=>Math.max(m,s.start+s.duration),0));
  const active=montages.find(m=>m.id===montageId)||null;

  useEffect(()=>write(STORAGE_KEY,montages),[montages]);
  useEffect(()=>{playheadRef.current=playhead;},[playhead]);
  useEffect(()=>{if(!selected)return;const mixer=new THREE.AnimationMixer(selected);mixerRef.current=mixer;return()=>{mixer.stopAllAction();mixer.uncacheRoot(selected);if(mixerRef.current===mixer)mixerRef.current=null;};},[selected]);
  useEffect(()=>{if(!playing)return;let raf=0;const frame=now=>{const dt=Math.min(.05,(now-(lastFrame.current||now))/1000);lastFrame.current=now;let next=playheadRef.current+dt*(playRate||1);if(next>=duration){if(loop)next=0;else{next=duration;setPlaying(false);}}setPlayhead(next);mixerRef.current?.update(dt);raf=requestAnimationFrame(frame);};raf=requestAnimationFrame(frame);return()=>cancelAnimationFrame(raf);},[playing,duration,loop,playRate]);
  useEffect(()=>{if(!selected||!segments.length||!mixerRef.current)return;const seg=[...segments].reverse().find(s=>playhead>=s.start&&playhead<=s.start+s.duration);if(!seg)return;const clip=clips.find(c=>c.name===seg.clipName);if(!clip)return;const action=mixerRef.current.clipAction(clip);const local=Math.max(0,playhead-seg.start)*(seg.playRate||1);if(actionRef.current?.getClip?.().name!==clip.name){action.reset().setEffectiveWeight(1).setEffectiveTimeScale(seg.playRate||1).fadeIn(seg.blendIn||.1).play();actionRef.current?.fadeOut?.(seg.blendOut||.1);actionRef.current=action;}action.time=Math.min(clip.duration,local);},[playhead,segments,clips,selected]);

  const createMontage=()=>{const m={id:uid(),name:`montage.${montages.length+1}`,description:'',slot:'Default',loop:false,linkMode:'absolute',segments:[],sections:[{id:uid(),name:'Default',start:0,next:''}],notifies:[]};setMontages(v=>[...v,m]);setMontageId(m.id);setSegments([]);setSections(m.sections);setNotifies([]);setLoop(false);setSlot('Default');setLinkMode('absolute');};
  const openMontage=m=>{setMontageId(m.id);setSegments((m.segments||[]).map(s=>({...s})));setSections((m.sections||[{id:uid(),name:'Default',start:0,next:''}]).map(s=>({...s})));setNotifies((m.notifies||[]).map(n=>({...n})));setLoop(!!m.loop);setSlot(m.slot||'Default');setLinkMode(m.linkMode||'absolute');setPlayhead(0);setPlaying(false);};
  const saveMontage=()=>{if(!montageId)return;setMontages(v=>v.map(m=>m.id===montageId?{...m,slot,loop,linkMode,segments,sections,notifies}:m));window.dispatchEvent(new CustomEvent('atomXeAnimationMontageSaved',{detail:{id:montageId}}));};
  const addSegment=clip=>{if(!clip)return;const start=segments.reduce((m,s)=>Math.max(m,s.start+s.duration),0);setSegments(v=>[...v,{id:uid(),clipName:clip.name,start,duration:clip.duration,playRate:1,blendIn:.1,blendOut:.1,slot,section:'Default'}]);setPlayhead(start);};
  const addSegmentAt=(clip,at)=>{if(!clip)return;setSegments(v=>[...v,{id:uid(),clipName:clip.name,start:at,duration:clip.duration,playRate:1,blendIn:.1,blendOut:.1,slot,section:'Default'}]);setPlayhead(at);};
  const removeSegment=id=>setSegments(v=>v.filter(s=>s.id!==id));
  const updateSegment=(id,p)=>setSegments(v=>v.map(s=>s.id===id?{...s,...p}:s));
  const ratioAt=e=>{const r=timelineRef.current?.getBoundingClientRect();return r?Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)):0;};
  const moveSegment=(id,start)=>{const s=segments.find(x=>x.id===id);if(!s)return;updateSegment(id,{start:Math.max(0,Math.min(Math.max(0,duration-s.duration),start))});};
  const beginDrag=(e,s)=>{e.preventDefault();const r=timelineRef.current?.getBoundingClientRect();if(!r)return;dragRef.current={id:s.id,offset:ratioAt(e)*duration-s.start};};
  useEffect(()=>{const move=e=>{if(!dragRef.current)return;moveSegment(dragRef.current.id,ratioAt(e)*duration-dragRef.current.offset);};const up=()=>{dragRef.current=null;};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);};},[duration,segments]);
  const scrub=e=>setPlayhead(ratioAt(e)*duration);
  const dropClip=e=>{e.preventDefault();const name=e.dataTransfer.getData('application/x-atomxe-animation-clip');const clip=clips.find(c=>c.name===name);if(clip)addSegmentAt(clip,ratioAt(e)*duration);};
  const addSection=()=>setSections(v=>[...v,{id:uid(),name:`Section ${v.length+1}`,start:playhead,next:''}]);
  const addNotify=()=>setNotifies(v=>[...v,{id:uid(),name:'Notify',time:playhead,type:'event'}]);

  return <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/30 p-5 backdrop-blur-[2px]">
    <div className="flex h-[84vh] w-[84vw] max-w-[1500px] flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#070b13]/90 shadow-[0_30px_120px_rgba(0,0,0,.65)] backdrop-blur-3xl">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div><div className="text-[9px] uppercase tracking-[.3em] text-cyan-200/65">ANIMATION MONTAGE EDITOR</div><div className="text-sm font-semibold text-white">Animation sequences, sections, slots, timing and notifies</div></div><div className="flex gap-2"><Button onClick={()=>{setSegments([]);setNotifies([]);setPlayhead(0);setPlaying(false);}}><RotateCcw className="mr-1 inline h-3 w-3"/>Reset</Button><Button onClick={onClose}>Done</Button></div></header>
      <div className="min-h-0 flex-1 grid grid-cols-[23%_1fr_20%]">
        <aside className="min-h-0 overflow-y-auto border-r border-white/10 p-3">
          <div className="text-[9px] uppercase tracking-[.24em] text-white/40">Animations</div>
          <div className="mt-2 space-y-1">{clips.length?clips.map(c=><div key={c.name} draggable onDragStart={e=>e.dataTransfer.setData('application/x-atomxe-animation-clip',c.name)} onDoubleClick={()=>addSegment(c)} className="flex cursor-grab items-center gap-2 rounded-xl border border-white/10 bg-white/[.025] px-2 py-2 text-[9px] text-white/70"><GripVertical className="h-3 w-3 text-white/25"/><Film className="h-3 w-3 text-cyan-200/70"/><span className="min-w-0 flex-1 truncate">{c.name}</span><span className="text-white/25">{c.duration.toFixed(2)}s</span></div>):<div className="rounded-xl border border-dashed border-white/10 p-3 text-[9px] leading-4 text-white/35">Select an animated 3D model in the live world. Its existing clips appear here.</div>}</div>
          <div className="mt-5 text-[9px] uppercase tracking-[.24em] text-white/40">Montages</div>
          <Button onClick={createMontage} className="mt-2 w-full"><Plus className="mr-1 inline h-3 w-3"/>Create Montage</Button>
          <div className="mt-2 space-y-1">{montages.map(m=><button key={m.id} type="button" onClick={()=>openMontage(m)} className={`flex w-full items-center gap-2 rounded-xl border px-2 py-2 text-left text-[9px] ${m.id===montageId?'border-cyan-300/30 bg-cyan-300/10 text-cyan-100':'border-white/10 bg-white/[.025] text-white/65'}`}><ChevronRight className="h-3 w-3"/>{m.name}</button>)}</div>
        </aside>

        <main className="min-h-0 grid grid-rows-[70%_30%]">
          <section className="relative min-h-0 overflow-hidden bg-white/[.01]">
            <div className="absolute left-3 top-3 z-20 rounded-lg border border-white/10 bg-black/25 px-2 py-1 text-[8px] text-white/45">LIVE THREE.JS VIEW · {selected?.name||'No object selected'}</div>
            <div className="absolute right-3 top-3 z-20 flex gap-1"><Button active={playing} onClick={()=>{setPlaying(true);lastFrame.current=performance.now();}}><Play className="mr-1 inline h-3 w-3"/>Play</Button><Button onClick={()=>{setPlaying(false);actionRef.current?.stop?.();}}> <Square className="mr-1 inline h-3 w-3"/>Stop</Button></div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[9px] text-white/20">The existing world remains visible behind this workspace. Montage playback drives the selected model's Three.js AnimationMixer.</div>
          </section>

          <section className="min-h-0 border-t border-white/10 bg-black/25 p-3">
            <div className="flex items-center justify-between gap-2 pb-2"><div className="flex items-center gap-2"><span className="text-[9px] uppercase tracking-[.2em] text-white/40">Timeline</span><span className="text-[8px] text-white/25">{timecode(playhead)} / {timecode(duration)}</span></div><div className="flex gap-1"><Button onClick={addSection}><GitBranch className="mr-1 inline h-3 w-3"/>Section</Button><Button onClick={addNotify}><Bell className="mr-1 inline h-3 w-3"/>Notify</Button><Button active={loop} onClick={()=>setLoop(v=>!v)}>Loop</Button><select value={slot} onChange={e=>setSlot(e.target.value)} className="h-7 rounded-lg border border-white/10 bg-black/30 px-2 text-[8px] text-white"><option>Default</option><option>UpperBody</option><option>LowerBody</option><option>FullBody</option></select><select value={linkMode} onChange={e=>setLinkMode(e.target.value)} className="h-7 rounded-lg border border-white/10 bg-black/30 px-2 text-[8px] text-white"><option value="absolute">Absolute</option><option value="relative">Relative</option><option value="proportional">Proportional</option></select><Button active={!!montageId} onClick={saveMontage}><Save className="mr-1 inline h-3 w-3"/>Save</Button></div></div>
            <div ref={timelineRef} onPointerDown={e=>{if(e.target===timelineRef.current)scrub(e);}} onDoubleClick={e=>{if(clips[0])addSegmentAt(clips[0],ratioAt(e)*duration);}} onDragOver={e=>e.preventDefault()} onDrop={dropClip} className="relative h-[calc(100%-38px)] rounded-xl border border-white/10 bg-white/[.02]">
              <div className="absolute inset-x-0 top-0 h-5 border-b border-white/10 text-[7px] text-white/25">{Array.from({length:11},(_,i)=><span key={i} className="absolute top-1 -translate-x-1/2" style={{left:`${i*10}%`}}>{timecode(duration*i/10)}</span>)}</div>
              <div className="absolute inset-x-2 top-7 bottom-2">
                {sections.map(s=><div key={s.id} className="absolute top-0 bottom-0 w-px bg-violet-300/40" style={{left:`${s.start/duration*100}%`}} title={s.name}><div className="absolute -top-1 -translate-x-1/2 rounded bg-violet-300/15 px-1 text-[6px] text-violet-100">{s.name}</div></div>)}
                {notifies.map(n=><div key={n.id} className="absolute bottom-0 top-0 w-px bg-red-300/60" style={{left:`${n.time/duration*100}%`}} title={n.name}><div className="absolute bottom-0 -translate-x-1/2 rounded bg-red-300/15 px-1 text-[6px] text-red-100">{n.name}</div></div>)}
                {segments.map(s=><div key={s.id} onPointerDown={e=>beginDrag(e,s)} className="absolute top-7 h-9 cursor-grab rounded-lg border border-cyan-200/25 bg-cyan-300/10 px-2 active:cursor-grabbing" style={{left:`${s.start/duration*100}%`,width:`${Math.max(.7,s.duration/duration*100)}%`}}><div className="flex items-center gap-1 text-[8px] text-cyan-100"><GripVertical className="h-3 w-3"/><span className="truncate">{s.clipName}</span></div><div className="text-[6px] text-white/35">{s.slot} · {s.playRate.toFixed(2)}x · {linkMode}</div><button type="button" onPointerDown={e=>e.stopPropagation()} onClick={()=>removeSegment(s.id)} className="absolute right-1 top-1 text-white/35 hover:text-red-200"><Trash2 className="h-3 w-3"/></button></div>)}
                <div className="absolute bottom-0 top-0 w-px bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,.9)]" style={{left:`${playhead/duration*100}%`}}><div className="absolute -left-1.5 -top-1 h-3 w-3 rounded-full bg-cyan-200"/></div>
              </div>
            </div>
          </section>
        </main>

        <aside className="min-h-0 overflow-y-auto border-l border-white/10 p-3">
          <div className="text-[9px] uppercase tracking-[.24em] text-white/40">Saved Montage / Prefab</div>
          <div className="mt-2 rounded-2xl border border-white/10 bg-white/[.025] p-3"><input value={active?.name||''} onChange={e=>montageId&&setMontages(v=>v.map(m=>m.id===montageId?{...m,name:e.target.value}:m))} placeholder="montage.1" className="h-8 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[9px] text-white"/><textarea value={active?.description||''} onChange={e=>montageId&&setMontages(v=>v.map(m=>m.id===montageId?{...m,description:e.target.value}:m))} placeholder="Montage description" className="mt-2 h-16 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-[8px] text-white"/><div className="mt-2 grid grid-cols-2 gap-2 text-[8px] text-white/40"><div>Segments <b className="float-right text-white/70">{segments.length}</b></div><div>Duration <b className="float-right text-white/70">{duration.toFixed(2)}s</b></div><div>Slot <b className="float-right text-white/70">{slot}</b></div><div>Notifies <b className="float-right text-white/70">{notifies.length}</b></div></div></div>
          <div className="mt-5 text-[9px] uppercase tracking-[.24em] text-white/40">Sections</div>
          <div className="mt-2 space-y-1">{sections.map(s=><div key={s.id} className="rounded-xl border border-white/10 bg-white/[.02] p-2 text-[8px] text-white/55"><div className="flex items-center gap-1"><CircleDot className="h-3 w-3 text-violet-200/60"/>{s.name}</div><div className="mt-1 text-white/25">{timecode(s.start)} · next: {s.next||'none'}</div></div>)}</div>
          <div className="mt-5 text-[9px] uppercase tracking-[.24em] text-white/40">Element Timing</div>
          <div className="mt-2 rounded-xl border border-white/10 bg-white/[.02] p-2 text-[8px] leading-4 text-white/35">Absolute keeps events tied to the montage timeline. Relative keeps them tied to a segment. Proportional follows segment movement and scaling. Drag animation blocks to reorder and double-click the timeline to insert a clip.</div>
          {montageId&&<Button danger className="mt-3 w-full" onClick={()=>{setMontages(v=>v.filter(m=>m.id!==montageId));setMontageId('');setSegments([]);setSections([{id:uid(),name:'Default',start:0,next:''}]);setNotifies([]);}}>Delete Montage</Button>}
        </aside>
      </div>
    </div>
  </div>;
}
