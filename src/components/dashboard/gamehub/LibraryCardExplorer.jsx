import { lazy, Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Diamond, Gamepad2, Layers, Lock, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import useCardsCatalog from '@/components/genremastery/useCardsCatalog';
import { readCardPages, RARITY_COLORS } from '@/components/genremastery/cardsCatalog';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import LibraryBrowseControls from './LibraryBrowseControls';
import LibraryScrollReveal from './LibraryScrollReveal';
import { enrichLibraryCards, filterLibraryCards, filterLibraryGames, genreOptions, isAdamXe, titleOrder } from './libraryDiscovery';
import './library-browser.css';

const MysteryCardDetail = lazy(() => import('@/components/streaming/MysteryCardDetail'));

function Artwork({ src, game = false }) {
  const [failed, setFailed] = useState(null);
  return src && failed !== src ? <img src={src} alt="" loading="lazy" onError={() => setFailed(src)} /> : game ? <Gamepad2 /> : <Diamond />;
}
function Cards({ cards, onSelect }) {
  const [limit, setLimit] = useState(48);
  const signature = cards.map((card) => card.id).join('|');
  useEffect(() => setLimit(48), [signature]);
  if (!cards.length) return <div className="ll-empty"><strong>No cards here yet</strong><span>Try another genre or search. Published cards appear here as they become available.</span></div>;
  return <><div className="ll-card-grid">{cards.slice(0, limit).map((card) => <button key={card.id} type="button" className="ll-card" aria-label={`View ${card.title} card`} onClick={(event) => onSelect(card, event.currentTarget)} style={{ '--card-tone': RARITY_COLORS[card.rarity] || '#b2dbe7' }}>
    <span className="ll-card-art"><Artwork src={card.image} /><span className="ll-card-tier">{card.rarity || 'Common'}</span><span className="ll-card-status" data-owned={Boolean(card.isOwned)}>{card.isOwned ? <Check size={11} /> : <Lock size={10} />}{card.isOwned ? 'Collected' : 'To unlock'}</span></span>
    <strong>{card.title}</strong><small>{card.series || card.card_type || 'Achievement card'}</small>
  </button>)}</div>{cards.length > limit && <button className="ll-more" onClick={() => setLimit((count) => count + 48)}>Show more cards ({cards.length - limit})</button>}</>;
}
function GameRail({ games, cards, selectedId, onSelect, panelId }) {
  const rail = useRef(null);
  const [edges, setEdges] = useState({ first: true, last: games.length <= 5 });
  const sync = () => {
    const el = rail.current;
    if (el) setEdges({ first: el.scrollLeft <= 2, last: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  };
  useEffect(() => { if (rail.current) rail.current.scrollLeft = 0; sync(); }, [games]);
  useEffect(() => {
    if (!rail.current || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(sync); observer.observe(rail.current); return () => observer.disconnect();
  }, []);
  const move = (direction) => {
    const el = rail.current;
    el?.scrollBy({ left: direction * (el.clientWidth + (el.closest('.ll-full-explorer') ? 14 : 8)), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  return <>
    <div className="ll-result-heading"><span>Games · A–Z</span><nav aria-label="Game row navigation"><button disabled={edges.first} onClick={() => move(-1)} aria-label="Previous five games"><ChevronLeft size={15} /></button><button disabled={edges.last} onClick={() => move(1)} aria-label="Next five games"><ChevronRight size={15} /></button></nav></div>
    <div ref={rail} className="ll-game-rail" aria-label="Games with card collections" data-testid="library-discovery-games" onScroll={sync}>{games.map((game) => <button key={game.id} className="ll-game" title={game.title} aria-label={`Show cards for ${game.title}`} aria-expanded={String(selectedId) === String(game.id)} aria-controls={panelId} onClick={(event) => onSelect(game, event.currentTarget)}>
      <span className="ll-game-art"><Artwork src={game.cover_image || game.thumb || game.banner_image} game /></span><strong>{game.title}</strong><small>{cards.filter((card) => String(card.gameId) === String(game.id)).length} cards</small>
    </button>)}</div>
  </>;
}

export default function LibraryCardExplorer({ filters, onChange, full = false, fullViewOpen = false, onClose }) {
  const { user } = useAuth();
  const anchor = useRef(null), opener = useRef(null), gameOpener = useRef(null);
  const panelId = useId();
  const [detail, setDetail] = useState(null);
  const gameQuery = useQuery({
    queryKey: ['games-for-genre-mastery'],
    queryFn: () => readCardPages((limit, skip) => base44.entities.Game.list('-created_date', limit, skip)),
    enabled: Boolean(user?.id), staleTime: 60000,
  });
  const allGames = useMemo(() => (gameQuery.data || []).map((game) => isAdamXe(game) ? { ...game, title: 'AdamXE', genre: 'AdamXE' } : game).sort(titleOrder), [gameQuery.data]);
  const catalog = useCardsCatalog(allGames, { enabled: Boolean(user?.id) });
  const cards = useMemo(() => enrichLibraryCards(catalog.cards, allGames), [catalog.cards, allGames]);
  const genres = useMemo(() => genreOptions([...allGames, ...cards]), [allGames, cards]);
  const games = useMemo(() => filterLibraryGames(allGames, filters), [allGames, filters.search, filters.genre]);
  const visibleCards = useMemo(() => filterLibraryCards(cards, filters), [cards, filters.search, filters.genre, filters.gameId]);
  const selectedGame = filters.scope === 'games' ? games.find((game) => String(game.id) === String(filters.gameId)) || null : null;
  // Searching by game scopes the game row. Its opened leaf contains all of that
  // game's cards, rather than searching those cards for the game's title again.
  const gameCards = useMemo(() => selectedGame ? filterLibraryCards(cards, { genre: filters.genre, gameId: selectedGame.id }) : [], [cards, filters.genre, selectedGame]);
  const clearGame = useCallback(() => { onChange({ gameId: null }); requestAnimationFrame(() => gameOpener.current?.focus()); }, [onChange]);
  const selectGame = (game, element) => { gameOpener.current = element; onChange({ gameId: String(filters.gameId) === String(game.id) ? null : game.id }); };
  const inspect = (card, element) => { opener.current = element; setDetail(card); };
  const failed = gameQuery.isError || catalog.isError;
  const loading = gameQuery.isLoading || catalog.isLoading;
  const resultCount = filters.scope === 'cards' ? visibleCards.length : games.length;
  const controls = <LibraryBrowseControls genres={genres} genre={filters.genre} scope={filters.scope} onGenreChange={(genre) => onChange({ genre, gameId: null })} onScopeChange={(scope) => onChange({ scope, gameId: null })} />;

  return <section className={full ? 'll-full-explorer' : 'll-explorer'} aria-label={full ? 'Full card explorer' : 'Card explorer'}>
    {full ? <header className="ll-full-heading"><Layers size={24} /><div><h1>Card explorer</h1><p>{resultCount} {filters.scope === 'cards' ? 'cards' : 'games'}{filters.genre !== 'all' ? ` · ${filters.genre}` : ''} · Alphabetical</p></div><button onClick={onClose} aria-label="Close full card explorer"><X size={19} /></button></header> : controls}
    <div ref={anchor} className="ll-results" onWheel={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      {!user ? <div className="ll-empty"><strong>Sign in to browse your cards</strong></div> : failed ? <div className="ll-empty" role="alert"><strong>Your collection could not load</strong><button onClick={() => { gameQuery.refetch(); catalog.retry(); }}>Try again</button></div> : loading ? <div className="ll-empty" role="status">Loading games and cards…</div> : filters.scope === 'cards' ? <>
        <div className="ll-result-heading"><span>Cards · A–Z</span><span>{visibleCards.length}</span></div><Cards cards={visibleCards} onSelect={inspect} />
      </> : <>
        {games.length ? <GameRail games={games} cards={cards} selectedId={selectedGame?.id} onSelect={selectGame} panelId={panelId} /> : <div className="ll-empty"><strong>No games match</strong><span>Try another name or genre.</span><button onClick={() => onChange({ search: '', genre: 'all', gameId: null })}>Clear filters</button></div>}
        {games.length > 0 && !selectedGame && <p className="ll-hint"><ArrowRight size={14} />Choose a game to unfold its cards.</p>}
      </>}
      <LibraryScrollReveal game={!failed && !loading && (!fullViewOpen || full) ? selectedGame : null} count={gameCards.length} anchorRef={anchor} full={full} panelId={panelId} onClose={clearGame}><Cards cards={gameCards} onSelect={inspect} /></LibraryScrollReveal>
    </div>
    <Dialog open={Boolean(detail)} onOpenChange={(open) => { if (!open) setDetail(null); }}>
      {detail && <DialogContent className="ll-card-inspector" data-library-card-dialog onKeyDown={(event) => event.stopPropagation()} onCloseAutoFocus={(event) => { event.preventDefault(); opener.current?.focus(); }} onEscapeKeyDown={(event) => event.stopPropagation()}>
        <DialogTitle className={detail.isOwned && detail.user_card_id ? 'sr-only' : ''}>{detail.title}</DialogTitle>
        <DialogDescription className="sr-only">Card details, ownership and progression</DialogDescription>
        {detail.isOwned && detail.user_card_id ? <Suspense fallback={<p role="status">Loading card details…</p>}><MysteryCardDetail card={detail} onBack={() => setDetail(null)} /></Suspense> : <div className="ll-card-record">
          <div className="ll-card-art"><Artwork src={detail.image} /></div><div><p>{detail.description || 'This card is part of the game’s achievement collection.'}</p><dl><div><dt>Game</dt><dd>{detail.series || 'Not specified'}</dd></div><div><dt>Rarity</dt><dd>{detail.rarity || 'Common'}</dd></div><div><dt>Type</dt><dd>{detail.card_type || detail.group || 'Collectible'}</dd></div><div><dt>Collection</dt><dd>{detail.isOwned ? 'Collected' : 'To unlock'}</dd></div></dl><p>{detail.isOwned ? 'This card is in your collection.' : 'Unlock this card through its game or achievement to use its progression features.'}</p></div>
        </div>}
      </DialogContent>}
    </Dialog>
  </section>;
}
