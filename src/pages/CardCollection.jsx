import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, ArrowLeft, Filter, Sparkles, Trophy, Zap, Shield, Crown, Crosshair, Ghost, Gamepad2, Skull, Rocket, Car, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';

// Mock Data
const GENRES = ['Fear', 'Shooter', 'RPG', 'Sci-Fi', 'Action', 'Strategy', 'Adventure', 'Racing', 'Sports', 'Puzzle'];

const GENRE_ICONS = {
  'Fear': Ghost,
  'Shooter': Crosshair,
  'RPG': Crown,
  'Sci-Fi': Rocket,
  'Action': Zap,
  'Strategy': Trophy,
  'Adventure': Gamepad2,
  'Racing': Car,
  'Sports': Trophy,
  'Puzzle': Monitor
};

const GENRE_CARDS = {
  'Fear': [
    { id: 'f1', name: 'Shadow Wraith', icon: '👻', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1509248961385-6d4f65e671ae?w=400' },
    { id: 'f2', name: 'Blood Moon', icon: '🌑', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400' },
    { id: 'f3', name: 'Crypt Keeper', icon: '💀', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=400' },
    { id: 'f4', name: 'Phantom Edge', icon: '🔪', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400' },
    { id: 'f5', name: 'Banshee Wail', icon: '😱', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400' },
    { id: 'f6', name: 'Night Terror', icon: '🦇', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1509248961385-6d4f65e671ae?w=400' },
    { id: 'f7', name: 'Grave Digger', icon: '⚰️', rarity: 'Common', image: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400' },
    { id: 'f8', name: 'Soul Harvest', icon: '👁️', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=400' },
  ],
  'Shooter': [
    { id: 's1', name: 'Plasma Rifle', icon: '🔫', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' },
    { id: 's2', name: 'Frag Grenade', icon: '💣', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400' },
    { id: 's3', name: 'Tactical Vest', icon: '🦺', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400' },
    { id: 's4', name: 'Scope X12', icon: '🔭', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400' },
    { id: 's5', name: 'EMP Burst', icon: '⚡', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' },
    { id: 's6', name: 'Stealth Camo', icon: '🫥', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400' },
  ],
  'RPG': [
    { id: 'r1', name: 'Dragon Flame', icon: '🔥', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400' },
    { id: 'r2', name: 'Mana Crystal', icon: '💎', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400' },
    { id: 'r3', name: 'Iron Shield', icon: '🛡️', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400' },
    { id: 'r4', name: 'Enchanted Bow', icon: '🏹', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400' },
    { id: 'r5', name: 'Healing Potion', icon: '🧪', rarity: 'Common', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400' },
  ],
  'Sci-Fi': [
    { id: 'sf1', name: 'Warp Drive', icon: '🚀', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400' },
    { id: 'sf2', name: 'Ion Cannon', icon: '💫', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1505356829705-eb8b8f2d57c7?w=400' },
    { id: 'sf3', name: 'Nano Repair', icon: '🔧', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400' },
    { id: 'sf4', name: 'AI Core', icon: '🤖', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' },
  ],
  'Action': [
    { id: 'a1', name: 'Neon Rush', icon: '⚡', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400' },
    { id: 'a2', name: 'Combo Breaker', icon: '💥', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' },
    { id: 'a3', name: 'Adrenaline', icon: '🔥', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400' },
  ],
  'Strategy': [
    { id: 'st1', name: 'War Council', icon: '♟️', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400' },
    { id: 'st2', name: 'Supply Chain', icon: '📦', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400' },
  ],
  'Adventure': [
    { id: 'ad1', name: 'Explorer Map', icon: '🗺️', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400' },
    { id: 'ad2', name: 'Grappling Hook', icon: '🪝', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400' },
  ],
  'Racing': [
    { id: 'rc1', name: 'Turbo Boost', icon: '🏎️', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400' },
    { id: 'rc2', name: 'Nitro Tank', icon: '⛽', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' },
  ],
  'Sports': [
    { id: 'sp1', name: 'MVP Trophy', icon: '🏆', rarity: 'Legendary', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400' },
    { id: 'sp2', name: 'Power Shot', icon: '⚽', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400' },
  ],
  'Puzzle': [
    { id: 'p1', name: 'Time Warp', icon: '⏳', rarity: 'Epic', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400' },
    { id: 'p2', name: 'Mind Link', icon: '🧠', rarity: 'Rare', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400' },
  ],
};

const RARITY_STYLES = {
  Common: { border: 'border-slate-500/40', text: 'text-slate-400', glow: '', bg: 'from-slate-500/10 to-transparent' },
  Rare: { border: 'border-blue-500/50', text: 'text-blue-300', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]', bg: 'from-blue-500/10 to-transparent' },
  Epic: { border: 'border-purple-500/50', text: 'text-purple-300', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]', bg: 'from-purple-500/10 to-transparent' },
  Legendary: { border: 'border-amber-500/50', text: 'text-amber-300', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.4)]', bg: 'from-amber-500/10 to-transparent' },
};

export default function CardCollection() {
  const navigate = useNavigate();
  const [activeGenre, setActiveGenre] = useState('Fear');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);

  // Handle Escape Key to Exit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate(createPageUrl('LunaTemplate'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const filteredCards = useMemo(() => {
    const genreCards = GENRE_CARDS[activeGenre] || [];
    if (!searchTerm) return genreCards;
    return genreCards.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [activeGenre, searchTerm]);

  return (
    <PageErrorBoundary pageName="CardCollection">
      <div 
        className="min-h-screen w-full bg-[#0f1115] text-white pt-24 px-8 pb-8 flex flex-col"
        style={{
          backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(20, 24, 30, 1) 0%, rgba(15, 17, 21, 1) 90%)'
        }}
      >
        {/* Header Area */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-400" />
              Card Collection
            </h1>
            <p className="text-white/40 text-sm">Manage your trading cards and collectibles.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-[#161920] border border-white/5 rounded-2xl px-4 py-2 flex items-center gap-3">
              <div className="text-right">
                <span className="block text-[10px] text-white/40 uppercase tracking-wider">Total Value</span>
                <span className="block text-lg font-bold text-green-400 font-mono">2,450 G</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-400" />
              </div>
            </div>
            
            <Button 
              onClick={() => navigate(createPageUrl('LunaTemplate'))} 
              variant="outline" 
              className="border-white/10 hover:bg-white/5 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back (Esc)
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
          
          {/* LEFT SIDEBAR: Genres */}
          <div className="col-span-3 flex flex-col gap-6">
            <div className="bg-[#161920] p-4 rounded-3xl border border-white/5 h-full flex flex-col">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4 px-2">Genres</h3>
              <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2">
                {GENRES.map(genre => {
                  const Icon = GENRE_ICONS[genre] || Gamepad2;
                  const isActive = activeGenre === genre;
                  const count = GENRE_CARDS[genre]?.length || 0;
                  
                  return (
                    <button
                      key={genre}
                      onClick={() => setActiveGenre(genre)}
                      className={`w-full p-3 rounded-xl flex items-center justify-between transition-all group ${
                        isActive 
                          ? 'bg-white/10 text-white shadow-lg' 
                          : 'hover:bg-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-white/40 group-hover:text-white/60'}`} />
                        <span className="font-medium text-sm">{genre}</span>
                      </div>
                      <Badge variant="outline" className={`border-0 ${isActive ? 'bg-white/20 text-white' : 'bg-black/20 text-white/30'}`}>
                        {count}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT: Cards Grid */}
          <div className="col-span-9 flex flex-col gap-6">
            
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-[#161920] p-2 rounded-2xl border border-white/5">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search cards..." 
                  className="w-full bg-black/20 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/10 transition-colors"
                />
              </div>
              
              <div className="flex items-center gap-2 pr-2">
                <Button variant="ghost" size="sm" className="text-white/40 hover:text-white gap-2">
                  <Filter className="w-4 h-4" /> Filter
                </Button>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="flex-1 bg-[#161920]/50 rounded-3xl border border-white/5 p-6 overflow-hidden">
              <div className="h-full overflow-y-auto custom-scrollbar pr-2">
                {filteredCards.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredCards.map((card) => {
                      const rs = RARITY_STYLES[card.rarity] || RARITY_STYLES.Common;
                      return (
                        <motion.div
                          key={card.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ y: -5, scale: 1.02 }}
                          onMouseEnter={() => setHoveredCard(card.id)}
                          onMouseLeave={() => setHoveredCard(null)}
                          className={`aspect-[2.5/3.5] rounded-xl overflow-hidden cursor-pointer border ${rs.border} bg-[#0f1115] relative group shadow-lg`}
                        >
                          {/* Image & Overlay */}
                          <div className="absolute inset-0">
                            <img src={card.image} alt={card.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-80" />
                            <div className={`absolute inset-0 bg-gradient-to-t ${rs.bg} opacity-80`} />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
                          </div>

                          {/* Content */}
                          <div className="absolute inset-0 p-3 flex flex-col justify-between z-10">
                            <div className="flex justify-between items-start">
                              <Badge className={`text-[9px] h-5 px-1.5 border-0 backdrop-blur-md bg-black/40 ${rs.text}`}>
                                {card.rarity}
                              </Badge>
                              {card.rarity === 'Legendary' && <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />}
                            </div>

                            <div className="text-center">
                              <div className="text-3xl mb-2 drop-shadow-md transform group-hover:scale-110 transition-transform">{card.icon}</div>
                              <h4 className="font-bold text-sm text-white leading-tight drop-shadow-md">{card.name}</h4>
                            </div>
                          </div>

                          {/* Hover Glow Effect */}
                          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${rs.glow}`} />
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-white/20">
                    <Ghost className="w-12 h-12 mb-4 opacity-50" />
                    <p>No cards found in this collection.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}