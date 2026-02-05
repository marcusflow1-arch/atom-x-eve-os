import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Star, ShoppingCart, Zap, Clock, Users, Wifi, 
    WifiOff, Trophy, Flame, Eye, Play, DollarSign,
    Compass, TrendingUp, Video, Calendar, Activity,
    ThumbsUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Specialized Price Filter Component
const PriceSpotlightRow = ({ games, onGameClick, onGameHover, activeId }) => {
    const [maxPrice, setMaxPrice] = useState(30);
    
    // Sort games by price ascending, then filter
    const filteredGames = games
        .filter(g => {
            const p = g.price === 'Free' ? 0 : parseFloat(g.price);
            return p >= 0 && p < maxPrice;
        })
        .slice(0, 6);

    return (
        <div className="flex flex-col gap-4">
             <div className="flex items-center flex-wrap gap-4 px-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                        <DollarSign className="w-4 h-4 text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-wide">Budget Gaming</h3>
                </div>
                <div className="h-6 w-px bg-white/10 hidden sm:block" />
                <div className="flex gap-2">
                    {[30, 20, 10, 5].map(price => (
                        <button 
                            key={price}
                            onClick={() => setMaxPrice(price)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1 ${
                                maxPrice === price 
                                ? 'bg-green-500 text-black border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                                : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <span>Under ${price}</span>
                        </button>
                    ))}
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {filteredGames.length > 0 ? (
                    filteredGames.map((game) => (
                        <GameGridCard 
                            key={game.id} 
                            game={game} 
                            isActive={activeId === game.id} 
                            onClick={onGameClick}
                            onHover={onGameHover} 
                        />
                    ))
                ) : (
                    <div className="col-span-6 h-40 flex items-center justify-center text-white/30 text-sm border border-dashed border-white/10 rounded-xl">
                        No games found under ${maxPrice} in this view.
                    </div>
                )}
             </div>
        </div>
    );
};

// Reusable Card Component
const GameGridCard = ({ game, isActive, onClick, onHover }) => (
    <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        onClick={() => onClick(game)}
        onMouseEnter={() => onHover && onHover(game)}
        className={`
            relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border transition-all duration-300
            ${isActive 
                ? 'ring-2 ring-white border-transparent shadow-[0_0_20px_rgba(255,255,255,0.3)] z-10' 
                : 'border-white/5 hover:border-white/20 hover:shadow-lg'
            }
        `}
    >
        <img 
            src={game.cover_image || game.image} 
            alt={game.title} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        
        <div className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-2 text-center transition-opacity duration-300 ${isActive ? 'opacity-0' : 'opacity-0 hover:opacity-100'}`}>
            <span className="text-xs font-bold text-white mb-1">{game.title}</span>
            <span className="text-[10px] text-green-400 font-mono">
                ${game.price === 0 || game.price === 'Free' ? 'FREE' : game.price}
            </span>
        </div>

        {isActive && (
            <div className="absolute inset-0 bg-white/10 pointer-events-none" />
        )}
    </motion.div>
);

export default function StoreGridSpotlight({ games, onNavigate }) {
    const [selectedGame, setSelectedGame] = useState(null);
    const [heroKey, setHeroKey] = useState(0);

    // Initialize selected game
    useEffect(() => {
        if (games && games.length > 0 && !selectedGame) {
            setSelectedGame(games[0]);
        }
    }, [games]);

    const handleGameHover = (game) => {
        setSelectedGame(game);
        setHeroKey(prev => prev + 1);
    };

    const handleGameClick = (game) => {
        onNavigate(game.id);
    };

    // --- Enhanced Data Slicing ---
    
    // 1. Exclusive
    const exclusiveGames = games.filter((_, i) => i % 6 === 0).slice(0, 6);
    
    // 2. Discover (Random slice for discovery)
    const gamesToDiscover = games.slice(8, 14);
    
    // 3. Recommended (Mock: based on selected game genre or just highly rated)
    const recommendedGames = games
        .filter(g => g.id !== selectedGame?.id && (g.genre === selectedGame?.genre || g.rating > 4.5))
        .slice(0, 6);

    // 4. Top Games (Rating > 4.6)
    const topGames = games.filter(g => g.rating >= 4.6).sort((a,b) => b.rating - a.rating).slice(0, 6);

    // 5. Most Played (Mock: based on ID or random factor)
    const mostPlayedGames = games.filter((_, i) => (i + 3) % 4 === 0).slice(0, 6);

    // 6. Creator Trends (Specific genres typically streamed)
    const creatorGames = games
        .filter(g => ['Horror', 'Multiplayer', 'Shooter', 'Survival'].includes(g.genre))
        .slice(0, 6);

    // 7. Live Events (Mock: specific slice)
    const eventGames = games.slice(15, 21);

    // 8. Other categories
    const onSaleGames = games.filter(g => {
        const p = parseFloat(g.price);
        return p > 0 && p < 25;
    }).slice(0, 6);
    
    const hiddenGems = games.filter(g => g.rating >= 4.7 && g.price < 20).slice(0, 6);
    const freeToPlay = games.filter(g => g.price === 0 || g.price === 'Free').slice(0, 6);
    const onlineGames = games.filter(g => ['Shooter', 'Strategy', 'Sports', 'MMO', 'MOBA'].includes(g.genre)).slice(0, 6);
    const offlineGames = games.filter(g => ['RPG', 'Adventure', 'Horror', 'Puzzle'].includes(g.genre)).slice(0, 6);

    if (!selectedGame) return null;

    return (
        <div className="w-full flex flex-col gap-12 pb-24">
            
            {/* HERO SECTION */}
            <div className="relative w-full h-[550px] rounded-[32px] overflow-hidden shadow-2xl border border-white/10 group">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={heroKey}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0"
                    >
                        <img 
                            src={selectedGame.cover_image || selectedGame.image} 
                            alt={selectedGame.title} 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419] via-[#0f1419]/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1419] via-[#0f1419]/50 to-transparent" />
                    </motion.div>
                </AnimatePresence>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 p-8 md:p-12 lg:p-16 w-full md:w-3/4 lg:w-1/2 z-10 flex flex-col gap-5">
                    <motion.div 
                        key={`content-${heroKey}`}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 50 }}
                    >
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <Badge className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white px-3 py-1 text-xs uppercase tracking-widest">
                                {selectedGame.genre}
                            </Badge>
                            {selectedGame.rating && (
                                <div className="flex items-center gap-1.5 text-yellow-400 bg-black/40 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                    <span className="text-xs font-bold">{selectedGame.rating}</span>
                                </div>
                            )}
                            {parseFloat(selectedGame.price) === 0 && (
                                <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                                    Free to Play
                                </div>
                            )}
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-white mb-4 leading-[0.9] tracking-tight drop-shadow-2xl">
                            {selectedGame.title}
                        </h1>

                        <p className="text-white/70 text-sm md:text-base line-clamp-3 mb-8 leading-relaxed font-medium">
                            {selectedGame.description || "Embark on an unforgettable adventure. Master unique abilities, explore vast and beautiful worlds, and forge your own destiny in this masterpiece."}
                        </p>

                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => onNavigate(selectedGame.id)}
                                className="px-8 py-4 bg-white text-black rounded-full font-bold text-sm hover:bg-white/90 transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-2"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                Play Now
                            </button>
                            <button className="px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-full font-bold text-sm hover:bg-white/10 transition-all flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4" />
                                <span className="text-green-400">${selectedGame.price === 'Free' || selectedGame.price === 0 ? 'Free' : selectedGame.price}</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* EXCLUSIVE SECTION */}
            <CategoryRow 
                title="Exclusive Titles" 
                icon={Trophy} 
                color="text-amber-400" 
                games={exclusiveGames} 
                activeId={selectedGame?.id}
                onGameClick={handleGameClick}
                onGameHover={handleGameHover}
            />

            {/* INTERACTIVE PRICE FILTER SECTION */}
            <PriceSpotlightRow 
                games={games} 
                onGameClick={handleGameClick}
                onGameHover={handleGameHover}
                activeId={selectedGame?.id}
            />

            {/* DISCOVERY SECTION */}
            <CategoryRow 
                title="Games to Discover" 
                icon={Compass} 
                color="text-cyan-400" 
                games={gamesToDiscover} 
                activeId={selectedGame?.id}
                onGameClick={handleGameClick}
                onGameHover={handleGameHover}
            />

            {/* RECOMMENDED SECTION */}
            <CategoryRow 
                title="Recommended For You" 
                icon={ThumbsUp} 
                color="text-pink-400" 
                games={recommendedGames} 
                activeId={selectedGame?.id}
                onGameClick={handleGameClick}
                onGameHover={handleGameHover}
            />

            {/* TOP & MOST PLAYED GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <CategoryRow 
                    title="Top Rated Games" 
                    icon={Star} 
                    color="text-yellow-400" 
                    games={topGames} 
                    activeId={selectedGame?.id}
                    onGameClick={handleGameClick}
                    onGameHover={handleGameHover}
                    cols={3}
                />
                <CategoryRow 
                    title="Most Played by Users" 
                    icon={Activity} 
                    color="text-orange-400" 
                    games={mostPlayedGames} 
                    activeId={selectedGame?.id}
                    onGameClick={handleGameClick}
                    onGameHover={handleGameHover}
                    cols={3}
                />
            </div>

            {/* CONTENT CREATORS SECTION */}
            <CategoryRow 
                title="Trending for Creators" 
                icon={Video} 
                color="text-purple-400" 
                games={creatorGames} 
                activeId={selectedGame?.id}
                onGameClick={handleGameClick}
                onGameHover={handleGameHover}
            />

            {/* LIVE EVENTS */}
            <CategoryRow 
                title="Live Events & Seasons" 
                icon={Calendar} 
                color="text-rose-400" 
                games={eventGames} 
                activeId={selectedGame?.id}
                onGameClick={handleGameClick}
                onGameHover={handleGameHover}
            />

            {/* STANDARD CATEGORIES */}
            <CategoryRow title="On Sale" icon={Flame} color="text-red-400" games={onSaleGames} activeId={selectedGame?.id} onGameClick={handleGameClick} onGameHover={handleGameHover} />
            <CategoryRow title="Hidden Gems" icon={Eye} color="text-purple-400" games={hiddenGems} activeId={selectedGame?.id} onGameClick={handleGameClick} onGameHover={handleGameHover} />
            <CategoryRow title="Free to Play" icon={Zap} color="text-blue-400" games={freeToPlay} activeId={selectedGame?.id} onGameClick={handleGameClick} onGameHover={handleGameHover} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <CategoryRow title="Online Multiplayer" icon={Wifi} color="text-green-400" games={onlineGames} activeId={selectedGame?.id} onGameClick={handleGameClick} onGameHover={handleGameHover} cols={3} />
                <CategoryRow title="Offline Adventures" icon={WifiOff} color="text-slate-400" games={offlineGames} activeId={selectedGame?.id} onGameClick={handleGameClick} onGameHover={handleGameHover} cols={3} />
            </div>

        </div>
    );
}

// Helper Component for Rows
const CategoryRow = ({ title, icon: Icon, color, games, activeId, onGameClick, onGameHover, cols }) => {
    if (!games || games.length === 0) return null;
    
    // Determine grid columns class based on props or default
    const gridClass = cols 
        ? `grid-cols-2 md:grid-cols-${cols}` 
        : "grid-cols-2 md:grid-cols-3 lg:grid-cols-6";

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-2">
                <Icon className={`w-5 h-5 ${color}`} />
                <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-4" />
            </div>

            <div className={`grid ${gridClass} gap-4`}>
                {games.map((game) => (
                    <GameGridCard 
                        key={game.id} 
                        game={game} 
                        isActive={activeId === game.id} 
                        onClick={onGameClick} 
                        onHover={onGameHover}
                    />
                ))}
            </div>
        </div>
    );
};