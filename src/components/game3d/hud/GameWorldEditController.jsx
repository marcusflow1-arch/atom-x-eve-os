import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Box, CloudSun, Crosshair, Film, Gamepad2, Mountain, Plus, Save, Shield, Sparkles, Swords, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

const TABS = [
  ['world', 'World', Mountain],
  ['models', 'Models', Box],
  ['actors', 'Actors', Users],
  ['equipment', 'Equipment', Shield],
  ['animation', 'Animation', Film],
  ['weather', 'Weather', CloudSun],
];

const ACTOR_ROLES = ['player', 'enemy', 'companion', 'pet', 'mount'];
const DAMAGE_TYPES = ['physical', 'fire', 'ice', 'electric', 'poison', 'arcane', 'holy', 'shadow', 'team'];
const TERRAIN_MODES = ['raise', 'lower', 'flatten', 'smooth'];
const DEFAULT_STATS = { level: 1, xp: 0, hp: 100, maxHP: 100, attack: 10, defense: 5, armor: 0, strength: 10, agility: 10, intelligence: 10, stamina: 100, mana: 100, crit: 0, speed: 1, statPointValue: 1 };

function asNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function dispatch(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function isEditorHelper(object) {
  const name = String(object?.name || '').toLowerCase();
  return !object || object.isLight || object.isCamera || object.userData?.editorOnly || name.includes('gridhelper') || name.includes('editorhelper');
}

function topLevelWorldObjects(scene) {
  if (!scene) return [];
  return scene.children.filter((o) => !isEditorHelper(o) && o.visible !== false);
}

function classifyObject(object) {
  const text = `${object?.name || ''} ${object?.userData?.role || ''} ${object?.userData?.type || ''}`.toLowerCase();
  if (text.includes('enemy') || text.includes('boss') || object?.userData?.role === 'enemy') return 'Enemy AI';
  if (text.includes('companion') || object?.userData?.role === 'companion') return 'Companion';
  if (text.includes('pet') || object?.userData?.role === 'pet') return 'Pet';
  if (text.includes('mount') || object?.userData?.role === 'mount') return 'Mount';
  if (text.includes('player') || object?.userData?.role === 'player') return 'Player';
  return 'World Object';
}

function findTerrainObjects(scene) {
  if (!scene) return [];
  return scene.children.filter((o) => {
    if (isEditorHelper(o)) return false;
    const text = `${o.name || ''} ${o.userData?.type || ''} ${o.userData?.role || ''}`.toLowerCase();
    return o.isMesh && (text.includes('terrain') || text.includes('ground') || text.includes('floor') || o.userData?.isTerrain);
  });
}

function ensureActorStats(object, role) {
  const current = object?.userData?.editorStats || {};
  return { ...DEFAULT_STATS, ...current, role };
}

function makeDefaultDamage() {
  return { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, name: 'Physical Hit', type: 'physical', amount: 50, multiplier: 1, defenseMultiplier: 1, teamDamage: false, elementalDamage: false };
}

function makeDefaultSetBonus() {
  return { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, name: 'New Set', description: '', effect: '', piecesRequired: 2, pieces: [], enabled: true };
}

export default function GameWorldEditController() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('world');
  const [actorRole, setActorRole] = useState('player');
  const [selectedId, setSelectedId] = useState('');
  const [objectsVersion, setObjectsVersion] = useState(0);
  const [worldDirty, setWorldDirty] = useState(false);
  const [terrainMode, setTerrainMode] = useState('raise');
  const [terrainBrushSize, setTerrainBrushSize] = useState(5);
  const [terrainStrength, setTerrainStrength] = useState(0.25);
  const [terrainTargetId, setTerrainTargetId] = useState('');
  const [terrainTexture, setTerrainTexture] = useState('default');
  const [actors, setActors] = useState(() => loadJSON('atom_xe_editor_actors', Object.fromEntries(ACTOR_ROLES.map((role) => [role, { ...DEFAULT_STATS, role }]))));
  const [damageByRole, setDamageByRole] = useState(() => loadJSON('atom_xe_editor_damage_by_role', Object.fromEntries(ACTOR_ROLES.map((role) => [role, [makeDefaultDamage()]]))));
  const [equipmentStats, setEquipmentStats] = useState(() => loadJSON('atom_xe_editor_equipment_stats', {}));
  const [setBonuses, setSetBonuses] = useState(() => loadJSON('atom_xe_editor_set_bonuses', []));
  const [animationConfig, setAnimationConfig] = useState(() => loadJSON('atom_xe_editor_animation', { rootMotion: 'in-place', snapToRoot: true, playbackRate: 1, blendIn: 0.1, blendOut: 0.1 }));
  const [weather, setWeather] = useState({ time: 8, weather: 'clear', seasonId: 'summer', climate: 'michigan', moonIllum: 0.5 });
  const [savedMessage, setSavedMessage] = useState('');
  const boxHelperRef = useRef(null);

  const scene = window.__gw3dScene;
  const camera = window.__gw3dCamera;
  const env = window.__worldEnv;
  const objects = useMemo(() => topLevelWorldObjects(scene), [scene, objectsVersion, open]);
  const terrainObjects = useMemo(() => findTerrainObjects(scene), [scene, objectsVersion, open]);
  const selected = objects.find((o) => o.uuid === selectedId) || null;
  const selectedTerrain = terrainObjects.find((o) => o.uuid === terrainTargetId) || terrainObjects[0] || null;

  useEffect(() => {
    if (!open) return undefined;
    const refresh = () => setObjectsVersion((v) => v + 1);
    const id = setInterval(refresh, 600);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!open || !scene || !camera) return undefined;
    const canvas = scene?.userData?.renderer?.domElement || document.querySelector('#game-world-canvas') || document.querySelector('canvas');
    if (!canvas) return undefined;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pick = (event) => {
      if (event.target !== canvas && !canvas.contains?.(event.target)) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(scene.children, true).filter((hit) => hit.object?.visible && !isEditorHelper(hit.object));
      const hit = hits[0]?.object;
      if (!hit) return;
      let root = hit;
      while (root.parent && root.parent !== scene && root.parent.type !== 'Scene') root = root.parent;
      if (tab === 'world') {
        setSelectedId(root.uuid);
        setWorldDirty(true);
      }
      if (tab === 'models') setSelectedId(root.uuid);
      if (tab === 'equipment') setSelectedId(root.uuid);
      if (tab === 'actors') {
        const role = classifyObject(root);
        if (role === 'Enemy AI') setActorRole('enemy');
        else if (role === 'Companion') setActorRole('companion');
        else if (role === 'Pet') setActorRole('pet');
        else if (role === 'Mount') setActorRole('mount');
        else if (role === 'Player') setActorRole('player');
        setSelectedId(root.uuid);
      }
      setObjectsVersion((v) => v + 1);
    };
    canvas.addEventListener('pointerdown', pick, true);
    return () => canvas.removeEventListener('pointerdown', pick, true);
  }, [open, tab, scene, camera]);

  useEffect(() => {
    if (!open || !scene || tab !== 'world') return undefined;
    const canvas = scene?.userData?.renderer?.domElement || document.querySelector('#game-world-canvas') || document.querySelector('canvas');
    if (!canvas) return undefined;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const sculpt = (event) => {
      if (event.buttons !== 1 || !selectedTerrain) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(selectedTerrain, true)[0];
      if (!hit?.point || !selectedTerrain.geometry?.attributes?.position) return;
      const position = selectedTerrain.geometry.attributes.position;
      const worldToLocal = selectedTerrain.worldToLocal(hit.point.clone());
      for (let i = 0; i < position.count; i += 1) {
        const vertex = new THREE.Vector3().fromBufferAttribute(position, i);
        const dx = vertex.x - worldToLocal.x;
        const dz = vertex.z - worldToLocal.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance > terrainBrushSize) continue;
        const falloff = 1 - distance / terrainBrushSize;
        const amount = terrainStrength * falloff * 0.08;
        if (terrainMode === 'raise') vertex.y += amount;
        if (terrainMode === 'lower') vertex.y -= amount;
        if (terrainMode === 'flatten') vertex.y += (worldToLocal.y - vertex.y) * terrainStrength * falloff * 0.15;
        if (terrainMode === 'smooth') vertex.y += (worldToLocal.y - vertex.y) * terrainStrength * falloff * 0.04;
        position.setY(i, vertex.y);
      }
      position.needsUpdate = true;
      selectedTerrain.geometry.computeVertexNormals?.();
      selectedTerrain.geometry.computeBoundingSphere?.();
      selectedTerrain.userData.isTerrain = true;
      selectedTerrain.userData.editorModified = true;
      setWorldDirty(true);
      setObjectsVersion((v) => v + 1);
    };
    canvas.addEventListener('pointermove', sculpt, true);
    return () => canvas.removeEventListener('pointermove', sculpt, true);
  }, [open, tab, scene, camera, selectedTerrain, terrainMode, terrainBrushSize, terrainStrength]);

  useEffect(() => {
    if (boxHelperRef.current && scene) scene.remove(boxHelperRef.current);
    boxHelperRef.current = null;
    if (selected && scene) {
      const helper = new THREE.BoxHelper(selected, 0x63e6ff);
      helper.name = 'EditorHelperSelection';
      helper.userData.editorOnly = true;
      scene.add(helper);
      boxHelperRef.current = helper;
    }
    return () => {
      if (boxHelperRef.current && scene) scene.remove(boxHelperRef.current);
    };
  }, [selected, scene]);

  useEffect(() => {
    if (!open) return undefined;
    const read = () => {
      const next = env?.getState?.();
      if (next) setWeather({ time: next.time ?? 8, weather: next.manualWeather || next.weather || 'clear', seasonId: next.seasonId || 'summer', climate: next.climate || 'michigan', moonIllum: next.moonIllum ?? 0.5 });
      const savedPlayer = loadJSON('atom_xe_preview_player_stats', null);
      if (savedPlayer) setActors((current) => ({ ...current, player: { ...current.player, ...savedPlayer } }));
    };
    read();
    const id = setInterval(read, 800);
    return () => clearInterval(id);
  }, [open, env]);

  useEffect(() => {
    if (!open) return;
    saveJSON('atom_xe_editor_actors', actors);
    saveJSON('atom_xe_editor_damage_by_role', damageByRole);
    saveJSON('atom_xe_editor_equipment_stats', equipmentStats);
    saveJSON('atom_xe_editor_set_bonuses', setBonuses);
    saveJSON('atom_xe_editor_animation', animationConfig);
    dispatch('atomXeEditorActorsChanged', actors);
    dispatch('atomXeEditorDamageConfigChanged', damageByRole);
    dispatch('atomXeEditorEquipmentChanged', equipmentStats);
    dispatch('atomXeEditorSetBonusesChanged', setBonuses);
    dispatch('atomXeEditorAnimationChanged', animationConfig);
  }, [actors, damageByRole, equipmentStats, setBonuses, animationConfig, open]);

  useEffect(() => {
    if (open && env) env.setTime?.(weather.time);
  }, [weather.time, open, env]);

  const updateSelectedTransform = (path, value) => {
    if (!selected) return;
    const n = asNum(value);
    if (path.startsWith('p')) selected.position[{ px: 'x', py: 'y', pz: 'z' }[path]] = n;
    if (path.startsWith('r')) selected.rotation[{ rx: 'x', ry: 'y', rz: 'z' }[path]] = n;
    if (path.startsWith('s')) selected.scale[{ sx: 'x', sy: 'y', sz: 'z' }[path]] = Math.max(0.001, n);
    setWorldDirty(true);
    setObjectsVersion((v) => v + 1);
  };

  const addPrimitive = (kind) => {
    if (!scene) return;
    const material = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.55, metalness: 0.15 });
    let geometry;
    if (kind === 'box') geometry = new THREE.BoxGeometry(1, 1, 1);
    if (kind === 'sphere') geometry = new THREE.SphereGeometry(0.6, 24, 16);
    if (kind === 'cylinder') geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
    if (kind === 'plane') geometry = new THREE.PlaneGeometry(3, 3, 16, 16);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `Editor_${kind}_${Date.now()}`;
    mesh.position.set(0, 1, 0);
    if (kind === 'plane') mesh.rotation.x = -Math.PI / 2;
    mesh.userData.editorCreated = true;
    scene.add(mesh);
    setSelectedId(mesh.uuid);
    setWorldDirty(true);
    setObjectsVersion((v) => v + 1);
  };

  const updateActor = (key, value) => {
    const next = { ...actors[actorRole], [key]: asNum(value, actors[actorRole]?.[key] ?? 0) };
    setActors((current) => ({ ...current, [actorRole]: next }));
    if (selected) selected.userData.editorStats = next;
  };

  const addDamage = () => setDamageByRole((current) => ({ ...current, [actorRole]: [...(current[actorRole] || []), makeDefaultDamage()] }));
  const updateDamage = (id, key, value) => setDamageByRole((current) => ({ ...current, [actorRole]: (current[actorRole] || []).map((item) => item.id === id ? { ...item, [key]: ['amount', 'multiplier', 'defenseMultiplier'].includes(key) ? asNum(value, item[key]) : value } : item) }));
  const removeDamage = (id) => setDamageByRole((current) => ({ ...current, [actorRole]: (current[actorRole] || []).filter((item) => item.id !== id) }));

  const setEquipmentStat = (id, key, value) => setEquipmentStats((current) => ({ ...current, [id]: { ...(current[id] || {}), [key]: asNum(value, current[id]?.[key] || 0) } }));
  const addEquipmentStat = () => {
    if (!selected) return;
    setEquipmentStats((current) => ({ ...current, [selected.uuid]: { ...(current[selected.uuid] || {}), hp: current[selected.uuid]?.hp ?? 0 } }));
  };

  const addSetBonus = () => setSetBonuses((current) => [...current, makeDefaultSetBonus()]);
  const updateSetBonus = (id, key, value) => setSetBonuses((current) => current.map((item) => item.id === id ? { ...item, [key]: ['piecesRequired'].includes(key) ? Math.max(1, asNum(value, item[key])) : value } : item));
  const toggleSetPiece = (id, uuid) => setSetBonuses((current) => current.map((item) => item.id === id ? { ...item, pieces: item.pieces.includes(uuid) ? item.pieces.filter((piece) => piece !== uuid) : [...item.pieces, uuid] } : item));

  const saveCurrentWorld = () => {
    const state = {
      version: 2,
      objects: objects.map((o) => ({ id: o.uuid, name: o.name, role: o.userData?.role || classifyObject(o), position: o.position.toArray(), rotation: [o.rotation.x, o.rotation.y, o.rotation.z], scale: o.scale.toArray(), visible: o.visible, userData: o.userData?.editorStats ? { editorStats: o.userData.editorStats } : {} })),
      terrain: terrainObjects.map((o) => ({ id: o.uuid, name: o.name, modified: !!o.userData?.editorModified })),
      weather: env?.getState?.() || weather,
      actors,
      equipmentStats,
      setBonuses,
    };
    saveJSON('atom_xe_preview_world_edits', state);
    dispatch('atomXeEditorWorldSaved', state);
    setSavedMessage('Current live world saved');
    setWorldDirty(false);
    setTimeout(() => setSavedMessage(''), 1800);
  };

  const modelGroups = useMemo(() => {
    const groups = {};
    objects.forEach((o) => { const group = classifyObject(o); groups[group] = [...(groups[group] || []), o]; });
    return groups;
  }, [objects]);

  if (!open) {
    return <button onClick={() => setOpen(true)} className="fixed left-1/2 top-[88px] z-[95] -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs font-semibold text-white/85 shadow-lg backdrop-blur-xl hover:bg-black/65">✦ Edit World</button>;
  }

  const actorDamage = damageByRole[actorRole] || [];
  const equipmentForSelected = selected ? equipmentStats[selected.uuid] || {} : {};

  return (
    <>
      <button onClick={() => setOpen(false)} className="fixed left-1/2 top-[88px] z-[95] -translate-x-1/2 rounded-full border border-white/15 bg-orange-500/20 px-4 py-2 text-xs font-semibold text-orange-100 shadow-lg backdrop-blur-xl hover:bg-orange-500/30">Done Editing</button>
      <aside className="fixed right-0 top-0 z-[90] flex h-screen w-[min(30vw,460px)] min-w-[340px] flex-col border-l border-white/10 bg-slate-950/72 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div><div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/60">ATOM × EVE</div><div className="text-sm font-bold text-white">Live World Editor</div><div className="text-[9px] text-white/35">Editing the existing Game Viewer scene</div></div>
          <div className="flex items-center gap-1"><Button onClick={saveCurrentWorld} size="sm" className="h-7 px-2 text-[9px]"><Save className="mr-1 h-3 w-3" />Save</Button><button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-white/50 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button></div>
        </div>

        <div className="grid grid-cols-3 gap-1 border-b border-white/10 p-2">
          {TABS.map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={`flex items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] ${tab === id ? 'bg-cyan-400/10 text-cyan-100 ring-1 ring-cyan-400/20' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}><Icon className="h-3 w-3" />{label}</button>)}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {tab === 'world' && <div className="space-y-3">
            <section className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><div className="flex items-center gap-2 text-xs font-semibold text-white"><Mountain className="h-4 w-4 text-cyan-300" />Current Terrain</div><div className="mt-1 text-[10px] text-white/45">This edits the terrain already rendered in the Game Viewer. There is no replacement terrain scene.</div><select value={terrainTargetId || selectedTerrain?.uuid || ''} onChange={(e) => setTerrainTargetId(e.target.value)} className="mt-2 h-8 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[10px] text-white">{terrainObjects.length ? terrainObjects.map((o) => <option key={o.uuid} value={o.uuid}>{o.name || 'Terrain mesh'}</option>) : <option value="">No terrain mesh detected</option>}</select><div className="mt-2 grid grid-cols-4 gap-1">{TERRAIN_MODES.map((mode) => <button key={mode} onClick={() => setTerrainMode(mode)} className={`rounded-lg border px-1 py-2 text-[9px] capitalize ${terrainMode === mode ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100' : 'border-white/10 text-white/50'}`}>{mode}</button>)}</div><label className="mt-3 block text-[9px] uppercase text-white/45">Brush Size <span className="float-right text-white/70">{terrainBrushSize.toFixed(1)}</span></label><Slider value={[terrainBrushSize]} min={0.5} max={20} step={0.5} onValueChange={(v) => setTerrainBrushSize(v[0])} /><label className="mt-3 block text-[9px] uppercase text-white/45">Strength <span className="float-right text-white/70">{terrainStrength.toFixed(2)}</span></label><Slider value={[terrainStrength]} min={0.01} max={1} step={0.01} onValueChange={(v) => setTerrainStrength(v[0])} /><label className="mt-3 block text-[9px] uppercase text-white/45">Surface</label><select value={terrainTexture} onChange={(e) => setTerrainTexture(e.target.value)} className="h-8 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[10px] text-white"><option value="default">Existing material</option><option value="grass">Grass</option><option value="stone">Stone</option><option value="sand">Sand</option><option value="snow">Snow</option></select><div className="mt-2 rounded-lg bg-cyan-400/5 p-2 text-[9px] text-cyan-100/60">Drag directly across the 3D world while this panel is open to sculpt.</div></section>
            <section className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><div className="mb-2 text-xs font-semibold text-white">Add Objects To This Map</div><div className="grid grid-cols-2 gap-2">{['box','sphere','cylinder','plane'].map((kind) => <Button key={kind} onClick={() => addPrimitive(kind)} className="h-8 text-[9px] capitalize"><Plus className="mr-1 h-3 w-3" />{kind}</Button>)}</div></section>
            <section className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><div className="mb-2 text-xs font-semibold text-white">Selected World Object</div>{selected ? <><div className="mb-2 text-[10px] text-cyan-100">{selected.name || selected.type}</div><div className="grid grid-cols-3 gap-1">{[['px','PX'],['py','PY'],['pz','PZ'],['rx','RX'],['ry','RY'],['rz','RZ'],['sx','SX'],['sy','SY'],['sz','SZ']].map(([key,label]) => <Input key={key} value={key[0] === 'p' ? selected.position[{px:'x',py:'y',pz:'z'}[key]] : key[0] === 'r' ? selected.rotation[{rx:'x',ry:'y',rz:'z'}[key]] : selected.scale[{sx:'x',sy:'y',sz:'z'}[key]]} onChange={(e) => updateSelectedTransform(key, e.target.value)} className="h-7 text-[9px]" placeholder={label} />)}</div></> : <div className="text-[10px] text-white/35">Click an object in the world to select it.</div>}</section>
            {savedMessage && <div className="rounded-lg bg-emerald-400/10 p-2 text-[10px] text-emerald-200">{savedMessage}</div>}
          </div>}

          {tab === 'models' && <div className="space-y-3"><section className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><div className="text-xs font-semibold text-white">Current Models In This World</div><div className="mt-1 text-[9px] text-white/40">Every visible top-level model/object in the existing scene is listed and organized by role.</div></section>{Object.entries(modelGroups).map(([group, items]) => <section key={group} className="rounded-xl border border-white/10 bg-white/[0.03] p-2"><div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-white"><span>{group}</span><span className="text-white/30">{items.length}</span></div>{items.map((o) => <button key={o.uuid} onClick={() => setSelectedId(o.uuid)} className={`mb-1 w-full rounded-lg border px-2 py-2 text-left text-[10px] ${selected?.uuid === o.uuid ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-50' : 'border-white/10 bg-black/15 text-white/60 hover:bg-white/5'}`}>{o.name || o.type}</button>)}</section>)}</div>}

          {tab === 'actors' && <div className="space-y-3"><div className="grid grid-cols-5 gap-1">{ACTOR_ROLES.map((role) => <button key={role} onClick={() => setActorRole(role)} className={`rounded-lg border px-1 py-2 text-[8px] capitalize ${actorRole === role ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100' : 'border-white/10 text-white/45'}`}>{role === 'enemy' ? 'Enemy AI' : role}</button>)}</div><section className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><div className="text-xs font-semibold capitalize text-white">{actorRole === 'enemy' ? 'Enemy AI' : actorRole} Stats</div><div className="mt-1 text-[9px] text-white/40">Edit the existing actor type without opening a prompt.</div><div className="mt-2 grid grid-cols-2 gap-2">{Object.keys(DEFAULT_STATS).map((key) => <label key={key} className="text-[9px] uppercase text-white/45">{key}<Input value={actors[actorRole]?.[key] ?? 0} onChange={(e) => updateActor(key, e.target.value)} className="mt-1 h-7 text-[9px]" /></label>)}</div></section><section className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><div className="flex items-center justify-between"><div className="text-xs font-semibold text-white">Damage Effects</div><Button onClick={addDamage} size="sm" className="h-7 px-2 text-[9px]"><Plus className="mr-1 h-3 w-3" />Add</Button></div><div className="mt-2 space-y-2">{actorDamage.map((item) => <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-2"><div className="grid grid-cols-2 gap-1"><Input value={item.name} onChange={(e) => updateDamage(item.id,'name',e.target.value)} className="h-7 text-[9px]" placeholder="Damage name" /><select value={item.type} onChange={(e) => updateDamage(item.id,'type',e.target.value)} className="h-7 rounded-lg border border-white/10 bg-black/30 px-1 text-[9px] text-white">{DAMAGE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div><div className="mt-1 grid grid-cols-3 gap-1"><Input value={item.amount} onChange={(e) => updateDamage(item.id,'amount',e.target.value)} className="h-7 text-[9px]" placeholder="Amount" /><Input value={item.multiplier} onChange={(e) => updateDamage(item.id,'multiplier',e.target.value)} className="h-7 text-[9px]" placeholder="Multiplier" /><Input value={item.defenseMultiplier} onChange={(e) => updateDamage(item.id,'defenseMultiplier',e.target.value)} className="h-7 text-[9px]" placeholder="Defense" /></div><div className="mt-1 flex items-center justify-between text-[8px] text-white/45"><label><input type="checkbox" checked={!!item.teamDamage} onChange={(e) => updateDamage(item.id,'teamDamage',e.target.checked)} /> Team damage</label><label><input type="checkbox" checked={!!item.elementalDamage} onChange={(e) => updateDamage(item.id,'elementalDamage',e.target.checked)} /> Elemental</label><button onClick={() => removeDamage(item.id)} className="text-red-300/70">Remove</button></div></div>)}</div></section></div>}

          {tab === 'equipment' && <div className="space-y-3"><section className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><div className="text-xs font-semibold text-white">Equipment Parameters</div><div className="mt-1 text-[9px] text-white/40">Select any model from the existing world, then add named stats that appear on the item immediately.</div>{selected ? <><div className="mt-2 rounded-lg bg-cyan-400/5 p-2 text-[10px] text-cyan-100">Selected: {selected.name || selected.type}</div><Button onClick={addEquipmentStat} className="mt-2 h-8 w-full text-[9px]"><Plus className="mr-1 h-3 w-3" />Add Stat To This Model</Button><div className="mt-2 grid grid-cols-2 gap-2">{['hp','defense','armor','damage','elementalDamage','strength','agility','intelligence','stamina','mana'].map((key) => <label key={key} className="text-[9px] uppercase text-white/45">{key}<Input value={equipmentForSelected[key] ?? 0} onChange={(e) => setEquipmentStat(selected.uuid,key,e.target.value)} className="mt-1 h-7 text-[9px]" /></label>)}</div></> : <div className="mt-2 text-[9px] text-white/35">Select a model in the Models tab or click it in the world first.</div>}</section><section className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><div className="flex items-center justify-between"><div><div className="text-xs font-semibold text-white">Set Bonuses</div><div className="text-[9px] text-white/40">Build multi-piece equipment sets from the actual models in this world.</div></div><Button onClick={addSetBonus} size="sm" className="h-7 px-2 text-[9px]"><Plus className="mr-1 h-3 w-3" />Set</Button></div><div className="mt-2 space-y-3">{setBonuses.map((set) => <div key={set.id} className="rounded-lg border border-white/10 bg-black/20 p-2"><div className="grid grid-cols-2 gap-1"><Input value={set.name} onChange={(e) => updateSetBonus(set.id,'name',e.target.value)} className="h-7 text-[9px]" placeholder="Set name" /><Input type="number" value={set.piecesRequired} onChange={(e) => updateSetBonus(set.id,'piecesRequired',e.target.value)} className="h-7 text-[9px]" placeholder="Pieces" /></div><Input value={set.description} onChange={(e) => updateSetBonus(set.id,'description',e.target.value)} className="mt-1 h-7 text-[9px]" placeholder="Description" /><Input value={set.effect} onChange={(e) => updateSetBonus(set.id,'effect',e.target.value)} className="mt-1 h-7 text-[9px]" placeholder="Effect / condition / passive" /><div className="mt-2 text-[9px] uppercase text-white/40">Select pieces</div><div className="mt-1 max-h-36 overflow-y-auto space-y-1">{objects.map((o) => <label key={o.uuid} className="flex items-center gap-2 rounded-md px-2 py-1 text-[9px] text-white/60 hover:bg-white/5"><input type="checkbox" checked={set.pieces.includes(o.uuid)} onChange={() => toggleSetPiece(set.id,o.uuid)} />{o.name || o.type}</label>)}</div></div>)}</div></section></div>}

          {tab === 'animation' && <div className="space-y-3"><section className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><div className="text-xs font-semibold text-white">Animation Root Motion</div><div className="mt-1 text-[9px] text-white/40">Control whether animation movement stays in place or drives the actor root.</div><select value={animationConfig.rootMotion} onChange={(e) => setAnimationConfig((c) => ({ ...c, rootMotion: e.target.value, snapToRoot: e.target.value !== 'in-place' }))} className="mt-2 h-8 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[10px] text-white"><option value="in-place">In Place / Snapped</option><option value="xy">Root Motion XY</option><option value="xyz">Root Motion XYZ</option></select><label className="mt-2 block text-[9px] uppercase text-white/45">Playback Rate <span className="float-right">{animationConfig.playbackRate.toFixed(2)}x</span></label><Slider value={[animationConfig.playbackRate]} min={0.1} max={3} step={0.05} onValueChange={(v) => setAnimationConfig((c) => ({ ...c, playbackRate: v[0] }))} /><div className="mt-2 grid grid-cols-2 gap-2"><Input value={animationConfig.blendIn} onChange={(e) => setAnimationConfig((c) => ({ ...c, blendIn: asNum(e.target.value) }))} className="h-7 text-[9px]" placeholder="Blend in" /><Input value={animationConfig.blendOut} onChange={(e) => setAnimationConfig((c) => ({ ...c, blendOut: asNum(e.target.value) }))} className="h-7 text-[9px]" placeholder="Blend out" /></div></section></div>}

          {tab === 'weather' && <div className="space-y-3"><section className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><div className="text-xs font-semibold text-white">Existing World Environment</div><div className="mt-2 grid grid-cols-2 gap-2"><label className="text-[9px] uppercase text-white/45">Time<Input type="number" value={weather.time} onChange={(e) => setWeather((w) => ({ ...w, time: asNum(e.target.value,w.time) }))} className="mt-1 h-7 text-[9px]" /></label><label className="text-[9px] uppercase text-white/45">Weather<select value={weather.weather} onChange={(e) => { const value=e.target.value; env?.setWeather?.(value); setWeather((w)=>({...w,weather:value})); }} className="mt-1 h-7 w-full rounded-lg border border-white/10 bg-black/30 px-1 text-[9px] text-white"><option>clear</option><option>rain</option><option>snow</option><option>storm</option><option>fog</option></select></label><label className="text-[9px] uppercase text-white/45">Season<select value={weather.seasonId} onChange={(e) => { const value=e.target.value; env?.setSeason?.(value); setWeather((w)=>({...w,seasonId:value})); }} className="mt-1 h-7 w-full rounded-lg border border-white/10 bg-black/30 px-1 text-[9px] text-white"><option>spring</option><option>summer</option><option>autumn</option><option>winter</option></select></label><label className="text-[9px] uppercase text-white/45">Climate<select value={weather.climate} onChange={(e) => { const value=e.target.value; env?.setClimate?.(value); setWeather((w)=>({...w,climate:value})); }} className="mt-1 h-7 w-full rounded-lg border border-white/10 bg-black/30 px-1 text-[9px] text-white"><option>michigan</option><option>desert</option><option>tropical</option><option>arctic</option><option>temperate</option></select></label></div></section></div>}
        </div>
      </aside>
    </>
  );
}
