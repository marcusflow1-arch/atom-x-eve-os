import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
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
import { boxFor, COURT, FACING_SPEED, INTERPOLATION_DELAY_MS, NETWORK_SEND_MS, RUN_SPEED, SPAWN_Z, WALK_SPEED } from './arenaConfig';

const lerpAngle = (a, b, maxStep) => {
  let delta = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return a + THREE.MathUtils.clamp(delta, -maxStep, maxStep);
};
const clampPos = (pos, box) => ({ x: THREE.MathUtils.clamp(pos.x, box.minX, box.maxX), z: THREE.MathUtils.clamp(pos.z, box.minZ, box.maxZ) });
const serverAtb = (row, offset = 0) => {
  if (!row) return 50;
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
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [lastCastSlot, setLastCastSlot] = useState({ local: null, opponent: null });
  const lastCastSlotRef = useRef(lastCastSlot);
  const [error, setError] = useState('');
  const matchRef = useRef(match);
  const serverOffsetRef = useRef(serverOffsetMs);
  const requestSkillRef = useRef(null);

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
  const active = match?.status === 'fighting' && Date.now() + serverOffsetMs >= Date.parse(match?.fight_starts_at || 0);

  const invoke = async (action, data) => {
    const response = await base44.functions.invoke('aiBattleMatchmaker', { action, data });
    const body = response?.data ?? response ?? {};
    if (body?.error) { const e = new Error(body.error); e.status = response?.status || 409; throw e; }
    if (body.match) queryClient.setQueryData(['ai-battle-matchmaking', user?.id], (prev = {}) => ({ ...prev, match: body.match, server_time: body.server_time || prev.server_time }));
    return body;
  };

  const playSkill = (fighter, skill, targetId, facingYaw, detail = {}) => {
    if (!fighter?.runtime || !skill) return false;
    const effect = effectFromSkill(skill);
    const target = { type: 'player', playerId: String(targetId), facingYaw, autoLock: true, autoHit: true };
    if (fighter.female) return fighter.runtime.playEffect(effect, { ...detail, effect, card: skill, target });
    if (String(effect.id || '') === 'getsuga_tensho') return fighter.runtime.play(target);
    return false;
  };

  const requestSkill = async (slot) => {
    if (!active) return false;
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
    playSkill(runtimes.current.local, skill, opponent?.id, facingYaw, { castId });
    setLastCastSlot((s) => ({ ...s, local: Number(slot) }));
    try {
      const body = await invoke('use_skill', { match_id: match.id, slot: Number(slot), cast_id: castId, attacker_pos: { x: a.x, z: a.z }, target_pos: { x: b.x, z: b.z } });
      const cast = body.cast || {};
      window.dispatchEvent(new CustomEvent('multiplayerLocalAction', { detail: { kind: 'pvp_cast', matchId: match.id, cast_id: cast.cast_id || castId, slot: Number(slot), effect_id: skill.effect_id || '', effect: effectFromSkill(skill), resolves_at: cast.resolves_at, damage: cast.damage, crit: cast.crit, targetPlayerId: opponent?.id } }));
      return true;
    } catch (e) { setError(e.message || 'Skill rejected.'); runtimes.current.local?.runtime?.playIdle?.(); return false; }
  };

  requestSkillRef.current = requestSkill;

  const requestDodge = async () => {
    if (!active) return;
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
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.shadowMap.enabled = true;
    renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%'; mount.appendChild(renderer.domElement);
    const cssRenderer = new CSS2DRenderer(); cssRenderer.domElement.style.position = 'absolute'; cssRenderer.domElement.style.inset = '0'; cssRenderer.domElement.style.pointerEvents = 'none'; mount.appendChild(cssRenderer.domElement);

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
    ]).then(([localFighter, opponentFighter]) => {
      if (disposed) { localFighter.runtime.dispose?.(); opponentFighter.runtime.dispose?.(); return; }
      runtimes.current = { local: localFighter, opponent: opponentFighter };
      positions.current.local.set(0,0,localSide === 'host' ? SPAWN_Z : -SPAWN_Z);
      positions.current.opponent.set(0,0,opponentSide === 'host' ? SPAWN_Z : -SPAWN_Z);
      addBar(localFighter,true); addBar(opponentFighter,false); setLoaded(2);
    }).catch((e) => { console.error('[PvP arena] fighter load failed',e); setError('A fighter could not load.'); });

    const resize = () => { const w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight);renderer.setSize(w,h,false);cssRenderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix(); }; resize();
    const observer = new ResizeObserver(resize); observer.observe(mount);

    const remoteMove = (event) => {
      const d=event.detail||{}; if(d.kind!=='pvp_move'||String(d.matchId||'')!==String(match.id)||String(d.player_id||d.sourcePlayerId||'')===String(user.id))return;
      const last=remoteSamples.current.at(-1); if(last&&Number(d.seq)<=Number(last.seq))return; remoteSamples.current.push({...d,receivedAt:Date.now()}); if(remoteSamples.current.length>90)remoteSamples.current.splice(0,remoteSamples.current.length-90);
    };
    const remoteCast = (event) => {
      const d=event.detail||{}; const currentMatch=matchRef.current; const currentOpponent=opponentRef.current;
      if(String(d.matchId||'')!==String(currentMatch?.id||'')||String(d.sourcePlayerId||d.player_id||'')!==String(currentOpponent?.id||''))return;
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
        entry.root.render(<OverheadFighterBar name={p.name} hp={p.hp} maxHp={p.max_hp} atb={serverAtb(currentMatch?.atb?.[id],offset)} skills={skills} local={entry.isLocal} serverOffsetMs={offset} lastCastSlot={entry.isLocal?castSlot.local:castSlot.opponent} onSkill={entry.isLocal?((slot)=>requestSkillRef.current?.(slot)):undefined}/>);
      }
    };
    const barTimer=window.setInterval(renderBars,100); renderBars();

    const animate = (now) => {
      frame=requestAnimationFrame(animate); const dt=Math.min(.05,Math.max(0,(now-previous)/1000)); previous=now;
      const lf=runtimes.current.local,of=runtimes.current.opponent;
      if(lf&&of){
        const currentMatch=matchRef.current; const offset=serverOffsetRef.current; const currentOpponent=opponentRef.current;
        const lp=positions.current.local,op=positions.current.opponent;
        const canMove=currentMatch?.status==='fighting' && Date.now()+offset>=Date.parse(currentMatch?.fight_starts_at||0);
        let dx=0,dz=0; if(canMove){dx=Number(held.current.has('KeyD'))-Number(held.current.has('KeyA')); const toward=localSide==='host'?-1:1; dz=(Number(held.current.has('KeyW'))-Number(held.current.has('KeyS')))*toward; const len=Math.hypot(dx,dz);if(len){dx/=len;dz/=len;const walking=held.current.has('ShiftLeft')||held.current.has('ShiftRight');const speed=walking?WALK_SPEED:RUN_SPEED;const box=boxFor(localSide);const next=clampPos({x:lp.x+dx*speed*dt,z:lp.z+dz*speed*dt},box);lp.x=next.x;lp.z=next.z;const faceDx=op.x-lp.x,faceDz=op.z-lp.z;const forwardX=Math.sin(lf.yaw),forwardZ=Math.cos(lf.yaw);const rightX=forwardZ,rightZ=-forwardX;const f=dx*forwardX+dz*forwardZ,r=dx*rightX+dz*rightZ;const dir=Math.abs(r)>Math.abs(f)?(r>0?'right':'left'):(f>=0?'forward':'back');lf.runtime.playLocomotion?.(`${walking?'walk':'run'}_${dir}`);}else lf.runtime.playIdle?.();}
        const renderTime=Date.now()+offset-INTERPOLATION_DELAY_MS; const samples=remoteSamples.current; if(samples.length){let a=samples[0],b=samples[samples.length-1];for(let i=0;i<samples.length-1;i++){if(Number(samples[i].t)<=renderTime&&Number(samples[i+1].t)>=renderTime){a=samples[i];b=samples[i+1];break;}}const span=Math.max(1,Number(b.t)-Number(a.t));const t=THREE.MathUtils.clamp((renderTime-Number(a.t))/span,0,1);const box=boxFor(opponentSide);const p=clampPos({x:THREE.MathUtils.lerp(Number(a.x),Number(b.x),t),z:THREE.MathUtils.lerp(Number(a.z),Number(b.z),t)},box);op.x=p.x;op.z=p.z;if(Date.now()-Number(b.receivedAt||0)>500)of.runtime.playIdle?.();else of.runtime.playLocomotion?.(`${b.running?'run':'walk'}_${b.anim||'forward'}`);}else{const stored=currentMatch?.positions?.[currentOpponent?.id];if(stored){op.x=Number(stored.x||op.x);op.z=Number(stored.z||op.z);}}
        lf.yaw=lerpAngle(lf.yaw,Math.atan2(op.x-lp.x,op.z-lp.z),FACING_SPEED*dt);of.yaw=lerpAngle(of.yaw,Math.atan2(lp.x-op.x,lp.z-op.z),FACING_SPEED*dt);
        lf.root.position.x=lp.x;lf.root.position.z=lp.z;if(!lf.runtime.isPlaying?.())lf.root.rotation.y=lf.yaw;of.root.position.x=op.x;of.root.position.z=op.z;if(!of.runtime.isPlaying?.())of.root.rotation.y=of.yaw;
        lf.runtime.update?.(dt);of.runtime.update?.(dt);
        window.__lunaPvPPosition={x:lp.x,z:lp.z};
        if(now-lastNetworkSend.current>=NETWORK_SEND_MS){lastNetworkSend.current=now;let anim='forward';if(Math.abs(dx)>Math.abs(dz))anim=dx>0?'right':'left';else if(dz)anim=((dz*(localSide==='host'?-1:1))>0)?'forward':'back';window.webrtcBroadcast?.({type:'movement',payload:{kind:'pvp_move',matchId:currentMatch?.id,seq:++seq.current,x:lp.x,z:lp.z,yaw:lf.yaw,anim,running:!held.current.has('ShiftLeft')&&!held.current.has('ShiftRight'),t:Date.now()+offset}});}
        const away=new THREE.Vector3(lp.x-op.x,0,lp.z-op.z).normalize();const sideVec=new THREE.Vector3(-away.z,0,away.x);const targetShoulder=Math.abs(lp.x)>2?(lp.x>0?-1:1):shoulder;shoulder=THREE.MathUtils.lerp(shoulder,targetShoulder,1-Math.exp(-dt/0.4));const separation=lp.distanceTo(op);cameraDistance=THREE.MathUtils.lerp(cameraDistance,Math.min(9,Math.max(6.2,6.2+(separation-10)*.25)),1-Math.exp(-4*dt));const desired=new THREE.Vector3(lp.x,2.4,lp.z).addScaledVector(away,cameraDistance).addScaledVector(sideVec,2*shoulder);const look=new THREE.Vector3().lerpVectors(lp,op,.6);look.y=1.1;const factor=1-Math.exp(-6*dt);camera.position.lerp(desired,factor);camera.lookAt(look);
      }
      renderer.render(scene,camera);cssRenderer.render(scene,camera);
    }; frame=requestAnimationFrame(animate);

    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.clearInterval(barTimer);window.removeEventListener('webrtcMovementUpdate',remoteMove);window.removeEventListener('lunaAIBattleRemoteCardCast',remoteCast);barRoots.forEach((r)=>r.unmount());runtimes.current.local?.runtime?.dispose?.();runtimes.current.opponent?.runtime?.dispose?.();renderer.dispose();cssRenderer.domElement.remove();renderer.domElement.remove();delete window.__lunaPvPPosition;};
  // Arena is recreated only for a new match; live match state is read by refs/cache overlays.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.id, local?.id, opponent?.id]);

  useEffect(()=>{const down=(e)=>{if(e.target instanceof Element&&e.target.closest('input,textarea,select,[contenteditable="true"]'))return;if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(e.code)){held.current.add(e.code);e.preventDefault();}if(e.code==='Space'){e.preventDefault();requestDodge();}};const up=(e)=>held.current.delete(e.code);const clear=()=>held.current.clear();const visibility=()=>{if(document.hidden)clear();};window.addEventListener('keydown',down,true);window.addEventListener('keyup',up,true);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',visibility);window.__lunaPvPCombat={active:true,requestSkill,requestDodge};return()=>{window.removeEventListener('keydown',down,true);window.removeEventListener('keyup',up,true);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',visibility);if(window.__lunaPvPCombat?.requestSkill===requestSkill)delete window.__lunaPvPCombat;};});

  useEffect(()=>{const timer=window.setInterval(()=>setClockNow(Date.now()),100);return()=>window.clearInterval(timer);},[]);
  const start=Date.parse(match?.fight_starts_at||0);const countdown=start?Math.max(0,start-(clockNow+serverOffsetMs)):0;const count=countdown>0?Math.ceil(countdown/1000):0;
  const ended=match?.status==='ended';const won=ended&&String(match.winner_id)===String(user?.id);

  return <div className="pointer-events-auto absolute inset-0 z-[45] overflow-hidden bg-[#050a11]" aria-label="Shared PvP arena">
    <div ref={mountRef} className="absolute inset-0" />
    {loaded<2&&<div className="absolute inset-0 z-50 grid place-items-center bg-black/70 text-lg font-black text-white">Loading fighters {loaded}/2</div>}
    {match?.status==='countdown'&&loaded===2&&<div className="pointer-events-none absolute inset-0 z-50 grid place-items-center text-[80px] font-black text-white drop-shadow-[0_0_30px_rgba(60,220,255,.8)]">{count||'FIGHT'}</div>}
    {error&&<div className="absolute left-1/2 top-20 z-[70] -translate-x-1/2 rounded-full border border-red-300/30 bg-red-950/80 px-4 py-2 text-sm font-bold text-red-100">{error}</div>}
    {ended&&<div className="absolute inset-0 z-[80] grid place-items-center bg-black/72 backdrop-blur-sm"><div className="w-[min(92vw,520px)] rounded-3xl border border-white/12 bg-slate-950/92 p-8 text-center text-white shadow-2xl"><div className="text-xs font-black uppercase tracking-[.32em] text-white/40">PvP Result</div><h2 className="mt-3 text-4xl font-black">{won?'Victory':'Defeat'}</h2><p className="mt-2 text-sm text-white/55">{String(match.ended_reason||'match complete').replaceAll('_',' ')}</p><div className="mt-6 grid grid-cols-2 gap-3">{(match.players||[]).map((p)=><div key={p.id} className="rounded-2xl bg-white/[0.05] p-3"><div className="text-sm font-bold">{p.name}</div><div className="mt-2 h-2 overflow-hidden rounded bg-black/60"><div className="h-full bg-cyan-300" style={{width:`${Math.max(0,Math.min(100,Number(p.hp||0)/Math.max(1,Number(p.max_hp||1000))*100))}%`}}/></div><div className="mt-1 text-xs text-white/50">{Math.round(p.hp||0)} / {Math.round(p.max_hp||1000)}</div></div>)}</div><button type="button" onClick={()=>window.dispatchEvent(new CustomEvent('joinMultiplayerChannel',{detail:{channelId:`dashboard_${user.id}`,hostId:user.id,hostName:'My'}}))} className="mt-6 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950">Back to my dashboard</button></div></div>}
  </div>;
}
