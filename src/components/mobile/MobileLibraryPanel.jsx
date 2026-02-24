import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Library, Gamepad2, User, Search, Play, ChevronRight, X, Settings,
  Trash2, RefreshCw, Download, Package, Zap, Shield, Trophy, ExternalLink, Tv
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { libraryGames } from '@/components/dashboard/gamehub/mockLibraryData';
import QuickInfoOverlay from '@/components/streaming/QuickInfoOverlay';
import InventoryFullPanel from '@/components/streaming/inventory/InventoryFullPanel';

const friendsList = [
  { id: 1, name: 'Shadow_Striker', status: 'online', game: 'Cyberpunk 2088', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
  { id: 2, name: 'CyberVixen', status: 'online', game: 'Final Fantasy XIV', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { id: 3, name: 'GhostReaper', status: 'idle', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150' },
  { id: 4, name: 'IronFist', status: 'offline', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150' },
  { id: 5, name: 'NovaStar', status: 'online', game: 'League of Legends', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' },
];

const recentChannels = [
  { name: "NeonNinja", game: "Valorant", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100", isLive: true, viewers: "12.5k" },
  { name: "CyberQueen", game: "Cyberpunk 2077", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100", isLive: true, viewers: "8.2k" },
  { name: "TechRunner", game: "Apex Legends", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100", isLive: false, viewers: "5.4k" },
];

const recentGames = [
  { name: "Baldur's Gate 3", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=300&fit=crop" },
  { name: "Starfield", image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=200&h=300&fit=crop" },
  { name: "Elden Ring", image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200&h=300&fit=crop" },
];

const entertainmentApps = [
  { name: "YouTube", category: "Video", url: "https://www.youtube.com", image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=200" },
  { name: "Twitch", category: "Live", url: "https://www.twitch.tv", image: "https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?w=200" },
  { name: "Spotify", category: "Music", url: "https://open.spotify.com", image: "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=200" },
  { name: "Netflix", category: "Video", url: "https://www.netflix.com", image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=200" },
  { name: "Hulu", category: "Video", url: "https://www.hulu.com", image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=200" },
  { name: "Disney+", category: "Video", url: "https://www.disneyplus.com", image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=200" },
];

const REWARD_ITEMS = [
  { name: 'Neural Shock', category: 'ability', rarity: 'Legendary', game: 'Cyberpunk 2088', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10', time: '2h ago' },
  { name: 'Void Walker Set', category: 'equipment', rarity: 'Epic', game: 'Elden Ring', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', time: '5h ago' },
  { name: 'First Blood', category: 'achievement', rarity: 'Rare', game: 'Valorant', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', time: '1d ago' },
  { name: 'Shadow Blade', category: 'equipment', rarity: 'Legendary', game: 'Elden Ring', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', time: '2d ago' },
  { name: 'Phoenix Companion', category: 'companion', rarity: 'Epic', game: 'Cyberpunk 2088', icon: User, color: 'text-green-400', bg: 'bg-green-500/10', time: '3d ago' },
];

const TABS = [
  { id: 'library', label: 'Library' },
  { id: 'aura', label: 'Aura' },
  { id: 'entertainment', label: 'Entertain' },
  { id: 'friends', label: 'Friends' },
  { id: 'inventory', label: 'Rewards' },
];

export default function MobileLibraryPanel({ isOpen, onClose }) {
  const [activeSub, setActiveSub] = useState('library');

  // Library sub-panels
  const [isExpandedLibrary, setIsExpandedLibrary] = useState(false);
  const [previewGame, setPreviewGame] = useState(null);

  // Inventory sub-panels
  const [isExpandedInventory, setIsExpandedInventory] = useState(false);
  const [pendingRewardGame, setPendingRewardGame] = useState(null);

  // Quick Info Overlay (friends, aura, entertainment items)
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Reset everything when closed
  useEffect(() => {
    if (!isOpen) {
      setActiveSub('library');
      setIsExpandedLibrary(false);
      setPreviewGame(null);
      setIsExpandedInventory(false);
      setPendingRewardGame(null);
      setOverlayOpen(false);
      setSelectedItem(null);
    }
  }, [isOpen]);

  // Reset sub-panels when switching tabs
  useEffect(() => {
    setIsExpandedLibrary(false);
    setPreviewGame(null);
    setIsExpandedInventory(false);
    setPendingRewardGame(null);
    setOverlayOpen(false);
    setSelectedItem(null);
  }, [activeSub]);

  useEffect(() => {
    if (!isExpandedLibrary) setPreviewGame(null);
  }, [isExpandedLibrary]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const openOverlay = (item) => { setSelectedItem(item); setOverlayOpen(true); };

  const headerTitle = {
    library: 'My Library',
    aura: 'Recently Watched',
    entertainment: 'Entertainment',
    friends: 'Friends',
    inventory: 'Recent Rewards',
  }[activeSub];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[98]"
          />

          {/* Main Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 bottom-0 z-[99] flex flex-col overflow-hidden"
            style={{
              width: '85vw',
              maxWidth: '360px',
              background: 'rgba(10, 14, 20, 0.96)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderRight: '1px solid rgba(165, 243, 252, 0.15)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div className="p-4 pt-6 border-b border-white/5 flex items-center gap-3 bg-gradient-to-r from-indigo-600/20 to-transparent">
              <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Library className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-white tracking-wide truncate">{headerTitle}</h2>
                <p className="text-[10px] text-white/40">
                  {activeSub === 'aura' ? 'Games & Streamers' : activeSub === 'entertainment' ? 'Apps & Channels' : activeSub === 'friends' ? 'Online & Offline' : activeSub === 'inventory' ? 'Recently Earned' : 'All Games & Recently Played'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-white transition-colors flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSub(tab.id)}
                  className={`text-[10px] uppercase tracking-widest pb-1 border-b transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeSub === tab.id ? 'text-white border-white/60' : 'text-white/40 border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* ── LIBRARY ── */}
              {activeSub === 'library' && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Gamepad2 className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Library Games</h3>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[10px] text-white/30">{libraryGames.length} total</span>
                      <button
                        onClick={() => setIsExpandedLibrary(true)}
                        className="text-[10px] font-medium text-cyan-400 border-b border-cyan-400/60 flex items-center gap-1"
                      >
                        Full Library <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {libraryGames.map((game, i) => (
                      <div
                        key={`lib_${game.id || i}`}
                        onClick={() => openOverlay({ type: 'game', id: game.id, title: game.title || game.name, image: game.cover || game.cover_image })}
                        className="flex items-center gap-3 p-2 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 hover:border-cyan-400/30 transition group"
                      >
                        <Gamepad2 className="w-4 h-4 text-white/30 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                        <div className="relative w-10 h-14 flex-shrink-0 rounded-md overflow-hidden bg-black/50">
                          <img src={game.cover || game.cover_image || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&fit=crop'} alt={game.title || game.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-white font-medium text-sm truncate group-hover:text-cyan-100 transition-colors">{game.title || game.name}</h4>
                          <p className="text-white/30 text-xs">Ready to play</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── AURA ── */}
              {activeSub === 'aura' && (
                <>
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <Gamepad2 className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Recently Watched Games</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {recentGames.map((game, i) => (
                        <div
                          key={`rg_${i}`}
                          onClick={() => openOverlay({ type: 'game', title: game.name, image: game.image, context: 'aura' })}
                          className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-pointer hover:border-cyan-400/40 transition"
                        >
                          <img src={game.image} alt={game.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-1.5">
                            <h4 className="text-white font-bold text-[9px] leading-snug line-clamp-2">{game.name}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-pink-400" />
                      <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Recently Watched Streamers</h3>
                    </div>
                    <div className="space-y-2">
                      {recentChannels.map((ch, idx) => (
                        <div
                          key={`rc_${idx}`}
                          onClick={() => openOverlay({ type: 'stream', title: ch.name, image: ch.avatar, subtitle: ch.game })}
                          className="flex items-center gap-3 p-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-pink-400/40 transition cursor-pointer"
                        >
                          <div className="relative">
                            <img src={ch.avatar} alt={ch.name} className="w-9 h-9 rounded-lg object-cover" />
                            {ch.isLive && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{ch.name}</p>
                            <p className="text-white/40 text-xs truncate">{ch.game}</p>
                          </div>
                          <div className="text-white/50 text-xs font-mono flex items-center gap-1">
                            <span className="text-red-500">●</span>{ch.viewers}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* ── ENTERTAINMENT ── */}
              {activeSub === 'entertainment' && (
                <>
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <Tv className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Entertainment Apps</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {entertainmentApps.map((app, i) => (
                        <div
                          key={`ea_${i}`}
                          onClick={() => openOverlay({ type: 'app', title: app.name, url: app.url, image: app.image })}
                          className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:border-indigo-400/40 hover:bg-white/10 transition"
                        >
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/40 border border-white/10">
                            <img src={app.image} alt={app.name} className="w-full h-full object-cover" />
                          </div>
                          <p className="text-white text-[10px] font-semibold truncate w-full text-center">{app.name}</p>
                          <Badge className="text-[8px] bg-white/5 border-white/10 text-white/40 px-1 py-0">{app.category}</Badge>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ExternalLink className="w-4 h-4 text-white/40" />
                      <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Other Streaming Services</h3>
                    </div>
                    <div className="space-y-2">
                      {[
                        { name: 'Anime Kai', url: 'https://animekai.to', category: 'Anime' },
                        { name: 'Watch Cartoons Online', url: 'https://www.wcostream.tv', category: 'Cartoons' },
                        { name: 'Watch 32', url: 'https://www.watch32.is', category: 'Movies' },
                      ].map((svc, i) => (
                        <div
                          key={`svc_${i}`}
                          onClick={() => openOverlay({ type: 'app', title: svc.name, url: svc.url })}
                          className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 hover:border-white/15 transition group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white/50 flex-shrink-0">
                            <ExternalLink className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{svc.name}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* ── FRIENDS ── */}
              {activeSub === 'friends' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Online Friends</h3>
                    <span className="ml-auto text-[10px] text-white/30">{friendsList.length} total</span>
                  </div>
                  {friendsList.map(friend => (
                    <div
                      key={friend.id}
                      onClick={() => openOverlay({ type: 'friend', ...friend })}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-blue-400/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition cursor-pointer"
                    >
                      <div className="relative">
                        <img src={friend.avatar} alt={friend.name} className="w-9 h-9 rounded-lg object-cover" />
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0e14] ${
                          friend.status === 'online' ? 'bg-green-500' :
                          friend.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{friend.name}</p>
                        <p className="text-white/40 text-xs truncate">
                          {friend.game ? <span className="text-blue-300">{friend.game}</span> : <span className="capitalize">{friend.status}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── INVENTORY / REWARDS ── */}
              {activeSub === 'inventory' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-amber-400" />
                    <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Recent Rewards</h3>
                    <button
                      onClick={() => setIsExpandedInventory(true)}
                      className="ml-auto text-[10px] font-medium text-amber-400 border-b border-amber-400/60 flex items-center gap-1"
                    >
                      Full Inventory <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  {REWARD_ITEMS.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => { setPendingRewardGame(item.game); setIsExpandedInventory(true); }}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 hover:border-amber-400/30 transition group"
                    >
                      <div className={`w-9 h-9 rounded-lg ${item.bg} border border-white/10 flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-white font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-white/30 text-[10px] truncate">{item.rarity} • {item.game}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[9px] text-white/25">{item.time}</span>
                        <Badge className="text-[8px] bg-white/5 border-white/10 text-white/40">{item.category}</Badge>
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-white/20 text-center pt-1 italic">Click any reward to see its full inventory</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/5 bg-black/20">
              <button className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-white/50 hover:text-white transition-all flex items-center justify-center gap-2">
                <Play className="w-3 h-3" />
                {activeSub === 'aura' ? 'Open Stream History' : 'View Full History'}
              </button>
            </div>
          </motion.div>

          {/* ── FULL LIBRARY GRID (slides in over main panel) ── */}
          <AnimatePresence>
            {isExpandedLibrary && (
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed top-0 left-0 bottom-0 z-[100] flex flex-col overflow-hidden"
                style={{
                  width: '100vw',
                  background: 'rgba(12, 16, 24, 0.97)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  borderRight: '1px solid rgba(165, 243, 252, 0.15)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0c1018]/95 sticky top-0 z-10">
                  <Library className="w-5 h-5 text-cyan-400" />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-white">Full Library</h2>
                    <p className="text-[10px] text-white/40">{libraryGames.length} titles</p>
                  </div>
                  <button
                    onClick={() => setIsExpandedLibrary(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-3 gap-2">
                    {libraryGames.map((game, i) => (
                      <motion.div
                        key={`full_lib_${game.id || i}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => setPreviewGame(game)}
                        className={`group relative aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border cursor-pointer transition-all duration-300 ${
                          previewGame?.id === game.id
                            ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                            : 'border-white/10 hover:border-cyan-400/50'
                        }`}
                      >
                        <img
                          src={game.cover || game.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'}
                          alt={game.title || game.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <h4 className="text-white font-bold text-[10px] leading-tight mb-1">{game.title || game.name}</h4>
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[8px] px-1 h-4">Info</Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── GAME PREVIEW PANEL (slides in when a game is selected in Full Library) ── */}
          <AnimatePresence>
            {previewGame && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed inset-0 z-[101] flex flex-col overflow-hidden"
                style={{
                  background: 'rgba(15, 20, 26, 0.97)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                }}
              >
                {/* Banner */}
                <div className="relative h-52 w-full flex-shrink-0">
                  <img
                    src={previewGame.banner || previewGame.cover_image || 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80'}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#0f141a]" />
                  <button
                    onClick={() => setPreviewGame(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-white/10 text-white/60 hover:text-white transition-colors backdrop-blur-md border border-white/5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {/* Box Art */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    onClick={() => openOverlay({ type: 'game', id: previewGame.id, title: previewGame.title || previewGame.name, image: previewGame.cover || previewGame.cover_image })}
                    className="absolute -bottom-10 left-5 w-20 aspect-[3/4] rounded-lg shadow-2xl border-2 border-white/10 overflow-hidden cursor-pointer z-10"
                  >
                    <img
                      src={previewGame.cover || previewGame.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'}
                      alt="Box Art"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 pt-14 pb-6 space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1 leading-tight">{previewGame.title || previewGame.name}</h2>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Badge variant="outline" className="border-white/10 bg-white/5 text-white/70">RPG</Badge>
                      <span>•</span>
                      <span>Last Played: 2d ago</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-11 text-sm">
                      <Play className="w-4 h-4 mr-2 fill-current" /> Play
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="h-11 w-11 border-white/10 bg-white/5 hover:bg-white/10">
                        <Settings className="w-4 h-4 text-white/70" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-11 w-11 border-white/10 bg-white/5 hover:bg-white/10 hover:text-red-400">
                        <Trash2 className="w-4 h-4 text-white/70" />
                      </Button>
                    </div>
                  </div>

                  {/* Latest Updates */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Latest Updates
                      </h3>
                      <Button variant="ghost" size="sm" className="text-[10px] text-cyan-400 h-auto p-0 hover:bg-transparent">View All</Button>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 cursor-pointer hover:border-white/20 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">Patch 1.2.0</Badge>
                        <span className="text-xs text-white/40">Today</span>
                      </div>
                      <h4 className="text-white font-bold text-xs mb-1">Season of the Witch</h4>
                      <p className="text-[10px] text-white/50 line-clamp-2">New raid content, 5 new weapons, and balance changes for all classes.</p>
                    </div>
                  </div>

                  {/* DLC */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Download className="w-3.5 h-3.5 text-purple-400" /> DLC & Add-ons
                      </h3>
                      <Button variant="ghost" size="sm" className="text-[10px] text-purple-400 h-auto p-0 hover:bg-transparent">Store</Button>
                    </div>
                    <div className="space-y-2">
                      {[1, 2].map(idx => (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                          <div className="w-10 h-10 bg-black/40 rounded-md overflow-hidden">
                            <img src={`https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&q=80`} className="w-full h-full object-cover opacity-60" alt="DLC" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-medium text-white">Expansion Pack {idx}</h4>
                            <p className="text-[10px] text-white/40">Installed</p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mr-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── FULL INVENTORY PANEL ── */}
          <InventoryFullPanel
            isOpen={isExpandedInventory}
            onClose={() => { setIsExpandedInventory(false); setPendingRewardGame(null); }}
            initialGameName={pendingRewardGame}
            fullScreen={true}
          />

          {/* ── QUICK INFO OVERLAY (friends, aura games/streamers, entertainment apps, library games) ── */}
          <QuickInfoOverlay
            open={overlayOpen}
            item={selectedItem}
            onClose={() => setOverlayOpen(false)}
            onPlay={() => {}}
            onStream={() => {}}
            onMoreInfo={() => {}}
            fullScreen={true}
          />
        </>
      )}
    </AnimatePresence>
  );
}