import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Mic, MicOff, Package, Gamepad2, Zap, Shield, User, Trees, Trophy, ChevronRight, ArrowLeftRight, DollarSign, Star, Trash2, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { libraryGames } from '../../dashboard/gamehub/mockLibraryData';
import TradingWorkspace from './TradingWorkspace';

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

export default function InventoryFullPanel({ isOpen, onClose }) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [marketItem, setMarketItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
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

  const filteredGames = useMemo(() => {
    if (!searchTerm.trim()) return libraryGames;
    const term = searchTerm.toLowerCase();
    return libraryGames.filter(g => {
      const name = (g.title || g.name || '').toLowerCase();
      if (name.includes(term)) return true;
      const items = allInventory[g.id] || [];
      return items.some(item => item.name.toLowerCase().includes(term) || item.category.includes(term) || item.rarity.toLowerCase().includes(term));
    });
  }, [searchTerm, allInventory]);

  const gameItems = useMemo(() => {
    if (!selectedGame) return [];
    const items = allInventory[selectedGame.id] || [];
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item => item.name.toLowerCase().includes(term) || item.category.includes(term) || item.rarity.toLowerCase().includes(term));
  }, [selectedGame, allInventory, searchTerm]);

  useEffect(() => {
    if (!isOpen) { setSelectedGame(null); setMarketItem(null); setSearchTerm(''); }
  }, [isOpen]);

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
      {/* PANEL 1: Game Grid (always visible) */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed top-0 bottom-0 left-80 sm:left-96 z-[68] shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          selectedGame ? 'right-[50%]' : 'right-0'
        }`}
        style={glassStyle}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0c1018]/95 backdrop-blur-xl z-10 p-6 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-amber-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">Full Inventory</h2>
                <p className="text-sm text-white/40">{totalItems} items across {libraryGames.length} games</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 focus-within:border-white/20 transition-all">
            <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Search games or items...'}
              className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30 w-full"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-white/40 hover:text-white flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={toggleVoice}
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Game Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className={`grid gap-3 ${selectedGame ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'}`}>
            {filteredGames.map((game, i) => {
              const itemCount = (allInventory[game.id] || []).length;
              const isActive = selectedGame?.id === game.id;
              return (
                <motion.div
                  key={game.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedGame(game)}
                  className={`group relative aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border cursor-pointer transition-all ${
                    isActive
                      ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] ring-2 ring-amber-400/20'
                      : 'border-white/10 hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  }`}
                >
                  <img src={game.cover || game.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'} alt={game.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h4 className="text-white font-bold text-sm leading-tight mb-1 truncate">{game.title || game.name}</h4>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px]">
                      <Package className="w-2.5 h-2.5 mr-1" /> {itemCount} Items
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
            {filteredGames.length === 0 && (
              <div className="col-span-full py-16 text-center text-white/30">No games match your search.</div>
            )}
          </div>
        </div>
      </motion.div>

      {/* PANEL 2: Item Grid (appears to the right when game selected) */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            key="items-panel"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`fixed top-0 bottom-0 left-[50%] z-[69] shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
              marketItem ? 'right-[360px] xl:right-[420px]' : 'right-0'
            }`}
            style={{
              ...glassStyle,
              borderLeft: '1px solid rgba(245, 158, 11, 0.15)',
              boxShadow: '-10px 0 40px rgba(0,0,0,0.4)',
            }}
          >
            {/* Items Header */}
            <div className="sticky top-0 bg-[#0c1018]/95 backdrop-blur-xl z-10 p-5 pb-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-14 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                    <img src={selectedGame.cover || selectedGame.cover_image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{selectedGame.title || selectedGame.name}</h3>
                    <p className="text-xs text-white/40">{gameItems.length} items • {gameItems.filter(i => i.owned).length} owned</p>
                  </div>
                </div>
                <button onClick={() => setSelectedGame(null)} className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className={`grid gap-3 ${marketItem ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5'}`}>
                {gameItems.map((item, i) => {
                  const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.achievement;
                  const Icon = cfg.icon;
                  const isActive = marketItem?.id === item.id;
                  const isLocked = !item.owned;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setMarketItem(item)}
                      className={`group relative aspect-[3/4] rounded-xl overflow-hidden border cursor-pointer transition-all ${
                        isActive ? `${cfg.border} ring-2 ring-offset-0 shadow-lg`
                        : isLocked ? 'border-white/5 opacity-50 hover:opacity-80 hover:border-white/15'
                        : 'border-white/10 hover:border-white/20'
                      }`}
                      style={isActive ? { boxShadow: `0 0 20px ${cfg.color.includes('cyan') ? 'rgba(6,182,212,0.3)' : 'rgba(168,85,247,0.3)'}` } : {}}
                    >
                      <div className={`absolute inset-0 ${isLocked ? 'bg-black/40' : cfg.bg} opacity-30`} />
                      {isLocked && <div className="absolute inset-0 bg-black/50 z-10" />}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 z-20">
                        {isLocked && <Lock className="w-4 h-4 text-white/30 absolute top-2 left-2" />}
                        <Icon className={`w-8 h-8 ${isLocked ? 'text-white/20' : cfg.color} mb-2 ${isLocked ? '' : 'opacity-40 group-hover:opacity-80'} transition-opacity`} />
                        <p className={`font-bold text-xs text-center leading-tight truncate w-full ${isLocked ? 'text-white/40' : 'text-white'}`}>{item.name}</p>
                        <Badge className={`mt-1.5 text-[8px] border ${isLocked ? 'text-white/30 bg-white/5 border-white/10' : (RARITY_COLORS[item.rarity] || RARITY_COLORS.Common)}`}>
                          {item.rarity}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2 z-20">
                        <div className={`w-5 h-5 rounded-md ${isLocked ? 'bg-white/5 border-white/10' : cfg.bg} border ${isLocked ? 'border-white/10' : cfg.border} flex items-center justify-center`}>
                          <Icon className={`w-3 h-3 ${isLocked ? 'text-white/20' : cfg.color}`} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {gameItems.length === 0 && (
                  <div className="col-span-full py-16 text-center text-white/30">No items found.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PANEL 3: Market Actions (appears to the right when item selected) */}
      <AnimatePresence>
        {marketItem && (
          <InventoryMarketPanel
            item={marketItem}
            owned={!!marketItem.owned}
            onClose={() => setMarketItem(null)}
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