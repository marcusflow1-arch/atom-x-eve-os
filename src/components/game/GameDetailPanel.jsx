import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, Cpu, ChevronRight, Lock, 
  Unlock, Database, Server, Info, AlertCircle,
  Download, Play, CreditCard, Check, X, Loader2
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
  const owned = isPurchased(gameId);

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
      } catch (err) {
        console.error("Failed to fetch game", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [gameId]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
        alert("Authentication Required Identity Protocol.");
        return;
    }
    addToCart({
        id: game.id,
        type: 'game',
        title: game.title,
        price: game.price,
        image: game.cover_image
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
    <div className="h-full w-full relative bg-[#050505] text-white font-sans overflow-hidden flex flex-col">
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505]" />
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
              <div className="flex-1 space-y-8 min-w-0">
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
                  <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white mb-2 leading-none">
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
                  <p className="text-lg text-white/60 font-light max-w-xl leading-relaxed">
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

                {/* Media System */}
                <div className="pt-6">
                  <div className="space-y-3">
                    {/* Compact Tab Switcher */}
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setMediaTab('content')}
                        className={`text-sm font-bold uppercase tracking-wider transition-all ${
                          mediaTab === 'content' ? 'text-white' : 'text-white/40 hover:text-white'
                        }`}
                      >
                        Content
                      </button>
                      <button 
                        onClick={() => setMediaTab('achievement_loot')}
                        className={`text-sm font-bold uppercase tracking-wider transition-all ${
                          mediaTab === 'achievement_loot' ? 'text-white' : 'text-white/40 hover:text-white'
                        }`}
                      >
                        Achievement DLC Loot
                      </button>
                    </div>

                    {/* Media Content */}
                    <AnimatePresence mode="wait">
                      {mediaTab === 'content' ? (
                        <motion.div
                          key="content"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2"
                        >
                          {/* Left Arrow */}
                          <button 
                            onClick={() => {
                              if (currentMediaIndex > 0) {
                                setCurrentMediaIndex(currentMediaIndex - 1);
                              }
                            }}
                            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all flex-shrink-0"
                          >
                            <ChevronRight className="w-4 h-4 text-white rotate-180" />
                          </button>

                          {/* Videos */}
                          <div className="flex gap-2">
                            {videos.map((video, i) => (
                              <div 
                                key={i}
                                onClick={() => handleMediaTrigger(i)}
                                className="relative w-32 aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group border border-white/10 hover:border-cyan-400/30 transition-all"
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
                          </div>
                          
                          {/* Screenshots */}
                          <div className="flex gap-2 overflow-x-auto flex-1">
                            {screenshots.map((screenshot, i) => (
                              <div 
                                key={i}
                                onClick={() => handleMediaTrigger(videos.length + i)}
                                className="w-24 aspect-video bg-black rounded-md overflow-hidden cursor-pointer border border-white/10 hover:border-cyan-400/30 transition-all group flex-shrink-0"
                              >
                                <img 
                                  src={screenshot.image} 
                                  alt={screenshot.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              </div>
                            ))}
                          </div>

                          {/* Right Arrow */}
                          <button 
                            onClick={() => {
                              const totalItems = videos.length + screenshots.length;
                              if (currentMediaIndex < totalItems - 1) {
                                setCurrentMediaIndex(currentMediaIndex + 1);
                              }
                            }}
                            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all flex-shrink-0"
                          >
                            <ChevronRight className="w-4 h-4 text-white" />
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="achievement_loot"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2"
                        >
                          {/* Left Arrow */}
                          <button 
                            onClick={() => {
                              if (currentMediaIndex > 0) {
                                setCurrentMediaIndex(currentMediaIndex - 1);
                              }
                            }}
                            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all flex-shrink-0"
                          >
                            <ChevronRight className="w-4 h-4 text-white rotate-180" />
                          </button>

                          {/* Achievement Horizontal List */}
                          <div className="flex-1 flex gap-2 overflow-x-auto pb-2">
                            {achievements.map((achievement, i) => (
                              <div 
                                key={i}
                                onClick={() => handleMediaTrigger(i)}
                                className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer hover:bg-cyan-500/20 hover:scale-110 transition-all group"
                              >
                                <div className="w-12 h-12 rounded-lg bg-black/40 flex items-center justify-center text-2xl border border-white/10 group-hover:border-cyan-400/50 group-hover:bg-black/60 transition-all">
                                  {achievement.icon}
                                </div>
                                <p className="text-white font-semibold text-[10px] text-center group-hover:text-cyan-300 transition-colors max-w-[60px] truncate">
                                  {achievement.name}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Right Arrow */}
                          <button 
                            onClick={() => {
                              if (currentMediaIndex < achievements.length - 1) {
                                setCurrentMediaIndex(currentMediaIndex + 1);
                              }
                            }}
                            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all flex-shrink-0"
                          >
                            <ChevronRight className="w-4 h-4 text-white" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
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

                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3">
                    <Database className="w-5 h-5 text-white/10" />
                  </div>
                  
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    Included System Assets
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

                {/* DLC & Updates Section */}
                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Download className="w-4 h-4 text-purple-400" />
                    DLC & Updates
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