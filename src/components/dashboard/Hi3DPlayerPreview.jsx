import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {avatarAnimationStore} from '@/components/onboarding/avatarAnimationStore';
import { createGenesisScene } from '@/components/onboarding/genesisScene';
import { HI3D_COMMANDS, HI3D_MODEL_URL } from '@/components/onboarding/embeddedAvatarController';

export default function Hi3DPlayerPreview({ config, interactive = false, portrait = false, controls = "none", idleOnly = controls == "none", onCapabilities }) {
  const mount = useRef(null), stage = useRef(null), scene = useRef(null);
  const keys = useRef(new Set()), lastInput = useRef(Date.now());
  const [status, setStatus] = useState('loading'), [clip, setClip] = useState('Idle');
  const [ready, setReady] = useState(false), [armed, setArmed] = useState(false);
  const shared=useSyncExternalStore(avatarAnimationStore.subscribe,avatarAnimationStore.getSnapshot);
  const {paused,armLift}=shared;const [retry,setRetry]=useState(0);const callback=useRef(onCapabilities);callback.current=onCapabilities;

  const command=useCallback(value=>avatarAnimationStore.command(value),[]);
  useEffect(() => {
    setReady(false); setStatus('loading');
    try {
      scene.current = createGenesisScene(mount.current, HI3D_MODEL_URL+'?v=3', caps=>{callback.current?.(caps);setReady(true);}, (value, name) => {
        setStatus(value); if (name) setClip(name);
      }, {portrait});
      scene.current.appearance({ ...(config || {}), style_preset: config?.style_preset || 'heroic_fantasy' });
    } catch { setStatus('error'); }
    return ()=>{scene.current?.dispose();scene.current=null;};
  },[retry,portrait]);
  useEffect(()=>{if(ready)scene.current?.command(idleOnly ? "idle" : shared.command);},[ready,shared.revision,idleOnly]);
  useEffect(()=>{if(!idleOnly&&ready&&(shared.armLift||scene.current?.animationState()?.armLift))scene.current?.setArmLift(shared.armLift);},[ready,shared.armLift,idleOnly]);
  useEffect(()=>{scene.current?.setPaused((!idleOnly&&shared.paused)||shared.hidden);},[ready,shared.paused,shared.hidden,shared.revision,shared.armLift,idleOnly]);
  useEffect(() => { scene.current?.appearance({ ...(config || {}), style_preset: config?.style_preset || 'heroic_fantasy' }); }, [config]);

  useEffect(() => {
    const held = keys.current;
    if (idleOnly || !interactive || !armed || !ready) { held.clear(); return undefined; }
    const typing = target => target instanceof Element && Boolean(target.closest('input,textarea,select,[contenteditable="true"]'));
    const sync = () => command(held.size ? 'walk' : 'idle');
    const down = event => {
      if (!stage.current?.contains(document.activeElement) || typing(event.target) || !['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) return;
      event.preventDefault();
      const key = event.key.toLowerCase(); if (!held.has(key)) { held.add(key); sync(); }
    };
    const up = event => { if (held.delete(event.key.toLowerCase())) sync(); };
    const blur = () => { if (held.size) { held.clear(); command('idle'); } };
    let frame, previous;
    const tick = now => {
      const dt = previous == null ? 0 : Math.min((now - previous) / 1000, .05); previous = now;
      let x = Number(held.has('d')) - Number(held.has('a')), z = Number(held.has('s')) - Number(held.has('w'));
      const length = Math.hypot(x, z);
      if (length) { x /= length; z /= length; scene.current?.move(x, z, dt * .50); }
      frame = requestAnimationFrame(tick);
    };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur);
      blur();
    };
  }, [interactive, armed, ready, command, idleOnly]);

  useEffect(() => { if (!interactive) setArmed(false); }, [interactive]);
  const focusPlayer = () => { if (!idleOnly && interactive && ready) { setArmed(true); stage.current?.focus(); } };
  const animationState = scene.current?.animationState();
  const armEnabled = ready && animationState?.posture === 'standing' && !animationState?.transitioning;

  return <div ref={stage} className="relative h-full w-full outline-none" tabIndex={interactive ? 0 : undefined}
    data-model-url={HI3D_MODEL_URL} data-model-ready={ready} data-animation={clip} data-avatar-controls={armed ? 'armed' : 'available'}
    aria-label="Hi3D player character" onClick={focusPlayer} onDoubleClick={() => { if (!idleOnly && interactive && ready) { focusPlayer(); command('wave'); } }}
    onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); focusPlayer(); } }}>
    <div ref={mount} className="h-full w-full" />
    {status === 'error' ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-xs text-white/80" role="alert">
      <p>The character could not load.</p><button type="button" className="rounded border border-white/20 px-3 py-2" onClick={() => setRetry(value => value + 1)}>Retry</button>
    </div> : !ready && <p className="pointer-events-none absolute inset-x-0 top-1/2 text-center text-xs text-white/70" role="status">Loading your Hi3D character…</p>}
    {!idleOnly && controls !== "none" && <div data-player-animation-controls className="pointer-events-auto absolute bottom-3 left-1/2 z-30 max-h-[42%] w-[min(92%,560px)] -translate-x-1/2 overflow-y-auto rounded-xl border border-cyan-200/15 bg-slate-950/85 p-3 text-white backdrop-blur-md"
      onClick={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}>
      <div className="flex flex-wrap justify-center gap-1.5" aria-label="Character animations">
        {(interactive?HI3D_COMMANDS:HI3D_COMMANDS.filter(item=>item.command==='wave')).map(item => <button key={item.command} type="button" disabled={!ready} aria-pressed={animationState?.command === item.command}
          className="rounded-md border border-white/15 px-2.5 py-1.5 text-xs transition hover:bg-white/10 focus-visible:outline focus-visible:outline-cyan-300 disabled:opacity-40 aria-pressed:border-cyan-300/60 aria-pressed:bg-cyan-300/10"
          onClick={() => command(item.command)}>{item.command==='wave'?'Wave hello':item.label}</button>)}
        <button type="button" disabled={!ready} aria-pressed={paused} className="rounded-md border border-white/15 px-2.5 py-1.5 text-xs" onClick={()=>avatarAnimationStore.setPaused(!paused)}>{paused ? 'Resume' : 'Pause'}</button>
        <button type="button" disabled={!ready} aria-pressed={shared.cycling} className="rounded-md border border-white/15 px-2 py-1 text-xs" onClick={()=>avatarAnimationStore.setCycling(!shared.cycling)}>Cycle {shared.cycling?'on':'off'}</button>
      </div>
      {interactive && <label className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">Right arm
        <input aria-label="Raise right arm" type="range" min="0" max="1" step="0.01" value={armLift} disabled={!armEnabled} className="w-24 max-w-full min-w-0 accent-cyan-300 disabled:opacity-30"
          onChange={event => { const value = Number(event.target.value); avatarAnimationStore.setArmLift(value); }} />
        <output>{Math.round(armLift * 100)}%</output>
      </label>}
      {interactive && <p className="mt-2 text-center text-[10px] text-slate-400">Click character, then WASD to move · Double-click to wave · Drag to rotate</p>}
    </div>}
  </div>;
}
