import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Star, Smartphone, ShoppingBag } from 'lucide-react';
import { useGameFilters } from './hooks/useGameFilters';
import { useAuth } from '../auth/AuthContext';
import { base44 } from '@/api/base44Client';
import { aiGamesList, otherSampleGames, androidGames } from './mockData';
import { googlePlayGames } from './androidGamesData';
import StoreGridSpotlight from './StoreGridSpotlight';
import WishlistButton from './WishlistButton';
import { showError } from '../error/ErrorToast';
import LoadingState from '../error/LoadingState';

const GENRE_ICONS = {
    'Action': SwordsIcon,
    'RPG': require('lucide-react').Shield,
    'Strategy': require('lucide-react').Trophy,
    'Simulation': require('lucide-react').Monitor,
    'Sports': require('lucide-react').Trophy,
    'Racing': require('lucide-react').Car,
    'Horror': require('lucide-react').Skull,
    'Shooter': require('lucide-react').Crosshair,
    'Music': require('lucide-react').Music,
    'Adventure': Gamepad2,
    'Puzzle': require('lucide-react').Zap,
    'Romance': require('lucide-react').Heart,
    'Sci-Fi': require('lucide-react').Sparkles,
};

function SwordsIcon(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
            <path d="m13 19 6-6" />
            <path d="M16 16l4 4" />
            <path d="M19 21l2-2" />
        </svg>
    );
}

