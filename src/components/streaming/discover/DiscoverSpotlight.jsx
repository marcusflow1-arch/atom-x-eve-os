import { memo, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, Sparkles } from 'lucide-react';
import { Artwork } from '../hub/DirectoryCards';
import { channelHref, formatCount } from '../hub/discoveryModel';
import { creatorReason } from './creatorDiscoveryModel';

export default memo(function DiscoverSpotlight({ creators, onMeet, now, suspended = false }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const [selectedId, setSelectedId] = useState(null);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(!document.hidden);
  const index = Math.max(0, creators.findIndex((creator) => creator.id === selectedId));
  const creator = creators[index];
  const hasCreators = creators.length > 0;
  const playing = creators.length > 1 && !paused && !hovered && !focused && !reduced && !suspended && visible && tabVisible;
  useEffect(() => {
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .25 });
    if (ref.current) observer?.observe(ref.current);
    const change = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', change);
    return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', change); };
  }, [hasCreators]);
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setSelectedId(creators[(index + 1) % creators.length].id), 10000);
    return () => clearTimeout(timer);
  }, [playing, index, creators]);
  if (!creator) return null;
  const advance = (direction) => setSelectedId(creators[(index + direction + creators.length) % creators.length].id);

  return <section ref={ref} className="discover-spotlight" aria-label="Today's creator picks" aria-roledescription="carousel" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className="discover-spotlight-heading"><div><span className="console-eyebrow"><Sparkles size={12} />Today's discoveries</span><p>A daily rotation of new and smaller live channels.</p></div>{creators.length > 1 && <div className="discover-slide-controls"><span>{String(index + 1).padStart(2, '0')}<small> / {String(creators.length).padStart(2, '0')}</small></span><button type="button" aria-label="Previous creator pick" onClick={() => advance(-1)}><ChevronLeft size={17} /></button><button type="button" aria-label={paused ? 'Resume creator picks' : 'Pause creator picks'} aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? <Play size={12} /> : <Pause size={12} />}</button><button type="button" aria-label="Next creator pick" onClick={() => advance(1)}><ChevronRight size={17} /></button></div>}</div>
    <div className="discover-spotlight-body">
      <div key={creator.id} className="discover-spotlight-art"><Artwork key={creator.thumbnail} src={creator.thumbnail} /><div className="discover-spotlight-vignette" /><span className="discover-live"><i />LIVE · {formatCount(creator.viewers)} watching</span><span className="discover-feature-game">{creator.game}</span></div>
      <div className="discover-spotlight-copy"><div className="discover-creator-heading"><Artwork key={creator.avatar} src={creator.avatar} avatar className="console-avatar" /><div><span className="discover-reason">{creatorReason(creator, now)}</span><h2>{creator.name}</h2></div></div><p className="discover-spotlight-bio">{creator.tagline || creator.bio || creator.title}</p><div className="discover-tag-list">{creator.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div><div className="discover-spotlight-actions"><button type="button" className="discover-primary" onClick={() => onMeet(creator)}>Meet {creator.name}<ArrowUpRight size={16} /></button><Link to={channelHref(creator)} className="console-text-button">Watch stream<Play size={12} /></Link></div></div>
    </div>
  </section>;
});
