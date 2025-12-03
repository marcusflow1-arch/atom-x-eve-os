import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Search, Mic, MicOff, Sword, Shield, Sparkles, Box, Database, Ghost, Hammer, ArrowUpRight, ArrowDownLeft, ChevronRight, ChevronLeft, Gamepad2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { itemData, skillData } from './mockData';

const rarityColors = {
    'Common': 'border-slate-600 bg-slate-800/50',
    'Uncommon': 'border-green-500/50 bg-green-900/20',
    'Rare': 'border-blue-500/50 bg-blue-900/20',
    'Epic': 'border-purple-500/50 bg-purple-900/20',
    'Legendary': 'border-orange-500/50 bg-orange-900/20',
    'Mythic': 'border-red-500/50 bg-red-900/20'
};

// Helper to ensure we have game and genre data for the demo
const augmentItem = (item) => {
const details = item.itemId ? (itemData[item.itemId] || item) : item;
// Default values if not present
let game = details.game || "Unknown Game";
let genre = details.genreCompatibility ? details.genreCompatibility[0] : "Misc";

// Map based on existing mock data genreCompatibility if game is missing
if (!details.game && details.genreCompatibility) {
    if (details.genreCompatibility.includes('MMO')) game = "Elder Scrolls: Reborn";
    else if (details.genreCompatibility.includes('Shooter')) game = "Vanguard Ops";
    else if (details.genreCompatibility.includes('Fantasy')) game = "Diablo II: Eternal";
    else if (details.genreCompatibility.includes('Sci-Fi')) game = "Cyberpunk 2088";
}

// Override with explicit genres if needed or map to the new genres
// The user asked for: MMO, Sci-Fi, Shooter, Closed Person
// Mapping existing genres to requested ones for demo purposes
if (genre === 'Fantasy') genre = 'MMO'; // Grouping Fantasy under MMO for this structure or keeping as is? User listed MMO, Sci-Fi, Shooter, Closed Person.
// Let's just ensure we have at least one game for "Closed Person"
if (game === "Vanguard Ops") genre = "Shooter";
if (game === "Cyberpunk 2088") genre = "Sci-Fi";
if (game === "Elder Scrolls: Reborn") genre = "MMO";

return { ...details, ...item, game, genre };
};

const GameCard = ({ title, genre, itemCount, onClick }) => (
    <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="relative h-32 rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden cursor-pointer group"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 to-purple-900/20 group-hover:from-cyan-500/20 group-hover:to-purple-500/20 transition-colors" />
        <div className="absolute inset-0 flex flex-col justify-center items-center p-4">
            <Gamepad2 className="w-8 h-8 text-slate-400 mb-2 group-hover:text-cyan-400 transition-colors" />
            <h3 className="font-bold text-white text-center leading-tight group-hover:text-cyan-300 transition-colors">{title}</h3>
            <p className="text-xs text-slate-500 mt-1">{itemCount} Items</p>
        </div>
    </motion.div>
);

