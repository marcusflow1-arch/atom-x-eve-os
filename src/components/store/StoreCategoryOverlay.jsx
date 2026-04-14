import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Star, ChevronRight, Flame, Sparkles, TrendingUp, Trophy, Gem, Clock, ShoppingCart, Heart, ExternalLink, Download, Users, Play, Monitor, Cpu, HardDrive, MemoryStick, Tag, Globe, Award, Zap, Info, ChevronLeft, Layers, ShoppingBag, ThumbsUp, MessageCircle, Camera, Video, Send, Wifi, WifiOff, User2 } from 'lucide-react';
import { useCart } from '@/components/CartContext';
import { useAuth } from '@/components/auth/AuthContext';
import StoreGameDetailPanel from './GameDetailPanel';
import WishlistButton from './WishlistButton';
import PlayerInteractionsPanel from './PlayerInteractionsPanel';

const CATEGORIES = [
  { id: 'recommended', label: 'Recommended', icon: Sparkles, color: 'from-purple-500 to-pink-500', accent: 'text-purple-300', filter: (games) => [...games].sort(() => Math.random() - 0.5).slice(0, 20) },
  { id: 'new_releases', label: 'New Releases', icon: Clock, color: 'from-cyan-500 to-blue-500', accent: 'text-cyan-300', filter: (games) => [...games].sort((a, b) => (b.original_year || 0) - (a.original_year || 0)).slice(0, 20) },
  { id: 'top_rated', label: 'Top Rated', icon: Trophy, color: 'from-yellow-500 to-orange-500', accent: 'text-yellow-300', filter: (games) => [...games].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 20) },
  { id: 'trending', label: 'Trending', icon: Flame, color: 'from-red-500 to-orange-500', accent: 'text-red-300', filter: (games) => [...games].sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 20) },
  { id: 'hidden_gems', label: 'Hidden Gems', icon: Gem, color: 'from-green-500 to-teal-500', accent: 'text-green-300', filter: (games) => games.filter(g => (g.rating || 0) < 4 && (g.rating || 0) > 3).slice(0, 20) },
];

const glassPanel = {
  background: 'linear-gradient(135deg, rgba(180,190,210,0.10) 0%, rgba(120,135,155,0.07) 100%)',
  backdropFilter: 'blur(32px) saturate(180%)',
  WebkitBackdropFilter: 'blur(32px) saturate(180%)',
  border: '1px solid rgba(200,215,235,0.14)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09)',
};

const glassCard = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
};

function StatBadge({ icon: Icon, label, value, accent = 'text-white/70' }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl" style={glassCard}>
      <Icon className={`w-4 h-4 ${accent}`} />
      <span className="text-white font-black text-lg leading-none">{value}</span>
      <span className="text-white/40 text-[10px] uppercase tracking-wider">{label}</span>
    </div>
  );
}

