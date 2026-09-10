import { useCallback, useDeferredValue, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import useLiveDirectory from './useLiveDirectory';
import { selectChannels } from './discoveryModel';
import { GameCard, moveRailFocus, StreamCard } from './DirectoryCards';
import DirectoryGrid from './DirectoryGrid';
import FeaturedStreams from './FeaturedStreams';
import ChannelPlayback from './ChannelPlayback';
import './consoleHub.css';

const SORTS = [['trending', 'Trending'], ['watching', 'Most Watching'], ['new', 'New Streamers'], ['games', 'New Games']];
const TAGS = ['Speedrun', 'Tournament', 'Competitive', 'Casual', 'Ranked'];

export default function LiveDiscoveryHub({ title = 'Aura' }) {
  const directory = useLiveDirectory();
  const scrollRef = useRef(null);
  const railRef = useRef(null);
  const resultsRef = useRef(null);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [sort, setSort] = useState('trending');
  const [tag, setTag] = useState('');
  const [gameId, setGameId] = useState('');
  const [watching, setWatching] = useState(null);
  const featured = useMemo(() => selectChannels(directory.channels).slice(0, 6), [directory.channels]);
  const rows = useMemo(() => selectChannels(directory.channels, { search: deferredSearch, sort, tag, gameId }), [directory.channels, deferredSearch, sort, tag, gameId]);
  const games = useMemo(() => directory.categories.slice(0, 12), [directory.categories]);
  const onWatch = useCallback((stream) => setWatching(stream), []);
  const selectGame = useCallback((game) => { setGameId(game.id); resultsRef.current?.scrollIntoView({ block: 'start' }); }, []);
  const activeBroadcast = watching ? directory.channels.find((stream) => stream.streamerId === watching.streamerId) || (directory.data?.incomplete ? watching : { ...watching, isLive: false }) : null;
  const clear = () => { setSearch(''); setTag(''); setGameId(''); };

  return <main ref={scrollRef} className="console-hub console-discovery-scroll">
    <FeaturedStreams streams={featured} onWatch={onWatch} suspended={Boolean(watching)} loading={directory.isPending} title={title} />
    <div className="console-discovery-feed">
      <div className="console-feed-search"><label className="console-search"><Search size={18} /><input aria-label="Search live channels, games, or tags" placeholder="Find a streamer, game, or a vibe" value={search} onChange={(event) => setSearch(event.target.value)} />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')}><X size={16} /></button>}</label><div className="console-quick-tags" aria-label="Quick tags">{TAGS.map((value) => <button type="button" key={value} aria-pressed={tag === value} onClick={() => setTag(tag === value ? '' : value)}>{value}</button>)}</div></div>
      {directory.isError && <div className="console-empty" role="alert"><p>Live discovery could not load.</p><button type="button" onClick={() => directory.refetch()}>Try again</button></div>}
      {directory.data?.incomplete && <div className="console-directory-notice" role="status">Some channels could not load. Counts reflect the available results. <button type="button" onClick={() => directory.refetch()}>Retry</button></div>}
      <section className="console-recommendations"><div className="console-section-heading"><div><span className="console-eyebrow">Your next channel</span><h2>We Think You’ll Like</h2></div><div className="console-rail-controls"><button className="console-icon-button" type="button" aria-label="Previous live channels" onClick={() => railRef.current?.scrollBy({ left: -railRef.current.clientWidth, behavior: 'smooth' })}><ChevronLeft size={18} /></button><button className="console-icon-button" type="button" aria-label="Next live channels" onClick={() => railRef.current?.scrollBy({ left: railRef.current.clientWidth, behavior: 'smooth' })}><ChevronRight size={18} /></button></div></div><div ref={railRef} className="console-stream-rail" onKeyDown={moveRailFocus}>{rows.slice(0, 16).map((stream) => <StreamCard key={stream.id} stream={stream} onSelect={onWatch} />)}</div>{!rows.length && <p className="console-inline-empty">{directory.isPending ? 'Loading channels…' : 'No live channels match right now.'}</p>}</section>
      <section className="console-categories"><div className="console-section-heading"><div><span className="console-eyebrow">Find your world</span><h2>Browse by game</h2></div><Link to="/streaming" className="console-text-button">All games<ArrowRight size={16} /></Link></div><div className="console-category-grid">{games.map((game) => <GameCard key={game.id} game={game} onSelect={selectGame} />)}</div>{!games.length && !directory.isPending && <p className="console-inline-empty">Games appear here when added to the community.</p>}</section>
      <section ref={resultsRef} className="console-all-channels" aria-label="Browse live channels"><div className="console-filter-bar" role="group" aria-label="Sort live channels">{SORTS.map(([id, label]) => <button type="button" key={id} aria-pressed={sort === id} onClick={() => setSort(id)}>{label}</button>)}</div><div className="console-results-heading"><h2>{gameId ? directory.categories.find((game) => game.id === gameId)?.title : 'Live now'} <span aria-live="polite">{rows.length.toLocaleString()} channels</span></h2>{(search || tag || gameId) && <button type="button" className="console-text-button" onClick={clear}>Clear filters<X size={14} /></button>}</div>{rows.length > 0 ? <DirectoryGrid items={rows} scrollRef={scrollRef} onSelect={onWatch} /> : <div className="console-empty" role="status"><p>{directory.isPending ? 'Loading live channels…' : 'No live channels match your filters.'}</p>{(search || tag || gameId) && <button type="button" onClick={clear}>Explore all channels</button>}</div>}</section>
    </div>
    {watching && <ChannelPlayback stream={activeBroadcast} onClose={() => setWatching(null)} />}
  </main>;
}
