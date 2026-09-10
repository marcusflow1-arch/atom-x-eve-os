import { memo, useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Artwork } from '../../hub/DirectoryCards';
import { formatCount } from '../../hub/discoveryModel';
import { AURA_TOPICS, matchesAuraTopic } from './auraFrontPageModel';

export default memo(function AuraTopics({ streams, onBrowse }) {
  const topics = useMemo(() => AURA_TOPICS.map((topic) => ({ ...topic, streams: streams.filter((stream) => matchesAuraTopic(stream, topic.id)).sort((a, b) => b.viewers - a.viewers) })), [streams]);
  return <div className="aura-topic-grid">{topics.map((topic) => <button type="button" key={topic.id} className="aura-topic-card" style={{ '--topic-accent': topic.accent }} onClick={() => onBrowse({ topic: topic.id })}><span className="aura-topic-tag">{topic.tag}<ArrowUpRight size={17} /></span><h3>{topic.title}</h3><p>{topic.description}</p><div className="aura-topic-activity"><span className="aura-topic-avatars">{topic.streams.slice(0, 3).map((stream) => <Artwork key={`${stream.id}:${stream.avatar}`} src={stream.avatar} avatar className="console-avatar" />)}</span><small>{topic.streams.length ? `${formatCount(topic.streams.length)} live · ${formatCount(topic.streams.reduce((sum, stream) => sum + stream.viewers, 0))} watching` : 'Explore this conversation'}</small></div></button>)}</div>;
});
