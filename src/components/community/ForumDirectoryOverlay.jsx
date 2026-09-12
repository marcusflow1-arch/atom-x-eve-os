import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Gamepad2, Search, SlidersHorizontal, X } from 'lucide-react';

const PAGE_SIZE = 72;
const artFor = (game) => game?.cover_image || game?.banner_image || game?.image || game?.thumbnail || '';
const labelFor = (game) => game?.genre || game?.category || 'Game';

export default function ForumDirectoryOverlay({ open, games = [], activeGame, onClose, onSelectGame }) {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');
  const [sort, setSort] = useState('az');
  const [page, setPage] = useState(1);

  const genres = useMemo(() => {
    const counts = new Map();
    games.forEach((game) => {
      const value = labelFor(game);
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 28);
  }, [games]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = games.filter((game) => {
      if (genre !== 'all' && labelFor(game) !== genre) return false;
      if (!q) return true;
      return [game.title, game.genre, game.developer, game.publisher, game.platform]
        .some((value) => String(value || '').toLowerCase().includes(q));
    });
    return [...rows].sort((a, b) => {
      if (sort === 'newest') return Number(b.original_year || b.release_year || 0) - Number(a.original_year || a.release_year || 0);
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
  }, [games, genre, query, sort]);

  useEffect(() => { setPage(1); }, [genre, query, sort]);
  useEffect(() => {
    if (!open) { setQuery(''); setGenre('all'); setPage(1); }
  }, [open]);

  useEffect(() => {
    const handleForumHome = () => onSelectGame?.(null);
    window.addEventListener('forumGoHome', handleForumHome);
    return () => window.removeEventListener('forumGoHome', handleForumHome);
  }, [onSelectGame]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const visible = filtered.slice(0, page * PAGE_SIZE);

  return <AnimatePresence>
    {open && <motion.section
      className="forum-browser"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: .22, ease: 'easeOut' }}
      aria-label="Browse forums"
      style={{
        position: 'fixed',
        top: '64px',
        bottom: '48px',
        left: 0,
        right: 0,
        zIndex: 60,
        background: 'rgba(8, 12, 18, 0.96)',
        backdropFilter: 'blur(30px) saturate(135%)',
        WebkitBackdropFilter: 'blur(30px) saturate(135%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.055), 0 20px 70px rgba(0,0,0,0.55)',
      }}
    >
      <header className="forum-browser-header">
        <div className="forum-browser-title">
          <SlidersHorizontal size={20} />
          <div>
            <div className="forum-eyebrow">Forum directory</div>
            <h2>Find a community</h2>
          </div>
        </div>
        <label className="forum-browser-search">
          <Search size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search game, genre, developer or publisher" autoFocus />
        </label>
        <button className="forum-browser-close" type="button" onClick={onClose} aria-label="Close forum browser"><X size={17} /></button>
      </header>

      <div className="forum-browser-layout">
        <aside className="forum-browser-sidebar">
          <p>Filter communities</p>
          <button type="button" className={`forum-filter-button ${genre === 'all' ? 'is-active' : ''}`} onClick={() => setGenre('all')}>
            <span>All forums</span><span>{games.length}</span>
          </button>
          {genres.map(([name, count]) => <button key={name} type="button" className={`forum-filter-button ${genre === name ? 'is-active' : ''}`} onClick={() => setGenre(name)}>
            <span>{name}</span><span>{count}</span>
          </button>)}
        </aside>

        <main className="forum-browser-main">
          <div className="forum-browser-toolbar">
            <h3>{genre === 'all' ? 'All forums' : genre}<span>{filtered.length.toLocaleString()} found</span></h3>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort forums">
              <option value="az">A–Z</option>
              <option value="newest">Newest games</option>
            </select>
          </div>

          <div className="forum-directory-grid">
            {genre === 'all' && !query && <button type="button" className="forum-directory-card" onClick={() => onSelectGame?.(null)}>
              <div className="forum-directory-art"><div className="absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,.18),transparent_55%),linear-gradient(135deg,#0a1726,#071019)]"><Gamepad2 size={30} className="text-cyan-200/70" /></div><span className="forum-directory-badge">Platform-wide</span></div>
              <strong>General Community</strong><small>All games · all discussions</small>
            </button>}

            {visible.map((game) => <button type="button" key={game.id || game.title} className="forum-directory-card" onClick={() => onSelectGame?.(game)}>
              <div className="forum-directory-art">
                {artFor(game) ? <img src={artFor(game)} alt="" loading="lazy" /> : <div className="absolute inset-0 grid place-items-center"><Gamepad2 size={25} className="text-cyan-200/45" /></div>}
                <span className="forum-directory-badge">{activeGame?.id === game.id ? 'Current forum' : labelFor(game)}</span>
              </div>
              <strong>{game.title || 'Untitled Game'}</strong>
              <small>{[game.developer || game.publisher, game.original_year || game.release_year].filter(Boolean).join(' · ') || 'Game community'}</small>
            </button>)}
          </div>

          {!filtered.length && <div className="forum-empty"><Search size={26} /><h3>No forum matches that search</h3><p>Try a game title, developer, publisher or broader genre.</p></div>}
          {visible.length < filtered.length && <button type="button" className="forum-load-more" onClick={() => setPage((value) => value + 1)}>Load more forums</button>}
        </main>
      </div>
    </motion.section>}
  </AnimatePresence>;
}
