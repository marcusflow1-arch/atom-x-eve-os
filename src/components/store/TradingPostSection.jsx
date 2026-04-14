import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TradingPostSection({ title, items = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-rotate through items every 5 seconds
  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;

  const activeItem = items[activeIndex];

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-950/50 p-6">
      {/* Title */}
      <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">{title}</h3>

      {/* Large Preview Box */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeItem.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="relative aspect-video rounded-xl overflow-hidden mb-4 group"
        >
          <img
            src={activeItem.image}
            alt={activeItem.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h4 className="text-white font-bold text-lg mb-1">{activeItem.title}</h4>
            <p className="text-white/70 text-sm line-clamp-2">{activeItem.description || ''}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Small Boxes Carousel */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveIndex((prev) => (prev - 1 + items.length) % items.length)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>

        <div className="flex-1 overflow-x-auto gap-2 flex pb-2">
          {items.map((item, idx) => (
            <motion.button
              key={item.id}
              onClick={() => setActiveIndex(idx)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                activeIndex === idx
                  ? 'border-cyan-400 ring-2 ring-cyan-400/50'
                  : 'border-white/20 hover:border-white/40'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </motion.button>
          ))}
        </div>

        <button
          onClick={() => setActiveIndex((prev) => (prev + 1) % items.length)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex-shrink-0"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}