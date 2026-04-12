import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Radio, Settings, Trash2, RefreshCw, Download, Search, Clock, Trophy, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import GameContentTab from './GameContentTab';
import GameCommunityTab from './GameCommunityTab';
import GameDiscussionTab from './GameDiscussionTab';
import GameStreamerAffiliateTab from './GameStreamerAffiliateTab';
import GameSupportTab from './GameSupportTab';
import GameChatTab from './GameChatTab';

export default function LibraryGameOverlay({ game, onClose, onPlay, onStream }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!game) return null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'content', label: 'Content' },
    { id: 'community', label: 'Community' },
    { id: 'discussion', label: 'Discussion' },
    { id: 'chat', label: 'Game Chat' },
    { id: 'streamers', label: 'Streamer Affiliate' },
    { id: 'support', label: 'Support' },
  ];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 250 }}
      className="fixed top-0 right-0 bottom-0 w-[90%] z-[55] flex flex-col overflow-hidden"
      style={{
        background: 'rgba(10, 14, 20, 0.85)',
        backdropFilter: 'blur(50px) saturate(180%)',
        WebkitBackdropFilter: 'blur(50px) saturate(180%)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(165, 243, 252, 0.08)',
        borderLeft: '1px solid rgba(165, 243, 252, 0.12)',
      }}
    >
      {/* Banner Header */}
      <div className="relative h-72 w-full flex-shrink-0">
        <img
          src={game.banner_image || game.banner || game.cover_image || game.cover || 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80'}
          alt={game.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-[#0a0e14]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-3 rounded-full bg-black/40 hover:bg-white/10 text-white/60 hover:text-white transition-colors backdrop-blur-md border border-white/10 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Game Box Art */}
        <div className="absolute -bottom-14 left-10 w-36 aspect-[3/4] rounded-xl shadow-2xl border-2 border-white/10 overflow-hidden z-10">
          <img
            src={game.cover_image || game.cover || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'}
            alt={game.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title & Actions over banner */}
        <div className="absolute bottom-6 left-56 right-8 flex items-end justify-between">
          <div>
            <Badge className="mb-2 bg-white/10 text-white border-white/20 backdrop-blur-md text-xs">{game.genre}</Badge>
            <h1 className="text-4xl font-black text-white drop-shadow-lg tracking-tight">{game.title}</h1>
            <div className="flex items-center gap-6 text-sm text-white/50 mt-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>12.5h played</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>8/15 achievements</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => onPlay?.(game)} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 px-8 text-base">
              <Play className="w-5 h-5 mr-2 fill-current" /> Play
            </Button>
            <Button variant="outline" onClick={() => onStream?.(game)} className="h-12 px-6 border-white/10 bg-white/5 hover:bg-white/10 text-white">
              <Radio className="w-5 h-5 mr-2" /> Stream
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12 border-white/10 bg-white/5 hover:bg-white/10">
              <Settings className="w-5 h-5 text-white/70" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-10 pt-20 pb-0 flex-shrink-0">
        <div className="flex items-center gap-8 border-b border-white/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
                activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="overlayTabLine"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-10 py-8" style={{ scrollbarWidth: 'none' }}>
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Updates Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  Latest Updates
                </h3>
                <Button variant="ghost" size="sm" className="text-xs text-cyan-400 h-auto p-0 hover:bg-transparent hover:text-cyan-300">View All</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[
                  { title: 'Season of the Witch', badge: 'Patch 1.2.0', desc: 'New raid content, 5 new weapons, and balance changes.', time: 'Today', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                  { title: 'Void Walker Event', badge: 'Live Event', desc: 'Limited time double XP and exclusive void skins.', time: '3 days ago', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                  { title: 'Hotfix 1.1.5', badge: 'Hotfix', desc: 'Fixed crash on startup for certain GPU configurations.', time: '1 week ago', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
                ].map((note, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-3">
                      <Badge className={`text-[10px] ${note.color}`}>{note.badge}</Badge>
                      <span className="text-xs text-white/40">{note.time}</span>
                    </div>
                    <h4 className="text-white font-bold text-sm mb-1 group-hover:text-cyan-300 transition-colors">{note.title}</h4>
                    <p className="text-xs text-white/50 line-clamp-2">{note.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* DLC Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-purple-400" />
                  DLC & Add-ons
                </h3>
                <Button variant="ghost" size="sm" className="text-xs text-purple-400 h-auto p-0 hover:bg-transparent hover:text-purple-300">Store</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: 'Neural Expansion Pack', installed: true },
                  { name: 'Void Walker Arsenal', installed: true },
                  { name: 'Season Pass: Year One', installed: false },
                  { name: 'Cosmetic Bundle: Neon City', installed: false },
                ].map((dlc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-pointer">
                    <div className="w-14 h-14 bg-black/40 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={`https://images.unsplash.com/photo-${1550745165 + i}-9bc0b252726f?w=120&q=80`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="DLC" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{dlc.name}</h4>
                      <p className="text-xs text-white/40">{dlc.installed ? 'Installed' : 'Available'}</p>
                    </div>
                    <div className="pr-2">
                      <div className={`w-2 h-2 rounded-full ${dlc.installed ? 'bg-emerald-500' : 'bg-white/20'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* About */}
            <div className="p-5 rounded-xl bg-white/5 border border-white/5">
              <h3 className="text-white/60 font-bold text-sm mb-2 uppercase tracking-wider">About This Game</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                {game.description || 'An epic adventure awaits in this groundbreaking title that redefines the genre. Explore vast worlds, defeat challenging enemies, and forge your own destiny.'}
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'content' && <GameContentTab game={game} />}
        {activeTab === 'community' && <GameCommunityTab game={game} />}
        {activeTab === 'discussion' && <GameDiscussionTab game={game} />}
        {activeTab === 'chat' && <GameChatTab game={game} />}
        {activeTab === 'streamers' && <GameStreamerAffiliateTab game={game} />}
        {activeTab === 'support' && <GameSupportTab game={game} />}
      </div>
    </motion.div>
  );
}