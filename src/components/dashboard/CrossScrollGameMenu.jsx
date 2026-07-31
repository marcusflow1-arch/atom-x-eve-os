import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// XMB-style cross-scroll: vertical alphabetical games, horizontal achievement cards.
const SLOT = 120; // px height per game slot

const RARITY = {
  common: { ring: 'rgba(156,163,175,0.75)', glow: 'rgba(156,163,175,0.25)' },
  uncommon: { ring: 'rgba(52,211,153,0.85)', glow: 'rgba(52,211,153,0.30)' },
  rare: { ring: 'rgba(96,165,250,0.90)', glow: 'rgba(96,165,250,0.38)' },
  epic: { ring: 'rgba(167,139,250,0.92)', glow: 'rgba(167,139,250,0.42)' },
  legendary: { ring: 'rgba(251,191,36,0.95)', glow: 'rgba(251,191,36,0.48)' },
  mythical: { ring: 'rgba(244,114,182,0.95)', glow: 'rgba(244,114,182,0.50)' },
};

const ACH_POOL = [
  { name: 'First Light', icon: '🎯', rarity: 'common' },
  { name: 'Initiate', icon: '✨', rarity: 'uncommon' },
  { name: 'Halfway Hero', icon: '⚔️', rarity: 'rare' },
  { name: 'Untouchable', icon: '🛡️', rarity: 'rare' },
  { name: 'Collector', icon: '💎', rarity: 'epic' },
  { name: 'Legend', icon: '👑', rarity: 'legendary' },
  { name: 'Speedrun', icon: '⚡', rarity: 'uncommon' },
  { name: 'Completionist', icon: '🏆', rarity: 'mythical' },
];

function achievementsFor(game) {
  const start = (game?.title?.charCodeAt(0) || 0) % ACH_POOL.length;
  return ACH_POOL.map((_, i) => ACH_POOL[(i + start) % ACH_POOL.length]);
}

