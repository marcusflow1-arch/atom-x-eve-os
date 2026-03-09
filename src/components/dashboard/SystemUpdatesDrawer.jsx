import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, ChevronRight, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';

export default function SystemUpdatesDrawer({ open, onClose }) {
  const [selectedUpdate, setSelectedUpdate] = useState(null);

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['platform-updates-drawer'],
    queryFn: () => base44.entities.PlatformUpdate.filter({ published: true }),
    staleTime: 60000,
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            onClick={onClose}
            style={{ pointerEvents: 'all' }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[420px] z-[9999] flex flex-col rounded-l-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(10, 16, 28, 0.95) 100%)',
              backdropFilter: 'blur(30px) saturate(150%)',
              WebkitBackdropFilter: 'blur(30px) saturate(150%)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              pointerEvents: 'all'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/10 flex-shrink-0 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg tracking-wide drop-shadow-md">System Updates</h2>
                  <p className="text-cyan-300/60 text-xs">{updates.length} available</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.15] flex items-center justify-center transition-all border border-white/10"
              >
                <X className="w-4 h-4 text-white/80" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 relative" style={{ scrollbarWidth: 'none' }}>
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-white/15 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : updates.length > 0 ? (
                updates.map((update, i) => {
                  const isExpanded = selectedUpdate?.id === update.id;
                  return (
                    <motion.div
                      key={update.id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedUpdate(isExpanded ? null : update)}
                      className="rounded-xl overflow-hidden cursor-pointer transition-all border"
                      style={{
                        background: isExpanded ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        borderColor: isExpanded ? 'rgba(34, 211, 238, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                        boxShadow: isExpanded ? '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' : 'none'
                      }}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {update.update_type === 'required' ? <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" /> :
                           update.update_type === 'feature' ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> :
                           <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-sm truncate">{update.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {update.version && <span className="text-cyan-300/80 text-[10px] font-mono border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 rounded">v{update.version}</span>}
                              <span className="text-white/40 text-[10px]">{update.created_date ? moment(update.created_date).fromNow() : 'Recently'}</span>
                            </div>
                          </div>
                          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} className="flex-shrink-0 text-white/30 self-center">
                            <ChevronRight className="w-4 h-4" />
                          </motion.div>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4"
                          >
                            <div className="w-full h-px bg-white/10 mb-3" />
                            {update.image_url && (
                              <img src={update.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-3 border border-white/10" />
                            )}
                            <p className="text-white/60 text-xs leading-relaxed mb-3">{update.description}</p>
                            {update.full_content && (
                              <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                                <p className="text-white/50 text-xs whitespace-pre-wrap">{update.full_content}</p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400/20 mb-4" />
                  <p className="text-white/60 font-medium">System is up to date</p>
                  <p className="text-white/30 text-xs mt-1">No new updates available</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}