import { memo, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, Radio } from 'lucide-react';
import StreamMedia from './StreamMedia';
import { Artwork } from './DirectoryCards';
import { formatCount } from './discoveryModel';

export default memo(function FeaturedStreams({ streams, onWatch, suspended, loading, title = 'Aura' }) {
  const reduced = useReducedMotion();
  const rootRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(!document.hidden);
  const active = streams[index % Math.max(1, streams.length)];
  const playing = !paused && !engaged && !reduced && !suspended && visible && tabVisible;
  useEffect(() => {
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    if (rootRef.current) observer?.observe(rootRef.current);
    const change = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', change);
    return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', change); };
  }, []);
  useEffect(() => {
    if (!playing || streams.length < 2) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % streams.length), 9000);
    return () => clearInterval(timer);
  }, [playing, streams.length]);
  return <section ref={rootRef} className="console-hero" aria-label="Featured live streams" aria-roledescription="carousel" onMouseEnter={() => setEngaged(true)} onMouseLeave={() => setEngaged(false)} onFocusCapture={() => setEngaged(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setEngaged(false); }}>
    {active && <StreamMedia key={active.id} url={active.previewUrl} poster={active.thumbnail} title={`${active.name} preview`} preview active={playing} />}
    <div className="console-hero-side-fade" /><div className="console-hero-bottom-fade bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
    <div className="console-hero-copy">
      <div className="console-eyebrow"><Radio size={14} />{title} / Live discovery</div>
      {active ? <><div className="console-live-badge">LIVE <span>• {formatCount(active.viewers)} watching</span></div><h1>{active.title}</h1><div className="console-hero-creator"><Artwork key={active.avatar} src={active.avatar} avatar className="console-avatar" /><span><strong>{active.name}</strong><small>{active.game}</small></span></div><button className="console-watch-button" type="button" onClick={() => onWatch(active)}><Play size={17} fill="currentColor" />Watch Stream</button></> : <><h1>{loading ? 'Finding your next live moment.' : 'Find your people. Press play.'}</h1><p>{loading ? 'Loading live channels…' : 'Explore the games below. Live broadcasts appear here as creators go live.'}</p></>}
    </div>
    {streams.length > 1 && <div className="console-hero-controls"><span>{String(index % streams.length + 1).padStart(2, '0')} <small>/ {String(streams.length).padStart(2, '0')}</small></span><button type="button" aria-label="Previous featured stream" onClick={() => setIndex((value) => (value - 1 + streams.length) % streams.length)}><ChevronLeft size={18} /></button><button type="button" aria-label={paused ? 'Resume featured previews' : 'Pause featured previews'} aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? <Play size={15} /> : <Pause size={15} />}</button><button type="button" aria-label="Next featured stream" onClick={() => setIndex((value) => (value + 1) % streams.length)}><ChevronRight size={18} /></button></div>}
  </section>;
});
