import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Gamepad2, Search, Sprout, X } from 'lucide-react';

const PAGE_SIZE = 72;
const artFor = (game) => game?.cover_image || game?.banner_image || game?.image || game?.thumbnail || '';
const genreFor = (game) => game?.genre || game?.category || 'Other';

export default function FarmGameBrowserOverlay({ open, games = [], onClose, onSelectGame }) {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');
  const [sort, setSort] = useState('az');
  const [page, setPage] = useState(1);

  const genres = useMemo(() => {
    const counts = new Map();
    games.forEach((game) => {
      const value = genreFor(game);
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
  }, [games]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = games.filter((game) => {
      if (genre !== 'all' && genreFor(game) !== genre) return false;
      if (!q) return true;
      return [game.title, game.genre, game.developer, game.publisher, game.platform]
        .some((value) => String(value || '').toLowerCase().includes(q));
    });
    return [...rows].sort((a, b) => sort === 'newest'
      ? Number(b.original_year || b.release_year || 0) - Number(a.original_year || a.release_year || 0)
      : String(a.title || '').localeCompare(String(b.title || '')));
  }, [games, genre, query, sort]);

  useEffect(() => { setPage(1); }, [genre, query, sort]);
  useEffect(() => {
    if (!open) { setQuery(''); setGenre('all'); setPage(1); }
  }, [open]);

  const visible = filtered.slice(0, page * PAGE_SIZE);

  return <AnimatePresence>
    {open && <motion.section
      className="farm-browser"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: .22, ease: 'easeOut' }}
      aria-label="Browse farming communities"
    >
      <header className="farm-browser-header">
        <div className="farm-browser-title"><Sprout size={20} /><div><div className="farm-eyebrow">Farm communities</div><h2>Choose a game</h2></div></div>
        <label className="farm-browser-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search game, genre, developer or publisher" autoFocus /></label>
        <button className="farm-browser-close" type="button" onClick={onClose} aria-label="Close game browser"><X size={17} /></button>
      </header>

      <div className="farm-browser-layout">
        <aside className="farm-browser-sidebar">
          <p>Filter games</p>
          <button type="button" className={`farm-filter-button ${genre === 'all' ? 'is-active' : ''}`} onClick={() => setGenre('all')}><span>All games</span><span>{games.length}</span></button>
          {genres.map(([name, count]) => <button key={name} type="button" className={`farm-filter-button ${genre === name ? 'is-active' : ''}`} onClick={() => setGenre(name)}><span>{name}</span><span>{count}</span></button>)}
        </aside>

        <main className="farm-browser-main">
          <div className="farm-browser-toolbar"><h3>{genre === 'all' ? 'All farming communities' : genre}<span>{filtered.length.toLocaleString()} found</span></h3><select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort games"><option value="az">A–Z</option><option value="newest">Newest games</option></select></div>
          <div className="farm-directory-grid">
            {visible.map((game) => <button type="button" key={game.id || game.title} className="farm-directory-card" onClick={() => onSelectGame?.(game)}>
              <div className="farm-directory-art">{artFor(game) ? <img src={artFor(game)} alt="" loading="lazy" /> : <div className="farm-directory-placeholder"><Gamepad2 size={25} /></div>}<span className="farm-directory-badge">{genreFor(game)}</span></div>
              <strong>{game.title || 'Untitled Game'}</strong><small>{[game.developer || game.publisher, game.original_year || game.release_year].filter(Boolean).join(' · ') || 'Farming community'}</small>
            </button>)}
          </div>
          {!filtered.length && <div className="farm-empty"><Search size={26} /><h3>No games match that search</h3><p>Try a broader title, publisher, developer, or genre.</p></div>}
          {visible.length < filtered.length && <button type="button" className="farm-load-more" onClick={() => setPage((value) => value + 1)}>Load more games</button>}
        </main>
      </div>
    </motion.section>}
  </AnimatePresence>;
}
