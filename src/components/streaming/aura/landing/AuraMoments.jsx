import { memo, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, VolumeX } from 'lucide-react';
import { Artwork, moveRailFocus } from '../../hub/DirectoryCards';
import { formatCount } from '../../hub/discoveryModel';
import StreamMedia from '../../hub/StreamMedia';
import useAuraPreview from './useAuraPreview';

export default memo(function AuraMoments({ moments, loading, suspended, onRead, onPreviewChange }) {
  const railRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const reduced = useReducedMotion();
  const canPreview = useAuraPreview(railRef, suspended);
  const active = canPreview && moments.some((moment) => moment.id === preview) ? preview : null;
  useEffect(() => { onPreviewChange(Boolean(active)); return () => onPreviewChange(false); }, [active, onPreviewChange]);
  const scroll = (direction) => railRef.current?.scrollBy({ left: railRef.current.clientWidth * direction * .8, behavior: reduced ? 'auto' : 'smooth' });
  return <>
    <div className="aura-reel-toolbar"><span><VolumeX size={13} />Hover or focus for a silent preview</span><div className="console-rail-controls"><button type="button" className="console-icon-button" aria-label="Previous moments" onClick={() => scroll(-1)}><ChevronLeft size={17} /></button><button type="button" className="console-icon-button" aria-label="Next moments" onClick={() => scroll(1)}><ChevronRight size={17} /></button></div></div>
    <div ref={railRef} className="aura-moments-rail" onKeyDown={moveRailFocus} onScroll={() => setPreview(null)}>
      {moments.map((moment) => <button type="button" key={moment.id} className="aura-moment-card" onMouseEnter={() => setPreview(moment.id)} onMouseLeave={() => setPreview(null)} onFocus={() => setPreview(moment.id)} onBlur={() => setPreview(null)} onClick={() => { setPreview(null); onRead(moment); }} aria-label={`Watch moment: ${moment.title}`}><div className="aura-moment-art"><Artwork key={moment.image} src={moment.image} />{active === moment.id && <StreamMedia url={moment.url} poster={moment.image} title={`${moment.title} preview`} preview />}<span className="aura-moment-play"><Play size={16} fill="currentColor" /></span><span className="aura-moment-duration">{moment.duration}</span></div><small>{moment.label}</small><strong>{moment.title}</strong><span className="aura-moment-views">{formatCount(moment.views)} views</span></button>)}
    </div>
    {!moments.length && <div className="aura-section-empty" role="status"><Play size={20} /><div><h3>{loading ? 'Finding moments worth replaying…' : 'The next great moment is coming.'}</h3><p>Public clips up to three minutes long appear here, ready to replay.</p></div></div>}
  </>;
});
