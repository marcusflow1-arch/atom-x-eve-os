import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Users, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Standardized Luna Dashboard left rail. Same design on every page:
//   - Top: "<label>" (two lines) + 5 placeholder boxes ("Recently Played" by default;
//     "Recent Visit" on the Clan page).
//   - Bottom: jeweled divider + Play launcher button with a Clan/Roster quick menu.
// `className` controls the outer width so the same component works as a flex child
// (LunaTemplate / Store) or inside a fixed 80px container (global Layout).
export default function LunaLeftRail({
  isEnvironmentActive,
  onToggleEnvironment,
  label = 'Recently Played',
  className = 'w-[5%] min-w-[80px]',
  showPlayButton = true,
}) {
  const navigate = useNavigate();
  const [playMenuOpen, setPlayMenuOpen] = useState(false);

  const words = (label || 'Recently Played').split(' ');
  const firstWord = words[0];
  const restWords = words.slice(1).join(' ');

  return (
    <div
      className={`${className} h-full border-r border-white/20 bg-black/20 relative z-40 flex-shrink-0 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm flex flex-col items-center py-6`}
    >
      {/* Top — label + 5 boxes */}
      <div className="mt-12 px-2 flex flex-col items-center w-full">
        <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold text-center mb-1">
          {firstWord}
          <br />
          {restWords}
        </span>
        <div className="w-8 h-px bg-white/20 mb-3" />
        <div className="flex flex-col gap-2 w-full items-center">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center"
            >
              <span className="text-white/30 text-lg font-bold">?</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {showPlayButton && (
        <>
          {/* Jeweled divider */}
          <div className="w-full flex items-center gap-2 px-3 py-1 shrink-0">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)' }} />
            <span className="w-1.5 h-1.5 rotate-45 bg-white/40" style={{ boxShadow: '0 0 6px rgba(255,255,255,0.5)' }} />
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)' }} />
          </div>

          {/* Play launcher with Clan/Roster quick menu */}
          <div className="w-full flex-shrink-0 flex flex-col items-center gap-2 py-2 relative">
            <button
              onClick={() => setPlayMenuOpen((v) => !v)}
              className="group flex flex-col items-center justify-center gap-0.5 w-12 h-12 rounded-2xl text-white transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                boxShadow: '0 6px 22px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
              title="Play quick menu"
            >
              <Play className="w-5 h-5 fill-white" />
              <span className="text-[8px] font-bold uppercase tracking-wider">Play</span>
            </button>

            <AnimatePresence>
              {playMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setPlayMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-full top-2 ml-2 z-50 w-36 rounded-xl border border-white/10 overflow-hidden"
                    style={{ background: 'rgba(8,12,18,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                  >
                    <button
                      onClick={() => { setPlayMenuOpen(false); navigate(createPageUrl('Clan')); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                      <Users className="w-4 h-4 text-cyan-300" /> Clan
                    </button>
                    <button
                      onClick={() => { setPlayMenuOpen(false); navigate(createPageUrl('Clan') + '?view=roster'); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <ClipboardList className="w-4 h-4 text-purple-300" /> Roster
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Jeweled divider */}
          <div className="w-full flex items-center gap-2 px-3 py-1 shrink-0">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)' }} />
            <span className="w-1.5 h-1.5 rotate-45 bg-white/40" style={{ boxShadow: '0 0 6px rgba(255,255,255,0.5)' }} />
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)' }} />
          </div>
        </>
      )}

      <div className="flex-1" />
    </div>
  );
}