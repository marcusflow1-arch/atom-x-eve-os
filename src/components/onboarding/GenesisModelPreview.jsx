import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';
import { COMPANION_MOTIONS, companionModel } from '@/components/onboarding/genesisAssets';
import { createGenesisScene } from '@/components/onboarding/genesisScene';
export default function GenesisModelPreview({ config, onCapabilities, compact = false }) {
  const mount = useRef(null), scene = useRef(null), callback = useRef(onCapabilities);
  const [status, setStatus] = useState('loading'), [motion, setMotion] = useState('Idle'), [ready, setReady] = useState(false);
  callback.current = onCapabilities;
  const url = companionModel(config);
  useEffect(() => {
    setReady(false); setStatus('loading'); setMotion('Idle');
    try { scene.current = createGenesisScene(mount.current,url,caps => { callback.current?.(caps); setReady(true); scene.current.play(COMPANION_MOTIONS[0]); }, (value,name) => {setStatus(value);if(name)setMotion(name);}); scene.current.appearance(config); }
    catch(error) { setStatus('error'); }
    return () => { scene.current?.dispose(); scene.current=null; };
  },[url]);
  useEffect(() => {scene.current?.appearance(config);},[config]);
  return <div className={compact ? 'relative h-full w-full' : 'genesis-preview-stage'} data-model-url={url} data-model-ready={ready} data-animation={status === 'ready' ? motion : status}>
    {!compact && <div className="genesis-stage-top"><span className="genesis-kicker">YOUR COMPANION / LIVE 3D</span><p>{config.name || 'A new beginning'} · {config.gender === 'female' ? 'Erika Archer' : 'White Y-Bot'}</p></div>}
    <div className={compact ? 'relative h-full w-full' : 'genesis-canvas'}><div ref={mount} className="h-full w-full" />{(!ready || (compact && status === 'animation-loading')) && <span className="genesis-canvas-status" role="status">{status === 'error' ? '3D preview unavailable on this device' : 'Loading your companion…'}</span>}</div>
    {!compact && <div className="genesis-stage-bottom"><div className="genesis-motion-buttons"><button type="button" aria-label="Rotate left" disabled={!ready} onClick={() => scene.current.rotate(-Math.PI/4)}><RotateCcw size={14}/></button>{COMPANION_MOTIONS.map(m => <button type="button" key={m.name} disabled={!ready || status === 'animation-loading'} aria-pressed={motion === m.name} onClick={() => scene.current.play(m)}>{m.name}</button>)}<button type="button" aria-label="Rotate right" disabled={!ready} onClick={() => scene.current.rotate(Math.PI/4)}><RotateCw size={14}/></button></div><p>{status === 'animation-error' ? 'This animation could not load. Try another.' : status === 'animation-loading' ? 'Loading movement…' : 'Drag to rotate · Scroll to zoom'}</p></div>}
  </div>;
}