import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Maximize2, X, AlertCircle, CheckCircle, Info, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

function UpdateRow({ update, onClick }) {
  const icon = update.update_type === 'required'
    ? <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
    : update.update_type === 'feature'
    ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
    : <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />;

  return (
    <div
      onClick={() => onClick?.(update)}
      className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all hover:bg-white/5 border border-transparent hover:border-white/8 group"
    >
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-white/80 text-xs font-semibold truncate">{update.title}</p>
        <p className="text-white/35 text-[10px] truncate">{update.description}</p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
    </div>
  );
}

export default function SystemUpdatesBox({ onOpenFullscreen }) {
  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['platform-updates-box'],
    queryFn: () => base44.entities.PlatformUpdate.filter({ published: true }),
    staleTime: 60000,
  });

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col pointer-events-auto"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.05)',
        maxHeight: '280px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" style={{ filter: 'drop-shadow(0px 0px 6px rgba(34, 211, 238, 0.5))' }} />
          <span className="text-white/80 text-xs font-bold uppercase tracking-wider">System Updates</span>
        </div>
        <button
          onClick={onOpenFullscreen}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/8 hover:border-white/15"
          title="View All Updates"
        >
          <Maximize2 className="w-3.5 h-3.5 text-white/50 hover:text-white/80" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5" style={{ scrollbarWidth: 'none' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-white/15 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : updates.length > 0 ? (
          updates.slice(0, 5).map((update, i) => (
            <UpdateRow key={update.id || i} update={update} onClick={onOpenFullscreen} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-8 h-8 text-green-400/30 mb-2" />
            <p className="text-white/30 text-xs font-medium">No available updates</p>
            <p className="text-white/15 text-[10px] mt-1">Your system is up to date</p>
          </div>
        )}
      </div>
    </div>
  );
}