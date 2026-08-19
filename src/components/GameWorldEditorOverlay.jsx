import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const glass = 'bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-2xl';

function classifyObject(object) {
  const n = `${object?.name || ''} ${object?.parent?.name || ''}`.toLowerCase();
  if (n.includes('ground') || n.includes('terrain') || n.includes('grass')) return 'terrain';
  if (n.includes('boss') || n.includes('devourer') || n.includes('shifter') || object?.userData?.isBoss) return 'enemy';
  if (n.includes('enemy') || n.includes('rogue') || object?.userData?.isEnemy) return 'enemy';
  if (n.includes('companion')) return 'companion';
  if (n.includes('pet')) return 'pet';
  if (n.includes('mount')) return 'mount';
  if (n.includes('player') || object?.userData?.isPlayer) return 'player';
  return 'model';
}

function EditableNumber({ label, value, onChange, step = 0.1 }) {
  return <label className="block text-[10px] text-white/50 uppercase tracking-wider">
    {label}
    <input type="number" step={step} value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
      className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400/50" />
  </label>;
}

export default function GameWorldEditorOverlay() {
  const [active, setActive] = useState(false);
  const [gameplay, setGameplay] = useState(false);
  const [movement, setMovement] = useState(true);
  const [selected, setSelected] = useState(null);
  const [terrainTool, setTerrainTool] = useState('select');
  const [brush, setBrush] = useState(2.5);
  const [strength, setStrength] = useState(0.25);
  const [assets, setAssets] = useState([]);
  const [worldTick, setWorldTick] = useState(0);
  const helperRef = useRef(null);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);

  const getScene = () => window.__gw3dScene || null;
  const getCamera = () => window.__gw3dCamera || null;
  const getCanvas = () => document.querySelector('.fixed.inset-0 canvas') || getScene()?.userData?.editorCanvas || document.querySelector('canvas');

  const selectObject = (hit) => {
    let object = hit?.object;
    if (!object) return;
    while (object.parent && object.parent.type !== 'Scene' && !object.userData?.editorSelectable) object = object.parent;
    if (object.userData?.editorHelper) return;
    const kind = classifyObject(object);
    object.userData.editorSelectable = true;
    object.userData.editorKind = kind;
    object.userData.editorConfig ||= {
      physics: { mass: 1, friction: 0.5, restitution: 0.15, gravity: 1 },
      stats: { hp: 100, maxHP: 100, defense: 0, armor: 0, strength: 10, agility: 10, intelligence: 10, stamina: 10, mana: 0 },
      damage: [{ name: 'Physical', type: 'physical', amount: 10, multiplier: 1, teamDamage: false, elemental: false }],
      effects: [],
    };
    setSelected(object);
    if (helperRef.current) {
      getScene()?.remove(helperRef.current);
      helperRef.current.dispose?.();
    }
    const helper = new THREE.BoxHelper(object, 0x22d3ee);
    helper.userData.editorHelper = true;
    getScene()?.add(helper);
    helperRef.current = helper;
    window.dispatchEvent(new CustomEvent('gameEditorObjectSelected', { detail: { object, kind, config: object.userData.editorConfig } }));
    setWorldTick((v) => v + 1);
  };

  const raycastAt = (event) => {
    const canvas = getCanvas(); const scene = getScene(); const camera = getCamera();
    if (!canvas || !scene || !camera) return null;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(scene.children, true).filter((h) => !h.object.userData?.editorHelper && h.object.visible);
    return hits[0] || null;
  };

  const sculptTerrain = (event) => {
    const hit = raycastAt(event);
    if (!hit?.object?.isMesh || classifyObject(hit.object) !== 'terrain') return;
    const geometry = hit.object.geometry;
    const position = geometry?.attributes?.position;
    if (!position) return;
    const localPoint = hit.object.worldToLocal(hit.point.clone());
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i); const z = position.getZ(i);
      const dx = x - localPoint.x; const dz = z - localPoint.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance > brush) continue;
      const falloff = 1 - distance / brush;
      const delta = strength * falloff * (terrainTool === 'lower' ? -1 : 1);
      if (terrainTool === 'raise' || terrainTool === 'lower') position.setY(i, position.getY(i) + delta);
      if (terrainTool === 'flatten') position.setY(i, localPoint.y);
      if (terrainTool === 'smooth') position.setY(i, position.getY(i) + (localPoint.y - position.getY(i)) * falloff * 0.25);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals?.();
    hit.object.userData.editorTerrainDirty = true;
    window.dispatchEvent(new CustomEvent('gameEditorTerrainChanged', { detail: { object: hit.object, geometry } }));
    setWorldTick((v) => v + 1);
  };

  useEffect(() => {
    const onMouseDown = (e) => {
      if (!active) return;
      if (e.button !== 0) return;
      const hit = raycastAt(e);
      if (!hit) return;
      const kind = classifyObject(hit.object);
      if (kind === 'terrain' && terrainTool !== 'select') sculptTerrain(e);
      else selectObject(hit);
      e.preventDefault();
      e.stopPropagation();
    };
    const onMouseMove = (e) => {
      if (!active || terrainTool === 'select' || !(e.buttons & 1)) return;
      sculptTerrain(e);
    };
    const onContext = (e) => { if (active) e.preventDefault(); };
    const onKeyDown = (e) => {
      if (!active || gameplay) return;
      const target = e.target;
      if (target?.matches?.('input, textarea, select')) return;
      if (['w','a','s','d','f','e','q','r','1','2','3','4','5','6','7','8','9','0',' '].includes(e.key.toLowerCase()) || e.button !== undefined) {
        if (!movement || ['f','e','q','r','1','2','3','4','5','6','7','8','9','0',' '].includes(e.key.toLowerCase())) {
          e.preventDefault(); e.stopPropagation();
        }
      }
    };
    const canvas = getCanvas();
    canvas?.addEventListener('mousedown', onMouseDown, true);
    canvas?.addEventListener('mousemove', onMouseMove, true);
    canvas?.addEventListener('contextmenu', onContext, true);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      canvas?.removeEventListener('mousedown', onMouseDown, true);
      canvas?.removeEventListener('mousemove', onMouseMove, true);
      canvas?.removeEventListener('contextmenu', onContext, true);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [active, gameplay, movement, terrainTool, brush, strength]);

  useEffect(() => {
    const onReady = () => setWorldTick((v) => v + 1);
    window.addEventListener('gw3dSceneReady', onReady);
    window.addEventListener('gw3dSceneTeardown', () => setSelected(null));
    return () => window.removeEventListener('gw3dSceneReady', onReady);
  }, []);

  const updateConfig = (section, key, value) => {
    if (!selected) return;
    selected.userData.editorConfig ||= { physics: {}, stats: {}, damage: [], effects: [] };
    selected.userData.editorConfig[section] ||= {};
    selected.userData.editorConfig[section][key] = value;
    window.dispatchEvent(new CustomEvent('gameEditorObjectChanged', { detail: { object: selected, section, key, value, config: selected.userData.editorConfig } }));
    setWorldTick((v) => v + 1);
  };

  const addDamage = () => {
    if (!selected) return;
    selected.userData.editorConfig.damage ||= [];
    selected.userData.editorConfig.damage.push({ name: 'New Damage', type: 'physical', amount: 10, multiplier: 1, teamDamage: false, elemental: false });
    setWorldTick((v) => v + 1);
  };

  const removeSelected = () => {
    if (!selected) return;
    const scene = getScene();
    scene?.remove(selected);
    if (helperRef.current) scene?.remove(helperRef.current);
    window.dispatchEvent(new CustomEvent('gameEditorObjectRemoved', { detail: { object: selected } }));
    setSelected(null);
    setWorldTick((v) => v + 1);
  };

  const addPrimitive = (type) => {
    const scene = getScene(); if (!scene) return;
    let geometry;
    if (type === 'sphere') geometry = new THREE.SphereGeometry(0.8, 32, 20);
    else if (type === 'box') geometry = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    else if (type === 'cylinder') geometry = new THREE.CylinderGeometry(0.65, 0.65, 1.5, 24);
    else geometry = new THREE.CapsuleGeometry(0.5, 1.2, 8, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.65, metalness: 0.1 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `Editor ${type}`;
    mesh.position.copy(window.__localPlayerPos ? new THREE.Vector3(window.__localPlayerPos.x + 2, window.__localPlayerPos.y + 1, window.__localPlayerPos.z) : new THREE.Vector3(0, 1, 0));
    mesh.userData.editorSource = 'user_asset';
    mesh.userData.editorSelectable = true;
    scene.add(mesh);
    selectObject({ object: mesh });
  };

  const importFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAssets((items) => [...items, { id: `${Date.now()}-${file.name}`, name: file.name, url, type: file.name.toLowerCase().endsWith('.fbx') ? 'model' : file.name.toLowerCase().endsWith('.anim') ? 'animation' : 'model' }]);
  };

  const dropAsset = (asset) => {
    const scene = getScene(); if (!scene || !asset?.url) return;
    if (asset.type === 'animation') {
      window.dispatchEvent(new CustomEvent('gameEditorAnimationImported', { detail: { url: asset.url, name: asset.name } }));
      return;
    }
    const onLoaded = (root) => {
      root.name = asset.name;
      root.position.copy(window.__localPlayerPos ? new THREE.Vector3(window.__localPlayerPos.x + 2, window.__localPlayerPos.y, window.__localPlayerPos.z) : new THREE.Vector3(0, 0, 0));
      root.userData.editorSource = 'user_asset';
      root.userData.editorSelectable = true;
      scene.add(root);
      selectObject({ object: root });
    };
    if (/\.fbx$/i.test(asset.name)) new FBXLoader().load(asset.url, onLoaded, undefined, console.error);
    else new GLTFLoader().load(asset.url, (gltf) => onLoaded(gltf.scene || gltf.scenes?.[0]), undefined, console.error);
  };

  if (!active) return <button onClick={() => setActive(true)} className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] rounded-full px-5 py-2 text-xs font-semibold tracking-wider text-cyan-100 border border-cyan-300/30 bg-slate-950/75 backdrop-blur-xl shadow-lg hover:bg-slate-900/90">EDIT</button>;

  const config = selected?.userData?.editorConfig || {};
  const stats = config.stats || {};
  const physics = config.physics || {};
  const damages = config.damage || [];

  return <>
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-2 rounded-full px-3 py-2 text-xs text-white border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-xl">
      <span className="text-cyan-300 font-semibold">EDIT MODE</span>
      <button onClick={() => setGameplay((v) => !v)} className="rounded-full px-2 py-1 bg-white/10 hover:bg-white/15">Gameplay {gameplay ? 'ON' : 'OFF'}</button>
      <button onClick={() => setMovement((v) => !v)} className="rounded-full px-2 py-1 bg-white/10 hover:bg-white/15">Move {movement ? 'ON' : 'OFF'}</button>
      <button onClick={() => { setActive(false); setSelected(null); }} className="rounded-full px-2 py-1 bg-cyan-400/15 text-cyan-200">DONE</button>
    </div>

    <aside className={`fixed left-0 top-0 bottom-[15%] w-[15vw] min-w-[230px] max-w-[360px] z-[9999] p-3 ${glass} text-white overflow-y-auto`}>
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Selected Object</div>
      {selected ? <>
        <div className="text-sm font-semibold text-cyan-200 truncate">{selected.name || 'Unnamed Object'}</div>
        <div className="text-[10px] text-white/40 mb-3">{classifyObject(selected)} · live scene object</div>
        <section className="space-y-2 mb-4">
          <div className="text-xs font-semibold">Transform</div>
          <EditableNumber label="X" value={selected.position.x} onChange={(v) => { selected.position.x = v; }} />
          <EditableNumber label="Y" value={selected.position.y} onChange={(v) => { selected.position.y = v; }} />
          <EditableNumber label="Z" value={selected.position.z} onChange={(v) => { selected.position.z = v; }} />
          <EditableNumber label="Scale" value={selected.scale.x} onChange={(v) => selected.scale.setScalar(v)} />
        </section>
        <section className="space-y-2 mb-4">
          <div className="text-xs font-semibold">Physics</div>
          {Object.entries({ mass: physics.mass ?? 1, friction: physics.friction ?? 0.5, restitution: physics.restitution ?? 0.15, gravity: physics.gravity ?? 1 }).map(([k,v]) => <EditableNumber key={k} label={k} value={v} onChange={(n) => updateConfig('physics', k, n)} />)}
        </section>
        <section className="space-y-2 mb-4">
          <div className="text-xs font-semibold">Stats</div>
          {['hp','maxHP','defense','armor','strength','agility','intelligence','stamina','mana'].map((k) => <EditableNumber key={k} label={k} value={stats[k] ?? 0} onChange={(n) => updateConfig('stats', k, n)} step={1} />)}
        </section>
        <section className="space-y-2 mb-4">
          <div className="flex items-center justify-between"><div className="text-xs font-semibold">Damage</div><button onClick={addDamage} className="rounded-md px-2 py-1 bg-cyan-400/15 text-cyan-200">+</button></div>
          {damages.map((d, i) => <div key={i} className="rounded-lg bg-white/5 border border-white/10 p-2 space-y-1">
            <input value={d.name} onChange={(e) => { d.name = e.target.value; setWorldTick((v) => v + 1); }} className="w-full bg-transparent border-b border-white/10 text-xs text-white" />
            <select value={d.type} onChange={(e) => { d.type = e.target.value; setWorldTick((v) => v + 1); }} className="w-full bg-slate-900 text-xs p-1 rounded"><option>physical</option><option>fire</option><option>ice</option><option>electric</option><option>poison</option><option>arcane</option><option>holy</option><option>shadow</option></select>
            <EditableNumber label="Amount" value={d.amount} onChange={(n) => { d.amount = n; setWorldTick((v) => v + 1); }} step={1} />
            <EditableNumber label="Multiplier" value={d.multiplier} onChange={(n) => { d.multiplier = n; setWorldTick((v) => v + 1); }} />
          </div>)}
        </section>
        <button onClick={removeSelected} className="w-full rounded-lg px-3 py-2 bg-red-500/15 border border-red-400/20 text-red-200 text-xs">Remove Object</button>
      </> : <div className="text-xs text-white/50 leading-relaxed">Click any existing object in the Three.js world. Base44-created objects and imported objects are selectable here. Select terrain and choose a terrain brush to edit it directly.</div>}
    </aside>

    <aside className={`fixed left-0 right-0 bottom-0 h-[15vh] min-h-[130px] z-[9998] p-3 ${glass} text-white`}>
      <div className="flex items-center justify-between mb-2">
        <div><div className="text-[10px] uppercase tracking-[0.2em] text-white/40">World Asset Dock</div><div className="text-xs text-white/70">Drag an asset onto the Game Viewer to add it to the actual scene.</div></div>
        <label className="cursor-pointer rounded-lg px-3 py-2 bg-cyan-400/15 text-cyan-200 text-xs">Import from PC<input type="file" multiple accept=".glb,.gltf,.fbx,.obj,.anim,.png,.jpg,.jpeg,.webp,.hdr,.exr" className="hidden" onChange={(e) => Array.from(e.target.files || []).forEach(importFile)} /></label>
      </div>
      <div className="flex gap-2 overflow-x-auto h-[70px]" onDragOver={(e) => e.preventDefault()}>
        {['sphere','box','cylinder','capsule'].map((type) => <button key={type} draggable onDragEnd={() => addPrimitive(type)} onClick={() => addPrimitive(type)} className="min-w-[92px] rounded-lg bg-white/5 border border-white/10 hover:border-cyan-300/30 text-xs">+ {type}</button>)}
        {assets.map((asset) => <button key={asset.id} draggable onDragEnd={() => dropAsset(asset)} onClick={() => dropAsset(asset)} className="min-w-[150px] rounded-lg bg-white/5 border border-white/10 hover:border-cyan-300/30 text-xs text-left px-3"><div className="truncate">{asset.name}</div><div className="text-white/40 text-[10px]">{asset.type} · PC</div></button>)}
        {!assets.length && <div className="flex items-center text-xs text-white/30 px-3">Imported models and animations will live here.</div>}
      </div>
      <div className="absolute right-4 bottom-3 flex gap-1">
        {['select','raise','lower','flatten','smooth'].map((tool) => <button key={tool} onClick={() => setTerrainTool(tool)} className={`px-2 py-1 rounded text-[10px] ${terrainTool === tool ? 'bg-cyan-400/20 text-cyan-200' : 'bg-white/5 text-white/50'}`}>{tool}</button>)}
        {terrainTool !== 'select' && <><label className="text-[10px] text-white/50 px-2">Brush <input type="range" min="0.5" max="8" step="0.25" value={brush} onChange={(e) => setBrush(Number(e.target.value))} /></label><label className="text-[10px] text-white/50 px-2">Strength <input type="range" min="0.02" max="1" step="0.02" value={strength} onChange={(e) => setStrength(Number(e.target.value))} /></label></>}
      </div>
    </aside>
  </>;
}
