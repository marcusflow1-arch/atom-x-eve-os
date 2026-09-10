import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Gamepad2, Radio, RefreshCw, Search, Users, X } from 'lucide-react';
import useLiveDirectory from '../../hub/useLiveDirectory';
import { formatCount } from '../../hub/discoveryModel';
import { Artwork, GameCard } from '../../hub/DirectoryCards';
import DirectoryGrid from '../../hub/DirectoryGrid';
import FeaturedStreams from '../../hub/FeaturedStreams';
import ChannelPlayback from '../../hub/ChannelPlayback';
import AuraChannelRail from './AuraChannelRail';
import HotTitlesShowcase from './HotTitlesShowcase';
import { buildAuraLanding, RECENT_STREAM_WINDOW, selectAuraChannels } from './auraLandingModel';
import useAuraDailyFeed from './useAuraDailyFeed';
import useAuraChapters from './useAuraChapters';
import { buildAuraDailyEdition, formatEditionDate } from './auraDailyModel';
import AuraDailyBriefing from './AuraDailyBriefing';
import AuraUpNext from './AuraUpNext';
import AuraDailyReader from './AuraDailyReader';
import '../../hub/consoleHub.css';
import './auraLanding.css';
import './auraDaily.css';

const DEFAULT_FILTERS = { search: '', gameId: '', tag: '', style: 'all', sort: 'trending', recent: false };
const SORTS = [['trending', 'Trending'], ['watching', 'Most Watching'], ['started', 'Just Started'], ['games', 'New Games']];

