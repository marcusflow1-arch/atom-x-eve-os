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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[999]"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Panel — anchored below the header, centered, 70% wide */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -12, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -12, scaleY: 0.95 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={{
              position: 'fixed',
              top: '64px', // bottom of the top header bar
              left: '50%',
              transform: 'translateX(-50%)',
              width: '70%',
              zIndex: 1000,
              background: 'linear-gradient(135deg, rgba(10,14,22,0.97) 0%, rgba(16,22,34,0.97) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderTop: 'none',
              borderRadius: '0 0 20px 20px',
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

            {/* Empty content area — ready to be filled */}
            <div className="p-8 flex items-center justify-center min-h-[320px]">
              <p className="text-white/20 text-sm">Search panel coming soon</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}