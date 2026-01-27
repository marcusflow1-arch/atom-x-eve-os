import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ShinyCard from '@/components/shared/ShinyCard';
import StreamerRightPane from './StreamerRightPane';

const mockStreamers = Array.from({ length: 14 }).map((_, i) => ({
  id: `str_${i + 1}`,
  name: [
    'NovaKnight','PixelSage','ZeroShift','LunaVox','CrimsonByte','EchoBlade','SolarFlare',
    'FrostSpark','NeonRift','AstraWave','NightPulse','QuantumFox','VortexEdge','ZenithKai'
  ][i],
  avatar: `https://source.unsplash.com/random/240x240?gamer,portrait&sig=${i + 11}`,
}));

export default function DiscoverStreamingList() {
  const [selected, setSelected] = useState(0);
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const itemRefs = useRef([]);

  // A = up, S = down navigation
  useEffect(() => {
    const onKey = (e) => {
      const key = e.key?.toLowerCase();
      if (key === 'a' || key === 's') {
        e.preventDefault();
        setSelected((prev) => {
          if (key === 'a') return Math.max(0, prev - 1);
          if (key === 's') return Math.min(mockStreamers.length - 1, prev + 1);
          return prev;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Keep selected card in view
  React.useEffect(() => {
    const el = itemRefs.current[selected];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selected]);

  return (
    <div className="w-full min-h-screen pt-20 pb-24 px-4 md:px-8">
      <div className="mx-auto max-w-7xl flex flex-col relative transition-all duration-500">
        
        {/* Top: Horizontal Streamer List */}
        <AnimatePresence>
          {!isListCollapsed && (
            <motion.div
              initial={{ height: 'auto', opacity: 1, marginBottom: 32 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="w-full overflow-hidden"
            >
              <div className="w-full overflow-x-auto no-scrollbar pb-2">
                <div className="flex gap-4">
                  {mockStreamers.map((s, idx) => (
                    <motion.div
                      key={s.id}
                      ref={(el) => (itemRefs.current[idx] = el)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.02 }}
                      onClick={() => setSelected(idx)}
                      className="flex-shrink-0"
                    >
                      <ShinyCard
                        className={`relative w-[240px] rounded-2xl p-3 border ${
                          selected === idx
                            ? 'border-white/30 bg-white/15'
                            : 'border-white/10 bg-white/8'
                        } backdrop-blur-xl transition-all cursor-pointer`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden ring-1 ring-white/15 flex-shrink-0">
                            <img
                              src={s.avatar}
                              alt={s.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-sm tracking-wide truncate">
                              {s.name}
                            </h3>
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                                style={{ width: `${40 + (idx % 5) * 12}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </ShinyCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse/Expand Arrow */}
        <div className="flex justify-center -mt-4 mb-6 relative z-10">
            <button 
                onClick={() => setIsListCollapsed(!isListCollapsed)}
                className="w-12 h-8 bg-white/5 hover:bg-white/15 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center transition-all hover:scale-110 group shadow-lg"
                title={isListCollapsed ? "Show Streamers" : "Hide Streamers"}
            >
                {isListCollapsed ? (
                    <ChevronDown className="w-5 h-5 text-white/70 group-hover:text-white" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-white/70 group-hover:text-white" />
                )}
            </button>
        </div>

        {/* Main Content */}
        <motion.div
            layout
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
            <StreamerRightPane streamer={mockStreamers[selected]} />
        </motion.div>
      </div>

      {/* Local styles for hidden scrollbar */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}