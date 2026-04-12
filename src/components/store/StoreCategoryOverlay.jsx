import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowLeft, Star, ChevronRight, Flame, Sparkles, TrendingUp, Trophy, Gem, Clock,
  ShoppingCart, Heart, ExternalLink, Download, Users, Play, Monitor, Cpu, HardDrive,
  MemoryStick, Globe, Award, Zap, Info, Layers, Wifi, User, Bot, ChevronLeft
} from 'lucide-react';
import { useCart } from '@/components/CartContext';
import WishlistButton from './WishlistButton';

const CATEGORIES = [
  { id: 'recommended', label: 'Recommended', icon: Sparkles, color: 'from-purple-500 to-pink-500', accent: 'text-purple-300', filter: (games) => [...games].sort(() => Math.random() - 0.5).slice(0, 30) },
  { id: 'new_releases', label: 'New Releases', icon: Clock, color: 'from-cyan-500 to-blue-500', accent: 'text-cyan-300', filter: (games) => [...games].sort((a, b) => (b.original_year || 0) - (a.original_year || 0)).slice(0, 30) },
  { id: 'top_rated', label: 'Top Rated', icon: Trophy, color: 'from-yellow-500 to-orange-500', accent: 'text-yellow-300', filter: (games) => [...games].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 30) },
  { id: 'trending', label: 'Trending', icon: Flame, color: 'from-red-500 to-orange-500', accent: 'text-red-300', filter: (games) => [...games].sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 30) },
  { id: 'hidden_gems', label: 'Hidden Gems', icon: Gem, color: 'from-green-500 to-teal-500', accent: 'text-green-300', filter: (games) => games.filter(g => (g.rating || 0) < 4 && (g.rating || 0) > 3).slice(0, 30) },
];

const glassCard = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
};

function ReviewStars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
      ))}
    </div>
  );
}

const FALLBACK_SCREENSHOTS = [
  'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&q=80',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80',
  'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&q=80',
  'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=400&q=80',
];

