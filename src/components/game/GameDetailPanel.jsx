import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, Cpu, ChevronRight, ChevronDown, Lock, 
  Unlock, Database, Server, Info, AlertCircle,
  Download, Play, CreditCard, Check, X, Loader2,
  Maximize2, Star, ThumbsUp, MessageSquare, User
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { useCart } from '@/components/CartContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// --- Components ---

const DataPoint = ({ label, value, icon: Icon, color = "text-white" }) => (
  <div className="flex flex-col bg-white/5 border border-white/5 rounded-xl p-4 backdrop-blur-sm">
    <div className="flex items-center gap-2 mb-2">
      {Icon && <Icon className={`w-4 h-4 ${color} opacity-80`} />}
      <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{label}</span>
    </div>
    <span className="text-lg font-medium text-white tracking-tight">{value}</span>
  </div>
);

const SystemPreviewCard = ({ type, title, subtitle, onClick }) => (
  <div 
    onClick={onClick}
    className="relative group overflow-hidden rounded-xl border border-white/10 bg-black/20 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:scale-105"
  >
    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
    <div className="p-4">
      <div className="flex justify-between items-start mb-3">
        <span className="text-[9px] uppercase tracking-wider text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
          {type}
        </span>
        <div className="w-3 h-3 flex items-center justify-center">
          <Play className="w-2.5 h-2.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <h4 className="text-white font-bold text-sm mb-1 group-hover:text-cyan-300 transition-colors">{title}</h4>
      <p className="text-white/40 text-xs group-hover:text-white/60 transition-colors">{subtitle}</p>
    </div>
  </div>
);

