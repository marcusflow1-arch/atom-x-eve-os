import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomeObjectInteraction({ objectId, contentType, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 220 }}
          className="absolute bottom-0 left-0 right-0 p-6 bg-slate-900/95 border-t border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-white/70 text-sm mb-2">Approached: {objectId}</div>
          {contentType === 'achievements' && <div className="text-white">Your trophies shimmer softly on the wall.</div>}
          {contentType === 'games' && <div className="text-white">The console hums ready to play.</div>}
          {contentType === 'activity' && <div className="text-white">A few fresh memories are pinned here.</div>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}