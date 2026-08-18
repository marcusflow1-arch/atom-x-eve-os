import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Box, CloudSun, Crosshair, Film, Gamepad2, Mountain, Save, Swords, Sun, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

const TAB = [
  ['world', 'World', Mountain],
  ['models', 'Models', Box],
  ['player', 'Player', Gamepad2],
  ['damage', 'Damage', Swords],
  ['boss', 'Bosses', Crosshair],
  ['animation', 'Animation', Film],
  ['weather', 'Weather', CloudSun],
];

const DAMAGE_TYPES = ['physical', 'fire', 'ice', 'electric', 'poison', 'arcane', 'holy', 'shadow'];

function sceneObjects(scene) {
  if (!scene) return [];
  const rows = [];
  scene.children.forEach((o) => {
    if (!o || !o.visible) return;
    if (['grid', 'ground', 'SkyDome', 'SunDisc', 'MoonDisc', 'Stars', 'Rain', 'Snow', 'Lightning', 'MoonLight', 'CloudGroup'].includes(o.name)) return;
    if (o.isLight || o.isCamera) return;
    rows.push(o);
  });
  return rows;
}

function asNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function GameWorldEditController() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('world');
  const [selectedId, setSelectedId] = useState('');
  const [objectsVersion, setObjectsVersion] = useState(0);
  const [brushSize, setBrushSize] = useState(2);
  const [brushStrength, setBrushStrength] = useState(0.25);
  const [player, setPlayer] = useState({ level: 1, xp: 0, hp: 100, maxHP: 100, attack: 10, defense: 5, stamina: 100 });
  const [damagePackets, setDamagePackets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('atom_xe_preview_damage_profile')) || [{ type: 'physical', amount: 50, multiplier: 1, defense: 0 }]; }
    catch { return [{ type: 'physical', amount: 50, multiplier: 1, defense: 0 }]; }
  });
  const [bossConfig, setBossConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem('atom_xe_preview_boss_config')) || { worldDamage: true, defaultHP: 14000, outgoingMultiplier: 1, incomingMultiplier: 1 }; }
    catch { return { worldDamage: true, defaultHP: 14000, outgoingMultiplier: 1, incomingMultiplier: 1 }; }
  });
  const [weather, setWeather] = useState({ time: 8, weather: 'clear', seasonId: 'summer', climate: 'michigan', moonIllum: 0.5 });
  const [savedMessage, setSavedMessage] = useState('');

  const scene = window.__gw3dScene;
  const camera = window.__gw3dCamera;
  const env = window.__worldEnv;
  const objects = useMemo(() => sceneObjects(scene), [scene, objectsVersion, open]);
  const selected = objects.find((o) => o.uuid === selectedId) || null;

  useEffect(() => {
    if (!open) return undefined;
    const refresh = () => setObjectsVersion((v) => v + 1);
    const id = setInterval(refresh, 800);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!open || tab !== 'world' || !scene) return undefined;
    const canvas = scene?.userData?.renderer?.domElement || document.querySelector('#game-world-canvas') || document.querySelector('canvas');
    const activeCamera = camera;
    if (!canvas || !activeCamera) return undefined;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, activeCamera);
      const hits = raycaster.intersectObjects(scene.children, true).filter((h) => h.object?.visible && !h.object?.name?.toLowerCase().includes('cloud'));
      const hit = hits[0]?.object;
      if (!hit) return;
      let root = hit;
      while (root.parent && root.parent !== scene && root.parent.type !== 'Scene') root = root.parent;
      setSelectedId(root.uuid);
      setObjectsVersion((v) => v + 1);
    };
    canvas.addEventListener('pointerdown', pick, true);
    return () => canvas.removeEventListener('pointerdown', pick, true);
  }, [open, tab, scene, camera]);

  useEffect(() => {
    if (!open) return undefined;
    const read = () => {
      const next = env?.getState?.();
      if (next) setWeather({ time: next.time ?? 8, weather: next.manualWeather || next.weather || 'clear', seasonId: next.seasonId || 'summer', climate: next.climate || 'michigan', moonIllum: next.moonIllum ?? 0.5 });
      try {
        const saved = JSON.parse(localStorage.getItem('atom_xe_preview_player_stats'));
        if (saved) setPlayer((p) => ({ ...p, ...saved }));
      } catch {}
    };
    read();
    const id = setInterval(read, 700);
    return () => clearInterval(id);
  }, [open, env]);

  useEffect(() => {
    if (!open) return;
    try { localStorage.setItem('atom_xe_preview_damage_profile', JSON.stringify(damagePackets)); } catch {}
    window.dispatchEvent(new CustomEvent('atomXeEditorDamageConfigChanged', { detail: damagePackets }));
  }, [damagePackets, open]);

  useEffect(() => {
    if (!open) return;
    try { localStorage.setItem('atom_xe_preview_boss_config', JSON.stringify(bossConfig)); } catch {}
    window.dispatchEvent(new CustomEvent('atomXeEditorBossConfigChanged', { detail: bossConfig }));
  }, [bossConfig, open]);

  useEffect(() => {
    if (!open || !env) return;
    env.setTime?.(weather.time);
  }, [weather.time, open, env]);

  const savePlayer = () => {
    try { localStorage.setItem('atom_xe_preview_player_stats', JSON.stringify(player)); } catch {}
    window.dispatchEvent(new CustomEvent('atomXeEditorPlayerStatsChanged', { detail: player }));
    setSavedMessage('Player stats saved to the preview world');
    setTimeout(() => setSavedMessage(''), 1800);
  };

  const saveWorld = () => {
    const state = {
      selectedObject: selected?.name || null,
      objectTransforms: objects.map((o) => ({ id: o.uuid, name: o.name, position: o.position.toArray(), rotation: [o.rotation.x, o.rotation.y, o.rotation.z], scale: o.scale.toArray(), visible: o.visible })),
      environment: env?.getState?.() || weather,
    };
    try { localStorage.setItem('atom_xe_preview_world_edits', JSON.stringify(state)); } catch {}
    window.dispatchEvent(new CustomEvent('atomXeEditorWorldSaved', { detail: state }));
    setSavedMessage('Current preview world saved');
    setTimeout(() => setSavedMessage(''), 1800);
  };

  const updateSelectedTransform = (path, value) => {
    if (!selected) return;
    if (path === 'px') selected.position.x = asNum(value, selected.position.x);
    if (path === 'py') selected.position.y = asNum(value, selected.position.y);
    if (path === 'pz') selected.position.z = asNum(value, selected.position.z);
    if (path === 'rx') selected.rotation.x = asNum(value, selected.rotation.x);
    if (path === 'ry') selected.rotation.y = asNum(value, selected.rotation.y);
    if (path === 'rz') selected.rotation.z = asNum(value, selected.rotation.z);
    if (path === 'sx') selected.scale.x = Math.max(0.001, asNum(value, selected.scale.x));
    if (path === 'sy') selected.scale.y = Math.max(0.001, asNum(value, selected.scale.y));
    if (path === 'sz') selected.scale.z = Math.max(0.001, asNum(value, selected.scale.z));
    setObjectsVersion((v) => v + 1);
  };

  const nudge = (axis, amount) => {
    if (!selected) return;
    selected.position[axis] += amount;
    setObjectsVersion((v) => v + 1);
  };

  const addArtemis = async () => {
    if (!scene) return;
    try {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader');
      const gltf = await new GLTFLoader().loadAsync('/models/artemis.gltf');
      gltf.scene.name = `Artemis_${Date.now()}`;
      gltf.scene.position.set(0, 0, 0);
      scene.add(gltf.scene);
      setSelectedId(gltf.scene.uuid);
      setObjectsVersion((v) => v + 1);
    } catch (e) { console.error('[GameWorldEdit] Artemis load failed', e); }
  };

  const applyEnvironment = (key, value) => {
    if (key === 'weather') env?.setWeather?.(value === 'auto' ? null : value);
    if (key === 'season') env?.setSeason?.(value);
    if (key === 'climate') env?.setClimate?.(value);
    setWeather((w) => ({ ...w, [key === 'season' ? 'seasonId' : key]: value }));
  };

  const setPlayerField = (key, value) => setPlayer((p) => ({ ...p, [key]: asNum(value, p[key]) }));

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed left-1/2 top-[88px] z-[95] -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs font-semibold text-white/85 shadow-lg backdrop-blur-xl hover:bg-black/65"
      >
        ✦ Edit World
      </button>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(false)} className="fixed left-1/2 top-[88px] z-[95] -translate-x-1/2 rounded-full border border-white/15 bg-orange-500/20 px-4 py-2 text-xs font-semibold text-orange-100 shadow-lg backdrop-blur-xl hover:bg-orange-500/30">Done Editing</button>
      <aside className="fixed right-0 top-0 z-[90] flex h-screen w-[20vw] min-w-[300px] flex-col border-l border-white/10 bg-slate-950/70 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div><div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/60">ATOM × EVE</div><div className="text-sm font-bold text-white">Preview World Editor</div></div>
          <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-white/50 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-1 border-b border-white/10 p-2 lg:grid-cols-4">
          {TAB.map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] ${tab === id ? 'bg-cyan-400/10 text-cyan-100 ring-1 ring-cyan-400/20' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}><Icon className="h-3 w-3" />{label}</button>)}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {tab === 'world' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="text-[10px] uppercase tracking-widest text-white/40">Live scene</div><div className="mt-1 text-xs text-white/80">Editing the actual Game Viewer world already on screen — no replacement terrain scene.</div></div>
              <div className="space-y-1">{objects.map((o) => <button key={o.uuid} onClick={() => setSelectedId(o.uuid)} className={`w-full rounded-lg border px-2 py-2 text-left text-[10px] ${selected?.uuid === o.uuid ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-50' : 'border-white/10 bg-white/[0.02] text-white/65'}`}>{o.name || o.type}</button>)}</div>
              {selected && <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="mb-2 text-xs font-semibold text-white">{selected.name || selected.type}</div><div className="grid grid-cols-3 gap-1">{[['px','PX'],['py','PY'],['pz','PZ'],['rx','RX'],['ry','RY'],['rz','RZ'],['sx','SX'],['sy','SY'],['sz','SZ']].map(([k,l])=><Input key={k} value={selected[k[0]==='p'?'position':k[0]==='r'?'rotation':'scale'][k[1].toLowerCase()] ?? 0} onChange={(e)=>updateSelectedTransform(k,e.target.value)} className="h-7 text-[9px]" placeholder={l} />)}</div><div className="mt-2 flex gap-1"><Button size="sm" className="h-7 text-[9px]" onClick={()=>nudge('x',0.5)}>X+</Button><Button size="sm" className="h-7 text-[9px]" onClick={()=>nudge('x',-0.5)}>X-</Button><Button size="sm" className="h-7 text-[9px]" onClick={()=>nudge('z',0.5)}>Z+</Button><Button size="sm" className="h-7 text-[9px]" onClick={()=>nudge('z',-0.5)}>Z-</Button></div></div>}
              <Button onClick={saveWorld} className="w-full h-8 text-[10px]"><Save className="mr-1 h-3 w-3" />Save Current World</Button>
            </div>
          )}

          {tab === 'models' && (
            <div className="space-y-3"><div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[10px] text-white/55">Add assets directly into the live preview scene. The world stays visible while you place them.</div><Button onClick={addArtemis} className="w-full h-8 text-[10px]"><Box className="mr-1 h-3 w-3" />Add Artemis</Button><div className="space-y-1">{objects.filter((o) => o.type === 'Group' || o.isMesh).map((o) => <button key={o.uuid} onClick={()=>setSelectedId(o.uuid)} className={`w-full rounded-lg border px-2 py-2 text-left text-[10px] ${selected?.uuid===o.uuid?'border-cyan-400/30 bg-cyan-400/10':'border-white/10 bg-white/[0.02] text-white/60'}`}>{o.name || o.type}</button>)}</div></div>
          )}

          {tab === 'player' && (
            <div className="space-y-2"><div className="text-[10px] text-white/45">These controls target the existing preview player state, not a duplicate character.</div>{['level','xp','hp','maxHP','attack','defense','stamina'].map((k)=><label key={k} className="block text-[9px] text-white/45 uppercase">{k}<Input className="mt-1 h-7 text-[10px]" type="number" value={player[k]} onChange={(e)=>setPlayerField(k,e.target.value)} /></label>)}<Button onClick={savePlayer} className="mt-1 w-full h-8 text-[10px]"><Save className="mr-1 h-3 w-3" />Apply to Preview</Button>{savedMessage && <div className="text-center text-[10px] text-emerald-300">{savedMessage}</div>}</div>
          )}

          {tab === 'damage' && (
            <div className="space-y-2"><div className="text-[10px] text-white/45">Edit the combat damage profile used by the preview configuration. Changes are persisted locally and broadcast to the runtime.</div>{damagePackets.map((d,i)=><div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-2"><select value={d.type} onChange={e=>setDamagePackets(v=>v.map((x,j)=>j===i?{...x,type:e.target.value}:x))} className="h-7 w-full rounded-md border border-white/10 bg-slate-900 px-2 text-[10px] text-white">{DAMAGE_TYPES.map(x=><option key={x}>{x}</option>)}</select><div className="mt-2 grid grid-cols-3 gap-1"><Input type="number" value={d.amount} onChange={e=>setDamagePackets(v=>v.map((x,j)=>j===i?{...x,amount:asNum(e.target.value)}:x))} className="h-7 text-[9px]" placeholder="Amount"/><Input type="number" value={d.multiplier} onChange={e=>setDamagePackets(v=>v.map((x,j)=>j===i?{...x,multiplier:asNum(e.target.value,1)}:x))} className="h-7 text-[9px]" placeholder="Mult"/><Input type="number" value={d.defense} onChange={e=>setDamagePackets(v=>v.map((x,j)=>j===i?{...x,defense:asNum(e.target.value)}:x))} className="h-7 text-[9px]" placeholder="Defense"/></div></div>)}<Button size="sm" onClick={()=>setDamagePackets(v=>[...v,{type:'physical',amount:25,multiplier:1,defense:0}])} className="h-7 text-[9px]">+ Damage Packet</Button></div>
          )}

          {tab === 'boss' && (
            <div className="space-y-2"><div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="text-xs font-semibold">World Boss Rules</div><div className="mt-1 text-[10px] text-white/45">These are preview-world tuning controls, separate from the Admin page.</div></div><label className="flex items-center justify-between text-[10px] text-white/70"><span>Boss damage enabled</span><input type="checkbox" checked={bossConfig.worldDamage} onChange={e=>setBossConfig(v=>({...v,worldDamage:e.target.checked}))}/></label>{[['defaultHP','Default HP'],['outgoingMultiplier','Boss outgoing ×'],['incomingMultiplier','Player incoming ×']].map(([k,l])=><label key={k} className="block text-[9px] text-white/45 uppercase">{l}<Input className="mt-1 h-7 text-[10px]" type="number" value={bossConfig[k]} onChange={e=>setBossConfig(v=>({...v,[k]:asNum(e.target.value)}))}/></label>)}</div>
          )}

          {tab === 'animation' && (
            <div className="space-y-2"><div className="text-[10px] text-white/45">Animation editing stays attached to the current world. Use this area for runtime montage/root-motion configuration instead of replacing the viewport.</div><div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[10px] text-white/60">Root motion: In-Place · XY · XYZ<br/>Montage: chained sections · notify windows · effect/damage timing</div></div>
          )}

          {tab === 'weather' && (
            <div className="space-y-3"><label className="block text-[9px] text-white/45 uppercase">Time of day<div className="mt-1 flex items-center gap-2"><Slider value={[weather.time]} min={0} max={24} step={0.1} onValueChange={([v])=>setWeather(w=>({...w,time:v}))}/><span className="w-12 text-right text-[10px] text-white/70">{weather.time.toFixed(1)}h</span></div></label><label className="block text-[9px] text-white/45 uppercase">Weather<select value={weather.weather} onChange={e=>applyEnvironment('weather',e.target.value)} className="mt-1 h-8 w-full rounded-md border border-white/10 bg-slate-900 px-2 text-[10px] text-white"><option value="auto">Automatic</option>{['clear','cloudy','rain','snow','storm','fog','hail'].map(x=><option key={x}>{x}</option>)}</select></label><label className="block text-[9px] text-white/45 uppercase">Season<select value={weather.seasonId} onChange={e=>applyEnvironment('season',e.target.value)} className="mt-1 h-8 w-full rounded-md border border-white/10 bg-slate-900 px-2 text-[10px] text-white">{['spring','summer','autumn','winter'].map(x=><option key={x}>{x}</option>)}</select></label><div className="grid grid-cols-2 gap-2"><div className="rounded-lg bg-white/[0.03] p-2 text-[9px] text-white/45">Climate<br/><span className="text-white/75">{weather.climate}</span></div><div className="rounded-lg bg-white/[0.03] p-2 text-[9px] text-white/45">Moon<br/><span className="text-white/75">{Math.round(weather.moonIllum*100)}%</span></div></div></div>
          )}
        </div>
      </aside>
    </>
  );
}
