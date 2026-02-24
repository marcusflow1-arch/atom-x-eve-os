import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, X, ChevronLeft, ChevronRight } from 'lucide-react';
import EnvironmentHub from '@/components/environment/EnvironmentHub';

export default function EnvHubDrawer({ open, onClose, currentEnvId, onSelectEnv }) {
  const [expanded, setExpanded] = useState(false);

  const handleClose = () => {
    setExpanded(false);
    onClose();
  };

  const handleSelect = (env) => {
    onSelectEnv?.(env);
    handleClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Full-screen backdrop — blocks all clicks from reaching the Luna Dashboard */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[9998]"
            onClick={handleClose}
            style={{ pointerEvents: 'all' }}
          />

          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 z-[9999] flex flex-col rounded-r-3xl"
            style={{
              width: expanded ? '100vw' : '429px',
              background: 'rgba(10, 16, 28, 0.96)',
              backdropFilter: 'blur(30px) saturate(150%)',
              WebkitBackdropFilter: 'blur(30px) saturate(150%)',
              borderRight: '1px solid rgba(255, 255, 255, 0.10)',
              boxShadow: '-4px 0 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              pointerEvents: 'all',
              transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <span className="text-white font-bold text-lg tracking-wide">Environment Hub</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Expand / collapse */}
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.14] flex items-center justify-center transition-all border border-white/10"
                  title={expanded ? 'Collapse' : 'Expand to full width'}
                >
                  {expanded
                    ? <ChevronRight className="w-4 h-4 text-cyan-300" />
                    : <ChevronLeft className="w-4 h-4 text-cyan-300" />
                  }
                </button>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'none' }}>
              <EnvironmentHub
                currentEnvId={currentEnvId}
                onSelectEnv={handleSelect}
                onClose={handleClose}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}