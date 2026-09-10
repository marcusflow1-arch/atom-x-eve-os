import React, { useMemo, useState } from 'react';
import { X, Library } from 'lucide-react';
import OwnedLibraryTile from '@/components/dashboard/gamehub/OwnedLibraryTile';
import { genreParts } from '@/components/dashboard/gamehub/ownedLibraryData';

export default function OwnedLibraryGrid({ games, loading, error, retry, onSelect, onClose }) {
  const [genre, setGenre] = useState('all');
  const [sort, setSort] = useState('title');
  const genres = [...new Set(games.flatMap(genreParts))].sort();
  const filtered = useMemo(() => games.filter(g => genre === 'all' || genreParts(g).includes(genre)).sort((a, b) => {
    const title = a.title.localeCompare(b.title);
    if (sort === 'genre') return (a.genre || '').localeCompare(b.genre || '') || title;
    if (sort === 'most' || sort === 'least') {
      if (a.playedHours == null || b.playedHours == null) return a.playedHours == null && b.playedHours == null ? title : a.playedHours == null ? 1 : -1;
      return (sort === 'most' ? b.playedHours - a.playedHours : a.playedHours - b.playedHours) || title;
    }
    if (sort === 'recent') return (Date.parse(b.lastPlayed) || 0) - (Date.parse(a.lastPlayed) || 0) || title;
    return title;
  }), [games, genre, sort]);
  return <section data-testid="owned-library-grid" className="flex h-full min-h-0 flex-col">
    <header className="shrink-0 space-y-5 border-b border-border/60 p-5">
      <div className="flex items-center gap-3"><Library className="h-5 w-5 text-primary" /><div className="flex-1"><h1 className="text-xl font-bold">Full Library</h1><p className="mt-1 text-xs text-muted-foreground">{games.length} owned games</p></div><button aria-label="Close full library" onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button></div>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <label className="flex items-center gap-2">Genre<select aria-label="Owned library genre" value={genre} onChange={e => setGenre(e.target.value)} className="max-w-56 rounded-lg border border-border bg-popover p-2 text-popover-foreground"><option value="all">All genres</option>{genres.map(g => <option key={g} value={g}>{g}</option>)}</select></label>
        <label className="flex items-center gap-2">Sort by<select aria-label="Owned library sort" value={sort} onChange={e => setSort(e.target.value)} className="rounded-lg border border-border bg-popover p-2 text-popover-foreground"><option value="title">Title A–Z</option><option value="genre">Genre</option><option value="most">Most played</option><option value="least">Least played</option><option value="recent">Recently played</option></select></label>
        <span className="ml-auto text-muted-foreground">{filtered.length} games</span>
      </div>
      {['most', 'least'].includes(sort) && <p className="text-xs text-muted-foreground">Sorted by recorded playtime; games without playtime appear last.</p>}
    </header>
    <div data-testid="owned-library-scroll" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5" onWheel={e => e.stopPropagation()}>
      {loading ? <p role="status">Loading your games…</p> : error ? <div role="alert">Unable to load your games. <button onClick={retry} className="underline">Retry</button></div> : !games.length ? <p className="text-muted-foreground">Your library is empty. Games you own will appear here.</p> : !filtered.length ? <p className="text-muted-foreground">No owned games match this genre.</p> : <div data-testid="owned-library-tiles" className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 items-stretch">{filtered.map(game => <OwnedLibraryTile key={game.id} game={game} onSelect={onSelect} />)}</div>}
    </div>
  </section>;
}