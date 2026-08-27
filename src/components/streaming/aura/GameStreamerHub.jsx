import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Radio, Eye, ArrowLeft } from 'lucide-react';
import StreamerTile from './StreamerTile';
import OtherStreamersRail from './OtherStreamersRail';
import { getStreamersForGame, formatViewers } from './streamerMockData';

const SORTS = [
  { id: 'viewers', label: 'Most Watched' },
  { id: 'new', label: 'Just Started' },
  { id: 'longest', label: 'Longest Live' },
];

/**
 * Game-selected streamer hub.
 * Grid mode shows only active channels for the selected game.
 * Selecting a streamer transitions to the dedicated StreamingHome page.
 */
export default function GameStreamerHub({ game, onClose }) {
  const [sortBy, setSortBy] = useState('viewers');
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const streamers = useMemo(() => {
    const list = getStreamersForGame(game, 14);
    if (sortBy === 'new') return [...list].sort((a, b) => a.uptimeMinutes - b.uptimeMinutes);
    if (sortBy === 'longest') return [...list].sort((a, b) => b.uptimeMinutes - a.uptimeMinutes);
    return [...list].sort((a, b) => b.viewers - a.viewers);
  }, [game, sortBy]);

  const totalViewers = streamers.reduce((sum, s) => sum + s.viewers, 0);
  const others = selected ? streamers.filter((s) => s.id !== selected.id) : streamers;

  const openStreamerHome = (streamer) => {
    const params = new URLSearchParams({
      streamerId: streamer.id || '',
      gameId: game?.id || '',
      game: game?.title || streamer.game || '',
    });
    navigate(`/streaminghome?${params.toString()}`, {
      state: { streamer, game },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] pt-16 pb-12 bg-[#070a0f]"
    >
      <div className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-2xl">
        <div className="max-w-[1800px] mx-auto px-5 py-4 flex items-center gap-4 flex-wrap">
          {selected ? (
            <button onClick={() => setSelected(null)} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-bold inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> All Streamers
            </button>
          ) : (
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white">
              <X className="w-5 h-5" />
            </button>
          )}

          <img src={game.cover_image || game.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200'} alt={game.title} className="w-12 h-12 rounded-lg border border-white/20 object-cover" />
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-white truncate">{game.title}</h1>
            <p className="text-white/40 text-xs inline-flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {formatViewers(totalViewers)} watching</span>
              <span className="inline-flex items-center gap-1"><Radio className="w-3 h-3 text-red-500" /> {streamers.length} live channels</span>
            </p>
          </div>

          {!selected && (
            <div className="ml-auto flex items-center gap-2">
              {SORTS.map((s) => (
                <button key={s.id} onClick={() => setSortBy(s.id)} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${sortBy === s.id ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {selected && (
            <button onClick={onClose} className="ml-auto w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="relative h-[calc(100%-84px)]">
        <AnimatePresence mode="wait">
          {selected ? (
            <div key="focus" className="h-full">
              <div className="h-[90%] overflow-hidden">
                <div className="h-full cursor-pointer" onClick={() => openStreamerHome(selected)}>
                  <div className="h-full pointer-events-none">
                    <StreamerTile streamer={selected} compact />
                  </div>
                </div>
              </div>
              <OtherStreamersRail
                streamers={others}
                activeId={selected.id}
                gameTitle={game.title}
                onSelect={(streamer) => {
                  setSelected(streamer);
                  openStreamerHome(streamer);
                }}
              />
            </div>
          ) : (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto px-5 py-6">
              <div className="max-w-[1800px] mx-auto grid gap-x-5 gap-y-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {streamers.map((s) => (
                  <StreamerTile key={s.id} streamer={s} onClick={openStreamerHome} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
