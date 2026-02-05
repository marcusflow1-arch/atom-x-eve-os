import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Star, ShoppingCart, Zap, Clock, Users, Wifi, 
    WifiOff, Trophy, Flame, Eye, Play
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StoreGridSpotlight({ games, onNavigate }) {
    const [selectedGame, setSelectedGame] = useState(null);
    const [heroKey, setHeroKey] = useState(0);

    // Initialize selected game
    useEffect(() => {
        if (games && games.length > 0 && !selectedGame) {
            setSelectedGame(games[0]);
        }
    }, [games]);

    const handleGameClick = (game) => {
        setSelectedGame(game);
        setHeroKey(prev => prev + 1);
    };

    // Filter games for categories (Mock logic based on available data)
    const exclusiveGames = games.filter((_, i) => i % 5 === 0).slice(0, 5);
    const onSaleGames = games.filter(g => g.price > 0 && g.price < 30).slice(0, 6);
    const hiddenGems = games.filter(g => g.rating >= 4.5).slice(5, 11);
    const freeToPlay = games.filter(g => g.price === 0 || g.price === 'Free').slice(0, 6);
    const onlineGames = games.filter(g => ['Shooter', 'Strategy', 'Sports', 'MMO'].includes(g.genre)).slice(0, 6);
    const offlineGames = games.filter(g => ['RPG', 'Adventure', 'Horror'].includes(g.genre)).slice(0, 6);

    const categories = [
        { title: "Exclusive Titles", icon: Trophy, data: exclusiveGames, color: "text-amber-400" },
        { title: "On Sale", icon: Flame, data: onSaleGames, color: "text-red-400" },
        { title: "Hidden Gems", icon: Eye, data: hiddenGems, color: "text-purple-400" },
        { title: "Free to Play", icon: Zap, data: freeToPlay, color: "text-blue-400" },
        { title: "Online Multiplayer", icon: Wifi, data: onlineGames, color: "text-green-400" },
        { title: "Offline Adventures", icon: WifiOff, data: offlineGames, color: "text-slate-400" },
    ];

    if (!selectedGame) return null;

    return (
        <div className="w-full flex flex-col gap-8 pb-20">
            {/* HERO SECTION - Changes based on selection */}
            <div className="relative w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={heroKey}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0"
                    >
                        <img 
                            src={selectedGame.cover_image || selectedGame.image} 
                            alt={selectedGame.title} 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419] via-[#0f1419]/50 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1419]/90 via-[#0f1419]/40 to-transparent" />
                    </motion.div>
                </AnimatePresence>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-2/3 z-10 flex flex-col gap-4">
                    <motion.div 
                        key={`content-${heroKey}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Badge className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white px-3 py-1 text-xs uppercase tracking-widest">
                                {selectedGame.genre}
                            </Badge>
                            {selectedGame.rating && (
                                <div className="flex items-center gap-1 text-yellow-400 bg-black/40 px-2 py-1 rounded-full border border-white/5">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span className="text-xs font-bold">{selectedGame.rating}</span>
                                </div>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight tracking-tight drop-shadow-xl">
                            {selectedGame.title}
                        </h1>

                        <p className="text-white/70 text-sm md:text-base line-clamp-3 max-w-xl mb-6 leading-relaxed">
                            {selectedGame.description || "Experience an immersive journey like never before. Dive into a world of endless possibilities, challenging quests, and breathtaking visuals."}
                        </p>

                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => onNavigate(selectedGame.id)}
                                className="px-8 py-4 bg-white text-black rounded-full font-bold text-sm hover:bg-white/90 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                Play Now
                            </button>
                            <button className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-sm hover:bg-white/20 transition-all flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4" />
                                <span className="text-green-400">${selectedGame.price === 'Free' || selectedGame.price === 0 ? 'Free' : selectedGame.price}</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* CATEGORY ROWS */}
            <div className="flex flex-col gap-10 mt-4">
                {categories.map((category, idx) => (
                    <div key={idx} className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 px-2">
                            <category.icon className={`w-5 h-5 ${category.color}`} />
                            <h3 className="text-lg font-bold text-white tracking-wide">{category.title}</h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-4" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {category.data.map((game, gIdx) => (
                                <motion.div
                                    key={game.id}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    onClick={() => handleGameClick(game)}
                                    className={`
                                        relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border transition-all duration-300
                                        ${selectedGame?.id === game.id 
                                            ? 'ring-2 ring-white border-transparent shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                                            : 'border-white/5 hover:border-white/20 hover:shadow-lg'
                                        }
                                    `}
                                >
                                    <img 
                                        src={game.cover_image || game.image} 
                                        alt={game.title} 
                                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                                    />
                                    
                                    {/* Overlay on hover or active */}
                                    <div className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-2 text-center transition-opacity duration-300 ${selectedGame?.id === game.id ? 'opacity-0' : 'opacity-0 hover:opacity-100'}`}>
                                        <span className="text-xs font-bold text-white mb-1">{game.title}</span>
                                        <span className="text-[10px] text-green-400 font-mono">
                                            ${game.price === 0 || game.price === 'Free' ? 'FREE' : game.price}
                                        </span>
                                    </div>

                                    {/* Small Active Indicator */}
                                    {selectedGame?.id === game.id && (
                                        <div className="absolute inset-0 bg-white/10 pointer-events-none" />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}