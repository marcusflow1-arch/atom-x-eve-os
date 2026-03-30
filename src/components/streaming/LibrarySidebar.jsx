import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, Gamepad2, User, Search, Play, ChevronRight, ChevronLeft, X, Settings, Trash2, RefreshCw, Download, Package, Zap, Shield, Trophy, ExternalLink, Tv, Book, Layers, Eye, EyeOff, Swords, Sparkles, Crown, Wheat } from 'lucide-react';
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
  const [recentFarmGames, setRecentFarmGames] = useState([]);
  const [sidebarMode, setSidebarMode] = useState('context');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const navigate = useNavigate();

  useEffect(() => {
    const handleToggle = (e) => setIsSidebarCollapsed(e.detail);
    window.addEventListener('sidebarCollapseChange', handleToggle);
    return () => window.removeEventListener('sidebarCollapseChange', handleToggle);
  }, []);

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
    const loadRecentFarmGames = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('recent_farm_games') || '[]');
        setRecentFarmGames(stored.map(g => ({
          id: g.id,
          name: g.title || g.name,
          image: g.image || g.cover_image || g.cover
        })));
      } catch(e) {}
    };
    loadRecentFarmGames();
    window.addEventListener('recentFarmGamesUpdated', loadRecentFarmGames);
    return () => window.removeEventListener('recentFarmGamesUpdated', loadRecentFarmGames);
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
  const isFarm = pathname.includes('/farm');

  const defaultQuickNavGames = [
    { id: 'g1', name: 'Cyberpunk 2088', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&q=80' },
    { id: 'g2', name: 'Elden Ring', image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=100&q=80' },
    { id: 'g3', name: 'Valorant', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=100&q=80' }
  ];
  
  const quickNavGames = recentClanGames.length > 0 ? recentClanGames : defaultQuickNavGames;
  const quickNavForumGames = recentForumGames.length > 0 ? recentForumGames : defaultQuickNavGames;
  const quickNavFarmGames = recentFarmGames.length > 0 ? recentFarmGames : defaultQuickNavGames;
  
  // We want the sidebar to be available on more pages now that it has the Friends List
  // Removing the strict page restrictions to allow it to be accessed generally if needed, 
  // or at least keeping it consistent. The user context implies they are on a page where this sidebar exists.
  // We'll keep existing logic but just note that if they want it "here", they are likely seeing it.
  
  const isGenreMastery = pathname.includes('/genremastery');
  
  const shouldShow = !(isEntertainment || isLibraryPage || overlayActive);

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
        <>
          {/* Top Section for Clan/Forum/Cards/Farm: Boxes only */}
          {(isClan || isForum || isGenreMastery || isFarm) && !isSidebarCollapsed && (
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute left-6 z-[70] flex flex-col items-center gap-3 w-10 transition-all duration-500 top-[136px] opacity-100"
            >
              <button 
                onClick={() => setSidebarMode(m => m === 'context' ? 'recent' : 'context')}
                className="text-[10px] uppercase tracking-wider text-white/50 hover:text-white font-bold text-center transition-colors leading-tight -ml-2 w-14"
              >
                 {sidebarMode === 'context' ? (
                   isClan ? <>Recently<br/>Visited</> : 
                   isForum ? <>Recent<br/>Forums</> : 
                   isFarm ? <>Recent<br/>Farm Hub</> :
                   <>Recent<br/>Cards</>
                 ) : <>Recently<br/>Played</>}
              </button>
              <div className="w-8 h-px bg-white/20 -mt-1" />

              {/* The 5 boxes */}
              {sidebarMode === 'context' ? (
                <>
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
                    </>
                  )}

                  {isForum && (
                    <>
                      {quickNavForumGames.slice(0, 5).map((game) => (
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
                    </>
                  )}

                  {isFarm && (
                    <>
                      {quickNavFarmGames.slice(0, 5).map((game) => (
                        <button
                          key={`farm_${game.id}`}
                          onClick={() => navigate(`/Farm?gameId=${game.id}`)}
                          className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-lg hover:scale-105 transition-all duration-300 relative group"
                          title={`${game.name} Farm`}
                        >
                          <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </>
                  )}

                  {isGenreMastery && (
                    <>
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={`card-${i}`} className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                          <span className="text-white/30 text-lg font-bold">C</span>
                        </div>
                      ))}
                    </>
                  )}
                </>
              ) : (
                <>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={`played-${i}`} className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                      <span className="text-white/30 text-lg font-bold">?</span>
                    </div>
                  ))}
                </>
              )}
            </motion.div>
          )}

          {/* Center Group: Navigation Buttons (ALWAYS CENTERED FOR ALL PAGES) */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`absolute left-6 top-1/2 -translate-y-1/2 z-[70] flex flex-col items-center gap-3 w-10 transition-opacity duration-500 ${isSidebarCollapsed ? 'opacity-90' : 'opacity-100'}`}
          >
            {/* Top Slot Customizable Button (Luna only) */}
            {pathname.includes('/lunatemplate') && (
              <div className="relative group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 text-white/80 backdrop-blur-lg shadow-lg hover:bg-white/10 hover:scale-105 transition-all duration-300 relative z-20 cursor-pointer" title="Customize Top Widget">
                  <Book className="w-4 h-4" />
                </div>
                <div className="absolute left-10 top-0 ml-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto z-10">
                  <button onClick={() => window.dispatchEvent(new CustomEvent('setSlot1Content', {detail: 'questBook'}))} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-cyan-500/20 border border-white/20 flex items-center justify-center backdrop-blur-lg shadow-lg hover:scale-110 transition-transform" title="Quest Book"><Book className="w-4 h-4 text-white" /></button>
                  <button onClick={() => window.dispatchEvent(new CustomEvent('setSlot1Content', {detail: 'friendsList'}))} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-blue-500/20 border border-white/20 flex items-center justify-center backdrop-blur-lg shadow-lg hover:scale-110 transition-transform" title="Friends List"><UsersIcon className="w-4 h-4 text-blue-400" /></button>
                  <button onClick={() => window.dispatchEvent(new CustomEvent('setSlot1Content', {detail: 'recentGames'}))} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-green-500/20 border border-white/20 flex items-center justify-center backdrop-blur-lg shadow-lg hover:scale-110 transition-transform" title="Recent Games"><Gamepad2 className="w-4 h-4 text-green-400" /></button>
                  <button onClick={() => window.dispatchEvent(new CustomEvent('setSlot1Content', {detail: 'none'}))} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/20 flex items-center justify-center backdrop-blur-lg shadow-lg hover:scale-110 transition-transform text-lg font-bold text-white/50" title="Remove Widget">?</button>
                </div>
              </div>
            )}

            {/* Quick menu buttons for Clan/Forum/Farm */}
            {isClan && !isSidebarCollapsed && (
              <button
                onClick={() => setQuickGamesDrawer({ open: true, type: 'clan' })}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-blue-500/30 bg-blue-500/10 text-blue-400 backdrop-blur-lg shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:bg-blue-500/20 hover:scale-105 transition-all duration-300"
                title="Clan Quick Menu"
              >
                <UsersIcon className="w-4 h-4" />
              </button>
            )}

            {isForum && !isSidebarCollapsed && (
              <button
                onClick={() => setQuickGamesDrawer({ open: true, type: 'forum' })}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 backdrop-blur-lg shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-emerald-500/20 hover:scale-105 transition-all duration-300"
                title="Forum Quick Menu"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}

            {isFarm && !isSidebarCollapsed && (
              <button
                onClick={() => setQuickGamesDrawer({ open: true, type: 'farm' })}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 backdrop-blur-lg shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:bg-yellow-500/20 hover:scale-105 transition-all duration-300"
                title="Quick Farming Hub"
              >
                <Wheat className="w-4 h-4" />
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

            {/* Original Library Button with Restore Arrow */}
            <div className="relative flex items-center">
              <button
                onClick={() => setIsOpen(true)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5 text-white/90 backdrop-blur-lg shadow-lg hover:bg-white/10 hover:scale-105 transition-all duration-300 -ml-1"
                title="Library & Friends"
              >
                <Library className="w-5 h-5" />
              </button>
              
              {/* RESTORE ARROW */}
              {isSidebarCollapsed && (
                <button
                  onClick={() => {
                      localStorage.setItem('sidebarCollapsed', 'false');
                      window.dispatchEvent(new CustomEvent('sidebarCollapseChange', { detail: false }));
                  }}
                  className="absolute left-[44px] top-1/2 -translate-y-1/2 w-6 h-10 bg-black/60 border border-white/20 border-l-0 rounded-r-xl flex items-center justify-center hover:bg-white/10 hover:text-white text-white/50 transition-colors backdrop-blur-md shadow-lg"
                  title="Restore Sidebar"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Roster Button for Clan */}
            {isClan && !isSidebarCollapsed && (
              <button
                onClick={() => window.dispatchEvent(new Event('toggleClanRoster'))}
                className="w-12 h-12 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all bg-black/50 hover:bg-white/10 text-white/60 border-white/10 hover:border-yellow-400/50 hover:shadow-[0_0_10px_rgba(250,204,21,0.2)] -ml-1 mt-1 group"
                title="Roster"
              >
                <UsersIcon className="w-4 h-4 group-hover:text-yellow-400 transition-colors" />
                <span className="text-[7px] font-bold uppercase tracking-wider mt-0.5 group-hover:text-yellow-400 transition-colors">Roster</span>
              </button>
            )}

            {/* Bottom Slot Customizable Button (Luna only) */}
            <div className="w-8 h-px bg-white/10 my-1" />
            {pathname.includes('/lunatemplate') && (
              <div className="relative group mt-1 mb-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 text-white/80 backdrop-blur-lg shadow-lg hover:bg-white/10 hover:scale-105 transition-all duration-300 relative z-20 cursor-pointer" title="Customize Bottom Widget">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="absolute left-10 top-0 ml-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto z-10">
                  <button onClick={() => window.dispatchEvent(new CustomEvent('setSlot2Content', {detail: 'cardCollection'}))} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-cyan-500/20 border border-white/20 flex items-center justify-center backdrop-blur-lg shadow-lg hover:scale-110 transition-transform" title="Card Collection"><Layers className="w-4 h-4 text-white" /></button>
                  <button onClick={() => window.dispatchEvent(new CustomEvent('setSlot2Content', {detail: 'friendsList'}))} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-blue-500/20 border border-white/20 flex items-center justify-center backdrop-blur-lg shadow-lg hover:scale-110 transition-transform" title="Friends List"><UsersIcon className="w-4 h-4 text-blue-400" /></button>
                  <button onClick={() => window.dispatchEvent(new CustomEvent('setSlot2Content', {detail: 'recentGames'}))} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-green-500/20 border border-white/20 flex items-center justify-center backdrop-blur-lg shadow-lg hover:scale-110 transition-transform" title="Recent Games"><Gamepad2 className="w-4 h-4 text-green-400" /></button>
                  <button onClick={() => window.dispatchEvent(new CustomEvent('setSlot2Content', {detail: 'none'}))} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/20 flex items-center justify-center backdrop-blur-lg shadow-lg hover:scale-110 transition-transform text-lg font-bold text-white/50" title="Remove Widget">?</button>
                </div>
              </div>
            )}

            <div className="w-8 h-px bg-white/10 my-1" />
            <button
              onClick={() => { setIsOpen(true); setActiveSub('friends'); }}
              className="w-10 h-10 rounded-xl flex flex-col items-center justify-center border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/40 hover:bg-white/10 backdrop-blur-lg shadow-lg transition-all hover:scale-105"
            >
              <span className="text-sm font-bold opacity-50">?</span>
            </button>
            <button
              onClick={() => { setIsOpen(true); setActiveSub('library'); }}
              className="w-10 h-10 rounded-xl flex flex-col items-center justify-center border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/40 hover:bg-white/10 backdrop-blur-lg shadow-lg transition-all hover:scale-105 mt-1"
            >
              <span className="text-sm font-bold opacity-50">?</span>
            </button>
          </motion.div>
        </>
      )}

      {/* Show UI Button */}
      {!isOpen && !overlayActive && !showLeftNav && (
        <motion.button
          initial={{ x: -50 }}
          animate={{ x: 0 }}
          onClick={() => setShowLeftNav(true)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-[70] w-6 h-12 rounded-r-xl flex items-center justify-center border border-l-0 border-white/10 bg-white/5 text-white/50 backdrop-blur-lg shadow-lg hover:bg-white/10 hover:text-white transition-all duration-300"
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[65]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? "0%" : "-100%" }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`absolute top-0 left-0 bottom-0 z-[70] overflow-hidden flex flex-col transition-[width] duration-300 ${
          (activeSub === 'friends' || activeSub === 'library') 
            ? 'w-[480px] sm:w-[576px]' 
            : 'w-80 sm:w-96'
        }`}
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
            {activeSub === 'friends' && null}
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
            {activeSub === 'library' && null}
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
                className={`absolute top-0 bottom-0 left-80 sm:left-96 z-[68] shadow-2xl overflow-y-auto p-8 transition-all duration-300 ${previewGame ? 'right-[400px] xl:right-[500px]' : 'right-0'}`}
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
                className="absolute top-0 right-0 bottom-0 w-[400px] xl:w-[500px] z-[69] shadow-2xl flex flex-col overflow-hidden"
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
        games={quickGamesDrawer.type === 'forum' ? quickNavForumGames : quickGamesDrawer.type === 'farm' ? quickNavFarmGames : quickNavGames} 
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