function GamePreviewStrip({ game, onViewDetail, onClose }) {
  const { addToCart } = useCart();
  const screenshots = (game.screenshots && game.screenshots.length > 0) ? game.screenshots : FALLBACK_SCREENSHOTS;
  const avgRating = game.rating || 4.2;
  const mockDownloads = Math.floor((game.price || 20) * 1247 + 8432);

  return (
    <motion.div
      key={game.id}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="flex h-full gap-4 px-5 py-3"
    >
      {/* Cover - Centered vertically */}
      <div className="flex-shrink-0 relative rounded-xl overflow-hidden flex items-center justify-center" style={{ width: '70px', height: 'auto' }}>
        <img src={game.cover_image} alt={game.title} className="w-full h-auto object-cover" style={{ height: '120px' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Info column */}
      <div className="flex flex-col justify-center gap-1 min-w-0" style={{ width: '180px' }}>
        <h3 className="text-white font-black text-sm leading-tight truncate">{game.title}</h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          {game.genre && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase text-cyan-300" style={glassCard}>{game.genre}</span>}
          {game.original_year && <span className="text-white/35 text-[10px]">{game.original_year}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <ReviewStars rating={avgRating} />
          <span className="text-yellow-400 text-[10px] font-bold">{avgRating}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-green-400 font-black text-base">${game.price ?? '0.00'}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <button
            onClick={() => addToCart({ id: game.id, title: game.title, image: game.cover_image, price: game.price || 0, type: 'game' })}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
            style={{ background: 'rgba(0,200,255,0.18)', border: '1px solid rgba(0,200,255,0.30)', color: 'rgba(150,240,255,1)' }}
          >
            <ShoppingCart className="w-3 h-3" /> Add
          </button>
          <WishlistButton game={game} />
          <button
            onClick={onViewDetail}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white/60 hover:text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Info className="w-3 h-3" /> Details
          </button>
        </div>
      </div>

      {/* Screenshots strip */}
      <div className="flex items-center gap-2 flex-1 overflow-x-auto min-w-0" style={{ scrollbarWidth: 'none' }}>
        {screenshots.slice(0, 4).map((src, i) => (
          <div key={i} className="flex-shrink-0 rounded-lg overflow-hidden border border-white/10" style={{ width: '110px', height: '70px' }}>
            <img src={src} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        {(game.trailer_url || (game.video_urls && game.video_urls[0])) && (
          <div className="flex-shrink-0 rounded-lg overflow-hidden border border-cyan-400/30 relative group cursor-pointer" style={{ width: '110px', height: '70px' }}>
            <img src={game.cover_image} alt="Trailer" className="w-full h-full object-cover brightness-50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/40 transition-all">
                <Play className="w-3.5 h-3.5 text-white fill-white" />
              </div>
            </div>
            <span className="absolute bottom-1 left-1.5 text-[8px] text-white/70 font-bold">TRAILER</span>
          </div>
        )}
      </div>

      {/* Quick tags column */}
      <div className="flex-shrink-0 flex flex-col justify-center gap-1.5" style={{ width: '120px' }}>
        <p className="text-white/25 text-[8px] uppercase tracking-widest font-bold mb-0.5">Features</p>
        {[
          { icon: Users, label: 'Multiplayer', active: true },
          { icon: User, label: 'Single Player', active: true },
          { icon: Bot, label: 'AI Friendly', active: Math.random() > 0.5 },
          { icon: Wifi, label: 'Online', active: true },
        ].map(({ icon: Icon, label, active }) => (
          <div key={label} className={`flex items-center gap-1.5 text-[9px] ${active ? 'text-white/70' : 'text-white/25 line-through'}`}>
            <Icon className={`w-2.5 h-2.5 flex-shrink-0 ${active ? 'text-cyan-400' : 'text-white/20'}`} />
            {label}
          </div>
        ))}
        <div className="mt-1 pt-1 border-t border-white/10">
          <p className="text-white/25 text-[8px] uppercase tracking-widest font-bold mb-0.5">Developer</p>
          <p className="text-white/50 text-[9px]">Atom X Studios</p>
          <p className="text-white/25 text-[9px]">{mockDownloads.toLocaleString()} owners</p>
        </div>
      </div>

      <button onClick={onClose} className="flex-shrink-0 self-start w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
        <X className="w-3 h-3 text-white/50" />
      </button>
    </motion.div>
  );
}

const MOCK_REVIEWS = [
  { user: 'NeuroGamer', rating: 5, text: 'Absolutely stunning visuals and gameplay. One of the best titles of the decade.', date: '2 days ago', hours: 142, helpful: 847 },
  { user: 'ShadowAce', rating: 4, text: 'Great mechanics and tight combat. Story could be deeper but online modes make up for it.', date: '1 week ago', hours: 67, helpful: 312 },
  { user: 'CryptoKnight', rating: 5, text: 'Hours of content, amazing replayability. The online modes are fantastic.', date: '2 weeks ago', hours: 289, helpful: 1204 },
];

const MOCK_DLC = [
  { name: 'Expansion Pack I', desc: 'New campaign, 8 hours of story content.', price: 14.99, icon: '⚔️' },
  { name: 'Season Pass', desc: 'All future DLC included.', price: 29.99, icon: '🎟️' },
  { name: 'Cosmetic Pack', desc: 'Exclusive skins and avatar items.', price: 9.99, icon: '✨' },
];

function GameDetailPanel({ game, onBack }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const screenshots = (game.screenshots && game.screenshots.length > 0) ? game.screenshots : FALLBACK_SCREENSHOTS;
  const avgRating = game.rating || 4.2;
  const mockDownloads = Math.floor((game.price || 20) * 1247 + 8432);
  const mockAchievements = Math.floor((game.price || 10) * 3 + 12);

  return (
    <motion.div key={game.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: 'rgba(6,10,18,0.98)', zIndex: 10 }}>
      {/* Hero */}
      <div className="relative flex-shrink-0 h-44 overflow-hidden">
        <img src={game.banner_image || game.cover_image} alt={game.title} className="w-full h-full object-cover" style={{ filter: 'brightness(0.65) saturate(1.2)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(6,10,18,0.98) 100%)' }} />
        <button onClick={onBack} className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/70 hover:text-white transition-all" style={glassCard}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button onClick={() => navigate(createPageUrl(`GameDetail?id=${game.id}`))} className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-cyan-300 hover:text-cyan-100 transition-all" style={{ ...glassCard, border: '1px solid rgba(100,220,255,0.25)' }}>
          <ExternalLink className="w-3.5 h-3.5" /> Full Page
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-3">
          <img src={game.cover_image} alt="" className="w-14 rounded-xl border border-white/20 shadow-2xl flex-shrink-0" style={{ height: '76px', objectFit: 'cover' }} />
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-black text-lg leading-tight mb-1">{game.title}</h2>
            <div className="flex items-center flex-wrap gap-2">
              {game.genre && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-cyan-300" style={glassCard}>{game.genre}</span>}
              {game.original_year && <span className="text-white/40 text-xs">{game.original_year}</span>}
              <div className="flex items-center gap-1"><ReviewStars rating={avgRating} /><span className="text-yellow-400 text-xs font-bold ml-0.5">{avgRating}</span></div>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-xl font-black text-green-400">${game.price ?? '0.00'}</div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex-shrink-0 flex gap-2 px-4 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { icon: Download, label: 'Downloads', value: mockDownloads.toLocaleString(), color: 'text-cyan-400' },
          { icon: Users, label: 'Players', value: Math.floor(mockDownloads * 0.3).toLocaleString(), color: 'text-purple-400' },
          { icon: Trophy, label: 'Achievements', value: mockAchievements, color: 'text-yellow-400' },
          { icon: Clock, label: 'Avg Play', value: '52h', color: 'text-blue-400' },
          { icon: Globe, label: 'Languages', value: '24', color: 'text-green-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-xl flex-shrink-0" style={glassCard}>
            <Icon className={`w-3 h-3 ${color} flex-shrink-0`} />
            <div>
              <div className="text-white font-black text-xs leading-none">{value}</div>
              <div className="text-white/30 text-[9px] uppercase tracking-wider mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 px-4 py-2 flex items-center gap-2 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => addToCart({ id: game.id, title: game.title, image: game.cover_image, price: game.price || 0, type: 'game' })} className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-black transition-all hover:scale-105" style={{ background: 'rgba(0,200,255,0.18)', border: '1px solid rgba(0,200,255,0.30)', color: 'rgba(150,240,255,1)' }}>
          <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
        </button>
        {game.play_link && <a href={game.play_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-black" style={{ background: 'rgba(100,255,150,0.15)', border: '1px solid rgba(100,255,150,0.25)', color: 'rgba(150,255,180,1)' }}><Play className="w-3.5 h-3.5" /> Play</a>}
        <WishlistButton game={game} />
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {['overview', 'media', 'reviews', 'requirements'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest capitalize relative transition-all ${activeTab === tab ? 'text-cyan-300' : 'text-white/30 hover:text-white/60'}`}>
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full" />}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'none' }}>
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {game.description && <p className="text-white/70 text-sm leading-relaxed">{game.description}</p>}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {[
                { label: 'Genre', value: game.genre || 'Unknown' },
                { label: 'Released', value: game.original_year || '—' },
                { label: 'Status', value: (game.status || 'available').replace(/_/g,' ') },
                { label: 'Avg. Playtime', value: '52h' },
                { label: 'Multiplayer', value: 'Yes' },
                { label: 'AI Friendly', value: 'Yes' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-white/30 text-xs">{label}</span>
                  <span className="text-white/80 text-xs font-semibold">{value}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-2">DLC</p>
              {MOCK_DLC.map(dlc => (
                <div key={dlc.name} className="flex items-center gap-3 py-2 border-b border-white/5">
                  <span>{dlc.icon}</span>
                  <div className="flex-1"><p className="text-white/80 text-xs font-semibold">{dlc.name}</p><p className="text-white/35 text-[10px]">{dlc.desc}</p></div>
                  <span className="text-green-400 font-black text-sm">${dlc.price}</span>
                </div>
              ))}
            </div>
            {game.tags && game.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {game.tags.map(tag => <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] text-white/50" style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)' }}>{tag}</span>)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <img src={screenshots[activeScreenshot]} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {screenshots.map((src, i) => (
                <div key={i} onClick={() => setActiveScreenshot(i)} className={`flex-shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${i === activeScreenshot ? 'border-cyan-400' : 'border-transparent opacity-60'}`} style={{ width: '80px', height: '52px' }}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            {(game.trailer_url || (game.video_urls && game.video_urls[0])) && (
              <div className="aspect-video rounded-xl overflow-hidden border border-white/10">
                <iframe src={(game.trailer_url || game.video_urls[0]).replace('watch?v=', 'embed/')} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title="Trailer" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div><div className="text-4xl font-black text-white">{avgRating}</div><ReviewStars rating={avgRating} /></div>
              <div className="flex-1 space-y-1">
                {[5,4,3,2,1].map(n => {
                  const pct = [72,18,6,3,1][5-n];
                  return (
                    <div key={n} className="flex items-center gap-2">
                      <span className="text-white/30 text-[10px] w-3">{n}</span>
                      <div className="flex-1 h-1 rounded-full overflow-hidden bg-white/10"><div className="h-full rounded-full bg-yellow-400/60" style={{ width: `${pct}%` }} /></div>
                      <span className="text-white/25 text-[10px] w-6">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {MOCK_REVIEWS.map((r, i) => (
              <div key={i} className="py-3 border-b border-white/6">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">{r.user[0]}</div>
                  <span className="text-white/80 text-sm font-bold">{r.user}</span>
                  <ReviewStars rating={r.rating} />
                  <span className="text-white/25 text-[10px] ml-auto">{r.date}</span>
                </div>
                <p className="text-white/60 text-sm leading-relaxed pl-8">{r.text}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'requirements' && (
          <div className="space-y-4">
            {['Minimum', 'Recommended'].map(tier => (
              <div key={tier}>
                <p className="text-white/35 text-[9px] uppercase tracking-widest font-bold mb-2">{tier}</p>
                {[
                  { icon: Monitor, label: 'OS', min: game.system_requirements?.os || 'Windows 10 64-bit', rec: 'Windows 11 64-bit' },
                  { icon: Cpu, label: 'CPU', min: game.system_requirements?.processor || 'Intel i5-8600K', rec: 'Intel i7-10700K' },
                  { icon: MemoryStick, label: 'RAM', min: game.system_requirements?.memory || '8 GB', rec: '16 GB' },
                  { icon: Zap, label: 'GPU', min: game.system_requirements?.graphics || 'GTX 1060', rec: 'RTX 3070' },
                  { icon: HardDrive, label: 'Storage', min: game.system_requirements?.storage || '50 GB SSD', rec: '50 GB NVMe' },
                ].map(({ icon: Icon, label, min, rec }) => (
                  <div key={label} className="flex items-center gap-3 py-2 border-b border-white/5">
                    <Icon className="w-3 h-3 text-white/25 flex-shrink-0" />
                    <span className="text-white/35 text-xs w-12 flex-shrink-0">{label}</span>
                    <span className="text-white/70 text-xs">{tier === 'Minimum' ? min : rec}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        <div className="h-6" />
      </div>
    </motion.div>
  );
}

export default function StoreCategoryOverlay({ category, games, onClose }) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const cat = CATEGORIES.find(c => c.id === category);
  const filteredGames = useMemo(() => cat ? cat.filter(games) : [], [cat, games]);

  const avgRating = selectedGame?.rating || 4.2;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (showDetail) setShowDetail(false);
        else if (selectedGame) setSelectedGame(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showDetail, selectedGame, onClose]);

  if (!cat) return null;
  const Icon = cat.icon;

  const handleGameClick = (game) => {
    if (selectedGame?.id === game.id) {
      setShowDetail(true);
    } else {
      setSelectedGame(game);
      setShowDetail(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(10,14,20,0.98) 0%, rgba(15,20,30,0.99) 100%)', backdropFilter: 'blur(30px)' }}
    >
      {/* Full detail overlay */}
      <AnimatePresence>
        {showDetail && selectedGame && (
          <GameDetailPanel game={selectedGame} onBack={() => setShowDetail(false)} />
        )}
      </AnimatePresence>

      {/* TOP 30%: Header + Preview strip */}
      <div className="flex-shrink-0" style={{ height: '30%', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Category header bar */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2 flex-shrink-0">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-white font-black text-base leading-none">{cat.label}</h2>
            <p className="text-white/35 text-[10px]">{filteredGames.length} games · click once to preview, click again for full details</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/20 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-white/50 hover:text-red-300" />
          </button>
        </div>

        {/* Preview strip */}
        <div className="flex-1 overflow-hidden" style={{ height: 'calc(100% - 52px)' }}>
          <AnimatePresence mode="wait">
            {selectedGame ? (
              <GamePreviewStrip
                key={selectedGame.id}
                game={selectedGame}
                onViewDetail={() => setShowDetail(true)}
                onClose={() => setSelectedGame(null)}
              />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full text-white/20 text-sm gap-2"
              >
                <Icon className="w-4 h-4 opacity-40" />
                Select a game below to preview
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* BOTTOM 70%: Split 70% games | 30% details */}
      <div className="flex-1 flex overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Left 70%: Game Grid */}
        <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'none', width: '70%' }}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {filteredGames.map((game) => {
              const isSelected = selectedGame?.id === game.id;
              return (
                <motion.div
                  key={game.id}
                  whileHover={{ y: -4, scale: 1.04 }}
                  onClick={() => handleGameClick(game)}
                  className={`group cursor-pointer rounded-xl overflow-hidden border transition-all relative bg-slate-900 ${isSelected ? 'border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'border-white/8 hover:border-cyan-400/30'}`}
                  style={{ aspectRatio: '3/4' }}
                >
                  <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center">
                      <Info className="w-2.5 h-2.5 text-black" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-1.5">
                    <h4 className="text-white font-bold text-[9px] leading-tight truncate">{game.title}</h4>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-white/35 text-[8px]">{game.genre}</span>
                      <span className="text-green-400 font-bold text-[9px]">${game.price}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right 30%: Details Panel - Split Layout */}
        {selectedGame ? (
          <div className="overflow-y-auto p-4" style={{ scrollbarWidth: 'none', width: '30%', background: 'rgba(10,14,20,0.5)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex flex-col gap-4 h-full">
              {/* Left Column: Features & Info */}
              <div>
                <div className="mb-4">
                  <div className="flex items-center gap-1 mb-2"><ReviewStars rating={avgRating} /><span className="text-yellow-400 text-xs font-bold">{avgRating}</span></div>
                </div>

                {/* Game Features */}
                <div className="mb-4">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-2">Features</p>
                  {[
                    { icon: Users, label: 'Multiplayer', active: true },
                    { icon: User, label: 'Single Player', active: true },
                    { icon: Wifi, label: 'Online', active: true },
                  ].map(({ icon: Icon, label, active }) => (
                    <div key={label} className="flex items-center gap-2 py-1.5 text-white/60 text-[9px]">
                      <Icon className="w-3 h-3 flex-shrink-0" />
                      {label}
                    </div>
                  ))}
                </div>

                {/* Recommendation */}
                <div className="flex items-center gap-2 py-2 px-2 rounded-lg" style={{ background: 'rgba(100,255,150,0.1)', border: '1px solid rgba(100,255,150,0.2)' }}>
                  <div className="w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center text-green-400 text-xs font-bold flex-shrink-0">92%</div>
                  <div>
                    <p className="text-white/80 text-[9px] font-bold">Recommended</p>
                    <p className="text-white/40 text-[8px]">Players recommend</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Screenshots, Video & Reviews */}
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Screenshots */}
                <div>
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-2">Screenshots</p>
                  <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {(selectedGame.screenshots && selectedGame.screenshots.length > 0 ? selectedGame.screenshots : FALLBACK_SCREENSHOTS).slice(0, 3).map((src, i) => (
                      <div key={i} className="flex-shrink-0 rounded-lg overflow-hidden border border-white/10" style={{ width: '70px', height: '50px' }}>
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Video/Trailer */}
                {(selectedGame.trailer_url || (selectedGame.video_urls && selectedGame.video_urls[0])) && (
                  <div>
                    <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-2">Trailer</p>
                    <div className="rounded-lg overflow-hidden border border-white/10" style={{ aspectRatio: '16/9' }}>
                      <iframe src={(selectedGame.trailer_url || selectedGame.video_urls[0]).replace('watch?v=', 'embed/')} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title="Trailer" />
                    </div>
                  </div>
                )}

                {/* Reviews Section */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-2">Reviews</p>
                  <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    {MOCK_REVIEWS.slice(0, 2).map((r, i) => (
                      <div key={i} className="py-2 border-b border-white/6">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold">{r.user[0]}</div>
                          <span className="text-white/70 text-[10px] font-bold line-clamp-1">{r.user}</span>
                          <ReviewStars rating={r.rating} />
                        </div>
                        <p className="text-white/50 text-[9px] leading-tight pl-6 line-clamp-2">{r.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center" style={{ width: '30%', background: 'rgba(10,14,20,0.5)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-white/20 text-sm">Select a game</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export { CATEGORIES };