import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const glass = 'bg-slate-950/85 backdrop-blur-xl border border-white/10 shadow-2xl';

function kindOf(o) {
  const n = `${o?.name || ''} ${o?.parent?.name || ''}`.toLowerCase();
  if (o?.userData?.isTerrain || /terrain|ground|grass|floor/.test(n)) return 'terrain';
  if (o?.userData?.isBoss || /boss|devourer|shifter/.test(n)) return 'enemy';
  if (o?.userData?.isEnemy || /enemy|npc/.test(n)) return 'enemy';
  if (o?.userData?.isPlayer || /player|character/.test(n)) return 'player';
  if (/companion/.test(n)) return 'companion';
  if (/pet/.test(n)) return 'pet';
  if (/mount/.test(n)) return 'mount';
  return 'model';
}

function Num({ label, value, onChange }) {
  return <label className="block text-[10px] text-white/55 uppercase tracking-wider">{label}<input type="number" value={Number.isFinite(value) ? value : 0} onChange={e => onChange(Number(e.target.value))} className="mt-1 w-full rounded-md bg-white/5 border border-white/10 px-2 py-1 text-xs text-white" /></label>;
}

export default function GameWorldEditorOverlay() {
  const [edit, setEdit] = useState(false);
  const [gameplay, setGameplay] = useState(false);
  const [movement, setMovement] = useState(false);
  const [selected, setSelected] = useState(null);
  const [tool, setTool] = useState('select');
  const [brush, setBrush] = useState(3);
  const [strength, setStrength] = useState(0.25);
  const [assets, setAssets] = useState([]);
  const helper = useRef(null);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);

  const scene = () => window.__gw3dScene || null;
  const camera = () => window.__gw3dCamera || null;
  const canvasAt = (e) => document.elementsFromPoint(e.clientX, e.clientY).find(x => x instanceof HTMLCanvasElement) || document.querySelector('canvas');

  const ensureConfig = (o) => {
    o.userData.editorConfig ||= { physics: { mass: 1, friction: .5, restitution: .15, gravity: 1 }, stats: { hp: 100, maxHP: 100, defense: 0, armor: 0, strength: 10, agility: 10, intelligence: 10, stamina: 10, mana: 0 }, damage: [], effects: [] };
    return o.userData.editorConfig;
  };

  const pick = (e) => {
    const s = scene(), c = camera(), canvas = canvasAt(e);
    if (!s || !c || !canvas) return null;
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(pointer, c);
    const hits = ray.intersectObjects(s.children, true).filter(h => h.object.visible && !h.object.userData?.editorHelper);
    return hits[0]?.object || null;
  };

  const select = (raw) => {
    let o = raw;
    while (o?.parent && o.parent.type !== 'Scene' && !o.userData?.editorSelectable) o = o.parent;
    if (!o) return;
    o.userData.editorSelectable = true;
    o.userData.editorKind = kindOf(o);
    ensureConfig(o);
    if (helper.current) scene()?.remove(helper.current);
    const h = new THREE.BoxHelper(o, 0x22d3ee); h.userData.editorHelper = true; scene()?.add(h); helper.current = h;
    setSelected(o);
    window.dispatchEvent(new CustomEvent('gameEditorObjectSelected', { detail: { object: o, kind: kindOf(o), config: o.userData.editorConfig } }));
  };

  const sculpt = (e) => {
    const o = pick(e); if (!o?.isMesh || kindOf(o) !== 'terrain') return;
    const pos = o.geometry?.attributes?.position; if (!pos) return;
    const p = o.worldToLocal(ray.intersectObject(o, true)[0]?.point?.clone() || new THREE.Vector3());
    for (let i=0;i<pos.count;i++) {
      const dx=pos.getX(i)-p.x, dz=pos.getZ(i)-p.z, d=Math.hypot(dx,dz); if(d>brush) continue;
      const f=1-d/brush, y=pos.getY(i);
      if(tool==='raise') pos.setY(i,y+strength*f);
      if(tool==='lower') pos.setY(i,y-strength*f);
      if(tool==='flatten') pos.setY(i,p.y);
      if(tool==='smooth') pos.setY(i,y+(p.y-y)*f*.2);
    }
    pos.needsUpdate=true; o.geometry.computeVertexNormals?.(); o.userData.editorTerrainDirty=true;
    window.dispatchEvent(new CustomEvent('gameEditorTerrainChanged',{detail:{object:o,geometry:o.geometry}}));
  };

  useEffect(() => {
    if (!edit) return;
    const down = (e) => {
      if(e.button!==0) return;
      const o=pick(e); if(!o) return;
      if(kindOf(o)==='terrain' && tool!=='select') sculpt(e); else select(o);
      e.preventDefault(); e.stopPropagation();
    };
    const move = e => { if(e.buttons&1 && tool!=='select') sculpt(e); };
    const key = e => { if(!edit || gameplay) return; if(e.target?.matches?.('input,textarea,select')) return; if(!movement) e.preventDefault(); };
    document.addEventListener('mousedown',down,true); document.addEventListener('mousemove',move,true); window.addEventListener('keydown',key,true);
    return () => { document.removeEventListener('mousedown',down,true); document.removeEventListener('mousemove',move,true); window.removeEventListener('keydown',key,true); };
  },[edit,gameplay,movement,tool,brush,strength]);

  useEffect(()=>()=>{ if(helper.current) scene()?.remove(helper.current); },[]);

  const change = (section,key,value) => { if(!selected) return; const cfg=ensureConfig(selected); cfg[section] ||= {}; cfg[section][key]=value; window.dispatchEvent(new CustomEvent('gameEditorObjectChanged',{detail:{object:selected,section,key,value,config:cfg}})); setSelected({...selected}); };
  const remove = () => { if(!selected) return; scene()?.remove(selected); if(helper.current) scene()?.remove(helper.current); window.dispatchEvent(new CustomEvent('gameEditorObjectRemoved',{detail:{object:selected}})); setSelected(null); };
  const addPrimitive = (type) => { const s=scene(); if(!s)return; const g=type==='sphere'?new THREE.SphereGeometry(.8,24,16):type==='cylinder'?new THREE.CylinderGeometry(.65,.65,1.5,24):new THREE.BoxGeometry(1.4,1.4,1.4); const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x8b5cf6})); m.name=`Editor ${type}`; m.position.set(0,1,0); m.userData.editorSource='user_asset'; s.add(m); select(m); };
  const importFile = file => { if(!file)return; const url=URL.createObjectURL(file); const type=/\.fbx$/i.test(file.name)?'model':/\.anim$/i.test(file.name)?'animation':'model'; setAssets(a=>[...a,{id:`${Date.now()}-${file.name}`,name:file.name,url,type}]); };
  const drop = asset => { if(!asset?.url)return; if(asset.type==='animation'){window.dispatchEvent(new CustomEvent('gameEditorAnimationImported',{detail:asset}));return;} const done=root=>{root.name=asset.name;root.userData.editorSource='user_asset';scene()?.add(root);select(root);}; if(asset.type==='model'&&/\.fbx$/i.test(asset.name))new FBXLoader().load(asset.url,done,undefined,console.error); else new GLTFLoader().load(asset.url,g=>done(g.scene||g.scenes?.[0]),undefined,console.error); };

  if(!edit) return <button onClick={()=>setEdit(true)} className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] rounded-full px-5 py-2 text-xs font-semibold text-cyan-100 border border-cyan-300/30 bg-slate-950/80 backdrop-blur-xl">EDIT</button>;
  const cfg=selected?ensureConfig(selected):null, stats=cfg?.stats||{}, physics=cfg?.physics||{};
  return <>
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10001] flex gap-2 rounded-full p-2 text-xs text-white border border-white/10 bg-slate-950/85 backdrop-blur-xl"><b className="text-cyan-300">EDIT MODE</b><button onClick={()=>setGameplay(v=>!v)} className="px-2 py-1 rounded bg-white/10">Gameplay {gameplay?'ON':'OFF'}</button><button onClick={()=>setMovement(v=>!v)} className="px-2 py-1 rounded bg-white/10">Move {movement?'ON':'OFF'}</button><button onClick={()=>{setEdit(false);setSelected(null)}} className="px-2 py-1 rounded bg-cyan-400/20">DONE</button></div>
    <aside className={`${glass} fixed left-0 top-0 bottom-[15%] w-[15vw] min-w-[240px] max-w-[380px] z-[10000] p-3 text-white overflow-y-auto`}>
      <div className="text-[10px] uppercase tracking-widest text-white/40">OBJECT INSPECTOR</div>
      {selected?<><h3 className="mt-2 text-sm text-cyan-200 truncate">{selected.name||'Unnamed object'}</h3><p className="text-[10px] text-white/40">{kindOf(selected)} · live Three.js object</p>
      <div className="mt-4 space-y-2"><b className="text-xs">Transform</b><Num label="X" value={selected.position.x} onChange={v=>selected.position.x=v}/><Num label="Y" value={selected.position.y} onChange={v=>selected.position.y=v}/><Num label="Z" value={selected.position.z} onChange={v=>selected.position.z=v}/><Num label="Scale" value={selected.scale.x} onChange={v=>selected.scale.setScalar(v)}/></div>
      <div className="mt-4 space-y-2"><b className="text-xs">Physics</b>{['mass','friction','restitution','gravity'].map(k=><Num key={k} label={k} value={physics[k]} onChange={v=>change('physics',k,v)}/>)}</div>
      <div className="mt-4 space-y-2"><b className="text-xs">Stats</b>{['hp','maxHP','defense','armor','strength','agility','intelligence','stamina','mana'].map(k=><Num key={k} label={k} value={stats[k]} onChange={v=>change('stats',k,v)}/>)}</div>
      <button onClick={()=>change('damage','base',Number(cfg.damage?.base||10))} className="mt-4 w-full rounded bg-white/10 px-2 py-2 text-xs">Damage: {cfg.damage?.base||10}</button><button onClick={remove} className="mt-2 w-full rounded bg-red-500/15 text-red-200 px-2 py-2 text-xs">Remove Object</button></>:<p className="mt-4 text-xs text-white/45">Click any object in the existing world. Base44-created and imported objects are selectable.</p>}
    </aside>
    <aside className={`${glass} fixed bottom-0 left-0 right-0 h-[15vh] min-h-[110px] z-[9998] p-3 text-white overflow-x-auto`}>
      <div className="flex items-center gap-3"><b className="text-xs text-cyan-200">WORLD ASSETS</b><label className="cursor-pointer rounded bg-white/10 px-3 py-2 text-xs">IMPORT<input type="file" accept=".glb,.gltf,.fbx,.obj,.anim" className="hidden" onChange={e=>importFile(e.target.files?.[0])}/></label>{['box','sphere','cylinder'].map(t=><button key={t} onClick={()=>addPrimitive(t)} className="rounded bg-white/10 px-3 py-2 text-xs">+ {t}</button>)}{assets.map(a=><div key={a.id} draggable onDragEnd={()=>drop(a)} onDoubleClick={()=>drop(a)} className="min-w-[130px] rounded-lg border border-white/10 bg-white/5 p-2 cursor-grab"><div className="text-xs truncate">{a.name}</div><div className="text-[10px] text-white/40">{a.type} · drag to world</div></div>)}</div>
    </aside>
    <aside className="fixed right-3 bottom-[16vh] z-[9999] rounded-xl p-2 bg-slate-950/75 backdrop-blur-xl border border-white/10 text-white"><div className="text-[10px] text-white/40 mb-1">TERRAIN</div>{['select','raise','lower','flatten','smooth'].map(t=><button key={t} onClick={()=>setTool(t)} className={`block w-20 mb-1 rounded px-2 py-1 text-[10px] ${tool===t?'bg-cyan-400/20 text-cyan-200':'bg-white/5'}`}>{t}</button>)}<Num label="Brush" value={brush} onChange={setBrush}/><Num label="Strength" value={strength} onChange={setStrength}/></aside>
  </>;
}
