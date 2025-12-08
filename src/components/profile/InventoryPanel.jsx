import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Grid, Globe, Sword, Shield, Zap, Sparkles, ScrollText, Hammer, Database, 
  SlidersHorizontal, ChevronRight, ChevronLeft, Gamepad2, TrendingUp, Coins, Info, 
  ArrowLeftRight, DollarSign, Gavel, Ghost 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { itemData } from './mockData';

// --- Components from TradingPostContent ---

const RarityBadge = ({ rarity }) => {
  const styles = {
    Mythic: "bg-red-500/10 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]",
    Legendary: "bg-orange-500/10 text-orange-400 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.3)]",
    Epic: "bg-purple-500/10 text-purple-400 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]",
    Rare: "bg-blue-500/10 text-blue-400 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]",
    Uncommon: "bg-green-500/10 text-green-400 border-green-500/50",
    Common: "bg-slate-500/10 text-slate-400 border-slate-500/50"
  };

  return (
    <Badge variant="outline" className={`${styles[rarity] || styles.Common} border px-2 py-0.5 uppercase tracking-wider text-[10px] font-bold`}>
      {rarity}
    </Badge>
  );
};

const SwordsIcon = ({ className }) => <Sword className={className} />;

// Helper to ensure we have game and genre data
const augmentItem = (item) => {
    const details = item.itemId ? (itemData[item.itemId] || item) : item;
    let game = details.game || "Unknown Game";
    let genre = details.genreCompatibility ? details.genreCompatibility[0] : "Misc";

    // Map based on existing mock data genreCompatibility if game is missing
    if (!details.game && details.genreCompatibility) {
        if (details.genreCompatibility.includes('MMO')) game = "Elder Scrolls: Reborn";
        else if (details.genreCompatibility.includes('Shooter')) game = "Vanguard Ops";
        else if (details.genreCompatibility.includes('Fantasy')) game = "Diablo II: Eternal";
        else if (details.genreCompatibility.includes('Sci-Fi')) game = "Cyberpunk 2088";
    }

    if (genre === 'Fantasy') genre = 'MMO'; 
    if (game === "Vanguard Ops") genre = "Shooter";
    if (game === "Cyberpunk 2088") genre = "Sci-Fi";
    if (game === "Elder Scrolls: Reborn") genre = "MMO";

    return { ...details, ...item, game, genre };
};

