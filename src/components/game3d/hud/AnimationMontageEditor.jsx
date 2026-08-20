import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Film, Play, Square, Plus, Save, Trash2, ChevronRight, GripVertical, CircleDot, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'atomxe_animation_montages_v1';
const DEFAULT_BLEND = { blendIn: 0.1, blendOut: 0.1 };

const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const loadJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const saveJSON = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

function collectClips(object) {
  if (!object) return [];
  const clips = [];
  const seen = new Set();
  const add = clip => {
    if (!clip || seen.has(clip.uuid || clip.name)) return;
    seen.add(clip.uuid || clip.name);
    clips.push(clip);
  };
  (object.animations || []).forEach(add);
  object.traverse?.(child => (child.animations || []).forEach(add));
  return clips;
}

function formatTime(value) {
  const n = Math.max(0, Number(value) || 0);
  return `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}.${String(Math.floor((n % 1) * 10))}`;
}

function GlassButton({ children, onClick, active, danger, className = '' }) {
  return <button type="button" onClick={onClick} className={`rounded-lg border px-2 py-1.5 text-[9px] transition ${danger ? 'border-red-300/10 bg-red-400/10 text-red-100' : active ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/[.035] text-white/60 hover:bg-white/[.07] hover:text-white'} ${className}`}>{children}</button>;
}

