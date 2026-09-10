import { memo, useId, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { moveRailFocus, StreamCard } from '../../hub/DirectoryCards';

export default memo(function AuraChannelRail({ title, eyebrow, description, streams, onWatch, onBrowse }) {
  const railRef = useRef(null);
  const labelId = useId();
  const reduced = useReducedMotion();
  if (!streams.length) return null;
  const scroll = (direction) => railRef.current?.scrollBy({ left: direction * railRef.current.clientWidth * .85, behavior: reduced ? 'auto' : 'smooth' });
  return <section className="aura-channel-section" aria-labelledby={labelId}>
    <div className="console-section-heading">
      <div><span className="console-eyebrow">{eyebrow}</span><h2 id={labelId}>{title}</h2>{description && <p className="aura-section-description">{description}</p>}</div>
      <div className="aura-section-actions">
        <button type="button" className="console-text-button" onClick={onBrowse}>View all<ArrowRight size={15} /></button>
        <div className="console-rail-controls"><button type="button" className="console-icon-button" aria-label={`Previous ${title} channels`} onClick={() => scroll(-1)}><ChevronLeft size={18} /></button><button type="button" className="console-icon-button" aria-label={`Next ${title} channels`} onClick={() => scroll(1)}><ChevronRight size={18} /></button></div>
      </div>
    </div>
    <div ref={railRef} className="console-stream-rail" onKeyDown={moveRailFocus}>{streams.map((stream) => <StreamCard key={stream.id} stream={stream} onSelect={onWatch} />)}</div>
  </section>;
});
