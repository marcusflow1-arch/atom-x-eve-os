import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';

export default function DeveloperGamesPanel({ game }) {
  const [devGames, setDevGames] = useState([]);
  const navigate = useNavigate();

  const developer = game?.developer || null;

  useEffect(() => {
    if (!developer) return;
    base44.entities.Game.filter({ developer })
      .then((games) => {
        // Exclude the current game
        setDevGames(games.filter((g) => g.id !== game.id).slice(0, 6));
      })
      .catch(() => {});
  }, [developer, game?.id]);

  const label = developer ? `${developer} Games` : 'More Games';

  return (
    <div
      className="lg:w-72 flex-shrink-0 flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(6, 6, 10, 0.72)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.4)',
      }}
    >
      {/* Liquid glass sheen */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)' }}
      />

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-3.5 h-3.5 text-cyan-400/70" />
          <span className="text-white/80 font-bold text-xs uppercase tracking-wider truncate max-w-[160px]">{label}</span>
        </div>
        {developer && (
          <span className="text-white/20 text-[10px] italic truncate max-w-[80px]">{developer}</span>
        )}
      </div>

      {/* Game List */}
      <div className="flex-1 overflow-y-auto py-2 space-y-1 px-2" style={{ scrollbarWidth: 'none' }}>
        {devGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 gap-2">
            <Gamepad2 className="w-8 h-8 text-white/10" />
            <p className="text-white/20 text-xs text-center">
              {developer ? `No other ${developer} games found` : 'Developer info unavailable'}
            </p>
          </div>
        ) : (
          devGames.map((g) => (
            <button
              key={g.id}
              onClick={() => navigate(`/game/${g.id}`)}
              className="w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left group"
              style={{ background: 'rgba(255,255,255,0.03)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              <div className="w-12 h-8 rounded-lg overflow-hidden flex-shrink-0 border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <img
                  src={g.cover_image}
                  alt={g.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs font-semibold truncate group-hover:text-white transition-colors">{g.title}</p>
                <p className="text-white/30 text-[10px] capitalize truncate">{g.genre}</p>
              </div>
              {g.price != null && (
                <span className="text-cyan-400/70 text-[10px] font-bold flex-shrink-0">
                  {g.price === 0 ? 'Free' : `$${g.price.toFixed(2)}`}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}