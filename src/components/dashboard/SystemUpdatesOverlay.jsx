import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, AlertCircle, CheckCircle, Info, ChevronRight, Clock, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';

function UpdateCard({ update, isSelected, onClick }) {
  const icon = update.update_type === 'required'
    ? <AlertCircle className="w-5 h-5 text-red-400" />
    : update.update_type === 'feature'
    ? <CheckCircle className="w-5 h-5 text-green-400" />
    : <Info className="w-5 h-5 text-blue-400" />;

  const borderColor = update.update_type === 'required'
    ? 'border-red-500/30 hover:border-red-400/50'
    : update.update_type === 'feature'
    ? 'border-green-500/20 hover:border-green-400/40'
    : 'border-white/10 hover:border-white/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onClick(update)}
      className={`p-4 rounded-xl cursor-pointer transition-all border ${borderColor} ${
        isSelected ? 'bg-white/8 ring-1 ring-white/20' : 'bg-white/3 hover:bg-white/5'
      }`}
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-start gap-3">
        {icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white font-semibold text-sm truncate">{update.title}</h3>
            {update.version && (
              <span className="text-white/30 text-[10px] font-mono ml-2 flex-shrink-0">v{update.version}</span>
            )}
          </div>
          <p className="text-white/50 text-xs line-clamp-2">{update.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-white/25 text-[10px]">
              <Clock className="w-3 h-3" />
              <span>{update.created_date ? moment(update.created_date).fromNow() : 'Recently'}</span>
            </div>
            {update.update_type === 'required' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-semibold">
                Required
              </span>
            )}
            {update.update_type === 'feature' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 font-semibold">
                New Feature
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" />
      </div>
    </motion.div>
  );
}

export default function SystemUpdatesOverlay({ onClose }) {
  const [selectedUpdate, setSelectedUpdate] = useState(null);

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['platform-updates-overlay'],
    queryFn: () => base44.entities.PlatformUpdate.filter({ published: true }),
    staleTime: 60000,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed z-[39] flex flex-col overflow-hidden"
      style={{
        top: '64px',
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(8, 12, 18, 0.97)',
        backdropFilter: 'blur(40px) saturate(150%)',
        WebkitBackdropFilter: 'blur(40px) saturate(150%)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg tracking-wide">System Updates</h2>
            <p className="text-white/35 text-xs">{updates.length} update{updates.length !== 1 ? 's' : ''} available</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 hover:border-white/20"
        >
          <X className="w-5 h-5 text-white/60 hover:text-white" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Updates List */}
        <div className="w-1/2 border-r border-white/8 overflow-y-auto p-4 space-y-2" style={{ scrollbarWidth: 'none' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-white/15 border-t-cyan-400 rounded-full animate-spin" />
            </div>
          ) : updates.length > 0 ? (
            updates.map((update, i) => (
              <UpdateCard
                key={update.id || i}
                update={update}
                isSelected={selectedUpdate?.id === update.id}
                onClick={setSelectedUpdate}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CheckCircle className="w-16 h-16 text-green-400/20 mb-4" />
              <p className="text-white/40 text-sm font-medium">No available updates</p>
              <p className="text-white/20 text-xs mt-2">Your system is fully up to date</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="w-1/2 overflow-y-auto p-6" style={{ scrollbarWidth: 'none' }}>
          <AnimatePresence mode="wait">
            {selectedUpdate ? (
              <motion.div
                key={selectedUpdate.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {selectedUpdate.image_url && (
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <img src={selectedUpdate.image_url} alt="" className="w-full h-40 object-cover" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedUpdate.update_type === 'required' && <AlertCircle className="w-5 h-5 text-red-400" />}
                    {selectedUpdate.update_type === 'feature' && <CheckCircle className="w-5 h-5 text-green-400" />}
                    {!['required', 'feature'].includes(selectedUpdate.update_type) && <Info className="w-5 h-5 text-blue-400" />}
                    <h3 className="text-white font-bold text-xl">{selectedUpdate.title}</h3>
                  </div>
                  {selectedUpdate.version && (
                    <p className="text-white/40 text-sm mb-3 font-mono">Version {selectedUpdate.version}</p>
                  )}
                  <p className="text-white/60 text-sm leading-relaxed">{selectedUpdate.description}</p>
                </div>

                {selectedUpdate.full_content && (
                  <div className="p-4 rounded-xl bg-white/3 border border-white/8">
                    <p className="text-white/50 text-sm whitespace-pre-wrap leading-relaxed">{selectedUpdate.full_content}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 text-white/25 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{selectedUpdate.created_date ? moment(selectedUpdate.created_date).format('MMMM D, YYYY') : 'Date unknown'}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center py-20"
              >
                <Bot className="w-12 h-12 text-white/10 mb-3" />
                <p className="text-white/25 text-sm">Select an update to view details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}