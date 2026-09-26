import Hi3DPlayerPreview from '@/components/dashboard/Hi3DPlayerPreview';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { COMPANION_MODELS, COMPANION_MOTIONS, companionModel } from '@/components/onboarding/genesisAssets';
import { createGenesisScene } from '@/components/onboarding/genesisScene';

let animationCatalogPromise = null;
let latestArtemisModelPromise = null;

function loadLatestArtemisModel() {
  if (!latestArtemisModelPromise) {
    latestArtemisModelPromise = base44.entities.Model3D.list('-created_date', 100)
      .then((rows) => (rows || []).find((row) =>
        /artemis/i.test(String(row?.name || '')) && /\.gl(?:b|tf)(?:\?|$)/i.test(String(row?.file_url || ''))
      ) || null)
      .catch(() => null);
  }
  return latestArtemisModelPromise;
}

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
    const matches = (row) => {
      const haystack = normalized(`${row.name || ''} ${row.tags || ''}`);
      return wanted.some((needle) => haystack.includes(needle));
    };
    return candidates.find((row) => normalized(row.folder) === preferredFolder && matches(row))
      || candidates.find(matches);
  };
  const asMotion = (row, fallback, options = {}) => row
    ? { name: options.name || row.name, url: row.file_url, loop: options.loop ?? row.is_loopable !== false }
    : { ...fallback, ...options };
  const friendlyRows = candidates
    .filter((row) => /wave|waving|hello|greet|happy|cheer|emotion|clap|salute/i.test(row.name || ''))
    .sort((a, b) => Number(normalized(b.folder) === preferredFolder) - Number(normalized(a.folder) === preferredFolder));

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
      asMotion(friendlyRows[0] || pick('standing idle 02 looking'), fallbackLook, { name: friendlyRows[0]?.name || 'Friendly Look', loop: false }),
      asMotion(friendlyRows[1] || pick('standing idle 03 examine'), fallbackLook, { name: friendlyRows[1]?.name || 'Curious Examine', loop: false }),
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
    showcase: [
      asMotion(pick('equip weapon bow', 'equip bow'), fallbackLook, { name: 'Equip Bow', loop: false }),
      asMotion(pick('standing draw arrow', 'draw arrow'), fallbackLook, { name: 'Draw Arrow', loop: false }),
      asMotion(pick('aim standing overdraw', 'aim overdraw'), fallbackLook, { name: 'Aim Bow', loop: true }),
      asMotion(pick('aim standing recoil', 'aim recoil'), fallbackLook, { name: 'Release Arrow', loop: false }),
      asMotion(pick('disarm weapon bow', 'stow bow'), fallbackLook, { name: 'Stow Bow', loop: false }),
      asMotion(pick('dodge standing forward', 'dodge forward'), fallbackLook, { name: 'Dodge', loop: false }),
      asMotion(pick('block standing', 'standing block'), fallbackLook, { name: 'Block', loop: false }),
      asMotion(pick('melee kick standing', 'melee kick'), fallbackLook, { name: 'Kick', loop: false }),
      asMotion(pick('jumping', 'standing dive forward'), COMPANION_MOTIONS[4] || fallbackLook, { name: 'Jump', loop: false }),
    ],
  };
}

