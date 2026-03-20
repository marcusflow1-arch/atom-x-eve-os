import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, Gamepad2, User, Search, Play, ChevronRight, X, Settings, Trash2, RefreshCw, Download, Package, Zap, Shield, Trophy, ExternalLink, Tv, Book, Layers, Eye, EyeOff, Swords, Sparkles, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import QuickInfoOverlay from '@/components/streaming/QuickInfoOverlay';
import { playItem } from '@/functions/playItem';
import QuickGamesDrawer from '@/components/shared/QuickGamesDrawer';
import { MessageSquare, Users as UsersIcon } from 'lucide-react';
import { libraryGames } from '../dashboard/gamehub/mockLibraryData';
import InventoryFullPanel, { InventoryItemDetailPanel } from './inventory/InventoryFullPanel';

export default function LibrarySidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSub, setActiveSub] = useState('library');
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [overlayActive, setOverlayActive] = useState(false);
  const [isExpandedLibrary, setIsExpandedLibrary] = useState(false);
  const [previewGame, setPreviewGame] = useState(null);
  const [isExpandedInventory, setIsExpandedInventory] = useState(false);
  const [inventoryDetailItem, setInventoryDetailItem] = useState(null);
  const [pendingRewardGame, setPendingRewardGame] = useState(null);
  const [showLeftNav, setShowLeftNav] = useState(true);
  const [quickGamesDrawer, setQuickGamesDrawer] = useState({ open: false, type: null });
  const [recentClanGames, setRecentClanGames] = useState([]);
  const [recentForumGames, setRecentForumGames] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadRecentGames = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('recent_clan_games') || '[]');
        setRecentClanGames(stored.map(g => ({
          id: g.id,
          name: g.title || g.name,
          image: g.cover_image || g.cover
        })));
      } catch(e) {}
    };
    loadRecentGames();
    window.addEventListener('recentClanGamesUpdated', loadRecentGames);
    return () => window.removeEventListener('recentClanGamesUpdated', loadRecentGames);
  }, []);

  useEffect(() => {
    const loadRecentForumGames = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('recent_forum_games') || '[]');
        setRecentForumGames(stored.map(g => ({
          id: g.id,
          name: g.title || g.name,
          image: g.image || g.cover_image || g.cover
        })));
      } catch(e) {}
    };
    loadRecentForumGames();
    window.addEventListener('recentForumGamesUpdated', loadRecentForumGames);
    return () => window.removeEventListener('recentForumGamesUpdated', loadRecentForumGames);
  }, []);

  useEffect(() => {
    const onOpen = () => setOverlayActive(true);
    const onClose = () => setOverlayActive(false);
    window.addEventListener('battleOverlay:open', onOpen);
    window.addEventListener('battleOverlay:close', onClose);
    return () => {
      window.removeEventListener('battleOverlay:open', onOpen);
      window.removeEventListener('battleOverlay:close', onClose);
    };
  }, []);

  // Allow mobile bottom nav to trigger sidebar open
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('openLibrarySidebar', handler);
    return () => window.removeEventListener('openLibrarySidebar', handler);
  }, []);

  // Mock Friends List
  const friendsList = [
    { id: 1, name: 'Shadow_Striker', status: 'online', game: 'Cyberpunk 2088', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
    { id: 2, name: 'CyberVixen', status: 'online', game: 'Final Fantasy XIV', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { id: 3, name: 'GhostReaper', status: 'idle', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150' },
    { id: 4, name: 'IronFist', status: 'offline', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150' },
    { id: 5, name: 'NovaStar', status: 'online', game: 'League of Legends', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' },
  ];

  // Mock Data
  const recentChannels = [
    { name: "NeonNinja", game: "Valorant", avatar: "https://source.unsplash.com/random/100x100?face,1", isLive: true, viewers: "12.5k" },
    { name: "CyberQueen", game: "Cyberpunk 2077", avatar: "https://source.unsplash.com/random/100x100?face,2", isLive: true, viewers: "8.2k" },
    { name: "TechRunner", game: "Apex Legends", avatar: "https://source.unsplash.com/random/100x100?face,3", isLive: false, viewers: "5.4k" },
  ];

  const recentGames = [
    { name: "Baldur's Gate 3", image: "https://source.unsplash.com/random/200x300?fantasy,game" },
    { name: "Starfield", image: "https://source.unsplash.com/random/200x300?space,game" },
    { name: "Elden Ring", image: "https://source.unsplash.com/random/200x300?dragon,game" },
  ];

  const recentSearches = [
    "Elden Ring Builds",
    "Starfield Reviews",
    "Valorant Crosshairs",
    "Minecraft Mods"
  ];

  const entertainmentApps = [
            { name: "YouTube", category: "Video", url: "https://www.youtube.com", image: "https://source.unsplash.com/random/200x200?youtube,logo" },
            { name: "Twitch", category: "Live", url: "https://www.twitch.tv", image: "https://source.unsplash.com/random/200x200?twitch,logo" },
            { name: "Spotify", category: "Music", url: "https://open.spotify.com", image: "https://source.unsplash.com/random/200x200?spotify,logo" },
            { name: "Netflix", category: "Video", url: "https://www.netflix.com", image: "https://source.unsplash.com/random/200x200?netflix,logo" },
            { name: "Hulu", category: "Video", url: "https://www.hulu.com", image: "https://source.unsplash.com/random/200x200?hulu,logo" },
            { name: "Disney+", category: "Video", url: "https://www.disneyplus.com", image: "https://source.unsplash.com/random/200x200?disney,logo" },
          ];

  const location = useLocation();
  const pathname = location.pathname.toLowerCase();
  const panel = new URLSearchParams(location.search).get('panel');
  const isAura = pathname.includes('/aura') || pathname.includes('/streaming');
  const isEntertainment = panel === 'entertainment' || pathname.includes('/entertainment');
  const isLibraryPage = pathname.includes('/library');
  const isClan = pathname.includes('/clan');
  const isForum = pathname.includes('/community');

  const defaultQuickNavGames = [
    { id: 'g1', name: 'Cyberpunk 2088', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&q=80' },
    { id: 'g2', name: 'Elden Ring', image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=100&q=80' },
    { id: 'g3', name: 'Valorant', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=100&q=80' }
  ];
  
  const quickNavGames = recentClanGames.length > 0 ? recentClanGames : defaultQuickNavGames;
  const quickNavForumGames = recentForumGames.length > 0 ? recentForumGames : defaultQuickNavGames;
  
  // We want the sidebar to be available on more pages now that it has the Friends List
  // Removing the strict page restrictions to allow it to be accessed generally if needed, 
  // or at least keeping it consistent. The user context implies they are on a page where this sidebar exists.
  // We'll keep existing logic but just note that if they want it "here", they are likely seeing it.
  
  const isGenreMastery = pathname.includes('/genremastery');
  
  const shouldShow = !(isEntertainment || isLibraryPage || isGenreMastery || overlayActive);

  // Close right-side overlay whenever the left pull-out tab closes
  useEffect(() => {
    if (!isOpen) {
      setOverlayOpen(false);
      setSelectedItem(null);
      setIsExpandedLibrary(false);
      setPreviewGame(null);
      setIsExpandedInventory(false);
      setInventoryDetailItem(null);
      setPendingRewardGame(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isExpandedLibrary) {
        setPreviewGame(null);
    }
  }, [isExpandedLibrary]);

  // Close all expanded panels and overlays when switching tabs
  useEffect(() => {
    setOverlayOpen(false);
    setSelectedItem(null);
    setIsExpandedLibrary(false);
    setPreviewGame(null);
    setIsExpandedInventory(false);
    setInventoryDetailItem(null);
    setPendingRewardGame(null);
  }, [activeSub]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!shouldShow) return null;

  const openOverlay = (item) => {
    setSelectedItem(item);
    setOverlayOpen(true);
  };
  const closeOverlay = () => setOverlayOpen(false);


    const handlePlay = async () => {
    if (!selectedItem) return;
    const res = await playItem({ type: selectedItem.type, title: selectedItem.title || selectedItem.name, id: selectedItem.id || null });
    const launchUrl = res?.data?.launch_url || res?.launch_url;
    if (launchUrl) window.location.assign(launchUrl);
  };
  const handleStream = () => {
    // Placeholder: could navigate to Streaming page with params
    window.dispatchEvent(new Event('openAppDrawer')); // reuse existing drawer as demo action
  };
  const handleMoreInfo = () => {
    // Placeholder for navigating to details page
  };

  return (
    <>
      {/* Trigger Buttons (Fixed on left) */}
      {!isOpen && !overlayActive && showLeftNav && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed left-6 top-1/2 -translate-y-1/2 z-[70] flex flex-col items-center gap-3"
        >
          {/* Luna Dashboard Specific Buttons */}
          {pathname.includes('/lunatemplate') && (
            <button
              onClick={() => window.dispatchEvent(new Event('toggleQuestBook'))}
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 text-white/80 backdrop-blur-lg shadow-lg hover:bg-white/10 hover:scale-105 transition-all duration-300"
              title="Toggle Quest Book"
            >
              <Book className="w-4 h-4" />
            </button>
          )}

          {/* Aura Specific Button */}
          {isAura && (
            <button
              onClick={() => window.dispatchEvent(new Event('openAuraStreamsDrawer'))}
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-purple-500/30 bg-purple-500/10 text-purple-400 backdrop-blur-lg shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:bg-purple-500/20 hover:scale-105 transition-all duration-300"
              title="Watched Streams"
            >
              <Tv className="w-4 h-4" />
            </button>
          )}

          {isClan && (
            <>
              <button
                onClick={() => navigate('/Clan?game=global_chat')}
                className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-lg hover:scale-105 transition-all duration-300 relative group flex items-center justify-center bg-black"
                title={`Atom X Eve Global Clan Chat`}
              >
                <img src="https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?w=100&q=80" alt="Atom X Eve" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-cyan-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-[8px] font-bold text-center text-cyan-400 py-0.5 uppercase tracking-widest">Main</div>
              </button>
              
              {quickNavGames.filter(g => g.id !== 'global_chat').slice(0, 5).map((game) => (
                <button
                  key={`clan_${game.id}`}
                  onClick={() => navigate(`/Clan?game=${encodeURIComponent(game.name)}`)}
                  className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-lg hover:scale-105 transition-all duration-300 relative group"
                  title={`${game.name} Clan Chat`}
                >
                  <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
              <button
                onClick={() => setQuickGamesDrawer({ open: true, type: 'clan' })}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-blue-500/30 bg-blue-500/10 text-blue-400 backdrop-blur-lg shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:bg-blue-500/20 hover:scale-105 transition-all duration-300"
                title="Clan Quick Menu"
              >
                <UsersIcon className="w-4 h-4" />
              </button>
              <div className="w-6 h-px bg-white/10 my-1" />
            </>
          )}

          {isForum && (
            <>
              {quickNavForumGames.slice(0, 2).map((game) => (
                <button
                  key={`forum_${game.id}`}
                  onClick={() => navigate(`/Community?game=${encodeURIComponent(game.name)}`)}
                  className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-lg hover:scale-105 transition-all duration-300 relative group"
                  title={`${game.name} Forum`}
                >
                  <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
              <button
                onClick={() => setQuickGamesDrawer({ open: true, type: 'forum' })}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 backdrop-blur-lg shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-emerald-500/20 hover:scale-105 transition-all duration-300"
                title="Forum Quick Menu"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <div className="w-6 h-px bg-white/10 my-1" />
            </>
          )}

          {/* Original Library Button (Always visible unless hidden by parent conditions) */}
          <button
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5 text-white/90 backdrop-blur-lg shadow-lg hover:bg-white/10 hover:scale-105 transition-all duration-300"
            title="Library & Friends"
          >
            <Library className="w-5 h-5" />
          </button>

          {/* Luna Dashboard Specific Buttons */}
          {pathname.includes('/lunatemplate') && (
            <button
              onClick={() => window.dispatchEvent(new Event('toggleCardCollection'))}
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 text-white/80 backdrop-blur-lg shadow-lg hover:bg-white/10 hover:scale-105 transition-all duration-300"
              title="Toggle Card Collection"
            >
              <Layers className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}

      {/* Show UI Button */}
      {!isOpen && !overlayActive && !showLeftNav && (
        <motion.button
          initial={{ x: -50 }}
          animate={{ x: 0 }}
          onClick={() => setShowLeftNav(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[70] w-6 h-12 rounded-r-xl flex items-center justify-center border border-l-0 border-white/10 bg-white/5 text-white/50 backdrop-blur-lg shadow-lg hover:bg-white/10 hover:text-white transition-all duration-300"
          title="Show UI"
        >
          <Eye className="w-3 h-3" />
        </motion.button>
      )}

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? "0%" : "-100%" }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 bottom-0 w-80 sm:w-96 z-[70] overflow-hidden flex flex-col"
        style={{ 
          background: 'rgba(10, 14, 20, 0.5)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(165, 243, 252, 0.08)',
          borderRight: '1px solid rgba(165, 243, 252, 0.15)'
        }}
      >
        {/* Header */}
        <div className="p-6 pt-8 border-b border-white/5 flex items-center gap-3 bg-gradient-to-r from-indigo-600/20 to-transparent relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Library className="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white tracking-wide">
                    {activeSub === 'aura' ? 'Recently Watched' : activeSub === 'entertainment' ? 'Entertainment' : activeSub === 'friends' ? 'Friends' : activeSub === 'inventory' ? 'Recent Rewards' : 'My Library'}
                </h2>
                <p className="text-xs text-white/40 font-medium">{activeSub === 'aura' ? 'Games & Streamers' : activeSub === 'entertainment' ? 'Apps & Channels' : activeSub === 'friends' ? 'Online & Offline' : activeSub === 'inventory' ? 'Recently Earned Items & Unlocks' : 'All Games & Recently Played'}</p>
            </div>
            <button 
                onClick={() => setIsOpen(false)}
                className="ml-auto w-6 h-6 flex items-center justify-center rounded-full text-white/50 hover:text-white transition-colors"
                style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
            >
                <X className="w-3 h-3" />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {/* Sub-pages (Library | Aurora) */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mb-4">
              {[
                { id: 'library', label: 'Library' },
                { id: 'aura', label: 'Aura' },
                { id: 'entertainment', label: 'Entertain' },
                { id: 'friends', label: 'Friends' },
                { id: 'inventory', label: 'Rewards' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSub(tab.id)}
                  className={`text-[10px] uppercase tracking-widest pb-1 border-b transition-colors whitespace-nowrap ${activeSub === tab.id ? 'text-white border-white/60' : 'text-white/50 border-white/10 hover:text-white/70'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {activeSub === 'friends' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Online Friends</h3>
                  <span className="ml-auto text-[10px] text-white/40">{friendsList.length} total</span>
                </div>
                <div className="space-y-3">
                  {friendsList.map(friend => (
                    <div 
                      key={friend.id} 
                      onClick={() => openOverlay({ type: 'friend', ...friend })}
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:border-blue-400/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition cursor-pointer"
                    >
                      <div className="relative">
                        <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0e14] ${
                          friend.status === 'online' ? 'bg-green-500' : 
                          friend.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{friend.name}</p>
                        <p className="text-white/50 text-xs truncate">
                          {friend.game ? <span className="text-blue-300">{friend.game}</span> : <span className="capitalize">{friend.status}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeSub === 'aura' && (
              <>
                {/* Recently Watched Games */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Gamepad2 className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Recently Watched Games</h3>
                    <span className="ml-auto text-[10px] text-white/40">{recentGames.length} items</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {recentGames.map((game, i) => (
                      <div
                        key={`rg_${i}`}
                        onClick={() => openOverlay({ type: 'game', title: game.name, image: game.image, context: 'aura' })}
                        className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-pointer hover:border-cyan-400/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition"
                      >
                        <img src={game.image} alt={game.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <h4 className="text-white font-bold text-xs leading-snug line-clamp-2">{game.name}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Recently Watched Streamers */}
                <section>
                  <div className="flex items-center gap-2 mt-6 mb-3">
                    <User className="w-4 h-4 text-pink-400" />
                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Recently Watched Streamers</h3>
                    <span className="ml-auto text-[10px] text-white/40">{recentChannels.length} channels</span>
                  </div>
                  <div className="space-y-3">
                    {recentChannels.map((ch, idx) => (
                      <div
                        key={`rc_${idx}`}
                        onClick={() => openOverlay({ type: 'stream', title: ch.name, image: ch.avatar, subtitle: ch.game })}
                        className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:border-pink-400/40 hover:shadow-[0_0_15px_rgba(244,114,182,0.2)] transition"
                      >
                        <div className="relative">
                          <img src={ch.avatar} alt={ch.name} className="w-10 h-10 rounded-lg object-cover" />
                          {ch.isLive && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{ch.name}</p>
                          <p className="text-white/50 text-xs truncate">{ch.game}</p>
                        </div>
                        <div className="text-white/60 text-xs font-mono flex items-center gap-1">
                          <span className="text-red-500">●</span>
                          {ch.viewers}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
            {activeSub === 'library' && (
              <>
                {/* Library Games Only */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Gamepad2 className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Library Games</h3>
                    <div className="ml-auto flex items-center gap-3">
                        <span className="text-[10px] text-white/40 mr-1">{libraryGames.length} total</span>
                        <div 
                          onClick={(e) => { e.stopPropagation(); setIsExpandedLibrary(!isExpandedLibrary); }}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                            <span className="text-[10px] font-medium text-cyan-400 border-b border-cyan-400/60 pb-px group-hover:border-cyan-400 transition-colors">Full Library</span>
                            <div className={`p-1 rounded hover:bg-white/10 transition-colors ${isExpandedLibrary ? 'text-cyan-400 bg-white/10' : 'text-white/40'}`}>
                                <ChevronRight className={`w-3 h-3 transition-transform duration-300 ${isExpandedLibrary ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {libraryGames.map((game, i) => (
                      <div
                        key={`lib_${game.id || 'x'}_${i}`}
                        onClick={() => openOverlay({ type: 'game', id: game.id, title: game.title || game.name, image: game.cover || game.cover_image })}
                        className="flex items-center gap-3 p-2 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 hover:border-cyan-400/30 transition group"
                      >
                        {/* Small Icon */}
                        <div className="flex-shrink-0 text-white/40 group-hover:text-cyan-400 transition-colors">
                          <Gamepad2 className="w-4 h-4" />
                        </div>

                        {/* Picture of the game */}
                        <div className="relative w-12 h-16 flex-shrink-0 rounded-md overflow-hidden bg-black/50">
                          <img src={game.cover || game.cover_image || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=800&fit=crop'} alt={game.title || game.name} className="w-full h-full object-cover" />
                        </div>

                        {/* Text to the right */}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-white font-medium text-sm truncate group-hover:text-cyan-100 transition-colors">{game.title || game.name}</h4>
                          <p className="text-white/40 text-xs truncate">Ready to play</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
            {activeSub === 'entertainment' && (
              <>
                {/* Streaming / Entertainment Apps */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Tv className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Entertainment Apps</h3>
                    <span className="ml-auto text-[10px] text-white/40">{entertainmentApps.length} apps</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {entertainmentApps.map((app, i) => (
                      <div
                        key={`ea_${i}`}
                        onClick={() => openOverlay({ type: 'app', title: app.name, url: app.url, image: app.image })}
                        className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:border-indigo-400/40 hover:bg-white/10 transition"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 border border-white/10">
                          <img src={app.image} alt={app.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="text-center">
                          <p className="text-white text-xs font-semibold truncate">{app.name}</p>
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            <Badge className="text-[8px] bg-white/5 border-white/10 text-white/40 px-1.5 py-0">{app.category}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Other Streaming Services */}
                <section className="mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ExternalLink className="w-4 h-4 text-white/40" />
                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Other Streaming Services</h3>
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
                        className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 hover:border-white/15 transition group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white/50 group-hover:text-white transition-colors flex-shrink-0">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{svc.name}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
            {activeSub === 'inventory' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Recent Rewards</h3>
                  <div className="ml-auto flex items-center gap-2">
                    <div
                      onClick={(e) => { e.stopPropagation(); setIsExpandedInventory(!isExpandedInventory); }}
                      className="flex items-center gap-1.5 cursor-pointer group"
                    >
                      <span className="text-[10px] font-medium text-amber-400 border-b border-amber-400/60 pb-px group-hover:border-amber-400 transition-colors">Full Inventory</span>
                      <div className={`p-1 rounded hover:bg-white/10 transition-colors ${isExpandedInventory ? 'text-amber-400 bg-white/10' : 'text-white/40'}`}>
                        <ChevronRight className={`w-3 h-3 transition-transform duration-300 ${isExpandedInventory ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Read-only Recent Rewards Feed */}
                <div className="space-y-2">
                  {[
                    { name: 'Neural Shock', category: 'ability', rarity: 'Legendary', game: 'Cyberpunk 2088', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10', time: '2h ago', owned: true },
                    { name: 'Void Walker Set', category: 'equipment', rarity: 'Epic', game: 'Elden Ring', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', time: '5h ago', owned: true },
                    { name: 'First Blood', category: 'achievement', rarity: 'Rare', game: 'Valorant', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', time: '1d ago', owned: true },
                    { name: 'Shadow Blade', category: 'equipment', rarity: 'Legendary', game: 'Elden Ring', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', time: '2d ago', owned: true },
                    { name: 'Phoenix Companion', category: 'companion', rarity: 'Epic', game: 'Cyberpunk 2088', icon: User, color: 'text-green-400', bg: 'bg-green-500/10', time: '3d ago', owned: true },
                  ].map((item, i) => (
                    <div
                      key={i}
                      onClick={() => { setPendingRewardGame(item.game); setIsExpandedInventory(true); }}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 hover:border-amber-400/30 transition group"
                    >
                      <div className={`w-10 h-10 rounded-lg ${item.bg} border border-white/10 flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-white font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-white/40 text-[10px] truncate">{item.rarity} • {item.game}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[9px] text-white/30">{item.time}</span>
                        <Badge className="text-[8px] bg-white/5 border-white/10 text-white/40">{item.category}</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-white/20 text-center mt-3 italic">Click any reward to see its game achievements & quick trade options</p>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20">
            <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-white/60 hover:text-white transition-all flex items-center justify-center gap-2">
                <Play className="w-3 h-3" /> {activeSub === 'aura' ? 'Open Stream History' : 'View Full History'}
            </button>
        </div>

      </motion.div>

      {/* Expanded Library Grid Panel */}
      <AnimatePresence>
        {isExpandedLibrary && isOpen && (
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`fixed top-0 bottom-0 left-80 sm:left-96 z-[68] shadow-2xl overflow-y-auto p-8 transition-all duration-300 ${previewGame ? 'right-[400px] xl:right-[500px]' : 'right-0'}`}
                style={{
                  background: 'rgba(12, 16, 24, 0.6)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  boxShadow: '0 0 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(165, 243, 252, 0.08)',
                  border: '1px solid rgba(165, 243, 252, 0.15)'
                }}
            >
                <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#0c1018]/95 backdrop-blur-xl z-10 py-4 -mt-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <Library className="w-6 h-6 text-cyan-400" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">Full Library</h2>
                            <p className="text-sm text-white/40">{libraryGames.length} titles</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsExpandedLibrary(false)}
                        className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {libraryGames.map((game, i) => (
                        <motion.div
                            key={`full_lib_${game.id || i}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => setPreviewGame(game)}
                            className={`group relative aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border cursor-pointer transition-all duration-300 ${previewGame?.id === game.id ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] ring-2 ring-cyan-400/20' : 'border-white/10 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]'}`}
                        >
                            <img 
                                src={game.cover || game.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'} 
                                alt={game.title} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                <h4 className="text-white font-bold text-sm leading-tight mb-1">{game.title || game.name}</h4>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px] px-1.5 h-5">Info</Badge>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </motion.div>
        )}
      </AnimatePresence>

      {/* Level 3: Game Preview Panel (Sibling, Fades In) */}
      <AnimatePresence>
        {previewGame && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed top-0 right-0 bottom-0 w-[400px] xl:w-[500px] z-[69] shadow-2xl flex flex-col overflow-hidden"
                style={{
                  background: 'rgba(15, 20, 26, 0.65)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  boxShadow: '-10px 0 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(165, 243, 252, 0.08)',
                  border: '1px solid rgba(165, 243, 252, 0.15)'
                }}
                style={{ boxShadow: '-10px 0 40px rgba(0,0,0,0.5)' }}
            >
                {/* Banner Header */}
                <div className="relative h-64 w-full flex-shrink-0">
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
                        <X className="w-5 h-5" />
                    </button>

                    {/* Game Box Art - Clickable for Full Page */}
                    <motion.div 
                        whileHover={{ scale: 1.05, y: -5 }}
                        onClick={() => openOverlay({ type: 'game', id: previewGame.id, title: previewGame.title || previewGame.name, image: previewGame.cover || previewGame.cover_image })}
                        className="absolute -bottom-12 left-8 w-32 aspect-[3/4] rounded-lg shadow-2xl border-2 border-white/10 overflow-hidden cursor-pointer z-10 group"
                    >
                        <img 
                            src={previewGame.cover || previewGame.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'} 
                            alt="Box Art" 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20">
                                <Search className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Content Below Banner */}
                <div className="flex-1 p-8 pt-16 flex flex-col gap-8">
                    
                    {/* Header Info */}
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2 leading-tight">{previewGame.title || previewGame.name}</h2>
                        <div className="flex items-center gap-3 text-sm text-white/50">
                            <Badge variant="outline" className="border-white/10 bg-white/5 text-white/70">RPG</Badge>
                            <span>•</span>
                            <span>Last Played: 2d ago</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 text-base">
                            <Play className="w-4 h-4 mr-2 fill-current" /> Play
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" className="h-12 w-12 border-white/10 bg-white/5 hover:bg-white/10">
                                <Settings className="w-5 h-5 text-white/70" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-12 w-12 border-white/10 bg-white/5 hover:bg-white/10 hover:text-red-400">
                                <Trash2 className="w-5 h-5 text-white/70" />
                            </Button>
                        </div>
                    </div>

                    {/* Updates Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-cyan-400" />
                                Latest Updates
                            </h3>
                            <Button variant="ghost" size="sm" className="text-xs text-cyan-400 h-auto p-0 hover:bg-transparent hover:text-cyan-300">View All</Button>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">Patch 1.2.0</Badge>
                                <span className="text-xs text-white/40">Today</span>
                            </div>
                            <h4 className="text-white font-bold text-sm mb-1">Season of the Witch</h4>
                            <p className="text-xs text-white/50 line-clamp-2">New raid content, 5 new weapons, and balance changes for all classes.</p>
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
                        <div className="space-y-2">
                            {[1, 2].map(i => (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                    <div className="w-12 h-12 bg-black/40 rounded-md overflow-hidden">
                                        <img src={`https://source.unsplash.com/random/100x100?expansion,${i}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="DLC" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-white">Expansion Pack {i}</h4>
                                        <p className="text-xs text-white/40">Installed</p>
                                    </div>
                                    <div className="pr-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Games Drawer */}
      <QuickGamesDrawer 
        isOpen={quickGamesDrawer.open} 
        onClose={() => setQuickGamesDrawer({ ...quickGamesDrawer, open: false })} 
        type={quickGamesDrawer.type} 
        games={quickGamesDrawer.type === 'forum' ? quickNavForumGames : quickNavGames} 
      />

      {/* Expanded Inventory Panel */}
      <AnimatePresence>
        {isExpandedInventory && isOpen && (
          <InventoryFullPanel
            isOpen={isExpandedInventory && isOpen}
            onClose={() => { setIsExpandedInventory(false); setInventoryDetailItem(null); setPendingRewardGame(null); }}
            initialGameName={pendingRewardGame}
          />
        )}
      </AnimatePresence>

      {/* Quick Info Overlay - Moved outside to fill the rest of the screen */}
      <QuickInfoOverlay
        open={overlayOpen}
        item={selectedItem}
        onClose={closeOverlay}
        onPlay={handlePlay}
        onStream={handleStream}
        onMoreInfo={handleMoreInfo}
      />
    </>
  );
}