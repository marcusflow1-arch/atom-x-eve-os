import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useRevoAvatar } from '@/components/onboarding/useRevoAvatar';
import { loadAvatarModel, applyPlayerAppearance, disposeAvatarModel } from '@/components/onboarding/avatarAssetRuntime';
import { DEV_WORLD } from '../gameplay/world.mjs';
import { presentation } from './questUi.mjs';
import { createGame5MovementTransport } from './game5MovementTransport.mjs';
import { createConnectedQuestSession, isAuthoritativelyCollected } from './connectedQuestSession.mjs';
import { GAME5_BROWSER_DEMO_KEY, browserQuestSnapshot, createBrowserQuest, performBrowserQuestAction, restoreBrowserQuest } from './browserQuestDemo.mjs';

function readSavedQuest() {
  try { return restoreBrowserQuest(JSON.parse(sessionStorage.getItem(GAME5_BROWSER_DEMO_KEY))); }
  catch { return createBrowserQuest(); }
}

function createCharacter(color, withHat = false) {
  const group = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({ color, roughness: 0.82 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc89b74, roughness: 0.93 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x293238, roughness: 0.9 });
  const add = (mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = true; group.add(mesh); return mesh; };
  add(new THREE.Mesh(new THREE.CylinderGeometry(.43, .7, 1.45, 10), cloth), 0, 1.28, 0);
  add(new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 12), skin), 0, 2.3, 0);
  for (const sign of [-1, 1]) {
    add(new THREE.Mesh(new THREE.CylinderGeometry(.15, .18, 1.2, 9), cloth), sign * .64, 1.37, 0).rotation.z = sign * .23;
    add(new THREE.Mesh(new THREE.CylinderGeometry(.18, .21, .9, 9), dark), sign * .25, .45, 0);
  }
  if (withHat) {
    add(new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, .09, 16), dark), 0, 2.59, 0);
    add(new THREE.Mesh(new THREE.ConeGeometry(.54, .59, 16), dark), 0, 2.91, 0);
  }
  return group;
}

