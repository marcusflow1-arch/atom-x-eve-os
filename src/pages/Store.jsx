import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Gamepad2, Search, ShoppingCart, Star, Trophy, Sparkles, 
    ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
    Zap, Heart, Skull, Shield, Music, Crosshair, Car, Monitor,
    X, Mic, MicOff, Loader2, LayoutGrid
} from 'lucide-react';
import { useCart } from '../components/CartContext';
import { useAuth } from '../components/auth/AuthContext';
import { Game } from '@/entities/Game';
import { createPageUrl } from '@/utils';
import { aiGames, otherSampleGames } from '@/components/store/mockData';
import { Badge } from '@/components/ui/badge';
import MarketplaceContent from '../components/store/MarketplaceContent';
import TradingPostContent from '../components/store/TradingPostContent';
import { ALL_NAV_ITEMS } from '../components/dashboard/NavigationConfig';
import { base44 } from '@/api/base44Client';

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
      console.error('AI processing error:', error);
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

export default function Store() {
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, cartCount } = useAuth();
    
    // Store Mode State
    const [storeMode, setStoreMode] = useState('store'); // 'store', 'marketplace', 'trading'
    const [viewMode, setViewMode] = useState('cross'); // 'cross' or 'classic'
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [voiceSearchOpen, setVoiceSearchOpen] = useState(false);

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

        const sortedGenres = Object.keys(groups).sort();
        
        return sortedGenres.map(genre => ({
            id: genre,
            label: genre,
            icon: GENRE_ICONS[genre] || Gamepad2,
            items: groups[genre]
        }));
    }, [games, loading]);

    // Navigation Logic (Keyboard + Wheel)
    useEffect(() => {
        if (storeMode !== 'store') return;

        // --- Keyboard Handler ---
        const handleKeyDown = (e) => {
            if (loading || genreData.length === 0 || isNavigating) return;

            const key = e.key.toLowerCase();

            // Up: Genre Previous
            if (key === 'arrowup' || key === 'w') {
                e.preventDefault();
                if (activeGenreIndex > 0) {
                    setActiveGenreIndex(prev => prev - 1);
                    setActiveGameIndex(0);
                }
            }
            // Down: Genre Next
            else if (key === 'arrowdown' || key === 's') {
                e.preventDefault();
                if (activeGenreIndex < genreData.length - 1) {
                    setActiveGenreIndex(prev => prev + 1);
                    setActiveGameIndex(0);
                }
            }
            // Left: Game Previous
            else if (key === 'arrowleft' || key === 'a') {
                e.preventDefault();
                if (activeGameIndex > 0) {
                    setActiveGameIndex(prev => prev - 1);
                }
            }
            // Right: Game Next
            else if (key === 'arrowright' || key === 'd') {
                e.preventDefault();
                if (activeGameIndex < genreData[activeGenreIndex].items.length - 1) {
                    setActiveGameIndex(prev => prev + 1);
                }
            }
            // Enter: Select
            else if (key === 'enter') {
                e.preventDefault();
                const game = genreData[activeGenreIndex].items[activeGameIndex];
                if (game) {
                    setIsNavigating(true);
                    setTimeout(() => {
                        navigate(createPageUrl(`GameDetail?id=${game.id}`));
                        setIsNavigating(false);
                    }, 300);
                }
            }
        };

        // --- Wheel Handler ---
        let lastWheelTime = 0;
        const WHEEL_COOLDOWN = 150; // ms to prevent rapid scrolling

        const handleWheel = (e) => {
            if (loading || genreData.length === 0 || isNavigating) return;

            const now = Date.now();
            if (now - lastWheelTime < WHEEL_COOLDOWN) return;

            // Prioritize horizontal scrolling if shift is held or if deltaX is dominant
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
                // Horizontal (Games)
                if (e.deltaX > 0 || (e.shiftKey && e.deltaY > 0)) {
                    // Right
                     if (activeGameIndex < genreData[activeGenreIndex].items.length - 1) {
                        setActiveGameIndex(prev => prev + 1);
                        lastWheelTime = now;
                    }
                } else if (e.deltaX < 0 || (e.shiftKey && e.deltaY < 0)) {
                    // Left
                    if (activeGameIndex > 0) {
                        setActiveGameIndex(prev => prev - 1);
                        lastWheelTime = now;
                    }
                }
            } else {
                // Vertical (Genres)
                if (e.deltaY > 0) {
                    // Down
                    if (activeGenreIndex < genreData.length - 1) {
                        setActiveGenreIndex(prev => prev + 1);
                        setActiveGameIndex(0);
                        lastWheelTime = now;
                    }
                } else if (e.deltaY < 0) {
                    // Up
                    if (activeGenreIndex > 0) {
                        setActiveGenreIndex(prev => prev - 1);
                        setActiveGameIndex(0);
                        lastWheelTime = now;
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('wheel', handleWheel);
        };
    }, [activeGenreIndex, activeGameIndex, genreData, loading, isNavigating, navigate, storeMode]);

    // Active Item Helpers
    const activeCategory = genreData[activeGenreIndex];
    const activeGame = activeCategory?.items[activeGameIndex];

    // Constants for positioning
    const ITEM_HEIGHT = 80; // height of genre item
    const ITEM_GAP = 24;
    const CROSS_Y_VH = 40; // Intersection point in VH

    return (
        <div className="h-screen w-full relative overflow-hidden bg-slate-950 text-white font-sans select-none">
            
            {/* Top Navigation Bar (Translucent/Invisible) */}
            <div className="absolute top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-8" 
                 style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.0) 0%, transparent 100%)' }}> {/* Invisible bg as requested */}
                
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
                        Atom X Eve Store
                    </span>

                    {/* Divider */}
                    <div className="h-6 w-px bg-white/20 mx-2"></div>

                    {/* Sub-Page Links */}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setStoreMode('store')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md border ${
                                storeMode === 'store' 
                                    ? 'bg-white/20 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                                    : 'bg-transparent border-transparent text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            Store
                        </button>
                        <button 
                            onClick={() => setStoreMode('marketplace')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md border ${
                                storeMode === 'marketplace' 
                                    ? 'bg-white/20 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                                    : 'bg-transparent border-transparent text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            Marketplace
                        </button>
                        <button 
                            onClick={() => setStoreMode('trading')}
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

                {/* Search Bar */}
                <div className={`flex items-center gap-3 transition-opacity duration-300 ${storeMode === 'marketplace' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <div className="relative">
                        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 w-80 hover:bg-black/40 hover:border-white/20 transition-all focus-within:bg-black/50 focus-within:border-white/30 shadow-lg">
                            <Search className="w-4 h-4 text-white/50" />
                            <input 
                                type="text" 
                                placeholder="Search games..." 
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
                                onClick={() => setVoiceSearchOpen(!voiceSearchOpen)}
                                className={`p-1 rounded-full transition-colors ${voiceSearchOpen ? 'bg-purple-500/50 text-white' : 'text-white/40 hover:text-white'}`}
                            >
                                <Mic className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        
                        {/* Voice Search Popup */}
                        <AnimatePresence>
                            {voiceSearchOpen && (
                                <AIVoiceSearch 
                                    onSearchResult={(term) => {
                                        setSearchTerm(term);
                                        setVoiceSearchOpen(false);
                                    }}
                                    onClose={() => setVoiceSearchOpen(false)} 
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Cart & User (Restored from previous design for completeness) */}
                    <Link 
                      to={createPageUrl('Cart')} 
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all relative backdrop-blur-md border border-white/10"
                    >
                      <ShoppingCart className="w-4 h-4 text-white/80" />
                      {/* Badge logic would go here if cartCount accessible */}
                    </Link>
                </div>
            </div>

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
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-72 bg-slate-900/90 backdrop-blur-3xl border-r border-white/10 z-50 p-6 shadow-2xl"
                        >
                            <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Navigation</h2>
                            <div className="space-y-1">
                                {ALL_NAV_ITEMS.map((page) => (
                                    <Link
                                        key={page.name}
                                        to={page.path}
                                        onClick={() => setDrawerOpen(false)}
                                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all text-left"
                                    >
                                        <page.icon className="w-5 h-5" />
                                        <span className="font-medium">{page.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT AREA */}
            <AnimatePresence mode="wait">
                {storeMode === 'store' ? (
                    viewMode === 'classic' ? (
                         // CLASSIC GRID VIEW
                        <motion.div
                            key="classic-store"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full overflow-y-auto pt-24 pb-12 px-8 bg-slate-950"
                        >
                            <div className="max-w-[1600px] mx-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                                        <LayoutGrid className="w-6 h-6 text-blue-400" />
                                        Game Catalog
                                    </h2>
                                    
                                    <button 
                                        onClick={() => setViewMode('cross')}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium text-white/80 hover:text-white"
                                    >
                                        <Gamepad2 className="w-4 h-4" />
                                        Switch to Cross Interface
                                    </button>
                                </div>

                                <div className="space-y-12">
                                    {genreData.map((genre) => (
                                        <div key={genre.id} className="space-y-4">
                                            <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                                <genre.icon className="w-5 h-5 text-blue-400" />
                                                <h3 className="text-lg font-bold text-white uppercase tracking-wider">{genre.label}</h3>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                                {genre.items.map((game) => (
                                                    <motion.div
                                                        key={game.id}
                                                        whileHover={{ y: -5, scale: 1.02 }}
                                                        className="group relative aspect-[3/4] bg-slate-900 rounded-xl overflow-hidden border border-white/10 cursor-pointer shadow-lg hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all"
                                                        onClick={() => navigate(createPageUrl(`GameDetail?id=${game.id}`))}
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
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                    <motion.div 
                        key="cross-interface"
                        className="w-full h-full relative"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Loading State */}
                        {loading ? (
                            <div className="h-full w-full flex items-center justify-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                    <p className="text-white/50 tracking-widest uppercase text-xs">Loading Store...</p>
                                </div>
                            </div>
                        ) : !activeCategory ? null : (
                            <>
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

                                {/* Interface Layer */}
                                <div className="relative z-10 w-full h-full pt-20"> {/* pt-20 for header space */}
                                    
                                    {/* Breadcrumb moved slightly down */}
                                    <div className="absolute top-24 left-12 flex items-center gap-4 text-white/50 text-sm font-medium tracking-wider uppercase z-30">
                                        <div className="flex items-center gap-2">
                                            <Gamepad2 className="w-4 h-4" />
                                            <span>Store</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4" />
                                        <span className="text-white">{activeCategory.label}</span>
                                        
                                        {/* Classic UI Toggle Button */}
                                        <button 
                                            onClick={() => setViewMode('classic')}
                                            className="ml-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 transition-all group"
                                            title="Switch to Classic Grid View"
                                        >
                                            <LayoutGrid className="w-3.5 h-3.5 text-white/60 group-hover:text-white" />
                                        </button>
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
                                    <div className="absolute left-0 right-0 top-[40vh] -translate-y-1/2 h-80 z-10 flex items-center pointer-events-none">
                                        <motion.div 
                                            className="flex items-center gap-8 pl-64 pointer-events-auto"
                                            animate={{ 
                                                x: -activeGameIndex * (280 + 32)
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
                                                        <img 
                                                            src={game.cover_image || game.image} 
                                                            alt={game.title} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {!isActive && <div className="absolute inset-0 bg-black/50" />}
                                                        {isActive && (
                                                            <motion.div 
                                                                layoutId="game-active-border"
                                                                className="absolute inset-0 border-4 border-white/60 rounded-xl z-20" 
                                                                transition={{ duration: 0.2 }}
                                                            />
                                                        )}
                                                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                                                            <span className="text-green-400 font-bold text-sm">${game.price}</span>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    </div>

                                    {/* ACTIVE ITEM DETAILS */}
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
                                </div>
                            </>
                        )}
                    </motion.div>
                    )
                ) : storeMode === 'marketplace' ? (
                    <motion.div
                        key="marketplace"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="max-w-[1920px] mx-auto px-4 md:px-6 py-24" // Added top padding to account for fixed header
                    >
                        <MarketplaceContent />
                    </motion.div>
                ) : (
                    <motion.div
                        key="trading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="max-w-[1920px] mx-auto px-4 md:px-6 py-24"
                    >
                        <TradingPostContent />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}