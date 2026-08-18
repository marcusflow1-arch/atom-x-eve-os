import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Box, Mountain, Sparkles, Swords, UserRound, Film, Camera, MousePointer2, Plus, Minus, Save, Play, Pause, Layers3 } from 'lucide-react';

const TOOLS = [
  ['terrain', 'Terrain', Mountain],
  ['physics', 'Physics', Layers3],
  ['effects', 'Effects', Sparkles],
  ['models', 'Models', Box],
  ['damage', 'Damage', Swords],
  ['animation', 'Animation Montage', Film],
  ['stats', 'Stats', UserRound],
  ['camera', 'Camera', Camera],
];

const DAMAGE_TYPES = ['physical', 'fire', 'ice', 'electric', 'poison', 'arcane', 'holy', 'shadow'];

function makePointEffect(scene, position, color = 0x67e8f9) {
  const group = new THREE.Group();
  group.name = 'FX_EditorMarker';
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), new THREE.MeshBasicMaterial({ color }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }));
  group.add(core, ring);
  group.position.copy(position);
  scene.add(group);
  return group;
}

export default function EngineEditStudio({ sceneApi, onClose }) {
  const [tool, setTool] = useState('terrain');
  const [brushSize, setBrushSize] = useState(2.5);
  const [brushStrength, setBrushStrength] = useState(0.45);
  const [terrainMode, setTerrainMode] = useState('raise');
  const [modelUrls, setModelUrls] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [damageEntries, setDamageEntries] = useState([{ type: 'physical', amount: 50, multiplier: 1, defense: 0 }]);
  const [animationChain, setAnimationChain] = useState([{ name: 'Sword Swing', duration: 0.7, speed: 1, rootMotion: 'in_place' }, { name: 'Kick', duration: 0.55, speed: 1, rootMotion: 'in_place' }]);
  const [selectedAnim, setSelectedAnim] = useState(0);
  const [timelineCursor, setTimelineCursor] = useState(0);
  const [playTimeline, setPlayTimeline] = useState(false);
  const [rootMotion, setRootMotion] = useState('in_place');
  const [physics, setPhysics] = useState({ body: 'dynamic', mass: 1, friction: 0.5, restitution: 0.2, gravity: 1 });
  const [camera, setCamera] = useState({ speed: 1, smoothing: 0.12, fov: 60, shake: 0 });
  const viewportRef = useRef(null);

  const allObjects = useMemo(() => {
    if (!sceneApi?.scene) return [];
    const rows = [];
    sceneApi.scene.traverse((o) => { if (o.visible && o.name !== 'grid' && o.name !== 'ground') rows.push(o); });
    return rows;
  }, [sceneApi, tool, selectedModel]);

  useEffect(() => {
    if (!sceneApi?.camera) return;
    sceneApi.camera.fov = camera.fov;
    sceneApi.camera.updateProjectionMatrix();
    if (sceneApi.controls) sceneApi.controls.enableDamping = camera.smoothing > 0;
  }, [camera, sceneApi]);

  useEffect(() => {
    if (!sceneApi?.camera) return;
    const id = setInterval(() => {
      if (!playTimeline) return;
      setTimelineCursor((v) => (v + 0.016 * (animationChain[selectedAnim]?.speed || 1)) % (animationChain[selectedAnim]?.duration || 1));
    }, 16);
    return () => clearInterval(id);
  }, [playTimeline, selectedAnim, animationChain, sceneApi]);

  useEffect(() => {
    if (tool !== 'terrain' || !sceneApi?.renderer?.domElement || !sceneApi?.scene) return;
    const canvas = sceneApi.renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let dragging = false;

    const sculpt = (event) => {
      const terrain = sceneApi.scene.getObjectByName('Terrain');
      if (!terrain || !(terrain.geometry instanceof THREE.BufferGeometry)) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, sceneApi.camera);
      const hit = raycaster.intersectObject(terrain, true)[0];
      if (!hit) return;
      const local = terrain.worldToLocal(hit.point.clone());
      const pos = terrain.geometry.attributes.position;
      let changed = false;
      for (let i = 0; i < pos.count; i++) {
        const p = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
        const d = Math.hypot(p.x - local.x, p.y - local.y);
        if (d > brushSize) continue;
        const falloff = 1 - d / brushSize;
        const delta = brushStrength * falloff * (event.shiftKey || terrainMode === 'lower' ? -1 : 1);
        pos.setZ(i, pos.getZ(i) + delta);
        changed = true;
      }
      if (changed) { pos.needsUpdate = true; terrain.geometry.computeVertexNormals(); }
    };
    const onDown = (e) => { dragging = true; sculpt(e); };
    const onMove = (e) => { if (dragging) sculpt(e); };
    const onUp = () => { dragging = false; };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [tool, brushSize, brushStrength, terrainMode, sceneApi]);

  const addModel = async (url) => {
    if (!sceneApi?.addModel) return;
    await sceneApi.addModel(url, { position: { x: 0, y: 0, z: 0 } });
    setModelUrls((v) => [...v, url]);
  };

  const addTerrain = () => sceneApi?.createTerrain?.({ size: 40, segments: 80, addFoliage: false });
  const addEffect = () => {
    if (!sceneApi?.scene) return;
    makePointEffect(sceneApi.scene, new THREE.Vector3(0, 1.5, 0));
  };

  const addDamage = () => setDamageEntries((v) => [...v, { type: 'physical', amount: 25, multiplier: 1, defense: 0 }]);
  const updateDamage = (i, key, value) => setDamageEntries((v) => v.map((x, idx) => idx === i ? { ...x, [key]: value } : x));
  const addAnimation = () => setAnimationChain((v) => [...v, { name: `Animation ${v.length + 1}`, duration: 0.8, speed: 1, rootMotion: 'in_place' }]);

  return (
    <div ref={viewportRef} className="absolute inset-2 z-20 pointer-events-none">
      <div className="pointer-events-auto absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/80 p-1 backdrop-blur-xl shadow-2xl">
        <Badge className="bg-orange-500/15 text-orange-300 border-orange-400/20 mr-1">EDIT MODE</Badge>
        {TOOLS.map(([id, label, Icon]) => (
          <Button key={id} size="sm" variant={tool === id ? 'default' : 'ghost'} className="h-7 text-[10px]" onClick={() => setTool(id)}>
            <Icon className="mr-1 h-3 w-3" />{label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={onClose}>Done</Button>
      </div>

      {tool === 'models' && (
        <aside className="pointer-events-auto absolute inset-y-16 left-2 w-[15%] min-w-[190px] rounded-2xl border border-white/10 bg-slate-950/92 p-3 backdrop-blur-xl">
          <div className="mb-3 text-[10px] uppercase tracking-[0.25em] text-slate-500">Asset Browser</div>
          <div className="space-y-2 overflow-y-auto">
            {['Artemis / public/models/artemis.gltf', 'Starter Cube / primitive:cube', 'Terrain / terrain-generator', 'Sphere / primitive:sphere'].map((label, i) => (
              <button key={label} onClick={() => label.includes('Artemis') ? addModel('/models/artemis.gltf') : sceneApi?.addPrimitive?.(label.includes('Sphere') ? 'sphere' : 'cube')} className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left hover:bg-white/[0.08]">
                <div className="text-xs text-white/85">{label.split(' / ')[0]}</div>
                <div className="text-[10px] text-white/35">{label.split(' / ')[1]}</div>
              </button>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-white/35">Drag-and-drop ready asset lane; click adds to the center viewport.</div>
        </aside>
      )}

      {tool === 'terrain' && (
        <div className="pointer-events-auto absolute left-3 bottom-3 w-[260px] rounded-2xl border border-white/10 bg-slate-950/90 p-3 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold">Terrain Sculpt</span><Button size="icon" variant="ghost" className="h-6 w-6" onClick={addTerrain}><Plus className="h-3 w-3" /></Button></div>
          <div className="mb-2 flex gap-1"><Button size="sm" className="h-7 text-[10px]" variant={terrainMode === 'raise' ? 'default' : 'ghost'} onClick={() => setTerrainMode('raise')}>Raise</Button><Button size="sm" className="h-7 text-[10px]" variant={terrainMode === 'lower' ? 'default' : 'ghost'} onClick={() => setTerrainMode('lower')}>Lower</Button></div>
          <div className="space-y-3"><div><div className="mb-1 text-[10px] text-white/50">Brush Size</div><Slider value={[brushSize]} min={0.25} max={8} step={0.25} onValueChange={([v]) => setBrushSize(v)} /></div><div><div className="mb-1 text-[10px] text-white/50">Strength</div><Slider value={[brushStrength]} min={0.05} max={1} step={0.05} onValueChange={([v]) => setBrushStrength(v)} /></div></div>
          <div className="mt-2 text-[10px] text-white/35">Click/drag in the 3D viewport to sculpt. Hold Shift to lower.</div>
        </div>
      )}

      {tool === 'effects' && (
        <div className="pointer-events-auto absolute right-3 bottom-3 w-[300px] rounded-2xl border border-white/10 bg-slate-950/90 p-3 backdrop-blur-xl">
          <div className="mb-2 text-xs font-semibold">Effect Placement</div><div className="text-[10px] text-white/45 mb-2">Select an object/bone anchor and place the effect at exact local position, rotation and scale.</div>
          <div className="grid grid-cols-3 gap-2">{['X','Y','Z'].map((axis) => <Input key={axis} className="h-7 text-[10px]" placeholder={axis} defaultValue="0" />)}</div>
          <div className="mt-2 grid grid-cols-3 gap-2">{['Rot X','Rot Y','Rot Z'].map((axis) => <Input key={axis} className="h-7 text-[10px]" placeholder={axis} defaultValue="0" />)}</div>
          <div className="mt-2 flex items-center gap-2"><Input className="h-7 text-[10px]" placeholder="Scale" defaultValue="1" /><Input className="h-7 text-[10px]" placeholder="Speed" defaultValue="1" /></div>
          <Button className="mt-2 w-full h-7 text-[10px]" onClick={addEffect}>Add Energy FX Anchor</Button>
        </div>
      )}

      {tool === 'damage' && (
        <div className="pointer-events-auto absolute right-3 top-16 w-[320px] rounded-2xl border border-white/10 bg-slate-950/92 p-3 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold">Damage Profile</span><Button size="icon" variant="ghost" className="h-6 w-6" onClick={addDamage}><Plus className="h-3 w-3" /></Button></div>
          <div className="text-[10px] text-white/40 mb-3">Select any model as the source or target, then author multiple damage packets.</div>
          {damageEntries.map((d, i) => <div key={i} className="mb-2 rounded-xl border border-white/10 bg-white/[0.03] p-2"><select className="mb-2 h-7 w-full rounded-md border border-white/10 bg-slate-900 px-2 text-[10px] text-white" value={d.type} onChange={(e)=>updateDamage(i,'type',e.target.value)}>{DAMAGE_TYPES.map(t=><option key={t}>{t}</option>)}</select><div className="grid grid-cols-3 gap-1"><Input className="h-7 text-[10px]" type="number" value={d.amount} onChange={(e)=>updateDamage(i,'amount',Number(e.target.value))} /><Input className="h-7 text-[10px]" type="number" value={d.multiplier} onChange={(e)=>updateDamage(i,'multiplier',Number(e.target.value))} /><Input className="h-7 text-[10px]" type="number" value={d.defense} onChange={(e)=>updateDamage(i,'defense',Number(e.target.value))} /></div></div>)}
        </div>
      )}

      {tool === 'animation' && (
        <div className="pointer-events-auto absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-slate-950/94 p-3 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between"><div><div className="text-xs font-semibold">Animation Montage</div><div className="text-[10px] text-white/40">Sequence → montage sections → notifies → damage/effect events. Root motion can be in-place or extracted.</div></div><div className="flex gap-1"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=>setPlayTimeline(v=>!v)}>{playTimeline?<Pause className="h-3 w-3"/>:<Play className="h-3 w-3"/>}</Button><Button size="icon" variant="ghost" className="h-7 w-7" onClick={addAnimation}><Plus className="h-3 w-3"/></Button></div></div>
          <div className="mb-2 flex gap-2 overflow-x-auto">{animationChain.map((a,i)=><button key={i} onClick={()=>setSelectedAnim(i)} className={`min-w-[150px] rounded-lg border px-2 py-1.5 text-left ${selectedAnim===i?'border-cyan-400/40 bg-cyan-400/10':'border-white/10 bg-white/[0.02]'}`}><div className="text-[10px] text-white/80">{a.name}</div><div className="text-[9px] text-white/35">{a.duration.toFixed(2)}s · {a.rootMotion}</div></button>)}</div>
          <div className="relative h-14 rounded-lg border border-white/10 bg-black/20"><div className="absolute inset-y-0 left-0 w-px bg-cyan-300" style={{left:`${Math.min(100, (timelineCursor/(animationChain[selectedAnim]?.duration||1))*100)}%`}}/><div className="absolute left-2 right-2 top-2 h-8 rounded bg-gradient-to-r from-cyan-500/15 via-violet-500/15 to-orange-500/15"><div className="absolute inset-0 flex items-center justify-between px-2 text-[8px] text-white/35"><span>START</span><span>DAMAGE</span><span>FX</span><span>CHAIN</span><span>END</span></div></div></div>
          <div className="mt-2 flex items-center gap-2"><span className="text-[10px] text-white/40">Root Motion</span><Button size="sm" className="h-6 text-[9px]" variant={rootMotion==='in_place'?'default':'ghost'} onClick={()=>setRootMotion('in_place')}>In-Place</Button><Button size="sm" className="h-6 text-[9px]" variant={rootMotion==='xy'?'default':'ghost'} onClick={()=>setRootMotion('xy')}>XY</Button><Button size="sm" className="h-6 text-[9px]" variant={rootMotion==='xyz'?'default':'ghost'} onClick={()=>setRootMotion('xyz')}>XYZ</Button><span className="ml-auto text-[9px] text-white/30">Snap / Unsnap · blend · play rate · notify windows</span></div>
        </div>
      )}

      {tool === 'physics' && (
        <div className="pointer-events-auto absolute right-3 top-16 w-[300px] rounded-2xl border border-white/10 bg-slate-950/92 p-3 backdrop-blur-xl"><div className="mb-2 text-xs font-semibold">Physics Body</div><div className="grid grid-cols-2 gap-2">{[['Mass', 'mass'], ['Friction','friction'], ['Restitution','restitution'], ['Gravity','gravity']].map(([label,key])=><label key={key} className="text-[9px] text-white/45">{label}<Input className="mt-1 h-7 text-[10px]" type="number" value={physics[key]} onChange={(e)=>setPhysics(v=>({...v,[key]:Number(e.target.value)}))}/></label>)}</div><select className="mt-2 h-7 w-full rounded-md border border-white/10 bg-slate-900 px-2 text-[10px] text-white" value={physics.body} onChange={e=>setPhysics(v=>({...v,body:e.target.value}))}><option value="static">Static</option><option value="dynamic">Dynamic</option><option value="kinematic">Kinematic</option></select></div>
      )}

      {tool === 'stats' && (
        <div className="pointer-events-auto absolute right-3 top-16 w-[300px] rounded-2xl border border-white/10 bg-slate-950/92 p-3 backdrop-blur-xl"><div className="mb-2 text-xs font-semibold">Actor Stats</div><div className="grid grid-cols-2 gap-2">{['HP','Defense','Attack','Stamina','Move Speed','Cast Speed'].map(x=><label key={x} className="text-[9px] text-white/45">{x}<Input className="mt-1 h-7 text-[10px]" type="number" defaultValue={x==='HP'?100:10}/></label>)}</div></div>
      )}

      {tool === 'camera' && (
        <div className="pointer-events-auto absolute right-3 top-16 w-[300px] rounded-2xl border border-white/10 bg-slate-950/92 p-3 backdrop-blur-xl"><div className="mb-2 text-xs font-semibold">Camera / Movement</div><div className="space-y-3">{[['speed','Speed',0.1,5,0.1],['smoothing','Smoothing',0,1,0.01],['fov','FOV',35,100,1],['shake','Shake',0,2,0.05]].map(([key,label,min,max,step])=><div key={key}><div className="mb-1 flex justify-between text-[9px] text-white/45"><span>{label}</span><span>{camera[key]}</span></div><Slider value={[camera[key]]} min={min} max={max} step={step} onValueChange={([v])=>setCamera(c=>({...c,[key]:v}))}/></div>)}</div></div>
      )}
    </div>
  );
}
