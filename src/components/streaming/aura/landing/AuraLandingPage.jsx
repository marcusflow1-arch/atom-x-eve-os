import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Gamepad2, Radio, RefreshCw, Search, Users, X } from 'lucide-react';
import useLiveDirectory from '../../hub/useLiveDirectory';
import { formatCount } from '../../hub/discoveryModel';
import DirectoryGrid from '../../hub/DirectoryGrid';
import ChannelPlayback from '../../hub/ChannelPlayback';
import { chooseDailyCreators } from '../../discover/creatorDiscoveryModel';
import AuraChannelRail from './AuraChannelRail';
import { buildAuraLanding, RECENT_STREAM_WINDOW, selectAuraChannels } from './auraLandingModel';
import useAuraDailyFeed from './useAuraDailyFeed';
import useAuraChapters from './useAuraChapters';
import { buildAuraDailyEdition } from './auraDailyModel';
import { AURA_TOPICS, buildAuraGameLanes, buildAuraMoments, matchesAuraTopic } from './auraFrontPageModel';
import AuraDailyBriefing from './AuraDailyBriefing';
import AuraUpNext from './AuraUpNext';
import AuraDailyReader from './AuraDailyReader';
import AuraSpotlight from './AuraSpotlight';
import AuraMoments from './AuraMoments';
import AuraDailyPicks from './AuraDailyPicks';
import AuraTopics from './AuraTopics';
import AuraGameLanes from './AuraGameLanes';
import auraSampleContent, { auraSampleStory, fillAuraSamples } from './auraSampleContent';
import '../../hub/consoleHub.css';
import './auraLanding.css';
import './auraDaily.css';
import './auraFrontPage.css';
import './auraSilverPalette.css';

const DEFAULT_FILTERS = { search: '', gameId: '', tag: '', style: 'all', sort: 'trending', recent: false, topic: '' };
const SORTS = [['trending', 'Trending'], ['watching', 'Most Watching'], ['started', 'Just Started'], ['games', 'New Games']];

function SectionHeading({ number, label, title, description, id, children }) {
  return <header className="aura-feature-heading"><div><span className="console-eyebrow">{number} / {label}</span><h2 id={id}>{title}</h2><p>{description}</p></div>{children}</header>;
}

