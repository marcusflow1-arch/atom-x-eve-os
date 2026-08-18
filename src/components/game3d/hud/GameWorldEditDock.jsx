import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { X, Mountain, Box, Sparkles, Swords, Film, UserRound, Camera, Layers3, Save, Sun, CloudRain, RotateCcw } from 'lucide-react';
import { getPlayerHUD, setPlayerHUD, subscribePlayerHUD } from '../playerHUDStore';

const TABS = [
  ['world', 'World', Mountain],
  ['models', 'Models', Box],
  ['physics', 'Physics', Layers3],
  ['effects', 'Effects', Sparkles],
  ['damage', 'Damage', Swords],
  ['animation', 'Animation', Film],
  ['stats', 'Stats', UserRound],
  ['camera', 'Camera', Camera],
];

const DAMAGE_TYPES = ['physical', 'fire', 'ice', 'electric', 'poison', 'arcane', 'holy', 'shadow'];
const DAMAGE_KEY = 'atomxe_editor_damage_profiles_v1';

function GlassSection({ title, children, right }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 shadow-lg backdrop-blur-2xl">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

export default function GameWorldEditDock({ onClose }) {
  const [tab, setTab] = useState('world');
  const [worldReady, setWorldReady] = useState(false);
  const [terrainName, setTerrainName] = useState('');
  const [brushSize, setBrushSize] = useState(2.5);
  const [brushStrength, setBrushStrength] = useState(0.35);
  const [terrainMode, setTerrainMode] = useState('raise');
  const [weather, setWeather] = useState('clear');
  const [season, setSeason] = useState('summer');
  const [worldTime, setWorldTime] = useState(8);
  const [player, setPlayer] = useState(() => getPlayerHUD());
  const [damageProfiles, setDamageProfiles] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DAMAGE_KEY)) || [{ name: 'Basic Attack', type: 'physical', amount: 50, multiplier: 1, defense: 0 }]; }
    catch { return [{ name: 'Basic Attack', type: 'physical', amount: 50, multiplier: 1, defense: 0 }]; }
  });
  const [environmentState, setEnvironmentState] = useState({});
  const [selectedObject, setSelectedObject] = useState(null);
  const [cameraState, setCameraState] = useState({ fov: 55, distance: 5 });
  const sculptRef = useRef({ dragging: false });
  const mixerRef = useRef(null);
  const selectedActionRef = useRef(null);

  useEffect(() => subscribePlayerHUD(setPlayer), []);

  const getScene = () => window.__gw3dScene || null;
  const getCamera = () => window.__gw3dCamera || null;
  const getEnv = () => window.__worldEnv || null;

  const terrainTargets = useMemo(() => {
    const scene = getScene();
    if (!scene) return [];
    const rows = [];
    scene.traverse((o) => {
      if (!o?.isMesh || !o.geometry?.attributes?.position) return;
      const name = String(o.name || '').toLowerCase();
      if (name === 'grid') return;
      if (name.includes('ground') || name.includes('terrain') || name.includes('grass') || name.includes('map')) rows.push(o);
    });
    return rows;
  }, [worldReady, tab]);

  const sceneObjects = useMemo(() => {
    const scene = getScene();
    if (!scene) return [];
    const rows = [];
    scene.traverse((o) => {
      if (o === scene || o.name === 'grid') return;
      if (o.isMesh || o.isGroup) rows.push(o);
    });
    return rows.slice(0, 150);
  }, [worldReady, tab, selectedObject]);

  useEffect(() => {
    setWorldReady(!!getScene());
    const t = setInterval(() => {
      const scene = getScene();
      const env = getEnv();
      if (scene) setWorldReady(true);
      if (terrainTargets.length && !terrainName) setTerrainName(terrainTargets[0].name);
      if (env?.getState) {
        const s = env.getState() || {};
        setEnvironmentState(s);
        if (typeof s.time === 'number') setWorldTime(s.time);
        if (s.currentWeather) setWeather(s.currentWeather);
      }
      const cam = getCamera();
      if (cam) setCameraState((prev) => ({ ...prev, fov: cam.fov, distance: cam.position.length() }));
    }, 600);
    return () => clearInterval(t);
  }, [terrainTargets.length, terrainName]);

  useEffect(() => {
    const save = () => localStorage.setItem(DAMAGE_KEY, JSON.stringify(damageProfiles));
    save();
  }, [damageProfiles]);

  const targetTerrain = () => {
    const scene = getScene();
    return scene?.getObjectByName(terrainName) || terrainTargets[0] || null;
  };

  useEffect(() => {
    if (tab !== 'world') return;
    const canvas = document.querySelector('canvas');
    const scene = getScene();
    const camera = getCamera();
    const terrain = targetTerrain();
    if (!canvas || !scene || !camera || !terrain) return;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointer = (event) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((event.clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(terrain, true)[0];
      if (!hit) return;
      const local = terrain.worldToLocal(hit.point.clone());
      const attr = terrain.geometry.attributes.position;
      const useX = Math.abs(local.x) > Math.abs(local.y);
      for (let i = 0; i < attr.count; i++) {
        const px = attr.getX(i);
        const py = attr.getY(i);
        const d = Math.hypot(px - local.x, py - local.y);
        if (d > brushSize) continue;
        const falloff = 1 - d / brushSize;
        const signed = terrainMode === 'lower' ? -1 : 1;
        attr.setZ(i, attr.getZ(i) + signed * brushStrength * falloff);
      }
      attr.needsUpdate = true;
      terrain.geometry.computeVertexNormals();
      terrain.geometry.computeBoundingSphere();
      // persist the fact that this scene was edited locally; geometry itself stays in the live world.
      localStorage.setItem('atomxe_world_edit_dirty', '1');
      void useX;
    };
    const down = (e) => { if (e.button === 0) sculptRef.current.dragging = true; onPointer(e); };
    const move = (e) => { if (sculptRef.current.dragging) onPointer(e); };
    const up = () => { sculptRef.current.dragging = false; };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [tab, terrainName, brushSize, brushStrength, terrainMode, worldReady]);

  const applyEnvironment = (patch) => {
    const env = getEnv();
    if (!env) return;
    if (patch.weather) { env.setWeather?.(patch.weather === 'auto' ? null : patch.weather); setWeather(patch.weather); }
    if (patch.season) { env.setSeason?.(patch.season); setSeason(patch.season); }
    if (typeof patch.time === 'number') { env.setTime?.(patch.time); setWorldTime(patch.time); }
  };

  const addArtemis = async () => {
    const scene = getScene();
    if (!scene) return;
    try {
      const gltf = await new GLTFLoader().loadAsync('/models/artemis.gltf');
      gltf.scene.position.set(0, 0, 0);
      gltf.scene.userData.editorAsset = true;
      scene.add(gltf.scene);
      setSelectedObject(gltf.scene.uuid);
    } catch (e) { console.error('[GameWorldEditDock] Artemis load failed', e); }
  };

  const addPrimitive = (type) => {
    const scene = getScene();
    if (!scene) return;
    let geometry = type === 'sphere' ? new THREE.SphereGeometry(0.5, 24, 24) : type === 'cylinder' ? new THREE.CylinderGeometry(0.5, 0.5, 1, 24) : new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, metalness: 0.2, roughness: 0.45 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0.5, 0);
    mesh.userData.editorAsset = true;
    scene.add(mesh);
    setSelectedObject(mesh.uuid);
  };

  const updatePlayer = (patch) => {
    setPlayerHUD(patch);
  };

  const stopAnimation = () => {
    selectedActionRef.current?.fadeOut?.(0.15);
    selectedActionRef.current = null;
  };

  const playObjectAnimation = (object) => {
    if (!object) return;
    let clips = object.animations || [];
    object.traverse?.((child) => { if (child.animations?.length) clips = child.animations; });
    if (!clips.length) return;
    if (!mixerRef.current || mixerRef.current.getRoot() !== object) mixerRef.current = new THREE.AnimationMixer(object);
    stopAnimation();
    const action = mixerRef.current.clipAction(clips[0]);
    action.reset().fadeIn(0.15).play();
    selectedActionRef.current = action;
  };

  const selected = sceneObjects.find((o) => o.uuid === selectedObject) || null;

  return (
    <div className="pointer-events-auto fixed inset-y-0 right-0 z-[120] w-[20vw] min-w-[320px] max-w-[480px] border-l border-white/10 bg-slate-950/78 shadow-2xl backdrop-blur-3xl">
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 px-3 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] uppercase tracking-[0.28em] text-orange-300/80">ATOM×EVE · LIVE WORLD</div>
              <div className="text-sm font-bold text-white">Edit Mode</div>
            </div>
            <button onClick={onClose} className="rounded-lg border border-white/10 p-1.5 text-white/45 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-2 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.03] px-2.5 py-2 text-[9px] leading-4 text-white/45">
            The center remains your existing Game Viewer world. Editing acts on the live Three.js scene instead of replacing it.
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-white/10 p-2" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={`shrink-0 rounded-lg border px-2 py-1.5 text-[9px] ${tab === id ? 'border-orange-400/30 bg-orange-400/10 text-orange-200' : 'border-white/10 bg-white/[0.02] text-white/45 hover:text-white/80'}`}>
              <Icon className="mr-1 inline-block h-3 w-3" />{label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          {tab === 'world' && (
            <>
              <GlassSection title="World Snapshot">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg bg-white/[0.03] p-2"><div className="text-white/35">Player</div><div className="font-semibold text-white">Lv {player.level}</div><div className="text-white/35">{player.xp} XP · {player.hp}/{player.maxHP} HP</div></div>
                  <div className="rounded-lg bg-white/[0.03] p-2"><div className="text-white/35">World</div><div className="font-semibold text-white">{worldReady ? 'Live' : 'Waiting'}</div><div className="text-white/35">{Object.keys(environmentState || {}).length ? 'Environment linked' : 'Environment pending'}</div></div>
                </div>
              </GlassSection>

              <GlassSection title="Existing Terrain">
                <select value={terrainName} onChange={(e) => setTerrainName(e.target.value)} className="mb-2 h-8 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[10px] text-white">
                  {terrainTargets.length ? terrainTargets.map((o) => <option key={o.uuid} value={o.name}>{o.name}</option>) : <option>No editable ground mesh detected</option>}
                </select>
                <div className="mb-2 flex gap-1"><button onClick={() => setTerrainMode('raise')} className={`rounded-lg px-2 py-1.5 text-[9px] ${terrainMode === 'raise' ? 'bg-emerald-400/15 text-emerald-200' : 'bg-white/5 text-white/45'}`}>Raise</button><button onClick={() => setTerrainMode('lower')} className={`rounded-lg px-2 py-1.5 text-[9px] ${terrainMode === 'lower' ? 'bg-rose-400/15 text-rose-200' : 'bg-white/5 text-white/45'}`}>Lower</button></div>
                <label className="block text-[9px] text-white/45">Brush Size <span className="float-right text-white/75">{brushSize.toFixed(1)}</span><input type="range" min="0.25" max="8" step="0.25" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="mt-1 w-full" /></label>
                <label className="mt-2 block text-[9px] text-white/45">Strength <span className="float-right text-white/75">{brushStrength.toFixed(2)}</span><input type="range" min="0.05" max="1" step="0.05" value={brushStrength} onChange={(e) => setBrushStrength(Number(e.target.value))} className="mt-1 w-full" /></label>
                <div className="mt-2 text-[9px] leading-4 text-white/35">Click-and-drag directly on the existing world terrain to sculpt it. The world stays visible while you edit.</div>
              </GlassSection>

              <GlassSection title="Sky / Weather">
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[9px] text-white/45">Time<input type="number" min="0" max="24" step="0.1" value={worldTime} onChange={(e) => applyEnvironment({ time: clamp(Number(e.target.value), 0, 24) })} className="mt-1 h-8 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[10px] text-white" /></label>
                  <label className="text-[9px] text-white/45">Season<select value={season} onChange={(e) => applyEnvironment({ season: e.target.value })} className="mt-1 h-8 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[10px] text-white"><option value="spring">Spring</option><option value="summer">Summer</option><option value="autumn">Autumn</option><option value="winter">Winter</option></select></label>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1">{['clear', 'cloudy', 'rain', 'snow', 'storm', 'fog', 'hail', 'auto'].map((w) => <button key={w} onClick={() => applyEnvironment({ weather: w })} className={`rounded-lg border px-1 py-1.5 text-[8px] ${weather === w ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/[0.02] text-white/45'}`}>{w}</button>)}</div>
                <div className="mt-2 flex items-center gap-2 text-[9px] text-white/35"><Sun className="h-3 w-3" />{environmentState?.currentWeather || weather} · {environmentState?.seasonLabel || season}</div>
              </GlassSection>
            </>
          )}

          {tab === 'models' && (
            <>
              <GlassSection title="World Assets"><div className="space-y-1.5">{sceneObjects.filter((o) => o.isMesh || o.isGroup).slice(0, 30).map((o) => <button key={o.uuid} onClick={() => setSelectedObject(o.uuid)} className={`w-full rounded-lg border px-2 py-1.5 text-left text-[9px] ${selectedObject === o.uuid ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/[0.02] text-white/55'}`}>{o.name || 'Unnamed object'}</button>)}</div></GlassSection>
              <GlassSection title="Add 3D Models"><div className="grid grid-cols-2 gap-2"><button onClick={addArtemis} className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left hover:bg-white/[0.07]"><div className="text-[10px] font-semibold text-white">Artemis</div><div className="text-[8px] text-white/35">GLTF</div></button><button onClick={() => addPrimitive('cube')} className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left hover:bg-white/[0.07]"><div className="text-[10px] font-semibold text-white">Cube</div><div className="text-[8px] text-white/35">Primitive</div></button><button onClick={() => addPrimitive('sphere')} className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left hover:bg-white/[0.07]"><div className="text-[10px] font-semibold text-white">Sphere</div><div className="text-[8px] text-white/35">Primitive</div></button><button onClick={() => addPrimitive('cylinder')} className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left hover:bg-white/[0.07]"><div className="text-[10px] font-semibold text-white">Cylinder</div><div className="text-[8px] text-white/35">Primitive</div></button></div></GlassSection>
            </>
          )}

          {tab === 'physics' && <GlassSection title="Selected Object Physics"><div className="text-[9px] text-white/40">Select an object in Models. Physics settings are stored on the selected Three.js object's userData so the edit survives within the current world session.</div>{selected && <pre className="mt-2 overflow-auto rounded-lg bg-black/30 p-2 text-[8px] text-white/45">{JSON.stringify(selected.userData?.physics || { body: 'dynamic', mass: 1, friction: 0.5, restitution: 0.2, gravity: 1 }, null, 2)}</pre>}</GlassSection>}

          {tab === 'effects' && <GlassSection title="Effect Anchor"><div className="text-[9px] leading-4 text-white/40">Select an object, then author an effect anchor on it. X/Y/Z, rotation, scale, playback speed and repeat stay with the selected object's editor data.</div>{selected && <button onClick={() => { selected.userData.effectAnchor = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, scale: 1, speed: 1, repeat: 1 }; setSelectedObject(selected.uuid); }} className="mt-2 w-full rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-2 py-2 text-[9px] text-cyan-100">Create precise effect anchor</button>}</GlassSection>}

          {tab === 'damage' && <GlassSection title="Damage Profiles" right={<button onClick={() => setDamageProfiles((p) => [...p, { name: `Damage ${p.length + 1}`, type: 'physical', amount: 25, multiplier: 1, defense: 0 }])} className="rounded-md bg-white/5 px-2 py-1 text-[9px] text-white/65">+ Add</button>}><div className="space-y-2">{damageProfiles.map((d, i) => <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-2"><input value={d.name} onChange={(e) => setDamageProfiles((p) => p.map((x, n) => n === i ? { ...x, name: e.target.value } : x))} className="mb-1 h-7 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[9px] text-white" /><div className="grid grid-cols-2 gap-1"><select value={d.type} onChange={(e) => setDamageProfiles((p) => p.map((x, n) => n === i ? { ...x, type: e.target.value } : x))} className="h-7 rounded-lg border border-white/10 bg-black/30 px-1 text-[9px] text-white">{DAMAGE_TYPES.map((t) => <option key={t}>{t}</option>)}</select><input type="number" value={d.amount} onChange={(e) => setDamageProfiles((p) => p.map((x, n) => n === i ? { ...x, amount: Number(e.target.value) } : x))} className="h-7 rounded-lg border border-white/10 bg-black/30 px-2 text-[9px] text-white" /></div><div className="mt-1 grid grid-cols-2 gap-1"><input type="number" step="0.05" value={d.multiplier} onChange={(e) => setDamageProfiles((p) => p.map((x, n) => n === i ? { ...x, multiplier: Number(e.target.value) } : x))} className="h-7 rounded-lg border border-white/10 bg-black/30 px-2 text-[9px] text-white" placeholder="Multiplier" /><input type="number" value={d.defense} onChange={(e) => setDamageProfiles((p) => p.map((x, n) => n === i ? { ...x, defense: Number(e.target.value) } : x))} className="h-7 rounded-lg border border-white/10 bg-black/30 px-2 text-[9px] text-white" placeholder="Defense" /></div></div>)}</div><button onClick={() => localStorage.setItem(DAMAGE_KEY, JSON.stringify(damageProfiles))} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] py-1.5 text-[9px] text-white/55"><Save className="h-3 w-3" />Save Damage Profiles</button></GlassSection>}

          {tab === 'animation' && <GlassSection title="Animation / Montage"><div className="text-[9px] leading-4 text-white/40">Select an animated model in the world. The editor can play its first clip and keeps montage metadata on the object.</div>{selected && <><button onClick={() => playObjectAnimation(selected)} className="mt-2 w-full rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-2 py-2 text-[9px] text-cyan-100">Play first animation</button><button onClick={stopAnimation} className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-[9px] text-white/55">Stop animation</button></>}</GlassSection>}

          {tab === 'stats' && <GlassSection title="Live Character Save"><div className="grid grid-cols-2 gap-2">{[['level','Level'],['xp','XP'],['hp','HP'],['maxHP','Max HP'],['unspentPoints','Stat Points']].map(([key,label]) => <label key={key} className="text-[9px] text-white/45">{label}<input type="number" value={player[key] ?? 0} onChange={(e) => updatePlayer({ [key]: Number(e.target.value) })} className="mt-1 h-8 w-full rounded-lg border border-white/10 bg-black/30 px-2 text-[10px] text-white" /></label>)}</div><div className="mt-2 rounded-lg bg-white/[0.03] p-2 text-[9px] text-white/40">These values feed the existing player progression store, which already persists level, XP, HP and base stats to the character save.</div></GlassSection>}

          {tab === 'camera' && <GlassSection title="Live Camera"><label className="text-[9px] text-white/45">FOV <span className="float-right text-white/70">{cameraState.fov.toFixed(0)}</span><input type="range" min="35" max="100" value={cameraState.fov} onChange={(e) => { const c = getCamera(); const f = Number(e.target.value); if (c) { c.fov = f; c.updateProjectionMatrix(); } setCameraState((s) => ({ ...s, fov: f })); }} className="mt-1 w-full" /></label><div className="mt-3 text-[9px] text-white/40">The camera remains live inside the existing Game Viewer.</div></GlassSection>}
        </div>

        <div className="border-t border-white/10 px-3 py-2 text-[8px] text-white/25">LIVE WORLD EDITOR · changes act on the current Three.js scene</div>
      </div>
    </div>
  );
}
