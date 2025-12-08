import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Hammer, Search, Filter, Package, Gamepad2, Layers, Star, Zap, 
  Gem, Trash2, Plus, Settings, Eye, RotateCw, Sparkles, Crown, Users, ArrowLeftRight,
  ChevronRight, ChevronLeft, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/auth/AuthContext';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import CraftingCollaborations from '../components/crafting/CraftingCollaborations';
import CraftingChallenges from '../components/crafting/CraftingChallenges';
import BlacksmithGameSelect from '../components/blacksmith/BlacksmithGameSelect';

// Mock data for demonstration
const mockItems = [
  {
    id: 'item_1',
    name: 'Stormbreaker Sword',
    description: 'A legendary blade crackling with lightning energy.',
    rarity: 'Legendary',
    type: 'Weapon',
    game_id: 'elder_scrolls_reborn',
    game_title: 'Elder Scrolls: Reborn',
    genre: 'Fantasy',
    set_id: 'stormforged_set',
    set_position: 1,
    base_stats: { attack: 120, speed: 10 },
    modifiers: [{ name: 'Lightning Strike', effect: '+20 Electric Damage' }],
    enchantment_slots: 2,
    preview_image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
    level_requirement: 25
  },
  {
    id: 'item_2',
    name: 'Cyber Neural Interface',
    description: 'Advanced cybernetic enhancement for neural processing.',
    rarity: 'Epic',
    type: 'Trinket',
    game_id: 'cyberpunk_2088',
    game_title: 'Cyberpunk 2088',
    genre: 'Sci-Fi',
    base_stats: { intelligence: 15, hacking: 25 },
    modifiers: [],
    enchantment_slots: 1,
    preview_image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=300&fit=crop',
    level_requirement: 20
  },
  {
    id: 'item_3',
    name: 'Stormforged Helm',
    description: 'Protective headgear forged from storm essence.',
    rarity: 'Legendary',
    type: 'Armor',
    game_id: 'elder_scrolls_reborn',
    game_title: 'Elder Scrolls: Reborn',
    genre: 'Fantasy',
    set_id: 'stormforged_set',
    set_position: 2,
    base_stats: { defense: 85, resistance: 40 },
    modifiers: [],
    enchantment_slots: 3,
    preview_image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
    level_requirement: 25
  },
  {
    id: 'item_4',
    name: 'Void Walker Boots',
    description: 'Step through shadows with these ethereal boots.',
    rarity: 'Epic',
    type: 'Armor',
    game_id: 'destiny_forge',
    game_title: 'Destiny Forge',
    genre: 'Sci-Fi',
    base_stats: { agility: 45, stealth: 30 },
    modifiers: [{ name: 'Shadow Step', effect: 'Brief invisibility on dodge' }],
    enchantment_slots: 2,
    preview_image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=300&fit=crop',
    level_requirement: 18
  },
  {
    id: 'item_5',
    name: 'Molten Core Shield',
    description: 'A heavy shield containing the heart of a dying star.',
    rarity: 'Mythic',
    type: 'Armor',
    game_id: 'elder_scrolls_reborn',
    game_title: 'Elder Scrolls: Reborn',
    genre: 'Fantasy',
    base_stats: { defense: 200, fire_resist: 80 },
    modifiers: [{ name: 'Magma Shell', effect: 'Reflects 15% damage as Fire' }],
    enchantment_slots: 1,
    preview_image_url: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=300&fit=crop',
    level_requirement: 40
  }
];

const mockSets = [
  {
    id: 'stormforged_set',
    name: 'Stormforged Arsenal',
    description: 'Ancient weapons and armor infused with the power of storms.',
    piece_ids: ['item_1', 'item_3'],
    bonuses: [
      { pieces_required: 2, bonus_description: '+15% Lightning Damage', bonus_stats: { lightning_damage: 15 } },
      { pieces_required: 4, bonus_description: 'Chain Lightning on Critical Hit', bonus_stats: { chain_lightning: true } }
    ],
    rarity: 'Legendary',
    theme: 'Elemental'
  }
];

