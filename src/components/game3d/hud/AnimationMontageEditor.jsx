import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import { Film, Play, Square, Plus, Save, Trash2, ChevronRight, GripVertical, RotateCcw, Bell, GitBranch, X, CircleDot } from 'lucide-react';

const STORAGE_KEY = 'atomxe_animation_montages_v3';
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const read = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const tc = (s) => { const n = Math.max(0, Number(s) || 0); return `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}.${Math.floor((n % 1) * 10)}`; };
const clipsFor = (o) => { if (!o) return []; const out = [], seen = new Set(); const add = c => { const k = c?.uuid || c?.name; if (c && !seen.has(k)) { seen.add(k); out.push(c); } }; (o.animations || []).forEach(add); o.traverse?.(x => (x.animations || []).forEach(add)); return out; };
function Button({ children, onClick, active, danger, className = '' }) { return <button type="button" onClick={onClick} className={`rounded-lg border px-2 py-1.5 text-[9px] transition ${danger ? 'border-red-300/10 bg-red-400/10 text-red-100' : active ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/[.035] text-white/65 hover:bg-white/[.07]'} ${className}`}>{children}</button>; }
function Num({ label, value, onChange, min, step = 'any' }) { return <label className="block text-[8px] uppercase tracking-wider text-white/45">{label}<input type="number" value={Number.isFinite(Number(value)) ? value : 0} min={min} step={step} onChange={e => onChange(Number(e.target.value))} className="mt-1 h-7 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[9px] text-white outline-none focus:border-cyan-300/40" /></label>; }

