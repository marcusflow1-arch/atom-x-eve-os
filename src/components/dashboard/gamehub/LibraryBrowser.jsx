import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Gamepad2, GalleryHorizontalEnd, Library, Maximize2, Minimize2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import useOwnedGames from '@/components/store/useOwnedGames';
import CrossScrollGameMenu from '@/components/dashboard/CrossScrollGameMenu';
import LibraryVoiceSearch from './LibraryVoiceSearch';
import LunaOrnateChrome from '@/components/dashboard/LunaOrnateChrome';
import LibraryBrowseControls from './LibraryBrowseControls';
import LibraryCardExplorer from './LibraryCardExplorer';
import { filterLibraryGames, genreOptions } from './libraryDiscovery';
import './library-browser.css';
import './luna-forged-library.css';

const defaultFilters = { view: 'library', scope: 'games', search: '', genre: 'all', gameId: null };
export default function LibraryBrowser({ selectedGame, onSelectGame, onLongPressGame, onOptionsGame, fullView, onToggleFullView, viewerHidden = false, onToggleViewer, filters: controlledFilters, onFiltersChange }) {
  const { user } = useAuth();
  const surfaceRef = useRef(null);
  const [surfaceHeight, setSurfaceHeight] = useState(null);
  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    const footer = document.querySelector('.glass-page-bottom-bar');
    if (!surface || !footer) return;
    const measure = () => {
      const top = surface.getBoundingClientRect().top;
      const bottom = footer.getBoundingClientRect().top;
      setSurfaceHeight(Math.max(0, Math.floor(bottom - top)));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(footer);
    if (surface.parentElement) observer.observe(surface.parentElement);
    window.addEventListener('resize', measure);
    measure();
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [viewerHidden]);

  const ownership = useOwnedGames();
  const [localFilters, setLocalFilters] = useState(defaultFilters);
  const filters = controlledFilters || localFilters;
  const change = onFiltersChange || ((patch) => setLocalFilters((value) => ({ ...value, ...patch })));
  const cardsView = filters.view === 'cards';
  const key = `luna_library_favorites_${user?.id || 'guest'}`;
  const [saved, setSaved] = useState({});
  const [error, setError] = useState('');
  useEffect(() => {
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); setSaved({ key, ids: Array.isArray(value) ? value : [] }); }
    catch { setSaved({ key, ids: [] }); }
  }, [key]);
  const favorites = saved.key === key ? saved.ids : [];
  const games = useMemo(() => (ownership.games || []).map((game) => ({ ...game, thumb: game.cover_image, image: game.banner_image || game.cover_image })), [ownership.games]);
  const filtered = useMemo(() => filterLibraryGames(games, filters), [games, filters.search, filters.genre]);
  const genres = useMemo(() => genreOptions(games), [games]);
  const toggleFavorite = (game) => {
    const ids = favorites.includes(game.id) ? favorites.filter((id) => id !== game.id) : [...favorites, game.id];
    try { localStorage.setItem(key, JSON.stringify(ids)); setSaved({ key, ids }); setError(''); }
    catch { setError('Favorites could not be saved on this device.'); }
  };
  const openGames = () => change({ view: 'library', scope: 'games', gameId: null });
  const openCards = () => change({ view: 'cards', scope: 'games', gameId: null });
  return <section ref={surfaceRef} style={surfaceHeight === null ? undefined : { height: surfaceHeight }} data-testid="library-browser" className="library-surface ll-browser ll-forged-library h-full min-h-0 flex flex-col" onWheel={(event) => event.stopPropagation()}>
    <LunaOrnateChrome variant="library" />
    <div className="ll-forged-library-inner">
      <header className="ll-toolbar">
        <LibraryVoiceSearch value={filters.search} onChange={(search) => change({ search, gameId: null })} subject={cardsView && filters.scope === 'cards' ? 'cards' : 'games'} />
        <button type="button" className="ll-viewer-toggle" aria-label={viewerHidden ? 'Restore avatar viewer and stats' : 'Expand Library and hide avatar viewer'} title={viewerHidden ? 'Restore avatar viewer' : 'Expand Library'} aria-pressed={viewerHidden} onClick={onToggleViewer}>{viewerHidden ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
      </header>
      <nav className="ll-forged-tabs" aria-label="Games and cards navigation">
        <button type="button" className="ll-forged-tab" aria-pressed={!cardsView && !fullView} onClick={openGames}><Gamepad2 size={15} aria-hidden="true" /><span>Games</span></button>
        <button type="button" className="ll-forged-tab" aria-pressed={cardsView && !fullView} onClick={openCards}><GalleryHorizontalEnd size={15} aria-hidden="true" /><span>Cards</span></button>
        <button type="button" className="ll-forged-tab" aria-label={cardsView ? 'Full card explorer' : 'Full game library'} aria-pressed={Boolean(fullView)} onClick={onToggleFullView}><Library size={15} aria-hidden="true" /><span>Library</span></button>
      </nav>
      {cardsView ? <LibraryCardExplorer filters={filters} onChange={change} fullViewOpen={fullView} /> : <>
        <LibraryBrowseControls genres={genres} genre={filters.genre} scope="games" showCardBrowse={false} onGenreChange={(genre) => change({ genre })} onScopeChange={(scope) => { if (scope === 'cards') openCards(); }} />
        <div className="ll-forged-collection-heading">
          <span>My Games <strong>{filtered.length}</strong></span>
          <button type="button" aria-label="Full game library" aria-pressed={Boolean(fullView)} onClick={onToggleFullView}>Full Library <span aria-hidden="true">→</span></button>
        </div>
        {(error || ownership.isError) && <p role="status" className="px-3 text-xs">{error || 'Owned games could not load.'}{ownership.isError && <button className="ml-2 underline" onClick={ownership.refetch}>Retry</button>}</p>}
        {ownership.isLoading && user && <p role="status" className="px-3 text-xs">Loading owned games…</p>}
        <div className="ll-content"><CrossScrollGameMenu games={filtered} selectedGame={selectedGame} onSelectGame={onSelectGame} onLongPressGame={onLongPressGame} onOptionsGame={onOptionsGame} favorites={favorites} onToggleFavorite={toggleFavorite} browsing /></div>
      </>}
    </div>
  </section>;
}
