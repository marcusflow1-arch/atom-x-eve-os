import React, { useMemo, useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Recommended titles rail for the Store left overlay sidebar.
 * Recommends games based on the user's last purchase (genre match),
 * falling back to top-rated titles when no purchase is found.
 */
export default function RecommendedTitlesSidebar({ games = [], onGameClick }) {
  const [anchorGame, setAnchorGame] = useState(null);

  // Find the user's last purchase and match it to a game in the catalog
  useEffect(() => {
    let mounted = true;
    const findLastPurchase = async () => {
      try {
        const orders = await base44.entities.Order.list('-created_date', 5);
        const list = orders?.data || orders || [];
        for (const order of list) {
          const name = order.game_title || order.title || order.items?.[0]?.title || order.items?.[0]?.name;
          const id = order.game_id || order.items?.[0]?.game_id || order.items?.[0]?.id;
          const match = games.find(g => g.id === id || (name && (g.title === name || g.name === name)));
          if (match) { if (mounted) setAnchorGame(match); return; }
        }
      } catch (e) { /* no orders — fall back below */ }
    };
    if (games.length > 0) findLastPurchase();
    return () => { mounted = false; };
  }, [games]);

  const recommended = useMemo(() => {
    if (games.length === 0) return [];
    const anchor = anchorGame || [...games].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
    if (!anchor) return [];
    const sameGenre = games.filter(g => g.id !== anchor.id && g.genre && g.genre === anchor.genre);
    const rest = games.filter(g => g.id !== anchor.id && (!g.genre || g.genre !== anchor.genre));
    const byRating = (a, b) => (b.rating || 0) - (a.rating || 0);
    return [...sameGenre.sort(byRating), ...rest.sort(byRating)].slice(0, 6);
  }, [games, anchorGame]);

  return (
    <div className="mt-12 px-3 flex flex-col items-center w-full">
      <div className="flex items-center gap-1.5 text-cyan-300/80 mb-0.5">
        <Sparkles className="w-3 h-3" />
        <span className="text-[9px] uppercase tracking-wider font-bold">Recommended</span>
      </div>
      <span className="text-[8px] uppercase tracking-wider text-white/40 mb-1 text-center leading-tight">
        Based on your last purchase
      </span>
      {anchorGame && (
        <span className="text-[8px] text-white/50 mb-1 text-center leading-tight line-clamp-1 w-full">
          Because you bought <span className="text-cyan-300/90">{anchorGame.title || anchorGame.name}</span>
        </span>
      )}
      <div className="w-10 h-px mb-3" style={{ background: 'rgba(200,210,220,0.25)' }} />

      <div className="flex flex-col gap-3 w-full items-center">
        {recommended.length === 0 && (
          <div className="text-[8px] text-white/30 text-center py-4">No recommendations yet</div>
        )}
        {recommended.map((game) => (
          <button
            key={game.id}
            onClick={() => onGameClick?.(game.id)}
            title={game.title || game.name}
            className="group w-full flex flex-col items-center gap-1"
          >
            <div
              className="w-full aspect-[3/4] rounded-xl border border-white/10 group-hover:border-cyan-400/50 overflow-hidden transition-all relative"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              {game.cover_image || game.image ? (
                <img
                  src={game.cover_image || game.image}
                  alt={game.title || game.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">?</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-[9px] text-white/70 group-hover:text-white leading-tight text-center line-clamp-2 transition-colors">
              {game.title || game.name}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 w-10 h-px" style={{ background: 'rgba(200,210,220,0.25)' }} />
    </div>
  );
}