export default function AnimationMontageEditor({ selected, onClose }) {
  const [montages, setMontages] = useState(() => read(STORAGE_KEY, []));
  const [montageId, setMontageId] = useState('');
  const [segments, setSegments] = useState([]);
  const [sections, setSections] = useState([{ id: uid(), name: 'Default', start: 0, next: '' }]);
  const [notifies, setNotifies] = useState([]);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [slot, setSlot] = useState('Default');
  const [linkMode, setLinkMode] = useState('absolute');
  const [playRate, setPlayRate] = useState(1);
  const [selectedSegmentId, setSelectedSegmentId] = useState('');
  const [previewReady, setPreviewReady] = useState(false);
  const timelineRef = useRef(null), previewRef = useRef(null), dragRef = useRef(null);
  const preview = useRef({ renderer: null, scene: null, camera: null, model: null, mixer: null, action: null, activeId: null });
  const rafRef = useRef(0), lastRef = useRef(0), playheadRef = useRef(0);
  const clips = useMemo(() => clipsFor(selected), [selected]);
  const duration = Math.max(1, segments.reduce((m, s) => Math.max(m, s.start + s.duration), 0));
  const active = montages.find(m => m.id === montageId) || null;
  const selectedSegment = segments.find(s => s.id === selectedSegmentId) || null;

  useEffect(() => write(STORAGE_KEY, montages), [montages]);
  useEffect(() => { playheadRef.current = playhead; }, [playhead]);

  // Escape closes the montage workspace and stops preview playback.
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setPlaying(false); onClose?.(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  // Dedicated 3D preview. It clones the selected live-world object; the actual game scene is never replaced.
  useEffect(() => {
    const host = previewRef.current;
    if (!host || !selected) return;
    setPreviewReady(false);
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x060a12);
    const camera = new THREE.PerspectiveCamera(38, 1, .01, 100); camera.position.set(0, 1, 3.5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    host.innerHTML = ''; host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xbfdcff, 0x141827, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 5, 4); scene.add(key);
    const grid = new THREE.GridHelper(8, 16, 0x334155, 0x172033); grid.position.y = -1; scene.add(grid);
    const model = SkeletonUtils.clone(selected); scene.add(model);
    const box = new THREE.Box3().setFromObject(model), center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
    model.position.sub(center); const fit = 1.8 / (Math.max(size.x, size.y, size.z) || 1); model.scale.multiplyScalar(fit);
    const fitted = new THREE.Box3().setFromObject(model); model.position.y -= fitted.min.y + .75;
    const mixer = new THREE.AnimationMixer(model);
    preview.current = { renderer, scene, camera, model, mixer, action: null, activeId: null };
    const resize = () => { const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight); camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); }; resize();
    const ro = new ResizeObserver(resize); ro.observe(host);
    let frame = 0; const render = () => { frame = requestAnimationFrame(render); renderer.render(scene, camera); }; render(); setPreviewReady(true);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); mixer.stopAllAction(); renderer.dispose(); if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement); preview.current = { renderer: null, scene: null, camera: null, model: null, mixer: null, action: null, activeId: null }; setPreviewReady(false); };
  }, [selected]);

  const syncPreview = time => {
    const p = preview.current; if (!p.mixer) return;
    const seg = [...segments].reverse().find(s => time >= s.start && time < s.start + s.duration);
    if (!seg) { p.mixer.stopAllAction(); p.action = null; p.activeId = null; return; }
    const clip = clips.find(c => c.name === seg.clipName); if (!clip) return;
    const local = Math.max(0, time - seg.start) * (seg.playRate || 1);
    if (p.activeId !== seg.id) {
      const next = p.mixer.clipAction(clip); next.reset().setEffectiveWeight(0).setEffectiveTimeScale(seg.playRate || 1).play(); next.fadeIn(Math.max(0, Number(seg.blendIn) || .1)); p.action?.fadeOut(Math.max(0, Number(seg.blendOut) || .1)); p.action = next; p.activeId = seg.id;
    }
    p.action.time = Math.min(clip.duration, local); p.action.setEffectiveTimeScale(seg.playRate || 1);
  };
  useEffect(() => { syncPreview(playhead); }, [playhead, segments, clips]);

  useEffect(() => {
    if (!playing) return;
    lastRef.current = performance.now();
    const frame = now => { const dt = Math.min(.05, (now - lastRef.current) / 1000); lastRef.current = now; let next = playheadRef.current + dt * (playRate || 1); if (next >= duration) { if (loop) next = 0; else { next = duration; setPlaying(false); } } playheadRef.current = next; setPlayhead(next); preview.current.mixer?.update(dt); rafRef.current = requestAnimationFrame(frame); };
    rafRef.current = requestAnimationFrame(frame); return () => cancelAnimationFrame(rafRef.current);
  }, [playing, duration, loop, playRate]);

  const createMontage = () => { const m = { id: uid(), name: `montage.${montages.length + 1}`, description: '', slot: 'Default', loop: false, linkMode: 'absolute', playRate: 1, segments: [], sections: [{ id: uid(), name: 'Default', start: 0, next: '' }], notifies: [] }; setMontages(v => [...v, m]); setMontageId(m.id); setSegments([]); setSections(m.sections); setNotifies([]); setLoop(false); setSlot('Default'); setLinkMode('absolute'); setPlayRate(1); setSelectedSegmentId(''); setPlayhead(0); };
  const openMontage = m => { setPlaying(false); setMontageId(m.id); setSegments((m.segments || []).map(s => ({ loopCount: 1, ...s }))); setSections((m.sections || [{ id: uid(), name: 'Default', start: 0, next: '' }]).map(s => ({ ...s }))); setNotifies((m.notifies || []).map(n => ({ ...n }))); setLoop(!!m.loop); setSlot(m.slot || 'Default'); setLinkMode(m.linkMode || 'absolute'); setPlayRate(Number(m.playRate) || 1); setSelectedSegmentId(''); setPlayhead(0); };
  const saveMontage = () => { if (!montageId) return; const data = { ...active, slot, loop, linkMode, playRate, segments, sections, notifies }; setMontages(v => v.map(m => m.id === montageId ? data : m)); window.dispatchEvent(new CustomEvent('atomXeAnimationMontageSaved', { detail: { id: montageId, montage: data } })); };
  const addSegmentAt = (clip, at) => { if (!clip) return; const s = { id: uid(), clipName: clip.name, start: Math.max(0, at), duration: clip.duration, playRate: 1, loopCount: 1, blendIn: .1, blendOut: .1, slot, section: 'Default' }; setSegments(v => [...v, s]); setSelectedSegmentId(s.id); setPlayhead(s.start); };
  const addSegment = clip => addSegmentAt(clip, segments.reduce((m, s) => Math.max(m, s.start + s.duration), 0));
  const removeSegment = id => { setSegments(v => v.filter(s => s.id !== id)); if (selectedSegmentId === id) setSelectedSegmentId(''); };
  const updateSegment = (id, patch) => setSegments(v => v.map(s => s.id === id ? { ...s, ...patch } : s));
  const ratioAt = e => { const r = timelineRef.current?.getBoundingClientRect(); return r ? Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) : 0; };
  const moveSegment = (id, start) => { const s = segments.find(x => x.id === id); if (s) updateSegment(id, { start: Math.max(0, Math.min(Math.max(0, duration - s.duration), start)) }); };
  const beginDrag = (e, s) => { e.preventDefault(); e.stopPropagation(); dragRef.current = { id: s.id, offset: ratioAt(e) * duration - s.start }; setSelectedSegmentId(s.id); };
  useEffect(() => { const move = e => { if (dragRef.current) moveSegment(dragRef.current.id, ratioAt(e) * duration - dragRef.current.offset); }; const up = () => { dragRef.current = null; }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); }; }, [duration, segments]);
  const dropClip = e => { e.preventDefault(); const name = e.dataTransfer.getData('application/x-atomxe-animation-clip'); const clip = clips.find(c => c.name === name); if (clip) addSegmentAt(clip, ratioAt(e) * duration); };
  const close = () => { setPlaying(false); cancelAnimationFrame(rafRef.current); preview.current.mixer?.stopAllAction(); onClose?.(); };

  return <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/30 p-5 backdrop-blur-[2px]" onPointerDown={e => e.stopPropagation()}>
    <div className="flex h-[84vh] w-[84vw] max-w-[1500px] flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#070b13]/95 shadow-[0_30px_120px_rgba(0,0,0,.65)] backdrop-blur-3xl">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div><div className="text-[9px] uppercase tracking-[.3em] text-cyan-200/65">ANIMATION MONTAGE EDITOR</div><div className="text-sm font-semibold text-white">Live sequencing · slots · sections · notifies</div></div><div className="flex items-center gap-2"><span className="hidden text-[8px] text-white/30 sm:inline">ESC to close</span><Button onClick={() => { setSegments([]); setNotifies([]); setSelectedSegmentId(''); setPlayhead(0); setPlaying(false); }}><RotateCcw className="mr-1 inline h-3 w-3"/>Reset</Button><Button onClick={close}><X className="mr-1 inline h-3 w-3"/>Close</Button></div></header>
      <div className="min-h-0 flex-1 grid grid-cols-[23%_1fr_20%]">
        <aside className="min-h-0 overflow-y-auto border-r border-white/10 p-3"><div className="text-[9px] uppercase tracking-[.24em] text-white/40">Animations</div><div className="mt-2 space-y-1">{clips.length ? clips.map(c => <div key={c.name} draggable onDragStart={e => e.dataTransfer.setData('application/x-atomxe-animation-clip', c.name)} onDoubleClick={() => addSegment(c)} className="flex cursor-grab items-center gap-2 rounded-xl border border-white/10 bg-white/[.025] px-2 py-2 text-[9px] text-white/70"><GripVertical className="h-3 w-3 text-white/25"/><Film className="h-3 w-3 text-cyan-200/70"/><span className="min-w-0 flex-1 truncate">{c.name}</span><span className="text-white/25">{c.duration.toFixed(2)}s</span></div>) : <div className="rounded-xl border border-dashed border-white/10 p-3 text-[9px] text-white/35">Select an animated 3D model in the live world. Its existing clips appear here.</div>}</div><div className="mt-5 text-[9px] uppercase tracking-[.24em] text-white/40">Montages</div><Button onClick={createMontage} className="mt-2 w-full"><Plus className="mr-1 inline h-3 w-3"/>Create Montage</Button><div className="mt-2 space-y-1">{montages.map(m => <button key={m.id} type="button" onClick={() => openMontage(m)} className={`flex w-full items-center gap-2 rounded-xl border px-2 py-2 text-left text-[9px] ${m.id === montageId ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/[.025] text-white/65'}`}><ChevronRight className="h-3 w-3"/>{m.name}</button>)}</div></aside>
        <main className="min-h-0 grid grid-rows-[70%_30%]">
          <section className="relative min-h-0 overflow-hidden bg-white/[.01]"><div ref={previewRef} className="absolute inset-0"/><div className="absolute left-3 top-3 z-20 rounded-lg border border-white/10 bg-black/35 px-2 py-1 text-[8px] text-white/55">LIVE PREVIEW · {selected?.name || 'No object selected'}</div>{!previewReady && <div className="absolute inset-0 flex items-center justify-center text-[9px] text-white/25">Select an animated model to preview.</div>}<div className="absolute right-3 top-3 z-20 flex gap-1"><Button active={playing} onClick={() => { setPlaying(true); lastRef.current = performance.now(); }}><Play className="mr-1 inline h-3 w-3"/>Play</Button><Button onClick={() => { setPlaying(false); preview.current.mixer?.stopAllAction(); preview.current.action = null; preview.current.activeId = null; }}><Square className="mr-1 inline h-3 w-3"/>Stop</Button></div></section>
          <section className="min-h-0 border-t border-white/10 bg-black/25 p-3"><div className="flex items-center justify-between gap-2 pb-2"><div className="flex items-center gap-2"><span className="text-[9px] uppercase tracking-[.2em] text-white/40">Timeline</span><span className="text-[8px] text-white/25">{tc(playhead)} / {tc(duration)}</span></div><div className="flex flex-wrap gap-1"><Button onClick={() => setSections(v => [...v, { id: uid(), name: `Section ${v.length + 1}`, start: playhead, next: '' }])}><GitBranch className="mr-1 inline h-3 w-3"/>Section</Button><Button onClick={() => setNotifies(v => [...v, { id: uid(), name: 'Notify', time: playhead, type: 'event' }])}><Bell className="mr-1 inline h-3 w-3"/>Notify</Button><Button active={loop} onClick={() => setLoop(v => !v)}>Loop</Button><select value={slot} onChange={e => setSlot(e.target.value)} className="h-7 rounded-lg border border-white/10 bg-black/30 px-2 text-[8px] text-white"><option>Default</option><option>UpperBody</option><option>LowerBody</option><option>FullBody</option></select><select value={linkMode} onChange={e => setLinkMode(e.target.value)} className="h-7 rounded-lg border border-white/10 bg-black/30 px-2 text-[8px] text-white"><option value="absolute">Absolute</option><option value="relative">Relative</option><option value="proportional">Proportional</option></select><Num label="Play Rate" value={playRate} onChange={setPlayRate} min={.05} step={.05}/><Button active={!!montageId} onClick={saveMontage}><Save className="mr-1 inline h-3 w-3"/>Save</Button></div></div><div ref={timelineRef} onPointerDown={e => { if (e.target === timelineRef.current) setPlayhead(ratioAt(e) * duration); }} onDoubleClick={e => { if (clips[0]) addSegmentAt(clips[0], ratioAt(e) * duration); }} onDragOver={e => e.preventDefault()} onDrop={dropClip} className="relative h-[calc(100%-46px)] rounded-xl border border-white/10 bg-white/[.02]"><div className="absolute inset-x-0 top-0 h-5 border-b border-white/10 text-[7px] text-white/25">{Array.from({ length: 11 }, (_, i) => <span key={i} className="absolute top-1 -translate-x-1/2" style={{ left: `${i * 10}%` }}>{tc(duration * i / 10)}</span>)}</div><div className="absolute inset-x-2 top-7 bottom-2">{sections.map(s => <div key={s.id} className="absolute top-0 bottom-0 w-px bg-violet-300/40" style={{ left: `${s.start / duration * 100}%` }}><div className="absolute -top-1 -translate-x-1/2 rounded bg-violet-300/15 px-1 text-[6px] text-violet-100">{s.name}</div></div>)}{notifies.map(n => <div key={n.id} className="absolute bottom-0 top-0 w-px bg-red-300/60" style={{ left: `${n.time / duration * 100}%` }}><div className="absolute bottom-0 -translate-x-1/2 rounded bg-red-300/15 px-1 text-[6px] text-red-100">{n.name}</div></div>)}{segments.map(s => <div key={s.id} onPointerDown={e => beginDrag(e, s)} onClick={() => setSelectedSegmentId(s.id)} className={`absolute top-7 h-9 cursor-grab rounded-lg border px-2 ${s.id === selectedSegmentId ? 'border-cyan-200/60 bg-cyan-300/15' : 'border-cyan-200/25 bg-cyan-300/10'}`} style={{ left: `${s.start / duration * 100}%`, width: `${Math.max(1.5, s.duration / duration * 100)}%` }}><div className="flex items-center gap-1 text-[8px] text-cyan-100"><GripVertical className="h-3 w-3"/><span className="truncate">{s.clipName}</span></div><div className="text-[6px] text-white/35">{s.slot} · {s.playRate.toFixed(2)}x · {s.loopCount || 1}x</div><button type="button" onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); removeSegment(s.id); }} className="absolute right-1 top-1 text-white/35 hover:text-red-200"><Trash2 className="h-3 w-3"/></button><div className="absolute -left-1 -top-1 h-3 w-3 rounded-full border border-cyan-100/70 bg-cyan-200/80" title="Animation marker"/></div>)}<div className="absolute bottom-0 top-0 w-px bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,.9)]" style={{ left: `${playhead / duration * 100}%` }}><div className="absolute -left-1.5 -top-1 h-3 w-3 rounded-full bg-cyan-200"/></div></div></div></section>
        </main>
        <aside className="min-h-0 overflow-y-auto border-l border-white/10 p-3"><div className="text-[9px] uppercase tracking-[.24em] text-white/40">Saved Montage / Prefab</div><div className="mt-2 rounded-2xl border border-white/10 bg-white/[.025] p-3"><input value={active?.name || ''} onChange={e => montageId && setMontages(v => v.map(m => m.id === montageId ? { ...m, name: e.target.value } : m))} placeholder="montage.1" className="h-8 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[9px] text-white"/><textarea value={active?.description || ''} onChange={e => montageId && setMontages(v => v.map(m => m.id === montageId ? { ...m, description: e.target.value } : m))} placeholder="Montage description" className="mt-2 h-16 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-[8px] text-white"/><div className="mt-2 grid grid-cols-2 gap-2 text-[8px] text-white/40"><div>Segments <b className="float-right text-white/70">{segments.length}</b></div><div>Duration <b className="float-right text-white/70">{duration.toFixed(2)}s</b></div><div>Slot <b className="float-right text-white/70">{slot}</b></div><div>Notifies <b className="float-right text-white/70">{notifies.length}</b></div></div></div>{selectedSegment && <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-3"><div className="mb-2 text-[9px] uppercase tracking-[.22em] text-cyan-100/70">Selected Animation</div><div className="mb-2 truncate text-[9px] text-white/80">{selectedSegment.clipName}</div><div className="grid grid-cols-2 gap-2"><Num label="Start" value={selectedSegment.start} onChange={v => updateSegment(selectedSegment.id, { start: Math.max(0, v) })} min={0} step={.01}/><Num label="Duration" value={selectedSegment.duration} onChange={v => updateSegment(selectedSegment.id, { duration: Math.max(.01, v) })} min={.01} step={.01}/><Num label="Play Rate" value={selectedSegment.playRate} onChange={v => updateSegment(selectedSegment.id, { playRate: Math.max(.05, v) })} min={.05} step={.05}/><Num label="Loop Count" value={selectedSegment.loopCount || 1} onChange={v => updateSegment(selectedSegment.id, { loopCount: Math.max(1, Math.floor(v)) })} min={1} step={1}/><Num label="Blend In" value={selectedSegment.blendIn} onChange={v => updateSegment(selectedSegment.id, { blendIn: Math.max(0, v) })} min={0} step={.01}/><Num label="Blend Out" value={selectedSegment.blendOut} onChange={v => updateSegment(selectedSegment.id, { blendOut: Math.max(0, v) })} min={0} step={.01}/></div></div>}<div className="mt-5 text-[9px] uppercase tracking-[.24em] text-white/40">Sections</div><div className="mt-2 space-y-1">{sections.map(s => <div key={s.id} className="rounded-xl border border-white/10 bg-white/[.02] p-2 text-[8px] text-white/55"><div className="flex items-center gap-1"><CircleDot className="h-3 w-3 text-violet-200/60"/>{s.name}</div><div className="mt-1 text-white/25">{tc(s.start)} · next: {s.next || 'none'}</div></div>)}</div>{montageId && <Button danger className="mt-3 w-full" onClick={() => { setMontages(v => v.filter(m => m.id !== montageId)); setMontageId(''); setSegments([]); setSelectedSegmentId(''); }}>Delete Montage</Button>}</aside>
      </div>
    </div>
  </div>;
}