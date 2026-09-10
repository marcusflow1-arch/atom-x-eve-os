import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown, Gamepad2, Radio, RefreshCw, Search, Users, X } from 'lucide-react';
import useLiveDirectory from '../../hub/useLiveDirectory';
import { formatCount } from '../../hub/discoveryModel';
import { GameCard } from '../../hub/DirectoryCards';
import DirectoryGrid from '../../hub/DirectoryGrid';
import FeaturedStreams from '../../hub/FeaturedStreams';
import ChannelPlayback from '../../hub/ChannelPlayback';
import AuraChannelRail from './AuraChannelRail';
import HotTitlesShowcase from './HotTitlesShowcase';
import { buildAuraLanding, RECENT_STREAM_WINDOW, selectAuraChannels } from './auraLandingModel';
import '../../hub/consoleHub.css';
import './auraLanding.css';

const DEFAULT_FILTERS = { search: '', gameId: '', tag: '', style: 'all', sort: 'trending', recent: false };
const SORTS = [['trending', 'Trending'], ['watching', 'Most Watching'], ['started', 'Just Started'], ['games', 'New Games']];

export default function AuraLandingPage() {
  const directory = useLiveDirectory();
  const scrollRef = useRef(null);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const resultsHeadingRef = useRef(null);
  const hotRef = useRef(null);
  const gamesRef = useRef(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const search = useDeferredValue(filters.search);
  const [browseView, setBrowseView] = useState(false);
  const [watching, setWatching] = useState(null);
  const [now, setNow] = useState(Date.now);
  const landing = useMemo(() => buildAuraLanding(directory.channels, directory.categories, now), [directory.channels, directory.categories, now]);
  const browsing = browseView || Boolean(filters.search.trim() || filters.gameId || filters.tag || filters.style !== 'all' || filters.recent);
  const rows = useMemo(() => {
    const selected = selectAuraChannels(directory.channels, { ...filters, search });
    return filters.recent ? selected.filter((stream) => stream.startedAt > 0 && stream.startedAt <= now && now - stream.startedAt <= RECENT_STREAM_WINDOW) : selected;
  }, [directory.channels, filters, search, now]);
  const activeBroadcast = watching ? directory.channels.find((stream) => stream.streamerId === watching.streamerId) || (directory.data?.incomplete || directory.isError ? watching : { ...watching, isLive: false }) : null;
  const selectedGame = directory.categories.find((game) => game.id === filters.gameId);
  const resultsTitle = selectedGame?.title || (filters.recent ? 'Just Went Live' : filters.style === 'competitive' ? 'Competitive & Ranked' : filters.style === 'relaxed' ? 'Kick Back & Watch' : filters.tag ? `${filters.tag} streams` : filters.search.trim() ? 'Search results' : 'All live channels');

  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
  const onWatch = useCallback((stream) => setWatching(stream), []);
  const browse = useCallback((next = {}) => {
    setFilters({ ...DEFAULT_FILTERS, ...next });
    setBrowseView(true);
    requestAnimationFrame(() => {
      resultsHeadingRef.current?.focus({ preventScroll: true });
      resultsRef.current?.scrollIntoView({ block: 'start' });
    });
  }, []);
  const onGame = useCallback((game) => browse({ gameId: game.id }), [browse]);
  const browseAll = useCallback(() => browse(), [browse]);
  const browseCompetitive = useCallback(() => browse({ style: 'competitive' }), [browse]);
  const browseRelaxed = useCallback(() => browse({ style: 'relaxed' }), [browse]);
  const browseFresh = useCallback(() => browse({ recent: true, sort: 'started' }), [browse]);
  const reset = () => {
    setFilters(DEFAULT_FILTERS);
    setBrowseView(false);
    requestAnimationFrame(() => {
      searchRef.current?.focus({ preventScroll: true });
      searchRef.current?.closest('.aura-landing-search')?.scrollIntoView({ block: 'start' });
    });
  };
  const togglePreference = (key, value, empty) => {
    setFilters((previous) => ({ ...previous, [key]: previous[key] === value ? empty : value }));
    setBrowseView(true);
    if (!browsing) requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ block: 'start' }));
  };
  const jump = (ref) => { if (browsing) reset(); requestAnimationFrame(() => ref.current?.scrollIntoView({ block: 'start' })); };
  const hasData = Boolean(directory.data);
  const liveLabel = directory.isPending ? 'Connecting to live channels' : directory.isError ? 'Last available update' : directory.data?.incomplete ? 'Available live channels' : 'Live on Aura';

  return <main ref={scrollRef} className="console-hub console-discovery-scroll aura-landing">
    <FeaturedStreams streams={landing.featured} onWatch={onWatch} suspended={Boolean(watching)} loading={directory.isPending} title="Aura" />
    <div className="console-discovery-feed aura-landing-feed">
      <section className="aura-live-pulse" aria-label="Aura live activity">
        <div className="aura-pulse-label"><span className={directory.isError || directory.data?.incomplete ? 'is-delayed' : ''} /><strong>{liveLabel}</strong><small>{directory.isFetching && hasData ? 'Updating…' : hasData ? 'Updates automatically' : 'Finding broadcasts'}</small></div>
        <dl><div><dt><Users size={13} />Watching</dt><dd>{hasData ? formatCount(landing.pulse.viewers) : '—'}</dd></div><div><dt><Radio size={13} />Live channels</dt><dd>{hasData ? formatCount(landing.pulse.channels) : '—'}</dd></div><div><dt><Gamepad2 size={13} />Games & categories</dt><dd>{hasData ? formatCount(landing.pulse.games) : '—'}</dd></div></dl>
        <button type="button" className="console-icon-button" aria-label="Refresh live activity" disabled={directory.isFetching} onClick={() => directory.refetch()}><RefreshCw size={15} className={directory.isFetching ? 'aura-refreshing' : ''} /></button>
      </section>

      <div className="console-feed-search aura-landing-search">
        <label className="console-search"><Search size={18} /><input ref={searchRef} aria-label="Search Aura live channels, games, or tags" placeholder="A game, a channel, a moment. Find it live." value={filters.search} onChange={(event) => setFilters((previous) => ({ ...previous, search: event.target.value }))} />{filters.search && <button type="button" aria-label="Clear Aura search" onClick={() => setFilters((previous) => ({ ...previous, search: '' }))}><X size={16} /></button>}</label>
        <nav className="aura-landing-jumps" aria-label="Aura page sections"><button type="button" onClick={browseAll}>Live now</button>{landing.hotTitles.length > 0 && <button type="button" onClick={() => jump(hotRef)}>Hot titles</button>}<button type="button" onClick={() => jump(gamesRef)}>Games<ChevronDown size={12} /></button></nav>
      </div>

      {directory.isError && <div className="console-directory-notice" role="alert">Live activity could not refresh. {hasData ? 'Showing the last available channels.' : 'Please try again.'} <button type="button" onClick={() => directory.refetch()}>Retry</button></div>}
      {directory.data?.incomplete && <div className="console-directory-notice" role="status">Some channels could not load. Counts reflect the available broadcasts. <button type="button" onClick={() => directory.refetch()}>Retry</button></div>}

      <div hidden={browsing} className="aura-landing-content">
        <AuraChannelRail title="Live Right Now" eyebrow="Press play. Be part of it." description="Live channels across the games people are watching." streams={landing.liveNow} onWatch={onWatch} onBrowse={browseAll} />
        <div ref={hotRef} className="aura-section-anchor"><HotTitlesShowcase games={landing.hotTitles} onGame={onGame} suspended={Boolean(watching) || browsing} /></div>
        <AuraChannelRail title="Competitive & Ranked" eyebrow="Every move counts" description="Ranked climbs, tournament runs, and high-stakes matches." streams={landing.competitive} onWatch={onWatch} onBrowse={browseCompetitive} />
        <AuraChannelRail title="Kick Back & Watch" eyebrow="Settle into a stream" description="Relaxed sessions, casual play, and commentary-free runs." streams={landing.relaxed} onWatch={onWatch} onBrowse={browseRelaxed} />
        <AuraChannelRail title="Just Went Live" eyebrow="Catch the opening moments" description="Broadcasts that started in the last 30 minutes." streams={landing.justStarted} onWatch={onWatch} onBrowse={browseFresh} />

        <section ref={gamesRef} className="aura-browse-games aura-section-anchor" aria-labelledby="aura-games-heading">
          <div className="console-section-heading"><div><span className="console-eyebrow">Your worlds, live</span><h2 id="aura-games-heading">Browse by Game</h2><p className="aura-section-description">Pick a title. Find the people playing it.</p></div><Link to="/streaming" className="console-text-button">Full directory<ArrowRight size={16} /></Link></div>
          <div className="console-category-grid">{landing.browseGames.map((game) => <GameCard key={game.id} game={game} onSelect={onGame} />)}</div>
          {!landing.browseGames.length && <p className="console-inline-empty">{directory.isPending ? 'Loading the game directory…' : 'Games will appear here when added to the community.'}</p>}
        </section>
      </div>

      <section ref={resultsRef} className={`console-all-channels aura-live-browser ${browsing ? 'is-browsing' : ''}`} aria-label="Browse Aura live channels">
        {browsing && <button type="button" className="console-text-button aura-return" onClick={reset}><ArrowLeft size={16} />Back to Aura landing</button>}
        <div className="console-filter-bar" role="group" aria-label="Sort Aura live channels">{SORTS.map(([id, label]) => <button type="button" key={id} aria-pressed={filters.sort === id} onClick={() => setFilters((previous) => ({ ...previous, sort: id }))}>{label}</button>)}</div>
        <div className="console-results-heading"><div><span className="console-eyebrow">Find your next watch</span><h2 ref={resultsHeadingRef} tabIndex={-1} className="aura-results-title">{resultsTitle} <span aria-live="polite">{rows.length.toLocaleString()} channels</span></h2></div><div className="console-quick-tags" role="group" aria-label="Aura stream preferences"><button type="button" aria-pressed={filters.style === 'competitive'} onClick={() => togglePreference('style', 'competitive', 'all')}>Competitive</button><button type="button" aria-pressed={filters.style === 'relaxed'} onClick={() => togglePreference('style', 'relaxed', 'all')}>Chill</button><button type="button" aria-pressed={filters.tag === 'Speedrun'} onClick={() => togglePreference('tag', 'Speedrun', '')}>Speedrun</button></div></div>
        {rows.length > 0 ? <DirectoryGrid key={browsing ? 'filtered' : 'landing'} items={rows} scrollRef={scrollRef} onSelect={onWatch} /> : <div className="console-empty" role="status"><Radio size={26} /><h2>{directory.isPending ? 'Finding live channels…' : browsing ? 'No live channels match' : 'The next live moment is on its way'}</h2><p>{browsing ? 'Try another game or remove a filter.' : 'Explore the game directory while creators get ready to go live.'}</p>{browsing ? <button type="button" onClick={reset}>Clear filters</button> : <Link to="/streaming" className="console-text-button">Explore games<ArrowRight size={15} /></Link>}</div>}
        {!browsing && rows.length > 0 && <p className="aura-browse-hint">Use arrow keys to browse channels. Press Enter to watch.</p>}
      </section>
    </div>
    {watching && <ChannelPlayback stream={activeBroadcast} onClose={() => setWatching(null)} />}
  </main>;
}
