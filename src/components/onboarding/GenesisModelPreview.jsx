import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { COMPANION_MOTIONS, companionModel } from '@/components/onboarding/genesisAssets';
import { createGenesisScene } from '@/components/onboarding/genesisScene';

let animationCatalogPromise = null;

function normalized(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function loadAdminAnimations() {
  if (!animationCatalogPromise) {
    animationCatalogPromise = base44.entities.AnimationFBX.list('name', 300)
      .then((rows) => Array.isArray(rows) ? rows : [])
      .catch(() => []);
  }
  return animationCatalogPromise;
}

function buildMotionSet(rows, gender) {
  const preferredFolder = gender === 'female' ? 'c1' : 'player character';
  const candidates = (rows || []).filter((row) => row?.file_url);
  const pick = (...names) => {
    const wanted = names.map(normalized);
    return candidates.find((row) => normalized(row.folder) === preferredFolder && wanted.includes(normalized(row.name)))
      || candidates.find((row) => wanted.includes(normalized(row.name)));
  };
  const asMotion = (row, fallback, options = {}) => row
    ? { name: options.name || row.name, url: row.file_url, loop: options.loop ?? row.is_loopable !== false }
    : { ...fallback, ...options };

  const fallbackIdle = COMPANION_MOTIONS[0];
  const fallbackLook = COMPANION_MOTIONS[1] || fallbackIdle;
  const fallbackWalk = COMPANION_MOTIONS[2] || fallbackIdle;

  return {
    idles: [
      asMotion(pick('standing idle 01', 'idle'), fallbackIdle, { name: 'Idle', loop: true }),
      asMotion(pick('standing idle 02 looking'), fallbackLook, { name: 'Look Around', loop: true }),
      asMotion(pick('standing idle 03 examine'), fallbackLook, { name: 'Examine', loop: true }),
      asMotion(pick('unarmed idle 01'), fallbackIdle, { name: 'Relaxed Idle', loop: true }),
    ],
    interactions: [
      asMotion(pick('standing idle 02 looking'), fallbackLook, { name: 'Friendly Look', loop: false }),
      asMotion(pick('standing idle 03 examine'), fallbackLook, { name: 'Curious Examine', loop: false }),
    ],
    walk: {
      forward: asMotion(pick('standing walk forward'), fallbackWalk, { name: 'Walk Forward', loop: true }),
      back: asMotion(pick('standing walk back'), fallbackWalk, { name: 'Walk Back', loop: true }),
      left: asMotion(pick('standing walk left'), fallbackWalk, { name: 'Walk Left', loop: true }),
      right: asMotion(pick('standing walk right'), fallbackWalk, { name: 'Walk Right', loop: true }),
    },
    run: {
      forward: asMotion(pick('standing run forward', 'run forward', 'running'), fallbackWalk, { name: 'Run Forward', loop: true }),
      back: asMotion(pick('standing run back', 'running backward'), fallbackWalk, { name: 'Run Back', loop: true }),
      left: asMotion(pick('standing run left'), fallbackWalk, { name: 'Run Left', loop: true }),
      right: asMotion(pick('standing run right'), fallbackWalk, { name: 'Run Right', loop: true }),
    },
  };
}

export default function GenesisModelPreview({ config, onCapabilities, compact = false, interactive = false }) {
  const mount = useRef(null);
  const scene = useRef(null);
  const callback = useRef(onCapabilities);
  const keyState = useRef({ w: false, a: false, s: false, d: false, shift: false });
  const movementFrame = useRef(null);
  const clickTimer = useRef(null);
  const idleTimer = useRef(null);
  const interactionTimer = useRef(null);
  const idleIndex = useRef(0);
  const interactionIndex = useRef(0);
  const activeMovement = useRef('');
  const interactionActive = useRef(false);
  const motionSetRef = useRef(buildMotionSet([], config?.gender));
  const controlArmedRef = useRef(false);

  const [status, setStatus] = useState('loading');
  const [motion, setMotion] = useState('Idle');
  const [ready, setReady] = useState(false);
  const [controlArmed, setControlArmed] = useState(false);
  const [paused, setPaused] = useState(false);

  callback.current = onCapabilities;
  controlArmedRef.current = controlArmed;
  const url = companionModel(config);

  const playMotion = useCallback((nextMotion) => {
    if (!nextMotion?.url || !scene.current) return;
    scene.current.setPaused?.(false);
    setPaused(false);
    scene.current.play(nextMotion);
  }, []);

  const playIdle = useCallback(() => {
    const idles = motionSetRef.current.idles || [];
    if (!idles.length) return;
    const next = idles[idleIndex.current % idles.length];
    idleIndex.current += 1;
    playMotion(next);
  }, [playMotion]);

  useEffect(() => {
    let cancelled = false;
    loadAdminAnimations().then((rows) => {
      if (cancelled) return;
      motionSetRef.current = buildMotionSet(rows, config?.gender);
      if (ready && compact && !controlArmedRef.current) playIdle();
    });
    return () => { cancelled = true; };
  }, [config?.gender, compact, ready, playIdle]);

  useEffect(() => {
    setReady(false);
    setStatus('loading');
    setMotion('Idle');
    try {
      scene.current = createGenesisScene(
        mount.current,
        url,
        (caps) => {
          callback.current?.(caps);
          setReady(true);
          playMotion(motionSetRef.current.idles?.[0] || COMPANION_MOTIONS[0]);
        },
        (value, name) => {
          setStatus(value);
          if (name) setMotion(name);
        },
      );
      scene.current.appearance(config);
    } catch (error) {
      setStatus('error');
    }
    return () => {
      clearTimeout(clickTimer.current);
      clearTimeout(idleTimer.current);
      clearTimeout(interactionTimer.current);
      cancelAnimationFrame(movementFrame.current);
      scene.current?.dispose();
      scene.current = null;
    };
  }, [url, playMotion]);

  useEffect(() => { scene.current?.appearance(config); }, [config]);

  useEffect(() => {
    if (!compact || !ready || controlArmed || !interactive) {
      clearTimeout(idleTimer.current);
      return undefined;
    }
    const schedule = () => {
      clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => {
        if (!controlArmedRef.current && !interactionActive.current) playIdle();
        schedule();
      }, 7000 + Math.round(Math.random() * 5000));
    };
    schedule();
    return () => clearTimeout(idleTimer.current);
  }, [compact, ready, controlArmed, interactive, playIdle]);

  const movementForKeys = useCallback(() => {
    const keys = keyState.current;
    if (keys.w) return { direction: 'forward', x: 0, z: -1 };
    if (keys.s) return { direction: 'back', x: 0, z: 1 };
    if (keys.a) return { direction: 'left', x: -1, z: 0 };
    if (keys.d) return { direction: 'right', x: 1, z: 0 };
    return null;
  }, []);

  const syncMovementAnimation = useCallback(() => {
    const move = movementForKeys();
    if (!move) {
      if (activeMovement.current) {
        activeMovement.current = '';
        playIdle();
      }
      return;
    }
    const running = keyState.current.shift;
    const key = `${running ? 'run' : 'walk'}:${move.direction}`;
    if (activeMovement.current === key) return;
    activeMovement.current = key;
    playMotion(motionSetRef.current[running ? 'run' : 'walk']?.[move.direction]);
  }, [movementForKeys, playIdle, playMotion]);

  useEffect(() => {
    if (!interactive || !controlArmed) {
      keyState.current = { w: false, a: false, s: false, d: false, shift: false };
      activeMovement.current = '';
      cancelAnimationFrame(movementFrame.current);
      return undefined;
    }

    const typing = (target) => target instanceof Element && Boolean(target.closest('input,textarea,select,[contenteditable="true"]'));
    const onKeyDown = (event) => {
      if (typing(event.target)) return;
      const key = String(event.key || '').toLowerCase();
      if (!['w', 'a', 's', 'd', 'shift'].includes(key)) return;
      if (['w', 'a', 's', 'd'].includes(key)) event.preventDefault();
      keyState.current[key] = true;
      interactionActive.current = false;
      clearTimeout(interactionTimer.current);
      syncMovementAnimation();
    };
    const onKeyUp = (event) => {
      const key = String(event.key || '').toLowerCase();
      if (!['w', 'a', 's', 'd', 'shift'].includes(key)) return;
      keyState.current[key] = false;
      syncMovementAnimation();
    };

    const tick = () => {
      const move = movementForKeys();
      if (move && scene.current) {
        const distance = keyState.current.shift ? 0.075 : 0.04;
        scene.current.move?.(move.x, move.z, distance);
      }
      movementFrame.current = requestAnimationFrame(tick);
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    movementFrame.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      cancelAnimationFrame(movementFrame.current);
    };
  }, [interactive, controlArmed, movementForKeys, syncMovementAnimation]);

  useEffect(() => {
    if (interactive) return;
    setControlArmed(false);
    setPaused(false);
    interactionActive.current = false;
    scene.current?.setPaused?.(false);
  }, [interactive]);

  const armControls = useCallback(() => {
    if (!interactive || !ready) return;
    setControlArmed(true);
  }, [interactive, ready]);

  const friendlyInteraction = useCallback(() => {
    if (!interactive || !ready) return;
    setControlArmed(true);
    if (interactionActive.current) {
      const nextPaused = scene.current?.togglePaused?.() ?? false;
      setPaused(nextPaused);
      return;
    }
    const interactions = motionSetRef.current.interactions || [];
    if (!interactions.length) return;
    interactionActive.current = true;
    const next = interactions[interactionIndex.current % interactions.length];
    interactionIndex.current += 1;
    playMotion(next);
    clearTimeout(interactionTimer.current);
    interactionTimer.current = window.setTimeout(() => {
      interactionActive.current = false;
      setPaused(false);
      playIdle();
    }, 3600);
  }, [interactive, ready, playMotion, playIdle]);

  const handleClick = useCallback((event) => {
    if (!interactive) return;
    event.stopPropagation();
    clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(armControls, 190);
  }, [interactive, armControls]);

  const handleDoubleClick = useCallback((event) => {
    if (!interactive) return;
    event.preventDefault();
    event.stopPropagation();
    clearTimeout(clickTimer.current);
    friendlyInteraction();
  }, [interactive, friendlyInteraction]);

  return (
    <div
      className={compact ? `relative h-full w-full ${interactive ? 'cursor-pointer' : ''}` : 'genesis-preview-stage'}
      data-model-url={url}
      data-model-ready={ready}
      data-animation={status === 'ready' ? motion : status}
      data-avatar-controls={interactive ? (controlArmed ? 'armed' : 'available') : 'off'}
      data-avatar-paused={paused ? 'true' : 'false'}
      onClick={compact ? handleClick : undefined}
      onDoubleClick={compact ? handleDoubleClick : undefined}
      role={compact && interactive ? 'button' : undefined}
      tabIndex={compact && interactive ? 0 : undefined}
      aria-label={compact && interactive ? 'AI avatar. Click to enable movement; double-click to interact.' : undefined}
    >
      {!compact && <div className="genesis-stage-top"><span className="genesis-kicker">YOUR COMPANION / LIVE 3D</span><p>{config.name || 'A new beginning'} · {config.gender === 'female' ? 'Erika Archer' : 'White Y-Bot'}</p></div>}
      <div className={compact ? 'relative h-full w-full' : 'genesis-canvas'}>
        <div ref={mount} className="h-full w-full" />
        {(!ready || (compact && status === 'animation-loading')) && <span className="genesis-canvas-status" role="status">{status === 'error' ? '3D preview unavailable on this device' : 'Loading your companion…'}</span>}
      </div>
      {!compact && <div className="genesis-stage-bottom"><div className="genesis-motion-buttons"><button type="button" aria-label="Rotate left" disabled={!ready} onClick={() => scene.current.rotate(-Math.PI / 4)}><RotateCcw size={14} /></button>{COMPANION_MOTIONS.map((item) => <button type="button" key={item.name} disabled={!ready || status === 'animation-loading'} aria-pressed={motion === item.name} onClick={() => scene.current.play(item)}>{item.name}</button>)}<button type="button" aria-label="Rotate right" disabled={!ready} onClick={() => scene.current.rotate(Math.PI / 4)}><RotateCw size={14} /></button></div><p>{status === 'animation-error' ? 'This animation could not load. Try another.' : status === 'animation-loading' ? 'Loading movement…' : 'Drag to rotate · Scroll to zoom'}</p></div>}
    </div>
  );
}