export default function CrossScrollGameMenu({ games, selectedGame, onSelectGame, onLongPressGame }) {
  const sorted = useMemo(
    () => [...(games || [])].sort((a, b) => (a.title || '').localeCompare(b.title || '')),
    [games]
  );

  const initial = useMemo(() => {
    if (selectedGame) {
      const idx = sorted.findIndex((g) => g.id === selectedGame.id);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [sorted, selectedGame]);

  const [focusIndex, setFocusIndex] = useState(initial);
  const [achIndex, setAchIndex] = useState(0);
  const wheelLock = useRef(0);
  const achWheelLock = useRef(0);
  const lpTimer = useRef(null);
  const longPressedRef = useRef(false);
  const containerRef = useRef(null);
  const gamesRef = useRef(null);
  const achRef = useRef(null);

  const focused = sorted[focusIndex];
  const achievements = useMemo(() => (focused ? achievementsFor(focused) : []), [focused]);
  const safeAch = Math.min(achIndex, Math.max(0, achievements.length - 1));

  const moveGame = useCallback(
    (dir) => {
      setFocusIndex((prev) => {
        const next = Math.min(sorted.length - 1, Math.max(0, prev + dir));
        if (next !== prev) {
          setAchIndex(0);
          onSelectGame?.(sorted[next]);
        }
        return next;
      });
    },
    [sorted, onSelectGame]
  );

  const moveAch = useCallback(
    (dir) => {
      setAchIndex((prev) => Math.min(achievements.length - 1, Math.max(0, prev + dir)));
    },
    [achievements.length]
  );

  // keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); moveGame(-1); }
      else if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); moveGame(1); }
      else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); moveAch(-1); }
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); moveAch(1); }
      else if (k === 'Enter') { if (focused) onSelectGame?.(focused); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moveGame, moveAch, focused, onSelectGame]);

  // Hover-scoped wheel: games column scrolls vertically, achievement strip scrolls horizontally.
  useEffect(() => {
    const onGameWheel = (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - wheelLock.current < 220) return;
      if (Math.abs(e.deltaY) < 6) return;
      wheelLock.current = now;
      moveGame(e.deltaY > 0 ? 1 : -1);
    };
    const onAchWheel = (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - achWheelLock.current < 180) return;
      if (Math.abs(e.deltaY) < 6 && Math.abs(e.deltaX) < 6) return;
      achWheelLock.current = now;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      moveAch(delta > 0 ? 1 : -1);
    };
    const g = gamesRef.current;
    const a = achRef.current;
    g?.addEventListener('wheel', onGameWheel, { passive: false });
    a?.addEventListener('wheel', onAchWheel, { passive: false });
    return () => {
      g?.removeEventListener('wheel', onGameWheel);
      a?.removeEventListener('wheel', onAchWheel);
    };
  }, [moveGame, moveAch]);

  // long-press on focused disc -> blank UI; regular click -> default UI
  const startLP = () => {
    longPressedRef.current = false;
    clearTimeout(lpTimer.current);
    lpTimer.current = setTimeout(() => {
      longPressedRef.current = true;
      if (focused) onLongPressGame?.(focused);
    }, 700);
  };
  const endLP = () => clearTimeout(lpTimer.current);

  const itemStyle = (i) => {
    const d = Math.abs(i - focusIndex);
    const scale = d === 0 ? 1 : d === 1 ? 0.64 : d === 2 ? 0.44 : 0.30;
    const opacity = d === 0 ? 1 : d === 1 ? 0.60 : d === 2 ? 0.30 : 0.12;
    return {
      transform: `scale(${scale})`,
      opacity,
      filter: d === 0 ? 'none' : `blur(${Math.min(d, 3) * 0.7}px)`,
    };
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: 'transparent' }}>
      {/* Soft edge fade — blends into the page (10% top, 10% bottom) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30" style={{ height: '10%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)' }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30" style={{ height: '10%', background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)' }} />

      {/* Vertical game disc column (alphabetical — the games ARE the A-Z) */}
      <div ref={gamesRef} className="absolute left-0 right-0" style={{ top: '50%' }}>
        <div
          className="relative"
          style={{
            transform: `translateY(calc(-${focusIndex * SLOT}px - ${SLOT / 2}px))`,
            transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {sorted.map((g, i) => {
            const isFocus = i === focusIndex;
            const st = itemStyle(i);
            const W = 84, H = 108, R = 12;
            const completion = Math.min(100, Math.max(0, g.completion != null ? g.completion : Math.round((g.title?.length || 0) * 8)));
            const done = completion >= 100;
            const ringColor = done ? 'rgba(34,211,238,0.95)' : 'rgba(255,255,255,0.92)';
            return (
              <div key={g.id} className="flex items-center justify-start" style={{ height: SLOT, paddingLeft: 22 }}>
                <div
                  className="relative shrink-0 cursor-pointer"
                  style={{ width: W, height: H, ...st, transition: 'transform 0.4s, opacity 0.4s, filter 0.4s' }}
                  onMouseDown={startLP}
                  onMouseUp={endLP}
                  onMouseLeave={endLP}
                  onTouchStart={startLP}
                  onTouchEnd={endLP}
                  onClick={() => {
                    if (longPressedRef.current) { longPressedRef.current = false; return; }
                    if (!isFocus) { setFocusIndex(i); setAchIndex(0); if (done) onLongPressGame?.(g); else onSelectGame?.(g); }
                    else { if (done) onLongPressGame?.(g); else onSelectGame?.(g); }
                  }}
                >
                  <div
                    className="relative overflow-hidden"
                    style={{ width: W, height: H, borderRadius: R }}
                  >
                    <img src={g.thumb || g.image} alt={g.title} className="w-full h-full object-cover" draggable={false} />
                    <div className="absolute inset-0" style={{ borderRadius: R, background: 'radial-gradient(circle at 32% 24%, rgba(255,255,255,0.22), transparent 65%)' }} />
                  </div>
                  {/* Progress outline around the whole card */}
                  <svg className="absolute" width={W} height={H} style={{ overflow: 'visible', left: 0, top: 0, pointerEvents: 'none' }}>
                    <rect x={1.5} y={1.5} width={W - 3} height={H - 3} rx={R} ry={R}
                      fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={2} pathLength={100}
                      strokeDasharray="100 100" />
                    <rect x={1.5} y={1.5} width={W - 3} height={H - 3} rx={R} ry={R}
                      fill="none" stroke={ringColor} strokeWidth={2.5} pathLength={100}
                      strokeDasharray={`${completion} 100`} strokeLinecap="round"
                      style={{ filter: done || isFocus ? `drop-shadow(0 0 6px ${ringColor})` : 'none', transition: 'stroke-dasharray 0.5s ease, stroke 0.4s' }} />
                  </svg>
                  {done && (
                    <div className="absolute -top-1 -right-1 z-10 flex items-center justify-center" style={{ width: 18, height: 18, borderRadius: 999, background: 'rgba(34,211,238,0.95)', boxShadow: '0 0 10px rgba(34,211,238,0.7)' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#04121a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Focused game title (right of disc) */}
      <AnimatePresence mode="wait">
        {focused && (
          <motion.div
            key={focused.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
            className="absolute z-20 pointer-events-none"
            style={{ left: 138, top: 'calc(50% - 40px)' }}
          >
            <div className="text-white font-semibold tracking-wide truncate" style={{ fontSize: 22, textShadow: '0 2px 12px rgba(0,0,0,0.85)', maxWidth: 220 }}>
              {focused.title}
            </div>
            <div className="text-white/55 text-xs mt-0.5" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.85)' }}>
              {focused.genre}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement strip — horizontal, extends right from the focused game */}
      <div ref={achRef} className="absolute z-20" style={{ left: 138, top: 'calc(50% + 12px)' }}>
        <div className="relative flex items-center" style={{ height: 70 }}>
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              maskImage: 'linear-gradient(to right, black 55%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 55%, transparent 100%)',
            }}
          />
          <div
            className="flex items-center gap-3"
            style={{
              transform: `translateX(${-safeAch * 74}px)`,
              transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            {achievements.map((a, idx) => {
              const active = idx === safeAch;
              const rc = RARITY[a.rarity] || RARITY.common;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center shrink-0"
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 14,
                    background: 'rgba(14,18,28,0.78)',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${active ? rc.ring : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: active ? `0 0 18px ${rc.glow}` : 'none',
                    transform: active ? 'scale(1.1)' : 'scale(0.84)',
                    opacity: active ? 1 : 0.46,
                    transition: 'all 0.35s',
                  }}
                >
                  <div style={{ fontSize: 22, lineHeight: 1 }}>{a.icon}</div>
                  <div className="text-white/70 leading-tight text-center px-1 mt-1" style={{ fontSize: 7.5 }}>
                    {a.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-white/30 tracking-wider" style={{ fontSize: 10 }}>
        ↑↓/Wheel Games · ←→/A D Achievements · Hold 1.5s = Focus
      </div>
    </div>
  );
}