import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { formatViewers } from './streamerMockData';

/**
 * Bottom 10% rail: a blurred, blended-in overlay strip that scrolls
 * left/right through the other people streaming the same game.
 */
export default function OtherStreamersRail({ streamers = [], activeId, onSelect, gameTitle }) {
  const scrollRef = useRef(null);

  const scrollBy = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 420, behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 28 }}
      className="absolute bottom-0 left-0 right-0 h-[10%] min-h-[92px] z-20 flex items-center"
      style={{
        background: 'linear-gradient(to top, rgba(6,9,14,0.92) 0%, rgba(6,9,14,0.62) 55%, rgba(6,9,14,0) 100%)',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
      }}
    >
      <div className="absolute top-1 left-4 text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
        Also streaming {gameTitle}
      </div>

      <button
        onClick={() => scrollBy(-1)}
        className="ml-2 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 flex-shrink-0"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div ref={scrollRef} className="flex-1 flex items-center gap-3 overflow-x-auto scrollbar-hide px-3 pt-4">
        {streamers.map((s) => {
          const active = s.id === activeId;
          return (
            <button
              key={s.id}
              onClick={() => onSelect?.(s)}
              className={`flex items-center gap-2 pr-3 pl-1 py-1 rounded-lg border flex-shrink-0 transition-all ${
                active
                  ? 'bg-cyan-500/20 border-cyan-400/50'
                  : 'bg-white/[0.06] border-white/10 hover:bg-white/[0.12] hover:border-white/25'
              }`}
            >
              <div className="relative w-[86px] h-[48px] rounded-md overflow-hidden bg-black flex-shrink-0">
                <img src={s.thumbnail} alt={s.name} className="w-full h-full object-cover" />
                <span className="absolute bottom-0.5 left-0.5 px-1 rounded bg-black/75 text-[8px] font-bold text-white inline-flex items-center gap-0.5">
                  <Eye className="w-2.5 h-2.5" /> {formatViewers(s.viewers)}
                </span>
              </div>
              <div className="text-left min-w-0 max-w-[130px]">
                <p className={`text-xs font-bold truncate ${active ? 'text-cyan-200' : 'text-white'}`}>{s.name}</p>
                <p className="text-[10px] text-white/50 truncate">{s.title}</p>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => scrollBy(1)}
        className="mr-2 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 flex-shrink-0"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}