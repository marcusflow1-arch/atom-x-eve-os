import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, X, ChevronLeft, ChevronRight } from 'lucide-react';
import EnvironmentHub from '@/components/environment/EnvironmentHub';

export default function EnvHubDrawer({ open, onClose, currentEnvId, onSelectEnv }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleClose = () => {
    setExpanded(false);
    setSelectedItem(null);
    onClose();
  };

  const handleSelect = (env) => {
    onSelectEnv?.(env);
    handleClose();
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
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

          {/* Detail Panel (left) - appears when item selected */}
          <AnimatePresence>
            {selectedItem && (
              <motion.div
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 z-[9999] flex flex-col rounded-r-3xl"
                style={{
                  width: '400px',
                  background: 'rgba(10, 16, 28, 0.96)',
                  backdropFilter: 'blur(30px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(30px) saturate(150%)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.10)',
                  boxShadow: '4px 0 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                  pointerEvents: 'all',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-white/10 flex-shrink-0">
                  <span className="text-white font-bold text-lg tracking-wide">{selectedItem.title || selectedItem.name}</span>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'none' }}>
                  <div className="space-y-4">
                    {selectedItem.thumbnail || selectedItem.background ? (
                      <img
                        src={selectedItem.thumbnail || selectedItem.background}
                        alt={selectedItem.title || selectedItem.name}
                        className="w-full aspect-video rounded-xl object-cover"
                      />
                    ) : null}
                    <div>
                      <h3 className="text-white font-bold text-base mb-2">{selectedItem.title || selectedItem.name}</h3>
                      {selectedItem.description && (
                        <p className="text-white/50 text-xs leading-relaxed">{selectedItem.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-[9999] flex rounded-l-3xl"
            style={{
              width: expanded ? 'calc(100vw - 80px)' : selectedItem ? 'calc(100vw - 400px)' : '429px',
              background: 'rgba(10, 16, 28, 0.96)',
              backdropFilter: 'blur(30px) saturate(150%)',
              WebkitBackdropFilter: 'blur(30px) saturate(150%)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.10)',
              boxShadow: '-4px 0 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              pointerEvents: 'all',
              transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {expanded && (
              <>
                {/* Left Sidebar */}
                <div className="w-64 flex flex-col border-r border-white/10 flex-shrink-0">
                  <div className="p-4 flex items-center justify-between border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <span className="text-white font-bold text-sm">Hub</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    <EnvironmentHub
                      currentEnvId={currentEnvId}
                      onSelectEnv={handleSelect}
                      onClose={handleClose}
                      onItemClick={handleItemClick}
                      compact
                    />
                  </div>
                </div>

                {/* Right Content Panel */}
                <div className="flex-1 flex flex-col">
                  <div className="p-6 flex items-center justify-between border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-cyan-400" />
                      <span className="text-white font-bold text-lg tracking-wide">Environment Hub</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpanded(false)}
                        className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.14] flex items-center justify-center transition-all border border-white/10"
                        title="Collapse"
                      >
                        <ChevronRight className="w-4 h-4 text-cyan-300" />
                      </button>
                      <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                      >
                        <X className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'none' }}>
                    <EnvironmentHub
                      currentEnvId={currentEnvId}
                      onSelectEnv={handleSelect}
                      onClose={handleClose}
                    />
                  </div>
                </div>
              </>
            )}

            {!expanded && (
              <>
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-white/10 flex-shrink-0 w-full">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    <span className="text-white font-bold text-lg tracking-wide">Environment Hub</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Expand / collapse */}
                    <button
                      onClick={() => setExpanded(true)}
                      className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.14] flex items-center justify-center transition-all border border-white/10"
                      title="Expand to full width"
                    >
                      <ChevronLeft className="w-4 h-4 text-cyan-300" />
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
                <div className="flex-1 overflow-y-auto p-4 w-full" style={{ scrollbarWidth: 'none' }}>
                  <EnvironmentHub
                    currentEnvId={currentEnvId}
                    onSelectEnv={handleSelect}
                    onClose={handleClose}
                  />
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}