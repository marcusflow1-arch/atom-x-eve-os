import React, { useEffect, useMemo, useState } from 'react';
import { GalleryHorizontalEnd, Library } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import useOwnedGames from '@/components/store/useOwnedGames';
import CrossScrollGameMenu from '@/components/dashboard/CrossScrollGameMenu';
import LibraryVoiceSearch from './LibraryVoiceSearch';
import LibraryBrowseControls from './LibraryBrowseControls';
import LibraryCardExplorer from './LibraryCardExplorer';
import { filterLibraryGames, genreOptions } from './libraryDiscovery';
import './library-browser.css';

const defaultFilters = { view: 'library', scope: 'games', search: '', genre: 'all', gameId: null };
export default function LibraryBrowser({ selectedGame, onSelectGame, onLongPressGame, onOptionsGame, fullView, onToggleFullView, filters: controlledFilters, onFiltersChange }) {
  const { user } = useAuth();
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
  return <section data-testid="library-browser" className="library-surface ll-browser h-full min-h-0 flex flex-col" onWheel={(event) => event.stopPropagation()}>
    <header className="ll-toolbar">
      <LibraryVoiceSearch value={filters.search} onChange={(search) => change({ search, gameId: null })} subject={cardsView && filters.scope === 'cards' ? 'cards' : 'games'} />
      <button className="ll-view-toggle" aria-label={cardsView ? 'Return to game library' : 'Open card explorer'} title={cardsView ? 'Game library' : 'Card explorer'} aria-pressed={cardsView} onClick={() => change({ view: cardsView ? 'library' : 'cards', scope: 'games', gameId: null })}>{cardsView ? <Library size={18} /> : <GalleryHorizontalEnd size={18} />}</button>
      <button className="ll-full-view" aria-label={cardsView ? 'Full card explorer' : 'Full game library'} aria-pressed={fullView} onClick={onToggleFullView}>Full View</button>
    </header>
    {cardsView ? <LibraryCardExplorer filters={filters} onChange={change} fullViewOpen={fullView} /> : <>
      <LibraryBrowseControls genres={genres} genre={filters.genre} scope="games" onGenreChange={(genre) => change({ genre })} onScopeChange={(scope) => { if (scope === 'cards') change({ view: 'cards', scope, gameId: null }); }} />
      {(error || ownership.isError) && <p role="status" className="px-3 text-xs">{error || 'Owned games could not load.'}{ownership.isError && <button className="ml-2 underline" onClick={ownership.refetch}>Retry</button>}</p>}
      {ownership.isLoading && user && <p role="status" className="px-3 text-xs">Loading owned games…</p>}
      <div className="ll-content"><CrossScrollGameMenu games={filtered} selectedGame={selectedGame} onSelectGame={onSelectGame} onLongPressGame={onLongPressGame} onOptionsGame={onOptionsGame} favorites={favorites} onToggleFavorite={toggleFavorite} browsing /></div>
    </>}
  </section>;
}