function SideScreenshots({ screenshots }) {
  const [active, setActive] = useState(0);
  const fallbacks = [
    'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&q=80',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80',
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&q=80',
    'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=400&q=80',
  ];
  const imgs = (screenshots && screenshots.length > 0) ? screenshots : fallbacks;
  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="relative rounded-xl overflow-hidden flex-shrink-0" style={{ aspectRatio: '16/9' }}>
        <img src={imgs[active]} alt="Screenshot" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.5) 100%)' }} />
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
          {imgs.map((_, i) => <div key={i} onClick={() => setActive(i)} className={`w-1 h-1 rounded-full cursor-pointer transition-all ${i === active ? 'bg-cyan-400 scale-150' : 'bg-white/40'}`} />)}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1.5" style={{ scrollbarWidth: 'none' }}>
        {imgs.map((src, i) => (
          <div key={i} onClick={() => setActive(i)} className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${i === active ? 'border-cyan-400' : 'border-transparent opacity-60 hover:opacity-90'}`} style={{ aspectRatio: '16/9' }}>
            <img src={src} alt="" className="w-full h-full object-cover" />
            {i === active && <div className="absolute inset-0 bg-cyan-400/10" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewStars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
      ))}
    </div>
  );
}

const MOCK_REVIEWS = [
  { user: 'NeuroGamer', rating: 5, text: 'Absolutely stunning visuals and gameplay. One of the best titles of the decade. The world-building is unmatched.', date: '2 days ago', hours: 142, helpful: 847 },
  { user: 'ShadowAce', rating: 4, text: 'Great mechanics and tight combat. Story could be deeper but the online modes more than make up for it. Absolutely worth full price.', date: '1 week ago', hours: 67, helpful: 312 },
  { user: 'CryptoKnight', rating: 5, text: 'Hours of content, amazing replayability. The online modes are fantastic and the devs keep updating with new content every month.', date: '2 weeks ago', hours: 289, helpful: 1204 },
  { user: 'VoidWalker', rating: 4, text: 'Incredible art direction. Performance is rock solid even on mid-range hardware. A few minor bugs but nothing game-breaking.', date: '3 weeks ago', hours: 55, helpful: 198 },
  { user: 'NovaPulse', rating: 5, text: 'Best in the genre bar none. The DLC expansions add massive value. Community is active and welcoming.', date: '1 month ago', hours: 401, helpful: 2103 },
];

const MOCK_DLC = [
  { name: 'Expansion Pack I', desc: 'New campaign, 8 hours of story content, 3 new zones.', price: 14.99, type: 'Expansion', icon: '⚔️' },
  { name: 'Season Pass', desc: 'All future DLC included. Best value for long-term players.', price: 29.99, type: 'Bundle', icon: '🎟️' },
  { name: 'Cosmetic Pack', desc: 'Exclusive skins, weapon wraps and avatar items.', price: 9.99, type: 'Cosmetics', icon: '✨' },
  { name: 'Soundtrack', desc: 'Full OST — 42 tracks from the award-winning composer.', price: 4.99, type: 'Media', icon: '🎵' },
];

const MOCK_CONTENT = [
  { label: 'Story Missions', value: '28', icon: '📖' },
  { label: 'Side Quests', value: '60+', icon: '🗺️' },
  { label: 'Multiplayer Modes', value: '8', icon: '🎮' },
  { label: 'Collectibles', value: '150', icon: '💎' },
  { label: 'Endings', value: '5', icon: '🔀' },
  { label: 'Game Hours', value: '40–80h', icon: '⏱️' },
];

function GameDetailPanel({ game, onBack, onViewFullPage, onOpenStoreView, onOpenStorePage }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const mockDownloads = Math.floor((game.price || 20) * 1247 + 8432);
  const mockPlayers = Math.floor(mockDownloads * 0.3);
  const mockAchievements = Math.floor((game.price || 10) * 3 + 12);
  const avgRating = game.rating || 4.2;
  const tabs = ['moments', 'reviews'];
  const [moments, setMoments] = useState([
    { id: 1, type: 'screenshot', name: 'Epic final boss moment 🔥', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80', user: 'ShadowAce', likes: 142, comments: [{ user: 'NeuroGamer', text: 'BRO that lighting!! 😭🙌' }, { user: 'VoidWalker', text: 'I died here 47 times lmao' }],
      extras: [
        { type: 'screenshot', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&q=75', name: 'Boss phase 2' },
        { type: 'screenshot', url: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=300&q=75', name: 'Victory screen' },
        { type: 'video', url: '', name: 'Kill clip' },
      ]
    },
    { id: 2, type: 'screenshot', name: 'Hidden spot nobody talks about', url: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600&q=80', user: 'CryptoKnight', likes: 89, comments: [{ user: 'NovaPulse', text: 'Where is this?? I need to know' }],
      extras: [
        { type: 'screenshot', url: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=300&q=75', name: 'Another angle' },
        { type: 'screenshot', url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&q=75', name: 'Map view' },
      ]
    },
    { id: 3, type: 'screenshot', name: 'My character after 200hrs 👑', url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&q=80', user: 'NovaPulse', likes: 312, comments: [{ user: 'ShadowAce', text: 'The drip is REAL 🔥' }, { user: 'CryptoKnight', text: 'Goals honestly' }, { user: 'NeuroGamer', text: 'Respect the grind 🤝' }],
      extras: [
        { type: 'screenshot', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&q=75', name: 'Equipment set 1' },
        { type: 'screenshot', url: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&q=75', name: 'Equipment set 2' },
        { type: 'screenshot', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&q=75', name: 'Full loadout' },
        { type: 'video', url: '', name: 'Showcase clip' },
      ]
    },
    { id: 4, type: 'screenshot', name: 'Caught the sunrise, worth it', url: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=600&q=80', user: 'NeuroGamer', likes: 201, comments: [],
      extras: [
        { type: 'screenshot', url: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=300&q=75', name: 'Sunset too' },
      ]
    },
  ]);
  const [likedMoments, setLikedMoments] = useState({});
  const [openComment, setOpenComment] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  // activeMedia[momentId] = { url, type, name } — starts as the moment's own media
  const [activeMedia, setActiveMedia] = useState({});

  const handleLike = (id) => {
    setLikedMoments(prev => ({ ...prev, [id]: !prev[id] }));
    setMoments(prev => prev.map(m => m.id === id ? { ...m, likes: m.likes + (likedMoments[id] ? -1 : 1) } : m));
  };

  const handleAddComment = (id) => {
    if (!commentDraft.trim()) return;
    const name = user?.full_name || user?.email?.split('@')[0] || 'Player';
    setMoments(prev => prev.map(m => m.id === id ? { ...m, comments: [...m.comments, { user: name, text: commentDraft.trim() }] } : m));
    setCommentDraft('');
    setOpenComment(null);
  };

  if (!game) return null;

  return (
    <motion.div
      key={game.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* ── HERO BANNER ── */}
      <div className="relative flex-shrink-0 h-52 overflow-hidden">
        <img src={game.banner_image || game.cover_image} alt={game.title} className="w-full h-full object-cover" style={{ filter: 'brightness(0.7) saturate(1.2)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(5,8,18,0.95) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, rgba(100,160,255,0.06) 0%, transparent 60%)' }} />
        <button onClick={onBack} className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/70 hover:text-white transition-all" style={glassCard}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {onOpenStoreView && (
            <button onClick={onOpenStoreView} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-purple-300 hover:text-purple-100 transition-all" style={{ ...glassCard, border: '1px solid rgba(168,85,247,0.35)' }}>
              <Monitor className="w-3.5 h-3.5" /> Store View
            </button>
          )}
          <button onClick={onViewFullPage} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-cyan-300 hover:text-cyan-100 transition-all" style={{ ...glassCard, border: '1px solid rgba(100,220,255,0.25)' }}>
            <ExternalLink className="w-3.5 h-3.5" /> Full Page
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-4">
          <img src={game.cover_image} alt="" className="w-16 object-cover rounded-xl border border-white/20 shadow-2xl flex-shrink-0" style={{ height: '88px' }} />
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-black text-xl leading-tight mb-1.5" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.9)' }}>{game.title}</h2>
            <div className="flex items-center flex-wrap gap-2">
              {game.genre && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ ...glassCard, color: 'rgba(150,220,255,0.9)' }}>{game.genre}</span>}
              {game.original_year && <span className="text-white/40 text-xs">{game.original_year}</span>}
              {game.status && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ ...glassCard, color: game.status === 'available' ? 'rgba(100,255,150,0.9)' : 'rgba(255,200,80,0.9)' }}>{game.status.replace(/_/g,' ')}</span>}
              <div className="flex items-center gap-1"><ReviewStars rating={avgRating} /><span className="text-yellow-400 text-xs font-bold ml-0.5">{avgRating}</span></div>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-2xl font-black text-green-400" style={{ textShadow: '0 0 20px rgba(74,222,128,0.4)' }}>${game.price ?? '0.00'}</div>
            <div className="text-white/30 text-[10px] uppercase tracking-wider">USD</div>
          </div>
        </div>
      </div>

      {/* ── STAT STRIP ── */}
      <div className="flex-shrink-0 px-4 py-2 flex gap-0 overflow-x-auto relative" style={{ scrollbarWidth: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { icon: Download, label: 'Downloads', value: mockDownloads.toLocaleString(), color: 'text-cyan-400' },
          { icon: Users, label: 'Active Players', value: mockPlayers.toLocaleString(), color: 'text-purple-400' },
          { icon: Trophy, label: 'Achievements', value: mockAchievements, color: 'text-yellow-400' },
          { icon: Star, label: 'Rating', value: avgRating, color: 'text-yellow-400' },
          { icon: Clock, label: 'Avg Playtime', value: '52h', color: 'text-blue-400' },
          { icon: Globe, label: 'Languages', value: '24', color: 'text-green-400' },
        ].map(({ icon: Icon, label, value, color }, idx, arr) => (
          <div key={label} className="flex items-center gap-2 px-4 py-1.5 flex-shrink-0 relative">
            {/* Subtle divider between items */}
            {idx > 0 && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-4 bg-white/10" />}
            <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} />
            <div>
              <div className="text-white font-black text-sm leading-none">{value}</div>
              <div className="text-white/35 text-[9px] uppercase tracking-wider mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="flex-shrink-0 px-4 py-2.5 flex items-center gap-2 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onOpenStorePage} className="flex items-center gap-2 px-5 py-2 rounded-2xl text-sm font-black transition-all hover:scale-105 active:scale-95" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.22), rgba(99,102,241,0.18))', border: '1px solid rgba(168,85,247,0.35)', color: 'rgba(216,180,254,1)', boxShadow: '0 0 24px rgba(168,85,247,0.18), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
          <ShoppingBag className="w-4 h-4" /> Store
        </button>
        <button onClick={() => addToCart({ id: game.id, title: game.title, image: game.cover_image, price: game.price || 0, type: 'game' })} className="flex items-center gap-2 px-5 py-2 rounded-2xl text-sm font-black transition-all hover:scale-105 active:scale-95" style={{ background: 'linear-gradient(135deg, rgba(0,200,255,0.22), rgba(80,80,255,0.18))', border: '1px solid rgba(0,200,255,0.35)', color: 'rgba(150,240,255,1)', boxShadow: '0 0 24px rgba(0,200,255,0.18), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
          <ShoppingCart className="w-4 h-4" /> Add to Cart
        </button>
        {game.play_link && (
          <a href={game.play_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2 rounded-2xl text-sm font-black transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, rgba(100,255,150,0.18), rgba(0,200,100,0.14))', border: '1px solid rgba(100,255,150,0.28)', color: 'rgba(150,255,180,1)' }}>
            <Play className="w-4 h-4" /> Play Now
          </a>
        )}
        <WishlistButton game={game} />
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-white/30 text-xs">Share</span>
          <ExternalLink className="w-3.5 h-3.5 text-white/30" />
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex-shrink-0 px-4 flex gap-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all capitalize relative ${
            activeTab === tab ? 'text-cyan-300' : 'text-white/35 hover:text-white/60'
          }`}>
            {tab === 'moments' ? '📸 Player Moments' : tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full" />}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="flex-1 overflow-hidden">

        {/* ══════════ MOMENTS TAB ══════════ */}
        {activeTab === 'moments' && (
          <div className="flex h-full">
            {/* LEFT — Player Moments Feed */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5" style={{ scrollbarWidth: 'none' }}>
              <div className="flex items-center gap-2 mb-1">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span className="text-white font-black text-sm">Community Moments</span>
                <span className="ml-auto text-white/30 text-[10px]">{moments.length} captures</span>
              </div>

              {moments.map((moment) => (
                <motion.div key={moment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  {/* Two-column layout: LEFT = media stack, RIGHT = comments */}
                  <div className="flex gap-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', marginBottom: '4px' }}>

                    {/* ── LEFT COLUMN: image + thumbnails + actions ── */}
                    <div className="flex flex-col" style={{ width: '58%', flexShrink: 0 }}>

                      {/* Main image — shows activeMedia or the moment's own media */}
                      {(() => {
                        const active = activeMedia[moment.id] || { url: moment.url, type: moment.type, name: moment.name };
                        return (
                          <div className="relative overflow-hidden" style={{ aspectRatio: '16/8.4' }}>
                            {active.type === 'video' ? (
                              <video key={active.url} src={active.url} className="w-full h-full object-cover" controls />
                            ) : (
                              <img src={active.url} alt={active.name} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute bottom-0 left-0 right-0 px-3 py-2">
                              <p className="text-white font-black text-xs leading-tight drop-shadow-lg">{active.name}</p>
                              <p className="text-white/50 text-[10px] mt-0.5 flex items-center gap-1"><User2 className="w-2.5 h-2.5" />{moment.user}</p>
                            </div>
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.7)' }}>
                              {active.type === 'video' ? <Video className="w-2.5 h-2.5" /> : <Camera className="w-2.5 h-2.5" />}
                              {active.type}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Extra captures thumbnail strip */}
                      {moment.extras && moment.extras.length > 0 && (
                        <div className="flex gap-1 px-2 pt-3 pb-1">
                          {/* Main moment thumbnail (first slot) */}
                          <div
                            key="main"
                            onClick={() => setActiveMedia(prev => ({ ...prev, [moment.id]: { url: moment.url, type: moment.type, name: moment.name } }))}
                            className="relative rounded-md overflow-hidden cursor-pointer group flex-1"
                            style={{ aspectRatio: '16/9', outline: !activeMedia[moment.id] ? '2px solid rgba(34,211,238,0.7)' : '2px solid transparent' }}
                          >
                            {moment.type === 'video' ? (
                              <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <Video className="w-3 h-3 text-white/50" />
                              </div>
                            ) : (
                              <img src={moment.url} alt={moment.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            )}
                            <div className="absolute inset-0 bg-black/35 group-hover:bg-black/10 transition-all" />
                          </div>
                          {moment.extras.map((ex, ei) => {
                            const isActive = activeMedia[moment.id]?.url === ex.url;
                            return (
                              <div
                                key={ei}
                                onClick={() => setActiveMedia(prev => ({ ...prev, [moment.id]: ex }))}
                                className="relative rounded-md overflow-hidden cursor-pointer group flex-1"
                                style={{ aspectRatio: '16/9', outline: isActive ? '2px solid rgba(34,211,238,0.7)' : '2px solid transparent' }}
                              >
                                {ex.type === 'video' ? (
                                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                    <Video className="w-3 h-3 text-white/50" />
                                  </div>
                                ) : (
                                  <img src={ex.url} alt={ex.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                )}
                                <div className="absolute inset-0 bg-black/35 group-hover:bg-black/10 transition-all" />
                                <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}>
                                  <p className="text-white/70 text-[7px] font-semibold truncate leading-tight">{ex.name}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Like / Dislike below thumbnails */}
                      <div className="flex items-center gap-2 px-2 pb-2 pt-1">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => handleLike(moment.id)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${likedMoments[moment.id] ? 'text-cyan-300' : 'text-white/40 hover:text-white/70'}`}
                          style={{ background: likedMoments[moment.id] ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${likedMoments[moment.id] ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)'}` }}
                        >
                          <ThumbsUp className="w-3 h-3" /> {moment.likes}
                        </motion.button>
                        <button className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-white/30 hover:text-white/60 transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <ThumbsUp className="w-3 h-3 rotate-180" />
                        </button>
                        <button
                          onClick={() => setOpenComment(openComment === moment.id ? null : moment.id)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-white/40 hover:text-white/70 transition-all ml-auto"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <MessageCircle className="w-3 h-3" /> {moment.comments.length} replies
                        </button>
                      </div>
                    </div>

                    {/* ── RIGHT COLUMN: comments panel ── */}
                    <div className="flex-1 flex flex-col border-l" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
                      {/* Scrollable comments */}
                      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-2 space-y-2" style={{ scrollbarWidth: 'none' }}>
                        {moment.comments.length === 0 ? (
                          <p className="text-white/20 text-xs text-center mt-4">No replies yet — be first!</p>
                        ) : (
                          moment.comments.map((c, ci) => (
                            <div key={ci} className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5" style={{ background: `hsl(${ci * 80 + 40},55%,28%)` }}>{c.user[0]}</div>
                              <div className="min-w-0 flex-1">
                                <p className="text-white/70 text-[10px] font-bold mb-0.5">{c.user}</p>
                                <p className="text-white/80 text-xs leading-relaxed">{c.text}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comment input — pinned to bottom */}
                      <div className="px-3 pb-3 pt-2 mt-auto">
                        <div className="flex gap-1.5">
                          <textarea
                            placeholder="Share your thoughts… 😄"
                            value={openComment === moment.id ? commentDraft : ''}
                            onChange={e => { setOpenComment(moment.id); setCommentDraft(e.target.value); }}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment(moment.id)}
                            rows={2}
                            className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] text-white/80 placeholder-white/25 bg-white/5 border border-white/10 outline-none focus:border-cyan-400/40 resize-none leading-relaxed"
                          />
                          <button onClick={() => handleAddComment(moment.id)} className="px-2.5 py-1.5 rounded-lg text-cyan-400 hover:text-cyan-200 transition-all self-end" style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
                            <Send className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </motion.div>
              ))}
              <div className="h-6" />
            </div>

            {/* RIGHT — Game Info Sidebar */}
            <div className="flex-shrink-0 w-[26%] border-l overflow-y-auto px-3 py-4 space-y-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.25)', scrollbarWidth: 'none' }}>

              {/* Online Status */}
              <div>
                <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-2">Status</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)] animate-pulse" />
                  <span className="text-green-400 text-xs font-bold">Online</span>
                  <span className="ml-auto text-white/40 text-[10px]">{mockPlayers.toLocaleString()} playing now</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Single Player', icon: '🎮', supported: true },
                    { label: 'Multiplayer', icon: '👥', supported: true },
                    { label: 'Co-op', icon: '🤝', supported: true },
                    { label: 'Cross-Play', icon: '🌐', supported: true },
                  ].map(m => (
                    <div key={m.label} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-sm">{m.icon}</span>
                      <span className="text-white/65 text-xs">{m.label}</span>
                      <span className="ml-auto text-[10px] font-bold" style={{ color: m.supported ? 'rgba(74,222,128,0.9)' : 'rgba(255,100,100,0.7)' }}>{m.supported ? '✓' : '✗'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Requirements */}
              <div>
                <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-2">Min. Requirements</p>
                <div className="space-y-1.5">
                  {[
                    { icon: Monitor, label: 'OS', val: game.system_requirements?.os || 'Windows 10 64-bit' },
                    { icon: Cpu, label: 'CPU', val: game.system_requirements?.processor || 'Intel i5-8600K' },
                    { icon: MemoryStick, label: 'RAM', val: game.system_requirements?.memory || '8 GB' },
                    { icon: Zap, label: 'GPU', val: game.system_requirements?.graphics || 'GTX 1060 6GB' },
                    { icon: HardDrive, label: 'Storage', val: game.system_requirements?.storage || '50 GB SSD' },
                  ].map(({ icon: Ic, label, val }) => (
                    <div key={label} className="flex items-start gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <Ic className="w-3 h-3 text-white/25 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-white/30 text-[9px] uppercase tracking-wider">{label}</p>
                        <p className="text-white/65 text-[10px] font-semibold leading-tight">{val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended */}
              <div>
                <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-2">Recommended</p>
                <div className="space-y-1.5">
                  {[
                    { icon: Monitor, label: 'OS', val: 'Windows 11 64-bit' },
                    { icon: Cpu, label: 'CPU', val: 'Intel i7-10700K' },
                    { icon: MemoryStick, label: 'RAM', val: '16 GB' },
                    { icon: Zap, label: 'GPU', val: 'RTX 3070 / RX 6800 XT' },
                    { icon: HardDrive, label: 'Storage', val: '50 GB NVMe SSD' },
                  ].map(({ icon: Ic, label, val }) => (
                    <div key={label} className="flex items-start gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <Ic className="w-3 h-3 text-white/25 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-white/30 text-[9px] uppercase tracking-wider">{label}</p>
                        <p className="text-white/65 text-[10px] font-semibold leading-tight">{val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-2">Languages</p>
                <div className="flex flex-wrap gap-1">
                  {['EN', 'ES', 'FR', 'DE', 'JA', 'KO', 'ZH', 'PT', 'RU', 'IT', 'PL', 'AR'].map(l => (
                    <span key={l} className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white/40" style={{ background: 'rgba(255,255,255,0.05)' }}>{l}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ REVIEWS TAB ══════════ */}
        {activeTab === 'reviews' && (
          <div className="h-full overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: 'none' }}>
            {/* Score hero */}
            <div className="rounded-2xl overflow-hidden" style={glassPanel}>
              <div className="p-4" style={{ background: 'linear-gradient(135deg, rgba(250,204,21,0.08) 0%, rgba(234,88,12,0.05) 100%)' }}>
                <div className="flex items-center gap-6">
                  <div className="text-center flex-shrink-0">
                    <div className="text-6xl font-black text-white" style={{ textShadow: '0 0 30px rgba(250,204,21,0.4)' }}>{avgRating}</div>
                    <ReviewStars rating={avgRating} />
                    <div className="text-white/35 text-[10px] mt-1">{mockPlayers.toLocaleString()} reviews</div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5,4,3,2,1].map(n => {
                      const pcts = [72,18,6,3,1];
                      const pct = pcts[5-n];
                      return (
                        <div key={n} className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <span className="text-white/40 text-xs w-2.5">{n}</span>
                            <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                          </div>
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, rgba(250,204,21,${0.4+pct/120}) 0%, rgba(234,88,12,0.6) 100%)` }} />
                          </div>
                          <span className="text-white/35 text-[10px] w-6 text-right flex-shrink-0">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* Sentiment tags */}
              <div className="px-4 pb-4 flex flex-wrap gap-1.5 mt-1">
                {[
                  { label: 'Great Visuals', count: '4.2K' },
                  { label: 'Deep Story', count: '3.8K' },
                  { label: 'Addictive', count: '3.1K' },
                  { label: 'Smooth Performance', count: '2.7K' },
                  { label: 'Great Value', count: '2.2K' },
                  { label: 'Active Devs', count: '1.9K' },
                ].map(t => (
                  <span key={t.label} className="px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)', color: 'rgba(253,224,71,0.8)' }}>
                    {t.label} · {t.count}
                  </span>
                ))}
              </div>
            </div>

            {/* Individual reviews */}
            {MOCK_REVIEWS.map((r, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={glassPanel}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center border border-white/15 flex-shrink-0" style={{ background: `linear-gradient(135deg, hsl(${i*60},60%,30%), hsl(${i*60+40},60%,20%))` }}>
                        <span className="text-white font-black text-sm">{r.user[0]}</span>
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm leading-none">{r.user}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <ReviewStars rating={r.rating} />
                          <span className="text-white/30 text-[10px]">{r.hours}h played</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-white/25 text-xs flex-shrink-0">{r.date}</span>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">{r.text}</p>
                  <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-white/30 text-[10px]">Was this helpful?</span>
                    <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-white/50 hover:text-white transition-all" style={glassCard}>👍 {r.helpful}</button>
                    <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-white/50 hover:text-white transition-all" style={glassCard}>👎</button>
                    <span className="ml-auto text-[10px] text-white/25">Report</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="h-4" />
          </div>
        )}


      </div>
    </motion.div>
  );
}

export default function StoreCategoryOverlay({ category, games, onClose }) {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState(null);
  const [fadingToDetail, setFadingToDetail] = useState(false);
  const [storeMode, setStoreMode] = useState(false);
  const [storePage, setStorePage] = useState(false);

  const cat = CATEGORIES.find(c => c.id === category);
  const filteredGames = useMemo(() => cat ? cat.filter(games) : [], [cat, games]);

  const handleViewFullPage = () => {
    setFadingToDetail(true);
    setTimeout(() => navigate(createPageUrl(`GameDetail?id=${selectedGame.id}`)), 350);
  };

  // Escape key handler
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (fadingToDetail) return;
        if (storePage) { setStorePage(false); return; }
        if (storeMode) { setStoreMode(false); return; }
        if (selectedGame) setSelectedGame(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedGame, onClose, fadingToDetail, storeMode, storePage]);

  if (!cat) return null;
  const Icon = cat.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-50 flex overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(10,14,20,0.98) 0%, rgba(15,20,30,0.99) 100%)', backdropFilter: 'blur(30px)' }}
    >
      {/* ═══ LEFT: Game List (80% or 15% collapsed) ═══ */}
        <motion.div
          animate={{ width: selectedGame ? '15%' : '80%' }}
          transition={{ duration: 0.3, type: 'spring', bounce: 0.1 }}
          className="h-full flex-shrink-0 flex flex-col overflow-hidden"
          style={{ borderRight: selectedGame ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-white/8 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
              <Icon className="w-4.5 h-4.5 text-white" />
            </div>
            {!selectedGame && (
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-black text-lg">{cat.label}</h2>
                <p className="text-white/35 text-xs">{filteredGames.length} games</p>
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              {selectedGame && (
                <button
                  onClick={() => setSelectedGame(null)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
                  title="Back to list"
                >
                  <ArrowLeft className="w-4 h-4 text-white/60" />
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/20 flex items-center justify-center transition-all"
                title="Close (Esc)"
              >
                <X className="w-4 h-4 text-white/50 hover:text-red-300" />
              </button>
            </div>
          </div>

          {/* Game list */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {filteredGames.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/20 gap-3">
                <Icon className="w-10 h-10 opacity-30" />
                <p className="text-sm">No games found</p>
              </div>
            ) : (
              <div className={selectedGame ? 'space-y-0' : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 p-4'}>
                {filteredGames.map((game) =>
                  selectedGame ? (
                    <motion.button
                      key={game.id}
                      onClick={() => setSelectedGame(game)}
                      whileHover={{ x: 2 }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all border-l-2 ${
                        selectedGame?.id === game.id
                          ? `border-l-cyan-400 bg-white/8 text-white`
                          : 'border-l-transparent text-white/50 hover:text-white hover:bg-white/4'
                      }`}
                    >
                      <img src={game.cover_image} alt="" className="w-7 h-9 object-cover rounded flex-shrink-0 border border-white/10" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold leading-tight line-clamp-2">{game.title}</p>
                      </div>
                    </motion.button>
                  ) : (
                    <motion.div
                      key={game.id}
                      whileHover={{ y: -6, scale: 1.02 }}
                      onClick={() => setSelectedGame(game)}
                      className="group aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border border-white/8 hover:border-cyan-400/30 shadow-lg relative bg-slate-900 transition-all"
                    >
                      <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h4 className="text-white font-bold text-sm leading-tight truncate">{game.title}</h4>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-white/40">{game.genre}</span>
                          <span className="text-green-400 font-bold">${game.price}</span>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-white/60" />
                      </div>
                    </motion.div>
                  )
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Player Interactions panel — 20% when no game selected */}
        <AnimatePresence>
          {!selectedGame && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '20%' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.3, type: 'spring', bounce: 0.1 }}
              className="h-full flex-shrink-0 overflow-hidden"
            >
              <PlayerInteractionsPanel />
            </motion.div>
          )}
        </AnimatePresence>

      {/* ═══ RIGHT: Game Detail (85%) ═══ */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: fadingToDetail ? 0 : 1, width: fadingToDetail ? 0 : '85%' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.35 }}
            className="h-full flex-1 overflow-hidden"
            style={{ background: 'rgba(8, 12, 18, 0.6)' }}
          >
            <AnimatePresence mode="wait">
              {storePage ? (
                <motion.div key="store-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="h-full">
                  <StoreGameDetailPanel gameId={selectedGame.id} onClose={() => setStorePage(false)} />
                </motion.div>
              ) : storeMode ? (
                <motion.div key={`store-${selectedGame.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="h-full">
                  <StoreGameDetailPanel gameId={selectedGame.id} onClose={() => setStoreMode(false)} />
                </motion.div>
              ) : (
                <GameDetailPanel key={selectedGame.id} game={selectedGame} onBack={() => setSelectedGame(null)} onViewFullPage={handleViewFullPage} onOpenStoreView={() => setStoreMode(true)} onOpenStorePage={() => setStorePage(true)} />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export { CATEGORIES };