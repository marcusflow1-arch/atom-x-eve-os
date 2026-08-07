import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Library as LibraryIcon, Trophy, Tv, Play, X, ChevronRight,
  Search, Trash2, RefreshCw, Download, Package, Zap, Shield, User,
  ExternalLink, Maximize2, Minimize2, ArrowLeftRight, UserCircle, UserPlus,
  LogIn, Plus, PanelLeftClose, Eye, EyeOff,
} from 'lucide-react';
import Mini3DViewerBox from '@/components/dashboard/Mini3DViewerBox';
import { libraryGames } from '@/components/dashboard/gamehub/mockLibraryData';
import { useSidebarVisible } from '@/hooks/useSidebarVisible';
import FriendProfileOverlay from '@/components/streaming/FriendProfileOverlay';
import FriendMessenger from '@/components/streaming/FriendMessenger';
import FriendTradePanel from '@/components/streaming/FriendTradePanel';
import InventoryFullPanel from '@/components/streaming/inventory/InventoryFullPanel';
import LibraryAchievementsUniverse from '@/components/streaming/LibraryAchievementsUniverse';
import LibraryGameDetailModal from '@/components/streaming/LibraryGameDetailModal';
import QuickGamesDrawer from '@/components/shared/QuickGamesDrawer';

// Master left sidebar — the single Luna-Dashboard-style sidebar used on every page.
// Frame is identical everywhere: profile card (3D avatar + stats) → "Recently [X]" list →
// middle section (divider / slotTop / Play button / slotBottom / divider) → four bottom
// panel boxes (Friends / Library / Rewards / Entertainment). Only the list heading/contents
// and the two middle slots change per page (passed as props). The Play button always sits
// between the two slots. Folds in all the bottom-panel overlays (friends, library, rewards,
// entertainment) so nothing is lost.

