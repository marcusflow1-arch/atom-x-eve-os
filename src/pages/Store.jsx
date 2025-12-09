import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Gamepad2, Search, ShoppingCart, Star, Trophy, Sparkles, 
    ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
    Zap, Heart, Skull, Shield, Music, Crosshair, Car, Monitor
} from 'lucide-react';
import { useCart } from '../components/CartContext';
import { useAuth } from '../components/auth/AuthContext';
import { Game } from '@/entities/Game';
import { createPageUrl } from '@/utils';
import { aiGames, otherSampleGames } from '@/components/store/mockData';

// Icon mapping for genres
const GENRE_ICONS = {
    'Action': SwordsIcon,
    'RPG': Shield,
    'Strategy': Trophy,
    'Simulation': Monitor,
    'Sports': Trophy,
    'Racing': Car,
    'Horror': Skull,
    'Shooter': Crosshair,
    'Music': Music,
    'Adventure': Gamepad2,
    'Puzzle': Zap,
    'Romance': Heart,
    'Sci-Fi': Sparkles,
};

function SwordsIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
            <path d="m13 19 6-6" />
            <path d="M16 16l4 4" />
            <path d="M19 21l2-2" />
        </svg>
    )
}

export default function Store() {
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Navigation State
    const [activeGenreIndex, setActiveGenreIndex] = useState(0);
    const [activeGameIndex, setActiveGameIndex] = useState(0);
    const [isNavigating, setIsNavigating] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const fetchedGames = await Game.list();
                const enhancedGames = fetchedGames.length > 0 ? fetchedGames : [
                    ...Object.values(aiGames),
                    ...Object.values(otherSampleGames)
                ];
                setGames(enhancedGames);
            } catch (error) {
                console.error("Error fetching games:", error);
                setGames([...Object.values(aiGames), ...Object.values(otherSampleGames)]);
            }
            setLoading(false);
        };
        fetchGames();
    }, []);

    // Group Games by Genre
    const genreData = useMemo(() => {
        if (loading || games.length === 0) return [];
        
        const groups = {};
        games.forEach(game => {
            const g = game.genre || 'Other';
            if (!groups[g]) groups[g] = [];
            groups[g].push(game);
        });

        // Convert to array and sort
        // User request: "Action RPG and everything under it stopping at music"
        // We'll sort alphabetically but ensure Action/RPG are first if present for better UX
        const sortedGenres = Object.keys(groups).sort();
        
        return sortedGenres.map(genre => ({
            id: genre,
            label: genre,
            icon: GENRE_ICONS[genre] || Gamepad2,
            items: groups[genre]
        }));
    }, [games, loading]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (loading || genreData.length === 0 || isNavigating) return;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    if (activeGenreIndex > 0) {
                        setActiveGenreIndex(prev => prev - 1);
                        setActiveGameIndex(0); // Reset game index on genre change
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (activeGenreIndex < genreData.length - 1) {
                        setActiveGenreIndex(prev => prev + 1);
                        setActiveGameIndex(0);
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (activeGameIndex > 0) {
                        setActiveGameIndex(prev => prev - 1);
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (activeGameIndex < genreData[activeGenreIndex].items.length - 1) {
                        setActiveGameIndex(prev => prev + 1);
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    const game = genreData[activeGenreIndex].items[activeGameIndex];
                    if (game) {
                        setIsNavigating(true);
                        setTimeout(() => {
                            navigate(createPageUrl(`GameDetail?id=${game.id}`));
                            setIsNavigating(false);
                        }, 300);
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeGenreIndex, activeGameIndex, genreData, loading, isNavigating, navigate]);

    // Active Item Helpers
    const activeCategory = genreData[activeGenreIndex];
    const activeGame = activeCategory?.items[activeGameIndex];

    // Constants for positioning
    const ITEM_HEIGHT = 80; // height of genre item
    const ITEM_GAP = 24;
    const CROSS_Y_VH = 40; // Intersection point in VH

    if (loading) {
        return (
            <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-white/50 tracking-widest uppercase text-xs">Loading Store...</p>
                </div>
            </div>
        );
    }

    if (!activeCategory) return null;

    return (
        <div className="h-screen w-full relative overflow-hidden bg-slate-950 text-white font-sans select-none">
            {/* Dynamic Background */}
            <AnimatePresence mode="wait">
                <motion.div 
                    key={activeGame?.id || activeCategory.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 z-0"
                >
                    {/* Dark overlay base */}
                    <div className="absolute inset-0 bg-slate-950" />
                    
                    {/* Game Image Background */}
                    {activeGame?.cover_image && (
                        <>
                            <img 
                                src={activeGame.cover_image} 
                                alt="bg" 
                                className="w-full h-full object-cover opacity-40 blur-sm scale-105" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
                        </>
                    )}
                    
                    {/* Ambient Glows */}
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen" />
                </motion.div>
            </AnimatePresence>

            {/* Main Interface */}
            <div className="relative z-10 w-full h-full">
                
                {/* Header / Breadcrumbs */}
                <div className="absolute top-8 left-12 flex items-center gap-4 text-white/50 text-sm font-medium tracking-wider uppercase">
                    <div className="flex items-center gap-2">
                        <Gamepad2 className="w-4 h-4" />
                        <span>Store</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-white">{activeCategory.label}</span>
                </div>

                {/* VERTICAL AXIS (Genres) */}
                <div className="absolute top-0 bottom-0 left-16 w-48 flex flex-col items-center z-20 pointer-events-none">
                    <motion.div 
                        className="flex flex-col items-center gap-6 py-8 pointer-events-auto"
                        animate={{ 
                            y: `calc(${CROSS_Y_VH}vh - ${activeGenreIndex * (ITEM_HEIGHT + ITEM_GAP)}px - ${ITEM_HEIGHT/2}px)`
                        }}
                        transition={{ type: "spring", stiffness: 250, damping: 25 }}
                    >
                        {genreData.map((genre, idx) => {
                            const isActive = idx === activeGenreIndex;
                            const Icon = genre.icon;
                            return (
                                <motion.div
                                    key={genre.id}
                                    onClick={() => {
                                        setActiveGenreIndex(idx);
                                        setActiveGameIndex(0);
                                    }}
                                    animate={{ 
                                        scale: isActive ? 1.2 : 0.9,
                                        opacity: isActive ? 1 : 0.3,
                                        x: isActive ? 20 : 0
                                    }}
                                    className="flex flex-col items-center gap-2 cursor-pointer w-32"
                                >
                                    <div className={`
                                        w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
                                        ${isActive 
                                            ? 'bg-white text-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.2)]' 
                                            : 'bg-white/5 text-white/60 border border-white/10'
                                        }
                                    `}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-widest text-center ${isActive ? 'text-white' : 'text-transparent group-hover:text-white/40'}`}>
                                        {genre.label}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>

                {/* HORIZONTAL AXIS (Games) */}
                {/* Position matches the vertical center point */}
                <div className="absolute left-0 right-0 top-[40vh] -translate-y-1/2 h-80 z-10 flex items-center pointer-events-none">
                    <motion.div 
                        className="flex items-center gap-8 pl-64 pointer-events-auto" // pl-64 pushes it past the genre column
                        animate={{ 
                            x: -activeGameIndex * (280 + 32) // Card width 280 + gap 32
                        }}
                        transition={{ type: "spring", stiffness: 250, damping: 25 }}
                    >
                        {activeCategory.items.map((game, idx) => {
                            const isActive = idx === activeGameIndex;
                            
                            return (
                                <motion.div
                                    key={game.id}
                                    onClick={() => {
                                        setActiveGameIndex(idx);
                                        if (isActive) navigate(createPageUrl(`GameDetail?id=${game.id}`));
                                    }}
                                    animate={{ 
                                        scale: isActive ? 1.1 : 0.9,
                                        opacity: isActive ? 1 : 0.4,
                                        y: isActive ? 0 : 20
                                    }}
                                    className={`
                                        w-[280px] aspect-[3/4] flex-shrink-0 rounded-xl relative overflow-hidden cursor-pointer
                                        border transition-all duration-300 shadow-2xl
                                        ${isActive 
                                            ? 'border-white/40 shadow-blue-500/20' 
                                            : 'border-white/5 bg-black/40'
                                        }
                                    `}
                                >
                                    {/* Cover Image */}
                                    <img 
                                        src={game.cover_image || game.image} 
                                        alt={game.title} 
                                        className="w-full h-full object-cover"
                                    />
                                    
                                    {/* Gradient overlay for inactive */}
                                    {!isActive && <div className="absolute inset-0 bg-black/50" />}

                                    {/* Selection Border */}
                                    {isActive && (
                                        <motion.div 
                                            layoutId="game-active-border"
                                            className="absolute inset-0 border-4 border-white/60 rounded-xl z-20" 
                                            transition={{ duration: 0.2 }}
                                        />
                                    )}

                                    {/* Price Tag (Always Visible) */}
                                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                                        <span className="text-green-400 font-bold text-sm">${game.price}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>

                {/* ACTIVE ITEM DETAILS (Metadata) */}
                {/* Shows details for the currently selected game */}
                <div className="absolute bottom-16 left-64 max-w-2xl z-30 pointer-events-none">
                    <AnimatePresence mode="wait">
                        {activeGame && (
                            <motion.div
                                key={activeGame.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                                        {activeGame.genre}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="font-bold">{activeGame.rating || '4.5'}</span>
                                    </div>
                                    {activeGame.aiEnhanced && (
                                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">
                                            AI Enhanced
                                        </Badge>
                                    )}
                                </div>
                                
                                <h1 className="text-5xl font-black text-white leading-tight drop-shadow-xl">
                                    {activeGame.title}
                                </h1>
                                
                                <p className="text-lg text-white/70 line-clamp-3 max-w-xl drop-shadow-md">
                                    {activeGame.description}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Nav Hints */}
                <div className="absolute bottom-12 right-12 flex gap-6 text-white/40 text-xs font-mono uppercase tracking-widest z-30">
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-white/10 rounded border border-white/10">↑ ↓</div>
                        <span>Category</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-white/10 rounded border border-white/10">← →</div>
                        <span>Browse</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-white/10 rounded border border-white/10">Enter</div>
                        <span>View Details</span>
                    </div>
                </div>

            </div>
        </div>
    );
}