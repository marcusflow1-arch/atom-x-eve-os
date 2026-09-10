import { useEffect, useRef, useState } from 'react';
import { Box, ChevronLeft, ChevronRight, Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react';

export default function SkillModelViewer({ card }) {
  const canvasRef = useRef(null), rootRef = useRef(null), runtime = useRef(null);
  const [status, setStatus] = useState(card.modelUrl ? 'loading' : 'empty');
  const [animated, setAnimated] = useState(false);
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [active, setActive] = useState(false);
  const activeRef = useRef(active), playingRef = useRef(playing);
  activeRef.current = active; playingRef.current = playing;
  useEffect(() => {
    let visible = false;
    const update = () => setActive(visible && !document.hidden);
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    if (rootRef.current) observer?.observe(rootRef.current);
    if (!observer) { visible = true; update(); }
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduce = () => { if (preference.matches) setPlaying(false); };
    preference.addEventListener('change', reduce); document.addEventListener('visibilitychange', update);
    return () => { observer?.disconnect(); preference.removeEventListener('change', reduce); document.removeEventListener('visibilitychange', update); };
  }, []);
  useEffect(() => {
    if (!card.modelUrl) return;
    let cancelled = false;
    import('./skillModelRuntime').then(({ createSkillPreview }) => {
      if (cancelled || !canvasRef.current) return;
      runtime.current = createSkillPreview(canvasRef.current, { url: card.modelUrl, animationClip: card.animationClip, onReady: ({ animated: hasAnimation }) => { if (!cancelled) { setAnimated(hasAnimation); setStatus('ready'); } }, onError: () => { if (!cancelled) setStatus('error'); } });
      runtime.current.setActive(activeRef.current); runtime.current.setPlaying(playingRef.current);
    }).catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; runtime.current?.dispose(); runtime.current = null; };
  }, [card.modelUrl, card.animationClip]);
  useEffect(() => { runtime.current?.setActive(active); }, [active]);
  useEffect(() => { runtime.current?.setPlaying(playing); }, [playing]);
  const onKey = (event) => {
    const action = { ArrowLeft: () => runtime.current?.rotate(-1), ArrowRight: () => runtime.current?.rotate(1), '+': () => runtime.current?.zoom(1), '-': () => runtime.current?.zoom(-1), Home: () => runtime.current?.reset() }[event.key];
    if (action) { event.preventDefault(); action(); }
  };
  return <figure ref={rootRef} className="collection-skill-model"><div className="collection-model-stage">
    {card.modelUrl && <canvas ref={canvasRef} tabIndex={status === 'ready' ? 0 : -1} onKeyDown={onKey} aria-label={`${card.name} interactive 3D model. Drag to rotate, scroll to zoom, or use the arrow keys.`} />}
    {status !== 'ready' && <div className="collection-media-placeholder" role="status"><Box size={27} /><strong>{status === 'loading' ? 'Loading skill model…' : status === 'error' ? 'This model couldn’t load.' : '3D preview coming into focus.'}</strong><span>{status === 'empty' ? 'No skill or item model has been linked to this card yet.' : status === 'error' ? 'The model may be unavailable or unsupported by this browser.' : 'Preparing the interactive view.'}</span></div>}
    {status === 'ready' && <div className="collection-model-controls" aria-label="3D model controls"><button type="button" aria-label="Rotate model left" onClick={() => runtime.current?.rotate(-1)}><ChevronLeft size={14} /></button><button type="button" aria-label="Rotate model right" onClick={() => runtime.current?.rotate(1)}><ChevronRight size={14} /></button><button type="button" aria-label="Zoom out model" onClick={() => runtime.current?.zoom(-1)}><Minus size={14} /></button><button type="button" aria-label="Zoom in model" onClick={() => runtime.current?.zoom(1)}><Plus size={14} /></button><button type="button" aria-label="Reset model view" onClick={() => runtime.current?.reset()}><RotateCcw size={14} /></button>{animated && <button type="button" aria-label={playing ? 'Pause skill animation' : 'Play skill animation'} onClick={() => setPlaying((value) => !value)}>{playing ? <Pause size={14} /> : <Play size={14} />}</button>}</div>}
  </div><figcaption><Box size={12} />3D skill / item preview<span>Drag to rotate · Scroll to zoom</span></figcaption></figure>;
}
