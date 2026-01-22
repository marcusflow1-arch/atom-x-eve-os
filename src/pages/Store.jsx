import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
    Gamepad2, Search, ShoppingCart, Star, Trophy, Sparkles, 
    ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
    Zap, Heart, Skull, Shield, Music, Crosshair, Car, Monitor,
    X, Mic, MicOff, Loader2, LayoutGrid, MessageSquare, Flame, Check, Smartphone
} from 'lucide-react';
import { useCart } from '../components/CartContext';
import { useAuth } from '../components/auth/AuthContext';
import { createPageUrl } from '@/utils';
import { aiGamesList, otherSampleGames, androidGames } from '../components/store/mockData';
import { googlePlayGames } from '../components/store/androidGamesData';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import MarketplaceContent from '../components/store/MarketplaceContent';
import TradingPostContent from '../components/store/TradingPostContent';
import { NAV_HIERARCHY } from '../components/dashboard/NavigationConfig';
import { base44 } from '@/api/base44Client';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import StoreSpotlight from '../components/store/StoreSpotlight';
import Library from './Library';
import Achievements from './Achievements';
import ScrollTransitionOverlay from '@/components/shared/ScrollTransitionOverlay';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';
import { showError } from '@/components/error/ErrorToast';
import LoadingState from '@/components/error/LoadingState';
import { useStoreNavigation } from '../components/store/hooks/useStoreNavigation';
import { useGameFilters } from '../components/store/hooks/useGameFilters';

