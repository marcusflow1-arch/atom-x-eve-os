import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';

/**
 * Compact recently-played games list for the Store left sidebar.
 * Mirrors the visual approach of the Luna Dashboard "recently played" rail.
 */
export default function RecentlyPlayedSidebar({ games = [], onGameClick }) {
  const recent = useMemo(() => {
    // Take the first 10 games sorted by most recent (fall back to original order)
    const sorted = [...games].sort((a, b) => {
      const da = a?.last_played ? new Date(a.last_played).getTime() : 0;
      const db = b?.last_played ? new Date(b.last_played).getTime() : 0;
      return db - da;
    });
    return sorted.slice(0, 10);
  }, [games]);

  return (
    <div className="mt-12 px-2 flex flex-col items-center w-full">
      <div className="flex items-center gap-1 text-white/60 mb-1">
        <Clock className="w-3 h-3" />
        <span className="text-[9px] uppercase tracking-wider font-bold">Recently</span>
      </div>
      <span className="text-[8px] uppercase tracking-wider text-white/35 mb-2">Played</span>
      <div className="w-8 h-px mb-3" style={{ background: 'rgba(200,210,220,0.2)' }} />

      <div className="flex flex-col gap-2 w-full items-center">
        {recent.length === 0 && (
          <div className="text-[8px] text-white/30 text-center py-4">No recent games</div>
        )}
        {recent.map((game) => (
          <button
            key={game.id}
            onClick={() => onGameClick?.(game.id)}
            title={game.title}
            className="group w-11 h-11 rounded-xl border border-white/10 hover:border-cyan-400/40 overflow-hidden transition-all relative"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            {game.cover_image || game.image ? (
              <img
                src={game.cover_image || game.image}
                alt={game.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">?</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      <div className="mt-3 w-8 h-px" style={{ background: 'rgba(200,210,220,0.2)' }} />
    </div>
  );
}