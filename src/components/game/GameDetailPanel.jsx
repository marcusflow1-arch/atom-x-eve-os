import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, Cpu, ChevronRight, Lock, 
  Unlock, Database, Server, Info, AlertCircle,
  Download, Play, CreditCard, Check, X, Loader2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
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

const PurchaseModal = ({ game, onClose, onConfirm, isProcessing }) => {
  const [step, setStep] = useState('review'); // review, processing, success

  useEffect(() => {
    if (isProcessing) setStep('processing');
  }, [isProcessing]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-zinc-950 rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative"
      >
        {/* Glass Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-white/60" />
              Secure Checkout
            </h3>
            {!isProcessing && (
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white/40" />
              </button>
            )}
          </div>

          {step === 'review' && (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex gap-4">
                <img src={game.cover_image} alt={game.title} className="w-16 h-20 object-cover rounded-lg shadow-lg" />
                <div>
                  <h4 className="font-bold text-white mb-1">{game.title}</h4>
                  <span className="text-xs text-white/40 uppercase tracking-wider">Standard License</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Subtotal</span>
                  <span className="text-white">${game.price?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">System Fee</span>
                  <span className="text-white">$0.00</span>
                </div>
                <div className="h-px bg-white/10 my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-green-400">${game.price?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex gap-3 items-start">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-200/80 leading-relaxed">
                  Purchase includes immediate system access, unlocked ability pool, and specialized blacksmithing rights for this title.
                </p>
              </div>

              <button
                onClick={onConfirm}
                className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-white/10"
              >
                Confirm Transaction
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-white animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-white/40" />
                </div>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Processing Protocol</h4>
              <p className="text-sm text-white/40 animate-pulse">Establishing secure link...</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function GameDetailPanel({ gameId, onClose }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [activeTab, setActiveTab] = useState('system'); // 'system' or 'specs'
  const [owned, setOwned] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;
      try {
        const fetchedGame = await base44.entities.Game.get(gameId);
        setGame(fetchedGame);
        
        if (user?.purchased_items?.includes(gameId)) {
          setOwned(true);
        }
      } catch (err) {
        console.error("Failed to fetch game", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [gameId, user]);

  const handleTransactionStart = () => {
    if (!isAuthenticated) {
        alert("Authentication Required Identity Protocol.");
        return;
    }
    setShowPurchaseModal(true);
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
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={game.cover_image} 
          alt={game.title} 
          className="w-full h-full object-cover opacity-40 blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505]" />
        {/* Scanlines */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
      </div>

      {/* Header / Nav */}
      <div className="relative z-20 p-8 flex justify-between items-start">
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
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full px-12 pb-12">
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

                {/* Main Action Button */}
                <div className="pt-4">
                  {owned ? (
                    <button 
                      onClick={handlePlay}
                      className="group relative px-10 py-5 bg-white text-black rounded-2xl font-bold uppercase tracking-widest text-sm overflow-hidden hover:scale-[1.02] transition-transform"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-20 transition-opacity" />
                      <span className="relative flex items-center gap-3">
                        <Play className="w-5 h-5 fill-black" />
                        Execute Launch Sequence
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={handleTransactionStart}
                        className="group relative px-10 py-5 bg-white text-black rounded-2xl font-bold uppercase tracking-widest text-sm overflow-hidden hover:scale-[1.02] transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)]"
                      >
                        <span className="relative flex items-center gap-3">
                          <Download className="w-5 h-5" />
                          Initialize System • ${game.price?.toFixed(2) || '0.00'}
                        </span>
                      </button>
                      <div className="text-xs text-white/40 max-w-[150px] leading-tight">
                        * Unlocks ability pool, item drops, and achievement map.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Asset Preview (The Hook) */}
              <div className="flex-1 w-full lg:max-w-md">
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
      </div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {showPurchaseModal && (
          <PurchaseModal 
            game={game} 
            onClose={() => setShowPurchaseModal(false)}
            onConfirm={handleTransactionConfirm}
            isProcessing={unlocking}
          />
        )}
      </AnimatePresence>
    </div>
  );
}