import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const glassStyle = {
  background: 'rgba(8, 12, 18, 0.42)',
  backdropFilter: 'blur(30px) saturate(150%)',
  WebkitBackdropFilter: 'blur(30px) saturate(150%)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
};

export default function GlassPageFrame({ children, bottomContent, topContent, showTriggerTab = false, className = '' }) {
  const [overlay, setOverlay] = useState(null); // null | 'studio' | 'stream'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOverlay(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`relative w-full h-full min-h-screen ${className}`}>
      {/* Top Glass Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[35]"
        style={{
          ...glassStyle,
          height: '64px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          pointerEvents: topContent ? 'auto' : 'none',
        }}
      >
        {topContent && (
          <div className="h-full flex items-center px-6 w-full">
            {topContent}
          </div>
        )}
      </div>

      {/* Page Content */}
      <div className="relative z-[1]">
        {children}
      </div>

      {/* Overlay - between top and bottom bars */}
      <AnimatePresence>
        {overlay && (
          <motion.div
            key={overlay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 right-0 z-[34]"
            style={{
              top: '64px',
              bottom: '48px',
              background: 'rgba(6, 8, 14, 0.92)',
              backdropFilter: 'blur(40px) saturate(160%)',
              WebkitBackdropFilter: 'blur(40px) saturate(160%)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Empty overlay — content TBD */}
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white/10 text-xs uppercase tracking-widest font-bold">{overlay}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Glass Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[35]"
        style={{
          ...glassStyle,
          minHeight: '48px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          pointerEvents: bottomContent || showTriggerTab ? 'auto' : 'none',
        }}
      >
        {/* Trigger Tab */}
        {showTriggerTab && (
          <div
            className="absolute left-1/2 -translate-x-1/2 flex overflow-hidden pointer-events-auto"
            style={{
              top: '-36px',
              width: '216px',
              height: '40px',
              background: 'rgba(8, 12, 18, 0.42)',
              backdropFilter: 'blur(30px) saturate(150%)',
              WebkitBackdropFilter: 'blur(30px) saturate(150%)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
              borderRadius: '8px 8px 0 0',
              boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Games - no action */}
            <div
              className="flex-1 flex items-center justify-center border-r border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
            >
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Games</span>
            </div>

            {/* Studio */}
            <div
              onClick={() => setOverlay(overlay === 'studio' ? null : 'studio')}
              className={`flex-1 flex items-center justify-center border-r border-white/10 cursor-pointer transition-colors ${overlay === 'studio' ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${overlay === 'studio' ? 'text-white/90' : 'text-white/50'}`}>Studio</span>
            </div>

            {/* Stream */}
            <div
              onClick={() => setOverlay(overlay === 'stream' ? null : 'stream')}
              className={`flex-1 flex items-center justify-center cursor-pointer transition-colors ${overlay === 'stream' ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${overlay === 'stream' ? 'text-white/90' : 'text-white/50'}`}>Stream</span>
            </div>
          </div>
        )}

        {bottomContent && (
          <div className="h-full w-full flex items-center justify-center px-6 py-2">
            {bottomContent}
          </div>
        )}
      </div>
    </div>
  );
}