const SpecsTab = ({ game }) => {
  const specs = game?.system_requirements || {};
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Developer Info */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-400" />
            Origin Data
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/40">Developer</span>
              <span className="text-white">Studio Unknown</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/40">Publisher</span>
              <span className="text-white">Atom Publishing</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/40">Release Date</span>
              <span className="text-white">{game.original_year || '2025'}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-white/40">Version</span>
              <span className="text-white font-mono text-xs">v1.0.4-stable</span>
            </div>
          </div>
        </div>

        {/* System Requirements */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            Hardware Requirements
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/40">OS</span>
              <span className="text-white">{specs.os || 'Windows 10/11 (64-bit)'}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/40">Processor</span>
              <span className="text-white text-right max-w-[200px] truncate">{specs.processor || 'Intel Core i5 / AMD Ryzen 5'}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/40">Memory</span>
              <span className="text-white">{specs.memory || '16 GB RAM'}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/40">Graphics</span>
              <span className="text-white text-right max-w-[200px] truncate">{specs.graphics || 'NVIDIA RTX 3060 / AMD RX 6600'}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-white/40">Storage</span>
              <span className="text-white">{specs.storage || '50 GB available space'}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// PurchaseModal component removed - now using global CartDrawer

export default function GameDetailPanel({ gameId, onClose }) {
  const { user, isAuthenticated } = useAuth();
  const { addToCart, isPurchased } = useCart();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [activeTab, setActiveTab] = useState('system'); // 'system' or 'specs'
  const [mediaTab, setMediaTab] = useState('content'); // 'content' or 'achievement_loot'
  const [isViewingMedia, setIsViewingMedia] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showNavArrows, setShowNavArrows] = useState(false);
  const [mouseTimeout, setMouseTimeout] = useState(null);
  const [selectedDLC, setSelectedDLC] = useState(null);
  const [selectedMediaItem, setSelectedMediaItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [devReview, setDevReview] = useState(null);
  const [newReview, setNewReview] = useState({ rating: 5, content: '' });
  const owned = isPurchased(gameId);
  const [userReactions, setUserReactions] = useState({});

  // Mock media content
  const videos = [
    { title: 'Gameplay Trailer', image: game?.cover_image },
    { title: 'Feature Showcase', image: game?.cover_image },
  ];

  const screenshots = [
    { title: 'Screenshot 1', image: game?.cover_image },
    { title: 'Screenshot 2', image: game?.cover_image },
    { title: 'Screenshot 3', image: game?.cover_image },
  ];

  const achievements = [
    { name: 'Neural Shock', icon: '⚡' },
    { name: 'Cyber Metabolism', icon: '💚' },
    { name: 'Void Walker', icon: '👻' },
    { name: 'Tactical Mind', icon: '🧠' },
    { name: 'Data Stream', icon: '📡' },
  ];

  // Mock DLC data
  const dlcList = [
    {
      id: 'standard',
      name: 'Standard Edition',
      description: 'The base game experience with all core features and content.',
      offers: ['Base Game Content', 'Core Story Campaign', 'Standard Abilities', 'Base Card Collection'],
      stats: {},
      achievements: [],
      abilities: []
    },
    {
      id: 'dlc_1',
      name: 'Neural Expansion Pack',
      description: 'Unlock advanced neural abilities and new storyline chapters set in the cybernetic underworld.',
      offers: ['5 New Abilities', '+20% XP Boost', '3 Legendary Cards', '10 Story Missions'],
      stats: { abilities: 5, xpBoost: 20, cards: 3, missions: 10 },
      achievements: ['Neural Master', 'Cyber Overlord', 'Data Stream Complete'],
      abilities: ['Neural Shock', 'Mind Control', 'Synaptic Burst']
    },
    {
      id: 'dlc_2',
      name: 'Void Walker Arsenal',
      description: 'Gain access to stealth-focused equipment and void manipulation powers.',
      offers: ['7 New Equipment Sets', '+15% Stealth Rating', '2 Epic Traits', '5 New Weapons'],
      stats: { equipment: 7, stealthBoost: 15, traits: 2, weapons: 5 },
      achievements: ['Shadow Master', 'Void Walker'],
      abilities: ['Phase Shift', 'Shadow Clone', 'Void Manipulation']
    },
    {
      id: 'dlc_3',
      name: 'Season Pass: Year One',
      description: 'All future DLC releases for the first year, plus exclusive seasonal rewards.',
      offers: ['All DLC Access', '+50% Genre XP', 'Exclusive Avatar Skin', 'Priority Updates'],
      stats: { dlcAccess: 'unlimited', genreXP: 50 },
      achievements: ['Season Champion', 'Year One Veteran', 'Ultimate Collector'],
      abilities: ['All DLC Abilities']
    }
  ];

  const currentContent = mediaTab === 'content' 
    ? [...videos, ...screenshots] 
    : achievements;

  // ESC key and arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isViewingMedia) return;
      
      if (e.key === 'Escape') {
        setIsViewingMedia(false);
        setCurrentMediaIndex(0);
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewingMedia, currentMediaIndex, currentContent.length]);

  // Mouse move handler for arrows
  const handleMouseMove = () => {
    setShowNavArrows(true);
    if (mouseTimeout) clearTimeout(mouseTimeout);
    const timeout = setTimeout(() => setShowNavArrows(false), 2000);
    setMouseTimeout(timeout);
  };

  const handleMediaTrigger = (index) => {
    setCurrentMediaIndex(index);
    setSelectedMediaItem(currentContent[index]);
  };

  const handleFullscreen = () => {
    setIsViewingMedia(true);
  };

  const handleNext = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % currentContent.length);
  };

  const handlePrevious = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + currentContent.length) % currentContent.length);
  }; // Use CartContext check or local state if preferred, but context is better for syncing.
  
  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;
      try {
        const fetchedGame = await base44.entities.Game.get(gameId);
        setGame(fetchedGame);
        
        // Fetch reviews
        const gameReviews = await base44.entities.Post.filter({ 
          type: 'game_review', 
          game_title: fetchedGame.title 
        }, '-created_date');
        setReviews(gameReviews);
        
        // Mock dev review (in production, this would be fetched from a DevReview entity)
        setDevReview({
          dev_name: "Studio Unknown",
          dev_title: "Lead Game Designer",
          content: "Our vision for the card system is to make every achievement feel earned. Cards aren't just collectibles—they're extensions of your playstyle. We wanted players to feel like they're building their own legend, one card at a time. The synergy between abilities and equipment cards mirrors the game's core philosophy: adaptation is survival.",
          card_philosophy: "Merge, Ascend, Dominate"
        });
      } catch (err) {
        console.error("Failed to fetch game", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [gameId]);

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      alert("Please sign in to leave a review");
      return;
    }
    if (!newReview.content.trim()) return;
    
    try {
      await base44.entities.Post.create({
        title: `Review: ${game.title}`,
        content: newReview.content,
        type: 'game_review',
        game_title: game.title,
        genre: game.genre,
        rating: newReview.rating,
        community: 'reviews'
      });
      
      // Refresh reviews
      const gameReviews = await base44.entities.Post.filter({ 
        type: 'game_review', 
        game_title: game.title 
      }, '-created_date');
      setReviews(gameReviews);
      setNewReview({ rating: 5, content: '' });
    } catch (err) {
      console.error("Failed to submit review", err);
    }
  };

  const handleReaction = async (reviewId, reactionType) => {
    if (!isAuthenticated) {
      alert("Please sign in to react");
      return;
    }
    
    try {
      const existingReactions = await base44.entities.Reaction.filter({
        target_id: reviewId,
        created_by: user.email
      });
      
      if (existingReactions.length > 0) {
        const existingReaction = existingReactions[0];
        if (existingReaction.type === reactionType) {
          // Remove reaction
          await base44.entities.Reaction.delete(existingReaction.id);
        } else {
          // Update reaction
          await base44.entities.Reaction.update(existingReaction.id, { type: reactionType });
        }
      } else {
        // Create new reaction
        await base44.entities.Reaction.create({
          target_id: reviewId,
          target_type: 'post',
          type: reactionType
        });
      }
      
      // Refresh user reactions
      const allUserReactions = await base44.entities.Reaction.filter({
        created_by: user.email
      });
      const reactionsMap = {};
      allUserReactions.forEach(r => {
        reactionsMap[r.target_id] = r.type;
      });
      setUserReactions(reactionsMap);
    } catch (err) {
      console.error("Failed to react", err);
    }
  };

  // Fetch user reactions on mount
  useEffect(() => {
    const fetchUserReactions = async () => {
      if (!isAuthenticated || !user) return;
      try {
        const allUserReactions = await base44.entities.Reaction.filter({
          created_by: user.email
        });
        const reactionsMap = {};
        allUserReactions.forEach(r => {
          reactionsMap[r.target_id] = r.type;
        });
        setUserReactions(reactionsMap);
      } catch (err) {
        console.error("Failed to fetch reactions", err);
      }
    };
    fetchUserReactions();
  }, [isAuthenticated, user]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
        alert("Authentication Required: Identity Protocol.");
        return;
    }
    addToCart({
        id: game.id,
        type: 'game',
        title: game.title,
        price: game.price,
        image: game.cover_image,
        genre: game.genre
    });
  };

  const handleTransactionConfirm = async () => {
    setUnlocking(true);
    try {
        await base44.functions.invoke('unlockGameSystem', { gameId });
        // Cart context will handle ownership state
    } catch (err) {
        console.error("Unlock failed", err);
    } finally {
        setUnlocking(false);
    }
  };

  const handlePlay = () => {
      navigate(createPageUrl('Library'));
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center text-white/20">Initializing...</div>;
  }

  if (!game) {
    return <div className="h-full flex items-center justify-center text-red-400">Signal Lost. Game Data Corrupted.</div>;
  }

  return (
    <div className="h-full w-full relative bg-[#0d0d0d] text-white font-sans overflow-hidden flex flex-col">
      {/* Immersive Background Media Layer */}
      <AnimatePresence>
        {isViewingMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-40"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsViewingMedia(false);
                setCurrentMediaIndex(0);
              }
            }}
            onMouseMove={handleMouseMove}
          >
            {/* Video/Media Background */}
            <div className="absolute inset-0 bg-black">
              <img 
                src={currentContent[currentMediaIndex]?.image || currentContent[currentMediaIndex]?.icon || game.cover_image}
                alt={currentContent[currentMediaIndex]?.title || currentContent[currentMediaIndex]?.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Navigation Arrows */}
            <AnimatePresence>
              {showNavArrows && (
                <>
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                    className="absolute left-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 hover:scale-110 transition-all z-10"
                  >
                    <ChevronRight className="w-8 h-8 text-white rotate-180" />
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 hover:scale-110 transition-all z-10"
                  >
                    <ChevronRight className="w-8 h-8 text-white" />
                  </motion.button>
                </>
              )}
            </AnimatePresence>

            {/* Subtle UI Hint */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <h3 className="text-white text-2xl font-bold mb-2">
                  {currentContent[currentMediaIndex]?.title || currentContent[currentMediaIndex]?.name}
                </h3>
                <p className="text-white/60 text-sm">
                  Use arrow keys or click arrows to navigate • ESC to exit
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Immersive Background */}
      <motion.div 
        animate={{ opacity: isViewingMedia ? 0 : 1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="absolute inset-0 z-0"
      >
        <img 
          src={game.cover_image} 
          alt={game.title} 
          className="w-full h-full object-cover opacity-40 blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/80 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-transparent to-[#0d0d0d]" />
        {/* Scanlines */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
      </motion.div>

      {/* Header / Nav */}
      <motion.div 
        animate={{ opacity: isViewingMedia ? 0 : 1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative z-20 p-8 flex justify-between items-start"
      >
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </div>
          <span className="text-xs font-medium tracking-widest uppercase">Abort</span>
        </button>
        
        {/* Tabs Switcher */}
        <div className="flex p-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full">
          <button 
            onClick={() => setActiveTab('system')}
            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'system' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            System Core
          </button>
          <button 
            onClick={() => setActiveTab('specs')}
            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'specs' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            Tech Specs
          </button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div 
        animate={{ opacity: isViewingMedia ? 0 : 1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative z-10 flex-1 overflow-y-auto max-w-7xl mx-auto w-full px-12 py-12"
      >
        <AnimatePresence mode="wait">
          {activeTab === 'system' ? (
            <motion.div 
              key="system"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col lg:flex-row gap-16 items-start"
            >
              {/* Left: Identity */}
              <div className="flex-1 space-y-6 min-w-0">
                {/* Media Preview Box - Moved to Top */}
                {selectedMediaItem && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden"
                  >
                    <div className="aspect-video relative">
                      <img 
                        src={selectedMediaItem.image || selectedMediaItem.icon || game.cover_image}
                        alt={selectedMediaItem.title || selectedMediaItem.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      {/* Fullscreen Button */}
                      <button
                        onClick={handleFullscreen}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/80 hover:scale-110 transition-all group"
                      >
                        <Maximize2 className="w-4 h-4 text-white group-hover:text-cyan-400" />
                      </button>

                      {/* Media Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h4 className="text-white font-bold text-lg mb-1">
                          {selectedMediaItem.title || selectedMediaItem.name}
                        </h4>
                        {selectedMediaItem.title && (
                          <p className="text-white/60 text-sm">Click fullscreen to view in theater mode</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Media Thumbnails - Screenshots */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                  {videos.map((video, i) => (
                    <div 
                      key={i}
                      onClick={() => handleMediaTrigger(i)}
                      className={`relative w-32 aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group border transition-all flex-shrink-0 ${
                        selectedMediaItem === currentContent[i] ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-white/10 hover:border-cyan-400/30'
                      }`}
                    >
                      <img 
                        src={video.image} 
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors pointer-events-none">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  ))}
                  {screenshots.map((screenshot, i) => (
                    <div 
                      key={i}
                      onClick={() => handleMediaTrigger(videos.length + i)}
                      className={`w-32 aspect-video bg-black rounded-md overflow-hidden cursor-pointer group flex-shrink-0 border transition-all ${
                        selectedMediaItem === currentContent[videos.length + i] ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-white/10 hover:border-cyan-400/30'
                      }`}
                    >
                      <img 
                        src={screenshot.image} 
                        alt={screenshot.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>

                {/* DLC Content Dropdown */}
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-purple-400" />
                    DLC Content
                  </h3>
                  {dlcList.filter(dlc => dlc.id !== 'standard').map((dlc) => {
                    const isExpanded = selectedDLC?.id === dlc.id;
                    return (
                      <div key={dlc.id} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setSelectedDLC(isExpanded ? null : dlc)}
                          className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-all"
                        >
                          <div className="text-left">
                            <p className="font-bold text-white text-sm">{dlc.name}</p>
                            <p className="text-white/50 text-xs">{dlc.description}</p>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-white/10 p-4 space-y-3"
                            >
                              <div>
                                <h4 className="text-white/70 text-xs font-semibold uppercase mb-2">Includes:</h4>
                                <div className="space-y-1">
                                  {dlc.offers.map((offer, i) => (
                                    <div key={i} className="flex items-center gap-2 text-white/70 text-xs">
                                      <Check className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                      <span>{offer}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {dlc.achievements && dlc.achievements.length > 0 && (
                                <div>
                                  <h4 className="text-white/70 text-xs font-semibold uppercase mb-2">Achievements:</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {dlc.achievements.map((achievement, i) => (
                                      <span key={i} className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-[10px]">
                                        {achievement}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                      {game.genre || 'Unknown Genre'}
                    </span>
                    {owned && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
                        <Unlock className="w-3 h-3" /> System Unlocked
                      </span>
                    )}
                    <button
                      onClick={() => setSelectedDLC(null)}
                      className="relative px-3 py-1 rounded-lg overflow-hidden group transition-all hover:scale-105"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <span className="relative text-[10px] font-bold uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">
                        Standard Edition
                      </span>
                    </button>
                  </div>
                  <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-2 leading-none">
                    {game.title}
                    {selectedDLC && (
                      <>
                        <br />
                        <span className="text-2xl text-cyan-400">DLC</span>
                        <br />
                        <span className="text-4xl text-white/90">{selectedDLC.name}</span>
                      </>
                    )}
                  </h1>
                  <p className="text-base text-white/60 font-light max-w-xl leading-relaxed">
                    {selectedDLC ? selectedDLC.description : (game.description || 'Initialize neural link to access description data.')}
                  </p>
                  
                  {/* DLC Offers */}
                  {selectedDLC && (
                    <div className="mt-6 space-y-4">
                      <div>
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">What This DLC Offers:</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedDLC.offers.map((offer, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                              <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                              <span className="text-white/80 text-xs">{offer}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Achievements Included */}
                      {selectedDLC.achievements && selectedDLC.achievements.length > 0 && (
                        <div>
                          <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">Achievements Included:</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedDLC.achievements.map((achievement, i) => (
                              <div key={i} className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-xs font-medium">
                                {achievement}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Abilities Included */}
                      {selectedDLC.abilities && selectedDLC.abilities.length > 0 && (
                        <div>
                          <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">Abilities Included:</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedDLC.abilities.map((ability, i) => (
                              <div key={i} className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-300 text-xs font-medium">
                                {ability}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* System Stats Preview */}
                <div className="grid grid-cols-3 gap-4">
                  <DataPoint label="Card Pool" value="45+" icon={Database} color="text-blue-400" />
                  <DataPoint label="Genre XP" value="+15%" icon={Zap} color="text-yellow-400" />
                  <DataPoint label="Compatibility" value="High" icon={Cpu} color="text-green-400" />
                </div>

                {/* Developer Review Section */}
                {devReview && (
                  <div className="pt-8 space-y-4">
                    <h3 className="text-white font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-400" />
                      Developer Insight
                    </h3>
                    <div className="bg-gradient-to-br from-purple-900/20 via-black/40 to-blue-900/20 backdrop-blur-md border border-purple-500/20 rounded-2xl p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold">{devReview.dev_name}</h4>
                          <p className="text-white/60 text-sm">{devReview.dev_title}</p>
                        </div>
                      </div>
                      <p className="text-white/80 leading-relaxed mb-4">{devReview.content}</p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-300 font-medium text-sm">{devReview.card_philosophy}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Reviews Section */}
                <div className="pt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-cyan-400" />
                      Player Reviews ({reviews.length})
                    </h3>
                  </div>

                  {/* Write Review */}
                  {isAuthenticated && (
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            className="transition-all hover:scale-110"
                          >
                            <Star 
                              className={`w-6 h-6 ${star <= newReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={newReview.content}
                        onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                        placeholder="Share your thoughts on this game..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/40 resize-none h-24 focus:outline-none focus:border-cyan-400/50"
                      />
                      <button
                        onClick={handleSubmitReview}
                        className="px-6 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 font-medium hover:bg-cyan-500/30 transition-all"
                      >
                        Submit Review
                      </button>
                    </div>
                  )}

                  {/* Reviews List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {reviews.length === 0 ? (
                      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center">
                        <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/60">No reviews yet. Be the first to share your experience!</p>
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:border-cyan-400/30 transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                                <User className="w-5 h-5 text-cyan-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium">{review.created_by}</p>
                                <p className="text-white/40 text-xs">
                                  {new Date(review.created_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i}
                                  className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-white/80 leading-relaxed">{review.content}</p>
                          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
                            <button 
                              onClick={() => handleReaction(review.id, 'agree')}
                              className={`flex items-center gap-2 transition-all text-sm ${
                                userReactions[review.id] === 'agree' 
                                  ? 'text-green-400' 
                                  : 'text-white/40 hover:text-green-400'
                              }`}
                            >
                              <ThumbsUp className={`w-4 h-4 ${userReactions[review.id] === 'agree' ? 'fill-green-400' : ''}`} />
                              <span>Agree</span>
                            </button>
                            <button 
                              onClick={() => handleReaction(review.id, 'disagree')}
                              className={`flex items-center gap-2 transition-all text-sm ${
                                userReactions[review.id] === 'disagree' 
                                  ? 'text-red-400' 
                                  : 'text-white/40 hover:text-red-400'
                              }`}
                            >
                              <ThumbsUp className={`w-4 h-4 rotate-180 ${userReactions[review.id] === 'disagree' ? 'fill-red-400' : ''}`} />
                              <span>Disagree</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Asset Preview (The Hook) */}
              <div className="w-full lg:w-80 flex-shrink-0 space-y-3">
                {/* Add to Cart - Above System Assets */}
                {!owned && (
                  <button 
                    onClick={handleAddToCart}
                    className="w-full group relative px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-xs overflow-hidden hover:scale-[1.02] transition-transform border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                  >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-md group-hover:bg-white/20 transition-colors" />
                    <span className="relative flex items-center justify-center gap-2 text-white">
                      <Download className="w-4 h-4" />
                      Add to Cart • ${game.price?.toFixed(2) || '0.00'}
                    </span>
                  </button>
                )}

                {/* Play Button - Top */}
                {owned && (
                  <button 
                    onClick={handlePlay}
                    className="w-full group relative px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs overflow-hidden hover:scale-[1.02] transition-transform border border-green-400/30 shadow-[0_0_30px_rgba(74,222,128,0.2)]"
                  >
                    <div className="absolute inset-0 bg-green-500/10 backdrop-blur-md group-hover:bg-green-500/20 transition-colors" />
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <span className="relative flex items-center justify-center gap-2 text-green-300 group-hover:text-green-200 drop-shadow-[0_2px_10px_rgba(74,222,128,0.5)]">
                      <Play className="w-4 h-4 fill-green-400 text-green-400 drop-shadow-lg" />
                      Execute Launch Sequence
                    </span>
                  </button>
                )}

                {/* DLC & Expansion Packs */}
                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Download className="w-4 h-4 text-purple-400" />
                    DLC & Expansion Packs
                  </h3>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {dlcList.map((dlc) => (
                      <div 
                        key={dlc.id}
                        onClick={() => dlc.id === 'standard' ? setSelectedDLC(null) : setSelectedDLC(dlc)}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all group ${
                          dlc.id === 'standard' && !selectedDLC
                            ? 'bg-cyan-500/20 border-cyan-400/40'
                            : selectedDLC?.id === dlc.id 
                            ? 'bg-purple-500/20 border-purple-400/40' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-400/30'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm mb-1 transition-colors ${
                            dlc.id === 'standard' && !selectedDLC
                              ? 'text-cyan-300'
                              : selectedDLC?.id === dlc.id ? 'text-purple-300' : 'text-white group-hover:text-purple-300'
                          }`}>
                            {dlc.name}
                          </p>
                          <p className="text-white/50 text-[10px] line-clamp-2">
                            {dlc.description}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          dlc.id === 'standard' && !selectedDLC
                            ? 'text-cyan-400'
                            : selectedDLC?.id === dlc.id ? 'text-purple-400' : 'text-white/30 group-hover:text-purple-400'
                        }`} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Achievements - System Assets Content */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    Achievements
                  </h3>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <SystemPreviewCard 
                      type="Ability" 
                      title="Neural Shock" 
                      subtitle="Stun enemies in radius" 
                      onClick={() => handleMediaTrigger('Neural Shock', 'ability')}
                    />
                    <SystemPreviewCard 
                      type="Passive" 
                      title="Cyber Metabolism" 
                      subtitle="+10% Regeneration" 
                      onClick={() => handleMediaTrigger('Cyber Metabolism', 'ability')}
                    />
                    <SystemPreviewCard 
                      type="Equipment" 
                      title="Void Walker Set" 
                      subtitle="Stealth Bonus" 
                      onClick={() => handleMediaTrigger('Void Walker Set', 'equipment')}
                    />
                    <SystemPreviewCard 
                      type="Trait" 
                      title="Tactical Mind" 
                      subtitle="AI Behavior Mod" 
                      onClick={() => handleMediaTrigger('Tactical Mind', 'trait')}
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Blacksmith Compatible</span>
                    </div>
                    <p className="text-[9px] text-white/50 leading-relaxed">
                      All assets from this system can be forged, combined, and ascended in the Blacksmith OS.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <SpecsTab game={game} />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Transaction Modal removed in favor of global Cart */}
    </div>
  );
}