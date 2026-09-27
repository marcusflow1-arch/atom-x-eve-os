import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Flag, Play, X } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { applyCompanionAppearance, COMPANION_MOTIONS } from '@/components/onboarding/genesisAssets';
import { retargetAvatarClip } from '@/components/onboarding/retargetAvatarClip';
import { GetsugaDashboardRuntime } from '@/components/getsuga/GetsugaDashboardRuntime';
import { ArtemisDashboardRuntime } from '@/components/artemis/ArtemisDashboardRuntime';
import OverheadFighterBar from '@/components/battle/OverheadFighterBar';
import arenaRenderer, { disposeArenaObjects } from '@/components/battle/arenaRenderer';
import ArenaGraphicsRecovery from '@/components/battle/ArenaGraphicsRecovery';
import { boxFor, COURT, FACING_SPEED, INTERPOLATION_DELAY_MS, NETWORK_SEND_MS, RUN_SPEED, SPAWN_Z, WALK_SPEED } from './arenaConfig';

const lerpAngle = (a, b, maxStep) => {
  let delta = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return a + THREE.MathUtils.clamp(delta, -maxStep, maxStep);
};
const clampPos = (pos, box) => ({ x: THREE.MathUtils.clamp(pos.x, box.minX, box.maxX), z: THREE.MathUtils.clamp(pos.z, box.minZ, box.maxZ) });
const serverAtb = (row, offset = 0) => {
  if (!row) return 50;
  if (typeof row.turn === 'boolean') return Math.min(100, Math.max(0, Number(row.value || 0)));
  const at = Date.parse(row.at || 0) || Date.now();
  return Math.min(100, Math.max(0, Number(row.value || 0) + ((Date.now() + offset - at) / 1000) * 25));
};
const effectFromSkill = (skill) => skill?.animation_effect || { id: skill?.effect_id || '', clip_name: skill?.clip_name || '', duration_ms: skill?.duration_ms || 0, cooldown_ms: skill?.cooldown_ms || 0, mode: 'embedded' };
const normalizedName = (v = '') => String(v).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

let movementCatalogPromise = null;
async function movementCatalog() {
  if (!movementCatalogPromise) movementCatalogPromise = base44.entities.AnimationFBX.list('name', 300).catch(() => []);
  return movementCatalogPromise;
}
function pickMotion(rows, phrases, fallback) {
  const wanted = phrases.map(normalizedName);
  const row = (rows || []).find((item) => wanted.some((needle) => normalizedName(`${item.name || ''} ${item.tags || ''}`).includes(needle)));
  return row?.file_url || fallback;
}

function courtLine(scene, x1, z1, x2, z2, color = 0xd7f7ff, opacity = .62) {
  const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, .015, z1), new THREE.Vector3(x2, .015, z2)]);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const line = new THREE.Line(geometry, material); scene.add(line); return line;
}
function findHead(root) {
  let head = null;
  root?.traverse?.((node) => { if (!head && node.isBone && /head/i.test(node.name || '')) head = node; });
  return head;
}
function scaleToHeight(root, height = 1.8) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root); const size = box.getSize(new THREE.Vector3());
  if (size.y > 0) root.scale.multiplyScalar(height / size.y);
  root.updateMatrixWorld(true);
  const next = new THREE.Box3().setFromObject(root);
  root.position.y -= next.min.y;
}