const mockMaterials = [
  { id: 'mat_1', name: 'Storm Essence', type: 'Essence', rarity: 'Epic', quantity: 12, genre: 'Fantasy' },
  { id: 'mat_2', name: 'Plasma Cores', type: 'Crystal', rarity: 'Rare', quantity: 8, genre: 'Sci-Fi' },
  { id: 'mat_3', name: 'Arcane Shards', type: 'Shard', rarity: 'Common', quantity: 45, genre: 'Fantasy' }
];

const rarityStyles = {
  Common: { color: 'text-slate-300', glow: 'shadow-slate-500/20', border: 'border-slate-600' },
  Uncommon: { color: 'text-emerald-400', glow: 'shadow-emerald-500/20', border: 'border-emerald-500/50' },
  Rare: { color: 'text-blue-400', glow: 'shadow-blue-500/20', border: 'border-blue-500/50' },
  Epic: { color: 'text-purple-400', glow: 'shadow-purple-500/20', border: 'border-purple-500/50' },
  Legendary: { color: 'text-orange-400', glow: 'shadow-orange-500/20', border: 'border-orange-500/50' },
  Mythic: { color: 'text-rose-400', glow: 'shadow-rose-500/20', border: 'border-rose-500/50' }
};

// --- Console UI Components ---

