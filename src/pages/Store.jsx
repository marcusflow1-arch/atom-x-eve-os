import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
    Gamepad2, Search, ShoppingCart, Star, Trophy, Sparkles, 
    Zap, Heart, Skull, Shield, Music, Crosshair, Car, Monitor,
    X, Mic, MicOff, Loader2, LayoutGrid, Flame, Smartphone, ShoppingBag, Play
} from 'lucide-react';
import { useCart } from '../components/CartContext';
import { useAuth } from '../components/auth/AuthContext';
import { createPageUrl } from '@/utils';
import { aiGamesList, otherSampleGames, androidGames } from '../components/store/mockData';
import { googlePlayGames } from '../components/store/androidGamesData';
import MarketplaceContent from '../components/store/MarketplaceContent';
import TradingPostContent from '../components/store/TradingPostContent';
import TradingPostSearchBar from '../components/store/tradingpost/TradingPostSearchBar';
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
import DevCardsContent from '../components/store/DevCardsContent';
import ShooterContent from '../components/store/ShooterContent';
import { DollarSign, Building2 } from 'lucide-react';

import StoreHeaderSearchPanel from '../components/store/StoreHeaderSearchPanel';
import { ChevronDown } from 'lucide-react';
import { MOCK_STUDIOS } from '../components/store/StudioDrawer';
import { useSidebarVisible } from '../hooks/useSidebarVisible';
import StorefrontTopBar from '../components/store/redesign/StorefrontTopBar';
import StorefrontLayout from '../components/store/redesign/StorefrontLayout';

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

    const [sidebarVisible, toggleSidebar] = useSidebarVisible();
    const [showOverview, setShowOverview] = useState(false);
    const [storeLibraryOpen, setStoreLibraryOpen] = useState(false);
    const [inPageStoreGameId, setInPageStoreGameId] = useState(null);
    const [activeCategoryOverlay, setActiveCategoryOverlay] = useState(null); // category id
    const [currentShowcaseGame, setCurrentShowcaseGame] = useState(null);
    const [storeMode, setStoreMode] = useState(searchParams.get('mode') || 'store');
    const [storeSubView, setStoreSubView] = useState(searchParams.get('subview') || 'games');
    const [activeStoreTab, setActiveStoreTab] = useState('store');
    const [storeFilters, setStoreFilters] = useState({});
    const [tradingSearch, setTradingSearch] = useState('');

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

    // Apply storeFilters (genre, mode, choices, free, pvp, category) on top of the genre-wheel selection
    const applyStoreFilters = (gameList) => {
        return gameList.filter(game => {
            // Category pill filter
            if (storeFilters.category) {
                const cat = storeFilters.category;
                if (cat === 'new_releases') {
                    const year = game.release_year || game.original_year || game.year;
                    if (year && year < 2023) return false;
                } else if (cat === 'trending') {
                    if ((game.reviews || 0) < 500 && (game.rating || 0) < 4.3) return false;
                } else if (cat === 'top_rated') {
                    if ((game.rating || 0) < 4.5) return false;
                } else if (cat === 'recommended') {
                    if ((game.rating || 0) < 4.0) return false;
                } else if (cat === 'hidden_gems') {
                    // High rated but low review count = hidden gem
                    if ((game.rating || 0) < 4.2 || (game.reviews || 0) > 5000) return false;
                }
            }
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
        } else if (tabId === 'devcards') {
            setStoreMode('devcards');
        } else {
            setStoreMode('store');
        }
    };

    return (
        <PageErrorBoundary pageName="Store">
          <WishlistProvider>
            <GlassPageFrame
              sidebarVisible={sidebarVisible}
              onSidebarToggle={toggleSidebar}
              topContent={
                <StorefrontTopBar
                  user={user}
                  cartCount={getCartCount?.() || 0}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onSearchOpen={() => setStoreLibraryOpen(true)}
                />
              }
              bottomContent={
              <StoreBottomNav
                activeTab={activeStoreTab}
                onTabChange={handleStoreTabChange}
                libraryActive={storeLibraryOpen}
                onLibraryToggle={() => setStoreLibraryOpen(v => !v)}
                activeFilters={storeFilters}
                onFilterChange={(key, val) => setStoreFilters(prev => ({ ...prev, [key]: val }))}
                activeCategory={storeFilters.category || null}
                onCategoryChange={(catId) => setStoreFilters(prev => ({ ...prev, category: catId }))}
                showDevLabel={true}
                onSearchOpen={() => setStoreLibraryOpen(true)}
              />
            }>
                <div className="h-screen w-full flex relative overflow-hidden text-white font-sans" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>

                    {/* Library sliding panel from LunaBottomNav — rendered without its own nav bar */}
                    <LunaBottomNav
                      hideNav={true}
                      forceLibraryOpen={storeLibraryOpen}
                      onLibraryClose={() => setStoreLibraryOpen(false)}
                      libraryLabel="Store Library"
                      games={games}
                      searchTerm={searchTerm}
                      activeCategoryLabel={activeCategoryOverlay ? { recommended: 'Recommended', new_releases: 'New Releases', top_rated: 'Top Games', trending: 'Trending', hidden_gems: 'Hidden Gems' }[activeCategoryOverlay] : null}
                      activeFilters={storeFilters}
                      onFilterChange={(key, val) => setStoreFilters(prev => ({ ...prev, [key]: val }))}
                    />

                    {/* Left Sidebar — overlay extension: floats over the store UI instead of pushing it.
                        Slightly shaded + blurred so the UI stays visible behind it while text remains readable. */}
                    {!inPageStoreGameId && sidebarVisible && <div className="absolute left-0 top-0 bottom-0 w-[132px] border-r z-40 flex flex-col items-center"
                        style={{
                            background: 'rgba(8, 12, 18, 0.58)',
                            backdropFilter: 'blur(10px) saturate(140%)',
                            WebkitBackdropFilter: 'blur(10px) saturate(140%)',
                            borderColor: 'rgba(200,210,220,0.18)',
                            boxShadow: '4px 0 24px rgba(0,0,0,0.4), inset 1px 0 0 rgba(255,255,255,0.06)'
                        }}
                    >
                        {/* TOP — Recent Games (the floating LibrarySidebar rail renders its label + boxes here). Kept empty so the rail shows through without the old "Recommended" overlap. */}
                        <div className="w-full flex-1 min-h-0" aria-hidden="true" />

                        {/* Jeweled divider — separates Recent Games from the Play launcher */}
                        <div className="w-full flex items-center gap-2 px-3 py-1 shrink-0">
                            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)' }} />
                            <span className="w-1.5 h-1.5 rotate-45 bg-white/40" style={{ boxShadow: '0 0 6px rgba(255,255,255,0.5)' }} />
                            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)' }} />
                        </div>

                        {/* MIDDLE — Play launcher (moved here from the hero cluster; sits between Recent Games and the bottom nav) */}
                        <div className="w-full flex-shrink-0 flex flex-col items-center gap-2 py-2">
                            <button
                                onClick={() => {
                                    const scroller = document.querySelector('.page-container');
                                    if (scroller) scroller.scrollTo({ top: 0, behavior: 'smooth' });
                                    else window.scrollTo({ top: 0, behavior: 'smooth' });
                                    setTimeout(() => {
                                        const heroPlay = [...document.querySelectorAll('button')].find(b => /PLAY NOW/i.test((b.textContent || '')));
                                        heroPlay?.click();
                                    }, 350);
                                }}
                                className="group flex flex-col items-center justify-center gap-0.5 w-12 h-12 rounded-2xl text-white transition-all duration-300 hover:scale-105"
                                style={{
                                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                    boxShadow: '0 6px 22px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.25)'
                                }}
                                title="Play featured game"
                            >
                                <Play className="w-5 h-5 fill-white" />
                                <span className="text-[8px] font-bold uppercase tracking-wider">Play</span>
                            </button>
                        </div>

                        {/* Jeweled divider — separates the Play launcher from the bottom nav */}
                        <div className="w-full flex items-center gap-2 px-3 py-1 shrink-0">
                            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)' }} />
                            <span className="w-1.5 h-1.5 rotate-45 bg-white/40" style={{ boxShadow: '0 0 6px rgba(255,255,255,0.5)' }} />
                            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)' }} />
                        </div>

                        {/* BOTTOM — Reserved for Library/Entertainment/Rewards options (floating LibrarySidebar) */}
                        <div className="w-full flex-1 min-h-0" aria-hidden="true" />
                    </div>}

                    {/* 95% Main Area */}
                    <div className="flex-1 relative h-full overflow-hidden flex flex-col">

                        {/* ═══ GENRE MASTERY SUB-NAV (matches Depth Cards style) ═══ */}
                        {/* Hidden on the redesigned storefront (it has its own Discover/genre sidebar) */}
                        {!inPageStoreGameId && storeMode !== 'devcards' && !(storeMode === 'store' && storeSubView === 'games' && viewMode === 'cross') && <div className="flex-shrink-0 mt-16 relative z-30">
                          <div className="flex items-center px-6 py-2 gap-0"
                            style={{
                              background: 'rgba(8, 12, 18, 0.5)',
                              backdropFilter: 'blur(20px)',
                              borderBottom: '1px solid rgba(255,255,255,0.06)',
                            }}
                          >
                            {/* Label */}
                            <span className="text-white/50 text-xs font-bold uppercase tracking-widest whitespace-nowrap flex-shrink-0 mr-4 select-none">
                              Galactic Trading Post
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

                              {/* Search bar — Trading Post only */}
                              {storeMode === 'trading' && (
                                <TradingPostSearchBar
                                  value={tradingSearch}
                                  onChange={setTradingSearch}
                                />
                              )}

                              {/* Balance — far right, no box */}
                              {storeMode === 'trading' && (
                                <div className="flex items-center gap-2 ml-auto">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                                    <DollarSign className="w-3 h-3 text-white" />
                                  </div>
                                  <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider">Balance</span>
                                  <span className="text-xs font-bold text-white font-mono">24,500 AGP</span>
                                </div>
                              )}
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
                                        // REDESIGNED STOREFRONT VIEW
                                        <motion.div key="storefront" className="w-full h-full relative pt-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            {loading ? (
                                                <LoadingState fullScreen message="Loading Store..." />
                                            ) : (
                                                <StorefrontLayout onNavigateToGame={handleNavigateToGame} games={games} />
                                            )}
                                        </motion.div>
                                    )
                                ) : storeMode === 'devcards' ? (
                                    <motion.div key="devcards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full overflow-hidden pt-16">
                                        <DevCardsContent onNavigateToGame={handleNavigateToGame} />
                                    </motion.div>
                                ) : (
                                    <motion.div key="trading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-[1920px] mx-auto px-4 md:px-6 py-24 overflow-y-auto h-full custom-scrollbar">
                                        <TradingPostContent genreFilter={storeFilters.genre} searchTerm={tradingSearch} />
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