export default function AuraLandingPage() {
  const directory = useLiveDirectory();
  const daily = useAuraDailyFeed();
  const reduced = useReducedMotion();
  const scrollRef = useRef(null);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const resultsHeadingRef = useRef(null);
  const hotRef = useRef(null);
  const gamesRef = useRef(null);
  const liveRef = useRef(null);
  const briefingRef = useRef(null);
  const nextRef = useRef(null);
  const chapters = useMemo(() => [
    { id: 'live', label: 'Live now', ref: liveRef },
    { id: 'briefing', label: 'The Briefing', ref: briefingRef },
    { id: 'worlds', label: 'Game Worlds', ref: hotRef },
    { id: 'next', label: 'Up Next', ref: nextRef },
  ], []);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const search = useDeferredValue(filters.search);
  const [browseView, setBrowseView] = useState(false);
  const [watching, setWatching] = useState(null);
  const [story, setStory] = useState(null);
  const [now, setNow] = useState(Date.now);
  const landing = useMemo(() => buildAuraLanding(directory.channels, directory.categories, now), [directory.channels, directory.categories, now]);
  const browsing = browseView || Boolean(filters.search.trim() || filters.gameId || filters.tag || filters.style !== 'all' || filters.recent);
  const activeChapter = useAuraChapters(scrollRef, chapters, browsing);
  const edition = useMemo(() => buildAuraDailyEdition(daily.data, directory.categories, now), [daily.data, directory.categories, now]);
  const rows = useMemo(() => {
    const selected = selectAuraChannels(directory.channels, { ...filters, search });
    return filters.recent ? selected.filter((stream) => stream.startedAt > 0 && stream.startedAt <= now && now - stream.startedAt <= RECENT_STREAM_WINDOW) : selected;
  }, [directory.channels, filters, search, now]);
  const activeBroadcast = watching ? directory.channels.find((stream) => stream.streamerId === watching.streamerId) || (directory.data?.incomplete || directory.isError ? watching : { ...watching, isLive: false }) : null;
  const selectedGame = directory.categories.find((game) => game.id === filters.gameId);
  const resultsTitle = selectedGame?.title || (filters.recent ? 'Just Went Live' : filters.style === 'competitive' ? 'Competitive & Ranked' : filters.style === 'relaxed' ? 'Kick Back & Watch' : filters.tag ? `${filters.tag} streams` : filters.search.trim() ? 'Search results' : 'All live channels');

  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
  const onWatch = useCallback((stream) => { setStory(null); setWatching(stream); }, []);
  const onRead = useCallback((item) => { setWatching(null); setStory(item); }, []);
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
  const jump = (ref) => {
    if (browsing) reset();
    requestAnimationFrame(() => {
      ref.current?.focus({ preventScroll: true });
      ref.current?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    });
  };
  const hasData = Boolean(directory.data);
  const liveLabel = directory.isPending ? 'Connecting to live channels' : directory.isError ? 'Last available update' : directory.data?.incomplete ? 'Available live channels' : 'Live on Aura';

  return <main ref={scrollRef} className={`console-hub console-discovery-scroll aura-landing ${browsing ? 'is-browsing' : ''}`}>
    <div ref={liveRef} className="aura-front-stage" data-aura-chapter="live" tabIndex={-1} aria-label="Aura live showcase"><FeaturedStreams streams={landing.featured} onWatch={onWatch} suspended={Boolean(watching || story)} loading={directory.isPending} title="Aura" /></div>
    <div className="console-discovery-feed aura-landing-feed">
      <section className="aura-live-pulse" aria-label="Aura live activity">
        <div className="aura-pulse-label"><span className={directory.isError || directory.data?.incomplete ? 'is-delayed' : ''} /><strong>{liveLabel}</strong><small>{directory.isFetching && hasData ? 'Updating…' : hasData ? 'Updates automatically' : 'Finding broadcasts'}</small></div>
        <dl><div><dt><Users size={13} />Watching</dt><dd>{hasData ? formatCount(landing.pulse.viewers) : '—'}</dd></div><div><dt><Radio size={13} />Live channels</dt><dd>{hasData ? formatCount(landing.pulse.channels) : '—'}</dd></div><div><dt><Gamepad2 size={13} />Games & categories</dt><dd>{hasData ? formatCount(landing.pulse.games) : '—'}</dd></div></dl>
        <button type="button" className="console-icon-button" aria-label="Refresh live activity" disabled={directory.isFetching} onClick={() => directory.refetch()}><RefreshCw size={15} className={directory.isFetching ? 'aura-refreshing' : ''} /></button>
      </section>

      <div className="aura-edition-line"><span>YOUR DAILY EDITION <time dateTime={new Date(now).toISOString()}>{new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(now)}</time></span><button type="button" onClick={() => jump(briefingRef)}>More to explore<ArrowDown size={13} /></button></div>

      <div className="console-feed-search aura-landing-search">
        <label className="console-search"><Search size={18} /><input ref={searchRef} aria-label="Search Aura live channels, games, or tags" placeholder="A game, a channel, a moment. Find it live." value={filters.search} onChange={(event) => setFilters((previous) => ({ ...previous, search: event.target.value }))} />{filters.search && <button type="button" aria-label="Clear Aura search" onClick={() => setFilters((previous) => ({ ...previous, search: '' }))}><X size={16} /></button>}</label>
        <nav className="aura-landing-jumps" aria-label="Aura page sections">{chapters.map((chapter, index) => <button type="button" key={chapter.id} aria-current={activeChapter === chapter.id ? 'location' : undefined} onClick={() => jump(chapter.ref)}><span>{String(index + 1).padStart(2, '0')}</span>{chapter.label}</button>)}</nav>
      </div>

      {directory.isError && <div className="console-directory-notice" role="alert">Live activity could not refresh. {hasData ? 'Showing the last available channels.' : 'Please try again.'} <button type="button" onClick={() => directory.refetch()}>Retry</button></div>}
      {directory.data?.incomplete && <div className="console-directory-notice" role="status">Some channels could not load. Counts reflect the available broadcasts. <button type="button" onClick={() => directory.refetch()}>Retry</button></div>}

      <div hidden={browsing} className="aura-landing-content">
        <AuraChannelRail title="Live Right Now" eyebrow="Press play. Be part of it." description="Live channels across the games people are watching." streams={landing.liveNow} onWatch={onWatch} onBrowse={browseAll} />
        <AuraChannelRail title="Just Went Live" eyebrow="Catch the opening moments" description="Broadcasts that started in the last 30 minutes." streams={landing.justStarted} onWatch={onWatch} onBrowse={browseFresh} />

        <section ref={briefingRef} className="aura-daily-chapter is-briefing" data-aura-chapter="briefing" tabIndex={-1} aria-labelledby="aura-briefing-heading">
          <header className="aura-chapter-heading"><span className="aura-chapter-number">02</span><div><span className="console-eyebrow">A little context for your next watch</span><h2 id="aura-briefing-heading">The Briefing</h2><p>Platform updates, community stories, and a few new ways to spend your time.</p></div></header>
          {(daily.isError || edition.failures.length > 0) && <p className="console-directory-notice" role="status">{daily.isError ? 'The latest edition could not refresh.' : 'Some edition content could not load.'}{daily.data ? ' Showing available content.' : ''}<button type="button" onClick={() => daily.refetch()}>Retry</button></p>}
          <AuraDailyBriefing edition={edition} loading={daily.isPending} onRead={onRead} onBrowse={browse} image={landing.hotTitles[0]?.image || landing.browseGames[0]?.image} />
          <button type="button" className="aura-chapter-continue" onClick={() => jump(hotRef)}>Next, find your world<ArrowDown size={15} /></button>
        </section>

        <section ref={hotRef} className="aura-daily-chapter is-worlds" data-aura-chapter="worlds" tabIndex={-1} aria-labelledby="aura-worlds-heading">
          <header className="aura-chapter-heading"><span className="aura-chapter-number">03</span><div><span className="console-eyebrow">From the familiar to the unexpected</span><h2 id="aura-worlds-heading">Game Worlds</h2><p>See what’s drawing a crowd, explore the directory, and find a stream at your pace.</p></div></header>
          <HotTitlesShowcase games={landing.hotTitles} onGame={onGame} suspended={Boolean(watching || story) || browsing} />
          {edition.newGames.length > 0 && <section className="aura-directory-additions" aria-label="Latest game directory additions"><div className="aura-daily-subheading"><Gamepad2 size={14} /><h3>Latest directory additions</h3><span>More worlds to explore</span></div><div>{edition.newGames.map((game) => <button type="button" key={game.id} onClick={() => onGame(game)}><Artwork key={game.image} src={game.image} /><span><small>{game.genre}</small><strong>{game.title}</strong><small>Added {formatEditionDate(game.addedAt)}</small></span><ArrowRight size={15} /></button>)}</div></section>}

        <section ref={gamesRef} className="aura-browse-games aura-section-anchor" tabIndex={-1} aria-labelledby="aura-games-heading">
          <div className="console-section-heading"><div><span className="console-eyebrow">Your worlds, live</span><h2 id="aura-games-heading">Browse by Game</h2><p className="aura-section-description">Pick a title. Find the people playing it.</p></div><Link to="/streaming" className="console-text-button">Full directory<ArrowRight size={16} /></Link></div>
          <div className="console-category-grid">{landing.browseGames.map((game) => <GameCard key={game.id} game={game} onSelect={onGame} />)}</div>
          {!landing.browseGames.length && <p className="console-inline-empty">{directory.isPending ? 'Loading the game directory…' : 'Games will appear here when added to the community.'}</p>}
        </section>
          <AuraChannelRail title="Competitive & Ranked" eyebrow="Every move counts" description="Ranked climbs, tournament runs, and high-stakes matches." streams={landing.competitive} onWatch={onWatch} onBrowse={browseCompetitive} />
          <AuraChannelRail title="Kick Back & Watch" eyebrow="Settle into a stream" description="Relaxed sessions, casual play, and commentary-free runs." streams={landing.relaxed} onWatch={onWatch} onBrowse={browseRelaxed} />
          <button type="button" className="aura-chapter-continue" onClick={() => jump(nextRef)}>See what’s coming up<ArrowDown size={15} /></button>
        </section>

        <section ref={nextRef} className="aura-daily-chapter is-next" data-aura-chapter="next" tabIndex={-1} aria-labelledby="aura-next-heading">
          <header className="aura-chapter-heading"><span className="aura-chapter-number">04</span><div><span className="console-eyebrow">The next moment, and the ones you missed</span><h2 id="aura-next-heading">Up Next</h2><p>Plan your next drop-in, or settle into a recording whenever you have time.</p></div></header>
          <AuraUpNext edition={edition} loading={daily.isPending} onRead={onRead} onLive={browseAll} onGames={() => jump(hotRef)} />
          <div className="aura-edition-footer"><span>Keep exploring. There’s more happening live.</span><button type="button" onClick={() => jump(liveRef)}>Back to the top<ArrowUp size={14} /></button></div>
        </section>
      </div>

      <section ref={resultsRef} className={`console-all-channels aura-live-browser ${browsing ? 'is-browsing' : ''}`} aria-label="Browse Aura live channels">
        {browsing && <button type="button" className="console-text-button aura-return" onClick={reset}><ArrowLeft size={16} />Back to Aura landing</button>}
        <div className="console-filter-bar" role="group" aria-label="Sort Aura live channels">{SORTS.map(([id, label]) => <button type="button" key={id} aria-pressed={filters.sort === id} onClick={() => setFilters((previous) => ({ ...previous, sort: id }))}>{label}</button>)}</div>
        <div className="console-results-heading"><div><span className="console-eyebrow">Find your next watch</span><h2 ref={resultsHeadingRef} tabIndex={-1} className="aura-results-title">{resultsTitle} <span aria-live="polite">{rows.length.toLocaleString()} channels</span></h2></div><div className="console-quick-tags" role="group" aria-label="Aura stream preferences"><button type="button" aria-pressed={filters.style === 'competitive'} onClick={() => togglePreference('style', 'competitive', 'all')}>Competitive</button><button type="button" aria-pressed={filters.style === 'relaxed'} onClick={() => togglePreference('style', 'relaxed', 'all')}>Chill</button><button type="button" aria-pressed={filters.tag === 'Speedrun'} onClick={() => togglePreference('tag', 'Speedrun', '')}>Speedrun</button></div></div>
        {rows.length > 0 ? <DirectoryGrid key={browsing ? 'filtered' : 'landing'} layoutKey={`${daily.dataUpdatedAt}:${directory.dataUpdatedAt}`} items={rows} scrollRef={scrollRef} onSelect={onWatch} /> : <div className="console-empty" role="status"><Radio size={26} /><h2>{directory.isPending ? 'Finding live channels…' : browsing ? 'No live channels match' : 'The next live moment is on its way'}</h2><p>{browsing ? 'Try another game or remove a filter.' : 'Explore the game directory while creators get ready to go live.'}</p>{browsing ? <button type="button" onClick={reset}>Clear filters</button> : <Link to="/streaming" className="console-text-button">Explore games<ArrowRight size={15} /></Link>}</div>}
        {!browsing && rows.length > 0 && <p className="aura-browse-hint">Use arrow keys to browse channels. Press Enter to watch.</p>}
      </section>
    </div>
    {watching && <ChannelPlayback stream={activeBroadcast} onClose={() => setWatching(null)} />}
    {story && <AuraDailyReader key={story.id} story={story} onClose={() => setStory(null)} />}
  </main>;
}
