import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Radio, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QuickInfoOverlay({ open, item, onClose, onPlay, onStream, onMoreInfo }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Right-side region overlay (from right edge to sidebar width) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 bottom-0 right-0 left-[320px] sm:left-[384px] z-[80]"
            onClick={onClose}
            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35))' }}
          />

          {/* Slide-in panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="fixed top-0 right-0 bottom-0 z-[90] w-full sm:w-[520px] md:w-[560px] border-l border-white/10"
            style={{
              background: 'rgba(20,24,34,0.85)',
              backdropFilter: 'blur(18px) saturate(160%)',
              WebkitBackdropFilter: 'blur(18px) saturate(160%)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.45)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                {item?.image ? (
                  <img src={item.image} alt={item?.title || 'Item'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded bg-white/20" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-semibold truncate">{item?.title || 'Selected Item'}</h3>
                {item?.subtitle && <p className="text-white/60 text-xs truncate">{item.subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="ml-auto w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hero media */}
            <div className="relative h-44 sm:h-52 border-b border-white/10 overflow-hidden">
              {item?.image ? (
                <img src={item.image} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-4 flex gap-2">
                <Button onClick={onPlay} className="bg-emerald-600 hover:bg-emerald-700">
                  <Play className="w-4 h-4" /> Play
                </Button>
                <Button variant="secondary" onClick={onStream}>
                  <Radio className="w-4 h-4" /> Stream
                </Button>
                <Button variant="outline" onClick={onMoreInfo}>
                  <Info className="w-4 h-4" /> Info
                </Button>
              </div>
            </div>

            {/* Quick details */}
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl p-3 border border-white/10 bg-white/5">
                  <p className="text-white/50 text-xs">Type</p>
                  <p className="text-white font-medium capitalize">{item?.type || 'item'}</p>
                </div>
                <div className="rounded-xl p-3 border border-white/10 bg-white/5">
                  <p className="text-white/50 text-xs">Status</p>
                  <p className="text-white font-medium">Ready</p>
                </div>
              </div>

              <div className="rounded-xl p-3 border border-white/10 bg-white/5 text-sm text-white/80">
                {item?.type === 'game' && (
                  <p>Launch the game instantly or view more details before you jump in.</p>
                )}
                {item?.type === 'stream' && (
                  <p>Start watching the live channel or open the stream page for chat.</p>
                )}
                {item?.type === 'app' && (
                  <p>Open the entertainment app or read more about features.</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}