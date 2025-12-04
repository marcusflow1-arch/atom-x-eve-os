import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Hammer, Search, Filter, Package, Gamepad2, Layers, Star, Zap, 
  Gem, Trash2, Plus, Settings, Eye, RotateCw, Sparkles, Crown, Users, ArrowLeftRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/auth/AuthContext';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import CraftingCollaborations from '../components/crafting/CraftingCollaborations';
import { Item } from '@/entities/Item';
import { ItemSet } from '@/entities/ItemSet';
import { Enchantment } from '@/entities/Enchantment';
import { Material } from '@/entities/Material';
import { Loadout } from '@/entities/Loadout';

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

const rarityColors = {
  Common: 'border-slate-500 bg-slate-900/50',
  Uncommon: 'border-green-500 bg-green-900/20',
  Rare: 'border-blue-500 bg-blue-900/20',
  Epic: 'border-purple-500 bg-purple-900/20',
  Legendary: 'border-orange-500 bg-orange-900/20',
  Mythic: 'border-red-500 bg-red-900/20'
};

const ItemCard = ({ item, onClick, isSelected }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.05, y: -5 }}
    onClick={() => onClick(item)}
    className={`relative cursor-pointer rounded-xl overflow-hidden border-2 p-4 transition-all duration-200 ${
      rarityColors[item.rarity]
    } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
  >
    <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-slate-800">
      <img 
        src={item.preview_image_url} 
        alt={item.name}
        className="w-full h-full object-cover"
      />
    </div>
    
    <h3 className="font-bold text-white text-sm mb-1 line-clamp-2">{item.name}</h3>
    <p className="text-slate-400 text-xs mb-2 line-clamp-2">{item.description}</p>
    
    <div className="flex items-center justify-between text-xs">
      <Badge className={`${rarityColors[item.rarity]} border-0 text-xs px-2 py-1`}>
        {item.rarity}
      </Badge>
      <span className="text-slate-500">{item.type}</span>
    </div>
    
    {item.set_id && (
      <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-1 py-0.5 rounded">
        Set
      </div>
    )}
    
    <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded">
      Lv.{item.level_requirement}
    </div>
  </motion.div>
);

const ItemDetailsPanel = ({ item, onClose, onEnchant, onCombine, onSalvage }) => {
  if (!item) return null;

  const associatedSet = mockSets.find(set => set.id === item.set_id);
  const ownedSetPieces = associatedSet ? 
    associatedSet.piece_ids.filter(pieceId => mockItems.find(i => i.id === pieceId)) : [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-xl p-6 h-full overflow-y-auto"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{item.name}</h2>
          <Badge className={`${rarityColors[item.rarity]} mt-2`}>{item.rarity} {item.type}</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <Plus className="w-5 h-5 rotate-45" />
        </Button>
      </div>

      {/* 3D Preview Area */}
      <div className="aspect-square bg-slate-900/50 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
        <img 
          src={item.preview_image_url} 
          alt={item.name}
          className="w-full h-full object-cover rounded-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-sm"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Item Stats */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Statistics</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(item.base_stats).map(([stat, value]) => (
            <div key={stat} className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-slate-400 text-sm capitalize">{stat}</div>
              <div className="text-white font-bold">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Modifiers */}
      {item.modifiers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Enchantments</h3>
          <div className="space-y-2">
            {item.modifiers.map((mod, index) => (
              <div key={index} className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
                <div className="text-blue-300 font-semibold">{mod.name}</div>
                <div className="text-blue-200 text-sm">{mod.effect}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Set Information */}
      {associatedSet && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            {associatedSet.name} ({ownedSetPieces.length}/{associatedSet.piece_ids.length})
          </h3>
          
          <div className="space-y-3">
            {associatedSet.bonuses.map((bonus, index) => {
              const isActive = ownedSetPieces.length >= bonus.pieces_required;
              return (
                <div 
                  key={index} 
                  className={`rounded-lg p-3 border ${
                    isActive ? 'bg-yellow-900/30 border-yellow-700/50' : 'bg-slate-900/30 border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isActive ? 'text-yellow-200' : 'text-slate-400'}`}>
                      ({bonus.pieces_required} pieces) {bonus.bonus_description}
                    </span>
                    {isActive && <Badge className="bg-yellow-600 text-black">Active</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button 
          onClick={() => onEnchant(item)}
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={item.enchantment_slots === 0}
        >
          <Zap className="w-4 h-4 mr-2" />
          Enchant ({item.modifiers.length}/{item.enchantment_slots})
        </Button>
        
        <Button 
          onClick={() => onCombine(item)}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Gem className="w-4 h-4 mr-2" />
          Combine/Upgrade
        </Button>
        
        <Button 
          onClick={() => onSalvage(item)}
          variant="outline" 
          className="w-full border-orange-600 text-orange-300 hover:bg-orange-900/20"
        >
          <Hammer className="w-4 h-4 mr-2" />
          Salvage
        </Button>

        <Link to={createPageUrl('TradingPost')} className="w-full">
          <Button 
            variant="outline" 
            className="w-full border-green-600 text-green-400 hover:bg-green-900/20 mt-2"
          >
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Sell on Marketplace
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

export default function BlacksmithPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('all'); // 'all', 'by-game', 'by-genre', 'collab'
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedItem, setSelectedItem] = useState(null);
  const [materials, setMaterials] = useState(mockMaterials);
  
  // Get unique games and genres from items
  const availableGames = useMemo(() => {
    const gameMap = new Map();
    mockItems.forEach(item => {
      gameMap.set(item.game_id, item.game_title);
    });
    return Array.from(gameMap.entries()).map(([id, title]) => ({ id, title }));
  }, []);

  const availableGenres = useMemo(() => {
    return [...new Set(mockItems.map(item => item.genre))];
  }, []);

  // Filter and organize items based on current view
  const organizedItems = useMemo(() => {
    let filtered = mockItems.filter(item => {
      const searchMatch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const rarityMatch = rarityFilter === 'all' || item.rarity === rarityFilter;
      const typeMatch = typeFilter === 'all' || item.type === typeFilter;
      
      let viewMatch = true;
      if (viewMode === 'by-game' && selectedGame) {
        viewMatch = item.game_id === selectedGame;
      } else if (viewMode === 'by-genre' && selectedGenre) {
        viewMatch = item.genre === selectedGenre;
      }
      
      return searchMatch && rarityMatch && typeMatch && viewMatch;
    });

    // Sort items
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rarity':
        const rarityOrder = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
        filtered.sort((a, b) => rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity));
        break;
      case 'level':
        filtered.sort((a, b) => b.level_requirement - a.level_requirement);
        break;
      default: // newest
        filtered.sort((a, b) => b.id.localeCompare(a.id));
    }

    // Group by view mode
    if (viewMode === 'by-game') {
      const grouped = {};
      filtered.forEach(item => {
        if (!grouped[item.game_title]) grouped[item.game_title] = [];
        grouped[item.game_title].push(item);
      });
      return grouped;
    } else if (viewMode === 'by-genre') {
      const grouped = {};
      filtered.forEach(item => {
        if (!grouped[item.genre]) grouped[item.genre] = [];
        grouped[item.genre].push(item);
      });
      return grouped;
    }
    
    return { 'All Items': filtered };
  }, [viewMode, selectedGame, selectedGenre, searchTerm, rarityFilter, typeFilter, sortBy]);

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const handleEnchant = (item) => {
    console.log('Enchanting:', item.name);
    // TODO: Open enchant modal
  };

  const handleCombine = (item) => {
    console.log('Combining:', item.name);
    // TODO: Open combine modal
  };

  const handleSalvage = (item) => {
    console.log('Salvaging:', item.name);
    // TODO: Open salvage modal
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 page-container">
      <style>{`
        .blacksmith-grid {
          display: grid;
          grid-template-columns: 280px 1fr 400px;
          grid-template-rows: auto 1fr;
          gap: 24px;
          height: calc(100vh - 120px);
          grid-template-areas: 
            "header header header"
            "sidebar main details";
        }
        
        @media (max-width: 1200px) {
          .blacksmith-grid {
            grid-template-columns: 1fr 350px;
            grid-template-areas: 
              "header header"
              "main details";
          }
        }
        
        @media (max-width: 768px) {
          .blacksmith-grid {
            grid-template-columns: 1fr;
            grid-template-areas: 
              "header"
              "main";
          }
        }

        /* Updated Quick Actions Styling */
        .quick-action-btn {
          background: transparent;
          border: none;
          color: #cbd5e1;
          padding: 8px 0;
          text-align: left;
          width: 100%;
          font-size: 0.9rem;
          font-weight: 500;
          position: relative;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .quick-action-btn::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #1e40af);
          transition: width 0.4s ease, box-shadow 0.3s ease;
        }

        .quick-action-btn:hover {
          color: #60a5fa;
          text-shadow: 0 0 8px rgba(96, 165, 250, 0.4);
          transform: translateY(-1px);
        }

        .quick-action-btn:hover::after {
          width: 100%;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
        }

        .quick-action-btn svg {
          transition: all 0.3s ease;
        }

        .quick-action-btn:hover svg {
          color: #60a5fa;
          filter: drop-shadow(0 0 4px rgba(96, 165, 250, 0.6));
        }
      `}</style>

      <div className="blacksmith-grid">
        {/* Header */}
        <div className="blacksmith-header" style={{ gridArea: 'header' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">BLACKSMITH'S FORGE</h1>
              <p className="text-slate-400">Manage, enhance, and organize your legendary equipment</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* Search */}
            <div className="relative flex-grow min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'all' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                All
              </button>
              <button
                onClick={() => setViewMode('by-game')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'by-game' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-4 h-4" />
                By Game
              </button>
              <button
                onClick={() => setViewMode('by-genre')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'by-genre' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                By Genre
              </button>
              <button
                onClick={() => setViewMode('collab')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'collab' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                Collaborations
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {viewMode === 'by-game' && (
              <Select value={selectedGame} onValueChange={setSelectedGame}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select Game" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Games</SelectItem>
                  {availableGames.map(game => (
                    <SelectItem key={game.id} value={game.id}>{game.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {viewMode === 'by-genre' && (
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Genres</SelectItem>
                  {availableGenres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={rarityFilter} onValueChange={setRarityFilter}>
              <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rarity</SelectItem>
                <SelectItem value="Common">Common</SelectItem>
                <SelectItem value="Uncommon">Uncommon</SelectItem>
                <SelectItem value="Rare">Rare</SelectItem>
                <SelectItem value="Epic">Epic</SelectItem>
                <SelectItem value="Legendary">Legendary</SelectItem>
                <SelectItem value="Mythic">Mythic</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Weapon">Weapon</SelectItem>
                <SelectItem value="Armor">Armor</SelectItem>
                <SelectItem value="Trinket">Trinket</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="rarity">Rarity</SelectItem>
                <SelectItem value="level">Level</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sidebar (materials, quick actions) */}
        <div className="hidden lg:block blacksmith-sidebar bg-slate-800/50 rounded-xl p-4" style={{ gridArea: 'sidebar' }}>
          <h3 className="font-bold text-white mb-4">Materials</h3>
          <div className="space-y-2 mb-6">
            {materials.slice(0, 5).map(material => (
              <div key={material.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
                <span className="text-sm text-slate-300">{material.name}</span>
                <Badge className={`${rarityColors[material.rarity]} text-xs`}>
                  {material.quantity}
                </Badge>
              </div>
            ))}
          </div>

          <h3 className="font-bold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="quick-action-btn">
              <Sparkles className="w-4 h-4" />
              Bulk Enchant
            </button>
            <button className="quick-action-btn">
              <Gem className="w-4 h-4" />
              Auto Combine
            </button>
            <button className="quick-action-btn">
              <Trash2 className="w-4 h-4" />
              Bulk Salvage
            </button>
          </div>
        </div>

        {/* Main Inventory Grid */}
        <div className="blacksmith-main bg-slate-800/30 rounded-xl p-6 overflow-y-auto" style={{ gridArea: 'main' }}>
          {viewMode === 'collab' ? (
            <CraftingCollaborations />
          ) : (
          <AnimatePresence mode="wait">
            {Object.entries(organizedItems).map(([groupName, items]) => (
              <motion.div
                key={groupName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8"
              >
                {Object.keys(organizedItems).length > 1 && (
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    {groupName} ({items.length})
                  </h2>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onClick={handleItemClick}
                      isSelected={selectedItem?.id === item.id}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          )}
        </div>

        {/* Item Details Panel */}
        <div className="blacksmith-details" style={{ gridArea: 'details' }}>
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <ItemDetailsPanel
                key={selectedItem.id}
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                onEnchant={handleEnchant}
                onCombine={handleCombine}
                onSalvage={handleSalvage}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-800/30 rounded-xl p-6 h-full flex items-center justify-center"
              >
                <div className="text-center text-slate-500">
                  <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Select an Item</h3>
                  <p className="text-sm">Click on any item to view its details and available actions.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}