const ItemSlot = ({ item, index, onClick }) => {
    const uniqueId = item.id || item.skillId || `item-${index}`;
    
    return (
        <Draggable draggableId={uniqueId} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onClick(item)}
                    className={`
                        aspect-square rounded-xl border-2 relative group cursor-pointer overflow-hidden
                        ${rarityColors[item.rarity] || rarityColors['Common']}
                        ${snapshot.isDragging ? 'scale-110 z-50 shadow-[0_0_20px_rgba(0,0,0,0.5)]' : 'hover:border-opacity-100 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]'}
                        transition-all duration-200
                    `}
                >
                    <div className="w-full h-full p-2 flex items-center justify-center bg-black/20">
                        <img 
                            src={item.icon_url || item.icon} 
                            alt={item.name}
                            className="max-w-full max-h-full object-contain drop-shadow-md"
                        />
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                        <p className="text-[9px] text-white text-center truncate font-mono">{item.name}</p>
                    </div>

                    {/* Hover Details */}
                    <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center p-2 pointer-events-none z-10">
                        <p className="text-cyan-400 text-[10px] font-bold mb-1">{item.type.toUpperCase()}</p>
                        <p className="text-white text-xs text-center font-bold leading-tight">{item.name}</p>
                        <p className={`text-[9px] mt-1 ${
                            item.rarity === 'Legendary' ? 'text-orange-400' : 
                            item.rarity === 'Epic' ? 'text-purple-400' : 'text-slate-400'
                        }`}>
                            {item.rarity}
                        </p>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

const InventoryPanel = ({ inventory, capacity, profile }) => {
    const [activeGenre, setActiveGenre] = useState('MMO');
    const [selectedGame, setSelectedGame] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Process inventory to include game/genre metadata
    const processedInventory = useMemo(() => {
        return inventory.map(item => augmentItem(item));
    }, [inventory]);

    // Extract Genres
    const genres = useMemo(() => {
        // Enforce specific order and include requested genres even if empty for visual structure
        const requestedGenres = ['MMO', 'Sci-Fi', 'Shooter', 'Closed Person'];
        const existingGenres = new Set();
        
        processedInventory.forEach(item => {
            if (item.genre) existingGenres.add(item.genre);
        });

        // Combine requested genres with any others found, ensuring requested ones come first
        const finalGenres = [...requestedGenres];
        existingGenres.forEach(g => {
            if (!finalGenres.includes(g) && g !== 'All' && g !== 'Misc') finalGenres.push(g);
        });
        
        return finalGenres;
    }, [processedInventory]);

    // Filter Items based on Search & Genre
    const filteredItems = useMemo(() => {
        return processedInventory.filter(item => {
            const matchesSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
            // "All" is not in our new list, so we default to exact match or mapping
            const matchesGenre = item.genre === activeGenre || (item.genreCompatibility && item.genreCompatibility.includes(activeGenre));
            
            // Demo hack: if "Closed Person" is selected and we have no real items, show nothing or map something
            // For now, strictly filtering.
            
            return matchesSearch && matchesGenre;
        });
    }, [processedInventory, activeGenre, searchTerm]);

    // Extract Games from filtered items
    const games = useMemo(() => {
        const g = {};
        filteredItems.forEach(item => {
            if (!g[item.game]) g[item.game] = [];
            g[item.game].push(item);
        });
        return g;
    }, [filteredItems]);

    const handleGameSelect = (gameTitle) => {
        setSelectedGame(gameTitle);
    };

    return (
        <div className="bg-slate-950/90 rounded-xl border border-slate-800 h-[700px] flex overflow-hidden shadow-2xl relative">
            {/* Background Texture/Effect for MMO feel */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

            {/* Left Vertical Sidebar - Genres */}
            <div className="w-48 flex-shrink-0 flex flex-col border-r border-slate-800 bg-black/40 backdrop-blur-md relative z-10">
                <div className="p-6 border-b border-slate-800/50 flex flex-col gap-1">
                    <h3 className="text-xs font-black text-cyan-500 tracking-widest uppercase">SELECT GENRE</h3>
                    <div className="h-0.5 w-8 bg-cyan-500/50" />
                </div>

                <div className="flex-1 overflow-y-auto py-4 relative">
                    {/* Vertical Line */}
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-900 to-transparent" />

                    <div className="flex flex-col gap-1 px-2">
                        {genres.map(genre => (
                            <button
                                key={genre}
                                onClick={() => { setActiveGenre(genre); setSelectedGame(null); }}
                                className={`
                                    relative text-left px-4 py-3 text-sm font-bold uppercase tracking-wide transition-all rounded-lg
                                    ${activeGenre === genre 
                                        ? 'text-cyan-400 bg-cyan-950/30' 
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
                                `}
                            >
                                {genre}
                                {activeGenre === genre && (
                                    <motion.div 
                                        layoutId="activeGenreVertical"
                                        className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-500 rounded-l shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-900/50 to-black/50 relative z-10">
                {/* Top Bar in Content Area for Search */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
                    <div className="text-xs text-slate-500 font-mono">
                        {selectedGame ? `${activeGenre} // ${selectedGame}` : `${activeGenre} // SELECT GAME`}
                    </div>
                    <div className="w-64 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                        <Input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Filter items..."
                            className="h-8 pl-8 bg-slate-900/50 border-slate-700 text-xs focus:border-cyan-500/50 rounded-md"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-hidden relative p-6">
                <AnimatePresence mode="wait">
                    {!selectedGame ? (
                        /* Game Selection View */
                        <motion.div
                            key="games-view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="h-full"
                        >
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {Object.keys(games).map(gameTitle => (
                                    <GameCard 
                                        key={gameTitle}
                                        title={gameTitle}
                                        itemCount={games[gameTitle].length}
                                        onClick={() => handleGameSelect(gameTitle)}
                                    />
                                ))}
                                {Object.keys(games).length === 0 && (
                                    <div className="col-span-full flex flex-col items-center justify-center text-slate-500 h-64">
                                        <Ghost className="w-12 h-12 mb-2 opacity-20" />
                                        <p>No games found in this category</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        /* Inventory Grid View */
                        <motion.div
                            key="inventory-view"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full flex flex-col"
                        >
                            <div className="flex items-center gap-2 mb-6">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setSelectedGame(null)}
                                    className="text-slate-400 hover:text-white pl-0"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Games
                                </Button>
                                <div className="h-4 w-px bg-slate-700 mx-2" />
                                <h2 className="text-xl font-bold text-white">{selectedGame}</h2>
                                <Badge variant="outline" className="ml-2 border-slate-700 text-slate-400">
                                    {games[selectedGame].length} Items
                                </Badge>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                <Droppable droppableId={`inventory-${selectedGame}`} direction="horizontal">
                                    {(provided) => (
                                        <div 
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3"
                                        >
                                            {games[selectedGame].map((item, index) => (
                                                <ItemSlot key={item.id || index} item={item} index={index} />
                                            ))}
                                            {provided.placeholder}
                                            
                                            {/* Empty Slots Filler */}
                                            {[...Array(Math.max(0, 28 - games[selectedGame].length))].map((_, i) => (
                                                <div key={`empty-${i}`} className="aspect-square rounded-xl border border-slate-800/50 bg-slate-900/20 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default InventoryPanel;