export default function DevCardsContent({ onNavigateToGame }) {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [showAndroidOnly, setShowAndroidOnly] = useState(false);
    const [devCardFilters, setDevCardFilters] = useState({});
    const [hoveredGame, setHoveredGame] = useState(null);
    const contentScrollRef = useRef(null);
    const lastScrollTopRef = useRef(0);
    const [scrollDir, setScrollDir] = useState('down');

    useEffect(() => {
        const fetchGames = async () => {
            const isDev = import.meta.env.DEV;
            const useMock = isDev && window.localStorage.getItem('USE_MOCK_DATA') === 'true';
            try {
                const fetchedGamesResponse = await base44.entities.Game.list();
                const fetchedGames = fetchedGamesResponse.data || fetchedGamesResponse;
                if (fetchedGames.length > 0) setGames(fetchedGames);
                else if (useMock) setGames([...aiGamesList, ...otherSampleGames, ...androidGames, ...googlePlayGames]);
                else setGames([]);
            } catch (error) {
                showError(error, 'Load Games');
                if (useMock) setGames([...aiGamesList, ...otherSampleGames, ...androidGames, ...googlePlayGames]);
                else setGames([]);
            }
            setLoading(false);
        };
        fetchGames();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const el = contentScrollRef.current;
            if (el) {
                const st = el.scrollTop;
                setScrollDir(st > lastScrollTopRef.current ? 'down' : 'up');
                lastScrollTopRef.current = st <= 0 ? 0 : st;
            }
        };
        const el = contentScrollRef.current || window;
        el.addEventListener('scroll', handleScroll, true);
        return () => el.removeEventListener('scroll', handleScroll, true);
    }, []);

    const applyFilters = (gameList) => {
        return gameList.filter(game => {
            if (devCardFilters.genre) {
                const g = (game.genre || '').toLowerCase();
                if (g !== devCardFilters.genre.toLowerCase()) return false;
            }
            if (devCardFilters.mode) {
                const modes = (game.game_modes || game.modes || game.tags || [])
                    .map(m => (m || '').toLowerCase());
                const target = devCardFilters.mode.toLowerCase();
                const hasMode =
                    modes.some(m => m.includes(target.split(' ')[0])) ||
                    (target === 'single player' && game.single_player) ||
                    (target === 'multiplayer' && game.multiplayer) ||
                    (target === 'co-op' && (game.co_op || game.coop)) ||
                    (target === 'pvp' && game.pvp);
                if (game.game_modes || game.modes) {
                    if (!hasMode) return false;
                }
            }
            if (devCardFilters.free) {
                if (!(game.price === 0 || game.price == null || game.free_to_play || game.isFree)) return false;
            }
            if (devCardFilters.pvp) {
                if (!game.pvp && !(game.tags || []).some(t => (t || '').toLowerCase().includes('pvp'))) return false;
            }
            if (devCardFilters.pve) {
                if (!game.pve && !(game.tags || []).some(t => (t || '').toLowerCase().includes('pve'))) return false;
            }
            return true;
        });
    };

    const filteredGridGames = useMemo(() => {
        const base = selectedGenres.length === 0 ? games : games.filter(g => selectedGenres.includes(g.genre));
        return applyFilters(base);
    }, [games, selectedGenres, devCardFilters]);

    const toggleGenre = (genre) => {
        setSelectedGenres(prev => 
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        );
    };

    return (
        <div className="w-full h-full pt-28 pb-0 bg-transparent">
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <AnimatePresence mode="wait">
                    {hoveredGame && (
                        <motion.div key={hoveredGame?.id} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0">
                            <img src={hoveredGame?.cover_image || hoveredGame?.image} className="w-full h-full object-cover opacity-20 blur-sm" alt="Background" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="flex h-full max-w-[1920px] mx-auto">
                <div className="w-[280px] flex-shrink-0 h-full p-6 border-r border-white/5 flex-col hidden lg:flex bg-black/20 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20"><Gamepad2 className="w-5 h-5 text-white" /></div>
                        <h2 className="text-lg font-bold text-white tracking-wide">Dev Cards</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                        <button onClick={() => { setSelectedGenres([]); }} className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${selectedGenres.length === 0 ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                            <span className="text-sm font-medium">All Games</span>
                        </button>
                        <div className="py-2"><div className="h-px bg-white/5 w-full my-2" /><p className="px-3 text-xs font-bold text-white/30 uppercase tracking-wider mb-2">Categories</p></div>
                        {['Action', 'RPG', 'Shooter', 'Strategy', 'Adventure', 'Sports', 'Racing', 'Simulation', 'Horror', 'Puzzle'].map((g) => {
                            const Icon = GENRE_ICONS[g] || Gamepad2;
                            const isSelected = selectedGenres.includes(g);
                            return (
                                <button key={g} onClick={() => toggleGenre(g)} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${isSelected ? 'bg-gradient-to-r from-blue-600/20 to-transparent text-white border-l-2 border-blue-500' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
                                    <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-white/40'}`} />
                                    <span className="text-sm font-medium">{g}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="flex-1 h-full overflow-y-auto custom-scrollbar px-8 pb-12">
                    <div className="flex items-center justify-end gap-3 mb-8 sticky top-0 z-20 py-4">
                        <button onClick={() => setShowAndroidOnly(!showAndroidOnly)} className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all hover:scale-110 ${showAndroidOnly ? 'bg-green-500/20 border-green-400/50 text-green-300' : 'bg-white/5 hover:bg-white/20 border-white/10 text-white/80'}`} title="Android Games"><Smartphone className="w-6 h-6" /></button>
                    </div>
                    {loading ? (
                        <LoadingState fullScreen message="Loading Dev Cards..." />
                    ) : (
                        <motion.div key={`dev-cards`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                            {filteredGridGames.map((game, idx) => (
                                <motion.div key={game.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} whileHover={{ y: -8, scale: 1.02 }} onClick={() => onNavigateToGame(game.id)} onMouseEnter={() => setHoveredGame(game)} className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer shadow-lg bg-slate-900 border border-white/5 hover:border-cyan-400/40 hover:shadow-cyan-500/20 transition-all">
                                    <img src={game.cover_image || game.image} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                                        <WishlistButton game={game} />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform">
                                        <h4 className="text-white font-bold text-lg leading-tight mb-1 truncate">{game.title}</h4>
                                        <div className="flex items-center justify-between text-xs text-white/60">
                                            <span>{game.genre}</span>
                                            <div className="flex items-center gap-1 text-yellow-500"><Star className="w-3 h-3 fill-current" /><span>{game.rating}</span></div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {filteredGridGames.length < 4 && Array.from({ length: 4 - filteredGridGames.length }).map((_, i) => (
                                <div key={`filler-${i}`} className="aspect-[3/4] rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center">
                                    <span className="text-white/10 text-sm font-medium">Coming Soon</span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}