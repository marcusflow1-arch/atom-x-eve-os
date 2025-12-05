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

// Mock data for demonstration (Preserved)
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
  Common: { color: 'text-slate-400', glow: 'shadow-slate-500/20', border: 'border-slate-600' },
  Uncommon: { color: 'text-green-400', glow: 'shadow-green-500/20', border: 'border-green-500' },
  Rare: { color: 'text-blue-400', glow: 'shadow-blue-500/20', border: 'border-blue-500' },
  Epic: { color: 'text-purple-400', glow: 'shadow-purple-500/20', border: 'border-purple-500' },
  Legendary: { color: 'text-orange-400', glow: 'shadow-orange-500/20', border: 'border-orange-500' },
  Mythic: { color: 'text-red-400', glow: 'shadow-red-500/20', border: 'border-red-500' }
};

// --- Console UI Components ---

const ConsoleItemCard = ({ item, onClick, isSelected }) => {
  const style = rarityStyles[item.rarity] || rarityStyles.Common;
  
  return (
    <motion.div
      layoutId={`item-${item.id}`}
      onClick={() => onClick(item)}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative flex-shrink-0 w-48 h-64 rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-300 ease-out
        ${isSelected ? `ring-4 ring-white ring-offset-4 ring-offset-black scale-105 z-10 ${style.glow}` : 'opacity-80 hover:opacity-100'}
      `}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={item.preview_image_url} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      </div>

      {/* Card Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-1">
        <Badge className={`w-fit bg-black/50 backdrop-blur-md border ${style.border} ${style.color} text-[10px] px-2 py-0.5`}>
          {item.rarity}
        </Badge>
        <h3 className="text-white font-bold text-lg leading-tight shadow-black drop-shadow-md">
          {item.name}
        </h3>
        <p className="text-slate-300 text-xs truncate">{item.type}</p>
      </div>

      {/* Selection Indicator (Corner triangle) */}
      {isSelected && (
        <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-r-[40px] border-t-transparent border-r-white opacity-90" />
      )}
    </motion.div>
  );
};

const ConsoleDetailView = ({ item, onEnchant, onCombine, onSalvage }) => {
  if (!item) return null;
  
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
          <Badge className={`text-sm px-3 py-1 ${style.border} bg-black/40 backdrop-blur-md ${style.color}`}>
            {item.rarity} {item.type}
          </Badge>
          <Badge variant="outline" className="text-sm text-slate-400 border-slate-600">
            Lv. {item.level_requirement}
          </Badge>
        </div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight">{item.name}</h1>
        <p className="text-xl text-slate-300 max-w-2xl font-light leading-relaxed border-l-4 border-slate-600 pl-4">
          "{item.description}"
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8 max-w-3xl">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <h3 className="text-slate-400 uppercase tracking-wider text-xs font-bold mb-4">Base Stats</h3>
          <div className="space-y-3">
            {Object.entries(item.base_stats).map(([stat, value]) => (
              <div key={stat} className="flex justify-between items-center">
                <span className="text-slate-300 capitalize">{stat}</span>
                <div className="h-px flex-grow mx-4 bg-white/10" />
                <span className="text-white font-mono font-bold text-lg">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <h3 className="text-slate-400 uppercase tracking-wider text-xs font-bold mb-4">Enhancements</h3>
          {item.modifiers.length > 0 ? (
            <div className="space-y-3">
              {item.modifiers.map((mod, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <div className="text-white font-medium">{mod.name}</div>
                    <div className="text-slate-400 text-sm">{mod.effect}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 italic flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-600" /> No active enchantments
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
        <div className="mb-8 max-w-3xl bg-gradient-to-r from-yellow-900/20 to-transparent border-l-4 border-yellow-600 p-6 rounded-r-xl">
          <h3 className="text-yellow-500 font-bold text-lg flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5" /> {associatedSet.name}
          </h3>
          <div className="space-y-1">
            {associatedSet.bonuses.map((bonus, idx) => (
              <div key={idx} className="text-slate-300 text-sm flex gap-2">
                <span className="text-yellow-600 font-bold">({bonus.pieces_required})</span>
                <span>{bonus.bonus_description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons (Console Style) */}
      <div className="mt-auto flex gap-4">
        <Button 
          size="lg" 
          className="h-14 px-8 text-lg font-bold bg-white text-black hover:bg-slate-200 rounded-xl transition-transform hover:scale-105 active:scale-95"
          onClick={() => onEnchant(item)}
        >
          <span className="w-6 h-6 rounded-full border-2 border-black mr-3 flex items-center justify-center text-xs font-black">A</span>
          Enchant
        </Button>
        
        <Button 
          size="lg" 
          variant="secondary"
          className="h-14 px-8 text-lg font-bold bg-white/10 text-white hover:bg-white/20 rounded-xl border border-white/10"
          onClick={() => onCombine(item)}
        >
          <span className="w-6 h-6 rounded-full border-2 border-white mr-3 flex items-center justify-center text-xs font-black">X</span>
          Reforge
        </Button>

        <Button 
          size="lg" 
          variant="destructive"
          className="h-14 px-8 text-lg font-bold bg-red-500/20 text-red-200 hover:bg-red-500/30 rounded-xl border border-red-500/30 ml-auto"
          onClick={() => onSalvage(item)}
        >
          <span className="w-6 h-6 rounded-full border-2 border-red-200 mr-3 flex items-center justify-center text-xs font-black">Y</span>
          Salvage
        </Button>
      </div>
    </motion.div>
  );
};

export default function BlacksmithPage() {
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState(mockItems[0]);
  const [viewMode, setViewMode] = useState('forge'); // 'forge', 'materials', 'collab'
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const handleEnchant = (item) => console.log('Enchanting:', item.name);
  const handleCombine = (item) => console.log('Combining:', item.name);
  const handleSalvage = (item) => console.log('Salvaging:', item.name);

  // Filter logic
  const displayedItems = useMemo(() => {
    if (categoryFilter === 'all') return mockItems;
    return mockItems.filter(i => i.type === categoryFilter);
  }, [categoryFilter]);

  // Background based on selection
  const bgImage = selectedItem?.preview_image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=80';

  return (
    <div className="h-screen w-full bg-black text-white overflow-hidden relative font-sans selection:bg-white/30">
      {/* Dynamic Background Layer */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedItem?.id || 'default'}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <img src={bgImage} className="w-full h-full object-cover opacity-40 blur-sm" alt="background" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
          </motion.div>
        </AnimatePresence>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col h-full p-8 md:p-12">
        
        {/* Top Navigation Bar */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-8">
            <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-3">
              <Hammer className="w-8 h-8 fill-white" />
              BLACK FORGE
            </h1>
            <nav className="flex gap-1 bg-white/10 rounded-full p-1 backdrop-blur-md">
              {['forge', 'materials', 'collab'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wide transition-all ${
                    viewMode === mode 
                      ? 'bg-white text-black shadow-lg' 
                      : 'text-white/60 hover:text-white hover:bg-white/10'
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
              <div key={mat.id} className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
                <div className={`w-2 h-2 rounded-full ${rarityStyles[mat.rarity].color.replace('text-', 'bg-')}`} />
                <span className="text-slate-300 text-sm font-medium">{mat.name}</span>
                <span className="text-white font-bold font-mono">{mat.quantity}</span>
              </div>
            ))}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 border-2 border-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <img src={user?.avatar_url} className="w-full h-full rounded-full opacity-90" alt="User" />
            </div>
          </div>
        </header>

        {/* Main Body */}
        <div className="flex-1 flex gap-12 overflow-hidden">
          
          {viewMode === 'forge' ? (
            <>
              {/* Left: Categories & Item Scroll */}
              <div className="w-full max-w-[400px] flex flex-col gap-6">
                {/* Category Tabs */}
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {['all', 'Weapon', 'Armor', 'Trinket'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`text-sm font-bold uppercase whitespace-nowrap transition-colors ${
                        categoryFilter === cat ? 'text-white border-b-2 border-white pb-1' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Vertical Scrollable Grid (Console Menu Style) */}
                <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar">
                  {displayedItems.map((item) => (
                    <motion.div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.1)' }}
                      className={`
                        p-4 rounded-xl cursor-pointer border transition-all flex items-center gap-4
                        ${selectedItem?.id === item.id 
                          ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]' 
                          : 'bg-black/40 text-white border-white/10 hover:border-white/30'
                        }
                      `}
                    >
                      <img src={item.preview_image_url} className="w-12 h-12 rounded-md object-cover bg-black" alt="" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate">{item.name}</h4>
                        <p className={`text-xs truncate ${selectedItem?.id === item.id ? 'text-black/60' : 'text-white/40'}`}>
                          {item.rarity} • Lv.{item.level_requirement}
                        </p>
                      </div>
                      {selectedItem?.id === item.id && <ChevronRight className="w-5 h-5" />}
                    </motion.div>
                  ))}
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
          ) : viewMode === 'collab' ? (
            <div className="w-full h-full overflow-y-auto">
              <CraftingCollaborations />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30">
              <div className="text-center">
                <Package className="w-24 h-24 mx-auto mb-4 opacity-20" />
                <h2 className="text-2xl font-bold">Materials Storage</h2>
                <p>Manage your crafting resources here.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Hints */}
        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center text-sm font-medium text-white/50">
          <div className="flex gap-6">
            <span className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20">B</span> Back</span>
            <span className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20">≡</span> Options</span>
          </div>
          <div>
            Credits: <span className="text-white">24,500</span>
          </div>
        </div>
      </div>
    </div>
  );
}