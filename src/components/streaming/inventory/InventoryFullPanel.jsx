import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Mic, MicOff, Package, Gamepad2, Zap, Shield, User, Trees, Trophy, ChevronRight, ArrowLeftRight, DollarSign, Star, Trash2, Lock, LayoutGrid, List, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { libraryGames } from '../../dashboard/gamehub/mockLibraryData';
import TradingWorkspace from './TradingWorkspace';
import InventoryShinyCard from './InventoryShinyCard';

const CATEGORY_CONFIG = {
  achievement: { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Achievement' },
  ability: { icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'Ability' },
  equipment: { icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Equipment' },
  companion: { icon: User, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Companion' },
  environment: { icon: Trees, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Environment' },
};

const RARITY_COLORS = {
  Mythic: 'text-red-400 bg-red-500/10 border-red-500/30',
  Legendary: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  Epic: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  Rare: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  Uncommon: 'text-green-400 bg-green-500/10 border-green-500/30',
  Common: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
};

function generateInventoryForGame(game) {
  const title = game.title || game.name || 'Unknown';
  const categories = ['achievement', 'ability', 'equipment', 'companion', 'environment'];
  const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
  const items = [];
  const count = 6 + Math.floor(Math.random() * 10);
  for (let i = 0; i < count; i++) {
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    const seed = (game.id || '').charCodeAt(0) + i;
    const owned = seed % 10 > 2;
    items.push({
      id: `${game.id}_item_${i}`,
      name: `${title.split(' ')[0]} ${CATEGORY_CONFIG[cat].label} ${i + 1}`,
      category: cat,
      rarity,
      game: title,
      gameId: game.id,
      owned,
      unlockedAt: owned ? new Date(Date.now() - Math.random() * 30 * 86400000).toISOString() : null,
      image: game.cover || game.cover_image,
    });
  }
  return items;
}

export default function InventoryFullPanel({ isOpen, onClose, initialGameName, fullScreen = false, leftOffset }) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [marketItem, setMarketItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [favoriteGames, setFavoriteGames] = useState(() => {
    try { return JSON.parse(localStorage.getItem('inventory_favorites') || '[]'); } catch { return []; }
  });
  const recognitionRef = useRef(null);

  const allInventory = useMemo(() => {
    const map = {};
    libraryGames.forEach(g => { map[g.id] = generateInventoryForGame(g); });
    return map;
  }, []);

  const totalItems = useMemo(() => Object.values(allInventory).reduce((sum, items) => sum + items.length, 0), [allInventory]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (e) => { setSearchTerm(e.results[0][0].transcript); setIsListening(false); };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
    return () => recognitionRef.current?.stop();
  }, []);

  const toggleVoice = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    else { recognitionRef.current?.start(); setIsListening(true); }
  };

  const toggleFavorite = (gameId) => {
    setFavoriteGames(prev => {
      const next = prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId];
      localStorage.setItem('inventory_favorites', JSON.stringify(next));
      return next;
    });
  };

  const filteredGames = useMemo(() => {
    let games = libraryGames;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      games = games.filter(g => {
        const name = (g.title || g.name || '').toLowerCase();
        if (name.includes(term)) return true;
        const items = allInventory[g.id] || [];
        return items.some(item => item.name.toLowerCase().includes(term) || item.category.includes(term) || item.rarity.toLowerCase().includes(term));
      });
    }
    // Sort: favorites first
    return [...games].sort((a, b) => {
      const aFav = favoriteGames.includes(a.id) ? 1 : 0;
      const bFav = favoriteGames.includes(b.id) ? 1 : 0;
      return bFav - aFav;
    });
  }, [searchTerm, allInventory, favoriteGames]);

  const gameItems = useMemo(() => {
    if (!selectedGame) return [];
    const items = allInventory[selectedGame.id] || [];
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item => item.name.toLowerCase().includes(term) || item.category.includes(term) || item.rarity.toLowerCase().includes(term));
  }, [selectedGame, allInventory, searchTerm]);

  // Auto-select game when opened via a reward click
  useEffect(() => {
    if (isOpen && initialGameName) {
      const match = libraryGames.find(g => (g.title || g.name || '').toLowerCase() === initialGameName.toLowerCase());
      if (match) setSelectedGame(match);
    }
    if (!isOpen) { setSelectedGame(null); setMarketItem(null); setSearchTerm(''); }
  }, [isOpen, initialGameName]);

  // Clear market item when switching games
  useEffect(() => {
    setMarketItem(null);
  }, [selectedGame]);

  if (!isOpen) return null;

  // Compute right offset: if game selected AND market item selected, game grid shrinks more
  // Pattern: Game Grid | Items Panel | Market Panel
  const glassStyle = {
    background: 'rgba(12, 16, 24, 0.6)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    boxShadow: '0 0 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(165, 243, 252, 0.08)',
    border: '1px solid rgba(165, 243, 252, 0.15)'
  };

  return (
    <>
      {/* SINGLE FULL-SCREEN PANEL: Game icons left | divider | cards right */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-[64px] bottom-[52px] right-0 z-[68] shadow-2xl overflow-hidden flex flex-col"
        style={{ ...glassStyle, left: leftOffset !== undefined ? leftOffset : (fullScreen ? '0px' : '383px') }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0c1018]/95 backdrop-blur-xl z-10 px-5 py-4 relative">
          {/* Bottom border that fades at center to meet vertical divider */}
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{
            background: 'linear-gradient(to right, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.08) 45%, transparent 50%, rgba(255,255,255,0.08) 55%, rgba(255,255,255,0.08) 100%)',
          }}></div>
          <div className="flex items-center justify-between">
            {/* Left: title + search */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Package className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white leading-tight">Full Inventory</h2>
                <p className="text-[10px] text-white/40">{totalItems} items · {libraryGames.length} games</p>
              </div>
              {/* Inline search */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 ml-4 max-w-xs flex-1 focus-within:border-white/20 transition-all">
                <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isListening ? 'Listening...' : 'Search...'}
                  className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/30 w-full"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="text-white/40 hover:text-white flex-shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={toggleVoice}
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                </button>
              </div>
              {/* View toggle */}
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="ml-2 flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
              </button>
              {/* Favorite indicator */}
              <div className="ml-1 flex items-center gap-1 text-[10px] text-white/30" title="Heart a game to pin it to the top">
                <Heart className="w-3.5 h-3.5 text-pink-400/60" />
                <span>{favoriteGames.length}</span>
              </div>
            </div>

            {/* Right: selected game name + close */}
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              {selectedGame && (
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">{selectedGame.title || selectedGame.name}</span>
                  <span className="text-[10px] text-white/30">
                    {gameItems.length} items · {gameItems.filter(i => i.owned).length} owned
                  </span>
                </div>
              )}
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Body: Game strip left | divider | Cards right */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* LEFT: Game library (65%) */}
          <div style={{ width: '65%' }} className="flex-shrink-0 overflow-y-auto overflow-x-hidden p-3 min-w-0">
            {viewMode === 'grid' ? (
              /* GRID VIEW — larger covers with aspect-[3/4] */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                {filteredGames.map((game, i) => {
                  const itemCount = (allInventory[game.id] || []).length;
                  const isActive = selectedGame?.id === game.id;
                  return (
                    <div
                      key={game.id || i}
                      onClick={() => setSelectedGame(game)}
                      className={`relative w-full aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border transition-all group ${
                        isActive
                          ? 'border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/30'
                          : 'border-white/10 hover:border-amber-400/40'
                      }`}
                    >
                      <img
                        src={game.cover || game.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'}
                        alt={game.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      {/* Favorite heart */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(game.id); }}
                        className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-black/60"
                      >
                        <Heart className={`w-3.5 h-3.5 transition-colors ${favoriteGames.includes(game.id) ? 'text-pink-400 fill-pink-400' : 'text-white/40'}`} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 p-2 text-center">
                        <span className="text-xs text-white font-bold leading-tight block truncate">{game.title || game.name}</span>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px] px-1.5 py-0 mt-1">
                          {itemCount}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {filteredGames.length === 0 && (
                  <div className="col-span-full text-center text-white/30 text-sm pt-8">None</div>
                )}
              </div>
            ) : (
              /* LIST VIEW — Steam-style: single column list with icons */
              <div className="flex flex-col gap-0.5">
                {filteredGames.map((game, i) => {
                  const itemCount = (allInventory[game.id] || []).length;
                  const isActive = selectedGame?.id === game.id;
                  return (
                    <div
                      key={game.id || i}
                      onClick={() => setSelectedGame(game)}
                      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer border transition-all ${
                        isActive
                          ? 'border-amber-400/50 bg-amber-500/10'
                          : 'border-transparent hover:bg-white/5'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-sm overflow-hidden flex-shrink-0 border border-white/10">
                        <img
                          src={game.cover || game.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'}
                          alt={game.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className={`text-[13px] truncate leading-tight flex-1 ${isActive ? 'text-white font-semibold' : 'text-white/70'}`}>{game.title || game.name}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(game.id); }}
                        className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                      >
                        <Heart className={`w-3.5 h-3.5 transition-colors ${favoriteGames.includes(game.id) ? 'text-pink-400 fill-pink-400' : 'text-white/20 hover:text-white/40'}`} />
                      </button>
                    </div>
                  );
                })}
                {filteredGames.length === 0 && (
                  <div className="text-center text-white/30 text-sm pt-8">None</div>
                )}
              </div>
            )}
          </div>

          {/* VERTICAL DIVIDER — fades at top & bottom */}
          <div className="flex-shrink-0 w-px relative">
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.15) 20%, rgba(255,255,255,0.15) 80%, transparent 100%)',
              }}
            />
          </div>

          {/* RIGHT: Cards grid (35%) */}
          <div style={{ width: '35%' }} className="overflow-y-auto p-3 min-w-0">
            {!selectedGame ? (
              <div className="h-full flex items-center justify-center text-white/20 text-sm">
                <div className="text-center">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Select a game to view its cards</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {gameItems.map((item, i) => {
                  const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.achievement;
                  const Icon = cfg.icon;
                  const isActive = marketItem?.id === item.id;
                  const isLocked = !item.owned;
                  return (
                    <InventoryShinyCard
                      key={item.id}
                      delay={i}
                      onClick={() => setMarketItem(item)}
                      className={`group relative aspect-[3/4] rounded-xl overflow-hidden border transition-all ${
                        isActive ? `${cfg.border} ring-2 ring-offset-0 shadow-lg`
                        : isLocked ? 'border-white/5 opacity-50 hover:opacity-80 hover:border-white/15'
                        : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className={`absolute inset-0 ${isLocked ? 'bg-black/40' : cfg.bg} opacity-30`} />
                      {isLocked && <div className="absolute inset-0 bg-black/50 z-10" />}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-1.5 z-20">
                        {isLocked && <Lock className="w-3 h-3 text-white/30 absolute top-1 left-1" />}
                        <Icon className={`w-8 h-8 ${isLocked ? 'text-white/20' : cfg.color} mb-1.5 ${isLocked ? '' : 'opacity-40 group-hover:opacity-80'} transition-opacity`} />
                        <p className={`font-bold text-[11px] text-center leading-tight truncate w-full ${isLocked ? 'text-white/40' : 'text-white'}`}>{item.name}</p>
                        <Badge className={`mt-1 text-[8px] border ${isLocked ? 'text-white/30 bg-white/5 border-white/10' : (RARITY_COLORS[item.rarity] || RARITY_COLORS.Common)}`}>
                          {item.rarity}
                        </Badge>
                        {!isLocked && (
                          <span className="mt-0.5 text-[8px] text-emerald-400/80 font-bold">×1</span>
                        )}
                      </div>
                      <div className="absolute top-1 right-1 z-20">
                        <div className={`w-4 h-4 rounded ${isLocked ? 'bg-white/5 border-white/10' : cfg.bg} border ${isLocked ? 'border-white/10' : cfg.border} flex items-center justify-center`}>
                          <Icon className={`w-2.5 h-2.5 ${isLocked ? 'text-white/20' : cfg.color}`} />
                        </div>
                      </div>
                    </InventoryShinyCard>
                  );
                })}
                {gameItems.length === 0 && (
                  <div className="col-span-full py-12 text-center text-white/30 text-sm">No items found.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Trading Workspace (appears to the right when item selected) */}
      <AnimatePresence>
        {marketItem && (
          <TradingWorkspace
            item={marketItem}
            onClose={() => setMarketItem(null)}
            onBack={() => setMarketItem(null)}
            leftOffset={leftOffset !== undefined ? leftOffset : (fullScreen ? 0 : '383px')}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* Legacy export kept for backward compat */
export function InventoryItemDetailPanel({ item, onClose }) {
  if (!item) return null;

  const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.achievement;
  const Icon = cfg.icon;
  const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.Common;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed top-0 right-0 bottom-0 w-[400px] xl:w-[480px] z-[69] shadow-2xl flex flex-col overflow-hidden"
      style={{ boxShadow: '-10px 0 40px rgba(0,0,0,0.5)' }}
    >
      <div className="absolute inset-0" style={{
        background: 'rgba(15, 20, 26, 0.65)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      }} />
      <div className="relative z-10 flex flex-col h-full">
        <div className={`relative h-56 flex-shrink-0 flex items-center justify-center ${cfg.bg}`}>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-white/10 text-white/60 hover:text-white transition-colors backdrop-blur-md border border-white/5">
            <X className="w-5 h-5" />
          </button>
          <div className={`w-36 aspect-[2.5/3.5] rounded-xl border-2 ${cfg.border} flex items-center justify-center relative overflow-hidden`}
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)', boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
            <Icon className={`w-16 h-16 ${cfg.color} opacity-30`} />
            <div className="absolute bottom-3 left-2 right-2">
              <Badge className={`w-full justify-center text-[9px] border ${rarity}`}>{item.rarity}</Badge>
            </div>
          </div>
        </div>
        <div className="flex-1 p-8 pt-6 flex flex-col gap-6 overflow-y-auto">
          <div>
            <Badge className={`mb-2 text-[10px] border ${rarity}`}>{item.rarity} {cfg.label}</Badge>
            <h2 className="text-2xl font-black text-white mb-1">{item.name}</h2>
            <p className="text-white/50 text-sm">{item.game}</p>
          </div>
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Details</h4>
            <div className="space-y-1 bg-white/5 rounded-xl border border-white/5 overflow-hidden">
              {[
                { label: 'Category', value: cfg.label, icon: <Icon className={`w-4 h-4 ${cfg.color}`} /> },
                { label: 'Rarity', value: item.rarity, icon: <Star className="w-4 h-4 text-yellow-400" /> },
                { label: 'Game', value: item.game, icon: <Gamepad2 className="w-4 h-4 text-cyan-400" /> },
                { label: 'Unlocked', value: item.unlockedAt ? new Date(item.unlockedAt).toLocaleDateString() : 'N/A', icon: <Trophy className="w-4 h-4 text-amber-400" /> },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2">{row.icon}<span className="text-sm text-white/70">{row.label}</span></div>
                  <span className="text-white font-semibold text-sm">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto space-y-2">
            <button className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <ArrowLeftRight className="w-4 h-4" /> Trade Item
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all">
                <DollarSign className="w-3.5 h-3.5" /> Sell
              </button>
              <button className="py-3 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-400 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all">
                <Trash2 className="w-3.5 h-3.5" /> Discard
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}