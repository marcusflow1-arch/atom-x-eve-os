import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown, Compass, Search, Shuffle, X } from 'lucide-react';
import useLiveDirectory from '../hub/useLiveDirectory';
import { STYLE_FILTERS } from '../hub/discoveryModel';
import DiscoverFilters from './DiscoverFilters';
import DiscoverSpotlight from './DiscoverSpotlight';
import DiscoverCreatorCard from './DiscoverCreatorCard';
import CreatorQuickLook from './CreatorQuickLook';
import { chooseDailyCreators, DISCOVER_PAGE_SIZE, DISCOVERY_FOCUS, DISCOVERY_SORTS, discoveryGenres, filterCreators, matchesDiscoveryGenre, prepareCreators, readDiscoveryFilters, selectCreators } from './creatorDiscoveryModel';
import '../hub/consoleHub.css';
import './creatorDiscovery.css';

export default function DiscoverHub() {
  const directory = useLiveDirectory();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readDiscoveryFilters(params), [params]);
  const search = useDeferredValue(filters.search);
  const [now, setNow] = useState(Date.now);
  const [quickLook, setQuickLook] = useState(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const searchRef = useRef(null), resultsRef = useRef(null), headingRef = useRef(null), surpriseIndex = useRef(0);
  const creators = useMemo(() => prepareCreators(directory.channels, directory.categories), [directory.channels, directory.categories]);
  const matches = useMemo(() => selectCreators(creators, { ...filters, search }, now), [creators, filters, search, now]);
  const picks = useMemo(() => chooseDailyCreators(matches, now), [matches, now]);
  const genres = useMemo(() => [...new Set([...discoveryGenres(creators), filters.genre])], [creators, filters.genre]);
  const genreCounts = useMemo(() => {
    const pool = filterCreators(creators, { ...filters, search, genre: 'All genres', gameId: '' }, now);
    return new Map(genres.map((genre) => [genre, pool.filter((creator) => matchesDiscoveryGenre(creator, genre)).length]));
  }, [creators, filters, search, now, genres]);
  const games = useMemo(() => {
    const pool = creators.filter((creator) => matchesDiscoveryGenre(creator, filters.genre));
    return [...new Map(pool.map((creator) => [creator.gameId, { id: creator.gameId, title: creator.game }])).values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [creators, filters.genre]);
  const pageCount = Math.max(1, Math.ceil(matches.length / DISCOVER_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const pageCreators = matches.slice((page - 1) * DISCOVER_PAGE_SIZE, page * DISCOVER_PAGE_SIZE);
  const activeCount = filters.styles.length + Number(filters.genre !== 'All genres') + Number(Boolean(filters.search.trim())) + Number(Boolean(filters.gameId)) + Number(filters.focus !== 'rising') + Number(filters.sort !== 'discovery');
  const activeCreator = quickLook ? creators.find((creator) => creator.streamerId === quickLook.streamerId) || (directory.isError || directory.data?.incomplete ? quickLook : { ...quickLook, isLive: false }) : null;

  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
  const onMeet = useCallback((creator) => setQuickLook(creator), []);
  const updateFilters = (patch) => {
    const next = { ...filters, ...patch, page: patch.page || 1 };
    const query = new URLSearchParams();
    if (next.search) query.set('q', next.search);
    if (next.genre !== 'All genres') query.set('genre', next.genre);
    if (next.gameId) query.set('game', next.gameId);
    next.styles.forEach((style) => query.append('style', style));
    if (next.focus !== 'rising') query.set('focus', next.focus);
    if (next.sort !== 'discovery') query.set('sort', next.sort);
    if (next.page > 1) query.set('page', String(next.page));
    setParams(query, { replace: true });
  };
  const reset = () => { setParams({}, { replace: true }); requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true })); };
  const changePage = (next) => {
    updateFilters({ page: next });
    requestAnimationFrame(() => { headingRef.current?.focus({ preventScroll: true }); resultsRef.current?.scrollIntoView({ block: 'start' }); });
  };
  const focusLabel = DISCOVERY_FOCUS.find(([id]) => id === filters.focus)?.[1];
  const unavailable = directory.isError || directory.data?.incomplete;

  return <main className="console-hub console-discovery-scroll creator-discovery">
    <div className="discover-canvas">
      <header className="discover-intro"><div><span className="console-eyebrow"><Compass size={13} />Discover / people, not just play</span><h1>Find your kind of stream.</h1><p>Meet new creators and smaller communities that fit your style.</p></div><div className={`discover-activity ${unavailable ? 'is-delayed' : ''}`}><span><i />{directory.isPending ? 'Finding live creators' : unavailable ? 'Available live creators' : 'Live connections'}</span><small>{directory.data ? `${creators.length.toLocaleString()} channels to explore` : 'A new connection is a moment away'}</small></div></header>
      <div className="discover-layout">
        <DiscoverFilters filters={filters} genres={genres} genreCounts={genreCounts} activeCount={activeCount} onChange={updateFilters} onReset={reset} open={refineOpen} onToggle={() => setRefineOpen((value) => !value)} />
        <div className="discover-content">
          <div className="discover-search-row"><label className="console-search"><Search size={17} /><input ref={searchRef} aria-label="Search Discover creators, games, styles, or bios" placeholder="A name, a game, a style. Find your people." value={filters.search} onChange={(event) => updateFilters({ search: event.target.value })} />{filters.search && <button type="button" aria-label="Clear Discover search" onClick={() => updateFilters({ search: '' })}><X size={15} /></button>}</label><button type="button" className="discover-surprise" disabled={!matches.length} onClick={() => onMeet(matches[surpriseIndex.current++ % matches.length])}><Shuffle size={15} /><span>Surprise me</span></button></div>
          {directory.isError && <p className="console-directory-notice" role="alert">Discover could not refresh. {directory.data ? 'Showing the last available creators.' : 'Please try again.'}<button type="button" onClick={() => directory.refetch()}>Retry</button></p>}
          {directory.data?.incomplete && <p className="console-directory-notice" role="status">Some channels could not load. Filters and counts reflect available creators.<button type="button" onClick={() => directory.refetch()}>Retry</button></p>}
          <DiscoverSpotlight creators={picks} now={now} onMeet={onMeet} suspended={Boolean(quickLook)} />
          <section ref={resultsRef} className="discover-results" aria-labelledby="discover-results-heading">
            <div className="discover-results-toolbar"><div><span className="console-eyebrow">{focusLabel}</span><h2 ref={headingRef} tabIndex={-1} id="discover-results-heading">People to discover <span aria-live="polite">{matches.length.toLocaleString()} creators</span></h2></div><div className="discover-results-selects"><label className="discover-select"><span className="sr-only">Filter by game</span><select aria-label="Filter Discover by game" value={filters.gameId} onChange={(event) => updateFilters({ gameId: event.target.value })}><option value="">Every game</option>{games.map((game) => <option key={game.id} value={game.id}>{game.title}</option>)}{filters.gameId && !games.some((game) => game.id === filters.gameId) && <option value={filters.gameId}>Selected game · offline</option>}</select><ChevronDown size={12} /></label><label className="discover-select"><span className="sr-only">Sort creators</span><select aria-label="Sort Discover creators" value={filters.sort} onChange={(event) => updateFilters({ sort: event.target.value })}>{DISCOVERY_SORTS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><ChevronDown size={12} /></label></div></div>
            {(filters.styles.length > 0 || filters.genre !== 'All genres') && <div className="discover-applied" aria-label="Selected Discover preferences">{filters.genre !== 'All genres' && <button type="button" onClick={() => updateFilters({ genre: 'All genres', gameId: '' })}>{filters.genre}<X size={11} /></button>}{filters.styles.map((style) => <button type="button" key={style} onClick={() => updateFilters({ styles: filters.styles.filter((value) => value !== style) })}>{STYLE_FILTERS.find(([id]) => id === style)?.[1]}<X size={11} /></button>)}</div>}
            {directory.isPending ? <div className="discover-skeleton-grid" role="status" aria-label="Loading creator profiles">{Array.from({ length: 6 }, (_, index) => <div key={index} />)}</div> : pageCreators.length ? <div className="discover-creator-grid">{pageCreators.map((creator) => <DiscoverCreatorCard key={creator.id} creator={creator} now={now} onMeet={onMeet} />)}</div> : <div className="discover-empty" role="status"><Compass size={30} /><h3>{creators.length ? 'Your people are out there.' : 'New connections are on the way.'}</h3><p>{creators.length ? 'No live creators match this combination. Try fewer preferences or explore all live communities.' : 'Live creator profiles will appear here when channels go live.'}</p>{creators.length > 0 && <div><button type="button" className="discover-primary" onClick={() => { setParams({ focus: 'all' }, { replace: true }); }}>Explore all live creators<ArrowRight size={14} /></button>{activeCount > 0 && <button type="button" className="console-text-button" onClick={reset}>Reset preferences</button>}</div>}</div>}
            {matches.length > 0 && <div className="discover-pagination"><p>Showing {(page - 1) * DISCOVER_PAGE_SIZE + 1}–{Math.min(page * DISCOVER_PAGE_SIZE, matches.length)} of {matches.length.toLocaleString()} creators</p>{pageCount > 1 && <nav aria-label="Creator result pages"><button type="button" aria-label="Previous creator page" disabled={page <= 1} onClick={() => changePage(page - 1)}><ArrowLeft size={15} /></button><span>{page} / {pageCount}</span><button type="button" aria-label="Next creator page" disabled={page >= pageCount} onClick={() => changePage(page + 1)}><ArrowRight size={15} /></button></nav>}</div>}
          </section>
        </div>
      </div>
    </div>
    {activeCreator && <CreatorQuickLook creator={activeCreator} onClose={() => setQuickLook(null)} />}
  </main>;
}
