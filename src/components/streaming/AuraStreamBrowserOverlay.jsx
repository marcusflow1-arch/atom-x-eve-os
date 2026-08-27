import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Search, Maximize2, Minimize2, Radio, X, Gamepad2 } from 'lucide-react';

const OPEN_EVENT = 'atomxe:aura-stream-browser';

export const openAuraStreamBrowser = () => window.dispatchEvent(new CustomEvent(OPEN_EVENT));

export default function AuraStreamBrowserOverlay() {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [games, setGames] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    const handler = () => setOpen((v) => !v);
    window.addEventListener(OPEN_EVENT, handler);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, handler);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (!open || games.length) return;
    let mounted = true;
    base44.entities.Game.list().then((res) => {
      if (mounted) setGames(res?.data || res || []);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [open, games.length]);

  const genres = useMemo(() => ['All', ...new Set(games.map(g => g.genre).filter(Boolean))], [games]);
  const filtered = useMemo(() => games.filter(g => {
    const matchesGenre = selectedGenre === 'All' || g.genre === selectedGenre;
    const matchesQuery = !query.trim() || String(g.title || '').toLowerCase().includes(query.toLowerCase());
    return matchesGenre && matchesQuery;
  }), [games, selectedGenre, query]);

  const chooseGame = (game) => {
    setSelectedGame(game);
    setOpen(false);
    window.dispatchEvent(new CustomEvent('atomxe:aura-game-selected', { detail: game }));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[10000] pointer-events-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 pointer-events-none" />
          <motion.section
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            className={`absolute right-0 bottom-0 pointer-events-auto overflow-hidden border-t border-white/10 bg-[#080d13]/80 backdrop-blur-md shadow-[0_-20px_80px_rgba(0,0,0,.35)] ${fullscreen ? 'left-0 top-0' : 'left-1/2 top-1/2'}`}
          >
            <div className="h-full w-full flex flex-col">
              <header className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-white/10 bg-black/10">
                <div className="flex items-center gap-3"><Radio className="w-4 h-4 text-purple-300" /><span className="text-xs font-bold uppercase tracking-[.2em]">Stream Browser</span></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setFullscreen(v => !v)} className="p-2 text-white/60 hover:text-white" title={fullscreen ? 'Minimize' : 'Fullscreen'}>{fullscreen ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}</button>
                  <button onClick={() => setOpen(false)} className="p-2 text-white/60 hover:text-white" title="Close"><X size={17}/></button>
                </div>
              </header>
              <div className="flex min-h-0 flex-1">
                <aside className="w-56 shrink-0 border-r border-white/10 p-4 overflow-y-auto">
                  <div className="relative mb-5"><Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a game" className="w-full h-9 pl-9 pr-3 bg-white/5 border border-white/10 rounded-none outline-none text-xs"/></div>
                  <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Categories</div>
                  <div className="space-y-1">{genres.map(g => <button key={g} onClick={()=>setSelectedGenre(g)} className={`w-full text-left px-3 py-2 text-xs transition ${selectedGenre===g ? 'text-white bg-white/10' : 'text-white/55 hover:text-white hover:bg-white/5'}`}><Gamepad2 className="inline w-3.5 h-3.5 mr-2"/>{g}</button>)}</div>
                </aside>
                <main className="min-w-0 flex-1 overflow-y-auto p-5">
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    {filtered.map(game => <button key={game.id || game.title} onClick={()=>chooseGame(game)} className="text-left group bg-white/[.035] hover:bg-white/[.07] border border-white/10 overflow-hidden transition">
                      <div className="aspect-[16/9] overflow-hidden bg-black/30"><img src={game.cover_image || game.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/></div>
                      <div className="p-3"><div className="text-xs font-semibold truncate">{game.title || 'Untitled game'}</div><div className="mt-1 text-[10px] text-white/40">{game.genre || 'Games'} · Live discovery</div></div>
                    </button>)}
                  </div>
                  {!filtered.length && <div className="h-full flex items-center justify-center text-white/30 text-sm">No streaming games found.</div>}
                </main>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
