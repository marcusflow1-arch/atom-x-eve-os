import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { X, Mountain, Box, Sparkles, Swords, Film, UserRound, Camera, Layers3, Save, Sun, Users, Shield, Plus, Trash2, Upload, Play, Square, Wand2 } from 'lucide-react';
import { getPlayerHUD, setPlayerHUD, subscribePlayerHUD } from '../playerHUDStore';
import AnimationMontageEditor from './AnimationMontageEditor';

const TABS = [
  ['world', 'World', Mountain], ['models', 'Models', Box], ['physics', 'Physics', Layers3],
  ['effects', 'Effects', Sparkles], ['damage', 'Damage', Swords], ['actors', 'Actors', Users],
  ['equipment', 'Equipment', Shield], ['animation', 'Animation', Film], ['stats', 'Stats', UserRound], ['camera', 'Camera', Camera],
];
const ROLES = ['player', 'enemy', 'companion', 'pet', 'mount'];
const DAMAGE_TYPES = ['physical', 'fire', 'ice', 'electric', 'poison', 'arcane', 'holy', 'shadow', 'wind', 'team'];
const TERRAIN_MODES = ['raise', 'lower', 'flatten', 'smooth'];
const DAMAGE_KEY = 'atomxe_editor_damage_profiles_v3';
const ACTOR_KEY = 'atomxe_editor_actor_stats_v3';
const EQUIPMENT_KEY = 'atomxe_editor_equipment_v3';
const SET_KEY = 'atomxe_editor_set_bonuses_v3';
const ANIM_KEY = 'atomxe_editor_animation_v3';
const WORLD_KEY = 'atomxe_preview_world_edits_v3';
const DEFAULT_STATS = { level: 1, xp: 0, hp: 100, maxHP: 100, attack: 10, defense: 5, armor: 0, strength: 10, agility: 10, intelligence: 10, stamina: 100, mana: 100, crit: 0, speed: 1, statPointValue: 1 };
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const asNum = (v, fallback = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };
const loadJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const saveJSON = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

function isEditorHelper(o) {
  const n = String(o?.name || '').toLowerCase();
  return !o || o.isLight || o.isCamera || o.userData?.editorOnly || o.userData?.editorHelper || n.includes('gridhelper') || n.includes('editorhelper');
}
function classify(o) {
  const t = `${o?.name || ''} ${o?.userData?.role || ''} ${o?.userData?.type || ''}`.toLowerCase();
  if (t.includes('enemy') || t.includes('boss')) return 'enemy';
  if (t.includes('companion')) return 'companion';
  if (t.includes('pet')) return 'pet';
  if (t.includes('mount')) return 'mount';
  if (t.includes('player') || o?.userData?.role === 'player') return 'player';
  return 'object';
}
function isTerrain(o) {
  const t = `${o?.name || ''} ${o?.userData?.type || ''}`.toLowerCase();
  return !!o?.isMesh && (o.userData?.isTerrain || /terrain|ground|grass|floor|map/.test(t));
}
function ensureConfig(o) {
  o.userData ||= {};
  o.userData.editorConfig ||= {
    physics: { mass: 1, friction: .5, restitution: .15, gravity: 1, collision: true, windResponse: 1, airResistance: .02, rollingResistance: .01, maxSpeed: 100, breakSoundBarrierAt: 343 },
    effects: { enabled: false, name: '', socket: '', offsetX: 0, offsetY: 0, offsetZ: 0, dirX: 0, dirY: 0, dirZ: 1, scale: 1, speed: 1, loop: false, frequency: 1 },
    damage: { base: 10, multiplier: 1, defenseMultiplier: 1, type: 'physical', elemental: 0, teamDamage: 0, hits: 1, cooldown: 0, selfDamage: 0 },
    animation: { name: '', speed: 1, loop: false, rootMotion: false, snapToRoot: true, blendIn: .1, blendOut: .1, chain: [] },
    stats: { ...DEFAULT_STATS }, equipment: { stats: [], text: '', setId: '' },
  };
  return o.userData.editorConfig;
}
function Section({ title, children, right }) { return <section className="rounded-2xl border border-white/10 bg-white/[.035] p-3 shadow-lg backdrop-blur-2xl"><div className="mb-2 flex items-center justify-between"><h3 className="text-[10px] font-bold uppercase tracking-[.22em] text-white/55">{title}</h3>{right}</div>{children}</section>; }
function Num({ label, value, onChange, step='any' }) { return <label className="block text-[9px] uppercase tracking-wider text-white/45">{label}<input type="number" step={step} value={Number.isFinite(Number(value)) ? value : 0} onChange={e=>onChange(Number(e.target.value))} className="mt-1 h-8 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[10px] text-white outline-none focus:border-cyan-300/40" /></label>; }
function Toggle({ label, value, onChange }) { return <label className="flex items-center justify-between gap-2 text-[9px] text-white/55"><span>{label}</span><input type="checkbox" checked={!!value} onChange={e=>onChange(e.target.checked)} /></label>; }