function spawnBasicSlash(scene, camera, targetRoot) {
  if (!scene || !camera || !targetRoot) return;
  targetRoot.updateMatrixWorld?.(true);
  const target = new THREE.Vector3();
  targetRoot.getWorldPosition(target);
  target.y += 1.05;

  const group = new THREE.Group();
  group.position.copy(target);
  group.quaternion.copy(camera.quaternion);
  group.scale.setScalar(0.72);

  const materials = [];
  const slashes = [
    { y: 0.22, rotation: -0.72, length: 1.65 },
    { y: 0.00, rotation: -0.58, length: 1.9 },
    { y: -0.22, rotation: -0.44, length: 1.55 },
  ];
  for (const slash of slashes) {
    const material = new THREE.MeshBasicMaterial({
      color: 0xcff8ff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(slash.length, 0.045), material);
    mesh.position.y = slash.y;
    mesh.rotation.z = slash.rotation;
    group.add(mesh);
    materials.push(material);
  }

  const flashMaterial = new THREE.MeshBasicMaterial({
    color: 0x6deaff,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const flash = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), flashMaterial);
  flash.position.z = -0.01;
  group.add(flash);
  materials.push(flashMaterial);
  scene.add(group);

  const started = performance.now();
  const duration = 380;
  const animateSlash = (now) => {
    const t = Math.min(1, (now - started) / duration);
    group.scale.setScalar(0.72 + t * 0.55);
    group.position.y = target.y + t * 0.08;
    materials.forEach((material, index) => {
      material.opacity = (index === materials.length - 1 ? 0.34 : 0.95) * (1 - t);
    });
    if (t < 1) {
      requestAnimationFrame(animateSlash);
      return;
    }
    scene.remove(group);
    group.traverse((node) => {
      node.geometry?.dispose?.();
      node.material?.dispose?.();
    });
  };
  requestAnimationFrame(animateSlash);
}

async function loadFighter({ scene, camera, player, side, onEffect }) {
  const gltf = await new GLTFLoader().loadAsync(player.model_url || player.appearance?.model_url);
  const assetRoot = gltf.scene;
  scaleToHeight(assetRoot, 1.8 * Number(player.appearance?.height_scale || 1));
  applyCompanionAppearance(assetRoot, player.appearance || { gender: player.gender });
  assetRoot.traverse((node) => { if (node.isSkinnedMesh) node.frustumCulled = false; });

  const female = player.gender === 'female' || player.appearance?.gender === 'female';
  let runtime, root;
  if (female) {
    scene.add(assetRoot);
    const mixer = new THREE.AnimationMixer(assetRoot);
    runtime = new ArtemisDashboardRuntime({ root: assetRoot, mixer, animations: gltf.animations || [], onEvent: onEffect, relaxAfter: 6 });
    root = assetRoot;
  } else {
    runtime = new GetsugaDashboardRuntime({ scene, camera, onEvent: onEffect });
    runtime.attach(gltf);
    root = runtime.group;
  }

  const spawnZ = side === 'host' ? SPAWN_Z : -SPAWN_Z;
  root.position.x = 0; root.position.z = spawnZ;

  const rows = await movementCatalog();
  const fallbackRun = COMPANION_MOTIONS[3]?.url;
  const fallbackWalk = COMPANION_MOTIONS[2]?.url || fallbackRun;
  const urls = {
    run_forward: pickMotion(rows, ['standing run forward','run forward','running'], fallbackRun),
    run_back: pickMotion(rows, ['standing run back','running backward','run back'], fallbackRun),
    run_left: pickMotion(rows, ['standing run left','run left'], fallbackRun),
    run_right: pickMotion(rows, ['standing run right','run right'], fallbackRun),
    walk_forward: pickMotion(rows, ['standing walk forward','walk forward'], fallbackWalk),
    walk_back: pickMotion(rows, ['standing walk back','walk back'], fallbackWalk),
    walk_left: pickMotion(rows, ['standing walk left','walk left'], fallbackWalk),
    walk_right: pickMotion(rows, ['standing walk right','walk right'], fallbackWalk),
  };
  const fbx = new FBXLoader();
  await Promise.all(Object.entries(urls).map(async ([key, url]) => {
    if (!url) return;
    try {
      const source = await fbx.loadAsync(url); const clip = source.animations?.[0]; if (!clip) return;
      const target = female ? assetRoot : runtime.root;
      const retargeted = retargetAvatarClip(source, target, clip);
      runtime.setLocomotionClip?.(key, retargeted);
    } catch (error) { console.warn('[PvP] locomotion clip failed', key, error); }
  }));

  return { player, side, female, root, model: assetRoot, runtime, head: findHead(assetRoot), position: new THREE.Vector3(0,0,spawnZ), yaw: side === 'host' ? Math.PI : 0, loaded: true, lastMoveKey: '' };
}

export default function PvPArenaStage({ match, serverOffsetMs = 0 }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const mountRef = useRef(null);
  const runtimes = useRef({ local: null, opponent: null });
  const positions = useRef({ local: new THREE.Vector3(), opponent: new THREE.Vector3() });
  const remoteSamples = useRef([]);
  const held = useRef(new Set());
  const seq = useRef(0);
  const lastNetworkSend = useRef(0);
  const [loaded, setLoaded] = useState(0);
  const [graphicsError, setGraphicsError] = useState(false);
  const [graphicsAttempt, setGraphicsAttempt] = useState(0);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [lastCastSlot, setLastCastSlot] = useState({ local: null, opponent: null });
  const lastCastSlotRef = useRef(lastCastSlot);
  const [error, setError] = useState('');
  const [resultCountdown, setResultCountdown] = useState(3);
  const [escapeMenuOpen, setEscapeMenuOpen] = useState(false);
  const [surrenderConfirm, setSurrenderConfirm] = useState(false);
  const [surrendering, setSurrendering] = useState(false);
  const returningRef = useRef(false);
  const arenaVisualRef = useRef({ scene: null, camera: null });
  const matchRef = useRef(match);
  const serverOffsetRef = useRef(serverOffsetMs);
  const requestSkillRef = useRef(null);
  const requestMeleeRef = useRef(null);

  matchRef.current = match;
  serverOffsetRef.current = serverOffsetMs;
  lastCastSlotRef.current = lastCastSlot;

  const local = useMemo(() => (match?.players || []).find((p) => String(p.id || p.player_id) === String(user?.id)), [match?.players, user?.id]);
  const opponent = useMemo(() => (match?.players || []).find((p) => String(p.id || p.player_id) !== String(user?.id)), [match?.players, user?.id]);
  const localRef = useRef(local);
  const opponentRef = useRef(opponent);
  localRef.current = local;
  opponentRef.current = opponent;
  const localSide = String(user?.id) === String(match?.host_id) ? 'host' : 'guest';
  const opponentSide = localSide === 'host' ? 'guest' : 'host';
  const reconnectPaused = Object.keys(match?.disconnects || {}).length > 0;
  const active = match?.status === 'fighting' && !reconnectPaused && Date.now() + serverOffsetMs >= Date.parse(match?.fight_starts_at || 0);
  const turnPlayerId = String(match?.turn_player_id || match?.host_id || '');
  const localOwnsTurn = turnPlayerId === String(user?.id);
  const isMyTurn = active && localOwnsTurn;
  const ended = match?.status === 'ended';
  const won = ended && String(match.winner_id) === String(user?.id);

  const invoke = async (action, data) => {
    try {
      const response = await base44.functions.invoke('aiBattleMatchmaker', { action, data });
      const body = response?.data ?? response ?? {};
      if (body?.error) { const e = new Error(body.error); e.status = response?.status || 409; throw e; }
      if (Object.prototype.hasOwnProperty.call(body, 'match')) queryClient.setQueryData(['ai-battle-matchmaking', user?.id], (prev = {}) => ({ ...prev, match: body.match || null, queue: Object.prototype.hasOwnProperty.call(body, 'queue') ? body.queue : prev.queue, server_time: body.server_time || prev.server_time }));
      return body;
    } catch (error) {
      const body = error?.response?.data?.data ?? error?.response?.data ?? error?.body ?? null;
      const next = new Error(body?.error || body?.message || error?.message || 'PvP request failed.');
      next.status = error?.response?.status || error?.status || 500;
      throw next;
    }
  };

  const returnToDashboard = useCallback(async () => {
    if (returningRef.current) return;
    returningRef.current = true;
    setResultCountdown(0);
    try {
      await base44.functions.invoke('aiBattleMatchmaker', { action: 'reset', data: { match_id: matchRef.current?.id || '' } });
    } catch (e) {
      console.warn('[PvP] result cleanup failed; clearing local match state anyway', e);
    }
    queryClient.setQueryData(['ai-battle-matchmaking', user?.id], (prev = {}) => ({ ...prev, queue: null, match: null, server_time: Date.now() }));
    delete window.__lunaPvPMatch;
    delete window.__lunaPvPPosition;
    window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', { detail: { channelId: `dashboard_${user.id}`, hostId: user.id, hostName: 'My' } }));
    window.dispatchEvent(new CustomEvent('lunaPvPExited'));
  }, [queryClient, user?.id]);

  const playSkill = (fighter, skill, targetId, facingYaw, detail = {}) => {
    if (!fighter?.runtime || !skill) return false;
    const effect = effectFromSkill(skill);
    const target = { type: 'player', playerId: String(targetId), facingYaw, autoLock: true, autoHit: true, damage: Number(detail?.damage || 0) };

    // PvP has exactly one authoritative target: the opposing fighter. Snap the
    // battle wrapper to that target BEFORE starting the authored clip, then give
    // the runtime the same locked yaw/target so neither animation nor VFX can
    // begin pointed at an old movement direction.
    fighter.yaw = facingYaw;
    fighter.runtime.lockedFacingYaw = facingYaw;
    fighter.runtime.activeTarget = target;
    if (fighter.root) fighter.root.rotation.y = facingYaw;

    if (fighter.female) return fighter.runtime.playEffect(effect, { ...detail, effect, card: skill, target });
    if (String(effect.id || '') === 'getsuga_tensho') return fighter.runtime.play(target);
    return false;
  };

  const requestSkill = async (slot) => {
    if (!active) { setError('The fight is not ready yet.'); return false; }
    if (!isMyTurn) { setError("Wait for your turn."); return false; }
    if (escapeMenuOpen || surrendering) return false;
    const skill = (local?.skills || []).find((s) => Number(s.slot) === Number(slot));
    if (!skill) { setError('That skill is not equipped.'); return false; }
    const atb = serverAtb(match.atb?.[user.id], serverOffsetMs);
    const cooldownEnd = Date.parse(match.cooldowns?.[user.id]?.[String(slot)] || 0);
    if (cooldownEnd > Date.now() + serverOffsetMs) { setError('On cooldown.'); return false; }
    if (atb < Number(skill.atb_cost || 0)) { setError('Not enough ATB.'); return false; }
    const a = positions.current.local, b = positions.current.opponent;
    if (a.distanceTo(b) > Number(skill.range_m || 3) + 1.5) { setError('Out of range.'); return false; }
    setError('');
    const castId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const facingYaw = Math.atan2(b.x - a.x, b.z - a.z);
    try {
      const body = await invoke('use_skill', { match_id: match.id, slot: Number(slot), cast_id: castId, attacker_pos: { x: a.x, z: a.z }, target_pos: { x: b.x, z: b.z } });
      const cast = body.cast || {};
      const visualStarted = playSkill(runtimes.current.local, skill, opponent?.id, facingYaw, { castId, damage: cast.damage });
      setLastCastSlot((s) => ({ ...s, local: Number(slot) }));
      if (!visualStarted) console.warn('[PvP] skill accepted by server but local animation runtime did not start', skill?.effect_id || skill?.name);
      window.dispatchEvent(new CustomEvent('multiplayerLocalAction', { detail: { kind: 'pvp_cast', matchId: match.id, cast_id: cast.cast_id || castId, slot: Number(slot), effect_id: skill.effect_id || '', effect: effectFromSkill(skill), resolves_at: cast.resolves_at, damage: cast.damage, crit: cast.crit, targetPlayerId: opponent?.id } }));
      return true;
    } catch (e) { setError(e.message || 'Skill rejected.'); runtimes.current.local?.runtime?.playIdle?.(); return false; }
  };

  requestSkillRef.current = requestSkill;

  const requestMelee = async () => {
    if (!active) { setError('The fight is not ready yet.'); return false; }
    if (!isMyTurn) { setError('Wait for your turn.'); return false; }
    if (escapeMenuOpen || surrendering) return false;
    const a = positions.current.local, b = positions.current.opponent;
    const currentAtb = serverAtb(match.atb?.[user.id], serverOffsetMs);
    if (currentAtb < 50) { setError('Not enough ATB for a melee attack.'); return false; }
    const cooldownEnd = Date.parse(match.cooldowns?.[user.id]?._melee || 0);
    if (cooldownEnd > Date.now() + serverOffsetMs) { setError('Melee attack is recovering.'); return false; }
    setError('');
    const castId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    try {
      const body = await invoke('basic_attack', { match_id: match.id, cast_id: castId, attacker_pos: { x: a.x, z: a.z }, target_pos: { x: b.x, z: b.z } });
      const cast = body.cast || {};
      spawnBasicSlash(arenaVisualRef.current.scene, arenaVisualRef.current.camera, runtimes.current.opponent?.root);
      window.dispatchEvent(new CustomEvent('multiplayerLocalAction', { detail: { kind: 'pvp_melee', matchId: match.id, cast_id: cast.cast_id || castId, effect_id: 'basic_melee', resolves_at: cast.resolves_at, damage: cast.damage, crit: cast.crit, targetPlayerId: opponent?.id, lock_on: true } }));
      return true;
    } catch (e) {
      setError(e?.message || 'Melee attack rejected.');
      return false;
    }
  };

  requestMeleeRef.current = requestMelee;

  // A PvP client is ready only after both fighters/models are present in its
  // arena. While the server still reports `matched`, keep reaffirming readiness
  // so a dropped/raced ready request cannot strand two visible players before
  // the countdown. The server starts only after BOTH clients are live + ready.
  useEffect(() => {
    if (graphicsError || loaded !== 2 || !match?.id || match.status !== 'matched') return undefined;
    let cancelled = false;
    let busy = false;
    const reportReady = async () => {
      if (cancelled || busy || matchRef.current?.status !== 'matched') return;
      busy = true;
      try {
        await invoke('ready', { match_id: match.id });
      } catch (readyError) {
        console.warn('[PvP] fighter-ready retry', readyError);
        queryClient.invalidateQueries({ queryKey: ['ai-battle-matchmaking', user?.id] });
      } finally {
        busy = false;
      }
    };
    reportReady();
    const timer = window.setInterval(reportReady, 1000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [loaded, graphicsError, match?.id, match?.status, queryClient, user?.id]);

  const requestDodge = async () => {
    if (!active) { setError('The fight is not ready yet.'); return; }
    if (!isMyTurn) { setError('Wait for your turn.'); return; }
    if (escapeMenuOpen || surrendering) return;
    try {
      await invoke('dodge', { match_id: match.id });
      window.dispatchEvent(new CustomEvent('multiplayerLocalAction', { detail: { kind: 'pvp_dodge', matchId: match.id } }));
    } catch (e) { setError(e.message || 'Dodge rejected.'); }
  };

  useEffect(() => {
    if (!match?.id || !local || !opponent || !mountRef.current) return undefined;
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07101b, .025);
    const camera = new THREE.PerspectiveCamera(50, 1, .05, 100);
    arenaVisualRef.current = { scene, camera };
    setLoaded(0);
    setGraphicsError(false);
    const renderer = arenaRenderer();
    if (!renderer) { setGraphicsError(true); return undefined; }
    let contextLost = false;
    const onContextLost = (event) => {
      event.preventDefault();
      contextLost = true;
      held.current.clear();
      setGraphicsError(true);
    };
    const onContextRestored = () => {
      contextLost = false;
      setGraphicsError(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.shadowMap.enabled = true;
    renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%'; mount.appendChild(renderer.domElement);
    const cssRenderer = new CSS2DRenderer(); cssRenderer.domElement.style.position = 'absolute'; cssRenderer.domElement.style.inset = '0'; cssRenderer.domElement.style.pointerEvents = 'auto'; mount.appendChild(cssRenderer.domElement);

    scene.add(new THREE.HemisphereLight(0xd7ecff, 0x111827, 2.3));
    const sun = new THREE.DirectionalLight(0xffffff, 3.1); sun.position.set(5, 9, 4); sun.castShadow = true; scene.add(sun);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(COURT.halfWidth * 2, COURT.halfLength * 2), new THREE.MeshStandardMaterial({ color: 0x101a27, roughness: .88, metalness: .08, transparent: true, opacity: .94 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    courtLine(scene,-6,-8,6,-8);courtLine(scene,6,-8,6,8);courtLine(scene,6,8,-6,8);courtLine(scene,-6,8,-6,-8);courtLine(scene,-6,0,6,0,0x5de8ff,.95);
    courtLine(scene,-5.5,1,5.5,1,0x5de8ff,.18);courtLine(scene,-5.5,7.5,5.5,7.5,0x5de8ff,.18);courtLine(scene,-5.5,-1,5.5,-1,0xff7799,.18);courtLine(scene,-5.5,-7.5,5.5,-7.5,0xff7799,.18);

    let disposed = false, frame = 0, previous = performance.now(), shoulder = 1, cameraDistance = 6.2;
    const barRoots = [];
    const barObjects = [];
    const addBar = (fighter, isLocal) => {
      const div = document.createElement('div'); div.style.pointerEvents = isLocal ? 'auto' : 'none';
      const root = createRoot(div); barRoots.push(root);
      const object = new CSS2DObject(div); object.position.set(0,.35,0); (fighter.head || fighter.model || fighter.root).add(object); barObjects.push({ root, object, fighter, isLocal });
    };

    Promise.all([
      loadFighter({ scene, camera, player: local, side: localSide, onEffect: () => {} }),
      loadFighter({ scene, camera, player: opponent, side: opponentSide, onEffect: () => {} }),
    ].map((pending) => pending.then((fighter) => {
      if (disposed) { fighter.runtime.dispose?.(); disposeArenaObjects(fighter.root); fighter.root.removeFromParent(); }
      return fighter;
    }))).then(([localFighter, opponentFighter]) => {
      if (disposed) return;
      runtimes.current = { local: localFighter, opponent: opponentFighter };
      positions.current.local.set(0,0,localSide === 'host' ? SPAWN_Z : -SPAWN_Z);
      positions.current.opponent.set(0,0,opponentSide === 'host' ? SPAWN_Z : -SPAWN_Z);
      addBar(localFighter,true); addBar(opponentFighter,false); setLoaded(2);
    }).catch((e) => { if (!disposed) { console.error('[PvP arena] fighter load failed',e); setError('A fighter could not load.'); } });

    const resize = () => { const w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight);renderer.setSize(w,h,false);cssRenderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix(); }; resize();
    const observer = new ResizeObserver(resize); observer.observe(mount);

    const remoteMove = (event) => {
      const d=event.detail||{}; if(d.kind!=='pvp_move'||String(d.matchId||'')!==String(match.id)||String(d.player_id||d.sourcePlayerId||'')===String(user.id))return;
      const last=remoteSamples.current.at(-1); if(last&&Number(d.seq)<=Number(last.seq))return; remoteSamples.current.push({...d,receivedAt:Date.now()}); if(remoteSamples.current.length>90)remoteSamples.current.splice(0,remoteSamples.current.length-90);
    };
    const remoteCast = (event) => {
      const d=event.detail||{}; const currentMatch=matchRef.current; const currentOpponent=opponentRef.current;
      if(String(d.matchId||'')!==String(currentMatch?.id||'')||String(d.sourcePlayerId||d.player_id||'')!==String(currentOpponent?.id||''))return;
      if (String(d.kind || '') === 'pvp_melee' || String(d.effect_id || '') === 'basic_melee') {
        spawnBasicSlash(arenaVisualRef.current.scene, arenaVisualRef.current.camera, runtimes.current.local?.root);
        return;
      }
      const skill=(currentOpponent?.skills||[]).find((s)=>Number(s.slot)===Number(d.slot)) || (currentOpponent?.skills||[]).find((s)=>String(s.effect_id)===String(d.effect_id)); if(!skill)return;
      const a=positions.current.opponent,b=positions.current.local; playSkill(runtimes.current.opponent,skill,user.id,Math.atan2(b.x-a.x,b.z-a.z),d); setLastCastSlot((s)=>({...s,opponent:Number(skill.slot)}));
    };
    window.addEventListener('webrtcMovementUpdate',remoteMove); window.addEventListener('lunaAIBattleRemoteCardCast',remoteCast);

    const renderBars = () => {
      const currentMatch=matchRef.current; const currentLocal=localRef.current; const currentOpponent=opponentRef.current; const offset=serverOffsetRef.current;
      for(const entry of barObjects){
        const p=entry.isLocal?currentLocal:currentOpponent; if(!p)continue; const id=String(p.id); const cooldowns=currentMatch?.cooldowns?.[id]||{};
        const skills=(p.skills||[]).map((skill)=>({...skill,cooldownEndsAt:cooldowns[String(skill.slot)]||null,cooldownMs:skill.cooldown_ms,atbCost:skill.atb_cost}));
        const castSlot=lastCastSlotRef.current;
        const combatActive=currentMatch?.status==='fighting' && Object.keys(currentMatch?.disconnects || {}).length===0 && Date.now()+offset>=Date.parse(currentMatch?.fight_starts_at||0);
        const fighterTurn=String(currentMatch?.turn_player_id || currentMatch?.host_id || '')===id;
        entry.root.render(<OverheadFighterBar name={p.name} hp={p.hp} maxHp={p.max_hp} atb={serverAtb(currentMatch?.atb?.[id],offset)} skills={skills} local={entry.isLocal} combatActive={combatActive} isTurn={fighterTurn} serverOffsetMs={offset} lastCastSlot={entry.isLocal?castSlot.local:castSlot.opponent} meleeCooldownEndsAt={cooldowns._melee||null} meleeCooldownMs={1000} meleeAtbCost={50} onMelee={entry.isLocal?(()=>requestMeleeRef.current?.()):undefined} onSkill={entry.isLocal?((slot)=>requestSkillRef.current?.(slot)):undefined}/>);
      }
    };
    const barTimer=window.setInterval(renderBars,100); renderBars();

    const animate = (now) => {
      if (disposed) return;
      frame=requestAnimationFrame(animate); const dt=Math.min(.05,Math.max(0,(now-previous)/1000)); previous=now;
      if (contextLost || renderer.getContext().isContextLost()) return;
      const lf=runtimes.current.local,of=runtimes.current.opponent;
      if(lf&&of){
        const currentMatch=matchRef.current; const offset=serverOffsetRef.current; const currentOpponent=opponentRef.current;
        const lp=positions.current.local,op=positions.current.opponent;
        const canMove=currentMatch?.status==='fighting' && Object.keys(currentMatch?.disconnects || {}).length===0 && Date.now()+offset>=Date.parse(currentMatch?.fight_starts_at||0);
        let dx=0,dz=0; if(canMove){dx=Number(held.current.has('KeyD'))-Number(held.current.has('KeyA')); const toward=localSide==='host'?-1:1; dz=(Number(held.current.has('KeyW'))-Number(held.current.has('KeyS')))*toward; const len=Math.hypot(dx,dz);if(len){dx/=len;dz/=len;const walking=held.current.has('ShiftLeft')||held.current.has('ShiftRight');const speed=walking?WALK_SPEED:RUN_SPEED;const box=boxFor(localSide);const next=clampPos({x:lp.x+dx*speed*dt,z:lp.z+dz*speed*dt},box);lp.x=next.x;lp.z=next.z;const forwardX=Math.sin(lf.yaw),forwardZ=Math.cos(lf.yaw);const rightX=forwardZ,rightZ=-forwardX;const f=dx*forwardX+dz*forwardZ,r=dx*rightX+dz*rightZ;const dir=Math.abs(r)>Math.abs(f)?(r>0?'right':'left'):(f>=0?'forward':'back');lf.runtime.playLocomotion?.(`${walking?'walk':'run'}_${dir}`);}else lf.runtime.playIdle?.();}
        const renderTime=Date.now()+offset-INTERPOLATION_DELAY_MS; const samples=remoteSamples.current; if(samples.length){let a=samples[0],b=samples[samples.length-1];for(let i=0;i<samples.length-1;i++){if(Number(samples[i].t)<=renderTime&&Number(samples[i+1].t)>=renderTime){a=samples[i];b=samples[i+1];break;}}const span=Math.max(1,Number(b.t)-Number(a.t));const t=THREE.MathUtils.clamp((renderTime-Number(a.t))/span,0,1);const box=boxFor(opponentSide);const p=clampPos({x:THREE.MathUtils.lerp(Number(a.x),Number(b.x),t),z:THREE.MathUtils.lerp(Number(a.z),Number(b.z),t)},box);op.x=p.x;op.z=p.z;if(Date.now()-Number(b.receivedAt||0)>500)of.runtime.playIdle?.();else of.runtime.playLocomotion?.(`${b.running?'run':'walk'}_${b.anim||'forward'}`);}else{const stored=currentMatch?.positions?.[currentOpponent?.id];if(stored){op.x=Number(stored.x||op.x);op.z=Number(stored.z||op.z);}}
        lf.yaw=lerpAngle(lf.yaw,Math.atan2(op.x-lp.x,op.z-lp.z),FACING_SPEED*dt);of.yaw=lerpAngle(of.yaw,Math.atan2(lp.x-op.x,lp.z-op.z),FACING_SPEED*dt);
        lf.root.position.x=lp.x;lf.root.position.z=lp.z;if(!lf.runtime.isPlaying?.())lf.root.rotation.y=lf.yaw;of.root.position.x=op.x;of.root.position.z=op.z;if(!of.runtime.isPlaying?.())of.root.rotation.y=of.yaw;
        lf.runtime.update?.(dt);of.runtime.update?.(dt);
        window.__lunaPvPPosition={x:lp.x,z:lp.z};
        if(now-lastNetworkSend.current>=NETWORK_SEND_MS){lastNetworkSend.current=now;let anim='forward';if(Math.abs(dx)>Math.abs(dz))anim=dx>0?'right':'left';else if(dz)anim=((dz*(localSide==='host'?-1:1))>0)?'forward':'back';window.webrtcBroadcast?.({type:'movement',payload:{kind:'pvp_move',matchId:currentMatch?.id,seq:++seq.current,x:lp.x,z:lp.z,yaw:lf.yaw,anim,running:!held.current.has('ShiftLeft')&&!held.current.has('ShiftRight'),t:Date.now()+offset}});}
        if(currentMatch?.status==='ended'){
          of.root.visible=false;
          lf.runtime.playIdle?.();
          const portraitZ=lp.z+(localSide==='host'?4.8:-4.8);
          const desired=new THREE.Vector3(lp.x,1.75,portraitZ);
          const faceYaw=Math.atan2(desired.x-lp.x,desired.z-lp.z);
          lf.yaw=lerpAngle(lf.yaw,faceYaw,FACING_SPEED*dt*1.5);
          if(!lf.runtime.isPlaying?.())lf.root.rotation.y=lf.yaw;
          camera.position.lerp(desired,1-Math.exp(-7*dt));
          camera.lookAt(new THREE.Vector3(lp.x,1.05,lp.z));
        }else{
          of.root.visible=true;
          const away=new THREE.Vector3(lp.x-op.x,0,lp.z-op.z).normalize();const sideVec=new THREE.Vector3(-away.z,0,away.x);const targetShoulder=Math.abs(lp.x)>2?(lp.x>0?-1:1):shoulder;shoulder=THREE.MathUtils.lerp(shoulder,targetShoulder,1-Math.exp(-dt/0.4));const separation=lp.distanceTo(op);cameraDistance=THREE.MathUtils.lerp(cameraDistance,Math.min(9,Math.max(6.2,6.2+(separation-10)*.25)),1-Math.exp(-4*dt));const desired=new THREE.Vector3(lp.x,2.4,lp.z).addScaledVector(away,cameraDistance).addScaledVector(sideVec,2*shoulder);const look=new THREE.Vector3().lerpVectors(lp,op,.6);look.y=1.1;const factor=1-Math.exp(-6*dt);camera.position.lerp(desired,factor);camera.lookAt(look);
        }
      }
      renderer.render(scene,camera);cssRenderer.render(scene,camera);
    }; frame=requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.clearInterval(barTimer);
      window.removeEventListener('webrtcMovementUpdate', remoteMove);
      window.removeEventListener('lunaAIBattleRemoteCardCast', remoteCast);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      barObjects.forEach(({ object }) => object.removeFromParent());
      queueMicrotask(() => barRoots.forEach((root) => root.unmount()));
      disposeArenaObjects(scene);
      runtimes.current.local?.runtime?.dispose?.();
      runtimes.current.opponent?.runtime?.dispose?.();
      runtimes.current = { local: null, opponent: null };
      remoteSamples.current = [];
      held.current.clear();
      if (arenaVisualRef.current.scene === scene) arenaVisualRef.current = { scene: null, camera: null };
      renderer.dispose();
      renderer.forceContextLoss();
      cssRenderer.domElement.remove();
      renderer.domElement.remove();
      delete window.__lunaPvPPosition;
    };
  // Arena is recreated only for a new match; live match state is read by refs/cache overlays.
  }, [match?.id, local?.id, opponent?.id, graphicsAttempt]);

  useEffect(()=>{const down=(e)=>{if(e.target instanceof Element&&e.target.closest('input,textarea,select,[contenteditable="true"]'))return;if(escapeMenuOpen||surrendering){if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space','Digit1','Digit2','Digit3','Digit4','Numpad1','Numpad2','Numpad3','Numpad4'].includes(e.code))e.preventDefault();return;}if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(e.code)){held.current.add(e.code);e.preventDefault();}if(e.code==='Space'){e.preventDefault();requestDodge();}const skillKey={Digit1:0,Digit2:1,Digit3:2,Digit4:3,Numpad1:0,Numpad2:1,Numpad3:2,Numpad4:3}[e.code];if(skillKey!==undefined){e.preventDefault();requestSkillRef.current?.(skillKey);}};const up=(e)=>held.current.delete(e.code);const clear=()=>held.current.clear();const visibility=()=>{if(document.hidden)clear();};window.addEventListener('keydown',down,true);window.addEventListener('keyup',up,true);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',visibility);window.__lunaPvPCombat={active:true,requestSkill,requestMelee,requestDodge};return()=>{window.removeEventListener('keydown',down,true);window.removeEventListener('keyup',up,true);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',visibility);if(window.__lunaPvPCombat?.requestSkill===requestSkill)delete window.__lunaPvPCombat;};},[escapeMenuOpen,surrendering,active,match?.id]);

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key !== 'Escape' || ended) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      held.current.clear();
      if (surrenderConfirm) {
        setSurrenderConfirm(false);
        return;
      }
      setEscapeMenuOpen((open) => !open);
    };
    window.addEventListener('keydown', onEscape, true);
    return () => window.removeEventListener('keydown', onEscape, true);
  }, [ended, surrenderConfirm]);

  const surrenderMatch = useCallback(async () => {
    if (surrendering || ended || !matchRef.current?.id) return;
    setSurrendering(true);
    setError('');
    try {
      await invoke('forfeit', { match_id: matchRef.current.id });
      setSurrenderConfirm(false);
      setEscapeMenuOpen(false);
    } catch (e) {
      setError(e?.message || 'Could not surrender the match.');
    } finally {
      setSurrendering(false);
    }
  }, [ended, surrendering]);

  useEffect(()=>{const timer=window.setInterval(()=>setClockNow(Date.now()),100);return()=>window.clearInterval(timer);},[]);
  const start=Date.parse(match?.fight_starts_at||0);const countdown=start?Math.max(0,start-(clockNow+serverOffsetMs)):0;const count=countdown>0?Math.ceil(countdown/1000):0;
  const opponentDisconnect = opponent?.id ? match?.disconnects?.[String(opponent.id)] : null;
  const reconnectLeftMs = opponentDisconnect ? Math.max(0, Date.parse(opponentDisconnect.reconnect_deadline || 0) - (clockNow + serverOffsetMs)) : 0;
  const reconnectSeconds = Math.max(0, Math.ceil(reconnectLeftMs / 1000));
  const myHits = (match?.hit_log || []).filter((hit) => String(hit.attacker_id) === String(user?.id) && hit.result === 'hit');
  const damageDealt = myHits.reduce((sum, hit) => sum + Number(hit.damage || 0), 0);
  const prestigeEarned = Number(match?.prestige_awards?.[String(user?.id)] || 0);

  useEffect(() => {
    if (!ended) { returningRef.current = false; setResultCountdown(3); return undefined; }
    setResultCountdown(3);
    const interval = window.setInterval(() => setResultCountdown((value) => Math.max(0, value - 1)), 1000);
    const timer = window.setTimeout(() => returnToDashboard(), 3000);
    return () => { window.clearInterval(interval); window.clearTimeout(timer); };
  }, [ended, match?.id, returnToDashboard]);

  return <div className="pointer-events-auto absolute inset-0 z-[45] overflow-hidden bg-[#050a11]" aria-label="Shared PvP arena">
    <div ref={mountRef} className="absolute inset-0" />
    {graphicsError && <ArenaGraphicsRecovery onRetry={() => setGraphicsAttempt((attempt) => attempt + 1)} />}
    {!graphicsError&&loaded<2&&<div className="absolute inset-0 z-50 grid place-items-center bg-black/70 text-lg font-black text-white">Loading fighters {loaded}/2</div>}
    {match?.status==='countdown'&&loaded===2&&<div className="pointer-events-none absolute inset-0 z-50 grid place-items-center text-[80px] font-black text-white drop-shadow-[0_0_30px_rgba(60,220,255,.8)]">{count||'FIGHT'}</div>}
    {loaded===2&&!ended&&['countdown','fighting'].includes(String(match?.status||''))&&!reconnectPaused&&<div className={`pointer-events-none absolute left-1/2 top-5 z-[74] -translate-x-1/2 border px-5 py-2 text-center shadow-xl ${localOwnsTurn?'border-cyan-200/30 bg-cyan-950/92':'border-white/12 bg-[#0b111c]/92'}`}><div className={`text-[10px] font-black uppercase tracking-[.28em] ${localOwnsTurn?'text-cyan-100':'text-white/65'}`}>{match?.status==='countdown'?(localOwnsTurn?'You Move First':`${opponent?.name || 'Opponent'} Moves First`):(isMyTurn?'Your Turn':`${opponent?.name || 'Opponent'}'s Turn`)}</div><div className="mt-0.5 text-[8px] uppercase tracking-[.16em] text-white/35">{match?.status==='countdown'?'Turn order locked':'Choose one action'}</div></div>}
    {error&&<div className="absolute left-1/2 top-20 z-[70] -translate-x-1/2 rounded-full border border-red-300/30 bg-red-950/80 px-4 py-2 text-sm font-bold text-red-100">{error}</div>}
    {opponentDisconnect&&!ended&&<div className="pointer-events-none absolute left-1/2 top-5 z-[72] -translate-x-1/2 rounded-xl border border-amber-200/20 bg-[#10151d]/94 px-5 py-3 text-center text-white shadow-xl"><div className="text-[10px] font-black uppercase tracking-[.24em] text-amber-200/70">Connection interrupted</div><div className="mt-1 text-sm font-bold">Opponent disconnected — waiting to reconnect</div><div className="mt-1 font-mono text-lg font-black text-cyan-200">{Math.floor(reconnectSeconds/60)}:{String(reconnectSeconds%60).padStart(2,'0')}</div></div>}
    {escapeMenuOpen&&!ended&&<div className="absolute inset-0 z-[78] flex items-center justify-center bg-black/55 text-white" aria-label="PvP escape menu">
      <section className="relative w-[min(430px,90vw)] border border-white/14 bg-[#09111d]/96 p-6 shadow-[0_28px_80px_rgba(0,0,0,.62)]">
        <button type="button" onClick={()=>{setSurrenderConfirm(false);setEscapeMenuOpen(false);}} className="absolute right-4 top-4 grid h-9 w-9 place-items-center border border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.07] hover:text-white" aria-label="Resume match"><X className="h-4 w-4"/></button>
        <div className="text-[9px] font-black uppercase tracking-[.30em] text-cyan-100/55">AI Battle · PvP</div>
        <h2 className="mt-2 text-2xl font-black tracking-wide">Match Menu</h2>
        <p className="mt-2 max-w-sm text-xs leading-5 text-white/45">This is a live multiplayer match. Opening this menu does not pause the opponent or the server match.</p>
        {!surrenderConfirm?<div className="mt-6 space-y-3">
          <button type="button" onClick={()=>setEscapeMenuOpen(false)} className="flex w-full items-center gap-3 border border-cyan-100/18 bg-cyan-200/[0.08] px-4 py-4 text-left transition hover:bg-cyan-200/[0.13]"><span className="grid h-9 w-9 place-items-center border border-cyan-100/15 bg-cyan-100/[0.05]"><Play className="h-4 w-4 text-cyan-100"/></span><span><strong className="block text-sm">Resume Match</strong><small className="mt-0.5 block text-[10px] text-white/38">Return to the PvP battlefield</small></span><span className="ml-auto text-[9px] font-black uppercase tracking-[.16em] text-white/30">ESC</span></button>
          <button type="button" onClick={()=>setSurrenderConfirm(true)} className="flex w-full items-center gap-3 border border-red-300/18 bg-red-400/[0.055] px-4 py-4 text-left transition hover:bg-red-400/[0.10]"><span className="grid h-9 w-9 place-items-center border border-red-300/15 bg-red-300/[0.05]"><Flag className="h-4 w-4 text-red-200"/></span><span><strong className="block text-sm text-red-100">Surrender Match</strong><small className="mt-0.5 block text-[10px] text-white/38">Voluntarily forfeit this PvP match</small></span></button>
        </div>:<div className="mt-6 border border-red-300/16 bg-red-500/[0.05] p-5">
          <div className="flex items-center gap-3"><Flag className="h-5 w-5 text-red-200"/><div><div className="text-sm font-black text-red-100">Confirm surrender?</div><div className="mt-1 text-[10px] leading-4 text-white/40">This ends the match immediately and records the result as a forfeit.</div></div></div>
          <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" disabled={surrendering} onClick={()=>setSurrenderConfirm(false)} className="border border-white/10 bg-white/[0.03] px-3 py-3 text-[10px] font-black uppercase tracking-[.12em] text-white/65 hover:bg-white/[0.06] disabled:opacity-40">Cancel</button><button type="button" disabled={surrendering} onClick={surrenderMatch} className="border border-red-200/25 bg-red-300 px-3 py-3 text-[10px] font-black uppercase tracking-[.12em] text-red-950 hover:bg-red-200 disabled:opacity-40">{surrendering?'Surrendering…':'Yes, Surrender'}</button></div>
        </div>}
        <div className="mt-5 border-t border-white/[0.07] pt-3 text-center text-[9px] text-white/28">Press ESC to {surrenderConfirm?'cancel confirmation':'resume'}</div>
      </section>
    </div>}
    {ended&&<div className="absolute inset-0 z-[80] overflow-hidden text-white" style={{background:'linear-gradient(90deg, rgba(5,10,17,.08), rgba(5,10,17,.30) 55%, rgba(5,10,17,.78))'}}>
      <div className="pointer-events-none absolute left-6 top-6 text-[11px] font-black uppercase tracking-[.38em] text-cyan-100/70">Mission Complete</div>
      <div className="pointer-events-none absolute left-[48%] top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className={`text-[clamp(34px,5vw,70px)] font-black uppercase tracking-[.08em] ${won?'text-cyan-100':'text-white/75'}`}>{won?'Victory':'Defeat'}</div>
        <div className="mt-2 text-[10px] font-bold uppercase tracking-[.28em] text-white/45">{String(match.ended_reason||'match complete').replaceAll('_',' ')}</div>
      </div>
      <section className="absolute bottom-5 right-5 top-5 flex w-[min(40%,390px)] min-w-[270px] flex-col border border-white/10 bg-[#07101b]/92 p-5 shadow-[-18px_0_50px_rgba(0,0,0,.32)]">
        <div className="text-[11px] font-black uppercase tracking-[.32em] text-cyan-100/70">PvP Results</div>
        <div className="mt-6 text-[10px] font-black uppercase tracking-[.24em] text-white/35">Results</div>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between border-b border-white/[0.08] py-2"><span className="text-white/50">Outcome</span><span className="font-black uppercase">{won?'Victory':'Defeat'}</span></div>
          <div className="flex items-center justify-between border-b border-white/[0.08] py-2"><span className="text-white/50">Final HP</span><span className="font-semibold">{Math.round(Number(local?.hp||0))} / {Math.round(Number(local?.max_hp||1000))}</span></div>
          <div className="flex items-center justify-between border-b border-white/[0.08] py-2"><span className="text-white/50">Damage dealt</span><span className="font-semibold">{Math.round(damageDealt)}</span></div>
          <div className="flex items-center justify-between border-b border-white/[0.08] py-2"><span className="text-white/50">Hits landed</span><span className="font-semibold">{myHits.length}</span></div>
        </div>
        <div className="mt-5 border border-cyan-200/15 bg-cyan-200/[0.06] p-4"><div className="text-[9px] font-black uppercase tracking-[.26em] text-cyan-100/55">Prestige Earned</div><div className="mt-1 text-3xl font-black text-cyan-100">+{prestigeEarned}</div></div>
        <div className="mt-auto pt-5">
          <button type="button" onClick={returnToDashboard} className="w-full border border-cyan-100/25 bg-cyan-200 px-5 py-3 text-xs font-black uppercase tracking-[.12em] text-slate-950 transition hover:bg-white">Back to my dashboard</button>
          <div className="mt-2 text-center text-[10px] text-white/40">Returning automatically in {resultCountdown}s</div>
        </div>
      </section>
    </div>}
  </div>;
}