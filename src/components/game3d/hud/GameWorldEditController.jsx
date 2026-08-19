import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { Box, CloudSun, Film, Mountain, Plus, Save, Shield, Sparkles, Swords, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

const TABS = [
  ['world', 'World', Mountain], ['models', 'Models', Box], ['physics', 'Physics', Shield],
  ['effects', 'Effects', Sparkles], ['damage', 'Damage', Swords], ['actors', 'Actors', Users],
  ['equipment', 'Equipment', Shield], ['animation', 'Animation', Film], ['weather', 'Weather', CloudSun],
];
const ACTOR_ROLES = ['player', 'enemy', 'companion', 'pet', 'mount'];
const DAMAGE_TYPES = ['physical', 'fire', 'ice', 'electric', 'poison', 'arcane', 'holy', 'shadow', 'wind', 'team'];
const TERRAIN_MODES = ['raise', 'lower', 'flatten', 'smooth'];
const DEFAULT_STATS = { level: 1, xp: 0, hp: 100, maxHP: 100, attack: 10, defense: 5, armor: 0, strength: 10, agility: 10, intelligence: 10, stamina: 100, mana: 100, crit: 0, speed: 1, statPointValue: 1 };

const asNum = (value, fallback = 0) => { const n = Number(value); return Number.isFinite(n) ? n : fallback; };
const loadJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const saveJSON = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
const dispatch = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

function isEditorHelper(object) {
  const name = String(object?.name || '').toLowerCase();
  return !object || object.isLight || object.isCamera || object.userData?.editorOnly || object.userData?.editorHelper || name.includes('gridhelper') || name.includes('editorhelper');
}
function topLevelWorldObjects(scene) { return scene ? scene.children.filter((o) => !isEditorHelper(o) && o.visible !== false) : []; }
function classifyObject(object) {
  const text = `${object?.name || ''} ${object?.userData?.role || ''} ${object?.userData?.type || ''}`.toLowerCase();
  if (text.includes('enemy') || text.includes('boss') || object?.userData?.role === 'enemy') return 'enemy';
  if (text.includes('companion') || object?.userData?.role === 'companion') return 'companion';
  if (text.includes('pet') || object?.userData?.role === 'pet') return 'pet';
  if (text.includes('mount') || object?.userData?.role === 'mount') return 'mount';
  if (text.includes('player') || object?.userData?.role === 'player') return 'player';
  return 'object';
}
function isTerrain(object) {
  const text = `${object?.name || ''} ${object?.userData?.type || ''}`.toLowerCase();
  return !!object?.isMesh && (object.userData?.isTerrain || /terrain|ground|grass|floor/.test(text));
}
function makeDamage() { return { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, name: 'Physical Hit', type: 'physical', amount: 50, multiplier: 1, defenseMultiplier: 1, elemental: 0, teamDamage: 0, hits: 1, cooldown: 0, selfDamage: 0 }; }
function makeSetBonus() { return { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, name: 'New Set', description: '', effect: '', piecesRequired: 2, pieces: [], enabled: true }; }
function ensureConfig(object) {
  object.userData ||= {};
  object.userData.editorConfig ||= {
    physics: { mass: 1, friction: .5, restitution: .15, gravity: 1, collision: true, windResponse: 1, airResistance: .02, rollingResistance: .01, maxSpeed: 100, breakSoundBarrierAt: 343 },
    effects: { enabled: false, name: '', socket: '', offsetX: 0, offsetY: 0, offsetZ: 0, dirX: 0, dirY: 0, dirZ: 1, scale: 1, speed: 1, loop: false, frequency: 1 },
    damage: { base: 10, multiplier: 1, defenseMultiplier: 1, type: 'physical', elemental: 0, teamDamage: 0, hits: 1, cooldown: 0, selfDamage: 0 },
    animation: { name: '', speed: 1, loop: false, rootMotion: false, snapToRoot: true, blendIn: .1, blendOut: .1, chain: [] },
    stats: { ...DEFAULT_STATS },
  };
  return object.userData.editorConfig;
}
function Num({ label, value, onChange, step = 'any' }) {
  return <label className="block text-[9px] uppercase tracking-wider text-white/45">{label}<input type="number" step={step} value={Number.isFinite(Number(value)) ? value : 0} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full rounded-md border border-white/10 bg-white/[.04] px-2 py-1 text-xs text-white outline-none focus:border-cyan-300/40" /></label>;
}
function Toggle({ label, value, onChange }) { return <label className="flex items-center justify-between gap-2 text-[10px] text-white/65"><span>{label}</span><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /></label>; }

export default function GameWorldEditController() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('world');
  const [selectedId, setSelectedId] = useState('');
  const [version, setVersion] = useState(0);
  const [gameplay, setGameplay] = useState(false);
  const [movement, setMovement] = useState(false);
  const [terrainMode, setTerrainMode] = useState('raise');
  const [brush, setBrush] = useState(5);
  const [strength, setStrength] = useState(.25);
  const [terrainTargetId, setTerrainTargetId] = useState('');
  const [actors, setActors] = useState(() => loadJSON('atom_xe_editor_actors', Object.fromEntries(ACTOR_ROLES.map((r) => [r, { ...DEFAULT_STATS, role: r }]))));
  const [actorRole, setActorRole] = useState('player');
  const [damageByRole, setDamageByRole] = useState(() => loadJSON('atom_xe_editor_damage_by_role', Object.fromEntries(ACTOR_ROLES.map((r) => [r, [makeDamage()]]))));
  const [equipmentStats, setEquipmentStats] = useState(() => loadJSON('atom_xe_editor_equipment_stats', {}));
  const [setBonuses, setSetBonuses] = useState(() => loadJSON('atom_xe_editor_set_bonuses', []));
  const [animationConfig, setAnimationConfig] = useState(() => loadJSON('atom_xe_editor_animation', { rootMotion: 'in-place', snapToRoot: true, playbackRate: 1, blendIn: .1, blendOut: .1, chain: [] }));
  const [weather, setWeather] = useState({ time: 8, weather: 'clear', seasonId: 'summer', climate: 'temperate', moonIllum: .5 });
  const [assets, setAssets] = useState([]);
  const [worldDirty, setWorldDirty] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const helperRef = useRef(null);

  const scene = window.__gw3dScene;
  const camera = window.__gw3dCamera;
  const env = window.__worldEnv;
  const objects = useMemo(() => topLevelWorldObjects(scene), [scene, version, open]);
  const terrainObjects = useMemo(() => objects.filter(isTerrain), [objects]);
  const selected = objects.find((o) => o.uuid === selectedId) || null;
  const selectedTerrain = terrainObjects.find((o) => o.uuid === terrainTargetId) || terrainObjects[0] || null;
  const selectedConfig = selected ? ensureConfig(selected) : null;

  useEffect(() => { if (!open) return undefined; const id = setInterval(() => setVersion((v) => v + 1), 700); return () => clearInterval(id); }, [open]);

  const selectObject = (raw) => {
    if (!raw) return;
    let root = raw;
    while (root.parent && root.parent !== scene && root.parent.type !== 'Scene' && !root.userData?.editorSelectable) root = root.parent;
    root.userData ||= {};
    root.userData.editorSelectable = true;
    root.userData.editorKind = classifyObject(root);
    ensureConfig(root);
    setSelectedId(root.uuid);
    if (isTerrain(root)) setTab('world');
    else if (classifyObject(root) !== 'object') { setActorRole(classifyObject(root)); setTab('actors'); }
    else setTab('models');
    setVersion((v) => v + 1);
    dispatch('gameEditorObjectSelected', { object: root, kind: classifyObject(root), config: root.userData.editorConfig });
  };

  useEffect(() => {
    if (!open || !scene || !camera) return undefined;
    const canvas = scene.userData?.renderer?.domElement || document.querySelector('#game-world-canvas') || document.querySelector('canvas');
    if (!canvas) return undefined;
    const ray = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    const pick = (event) => {
      if (event.target !== canvas && !canvas.contains?.(event.target)) return;
      if (gameplay && !movement) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(scene.children, true).find((h) => h.object?.visible && !isEditorHelper(h.object));
      if (!hit?.object) return;
      selectObject(hit.object);
      if (!gameplay) { event.preventDefault(); event.stopPropagation(); }
    };
    canvas.addEventListener('pointerdown', pick, true);
    return () => canvas.removeEventListener('pointerdown', pick, true);
  }, [open, gameplay, movement, scene, camera]);

  useEffect(() => {
    if (!open || !scene || !camera || tab !== 'world' || !selectedTerrain) return undefined;
    const canvas = scene.userData?.renderer?.domElement || document.querySelector('#game-world-canvas') || document.querySelector('canvas');
    if (!canvas) return undefined;
    const ray = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    const sculpt = (event) => {
      if (event.buttons !== 1 || gameplay) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObject(selectedTerrain, true)[0]; const pos = selectedTerrain.geometry?.attributes?.position;
      if (!hit?.point || !pos) return;
      const local = selectedTerrain.worldToLocal(hit.point.clone());
      for (let i = 0; i < pos.count; i += 1) {
        const dx = pos.getX(i) - local.x; const dz = pos.getZ(i) - local.z; const d = Math.hypot(dx, dz); if (d > brush) continue;
        const f = 1 - d / brush; const y = pos.getY(i);
        if (terrainMode === 'raise') pos.setY(i, y + strength * f * .08);
        if (terrainMode === 'lower') pos.setY(i, y - strength * f * .08);
        if (terrainMode === 'flatten') pos.setY(i, y + (local.y - y) * strength * f * .15);
        if (terrainMode === 'smooth') pos.setY(i, y + (local.y - y) * strength * f * .04);
      }
      pos.needsUpdate = true; selectedTerrain.geometry.computeVertexNormals?.(); selectedTerrain.geometry.computeBoundingSphere?.();
      selectedTerrain.userData.isTerrain = true; selectedTerrain.userData.editorTerrainDirty = true; setWorldDirty(true); setVersion((v) => v + 1);
      dispatch('gameEditorTerrainChanged', { object: selectedTerrain, geometry: selectedTerrain.geometry, mode: terrainMode });
    };
    canvas.addEventListener('pointermove', sculpt, true);
    return () => canvas.removeEventListener('pointermove', sculpt, true);
  }, [open, scene, camera, tab, selectedTerrain, terrainMode, brush, strength, gameplay]);

  useEffect(() => {
    if (helperRef.current && scene) scene.remove(helperRef.current);
    helperRef.current = null;
    if (selected && scene) { const h = new THREE.BoxHelper(selected, 0x63e6ff); h.name = 'EditorHelperSelection'; h.userData.editorOnly = true; h.userData.editorHelper = true; scene.add(h); helperRef.current = h; }
    return () => { if (helperRef.current && scene) scene.remove(helperRef.current); };
  }, [selected, scene]);

  useEffect(() => {
    if (!open) return undefined;
    const read = () => { const next = env?.getState?.(); if (next) setWeather({ time: next.time ?? 8, weather: next.manualWeather || next.weather || 'clear', seasonId: next.seasonId || 'summer', climate: next.climate || 'temperate', moonIllum: next.moonIllum ?? .5 }); };
    read(); const id = setInterval(read, 900); return () => clearInterval(id);
  }, [open, env]);

  useEffect(() => {
    if (!open) return;
    saveJSON('atom_xe_editor_actors', actors); saveJSON('atom_xe_editor_damage_by_role', damageByRole); saveJSON('atom_xe_editor_equipment_stats', equipmentStats); saveJSON('atom_xe_editor_set_bonuses', setBonuses); saveJSON('atom_xe_editor_animation', animationConfig);
    dispatch('atomXeEditorActorsChanged', actors); dispatch('atomXeEditorDamageConfigChanged', damageByRole); dispatch('atomXeEditorEquipmentChanged', equipmentStats); dispatch('atomXeEditorSetBonusesChanged', setBonuses); dispatch('atomXeEditorAnimationChanged', animationConfig);
  }, [actors, damageByRole, equipmentStats, setBonuses, animationConfig, open]);

  useEffect(() => { if (open && env) env.setTime?.(weather.time); }, [weather.time, open, env]);

  const updateTransform = (key, value) => {
    if (!selected) return; const n = asNum(value);
    if (key === 'px') selected.position.x = n; if (key === 'py') selected.position.y = n; if (key === 'pz') selected.position.z = n;
    if (key === 'rx') selected.rotation.x = n; if (key === 'ry') selected.rotation.y = n; if (key === 'rz') selected.rotation.z = n;
    if (key === 'sx') selected.scale.x = Math.max(.001, n); if (key === 'sy') selected.scale.y = Math.max(.001, n); if (key === 'sz') selected.scale.z = Math.max(.001, n);
    setWorldDirty(true); setVersion((v) => v + 1); dispatch('gameEditorObjectChanged', { object: selected, section: 'transform', key, value: n });
  };
  const changeConfig = (section, key, value) => { if (!selected) return; const cfg = ensureConfig(selected); cfg[section] ||= {}; cfg[section][key] = value; selected.userData.editorConfig = cfg; setWorldDirty(true); setVersion((v) => v + 1); dispatch('gameEditorObjectChanged', { object: selected, section, key, value, config: cfg }); };
  const updateActor = (key, value) => { const next = { ...actors[actorRole], [key]: asNum(value, actors[actorRole]?.[key] ?? 0) }; setActors((c) => ({ ...c, [actorRole]: next })); if (selected) { const cfg = ensureConfig(selected); cfg.stats = { ...cfg.stats, [key]: next[key] }; selected.userData.editorStats = next; } };
  const addDamage = () => setDamageByRole((c) => ({ ...c, [actorRole]: [...(c[actorRole] || []), makeDamage()] }));
  const updateDamage = (id, key, value) => setDamageByRole((c) => ({ ...c, [actorRole]: (c[actorRole] || []).map((d) => d.id === id ? { ...d, [key]: ['amount','multiplier','defenseMultiplier','elemental','teamDamage','hits','cooldown','selfDamage'].includes(key) ? asNum(value, d[key]) : value } : d) }));
  const removeDamage = (id) => setDamageByRole((c) => ({ ...c, [actorRole]: (c[actorRole] || []).filter((d) => d.id !== id) }));
  const addSetBonus = () => setSetBonuses((c) => [...c, makeSetBonus()]);
  const updateSetBonus = (id, key, value) => setSetBonuses((c) => c.map((s) => s.id === id ? { ...s, [key]: key === 'piecesRequired' ? Math.max(1, asNum(value, s[key])) : value } : s));
  const toggleSetPiece = (id, uuid) => setSetBonuses((c) => c.map((s) => s.id === id ? { ...s, pieces: s.pieces.includes(uuid) ? s.pieces.filter((p) => p !== uuid) : [...s.pieces, uuid] } : s));
  const addEquipmentStat = () => { if (!selected) return; setEquipmentStats((c) => ({ ...c, [selected.uuid]: { ...(c[selected.uuid] || {}), hp: c[selected.uuid]?.hp ?? 0 } })); };
  const setEquipmentStat = (key, value) => { if (!selected) return; setEquipmentStats((c) => ({ ...c, [selected.uuid]: { ...(c[selected.uuid] || {}), [key]: asNum(value) } })); };

  const addPrimitive = (kind) => {
    if (!scene) return; const mat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: .55, metalness: .15 });
    const geometry = kind === 'sphere' ? new THREE.SphereGeometry(.6, 24, 16) : kind === 'cylinder' ? new THREE.CylinderGeometry(.5, .5, 1, 24) : kind === 'plane' ? new THREE.PlaneGeometry(3, 3, 16, 16) : new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.Mesh(geometry, mat); mesh.name = `Editor_${kind}_${Date.now()}`; mesh.position.set(0, 1, 0); if (kind === 'plane') mesh.rotation.x = -Math.PI / 2; mesh.userData.editorCreated = true; scene.add(mesh); selectObject(mesh); setWorldDirty(true);
  };
  const removeSelected = () => { if (!selected || !scene) return; scene.remove(selected); if (helperRef.current) scene.remove(helperRef.current); dispatch('gameEditorObjectRemoved', { object: selected }); setSelectedId(''); setVersion((v) => v + 1); setWorldDirty(true); };
  const importFile = (file) => { if (!file) return; const url = URL.createObjectURL(file); const type = /\.(fbx|glb|gltf|obj)$/i.test(file.name) ? 'model' : /\.anim$/i.test(file.name) ? 'animation' : 'asset'; setAssets((a) => [...a, { id: `${Date.now()}-${file.name}`, name: file.name, url, type }]); };
  const addAssetToWorld = (asset, point = new THREE.Vector3(0, 1, 0)) => {
    if (!scene || !asset || asset.type === 'animation') { if (asset?.type === 'animation') dispatch('gameEditorAnimationImported', asset); return; }
    const place = (root) => { root.name = asset.name; root.userData.editorSource = 'user_asset'; root.userData.editorSelectable = true; root.position.copy(point); scene.add(root); selectObject(root); setWorldDirty(true); };
    if (/\.fbx$/i.test(asset.name)) new FBXLoader().load(asset.url, place, undefined, console.error);
    else if (/\.obj$/i.test(asset.name)) new OBJLoader().load(asset.url, place, undefined, console.error);
    else new GLTFLoader().load(asset.url, (g) => place(g.scene || g.scenes?.[0]), undefined, console.error);
  };
  useEffect(() => {
    if (!open) return undefined;
    const over = (e) => e.preventDefault(); const drop = (e) => { e.preventDefault(); const id = e.dataTransfer.getData('application/x-game-editor-asset'); const asset = assets.find((a) => a.id === id); if (asset) addAssetToWorld(asset); else if (e.dataTransfer.files?.[0]) importFile(e.dataTransfer.files[0]); };
    document.addEventListener('dragover', over, true); document.addEventListener('drop', drop, true); return () => { document.removeEventListener('dragover', over, true); document.removeEventListener('drop', drop, true); };
  }, [open, assets]);

  const saveWorld = () => {
    const state = { version: 3, objects: objects.map((o) => ({ id: o.uuid, name: o.name, role: classifyObject(o), position: o.position.toArray(), rotation: [o.rotation.x, o.rotation.y, o.rotation.z], scale: o.scale.toArray(), userData: o.userData?.editorConfig || {} })), terrain: terrainObjects.map((o) => ({ id: o.uuid, name: o.name, modified: !!o.userData?.editorTerrainDirty })), weather: env?.getState?.() || weather, actors, equipmentStats, setBonuses };
    saveJSON('atom_xe_preview_world_edits', state); dispatch('atomXeEditorWorldSaved', state); setSavedMessage('Current live world saved'); setWorldDirty(false); setTimeout(() => setSavedMessage(''), 1600);
  };

  if (!open) return <button onClick={() => setOpen(true)} className="fixed left-1/2 top-[88px] z-[95] -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs font-semibold text-white/85 shadow-lg backdrop-blur-xl hover:bg-black/65">✦ Edit World</button>;

  const actorDamage = damageByRole[actorRole] || [];
  const eq = selected ? equipmentStats[selected.uuid] || {} : {};
  const cfg = selectedConfig || { physics: {}, effects: {}, damage: {}, animation: {}, stats: {} };
  const groups = objects.reduce((acc, o) => { const g = classifyObject(o); (acc[g] ||= []).push(o); return acc; }, {});

  return <>
    <button onClick={() => setOpen(false)} className="fixed left-1/2 top-[88px] z-[95] -translate-x-1/2 rounded-full border border-white/15 bg-orange-500/20 px-4 py-2 text-xs font-semibold text-orange-100 shadow-lg backdrop-blur-xl hover:bg-orange-500/30">Done Editing</button>
    <aside className="fixed right-0 top-0 z-[90] flex h-screen w-[min(30vw,460px)] min-w-[340px] flex-col border-l border-white/10 bg-slate-950/72 shadow-2xl backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div><div className="text-[10px] uppercase tracking-[.28em] text-cyan-300/60">ATOM × EVE</div><div className="text-sm font-bold text-white">Edit Mode</div><div className="text-[9px] text-white/35">The center remains the existing live Game Viewer world.</div></div><div className="flex items-center gap-1"><Button onClick={saveWorld} size="sm" className="h-7 px-2 text-[9px]"><Save className="mr-1 h-3 w-3" />Save</Button><button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-white/50 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button></div></div>
      <div className="grid grid-cols-3 gap-1 border-b border-white/10 p-2">{TABS.map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={`flex items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] ${tab === id ? 'bg-cyan-400/10 text-cyan-100 ring-1 ring-cyan-400/20' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}><Icon className="h-3 w-3" />{label}</button>)}</div>
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[9px] text-white/40"><span>{selected ? `Selected: ${selected.name || selected.type}` : 'Click any object in the live world to edit it'}</span><span className={worldDirty ? 'text-amber-200' : 'text-emerald-200'}>{worldDirty ? 'Unsaved' : 'Live'}</span></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === 'world' && <div className="space-y-3"><section className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="flex items-center gap-2 text-xs font-semibold text-white"><Mountain className="h-4 w-4 text-cyan-300" />Existing World Terrain</div><div className="mt-1 text-[10px] text-white/45">This edits the terrain already rendered in the current Three.js world. No replacement terrain scene is created.</div><select value={terrainTargetId || selectedTerrain?.uuid || ''} onChange={(e) => setTerrainTargetId(e.target.value)} className="mt-2 h-8 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[10px] text-white"><option value="">{terrainObjects.length ? 'Select existing terrain' : 'No editable ground mesh detected'}</option>{terrainObjects.map((o) => <option key={o.uuid} value={o.uuid}>{o.name || 'Terrain mesh'}</option>)}</select><div className="mt-2 grid grid-cols-4 gap-1">{TERRAIN_MODES.map((m) => <button key={m} onClick={() => setTerrainMode(m)} className={`rounded-lg border px-1 py-2 text-[9px] capitalize ${terrainMode === m ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100' : 'border-white/10 text-white/50'}`}>{m}</button>)}</div><label className="mt-3 block text-[9px] uppercase text-white/45">Brush Size <span className="float-right text-white/70">{brush.toFixed(1)}</span></label><Slider value={[brush]} min={.5} max={20} step={.5} onValueChange={(v) => setBrush(v[0])} /><label className="mt-3 block text-[9px] uppercase text-white/45">Strength <span className="float-right text-white/70">{strength.toFixed(2)}</span></label><Slider value={[strength]} min={.01} max={1} step={.01} onValueChange={(v) => setStrength(v[0])} /><div className="mt-2 rounded-lg bg-cyan-400/5 p-2 text-[9px] text-cyan-100/60">Choose a terrain mode, then drag directly on the existing world terrain.</div></section><section className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="mb-2 text-xs font-semibold text-white">Transform Selected Object</div>{selected ? <><div className="mb-2 text-[10px] text-cyan-100">{selected.name || selected.type}</div><div className="grid grid-cols-3 gap-1">{[['px','X'],['py','Y'],['pz','Z'],['rx','RX'],['ry','RY'],['rz','RZ'],['sx','SX'],['sy','SY'],['sz','SZ']].map(([k,l]) => <Input key={k} value={k[0]==='p'?selected.position[{px:'x',py:'y',pz:'z'}[k]]:k[0]==='r'?selected.rotation[{rx:'x',ry:'y',rz:'z'}[k]]:selected.scale[{sx:'x',sy:'y',sz:'z'}[k]]} onChange={(e)=>updateTransform(k,e.target.value)} className="h-7 text-[9px]" placeholder={l} />)}</div><button onClick={removeSelected} className="mt-2 w-full rounded-lg border border-red-300/10 bg-red-400/10 px-2 py-2 text-[9px] text-red-100">REMOVE SELECTED OBJECT</button></> : <div className="text-[10px] text-white/35">Click an existing model, NPC, boss, player, terrain mesh, or object in the 3D world.</div>}</section><section className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="mb-2 text-xs font-semibold text-white">Add To This Existing Map</div><div className="grid grid-cols-2 gap-2">{['box','sphere','cylinder','plane'].map((k)=><Button key={k} onClick={()=>addPrimitive(k)} className="h-8 text-[9px]"><Plus className="mr-1 h-3 w-3" />{k}</Button>)}</div></section></div>}
        {tab === 'models' && <div className="space-y-3"><section className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="flex items-center justify-between"><div><div className="text-xs font-semibold text-white">Models In Current World</div><div className="text-[9px] text-white/40">All existing top-level objects are selectable. Base44-created and imported objects use the same editor.</div></div><label className="cursor-pointer rounded-lg border border-cyan-300/15 bg-cyan-400/10 px-2 py-2 text-[9px] text-cyan-100">Import<input type="file" multiple accept=".glb,.gltf,.fbx,.obj,.anim,.png,.jpg,.jpeg,.webp,.hdr,.exr" className="hidden" onChange={(e)=>[...(e.target.files||[])].forEach(importFile)} /></label></div></section>{Object.entries(groups).map(([group, items])=><section key={group} className="rounded-xl border border-white/10 bg-white/[.03] p-2"><div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-white"><span className="capitalize">{group==='enemy'?'Enemy AI':group}</span><span className="text-white/30">{items.length}</span></div>{items.map((o)=><button key={o.uuid} onClick={()=>selectObject(o)} className={`mb-1 w-full rounded-lg border px-2 py-2 text-left text-[10px] ${selected?.uuid===o.uuid?'border-cyan-400/30 bg-cyan-400/10 text-cyan-50':'border-white/10 bg-black/15 text-white/60 hover:bg-white/5'}`}>{o.name||o.type}</button>)}</section>)}{assets.length>0&&<section className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="mb-2 text-xs font-semibold text-white">Imported Assets</div><div className="space-y-1">{assets.map((a)=><div key={a.id} draggable onDragStart={(e)=>e.dataTransfer.setData('application/x-game-editor-asset',a.id)} onDoubleClick={()=>addAssetToWorld(a)} className="cursor-grab rounded-lg border border-white/10 bg-white/5 p-2"><div className="truncate text-[10px] text-white">{a.name}</div><div className="text-[8px] text-white/35">{a.type} · drag into the world or double-click</div></div>)}</div></section>}</div>}
        {tab === 'physics' && <div className="space-y-3">{selected ? <section className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="text-xs font-semibold text-white">{selected.name || selected.type} Physics</div><div className="mt-1 grid grid-cols-2 gap-2">{[['mass','Mass'],['friction','Friction'],['restitution','Restitution'],['gravity','Gravity'],['windResponse','Wind Response'],['airResistance','Air Resistance'],['rollingResistance','Rolling Resistance'],['maxSpeed','Max Speed'],['breakSoundBarrierAt','Sound Barrier Speed']].map(([k,l])=><Num key={k} label={l} value={cfg.physics[k]} onChange={(v)=>changeConfig('physics',k,v)} />)}</div><div className="mt-3 space-y-2"><Toggle label="Collision Enabled" value={cfg.physics.collision} onChange={(v)=>changeConfig('physics','collision',v)} /><Toggle label="Affected By Wind" value={cfg.physics.windResponse > 0} onChange={(v)=>changeConfig('physics','windResponse',v?1:0)} /></div></section> : <p className="text-xs text-white/45">Click an object in the existing world first. Its physics appear here immediately.</p>}</div>}
        {tab === 'effects' && <div className="space-y-3">{selected ? <section className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="text-xs font-semibold text-white">Effects / Ability Attachment</div><div className="mt-1 grid grid-cols-2 gap-2"><Toggle label="Enabled" value={cfg.effects.enabled} onChange={(v)=>changeConfig('effects','enabled',v)} /><Toggle label="Loop" value={cfg.effects.loop} onChange={(v)=>changeConfig('effects','loop',v)} /><Num label="Scale" value={cfg.effects.scale} onChange={(v)=>changeConfig('effects','scale',v)} /><Num label="Speed" value={cfg.effects.speed} onChange={(v)=>changeConfig('effects','speed',v)} /><Num label="Frequency" value={cfg.effects.frequency} onChange={(v)=>changeConfig('effects','frequency',v)} /><label className="text-[9px] uppercase text-white/45">Effect Name<input value={cfg.effects.name||''} onChange={(e)=>changeConfig('effects','name',e.target.value)} className="mt-1 w-full rounded-md border border-white/10 bg-white/[.04] px-2 py-1 text-xs text-white" /></label><label className="text-[9px] uppercase text-white/45">Bone / Socket<input value={cfg.effects.socket||''} onChange={(e)=>changeConfig('effects','socket',e.target.value)} className="mt-1 w-full rounded-md border border-white/10 bg-white/[.04] px-2 py-1 text-xs text-white" /></label></div><div className="mt-2 grid grid-cols-3 gap-2">{[['offsetX','Offset X'],['offsetY','Offset Y'],['offsetZ','Offset Z'],['dirX','Direction X'],['dirY','Direction Y'],['dirZ','Direction Z']].map(([k,l])=><Num key={k} label={l} value={cfg.effects[k]} onChange={(v)=>changeConfig('effects',k,v)} />)}</div><div className="mt-2 rounded-lg bg-cyan-400/5 p-2 text-[9px] text-cyan-100/60">Precise socket/bone attachment, offset, direction, scale, speed, and frequency are stored on the selected live object.</div></section> : <p className="text-xs text-white/45">Select a live object to configure its effect attachment.</p>}</div>}
        {tab === 'damage' && <div className="space-y-3"><div className="grid grid-cols-5 gap-1">{ACTOR_ROLES.map((r)=><button key={r} onClick={()=>setActorRole(r)} className={`rounded-lg border px-1 py-2 text-[8px] capitalize ${actorRole===r?'border-cyan-400/30 bg-cyan-400/10 text-cyan-100':'border-white/10 text-white/45'}`}>{r==='enemy'?'Enemy AI':r}</button>)}</div><section className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="flex items-center justify-between"><div><div className="text-xs font-semibold text-white">Damage System</div><div className="text-[9px] text-white/40">Detailed damage channels for the selected actor role.</div></div><Button onClick={addDamage} size="sm" className="h-7 px-2 text-[9px]"><Plus className="mr-1 h-3 w-3"/>Add</Button></div><div className="mt-2 space-y-2">{actorDamage.map((d)=><div key={d.id} className="rounded-lg border border-white/10 bg-black/20 p-2"><div className="grid grid-cols-2 gap-1"><Input value={d.name} onChange={(e)=>updateDamage(d.id,'name',e.target.value)} className="h-7 text-[9px]" placeholder="Damage name"/><select value={d.type} onChange={(e)=>updateDamage(d.id,'type',e.target.value)} className="h-7 rounded-lg border border-white/10 bg-black/30 px-1 text-[9px] text-white">{DAMAGE_TYPES.map((t)=><option key={t}>{t}</option>)}</select></div><div className="mt-1 grid grid-cols-4 gap-1">{[['amount','Amount'],['multiplier','Multiplier'],['defenseMultiplier','Defense Mult.'],['elemental','Elemental']].map(([k,l])=><Input key={k} value={d[k]} onChange={(e)=>updateDamage(d.id,k,e.target.value)} className="h-7 text-[9px]" placeholder={l}/>)}</div><div className="mt-1 grid grid-cols-4 gap-1">{[['teamDamage','Team'],['hits','Hits'],['cooldown','Cooldown'],['selfDamage','Self Damage']].map(([k,l])=><Input key={k} value={d[k]} onChange={(e)=>updateDamage(d.id,k,e.target.value)} className="h-7 text-[9px]" placeholder={l}/>)}</div><button onClick={()=>removeDamage(d.id)} className="mt-1 text-[8px] text-red-300/70">Remove</button></div>)}</div></section></div>}
        {tab === 'actors' && <div className="space-y-3"><div className="grid grid-cols-5 gap-1">{ACTOR_ROLES.map((r)=><button key={r} onClick={()=>setActorRole(r)} className={`rounded-lg border px-1 py-2 text-[8px] capitalize ${actorRole===r?'border-cyan-400/30 bg-cyan-400/10 text-cyan-100':'border-white/10 text-white/45'}`}>{r==='enemy'?'Enemy AI':r}</button>)}</div><section className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="text-xs font-semibold capitalize text-white">{actorRole==='enemy'?'Enemy AI':actorRole} Stats</div><div className="mt-2 grid grid-cols-2 gap-2">{Object.keys(DEFAULT_STATS).map((k)=><label key={k} className="text-[9px] uppercase text-white/45">{k}<Input value={actors[actorRole]?.[k]??0} onChange={(e)=>updateActor(k,e.target.value)} className="mt-1 h-7 text-[9px]"/></label>)}</div></section></div>}
        {tab === 'equipment' && <div className="space-y-3"><section className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="text-xs font-semibold text-white">Equipment Parameters</div>{selected ? <><div className="mt-2 rounded-lg bg-cyan-400/5 p-2 text-[10px] text-cyan-100">Selected: {selected.name||selected.type}</div><Button onClick={addEquipmentStat} className="mt-2 h-8 w-full text-[9px]"><Plus className="mr-1 h-3 w-3"/>Add Stat</Button><div className="mt-2 grid grid-cols-2 gap-2">{['hp','defense','armor','damage','elementalDamage','strength','agility','intelligence','stamina','mana'].map((k)=><Num key={k} label={k} value={eq[k]??0} onChange={(v)=>setEquipmentStat(k,v)}/>)}</div></>:<div className="mt-2 text-[9px] text-white/35">Select a model first.</div>}</section><section className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="flex items-center justify-between"><div className="text-xs font-semibold text-white">Set Bonuses</div><Button onClick={addSetBonus} size="sm" className="h-7 px-2 text-[9px]"><Plus className="mr-1 h-3 w-3"/>Set</Button></div>{setBonuses.map((s)=><div key={s.id} className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2"><div className="grid grid-cols-2 gap-1"><Input value={s.name} onChange={(e)=>updateSetBonus(s.id,'name',e.target.value)} className="h-7 text-[9px]"/><Input type="number" value={s.piecesRequired} onChange={(e)=>updateSetBonus(s.id,'piecesRequired',e.target.value)} className="h-7 text-[9px]"/></div><Input value={s.description} onChange={(e)=>updateSetBonus(s.id,'description',e.target.value)} className="mt-1 h-7 text-[9px]" placeholder="Description"/><Input value={s.effect} onChange={(e)=>updateSetBonus(s.id,'effect',e.target.value)} className="mt-1 h-7 text-[9px]" placeholder="Effect / condition / passive"/><div className="mt-2 max-h-28 overflow-y-auto">{objects.map((o)=><label key={o.uuid} className="flex items-center gap-2 py-1 text-[9px] text-white/60"><input type="checkbox" checked={s.pieces.includes(o.uuid)} onChange={()=>toggleSetPiece(s.id,o.uuid)}/>{o.name||o.type}</label>)}</div></div>)}</section></div>}
        {tab === 'animation' && <div className="space-y-3"><section className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="text-xs font-semibold text-white">Animation Controls</div><label className="mt-2 block text-[9px] uppercase text-white/45">Root Motion<select value={animationConfig.rootMotion} onChange={(e)=>setAnimationConfig((c)=>({...c,rootMotion:e.target.value,snapToRoot:e.target.value==='in-place'}))} className="mt-1 h-8 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[10px] text-white"><option value="in-place">In Place / Snapped</option><option value="xy">Root Motion XY</option><option value="xyz">Root Motion XYZ</option></select></label><label className="mt-2 block text-[9px] uppercase text-white/45">Playback Rate <span className="float-right">{Number(animationConfig.playbackRate).toFixed(2)}x</span></label><Slider value={[animationConfig.playbackRate]} min={.1} max={3} step={.05} onValueChange={(v)=>setAnimationConfig((c)=>({...c,playbackRate:v[0]}))}/><div className="mt-2 grid grid-cols-2 gap-2"><Num label="Blend In" value={animationConfig.blendIn} onChange={(v)=>setAnimationConfig((c)=>({...c,blendIn:v}))}/><Num label="Blend Out" value={animationConfig.blendOut} onChange={(v)=>setAnimationConfig((c)=>({...c,blendOut:v}))}/></div><Toggle label="Snap To Root" value={animationConfig.snapToRoot} onChange={(v)=>setAnimationConfig((c)=>({...c,snapToRoot:v}))}/></section></div>}
        {tab === 'weather' && <div className="space-y-3"><section className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="text-xs font-semibold text-white">Existing World Environment</div><div className="mt-2 grid grid-cols-2 gap-2"><Num label="Time" value={weather.time} onChange={(v)=>setWeather((w)=>({...w,time:v}))}/><label className="text-[9px] uppercase text-white/45">Weather<select value={weather.weather} onChange={(e)=>{env?.setWeather?.(e.target.value);setWeather((w)=>({...w,weather:e.target.value}));}} className="mt-1 h-7 w-full rounded-lg border border-white/10 bg-black/30 px-1 text-[9px] text-white"><option>clear</option><option>cloudy</option><option>rain</option><option>snow</option><option>storm</option><option>fog</option></select></label><label className="text-[9px] uppercase text-white/45">Season<select value={weather.seasonId} onChange={(e)=>{env?.setSeason?.(e.target.value);setWeather((w)=>({...w,seasonId:e.target.value}));}} className="mt-1 h-7 w-full rounded-lg border border-white/10 bg-black/30 px-1 text-[9px] text-white"><option>spring</option><option>summer</option><option>autumn</option><option>winter</option></select></label><label className="text-[9px] uppercase text-white/45">Climate<select value={weather.climate} onChange={(e)=>{env?.setClimate?.(e.target.value);setWeather((w)=>({...w,climate:e.target.value}));}} className="mt-1 h-7 w-full rounded-lg border border-white/10 bg-black/30 px-1 text-[9px] text-white"><option>temperate</option><option>michigan</option><option>desert</option><option>tropical</option><option>arctic</option></select></label></div></section></div>}
      </div>
    </aside>
  </>;
}
