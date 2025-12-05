import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Search, Play, Gamepad2, ChevronLeft, ChevronRight, 
  Info, Plus, Volume2, VolumeX, Bell, Star, Filter, Grid, List,
  Sparkles, Flame, Clock, Trophy, Tag, X, SlidersHorizontal, Mic, MicOff, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useCart } from '../components/CartContext';
import { useAuth } from '../components/auth/AuthContext';
import { Game } from '@/entities/Game';
import { createPageUrl } from '@/utils';
import { aiGames, otherSampleGames, trendingGames, newReleases, classicBestSellers } from '@/components/store/mockData';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// --- Liquid Glass Components ---

const LiquidCard = ({ children, className = "", onClick }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, width } = currentTarget.getBoundingClientRect();
    x.set((clientX - left) / width);
  }

  // Map mouse X position to wave position (sweeping across)
  const waveX = useTransform(mouseX, [0, 1], ["-100%", "200%"]);

  return (
    <motion.div 
      className={`relative overflow-hidden rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-blue-500/20 transition-all duration-300 group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => x.set(0.5)}
      onClick={onClick}
      whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.3)" }}
    >
      {/* Liquid Wave Animation */}
      <motion.div
        className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
        style={{ 
          left: waveX,
          width: "80%",
          height: "100%"
        }}
      />
      {children}
    </motion.div>
  );
};

const GlassPanel = LiquidCard; // Backward compatibility alias if needed

const GameGridCard = ({ game, addToCart, onNavigate }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <LiquidCard 
      onClick={() => onNavigate(game.id)}
      className="h-full flex flex-col"
    >
      <div 
        className="flex-1 relative flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Full Card Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-slate-950">
          {/* Blurred Background */}
          <img
            src={game.cover_image || game.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-50 blur-md scale-110"
          />
          {/* Main Image */}
          <img
            src={game.cover_image || game.image}
            alt={game.title}
            className="relative w-full h-full object-contain z-10 transition-transform duration-700 group-hover:scale-105 p-2"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-80" />

          {/* Content Overlay */}
          <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-2">
                {game.aiEnhanced && (
                  <Badge className="bg-purple-500/80 backdrop-blur-md text-white text-[10px] border-none w-fit">
                    <Sparkles className="w-3 h-3 mr-1" /> AI
                  </Badge>
                )}
                {game.rating >= 4.8 && (
                  <Badge className="bg-yellow-500/80 backdrop-blur-md text-black text-[10px] border-none font-bold w-fit">
                    <Trophy className="w-3 h-3 mr-1" /> TOP
                  </Badge>
                )}
              </div>

              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
                onClick={(e) => { e.stopPropagation(); addToCart(game); }}
                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 border border-white/30 flex items-center justify-center transition-all"
              >
                <Plus className="w-4 h-4 text-white" />
              </motion.button>
            </div>

            <div>
              <h3 className="text-white font-bold text-lg leading-tight mb-1 drop-shadow-lg group-hover:text-blue-300 transition-colors">
                {game.title}
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-white/70 text-xs">{game.genre}</p>
                <span className="text-green-400 font-bold text-sm">${game.price}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LiquidCard>
  );
};

const StoreRowCard = ({ game, onNavigate, addToCart }) => (
  <LiquidCard
    onClick={() => onNavigate(game.id)}
    className="flex-shrink-0 w-[200px] cursor-pointer"
  >
    <div className="relative aspect-[3/4] overflow-hidden bg-slate-950">
      {/* Blurred Background */}
      <img 
        src={game.cover_image || game.image} 
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-50 blur-md scale-110"
      />
      {/* Main Image */}
      <img 
        src={game.cover_image || game.image} 
        alt={game.title}
        className="relative w-full h-full object-contain z-10 transition-transform duration-700 group-hover:scale-105 p-2"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90 z-20" />

      <div className="absolute top-2 left-2 z-10">
         {game.aiEnhanced && (
            <Badge className="bg-purple-500/90 text-white text-[9px] border-none px-1.5 py-0.5 shadow-lg">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI
            </Badge>
          )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <h3 className="text-white font-bold text-md leading-tight mb-1 truncate drop-shadow-md">{game.title}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-white/90 text-xs">{game.rating || '4.5'}</span>
          </div>
          <span className="text-green-400 text-xs font-bold">${game.price}</span>
        </div>
      </div>

      {/* Hover Play Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
         <button className="w-12 h-12 rounded-full bg-white/20 border border-white/40 flex items-center justify-center backdrop-blur-md transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 text-white fill-white ml-1" />
         </button>
      </div>
    </div>
  </LiquidCard>
);

// --- Hero Section ---
const HeroSection = ({ featuredGame, heroBackgrounds = [] }) => {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(true);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  const activeBackgrounds = heroBackgrounds.filter(bg => bg.is_active);
  const currentBackground = activeBackgrounds[currentBgIndex % Math.max(activeBackgrounds.length, 1)];

  useEffect(() => {
    if (activeBackgrounds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBgIndex(prev => (prev + 1) % activeBackgrounds.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [activeBackgrounds.length]);

  if (!featuredGame) return null;

  return (
    <div className="relative w-full h-[50vh] min-h-[400px] mt-0">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10" />
        {currentBackground?.video_url ? (
          <video
            key={currentBackground.id}
            src={currentBackground.video_url}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img 
            src={featuredGame.cover_image || featuredGame.image} 
            alt={featuredGame.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="absolute inset-0 z-20 flex items-center px-6 md:px-12">
        <div className="max-w-xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-3 bg-white/20 backdrop-blur-md border-none text-white text-xs">
              FEATURED • {featuredGame.genre?.toUpperCase()}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight">
              {featuredGame.title}
            </h1>
            <p className="text-sm md:text-base text-gray-300 mb-6 line-clamp-2 max-w-md">
              {featuredGame.description}
            </p>
            <div className="flex gap-3">
              <Button 
                className="bg-white text-black hover:bg-gray-200 font-bold px-6 h-11 rounded-lg"
                onClick={() => navigate(createPageUrl(`GameDetail?id=${featuredGame.id}`))}
              >
                <Play className="w-4 h-4 mr-2 fill-current" /> Play Now
              </Button>
              <Button 
                className="bg-white/20 backdrop-blur-xl hover:bg-white/30 text-white border-none font-medium px-6 h-11 rounded-lg"
                onClick={() => navigate(createPageUrl(`GameDetail?id=${featuredGame.id}`))}
              >
                <Info className="w-4 h-4 mr-2" /> Details
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {activeBackgrounds.length > 0 && (
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-6 right-6 z-30 w-9 h-9 rounded-full border border-white/30 bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

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

// --- Floating Nav with App Drawer ---
const FloatingNav = ({ scrollY, searchTerm, setSearchTerm, allGames, onGameNavigate }) => {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [voiceSearchOpen, setVoiceSearchOpen] = useState(false);

  const appPages = [
    { name: 'Dashboard', icon: '🏠' },
    { name: 'Store', icon: '🛒' },
    { name: 'Library', icon: '📚' },
    { name: 'Achievements', icon: '🏆' },
    { name: 'TradingCards', icon: '🃏' },
    { name: 'Challenges', icon: '⚔️' },
    { name: 'Community', icon: '👥' },
    { name: 'Clan', icon: '🏰' },
    { name: 'TradingPost', icon: '🔄' },
    { name: 'Marketplace', icon: '💰' },
    { name: 'Profile', icon: '👤' },
    { name: 'Admin', icon: '⚙️' },
  ];

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  return (
    <>
      <motion.header
                className="sticky top-0 left-0 right-0 z-40 transition-all duration-300"
              >
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
          {/* Unified Header: Menu + Brand + Search */}
          {/* Menu Button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-all"
          >
            <div className="flex flex-col gap-[3px]">
              <span className="w-3.5 h-[2px] bg-white/80 rounded-full"></span>
              <span className="w-3.5 h-[2px] bg-white/80 rounded-full"></span>
              <span className="w-3.5 h-[2px] bg-white/80 rounded-full"></span>
            </div>
          </button>

          {/* Brand */}
          <span className="text-white font-semibold text-sm hidden md:block tracking-wide whitespace-nowrap">ATOM×EVE</span>

          {/* Search Input */}
          <div className="flex-1 max-w-xl flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full px-3 py-1.5 transition-all focus-within:bg-white/15 focus-within:border-white/20 relative">
            <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
            <input 
              type="text" 
              placeholder="Search games, genres..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-0"
            />
            <div className="flex items-center gap-1">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text" 
                placeholder="Search games, genres..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none py-1 pl-7 pr-12 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-0"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button 
                onClick={() => setVoiceSearchOpen(!voiceSearchOpen)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  voiceSearchOpen 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                }`}
                title="AI Voice Search"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* AI Voice Search Panel */}
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

          {/* Right: Actions */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10 ml-1">
            <Link 
              to={createPageUrl('Cart')} 
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all relative"
            >
              <ShoppingCart className="w-4 h-4 text-white/80" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/20 cursor-pointer hover:ring-white/40 transition-all">
              <img 
                src={user?.avatar_url || "https://github.com/shadcn.png"} 
                alt="User" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
      </motion.header>

      {/* App Drawer */}
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
              className="fixed top-0 left-0 bottom-0 w-72 bg-white/[0.02] backdrop-blur-3xl border-r border-white/[0.06] z-50 p-6 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
            >
              <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Apps</h2>
              <div className="space-y-1">
                {appPages.map((page) => (
                  <button
                    key={page.name}
                    onClick={() => { navigate(createPageUrl(page.name)); setDrawerOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-all text-left border border-transparent hover:border-white/[0.08]"
                  >
                    <span className="text-lg">{page.icon}</span>
                    <span className="font-medium">{page.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Amazon-style Filter Sidebar ---
const FilterSidebar = ({ 
  genres, 
  selectedGenres, 
  setSelectedGenres,
  priceRange,
  setPriceRange,
  selectedRating,
  setSelectedRating,
  selectedCategory,
  setSelectedCategory
}) => {
  const categories = [
    { id: 'all', label: 'All Games', icon: Grid },
    { id: 'trending', label: 'Trending Now', icon: Flame },
    { id: 'new', label: 'New Releases', icon: Clock },
    { id: 'top', label: 'Top Rated', icon: Trophy },
    { id: 'ai', label: 'AI Enhanced', icon: Sparkles },
    { id: 'sale', label: 'On Sale', icon: Tag },
  ];

  const toggleGenre = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <GlassPanel className="p-5 sticky top-20 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto">
      {/* Categories */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-400" />
          Categories
        </h3>
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                selectedCategory === cat.id 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <cat.icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 my-4" />

      {/* Genre Filter */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3">Genre</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {genres.map((genre) => (
            <label key={genre} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox 
                checked={selectedGenres.includes(genre)}
                onCheckedChange={() => toggleGenre(genre)}
                className="border-white/30 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
              />
              <span className="text-white/70 text-sm group-hover:text-white transition-colors">
                {genre}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 my-4" />

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="text-white font-semibold text-sm mb-3">Price Range</h3>
        <div className="px-1">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={100}
            min={0}
            step={5}
            className="mb-3"
          />
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 my-4" />

      {/* Rating Filter */}
      <div>
        <h3 className="text-white font-semibold text-sm mb-3">Customer Rating</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                selectedRating === rating 
                  ? 'bg-yellow-500/20 border border-yellow-500/30' 
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3 h-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-white/20'}`} 
                  />
                ))}
              </div>
              <span className="text-white/60 text-xs">& Up</span>
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button 
        onClick={() => {
          setSelectedGenres([]);
          setPriceRange([0, 100]);
          setSelectedRating(null);
          setSelectedCategory('all');
        }}
        className="w-full mt-6 py-2 text-sm text-white/50 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all"
      >
        Clear All Filters
      </button>
    </GlassPanel>
  );
};

// --- Results Header ---
const ResultsHeader = ({ count, viewMode, setViewMode, sortBy, setSortBy }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="text-white/70 text-sm">
      <span className="text-white font-semibold">{count}</span> results
    </div>
    
    <div className="flex items-center gap-3">
      {/* Sort Dropdown */}
      <select 
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="bg-white/10 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-white/20"
      >
        <option value="relevance">Sort: Relevance</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
        <option value="rating">Avg. Customer Rating</option>
        <option value="newest">Newest Arrivals</option>
      </select>

      {/* View Toggle */}
      <div className="flex items-center bg-white/10 rounded-lg p-1">
        <button 
          onClick={() => setViewMode('grid')}
          className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white/20' : ''}`}
        >
          <Grid className="w-4 h-4 text-white" />
        </button>
        <button 
          onClick={() => setViewMode('list')}
          className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white/20' : ''}`}
        >
          <List className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  </div>
);

// --- List View Card ---
const GameListCard = ({ game, addToCart, onNavigate }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="group cursor-pointer"
  >
    <LiquidCard 
      onClick={() => onNavigate(game.id)}
      className="flex gap-4 p-0"
    >
      <div className="w-48 h-full flex-shrink-0 relative bg-slate-950 overflow-hidden">
        <img src={game.cover_image || game.image} alt="" className="w-full h-full object-cover absolute inset-0 opacity-50 blur-sm scale-110" />
        <img src={game.cover_image || game.image} alt={game.title} className="w-full h-full object-contain relative z-10 p-2" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/80 z-20" />
      </div>

      <div className="flex-1 flex flex-col py-4 pr-6 relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-bold text-2xl group-hover:text-blue-300 transition-colors drop-shadow-md">
              {game.title}
            </h3>
            <p className="text-blue-200/70 text-sm">{game.developer || 'Game Studio'}</p>
          </div>
          <span className="text-green-400 font-bold text-2xl">${game.price}</span>
        </div>

        <p className="text-white/70 text-sm mt-3 line-clamp-2 max-w-2xl">{game.description}</p>

        <div className="flex items-center gap-4 mt-auto pt-4">
          <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-md">{game.genre}</Badge>
          <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-yellow-400 text-xs font-bold">{game.rating || '4.5'}</span>
          </div>
          {game.aiEnhanced && (
            <Badge className="bg-purple-500/30 text-purple-300 border-purple-500/30">
              <Sparkles className="w-3 h-3 mr-1" /> AI Enhanced
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-center gap-3 pr-6 py-4 relative z-10">
        <Button 
          className="bg-white text-black hover:bg-blue-50 font-bold"
          onClick={(e) => { e.stopPropagation(); addToCart(game); }}
        >
          <Plus className="w-4 h-4 mr-1" /> Add to Cart
        </Button>
        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
          Details
        </Button>
      </div>
    </LiquidCard>
  </motion.div>
);

// --- Main Store Component ---
export default function Store() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();
  const { scrollY } = useScroll();
  const containerRef = useRef(null);
  
  // Filter States
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('relevance');

  const handleGameNavigate = (gameId) => {
    navigate(createPageUrl(`GameDetail?id=${gameId}`));
  };

  const { data: heroBackgrounds = [] } = useQuery({
    queryKey: ['heroBackgrounds'],
    queryFn: () => base44.entities.HeroBackground.list(),
    initialData: [],
  });

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

  // Get unique genres
  const genres = useMemo(() => {
    const allGenres = games.map(g => g.genre).filter(Boolean);
    return [...new Set(allGenres)].sort();
  }, [games]);

  // Filter and sort games
  const filteredGames = useMemo(() => {
    let result = [...games];

    // Category filter
    if (selectedCategory === 'trending') {
      result = trendingGames;
    } else if (selectedCategory === 'new') {
      result = newReleases;
    } else if (selectedCategory === 'top') {
      result = result.filter(g => (g.rating || 4.5) >= 4.5);
    } else if (selectedCategory === 'ai') {
      result = aiGames;
    } else if (selectedCategory === 'sale') {
      result = result.filter(g => g.price < 50);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(g => 
        g.title?.toLowerCase().includes(term) ||
        g.genre?.toLowerCase().includes(term) ||
        g.developer?.toLowerCase().includes(term) ||
        g.description?.toLowerCase().includes(term)
      );
    }

    // Genre filter
    if (selectedGenres.length > 0) {
      result = result.filter(g => selectedGenres.includes(g.genre));
    }

    // Price filter
    result = result.filter(g => g.price >= priceRange[0] && g.price <= priceRange[1]);

    // Rating filter
    if (selectedRating) {
      result = result.filter(g => (g.rating || 4.5) >= selectedRating);
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
        break;
      case 'newest':
        result.sort((a, b) => (b.releaseYear || 2024) - (a.releaseYear || 2024));
        break;
      default:
        break;
    }

    return result;
  }, [games, searchTerm, selectedGenres, priceRange, selectedRating, selectedCategory, sortBy]);

  const featuredGame = useMemo(() => games.find(g => g.rating >= 4.8) || games[0], [games]);

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-x-hidden font-sans selection:bg-cyan-500/30">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Store Navigation Bar */}
      <FloatingNav scrollY={scrollY} searchTerm={searchTerm} setSearchTerm={setSearchTerm} allGames={games} onGameNavigate={handleGameNavigate} />

      <main className="relative">
        {/* Hero Section */}
        <HeroSection featuredGame={featuredGame} heroBackgrounds={heroBackgrounds} />

        {/* Main Content: Amazon-style Layout */}
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-8">
          <div className="flex gap-6">
            {/* Left Sidebar - Filters */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <FilterSidebar 
                genres={genres}
                selectedGenres={selectedGenres}
                setSelectedGenres={setSelectedGenres}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                selectedRating={selectedRating}
                setSelectedRating={setSelectedRating}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            </aside>

            {/* Right Content - Results (Luna + Netflix Style) */}
            <div className="flex-1 min-w-0">
              {/* Active Filters - Pill Style */}
              {(selectedGenres.length > 0 || selectedRating || searchTerm) && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="text-white/40 text-xs uppercase tracking-wider font-medium">Filters:</span>
                  {searchTerm && (
                    <Badge className="bg-white/[0.08] backdrop-blur-md text-white/90 border-none rounded-full px-3 py-1 flex items-center gap-2 hover:bg-white/[0.12] transition-all cursor-pointer">
                      "{searchTerm}"
                      <X className="w-3 h-3 opacity-60 hover:opacity-100" onClick={() => setSearchTerm('')} />
                    </Badge>
                  )}
                  {selectedGenres.map(g => (
                    <Badge key={g} className="bg-white/[0.08] backdrop-blur-md text-white/90 border-none rounded-full px-3 py-1 flex items-center gap-2 hover:bg-white/[0.12] transition-all cursor-pointer">
                      {g}
                      <X className="w-3 h-3 opacity-60 hover:opacity-100" onClick={() => setSelectedGenres(prev => prev.filter(x => x !== g))} />
                    </Badge>
                  ))}
                  {selectedRating && (
                    <Badge className="bg-white/[0.08] backdrop-blur-md text-white/90 border-none rounded-full px-3 py-1 flex items-center gap-2 hover:bg-white/[0.12] transition-all cursor-pointer">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" /> {selectedRating}+
                      <X className="w-3 h-3 opacity-60 hover:opacity-100" onClick={() => setSelectedRating(null)} />
                    </Badge>
                  )}
                </div>
              )}

              {/* Games Content */}
              {loading ? (
                <div className="flex items-center justify-center py-32">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    <span className="text-white/40 text-sm">Loading games...</span>
                  </div>
                </div>
              ) : filteredGames.length === 0 ? (
                <div className="text-center py-32">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/[0.03] flex items-center justify-center">
                    <Gamepad2 className="w-10 h-10 text-white/20" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">No games found</h3>
                  <p className="text-white/40 text-sm">Try adjusting your filters or search term</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {/* Featured Row - Large Cards (Netflix Hero Style) */}
                  {selectedCategory === 'all' && !searchTerm && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white text-xl font-bold flex items-center gap-2">
                          <Flame className="w-5 h-5 text-orange-500" />
                          Featured & Recommended
                        </h2>
                        <button className="text-white/50 hover:text-white text-sm flex items-center gap-1 transition-colors">
                          Explore All <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                        {filteredGames.slice(0, 5).map((game, idx) => (
                          <motion.div
                            key={game.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex-shrink-0 w-[340px]"
                          >
                            <LiquidCard 
                              onClick={() => handleGameNavigate(game.id)}
                              className="h-full aspect-[16/9] bg-slate-950 overflow-hidden"
                            >
                              {/* Blurred Background */}
                              <img 
                                src={game.cover_image || game.image} 
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover opacity-40 blur-lg scale-110"
                              />
                              {/* Main Image */}
                              <img 
                                src={game.cover_image || game.image} 
                                alt={game.title}
                                className="relative w-full h-full object-contain z-10 transition-transform duration-700 group-hover:scale-105 p-2"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-90 z-20" />
                              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-transparent z-20" />

                              {/* Play Button Overlay */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 transform scale-75 group-hover:scale-100 transition-transform shadow-lg shadow-white/10">
                                  <Play className="w-7 h-7 text-white fill-white ml-1" />
                                </div>
                              </div>

                              {/* Content */}
                              <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                                <div className="flex items-center gap-2 mb-2">
                                  {game.aiEnhanced && (
                                    <Badge className="bg-purple-500/80 text-white text-[10px] border-none px-2 py-0.5 shadow-lg">
                                      <Sparkles className="w-3 h-3 mr-1" /> AI
                                    </Badge>
                                  )}
                                  <Badge className="bg-white/20 backdrop-blur-md text-white text-[10px] border-none px-2 py-0.5">
                                    {game.genre}
                                  </Badge>
                                </div>
                                <h3 className="text-white font-bold text-xl mb-1 group-hover:text-blue-300 transition-colors drop-shadow-lg">{game.title}</h3>
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    <span className="text-white/90">{game.rating || '4.5'}</span>
                                  </div>
                                  <span className="text-white/40">•</span>
                                  <span className="text-green-400 font-bold">${game.price}</span>
                                </div>
                              </div>

                              {/* Quick Add */}
                              <button 
                                onClick={(e) => { e.stopPropagation(); addToCart(game); }}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 border border-white/20 z-20"
                              >
                                <Plus className="w-5 h-5 text-white" />
                              </button>
                            </LiquidCard>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category Rows (Netflix Style) */}
                  {(() => {
                    const gamesByGenre = filteredGames.reduce((acc, game) => {
                      const genre = game.genre || 'Other';
                      if (!acc[genre]) acc[genre] = [];
                      acc[genre].push(game);
                      return acc;
                    }, {});

                    return Object.entries(gamesByGenre).map(([genre, genreGames]) => (
                      <div key={genre} className="group/row">
                        <div className="flex items-center justify-between mb-3">
                          <h2 className="text-white/90 text-lg font-semibold flex items-center gap-2 group-hover/row:text-white transition-colors">
                            {genre}
                            <span className="text-white/30 text-sm font-normal">({genreGames.length})</span>
                          </h2>
                          <button className="text-white/40 hover:text-white text-xs flex items-center gap-1 transition-colors opacity-0 group-hover/row:opacity-100">
                            See All <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                          {genreGames.map((game, idx) => (
                            <motion.div
                              key={game.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                            >
                              <StoreRowCard 
                                game={game} 
                                onNavigate={handleGameNavigate} 
                                addToCart={addToCart} 
                              />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 px-6 md:px-12 py-12 border-t border-white/10 bg-black/50 text-center text-gray-500 text-sm">
          <p>&copy; 2025 Nexus Store. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}