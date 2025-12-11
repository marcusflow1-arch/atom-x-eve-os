import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Hammer, Trophy, Search, Filter, Package, Gamepad2, Layers, Star, Zap, 
  Gem, Trash2, Plus, Settings, Eye, RotateCw, Sparkles, Crown, Users, ArrowLeftRight,
  ChevronRight, ChevronLeft, Menu, ChevronDown, Mic, X
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../components/auth/AuthContext';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import CraftingCollaborations from '../components/crafting/CraftingCollaborations';
import CraftingChallenges from '../components/crafting/CraftingChallenges';
import ItemWorkstation from '../components/blacksmith/ItemWorkstation';
// BlacksmithGameSelect is replaced by the sidebar

// --- Shiny Sidebar Box Component ---
const ShinySidebarBox = ({ children, className = "" }) => {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl ${className}`}
      style={{
        background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
      }}
    >
        {children}
    </motion.div>
  );
};

// --- Item Detail Modal (Refactored ConsoleDetailView) ---
const ItemDetailModal = ({ item, onClose, onEnchant, onCombine, onSalvage, rarityStyles, associatedSet }) => {
  if (!item) return null;
  const style = rarityStyles[item.rarity] || rarityStyles.Common;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-white/10 transition-colors text-white">
          <X className="w-5 h-5" />
        </button>

        {/* Left: Image */}
        <div className="w-full md:w-1/3 bg-slate-800 relative">
           <img src={item.preview_image_url} alt={item.name} className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
           <div className="absolute bottom-4 left-4 right-4">
              <Badge className={`text-sm px-3 py-1 ${style.border} bg-slate-800/60 backdrop-blur-md ${style.color} shadow-sm mb-2`}>
                {item.rarity} {item.type}
              </Badge>
           </div>
        </div>

        {/* Right: Details */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-slate-900/95">
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">{item.name}</h1>
          <p className="text-slate-400 italic mb-6 border-l-2 border-blue-500/50 pl-3">
            "{item.description}"
          </p>

          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                <Layers className="w-3 h-3" /> Base Stats
              </h3>
              <div className="grid grid-cols-2 gap-y-2">
                {Object.entries(item.base_stats).map(([stat, value]) => (
                  <div key={stat} className="flex justify-between items-center pr-4">
                    <span className="text-slate-300 capitalize text-sm">{stat.replace('_', ' ')}</span>
                    <span className="text-white font-mono font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Enhancements
              </h3>
              {item.modifiers.length > 0 ? (
                <div className="space-y-2">
                  {item.modifiers.map((mod, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-black/20">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-white font-bold text-sm">{mod.name}</div>
                        <div className="text-slate-400 text-xs">{mod.effect}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 text-sm italic">No active enchantments</div>
              )}
            </div>
            
            {associatedSet && (
                <div className="bg-gradient-to-r from-amber-900/10 to-transparent border-l-2 border-amber-600 pl-4 py-2">
                  <h3 className="text-amber-400 font-bold text-sm mb-1">{associatedSet.name}</h3>
                  <div className="space-y-1">
                    {associatedSet.bonuses.map((bonus, idx) => (
                      <div key={idx} className="text-slate-400 text-xs flex gap-2">
                        <span className="text-amber-500 font-bold">({bonus.pieces_required})</span>
                        <span>{bonus.bonus_description}</span>
                      </div>
                    ))}
                  </div>
                </div>
            )}
          </div>

          <div className="mt-8 flex gap-3">
             <Button onClick={() => onEnchant(item)} className="flex-1 bg-blue-600 hover:bg-blue-500 font-bold h-12 rounded-xl">Enchant</Button>
             <Button onClick={() => onCombine(item)} variant="outline" className="flex-1 border-white/20 hover:bg-white/10 h-12 rounded-xl text-white">Reforge</Button>
             <Button onClick={() => onSalvage(item)} variant="destructive" className="flex-1 bg-rose-600 hover:bg-rose-500 h-12 rounded-xl">Salvage</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Mock data for demonstration
const mockItems = [
  // Fantasy (Elder Scrolls: Reborn)
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
    base_stats: { attack: 120, speed: 10 },
    modifiers: [{ name: 'Lightning Strike', effect: '+20 Electric Damage' }],
    enchantment_slots: 2,
    preview_image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
    level_requirement: 25
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
    base_stats: { defense: 85, resistance: 40 },
    modifiers: [],
    enchantment_slots: 3,
    preview_image_url: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=300&h=300&fit=crop',
    level_requirement: 25
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
  },

  // Sci-Fi (Cyberpunk 2088, Destiny Forge)
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

  // Action (Kratos' Legacy)
  {
    id: 'item_6',
    name: 'Leviathan Axe Replica',
    description: 'A frozen axe that returns to the wielder\'s hand.',
    rarity: 'Legendary',
    type: 'Weapon',
    game_id: 'kratos_legacy',
    game_title: 'Kratos\' Legacy',
    genre: 'Action',
    base_stats: { attack: 150, frost_damage: 50 },
    modifiers: [{ name: 'Permafrost', effect: 'Slows enemies on hit' }],
    enchantment_slots: 2,
    preview_image_url: 'https://images.unsplash.com/photo-1589241062272-c0a3f5d75c15?w=300&h=300&fit=crop',
    level_requirement: 30
  },

  // Horror (Silent Hill: Echoes)
  {
    id: 'item_7',
    name: 'Rusty Pipe',
    description: 'A terrifyingly effective blunt instrument from a nightmare.',
    rarity: 'Common',
    type: 'Weapon',
    game_id: 'silent_hill_echoes',
    game_title: 'Silent Hill: Echoes',
    genre: 'Horror',
    base_stats: { attack: 40, fear: 10 },
    modifiers: [],
    enchantment_slots: 0,
    preview_image_url: 'https://images.unsplash.com/photo-1581072036677-6a47b7472463?w=300&h=300&fit=crop',
    level_requirement: 5
  },

  // Racing (Velocity X)
  {
    id: 'item_8',
    name: 'Nitrous Injector V8',
    description: 'High-performance boost system for street racing.',
    rarity: 'Rare',
    type: 'Trinket',
    game_id: 'velocity_x',
    game_title: 'Velocity X',
    genre: 'Racing',
    base_stats: { speed: 50, acceleration: 20 },
    modifiers: [{ name: 'Turbo Boost', effect: '+15% Max Speed for 5s' }],
    enchantment_slots: 1,
    preview_image_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300&h=300&fit=crop',
    level_requirement: 15
  },

  // Shooter (Frontline Ops)
  {
    id: 'item_9',
    name: 'Tactical Vest Level 3',
    description: 'Standard issue ballistic protection.',
    rarity: 'Rare',
    type: 'Armor',
    game_id: 'frontline_ops',
    game_title: 'Frontline Ops',
    genre: 'Shooter',
    base_stats: { armor: 100, mobility: -5 },
    modifiers: [],
    enchantment_slots: 1,
    preview_image_url: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=300&h=300&fit=crop',
    level_requirement: 10
  },

  // RPG (Final Fantasy: Crystal)
  {
    id: 'item_10',
    name: 'Buster Sword Replica',
    description: 'An incredibly massive sword requiring immense strength.',
    rarity: 'Epic',
    type: 'Weapon',
    game_id: 'ff_crystal',
    game_title: 'Final Fantasy: Crystal',
    genre: 'RPG',
    base_stats: { attack: 200, weight: 50 },
    modifiers: [{ name: 'Limit Break', effect: 'Charge attacks deal 200% damage' }],
    enchantment_slots: 3,
    preview_image_url: 'https://images.unsplash.com/photo-1592155931584-901ac15763e3?w=300&h=300&fit=crop',
    level_requirement: 35
  },

  // Strategy (Civ Empires)
  {
    id: 'item_11',
    name: 'Crown of Leadership',
    description: 'Symbol of authority for a burgeoning empire.',
    rarity: 'Legendary',
    type: 'Trinket',
    game_id: 'civ_empires',
    game_title: 'Civ Empires',
    genre: 'Strategy',
    base_stats: { diplomacy: 50, influence: 100 },
    modifiers: [{ name: 'Golden Age', effect: '+20% Resource Generation' }],
    enchantment_slots: 1,
    preview_image_url: 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?w=300&h=300&fit=crop',
    level_requirement: 40
  },

  // Sports (FIFA Street)
  {
    id: 'item_12',
    name: 'Golden Cleats',
    description: 'Boots that seem to magnetically attract the ball.',
    rarity: 'Epic',
    type: 'Armor', // Using armor slot for footwear
    game_id: 'fifa_street',
    game_title: 'FIFA Street',
    genre: 'Sports',
    base_stats: { speed: 30, control: 45 },
    modifiers: [{ name: 'Curve Shot', effect: '+25% Accuracy' }],
    enchantment_slots: 1,
    preview_image_url: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=300&h=300&fit=crop',
    level_requirement: 20
  },

  // Fighting (Iron Fist Tournament)
  {
    id: 'item_13',
    name: 'Black Belt Gi',
    description: 'Traditional martial arts attire worn by grandmasters.',
    rarity: 'Rare',
    type: 'Armor',
    game_id: 'iron_fist',
    game_title: 'Iron Fist Tournament',
    genre: 'Fighting',
    base_stats: { agility: 20, defense: 15 },
    modifiers: [{ name: 'Counter', effect: '10% chance to parry' }],
    enchantment_slots: 2,
    preview_image_url: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=300&h=300&fit=crop',
    level_requirement: 15
  },

  // Puzzle (Portal Paradox)
  {
    id: 'item_14',
    name: 'Weighted Companion Cube',
    description: 'A loyal friend that will never threaten to stab you.',
    rarity: 'Common',
    type: 'Trinket',
    game_id: 'portal_paradox',
    game_title: 'Portal Paradox',
    genre: 'Puzzle',
    base_stats: { love: 100, weight: 50 },
    modifiers: [],
    enchantment_slots: 0,
    preview_image_url: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?w=300&h=300&fit=crop',
    level_requirement: 1
  },

  // Survival (Block World)
  {
    id: 'item_15',
    name: 'Diamond Pickaxe',
    description: 'The ultimate tool for mining and crafting.',
    rarity: 'Epic',
    type: 'Weapon', // Tool/Weapon
    game_id: 'block_world',
    game_title: 'Block World',
    genre: 'Survival',
    base_stats: { mining_speed: 500, durability: 1500 },
    modifiers: [{ name: 'Fortune', effect: 'Double drop rate' }],
    enchantment_slots: 3,
    preview_image_url: 'https://images.unsplash.com/photo-1627850604058-52e40de1b847?w=300&h=300&fit=crop',
    level_requirement: 30
  },

  // Adventure (Tomb Raider: Lost City)
  {
    id: 'item_16',
    name: 'Climbing Axe',
    description: 'Essential gear for scaling treacherous cliffs.',
    rarity: 'Uncommon',
    type: 'Weapon',
    game_id: 'tomb_raider',
    game_title: 'Tomb Raider: Lost City',
    genre: 'Adventure',
    base_stats: { attack: 25, mobility: 20 },
    modifiers: [],
    enchantment_slots: 1,
    preview_image_url: 'https://images.unsplash.com/photo-1533624820386-a427f9c24251?w=300&h=300&fit=crop',
    level_requirement: 10
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

// ConsoleDetailView Removed - Refactored into ItemDetailModal

export default function BlacksmithPage({ isEmbedded, onToggleView }) {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('forge'); 
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isGenreOpen, setIsGenreOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWorkstation, setShowWorkstation] = useState(false);
  
  // Forge Mastery XP - Based on User Data
  const forgeXP = user?.forge_xp || 0;
  const forgeLevel = user?.forge_level || 1;
  const maxXP = forgeLevel * 1000;
  
  const getRank = (level) => {
    if (level <= 50) return 'Novice';
    if (level <= 100) return 'Adept';
    if (level <= 150) return 'Expert';
    return 'Master';
  };
  
  const handleEnchant = (item) => console.log('Enchanting:', item.name);
  const handleCombine = (item) => console.log('Combining:', item.name);
  const handleSalvage = (item) => console.log('Salvaging:', item.name);

  // Group games by genre for sidebar
  const gamesByGenre = useMemo(() => {
    const grouped = mockItems.reduce((acc, item) => {
        if (!acc[item.genre]) acc[item.genre] = [];
        if (!acc[item.genre].some(g => g.id === item.game_id)) {
            acc[item.genre].push({
                id: item.game_id,
                title: item.game_title,
                image: item.preview_image_url,
                genre: item.genre
            });
        }
        return acc;
    }, {});
    return grouped;
  }, []);

  const displayedItems = useMemo(() => {
    let items = mockItems;
    if (viewMode === 'forge' && selectedGame) {
      items = items.filter(i => i.game_id === selectedGame.id);
    }
    if (categoryFilter !== 'all') {
       items = items.filter(i => i.type === categoryFilter);
    }
    
    // Check if items are unlocked via achievements
    const unlockedAchievements = user?.unlocked_achievements || [];
    items = items.map(item => ({
      ...item,
      isUnlocked: unlockedAchievements.includes(item.id) || unlockedAchievements.some(ach => ach.includes(item.game_id))
    }));
    
    return items;
  }, [categoryFilter, selectedGame, viewMode, user]);

  // Auto-select first item when game changes
  useEffect(() => {
    if (selectedGame && displayedItems.length > 0) {
        if (!selectedItem || !displayedItems.find(i => i.id === selectedItem.id)) {
            setSelectedItem(displayedItems[0]);
        }
    }
  }, [selectedGame, displayedItems]);

  return (
    <div className="h-screen w-full bg-[#0f172a] text-slate-200 overflow-hidden relative font-sans selection:bg-blue-500/30">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-blue-500/10 via-purple-500/5 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-indigo-500/10 via-blue-500/5 to-transparent blur-3xl" />
      </div>

      <motion.div 
        className="relative z-10 flex flex-col h-full p-6 md:p-8"
        animate={{ 
            scale: showWorkstation ? 0.95 : 1, 
            opacity: showWorkstation ? 0.5 : 1,
            filter: showWorkstation ? 'blur(5px)' : 'blur(0px)' 
        }}
        transition={{ duration: 0.4 }}
      >
        
        {/* Top Navigation Bar */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <h1 className="ml-4 text-3xl font-black tracking-tighter text-white flex items-center gap-3 drop-shadow-md">
                {isEmbedded ? (
                  <div 
                    onClick={onToggleView} 
                    className="cursor-pointer group"
                    title="Return to Achievements"
                  >
                    <Trophy className="w-8 h-8 text-slate-300 fill-slate-400/20 drop-shadow-[0_0_15px_rgba(192,192,192,0.5)] group-hover:scale-110 transition-transform duration-300 group-hover:text-white group-hover:fill-slate-200/30" />
                  </div>
                ) : (
                  <Hammer className="w-8 h-8 fill-white" />
                )}
                Blacksmith Forge
              </h1>
            </div>
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

          <div className="flex gap-6 items-center">
            {(user?.materials || []).slice(0, 2).map(mat => (
              <div key={mat.id} className="flex items-center gap-3 bg-slate-800/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${rarityStyles[mat.rarity]?.color.replace('text-', 'bg-') || 'bg-slate-500'}`} />
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
        <div className="flex-1 flex gap-8 overflow-hidden">
          
          {viewMode === 'forge' ? (
            <>
              {/* LEFT SIDEBAR (Shiny Box Style) */}
              <div className="w-[300px] flex-shrink-0 h-full overflow-hidden">
                  <ShinySidebarBox className="h-full p-6 flex flex-col">
                       {/* Search */}
                       <div className="relative group mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/60 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search games..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-10 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all backdrop-blur-xl"
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all">
                                <Mic className="w-4 h-4" />
                            </button>
                       </div>

                       {/* Game List with Genres */}
                       <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <button
                                onClick={() => setIsGenreOpen(!isGenreOpen)}
                                className="w-full flex items-center justify-between text-white/40 text-xs font-bold uppercase tracking-widest mb-4 hover:text-white transition-colors px-1"
                            >
                                <span>Categories</span>
                                {isGenreOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>

                            <AnimatePresence>
                                {isGenreOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="space-y-6"
                                    >
                                        {Object.entries(gamesByGenre).map(([genre, games]) => (
                                            <div key={genre}>
                                                <h4 className="text-white/60 text-xs font-semibold mb-2 flex items-center gap-2 pl-2">
                                                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                                                    {genre}
                                                </h4>
                                                <div className="space-y-1 border-l border-white/5 pl-2 ml-0.5">
                                                    {games.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase())).map(game => (
                                                        <button
                                                            key={game.id}
                                                            onClick={() => {
                                                                setSelectedGame(game);
                                                                setSelectedItem(null);
                                                            }}
                                                            className={`flex items-center gap-3 w-full p-2 rounded-lg transition-colors text-left group ${selectedGame?.id === game.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                                        >
                                                            <div className="w-8 h-8 rounded bg-slate-800 flex-shrink-0 overflow-hidden border border-white/10 group-hover:border-white/30">
                                                                <img src={game.image} alt="" className="w-full h-full object-cover" />
                                                            </div>
                                                            <span className={`text-sm truncate ${selectedGame?.id === game.id ? 'text-white font-medium' : 'text-slate-400 group-hover:text-white'}`}>
                                                                {game.title}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                       </div>
                  </ShinySidebarBox>
              </div>

              {/* RIGHT CONTENT: Items Grid */}
              <div className="flex-1 h-full flex flex-col overflow-hidden">
                   {selectedGame ? (
                       <div className="flex flex-col h-full">
                           {/* Game Header Bar */}
                           <div className="h-16 flex items-center justify-between px-8 border-b border-white/10 shrink-0">
                               <button 
                                   onClick={() => setSelectedGame(null)} 
                                   className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                               >
                                   <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                   <span className="font-bold uppercase tracking-wider text-sm">Back to Games</span>
                               </button>
                               <Badge variant="outline" className="bg-blue-900/20 border-blue-500/30 text-blue-400">
                                   {selectedGame.title}
                               </Badge>
                           </div>

                           <div className="flex-1 flex overflow-hidden">
                               {/* Inner Sidebar: Item List */}
                               <div className="w-80 flex flex-col border-r border-white/10">
                                   {/* Tabs */}
                                   <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5">
                                       {['all', 'Weapon', 'Armor', 'Trinket'].map(cat => (
                                           <button
                                               key={cat}
                                               onClick={() => setCategoryFilter(cat)}
                                               className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                                                   categoryFilter === cat ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-slate-500 hover:text-slate-300 pb-1 border-b-2 border-transparent'
                                               }`}
                                           >
                                               {cat === 'all' ? 'ALL' : cat.toUpperCase()}
                                           </button>
                                       ))}
                                   </div>

                                   {/* List */}
                                   <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                       {displayedItems.length > 0 ? displayedItems.map(item => (
                                           <div
                                               key={item.id}
                                               onClick={() => {
                                                   setSelectedItem(item);
                                                   setShowWorkstation(true);
                                               }}
                                               className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                                                   item.isUnlocked 
                                                       ? `${selectedItem?.id === item.id ? 'bg-blue-600/10 border border-blue-500/30' : 'hover:bg-white/5 border border-transparent'}`
                                                       : 'opacity-40 grayscale hover:opacity-60 border border-transparent'
                                               }`}
                                           >
                                               <div className={`w-10 h-10 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0 relative`}>
                                                   <img src={item.preview_image_url} className="w-full h-full object-cover" />
                                                   {!item.isUnlocked && (
                                                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                           <Layers className="w-4 h-4 text-white/30" />
                                                       </div>
                                                   )}
                                               </div>
                                               <div className="min-w-0">
                                                   <div className={`font-bold text-sm truncate ${selectedItem?.id === item.id ? 'text-white' : item.isUnlocked ? 'text-slate-300' : 'text-slate-600'}`}>
                                                       {item.name}
                                                   </div>
                                                   <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                       <span className={rarityStyles[item.rarity].color}>{item.rarity}</span>
                                                       <span>•</span>
                                                       <span>Lv.{item.level_requirement}</span>
                                                   </div>
                                               </div>
                                           </div>
                                       )) : (
                                           <div className="text-center text-slate-500 text-sm py-8">
                                               <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                               <p>No items found for this game.</p>
                                               <p className="text-xs text-slate-600 mt-2">Unlock items through achievements!</p>
                                           </div>
                                       )}
                                   </div>
                               </div>

                               {/* Main Content: Item Details */}
                               <div className="flex-1 overflow-y-auto custom-scrollbar p-8 relative">
                                   {selectedItem ? (
                                       <div className="max-w-4xl mx-auto">
                                           <div className="flex items-center gap-3 mb-4">
                                               <Badge className={`bg-transparent border ${rarityStyles[selectedItem.rarity].border} ${rarityStyles[selectedItem.rarity].color}`}>
                                                   {selectedItem.rarity} {selectedItem.type}
                                               </Badge>
                                               <Badge variant="secondary" className="bg-slate-800 text-slate-400">
                                                   Lv. {selectedItem.level_requirement}
                                               </Badge>
                                           </div>

                                           <h1 className="text-5xl font-black text-white mb-4 tracking-tight drop-shadow-lg">
                                               {selectedItem.name}
                                           </h1>

                                           <div className="border-l-4 border-blue-500 pl-4 py-1 mb-10">
                                               <p className="text-xl text-slate-400 italic">
                                                   "{selectedItem.description}"
                                               </p>
                                           </div>

                                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                                               <div className="bg-slate-800/50 rounded-3xl p-6 border border-white/5">
                                                   <h3 className="text-xs font-bold text-slate-500 uppercase mb-6 flex items-center gap-2">
                                                       <Layers className="w-4 h-4" /> Base Stats
                                                   </h3>
                                                   <div className="space-y-6">
                                                       {Object.entries(selectedItem.base_stats).map(([stat, value]) => (
                                                           <div key={stat} className="space-y-2">
                                                               <div className="flex justify-between text-sm font-bold uppercase tracking-wider">
                                                                   <span className="text-slate-400">{stat.replace('_', ' ')}</span>
                                                                   <span className="text-white">{value}</span>
                                                               </div>
                                                               <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                                                   <div 
                                                                       className="h-full bg-slate-500" 
                                                                       style={{ width: `${Math.min((value / 200) * 100, 100)}%` }}
                                                                   />
                                                               </div>
                                                           </div>
                                                       ))}
                                                   </div>
                                               </div>

                                               <div className="bg-slate-800/50 rounded-3xl p-6 border border-white/5">
                                                   <h3 className="text-xs font-bold text-slate-500 uppercase mb-6 flex items-center gap-2">
                                                       <Sparkles className="w-4 h-4" /> Enhancements
                                                   </h3>
                                                   <div className="space-y-3">
                                                       {selectedItem.modifiers.map((mod, i) => (
                                                           <div key={i} className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                                                               <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                                                   <Zap className="w-5 h-5 fill-current" />
                                                               </div>
                                                               <div>
                                                                   <div className="font-bold text-white text-sm">{mod.name}</div>
                                                                   <div className="text-slate-400 text-xs">{mod.effect}</div>
                                                               </div>
                                                           </div>
                                                       ))}
                                                       {selectedItem.modifiers.length === 0 && (
                                                           <div className="text-slate-600 text-sm text-center py-4">No enhancements active</div>
                                                       )}
                                                   </div>
                                                   <div className="mt-6 flex justify-between items-center text-xs text-slate-500 border-t border-white/5 pt-4">
                                                       <span>Slots Available</span>
                                                       <span className="text-white font-mono">{selectedItem.enchantment_slots - selectedItem.modifiers.length} / {selectedItem.enchantment_slots}</span>
                                                   </div>
                                               </div>
                                           </div>
                                       </div>
                                   ) : (
                                       <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                           <Hammer className="w-20 h-20 mb-4 opacity-20" />
                                           <p className="text-lg font-medium">Select an item to view details</p>
                                       </div>
                                   )}
                               </div>
                           </div>
                       </div>
                   ) : (
                       <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                           <Gamepad2 className="w-20 h-20 mb-6 opacity-20" />
                           <h2 className="text-2xl font-bold text-slate-400 mb-2">Select a Game</h2>
                           <p className="max-w-md text-center">Choose a game from the sidebar to view your inventory.</p>
                       </div>
                   )}
              </div>
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
                {(user?.materials || []).length === 0 ? (
                  <p className="text-slate-500 mt-2">No materials yet. Complete achievements to earn materials!</p>
                ) : (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    {(user.materials || []).map(mat => (
                      <div key={mat.id} className="bg-slate-800/40 border border-white/10 rounded-xl p-4 text-center">
                        <div className={`w-3 h-3 rounded-full ${rarityStyles[mat.rarity]?.color.replace('text-', 'bg-') || 'bg-slate-500'} mx-auto mb-2`} />
                        <div className="text-white font-bold text-sm">{mat.name}</div>
                        <div className="text-slate-400 text-xs">{mat.quantity}</div>
                      </div>
                    ))}
                  </div>
                )}
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

        {/* Modal removed - using inline detail view */}
      </motion.div>

      {/* Workstation Overlay */}
      <AnimatePresence>
        {showWorkstation && selectedItem && (
            <ItemWorkstation 
                item={selectedItem} 
                onClose={() => setShowWorkstation(false)} 
            />
        )}
      </AnimatePresence>
    </div>
  );
}