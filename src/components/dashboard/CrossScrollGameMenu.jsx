import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// XMB-style cross-scroll grouped by letter:
// - Vertical column: ONE representative game per letter (A-Z). Each box "represents the letter".
// - Horizontal strip: the OTHER games whose title starts with that same letter (padded with blank placeholder boxes for testing).
// - Clicking a strip game swaps it into the focused letter slot (new representative).
// - The strip is vertically aligned (centered) with the disc, and the focused title sits above so it never overlaps the strip.
const SLOT = 120; // px height per letter slot
const STRIP_THUMB_W = 58;
const STRIP_THUMB_H = 74;
const STRIP_ROW_H = 94; // thumb + label + breathing room (prevents label clipping)

// Random-name pool for blank placeholder boxes
const PH_POOL = ['Echo', 'Nova', 'Rogue', 'Cipher', 'Zenith', 'Onyx', 'Vortex', 'Halo', 'Specter', 'Rift', 'Mirage', 'Pulse', 'Aegis', 'Bolt', 'Crest', 'Dusk', 'Ember', 'Flux', 'Gale', 'Havoc'];

export default function CrossScrollGameMenu({ games, selectedGame, onSelectGame, onLongPressGame }) {
  // Group games by first letter of title, padding each group with blank placeholder boxes
  const letterGroups = useMemo(() => {
    const map = {};
    (games || []).forEach((g) => {
      const raw = (g.title || '#').trim().charAt(0).toUpperCase();
      const key = /[A-Z]/.test(raw) ? raw : '#';
      (map[key] = map[key] || []).push(g);
    });
    return Object.keys(map)
      .sort()
      .map((L) => {
        const realGames = map[L];
        const padded = [...realGames];
        let n = 0;
        while (padded.length < 4) {
          const suffix = PH_POOL[(L.charCodeAt(0) + n * 3) % PH_POOL.length];
          padded.push({
            id: `ph_${L}_${n}`,
            title: `${L}-${suffix}`,
            genre: realGames[0]?.genre || 'Unknown',
            thumb: null,
            image: null,
            placeholder: true,
            completion: 0,
          });
          n++;
        }
        return { letter: L, games: padded };
      });
  }, [games]);

  // One representative per letter (swappable). Seeded from the first REAL game of each group.
  const [reps, setReps] = useState(() => letterGroups.map((grp) => grp.games.find((g) => !g.placeholder) || grp.games[0]));

  // Seed reps when the letter set changes (e.g. games just loaded). Preserve user swaps otherwise —
  // only re-seed if the number of letters no longer matches (new data arrived), never overwrite on a mere re-render.
  useEffect(() => {
    setReps((prev) => {
      if (prev.length === letterGroups.length) return prev;
      return letterGroups.map((grp) => grp.games.find((g) => !g.placeholder) || grp.games[0]);
    });
  }, [letterGroups]);

  const initial = useMemo(() => {
    if (selectedGame) {
      const L = (selectedGame.title || '#').trim().charAt(0).toUpperCase();
      const key = /[A-Z]/.test(L) ? L : '#';
      const idx = letterGroups.findIndex((grp) => grp.letter === key);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [letterGroups, selectedGame]);

  const [focusIndex, setFocusIndex] = useState(initial);
  const [catIndex, setCatIndex] = useState(0);
  const wheelLock = useRef(0);
  const catWheelLock = useRef(0);
  const lpTimer = useRef(null);
  const longPressedRef = useRef(false);
  const containerRef = useRef(null);
  const gamesRef = useRef(null);
  const catRef = useRef(null);

  const focused = reps[focusIndex];
  const group = letterGroups[focusIndex];

  // Games in the same letter group (the horizontal strip) — includes blank placeholders
  const categoryGames = useMemo(() => (group ? group.games : []), [group]);

  // Keep the strip cursor on the focused game when it changes
  useEffect(() => {
    const idx = categoryGames.findIndex((g) => g.id === focused?.id);
    setCatIndex(idx >= 0 ? idx : 0);
  }, [focused, categoryGames]);

  const safeCat = categoryGames.length ? Math.min(catIndex, categoryGames.length - 1) : 0;

  const moveGame = useCallback(
    (dir) => {
      setFocusIndex((prev) => {
        const next = Math.min(reps.length - 1, Math.max(0, prev + dir));
        if (next !== prev) {
          onSelectGame?.(reps[next]);
        }
        return next;
      });
    },
    [reps, onSelectGame]
  );

  const moveCat = useCallback(
    (dir) => {
      setCatIndex((prev) => Math.min(categoryGames.length - 1, Math.max(0, prev + dir)));
    },
    [categoryGames.length]
  );

  // Swap a strip game into the focused letter slot, making it the new representative.
  const swapIn = useCallback(
    (g) => {
      if (!g) return;
      setReps((prev) => prev.map((item, i) => (i === focusIndex ? g : item)));
      onSelectGame?.(g);
    },
    [focusIndex, onSelectGame]
  );

  // keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); moveGame(-1); }
      else if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); moveGame(1); }
      else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); moveCat(-1); }
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); moveCat(1); }
      else if (k === 'Enter') { if (focused) onSelectGame?.(focused); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moveGame, moveCat, focused, onSelectGame]);

  // Hover-scoped wheel: letters column scrolls vertically, category strip scrolls horizontally.
  useEffect(() => {
    const onGameWheel = (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - wheelLock.current < 220) return;
      if (Math.abs(e.deltaY) < 6) return;
      wheelLock.current = now;
      moveGame(e.deltaY > 0 ? 1 : -1);
    };
    const onCatWheel = (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - catWheelLock.current < 180) return;
      if (Math.abs(e.deltaY) < 6 && Math.abs(e.deltaX) < 6) return;
      catWheelLock.current = now;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      moveCat(delta > 0 ? 1 : -1);
    };
    const g = gamesRef.current;
    const c = catRef.current;
    g?.addEventListener('wheel', onGameWheel, { passive: false });
    c?.addEventListener('wheel', onCatWheel, { passive: false });
    return () => {
      g?.removeEventListener('wheel', onGameWheel);
      c?.removeEventListener('wheel', onCatWheel);
    };
  }, [moveGame, moveCat]);

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

  // Render a game thumbnail — real games show art; blank placeholders show a gradient box with a faint letter.
  const renderThumb = (g, w, h, r, extraStyle = {}) => {
    const bg = g.placeholder
      ? 'linear-gradient(135deg, rgba(40,52,72,0.92) 0%, rgba(18,26,40,0.96) 100%)'
      : 'transparent';
    return (
      <div className="relative overflow-hidden" style={{ width: w, height: h, borderRadius: r, ...extraStyle, background: extraStyle.background || bg }}>
        {g.placeholder ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ border: '1px dashed rgba(255,255,255,0.14)', borderRadius: r }}>
            <span className="text-white/25 font-bold" style={{ fontSize: Math.max(14, Math.round(w / 4)) }}>{(g.title || '?').charAt(0)}</span>
          </div>
        ) : (
          <>
            <img src={g.thumb || g.image} alt={g.title} className="w-full h-full object-cover" draggable={false} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 32% 24%, rgba(255,255,255,0.2), transparent 65%)' }} />
          </>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: 'transparent' }}>
      {/* Soft edge fade — blends into the page (10% top, 10% bottom) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30" style={{ height: '10%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)' }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30" style={{ height: '10%', background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)' }} />

      {/* Vertical letter column — one representative game per letter */}
      <div ref={gamesRef} className="absolute left-0 right-0" style={{ top: '50%' }}>
        <div
          className="relative"
          style={{
            transform: `translateY(calc(-${focusIndex * SLOT}px - ${SLOT / 2}px))`,
            transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {reps.map((g, i) => {
            const isFocus = i === focusIndex;
            const st = itemStyle(i);
            const W = 84, H = 108, R = 12;
            const letter = letterGroups[i]?.letter || '?';
            const completion = Math.min(100, Math.max(0, g.completion != null ? g.completion : Math.round((g.title?.length || 0) * 8)));
            const done = completion >= 100;
            const ringColor = done ? 'rgba(34,211,238,0.95)' : 'rgba(255,255,255,0.92)';
            return (
              <div key={letter} className="flex items-center justify-start" style={{ height: SLOT, paddingLeft: 22 }}>
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
                    if (!isFocus) { setFocusIndex(i); if (done) onLongPressGame?.(g); else onSelectGame?.(g); }
                    else { if (done) onLongPressGame?.(g); else onSelectGame?.(g); }
                  }}
                >
                  {renderThumb(g, W, H, R)}
                  {/* Letter badge — this box represents the letter */}
                  <div className="absolute top-1 left-1 z-10 flex items-center justify-center" style={{ width: 18, height: 18, borderRadius: 6, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
                    <span className="text-white font-bold" style={{ fontSize: 10 }}>{letter}</span>
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

      {/* Focused game title — moved ABOVE the row so it never overlaps the strip boxes */}
      <AnimatePresence mode="wait">
        {focused && (
          <motion.div
            key={focused.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
            className="absolute z-20 pointer-events-none"
            style={{ left: 138, top: 'calc(50% - 92px)' }}
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

      {/* Same-letter games strip — horizontal, vertically ALIGNED (centered) with the disc.
          Clicking a game here swaps it into the focused letter slot (new representative). */}
      <div ref={catRef} className="absolute z-20" style={{ left: 138, top: `calc(50% - ${STRIP_THUMB_H / 2}px)` }}>
        <div className="relative flex items-center" style={{ height: STRIP_ROW_H }}>
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
              transform: `translateX(${-safeCat * 78}px)`,
              transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            {categoryGames.map((g, idx) => {
              const active = g.id === focused?.id;
              return (
                <div
                  key={g.id}
                  onClick={() => swapIn(g)}
                  className="flex flex-col items-center justify-start shrink-0 cursor-pointer"
                  style={{
                    width: 66,
                    transform: active ? 'scale(1.12)' : 'scale(0.86)',
                    opacity: active ? 1 : 0.6,
                    transition: 'all 0.35s',
                  }}
                >
                  {renderThumb(g, STRIP_THUMB_W, STRIP_THUMB_H, 10, {
                    border: `1px solid ${active ? 'rgba(34,211,238,0.9)' : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: active ? '0 0 18px rgba(34,211,238,0.35)' : 'none',
                  })}
                  <div className="text-white/70 leading-tight text-center px-1 mt-1 truncate" style={{ fontSize: 7.5, maxWidth: 64 }}>
                    {g.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-white/30 tracking-wider" style={{ fontSize: 10 }}>
        ↑↓/Wheel Letters · ←→/A D Same-Letter Games · Click = Swap · Hold 0.7s = Focus
      </div>
    </div>
  );
}