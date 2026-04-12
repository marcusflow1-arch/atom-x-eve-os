import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Star, ChevronRight, Flame, Sparkles, TrendingUp, Trophy, Gem, Clock, ShoppingCart, Heart, ExternalLink, Download, Users, Play, Monitor, Cpu, HardDrive, MemoryStick, Tag, Globe, Award, Zap, Image, Info, ChevronLeft } from 'lucide-react';
import { useCart } from '@/components/CartContext';
import WishlistButton from './WishlistButton';

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

function ScreenshotGallery({ screenshots }) {
  const [active, setActive] = useState(0);
  if (!screenshots || screenshots.length === 0) return null;
  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden aspect-video mb-2" style={glassCard}>
        <img src={screenshots[active]} alt="Screenshot" className="w-full h-full object-cover" />
        {screenshots.length > 1 && (
          <>
            <button onClick={() => setActive(p => Math.max(0, p-1))} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-all"><ChevronLeft className="w-4 h-4 text-white" /></button>
            <button onClick={() => setActive(p => Math.min(screenshots.length-1, p+1))} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-all"><ChevronRight className="w-4 h-4 text-white" /></button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {screenshots.map((_, i) => <div key={i} onClick={() => setActive(i)} className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all ${i === active ? 'bg-cyan-400 scale-125' : 'bg-white/30'}`} />)}
            </div>
          </>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {screenshots.map((src, i) => (
          <img key={i} src={src} alt="" onClick={() => setActive(i)} className={`w-20 h-12 object-cover rounded-lg flex-shrink-0 cursor-pointer border-2 transition-all ${i === active ? 'border-cyan-400' : 'border-transparent opacity-50 hover:opacity-80'}`} />
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
  { user: 'NeuroGamer', rating: 5, text: 'Absolutely stunning visuals and gameplay. One of the best titles of the decade.', date: '2 days ago' },
  { user: 'ShadowAce', rating: 4, text: 'Great mechanics, story could be deeper. Still a must-play for genre fans.', date: '1 week ago' },
  { user: 'CryptoKnight', rating: 5, text: 'Hours of content, amazing replayability. The online modes are fantastic.', date: '2 weeks ago' },
];

function GameDetailPanel({ game, onBack }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  if (!game) return null;

  const mockDownloads = Math.floor((game.price || 20) * 1247 + 8432);
  const mockPlayers = Math.floor(mockDownloads * 0.3);
  const mockAchievements = Math.floor((game.price || 10) * 3 + 12);
  const tabs = ['overview', 'screenshots', 'reviews', 'requirements'];

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
      <div className="relative flex-shrink-0 h-56 overflow-hidden">
        <img src={game.banner_image || game.cover_image} alt={game.title} className="w-full h-full object-cover scale-105" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(5,8,15,0.92) 100%)' }} />
        {/* Liquid glass shimmer overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, rgba(180,200,255,0.05) 0%, transparent 50%, rgba(100,180,255,0.03) 100%)' }} />

        {/* Back button */}
        <button onClick={onBack} className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-white/70 hover:text-white transition-all" style={glassCard}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {/* Store Page button */}
        <button onClick={() => navigate(createPageUrl(`GameDetail?id=${game.id}`))} className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-cyan-300 hover:text-white transition-all" style={{ ...glassCard, border: '1px solid rgba(100,220,255,0.25)' }}>
          <ExternalLink className="w-3.5 h-3.5" /> Full Store Page
        </button>

        {/* Game identity */}
        <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end gap-4">
          <img src={game.cover_image} alt="" className="w-20 h-26 object-cover rounded-xl border border-white/20 shadow-2xl flex-shrink-0" style={{ height: '104px' }} />
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-black text-2xl leading-tight mb-1" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>{game.title}</h2>
            <div className="flex items-center flex-wrap gap-2">
              {game.genre && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ ...glassCard, color: 'rgba(150,220,255,0.9)' }}>{game.genre}</span>}
              {game.original_year && <span className="text-white/40 text-xs">{game.original_year}</span>}
              {game.status && <span className="px-2.5 py-0.5 rounded-full text-xs capitalize" style={{ ...glassCard, color: game.status === 'available' ? 'rgba(100,255,150,0.85)' : 'rgba(255,200,80,0.85)' }}>{game.status.replace(/_/g, ' ')}</span>}
              {game.rating && <div className="flex items-center gap-1"><ReviewStars rating={game.rating} /><span className="text-yellow-400 text-xs font-bold">{game.rating}</span></div>}
            </div>
          </div>
          {/* Price block */}
          <div className="flex-shrink-0 text-right">
            <div className="text-3xl font-black text-green-400" style={{ textShadow: '0 0 20px rgba(74,222,128,0.4)' }}>${game.price || '0.00'}</div>
            <div className="text-white/30 text-xs">USD</div>
          </div>
        </div>
      </div>

      {/* ── STAT ROW ── */}
      <div className="flex-shrink-0 px-5 py-3 flex gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <StatBadge icon={Download} label="Downloads" value={mockDownloads.toLocaleString()} accent="text-cyan-400" />
        <StatBadge icon={Users} label="Players" value={mockPlayers.toLocaleString()} accent="text-purple-400" />
        <StatBadge icon={Award} label="Achievements" value={mockAchievements} accent="text-yellow-400" />
        <StatBadge icon={Star} label="Rating" value={game.rating || 'N/A'} accent="text-yellow-400" />
        {game.original_year && <StatBadge icon={Clock} label="Released" value={game.original_year} accent="text-blue-400" />}
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="flex-shrink-0 px-5 pb-3 flex items-center gap-2 flex-wrap">
        <button onClick={() => addToCart({ id: game.id, title: game.title, image: game.cover_image, price: game.price || 0, type: 'game' })} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, rgba(0,200,255,0.25), rgba(100,100,255,0.20))', border: '1px solid rgba(0,200,255,0.35)', color: 'rgba(150,240,255,1)', boxShadow: '0 0 20px rgba(0,200,255,0.15)' }}>
          <ShoppingCart className="w-4 h-4" /> Add to Cart
        </button>
        {game.play_link && (
          <a href={game.play_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, rgba(100,255,150,0.20), rgba(0,200,100,0.15))', border: '1px solid rgba(100,255,150,0.30)', color: 'rgba(150,255,180,1)' }}>
            <Play className="w-4 h-4" /> Play Now
          </a>
        )}
        <WishlistButton game={game} />
      </div>

      {/* ── TABS ── */}
      <div className="flex-shrink-0 px-5 flex gap-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all capitalize ${
            activeTab === tab
              ? 'text-cyan-300 border-b-2 border-cyan-400'
              : 'text-white/40 hover:text-white/70'
          }`}>{tab}</button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5" style={{ scrollbarWidth: 'none' }}>

        {activeTab === 'overview' && (
          <>
            {/* Description */}
            {game.description && (
              <div className="rounded-2xl p-4" style={glassPanel}>
                <div className="flex items-center gap-2 mb-3"><Info className="w-3.5 h-3.5 text-cyan-400" /><span className="text-white/50 text-[10px] uppercase tracking-widest font-bold">About This Game</span></div>
                <p className="text-white/75 text-sm leading-relaxed">{game.description}</p>
              </div>
            )}

            {/* Tags */}
            {game.tags && game.tags.length > 0 && (
              <div className="rounded-2xl p-4" style={glassPanel}>
                <div className="flex items-center gap-2 mb-3"><Tag className="w-3.5 h-3.5 text-purple-400" /><span className="text-white/50 text-[10px] uppercase tracking-widest font-bold">Tags</span></div>
                <div className="flex flex-wrap gap-1.5">
                  {game.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs text-white/60 font-medium" style={glassCard}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Trailer */}
            {(game.trailer_url || (game.video_urls && game.video_urls[0])) && (
              <div className="rounded-2xl overflow-hidden" style={glassPanel}>
                <div className="flex items-center gap-2 p-4 pb-2"><Play className="w-3.5 h-3.5 text-red-400" /><span className="text-white/50 text-[10px] uppercase tracking-widest font-bold">Trailer</span></div>
                <div className="aspect-video">
                  <iframe src={(game.trailer_url || game.video_urls[0]).replace('watch?v=', 'embed/')} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title="Trailer" />
                </div>
              </div>
            )}

            {/* Achievements preview */}
            <div className="rounded-2xl p-4" style={glassPanel}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Trophy className="w-3.5 h-3.5 text-yellow-400" /><span className="text-white/50 text-[10px] uppercase tracking-widest font-bold">Achievements</span></div>
                <span className="text-yellow-400 text-xs font-bold">{mockAchievements} Total</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['First Blood', 'Speed Runner', 'Completionist', 'Legend', 'Explorer', 'Veteran'].slice(0, 6).map((ach, i) => (
                  <div key={ach} className="flex items-center gap-2 p-2 rounded-xl" style={glassCard}>
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-500/30 to-orange-500/20 flex items-center justify-center flex-shrink-0 border border-yellow-500/20">
                      <Award className="w-3.5 h-3.5 text-yellow-400" />
                    </div>
                    <span className="text-white/60 text-[10px] font-medium leading-tight">{ach}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'screenshots' && (
          <div className="rounded-2xl p-4" style={glassPanel}>
            {game.screenshots && game.screenshots.length > 0 ? (
              <ScreenshotGallery screenshots={game.screenshots} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-white/20">
                <Image className="w-10 h-10" />
                <p className="text-sm">No screenshots available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-3">
            {/* Summary */}
            <div className="rounded-2xl p-4 flex items-center gap-6" style={glassPanel}>
              <div className="text-center">
                <div className="text-5xl font-black text-white">{game.rating || '4.2'}</div>
                <ReviewStars rating={game.rating || 4.2} />
                <div className="text-white/30 text-xs mt-1">{mockPlayers.toLocaleString()} reviews</div>
              </div>
              <div className="flex-1 space-y-1">
                {[5,4,3,2,1].map(n => (
                  <div key={n} className="flex items-center gap-2">
                    <span className="text-white/40 text-xs w-2">{n}</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={glassCard}>
                      <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400" style={{ width: `${[72,18,6,3,1][5-n]}%`, opacity: 0.8 }} />
                    </div>
                    <span className="text-white/30 text-xs w-6 text-right">{[72,18,6,3,1][5-n]}%</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Individual reviews */}
            {MOCK_REVIEWS.map((r, i) => (
              <div key={i} className="rounded-2xl p-4" style={glassPanel}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/40 to-purple-500/40 flex items-center justify-center border border-white/10">
                      <span className="text-white font-bold text-xs">{r.user[0]}</span>
                    </div>
                    <span className="text-white/80 text-sm font-bold">{r.user}</span>
                  </div>
                  <span className="text-white/25 text-xs">{r.date}</span>
                </div>
                <ReviewStars rating={r.rating} />
                <p className="text-white/60 text-sm mt-2 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'requirements' && (
          <div className="rounded-2xl p-4 space-y-4" style={glassPanel}>
            <div className="flex items-center gap-2 mb-1"><Monitor className="w-3.5 h-3.5 text-blue-400" /><span className="text-white/50 text-[10px] uppercase tracking-widest font-bold">System Requirements</span></div>
            {game.system_requirements && Object.keys(game.system_requirements).length > 0 ? (
              Object.entries(game.system_requirements).map(([key, val]) => (
                <div key={key} className="flex items-start gap-3 p-3 rounded-xl" style={glassCard}>
                  {key === 'os' && <Monitor className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />}
                  {key === 'processor' && <Cpu className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />}
                  {key === 'memory' && <MemoryStick className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />}
                  {key === 'storage' && <HardDrive className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />}
                  {!['os','processor','memory','storage'].includes(key) && <Zap className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-0.5 capitalize">{key}</p>
                    <p className="text-white/75 text-sm">{val}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-2">
                {[{ icon: Monitor, label: 'OS', val: 'Windows 10 / 11 (64-bit)' }, { icon: Cpu, label: 'Processor', val: 'Intel Core i5-8600K / AMD Ryzen 5 3600' }, { icon: MemoryStick, label: 'Memory', val: '8 GB RAM' }, { icon: HardDrive, label: 'Storage', val: '50 GB SSD' }].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-xl" style={glassCard}>
                    <Icon className="w-4 h-4 text-white/40 flex-shrink-0" />
                    <div>
                      <p className="text-white/35 text-[10px] uppercase tracking-wider font-bold">{label}</p>
                      <p className="text-white/70 text-sm">{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function StoreCategoryOverlay({ category, games, onClose }) {
  const [selectedGame, setSelectedGame] = useState(null);

  const cat = CATEGORIES.find(c => c.id === category);
  const filteredGames = useMemo(() => cat ? cat.filter(games) : [], [cat, games]);

  // Escape key handler
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (selectedGame) setSelectedGame(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedGame, onClose]);

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
      {/* ═══ LEFT: Game List (15% when game selected, 100% when not) ═══ */}
      <motion.div
        animate={{ width: selectedGame ? '15%' : '100%' }}
        transition={{ duration: 0.3, type: 'spring', bounce: 0.1 }}
        className="h-full flex-shrink-0 flex flex-col overflow-hidden"
        style={{ borderRight: selectedGame ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
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
                  /* Compact list row when game selected */
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
                  /* Grid card when no game selected */
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

      {/* ═══ RIGHT: Game Detail (85%) ═══ */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '85%' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3, type: 'spring', bounce: 0.1 }}
            className="h-full flex-1 overflow-hidden"
            style={{ background: 'rgba(8, 12, 18, 0.6)' }}
          >
            <AnimatePresence mode="wait">
              <GameDetailPanel key={selectedGame.id} game={selectedGame} onBack={() => setSelectedGame(null)} />
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export { CATEGORIES };