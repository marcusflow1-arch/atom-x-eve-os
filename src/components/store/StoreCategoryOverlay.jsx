import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Star, ChevronRight, Flame, Sparkles, TrendingUp, Trophy, Gem, Clock, ShoppingCart, Heart, ExternalLink, Download, Users, Play, Monitor, Cpu, HardDrive, MemoryStick, Tag, Globe, Award, Zap, Info, ChevronLeft, Layers } from 'lucide-react';
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

function GameDetailPanel({ game, onBack }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  if (!game) return null;

  const mockDownloads = Math.floor((game.price || 20) * 1247 + 8432);
  const mockPlayers = Math.floor(mockDownloads * 0.3);
  const mockAchievements = Math.floor((game.price || 10) * 3 + 12);
  const avgRating = game.rating || 4.2;
  const tabs = ['overview', 'reviews', 'requirements'];

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
        <button onClick={() => navigate(createPageUrl(`GameDetail?id=${game.id}`))} className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-cyan-300 hover:text-cyan-100 transition-all" style={{ ...glassCard, border: '1px solid rgba(100,220,255,0.25)' }}>
          <ExternalLink className="w-3.5 h-3.5" /> Full Page
        </button>
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
      <div className="flex-shrink-0 px-4 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { icon: Download, label: 'Downloads', value: mockDownloads.toLocaleString(), color: 'text-cyan-400' },
          { icon: Users, label: 'Active Players', value: mockPlayers.toLocaleString(), color: 'text-purple-400' },
          { icon: Trophy, label: 'Achievements', value: mockAchievements, color: 'text-yellow-400' },
          { icon: Star, label: 'Rating', value: avgRating, color: 'text-yellow-400' },
          { icon: Clock, label: 'Avg Playtime', value: '52h', color: 'text-blue-400' },
          { icon: Globe, label: 'Languages', value: '24', color: 'text-green-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl flex-shrink-0" style={glassCard}>
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
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full" />}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="flex-1 overflow-hidden">

        {/* OVERVIEW: 85/15 split */}
        {activeTab === 'overview' && (
          <div className="flex h-full">
            {/* LEFT 85% */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="px-5 py-4 space-y-0">

                {/* About */}
                {game.description && (
                  <div className="pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-white/35 text-[9px] uppercase tracking-widest font-bold mb-2">About</p>
                    <p className="text-white/75 text-sm leading-relaxed">{game.description}</p>
                    <p className="text-white/45 text-sm leading-relaxed mt-2">Experience a groundbreaking open world filled with dynamic events, reactive AI, and a narrative that responds to every choice you make — whether you prefer stealth, combat, or diplomacy.</p>
                  </div>
                )}

                {/* Quick info row */}
                <div className="py-4 flex flex-wrap gap-x-6 gap-y-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {[
                    { label: 'Genre', value: game.genre || 'Unknown' },
                    { label: 'Released', value: game.original_year || '—' },
                    { label: 'Status', value: (game.status || 'available').replace(/_/g,' ') },
                    { label: 'Avg. Playtime', value: '52h' },
                    { label: 'Languages', value: '24' },
                    { label: 'Players Online', value: mockPlayers.toLocaleString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-white/30 text-xs">{label}</span>
                      <span className="text-white/80 text-xs font-semibold">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Key Features — inline list */}
                <div className="py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-white/35 text-[9px] uppercase tracking-widest font-bold mb-3">Key Features</p>
                  <div className="space-y-2">
                    {[
                      { icon: '🌍', title: 'Open World', desc: '400km² of seamless hand-crafted terrain' },
                      { icon: '🤖', title: 'Dynamic AI', desc: 'Enemies adapt to your playstyle in real time' },
                      { icon: '⚡', title: 'Ray Tracing', desc: 'Next-gen lighting, reflections and global illumination' },
                      { icon: '🎭', title: 'Story Branching', desc: '5 unique endings — 28 major decisions matter' },
                      { icon: '🌐', title: 'Cross-Play', desc: 'PC, Console & Cloud play together seamlessly' },
                      { icon: '🏆', title: 'Live Events', desc: 'Weekly community challenges with exclusive rewards' },
                    ].map((f, i, arr) => (
                      <div key={f.title} className="flex items-center gap-3 py-1.5" style={i < arr.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}>
                        <span className="text-base w-5 flex-shrink-0">{f.icon}</span>
                        <span className="text-white/85 text-xs font-semibold w-28 flex-shrink-0">{f.title}</span>
                        <span className="text-white/40 text-xs">{f.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content at a Glance */}
                <div className="py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-white/35 text-[9px] uppercase tracking-widest font-bold mb-3">Content at a Glance</p>
                  <div className="flex flex-wrap gap-x-8 gap-y-2">
                    {MOCK_CONTENT.map(c => (
                      <div key={c.label} className="flex items-center gap-2">
                        <span className="text-sm">{c.icon}</span>
                        <span className="text-white font-black text-sm">{c.value}</span>
                        <span className="text-white/35 text-xs">{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trailer */}
                {(game.trailer_url || (game.video_urls && game.video_urls[0])) && (
                  <div className="py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-white/35 text-[9px] uppercase tracking-widest font-bold mb-3">Official Trailer</p>
                    <div className="aspect-video rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                      <iframe src={(game.trailer_url || game.video_urls[0]).replace('watch?v=', 'embed/')} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title="Trailer" />
                    </div>
                  </div>
                )}

                {/* Achievements */}
                <div className="py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white/35 text-[9px] uppercase tracking-widest font-bold">Achievements <span className="text-yellow-400 normal-case">· {mockAchievements} total</span></p>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400" style={{ width: '18%' }} />
                      </div>
                      <span className="text-white/30 text-[10px]">18% avg</span>
                    </div>
                  </div>
                  <div className="space-y-0">
                    {[
                      { name: 'First Blood', rarity: 'Common', pct: '89%', icon: '⚔️' },
                      { name: 'Speed Runner', rarity: 'Rare', pct: '12%', icon: '⚡' },
                      { name: 'Completionist', rarity: 'Legendary', pct: '2.1%', icon: '💎' },
                      { name: 'Shadow Master', rarity: 'Epic', pct: '6.4%', icon: '🌑' },
                      { name: 'World Explorer', rarity: 'Uncommon', pct: '44%', icon: '🗺️' },
                      { name: 'The Legend', rarity: 'Mythic', pct: '0.3%', icon: '👑' },
                    ].map((ach, i, arr) => (
                      <div key={ach.name} className="flex items-center gap-3 py-2" style={i < arr.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}>
                        <span className="w-5 text-sm flex-shrink-0">{ach.icon}</span>
                        <span className="text-white/80 text-xs font-semibold flex-1">{ach.name}</span>
                        <span className="text-white/30 text-[10px] w-16">{ach.rarity}</span>
                        <span className="text-white/40 text-[10px] w-10 text-right">{ach.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DLC */}
                <div className="py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-white/35 text-[9px] uppercase tracking-widest font-bold mb-3">DLC &amp; Expansions <span className="text-pink-400 normal-case">· 4 available</span></p>
                  <div className="space-y-0">
                    {MOCK_DLC.map((dlc, i, arr) => (
                      <div key={dlc.name} className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-white/[0.03] -mx-2 px-2 rounded-lg transition-all" style={i < arr.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}>
                        <span className="text-base w-5 flex-shrink-0">{dlc.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-white/85 text-xs font-semibold">{dlc.name}</span>
                          <span className="text-white/30 text-[10px] ml-2">{dlc.type}</span>
                          <p className="text-white/35 text-[10px] mt-0.5">{dlc.desc}</p>
                        </div>
                        <span className="text-green-400 font-black text-sm flex-shrink-0">${dlc.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Community */}
                <div className="py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-white/35 text-[9px] uppercase tracking-widest font-bold mb-3">Community</p>
                  <div className="flex flex-wrap gap-x-8 gap-y-2">
                    {[
                      { label: 'Forum Posts', value: '84.2K', icon: '💬' },
                      { label: 'Fan Guides', value: '1,204', icon: '📝' },
                      { label: 'Discord Members', value: '215K', icon: '🎮' },
                      { label: 'Content Creators', value: '4,800', icon: '🎥' },
                    ].map(s => (
                      <div key={s.label} className="flex items-center gap-2">
                        <span className="text-sm">{s.icon}</span>
                        <span className="text-white font-black text-sm">{s.value}</span>
                        <span className="text-white/35 text-xs">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                {game.tags && game.tags.length > 0 && (
                  <div className="py-4">
                    <p className="text-white/35 text-[9px] uppercase tracking-widest font-bold mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {game.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-0.5 rounded-full text-[10px] text-white/50 hover:text-white/80 cursor-pointer transition-all" style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="h-8" />
              </div>
            </div>

            {/* RIGHT 15% — Screenshots */}
            <div className="flex-shrink-0 w-[15%] border-l p-2 overflow-hidden flex flex-col" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.25)' }}>
              <p className="text-white/20 text-[8px] uppercase tracking-widest font-bold mb-2 text-center">Screens</p>
              <SideScreenshots screenshots={game.screenshots} />
            </div>
          </div>
        )}

        {/* REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="h-full overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'none' }}>
            {/* Score row */}
            <div className="flex items-center gap-6 pb-4 mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex-shrink-0">
                <div className="text-5xl font-black text-white leading-none" style={{ textShadow: '0 0 24px rgba(250,204,21,0.35)' }}>{avgRating}</div>
                <ReviewStars rating={avgRating} />
                <p className="text-white/25 text-[10px] mt-1">{mockPlayers.toLocaleString()} reviews</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5,4,3,2,1].map(n => {
                  const pct = [72,18,6,3,1][5-n];
                  return (
                    <div key={n} className="flex items-center gap-2">
                      <span className="text-white/30 text-[10px] w-3">{n}</span>
                      <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <div className="h-full rounded-full bg-yellow-400/60" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-white/25 text-[10px] w-6 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex-shrink-0 flex flex-wrap gap-1 max-w-[160px]">
                {['Great Visuals','Deep Story','Addictive','Smooth Perf','Great Value','Active Devs'].map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full text-[9px]" style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)', color: 'rgba(253,224,71,0.7)' }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Reviews list */}
            <div className="space-y-0">
              {MOCK_REVIEWS.map((r, i) => (
                <div key={i} className="py-4" style={i < MOCK_REVIEWS.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.06)' } : {}}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black text-white" style={{ background: `linear-gradient(135deg, hsl(${i*60},55%,32%), hsl(${i*60+40},55%,22%))` }}>{r.user[0]}</div>
                      <span className="text-white/80 text-sm font-bold">{r.user}</span>
                      <ReviewStars rating={r.rating} />
                      <span className="text-white/25 text-[10px]">{r.hours}h played</span>
                    </div>
                    <span className="text-white/20 text-[10px]">{r.date}</span>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed pl-9">{r.text}</p>
                  <div className="flex items-center gap-3 mt-2 pl-9">
                    <button className="text-white/30 text-[10px] hover:text-white/60 transition-all">👍 {r.helpful} helpful</button>
                    <button className="text-white/20 text-[10px] hover:text-white/50 transition-all">👎 Not helpful</button>
                    <span className="text-white/15 text-[10px] ml-auto cursor-pointer hover:text-white/30">Report</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-8" />
          </div>
        )}

        {/* REQUIREMENTS */}
        {activeTab === 'requirements' && (
          <div className="h-full overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'none' }}>
            {['Minimum', 'Recommended'].map(tier => (
              <div key={tier} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${tier === 'Minimum' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                  <p className="text-white/40 text-[9px] uppercase tracking-widest font-bold">{tier}</p>
                </div>
                <div className="space-y-0">
                  {[
                    { icon: Monitor, label: 'OS', min: game.system_requirements?.os || 'Windows 10 64-bit', rec: 'Windows 11 64-bit' },
                    { icon: Cpu, label: 'Processor', min: game.system_requirements?.processor || 'Intel Core i5-8600K / AMD Ryzen 5 3600', rec: 'Intel Core i7-10700K / AMD Ryzen 7 5800X' },
                    { icon: MemoryStick, label: 'Memory', min: game.system_requirements?.memory || '8 GB RAM', rec: '16 GB RAM' },
                    { icon: Zap, label: 'Graphics', min: game.system_requirements?.graphics || 'NVIDIA GTX 1060 / AMD RX 580', rec: 'NVIDIA RTX 3070 / AMD RX 6800 XT' },
                    { icon: HardDrive, label: 'Storage', min: game.system_requirements?.storage || '50 GB SSD', rec: '50 GB NVMe SSD' },
                  ].map(({ icon: Icon, label, min, rec }, i, arr) => (
                    <div key={label} className="flex items-center gap-4 py-2.5" style={i < arr.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.05)' } : {}}>
                      <Icon className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                      <span className="text-white/35 text-xs w-16 flex-shrink-0">{label}</span>
                      <span className="text-white/70 text-xs">{tier === 'Minimum' ? min : rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-white/35 text-[9px] uppercase tracking-widest font-bold mb-3">Supported Languages</p>
              <div className="flex flex-wrap gap-1.5">
                {['English','Spanish','French','German','Japanese','Korean','Chinese','Portuguese','Russian','Italian','Polish','Arabic'].map(lang => (
                  <span key={lang} className="px-2 py-0.5 rounded text-[10px] text-white/45" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>{lang}</span>
                ))}
              </div>
            </div>
            <div className="h-8" />
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