export default function Game5QuestPreview({ mode = 'demo', connectedTransport = null }) {
  const connectedMode = mode === 'connected';
  const revo = useRevoAvatar('game5');
  const revoKey = revo ? `${revo.avatarId}:${revo.appearance.gender}:${revo.appearance.model_url}` : '';
  const [revoStatus, setRevoStatus] = useState('loading');
  const hostRef = useRef(null);
  const gameRef = useRef(null);
  const pressedRef = useRef(new Set());
  const demoRef = useRef(null);
  const connectedRef = useRef(null);
  const snapshotRef = useRef(null);
  const movementRef = useRef(null);
  const movementPositionRef = useRef(null);
  const movementReadyRef = useRef(false);
  const reconnectMovementRef = useRef(null);
  const [movementStatus, setMovementStatus] = useState('disconnected');
  const [movementError, setMovementError] = useState('');
  const [connectedState, setConnectedState] = useState({ phase: 'disconnected', snapshot: null, notice: '', error: '', busy: false });
  const dialogueRef = useRef(false);
  const interactRef = useRef(null);
  const [demo, setDemo] = useState(readSavedQuest);
  const [dialogue, setDialogue] = useState(false);
  const [message, setMessage] = useState('Move toward Elder Shen and press E.');
  const [renderError, setRenderError] = useState('');
  const [nearby, setNearby] = useState('');
  demoRef.current = demo;
  dialogueRef.current = dialogue;

  const currentSnapshot = connectedMode ? connectedState.snapshot : browserQuestSnapshot(demo);
  snapshotRef.current = currentSnapshot;
  const ui = presentation(currentSnapshot);
  useEffect(() => {
    if (!connectedMode) return undefined;
    const session = createConnectedQuestSession({ transport: connectedTransport, onChange: setConnectedState });
    connectedRef.current = session;
    session.refresh();
    return () => {
      session.dispose();
      if (connectedRef.current === session) connectedRef.current = null;
    };
  }, [connectedMode, connectedTransport]);
  // G5-0004-B: the Connected Test client sends ONLY keyboard/mobile movement
  // intents. This never imports server movement authority and never authenticates
  // an actor using browser-supplied player ID or position.
  useEffect(() => {
    if (!connectedMode) return undefined;
    const movement = createGame5MovementTransport();
    let alive = true;
    movementRef.current = movement;
    movementReadyRef.current = false;
    movementPositionRef.current = null;
    async function connectMovement() {
      if (!alive) return;
      setMovementStatus('connecting');
      setMovementError('');
      movementReadyRef.current = false;
      try {
        const connected = await movement.connect();
        if (!connected || !alive) return;
        // A successful connect only creates a session: a fresh accepted input
        // must update the server observation before quest proximity is usable.
        const ack = await movement.submit({ moveX: 0, moveZ: 0, sprint: false });
        if (!ack || !alive) return;
        movementPositionRef.current = { ...ack.position };
        if (gameRef.current?.player) {
          gameRef.current.player.position.x = ack.position.x;
          gameRef.current.player.position.z = ack.position.z;
        }
        movementReadyRef.current = true;
        setMovementStatus('ready');
      } catch (error) {
        if (!alive) return;
        movementReadyRef.current = false;
        setMovementStatus('disconnected');
        setMovementError('Game 5 movement authority unavailable: ' + (error.message || 'connection failed'));
      }
    }
    reconnectMovementRef.current = connectMovement;
    connectMovement();
    const loop = setInterval(async () => {
      if (!alive || !movementReadyRef.current) return;
      const keys = pressedRef.current;
      const moveX = dialogueRef.current ? 0 : Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
      const moveZ = dialogueRef.current ? 0 : Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));
      try {
        const ack = await movement.submit({ moveX, moveZ, sprint: !dialogueRef.current && keys.has('shift') });
        if (alive && ack) movementPositionRef.current = { ...ack.position };
      } catch (error) {
        if (!alive) return;
        movementReadyRef.current = false;
        setMovementStatus('disconnected');
        setMovementError('Movement disconnected: ' + (error.message || 'request failed') + '. Reconnect to continue.');
      }
    }, 100);
    return () => {
      alive = false;
      clearInterval(loop);
      reconnectMovementRef.current = null;
      movementReadyRef.current = false;
      movementRef.current = null;
      movementPositionRef.current = null;
      movement.disconnect().catch(() => {}); // best effort; server lease expires
    };
  }, [connectedMode]);

  const questDialogue = {
    not_started: 'Traveler, an ancestral card lies lost beyond the temple path. Will you recover it?',
    active: 'Follow the road, then travel east. Retrieve the card near the grove and return to me.',
    ready_to_complete: 'You have recovered the Lost Card. The ancestors smile upon you. Complete your task?',
    completed: 'The ancestral card is safe. You have my gratitude, traveler.',
  };

  async function perform(action) {
    const player = gameRef.current?.player;
    if (!player) { setMessage('The 3D scene has not finished loading.'); return; }
    const position = { x: player.position.x, z: player.position.z };
    if (connectedMode) {
      // G5-0003-A rejects all browser-reported positions; server owns proximity.
      const payload = action === 'pickup' ? { pickupId: DEV_WORLD.card.id } : { npcId: DEV_WORLD.npc.id };
      const result = await connectedRef.current?.dispatch(action, payload);
      // Never hide the card or complete a quest before receiving authoritative state.
      if (result?.ok) { setMessage('Quest state confirmed by server.'); setDialogue(false); }
      return;
    }
    try {
      const result = performBrowserQuestAction(demoRef.current, action, position);
      demoRef.current = result.state;
      setDemo(result.state);
      setMessage(result.notice);
      setDialogue(false);
    } catch (error) { setMessage(error.message || 'Unable to interact.'); }
  }

  async function interact() {
    const player = gameRef.current?.player;
    if (!player) return;
    if (connectedMode && !movementReadyRef.current) {
      setMessage('Connected Test movement is disconnected. Reconnect before quest interactions.');
      return;
    }
    const pos = player.position;
    const radius = DEV_WORLD.interactionRadius;
    if (Math.hypot(pos.x - DEV_WORLD.npc.x, pos.z - DEV_WORLD.npc.z) <= radius) {
      if (connectedMode) {
        const refreshed = await connectedRef.current?.refresh();
        if (!refreshed?.ok) return;
      }
      setDialogue(true);
      return;
    }
    if (Math.hypot(pos.x - DEV_WORLD.card.x, pos.z - DEV_WORLD.card.z) <= radius) {
      if (connectedMode && isAuthoritativelyCollected(snapshotRef.current)) {
        setMessage('The Lost Card was already collected on the server.');
        return;
      }
      await perform('pickup');
      return;
    }
    setMessage('Move closer to Elder Shen or the Lost Card.');
  }
  interactRef.current = interact;

  useEffect(() => {
    try { sessionStorage.setItem(GAME5_BROWSER_DEMO_KEY, JSON.stringify(demo)); }
    catch { /* storage denied: in-memory browser demo still works */ }
  }, [demo]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let raf = 0;
    let renderer;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101e26);
    scene.fog = new THREE.FogExp2(0x101e26, .013);
    const camera = new THREE.PerspectiveCamera(59, 1, .1, 140);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x284b36, roughness: 1 });
    const pathMat = new THREE.MeshStandardMaterial({ color: 0x75614b, roughness: 1 });
    const timber = new THREE.MeshStandardMaterial({ color: 0x694630, roughness: .9 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x25515a, roughness: .6 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x315a49, roughness: .97 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf5ca77, metalness: .55, roughness: .22 });
    const addBox = (w, h, d, x, y, z, mat) => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      box.position.set(x, y, z);
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(box);
      return box;
    };
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      host.appendChild(renderer.domElement);
      const resize = () => {
        const width = host.clientWidth || 800;
        const height = host.clientHeight || 470;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };
      resize();
      window.addEventListener('resize', resize);
      const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
      resizeObserver?.observe(host);

      scene.add(new THREE.HemisphereLight(0xd1e8ff, 0x473826, 2.2));
      const sun = new THREE.DirectionalLight(0xffd8a8, 3);
      sun.position.set(-11, 24, 12);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38 });
      scene.add(sun);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);
      const road = new THREE.Mesh(new THREE.PlaneGeometry(6, 40), pathMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(0, .02, -2);
      scene.add(road);
      for (const [x, z] of [[-10, -17], [9, -19]]) {
        addBox(7, .9, 6, x, 2.3, z, timber);
        for (const a of [-1, 1]) for (const b of [-1, 1])
          addBox(.5, 4, .5, x + a * 2.8, 2, z + b * 2.2, timber);
        addBox(9, .7, 8, x, 5, z, roofMat);
        addBox(7, .4, 6, x, 5.5, z, roofMat);
      }
      for (const [x, z] of [[-7, 2], [7, 4], [-16, -8], [17, 7], [16, -10]]) {
        addBox(.5, 4, .5, x, 2, z, timber);
        const foliage = new THREE.Mesh(new THREE.ConeGeometry(2.6, 5, 8), leafMat);
        foliage.position.set(x, 5.2, z);
        foliage.castShadow = true;
        scene.add(foliage);
      }
      // Revo is the signed-in player's saved Luna avatar; no Game 5 character is generated.
      const player = new THREE.Group();
      player.position.set(DEV_WORLD.spawn.x, 0, DEV_WORLD.spawn.z);
      scene.add(player);
      const elder = createCharacter(0x9c7141, true);
      elder.position.set(DEV_WORLD.npc.x, 0, DEV_WORLD.npc.z);
      elder.rotation.y = Math.PI;
      scene.add(elder);
      const card = new THREE.Group();
      card.position.set(DEV_WORLD.card.x, 1.7, DEV_WORLD.card.z);
      const face = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, .14), goldMat);
      face.castShadow = true;
      card.add(face);
      const glyph = new THREE.Mesh(new THREE.PlaneGeometry(.79, 1.06), new THREE.MeshBasicMaterial({ color: 0x2c6670, side: THREE.DoubleSide }));
      glyph.position.z = .08;
      card.add(glyph);
      scene.add(card);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, .045, 7, 42), new THREE.MeshBasicMaterial({ color: 0xf7d895 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(card.position);
      scene.add(ring);
      const glow = new THREE.PointLight(0xeecf86, 2.5, 10);
      glow.position.copy(card.position);
      scene.add(glow);
      gameRef.current = { player };
      const clock = new THREE.Clock();
      let lastNearby = '';
      const animate = () => {
        raf = requestAnimationFrame(animate);
        const dt = Math.min(clock.getDelta(), .05);
        const keys = pressedRef.current;
        if (!dialogueRef.current) {
          let dx = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
          let dz = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));
          const len = Math.hypot(dx, dz) || 1;
          dx /= len;
          dz /= len;
          const speed = keys.has('shift') ? 8 : 5;
          player.position.x = THREE.MathUtils.clamp(player.position.x + dx * speed * dt, -DEV_WORLD.bounds, DEV_WORLD.bounds);
          player.position.z = THREE.MathUtils.clamp(player.position.z + dz * speed * dt, -DEV_WORLD.bounds, DEV_WORLD.bounds);
          if (dx || dz) player.rotation.y = Math.atan2(dx, dz);
        }
        // Visual client prediction is not an authorization source. Server
        // acknowledgments reconcile it; all quest proximity remains server-only.
        const confirmed = connectedMode ? movementPositionRef.current : null;
        if (confirmed) {
          const deviation = Math.hypot(player.position.x - confirmed.x, player.position.z - confirmed.z);
          const factor = deviation > 1.5 ? 1 : Math.min(1, dt * 7);
          player.position.x += (confirmed.x - player.position.x) * factor;
          player.position.z += (confirmed.z - player.position.z) * factor;
        }
        camera.position.lerp(new THREE.Vector3(player.position.x + .2, 12, player.position.z + 15), Math.min(1, dt * 4));
        camera.lookAt(player.position.x, 1.2, player.position.z - 2);
        const hidden = connectedMode ? isAuthoritativelyCollected(snapshotRef.current) : demoRef.current?.cardCollected === true;
        card.visible = !hidden;
        ring.visible = !hidden;
        glow.visible = !hidden;
        card.rotation.y += dt * .8;
        card.position.y = 1.7 + Math.sin(clock.elapsedTime * 2.1) * .12;
        ring.position.y = glow.position.y = card.position.y;
        const npcDist = Math.hypot(player.position.x - DEV_WORLD.npc.x, player.position.z - DEV_WORLD.npc.z);
        const cardDist = Math.hypot(player.position.x - DEV_WORLD.card.x, player.position.z - DEV_WORLD.card.z);
        const currentNearby = npcDist <= DEV_WORLD.interactionRadius ? 'Elder Shen · Press E or Interact' : cardDist <= DEV_WORLD.interactionRadius && !hidden ? 'Lost Card · Press E or Interact' : '';
        if (currentNearby !== lastNearby) { lastNearby = currentNearby; setNearby(currentNearby); }
        const animator = gameRef.current?.avatarAnimation;
        if (animator) {
          const moving = !dialogueRef.current && [...pressedRef.current].some(key => ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key));
          const wanted = moving ? (pressedRef.current.has('shift') ? 'run' : 'walk') : 'idle';
          const next = animator.actions[wanted] || animator.actions[moving ? 'walk' : 'idle'] || animator.actions.idle;
          if (next && next !== animator.active) {
            animator.active?.fadeOut(.16);
            next.reset().fadeIn(.16).play();
            animator.active = next;
          }
          animator.mixer.update(dt);
        }
        renderer.render(scene, camera);
      };
      const onKeyDown = (event) => {
        if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
        const key = event.key.toLowerCase();
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
        if (key === 'escape') setDialogue(false);
        if (key === 'e' && !event.repeat) interactRef.current?.();
        pressedRef.current.add(key);
      };
      const onKeyUp = event => pressedRef.current.delete(event.key.toLowerCase());
      const onBlur = () => pressedRef.current.clear();
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('blur', onBlur);
      animate();
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('blur', onBlur);
        window.removeEventListener('resize', resize);
        resizeObserver?.disconnect();
        const savedModel = gameRef.current?.avatarModel;
        if (savedModel) player.remove(savedModel); // disposed separately by the Revo loader effect
        gameRef.current = null;
        scene.traverse(obj => {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(mat => mat.dispose());
          else obj.material?.dispose();
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    } catch (error) {
      setRenderError('3D rendering is unavailable in this browser: ' + (error.message || 'WebGL could not start'));
      renderer?.dispose();
      renderer?.domElement?.remove();
      return undefined;
    }
  }, []);

  // Load the actual saved Luna/Revo body, using the same canonical asset and appearance
  // pipeline as the dashboard. The game never substitutes a newly generated player.
  useEffect(() => {
    const player = gameRef.current?.player;
    if (!revo || !player) {
      setRevoStatus(revo ? 'unavailable' : 'missing');
      return undefined;
    }
    let cancelled = false;
    let body = null;
    let mixer = null;
    setRevoStatus('loading');
    loadAvatarModel(revo.appearance, 2.45).then(model => {
      if (cancelled) { disposeAvatarModel(model); return; }
      body = model;
      player.add(body);
      mixer = new THREE.AnimationMixer(body);
      const clips = body.animations || [];
      const lookup = regex => clips.find(clip => regex.test(clip.name));
      const selected = { idle: lookup(/(?:^|[ _])idle/i) || clips[0], walk: lookup(/walk/i), run: lookup(/run/i) };
      const actions = {};
      for (const [name, clip] of Object.entries(selected)) if (clip) actions[name] = mixer.clipAction(clip);
      const first = actions.idle || actions.walk || actions.run;
      first?.play();
      if (gameRef.current?.player === player) gameRef.current = {
        ...gameRef.current, avatarModel: body, avatarAnimation: { mixer, actions, active: first },
      };
      setRevoStatus('ready');
    }).catch(() => {
      if (!cancelled) setRevoStatus('unavailable');
    });
    return () => {
      cancelled = true;
      mixer?.stopAllAction();
      if (body) {
        player.remove(body);
        disposeAvatarModel(body);
      }
      if (gameRef.current?.avatarModel === body) {
        gameRef.current.avatarModel = null;
        gameRef.current.avatarAnimation = null;
      }
    };
  }, [revoKey]);

  // Appearance edits made in Luna update the same loaded body without changing identity.
  const appearanceJSON = revo ? JSON.stringify(revo.appearance) : '';
  useEffect(() => {
    if (!revo || !gameRef.current?.avatarModel) return;
    applyPlayerAppearance(gameRef.current.avatarModel, revo.appearance);
  }, [appearanceJSON]);

  function reset() {
    if (!window.confirm('Reset only this browser-demo quest progress?')) return;
    const fresh = createBrowserQuest();
    demoRef.current = fresh;
    setDemo(fresh);
    setDialogue(false);
    setMessage('Browser demo reset. Speak with Elder Shen.');
  }

  const dialogues = {
    not_started: 'Accept quest',
    active: 'Continue exploring',
    ready_to_complete: 'Complete quest',
    completed: 'Close',
  };

  const pointer = (key, down) => {
    if (down) pressedRef.current.add(key);
    else pressedRef.current.delete(key);
  };

  return (
    <div className="space-y-3">
      <div className="relative h-[410px] w-full overflow-hidden rounded-xl border border-cyan-200/10 bg-[#101e26] md:h-[500px]">
        <div ref={hostRef} className="absolute inset-0" role="img" aria-label="Interactive three-dimensional wuxia temple and forest" />
        {renderError && <div role="alert" className="absolute inset-0 flex items-center justify-center bg-slate-950/95 p-6 text-center text-red-200">{renderError}</div>}
        {['missing','unavailable'].includes(revoStatus) && <div role="alert" className="absolute bottom-20 left-3 max-w-sm rounded-lg border border-amber-300/40 bg-slate-950/95 px-3 py-2 text-xs text-amber-200">Your saved Revo avatar could not be loaded. Return to Luna to verify its model; Game 5 does not create a substitute character.</div>}
        <div className="pointer-events-none absolute left-3 top-3 max-w-[270px] rounded-xl border border-white/10 bg-[#081320]/80 p-3 text-white shadow-lg backdrop-blur-md">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-cyan-200">Retrieve the Lost Card · {connectedMode ? 'CONNECTED TEST' : 'SIMULATED DEMO'}</div>
          <div className="text-sm font-semibold">{ui.objective}</div>
          <div className="mt-1 text-xs text-cyan-100/80">Revo: {revo?.name || 'saved AI avatar required'} · {revoStatus === 'ready' ? 'loaded' : revoStatus === 'loading' ? 'loading model…' : 'model unavailable'}</div>
          <div className="mt-1 text-xs text-amber-200">{connectedMode ? 'Server test reward: ' : 'Simulated test tokens: '}{connectedMode && !currentSnapshot ? 'Not loaded' : ui.testWallet ?? 'Not provided'}</div>
          {connectedMode && <>
            <div data-testid="game5-connection-status" className="mt-1 text-xs text-cyan-100/80">Quest: {connectedState.phase}{connectedState.busy ? ' · requesting…' : ''}</div>
            <div data-testid="game5-movement-status" className="mt-1 text-xs text-cyan-100/80">Movement: {movementStatus}</div>
          </>}
        </div>
        <div className="pointer-events-none absolute bottom-3 left-3 max-w-[70%] rounded-lg bg-black/65 px-3 py-2 text-xs text-white/90 backdrop-blur-md">{nearby || message}</div>
        {connectedMode && movementError && <div role="alert" className="absolute right-3 top-24 max-w-[54%] rounded-lg border border-red-400/60 bg-red-950/95 px-3 py-2 text-sm text-red-100">{movementError}</div>}
        {connectedMode && (connectedState.error || connectedState.notice) &&
          <div role={connectedState.error ? 'alert' : 'status'} className={`absolute right-3 top-3 max-w-[54%] rounded-lg border px-3 py-2 text-sm ${connectedState.error ? 'border-red-400/60 bg-red-950/95 text-red-100' : 'border-emerald-400/60 bg-emerald-950/95 text-emerald-100'}`}>
            {connectedState.error || connectedState.notice}
          </div>}
        <div className="absolute bottom-3 right-3 flex items-end gap-2">
          <div className="grid grid-cols-3 gap-1 md:hidden">
            <span/><button onPointerDown={e=>{e.preventDefault();pointer('w',true)}} onPointerUp={()=>pointer('w',false)} onPointerCancel={()=>pointer('w',false)} className="rounded-lg bg-white/25 px-3 py-2 text-white">↑</button><span/>
            <button onPointerDown={e=>{e.preventDefault();pointer('a',true)}} onPointerUp={()=>pointer('a',false)} onPointerCancel={()=>pointer('a',false)} className="rounded-lg bg-white/25 px-3 py-2 text-white">←</button>
            <button onPointerDown={e=>{e.preventDefault();pointer('s',true)}} onPointerUp={()=>pointer('s',false)} onPointerCancel={()=>pointer('s',false)} className="rounded-lg bg-white/25 px-3 py-2 text-white">↓</button>
            <button onPointerDown={e=>{e.preventDefault();pointer('d',true)}} onPointerUp={()=>pointer('d',false)} onPointerCancel={()=>pointer('d',false)} className="rounded-lg bg-white/25 px-3 py-2 text-white">→</button>
          </div>
          <button type="button" onClick={interact} disabled={connectedMode && (connectedState.busy || !movementReadyRef.current)} className="rounded-xl border border-amber-100/30 bg-amber-300 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg disabled:opacity-50">E · Interact</button>
        </div>
        {dialogue && <div className="absolute inset-0 flex items-end justify-center bg-black/35 p-4 sm:items-center">
          <section className="w-full max-w-sm rounded-2xl border border-amber-200/30 bg-[#12212a]/95 p-5 shadow-2xl backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-amber-200">Elder Shen</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/85">{questDialogue[ui.status] || 'Waiting for verified server quest state.'}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={()=>setDialogue(false)} className="rounded-lg border border-white/15 px-4 py-2 text-xs text-white/80">Close</button>
              {(ui.status === 'not_started' || ui.status === 'ready_to_complete') && <button type="button" disabled={connectedMode && (connectedState.busy || connectedState.phase !== 'ready')} onClick={()=>perform(ui.status === 'not_started' ? 'accept' : 'complete')} className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">{dialogues[ui.status]}</button>}
            </div>
          </section>
        </div>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/60">
        <span>WASD / arrows: move · Shift: sprint · E: interact</span>
        {connectedMode ? <button type="button" onClick={() => { reconnectMovementRef.current?.(); connectedRef.current?.refresh(); }} disabled={connectedState.busy || movementStatus === 'connecting'} className="rounded-lg border border-white/15 px-3 py-1.5 text-cyan-200 hover:bg-white/10 disabled:opacity-50">Reconnect movement + quest</button> : <button type="button" onClick={reset} className="rounded-lg border border-white/15 px-3 py-1.5 text-amber-200 hover:bg-white/10">Reset browser demo</button>}
      </div>
      <p className="text-xs leading-relaxed text-amber-200/75">{connectedMode ? 'Connected Test never substitutes browser simulation. Backend authentication and the G5-0003-A server contract must be approved and connected before quest requests are enabled; no local browser data is treated as server progression.' : 'Browser demonstration only. Quest progress is stored in this tab, and the displayed test token is simulated. This does not connect to the Game 5 server-side quest, inventory, or production economy.'}</p>
    </div>
  );
}
