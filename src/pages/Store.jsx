import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
    Gamepad2, Search, ShoppingCart, Star, Trophy, Sparkles, 
    Zap, Heart, Skull, Shield, Music, Crosshair, Car, Monitor,
    X, Mic, MicOff, Loader2, LayoutGrid, Flame, Smartphone, ShoppingBag
} from 'lucide-react';
import { useCart } from '../components/CartContext';
import { useAuth } from '../components/auth/AuthContext';
import { createPageUrl } from '@/utils';
import { aiGamesList, otherSampleGames, androidGames } from '../components/store/mockData';
import { googlePlayGames } from '../components/store/androidGamesData';
import MarketplaceContent from '../components/store/MarketplaceContent';
import TradingPostContent from '../components/store/TradingPostContent';
import { NAV_HIERARCHY } from '../components/dashboard/NavigationConfig';
import { base44 } from '@/api/base44Client';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import StoreGridSpotlight from '../components/store/StoreGridSpotlight';
import StoreHeroShowcase from '../components/store/StoreHeroShowcase';
import Library from './Library';
import Achievements from './Achievements';
import LibrarySidebar from '../components/streaming/LibrarySidebar';
import LunaBottomNav from '../components/dashboard/LunaBottomNav';
import ScrollTransitionOverlay from '@/components/shared/ScrollTransitionOverlay';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';
import { showError } from '@/components/error/ErrorToast';
import LoadingState from '@/components/error/LoadingState';
import { useGameFilters } from '../components/store/hooks/useGameFilters';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import StoreOverview from '../components/store/StoreOverview';
import StoreAchievementsStrip from '../components/store/StoreAchievementsStrip';
import StoreBottomNav from '@/components/store/StoreBottomNav';
import StoreGameDetailPanel from '../components/store/GameDetailPanel';
import StoreSearchDropdown from '../components/store/StoreSearchDropdown';
import StoreCategoryOverlay, { CATEGORIES } from '../components/store/StoreCategoryOverlay';
import WishlistButton from '../components/store/WishlistButton';
import { WishlistProvider } from '../components/store/WishlistContext';
import PlayerInteractionsPanel from '../components/store/PlayerInteractionsPanel';
import StoreRecommendationsSidebar from '../components/store/StoreRecommendationsSidebar';
import CategorySearchBar from '../components/store/CategorySearchBar';
import RecentlyPlayedSidebar from '../components/store/RecentlyPlayedSidebar';
import DevCardsContent from '../components/store/DevCardsContent';
import ShooterContent from '../components/store/ShooterContent';
import { DollarSign, Building2 } from 'lucide-react';

import StoreHeaderSearchPanel from '../components/store/StoreHeaderSearchPanel';
import { ChevronDown } from 'lucide-react';
import { MOCK_STUDIOS } from '../components/store/StudioDrawer';

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

