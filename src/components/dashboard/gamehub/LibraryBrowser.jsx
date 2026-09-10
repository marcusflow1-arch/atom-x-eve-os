import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import CrossScrollGameMenu from '@/components/dashboard/CrossScrollGameMenu';
import LibraryVoiceSearch from '@/components/dashboard/gamehub/LibraryVoiceSearch';
import { libraryCatalog } from '@/components/dashboard/gamehub/libraryCatalog';

export default function LibraryBrowser({ selectedGame, onSelectGame, onLongPressGame, fullView, onToggleFullView }) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [collection, setCollection] = useState('all');
  const [genre, setGenre] = useState('all');
  const key = `luna_library_favorites_${user?.id || 'guest'}`;
  const [saved, setSaved] = useState({});
  const [error, setError] = useState('');
  useEffect(() => { const value = localStorage.getItem(key); setSaved({ key, ids: value ? JSON.parse(value) : [] }); }, [key]);
  const favorites = saved.key === key ? saved.ids : [];
  const { data: records = [], isLoading, isError } = useQuery({ queryKey: ['all_games_focus_panel'], queryFn: () => base44.entities.Game.list(), enabled: !!user, staleTime: 300000 });
  const games = useMemo(() => {
    const owned = records.filter(g => (user?.purchased_items || []).includes(g.id));
    const titles = new Set(owned.map(g => g.title.toLowerCase()));
    return [...libraryCatalog.filter(g => !titles.has(g.title.toLowerCase())), ...owned.map(g => ({ ...g, thumb: g.cover_image, image: g.banner_image || g.cover_image }))].sort((a,b) => a.title.localeCompare(b.title));
  }, [records, user?.purchased_items]);
  const genres = [...new Set(games.flatMap(g => g.genre.split(/\s*\/\s*/)))].sort();
  const filtered = games.filter(g => g.title.toLowerCase().includes(search.trim().toLowerCase()) && (collection === 'all' || favorites.includes(g.id)) && (genre === 'all' || g.genre.split(/\s*\/\s*/).includes(genre)));
  const toggleFavorite = g => {
    const ids = favorites.includes(g.id) ? favorites.filter(id => id !== g.id) : [...favorites, g.id];
    try { localStorage.setItem(key, JSON.stringify(ids)); setSaved({ key, ids }); setError(''); } catch { setError('Favorites could not be saved on this device.'); }
  };
  return <section data-testid="library-browser" className="library-surface h-full min-h-0 flex flex-col overflow-hidden" onWheel={e => e.stopPropagation()}>
    <div className="shrink-0 px-3 pb-2 space-y-2 border-b border-current/20">
      <div className="flex items-start gap-2"><LibraryVoiceSearch value={search} onChange={setSearch} /><button className="shrink-0 py-2 text-xs font-semibold" aria-pressed={fullView} onClick={() => onToggleFullView(selectedGame || filtered[0] || games[0])}>Full View</button></div>
      <div className="flex items-center gap-2"><nav className="flex gap-2 text-xs" aria-label="Library collections"><button aria-pressed={collection === 'all'} onClick={() => setCollection('all')} className={collection === 'all' ? 'text-primary underline' : ''}>All</button><button title="Favorites saved on this device" aria-pressed={collection === 'favorites'} onClick={() => setCollection('favorites')} className={collection === 'favorites' ? 'text-primary underline' : ''}>Favorites</button></nav><select aria-label="Filter library by genre" value={genre} onChange={e => setGenre(e.target.value)} className="min-w-0 flex-1 rounded-md bg-popover text-popover-foreground p-1 text-xs"><option value="all">All genres</option>{genres.map(g => <option key={g}>{g}</option>)}</select><span className="text-[10px]">{filtered.length}</span></div>
      {(error || isError) && <p role="status" className="text-xs">{error || 'Owned games could not load; showing the demo catalog.'}</p>}
      {isLoading && user && <p className="text-xs">Loading owned games…</p>}
    </div>
    <div className="flex-1 min-h-0"><CrossScrollGameMenu games={filtered} selectedGame={selectedGame} onSelectGame={onSelectGame} onLongPressGame={onLongPressGame} favorites={favorites} onToggleFavorite={toggleFavorite} browsing /></div>
  </section>;
}