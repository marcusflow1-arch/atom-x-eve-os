import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Maximize2, ArrowRight, Circle } from 'lucide-react';

const GENRES = [
  "MMORPG",
  "RPG",
  "Fear",
  "Shooter",
  "Action",
  "Adventure",
  "Strategy",
  "Puzzle",
  "Racing",
  "Sports"
];

const ShinyCard = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = event.clientX - rect.left;
    const mouseYPos = event.clientY - rect.top;
    const xPct = mouseXPos / width - 0.5;
    const yPct = mouseYPos / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        rotateX, 
        rotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.05 }}
      className="relative aspect-[3/4] rounded-xl bg-slate-900/40 backdrop-blur-md border border-white/10 overflow-hidden cursor-pointer group shadow-lg"
    >
      {/* Empty Box Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-white/5" />
      </div>

      {/* Shiny Effect Overlay */}
      <motion.div 
        style={{
          opacity: useTransform(rotateX, (val) => Math.abs(val) / 30 + 0.1),
          background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 55%, transparent 80%)",
          transform: useTransform(mouseX, [-0.5, 0.5], ["translateX(-100%)", "translateX(100%)"]),
        }}
        className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay"
      />
    </motion.div>
  );
};

export default function LunaCardScroll({ onExpand }) {
  const [page, setPage] = useState(0);

  return (
    <div className="w-80 h-[400px] flex flex-col mt-6">
      {/* Scroll Container with custom scrollbar */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 2px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        `}</style>

        {GENRES.map((genre) => (
          <div key={genre} className="relative">
            <div className="flex items-center justify-between mb-3 pl-1">
              <h3 className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">{genre}</h3>
              {genre === 'MMORPG' && (
                <button 
                  onClick={() => onExpand && onExpand(genre)}
                  className="text-white/40 hover:text-white transition-colors"
                  title="Expand View"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <div className="relative">
              <div className="grid grid-cols-3 gap-3">
                {/* Dynamic content for MMORPG based on page */}
                {genre === 'MMORPG' ? (
                   Array.from({ length: 3 }).map((_, i) => (
                     <ShinyCard key={`mmorpg-${page}-${i}`} />
                   ))
                ) : (
                  <>
                    <ShinyCard />
                    <ShinyCard />
                    <ShinyCard />
                  </>
                )}
              </div>

              {/* Arrow for MMORPG */}
              {genre === 'MMORPG' && (
                <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col items-center">
                  <button 
                    onClick={() => setPage(prev => (prev + 1) % 2)}
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-all group"
                  >
                    <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}