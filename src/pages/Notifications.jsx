import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, AlertCircle, CheckCircle, Info, ChevronRight, Clock, Shield,
  Home, ShoppingBag, Gamepad2, Trophy, Users, Radio, MessageSquare,
  Layers, Swords, Rocket, Crown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import GlassPageFrame from '@/components/shared/GlassPageFrame';

const SUB_NAV = [
  { label: 'Home', icon: Home, page: 'LunaTemplate' },
  { label: 'Store', icon: ShoppingBag, page: 'Store' },
  { label: 'Library', icon: Gamepad2, page: 'Library' },
  { label: 'Achievements', icon: Trophy, page: 'Achievements' },
  { label: 'Skill Tree', icon: Layers, page: 'GenreMastery' },
  { label: 'AI Battle', icon: Swords, page: 'AIBattle' },
  { label: 'Season Pass', icon: Rocket, page: 'SeasonalPass' },
  { label: 'Leaderboard', icon: Crown, page: 'Leaderboard' },
  { label: 'Community', icon: MessageSquare, page: 'Community' },
  { label: 'Clan', icon: Users, page: 'Clan' },
  { label: 'Aura', icon: Radio, page: 'Aura' },
];

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
      style={{ backdropFilter: 'blur(12px)' }}
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
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-semibold">Required</span>
            )}
            {update.update_type === 'feature' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 font-semibold">New Feature</span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" />
      </div>
    </motion.div>
  );
}

function UpdateDetail({ update }) {
  if (!update) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <Bot className="w-12 h-12 text-white/10 mb-3" />
        <p className="text-white/25 text-sm">Select an update to view details</p>
      </div>
    );
  }

  return (
    <motion.div
      key={update.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      {update.image_url && (
        <div className="rounded-xl overflow-hidden border border-white/10">
          <img src={update.image_url} alt="" className="w-full h-40 object-cover" />
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-2">
          {update.update_type === 'required' && <AlertCircle className="w-5 h-5 text-red-400" />}
          {update.update_type === 'feature' && <CheckCircle className="w-5 h-5 text-green-400" />}
          {!['required', 'feature'].includes(update.update_type) && <Info className="w-5 h-5 text-blue-400" />}
          <h3 className="text-white font-bold text-xl">{update.title}</h3>
        </div>
        {update.version && (
          <p className="text-white/40 text-sm mb-3 font-mono">Version {update.version}</p>
        )}
        <p className="text-white/60 text-sm leading-relaxed">{update.description}</p>
      </div>

      {update.full_content && (
        <div className="p-4 rounded-xl bg-white/3 border border-white/8">
          <p className="text-white/50 text-sm whitespace-pre-wrap leading-relaxed">{update.full_content}</p>
        </div>
      )}

      <div className="flex items-center gap-3 text-white/25 text-xs">
        <Clock className="w-3.5 h-3.5" />
        <span>{update.created_date ? moment(update.created_date).format('MMMM D, YYYY') : 'Date unknown'}</span>
      </div>
    </motion.div>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const [selectedUpdate, setSelectedUpdate] = useState(null);

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['platform-updates-notifications'],
    queryFn: () => base44.entities.PlatformUpdate.filter({ published: true }),
    staleTime: 60000,
  });

  return (
    <GlassPageFrame>
      <div className="w-full h-screen flex flex-col text-white font-sans overflow-hidden">

        {/* ─── Sub-header: Title + Nav ─── */}
        <div
          className="flex-shrink-0 mt-16"
          style={{
            background: 'rgba(8, 12, 18, 0.5)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center px-6 py-2.5 gap-4">
            {/* Title */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-lg font-bold tracking-wider text-white/90">Atom X Eve Updates</span>
            </div>

            {/* Divider */}
            <div className="w-px h-7 bg-white/10 flex-shrink-0" />

            {/* Nav links */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 min-w-0">
              {SUB_NAV.map(item => (
                <button
                  key={item.label}
                  onClick={() => navigate(createPageUrl(item.page))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-white/45 hover:text-white/80 hover:bg-white/5 transition-all whitespace-nowrap flex-shrink-0"
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Update count badge */}
            <div className="flex-shrink-0">
              <span className="text-white/30 text-xs">{updates.length} update{updates.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* ─── Split Panel Body ─── */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left: Updates List */}
          <div
            className="w-1/2 border-r border-white/8 overflow-y-auto p-4 space-y-2"
            style={{ scrollbarWidth: 'none' }}
          >
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

          {/* Right: Detail Panel */}
          <div
            className="w-1/2 overflow-y-auto p-6"
            style={{ scrollbarWidth: 'none' }}
          >
            <AnimatePresence mode="wait">
              <UpdateDetail update={selectedUpdate} />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </GlassPageFrame>
  );
}