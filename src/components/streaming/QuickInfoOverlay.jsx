import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Radio, Info, ShoppingBag, LifeBuoy, MessageSquare, Trophy, Newspaper, ChevronLeft, ChevronRight, Settings, User, ExternalLink, Gamepad2, Heart, Check, Twitter, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { addDays, format, isToday, startOfWeek } from 'date-fns';
import SponsorsSection from '@/components/streaming/profile/SponsorsSection';
import DLCList, { DLC_DATA } from '@/components/game/DLCList';
import { useCart } from '@/components/CartContext';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ShinyCard from '@/components/shared/ShinyCard';
import CreatePostForm from '@/components/community/CreatePostForm';
import MysteryCardDetail from '@/components/streaming/MysteryCardDetail';
import StreamerProfilePanel from '@/components/streaming/profile/StreamerProfilePanel';
import FriendsListContent from '../dashboard/FriendsListContent';

export default function QuickInfoOverlay({ open, item, onClose, onPlay, onStream, onMoreInfo }) {
  const [activeTab, setActiveTab] = React.useState('content');
  const [selectedDLC, setSelectedDLC] = React.useState(null);
  const [posts, setPosts] = React.useState([]);
  const [replyToId, setReplyToId] = React.useState(null);
  const [replyText, setReplyText] = React.useState('');
  const [achievements, setAchievements] = React.useState([]);
  const [showCreatePost, setShowCreatePost] = React.useState(false);
  const [selectedMysteryCard, setSelectedMysteryCard] = React.useState(null);
  const [expandedQuestId, setExpandedQuestId] = React.useState(null);
  const [achievementSubTab, setAchievementSubTab] = React.useState('ability');
  const [achievementFilter, setAchievementFilter] = React.useState('all');
  const [expandedDlcId, setExpandedDlcId] = React.useState(null);
  const { addToCart } = useCart();

  const [selectedCommunityMedia, setSelectedCommunityMedia] = React.useState(null);

  const COMMUNITY_SKIRMISH = [
    { id: 1, type: 'image', url: 'https://source.unsplash.com/random/800x450?funny,gaming,1', title: 'Glitch in the matrix lol', user: 'BugHunter' },
    { id: 2, type: 'image', url: 'https://source.unsplash.com/random/800x450?meme,gaming,2', title: 'When the boss sees you', user: 'MemeLord' },
    { id: 3, type: 'image', url: 'https://source.unsplash.com/random/800x450?cat,gaming,3', title: 'My co-op partner', user: 'CatGamer' },
    { id: 4, type: 'video', url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', title: 'Physics gone wrong', user: 'PhysicsFail' },
  ];

  const GAME_REMOTE = [
    { id: 5, type: 'video', url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', title: 'Insane 1v3 Clutch!', user: 'ProPlayer99', views: '12k' },
    { id: 6, type: 'video', url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', title: 'No scope across map', user: 'SniperElite', views: '8.5k' },
    { id: 7, type: 'image', url: 'https://source.unsplash.com/random/800x450?epic,gaming,4', title: 'Perfect timing screenshot', user: 'ArtisticSoul', views: '5k' },
    { id: 8, type: 'video', url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', title: 'Speedrun Record', user: 'SpeedDemon', views: '22k' },
  ];
  const navigate = useNavigate();

  // Aura streaming subpage view state
  const [activeStreamerIndex, setActiveStreamerIndex] = React.useState(0);
  const [streamers, setStreamers] = React.useState([]);
  const [activeStreamerTab, setActiveStreamerTab] = React.useState(null);
  const [scheduleBaseDate, setScheduleBaseDate] = React.useState(new Date());
  
  const startDate = React.useMemo(() => startOfWeek(scheduleBaseDate, { weekStartsOn: 1 }), [scheduleBaseDate]);
  const scheduleDays = React.useMemo(() => Array.from({ length: 14 }).map((_, i) => addDays(startDate, i)), [startDate]);
  const endDate = scheduleDays[13];
  const dateRangeString = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;

  const [chatMessages] = React.useState([
    { user: 'System', text: 'Welcome to the live chat.' },
    { user: 'Mod', text: 'Be respectful and have fun!' }
  ]);
  const isAuraStreamingView = item?.context === 'aura' && item?.type === 'game';
  const isStreamerProfileView = item?.type === 'stream';
  const isAppView = item?.type === 'app';
  const appUrlMap = { twitch: 'https://www.twitch.tv', spotify: 'https://open.spotify.com', youtube: 'https://www.youtube.com', netflix: 'https://www.netflix.com', hulu: 'https://www.hulu.com', 'disney+': 'https://www.disneyplus.com' };
  const resolvedAppUrl = (item?.url && typeof item.url === 'string') ? item.url : appUrlMap[(item?.title || '').toLowerCase()];
  const itemKey = item?.id || item?.title || 'unknown';

  // Helpers: record recents and navigate to Aura profile
  const recordRecentStreamer = async (s) => {
    if (!s || !s.name) return;
    const entry = { id: s.id || s.name, name: s.name, avatar: s.avatar || null, updated_at: new Date().toISOString() };
    const authed = await base44.auth.isAuthenticated();
    if (authed) {
      const me = await base44.auth.me();
      const prev = (me.recent_streamers || []).filter((e) => e.id !== entry.id);
      const updated = [entry, ...prev].slice(0, 15);
      await base44.auth.updateMe({ recent_streamers: updated });
    } else {
      const prev = JSON.parse(localStorage.getItem('recent_streamers') || '[]').filter((e) => e.id !== entry.id);
      const updated = [entry, ...prev].slice(0, 15);
      localStorage.setItem('recent_streamers', JSON.stringify(updated));
    }
  };

  const recordRecentGame = async (title) => {
    if (!title) return;
    const entry = { id: title, title, updated_at: new Date().toISOString() };
    const authed = await base44.auth.isAuthenticated();
    if (authed) {
      const me = await base44.auth.me();
      const prev = (me.recent_games || []).filter((e) => e.id !== entry.id);
      const updated = [entry, ...prev].slice(0, 20);
      await base44.auth.updateMe({ recent_games: updated });
    } else {
      const prev = JSON.parse(localStorage.getItem('recent_games') || '[]').filter((e) => e.id !== entry.id);
      const updated = [entry, ...prev].slice(0, 20);
      localStorage.setItem('recent_games', JSON.stringify(updated));
    }
  };

  const openStreamerProfile = async (name) => {
    if (!name) return;
    await recordRecentStreamer({ name, id: name });
    navigate(createPageUrl('StreamingHome') + `?streamer=${encodeURIComponent(name)}`);
  };

  React.useEffect(() => {
    if (!open || !isAuraStreamingView) return;
    // Mock streamers for this game
    const mocks = [
      { id: 's1', name: 'NeonNinja', avatar: 'https://source.unsplash.com/random/80x80?face,streamer1', video: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', schedule: ['Mon 7pm', 'Wed 9pm'], is_live: true, viewers: '12.4k' },
      { id: 's2', name: 'CyberQueen', avatar: 'https://source.unsplash.com/random/80x80?face,streamer2', video: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', schedule: ['Tue 6pm', 'Thu 8pm'], is_live: true, viewers: '8.2k' },
      { id: 's3', name: 'TechRunner', avatar: 'https://source.unsplash.com/random/80x80?face,streamer3', video: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', schedule: ['Fri 5pm', 'Sun 3pm'], is_live: true, viewers: '5.9k' }
    ];
    setStreamers(mocks);
    setActiveStreamerIndex(0);
    if (item?.title) { recordRecentGame(item.title); }
  }, [open, isAuraStreamingView, item?.title]);

  const getDlcPrice = (dlc) => {
    if (!dlc) return 0;
    if (dlc.id === 'dlc_1') return 14.99;
    if (dlc.id === 'dlc_2') return 9.99;
    if (dlc.id === 'dlc_3') return 29.99;
    return 0;
  };

  React.useEffect(() => {
    if (!open || !item?.title) return;
    (async () => {
      const res = await base44.entities.Post.filter({ type: 'game_discussion', game_title: item.title }, '-created_date', 5);
      setPosts(res?.data || res || []);
    })();
  }, [open, item?.title]);

        React.useEffect(() => {
          if (!open || !item?.title) return;
          (async () => {
            const res = await base44.entities.Achievement.filter({ game: item.title }, '-rarity', 8);
            setAchievements(res?.data || res || []);
          })();
        }, [open, item?.title]);

  // Track recently viewed streamer when opening a streamer profile view
  React.useEffect(() => {
    if (!open) return;
    if (isStreamerProfileView && (item?.title)) {
      recordRecentStreamer({ id: item?.id || item?.title, name: item?.title, avatar: item?.image });
    }
  }, [open, isStreamerProfileView, item?.title]);

  const handleAddToCart = () => {
    if (!selectedDLC) return;
    const price = getDlcPrice(selectedDLC);
    addToCart({ id: `${item?.id || item?.title}-${selectedDLC.id}`.replace(/\s+/g, '_'), type: 'dlc', title: `${item?.title || 'Game'} - ${selectedDLC.name}`, price });
  };

  const handleReplySubmit = async (postId) => {
    if (!replyText.trim()) return;
    await base44.entities.Comment.create({ target_id: postId, target_type: 'post', content: replyText.trim() });
    setReplyText('');
    setReplyToId(null);
    const res = await base44.entities.Post.filter({ type: 'game_discussion', game_title: item.title }, '-created_date', 5);
    setPosts(res?.data || res || []);
  };

  const handleCreatePost = async (data) => {
    await base44.entities.Post.create(data);
    setShowCreatePost(false);
    const res = await base44.entities.Post.filter({ type: 'game_discussion', game_title: item.title }, '-created_date', 5);
    setPosts(res?.data || res || []);
  };

  React.useEffect(() => {
    if (open) {
      setActiveTab('content');
      setSelectedMysteryCard(null); // Reset mystery card selection on open
    }
  }, [open]);
  
  if (!open) return null;

  // Render Friend Profile View if item type is friend
  if (item?.type === 'friend') {
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-0 bottom-0 right-0 left-[320px] sm:left-[384px] z-[80]"
              onClick={onClose}
              style={{ background: 'rgba(0,0,0,0.5)' }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 left-[320px] sm:left-[384px] z-[90] flex flex-col overflow-hidden"
              style={{
                background: 'rgba(20, 24, 34, 0.95)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(165, 243, 252, 0.08)',
                borderLeft: '1px solid rgba(165, 243, 252, 0.15)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
               <div className="absolute top-4 right-4 z-50">
                 <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/60 hover:text-white transition-colors">
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <div className="h-full flex flex-col">
                  {/* Hero / Header */}
                  <div className="h-64 relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40" />
                      <img src="https://source.unsplash.com/random/1200x400?gaming,abstract" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
                      <div className="absolute -bottom-12 left-12 flex items-end">
                          <div className="relative">
                              <div className="w-32 h-32 rounded-full p-1 bg-slate-900 ring-4 ring-slate-800">
                                  <img src={item.avatar} className="w-full h-full rounded-full object-cover" />
                              </div>
                              <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-slate-900 ${
                                  item.status === 'online' ? 'bg-green-500' : item.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'
                              }`} />
                          </div>
                      </div>
                  </div>
                  
                  {/* Profile Body */}
                  <div className="flex-1 p-12 pt-16 overflow-y-auto">
                      <div className="flex justify-between items-start mb-8">
                          <div>
                              <h1 className="text-4xl font-bold text-white mb-2">{item.name}</h1>
                              <div className="flex items-center gap-3 text-white/60">
                                  <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider">Lvl 42</span>
                                  <span>•</span>
                                  <span>{item.game ? `Playing ${item.game}` : item.status}</span>
                              </div>
                          </div>
                          <div className="flex gap-3">
                              <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
                                  <MessageSquare className="w-4 h-4" /> Message
                              </Button>
                              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 gap-2">
                                  <User className="w-4 h-4" /> Profile
                              </Button>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Stats Card */}
                          <div className="md:col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10">
                              <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-6">Recent Activity</h3>
                              <div className="space-y-4">
                                  <div className="flex items-center gap-4 p-4 rounded-xl bg-black/20">
                                      <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                          <Gamepad2 className="w-6 h-6" />
                                      </div>
                                      <div>
                                          <div className="text-white font-bold">Cyberpunk 2088</div>
                                          <div className="text-white/40 text-xs">Played for 3h today</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-4 p-4 rounded-xl bg-black/20">
                                      <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                                          <Trophy className="w-6 h-6" />
                                      </div>
                                      <div>
                                          <div className="text-white font-bold">Achievement Unlocked</div>
                                          <div className="text-white/40 text-xs">Master of the Arena</div>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* Badges / Info */}
                          <div className="space-y-6">
                              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Badges</h3>
                                  <div className="flex flex-wrap gap-2">
                                      {['Beta', 'VIP', 'Sniper', 'Leader'].map(b => (
                                          <span key={b} className="px-3 py-1 rounded-lg bg-white/10 text-white/70 text-xs font-bold border border-white/5">{b}</span>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>


          {/* Dim background to the right of LibrarySidebar */}
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 bottom-0 right-0 left-[320px] sm:left-[384px] z-[80]"
          onClick={onClose}
          style={{ background: 'rgba(0,0,0,0.5)' }}
          />

          {/* Slide-in panel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 left-[320px] sm:left-[384px] z-[90] flex flex-col overflow-hidden"
            style={{
              background: 'rgba(20, 24, 34, 0.5)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(165, 243, 252, 0.08)',
              borderLeft: '1px solid rgba(165, 243, 252, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                {item?.image ? (
                  <img src={item.image} alt={item?.title || 'Item'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded bg-white/20" />
                )}
              </div>
              <div className="min-w-0 flex items-center gap-2">
                <h3 className="text-white font-semibold truncate">{item?.title || 'Selected Item'}</h3>
                {item?.subtitle && <p className="text-white/60 text-xs truncate">{item.subtitle}</p>}
                {(isStreamerProfileView || (isAuraStreamingView && streamers[activeStreamerIndex])) && (
                  <button
                    onClick={() => openStreamerProfile(isStreamerProfileView ? (item?.title || '') : (streamers[activeStreamerIndex]?.name || ''))}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition"
                    title="Open Profile"
                  >
                    <User className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="ml-auto w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Fade container for item changes */}
            <AnimatePresence mode="wait">
              <motion.div key={itemKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex-1 overflow-y-auto custom-scrollbar">

             {isStreamerProfileView ? (
              <div className="p-4 h-full overflow-y-auto custom-scrollbar">
                <StreamerProfilePanel streamer={{ name: item?.title, avatar: item?.image, tagline: 'COMPETITIVE • STRATEGIC' }} />
              </div>
            ) : isAuraStreamingView ? (
              <div className="p-4 space-y-5 h-full overflow-y-auto custom-scrollbar">
                {/* Top layout: feature and chat */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-3 relative rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 overflow-hidden">
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-red-500/15 text-red-300 text-[11px] font-semibold border border-red-500/30">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> GO LIVE
                      </span>
                    </div>
                    <div className="flex items-center justify-center h-[220px] sm:h-[260px] md:h-[280px] lg:h-[300px]">
                      <p className="text-white/50 text-sm">No featured content available</p>
                    </div>
                  </div>

                  <div className="md:col-span-2 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                      <div className="flex items-center gap-2 text-white">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-white/10">🗨️</span>
                        <span className="text-[13px] font-semibold">Stream Chat</span>
                      </div>
                      <span className="text-[11px] text-white/50 uppercase tracking-wider">Offline</span>
                    </div>
                    <div className="flex items-center justify-center h-[180px] sm:h-[220px] md:h-[240px] lg:h-[260px]">
                      <p className="text-white/40 text-sm">Chat is offline</p>
                    </div>
                    <div className="px-3 py-3 border-t border-white/10 bg-black/20">
                      <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 opacity-60">
                        <input disabled placeholder="Chat is disabled when offline" className="flex-1 bg-transparent text-xs text-white/60 placeholder:text-white/40 outline-none" />
                        <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60" aria-label="Chat settings">
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Channel Header */}
                <div className="w-full py-4 flex items-center relative border-b border-white/10 min-h-[80px]">
                  {/* Left: Streamer Info */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-4 z-10">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/10 bg-black flex-shrink-0">
                      {streamers[activeStreamerIndex]?.avatar ? (
                        <img src={streamers[activeStreamerIndex]?.avatar} alt={streamers[activeStreamerIndex]?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold">
                          {(streamers[activeStreamerIndex]?.name || 'S').charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-white tracking-wide truncate">{streamers[activeStreamerIndex]?.name || 'NovaKnight'}</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest truncate">PERSONALITY</span>
                        <span className="text-[10px] text-cyan-300 uppercase tracking-wider truncate">COMPETITIVE • STRATEGIC</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Navigation Links */}
                  <div className="w-full flex justify-center">
                    <div className="flex items-center gap-8">
                      {['Schedule','Cards','Gallery','Games'].map((t) => {
                        const id = t.toLowerCase();
                        const isActive = activeStreamerTab === id;
                        return (
                          <button 
                            key={id} 
                            onClick={() => setActiveStreamerTab(isActive ? null : id)}
                            className={`text-sm font-medium transition-all relative py-2 ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}`}
                          >
                            {t}
                            {isActive && <motion.div layoutId="activeTabStreamer" className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-4 z-10">
                    <Button className="bg-white text-black hover:bg-white/90 rounded-full px-6 font-bold text-xs">
                      Subscribe
                    </Button>
                    <div className="flex items-center gap-1 text-white/60 text-xs font-bold">
                      <User className="w-3 h-3" /> 1.2K
                    </div>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[300px]">
                  {activeStreamerTab === 'games' && (
                    <div>
                      <h3 className="text-white font-bold text-sm mb-4">Games Played</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {['Valorant','Apex Legends','League of Legends','Overwatch 2','Minecraft','Destiny 2','Elden Ring','Cyberpunk 2077'].map((g, i) => (
                          <div key={g} className="group relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-white/5">
                            <img src={`https://source.unsplash.com/random/400x225?game,${g}&sig=${i}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex flex-col justify-end">
                              <p className="text-white font-bold text-sm truncate">{g}</p>
                              <p className="text-[10px] text-white/50">FPS • Action</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeStreamerTab === 'gallery' && (
                    <div>
                      <h3 className="text-white font-bold text-sm mb-4">Gallery</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="aspect-video bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all cursor-pointer group relative">
                            <img src={`https://source.unsplash.com/random/800x600?gaming,setup&sig=${i}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ))}
                      </div>
                      <p className="text-center text-white/30 text-xs mt-4">Scroll to view more • Double-click content to collapse</p>
                    </div>
                  )}

                  {activeStreamerTab === 'cards' && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-white font-bold text-sm">Stream Collection</h3>
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-[10px]">Season 0</Badge>
                        <div className="ml-auto flex gap-2">
                           <Button variant="ghost" size="sm" className="h-6 text-[10px]">All</Button>
                           <Button variant="ghost" size="sm" className="h-6 text-[10px] text-white/50">Powers</Button>
                           <Button variant="ghost" size="sm" className="h-6 text-[10px] text-white/50">Equipment</Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className="group relative aspect-[3/4] rounded-lg border border-white/10 bg-white/5 overflow-hidden transition-all hover:scale-105 hover:border-white/30">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                            <div className="absolute top-1.5 left-1.5">
                              <span className="text-[8px] uppercase tracking-wider text-white/40">Common</span>
                            </div>
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="h-1 w-8 bg-white/10 rounded-full mb-1" />
                              <div className="h-1 w-12 bg-white/10 rounded-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeStreamerTab === 'schedule' && (
                    <div className="w-full select-none pt-2">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2">
                          Streaming Schedule <span className="text-white/40 text-xs font-normal ml-2">{dateRangeString}</span>
                        </h3>
                        <div className="flex items-center gap-1">
                          <Button onClick={() => setScheduleBaseDate(d => addDays(d, -14))} variant="outline" size="icon" className="h-6 w-6 rounded-lg bg-white/5 border-white/10 hover:bg-white/10"><ChevronLeft className="w-3 h-3" /></Button>
                          <Button onClick={() => setScheduleBaseDate(new Date())} variant="outline" className="h-6 px-3 rounded-lg bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-semibold">Today</Button>
                          <Button onClick={() => setScheduleBaseDate(d => addDays(d, 14))} variant="outline" size="icon" className="h-6 w-6 rounded-lg bg-white/5 border-white/10 hover:bg-white/10"><ChevronRight className="w-3 h-3" /></Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-px bg-white/10 rounded-xl overflow-hidden border border-white/10">
                        {scheduleDays.map((date, i) => {
                          const isCurrentDay = isToday(date);
                          const dayName = format(date, 'EEE');
                          const dayNumber = format(date, 'd');
                          return (
                            <div key={i} className={`bg-[#0f1419] p-2 min-h-[80px] flex flex-col items-center relative group hover:bg-[#1a1f2e] transition-colors ${isCurrentDay ? 'bg-white/[0.03]' : ''}`}>
                              <div className="w-full flex justify-between items-start mb-1 px-1">
                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{dayName}</span>
                              </div>
                              <span className={`text-lg font-bold ${isCurrentDay ? 'text-cyan-400' : 'text-white'}`}>{dayNumber}</span>
                              {isCurrentDay && <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none box-border border-b-2 border-cyan-500/50" />}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-center text-white/30 text-[10px] mt-4">Double-click content to collapse • Timezone is localized</p>
                    </div>
                  )}
                </div>

                {/* Partners & Sponsors */}
                <SponsorsSection allowEditing={false} />
                </div>
                ) : isAppView ? (
                <div className="w-full h-full min-h-0 flex flex-col">
                 <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                       <span className="text-white/70 text-xs">{(item?.title || 'App').charAt(0)}</span>
                     </div>
                     <h4 className="text-white font-semibold text-sm truncate">{item?.title}</h4>
                   </div>
                   {resolvedAppUrl && (
                     <a href={resolvedAppUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1">
                       Open <ExternalLink className="w-3 h-3" />
                     </a>
                   )}
                 </div>
                 <iframe
                   src={resolvedAppUrl || 'about:blank'}
                   className="w-full h-full flex-1 min-h-0 border-0"
                   sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                   title={item?.title || 'App'}
                 />
                </div>
                ) : (
                <>
                 {/* Hero media */}
                <div className="relative h-44 sm:h-52 border-b border-white/10 overflow-hidden">
                  {item?.image ? (
                    <img src={item.image} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
                  )}
                  <div className="absolute bottom-3 left-4 flex gap-2">
                    <Button onClick={onPlay} className="bg-emerald-600 hover:bg-emerald-700">
                      <Play className="w-4 h-4" /> Play
                    </Button>
                    <Button variant="secondary" onClick={onStream}>
                      <Radio className="w-4 h-4" /> Stream
                    </Button>
                    <Button variant="outline" onClick={onMoreInfo}>
                      <Info className="w-4 h-4" /> Info
                    </Button>
                  </div>
                </div>

                {/* Quick actions & info tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
                  <TabsList className="bg-white/5 border border-white/10 w-full justify-start p-1 h-auto rounded-xl">
                    <TabsTrigger value="content" className="flex-1 py-2 data-[state=active]:bg-white/10 data-[state=active]:shadow-lg">Content</TabsTrigger>
                    <TabsTrigger value="community" className="flex-1 py-2 data-[state=active]:bg-white/10 data-[state=active]:shadow-lg">Community</TabsTrigger>
                    <TabsTrigger value="achievements" className="flex-1 py-2 data-[state=active]:bg-white/10 data-[state=active]:shadow-lg">Achievements</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-6 mt-6">
                    <div className="grid grid-cols-12 gap-6">
                      {/* Left Column: Updates, Expansion, Quests */}
                      <div className="col-span-12 lg:col-span-8 space-y-10">
                        {/* Updates / Patch Notes */}
                        <div className="border-b border-white/10 pb-8">
                          <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <Newspaper className="w-5 h-5 text-cyan-400" /> Game Updates & Patch Notes
                          </h3>
                          <div className="space-y-6">
                             <div className="relative pl-6 border-l-2 border-cyan-500/50">
                                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                                <h4 className="text-white font-bold text-base">Patch 2.1 - Cyber Dawn</h4>
                                <p className="text-white/60 text-sm mt-2 leading-relaxed">New neon city district, 5 new weapons, and improved ray-tracing performance. Fixed minor bugs in the inventory system.</p>
                                <span className="text-[10px] text-cyan-400/60 uppercase tracking-widest mt-3 block font-bold">Today • v2.1.0</span>
                             </div>
                             <div className="relative pl-6 border-l-2 border-purple-500/50">
                                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                                <h4 className="text-white font-bold text-base">Event: Void Walker's Return</h4>
                                <p className="text-white/60 text-sm mt-2 leading-relaxed">Limited time event! Earn double XP and exclusive void skins for your character.</p>
                                <span className="text-[10px] text-purple-400/60 uppercase tracking-widest mt-3 block font-bold">2 Days Ago • Event</span>
                             </div>
                          </div>
                        </div>

                        {/* Expansion Content (Clean Design) */}
                        <div className="border-b border-white/10 pb-8">
                           <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-purple-400" /> Expansion Content
                          </h3>
                          <div className="space-y-2">
                             {DLC_DATA.filter(d => d.id !== 'standard').map(dlc => (
                                <div key={dlc.id} className="overflow-hidden">
                                   <div className="py-2 flex items-center justify-between cursor-pointer group" onClick={() => setExpandedDlcId(expandedDlcId === dlc.id ? null : dlc.id)}>
                                      <div className="flex-1 flex items-center gap-2">
                                         <h4 className="text-white text-base font-bold group-hover:text-purple-300 transition-colors">{dlc.name}</h4>
                                         <ChevronRight className={`w-5 h-5 text-white/50 transition-transform ${expandedDlcId === dlc.id ? 'rotate-90' : ''}`} />
                                      </div>
                                      <div className="flex items-center gap-4 ml-4">
                                         <span className="text-sm font-mono font-bold text-purple-300">$ {dlc.id === 'dlc_3' ? '29.99' : '14.99'}</span>
                                         <Button 
                                            size="sm" 
                                            className="h-8 px-4 text-xs bg-white/10 hover:bg-white/20 border border-yellow-400/40 text-yellow-300 font-bold"
                                            onClick={(e) => {
                                               e.stopPropagation();
                                               addToCart({ id: `${item?.id || item?.title}-${dlc.id}`.replace(/\s+/g, '_'), type: 'dlc', title: `${item?.title || 'Game'} - ${dlc.name}`, price: dlc.id === 'dlc_3' ? 29.99 : 14.99 });
                                            }}
                                         >
                                            Buy
                                         </Button>
                                      </div>
                                   </div>
                                   
                                   {/* Dropdown Content - No Box */}
                                   <AnimatePresence>
                                      {expandedDlcId === dlc.id && (
                                         <motion.div 
                                            initial={{ height: 0, opacity: 0 }} 
                                            animate={{ height: 'auto', opacity: 1 }} 
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-l-2 border-purple-500/20 ml-1 pl-4 mb-4"
                                         >
                                            <div className="pt-2 grid grid-cols-2 gap-6">
                                               <div className="space-y-3">
                                                  <p className="text-white/60 text-sm leading-relaxed">{dlc.description}</p>
                                                  <h5 className="text-white text-xs font-bold uppercase tracking-wider mb-2">Includes</h5>
                                                  {dlc.offers.slice(0, 3).map((offer, i) => (
                                                     <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                                                        <Check className="w-3 h-3 text-cyan-400" /> {offer}
                                                     </div>
                                                  ))}
                                                  <div className="pt-2 flex gap-3">
                                                     <a href="#" className="text-xs text-white/40 hover:text-white flex items-center gap-1"><Instagram className="w-3 h-3" /> Instagram</a>
                                                     <a href="#" className="text-xs text-white/40 hover:text-white flex items-center gap-1"><Twitter className="w-3 h-3" /> Twitter</a>
                                                  </div>
                                               </div>
                                               <div className="aspect-video rounded-lg bg-black overflow-hidden relative group cursor-pointer">
                                                  <img src={`https://source.unsplash.com/random/400x225?scifi,game,${dlc.id}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                  <div className="absolute inset-0 flex items-center justify-center">
                                                     <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Play className="w-4 h-4 text-white fill-white" />
                                                     </div>
                                                  </div>
                                               </div>
                                            </div>
                                         </motion.div>
                                      )}
                                   </AnimatePresence>
                                </div>
                             ))}
                          </div>
                        </div>

                        {/* Quests & Experience (Clean Design) */}
                        <div>
                           <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-400" /> Quests & Experience
                          </h3>
                          
                          {/* Active Quests Section */}
                          <div className="space-y-2 mb-8 border-b border-white/10 pb-8">
                             <h4 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Active Quests</h4>
                             {[
                                { id: 'q1', name: 'Awakening the Machine', xp: 500, desc: 'Locate the dormant AI core in the lower sector and reboot the system manually.', hint: 'Look for the blue terminal near the subway entrance.' },
                                { id: 'q2', name: 'Neon Shadows', xp: 1200, desc: 'Infiltrate the neon district gang hideout without raising the alarm.', hint: 'Use the ventilation shafts on the roof.' }
                             ].map(quest => (
                                <div key={quest.id} className="group">
                                   <div 
                                      onClick={() => setExpandedQuestId(expandedQuestId === quest.id ? null : quest.id)}
                                      className="py-2 cursor-pointer flex justify-between items-center hover:bg-white/[0.02] transition-colors rounded-lg px-2 -mx-2"
                                   >
                                      <div>
                                         <div className="flex items-center gap-2">
                                            <span className="text-white text-base font-bold group-hover:text-cyan-300 transition-colors">{quest.name}</span>
                                            <ChevronRight className={`w-5 h-5 text-white/50 transition-transform ${expandedQuestId === quest.id ? 'rotate-90' : ''}`} />
                                            {expandedQuestId === quest.id && <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[9px] px-1.5 py-0">ACTIVE</Badge>}
                                         </div>
                                         <p className="text-cyan-400 text-xs font-mono font-bold mt-1 pl-7">+{quest.xp} XP</p>
                                      </div>
                                   </div>
                                   
                                   <AnimatePresence>
                                      {expandedQuestId === quest.id && (
                                         <motion.div 
                                            initial={{ height: 0, opacity: 0 }} 
                                            animate={{ height: 'auto', opacity: 1 }} 
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden pl-2"
                                         >
                                            <div className="py-4 border-l-2 border-cyan-500/20 ml-2 pl-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                               <div className="space-y-4">
                                                  <p className="text-white/80 text-sm leading-relaxed">{quest.desc}</p>
                                                  
                                                  {/* Community Aid - No Box */}
                                                  <div>
                                                     <h5 className="text-blue-300 text-xs font-bold uppercase mb-1 flex items-center gap-1"><LifeBuoy className="w-3 h-3" /> Community Aid</h5>
                                                     <p className="text-blue-200/70 text-sm italic border-l border-blue-500/30 pl-3">"{quest.hint}"</p>
                                                  </div>
                                               </div>
                                               <div className="aspect-video rounded-xl bg-black overflow-hidden relative border border-white/10">
                                                  <img src={`https://source.unsplash.com/random/400x225?cyberpunk,city,${quest.id}`} className="w-full h-full object-cover opacity-80" />
                                                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 backdrop-blur-md text-[9px] text-white font-mono">
                                                     Ref: Sector 4
                                                  </div>
                                               </div>
                                            </div>
                                         </motion.div>
                                      )}
                                   </AnimatePresence>
                                </div>
                             ))}
                          </div>

                          {/* Achievements Section with Migrational Tabs */}
                          <div>
                             <div className="flex items-baseline justify-between mb-4">
                                <h4 className="text-white font-bold text-lg">Achievements</h4>
                             </div>
                             
                             {/* Migrational Subpages (Tabs) */}
                             <div className="flex gap-8 mb-6 border-b border-white/10">
                                {['ability', 'equipment', 'companion', 'environment'].map(tab => (
                                   <button 
                                      key={tab}
                                      onClick={() => setAchievementSubTab(tab)}
                                      className={`text-sm font-bold pb-3 transition-colors uppercase tracking-wider relative ${achievementSubTab === tab ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                                   >
                                      {tab}
                                      {achievementSubTab === tab && <motion.div layoutId="achTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]" />}
                                   </button>
                                ))}
                             </div>

                             {/* Card Formation Display */}
                             <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                                {Array.from({ length: 12 }).map((_, i) => (
                                   <ShinyCard key={i} className="aspect-[3/4] bg-white/5 border border-white/10 rounded-xl flex items-center justify-center relative group overflow-hidden">
                                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                      <span className="text-white/20 text-2xl font-light group-hover:text-white/40 transition-colors">?</span>
                                      <div className="absolute bottom-2 left-0 right-0 text-center">
                                         <span className="text-[8px] text-white/30 uppercase tracking-widest">{achievementSubTab.slice(0,3)}</span>
                                      </div>
                                   </ShinyCard>
                                ))}
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Abilities (DLC removed from here as moved to left) */}
                      <div className="col-span-12 lg:col-span-4 space-y-6">
                        {/* Abilities Unlocked */}
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                           <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <Radio className="w-5 h-5 text-blue-400" /> Abilities Unlocked
                          </h3>
                          <div className="flex flex-col items-center justify-center py-2">
                             {/* Reuse Radial from previous code */}
                             <div className="w-40 h-40 rounded-full grid place-items-center mb-6 relative">
                                <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                                <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#3b82f6 ${(Math.min(100, Math.round(((achievements?.length || 0)/50)*100)) * 3.6)}deg, transparent 0deg)`, maskImage: 'radial-gradient(transparent 65%, black 66%)', WebkitMaskImage: 'radial-gradient(transparent 65%, black 66%)' }} />
                                
                                <div className="flex flex-col items-center">
                                   <span className="text-white font-black text-3xl tracking-tighter drop-shadow-lg">{Math.min(100, Math.round(((achievements?.length || 0)/50)*100))}%</span>
                                   <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Mastery</span>
                                </div>
                             </div>
                             <div className="w-full space-y-3">
                                <div className="flex justify-between items-center text-xs text-white/60 border-b border-white/5 pb-3">
                                   <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]" /> Neural Shock</span>
                                   <span className="text-white font-bold">Unlocked</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-white/60 border-b border-white/5 pb-3">
                                   <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]" /> Void Step</span>
                                   <span className="text-white font-bold">Unlocked</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-white/60">
                                   <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/20" /> Titan Smash</span>
                                   <span className="text-white/20 font-bold uppercase text-[10px]">Locked</span>
                                </div>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="achievements" className="h-[600px] mt-6">
                    <AnimatePresence mode="wait">
                      {selectedMysteryCard === null ? (
                        <motion.div
                          key="list"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="h-full flex flex-col"
                        >
                          {/* Filter Header */}
                          <div className="flex items-center gap-6 mb-6 pb-2 border-b border-white/10 overflow-x-auto scrollbar-hide px-2">
                             {['all', 'ability', 'gear', 'companion', 'environment'].map(filter => (
                                <button
                                   key={filter}
                                   onClick={() => setAchievementFilter(filter)}
                                   className={`text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors relative pb-2 ${achievementFilter === filter ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                                >
                                   {filter}
                                   {achievementFilter === filter && <motion.div layoutId="achFilter" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />}
                                </button>
                             ))}
                          </div>

                          {/* Cards List (2 per row with dot in middle) */}
                          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-2">
                             {(() => {
                                const list = Array.from({ length: 24 }).map((_, i) => {
                                  const types = ['ability', 'gear', 'companion', 'environment'];
                                  return { 
                                    id: i, 
                                    type: types[i % 4],
                                    rarity: i % 5 === 0 ? 'legendary' : i % 3 === 0 ? 'rare' : 'common'
                                  };
                                });
                                const filtered = achievementFilter === 'all' ? list : list.filter(i => i.type === achievementFilter);
                                const pairs = [];
                                for (let i = 0; i < filtered.length; i += 2) {
                                   pairs.push(filtered.slice(i, i + 2));
                                }
                                
                                return pairs.map((pair, idx) => (
                                   <div key={idx} className="flex items-center justify-between group">
                                      {/* Left Card */}
                                      <div className="flex-1">
                                         <ShinyCard 
                                            onClick={() => setSelectedMysteryCard(pair[0].id)}
                                            className="aspect-[3/4] w-full bg-white/5 border border-white/10 rounded-xl flex items-center justify-center relative overflow-hidden transition-all hover:scale-[0.98] cursor-pointer hover:border-white/30 group/card"
                                         >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                            <span className="text-white/20 text-2xl font-light">?</span>
                                            <div className="absolute bottom-2 left-0 right-0 text-center">
                                               <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">{pair[0].type}</span>
                                            </div>
                                            {pair[0].rarity === 'legendary' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />}
                                         </ShinyCard>
                                      </div>

                                      {/* Center Dot */}
                                      <div className="mx-2 flex flex-col items-center">
                                         <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-cyan-400/50 transition-colors" />
                                      </div>

                                      {/* Right Card (if exists) */}
                                      <div className="flex-1">
                                         {pair[1] ? (
                                            <ShinyCard 
                                               onClick={() => setSelectedMysteryCard(pair[1].id)}
                                               className="aspect-[3/4] w-full bg-white/5 border border-white/10 rounded-xl flex items-center justify-center relative overflow-hidden transition-all hover:scale-[0.98] cursor-pointer hover:border-white/30 group/card"
                                            >
                                               <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                               <span className="text-white/20 text-2xl font-light">?</span>
                                               <div className="absolute bottom-2 left-0 right-0 text-center">
                                                  <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">{pair[1].type}</span>
                                               </div>
                                               {pair[1].rarity === 'legendary' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />}
                                            </ShinyCard>
                                         ) : (
                                            <div className="aspect-[3/4] w-full" /> /* Spacer */
                                         )}
                                      </div>
                                   </div>
                                ));
                             })()}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="detail"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="h-full"
                        >
                          <MysteryCardDetail 
                            card={{ id: selectedMysteryCard }} 
                            onBack={() => setSelectedMysteryCard(null)} 
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </TabsContent>

                  <TabsContent value="community" className="mt-6">
                    <div className="grid grid-cols-12 gap-6 h-[600px]">
                       {/* Left Column: Main Viewer (Full Screen Experience) */}
                       <div className="col-span-12 lg:col-span-8 h-full flex flex-col">
                          <div className="flex-1 bg-black rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl">
                              {(selectedCommunityMedia || COMMUNITY_SKIRMISH[0]) ? (
                                  <>
                                      {(selectedCommunityMedia || COMMUNITY_SKIRMISH[0]).type === 'video' ? (
                                          <video 
                                              src={(selectedCommunityMedia || COMMUNITY_SKIRMISH[0]).url} 
                                              className="w-full h-full object-contain" 
                                              controls 
                                              autoPlay 
                                              loop
                                          />
                                      ) : (
                                          <img 
                                              src={(selectedCommunityMedia || COMMUNITY_SKIRMISH[0]).url} 
                                              className="w-full h-full object-contain" 
                                          />
                                      )}
                                      {/* Info Overlay */}
                                      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                                          <div className="flex items-end justify-between">
                                              <div>
                                                  <h3 className="text-white font-bold text-2xl mb-1">{(selectedCommunityMedia || COMMUNITY_SKIRMISH[0]).title}</h3>
                                                  <p className="text-white/60 text-sm font-medium">Shared by <span className="text-cyan-400">{(selectedCommunityMedia || COMMUNITY_SKIRMISH[0]).user}</span></p>
                                              </div>
                                              <div className="flex gap-3">
                                                  <Button size="sm" variant="secondary" className="h-8 rounded-full">
                                                      <Heart className="w-4 h-4 mr-1 text-red-500 fill-red-500" /> Like
                                                  </Button>
                                                  <Button size="sm" variant="secondary" className="h-8 rounded-full">
                                                      <MessageSquare className="w-4 h-4 mr-1" /> Comment
                                                  </Button>
                                              </div>
                                          </div>
                                      </div>
                                  </>
                              ) : (
                                  <div className="flex items-center justify-center h-full text-white/30">Select media to view</div>
                              )}
                          </div>
                       </div>

                       {/* Right Column: Community Skirmish & Game Remote */}
                       <div className="col-span-12 lg:col-span-4 h-full flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-2">
                          {/* Community Skirmish - Wacky Photos */}
                          <div>
                              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                  <span className="text-yellow-400">🤪</span> Community Skirmish
                              </h3>
                              <div className="grid grid-cols-2 gap-3">
                                  {COMMUNITY_SKIRMISH.map((item) => (
                                      <div 
                                          key={item.id} 
                                          onClick={() => setSelectedCommunityMedia(item)}
                                          className={`aspect-video rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-all border-2 ${selectedCommunityMedia?.id === item.id ? 'border-cyan-400' : 'border-transparent hover:border-white/30'}`}
                                      >
                                          <img src={item.url} className="w-full h-full object-cover" />
                                      </div>
                                  ))}
                              </div>
                          </div>

                          {/* Game Remote - Hardcore Plays */}
                          <div>
                              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                  <span className="text-red-500">🎮</span> Game Remote
                              </h3>
                              <div className="grid grid-cols-2 gap-3">
                                  {GAME_REMOTE.map((item) => (
                                      <div 
                                          key={item.id} 
                                          onClick={() => setSelectedCommunityMedia(item)}
                                          className={`aspect-video rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-all border-2 relative ${selectedCommunityMedia?.id === item.id ? 'border-cyan-400' : 'border-transparent hover:border-white/30'}`}
                                      >
                                          {item.type === 'video' ? (
                                              <div className="w-full h-full bg-black flex items-center justify-center relative">
                                                  <img src={`https://source.unsplash.com/random/400x225?gaming,action,${item.id}`} className="w-full h-full object-cover opacity-60" />
                                                  <div className="absolute inset-0 flex items-center justify-center">
                                                      <Play className="w-6 h-6 text-white fill-white" />
                                                  </div>
                                              </div>
                                          ) : (
                                              <img src={item.url} className="w-full h-full object-cover" />
                                          )}
                                          <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                              <Radio className="w-2 h-2 text-red-500" /> {item.views || 'New'}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                          
                          <div className="mt-auto pt-4 flex justify-center">
                              <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-white/60">
                                  Load More Community Content
                              </Button>
                          </div>
                       </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </motion.div>
          </AnimatePresence>
          </motion.div>

          {/* Create Post Modal (if needed) */}
          {showCreatePost && (
            <CreatePostForm 
              initialGameTitle={item?.title}
              onCancel={() => setShowCreatePost(false)}
              onSubmit={handleCreatePost}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}