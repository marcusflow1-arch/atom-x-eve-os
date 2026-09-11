import { memo, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Radio } from 'lucide-react';
import { Artwork, moveRailFocus } from '../../hub/DirectoryCards';
import StreamMedia from '../../hub/StreamMedia';
import { formatCount } from '../../hub/discoveryModel';
import useAuraPreview from './useAuraPreview';

export default memo(function AuraSpotlight({ streams, onWatch, suspended, loading }) {
  const rootRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [paused, setPaused] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const active = streams.find((stream) => stream.id === selected) || streams[0];
  const index = Math.max(0, streams.indexOf(active));
  const playing = useAuraPreview(rootRef, suspended || paused);
  useEffect(() => {
    if (!playing || engaged || streams.length < 2) return;
    const timer = setTimeout(() => setSelected(streams[(index + 1) % streams.length].id), 9000);
    return () => clearTimeout(timer);
  }, [playing, engaged, streams, index]);
  const step = (direction) => setSelected(streams[(index + direction + streams.length) % streams.length].id);
  return <section ref={rootRef} className="console-hero aura-spotlight" aria-label="Featured live streams" aria-roledescription="carousel" onMouseEnter={() => setEngaged(true)} onMouseLeave={() => setEngaged(false)} onFocusCapture={() => setEngaged(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setEngaged(false); }}>
    {active && <StreamMedia key={active.id} url={playing ? active.previewUrl : ''} poster={active.thumbnail} title={`${active.name} preview`} preview active={playing} />}
    <div className="console-hero-side-fade" /><div className="console-hero-bottom-fade" />
    <div className="aura-spotlight-masthead"><span>AURA</span><span>THE LIVE EDITION <Radio size={12} /></span></div>
    <div className="console-hero-copy">
      <span className="console-eyebrow">In the spotlight / Right now</span>
      {active ? <><div className="console-live-badge">{active.isSample ? 'SAMPLE SPOTLIGHT' : 'LIVE'} <span>• {formatCount(active.viewers)} {active.isSample ? 'example viewers' : 'watching'}</span></div><h1>{active.title}</h1><div className="aura-spotlight-action"><div className="console-hero-creator"><Artwork key={active.avatar} src={active.avatar} avatar className="console-avatar" /><span><strong>{active.name}</strong><small>{active.game}</small></span></div><button type="button" className="console-watch-button" onClick={() => onWatch(active)}><Play size={15} fill="currentColor" />{active.isSample ? 'Preview template' : 'Watch Stream'}</button></div></> : <><h1>{loading ? 'Finding your next live moment.' : 'A world of moments. Yours to explore.'}</h1><p>{loading ? 'Connecting to live channels…' : 'Fresh perspectives, community moments, and your next favorite world. Live streams join the spotlight as creators go live.'}</p></>}
    </div>
    {streams.length > 1 && <><div className="aura-spotlight-previews" role="group" aria-label="Choose a spotlight preview" onKeyDown={moveRailFocus}>{streams.slice(0, 6).map((stream) => <button type="button" key={stream.id} aria-label={`Preview ${stream.name}: ${stream.title}`} aria-pressed={stream.id === active.id} onClick={() => setSelected(stream.id)}><Artwork key={stream.thumbnail} src={stream.thumbnail} /><span>{stream.name}</span></button>)}</div><div className="console-hero-controls"><span>{String(index + 1).padStart(2, '0')} <small>/ {String(streams.length).padStart(2, '0')}</small></span><button type="button" aria-label="Previous featured stream" onClick={() => step(-1)}><ChevronLeft size={17} /></button><button type="button" aria-label={paused ? 'Resume featured previews' : 'Pause featured previews'} aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? <Play size={14} /> : <Pause size={14} />}</button><button type="button" aria-label="Next featured stream" onClick={() => step(1)}><ChevronRight size={17} /></button></div></>}
  </section>;
});