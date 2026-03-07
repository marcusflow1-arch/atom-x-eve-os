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

          <AnimatePresence mode="wait">
            <motion.div
              key={expanded ? 'expanded' : 'collapsed'}
              initial={{ opacity: 0, scale: expanded ? 0.95 : 1, x: expanded ? 0 : 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: expanded ? 0.95 : 1, x: expanded ? 0 : 50 }}
              transition={{ duration: 0.25 }}
              className="fixed z-[9999] flex flex-col"
              style={{
                background: 'rgba(10, 16, 28, 0.96)',
                backdropFilter: 'blur(30px) saturate(150%)',
                WebkitBackdropFilter: 'blur(30px) saturate(150%)',
                boxShadow: '-4px 0 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                pointerEvents: 'all',
                ...(expanded ? {
                  top: '80px',
                  bottom: '80px',
                  left: '24px',
                  right: '24px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                } : {
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: '429px',
                  borderTopLeftRadius: '24px',
                  borderBottomLeftRadius: '24px',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.10)',
                })
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
                expanded={expanded}
                onToggleExpand={() => setExpanded(v => !v)}
              />
            </div>
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}