import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Radio, Eye, ArrowLeft } from 'lucide-react';
import StreamerTile from './StreamerTile';
import { getStreamersForGame, formatViewers } from './streamerMockData';

const SORTS = [
  { id: 'viewers', label: 'Most Watched' },
  { id: 'new', label: 'Just Started' },
  { id: 'longest', label: 'Longest Live' },
];

/**
 * This is the Aura page state shown after a game is selected from the
 * Streaming Games overlay. It is intentionally NOT an overlay/modal.
 * The normal Aura landing UI is replaced by this game-specific directory.
 */
export default function GameStreamerHub({ game, onClose }) {
  const [sortBy, setSortBy] = useState('viewers');
  const navigate = useNavigate();

  const streamers = useMemo(() => {
    const list = getStreamersForGame(game, 14);
    if (sortBy === 'new') return [...list].sort((a, b) => a.uptimeMinutes - b.uptimeMinutes);
    if (sortBy === 'longest') return [...list].sort((a, b) => b.uptimeMinutes - a.uptimeMinutes);
    return [...list].sort((a, b) => b.viewers - a.viewers);
  }, [game, sortBy]);

  const totalViewers = streamers.reduce((sum, s) => sum + s.viewers, 0);

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
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full min-h-[calc(100vh-9rem)] text-white"
    >
      <header className="border-b border-white/10 bg-black/20">
        <div className="max-w-[1800px] mx-auto px-5 py-5 flex items-center gap-4 flex-wrap">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white"
            title="Back to Aura"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img
            src={game?.cover_image || game?.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200'}
            alt=""
            className="w-12 h-12 border border-white/20 object-cover"
          />
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black truncate">{game?.title || 'Selected Game'}</h1>
            <p className="text-white/45 text-xs flex items-center gap-4 mt-1">
              <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {formatViewers(totalViewers)} watching</span>
              <span className="inline-flex items-center gap-1"><Radio className="w-3 h-3 text-red-400" /> {streamers.length} live channels</span>
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {SORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className={`px-3.5 py-2 text-xs font-bold border transition ${sortBy === s.id ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-5 py-7">
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-[.22em] text-white/35">Live now</div>
          <h2 className="mt-1 text-lg font-bold">Streamers playing {game?.title || 'this game'}</h2>
        </div>

        {streamers.length ? (
          <div className="grid gap-x-5 gap-y-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {streamers.map((streamer) => (
              <StreamerTile
                key={streamer.id}
                streamer={streamer}
                onClick={openStreamerHome}
              />
            ))}
          </div>
        ) : (
          <div className="min-h-64 flex items-center justify-center border border-white/10 text-white/35 text-sm">
            No active streamers are broadcasting this game right now.
          </div>
        )}
      </main>
    </motion.section>
  );
}
