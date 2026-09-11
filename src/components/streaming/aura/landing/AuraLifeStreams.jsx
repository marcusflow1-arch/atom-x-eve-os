import { memo, useMemo, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { StreamCard } from '../../hub/DirectoryCards';
import { AURA_TOPICS, matchesAuraTopic } from './auraFrontPageModel';
import './auraLifeStreams.css';

export default memo(function AuraLifeStreams({ streams, samples, onWatch }) {
  const [topic, setTopic] = useState('all');
  const [expanded, setExpanded] = useState(false);
  const available = useMemo(() => {
    const real = streams.filter((stream) => matchesAuraTopic(stream, 'all'));
    const source = real.length ? real : samples;
    return source.filter((stream) => topic === 'all' || matchesAuraTopic(stream, topic));
  }, [streams, samples, topic]);
  const visible = available.slice(0, expanded ? 20 : 10);

  return <div className={`aura-life-directory ${expanded ? 'is-expanded' : ''}`}>
    <aside className="aura-life-filters" aria-label="Life stream filters">
      <span>Filter</span>
      <button type="button" aria-pressed={topic === 'all'} onClick={() => setTopic('all')}>All</button>
      {AURA_TOPICS.map((item) => <button type="button" key={item.id} aria-pressed={topic === item.id} onClick={() => setTopic(item.id)}>{item.title}</button>)}
    </aside>
    <span className="aura-life-divider" aria-hidden="true" />
    <div className="aura-life-streams">
      <div className="aura-life-toolbar"><span>{visible.length} live channels</span><button type="button" onClick={() => setExpanded((value) => !value)}>{expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}{expanded ? 'Restore view' : 'Full screen'}</button></div>
      {visible.length ? <div className="aura-life-grid">{visible.map((stream) => <StreamCard key={stream.id} stream={stream} onSelect={onWatch} />)}</div> : <p className="aura-life-empty">No live conversations match this filter.</p>}
    </div>
  </div>;
});