const AIVoiceSearch = ({ onSearchResult, onClose }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [conversationHistory, setConversationHistory] = useState([]);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.onresult = (event) => {
                const current = event.resultIndex;
                const result = event.results[current];
                setTranscript(result[0].transcript);
                if (result.isFinal) handleUserMessage(result[0].transcript);
            };
            recognitionRef.current.onerror = () => setIsListening(false);
            recognitionRef.current.onend = () => setIsListening(false);
        }
        return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
    }, []);

    const startListening = () => { if (recognitionRef.current) { setTranscript(''); setIsListening(true); recognitionRef.current.start(); } };
    const stopListening = () => { if (recognitionRef.current) { recognitionRef.current.stop(); setIsListening(false); } };

    const handleUserMessage = async (message) => {
        if (!message.trim()) return;
        const newHistory = [...conversationHistory, { role: 'user', content: message }];
        setConversationHistory(newHistory);
        setIsProcessing(true);
        setTranscript('');
        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `You are Sophie, a friendly AI gaming assistant. Help users find games.\n\nPrevious conversation:\n${newHistory.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser: "${message}"\n\nRespond as JSON: {"message": "your response", "searchSuggestion": "optional search term", "genres": []}`,
                response_json_schema: { type: "object", properties: { message: { type: "string" }, searchSuggestion: { type: "string" }, genres: { type: "array", items: { type: "string" } } }, required: ["message"] }
            });
            setConversationHistory([...newHistory, { role: 'assistant', content: response.message }]);
            if (response.searchSuggestion) onSearchResult(response.searchSuggestion);
        } catch (error) {
            showError(error, 'AI Search');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>
                        <div><h3 className="text-white font-semibold text-sm">Sophie</h3><p className="text-white/40 text-xs">AI Game Assistant</p></div>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="max-h-48 overflow-y-auto mb-4 space-y-3">
                    {conversationHistory.length === 0 && !isListening && <p className="text-white/50 text-sm text-center py-4">Hi! I'm Sophie. Tell me what kind of game you're looking for!</p>}
                    {conversationHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.role === 'user' ? 'bg-blue-500/20 text-blue-200' : 'bg-white/10 text-white/90'}`}>{msg.content}</div>
                        </div>
                    ))}
                    {isProcessing && <div className="flex justify-start"><div className="bg-white/10 px-3 py-2 rounded-xl flex items-center gap-2"><Loader2 className="w-4 h-4 text-purple-400 animate-spin" /><span className="text-white/60 text-sm">Thinking...</span></div></div>}
                </div>
                {(isListening || transcript) && <div className="bg-white/5 rounded-lg p-3 mb-4 border border-white/10"><p className="text-white/70 text-sm">{transcript || <span className="text-white/40 animate-pulse">Listening...</span>}</p></div>}
                <div className="flex items-center justify-center">
                    <button onClick={isListening ? stopListening : startListening} disabled={isProcessing} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-br from-purple-500 to-pink-500'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isListening ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                    </button>
                </div>
                <p className="text-white/30 text-xs text-center mt-3">{isListening ? 'Tap to stop' : 'Tap to speak'}</p>
            </div>
        </motion.div>
    );
};

const useVoiceInput = (onResult) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.onresult = (event) => { onResult(event.results[0][0].transcript); setIsListening(false); };
            recognitionRef.current.onerror = () => setIsListening(false);
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }, [onResult]);
    const toggleListening = () => {
        if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
        else { recognitionRef.current?.start(); setIsListening(true); }
    };
    return { isListening, toggleListening };
};


export default function Store() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { getCartCount } = useCart();

    const [showOverview, setShowOverview] = useState(false);
    const [storeLibraryOpen, setStoreLibraryOpen] = useState(false);
    const [inPageStoreGameId, setInPageStoreGameId] = useState(null);
    const [activeCategoryOverlay, setActiveCategoryOverlay] = useState(null); // category id
    const [currentShowcaseGame, setCurrentShowcaseGame] = useState(null);
    const [storeMode, setStoreMode] = useState(searchParams.get('mode') || 'store');
    const [storeSubView, setStoreSubView] = useState(searchParams.get('subview') || 'games');
    const [activeStoreTab, setActiveStoreTab] = useState('store');
    const [storeFilters, setStoreFilters] = useState({});

    useEffect(() => {
        const subview = searchParams.get('subview');
        if (subview) { setStoreSubView(subview); setStoreMode('store'); }
        const mode = searchParams.get('mode');
        if (mode) setStoreMode(mode);
    }, [searchParams]);

    const [viewMode, setViewMode] = useState('cross');
    const [activeGenreIndex, setActiveGenreIndex] = useState(0);
    const [activeSubCategoryIndex, setActiveSubCategoryIndex] = useState(0);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [marketplaceSearchTerm, setMarketplaceSearchTerm] = useState('');
    const [voiceSearchOpen, setVoiceSearchOpen] = useState(false);
    const [showVoiceOptions, setShowVoiceOptions] = useState(false);
    const [showScrollTransition, setShowScrollTransition] = useState(false);
    const [pendingNavigateUrl, setPendingNavigateUrl] = useState(null);
    const [hoveredGame, setHoveredGame] = useState(null);
    const [studioDropdownOpen, setStudioDropdownOpen] = useState(false);
    const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
    const genreRefs = useRef([]);
    const genreScrollRef = useRef(null);
    const contentScrollRef = useRef(null);
    const lastScrollTopRef = useRef(0);
    const [scrollDir, setScrollDir] = useState('down');
    const wheelTsRef = useRef(0);
    const genreListRef = useRef(null);
    const [isGenreHovering, setIsGenreHovering] = useState(false);
    const [genrePanelFocused, setGenrePanelFocused] = useState(false);

    const scrollGenreIntoView = (index) => {
        const listEl = genreListRef.current;
        if (!listEl) return;
        const items = listEl.querySelectorAll('[data-genre-item]');
        const target = items[index];
        if (target && typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };

    const handleGenreWheel = (e) => {
        if (!genreData || genreData.length === 0) return;
        e.preventDefault();
        const now = Date.now();
        if (now - wheelTsRef.current < 120) return;
        wheelTsRef.current = now;
        const direction = e.deltaY < 0 ? -1 : 1;
        setActiveGenreIndex(prev => {
            const next = Math.min(genreData.length - 1, Math.max(0, prev + direction));
            if (next !== prev) { setActiveSubCategoryIndex(0); queueMicrotask(() => scrollGenreIntoView(next)); }
            return next;
        });
    };

    useEffect(() => {
        const onKey = (e) => {
            if (!(isGenreHovering || genrePanelFocused)) return;
            const key = e.key.toLowerCase();
            if (['w','a','s','d'].includes(key)) e.preventDefault();
            if (!genreData || genreData.length === 0) return;
            if (key === 'w' || key === 'a') { setActiveGenreIndex(prev => Math.max(0, prev - 1)); setActiveSubCategoryIndex(0); }
            else if (key === 's' || key === 'd') { setActiveGenreIndex(prev => Math.min(genreData.length - 1, prev + 1)); setActiveSubCategoryIndex(0); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isGenreHovering, genrePanelFocused]);

    const handleNavigateToGame = (id) => {
        setPendingNavigateUrl(createPageUrl(`GameDetail?id=${id}`));
        setShowScrollTransition(true);
    };

    const {
        activeCategory, setActiveCategory,
        selectedGenres, toggleGenre,
        showAndroidOnly, setShowAndroidOnly,
        genreData
    } = useGameFilters(games, loading);

    // Apply storeFilters (genre, mode, choices, free, pvp) on top of the genre-wheel selection
    const applyStoreFilters = (gameList) => {
        return gameList.filter(game => {
            // Genre filter
            if (storeFilters.genre) {
                const g = (game.genre || '').toLowerCase();
                if (g !== storeFilters.genre.toLowerCase()) return false;
            }
            // Game Mode filter
            if (storeFilters.mode) {
                const modes = (game.game_modes || game.modes || game.tags || [])
                    .map(m => (m || '').toLowerCase());
                const target = storeFilters.mode.toLowerCase();
                // also check top-level fields like multiplayer, co_op, pvp
                const hasMode =
                    modes.some(m => m.includes(target.split(' ')[0])) ||
                    (target === 'single player' && game.single_player) ||
                    (target === 'multiplayer' && game.multiplayer) ||
                    (target === 'co-op' && (game.co_op || game.coop)) ||
                    (target === 'pvp' && game.pvp);
                // If game has no mode metadata at all, let it pass through
                if (game.game_modes || game.modes) {
                    if (!hasMode) return false;
                }
            }
            // Free to Play filter
            if (storeFilters.free) {
                if (!(game.price === 0 || game.price == null || game.free_to_play || game.isFree)) return false;
            }
            // PvP filter
            if (storeFilters.pvp) {
                if (!game.pvp && !(game.tags || []).some(t => (t || '').toLowerCase().includes('pvp'))) return false;
            }
            // PvE filter
            if (storeFilters.pve) {
                if (!game.pve && !(game.tags || []).some(t => (t || '').toLowerCase().includes('pve'))) return false;
            }
            return true;
        });
    };

    const filteredGridGames = useMemo(() => {
        const base = selectedGenres.length === 0 ? games : games.filter(g => selectedGenres.includes(g.genre));
        return applyStoreFilters(base);
    }, [games, selectedGenres, storeFilters]);

    const currentNavGenre = genreData[activeGenreIndex];

    const SUB_CATEGORIES = useMemo(() => {
        const defaults = ['Trending', 'Top Rated', 'New Releases', 'Classics', 'Hidden Gems'];
        if (!currentNavGenre) return defaults;
        switch (currentNavGenre.label) {
            case 'Action': return ['Adventure', 'Fighting', 'Platformer', 'Stealth', "Beat 'em up"];
            case 'RPG': return ['Action RPG', 'Turn-Based', 'JRPG', 'Tactical', 'MMORPG'];
            case 'Shooter': return ['First-Person', 'Third-Person', 'Tactical', 'Hero Shooter', 'Battle Royale'];
            case 'Strategy': return ['RTS', 'Turn-Based', '4X', 'Tower Defense', 'Grand Strategy'];
            case 'Horror': return ['Survival', 'Psychological', 'Action Horror', 'Gothic', 'Slasher'];
            case 'Racing': return ['Sim', 'Arcade', 'Kart', 'Street', 'Off-Road'];
            case 'Sports': return ['Sim', 'Arcade', 'Management', 'Extreme', 'Team'];
            default: return defaults;
        }
    }, [currentNavGenre]);

    const activeSubCategory = SUB_CATEGORIES[activeSubCategoryIndex] || SUB_CATEGORIES[0];

    useEffect(() => {
        if (viewMode !== 'cross') return;
        scrollGenreIntoView(activeGenreIndex);
    }, [activeGenreIndex, viewMode]);

    const displayedGames = useMemo(() => {
        if (!currentNavGenre) return [];
        return applyStoreFilters(currentNavGenre.items);
    }, [currentNavGenre, activeSubCategory, storeFilters]);

    const activeGame = null;

    useEffect(() => {
        if (storeMode !== 'store' || loading || genreData.length === 0 || viewMode !== 'cross') return;
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if (key === 'arrowleft' || key === 'a') {
                e.preventDefault();
                if (e.shiftKey) { setActiveGenreIndex(prev => prev > 0 ? prev - 1 : prev); setActiveSubCategoryIndex(0); }
                else setActiveSubCategoryIndex(prev => prev > 0 ? prev - 1 : prev);
            } else if (key === 'arrowright' || key === 'd') {
                e.preventDefault();
                if (e.shiftKey) { setActiveGenreIndex(prev => prev < genreData.length - 1 ? prev + 1 : prev); setActiveSubCategoryIndex(0); }
                else setActiveSubCategoryIndex(prev => prev < SUB_CATEGORIES.length - 1 ? prev + 1 : prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeGenreIndex, activeSubCategoryIndex, genreData, loading, viewMode, storeMode, SUB_CATEGORIES]);

    useEffect(() => {
        if (viewMode === 'classic' && genreRefs.current[activeGenreIndex]) {
            genreRefs.current[activeGenreIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeGenreIndex, viewMode]);

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

    const { isListening: isRegularVoiceListening, toggleListening: toggleRegularVoice } = useVoiceInput((text) => {
        setSearchTerm(text);
        setShowVoiceOptions(false);
    });

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

    const handleStoreTabChange = (tabId) => {
        setActiveStoreTab(tabId);
        if (tabId === 'trading') {
            setStoreMode('trading');
        } else {
            setStoreMode('store');
        }
    };

    return (
        <PageErrorBoundary pageName="Store">
          <WishlistProvider>
            <GlassPageFrame
              topContent={
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-6">
                    <span className="text-lg font-bold tracking-wider text-white/90">ATOM×EVE Store</span>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/10 rounded-lg">
                      <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-sm font-semibold text-white">5,240 GP</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border bg-white/15 border-white/25 text-white">Store</button>
                    <button onClick={() => navigate(createPageUrl('Clan'))} className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white">Clan</button>
                    <button onClick={() => navigate(createPageUrl('Farm'))} className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white">Farm</button>
                    <button onClick={() => navigate(createPageUrl('Aura'))} className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white">Aura</button>
                    <button onClick={() => navigate(createPageUrl('GenreMastery'))} className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white">Cards</button>
                    <button onClick={() => { setStoreMode('shooter'); setShowOverview(false); }} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${storeMode === 'shooter' ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white'}`}>Shooter</button>
                    </div>
                  <div className="flex items-center gap-3">
                   <CategorySearchBar
                     activeCategoryOverlay={activeCategoryOverlay}
                     games={games}
                     onGameSelect={(game) => { setActiveCategoryOverlay(null); handleNavigateToGame(game.id); }}
                   />
                   <div onClick={() => setHeaderSearchOpen(true)} className="cursor-pointer">
                     <StoreSearchDropdown games={games} onGameSelect={handleNavigateToGame} isListening={isRegularVoiceListening} toggleVoice={() => { toggleRegularVoice(); }} />
                   </div>
                  </div>
                </div>
              }
              bottomContent={
              <StoreBottomNav
                activeTab={activeStoreTab}
                onTabChange={handleStoreTabChange}
                libraryActive={storeLibraryOpen}
                onLibraryToggle={() => setStoreLibraryOpen(v => !v)}
                activeFilters={storeFilters}
                onFilterChange={(key, val) => setStoreFilters(prev => ({ ...prev, [key]: val }))}
                activeCategory={activeCategoryOverlay}
                onCategoryChange={setActiveCategoryOverlay}
                showDevLabel={true}
              />
            }>
                <div className="h-screen w-full flex relative overflow-hidden text-white font-sans" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>

                    {/* Library sliding panel from LunaBottomNav — rendered without its own nav bar */}
                    <LunaBottomNav
                      hideNav={true}
                      forceLibraryOpen={storeLibraryOpen}
                      onLibraryClose={() => setStoreLibraryOpen(false)}
                      libraryLabel="Store Library"
                      searchTerm={searchTerm}
                      activeCategoryLabel={activeCategoryOverlay ? { recommended: 'Recommended', new_releases: 'New Releases', top_rated: 'Top Games', trending: 'Trending', hidden_gems: 'Hidden Gems' }[activeCategoryOverlay] : null}
                      activeFilters={storeFilters}
                      onFilterChange={(key, val) => setStoreFilters(prev => ({ ...prev, [key]: val }))}
                    />

                    {/* 5% Left Sidebar — split into 3 bounded sections (Recently Played | Launch zone | Options) */}
                    {!inPageStoreGameId && <div className="w-[5%] min-w-[80px] h-full border-r relative z-40 flex-shrink-0 flex flex-col items-center"
                        style={{
                            background: 'linear-gradient(160deg, rgba(180,185,195,0.13) 0%, rgba(140,148,160,0.08) 100%)',
                            backdropFilter: 'blur(24px) saturate(160%)',
                            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                            borderColor: 'rgba(200,210,220,0.18)',
                            boxShadow: '4px 0 20px rgba(0,0,0,0.35), inset 1px 0 0 rgba(255,255,255,0.08)'
                        }}
                    >
                        {/* TOP — Recently Played (bounded, scrollable, ends above center) */}
                        <div className="w-full flex-1 min-h-0 overflow-y-auto pt-4 pb-2" style={{ scrollbarWidth: 'none' }}>
                            <RecentlyPlayedSidebar games={games} onGameClick={handleNavigateToGame} />
                        </div>

                        {/* MIDDLE — Reserved zone for Launch button (floating LibrarySidebar renders here at top-[45%]) */}
                        <div className="w-full flex-shrink-0 h-24" aria-hidden="true" />

                        {/* BOTTOM — Reserved for Library/Entertainment/Rewards options (floating LibrarySidebar) */}
                        <div className="w-full flex-1 min-h-0" aria-hidden="true" />
                    </div>}

                    {/* 95% Main Area */}
                    <div className="flex-1 relative h-full overflow-hidden flex flex-col">

                        {/* ═══ GENRE MASTERY SUB-NAV (matches Depth Cards style) ═══ */}
                        {!inPageStoreGameId && <div className="flex-shrink-0 mt-16 relative z-30">
                          <div className="flex items-center px-6 py-2 gap-0"
                            style={{
                              background: 'rgba(8, 12, 18, 0.5)',
                              backdropFilter: 'blur(20px)',
                              borderBottom: '1px solid rgba(255,255,255,0.06)',
                            }}
                          >
                            {/* Label */}
                            <span className="text-white/50 text-xs font-bold uppercase tracking-widest whitespace-nowrap flex-shrink-0 mr-4 select-none">
                              Gaming Studio
                            </span>

                            {/* Fade divider */}
                            <div className="flex-shrink-0 w-px h-8 mx-3 relative">
                              <div className="absolute inset-x-0 top-0 bottom-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.15) 35%, rgba(255,255,255,0.15) 65%, transparent 100%)' }} />
                            </div>

                            {/* Gaming Studios Dropdown */}
                              <div className="relative">
                                <button
                                  onClick={() => setStudioDropdownOpen(!studioDropdownOpen)}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors"
                                >
                                  <span>Studios</span>
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${studioDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                  {studioDropdownOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -8 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -8 }}
                                      transition={{ duration: 0.15 }}
                                      className="absolute top-full left-0 mt-1 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg overflow-hidden z-50"
                                    >
                                      {MOCK_STUDIOS && MOCK_STUDIOS.length > 0 ? (
                                        MOCK_STUDIOS.map((studio) => (
                                          <button
                                            key={studio.id}
                                            onClick={() => setStudioDropdownOpen(false)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                                          >
                                            <div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-cyan-500 to-blue-500 flex-shrink-0" />
                                            <span>{studio.name}</span>
                                          </button>
                                        ))
                                      ) : null}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Genre Dropdown */}
                              <div className="relative">
                                <button
                                  onClick={() => setStoreFilters(prev => ({ ...prev, _genreDropdownOpen: !prev._genreDropdownOpen }))}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors"
                                >
                                  <span>{storeFilters.genre ? storeFilters.genre : 'Genres'}</span>
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${storeFilters._genreDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Genre Dropdown Menu */}
                                <AnimatePresence>
                                  {storeFilters._genreDropdownOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -8 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -8 }}
                                      transition={{ duration: 0.15 }}
                                      className="absolute top-full left-0 mt-1 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg overflow-hidden z-50"
                                    >
                                      <button
                                        onClick={() => setStoreFilters(prev => ({ ...prev, genre: null, _genreDropdownOpen: false }))}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors border-b border-white/5 ${!storeFilters.genre ? 'bg-white/5 text-white' : 'text-white/80 hover:text-white hover:bg-white/5'}`}
                                      >
                                        <span>All Genres</span>
                                      </button>
                                      {['Action', 'RPG', 'Shooter', 'Strategy', 'Adventure', 'Sports', 'Racing', 'Simulation', 'Horror', 'Puzzle', 'Romance', 'Sci-Fi'].map((genre) => (
                                        <button
                                          key={genre}
                                          onClick={() => setStoreFilters(prev => ({ ...prev, genre: storeFilters.genre === genre ? null : genre, _genreDropdownOpen: false }))}
                                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors border-b border-white/5 last:border-b-0 ${storeFilters.genre === genre ? 'bg-cyan-500/20 text-cyan-300' : 'text-white/80 hover:text-white hover:bg-white/5'}`}
                                        >
                                          <span>{genre}</span>
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                          </div>
                        </div>}

                        {/* Main Content */}
                        <div className="flex-1 overflow-hidden">

    



                            {/* CATEGORY OVERLAY */}
                            <AnimatePresence>
                                {activeCategoryOverlay && (
                                    <StoreCategoryOverlay
                                        key={activeCategoryOverlay}
                                        category={activeCategoryOverlay}
                                        games={games}
                                        onClose={() => setActiveCategoryOverlay(null)}
                                    />
                                )}
                            </AnimatePresence>

                            {/* MAIN CONTENT AREA */}
                            <AnimatePresence mode="wait">
                                {storeMode === 'library' ? (
                                    <motion.div key="inline-library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full overflow-hidden">
                                        <Library onSwitchToStore={() => { setStoreMode('store'); setActiveStoreTab('store'); }} onSwitchToAchievements={() => setStoreSubView('achievements')} />
                                    </motion.div>
                                ) : storeMode === 'store' && storeSubView === 'achievements' ? (
                                    <motion.div key="embedded-achievements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full pt-16 overflow-hidden">
                                        <Achievements onExitToLibrary={() => setStoreSubView('library')} />
                                    </motion.div>
                                ) : storeMode === 'store' && storeSubView === 'library' ? (
                                    <motion.div key="embedded-library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full overflow-hidden">
                                        <Library onSwitchToStore={() => setStoreSubView('games')} onSwitchToAchievements={() => setStoreSubView('achievements')} />
                                    </motion.div>
                                ) : storeMode === 'store' ? (
                                    viewMode === 'classic' ? (
                                        <motion.div key="classic-store" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full pt-28 pb-0 bg-transparent">
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
                                                        <h2 className="text-lg font-bold text-white tracking-wide">Catalog</h2>
                                                    </div>
                                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                                                        <button onClick={() => { setActiveCategory('All Games'); toggleGenre(null); }} className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${activeCategory === 'All Games' && selectedGenres.length === 0 ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
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
                                                        <button onClick={() => setViewMode('cross')} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all text-white/80 hover:text-white hover:scale-110" title="Cross View"><Gamepad2 className="w-6 h-6" /></button>
                                                    </div>
                                                    <StoreGridSpotlight games={filteredGridGames} onNavigate={handleNavigateToGame} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        // CROSS INTERFACE VIEW
                                        <motion.div key="cross-interface" className="w-full h-full relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            {loading ? (
                                                <LoadingState fullScreen message="Loading Store..." />
                                            ) : !currentNavGenre ? null : (
                                                <>
                                                    {/* Dynamic Background */}
                                                    <AnimatePresence mode="wait">
                                                        <motion.div key={activeGame?.id || currentNavGenre?.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0 z-0">
                                                            <div className="absolute inset-0 bg-transparent" />
                                                            {activeGame?.cover_image && (
                                                                <>
                                                                    <img src={activeGame.cover_image} alt="bg" className="w-full h-full object-cover opacity-40 blur-sm scale-105" />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                                                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
                                                                </>
                                                            )}
                                                            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen" />
                                                            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen" />
                                                        </motion.div>
                                                    </AnimatePresence>

                                                    {/* Interface Layer */}
                                                    <div className="relative z-10 w-full h-full flex flex-col">
                                                        {/* HERO SHOWCASE + ACHIEVEMENTS */}
                                                         <div className="h-[280px] flex-shrink-0 mt-[60px] w-full flex overflow-hidden">
                                                            {/* Spacer matching genre list column width (px-6 + 200px + gap-8) */}
                                                            <div className="flex-shrink-0" style={{ width: '256px' }} />

                                                            {/* Achievements — from game grid left edge to divider */}
                                                            <div className="flex-1 min-w-0 overflow-hidden">
                                                                <StoreAchievementsStrip currentGame={currentShowcaseGame} />
                                                            </div>

                                                            {/* Vertical divider — center portion only, thicker */}
                                                            <div className="flex-shrink-0 w-[3px] self-stretch flex flex-col justify-center py-10">
                                                                <div className="w-[3px] h-full bg-white/25 rounded-full" />
                                                            </div>

                                                            {/* Slideshow — right 50% */}
                                                            <div className="w-1/2 flex-shrink-0 overflow-hidden">
                                                                <StoreHeroShowcase games={displayedGames.length > 0 ? displayedGames : games.slice(0, 8)} activeSubCategory={activeSubCategory} onGameChange={setCurrentShowcaseGame} />
                                                            </div>
                                                        </div>

                                                        {/* Below showcase: genre list + game grid */}
                                                        <div className="flex flex-1 overflow-hidden px-6 gap-8">
                                                            {/* LEFT: Genre list */}
                                                            <div className="w-[200px] flex-shrink-0 hidden xl:flex flex-col" ref={genreScrollRef}>
                                                                <motion.div
                                                                    ref={genreListRef}
                                                                    className="flex flex-col gap-2 pl-6 pr-2 max-h-[60vh] overflow-y-auto custom-scrollbar"
                                                                    onWheel={handleGenreWheel}
                                                                    onMouseEnter={() => setIsGenreHovering(true)}
                                                                    onMouseLeave={() => setIsGenreHovering(false)}
                                                                    onFocus={() => setGenrePanelFocused(true)}
                                                                    onBlur={() => setGenrePanelFocused(false)}
                                                                    tabIndex={0}
                                                                    initial={false}
                                                                    animate={{ x: scrollDir === 'up' ? 32 : 0, y: scrollDir === 'up' ? -16 : 0 }}
                                                                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                                                                >
                                                                    {genreData.map((genre, idx) => {
                                                                        const Icon = genre.icon;
                                                                        const isActive = idx === activeGenreIndex;
                                                                        return (
                                                                            <motion.button data-genre-item key={genre.id} onClick={() => { setActiveGenreIndex(idx); setActiveSubCategoryIndex(0); setGenrePanelFocused(true); }} className="group flex items-center gap-2 text-left py-2 pl-0 pr-2" animate={{ x: isActive ? 8 : (scrollDir === 'down' ? 4 : 0) }} whileHover={{ x: 8 }}>
                                                                                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-white/60 group-hover:text-white'}`} />
                                                                                <span className={`text-sm uppercase tracking-wide ${isActive ? 'text-cyan-400 font-black' : 'text-white/60 group-hover:text-white font-medium'}`}>{genre.label}</span>
                                                                            </motion.button>
                                                                        );
                                                                    })}
                                                                </motion.div>
                                                            </div>

                                                            {/* CENTER: Game Grid */}
                                                            <div className="flex-1 h-full overflow-y-auto custom-scrollbar pb-24 pr-2 pt-6" ref={contentScrollRef}>
                                                                <motion.div key={`${activeGenreIndex}-${activeSubCategoryIndex}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                                                                    {displayedGames.map((game, idx) => (
                                                                        <motion.div key={game.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} whileHover={{ y: -8, scale: 1.02 }} onClick={() => handleNavigateToGame(game.id)} onMouseEnter={() => setHoveredGame(game)} className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer shadow-lg bg-slate-900 border border-white/5 hover:border-cyan-400/40 hover:shadow-cyan-500/20 transition-all">
                                                                            <img src={game.cover_image || game.image} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                                                                            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                                                                              <WishlistButton game={game} />
                                                                              <button
                                                                                onClick={(e) => { e.stopPropagation(); setInPageStoreGameId(game.id); }}
                                                                                className="w-7 h-7 rounded-md bg-black/60 backdrop-blur-md border border-cyan-400/40 flex items-center justify-center hover:bg-cyan-500/20 transition-all opacity-0 group-hover:opacity-100"
                                                                                title="Store View"
                                                                              >
                                                                                <ShoppingBag className="w-3.5 h-3.5 text-cyan-300" />
                                                                              </button>
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
                                                                    {displayedGames.length < 4 && Array.from({ length: 4 - displayedGames.length }).map((_, i) => (
                                                                        <div key={`filler-${i}`} className="aspect-[3/4] rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center">
                                                                            <span className="text-white/10 text-sm font-medium">Coming Soon</span>
                                                                        </div>
                                                                    ))}
                                                                </motion.div>
                                                            </div>
                                                                </div>
                                                                </div>
                                                                </>
                                                                )}
                                                                </motion.div>
                                    )
                                ) : storeMode === 'shooter' ? (
                                    <motion.div key="shooter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full overflow-hidden pt-16">
                                        <ShooterContent games={games} onNavigateToGame={handleNavigateToGame} />
                                    </motion.div>
                                ) : (
                                    <motion.div key="trading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-[1920px] mx-auto px-4 md:px-6 py-24 overflow-y-auto h-full custom-scrollbar">
                                        <TradingPostContent />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {showScrollTransition && (
                                <ScrollTransitionOverlay mode="fade" duration={0.4} onComplete={() => {
                                    const url = pendingNavigateUrl;
                                    setShowScrollTransition(false);
                                    setPendingNavigateUrl(null);
                                    if (url) navigate(url);
                                }} />
                            )}

                            {/* HEADER SEARCH PANEL */}
                            <StoreHeaderSearchPanel
                              isOpen={headerSearchOpen}
                              onClose={() => setHeaderSearchOpen(false)}
                            />

                            {/* IN-PAGE STORE VIEW OVERLAY */}
                            <AnimatePresence>
                                {inPageStoreGameId && (
                                    <motion.div
                                        key={inPageStoreGameId}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0 z-50"
                                    >
                                        <StoreGameDetailPanel gameId={inPageStoreGameId} onClose={() => setInPageStoreGameId(null)} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </GlassPageFrame>
          </WishlistProvider>
        </PageErrorBoundary>
    );
}