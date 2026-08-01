import React, { useRef } from 'react';

// Simple flat games list:
// - A white divider line sits at the top (under the parent "Full Library" button).
// - Below the line, ALL games show as a single scrollable column of cards.
// - Click selects a game; long-press (700ms) opens the blank focus UI.
// - 100%-complete games show a cyan checkmark and open the blank UI on single click.
export default function CrossScrollGameMenu({ games, selectedGame, onSelectGame, onLongPressGame }) {
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

  const handleClick = (g) => {
    if (longPressedRef.current) { longPressedRef.current = false; return; }
    const done = (g.completion ?? g.progress ?? 0) >= 100;
    if (done) onLongPressGame?.(g);
    else onSelectGame?.(g);
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
        style={{ top: 26, height: 1, background: 'rgba(255,255,255,0.55)', boxShadow: '0 0 6px rgba(255,255,255,0.3)' }}
      />

      {/* All games — simple flat list below the line */}
      <div ref={listRef} className="absolute inset-0 overflow-y-auto" style={{ scrollbarWidth: 'none', paddingTop: 40, paddingBottom: 8 }}>
        <div className="flex flex-col items-center gap-3 px-2">
          {allGames.map((g) => {
            const isSel = selectedGame?.id === g.id;
            const completion = Math.min(100, Math.max(0, g.completion ?? g.progress ?? 0));
            const done = completion >= 100;
            const W = 70, H = 94, R = 10;
            const ringColor = done ? 'rgba(34,211,238,0.95)' : 'rgba(255,255,255,0.85)';
            return (
              <div
                key={g.id}
                className="relative shrink-0 cursor-pointer"
                style={{ width: W, transform: isSel ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.3s' }}
                onMouseDown={() => startLP(g)}
                onMouseUp={endLP}
                onMouseLeave={endLP}
                onTouchStart={() => startLP(g)}
                onTouchEnd={endLP}
                onClick={() => handleClick(g)}
              >
                {renderThumb(g, W, H, R)}
                {/* Progress outline around the card */}
                <svg className="absolute" width={W} height={H} style={{ overflow: 'visible', left: 0, top: 0, pointerEvents: 'none' }}>
                  <rect x={1.5} y={1.5} width={W - 3} height={H - 3} rx={R} ry={R} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={2} pathLength={100} strokeDasharray="100 100" />
                  <rect x={1.5} y={1.5} width={W - 3} height={H - 3} rx={R} ry={R} fill="none" stroke={ringColor} strokeWidth={2.5} pathLength={100} strokeDasharray={`${completion} 100`} strokeLinecap="round" style={{ filter: (done || isSel) ? `drop-shadow(0 0 6px ${ringColor})` : 'none', transition: 'stroke-dasharray 0.5s ease, stroke 0.4s' }} />
                </svg>
                {done && (
                  <div className="absolute -top-1 -right-1 z-10 flex items-center justify-center" style={{ width: 16, height: 16, borderRadius: 999, background: 'rgba(34,211,238,0.95)', boxShadow: '0 0 10px rgba(34,211,238,0.7)' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#04121a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </div>
                )}
                {/* Title + genre under the thumb */}
                <div className="text-center mt-1.5 px-1">
                  <p className="text-white text-[10px] font-semibold leading-tight truncate" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}>{g.title}</p>
                  <p className="text-white/45 text-[8px] truncate" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.85)' }}>{g.genre}</p>
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