export default function AnimationMontageEditor({ selected, onClose }) {
  const [montages, setMontages] = useState(() => loadJSON(STORAGE_KEY, []));
  const [selectedMontageId, setSelectedMontageId] = useState('');
  const [segments, setSegments] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [slot, setSlot] = useState('Default');
  const [sectionMode, setSectionMode] = useState('Default');
  const [elementsTo, setElementsTo] = useState('absolute');
  const [mixer, setMixer] = useState(null);
  const [version, setVersion] = useState(0);
  const animationMixerRef = useRef(null);
  const activeActionRef = useRef(null);
  const lastTickRef = useRef(0);
  const dragRef = useRef(null);
  const timelineRef = useRef(null);

  const clips = useMemo(() => collectClips(selected), [selected, version]);
  const duration = Math.max(1, segments.reduce((end, segment) => Math.max(end, segment.start + segment.duration), 0));
  const activeMontage = montages.find(m => m.id === selectedMontageId) || null;

  useEffect(() => saveJSON(STORAGE_KEY, montages), [montages]);

  useEffect(() => {
    if (!selected) return;
    const nextMixer = new THREE.AnimationMixer(selected);
    animationMixerRef.current = nextMixer;
    setMixer(nextMixer);
    return () => {
      nextMixer.stopAllAction();
      nextMixer.uncacheRoot(selected);
      if (animationMixerRef.current === nextMixer) animationMixerRef.current = null;
    };
  }, [selected]);

  useEffect(() => {
    if (!playing || !selected || !segments.length) return;
    let raf = 0;
    const tick = now => {
      const previous = lastTickRef.current || now;
      lastTickRef.current = now;
      const delta = Math.min(0.05, (now - previous) / 1000);
      const next = cursor + delta;
      if (next >= duration) {
        if (loop) {
          setCursor(0);
          lastTickRef.current = now;
        } else {
          setCursor(duration);
          setPlaying(false);
        }
      } else {
        setCursor(next);
      }
      animationMixerRef.current?.update(delta);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, cursor, duration, loop, selected, segments.length]);

  useEffect(() => {
    if (!selected || !segments.length) return;
    const segment = [...segments].reverse().find(item => cursor >= item.start && cursor <= item.start + item.duration);
    if (!segment) return;
    const clip = clips.find(item => item.name === segment.clipName);
    if (!clip || !animationMixerRef.current) return;
    const mixerInstance = animationMixerRef.current;
    const action = mixerInstance.clipAction(clip);
    const localTime = Math.max(0, cursor - segment.start) * (segment.playRate || 1);
    if (activeActionRef.current?.getClip?.().name !== clip.name) {
      const previous = activeActionRef.current;
      action.reset().setEffectiveTimeScale(segment.playRate || 1).setEffectiveWeight(1).fadeIn(segment.blendIn ?? DEFAULT_BLEND.blendIn).play();
      if (previous) previous.fadeOut(segment.blendOut ?? DEFAULT_BLEND.blendOut);
      activeActionRef.current = action;
    }
    action.time = Math.min(clip.duration, localTime);
  }, [cursor, segments, clips, selected]);

  const createMontage = () => {
    const nextIndex = montages.length + 1;
    const montage = { id: uid(), name: `montage.${nextIndex}`, description: '', slot: 'Default', loop: false, elementsTo: 'absolute', sections: [{ id: uid(), name: 'Default', start: 0, next: '' }], segments: [], notifies: [] };
    setMontages(current => [...current, montage]);
    setSelectedMontageId(montage.id);
    setSegments([]);
    setSlot('Default');
    setLoop(false);
    setElementsTo('absolute');
  };

  const saveCurrentMontage = () => {
    if (!selectedMontageId) return;
    setMontages(current => current.map(m => m.id === selectedMontageId ? { ...m, slot, loop, elementsTo, segments, sections: m.sections?.length ? m.sections : [{ id: uid(), name: 'Default', start: 0, next: '' }] } : m));
    window.dispatchEvent(new CustomEvent('atomXeAnimationMontageSaved', { detail: { id: selectedMontageId } }));
  };

  const openMontage = montage => {
    setSelectedMontageId(montage.id);
    setSegments((montage.segments || []).map(segment => ({ ...segment })));
    setSlot(montage.slot || 'Default');
    setLoop(!!montage.loop);
    setElementsTo(montage.elementsTo || 'absolute');
    setCursor(0);
    setPlaying(false);
  };

  const addSegment = clip => {
    if (!clip) return;
    const lastEnd = segments.reduce((end, item) => Math.max(end, item.start + item.duration), 0);
    const segment = { id: uid(), clipName: clip.name, start: lastEnd, duration: clip.duration, playRate: 1, blendIn: 0.1, blendOut: 0.1, slot, damage: 0, section: sectionMode };
    setSegments(current => [...current, segment]);
    setCursor(lastEnd);
  };

  const updateSegment = (id, patch) => setSegments(current => current.map(segment => segment.id === id ? { ...segment, ...patch } : segment));
  const removeSegment = id => setSegments(current => current.filter(segment => segment.id !== id));

  const moveSegment = (id, nextStart) => {
    const segment = segments.find(item => item.id === id);
    if (!segment) return;
    const maxStart = Math.max(0, duration - segment.duration);
    updateSegment(id, { start: Math.min(maxStart, Math.max(0, nextStart)) });
  };

  const onTimelinePointerMove = event => {
    if (!dragRef.current || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    moveSegment(dragRef.current.id, ratio * duration - dragRef.current.offset);
  };

  const stopDrag = () => { dragRef.current = null; window.removeEventListener('pointermove', onTimelinePointerMove); window.removeEventListener('pointerup', stopDrag); };

  const startDrag = (event, segment) => {
    event.preventDefault();
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    dragRef.current = { id: segment.id, offset: ratio * duration - segment.start };
    window.addEventListener('pointermove', onTimelinePointerMove);
    window.addEventListener('pointerup', stopDrag, { once: true });
  };

  const doubleClickTimeline = event => {
    if (!timelineRef.current || !clips.length) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const at = Math.min(duration, Math.max(0, ((event.clientX - rect.left) / rect.width) * duration));
    const clip = clips[0];
    const segment = { id: uid(), clipName: clip.name, start: at, duration: clip.duration, playRate: 1, blendIn: .1, blendOut: .1, slot, damage: 0, section: sectionMode };
    setSegments(current => [...current, segment]);
    setCursor(at);
  };

  const scrub = event => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    setCursor(Math.min(duration, Math.max(0, ((event.clientX - rect.left) / rect.width) * duration)));
  };

  return <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/35 p-6 backdrop-blur-[3px]">
    <div className="flex h-[82vh] w-[82vw] max-w-[1500px] flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#080c14]/92 shadow-[0_30px_120px_rgba(0,0,0,.65)] backdrop-blur-3xl">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div><div className="text-[9px] uppercase tracking-[.3em] text-cyan-200/65">ANIMATION MONTAGE EDITOR</div><div className="text-sm font-semibold text-white">Compose, blend, chain and preview animations</div></div>
        <div className="flex items-center gap-2"><GlassButton onClick={() => { setSegments([]); setCursor(0); setPlaying(false); }}><RotateCcw className="mr-1 inline h-3 w-3"/>Reset Timeline</GlassButton><GlassButton onClick={onClose}>Done</GlassButton></div>
      </div>

      <div className="min-h-0 flex-1 grid grid-cols-[25%_1fr_20%]">
        <aside className="min-h-0 overflow-y-auto border-r border-white/10 p-3">
          <div className="mb-2 text-[9px] uppercase tracking-[.24em] text-white/40">Animations</div>
          <div className="space-y-1">
            {clips.length ? clips.map(clip => <div key={clip.name} draggable onDragStart={event => event.dataTransfer.setData('application/x-atomxe-animation-clip', clip.name)} className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.025] px-2 py-2 text-[9px] text-white/70 hover:bg-white/[.06]" onDoubleClick={() => addSegment(clip)}><GripVertical className="h-3 w-3 text-white/25"/><Film className="h-3 w-3 text-cyan-200/70"/><span className="min-w-0 flex-1 truncate">{clip.name}</span><span className="text-white/25">{clip.duration.toFixed(2)}s</span></div>) : <div className="rounded-xl border border-dashed border-white/10 p-3 text-[9px] leading-4 text-white/35">Select a 3D character or model with animation clips. Double-click a clip to place it on the montage.</div>}
          </div>
          <div className="mb-2 mt-5 text-[9px] uppercase tracking-[.24em] text-white/40">Montages</div>
          <GlassButton onClick={createMontage} className="mb-2 w-full text-center"><Plus className="mr-1 inline h-3 w-3"/>Create Montage</GlassButton>
          <div className="space-y-1">
            {montages.map(montage => <button key={montage.id} type="button" onClick={() => openMontage(montage)} className={`flex w-full items-center gap-2 rounded-xl border px-2 py-2 text-left text-[9px] ${selectedMontageId===montage.id?'border-cyan-300/30 bg-cyan-300/10 text-cyan-100':'border-white/10 bg-white/[.025] text-white/65'}`}><ChevronRight className="h-3 w-3"/><span className="truncate">{montage.name}</span></button>)}
          </div>
        </aside>

        <main className="min-h-0 grid grid-rows-[70%_30%]">
          <section className="relative min-h-0 overflow-hidden bg-[radial-gradient(circle_at_50%_30%,rgba(34,211,238,.09),transparent_45%),linear-gradient(180deg,rgba(255,255,255,.025),rgba(0,0,0,.12))]">
            <div className="absolute left-3 top-3 z-10 rounded-lg border border-white/10 bg-black/25 px-2 py-1 text-[8px] text-white/45">LIVE VIEW · {selected?.name || 'No object selected'}</div>
            <div className="absolute right-3 top-3 z-10 flex gap-1"><GlassButton active={playing} onClick={() => { setPlaying(true); lastTickRef.current = performance.now(); }}><Play className="mr-1 inline h-3 w-3"/>Play</GlassButton><GlassButton onClick={() => { setPlaying(false); activeActionRef.current?.stop?.(); }}><Square className="mr-1 inline h-3 w-3"/>Stop</GlassButton></div>
            <div className="flex h-full items-center justify-center text-center text-[10px] text-white/35"><div><Film className="mx-auto mb-2 h-10 w-10 text-cyan-200/25"/><div>{selected ? 'The existing Three.js model is the live montage preview.' : 'Select a model in the live world to preview its animations.'}</div></div></div>
          </section>
          <section className="min-h-0 border-t border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-2 pb-2">
              <div className="flex items-center gap-2"><span className="text-[9px] uppercase tracking-[.2em] text-white/40">Timeline</span><span className="text-[8px] text-white/25">{formatTime(cursor)} / {formatTime(duration)}</span></div>
              <div className="flex items-center gap-1"><GlassButton active={loop} onClick={() => setLoop(v=>!v)}>Loop</GlassButton><select value={slot} onChange={e=>setSlot(e.target.value)} className="h-7 rounded-lg border border-white/10 bg-black/30 px-2 text-[8px] text-white"><option>Default</option><option>UpperBody</option><option>LowerBody</option><option>FullBody</option></select><select value={elementsTo} onChange={e=>setElementsTo(e.target.value)} className="h-7 rounded-lg border border-white/10 bg-black/30 px-2 text-[8px] text-white"><option value="absolute">Absolute</option><option value="relative">Relative</option><option value="proportional">Proportional</option></select><GlassButton active={!!selectedMontageId} onClick={saveCurrentMontage}><Save className="mr-1 inline h-3 w-3"/>Save</GlassButton></div>
            </div>
            <div ref={timelineRef} className="relative h-[calc(100%-36px)] rounded-xl border border-white/10 bg-white/[.02]" onDoubleClick={doubleClickTimeline} onPointerDown={event => { if (event.target === timelineRef.current) scrub(event); }}>
              <div className="absolute inset-x-0 top-0 h-5 border-b border-white/10 bg-black/20 text-[7px] text-white/25">{Array.from({length:11},(_,i)=><span key={i} className="absolute top-1 -translate-x-1/2" style={{left:`${i*10}%`}}>{formatTime(duration*i/10)}</span>)}</div>
              <div className="absolute inset-x-2 top-7 bottom-2">
                <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
                {segments.map(segment => <div key={segment.id} onPointerDown={event=>startDrag(event,segment)} className="absolute top-2 h-10 cursor-grab rounded-lg border border-cyan-200/25 bg-cyan-300/10 px-2 shadow-lg active:cursor-grabbing" style={{left:`${segment.start/duration*100}%`,width:`${Math.max(.5,segment.duration/duration*100)}%`}}><div className="flex items-center gap-1 text-[8px] text-cyan-100"><GripVertical className="h-3 w-3"/><span className="truncate">{segment.clipName}</span></div><div className="mt-1 text-[7px] text-white/35">{segment.section || 'Default'} · {segment.playRate.toFixed(2)}x</div><button type="button" onPointerDown={e=>e.stopPropagation()} onClick={()=>removeSegment(segment.id)} className="absolute right-1 top-1 text-white/30 hover:text-red-200"><Trash2 className="h-3 w-3"/></button></div>)}
                <div className="absolute top-0 bottom-0 w-px bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,.8)]" style={{left:`${cursor/duration*100}%`}}><div className="absolute -left-1.5 -top-1 h-3 w-3 rounded-full bg-cyan-200" /></div>
              </div>
            </div>
          </section>
        </main>

        <aside className="min-h-0 overflow-y-auto border-l border-white/10 p-3">
          <div className="mb-2 text-[9px] uppercase tracking-[.24em] text-white/40">Montage Prefab</div>
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-3">
            <input value={activeMontage?.name || ''} onChange={e=>selectedMontageId&&setMontages(current=>current.map(m=>m.id===selectedMontageId?{...m,name:e.target.value}:m))} placeholder="Create or select a montage" className="h-8 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[9px] text-white" />
            <textarea value={activeMontage?.description || ''} onChange={e=>selectedMontageId&&setMontages(current=>current.map(m=>m.id===selectedMontageId?{...m,description:e.target.value}:m))} placeholder="Description" className="mt-2 h-16 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-[9px] text-white" />
            <div className="mt-3 space-y-2 text-[8px] text-white/45"><div className="flex justify-between"><span>Slot</span><span className="text-white/70">{slot}</span></div><div className="flex justify-between"><span>Segments</span><span className="text-white/70">{segments.length}</span></div><div className="flex justify-between"><span>Duration</span><span className="text-white/70">{duration.toFixed(2)}s</span></div></div>
          </div>
          <div className="mb-2 mt-5 text-[9px] uppercase tracking-[.24em] text-white/40">Sections</div>
          <div className="space-y-1">{(activeMontage?.sections || [{ id:'default', name:'Default', start:0 }]).map(section=><div key={section.id} className="rounded-xl border border-white/10 bg-white/[.025] px-2 py-2 text-[8px] text-white/55"><div className="flex items-center gap-1"><CircleDot className="h-3 w-3 text-cyan-200/50"/>{section.name}</div><div className="mt-1 text-white/25">{formatTime(section.start)}</div></div>)}</div>
          <div className="mb-2 mt-5 text-[9px] uppercase tracking-[.24em] text-white/40">Element Timing</div>
          <div className="rounded-xl border border-white/10 bg-white/[.02] p-2 text-[8px] leading-4 text-white/35">Drag segments to change timing. Double-click the track to add a clip. Sections and future notify events can remain linked as Absolute, Relative or Proportional.</div>
          {selectedMontageId && <GlassButton danger className="mt-3 w-full text-center" onClick={()=>{setMontages(current=>current.filter(m=>m.id!==selectedMontageId));setSelectedMontageId('');setSegments([]);}}>Delete Montage</GlassButton>}
        </aside>
      </div>
    </div>
  </div>;
}
