import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { useViewMode } from './ViewModeContext';
import { motion } from 'framer-motion';

export default function ViewModeToggle() {
  const { viewMode, toggleViewMode } = useViewMode();

  return (
    <button
      onClick={toggleViewMode}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all group"
      title={viewMode === 'desktop' ? 'Switch to Mobile View' : 'Switch to Desktop View'}
    >
      <Monitor className={`w-4 h-4 transition-colors ${viewMode === 'desktop' ? 'text-cyan-400' : 'text-white/30'}`} />
      
      <div className="w-8 h-4 rounded-full bg-white/10 relative">
        <motion.div
          animate={{ x: viewMode === 'mobile' ? 16 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-cyan-400"
        />
      </div>
      
      <Smartphone className={`w-4 h-4 transition-colors ${viewMode === 'mobile' ? 'text-cyan-400' : 'text-white/30'}`} />
    </button>
  );
}