// --- Shiny Sidebar Box Component ---
const ShinySidebarBox = ({ children, className = "" }) => {
  const x = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });

  function handleMouseMove({ currentTarget, clientX }) {
    const { left, width } = currentTarget.getBoundingClientRect();
    x.set((clientX - left) / width);
  }

  return (
    <motion.div
      className={`relative overflow-hidden border rounded-2xl shadow-2xl ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => x.set(0.5)}
      style={{
        background: 'rgba(100, 120, 140, 0.12)',
        backdropFilter: 'blur(20px) saturate(130%)',
        WebkitBackdropFilter: 'blur(20px) saturate(130%)',
        borderColor: 'rgba(255, 255, 255, 0.10)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
      }}
    >
        {/* The Shine Effect */}
        <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
                background: useTransform(mouseX, val => 
                    `linear-gradient(105deg, transparent ${val * 100 - 20}%, rgba(255,255,255,0.1) ${val * 100}%, transparent ${val * 100 + 20}%)`
                ),
                opacity: 1
            }}
        />
        {children}
    </motion.div>
  );
};

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

// --- AI Voice Search Component ---
const AIVoiceSearch = ({ onSearchResult, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
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
        
        if (result.isFinal) {
          handleUserMessage(result[0].transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleUserMessage = async (message) => {
    if (!message.trim()) return;
    
    const newHistory = [...conversationHistory, { role: 'user', content: message }];
    setConversationHistory(newHistory);
    setIsProcessing(true);
    setTranscript('');

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Sophie, a friendly AI gaming assistant for the ATOM×EVE game store. Help users find games based on their descriptions.

Previous conversation:
${newHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

User's latest request: "${message}"

Based on the user's description, suggest relevant game genres, themes, or specific game titles they might enjoy. Be conversational and helpful. If they describe a game vaguely, ask clarifying questions. When you identify what they're looking for, provide a search term they can use.

Format your response as JSON:
{
  "message": "Your conversational response to the user",
  "searchSuggestion": "optional search term if you've identified what they want",
  "genres": ["optional", "relevant", "genres"]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            message: { type: "string" },
            searchSuggestion: { type: "string" },
            genres: { type: "array", items: { type: "string" } }
          },
          required: ["message"]
        }
      });

      setAiResponse(response.message);
      setConversationHistory([...newHistory, { role: 'assistant', content: response.message }]);

      if (response.searchSuggestion) {
        onSearchResult(response.searchSuggestion);
      }
    } catch (error) {
      showError(error, 'AI Search');
      setAiResponse("I'm having trouble processing that. Could you try describing the game again?");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Sophie</h3>
              <p className="text-white/40 text-xs">AI Game Assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation Area */}
        <div className="max-h-48 overflow-y-auto mb-4 space-y-3">
          {conversationHistory.length === 0 && !isListening && (
            <p className="text-white/50 text-sm text-center py-4">
              Hi! I'm Sophie. Tell me what kind of game you're looking for, and I'll help you find it!
            </p>
          )}
          
          {conversationHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-500/20 text-blue-200' 
                  : 'bg-white/10 text-white/90'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white/10 px-3 py-2 rounded-xl flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-white/60 text-sm">Sophie is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Transcript */}
        {(isListening || transcript) && (
          <div className="bg-white/5 rounded-lg p-3 mb-4 border border-white/10">
            <p className="text-white/70 text-sm">
              {transcript || <span className="text-white/40 animate-pulse">Listening...</span>}
            </p>
          </div>
        )}

        {/* Voice Control */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isListening ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        <p className="text-white/30 text-xs text-center mt-3">
          {isListening ? 'Tap to stop' : 'Tap to speak'}
        </p>
      </div>
    </motion.div>
  );
};

// --- Regular Voice Input Hook ---
const useVoiceInput = (onResult) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false; // Only final results for simple input
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const result = event.results[0][0].transcript;
                onResult(result);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [onResult]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
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
    
    // Store Mode State
    const [storeMode, setStoreMode] = useState(searchParams.get('mode') || 'store'); // 'store', 'marketplace', 'trading'
    const [storeSubView, setStoreSubView] = useState(searchParams.get('subview') || 'games'); // 'games' | 'library' | 'achievements'
    
    // Sync storeSubView with URL params when they change
    useEffect(() => {
        const subview = searchParams.get('subview');
        if (subview) {
            setStoreSubView(subview);
            setStoreMode('store');
        }
        const mode = searchParams.get('mode');
        if (mode) {
            setStoreMode(mode);
        }
    }, [searchParams]);

    const [viewMode, setViewMode] = useState('cross'); // 'cross' or 'classic'
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [marketplaceSearchTerm, setMarketplaceSearchTerm] = useState('');
    const [voiceSearchOpen, setVoiceSearchOpen] = useState(false);
    const [showVoiceOptions, setShowVoiceOptions] = useState(false);
    const [showScrollTransition, setShowScrollTransition] = useState(false);
    const [pendingNavigateUrl, setPendingNavigateUrl] = useState(null);
    const [headerOpacity, setHeaderOpacity] = useState(1);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef(null);
    const [hoveredGame, setHoveredGame] = useState(null);
    const genreRefs = useRef([]);

    // Navigate with scroll transition
    const handleNavigateToGame = (id) => {
        setPendingNavigateUrl(createPageUrl(`GameDetail?id=${id}`));
        setShowScrollTransition(true);
    };

    // Use filter and navigation hooks
    const {
        activeCategory,
        setActiveCategory,
        priceRange,
        setPriceRange,
        selectedGenres,
        toggleGenre,
        minRating,
        setMinRating,
        showAndroidOnly,
        setShowAndroidOnly,
        genreData
    } = useGameFilters(games, loading);

    // --- NEW NAVIGATION LOGIC (Horizontal Genres + Vertical Sub-Categories) ---
    const [activeGenreIndex, setActiveGenreIndex] = useState(0);
    const [activeSubCategoryIndex, setActiveSubCategoryIndex] = useState(0);
    const [isNavigating, setIsNavigating] = useState(false);
    
    // Derived state
    const currentNavGenre = genreData[activeGenreIndex];
    
    // Mock Sub-Categories (as requested)
    const SUB_CATEGORIES = useMemo(() => {
        const defaults = ['Trending', 'Top Rated', 'New Releases', 'Classics', 'Hidden Gems'];
        if (!currentNavGenre) return defaults;
        
        switch(currentNavGenre.label) {
            case 'Action': return ['Adventure', 'Fighting', 'Platformer', 'Stealth', 'Beat \'em up'];
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

    // Filtered Games based on Genre + Mock Sub-Category logic
    // (In a real app, we would filter by actual tags. Here we simulate "showing a list of games")
    const displayedGames = useMemo(() => {
        if (!currentNavGenre) return [];
        // For demo: shuffle or filter slightly to make lists look different per sub-cat
        // We'll just return all genre items for now, maybe reversed or sliced to simulate variety
        // User said: "It will show you all the games in action"
        // We'll just show the genre items. In a real implementation we'd match tags.
        return currentNavGenre.items; 
    }, [currentNavGenre, activeSubCategory]);

    const activeGame = null; // No single active game in this new "List View" mode until hovered/selected

    // Navigation Handler (Updated for Dual Horizontal Rows)
    useEffect(() => {
        if (storeMode !== 'store' || loading || genreData.length === 0 || viewMode !== 'cross') return;

        // Simple focus state to toggle between controlling Genres (row 1) or Sub-Cats (row 2)
        // 0 = Genre Row, 1 = Sub-Cat Row
        // We'll use a ref or just simplify: Up/Down switches rows, Left/Right navigates current row
        // But since we don't have visual focus state distinct from "active item", let's assume:
        // Top Row (Genres) is dominant. Sub-cats update based on Genre.
        // Let's keep it simple: Arrow Keys = Sub-Cats (since that's the "content" filter), 
        // Shift + Arrows = Genres? Or maybe PageUp/Down for Genres?
        
        // Actually, let's try a smarter approach:
        // W/S (Up/Down) = Switch between Genre selection and Sub-Cat selection? 
        // No, that's complex state.
        
        // Let's map:
        // A/D (Left/Right) = Navigate Sub-Categories (Fine tuning)
        // Q/E (Shoulder buttons) = Navigate Genres (Broad switching)
        // OR
        // Up/Down = Navigate Genres (Since they are "higher" level, even if visually horizontal?) 
        // User asked for "Left and Right" for both.
        
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            
            // Row 1: Genres (Use Shift + Left/Right OR just Up/Down to switch "focus" to top row?)
            // Let's use W/S (Up/Down) to change Genres for now as it's a "Vertical" hierarchy logically (Parent -> Child),
            // even if displayed horizontally.
            // visual: Top Row vs Bottom Row.
            
            if (key === 'w' || key === 'arrowup') {
                 // Move "Up" to Genres -> actually let's make Up/Down cycle genres to keep it simple with 1D input devices
                 // Wait, user wants Left/Right for both.
                 // Let's use standard grid nav logic.
                 // We need a "focusRow" state, but we don't have one exposed.
                 
                 // Fallback: 
                 // Arrows = Sub-Categories (most frequent action)
                 // Shift + Arrows = Genres
            }

            if (key === 'arrowleft' || key === 'a') {
                e.preventDefault();
                if (e.shiftKey) {
                    // Shift + Left = Previous Genre
                    setActiveGenreIndex(prev => {
                        const newIndex = prev > 0 ? prev - 1 : prev;
                        return newIndex;
                    });
                    setActiveSubCategoryIndex(0);
                } else {
                    // Left = Previous Sub-Category
                    setActiveSubCategoryIndex(prev => prev > 0 ? prev - 1 : prev);
                }
            } else if (key === 'arrowright' || key === 'd') {
                e.preventDefault();
                if (e.shiftKey) {
                    // Shift + Right = Next Genre
                    setActiveGenreIndex(prev => {
                        const newIndex = prev < genreData.length - 1 ? prev + 1 : prev;
                        return newIndex;
                    });
                    setActiveSubCategoryIndex(0);
                } else {
                    // Right = Next Sub-Category
                    setActiveSubCategoryIndex(prev => prev < SUB_CATEGORIES.length - 1 ? prev + 1 : prev);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeGenreIndex, activeSubCategoryIndex, genreData, loading, viewMode, storeMode, SUB_CATEGORIES]);

    // Keep activeGameIndex for API compatibility if needed, though unused in grid nav currently
    const activeGameIndex = 0; 
    const setActiveGameIndex = () => {};

    // Scroll active genre into view for Classic Mode
    useEffect(() => {
        if (viewMode === 'classic' && genreRefs.current[activeGenreIndex]) {
            genreRefs.current[activeGenreIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeGenreIndex, viewMode]);

    // Header fade on scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolling(true);
            setHeaderOpacity(0.3);
            
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            
            scrollTimeoutRef.current = setTimeout(() => {
                setIsScrolling(false);
                setHeaderOpacity(1);
            }, 150);
        };

        window.addEventListener('scroll', handleScroll, true);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
        }, []);

        // Regular Voice Input for Store
    const { isListening: isRegularVoiceListening, toggleListening: toggleRegularVoice } = useVoiceInput((text) => {
        setSearchTerm(text);
        setShowVoiceOptions(false);
    });

    // Initial Data Fetch
    useEffect(() => {
        const fetchGames = async () => {
            const isDev = import.meta.env.DEV;
            const useMock = isDev && window.localStorage.getItem('USE_MOCK_DATA') === 'true';

            try {
                const fetchedGamesResponse = await base44.entities.Game.list();
                const fetchedGames = fetchedGamesResponse.data || fetchedGamesResponse;

                if (fetchedGames.length > 0) {
                    setGames(fetchedGames);
                } else if (useMock) {
                    // Only use mock data if explicitly enabled in dev
                    setGames([...aiGamesList, ...otherSampleGames, ...androidGames, ...googlePlayGames]);
                } else {
                    // Empty state - show helpful message
                    setGames([]);
                }
            } catch (error) {
                showError(error, 'Load Games');
                if (useMock) {
                    setGames([...aiGamesList, ...otherSampleGames, ...androidGames, ...googlePlayGames]);
                } else {
                    setGames([]);
                }
            }
            setLoading(false);
        };
        fetchGames();
    }, []);

    // Constants for positioning
    const ITEM_HEIGHT = 80;
    const ITEM_GAP = 24;
    const CROSS_Y_VH = 40;

    return (
        <PageErrorBoundary pageName="Store">
        <div 
            className="h-screen w-full relative overflow-hidden text-white font-sans select-none"
            style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}
        >
            
            {/* Top Navigation Bar (Translucent/Invisible) - Fades on scroll - Hidden for Library/Achievements subviews */}
            {storeSubView === 'games' && (
            <div 
                className="absolute top-0 left-0 right-0 z-50 flex flex-col transition-opacity duration-200" 
                style={{ 
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)',
                    opacity: headerOpacity,
                    pointerEvents: isScrolling ? 'none' : 'auto'
                }}>
                
                <div className="h-16 flex items-center justify-between px-6">
                <div className="flex items-center gap-6">
                    {/* Menu Button */}
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all shadow-lg border border-white/10"
                    >
                        <div className="flex flex-col gap-[3px]">
                            <span className="w-4 h-[2px] bg-white/90 rounded-full"></span>
                            <span className="w-4 h-[2px] bg-white/90 rounded-full"></span>
                            <span className="w-4 h-[2px] bg-white/90 rounded-full"></span>
                        </div>
                    </button>

                    {/* Title */}
                    <span className="text-xl font-bold tracking-wider text-white/90 drop-shadow-md">
                        {storeMode === 'store' && storeSubView === 'achievements' ? 'Atom X Eve Achievement' : storeMode === 'store' && storeSubView === 'library' ? 'Atom X Eve Library' : 'Atom X Eve Store'}
                    </span>

                    {/* Divider */}
                    <div className="h-6 w-px bg-white/20 mx-2"></div>

                    {/* Sub-Page Links */}
                    <div className="flex items-center gap-2">
                        <div className="relative inline-block">
                          <button 
                            onClick={() => {
                              // If already on store mode, go to Luna. Otherwise, switch to store mode first.
                              if (storeMode === 'store') {
                                navigate(createPageUrl('LunaTemplate'));
                              } else {
                                setStoreMode('store');
                              }
                            }}
                            className={`relative z-10 px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md border ${
                              storeMode === 'store'
                                ? 'bg-white/20 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                : 'bg-transparent border-transparent text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            Store
                          </button>
                          {storeMode === 'store' && (
                            <div
                              aria-hidden
                              className="pointer-events-none absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-full px-4 py-2 border bg-white/10 border-white/20 text-white/60 backdrop-blur-md z-0 flex items-center justify-center"
                            >
                              <span className="text-sm font-medium">Home</span>
                            </div>
                          )}
                        </div>
                        <button 
                            onClick={() => {
                              // If already on marketplace, go to store first
                              if (storeMode === 'marketplace') {
                                setStoreMode('store');
                              } else {
                                setStoreMode('marketplace');
                              }
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md border ${
                                storeMode === 'marketplace' 
                                    ? 'bg-white/20 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                                    : 'bg-transparent border-transparent text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            Marketplace
                        </button>
                        <button 
                            onClick={() => {
                              // If already on trading, go to store first
                              if (storeMode === 'trading') {
                                setStoreMode('store');
                              } else {
                                setStoreMode('trading');
                              }
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md border ${
                                storeMode === 'trading' 
                                    ? 'bg-white/20 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                                    : 'bg-transparent border-transparent text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            Trading Post
                        </button>
                    </div>
                </div>

                {/* Header Controls Area */}
                <div className="flex items-center gap-4 ml-6">
                    {storeMode === 'marketplace' ? (
                        /* Marketplace Bar (Next to Trading Post) */
                        <div className="flex items-center gap-3 bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-full p-1.5 pr-4 shadow-lg">
                             <div className="relative group flex items-center bg-slate-800/50 rounded-full px-3 py-1.5 border border-white/5 hover:border-white/20 transition-all focus-within:bg-slate-800 focus-within:border-white/30">
                                <Search className="w-3.5 h-3.5 text-white/50 mr-2" />
                                <input 
                                    type="text" 
                                    value={marketplaceSearchTerm}
                                    onChange={(e) => setMarketplaceSearchTerm(e.target.value)}
                                    placeholder="Search market..." 
                                    className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30 w-40 font-medium"
                                />
                             </div>

                             {/* Balance */}
                             <div className="flex items-center gap-1.5 text-white px-2">
                              <span className="text-green-400 font-bold text-xs">A.S.P.</span>
                              <span className="font-bold text-sm">{user?.balance || 0}</span>
                             </div>

                             {/* Cart */}
                            <Link to={createPageUrl('Cart')} className="relative text-white/70 hover:text-white transition-colors">
                              <ShoppingCart className="w-5 h-5" />
                              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-orange-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                {getCartCount()}
                              </span>
                            </Link>

                             {/* Avatar */}
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-[1px] cursor-pointer">
                              <div className="w-full h-full rounded-full overflow-hidden bg-slate-900">
                                 <img src={user?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"} alt="User" className="w-full h-full object-cover" />
                              </div>
                            </div>
                        </div>
                    ) : storeMode === 'store' && storeSubView === 'games' ? (
                        /* Standard Store Search - Only for Games view, NOT Library/Achievements */
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 w-72 hover:bg-black/40 hover:border-white/20 transition-all focus-within:bg-black/50 focus-within:border-white/30 shadow-lg">
                                    <Search className="w-4 h-4 text-white/50" />
                                    <input 
                                        type="text" 
                                        placeholder={isRegularVoiceListening ? "Listening..." : "Search games..."}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30 w-full font-medium"
                                    />
                                    {searchTerm && (
                                        <button onClick={() => setSearchTerm('')} className="text-white/40 hover:text-white">
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setShowVoiceOptions(!showVoiceOptions)}
                                        className={`p-1 rounded-full transition-colors ${voiceSearchOpen || isRegularVoiceListening ? 'bg-purple-500/50 text-white' : 'text-white/40 hover:text-white'}`}
                                    >
                                        <Mic className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <AnimatePresence>
                                    {showVoiceOptions && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 backdrop-blur-xl"
                                        >
                                            <button onClick={() => { setVoiceSearchOpen(true); setShowVoiceOptions(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors">
                                                <Sparkles className="w-4 h-4 text-purple-400" />
                                                <span className="text-sm font-medium text-white">AI Search</span>
                                            </button>
                                            <div className="h-px bg-white/10" />
                                            <button onClick={() => { toggleRegularVoice(); setShowVoiceOptions(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors">
                                                <Mic className="w-4 h-4 text-blue-400" />
                                                <span className="text-sm font-medium text-white">Voice Search</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <AnimatePresence>
                                    {voiceSearchOpen && <AIVoiceSearch onSearchResult={(term) => { setSearchTerm(term); setVoiceSearchOpen(false); }} onClose={() => setVoiceSearchOpen(false)} />}
                                </AnimatePresence>
                            </div>
                            <Link to={createPageUrl('Cart')} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all relative backdrop-blur-md border border-white/10">
                                <ShoppingCart className="w-4 h-4 text-white/80" />
                                {getCartCount() > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{getCartCount()}</span>}
                            </Link>
                        </div>
                    ) : null}
                </div>
                </div>
                

            </div>
            )}

            {/* App Drawer Overlay */}
            <AnimatePresence>
                {drawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                            onClick={() => setDrawerOpen(false)}
                        />
                        <motion.div
                            initial={{ x: -320, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -320, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-80 z-50 flex flex-col rounded-r-3xl"
                            style={{ 
                              background: 'rgba(100, 120, 140, 0.12)',
                              backdropFilter: 'blur(30px) saturate(150%)',
                              WebkitBackdropFilter: 'blur(30px) saturate(150%)',
                              borderRight: '1px solid rgba(255, 255, 255, 0.10)',
                              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                            }}
                        >
                            {/* Drawer Header */}
                            <div className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-white font-bold text-xl tracking-wider">ATOM×EVE</span>
                                <button 
                                  onClick={() => setDrawerOpen(false)}
                                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                                >
                                  <X className="w-4 h-4 text-white/60" />
                                </button>
                              </div>
                            </div>

                            {/* Nav Items - Hierarchical */}
                            <div className="flex-1 overflow-y-auto p-4">
                              <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-3 px-2">Navigation</p>
                              <div className="space-y-1">
                                {NAV_HIERARCHY.map((mainItem) => {
                                  return (
                                    <div key={mainItem.name}>
                                      {/* Main Page Link */}
                                      <Link
                                        to={mainItem.path}
                                        onClick={() => setDrawerOpen(false)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-white/60 hover:text-white border border-transparent hover:bg-white/[0.05]"
                                      >
                                        <mainItem.icon className="w-5 h-5" />
                                        <span className="font-medium">{mainItem.name}</span>
                                      </Link>

                                      {/* Sub-pages */}
                                      {mainItem.subPages && mainItem.subPages.length > 0 && (
                                        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                                          {mainItem.subPages.map((subItem) => (
                                            <Link
                                              key={subItem.name}
                                              to={subItem.path}
                                              onClick={() => setDrawerOpen(false)}
                                              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left text-white/50 hover:text-white/80 border border-transparent"
                                            >
                                              <subItem.icon className="w-4 h-4" />
                                              <span className="text-sm">{subItem.name}</span>
                                            </Link>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-4">
                              <p className="text-white/20 text-xs text-center">© 2025 ATOM×EVE</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT AREA */}
            <AnimatePresence mode="wait">
                {storeMode === 'store' && storeSubView === 'achievements' ? (
                    <motion.div
                        key="embedded-achievements"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full pt-20 overflow-hidden"
                    >
                        <Achievements onExitToLibrary={() => setStoreSubView('library')} />
                    </motion.div>
                ) : storeMode === 'store' && storeSubView === 'library' ? (
                    <motion.div
                        key="embedded-library"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full overflow-hidden"
                    >
                        <Library onSwitchToStore={() => setStoreSubView('games')} onSwitchToAchievements={() => setStoreSubView('achievements')} />
                    </motion.div>
                ) : storeMode === 'store' ? (
                    viewMode === 'classic' ? (
                         // CLASSIC GRID VIEW
                        <motion.div
                            key="classic-store"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full pt-20 pb-0 bg-transparent"
                        >
                            {/* Dynamic Background */}
                            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                                <AnimatePresence mode="wait">
                                    {(hoveredGame) && (
                                        <motion.div
                                            key={hoveredGame?.id}
                                            initial={{ opacity: 0, scale: 1.1 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.8 }}
                                            className="absolute inset-0"
                                        >
                                            <img 
                                                src={hoveredGame?.cover_image || hoveredGame?.image} 
                                                className="w-full h-full object-cover opacity-20 blur-sm"
                                                alt="Background"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex h-full max-w-[1920px] mx-auto">
                                {/* LEFT SIDEBAR - SHINY BOX */}
                                <div className="w-[300px] flex-shrink-0 h-full p-6 overflow-y-auto custom-scrollbar hidden lg:block">
                                    <ShinySidebarBox className="p-6 h-full min-h-[80vh]">
                                        {/* Categories */}
                                        <div className="mb-8">
                                            <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <LayoutGrid className="w-3 h-3" /> Categories
                                            </h3>
                                            <div className="space-y-1">
                                                {['All Games', 'Trending Now', 'New Releases', 'Top Rated', 'AI Enhanced', 'On Sale'].map((item) => (
                                                    <button 
                                                        key={item}
                                                        onClick={() => setActiveCategory(item)}
                                                        className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center justify-between group ${
                                                            activeCategory === item ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                        }`}
                                                    >
                                                        <span>{item}</span>
                                                        {activeCategory === item && <ChevronRight className="w-3 h-3" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="h-px bg-white/10 mb-8" />

                                        {/* Genre Filters */}
                                        <div className="mb-8">
                                            <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Genre</h3>
                                            <div className="space-y-3">
                                                {['Action', 'RPG', 'Shooter', 'Strategy', 'Adventure', 'Sports', 'Racing', 'Simulation'].map((g) => (
                                                    <label key={g} className="flex items-center gap-3 cursor-pointer group">
                                                        <Checkbox 
                                                                        className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 rounded" 
                                                                        checked={selectedGenres.includes(g)}
                                                                        onCheckedChange={() => toggleGenre(g)}
                                                                    />
                                                        <span className="text-sm text-slate-400 group-hover:text-white transition-colors">{g}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="h-px bg-white/10 mb-8" />

                                        {/* Price Range */}
                                        <div className="mb-8">
                                            <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Price Range</h3>
                                            <Slider 
                                                defaultValue={[0, 100]} 
                                                max={100} 
                                                step={1} 
                                                value={priceRange}
                                                onValueChange={setPriceRange}
                                                className="mb-3"
                                            />
                                            <div className="flex items-center justify-between text-xs text-white/60 font-mono">
                                                <span>${priceRange[0]}</span>
                                                <span>${priceRange[1]}</span>
                                            </div>
                                        </div>

                                        {/* Customer Rating */}
                                        <div className="mb-6">
                                            <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Customer Rating</h3>
                                            <div className="space-y-2">
                                                {[4, 3, 2, 1].map((rating) => (
                                                    <button 
                                                        key={rating} 
                                                        onClick={() => setMinRating(rating)}
                                                        className={`flex items-center gap-2 w-full text-sm ${minRating === rating ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                                                    >
                                                        <div className="flex">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star 
                                                                    key={i} 
                                                                    className={`w-3.5 h-3.5 ${i < rating ? 'text-yellow-500 fill-current' : 'text-slate-700'}`} 
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-xs">& Up</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </ShinySidebarBox>
                                </div>

                                {/* RIGHT CONTENT AREA */}
                                <div className="flex-1 h-full overflow-y-auto custom-scrollbar px-8 pb-12">
                                    {/* Header Actions */}
                                    <div className="flex items-center justify-end gap-3 mb-8 sticky top-0 z-20 py-4">
                                        <button 
                                            onClick={() => setShowAndroidOnly(!showAndroidOnly)}
                                            className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all hover:scale-110 ${
                                                showAndroidOnly
                                                    ? 'bg-green-500/20 border-green-400/50 text-green-300 hover:bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                                                    : 'bg-white/5 hover:bg-white/20 border-white/10 hover:border-white/30 text-white/80 hover:text-white'
                                            }`}
                                            title="Android Games"
                                        >
                                            <Smartphone className="w-6 h-6" />
                                        </button>
                                        <button 
                                            onClick={() => setViewMode('cross')}
                                            className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/20 border border-white/10 hover:border-white/30 flex items-center justify-center transition-all text-white/80 hover:text-white hover:scale-110 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                            title="Cross View"
                                        >
                                            <Gamepad2 className="w-6 h-6" />
                                        </button>
                                    </div>

                                    {/* Store Spotlight Feature */}
                                    <StoreSpotlight games={aiGamesList} />

                                    {/* Featured Section (Horizontal Scroll) */}
                                    <div className="mb-12">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Flame className="w-5 h-5 text-orange-500" />
                                            <h3 className="text-xl font-bold text-white">Featured & Recommended</h3>
                                        </div>
                                        
                                        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
                                            {[...aiGamesList].slice(0, 5).map((game) => (
                                                <motion.div
                                                    key={game.id}
                                                    whileHover={{ scale: 1.02, y: -5 }}
                                                    onClick={() => handleNavigateToGame(game.id)}
                                                    className="w-[285px] flex-shrink-0 aspect-video rounded-xl relative overflow-hidden cursor-pointer snap-start border border-white/10 group shadow-lg"
                                                >
                                                    <img src={game.cover_image || game.image} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-90" />
                                                    
                                                    <div className="absolute bottom-0 left-0 right-0 p-5">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border-white/10 text-[10px] uppercase tracking-wider">
                                                                {game.genre}
                                                            </Badge>
                                                        </div>
                                                        <h4 className="text-2xl font-bold text-white mb-1 leading-none">{game.title}</h4>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="flex items-center gap-0.5 text-yellow-500">
                                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                                <span className="text-sm font-bold ml-1">{game.rating}</span>
                                                            </div>
                                                            <span className="text-white/30 text-xs">|</span>
                                                            <span className="text-blue-400 font-bold text-sm">${game.price}</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Genre Rows */}
                                    <div className="space-y-12">
                                        {genreData.map((genre, gIdx) => (
                                            <div 
                                                key={genre.id} 
                                                ref={el => genreRefs.current[gIdx] = el}
                                                className={`space-y-4 transition-opacity duration-300 ${viewMode === 'classic' || activeGenreIndex === gIdx ? 'opacity-100' : 'opacity-80'}`}
                                            >
                                                <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                                                    <genre.icon className="w-5 h-5 text-blue-400" />
                                                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">{genre.label}</h3>
                                                    <span className="text-white/20 text-sm ml-auto">{genre.items.length} titles</span>
                                                </div>
                                                
                                                <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
                                                    {genre.items.map((game, itemIdx) => {
                                                        const isKeyboardActive = activeGenreIndex === gIdx && activeGameIndex === itemIdx;
                                                        return (
                                                            <motion.div
                                                                key={game.id}
                                                                whileHover={{ y: -5, scale: 1.02 }}
                                                                onMouseEnter={() => {
                                                                    setHoveredGame(game);
                                                                }}
                                                                onMouseLeave={() => setHoveredGame(null)}
                                                                className={`
                                                                    group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer shadow-lg transition-all border
                                                                    ${isKeyboardActive ? 'ring-2 ring-cyan-400 scale-105 z-10' : 'hover:shadow-cyan-500/10 hover:border-cyan-400/30'}
                                                                `}
                                                                style={isKeyboardActive ? {} : {
                                                                  background: 'rgba(100, 120, 140, 0.10)',
                                                                  backdropFilter: 'blur(12px) saturate(120%)',
                                                                  WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                                                                  borderColor: 'rgba(255, 255, 255, 0.08)'
                                                                }}
                                                                onClick={() => handleNavigateToGame(game.id)}
                                                            >
                                                                <img 
                                                                    src={game.cover_image || game.image} 
                                                                    alt={game.title} 
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                                                                
                                                                <div className="absolute top-2 right-2">
                                                                    <Badge className="bg-black/60 backdrop-blur-sm border-white/10 text-white text-xs">
                                                                        ${game.price}
                                                                    </Badge>
                                                                </div>

                                                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                                                    <h4 className="text-white font-bold text-sm truncate mb-1">{game.title}</h4>
                                                                    <div className="flex items-center justify-between text-xs text-white/50">
                                                                        <span>{game.genre}</span>
                                                                        <div className="flex items-center gap-1">
                                                                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                                            <span>{game.rating || 4.5}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        // CROSS INTERFACE VIEW
                    <motion.div 
                        key="cross-interface"
                        className="w-full h-full relative"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Loading State */}
                        {loading ? (
                            <LoadingState fullScreen message="Loading Store..." />
                        ) : !currentNavGenre ? null : (
                            <>
                                {/* Dynamic Background */}
                                <AnimatePresence mode="wait">
                                    <motion.div 
                                        key={activeGame?.id || currentNavGenre?.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.6 }}
                                        className="absolute inset-0 z-0"
                                    >
                                        {/* Dark overlay base */}
                                        <div className="absolute inset-0 bg-transparent" />
                                        
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

                                {/* Interface Layer */}
                                <div className="relative z-10 w-full h-full pt-20"> {/* pt-20 for header space */}
                                    
                                    {/* Breadcrumb moved slightly down */}
                                    <div className="absolute top-24 left-12 flex items-center gap-4 text-white/50 text-sm font-medium tracking-wider uppercase z-30">
                                        <div className="flex items-center gap-2">
                                            <Gamepad2 className="w-4 h-4" />
                                            <Smartphone className="w-3.5 h-3.5" />
                                            <span>Store</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4" />
                                        <span className="text-white">{currentNavGenre.label}</span>

                                        {/* Android Filter Button */}
                                        <button 
                                            onClick={() => setShowAndroidOnly(!showAndroidOnly)}
                                            className={`ml-2 p-1.5 rounded-lg border transition-all group ${
                                                showAndroidOnly
                                                    ? 'bg-green-500/20 border-green-400/50 text-green-300'
                                                    : 'bg-white/10 hover:bg-white/20 border-white/10 hover:border-white/30 text-white/60 hover:text-white'
                                            }`}
                                            title="Android Games"
                                        >
                                            <Smartphone className="w-3.5 h-3.5" />
                                        </button>

                                        <div className="relative group/search ml-2">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 group-focus-within/search:text-white/80 transition-colors" />
                                            <input 
                                                type="text" 
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Search..." 
                                                className="bg-white/10 hover:bg-white/20 focus:bg-white/20 border border-white/10 focus:border-white/30 rounded-lg pl-7 pr-3 py-1 text-xs text-white placeholder:text-white/30 w-24 focus:w-40 transition-all outline-none"
                                            />
                                        </div>

                                        {/* Classic UI Toggle Button */}
                                        <button 
                                            onClick={() => setViewMode('classic')}
                                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 transition-all group"
                                            title="Switch to Classic Grid View"
                                        >
                                            <LayoutGrid className="w-3.5 h-3.5 text-white/60 group-hover:text-white" />
                                        </button>
                                    </div>

                                    {/* 1. HORIZONTAL AXIS (Genres) - Fixed at Top Left */}
                                    <div 
                                        className="absolute top-40 left-0 right-0 z-20 h-28 flex items-center overflow-x-auto scrollbar-hide px-12"
                                        onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}
                                    >
                                        <div className="flex items-center gap-4">
                                                {genreData.map((genre, idx) => {
                                                    const isActive = idx === activeGenreIndex;
                                                    const Icon = genre.icon;
                                                    return (
                                                        <motion.div
                                                            key={genre.id}
                                                            onClick={() => {
                                                                setActiveGenreIndex(idx);
                                                                setActiveSubCategoryIndex(0);
                                                            }}
                                                            animate={{ 
                                                                scale: isActive ? 1.1 : 0.8,
                                                                opacity: isActive ? 1 : 0.4
                                                            }}
                                                            className="flex flex-col items-center gap-3 cursor-pointer flex-shrink-0 w-[120px]"
                                                        >
                                                            <div className={`
                                                                w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
                                                                ${isActive 
                                                                    ? 'bg-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.2)] backdrop-blur-md border border-white/20' 
                                                                    : 'bg-white/5 text-white/60 border border-white/10'
                                                                }
                                                            `}>
                                                                <Icon className="w-7 h-7" />
                                                            </div>
                                                            <span className={`text-[10px] font-bold uppercase tracking-widest text-center transition-colors ${isActive ? 'text-white' : 'text-white/40'}`}>
                                                                {genre.label}
                                                            </span>
                                                        </motion.div>
                                                    );
                                                })}
                                        </div>
                                            
                                        </div>
                                    </div>

                                    {/* 2. HORIZONTAL AXIS (Sub-Categories) - Just Below Genres, Left Aligned */}
                                    <div 
                                        className="absolute top-64 left-0 right-0 z-20 h-14 flex items-center justify-center overflow-x-auto scrollbar-hide px-12"
                                        onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}
                                    >
                                        <div className="flex items-center gap-3">
                                            {SUB_CATEGORIES.map((subCat, idx) => {
                                                const isActive = idx === activeSubCategoryIndex;
                                                return (
                                                    <motion.button
                                                        key={subCat}
                                                        onClick={() => setActiveSubCategoryIndex(idx)}
                                                        animate={{ 
                                                            scale: isActive ? 1.0 : 0.9, 
                                                            opacity: isActive ? 1 : 0.5
                                                        }}
                                                        className={`
                                                            flex-shrink-0 px-3 py-1.5 rounded-full border transition-all duration-300 whitespace-nowrap
                                                            ${isActive 
                                                                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                                                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                                            }
                                                        `}
                                                        // Reduced size by ~20% via padding/text size adjustments
                                                        style={{ transformOrigin: 'left center' }} 
                                                    >
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">
                                                            {subCat}
                                                        </span>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* 3. MAIN CONTENT (Game Grid) - Adjusted Top & Aligned Left */}
                                    <div className="absolute top-80 bottom-0 left-0 right-0 z-10 overflow-y-auto custom-scrollbar px-12 py-8">
                                        <div className="w-full">
                                            <motion.div 
                                                key={`${activeGenreIndex}-${activeSubCategoryIndex}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                {/* Header moved to far left, removed centering */}
                                                <div className="flex flex-col items-start gap-2 mb-8 border-b border-white/10 pb-4 w-full">
                                                    <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                                                        <span className="text-white/30 font-medium">{currentNavGenre.label}</span>
                                                        <ChevronRight className="w-6 h-6 text-white/20" />
                                                        <span className="text-cyan-400 text-shadow-glow">{activeSubCategory}</span>
                                                    </h2>
                                                    <div className="flex items-center gap-4 text-white/40 text-sm font-mono uppercase tracking-widest">
                                                        <div className="h-px w-12 bg-cyan-500/50" />
                                                        <span>{displayedGames.length} titles available</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                                    {displayedGames.map((game, idx) => (
                                                        <motion.div
                                                            key={game.id}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: idx * 0.05 }}
                                                            whileHover={{ y: -8, scale: 1.02 }}
                                                            onClick={() => handleNavigateToGame(game.id)}
                                                            onMouseEnter={() => setHoveredGame(game)}
                                                            className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer shadow-lg bg-slate-900 border border-white/5 hover:border-cyan-400/40 hover:shadow-cyan-500/20 transition-all"
                                                        >
                                                            <img 
                                                                src={game.cover_image || game.image} 
                                                                alt={game.title} 
                                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                                                            
                                                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 z-10">
                                                                <span className="text-green-400 font-bold text-sm">${game.price}</span>
                                                            </div>

                                                            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform">
                                                                <h4 className="text-white font-bold text-lg leading-tight mb-1 truncate">{game.title}</h4>
                                                                <div className="flex items-center justify-between text-xs text-white/60">
                                                                    <span>{game.genre}</span>
                                                                    <div className="flex items-center gap-1 text-yellow-500">
                                                                        <Star className="w-3 h-3 fill-current" />
                                                                        <span>{game.rating}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                    
                                                    {/* Filler Cards if few games */}
                                                    {displayedGames.length < 4 && Array.from({ length: 4 - displayedGames.length }).map((_, i) => (
                                                        <div key={`filler-${i}`} className="aspect-[3/4] rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center">
                                                            <span className="text-white/10 text-sm font-medium">Coming Soon</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                    ) // Closing viewMode check
                ) : storeMode === 'marketplace' ? (
                    <motion.div
                        key="marketplace"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="max-w-[1920px] mx-auto px-4 md:px-6 py-24 overflow-y-auto h-full custom-scrollbar" // ADDED overflow-y-auto h-full
                    >
                        <MarketplaceContent searchTerm={marketplaceSearchTerm} onSearchChange={setMarketplaceSearchTerm} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="trading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="max-w-[1920px] mx-auto px-4 md:px-6 py-24 overflow-y-auto h-full custom-scrollbar" // ADDED overflow-y-auto h-full
                    >
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
        </div>
        </PageErrorBoundary>
    );
}