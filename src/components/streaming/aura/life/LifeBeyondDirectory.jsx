import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import useLiveDirectory from '../../hub/useLiveDirectory';
import { StreamCard } from '../../hub/DirectoryCards';
import ChannelPlayback from '../../hub/ChannelPlayback';
import AuraDailyReader from '../landing/AuraDailyReader';
import auraSampleContent, { auraSampleStory } from '../landing/auraSampleContent';
import { AURA_TOPICS, matchesAuraTopic } from '../landing/auraFrontPageModel';
import './lifeBeyondDirectory.css';

const STYLES = [['all', 'All styles'], ['conversational', 'Conversational'], ['educational', 'Educational'], ['relaxed', 'Relaxed'], ['interactive', 'Interactive']];
const SORTS = [['trending', 'Trending'], ['viewers', 'Most watching'], ['newest', 'Just started']];
const styleMatches = (stream, style) => {
  if (style === 'all') return true;
  if (stream.style) return stream.style === style;
  const text = [stream.mode, stream.category, stream.game, ...(stream.tags || []), ...(stream.broadcastTags || [])].join(' ').toLowerCase();
  const terms = { conversational: ['chat', 'talking', 'philosophy', 'faith'], educational: ['science', 'technology', 'world', 'education'], relaxed: ['irl', 'faith', 'cozy', 'relaxed'], interactive: ['interactive', 'community', 'discussion', 'questions'] };
  return terms[style].some((term) => text.includes(term));
};

export default function LifeBeyondDirectory() {
  const directory = useLiveDirectory();
  const samples = useMemo(() => auraSampleContent(Date.now()).creators, []);
  const [topic, setTopic] = useState('all'), [style, setStyle] = useState('all'), [sort, setSort] = useState('trending'), [search, setSearch] = useState('');
  const [watching, setWatching] = useState(null), [story, setStory] = useState(null);
  const rows = useMemo(() => {
    const real = directory.channels.filter((stream) => matchesAuraTopic(stream, 'all'));
    const query = search.trim().toLowerCase();
    return (real.length ? real : samples).filter((stream) => (topic === 'all' || matchesAuraTopic(stream, topic)) && styleMatches(stream, style) && (!query || [stream.name, stream.title, stream.game, stream.category, ...(stream.tags || [])].join(' ').toLowerCase().includes(query))).sort((a, b) => sort === 'newest' ? (b.startedAt || 0) - (a.startedAt || 0) : sort === 'viewers' ? b.viewers - a.viewers : (b.viewers * 2 + (b.startedAt || 0) / 1e12) - (a.viewers * 2 + (a.startedAt || 0) / 1e12));
  }, [directory.channels, samples, search, sort, style, topic]);
  const watch = (stream) => stream.isSample ? setStory(auraSampleStory(stream)) : setWatching(stream);

  return <main className="life-beyond-page console-hub">
    <header className="life-beyond-hero"><span>THE REAL LIFE DIRECTORY</span><h1>Life beyond the game.</h1><p>Find live conversations, new perspectives, and communities built around the world outside play.</p></header>
    <div className="life-beyond-controls"><label><Search size={17} /><input aria-label="Search Life Beyond channels" placeholder="Search channels, titles, topics, or tags" value={search} onChange={(event) => setSearch(event.target.value)} /></label><div role="group" aria-label="Sort live streams">{SORTS.map(([id, label]) => <button key={id} type="button" aria-pressed={sort === id} onClick={() => setSort(id)}>{label}</button>)}</div></div>
    <div className="life-beyond-style-row" role="group" aria-label="Stream style filters">{STYLES.map(([id, label]) => <button key={id} type="button" aria-pressed={style === id} onClick={() => setStyle(id)}>{label}</button>)}</div>
    <div className="life-beyond-directory"><aside aria-label="Life topics"><span>Topics</span><button type="button" aria-pressed={topic === 'all'} onClick={() => setTopic('all')}>All topics</button>{AURA_TOPICS.map((item) => <button type="button" key={item.id} aria-pressed={topic === item.id} onClick={() => setTopic(item.id)}>{item.title}<small>{item.description}</small></button>)}</aside><section><div className="life-beyond-results"><strong>{rows.length} live channels</strong><span>{directory.isPending ? 'Finding broadcasts…' : 'Updated live'}</span></div>{rows.length ? <div className="life-beyond-grid">{rows.map((stream) => <StreamCard key={stream.id} stream={stream} onSelect={watch} />)}</div> : <div className="life-beyond-empty">No live conversations match these filters.</div>}</section></div>
    {watching && <ChannelPlayback stream={watching} onClose={() => setWatching(null)} />}{story && <AuraDailyReader story={story} onClose={() => setStory(null)} />}
  </main>;
}