const ConsoleDetailView = ({ item, onEnchant, onCombine, onSalvage }) => {
  if (!item) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-white/5">
          <Hammer className="w-10 h-10 opacity-30" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Black Forge</h2>
        <p className="max-w-md text-center">Select an item from the list to view stats, apply enchantments, or reforge equipment.</p>
      </div>
    );
  }
  
  const style = rarityStyles[item.rarity] || rarityStyles.Common;
  const associatedSet = mockSets.find(set => set.id === item.set_id);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="h-full flex flex-col"
    >
      {/* Header Area */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Badge className={`text-sm px-3 py-1 ${style.border} bg-slate-800/60 backdrop-blur-md ${style.color} shadow-sm`}>
            {item.rarity} {item.type}
          </Badge>
          <Badge variant="outline" className="text-sm text-slate-400 border-slate-600 bg-slate-800/30">
            Lv. {item.level_requirement}
          </Badge>
        </div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight drop-shadow-lg">{item.name}</h1>
        <p className="text-xl text-slate-300 max-w-2xl font-medium leading-relaxed border-l-4 border-blue-500/50 pl-4 bg-slate-800/20 py-2 rounded-r-xl">
          "{item.description}"
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8 max-w-3xl">
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-lg">
          <h3 className="text-slate-400 uppercase tracking-wider text-xs font-bold mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4" /> Base Stats
          </h3>
          <div className="space-y-3">
            {Object.entries(item.base_stats).map(([stat, value]) => (
              <div key={stat} className="flex justify-between items-center">
                <span className="text-slate-300 capitalize font-medium">{stat}</span>
                <div className="h-px flex-grow mx-4 bg-white/10" />
                <span className="text-white font-mono font-bold text-lg">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-lg">
          <h3 className="text-slate-400 uppercase tracking-wider text-xs font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Enhancements
          </h3>
          {item.modifiers.length > 0 ? (
            <div className="space-y-3">
              {item.modifiers.map((mod, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2 rounded-xl bg-slate-700/30">
                  <Zap className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <div className="text-white font-bold">{mod.name}</div>
                    <div className="text-slate-300 text-sm">{mod.effect}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 italic flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-700" /> No active enchantments
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
            <span className="text-slate-400">Slots Available</span>
            <span className="text-white font-bold">{item.modifiers.length} / {item.enchantment_slots}</span>
          </div>
        </div>
      </div>

      {/* Set Bonus */}
      {associatedSet && (
        <div className="mb-8 max-w-3xl bg-gradient-to-r from-amber-900/20 to-transparent border-l-4 border-amber-600 p-6 rounded-r-xl shadow-sm backdrop-blur-md">
          <h3 className="text-amber-400 font-black text-lg flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5" /> {associatedSet.name}
          </h3>
          <div className="space-y-1">
            {associatedSet.bonuses.map((bonus, idx) => (
              <div key={idx} className="text-slate-300 text-sm flex gap-2 font-medium">
                <span className="text-amber-500 font-bold">({bonus.pieces_required})</span>
                <span>{bonus.bonus_description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons (Star Wave Effect) */}
      <div className="mt-auto flex gap-4">
        <Button 
          size="lg" 
          className="btn-star-wave h-16 px-8 text-lg font-bold bg-blue-600 text-white hover:bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/30 border border-white/20 overflow-hidden"
          onClick={() => onEnchant(item)}
        >
          <span className="relative z-10 flex items-center">
            <span className="w-6 h-6 rounded-full border-2 border-white/50 mr-3 flex items-center justify-center text-xs font-black bg-white/10">A</span>
            Enchant
          </span>
        </Button>
        
        <Button 
          size="lg" 
          className="btn-star-wave h-16 px-8 text-lg font-bold bg-white text-slate-900 hover:bg-slate-50 rounded-2xl shadow-lg shadow-slate-200/50 border border-white overflow-hidden"
          onClick={() => onCombine(item)}
        >
          <span className="relative z-10 flex items-center">
            <span className="w-6 h-6 rounded-full border-2 border-slate-300 mr-3 flex items-center justify-center text-xs font-black bg-slate-100">X</span>
            Reforge
          </span>
        </Button>

        <Button 
          size="lg" 
          variant="destructive"
          className="btn-star-wave h-16 px-8 text-lg font-bold bg-rose-500 text-white hover:bg-rose-400 rounded-2xl shadow-lg shadow-rose-500/30 border border-white/20 ml-auto overflow-hidden"
          onClick={() => onSalvage(item)}
        >
          <span className="relative z-10 flex items-center">
            <span className="w-6 h-6 rounded-full border-2 border-white/50 mr-3 flex items-center justify-center text-xs font-black bg-white/10">Y</span>
            Salvage
          </span>
        </Button>
      </div>
    </motion.div>
  );
};

export default function BlacksmithPage() {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('forge'); // 'forge', 'materials', 'collab'
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Forge Mastery XP
  const [forgeXP, setForgeXP] = useState(2450);
  const [forgeLevel, setForgeLevel] = useState(18);
  const maxXP = 5000;
  
  // Calculate rank based on level
  const getRank = (level) => {
    if (level <= 50) return 'Novice';
    if (level <= 100) return 'Adept';
    if (level <= 150) return 'Expert';
    return 'Master';
  };
  
  const handleEnchant = (item) => console.log('Enchanting:', item.name);
  const handleCombine = (item) => console.log('Combining:', item.name);
  const handleSalvage = (item) => console.log('Salvaging:', item.name);

  // Filter logic
  const displayedItems = useMemo(() => {
    let items = mockItems;
    
    // Filter by selected game if in forge mode
    if (viewMode === 'forge' && selectedGame) {
      items = items.filter(i => i.game_id === selectedGame.id);
    }
    
    if (categoryFilter === 'all') return items;
    return items.filter(i => i.type === categoryFilter);
  }, [categoryFilter, selectedGame, viewMode]);

  // Background based on selection
  const bgImage = selectedItem?.preview_image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=80';

  return (
    <div className="h-screen w-full bg-[#0f172a] text-slate-200 overflow-hidden relative font-sans selection:bg-blue-500/30">
      {/* Star-Wave Animation Style */}
      <style>{`
        @keyframes star-wave-glow {
          0% { left: -100%; opacity: 0; }
          50% { opacity: 0.5; }
          100% { left: 200%; opacity: 0; }
        }
        .btn-star-wave {
          position: relative;
          overflow: hidden;
        }
        .btn-star-wave::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
          transform: skewX(-20deg);
          transition: none;
        }
        .btn-star-wave:active::after {
          animation: star-wave-glow 0.6s ease-out forwards;
        }
      `}</style>

      {/* Darker Ethereal Space Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
        
        {/* Dark Nebula Effect */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-blue-500/10 via-purple-500/5 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-indigo-500/10 via-blue-500/5 to-transparent blur-3xl" />
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col h-full p-8 md:p-12">
        
        {/* Top Navigation Bar */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-8">
            <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-3 drop-shadow-md">
              <Hammer className="w-8 h-8 fill-white" />
              BLACK FORGE
            </h1>
            <nav className="flex gap-1 bg-slate-800/50 rounded-full p-1 backdrop-blur-xl border border-white/10 shadow-lg">
              {['forge', 'materials', 'collab'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wide transition-all ${
                    viewMode === mode 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {mode === 'collab' ? 'Collaborations' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* User Resources */}
          <div className="flex gap-6 items-center">
            {mockMaterials.slice(0, 2).map(mat => (
              <div key={mat.id} className="flex items-center gap-3 bg-slate-800/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${rarityStyles[mat.rarity].color.replace('text-', 'bg-')}`} />
                <span className="text-slate-300 text-sm font-medium">{mat.name}</span>
                <span className="text-white font-bold font-mono">{mat.quantity}</span>
              </div>
            ))}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 border-2 border-white/50 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <img src={user?.avatar_url} className="w-full h-full rounded-full opacity-90" alt="User" />
            </div>
          </div>
        </header>

        {/* Main Body */}
        <div className="flex-1 flex gap-12 overflow-hidden">
          
          {viewMode === 'forge' ? (
            <>
              {!selectedGame ? (
                <BlacksmithGameSelect itemsData={mockItems} onGameSelect={(game) => {
                    setSelectedGame(game);
                    setSelectedItem(null); 
                }} />
              ) : (
                <>
                  {/* Left: Categories & Item Scroll */}
                  <div className="w-full max-w-[400px] flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <Button 
                        variant="ghost" 
                        onClick={() => setSelectedGame(null)}
                        className="text-left justify-start text-white/70 hover:text-white px-0"
                        >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Games
                        </Button>
                        <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                            {selectedGame.title}
                        </Badge>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {['all', 'Weapon', 'Armor', 'Trinket'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`text-sm font-bold uppercase whitespace-nowrap transition-colors ${
                            categoryFilter === cat ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Vertical Scrollable Grid (Apple Glass List) */}
                    <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar">
                      {displayedItems.length > 0 ? (
                          displayedItems.map((item) => (
                            <motion.div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            whileHover={{ x: 10, backgroundColor: 'rgba(30,41,59,0.8)' }}
                            className={`
                                p-4 rounded-2xl cursor-pointer border transition-all flex items-center gap-4 backdrop-blur-md
                                ${selectedItem?.id === item.id 
                                ? 'bg-slate-700 text-white border-blue-500/50 shadow-lg shadow-blue-500/20' 
                                : 'bg-slate-800/40 text-slate-300 border-white/10 hover:border-white/20'
                                }
                            `}
                            >
                            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-white/10">
                                <img src={item.preview_image_url} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold truncate">{item.name}</h4>
                                <p className={`text-xs truncate ${selectedItem?.id === item.id ? 'text-slate-300' : 'text-slate-500'}`}>
                                {item.rarity} • Lv.{item.level_requirement}
                                </p>
                            </div>
                            {selectedItem?.id === item.id && <ChevronRight className="w-5 h-5 text-blue-400" />}
                            </motion.div>
                        ))
                      ) : (
                          <div className="text-center py-10 text-slate-500">
                              <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                              <p>No items found for this category.</p>
                          </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Details (Expands to fill) */}
                  <div className="flex-1 relative">
                    <AnimatePresence mode="wait">
                      <ConsoleDetailView 
                        key={selectedItem?.id} 
                        item={selectedItem}
                        onEnchant={handleEnchant}
                        onCombine={handleCombine}
                        onSalvage={handleSalvage}
                      />
                    </AnimatePresence>
                  </div>
                </>
              )}
            </>
          ) : viewMode === 'collab' ? (
            <div className="w-full h-full overflow-y-auto">
              <CraftingCollaborations />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Package className="w-24 h-24 mx-auto mb-4 opacity-20" />
                <h2 className="text-2xl font-bold text-slate-600">Materials Storage</h2>
                <p>Manage your crafting resources here.</p>
              </div>
            </div>
          )}
        </div>

        {/* Experience Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400 font-medium">Experience Bar - Level {forgeLevel} ({getRank(forgeLevel)})</span>
            <span className="text-xs text-slate-500 font-mono">{forgeXP} / {maxXP}</span>
          </div>
          <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${(forgeXP / maxXP) * 100}%` }}
            />
          </div>
        </div>

        {/* Footer Hints */}
        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center text-sm font-medium text-slate-500">
          <div className="flex gap-6">
            <span className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 shadow-sm">B</span> Back</span>
            <span className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 shadow-sm">≡</span> Options</span>
          </div>
          <div>
            Credits: <span className="text-white font-bold">24,500</span>
          </div>
        </div>
      </div>
    </div>
  );
}