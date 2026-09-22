import React from 'react';
import { motion } from 'framer-motion';

/**
 * Blank workspace used by the Library three-dot action.
 * It deliberately mirrors the game overlay footprint while keeping the body empty.
 */
export default function BlankGameUI() {
  return (
    <motion.div
      key={'blank-' + (game?.id || 'none')}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.3 }}
      className="pointer-events-auto h-full w-full overflow-hidden flex flex-col"
      style={{
        background: 'rgba(8,12,18,0.96)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
      }}
    >
      {/* Intentionally blank body — controls/content will be added later. */}
      <div className="flex-1" />
    </motion.div>
  );
}