const FRIENDS = [
  { id: 1, name: 'Shadow_Striker', status: 'online', game: 'Cyberpunk 2088', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
  { id: 2, name: 'CyberVixen', status: 'online', game: 'Final Fantasy XIV', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { id: 3, name: 'GhostReaper', status: 'idle', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150' },
  { id: 4, name: 'IronFist', status: 'offline', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150' },
  { id: 5, name: 'NovaStar', status: 'online', game: 'League of Legends', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' },
  { id: 6, name: 'VoidKnight', status: 'online', game: 'Elden Ring', avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150' },
];

const ENTERTAINMENT_APPS = [
  { name: 'YouTube', category: 'Video', url: 'https://www.youtube.com', image: 'https://source.unsplash.com/random/200x200?youtube,logo' },
  { name: 'Twitch', category: 'Live', url: 'https://www.twitch.tv', image: 'https://source.unsplash.com/random/200x200?twitch,logo' },
  { name: 'Spotify', category: 'Music', url: 'https://open.spotify.com', image: 'https://source.unsplash.com/random/200x200?spotify,logo' },
  { name: 'Netflix', category: 'Video', url: 'https://www.netflix.com', image: 'https://source.unsplash.com/random/200x200?netflix,logo' },
  { name: 'Hulu', category: 'Video', url: 'https://www.hulu.com', image: 'https://source.unsplash.com/random/200x200?hulu,logo' },
  { name: 'Disney+', category: 'Video', url: 'https://www.disneyplus.com', image: 'https://source.unsplash.com/random/200x200?disney,logo' },
];

const PANELS = [
  { key: 'friends', label: 'Friends', Icon: Users, active: 'border-green-400/50 bg-green-500/20 text-green-400', idle: 'border-white/10 bg-white/5 text-white/60 hover:text-green-400 hover:border-green-400/40 hover:bg-green-500/10' },
  { key: 'library', label: 'Library', Icon: LibraryIcon, active: 'border-cyan-400/50 bg-cyan-500/20 text-cyan-400', idle: 'border-white/10 bg-white/5 text-white/60 hover:text-cyan-400 hover:border-cyan-400/40 hover:bg-cyan-500/10' },
  { key: 'rewards', label: 'Rewards', Icon: Trophy, active: 'border-amber-400/50 bg-amber-500/20 text-amber-400', idle: 'border-white/10 bg-white/5 text-white/60 hover:text-amber-400 hover:border-amber-400/40 hover:bg-amber-500/10' },
  { key: 'entertainment', label: 'Entertain', Icon: Tv, active: 'border-indigo-400/50 bg-indigo-500/20 text-indigo-400', idle: 'border-white/10 bg-white/5 text-white/60 hover:text-indigo-400 hover:border-indigo-400/40 hover:bg-indigo-500/10' },
];

const SIDEBAR_WIDTH = 330;

export default function MasterSidebar({
  pageKey = 'global',
  recentLabel = 'Recently Played',
  recentContent = null,
  slotTop = null,   // node for the upper middle box (e.g. "?" placeholder or Clan Menu)
  slotBottom = null, // node for the lower middle box (e.g. "?" placeholder or Roster)
  onLaunch = null,  // Play button handler (launch 3D environment)
  quickMenuType = null, // 'clan' | 'forum' | 'farm' | null — drives QuickGamesDrawer
}) {
  const [visible, toggle] = useSidebarVisible();
  const navigate = useNavigate();

  const [expandedPanel, setExpandedPanel] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [viewingFriend, setViewingFriend] = useState(null);
  const [messagingFriend, setMessagingFriend] = useState(null);
  const [tradingFriend, setTradingFriend] = useState(null);
  const [detailGame, setDetailGame] = useState(null);
  const [fullLibraryOpen, setFullLibraryOpen] = useState(false);
  const [fullLibraryDetailGame, setFullLibraryDetailGame] = useState(null);
  const [showAchievementsUniverse, setShowAchievementsUniverse] = useState(false);
  const [isExpandedRewardsInventory, setIsExpandedRewardsInventory] = useState(false);
  const [pendingRewardGame, setPendingRewardGame] = useState(null);
  const [selectedEntertainmentApp, setSelectedEntertainmentApp] = useState(null);
  const [entertainmentFullscreen, setEntertainmentFullscreen] = useState(false);
  const [customLinks, setCustomLinks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('custom_streaming_links') || '[]'); } catch { return []; }
  });
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [quickDrawer, setQuickDrawer] = useState({ open: false, type: null });
  const [quickNavGames, setQuickNavGames] = useState([]);

  useEffect(() => {
    const key = quickMenuType === 'forum' ? 'recent_forum_games'
      : quickMenuType === 'farm' ? 'recent_farm_games'
      : quickMenuType === 'clan' ? 'recent_clan_games' : null;
    if (!key) return;
    const load = () => {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '[]');
        setQuickNavGames(stored.map(g => ({ id: g.id, name: g.title || g.name, image: g.image || g.cover_image || g.cover })));
      } catch {}
    };
    load();
    const evt = quickMenuType === 'forum' ? 'recentForumGamesUpdated'
      : quickMenuType === 'farm' ? 'recentFarmGamesUpdated'
      : 'recentClanGamesUpdated';
    window.addEventListener(evt, load);
    return () => window.removeEventListener(evt, load);
  }, [quickMenuType]);

  // Close overlay panels when the sidebar is hidden
  useEffect(() => {
    if (!visible) {
      setExpandedPanel(null);
      setOpenDropdown(null);
      setViewingFriend(null);
      setMessagingFriend(null);
      setTradingFriend(null);
      setDetailGame(null);
      setFullLibraryOpen(false);
      setShowAchievementsUniverse(false);
      setIsExpandedRewardsInventory(false);
      setSelectedEntertainmentApp(null);
      setEntertainmentFullscreen(false);
    }
  }, [visible]);

  const handlePanel = (key) => {
    setExpandedPanel(p => (p === key ? null : key));
    setOpenDropdown(null);
    setShowAchievementsUniverse(false);
    setIsExpandedRewardsInventory(false);
    setSelectedEntertainmentApp(null);
    setTradingFriend(null);
    setViewingFriend(null);
    setMessagingFriend(null);
    setDetailGame(null);
    setFullLibraryDetailGame(null);
  };

  const launchEnv = () => {
    if (onLaunch) onLaunch();
    else window.dispatchEvent(new CustomEvent('launchEnvironment', { detail: { pageKey } }));
  };

  // ---- HIDDEN: thin show-tab on the left edge ----
  if (!visible) {
    return (
      <button
        onClick={toggle}
        title="Show sidebar"
        className="fixed left-0 top-1/2 -translate-y-1/2 z-[70] w-6 h-16 rounded-r-xl flex items-center justify-center border border-l-0 border-white/10 bg-white/5 text-white/50 backdrop-blur-md shadow-lg hover:bg-white/10 hover:text-white transition-all"
      >
        <Eye className="w-3 h-3" />
      </button>
    );
  }

  // ---- VISIBLE: in-flow column, identical frame on every page ----
  return (
    <>
      <aside
        className="flex-shrink-0 h-full flex flex-col relative z-30 overflow-hidden"
        style={{
          width: `${SIDEBAR_WIDTH}px`,
          background: 'rgba(8, 12, 18, 0.42)',
          backdropFilter: 'blur(30px) saturate(150%)',
          WebkitBackdropFilter: 'blur(30px) saturate(150%)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.4), inset 1px 0 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* TOP — profile card (3D avatar + stats). Identical on every page. */}
        <div className="flex-shrink-0 px-3 pt-3 pb-2">
          <Mini3DViewerBox isUiVisible={false} />
        </div>

        {/* RECENT LIST — heading + contents swap per page. */}
        <div className="px-3 pt-1 pb-2 flex-shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">
            {recentLabel}
          </span>
          <div className="w-8 h-px bg-white/20 mt-1" />
        </div>
        <div className="flex-1 min-h-0 px-3 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {recentContent || (
            <div className="flex flex-col gap-2 py-1">
              {libraryGames.slice(0, 6).map((g, i) => (
                <button
                  key={g.id || i}
                  onClick={() => setDetailGame(g)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-9 h-12 rounded flex-shrink-0 overflow-hidden bg-black/40">
                    <img src={g.cover || g.cover_image} alt={g.title || g.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-white/70 text-[11px] font-medium truncate flex-1">{g.title || g.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MIDDLE SECTION — divider / slotTop / Play / slotBottom / divider. */}
        <div className="w-full flex items-center gap-2 px-3 py-1 shrink-0">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)' }} />
          <span className="w-1.5 h-1.5 rotate-45 bg-white/40" style={{ boxShadow: '0 0 6px rgba(255,255,255,0.5)' }} />
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)' }} />
        </div>

        <div className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2">
          <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
            {slotTop || <span className="text-white/30 text-lg font-bold">?</span>}
          </div>

          {/* Play button — standalone, always between the two slots. */}
          <button
            onClick={launchEnv}
            title="Launch 3D Environment"
            className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-white transition-all duration-300 hover:scale-105 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              boxShadow: '0 6px 22px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            <Play className="w-4 h-4 fill-white" />
            <span className="text-[7px] font-bold uppercase tracking-wider">Play</span>
          </button>

          <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
            {slotBottom || <span className="text-white/30 text-lg font-bold">?</span>}
          </div>
        </div>

        <div className="w-full flex items-center gap-2 px-3 py-1 shrink-0">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)' }} />
          <span className="w-1.5 h-1.5 rotate-45 bg-white/40" style={{ boxShadow: '0 0 6px rgba(255,255,255,0.5)' }} />
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)' }} />
        </div>

        {/* BOTTOM — four panel boxes (identical on every page). */}
        <div className="flex-shrink-0 grid grid-cols-2 gap-2 p-3">
          {PANELS.map(p => {
            const isActive = expandedPanel === p.key;
            return (
              <button
                key={p.key}
                onClick={() => handlePanel(p.key)}
                className={`h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 border backdrop-blur-lg shadow-lg transition-all hover:scale-105 ${isActive ? p.active : p.idle}`}
                title={p.label}
              >
                <p.Icon className="w-4 h-4" />
                <span className="text-[7px] font-bold uppercase tracking-wider">{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Toggle — bottom-right corner of the sidebar. */}
        <button
          onClick={toggle}
          title="Hide sidebar"
          className="absolute bottom-2 right-2 w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all z-10"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </aside>

      {/* ===== Expanded panel overlay (Friends / Library / Rewards / Entertainment) ===== */}
      <AnimatePresence>
        {expandedPanel && (
          <motion.div
            key="expanded-panel"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed z-[69] flex flex-col overflow-hidden"
            style={{
              left: `${SIDEBAR_WIDTH}px`,
              top: '64px',
              bottom: '48px',
              width: '240px',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(50px) saturate(200%)',
              WebkitBackdropFilter: 'blur(50px) saturate(200%)',
              boxShadow: '0 4px 30px rgba(0,0,0,0.2)',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                {expandedPanel === 'friends' ? 'Friends' : expandedPanel === 'rewards' ? 'Rewards' : expandedPanel === 'entertainment' ? 'Entertainment' : 'My Library'}
              </span>
              {expandedPanel === 'library' && (
                <button
                  onClick={() => setFullLibraryOpen(v => !v)}
                  className={`text-[10px] font-medium border-b pb-px transition-colors ${fullLibraryOpen ? 'text-purple-400 border-purple-400' : 'text-cyan-400 border-cyan-400/60 hover:border-cyan-400'}`}
                >
                  Full Library
                </button>
              )}
              <button onClick={() => setExpandedPanel(null)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'none' }}>
              {/* FRIENDS */}
              {expandedPanel === 'friends' && FRIENDS.map(friend => (
                <div key={friend.id} className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === friend.id ? null : friend.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="relative flex-shrink-0">
                      <img src={friend.avatar} alt={friend.name} className="w-8 h-8 rounded-full object-cover" />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#08120a] ${friend.status === 'online' ? 'bg-green-500' : friend.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{friend.name}</p>
                      <p className="text-white/40 text-[10px] truncate">{friend.game ? friend.game : friend.status}</p>
                    </div>
                    <ChevronRight className={`w-3 h-3 text-white/30 transition-transform flex-shrink-0 ${openDropdown === friend.id ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openDropdown === friend.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden bg-white/5 border-t border-b border-white/5">
                        {[
                          { label: 'Profile', Icon: UserCircle, color: 'text-blue-400', action: () => { setTradingFriend(null); setMessagingFriend(null); setViewingFriend(friend); setOpenDropdown(null); } },
                          { label: 'Trade', Icon: ArrowLeftRight, color: 'text-emerald-400', action: () => { setViewingFriend(null); setMessagingFriend(null); setTradingFriend(friend); setOpenDropdown(null); } },
                          { label: 'Invite', Icon: UserPlus, color: 'text-yellow-400' },
                          { label: 'Join', Icon: LogIn, color: 'text-purple-400' },
                        ].map(a => (
                          <button key={a.label} onClick={a.action} className="w-full flex items-center gap-3 px-6 py-2 hover:bg-white/5 transition-colors">
                            <a.Icon className={`w-3.5 h-3.5 ${a.color}`} />
                            <span className="text-white/70 text-xs">{a.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* LIBRARY */}
              {expandedPanel === 'library' && libraryGames.map((game, i) => (
                <div key={game.id || i} className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === (game.id || i) ? null : (game.id || i))}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-8 h-10 rounded flex-shrink-0 overflow-hidden bg-black/40">
                      <img src={game.cover || game.cover_image || ''} alt={game.title || game.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{game.title || game.name}</p>
                      <p className="text-white/40 text-[10px]">Ready to play</p>
                    </div>
                    <ChevronRight className={`w-3 h-3 text-white/30 transition-transform flex-shrink-0 ${openDropdown === (game.id || i) ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openDropdown === (game.id || i) && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden bg-white/5 border-t border-b border-white/5">
                        {[
                          { label: 'Details', Icon: Search, color: 'text-blue-400', action: () => { setShowAchievementsUniverse(false); setDetailGame(cur => cur?.id === game.id ? null : game); setOpenDropdown(null); } },
                          { label: 'Achievements', Icon: Trophy, color: 'text-yellow-400', action: () => { setDetailGame(null); setShowAchievementsUniverse(cur => !cur); setOpenDropdown(null); } },
                          { label: 'Remove', Icon: Trash2, color: 'text-red-400' },
                        ].map(a => (
                          <button key={a.label} onClick={a.action} className="w-full flex items-center gap-3 px-6 py-2 hover:bg-white/5 transition-colors">
                            <a.Icon className={`w-3.5 h-3.5 ${a.color}`} />
                            <span className="text-white/70 text-xs">{a.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* REWARDS */}
              {expandedPanel === 'rewards' && [
                { name: 'Neural Shock', rarity: 'Legendary', game: 'Cyberpunk 2088', Icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10', time: '2h ago' },
                { name: 'Void Walker Set', rarity: 'Epic', game: 'Elden Ring', Icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', time: '5h ago' },
                { name: 'First Blood', rarity: 'Rare', game: 'Valorant', Icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', time: '1d ago' },
                { name: 'Shadow Blade', rarity: 'Legendary', game: 'Elden Ring', Icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', time: '2d ago' },
              ].map((item, i) => (
                <button key={i} onClick={() => { setPendingRewardGame(item.game); setIsExpandedRewardsInventory(true); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-lg transition-colors text-left">
                  <div className={`w-8 h-8 rounded-lg ${item.bg} border border-white/10 flex items-center justify-center flex-shrink-0`}>
                    <item.Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{item.name}</p>
                    <p className="text-white/40 text-[10px] truncate">{item.rarity} • {item.game}</p>
                  </div>
                  <span className="text-[9px] text-white/30 flex-shrink-0">{item.time}</span>
                </button>
              ))}

              {/* ENTERTAINMENT */}
              {expandedPanel === 'entertainment' && (
                <>
                  <div className="px-4 py-2">
                    <p className="text-[9px] text-indigo-400/70 font-bold uppercase tracking-widest mb-2">Entertainment Apps</p>
                    {ENTERTAINMENT_APPS.map((app, i) => (
                      <button key={i} onClick={() => setSelectedEntertainmentApp(app)} className="w-full flex items-center gap-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                        <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 overflow-hidden flex-shrink-0">
                          <img src={app.image} alt={app.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{app.name}</p>
                          <p className="text-white/40 text-[10px]">{app.category}</p>
                        </div>
                        <ChevronRight className="w-3 h-3 text-white/30 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                  <div className="w-full h-px bg-white/5 my-1" />
                  <div className="px-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest flex-1">Other Services</p>
                      <button onClick={() => setShowAddLink(v => !v)} className="w-5 h-5 rounded-full bg-white/10 hover:bg-indigo-500/30 flex items-center justify-center text-white/60 hover:text-indigo-300 transition-colors" title="Add link">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {showAddLink && (
                      <div className="mb-3 space-y-1.5">
                        <input value={newLinkName} onChange={e => setNewLinkName(e.target.value)} placeholder="Name" className="w-full bg-white/10 text-white text-xs rounded-lg px-3 py-1.5 outline-none border border-white/10 placeholder-white/30" />
                        <input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="https://..." className="w-full bg-white/10 text-white text-xs rounded-lg px-3 py-1.5 outline-none border border-white/10 placeholder-white/30" />
                        <button onClick={() => { if (newLinkName && newLinkUrl) { const updated = [...customLinks, { name: newLinkName, url: newLinkUrl, category: 'Custom' }]; setCustomLinks(updated); localStorage.setItem('custom_streaming_links', JSON.stringify(updated)); setNewLinkName(''); setNewLinkUrl(''); setShowAddLink(false); } }} className="w-full py-1.5 rounded-lg bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-300 text-xs font-semibold transition-colors">Add</button>
                      </div>
                    )}
                    {[...customLinks, { name: 'Anime Kai', url: 'https://animekai.to', category: 'Anime' }, { name: 'Watch Cartoons Online', url: 'https://www.wcostream.tv', category: 'Cartoons' }].map((svc, i) => (
                      <button key={i} onClick={() => setSelectedEntertainmentApp(svc)} className="w-full flex items-center gap-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                        <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                          <ExternalLink className="w-3.5 h-3.5 text-white/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{svc.name}</p>
                          <p className="text-white/40 text-[10px] truncate">{svc.category}</p>
                        </div>
                        <ChevronRight className="w-3 h-3 text-white/30 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Library grid panel */}
      <AnimatePresence>
        {expandedPanel === 'library' && fullLibraryOpen && (
          <motion.div key="full-library" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed z-[68] flex flex-col overflow-hidden" style={{ left: `${SIDEBAR_WIDTH + 240}px`, top: '64px', bottom: '48px', right: '0px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)', boxShadow: '0 4px 30px rgba(0,0,0,0.2)' }}>
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b border-white/5">
              <div className="flex items-center gap-2">
                <LibraryIcon className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/70">Full Library</span>
                <span className="text-[10px] text-white/30">({libraryGames.length})</span>
              </div>
              <button onClick={() => { setFullLibraryOpen(false); setFullLibraryDetailGame(null); }} className="text-white/40 hover:text-white transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'none' }}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                {libraryGames.map((game, i) => (
                  <button key={game.id || i} onClick={() => setFullLibraryDetailGame(fullLibraryDetailGame?.id === game.id ? null : game)} className={`group relative aspect-[3/4] rounded-xl overflow-hidden border transition-all ${fullLibraryDetailGame?.id === game.id ? 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] ring-2 ring-purple-400/30' : 'border-white/10 hover:border-purple-400/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]'}`}>
                    <img src={game.cover || game.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80'} alt={game.title || game.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white font-bold text-[10px] leading-tight text-center line-clamp-2 drop-shadow-lg">{game.title || game.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friend / Trade / Messenger / Detail / Inventory / Achievements sub-overlays */}
      {viewingFriend && <FriendProfileOverlay friend={viewingFriend} onClose={() => setViewingFriend(null)} />}
      {tradingFriend && <FriendTradePanel friend={tradingFriend} onClose={() => setTradingFriend(null)} />}
      <AnimatePresence>
        {messagingFriend && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="fixed z-[70] flex flex-col overflow-hidden" style={{ left: `${SIDEBAR_WIDTH + 240}px`, right: '0px', top: '64px', bottom: '48px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)', boxShadow: '-6px 0 30px rgba(0,0,0,0.2)', borderLeft: '1px solid rgba(165, 243, 252, 0.15)' }}>
            <FriendMessenger friend={{ friend_id: messagingFriend.id, friend_name: messagingFriend.name, friend_avatar: messagingFriend.avatar, status: messagingFriend.status, current_game: messagingFriend.game }} onClose={() => setMessagingFriend(null)} />
          </motion.div>
        )}
      </AnimatePresence>
      {detailGame && <LibraryGameDetailModal game={detailGame} onClose={() => setDetailGame(null)} />}
      <AnimatePresence>
        {expandedPanel === 'library' && showAchievementsUniverse && <LibraryAchievementsUniverse onClose={() => setShowAchievementsUniverse(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {isExpandedRewardsInventory && expandedPanel === 'rewards' && (
          <InventoryFullPanel isOpen onClose={() => { setIsExpandedRewardsInventory(false); setPendingRewardGame(null); }} initialGameName={pendingRewardGame} leftOffset={`${SIDEBAR_WIDTH + 240}px`} />
        )}
      </AnimatePresence>

      {/* Entertainment app fullscreen */}
      <AnimatePresence>
        {entertainmentFullscreen && selectedEntertainmentApp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-x-0 bottom-0 z-[200] flex flex-col" style={{ top: '64px', background: 'rgba(8, 10, 18, 0.97)', backdropFilter: 'blur(40px)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Tv className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-bold text-white">{selectedEntertainmentApp.name}</span>
              </div>
              <button onClick={() => setEntertainmentFullscreen(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"><Minimize2 className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-8 p-12">
              <div className="w-48 h-48 rounded-3xl overflow-hidden border-2 border-indigo-500/30 shadow-2xl">
                <img src={selectedEntertainmentApp.image} alt={selectedEntertainmentApp.name} className="w-full h-full object-cover" />
              </div>
              <a href={selectedEntertainmentApp.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-12 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-lg transition-colors shadow-2xl shadow-indigo-500/30">
                <ExternalLink className="w-6 h-6" /> Open {selectedEntertainmentApp.name}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedEntertainmentApp && !entertainmentFullscreen && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }} className="fixed z-[70] flex flex-col overflow-hidden" style={{ left: `${SIDEBAR_WIDTH + 240}px`, top: '64px', bottom: '48px', right: '0px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)', borderLeft: '1px solid rgba(99, 102, 241, 0.2)', boxShadow: '4px 0 30px rgba(0,0,0,0.2)' }}>
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white/70 uppercase tracking-widest truncate">{selectedEntertainmentApp.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setEntertainmentFullscreen(true)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors" title="Fullscreen"><Maximize2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => setSelectedEntertainmentApp(null)} className="text-white/40 hover:text-white transition-colors"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
              {selectedEntertainmentApp.image ? (
                <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
                  <img src={selectedEntertainmentApp.image} alt={selectedEntertainmentApp.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"><ExternalLink className="w-12 h-12 text-white/20" /></div>
              )}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-1">{selectedEntertainmentApp.name}</h2>
                <p className="text-sm text-white/40">{selectedEntertainmentApp.category || 'Streaming'}</p>
                <p className="text-xs text-indigo-400/70 mt-1 truncate max-w-xs mx-auto">{selectedEntertainmentApp.url}</p>
              </div>
              <a href={selectedEntertainmentApp.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm transition-colors shadow-lg shadow-indigo-500/30">
                <ExternalLink className="w-4 h-4" /> Open {selectedEntertainmentApp.name}
              </a>
              <button onClick={() => setEntertainmentFullscreen(true)} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-xs font-medium transition-colors">
                <Maximize2 className="w-3.5 h-3.5" /> Expand View
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Games Drawer (Clan / Forum / Farm quick menus) */}
      <QuickGamesDrawer
        isOpen={quickDrawer.open}
        onClose={() => setQuickDrawer({ open: false, type: null })}
        type={quickDrawer.type}
        games={quickNavGames}
      />
    </>
  );
}