export default function AuraLandingPage() {
  const directory = useLiveDirectory();
  const daily = useAuraDailyFeed();
  const reduced = useReducedMotion();
  const scrollRef = useRef(null), searchRef = useRef(null), resultsRef = useRef(null), resultsHeadingRef = useRef(null);
  const liveRef = useRef(null), momentsRef = useRef(null), picksRef = useRef(null), topicsRef = useRef(null), gamesRef = useRef(null);
  const chapters = useMemo(() => [
    { id: 'moments', label: 'Moments', ref: momentsRef },
    { id: 'picks', label: 'Daily Picks', ref: picksRef },
    { id: 'topics', label: 'Real Life', ref: topicsRef },
    { id: 'games', label: 'Game Worlds', ref: gamesRef },
  ], []);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const search = useDeferredValue(filters.search);
  const [browseView, setBrowseView] = useState(false);
  const [watching, setWatching] = useState(null);
  const [story, setStory] = useState(null);
  const [previewingMoment, setPreviewingMoment] = useState(false);
  const [now, setNow] = useState(Date.now);
  const [showSamples, setShowSamples] = useState(true);
  const samples = useMemo(() => auraSampleContent(now), [now]);
  const fill = (real, examples, count) => showSamples ? fillAuraSamples(real, examples, count) : real;
  const landing = useMemo(() => buildAuraLanding(directory.channels, directory.categories, now), [directory.channels, directory.categories, now]);
  const browsing = browseView || Boolean(filters.search.trim() || filters.gameId || filters.tag || filters.topic || filters.style !== 'all' || filters.recent);
  const activeChapter = useAuraChapters(scrollRef, chapters, browsing);
  const realEdition = useMemo(() => buildAuraDailyEdition(daily.data, directory.categories, now), [daily.data, directory.categories, now]);
  const edition = { ...realEdition, updates: fill(realEdition.updates, samples.updates, 4), posts: fill(realEdition.posts, samples.posts, 3), schedules: fill(realEdition.schedules, samples.schedules, 3), videos: fill(realEdition.videos, samples.videos, 3) };
  const realMoments = useMemo(() => buildAuraMoments(daily.data?.moments, directory.categories, now), [daily.data?.moments, directory.categories, now]);
  const moments = fill(realMoments, samples.moments, 4);
  const realPicks = useMemo(() => chooseDailyCreators(directory.channels, now, 3), [directory.channels, now]);
  const picks = fill(realPicks, samples.creators, 3);
  const realLanes = useMemo(() => buildAuraGameLanes(directory.categories, daily.data?.requests, now), [directory.categories, daily.data?.requests, now]);
  const lanes = Object.fromEntries(Object.entries(realLanes).map(([key, games]) => [key, fill(games, samples.games, 4)]));
  const rows = useMemo(() => selectAuraChannels(directory.channels, { ...filters, search }).filter((stream) =>
    matchesAuraTopic(stream, filters.topic) && (!filters.recent || (stream.startedAt > 0 && stream.startedAt <= now && now - stream.startedAt <= RECENT_STREAM_WINDOW))
  ), [directory.channels, filters, search, now]);
  const activeBroadcast = watching ? directory.channels.find((stream) => stream.streamerId === watching.streamerId) || (directory.data?.incomplete || directory.isError ? watching : { ...watching, isLive: false }) : null;
  const selectedGame = directory.categories.find((game) => game.id === filters.gameId);
  const selectedTopic = AURA_TOPICS.find((topic) => topic.id === filters.topic);
  const resultsTitle = selectedGame?.title || selectedTopic?.title || (filters.topic === 'all' ? 'Real Life & Conversations' : filters.recent ? 'Just Went Live' : filters.style === 'competitive' ? 'Competitive & Ranked' : filters.style === 'relaxed' ? 'Kick Back & Watch' : filters.tag ? `${filters.tag} streams` : filters.search.trim() ? 'Search results' : 'All live channels');
  const suspended = Boolean(watching || story) || browsing;

  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
  const onWatch = useCallback((stream) => { if (stream.isSample) { setWatching(null); setStory(auraSampleStory(stream)); return; } setStory(null); setWatching(stream); }, []);
  const onRead = useCallback((item) => { setWatching(null); setStory(item); }, []);
  const browse = useCallback((next = {}) => {
    setFilters({ ...DEFAULT_FILTERS, ...next });
    setBrowseView(true);
    requestAnimationFrame(() => { resultsHeadingRef.current?.focus({ preventScroll: true }); resultsRef.current?.scrollIntoView({ block: 'start' }); });
  }, []);
  const onGame = useCallback((game) => game.isSample ? onRead(auraSampleStory(game)) : browse({ gameId: game.id }), [browse, onRead]);
  const browseAll = useCallback(() => browse(), [browse]);
  const reset = () => {
    setFilters(DEFAULT_FILTERS); setBrowseView(false);
    requestAnimationFrame(() => { searchRef.current?.focus({ preventScroll: true }); searchRef.current?.closest('.aura-landing-search')?.scrollIntoView({ block: 'start' }); });
  };
  const togglePreference = (key, value, empty) => {
    setFilters((previous) => ({ ...previous, [key]: previous[key] === value ? empty : value }));
    setBrowseView(true);
    if (!browsing) requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ block: 'start' }));
  };
  const jump = (ref) => {
    if (browsing) { setFilters(DEFAULT_FILTERS); setBrowseView(false); }
    requestAnimationFrame(() => { ref.current?.focus({ preventScroll: true }); ref.current?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' }); });
  };
  const hasData = Boolean(directory.data);
  const liveLabel = directory.isPending ? 'Connecting to live channels' : directory.isError ? 'Last available update' : directory.data?.incomplete ? 'Available live channels' : 'Live on Aura';

  return <main ref={scrollRef} className={`console-hub console-discovery-scroll aura-landing ${browsing ? 'is-browsing' : ''}`}>
    <div ref={liveRef} className="aura-front-stage" tabIndex={-1} aria-label="Aura live showcase"><AuraSpotlight streams={landing.featured.length || !showSamples ? landing.featured : samples.creators} onWatch={onWatch} suspended={suspended || previewingMoment} loading={directory.isPending} /></div>
    <div className="console-discovery-feed aura-landing-feed">
      <div className="console-directory-notice" role="status">{showSamples ? 'Layout preview: labeled sample templates fill available spaces. Real content and live counts are unchanged.' : 'Sample templates are hidden.'} <button type="button" onClick={() => setShowSamples((value) => !value)}>{showSamples ? 'Hide sample templates' : 'Show sample templates'}</button></div>
      <section className="aura-live-pulse" aria-label="Aura live activity">
        <div className="aura-pulse-label"><span className={directory.isError || directory.data?.incomplete ? 'is-delayed' : ''} /><strong>{liveLabel}</strong><small>{directory.isFetching && hasData ? 'Updating…' : hasData ? 'Updates automatically' : 'Finding broadcasts'}</small></div>
        <dl><div><dt><Users size={13} />Watching</dt><dd>{hasData ? formatCount(landing.pulse.viewers) : '—'}</dd></div><div><dt><Radio size={13} />Live channels</dt><dd>{hasData ? formatCount(landing.pulse.channels) : '—'}</dd></div><div><dt><Gamepad2 size={13} />Games & categories</dt><dd>{hasData ? formatCount(landing.pulse.games) : '—'}</dd></div></dl>
        <button type="button" className="console-icon-button" aria-label="Refresh live activity" disabled={directory.isFetching} onClick={() => directory.refetch()}><RefreshCw size={15} className={directory.isFetching ? 'aura-refreshing' : ''} /></button>
      </section>
      <div className="aura-edition-line"><span>YOUR DAILY EDITION <time dateTime={new Date(now).toISOString()}>{new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(now)}</time></span><button type="button" onClick={() => jump(momentsRef)}>Scroll into the day<ArrowDown size={13} /></button></div>
      <div className="console-feed-search aura-landing-search">
        <label className="console-search"><Search size={18} /><input ref={searchRef} aria-label="Search Aura live channels, games, or tags" placeholder="Find a live channel, game, or tag" value={filters.search} onChange={(event) => setFilters((previous) => ({ ...previous, search: event.target.value }))} />{filters.search && <button type="button" aria-label="Clear Aura search" onClick={() => setFilters((previous) => ({ ...previous, search: '' }))}><X size={16} /></button>}</label>
        <nav className="aura-landing-jumps" aria-label="Aura page sections">{chapters.map((chapter, index) => <button type="button" key={chapter.id} aria-current={activeChapter === chapter.id ? 'location' : undefined} onClick={() => jump(chapter.ref)}><span>{String(index + 1).padStart(2, '0')}</span>{chapter.label}</button>)}</nav>
      </div>
      {directory.isError && <div className="console-directory-notice" role="alert">Live activity could not refresh. {hasData ? 'Showing the last available channels.' : 'Please try again.'} <button type="button" onClick={() => directory.refetch()}>Retry</button></div>}
      {directory.data?.incomplete && <div className="console-directory-notice" role="status">Some channels could not load. Counts reflect the available broadcasts. <button type="button" onClick={() => directory.refetch()}>Retry</button></div>}
      {(daily.isError || edition.failures.length > 0) && <p className="console-directory-notice" role="status">Some daily content could not refresh. Showing available content. <button type="button" onClick={() => daily.refetch()}>Retry</button></p>}

      <div hidden={browsing} className="aura-landing-content">
        <section ref={momentsRef} className="aura-feature-section is-moments" data-aura-chapter="moments" tabIndex={-1} aria-labelledby="aura-moments-heading">
          <SectionHeading number="01" label="Moments in Motion" title="Small moments. Big energy." description="The clutch play. The perfect timing. The moment everyone had to save." id="aura-moments-heading" />
          <AuraMoments moments={moments} loading={daily.isPending} suspended={suspended} onRead={onRead} onPreviewChange={setPreviewingMoment} />
        </section>
        <section ref={picksRef} className="aura-feature-section is-picks" data-aura-chapter="picks" tabIndex={-1} aria-labelledby="aura-picks-heading">
          <SectionHeading number="02" label="Aura Daily Picks" title="Your next favorite creator." description="Three places to start. Fresh voices and smaller communities, picked for today." id="aura-picks-heading" />
          <AuraDailyPicks creators={picks} now={now} loading={directory.isPending} onWatch={onWatch} />
        </section>
        <section ref={topicsRef} className="aura-feature-section is-topics" data-aura-chapter="topics" tabIndex={-1} aria-labelledby="aura-topics-heading">
          <SectionHeading number="03" label="The Real Life Chat / Hot Topics" title="Life beyond the game." description="Different perspectives. Shared questions. Find a conversation that stays with you." id="aura-topics-heading"><button type="button" className="console-text-button" onClick={() => browse({ topic: 'all' })}>All conversations<ArrowRight size={14} /></button></SectionHeading>
          <AuraTopics streams={directory.channels} onBrowse={browse} />
        </section>
        <section ref={gamesRef} className="aura-feature-section is-game-lanes" data-aura-chapter="games" tabIndex={-1} aria-labelledby="aura-games-heading">
          <SectionHeading number="04" label="Game Directory & Discovery Lanes" title="Find your next world." description="New adventures, community favorites, and the ones that deserve another look." id="aura-games-heading" />
          <AuraGameLanes lanes={lanes} onGame={onGame} loading={directory.isPending} />
        </section>
        <section className="aura-feature-section is-briefing" aria-labelledby="aura-briefing-heading">
          <SectionHeading number="05" label="The Briefing" title="A little more to the story." description="The latest platform updates and stories from the community." id="aura-briefing-heading" />
          <AuraDailyBriefing edition={edition} loading={daily.isPending} onRead={onRead} onBrowse={browse} image={landing.hotTitles[0]?.image || landing.browseGames[0]?.image} />
        </section>
        <section className="aura-feature-section is-next" aria-labelledby="aura-next-heading">
          <SectionHeading number="06" label="Up Next & On Replay" title="Make time for a good stream." description="See what’s coming up, or catch a recording at your own pace." id="aura-next-heading" />
          <AuraUpNext edition={edition} loading={daily.isPending} onRead={onRead} onLive={browseAll} onGames={() => jump(gamesRef)} />
          <AuraChannelRail title="Live Right Now" eyebrow="The day keeps moving" description="One more look at what’s happening across Aura." streams={landing.liveNow} onWatch={onWatch} onBrowse={browseAll} />
          <div className="aura-edition-footer"><span>Stay curious. There’s always more to explore.</span><button type="button" onClick={() => jump(liveRef)}>Back to the top<ArrowUp size={14} /></button></div>
        </section>
      </div>

      <section ref={resultsRef} className={`console-all-channels aura-live-browser ${browsing ? 'is-browsing' : ''}`} aria-label="Browse Aura live channels">
        {browsing && <button type="button" className="console-text-button aura-return" onClick={reset}><ArrowLeft size={16} />Back to Aura landing</button>}
        <div className="console-filter-bar" role="group" aria-label="Sort Aura live channels">{SORTS.map(([id, label]) => <button type="button" key={id} aria-pressed={filters.sort === id} onClick={() => setFilters((previous) => ({ ...previous, sort: id }))}>{label}</button>)}</div>
        <div className="console-results-heading"><div><span className="console-eyebrow">Find your next watch</span><h2 ref={resultsHeadingRef} tabIndex={-1} className="aura-results-title">{resultsTitle} <span aria-live="polite">{rows.length.toLocaleString()} channels</span></h2></div><div className="console-quick-tags" role="group" aria-label="Aura stream preferences"><button type="button" aria-pressed={filters.style === 'competitive'} onClick={() => togglePreference('style', 'competitive', 'all')}>Competitive</button><button type="button" aria-pressed={filters.style === 'relaxed'} onClick={() => togglePreference('style', 'relaxed', 'all')}>Chill</button><button type="button" aria-pressed={filters.tag === 'Speedrun'} onClick={() => togglePreference('tag', 'Speedrun', '')}>Speedrun</button></div></div>
        {rows.length > 0 ? <DirectoryGrid key={browsing ? 'filtered' : 'landing'} layoutKey={`${daily.dataUpdatedAt}:${directory.dataUpdatedAt}`} items={rows} scrollRef={scrollRef} onSelect={onWatch} /> : <div className="console-empty" role="status"><Radio size={26} /><h2>{directory.isPending ? 'Finding live channels…' : browsing ? 'No live channels match' : 'The next live moment is on its way'}</h2><p>{browsing ? 'Try another topic or game, or remove a filter.' : 'Explore the game directory while creators get ready to go live.'}</p>{browsing ? <button type="button" onClick={reset}>Clear filters</button> : <Link to="/streaming" className="console-text-button">Explore games<ArrowRight size={15} /></Link>}</div>}
        {!browsing && rows.length > 0 && <p className="aura-browse-hint">Use arrow keys to browse channels. Press Enter to watch.</p>}
      </section>
    </div>
    {watching && <ChannelPlayback stream={activeBroadcast} onClose={() => setWatching(null)} />}
    {story && <AuraDailyReader key={story.id} story={story} onClose={() => setStory(null)} />}
  </main>;
}