export default function GameWorldEditDock({ onClose }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('world');
  const [worldReady, setWorldReady] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [version, setVersion] = useState(0);
  const [gameplay, setGameplay] = useState(false);
  const [movement, setMovement] = useState(false);
  const [terrainMode, setTerrainMode] = useState('raise');
  const [brush, setBrush] = useState(5);
  const [strength, setStrength] = useState(.25);
  const [terrainTargetId, setTerrainTargetId] = useState('');
  const [weather, setWeather] = useState({ time: 8, weather: 'clear', season: 'summer' });
  const [player, setPlayer] = useState(() => getPlayerHUD());
  const [damageProfiles, setDamageProfiles] = useState(() => loadJSON(DAMAGE_KEY, [{ id: uid(), name: 'Basic Attack', type: 'physical', amount: 50, multiplier: 1, defenseMultiplier: 1, elemental: 0, teamDamage: 0, hits: 1, cooldown: 0, selfDamage: 0 }]));
  const [actors, setActors] = useState(() => loadJSON(ACTOR_KEY, Object.fromEntries(ROLES.map(r => [r, { ...DEFAULT_STATS, role: r }]))));
  const [actorRole, setActorRole] = useState('player');
  const [equipment, setEquipment] = useState(() => loadJSON(EQUIPMENT_KEY, {}));
  const [setBonuses, setSetBonuses] = useState(() => loadJSON(SET_KEY, []));
  const [assets, setAssets] = useState([]);
  const [animationConfig, setAnimationConfig] = useState(() => loadJSON(ANIM_KEY, { rootMotion: false, snapToRoot: true, playbackRate: 1, blendIn: .1, blendOut: .1, chain: [] }));
  const [cameraState, setCameraState] = useState({ fov: 55, distance: 5 });
  const [envState, setEnvState] = useState({});
  const [savedMessage, setSavedMessage] = useState('');
  const [montageOpen, setMontageOpen] = useState(false);
  const mixerRef = useRef(null);
  const actionRef = useRef(null);
  const helperRef = useRef(null);

  const scene = window.__gw3dScene || null;
  const camera = window.__gw3dCamera || null;
  const env = window.__worldEnv || null;
  const objects = useMemo(() => {
    if (!scene) return [];
    const rows = [];
    scene.traverse(o => { if (!isEditorHelper(o) && o.visible !== false && (o.isMesh || o.isGroup || o.isObject3D) && o !== scene) rows.push(o); });
    return rows.slice(0, 400);
  }, [scene, version, open]);
  const terrainObjects = useMemo(() => objects.filter(isTerrain), [objects]);
  const selected = objects.find(o => o.uuid === selectedId) || null;
  const selectedTerrain = terrainObjects.find(o => o.uuid === terrainTargetId) || (isTerrain(selected) ? selected : terrainObjects[0]) || null;
  const cfg = selected ? ensureConfig(selected) : null;

  useEffect(() => subscribePlayerHUD(setPlayer), []);
  useEffect(() => {
    if (!open) return;
    setWorldReady(!!window.__gw3dScene);
    const id = setInterval(() => {
      setWorldReady(!!window.__gw3dScene);
      const s = window.__worldEnv?.getState?.();
      if (s) setEnvState(s), setWeather(w => ({ ...w, time: s.time ?? w.time, weather: s.manualWeather || s.currentWeather || s.weather || w.weather, season: s.seasonId || s.season || w.season }));
      const c = window.__gw3dCamera;
      if (c) setCameraState(v => ({ ...v, fov: c.fov, distance: c.position.length() }));
      setVersion(v => v + 1);
    }, 700);
    return () => clearInterval(id);
  }, [open]);
  useEffect(() => { saveJSON(DAMAGE_KEY, damageProfiles); }, [damageProfiles]);
  useEffect(() => { saveJSON(ACTOR_KEY, actors); emit('atomXeEditorActorsChanged', actors); }, [actors]);
  useEffect(() => { saveJSON(EQUIPMENT_KEY, equipment); emit('atomXeEditorEquipmentChanged', equipment); }, [equipment]);
  useEffect(() => { saveJSON(SET_KEY, setBonuses); emit('atomXeEditorSetBonusesChanged', setBonuses); }, [setBonuses]);
  useEffect(() => { saveJSON(ANIM_KEY, animationConfig); emit('atomXeEditorAnimationChanged', animationConfig); }, [animationConfig]);
  useEffect(() => {
    document.body.dataset.atomXeEditorMode = open ? '1' : '0';
    window.__atomXeEditorMode = open;
    emit('atomXeEditorModeChanged', { enabled: open, gameplay, movement });
    return () => { delete document.body.dataset.atomXeEditorMode; window.__atomXeEditorMode = false; };
  }, [open, gameplay, movement]);

  const selectObject = raw => {
    if (!raw || !scene) return;
    let root = raw;
    while (root.parent && root.parent !== scene && root.parent.type !== 'Scene' && !root.userData?.editorSelectable) root = root.parent;
    root.userData ||= {};
    root.userData.editorSelectable = true;
    root.userData.editorKind = classify(root);
    ensureConfig(root);
    setSelectedId(root.uuid);
    if (isTerrain(root)) setTab('world');
    else if (classify(root) !== 'object') { setActorRole(classify(root)); setTab('actors'); }
    else setTab('models');
    setVersion(v => v + 1);
    emit('gameEditorObjectSelected', { object: root, kind: classify(root), config: root.userData.editorConfig });
  };

  useEffect(() => {
    if (!open || !scene || !camera) return;
    const canvas = scene.userData?.renderer?.domElement || document.querySelector('#game-world-canvas') || document.querySelector('canvas');
    if (!canvas) return;
    const ray = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    const pick = e => {
      if (e.target !== canvas && !canvas.contains?.(e.target)) return;
      if (gameplay && !movement) return;
      const r = canvas.getBoundingClientRect(); pointer.x=((e.clientX-r.left)/r.width)*2-1; pointer.y=-((e.clientY-r.top)/r.height)*2+1;
      ray.setFromCamera(pointer,camera);
      const hit=ray.intersectObjects(scene.children,true).find(h=>h.object&&!isEditorHelper(h.object)&&h.object.visible!==false);
      if (!hit?.object) return;
      selectObject(hit.object);
      if (!gameplay) { e.preventDefault(); e.stopPropagation(); }
    };
    canvas.addEventListener('pointerdown',pick,true); return()=>canvas.removeEventListener('pointerdown',pick,true);
  }, [open, gameplay, movement, scene, camera]);

  useEffect(() => {
    if (!open || !scene || !camera || !selectedTerrain || tab !== 'world' || gameplay) return;
    const canvas=scene.userData?.renderer?.domElement||document.querySelector('#game-world-canvas')||document.querySelector('canvas'); if(!canvas)return;
    const ray=new THREE.Raycaster(); const pointer=new THREE.Vector2();
    const sculpt=e=>{if(e.buttons!==1)return;const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(pointer,camera);const hit=ray.intersectObject(selectedTerrain,true)[0];const pos=selectedTerrain.geometry?.attributes?.position;if(!hit?.point||!pos)return;const local=selectedTerrain.worldToLocal(hit.point.clone());for(let i=0;i<pos.count;i++){const dx=pos.getX(i)-local.x,dz=pos.getZ(i)-local.z,d=Math.hypot(dx,dz);if(d>brush)continue;const f=1-d/brush,y=pos.getY(i);if(terrainMode==='raise')pos.setY(i,y+strength*f*.08);if(terrainMode==='lower')pos.setY(i,y-strength*f*.08);if(terrainMode==='flatten')pos.setY(i,y+(local.y-y)*strength*f*.15);if(terrainMode==='smooth')pos.setY(i,y+(local.y-y)*strength*f*.04);}pos.needsUpdate=true;selectedTerrain.geometry.computeVertexNormals?.();selectedTerrain.geometry.computeBoundingSphere?.();selectedTerrain.userData.isTerrain=true;selectedTerrain.userData.editorTerrainDirty=true;setVersion(v=>v+1);emit('gameEditorTerrainChanged',{object:selectedTerrain,mode:terrainMode});};
    canvas.addEventListener('pointermove',sculpt,true); return()=>canvas.removeEventListener('pointermove',sculpt,true);
  }, [open,scene,camera,selectedTerrain,tab,terrainMode,brush,strength,gameplay]);

  useEffect(() => {
    if (helperRef.current && scene) scene.remove(helperRef.current); helperRef.current=null;
    if(selected&&scene){const h=new THREE.BoxHelper(selected,0x63e6ff);h.name='EditorHelperSelection';h.userData.editorOnly=true;h.userData.editorHelper=true;scene.add(h);helperRef.current=h;}
    return()=>{if(helperRef.current&&scene)scene.remove(helperRef.current);};
  }, [selected,scene]);

  const updateTransform=(key,value)=>{if(!selected)return;const n=asNum(value);const map={px:['position','x'],py:['position','y'],pz:['position','z'],rx:['rotation','x'],ry:['rotation','y'],rz:['rotation','z'],sx:['scale','x'],sy:['scale','y'],sz:['scale','z']};const[g,a]=map[key];selected[g][a]=g==='scale'?Math.max(.001,n):n;setVersion(v=>v+1);emit('gameEditorObjectChanged',{object:selected,section:'transform',key,value:n});};
  const changeConfig=(section,key,value)=>{if(!selected)return;const c=ensureConfig(selected);c[section] ||= {};c[section][key]=value;selected.userData.editorConfig=c;setVersion(v=>v+1);emit('gameEditorObjectChanged',{object:selected,section,key,value,config:c});};
  const updateActor=(key,value)=>setActors(a=>({...a,[actorRole]:{...a[actorRole],[key]:asNum(value)}}));
  const removeSelected=()=>{if(!selected||!scene)return;scene.remove(selected);setSelectedId('');setVersion(v=>v+1);emit('gameEditorObjectRemoved',{object:selected});};
  const addPrimitive=type=>{if(!scene)return;let g=type==='sphere'?new THREE.SphereGeometry(.5,24,24):type==='cylinder'?new THREE.CylinderGeometry(.5,.5,1,24):type==='plane'?new THREE.PlaneGeometry(2,2,16,16):new THREE.BoxGeometry(1,1,1);const m=new THREE.MeshStandardMaterial({color:0x7dd3fc,metalness:.2,roughness:.45});const o=new THREE.Mesh(g,m);o.name=`Editor ${type}`;o.position.set(0,type==='plane'?0:.5,0);o.userData.editorAsset=true;ensureConfig(o);scene.add(o);selectObject(o);};
  const loadAsset=async asset=>{if(!scene||!asset)return;try{let root;if(asset.type==='gltf'||asset.type==='glb')root=(await new GLTFLoader().loadAsync(asset.url)).scene;else if(asset.type==='fbx')root=await new FBXLoader().loadAsync(asset.url);else root=await new OBJLoader().loadAsync(asset.url);root.name=asset.name.replace(/\.[^.]+$/,'');root.userData.editorAsset=true;ensureConfig(root);scene.add(root);selectObject(root);}catch(e){console.error('[GameWorldEditDock] asset load failed',e);}};
  const importFiles=files=>[...files].forEach(file=>{const ext=file.name.split('.').pop().toLowerCase();if(!['glb','gltf','fbx','obj'].includes(ext))return;const url=URL.createObjectURL(file);setAssets(v=>[...v,{id:uid(),name:file.name,type:ext,url}]);});
  const addDamage=()=>setDamageProfiles(p=>[...p,{id:uid(),name:`Damage ${p.length+1}`,type:'physical',amount:25,multiplier:1,defenseMultiplier:1,elemental:0,teamDamage:0,hits:1,cooldown:0,selfDamage:0}]);
  const updateDamage=(id,key,value)=>setDamageProfiles(p=>p.map(d=>d.id===id?{...d,[key],...(['name','type'].includes(key)?{[key]:value}:{[key]:asNum(value)})}:d));
  const removeDamage=id=>setDamageProfiles(p=>p.filter(d=>d.id!==id));
  const addSet=()=>setSetBonuses(p=>[...p,{id:uid(),name:'New Set',description:'',effect:'',piecesRequired:2,pieces:[],trigger:'equip',enabled:true}]);
  const updateSet=(id,key,value)=>setSetBonuses(p=>p.map(s=>s.id===id?{...s,[key]:value}:s));
  const saveWorld=()=>{const state={version:5,objects:objects.map(o=>({id:o.uuid,name:o.name,role:classify(o),position:o.position.toArray(),rotation:[o.rotation.x,o.rotation.y,o.rotation.z],scale:o.scale.toArray(),userData:o.userData?.editorConfig||{}})),terrain:terrainObjects.map(o=>({id:o.uuid,name:o.name,modified:!!o.userData?.editorTerrainDirty})),weather:env?.getState?.()||weather,actors,equipment,setBonuses};saveJSON(WORLD_KEY,state);emit('atomXeEditorWorldSaved',state);setSavedMessage('Current live world saved');setTimeout(()=>setSavedMessage(''),1600);};
  const applyEnvironment=patch=>{if(patch.time!=null){env?.setTime?.(patch.time);setWeather(w=>({...w,time:patch.time}));}if(patch.weather){env?.setWeather?.(patch.weather==='auto'?null:patch.weather);setWeather(w=>({...w,weather:patch.weather}));}if(patch.season){env?.setSeason?.(patch.season);setWeather(w=>({...w,season:patch.season}));}};
  const stopAnimation=()=>{actionRef.current?.fadeOut?.(.15);actionRef.current=null;};
  const playAnimation=()=>{if(!selected)return;let clips=selected.animations||[];selected.traverse?.(c=>{if(c.animations?.length)clips=c.animations;});if(!clips.length)return;if(!mixerRef.current||mixerRef.current.getRoot()!==selected)mixerRef.current=new THREE.AnimationMixer(selected);stopAnimation();const a=mixerRef.current.clipAction(clips[0]);a.reset().setEffectiveTimeScale(animationConfig.playbackRate||1).fadeIn(.15).play();actionRef.current=a;};
  useEffect(()=>{if(!mixerRef.current)return;const id=setInterval(()=>mixerRef.current?.update(.016),16);return()=>clearInterval(id);},[selected]);
  useEffect(()=>{if(!open||!scene)return;const canvas=scene.userData?.renderer?.domElement||document.querySelector('#game-world-canvas')||document.querySelector('canvas');if(!canvas)return;const dragOver=e=>e.preventDefault();const drop=e=>{e.preventDefault();const id=e.dataTransfer.getData('application/x-game-editor-asset');const a=assets.find(x=>x.id===id);if(a)loadAsset(a);};canvas.addEventListener('dragover',dragOver);canvas.addEventListener('drop',drop);return()=>{canvas.removeEventListener('dragover',dragOver);canvas.removeEventListener('drop',drop);};},[open,scene,assets]);

  if(!open)return <button onClick={()=>setOpen(true)} className="fixed left-1/2 top-[88px] z-[120] -translate-x-1/2 rounded-full border border-white/15 bg-black/45 px-4 py-2 text-xs font-semibold text-white/90 shadow-xl backdrop-blur-xl hover:bg-black/65">✦ Edit World</button>;
  return <>
    <aside className="pointer-events-auto fixed inset-y-0 right-0 z-[120] flex w-[30vw] min-w-[360px] max-w-[520px] flex-col border-l border-white/10 bg-slate-950/76 shadow-2xl backdrop-blur-3xl">
      <div className="border-b border-white/10 px-3 py-3"><div className="flex items-center justify-between"><div><div className="text-[9px] uppercase tracking-[.28em] text-orange-300/80">ATOM×EVE · LIVE WORLD</div><div className="text-sm font-bold text-white">Edit Mode</div></div><button onClick={()=>{setOpen(false);onClose?.();}} className="rounded-lg border border-white/10 p-1.5 text-white/45 hover:bg-white/5 hover:text-white"><X className="h-4 w-4"/></button></div><div className="mt-2 flex flex-wrap gap-1"><button onClick={()=>setGameplay(v=>!v)} className={`rounded-lg border px-2 py-1 text-[8px] ${gameplay?'border-emerald-300/30 bg-emerald-300/10 text-emerald-100':'border-white/10 bg-white/[.02] text-white/45'}`}>Gameplay {gameplay?'ON':'OFF'}</button><button onClick={()=>setMovement(v=>!v)} className={`rounded-lg border px-2 py-1 text-[8px] ${movement?'border-cyan-300/30 bg-cyan-300/10 text-cyan-100':'border-white/10 bg-white/[.02] text-white/45'}`}>Movement {movement?'ON':'OFF'}</button><button onClick={saveWorld} className="ml-auto rounded-lg border border-white/10 bg-white/[.03] px-2 py-1 text-[8px] text-white/65"><Save className="mr-1 inline h-3 w-3"/>Save</button></div><div className="mt-2 rounded-xl border border-cyan-300/10 bg-cyan-300/[.03] px-2.5 py-2 text-[9px] leading-4 text-white/45">The center remains the existing live Three.js world. Click an object in the viewport and edit it here.</div></div>
      <div className="flex gap-1 overflow-x-auto border-b border-white/10 p-2" style={{scrollbarWidth:'none'}}>{TABS.map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} className={`shrink-0 rounded-lg border px-2 py-1.5 text-[9px] ${tab===id?'border-orange-400/30 bg-orange-400/10 text-orange-200':'border-white/10 bg-white/[.02] text-white/45 hover:text-white/80'}`}><Icon className="mr-1 inline h-3 w-3"/>{label}</button>)}</div>
      <div className="border-b border-white/10 px-3 py-2 text-[9px] text-white/40"><span>{selected?`Selected: ${selected.name||selected.type}`:'Click any existing object to select it'}</span><span className="float-right text-emerald-200">{worldReady?'Live':'Waiting'}</span></div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {tab==='world'&&<><Section title="World Snapshot"><div className="grid grid-cols-2 gap-2 text-[10px]"><div className="rounded-lg bg-white/[.03] p-2"><div className="text-white/35">Player</div><div className="font-semibold text-white">Lv {player.level}</div><div className="text-white/35">{player.xp} XP · {player.hp}/{player.maxHP} HP</div></div><div className="rounded-lg bg-white/[.03] p-2"><div className="text-white/35">World</div><div className="font-semibold text-white">{worldReady?'Live':'Waiting'}</div><div className="text-white/35">{Object.keys(envState).length?'Environment linked':'Environment pending'}</div></div></div></Section><Section title="Existing Terrain"><select value={terrainTargetId||selectedTerrain?.uuid||''} onChange={e=>setTerrainTargetId(e.target.value)} className="h-8 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[10px] text-white"><option value="">{terrainObjects.length?'Select existing terrain':'No editable ground mesh detected'}</option>{terrainObjects.map(o=><option key={o.uuid} value={o.uuid}>{o.name||'Terrain mesh'}</option>)}</select><div className="mt-2 grid grid-cols-4 gap-1">{TERRAIN_MODES.map(m=><button key={m} onClick={()=>setTerrainMode(m)} className={`rounded-lg border px-1 py-1.5 text-[8px] capitalize ${terrainMode===m?'border-cyan-300/30 bg-cyan-300/10 text-cyan-100':'border-white/10 text-white/45'}`}>{m}</button>)}</div><label className="mt-2 block text-[9px] text-white/45">Brush <span className="float-right">{brush.toFixed(1)}</span><input type="range" min=".5" max="20" step=".5" value={brush} onChange={e=>setBrush(Number(e.target.value))} className="mt-1 w-full"/></label><label className="mt-2 block text-[9px] text-white/45">Strength <span className="float-right">{strength.toFixed(2)}</span><input type="range" min=".01" max="1" step=".01" value={strength} onChange={e=>setStrength(Number(e.target.value))} className="mt-1 w-full"/></label><div className="mt-2 text-[9px] leading-4 text-white/35">Drag directly on the current world terrain. No replacement terrain scene is created.</div></Section>{selected&&<Section title="Transform Selected"><div className="grid grid-cols-3 gap-1">{[['px','X'],['py','Y'],['pz','Z'],['rx','RX'],['ry','RY'],['rz','RZ'],['sx','SX'],['sy','SY'],['sz','SZ']].map(([k,l])=>{const [g,a]={px:['position','x'],py:['position','y'],pz:['position','z'],rx:['rotation','x'],ry:['rotation','y'],rz:['rotation','z'],sx:['scale','x'],sy:['scale','y'],sz:['scale','z']}[k];return <Num key={k} label={l} value={selected[g][a]} onChange={v=>updateTransform(k,v)}/>;})}</div><button onClick={removeSelected} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-red-300/10 bg-red-400/10 py-2 text-[9px] text-red-100"><Trash2 className="h-3 w-3"/>Remove Selected Object</button></Section>}<Section title="Sky / Weather"><div className="grid grid-cols-2 gap-2"><Num label="Time" value={weather.time} onChange={v=>applyEnvironment({time:clamp(v,0,24)})}/><label className="block text-[9px] uppercase text-white/45">Season<select value={weather.season} onChange={e=>applyEnvironment({season:e.target.value})} className="mt-1 h-8 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[10px] text-white"><option>spring</option><option>summer</option><option>autumn</option><option>winter</option></select></label></div><div className="mt-2 grid grid-cols-4 gap-1">{['clear','cloudy','rain','snow','storm','fog','hail','auto'].map(w=><button key={w} onClick={()=>applyEnvironment({weather:w})} className={`rounded-lg border px-1 py-1.5 text-[8px] ${weather.weather===w?'border-cyan-300/30 bg-cyan-300/10 text-cyan-100':'border-white/10 text-white/45'}`}>{w}</button>)}</div><div className="mt-2 text-[9px] text-white/35"><Sun className="mr-1 inline h-3 w-3"/>{envState?.currentWeather||weather.weather} · {envState?.seasonLabel||weather.season}</div></Section></>}
        {tab==='models'&&<><Section title="Models In Current World"><div className="mb-2 text-[9px] text-white/40">Base44-created and imported objects share the same viewport selection path.</div><div className="space-y-1">{objects.filter(o=>o.isMesh||o.isGroup).slice(0,100).map(o=><button key={o.uuid} onClick={()=>selectObject(o)} className={`w-full rounded-lg border px-2 py-1.5 text-left text-[9px] ${selected?.uuid===o.uuid?'border-cyan-300/30 bg-cyan-300/10 text-cyan-100':'border-white/10 bg-white/[.02] text-white/55'}`}>{o.name||'Unnamed object'} <span className="float-right text-white/25">{classify(o)}</span></button>)}</div></Section><Section title="Asset Library" right={<label className="cursor-pointer rounded-md bg-white/5 px-2 py-1 text-[8px] text-white/65"><Upload className="mr-1 inline h-3 w-3"/>Import<input type="file" multiple accept=".glb,.gltf,.fbx,.obj" className="hidden" onChange={e=>importFiles(e.target.files||[])}/></label>}><div className="grid grid-cols-2 gap-1">{assets.map(a=><button key={a.id} onDoubleClick={()=>loadAsset(a)} draggable onDragStart={e=>e.dataTransfer.setData('application/x-game-editor-asset',a.id)} className="rounded-lg border border-white/10 bg-white/[.025] p-2 text-left"><div className="truncate text-[9px] text-white">{a.name}</div><div className="text-[8px] text-white/35">{a.type} · double-click / drag</div></button>)}</div><div className="mt-2 grid grid-cols-3 gap-1"><button onClick={()=>addPrimitive('box')} className="rounded-lg bg-white/5 py-1.5 text-[8px] text-white/60"><Plus className="mr-1 inline h-3 w-3"/>Box</button><button onClick={()=>addPrimitive('sphere')} className="rounded-lg bg-white/5 py-1.5 text-[8px] text-white/60">Sphere</button><button onClick={()=>addPrimitive('cylinder')} className="rounded-lg bg-white/5 py-1.5 text-[8px] text-white/60">Cylinder</button></div></Section></>}
        {tab==='physics'&&<Section title="Selected Object Physics">{selected?<><div className="grid grid-cols-2 gap-2">{[['mass','Mass'],['friction','Friction'],['restitution','Restitution'],['gravity','Gravity'],['windResponse','Wind Response'],['airResistance','Air Resistance'],['rollingResistance','Rolling Resistance'],['maxSpeed','Max Speed'],['breakSoundBarrierAt','Sound Barrier Speed']].map(([k,l])=><Num key={k} label={l} value={cfg.physics[k]} onChange={v=>changeConfig('physics',k,v)}/>)}</div><div className="mt-2 space-y-2"><Toggle label="Collision Enabled" value={cfg.physics.collision} onChange={v=>changeConfig('physics','collision',v)}/><Toggle label="Affected By Wind" value={cfg.physics.windResponse>0} onChange={v=>changeConfig('physics','windResponse',v?1:0)}/></div></>:<div className="text-[9px] text-white/40">Select an existing object in the viewport first.</div>}</Section>}
        {tab==='effects'&&<Section title="Effects / Ability Attachment">{selected?<><div className="grid grid-cols-2 gap-2"><Toggle label="Enabled" value={cfg.effects.enabled} onChange={v=>changeConfig('effects','enabled',v)}/><Toggle label="Loop" value={cfg.effects.loop} onChange={v=>changeConfig('effects','loop',v)}/><Num label="Scale" value={cfg.effects.scale} onChange={v=>changeConfig('effects','scale',v)}/><Num label="Speed" value={cfg.effects.speed} onChange={v=>changeConfig('effects','speed',v)}/><Num label="Frequency" value={cfg.effects.frequency} onChange={v=>changeConfig('effects','frequency',v)}/><label className="text-[9px] uppercase text-white/45">Bone / Socket<input value={cfg.effects.socket||''} onChange={e=>changeConfig('effects','socket',e.target.value)} className="mt-1 h-8 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[10px] text-white"/></label></div><div className="mt-2 grid grid-cols-3 gap-2">{[['offsetX','Offset X'],['offsetY','Offset Y'],['offsetZ','Offset Z'],['dirX','Direction X'],['dirY','Direction Y'],['dirZ','Direction Z']].map(([k,l])=><Num key={k} label={l} value={cfg.effects[k]} onChange={v=>changeConfig('effects',k,v)}/>)}</div></>:<div className="text-[9px] text-white/40">Select a 3D object to configure an effect.</div>}</Section>}
        {tab==='damage'&&<><div className="grid grid-cols-5 gap-1">{ROLES.map(r=><button key={r} onClick={()=>setActorRole(r)} className={`rounded-lg border px-1 py-1.5 text-[8px] capitalize ${actorRole===r?'border-cyan-300/30 bg-cyan-300/10 text-cyan-100':'border-white/10 text-white/45'}`}>{r==='enemy'?'Enemy AI':r}</button>)}</div><Section title="Detailed Damage System" right={<button onClick={addDamage} className="rounded-md bg-white/5 px-2 py-1 text-[8px] text-white/65"><Plus className="mr-1 inline h-3 w-3"/>Add</button>}><div className="space-y-2">{damageProfiles.map(d=><div key={d.id} className="rounded-xl border border-white/10 bg-white/[.02] p-2"><div className="grid grid-cols-2 gap-1"><input value={d.name} onChange={e=>updateDamage(d.id,'name',e.target.value)} className="h-7 rounded-lg border border-white/10 bg-black/30 px-2 text-[9px] text-white"/><select value={d.type} onChange={e=>updateDamage(d.id,'type',e.target.value)} className="h-7 rounded-lg border border-white/10 bg-black/30 px-1 text-[9px] text-white">{DAMAGE_TYPES.map(t=><option key={t}>{t}</option>)}</select></div><div className="mt-1 grid grid-cols-4 gap-1">{[['amount','Amount'],['multiplier','Multiplier'],['defenseMultiplier','Defense Mult.'],['elemental','Elemental']].map(([k,l])=><input key={k} type="number" value={d[k]} onChange={e=>updateDamage(d.id,k,e.target.value)} placeholder={l} className="h-7 rounded-lg border border-white/10 bg-black/30 px-2 text-[8px] text-white"/>)}</div><div className="mt-1 grid grid-cols-4 gap-1">{[['teamDamage','Team'],['hits','Hits'],['cooldown','Cooldown'],['selfDamage','Self']].map(([k,l])=><input key={k} type="number" value={d[k]} onChange={e=>updateDamage(d.id,k,e.target.value)} placeholder={l} className="h-7 rounded-lg border border-white/10 bg-black/30 px-2 text-[8px] text-white"/>)}</div><button onClick={()=>removeDamage(d.id)} className="mt-1 text-[8px] text-red-300/70">Remove</button></div>)}</div></Section></>}
        {tab==='actors'&&<><div className="grid grid-cols-5 gap-1">{ROLES.map(r=><button key={r} onClick={()=>setActorRole(r)} className={`rounded-lg border px-1 py-1.5 text-[8px] capitalize ${actorRole===r?'border-cyan-300/30 bg-cyan-300/10 text-cyan-100':'border-white/10 text-white/45'}`}>{r==='enemy'?'Enemy AI':r}</button>)}</div><Section title={`${actorRole==='enemy'?'Enemy AI':actorRole} Stats`}><div className="grid grid-cols-2 gap-2">{Object.keys(DEFAULT_STATS).map(k=><Num key={k} label={k} value={actors[actorRole]?.[k]??0} onChange={v=>updateActor(k,v)}/>)}</div></Section></>}
        {tab==='equipment'&&<><Section title="Selected Equipment">{selected?<><div className="text-[9px] text-white/40">Stats attach to the selected 3D equipment model.</div>{(equipment[selected.uuid]?.stats||[]).map((s,i)=><div key={i} className="mt-1 grid grid-cols-3 gap-1"><input value={s.name} onChange={e=>setEquipment(x=>({...x,[selected.uuid]:{...(x[selected.uuid]||{}),stats:(x[selected.uuid]?.stats||[]).map((a,n)=>n===i?{...a,name:e.target.value}:a)}}))} className="h-7 rounded border border-white/10 bg-black/30 px-2 text-[8px] text-white"/><select value={s.type} onChange={e=>setEquipment(x=>({...x,[selected.uuid]:{...(x[selected.uuid]||{}),stats:(x[selected.uuid]?.stats||[]).map((a,n)=>n===i?{...a,type:e.target.value}:a)}}))} className="h-7 rounded border border-white/10 bg-black/30 text-[8px] text-white"><option>HP</option><option>Defense</option><option>Armor</option><option>Damage</option><option>Elemental</option><option>Passive</option></select><input type="number" value={s.value} onChange={e=>setEquipment(x=>({...x,[selected.uuid]:{...(x[selected.uuid]||{}),stats:(x[selected.uuid]?.stats||[]).map((a,n)=>n===i?{...a,value:Number(e.target.value)}:a)}}))} className="h-7 rounded border border-white/10 bg-black/30 px-2 text-[8px] text-white"/></div>)}<button onClick={()=>setEquipment(x=>({...x,[selected.uuid]:{...(x[selected.uuid]||{}),stats:[...(x[selected.uuid]?.stats||[]),{name:'New Stat',type:'HP',value:0}]}}))} className="mt-2 w-full rounded-lg bg-white/5 py-2 text-[9px] text-white/65"><Plus className="mr-1 inline h-3 w-3"/>Add equipment stat</button><textarea value={equipment[selected.uuid]?.text||''} onChange={e=>setEquipment(x=>({...x,[selected.uuid]:{...(x[selected.uuid]||{}),text:e.target.value}}))} placeholder="Text shown on item" className="mt-2 h-16 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-[9px] text-white"/></>:<div className="text-[9px] text-white/40">Select a 3D equipment model first.</div>}</Section><Section title="Set Bonuses" right={<button onClick={addSet} className="rounded bg-white/5 px-2 py-1 text-[8px] text-white/65"><Plus className="mr-1 inline h-3 w-3"/>Add</button>}>{setBonuses.map(s=><div key={s.id} className="mb-2 rounded-xl border border-white/10 bg-white/[.02] p-2"><input value={s.name} onChange={e=>updateSet(s.id,'name',e.target.value)} className="h-7 w-full rounded border border-white/10 bg-black/30 px-2 text-[9px] text-white"/><input value={s.description} onChange={e=>updateSet(s.id,'description',e.target.value)} placeholder="Description" className="mt-1 h-7 w-full rounded border border-white/10 bg-black/30 px-2 text-[9px] text-white"/><input value={s.effect} onChange={e=>updateSet(s.id,'effect',e.target.value)} placeholder="Effect" className="mt-1 h-7 w-full rounded border border-white/10 bg-black/30 px-2 text-[9px] text-white"/><Num label="Pieces Required" value={s.piecesRequired} onChange={v=>updateSet(s.id,'piecesRequired',v)}/></div>)}</Section></>}
        {tab==='animation'&&<><Section title="Animation / Montage"><div className="grid grid-cols-2 gap-2"><Toggle label="Root Motion" value={animationConfig.rootMotion} onChange={v=>setAnimationConfig(x=>({...x,rootMotion:v}))}/><Toggle label="Snap To Root" value={animationConfig.snapToRoot} onChange={v=>setAnimationConfig(x=>({...x,snapToRoot:v}))}/><Num label="Playback Rate" value={animationConfig.playbackRate} onChange={v=>setAnimationConfig(x=>({...x,playbackRate:v}))}/><Num label="Blend In" value={animationConfig.blendIn} onChange={v=>setAnimationConfig(x=>({...x,blendIn:v}))}/><Num label="Blend Out" value={animationConfig.blendOut} onChange={v=>setAnimationConfig(x=>({...x,blendOut:v}))}/></div>{selected&&<div className="mt-2 flex gap-1"><button onClick={playAnimation} className="flex-1 rounded-lg bg-cyan-400/10 py-2 text-[9px] text-cyan-100"><Play className="mr-1 inline h-3 w-3"/>Play</button><button onClick={stopAnimation} className="flex-1 rounded-lg bg-white/5 py-2 text-[9px] text-white/60"><Square className="mr-1 inline h-3 w-3"/>Stop</button></div>}<div className="mt-2 flex items-center justify-between"><div className="text-[9px] text-white/35">Animation chains, root motion and timing live here.</div><button onClick={()=>setMontageOpen(true)} className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1.5 text-[9px] text-cyan-100"><Wand2 className="mr-1 inline h-3 w-3"/>Open Montage Workspace</button></div></Section></>}
        {tab==='stats'&&<Section title="Live Character Save"><div className="grid grid-cols-2 gap-2">{Object.keys(DEFAULT_STATS).map(k=><Num key={k} label={k} value={player[k]??0} onChange={v=>setPlayerHUD({[k]:v})}/>)}</div></Section>}
        {tab==='camera'&&<Section title="Live Camera"><Num label="FOV" value={cameraState.fov} onChange={v=>{const c=window.__gw3dCamera;const f=clamp(v,35,100);if(c){c.fov=f;c.updateProjectionMatrix();}setCameraState(s=>({...s,fov:f}));}}/><div className="mt-2 text-[9px] text-white/35">Camera edits remain on the current live Game Viewer camera.</div></Section>}
      </div>
      {savedMessage&&<div className="border-t border-white/10 px-3 py-2 text-[9px] text-emerald-200">{savedMessage}</div>}
      <div className="border-t border-white/10 px-3 py-2 text-[8px] text-white/25">LIVE WORLD EDITOR · one editor · current Three.js scene</div>
    </aside>
    {montageOpen&&<AnimationMontageEditor selected={selected} onClose={()=>setMontageOpen(false)} />}
  </>;
}
