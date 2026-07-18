import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

export default function DevUpdatesSlideshow({ updates, accent }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIdx((p) => (p + 1) % updates.length), [updates.length]);
  const prev = () => setIdx((p) => (p - 1 + updates.length) % updates.length);

  useEffect(() => {
    if (paused || updates.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next, updates.length]);

  if (!updates || updates.length === 0) return null;

  const update = updates[idx];

  return (
    <div
      className="relative rounded-2xl border border-white/10 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className={`w-3.5 h-3.5 ${accent.text}`} />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Latest from the Studio</p>
        </div>
        <div className="flex items-center gap-1.5">
          {updates.length > 1 && (
            <>
              <button onClick={prev} className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 transition-all">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setPaused((p) => !p)} className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 transition-all">
                {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              </button>
              <button onClick={next} className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 transition-all">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="relative px-4 pb-4" style={{ minHeight: '100px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${accent.bg} ${accent.text}`}>
                {update.date}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">{update.title}</h4>
            <p className="text-xs text-white/50 leading-relaxed">{update.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      {updates.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-3">
          {updates.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === idx ? `w-5 ${accent.bar}` : 'w-1.5 bg-white/15'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}