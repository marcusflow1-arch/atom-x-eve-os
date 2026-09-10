import { memo, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight, Flame, Pause, Play } from 'lucide-react';
import { Artwork } from '../../hub/DirectoryCards';
import { formatCount } from '../../hub/discoveryModel';

export default memo(function HotTitlesShowcase({ games, onGame, suspended = false }) {
  const rootRef = useRef(null);
  const reduced = useReducedMotion();
  const [selectedId, setSelectedId] = useState(null);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(!document.hidden);
  const index = Math.max(0, games.findIndex((game) => game.id === selectedId));
  const active = games[index];
  const hasGames = games.length > 0;
  const running = games.length > 1 && !paused && !hovered && !focused && !reduced && !suspended && visible && tabVisible;
  const advance = (direction) => setSelectedId(games[(index + direction + games.length) % games.length]?.id || null);
  useEffect(() => {
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .25 });
    if (rootRef.current) observer?.observe(rootRef.current);
    const change = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', change);
    return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', change); };
  }, [hasGames]);
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => setSelectedId(games[(index + 1) % games.length].id), 8000);
    return () => clearTimeout(timer);
  }, [running, index, games]);
  if (!active) return null;

  return <section ref={rootRef} className="aura-hot-titles" aria-label="Hot Right Now games" aria-roledescription="carousel" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className="console-section-heading"><div><span className="console-eyebrow"><Flame size={12} />The games bringing people together</span><h2>Hot Right Now</h2></div><span className="aura-hot-caption">Ranked by live viewers</span></div>
    <div className="aura-hot-layout">
      <div className="aura-hot-feature">
        <div key={active.id} className="aura-hot-art"><Artwork key={active.image} src={active.image} /><div /></div>
        <div className="aura-hot-copy"><span className="aura-hot-rank">{String(index + 1).padStart(2, '0')} <small>/ HOT TITLE</small></span><h3>{active.title}</h3><p>{active.genre}</p><div className="aura-hot-metrics"><span><strong>{formatCount(active.viewers)}</strong>watching</span><span><strong>{formatCount(active.liveCount)}</strong>live channels</span></div><button type="button" className="console-watch-button" onClick={() => onGame(active)}>Explore live channels<ArrowUpRight size={17} /></button></div>
        {games.length > 1 && <div className="aura-hot-controls"><button type="button" className="console-icon-button" aria-label="Previous hot title" onClick={() => advance(-1)}><ChevronLeft size={17} /></button><button type="button" className="console-icon-button" aria-label={paused ? 'Resume hot title slideshow' : 'Pause hot title slideshow'} aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? <Play size={13} /> : <Pause size={13} />}</button><button type="button" className="console-icon-button" aria-label="Next hot title" onClick={() => advance(1)}><ChevronRight size={17} /></button></div>}
      </div>
      <div className="aura-hot-queue" role="group" aria-label="Choose a hot title">
        {games.map((game, position) => <button key={game.id} type="button" aria-label={`Preview ${game.title}`} aria-pressed={game.id === active.id} onClick={() => setSelectedId(game.id)}><span className="aura-hot-position">{String(position + 1).padStart(2, '0')}</span><Artwork key={game.image} src={game.image} /><span className="aura-hot-queue-copy"><strong>{game.title}</strong><small>{formatCount(game.viewers)} watching · {formatCount(game.liveCount)} live</small></span><ArrowUpRight size={15} /></button>)}
      </div>
    </div>
  </section>;
});