export default function InventoryPanel({ inventory = [], capacity, profile }) {
    const [subTabGenre, setSubTabGenre] = useState(null);
    const [subTabGame, setSubTabGame] = useState(null);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);

    // Process inventory
    const processedInventory = useMemo(() => {
        return inventory.map(item => augmentItem(item));
    }, [inventory]);

    // Derived Data Structures
    const { genres, gamesByGenre, itemsByGame } = useMemo(() => {
        const _genres = new Set();
        const _gamesByGenre = {};
        const _itemsByGame = {};

        processedInventory.forEach(item => {
            const g = item.genre || 'Misc';
            const game = item.game || 'Unknown Game';
            
            _genres.add(g);
            
            if (!_gamesByGenre[g]) _gamesByGenre[g] = new Set();
            _gamesByGenre[g].add(game);
            
            if (!_itemsByGame[game]) _itemsByGame[game] = [];
            _itemsByGame[game].push(item);
        });

        // Ensure we have some default genres if empty, matching the requested list
        const defaultGenres = ["MMORPG", "Sci-Fi", "Fantasy", "Shooter", "RPG", "Action"];
        defaultGenres.forEach(g => {
            if (!_genres.has(g)) _genres.add(g);
        });

        return {
            genres: Array.from(_genres).sort(),
            gamesByGenre: Object.fromEntries(Object.entries(_gamesByGenre).map(([k, v]) => [k, Array.from(v)])),
            itemsByGame: _itemsByGame
        };
    }, [processedInventory]);

    return (
        <div className="h-[700px] w-full flex gap-6">
            {/* Category Menu Box (Left Side) */}
            <aside className="w-64 flex-shrink-0 h-full">
                <div className="h-full p-5 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-lg flex flex-col overflow-hidden">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Grid className="w-4 h-4 text-cyan-500" />
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Game Genres</h3>
                        </div>
                        <p className="text-[10px] text-slate-400">Select a category</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                        {genres.map((genre) => (
                            <button 
                                key={genre}
                                onClick={() => { setSubTabGenre(genre); setSubTabGame(null); setSelectedInventoryItem(null); }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${subTabGenre === genre ? 'bg-cyan-900/20 text-cyan-400 font-medium' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                {genre}
                                {(subTabGenre === genre) && <ChevronRight className="w-3 h-3 text-cyan-500" />}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>
            
            {/* Content Area (Right Side) */}
            <div className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar">
                {!subTabGenre ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <Gamepad2 className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Select a Genre to View Games</p>
                        <p className="text-sm opacity-60">Choose from the list on the left</p>
                    </div>
                ) : !subTabGame ? (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="flex items-center gap-3 mb-8">
                            <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 px-3 py-1">{subTabGenre}</Badge>
                            <h2 className="text-2xl font-bold text-white">Available Games</h2>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-6">
                            {(gamesByGenre[subTabGenre] || []).length > 0 ? (
                                gamesByGenre[subTabGenre].map((game) => (
                                    <motion.div 
                                        key={game}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setSubTabGame(game)}
                                        className="bg-slate-800/40 border border-white/5 rounded-xl p-4 cursor-pointer hover:bg-slate-800/60 hover:border-cyan-500/30 transition-all group h-48 flex flex-col"
                                    >
                                        <div className="flex-1 flex items-center justify-center bg-black/20 rounded-lg mb-4 relative overflow-hidden">
                                            <Gamepad2 className="w-12 h-12 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">{game}</h3>
                                                <p className="text-xs text-slate-500">{(itemsByGame[game] || []).length} Items</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400" />
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full flex flex-col items-center justify-center text-slate-500 py-12">
                                    <Ghost className="w-8 h-8 mb-2 opacity-30" />
                                    <p>No games found with items in this genre</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                        <button 
                            onClick={() => { setSubTabGame(null); setSelectedInventoryItem(null); }}
                            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors w-fit"
                        >
                            <ChevronLeft className="w-4 h-4" /> Back to {subTabGenre} Games
                        </button>
                        
                        <div className="flex items-end gap-6 mb-8 border-b border-white/5 pb-6">
                            <div className="w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 flex items-center justify-center shadow-xl">
                                <Gamepad2 className="w-10 h-10 text-cyan-400" />
                            </div>
                            <div>
                                <Badge className="mb-2 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">{subTabGenre}</Badge>
                                <h2 className="text-4xl font-black text-white tracking-tight">{subTabGame}</h2>
                                <p className="text-slate-400 mt-1">Your Progress & Collection</p>
                            </div>
                        </div>

                        <div className="flex flex-1 gap-6 overflow-hidden">
                            <div className="w-2/3 flex flex-col gap-4">
                                {/* Content: Filters & Items (No Box) */}
                                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                    {['All Items', 'Weapons', 'Armor', 'Consumables', 'Materials'].map((filter) => (
                                        <button key={filter} className="px-4 py-2 rounded-full bg-slate-800/50 border border-white/5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 transition-all whitespace-nowrap">
                                            {filter}
                                        </button>
                                    ))}
                                    <div className="ml-auto text-xs text-amber-400 font-mono flex items-center gap-1 bg-amber-950/30 px-3 py-1 rounded border border-amber-500/20">
                                        <Coins className="w-3 h-3" /> 14,520 G
                                    </div>
                                </div>

                                {/* Items Grid - Removed Outer Box Styles */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar pt-2">
                                    <div className="grid grid-cols-5 gap-3">
                                        {(itemsByGame[subTabGame] || []).map((item) => (
                                            <div 
                                                key={item.id}
                                                onClick={() => setSelectedInventoryItem(item)}
                                                className={`
                                                    aspect-square rounded-lg border-2 relative group cursor-pointer transition-all
                                                    flex flex-col items-center justify-center bg-slate-900/80
                                                    ${selectedInventoryItem?.id === item.id 
                                                        ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-105 z-10' 
                                                        : item.rarity === 'Legendary' ? 'border-orange-500/30 hover:border-orange-400'
                                                        : item.rarity === 'Epic' ? 'border-purple-500/30 hover:border-purple-400'
                                                        : item.rarity === 'Rare' ? 'border-blue-500/30 hover:border-blue-400'
                                                        : 'border-slate-700 hover:border-slate-500'
                                                    }
                                                `}
                                            >
                                                {item.icon_url || item.icon ? (
                                                    <img src={item.icon_url || item.icon} alt={item.name} className="w-3/4 h-3/4 object-contain" />
                                                ) : (
                                                    <SwordsIcon className={`w-8 h-8 ${
                                                        item.rarity === 'Legendary' ? 'text-orange-400' :
                                                        item.rarity === 'Epic' ? 'text-purple-400' :
                                                        item.rarity === 'Rare' ? 'text-blue-400' : 'text-slate-500'
                                                    }`} />
                                                )}
                                                
                                                <div className="absolute top-1 left-1 text-[9px] font-mono text-slate-500">
                                                    Lv.{item.level || item.levelRequirement || 1}
                                                </div>

                                                <div className="absolute bottom-1 right-1">
                                                    {/* Demand indicator mock */}
                                                    {item.rarity === 'Legendary' && <TrendingUp className="w-3 h-3 text-green-500" />}
                                                </div>
                                            </div>
                                        ))}
                                        {[...Array(Math.max(0, 20 - (itemsByGame[subTabGame] || []).length))].map((_, i) => (
                                            <div key={`empty-${i}`} className="aspect-square rounded-lg border border-white/5 bg-slate-900/20 flex items-center justify-center opacity-30">
                                                <div className="w-2 h-2 rounded-full bg-slate-800" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="w-1/3 bg-slate-900/80 rounded-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
                                {selectedInventoryItem ? (
                                    <>
                                        <div className="h-48 relative bg-gradient-to-b from-slate-800 to-slate-950 flex items-center justify-center overflow-hidden group">
                                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                                            
                                            {selectedInventoryItem.icon_url || selectedInventoryItem.icon ? (
                                                 <img src={selectedInventoryItem.icon_url || selectedInventoryItem.icon} alt={selectedInventoryItem.name} className="w-24 h-24 object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110" />
                                            ) : (
                                                <SwordsIcon className={`w-24 h-24 drop-shadow-2xl transition-transform duration-500 group-hover:scale-110 ${
                                                    selectedInventoryItem.rarity === 'Legendary' ? 'text-orange-500' :
                                                    selectedInventoryItem.rarity === 'Epic' ? 'text-purple-500' :
                                                    selectedInventoryItem.rarity === 'Rare' ? 'text-blue-500' : 'text-slate-400'
                                                }`} />
                                            )}
                                            
                                            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                                                <Badge className={`
                                                    ${selectedInventoryItem.rarity === 'Legendary' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' :
                                                    selectedInventoryItem.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' :
                                                    selectedInventoryItem.rarity === 'Rare' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-slate-700 text-slate-300'}
                                                `}>
                                                    {selectedInventoryItem.rarity}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
                                            <div>
                                                <h3 className="text-xl font-bold text-white leading-tight">{selectedInventoryItem.name}</h3>
                                                <p className="text-xs text-slate-400 mt-1">{selectedInventoryItem.type || 'Item'} • Item Level {selectedInventoryItem.level || selectedInventoryItem.levelRequirement || 1}</p>
                                            </div>

                                            <div className="text-sm text-slate-300 italic border-l-2 border-white/10 pl-3 py-1">
                                                "{selectedInventoryItem.description || 'No description available.'}"
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-slate-950/50 p-2 rounded border border-white/5">
                                                    <div className="text-[10px] text-slate-500 uppercase">Power</div>
                                                    <div className="text-lg font-mono text-white">{selectedInventoryItem.power || 0}</div>
                                                </div>
                                                <div className="bg-slate-950/50 p-2 rounded border border-white/5">
                                                    <div className="text-[10px] text-slate-500 uppercase">Weight</div>
                                                    <div className="text-lg font-mono text-white">2.5kg</div>
                                                </div>
                                            </div>

                                            <div className="mt-auto bg-cyan-950/20 rounded-xl p-4 border border-cyan-500/20">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1">
                                                        <TrendingUp className="w-3 h-3" /> Market Value
                                                    </div>
                                                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">
                                                        High Demand
                                                    </Badge>
                                                </div>
                                                
                                                <div className="flex items-end justify-between mb-4">
                                                    <div>
                                                        <div className="text-[10px] text-slate-400">Average Price</div>
                                                        <div className="text-2xl font-black text-white flex items-center gap-1">
                                                            <Coins className="w-4 h-4 text-amber-400" /> {selectedInventoryItem.marketPrice || 1200}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] text-slate-400">Last Sold</div>
                                                        <div className="text-xs text-white">2 mins ago</div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2">
                                                    <Button 
                                                      variant="default"
                                                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-1"
                                                    >
                                                        <ArrowLeftRight className="w-3 h-3 mr-1" /> Trade
                                                    </Button>
                                                    <Button 
                                                      variant="default"
                                                      className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-1"
                                                    >
                                                        <DollarSign className="w-3 h-3 mr-1" /> Sell
                                                    </Button>
                                                    <Button 
                                                      variant="default"
                                                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-1"
                                                    >
                                                        <Gavel className="w-3 h-3 mr-1" /> Bid
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                                        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 animate-pulse">
                                            <Info className="w-8 h-8 opacity-50" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-400 mb-1">Item Inspector</h4>
                                        <p className="text-xs">Select an item from your inventory to view details, market analytics, and listing options.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}