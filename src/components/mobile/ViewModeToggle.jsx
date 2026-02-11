import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { useViewMode } from './ViewModeContext';
import { motion } from 'framer-motion';

export default function ViewModeToggle() {
  const { viewMode, toggleViewMode } = useViewMode();
  const isMobile = viewMode === 'mobile';

  return (
    <button
      onClick={toggleViewMode}
      className="flex items-center gap-1.5 h-8 px-2 rounded-full transition-all"
      style={{
        background: 'rgba(10, 14, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
      title={isMobile ? 'Switch to Desktop' : 'Switch to Mobile'}
    >
      <div className={`flex items-center justify-center w-5 h-5 rounded-full transition-all duration-200 ${!isMobile ? 'bg-cyan-500/20' : ''}`}>
        <Monitor className={`w-3 h-3 transition-colors duration-200 ${!isMobile ? 'text-cyan-400' : 'text-white/30'}`} />
      </div>

      <div className="w-7 h-3.5 rounded-full relative" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <motion.div
          animate={{ x: isMobile ? 14 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400"
          style={{ boxShadow: '0 0 6px rgba(34, 211, 238, 0.5)' }}
        />
      </div>

      <div className={`flex items-center justify-center w-5 h-5 rounded-full transition-all duration-200 ${isMobile ? 'bg-cyan-500/20' : ''}`}>
        <Smartphone className={`w-3 h-3 transition-colors duration-200 ${isMobile ? 'text-cyan-400' : 'text-white/30'}`} />
      </div>
    </button>
  );
}