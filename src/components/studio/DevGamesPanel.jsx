import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Mic, MicOff, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import useStudioProfile from './useStudioProfile';
import StudioLogo from './StudioLogo';

/**
 * "Games" panel of the Dev Info bar — the developer behind THIS game and their titles.
 * Layout: studio picture (far left) → search → genre filters → games grid.
 */
export default function DevGamesPanel({ open, game }) {
  const navigate = useNavigate();
  const { profile, loading } = useStudioProfile(game);
  const [searchValue, setSearchValue] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [isListening, setIsListening] = useState(false);
  const [storeGames, setStoreGames] = useState([]);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  // Titles from this studio that exist in the store, so tiles can open them
  useEffect(() => {
    if (!profile?.developer_name) return;
    base44.entities.Game.filter({ developer: profile.developer_name })
      .then((rows) => setStoreGames(rows || []))
      .catch(() => setStoreGames([]));
  }, [profile?.developer_name]);

  const handleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e) => setSearchValue(e.results[0][0].transcript);
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
    setIsListening(true);
  };

  // Merge web-sourced titles with store entries (store wins, so tiles are clickable)
  const devGames = useMemo(() => {
    const web = (profile?.notable_games || []).map((g) => ({
      id: `web-${g.title}`,
      title: g.title,
      genre: g.genre || '',
      year: g.year,
      cover: null,
    }));
    const store = storeGames.map((g) => ({
      id: g.id,
      title: g.title,
      genre: g.genre || '',
      year: g.original_year,
      cover: g.cover_image,
      storeId: g.id,
    }));
    const seen = new Set(store.map((g) => g.title.toLowerCase()));
    return [...store, ...web.filter((g) => !seen.has(g.title.toLowerCase()))];
  }, [profile?.notable_games, storeGames]);

  const genres = useMemo(() => {
    const set = new Set();
    devGames.forEach((g) => {
      if (g.genre) set.add(g.genre);
    });
    return ['All', ...Array.from(set)];
  }, [devGames]);

  const filtered = devGames.filter((g) => {
    const matchesSearch = g.title.toLowerCase().includes(searchValue.toLowerCase());
    const matchesGenre = activeGenre === 'All' || g.genre === activeGenre;
    return matchesSearch && matchesGenre;
  });

  const openGame = (g) => {
    if (g.storeId) navigate(`/GameDetail?id=${g.storeId}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="fixed left-0 right-0 z-[34] flex gap-4 px-5 py-3"
          style={{
            top: '64px',
            height: '188px',
            // Blends into the page instead of sitting in a hard box
            background:
              'linear-gradient(to bottom, rgba(8,12,18,0.62) 0%, rgba(8,12,18,0.42) 65%, rgba(8,12,18,0) 100%)',
            backdropFilter: 'blur(22px) saturate(150%)',
            WebkitBackdropFilter: 'blur(22px) saturate(150%)',
          }}
        >
          {/* ── Far left: studio picture + name ── */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ width: '150px' }}>
            <p className="text-white font-extrabold text-[11px] uppercase tracking-widest text-center leading-tight line-clamp-2">
              {profile?.developer_name || (loading ? '—' : 'Unknown Studio')}
            </p>
            <StudioLogo
              name={profile?.developer_name || ''}
              logoUrl={profile?.logo_url}
              className="w-[104px] h-[104px] text-2xl"
            />
          </div>

          {/* ── Search (with voice), right of the studio picture ── */}
          <div className="flex flex-col gap-2 flex-shrink-0" style={{ width: '190px' }}>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-white/10 bg-white/[0.05]">
              <Search className="w-3.5 h-3.5 flex-shrink-0 text-white/35" />
              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search studio games..."
                className="flex-1 bg-transparent text-[11px] text-white placeholder:text-white/30 focus:outline-none min-w-0"
              />
              <button
                onClick={handleMic}
                title={isListening ? 'Stop voice search' : 'Voice search'}
                className={`flex-shrink-0 transition-colors ${isListening ? 'text-red-400' : 'text-white/40 hover:text-white'}`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[9px] uppercase tracking-widest text-white/25 font-bold px-1">
              {loading ? 'Identifying studio…' : `${filtered.length} title${filtered.length === 1 ? '' : 's'}`}
            </p>
          </div>

          {/* ── Filters: vertical genre scroll, right of the search bar ── */}
          <div className="flex gap-3 flex-shrink-0">
            <div className="w-px self-stretch bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            <div className="overflow-y-auto pr-1" style={{ width: '104px', scrollbarWidth: 'none' }}>
              <div className="flex flex-col gap-1">
                {genres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setActiveGenre(g)}
                    className={`text-left px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide truncate transition-all ${
                      activeGenre === g
                        ? 'bg-white/15 text-white'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-px self-stretch bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          </div>

          {/* ── Games grid ── */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
            {filtered.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <span className="text-white/20 text-xs">
                  {loading ? 'Loading studio titles…' : 'No games found'}
                </span>
              </div>
            ) : (
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))' }}>
                {filtered.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => openGame(g)}
                    title={g.title}
                    className="group relative rounded-lg overflow-hidden border border-white/10 hover:border-white/35 transition-all text-left"
                    style={{ aspectRatio: '16/10', background: 'rgba(255,255,255,0.04)' }}
                  >
                    {g.cover ? (
                      <img
                        src={g.cover}
                        alt={g.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <Gamepad2 className="absolute inset-0 m-auto w-5 h-5 text-white/15" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 px-1.5 py-1 bg-gradient-to-t from-black/85 to-transparent">
                      <p className="text-[9px] font-bold text-white/90 truncate">{g.title}</p>
                      <p className="text-[8px] text-white/40 truncate">
                        {[g.genre, g.year].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}