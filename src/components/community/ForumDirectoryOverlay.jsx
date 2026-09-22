import { useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, Gamepad2, MessageSquare, Search, SlidersHorizontal, X } from 'lucide-react';
import './forumRefresh.css';

const PAGE_SIZE = 36;
const artFor = (game) => game?.cover_image || game?.banner_image || game?.image || game?.thumbnail || '';
const genresFor = (game) => String(game.genre || game.category || 'Other').split(/[,;|]/).map((name) => name.trim()).filter(Boolean);

export default function ForumDirectoryOverlay({ open, games = [], activeGame, loading = false, error = false, onRetry, onClose, onSelectGame }) {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');
  const [sort, setSort] = useState('az');
  const [page, setPage] = useState(1);
  const searchRef = useRef(null);
  const returnFocus = useRef(null);
  const genres = useMemo(() => {
    const counts = new Map();
    games.forEach((game) => genresFor(game).forEach((name) => counts.set(name, (counts.get(name) || 0) + 1)));
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [games]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return games.filter((game) => (genre === 'all' || genresFor(game).includes(genre)) &&
      (!q || [game.title, game.genre, game.developer, game.publisher, game.platform].some((value) => String(value || '').toLowerCase().includes(q))))
      .sort((a, b) => sort === 'newest' ? Number(b.original_year || b.release_year || 0) - Number(a.original_year || a.release_year || 0) || String(a.title).localeCompare(String(b.title)) : String(a.title || '').localeCompare(String(b.title || '')));
  }, [games, genre, query, sort]);
  useEffect(() => { setPage(1); }, [genre, query, sort]);
  useEffect(() => { if (!open) { setQuery(''); setGenre('all'); setPage(1); } }, [open]);
  useEffect(() => {
    const home = () => onSelectGame?.(null);
    window.addEventListener('forumGoHome', home);
    return () => window.removeEventListener('forumGoHome', home);
  }, [onSelectGame]);
  const reset = () => { setQuery(''); setGenre('all'); };
  const visible = filtered.slice(0, page * PAGE_SIZE);
  return <Dialog.Root open={open} onOpenChange={(value) => { if (!value) onClose?.(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="forum-directory-scrim" />
      <Dialog.Content className="forum-directory-v2" onOpenAutoFocus={(event) => { event.preventDefault(); returnFocus.current = document.activeElement; searchRef.current?.focus(); }} onCloseAutoFocus={(event) => { event.preventDefault(); if (returnFocus.current?.isConnected) returnFocus.current.focus(); }}>
        <header className="forum-directory-heading">
          <div><span className="forum-eyebrow">EXPLORE THE COMMUNITY</span><Dialog.Title>Find your game. Find your people.</Dialog.Title><Dialog.Description>Choose a forum to read discussions, discover player guides, or start your own conversation.</Dialog.Description></div>
          <Dialog.Close className="forum-directory-close" aria-label="Close forum browser"><X size={20} /></Dialog.Close>
        </header>
        <label className="forum-directory-search"><Search size={20} /><input ref={searchRef} aria-label="Search game forums" placeholder="Search games, genres, or studios…" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" aria-label="Clear forum search" onClick={() => setQuery('')}><X size={17} /></button>}</label>
        <div className="forum-directory-body">
          <aside className="forum-directory-filters" aria-label="Filter forums by genre"><h3><SlidersHorizontal size={15} />Browse by genre</h3>
            <button type="button" aria-pressed={genre === 'all'} onClick={() => setGenre('all')}><span>All genres</span><small>{games.length}</small></button>
            {genres.map(([name, count]) => <button type="button" key={name} aria-pressed={genre === name} onClick={() => setGenre(name)}><span>{name}</span><small>{count}</small></button>)}
          </aside>
          <div className="forum-directory-results">
            <div className="forum-directory-toolbar">
              <div><strong>{genre === 'all' ? 'Game forums' : genre}</strong><span role="status">{loading ? 'Loading…' : filtered.length + ' games'}</span></div>
              <label className="forum-mobile-genres"><span className="sr-only">Filter forums by genre</span><select value={genre} onChange={(event) => setGenre(event.target.value)}><option value="all">All genres</option>{genres.map(([name]) => <option key={name}>{name}</option>)}</select></label>
              <select aria-label="Sort forums" value={sort} onChange={(event) => setSort(event.target.value)}><option value="az">Name: A–Z</option><option value="newest">Newest games</option></select>
            </div>
            {!query && genre === 'all' && <button type="button" className="forum-general-link" onClick={() => onSelectGame?.(null)}><MessageSquare size={24} /><div><strong>All community discussions</strong><span>One feed for every game. See what’s happening across Atom X Eve.</span></div><ArrowRight size={19} /></button>}
            {loading ? <div className="forum-directory-state" role="status">Loading game communities…</div> : error ? <div className="forum-directory-state" role="alert"><h3>The game directory couldn’t load.</h3><button type="button" onClick={onRetry}>Try again</button></div> : <>
              <div className="forum-directory-cards">{visible.map((game) => <button type="button" key={game.id || game.title} className="forum-directory-game" aria-current={activeGame?.title === game.title ? 'true' : undefined} onClick={() => onSelectGame?.(game)}>
                <div className="forum-directory-cover"><Gamepad2 size={28} />{artFor(game) && <img src={artFor(game)} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />}<span>{activeGame?.title === game.title ? 'Current forum' : genresFor(game)[0]}</span></div>
                <div><strong>{game.title || 'Game community'}</strong><small>{game.developer || game.publisher || 'Discussion · Guides · Achievements'}</small><span>Visit forum <ArrowRight size={13} /></span></div>
              </button>)}</div>
              {!filtered.length && <div className="forum-directory-state"><Search size={28} /><h3>No matching game forums</h3><p>Try another game, studio, or genre.</p><button type="button" onClick={reset}>Clear filters</button></div>}
              {visible.length < filtered.length && <button type="button" className="forum-directory-more" onClick={() => setPage((value) => value + 1)}>Show more games · {filtered.length - visible.length} remaining</button>}
            </>}
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
