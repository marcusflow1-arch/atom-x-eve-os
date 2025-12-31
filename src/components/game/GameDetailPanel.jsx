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

const SystemPreviewCard = ({ type, title, subtitle }) => (
  <div className="relative group overflow-hidden rounded-xl border border-white/10 bg-black/20 hover:bg-white/5 transition-all duration-300">
    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent opacity-50" />
    <div className="p-4">
      <div className="flex justify-between items-start mb-3">
        <span className="text-[9px] uppercase tracking-wider text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded bg-cyan-500/10">
          {type}
        </span>
        <Lock className="w-3 h-3 text-white/20" />
      </div>
      <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
      <p className="text-white/40 text-xs">{subtitle}</p>
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
  const [mediaTab, setMediaTab] = useState('media'); // 'media' or 'achievements'
  const [isViewingMedia, setIsViewingMedia] = useState(false);
  const owned = isPurchased(gameId); // Use CartContext check or local state if preferred, but context is better for syncing.
  
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
        setOwned(true);
        setShowPurchaseModal(false);
    } catch (err) {
        console.error("Unlock failed", err);
        setUnlocking(false); // Stop processing if error
    } finally {
        // We keep unlocking true for a moment if successful to transition? 
        // Actually setOwned(true) will re-render the main view.
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
      {/* Full Screen Media Viewer */}
      <AnimatePresence>
        {isViewingMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setIsViewingMedia(false)}
          >
            <div className="relative w-full h-full max-w-7xl mx-auto p-8 flex items-center justify-center">
              <button 
                onClick={() => setIsViewingMedia(false)}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/20">
                <img 
                  src={game.cover_image} 
                  alt="Media"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Immersive Background */}
      <motion.div 
        animate={{ opacity: isViewingMedia ? 0 : 1 }}
        transition={{ duration: 0.3 }}
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
        transition={{ duration: 0.3 }}
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
        transition={{ duration: 0.3 }}
        className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full px-12 pb-12"
      >
        <AnimatePresence mode="wait">
          {activeTab === 'system' ? (
            <motion.div 
              key="system"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col lg:flex-row gap-16 items-center"
            >
              {/* Left: Identity */}
              <div className="flex-1 space-y-8">
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
                  </div>
                  <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-2 leading-none">
                    {game.title}
                  </h1>
                  <p className="text-xl text-white/60 font-light max-w-xl leading-relaxed">
                    {game.description || 'Initialize neural link to access description data.'}
                  </p>
                </div>

                {/* System Stats Preview */}
                <div className="grid grid-cols-3 gap-4">
                  <DataPoint label="Card Pool" value="45+" icon={Database} color="text-blue-400" />
                  <DataPoint label="Genre XP" value="+15%" icon={Zap} color="text-yellow-400" />
                  <DataPoint label="Compatibility" value="High" icon={Cpu} color="text-green-400" />
                </div>

                {/* Media System - Replaces Action Button */}
                <div className="pt-4">
                  <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden">
                    {/* Media Tabs */}
                    <div className="flex p-1 bg-black/40 border-b border-white/10">
                      <button 
                        onClick={() => setMediaTab('media')}
                        className={`flex-1 px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                          mediaTab === 'media' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                        }`}
                      >
                        Media
                      </button>
                      <button 
                        onClick={() => setMediaTab('achievements')}
                        className={`flex-1 px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                          mediaTab === 'achievements' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                        }`}
                      >
                        Achievements
                      </button>
                    </div>

                    {/* Media Content */}
                    <div className="p-6">
                      <AnimatePresence mode="wait">
                        {mediaTab === 'media' ? (
                          <motion.div
                            key="media"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                          >
                            {/* Video Player */}
                            <div 
                              onClick={() => setIsViewingMedia(true)}
                              className="relative aspect-video bg-black rounded-xl overflow-hidden cursor-pointer group border border-white/10 hover:border-white/20 transition-colors"
                            >
                              <img 
                                src={game.cover_image} 
                                alt="Gameplay" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Play className="w-8 h-8 text-white ml-1" />
                                </div>
                              </div>
                            </div>

                            {/* Screenshots Grid */}
                            <div className="grid grid-cols-3 gap-2">
                              {[1, 2, 3].map((i) => (
                                <div 
                                  key={i}
                                  onClick={() => setIsViewingMedia(true)}
                                  className="aspect-video bg-black rounded-lg overflow-hidden cursor-pointer border border-white/10 hover:border-white/20 transition-colors"
                                >
                                  <img 
                                    src={game.cover_image} 
                                    alt={`Screenshot ${i}`}
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                  />
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="achievements"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                          >
                            {/* Achievement Cards */}
                            {[
                              { name: 'Neural Shock', desc: 'Unlock the Neural Shock ability', icon: '⚡' },
                              { name: 'Cyber Metabolism', desc: 'Master regeneration techniques', icon: '💚' },
                              { name: 'Void Walker', desc: 'Complete stealth mission', icon: '👻' },
                            ].map((achievement, i) => (
                              <div 
                                key={i}
                                onClick={() => setIsViewingMedia(true)}
                                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                              >
                                <div className="w-12 h-12 rounded-lg bg-black/40 flex items-center justify-center text-2xl border border-white/10">
                                  {achievement.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-semibold text-sm">{achievement.name}</p>
                                  <p className="text-white/50 text-xs truncate">{achievement.desc}</p>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Add to Cart - Shown when not owned */}
                    {!owned && (
                      <div className="p-6 pt-0">
                        <button 
                          onClick={handleAddToCart}
                          className="w-full group relative px-6 py-4 rounded-xl font-bold uppercase tracking-widest text-sm overflow-hidden hover:scale-[1.02] transition-transform border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                        >
                          <div className="absolute inset-0 bg-white/10 backdrop-blur-md group-hover:bg-white/20 transition-colors" />
                          <span className="relative flex items-center justify-center gap-3 text-white">
                            <Download className="w-5 h-5" />
                            Add to Cart • ${game.price?.toFixed(2) || '0.00'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Asset Preview (The Hook) */}
              <div className="flex-1 w-full lg:max-w-md space-y-6">
                {/* Play Button - Moved Above */}
                {owned && (
                  <button 
                    onClick={handlePlay}
                    className="w-full group relative px-10 py-5 rounded-2xl font-bold uppercase tracking-widest text-sm overflow-hidden hover:scale-[1.02] transition-transform border border-green-400/30 shadow-[0_0_30px_rgba(74,222,128,0.2)]"
                  >
                    <div className="absolute inset-0 bg-green-500/10 backdrop-blur-md group-hover:bg-green-500/20 transition-colors" />
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <span className="relative flex items-center justify-center gap-3 text-green-300 group-hover:text-green-200 drop-shadow-[0_2px_10px_rgba(74,222,128,0.5)]">
                      <Play className="w-5 h-5 fill-green-400 text-green-400 drop-shadow-lg" />
                      Execute Launch Sequence
                    </span>
                  </button>
                )}

                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <Database className="w-6 h-6 text-white/10" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    Included System Assets
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <SystemPreviewCard type="Ability" title="Neural Shock" subtitle="Stun enemies in radius" />
                    <SystemPreviewCard type="Passive" title="Cyber Metabolism" subtitle="+10% Regeneration" />
                    <SystemPreviewCard type="Equipment" title="Void Walker Set" subtitle="Stealth Bonus" />
                    <SystemPreviewCard type="Trait" title="Tactical Mind" subtitle="AI Behavior Mod" />
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Blacksmith Compatible</span>
                    </div>
                    <p className="text-[10px] text-white/50 leading-relaxed">
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