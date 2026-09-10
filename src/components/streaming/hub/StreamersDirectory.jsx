import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Flame, Gamepad2, Radio, Search, X } from 'lucide-react';
import useLiveDirectory from './useLiveDirectory';
import { channelHref, formatCount, matchesGenre, normalizeText, selectChannels, STYLE_FILTERS } from './discoveryModel';
import { GameCard, moveRailFocus } from './DirectoryCards';
import DirectoryGrid from './DirectoryGrid';
import './consoleHub.css';

export default function StreamersDirectory({ onClose }) {
  const directory = useLiveDirectory();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const scrollRef = useRef(null);
  const hotRef = useRef(null);
  const headingRef = useRef(null);
  const [search, setSearch] = useState('');
  const query = useDeferredValue(search);
  const [genre, setGenre] = useState('All genres');
  const gameId = params.get('gameId') || '';
  const style = STYLE_FILTERS.some(([id]) => id === params.get('style')) ? params.get('style') : 'all';
  const selectedGame = directory.categories.find((game) => game.id === gameId);
  const games = useMemo(() => directory.categories.filter((game) => matchesGenre(game, genre) && normalizeText(game.title).includes(normalizeText(query))), [directory.categories, genre, query]);
  const hot = useMemo(() => games.filter((game) => game.liveCount > 0).slice(0, 12), [games]);
  const streams = useMemo(() => selectChannels(directory.channels, { gameId, search: query, style, sort: 'watching' }), [directory.channels, gameId, query, style]);
  const genres = useMemo(() => ['All genres', 'RPG', 'Action', 'Horror', 'FPS', ...new Set(directory.categories.map((game) => game.genre).filter((value) => !['rpg', 'action', 'horror', 'fps', 'shooter', 'shooting'].includes(normalizeText(value))))], [directory.categories]);
  const back = useCallback(() => { const next = new URLSearchParams(params); next.delete('gameId'); next.delete('style'); setParams(next); setSearch(''); }, [params, setParams]);
  const chooseGame = useCallback((game) => { const next = new URLSearchParams(params); next.set('gameId', game.id); next.delete('style'); setParams(next); setSearch(''); }, [params, setParams]);
  const chooseStream = useCallback((stream) => navigate(channelHref(stream)), [navigate]);
  const chooseStyle = (id) => { const next = new URLSearchParams(params); if (id === 'all') next.delete('style'); else next.set('style', id); setParams(next, { replace: true }); scrollRef.current?.scrollTo({ top: 0 }); };
  useEffect(() => { const frame = requestAnimationFrame(() => { scrollRef.current?.scrollTo({ top: 0 }); headingRef.current?.focus({ preventScroll: true }); }); return () => cancelAnimationFrame(frame); }, [gameId]);
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') { if (gameId) { event.preventDefault(); back(); } else onClose?.(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameId, back, onClose]);

  return <section className="console-hub console-streamers-panel backdrop-blur-xl bg-slate-950/75 border-none shadow-2xl" aria-label="Streamers directory">
    <div className="console-streamers-edge" aria-hidden="true" />
    <header className="console-directory-header"><div className="console-directory-title">{gameId ? <button className="console-icon-button" type="button" aria-label="Back to games" onClick={back}><ArrowLeft size={20} /></button> : <Radio size={20} />}<div><span className="console-eyebrow">{gameId ? 'Find your kind of stream' : 'Games. People. Live moments.'}</span><h1 ref={headingRef} tabIndex={-1}>{gameId ? selectedGame?.title || 'Live Streamers' : 'Streamers'}</h1></div></div><label className="console-search"><Search size={17} /><input aria-label={gameId ? 'Search streamers or tags' : 'Search games'} placeholder={gameId ? 'Search streamers or tags' : 'Find your next game'} value={search} onChange={(event) => setSearch(event.target.value)} />{search && <button type="button" aria-label="Clear directory search" onClick={() => setSearch('')}><X size={15} /></button>}</label>{onClose && <button className="console-icon-button" type="button" aria-label="Close Streamers" onClick={onClose}><X size={20} /></button>}</header>
    <div className="console-directory-layout"><aside className="console-directory-sidebar"><span className="console-eyebrow">{gameId ? 'Streamer Style Preferences' : 'Categories'}</span><div className="console-sidebar-filters" role="group" aria-label={gameId ? 'Streamer Style Preferences' : 'Filter game genres'}>{gameId ? STYLE_FILTERS.map(([id, label]) => <button type="button" key={id} aria-pressed={style === id} onClick={() => chooseStyle(id)}>{label}</button>) : genres.map((value) => <button type="button" key={value} aria-pressed={genre === value} onClick={() => { setGenre(value); scrollRef.current?.scrollTo({ top: 0 }); }}><Gamepad2 size={14} />{value}</button>)}</div></aside>
      <div ref={scrollRef} className="console-directory-scroll">
        {directory.isError ? <div className="console-empty" role="alert"><h2>Unable to load Streamers</h2><button type="button" onClick={() => directory.refetch()}>Try again</button></div> : directory.isPending ? <div className="console-empty" role="status">Loading your next live moment…</div> : <>
          {directory.data?.incomplete && <p className="console-directory-notice" role="status">Some channels could not load. Counts reflect available results. <button type="button" onClick={() => directory.refetch()}>Retry</button></p>}
          {!gameId ? <><section className="console-hot-picks"><div className="console-section-heading"><div><span className="console-eyebrow"><Flame size={12} />Trending live</span><h2>Hot Picks</h2></div><div className="console-rail-controls"><button className="console-icon-button" type="button" aria-label="Previous hot games" onClick={() => hotRef.current?.scrollBy({ left: -hotRef.current.clientWidth, behavior: 'smooth' })}><ChevronLeft size={18} /></button><button className="console-icon-button" type="button" aria-label="Next hot games" onClick={() => hotRef.current?.scrollBy({ left: hotRef.current.clientWidth, behavior: 'smooth' })}><ChevronRight size={18} /></button></div></div><div ref={hotRef} className="console-hot-rail" onKeyDown={moveRailFocus}>{hot.map((game) => <GameCard key={game.id} game={game} onSelect={chooseGame} hot />)}</div>{!hot.length && <p className="console-inline-empty">No games are live in this category yet.</p>}</section><div className="console-results-heading"><h2>All games <span>{games.length.toLocaleString()} worlds to explore</span></h2><small>Choose a game to find its streamers</small></div>{games.length ? <DirectoryGrid items={games} kind="games" scrollRef={scrollRef} onSelect={chooseGame} /> : <div className="console-empty"><p>No games match your search.</p><button type="button" onClick={() => { setSearch(''); setGenre('All genres'); }}>Clear filters</button></div>}</> : <><div className="console-results-heading"><h2>Live Streamers <span aria-live="polite">{streams.length.toLocaleString()} live channels</span></h2><small>{formatCount(streams.reduce((total, stream) => total + stream.viewers, 0))} watching</small></div>{streams.length ? <DirectoryGrid items={streams} scrollRef={scrollRef} onSelect={chooseStream} /> : <div className="console-empty" role="status"><Radio size={28} /><h2>No live streams match this style</h2><p>Try All Streams or explore another game.</p><button type="button" onClick={() => { chooseStyle('all'); setSearch(''); }}>All Streams</button><button type="button" onClick={back}>Back to games</button></div>}</>}
        </>}
      </div>
    </div>
  </section>;
}
