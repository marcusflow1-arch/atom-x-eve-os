import React, { useRef } from 'react';
import { MoreHorizontal, Star } from 'lucide-react';
import GamePlayButton from '@/components/dashboard/gamehub/GamePlayButton';

// Simple flat games list:
// - A white divider line sits at the top (under the parent "Full Library" button).
// - Below the line, ALL games show as a single scrollable column of rows.
// - Each row: [small thumbnail] [title + genre] [Play button] [Options button].
// - Play = open the game page; Options (⋯) = open the blank focus UI.
// - Long-press the thumbnail also opens the blank focus UI.
// - 100%-complete games show a cyan checkmark and open the blank UI on Play.
export default function CrossScrollGameMenu({ games, selectedGame, onSelectGame, onLongPressGame, favorites = [], onToggleFavorite, browsing = false }) {
  const listRef = useRef(null);
  const lpTimer = useRef(null);
  const longPressedRef = useRef(false);

  const allGames = games || [];

  const startLP = (g) => {
    longPressedRef.current = false;
    clearTimeout(lpTimer.current);
    lpTimer.current = setTimeout(() => {
      longPressedRef.current = true;
      onLongPressGame?.(g);
    }, 700);
  };
  const endLP = () => clearTimeout(lpTimer.current);

  const playGame = (g, e) => {
    if (e) e.stopPropagation();
    if (longPressedRef.current) { longPressedRef.current = false; return; }
    const done = (g.completion ?? g.progress ?? 0) >= 100;
    if (done) onLongPressGame?.(g);
    else onSelectGame?.(g);
  };

  const openOptions = (g, e) => {
    if (e) e.stopPropagation();
    onLongPressGame?.(g);
  };

  const handleRowClick = (g) => {
    if (longPressedRef.current) { longPressedRef.current = false; return; }
    onSelectGame?.(g);
  };

  const renderThumb = (g, w, h, r) => (
    <div className="relative overflow-hidden" style={{ width: w, height: h, borderRadius: r, background: 'transparent' }}>
      <img src={g.thumb || g.image} alt={g.title} className="w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 32% 24%, rgba(255,255,255,0.2), transparent 65%)' }} />
    </div>
  );

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: 'transparent' }}>
      {/* Soft edge fades — blend into the page */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30" style={{ height: '10%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)' }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30" style={{ height: '10%', background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />

      {/* White divider line — sits under the "Full Library" button */}
      <div
        className="pointer-events-none absolute left-3 right-3 z-20"
        style={{ top: browsing ? 0 : 26, height: 1, background: 'rgba(255,255,255,0.55)', boxShadow: '0 0 6px rgba(255,255,255,0.3)' }}
      />

      {/* All games — simple flat list below the line */}
      <div ref={listRef} data-testid="library-game-list" tabIndex={0} aria-label="Scrollable game library" onWheel={e => e.stopPropagation()} className="absolute inset-0 overflow-y-auto overscroll-contain" style={{ scrollbarWidth: 'none', paddingTop: browsing ? 8 : 40, paddingBottom: 48 }}>
        <div className="flex flex-col gap-1 px-2">
          {allGames.map((g) => {
            const isSel = selectedGame?.id === g.id;
            const completion = Math.min(100, Math.max(0, g.completion ?? g.progress ?? 0));
            const done = completion >= 100;
            const TW = 24, TH = 32, R = 5;
            const ringColor = done ? 'rgba(34,211,238,0.95)' : 'rgba(255,255,255,0.85)';
            return (
              <div
                key={g.id}
                data-library-game={g.id}
                onClick={() => handleRowClick(g)}
                className="flex items-center gap-1.5 w-full rounded-lg cursor-pointer transition-all"
                style={{
                  padding: '3px 5px',
                  background: isSel ? 'rgba(34,211,238,0.10)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSel ? 'rgba(34,211,238,0.45)' : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: isSel ? '0 0 14px rgba(34,211,238,0.18)' : 'none',
                }}
              >
                {/* Thumbnail (left) with progress outline + done check */}
                <div
                  className="relative shrink-0"
                  onMouseDown={() => startLP(g)}
                  onMouseUp={endLP}
                  onMouseLeave={endLP}
                  onTouchStart={() => startLP(g)}
                  onTouchEnd={endLP}
                >
                  {renderThumb(g, TW, TH, R)}
                  <svg className="absolute" width={TW} height={TH} style={{ overflow: 'visible', left: 0, top: 0, pointerEvents: 'none' }}>
                    <rect x={1.5} y={1.5} width={TW - 3} height={TH - 3} rx={R} ry={R} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={2} pathLength={100} strokeDasharray="100 100" />
                    <rect x={1.5} y={1.5} width={TW - 3} height={TH - 3} rx={R} ry={R} fill="none" stroke={ringColor} strokeWidth={2.5} pathLength={100} strokeDasharray={`${completion} 100`} strokeLinecap="round" style={{ filter: (done || isSel) ? `drop-shadow(0 0 6px ${ringColor})` : 'none', transition: 'stroke-dasharray 0.5s ease, stroke 0.4s' }} />
                  </svg>
                  {done && (
                    <div className="absolute -top-1 -right-1 z-10 flex items-center justify-center" style={{ width: 10, height: 10, borderRadius: 999, background: 'rgba(34,211,238,0.95)', boxShadow: '0 0 6px rgba(34,211,238,0.7)' }}>
                      <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#04121a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </div>
                  )}
                </div>

                {/* Title + genre (middle) */}
                <div className="flex-1 min-w-0">
                  <button aria-label={`View ${g.title}`} onClick={e => { e.stopPropagation(); handleRowClick(g); }} className="text-white text-[10px] font-semibold leading-tight truncate max-w-full text-left" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}>{g.title}</button>
                  <p className="text-white/45 text-[8px] truncate mt-0.5" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.85)' }}>{g.genre}</p>
                </div>

                {/* Steam-style compact action cluster: favorite, launch, options stay side-by-side. */}
                <div className="shrink-0 flex items-center gap-1">
                  {onToggleFavorite && (
                    <button
                      aria-label={`${favorites.includes(g.id) ? 'Unfavorite' : 'Favorite'} ${g.title}`}
                      aria-pressed={favorites.includes(g.id)}
                      onClick={e => { e.stopPropagation(); onToggleFavorite(g); }}
                      className="w-6 h-6 shrink-0 flex items-center justify-center rounded-md transition-all hover:bg-white/10"
                      style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <Star className={`h-3 w-3 ${favorites.includes(g.id) ? 'fill-current text-primary' : ''}`} />
                    </button>
                  )}
                  <GamePlayButton key={g.id} game={g} compact />
                  <button
                    onClick={(e) => openOptions(g, e)}
                    className="w-6 h-6 shrink-0 flex items-center justify-center rounded-md transition-all hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}
                    title="Options"
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
          {allGames.length === 0 && (
            <div className="text-white/30 text-xs py-8">No games</div>
          )}
        </div>
      </div>
    </div>
  );
}