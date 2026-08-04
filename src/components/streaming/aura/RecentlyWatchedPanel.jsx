import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getDiscoverStreamers, formatViewers } from './streamerMockData';

/**
 * The Aura "Recently Watched Streams" rail. Shown on Aura, Home and Discover.
 * Collapsible via its own edge toggle so users can hide it anywhere.
 */
export default function RecentlyWatchedPanel({ visible = true, onToggle }) {
  const navigate = useNavigate();
  const [internalVisible, setInternalVisible] = useState(true);
  const isOpen = onToggle ? visible : internalVisible;
  const toggle = onToggle || (() => setInternalVisible((v) => !v));

  const watched = getDiscoverStreamers([], 2).slice(0, 8);

  return (
    <>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.aside
            initial={{ x: -140, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -140, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 28 }}
            className="absolute left-0 top-0 bottom-0 w-[140px] z-40 flex flex-col items-center py-6 border-r border-white/15"
            style={{
              background: 'rgba(8, 12, 18, 0.58)',
              backdropFilter: 'blur(14px) saturate(140%)',
              WebkitBackdropFilter: 'blur(14px) saturate(140%)',
              boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
            }}
          >
            <div className="mt-16 flex flex-col items-center w-full px-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span className="text-[9px] uppercase tracking-wider text-white/60 font-bold text-center leading-tight">
                  Recently<br />Watched
                </span>
              </div>
              <div className="w-8 h-px bg-white/20 mb-4 mt-2" />

              <div className="flex flex-col gap-3 w-full items-center overflow-y-auto scrollbar-hide">
                {watched.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => navigate(createPageUrl('StreamerProfile') + `?id=${s.id}`)}
                    className="group w-full flex flex-col items-center"
                    title={`${s.name} — ${s.game}`}
                  >
                    <div className="relative w-[104px] h-[58px] rounded-lg overflow-hidden border border-white/10 group-hover:border-cyan-400/60 transition-colors bg-black">
                      <img src={s.thumbnail} alt={s.name} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 left-0.5 px-1 rounded bg-black/75 text-[8px] font-bold text-white inline-flex items-center gap-0.5">
                        <Eye className="w-2.5 h-2.5" /> {formatViewers(s.viewers)}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] font-semibold text-white/80 group-hover:text-cyan-300 truncate w-full text-center px-1">
                      {s.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Always-visible edge toggle */}
      <button
        onClick={toggle}
        title={isOpen ? 'Hide recently watched' : 'Show recently watched'}
        className="absolute top-1/2 -translate-y-1/2 z-50 w-6 h-16 rounded-r-lg flex items-center justify-center border border-l-0 border-white/15 text-white/60 hover:text-white hover:bg-white/10 transition-all"
        style={{
          left: isOpen ? '140px' : '0px',
          background: 'rgba(8, 12, 18, 0.72)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </>
  );
}