function LegacyGenesisModelPreview({ config, onCapabilities, compact = false, interactive = false, idleOnly = compact, secondaryCharacter = null, initialYaw = 0, skillEffects = false }) {
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
  const [previewMotions, setPreviewMotions] = useState(COMPANION_MOTIONS);
  const [latestFemaleModelUrl, setLatestFemaleModelUrl] = useState('');

  callback.current = onCapabilities;
  controlArmedRef.current = controlArmed;
  const fixedFemaleIdle = config?.gender === 'female';
  const canonicalGetsugaMale = !fixedFemaleIdle;
  const canonicalUrl = companionModel(config);
  const url = fixedFemaleIdle && latestFemaleModelUrl ? latestFemaleModelUrl : canonicalUrl;

  useEffect(() => {
    if (!fixedFemaleIdle) {
      setLatestFemaleModelUrl('');
      return undefined;
    }
    let cancelled = false;
    loadLatestArtemisModel().then((model) => {
      if (!cancelled && model?.file_url) setLatestFemaleModelUrl(model.file_url);
    });
    return () => { cancelled = true; };
  }, [fixedFemaleIdle]);

  const playMotion = useCallback((nextMotion) => {
    if (!nextMotion?.url || !scene.current) return;
    scene.current.setPaused?.(false);
    setPaused(false);
    scene.current.play(nextMotion);
  }, []);

  const playIdle = useCallback(() => {
    if (canonicalGetsugaMale) {
      scene.current?.getsugaIdle?.();
      return;
    }
    // Artemis now owns an authored embedded idle/combat state machine. Female
    // previews use that package directly instead of retargeting an Admin FBX.
    if (fixedFemaleIdle) {
      scene.current?.artemisIdle?.();
      return;
    }
    const idles = motionSetRef.current.idles || [];
    if (!idles.length) return;
    const next = idles[idleIndex.current % idles.length];
    idleIndex.current += 1;
    playMotion(next);
  }, [canonicalGetsugaMale, fixedFemaleIdle, playMotion]);

  useEffect(() => {
    if (canonicalGetsugaMale) {
      setPreviewMotions([]);
      return undefined;
    }
    let cancelled = false;
    loadAdminAnimations().then((rows) => {
      if (cancelled) return;
      motionSetRef.current = buildMotionSet(rows, config?.gender);
      const set = motionSetRef.current;
      setPreviewMotions(
        config?.gender === 'female'
          ? [COMPANION_MOTIONS[0]]
          : [...(set.idles || []).slice(0, 3), ...(set.showcase || [])].filter((item, index, items) => item?.url && items.findIndex((candidate) => candidate.name === item.name) === index)
      );
      if (ready && !controlArmedRef.current) playIdle();
    });
    return () => { cancelled = true; };
  }, [config?.gender, compact, ready, playIdle, canonicalGetsugaMale]);

  useEffect(() => {
    setReady(false);
    setStatus('loading');
    setMotion('Idle');
    if (!url) return undefined;
    try {
      scene.current = createGenesisScene(
        mount.current,
        url,
        (caps) => {
          callback.current?.(caps);
          setReady(true);
          if (canonicalGetsugaMale) scene.current?.getsugaIdle?.();
          else if (fixedFemaleIdle) scene.current?.artemisIdle?.();
          else playMotion(motionSetRef.current.idles?.[0] || COMPANION_MOTIONS[0]);
        },
        (value, name) => {
          setStatus(value);
          if (name) setMotion(name);
        },
        {
          secondaryCharacter,
          // Female Artemis ships as one skinned GLB with its own idle, bow
          // transitions, combat idle and three authored skill animations.
          safeRigidIdle: fixedFemaleIdle,
          retargetExternalMotions: false,
          framingOffsetY: fixedFemaleIdle ? 0.16 : 0,
          initialYaw,
          skillEffects,
          getsugaMale: canonicalGetsugaMale,
          artemisFemale: fixedFemaleIdle,
          lockRootTranslation: false,
          lockModelPosition: fixedFemaleIdle,
        },
      );
      scene.current.appearance(config);
    } catch {
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
  }, [url, playMotion, fixedFemaleIdle, canonicalGetsugaMale, initialYaw, skillEffects, secondaryCharacter?.modelUrl, secondaryCharacter?.animationUrl, secondaryCharacter?.animationName]);

  useEffect(() => { scene.current?.appearance(config); }, [config]);

  useEffect(() => {
    if (idleOnly || !compact || !ready || controlArmed) {
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
  }, [compact, ready, controlArmed, playIdle, idleOnly]);

  const movementForKeys = useCallback(() => {
    const keys = keyState.current;
    if (keys.w) return { direction: 'forward', x: 0, z: -1 };
    if (keys.s) return { direction: 'back', x: 0, z: 1 };
    if (keys.a) return { direction: 'left', x: -1, z: 0 };
    if (keys.d) return { direction: 'right', x: 1, z: 0 };
    return null;
  }, []);

  const syncMovementAnimation = useCallback(() => {
    if (fixedFemaleIdle || canonicalGetsugaMale) {
      activeMovement.current = '';
      if (!movementForKeys()) playIdle();
      return;
    }
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
  }, [fixedFemaleIdle, canonicalGetsugaMale, movementForKeys, playIdle, playMotion]);

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
    if (!interactive || !ready || fixedFemaleIdle || canonicalGetsugaMale) return;
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
  }, [interactive, ready, fixedFemaleIdle, canonicalGetsugaMale, playMotion, playIdle]);

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
      onClick={compact && !idleOnly ? handleClick : undefined}
      onDoubleClick={compact && !idleOnly ? handleDoubleClick : undefined}
      role={compact && interactive ? 'button' : undefined}
      tabIndex={compact && interactive ? 0 : undefined}
      aria-label={compact && interactive ? 'AI avatar. Click to enable movement; double-click to interact.' : undefined}
    >
      {!compact && <div className="genesis-stage-top"><span className="genesis-kicker">YOUR CHARACTER / LIVE 3D</span><p>{config.name || 'A new beginning'} · {config.face_scan_generated ? 'Personal likeness' : (COMPANION_MODELS[config.gender || 'male']?.name || 'Luna AI body')}</p></div>}
      <div className={compact ? 'relative h-full w-full' : 'genesis-canvas'}>
        <div ref={mount} className="h-full w-full" />
        {(!ready || (compact && status === 'animation-loading')) && <span className="genesis-canvas-status" role="status">{status === 'error' ? '3D preview unavailable on this device' : 'Loading your companion…'}</span>}
      </div>
      {!compact && <div className="genesis-stage-bottom"><div className="genesis-motion-buttons"><button type="button" aria-label="Rotate left" disabled={!ready} onClick={() => scene.current.rotate(-Math.PI / 4)}><RotateCcw size={14} /></button>{previewMotions.map((item) => <button type="button" key={`${item.name}-${item.url}`} disabled={!ready || status === 'animation-loading'} aria-pressed={motion === item.name} onClick={() => scene.current.play(item)}>{item.name}</button>)}<button type="button" aria-label="Rotate right" disabled={!ready} onClick={() => scene.current.rotate(Math.PI / 4)}><RotateCw size={14} /></button></div><p>{status === 'animation-error' ? 'This animation could not load. Try another.' : status === 'animation-loading' ? 'Loading movement…' : 'Drag to rotate · Scroll to zoom'}</p></div>}
    </div>
  );
}

export default function GenesisModelPreview(props){const url=companionModel(props.config);if(url.includes('/models/luna-hi3d/'))return <div className={props.compact?'h-full w-full':'genesis-preview-stage'} style={props.compact?undefined:{minHeight:540,height:'70vh'}}><Hi3DPlayerPreview {...props} interactive={props.interactive||!props.compact}/></div>;return <LegacyGenesisModelPreview {...props}/>;}
