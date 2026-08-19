import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const panel = 'bg-slate-900/55 backdrop-blur-2xl border border-white/12 shadow-[0_20px_60px_rgba(0,0,0,.28)]';
const button = 'rounded-md border border-white/10 bg-white/6 hover:bg-white/10 transition px-2 py-1 text-[10px] text-white/80';

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
  return <label className="block text-[9px] uppercase tracking-wider text-white/45">{label}<input type="number" value={Number.isFinite(value) ? value : 0} onChange={e => onChange(Number(e.target.value))} className="mt-1 w-full rounded-md bg-white/6 border border-white/10 px-2 py-1 text-xs text-white outline-none focus:border-cyan-300/40" /></label>;
}

function Toggle({ label, value, onChange }) {
  return <label className="flex items-center justify-between gap-2 text-[10px] text-white/65"><span>{label}</span><input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} /></label>;
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
  const [section, setSection] = useState('overview');
  const helper = useRef(null);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);

  const scene = () => window.__gw3dScene || null;
  const camera = () => window.__gw3dCamera || null;
  const canvasAt = e => document.elementsFromPoint(e.clientX, e.clientY).find(x => x instanceof HTMLCanvasElement) || document.querySelector('canvas');

  const ensureConfig = o => {
    o.userData.editorConfig ||= {
      physics: { mass: 1, friction: .5, restitution: .15, gravity: 1, collision: true, windResponse: 1 },
      stats: { hp: 100, maxHP: 100, defense: 0, armor: 0, strength: 10, agility: 10, intelligence: 10, stamina: 10, mana: 0, level: 1, xp: 0 },
      damage: { base: 10, multiplier: 1, type: 'physical', elemental: 0, teamDamage: 0 },
      effects: { enabled: false, name: '', scale: 1, speed: 1, loop: false },
      animation: { name: '', speed: 1, loop: false, rootMotion: false },
    };
    return o.userData.editorConfig;
  };

  const pick = e => {
    const s = scene(), c = camera(), canvas = canvasAt(e);
    if (!s || !c || !canvas) return null;
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(pointer, c);
    return ray.intersectObjects(s.children, true).find(h => h.object.visible && !h.object.userData?.editorHelper)?.object || null;
  };

  const select = raw => {
    let o = raw;
    while (o?.parent && o.parent.type !== 'Scene' && !o.userData?.editorSelectable) o = o.parent;
    if (!o) return;
    o.userData.editorSelectable = true;
    o.userData.editorKind = kindOf(o);
    ensureConfig(o);
    if (helper.current) scene()?.remove(helper.current);
    const h = new THREE.BoxHelper(o, 0x67e8f9);
    h.userData.editorHelper = true;
    scene()?.add(h);
    helper.current = h;
    setSelected(o);
    setSection('overview');
    window.dispatchEvent(new CustomEvent('gameEditorObjectSelected', { detail: { object: o, kind: kindOf(o), config: o.userData.editorConfig } }));
  };

  const sculpt = e => {
    const o = pick(e);
    if (!o?.isMesh || kindOf(o) !== 'terrain') return;
    const hit = ray.intersectObject(o, true)[0];
    const pos = o.geometry?.attributes?.position;
    if (!pos || !hit) return;
    const p = o.worldToLocal(hit.point.clone());
    for (let i = 0; i < pos.count; i++) {
      const dx = pos.getX(i) - p.x, dz = pos.getZ(i) - p.z, d = Math.hypot(dx, dz);
      if (d > brush) continue;
      const f = 1 - d / brush, y = pos.getY(i);
      if (tool === 'raise') pos.setY(i, y + strength * f);
      if (tool === 'lower') pos.setY(i, y - strength * f);
      if (tool === 'flatten') pos.setY(i, p.y);
      if (tool === 'smooth') pos.setY(i, y + (p.y - y) * f * .2);
    }
    pos.needsUpdate = true;
    o.geometry.computeVertexNormals?.();
    o.userData.editorTerrainDirty = true;
    window.dispatchEvent(new CustomEvent('gameEditorTerrainChanged', { detail: { object: o, geometry: o.geometry } }));
  };

  useEffect(() => {
    if (!edit) return;
    const down = e => {
      if (e.button !== 0) return;
      const o = pick(e);
      if (!o) return;
      if (kindOf(o) === 'terrain' && tool !== 'select') sculpt(e); else select(o);
      e.preventDefault();
      e.stopPropagation();
    };
    const move = e => { if (e.buttons & 1 && tool !== 'select') sculpt(e); };
    const key = e => { if (!edit || gameplay) return; if (e.target?.matches?.('input,textarea,select')) return; if (!movement) e.preventDefault(); };
    document.addEventListener('mousedown', down, true);
    document.addEventListener('mousemove', move, true);
    window.addEventListener('keydown', key, true);
    return () => { document.removeEventListener('mousedown', down, true); document.removeEventListener('mousemove', move, true); window.removeEventListener('keydown', key, true); };
  }, [edit, gameplay, movement, tool, brush, strength]);

  useEffect(() => () => { if (helper.current) scene()?.remove(helper.current); }, []);

  const change = (sectionName, key, value) => {
    if (!selected) return;
    const cfg = ensureConfig(selected);
    cfg[sectionName] ||= {};
    cfg[sectionName][key] = value;
    window.dispatchEvent(new CustomEvent('gameEditorObjectChanged', { detail: { object: selected, section: sectionName, key, value, config: cfg } }));
    setSelected({ ...selected });
    if (helper.current) helper.current.update();
  };

  const remove = () => {
    if (!selected) return;
    scene()?.remove(selected);
    if (helper.current) scene()?.remove(helper.current);
    window.dispatchEvent(new CustomEvent('gameEditorObjectRemoved', { detail: { object: selected } }));
    setSelected(null);
  };

  const addPrimitive = type => {
    const s = scene(); if (!s) return;
    const g = type === 'sphere' ? new THREE.SphereGeometry(.8, 24, 16) : type === 'cylinder' ? new THREE.CylinderGeometry(.65, .65, 1.5, 24) : new THREE.BoxGeometry(1.4, 1.4, 1.4);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x8b5cf6 }));
    m.name = `Editor ${type}`;
    m.position.set(0, 1, 0);
    m.userData.editorSource = 'user_asset';
    s.add(m);
    select(m);
  };

  const importFile = file => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type = /\.(fbx|glb|gltf|obj)$/i.test(file.name) ? 'model' : /\.anim$/i.test(file.name) ? 'animation' : 'asset';
    setAssets(a => [...a, { id: `${Date.now()}-${file.name}`, name: file.name, url, type }]);
  };

  const addAssetToWorld = (asset, point) => {
    if (!asset?.url || asset.type === 'animation') {
      if (asset?.type === 'animation') window.dispatchEvent(new CustomEvent('gameEditorAnimationImported', { detail: asset }));
      return;
    }
    const s = scene(); if (!s) return;
    const place = root => {
      root.name = asset.name;
      root.userData.editorSource = 'user_asset';
      root.position.copy(point || new THREE.Vector3(0, 1, 0));
      s.add(root);
      select(root);
    };
    if (/\.fbx$/i.test(asset.name)) new FBXLoader().load(asset.url, place, undefined, console.error);
    else new GLTFLoader().load(asset.url, g => place(g.scene || g.scenes?.[0]), undefined, console.error);
  };

  useEffect(() => {
    if (!edit) return;
    const over = e => e.preventDefault();
    const drop = e => {
      e.preventDefault();
      const name = e.dataTransfer.getData('application/x-game-editor-asset');
      const asset = assets.find(a => a.id === name);
      if (asset) {
        const o = pick(e);
        const point = o ? ray.intersectObject(o, true)[0]?.point : null;
        addAssetToWorld(asset, point || new THREE.Vector3(0, 1, 0));
      } else if (e.dataTransfer.files?.[0]) importFile(e.dataTransfer.files[0]);
    };
    document.addEventListener('dragover', over, true);
    document.addEventListener('drop', drop, true);
    return () => { document.removeEventListener('dragover', over, true); document.removeEventListener('drop', drop, true); };
  }, [edit, assets]);

  if (!edit) return <button onClick={() => setEdit(true)} className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] rounded-full px-5 py-2 text-xs font-semibold text-cyan-100 border border-cyan-300/25 bg-slate-900/45 backdrop-blur-2xl shadow-lg">EDIT</button>;

  const cfg = selected ? ensureConfig(selected) : null;
  const stats = cfg?.stats || {}, physics = cfg?.physics || {}, damage = cfg?.damage || {}, effects = cfg?.effects || {}, animation = cfg?.animation || {};

  return <>
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10001] flex gap-2 rounded-full p-2 text-xs text-white border border-white/10 bg-slate-900/55 backdrop-blur-2xl">
      <b className="text-cyan-200">EDIT MODE</b>
      <button onClick={() => setGameplay(v => !v)} className={button}>Gameplay {gameplay ? 'ON' : 'OFF'}</button>
      <button onClick={() => setMovement(v => !v)} className={button}>Move {movement ? 'ON' : 'OFF'}</button>
      <button onClick={() => { setEdit(false); setSelected(null); }} className={`${button} text-cyan-200`}>DONE</button>
    </div>

    <aside className={`${panel} fixed left-0 top-0 bottom-[15vh] w-[15vw] min-w-[250px] max-w-[380px] z-[10000] p-3 text-white overflow-y-auto`}>
      <div className="text-[9px] uppercase tracking-[.22em] text-white/35">OBJECT EDITOR</div>
      {selected ? <>
        <h3 className="mt-2 text-sm text-cyan-100 truncate">{selected.name || 'Unnamed object'}</h3>
        <p className="text-[9px] text-white/35">{kindOf(selected)} · live scene object</p>
        <div className="grid grid-cols-2 gap-1 mt-3">
          {['overview', 'physics', 'damage', 'effects', 'stats', 'animation'].map(x => <button key={x} onClick={() => setSection(x)} className={`${button} ${section === x ? 'bg-cyan-300/12 text-cyan-100' : ''}`}>{x}</button>)}
        </div>
        {section === 'overview' && <div className="mt-4 space-y-2"><b className="text-[10px]">Transform</b><Num label="X" value={selected.position.x} onChange={v => { selected.position.x = v; setSelected({ ...selected }); }} /><Num label="Y" value={selected.position.y} onChange={v => { selected.position.y = v; setSelected({ ...selected }); }} /><Num label="Z" value={selected.position.z} onChange={v => { selected.position.z = v; setSelected({ ...selected }); }} /><Num label="Uniform Scale" value={selected.scale.x} onChange={v => { selected.scale.setScalar(v); setSelected({ ...selected }); }} /><button onClick={remove} className="w-full rounded bg-red-400/10 border border-red-300/10 text-red-100 px-2 py-2 text-[10px]">REMOVE OBJECT</button></div>}
        {section === 'physics' && <div className="mt-4 space-y-2"><Num label="Mass" value={physics.mass} onChange={v => change('physics', 'mass', v)} /><Num label="Friction" value={physics.friction} onChange={v => change('physics', 'friction', v)} /><Num label="Restitution" value={physics.restitution} onChange={v => change('physics', 'restitution', v)} /><Num label="Gravity" value={physics.gravity} onChange={v => change('physics', 'gravity', v)} /><Num label="Wind Response" value={physics.windResponse} onChange={v => change('physics', 'windResponse', v)} /><Toggle label="Collision Enabled" value={physics.collision} onChange={v => change('physics', 'collision', v)} /></div>}
        {section === 'damage' && <div className="mt-4 space-y-2"><Num label="Base Damage" value={damage.base} onChange={v => change('damage', 'base', v)} /><Num label="Multiplier" value={damage.multiplier} onChange={v => change('damage', 'multiplier', v)} /><Num label="Elemental Damage" value={damage.elemental} onChange={v => change('damage', 'elemental', v)} /><Num label="Team Damage" value={damage.teamDamage} onChange={v => change('damage', 'teamDamage', v)} /><label className="block text-[9px] uppercase tracking-wider text-white/45">Damage Type<select value={damage.type} onChange={e => change('damage', 'type', e.target.value)} className="mt-1 w-full rounded-md bg-white/6 border border-white/10 px-2 py-1 text-xs text-white"><option>physical</option><option>fire</option><option>ice</option><option>lightning</option><option>wind</option><option>dark</option><option>holy</option><option>custom</option></select></label></div>}
        {section === 'effects' && <div className="mt-4 space-y-2"><Toggle label="Effects Enabled" value={effects.enabled} onChange={v => change('effects', 'enabled', v)} /><Num label="Effect Scale" value={effects.scale} onChange={v => change('effects', 'scale', v)} /><Num label="Playback Speed" value={effects.speed} onChange={v => change('effects', 'speed', v)} /><Toggle label="Loop" value={effects.loop} onChange={v => change('effects', 'loop', v)} /><label className="block text-[9px] uppercase tracking-wider text-white/45">Effect Name<input value={effects.name || ''} onChange={e => change('effects', 'name', e.target.value)} className="mt-1 w-full rounded-md bg-white/6 border border-white/10 px-2 py-1 text-xs text-white" /></label></div>}
        {section === 'stats' && <div className="mt-4 space-y-2">{['level', 'xp', 'hp', 'maxHP', 'defense', 'armor', 'strength', 'agility', 'intelligence', 'stamina', 'mana'].map(k => <Num key={k} label={k} value={stats[k]} onChange={v => change('stats', k, v)} />)}</div>}
        {section === 'animation' && <div className="mt-4 space-y-2"><label className="block text-[9px] uppercase tracking-wider text-white/45">Animation Name<input value={animation.name || ''} onChange={e => change('animation', 'name', e.target.value)} className="mt-1 w-full rounded-md bg-white/6 border border-white/10 px-2 py-1 text-xs text-white" /></label><Num label="Playback Speed" value={animation.speed} onChange={v => change('animation', 'speed', v)} /><Toggle label="Loop" value={animation.loop} onChange={v => change('animation', 'loop', v)} /><Toggle label="Root Motion" value={animation.rootMotion} onChange={v => change('animation', 'rootMotion', v)} /></div>}
      </> : <p className="mt-4 text-xs leading-5 text-white/45">Click anything in the existing Three.js world. The selected object becomes editable here, regardless of whether it was created by Base44 or imported by you.</p>}
    </aside>

    <aside className={`${panel} fixed bottom-0 left-[15vw] right-0 h-[15vh] min-h-[115px] z-[9998] p-3 text-white overflow-x-auto`}>
      <div className="flex items-center gap-3 h-full"><div className="min-w-max"><div className="text-[9px] uppercase tracking-[.22em] text-white/35">WORLD ASSET LIBRARY</div><label className="mt-2 inline-block cursor-pointer rounded-md border border-cyan-300/15 bg-white/6 px-3 py-2 text-[10px] text-cyan-100">IMPORT FROM PC<input type="file" multiple accept=".glb,.gltf,.fbx,.obj,.anim,.png,.jpg,.jpeg,.webp,.hdr,.exr" className="hidden" onChange={e => [...(e.target.files || [])].forEach(importFile)} /></label></div>{['box', 'sphere', 'cylinder'].map(t => <button key={t} onClick={() => addPrimitive(t)} className={`${button} min-w-[90px]`}>+ {t}</button>)}{assets.map(a => <div key={a.id} draggable onDragStart={e => e.dataTransfer.setData('application/x-game-editor-asset', a.id)} onDoubleClick={() => addAssetToWorld(a)} className="min-w-[140px] rounded-lg border border-white/10 bg-white/5 p-2 cursor-grab"><div className="text-xs truncate">{a.name}</div><div className="text-[9px] text-white/35">{a.type} · drag into world</div></div>)}</div>
    </aside>

    <aside className={`${panel} fixed right-3 bottom-[16vh] z-[9999] rounded-xl p-2 text-white`}><div className="text-[9px] text-white/35 mb-1">TERRAIN TOOLS</div>{['select', 'raise', 'lower', 'flatten', 'smooth'].map(t => <button key={t} onClick={() => setTool(t)} className={`block w-20 mb-1 rounded px-2 py-1 text-[10px] ${tool === t ? 'bg-cyan-300/12 text-cyan-100' : 'bg-white/5'}`}>{t}</button>)}<Num label="Brush" value={brush} onChange={setBrush} /><Num label="Strength" value={strength} onChange={setStrength} /></aside>
  </>;
}
