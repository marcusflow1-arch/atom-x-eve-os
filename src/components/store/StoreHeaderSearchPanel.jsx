import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function StoreHeaderSearchPanel({ isOpen, onClose }) {
  const panelRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — only covers the main content area (right of sidebar) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[999]"
            style={{
              top: '128px', // below both header bars
              left: '80px', // right edge of the left sidebar
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
          />

          {/* Panel — drops from the bottom line of the header, flush with main area */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scaleY: 0.97 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            style={{
              position: 'fixed',
              top: '128px', // bottom of genre sub-nav (h-16 header + ~60px sub-nav)
              left: '80px', // flush with right edge of left sidebar
              right: 0,
              zIndex: 1000,
              background: 'linear-gradient(135deg, rgba(10,14,22,0.98) 0%, rgba(16,22,34,0.98) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderLeft: 'none',
              borderRight: 'none',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              borderBottom: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
              transformOrigin: 'top center',
              minHeight: '320px',
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-all border border-white/10"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>

            {/* Content area */}
            <div className="p-8 flex items-center justify-center min-h-[320px]">
              <p className="text-white/20 text-sm">Search panel coming soon</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}