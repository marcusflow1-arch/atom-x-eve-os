import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Star, Smartphone, Shield, Trophy, Monitor, Car, Skull, Crosshair, Music, Zap, Heart, Sparkles, Search } from 'lucide-react';
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
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
            <path d="m13 19 6-6" />
            <path d="M16 16l4 4" />
            <path d="M19 21l2-2" />
        </svg>
    );
}

const MOCK_DEVELOPERS = [
    { id: 1, name: 'Naughty Dog', logo: 'https://via.placeholder.com/120?text=Naughty+Dog' },
    { id: 2, name: 'Rockstar Games', logo: 'https://via.placeholder.com/120?text=Rockstar' },
    { id: 3, name: 'CD Projekt Red', logo: 'https://via.placeholder.com/120?text=CD+Projekt' },
    { id: 4, name: 'FromSoftware', logo: 'https://via.placeholder.com/120?text=FromSoftware' },
    { id: 5, name: 'Valve', logo: 'https://via.placeholder.com/120?text=Valve' },
    { id: 6, name: 'Epic Games', logo: 'https://via.placeholder.com/120?text=Epic' },
    { id: 7, name: 'Activision Blizzard', logo: 'https://via.placeholder.com/120?text=Activision' },
    { id: 8, name: 'Electronic Arts', logo: 'https://via.placeholder.com/120?text=EA' },
    { id: 9, name: 'Take-Two Interactive', logo: 'https://via.placeholder.com/120?text=Take-Two' },
    { id: 10, name: 'Ubisoft', logo: 'https://via.placeholder.com/120?text=Ubisoft' },
    { id: 11, name: 'Microsoft Game Studios', logo: 'https://via.placeholder.com/120?text=Microsoft' },
    { id: 12, name: 'Sony Interactive', logo: 'https://via.placeholder.com/120?text=Sony' },
];

export default function DevCardsContent({ onNavigateToGame }) {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [showAndroidOnly, setShowAndroidOnly] = useState(false);
    const [devCardFilters, setDevCardFilters] = useState({});
    const [hoveredGame, setHoveredGame] = useState(null);
    const [developerSearch, setDeveloperSearch] = useState('');
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

    const filteredDevelopers = useMemo(() => {
        return MOCK_DEVELOPERS.filter(dev =>
            dev.name.toLowerCase().includes(developerSearch.toLowerCase())
        );
    }, [developerSearch]);

    return (
        <div className="w-full h-full pt-28 pb-0 bg-transparent">

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
                    {/* Developers Section */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Gaming Studios</h3>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Search developers..."
                                    value={developerSearch}
                                    onChange={(e) => setDeveloperSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-cyan-400/50 transition-all"
                                />
                            </div>
                        </div>
                        <div className="h-px bg-white/10 mb-6 w-full" />
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 overflow-y-auto max-h-[240px] pr-2">
                            {filteredDevelopers.map((dev) => (
                                <motion.div
                                    key={dev.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-400/30 transition-all cursor-pointer"
                                >
                                    <img src={dev.logo} alt={dev.name} className="w-16 h-16 rounded-lg object-cover bg-white/10" />
                                    <p className="text-xs font-medium text-white text-center line-clamp-2">{dev.name}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Games Section */}
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