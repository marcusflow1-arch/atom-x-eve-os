import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Zap, Shield, Play, RotateCw, ZoomIn, Info, 
  Sparkles, Layers, Box, Maximize, User
} from 'lucide-react';
import ShinyCard from '@/components/shared/ShinyCard';

// --- 3D Card Viewer Component ---
const CardViewer3D = ({ card, isInspectMode, toggleInspect }) => {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e) => {
    if (!cardRef.current || !isInspectMode) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateXVal = ((y - centerY) / centerY) * -20; // Max 20deg rotation
    const rotateYVal = ((x - centerX) / centerX) * 20;

    setRotateX(rotateXVal);
    setRotateY(rotateYVal);
  };

  const handleMouseLeave = () => {
    if (!isInspectMode) {
      setRotateX(0);
      setRotateY(0);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center perspective-1000">
      <motion.div
        ref={cardRef}
        className={`relative w-64 h-96 rounded-xl shadow-2xl transition-all duration-200 ${isInspectMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{
          transformStyle: "preserve-3d",
          rotateX: isInspectMode ? rotateX : 0,
          rotateY: isInspectMode ? rotateY : 0,
          scale: isInspectMode ? 1.2 : 1,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={!isInspectMode ? { 
          y: [0, -10, 0],
          rotateY: [0, 5, 0, -5, 0]
        } : {}}
        transition={!isInspectMode ? { 
          duration: 6, 
          repeat: Infinity,
          ease: "easeInOut" 
        } : { duration: 0.2 }}
      >
        {/* Front Face */}
        <div className="absolute inset-0 bg-slate-900 rounded-xl overflow-hidden backface-hidden border border-white/10">
          <img 
            src={card.image || `https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop`} 
            alt={card.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <Badge className="bg-black/50 backdrop-blur border border-white/20 text-white">
              {card.rarity || 'Rare'}
            </Badge>
            <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center border border-white/20">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white mb-1">{card.name}</h3>
            <p className="text-xs text-white/60 line-clamp-2">{card.description}</p>
          </div>
          
          {/* Holographic Shine */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>

        {/* Back Face (for 3D rotation) */}
        <div 
          className="absolute inset-0 bg-slate-800 rounded-xl overflow-hidden backface-hidden flex items-center justify-center border border-white/10"
          style={{ transform: "rotateY(180deg)" }}
        >
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
              <Box className="w-8 h-8 text-white/40" />
            </div>
            <h4 className="text-white font-bold mb-2">Atom XE Digital Asset</h4>
            <p className="text-xs text-white/40">
              ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="absolute bottom-4 flex gap-2">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={toggleInspect}
          className="bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 text-white text-xs"
        >
          {isInspectMode ? <Maximize className="w-3 h-3 mr-2" /> : <RotateCw className="w-3 h-3 mr-2" />}
          {isInspectMode ? 'Reset View' : 'Inspect 3D'}
        </Button>
      </div>
    </div>
  );
};

// --- Avatar Wireframe Component ---
const AvatarWireframe = ({ activeCard }) => {
  return (
    <div className="relative w-full h-full bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-10" 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', 
          backgroundSize: '20px 20px' 
        }} 
      />
      
      {/* Wireframe Avatar Silhouette */}
      <div className="relative z-10 w-48 h-80 opacity-60">
        <svg viewBox="0 0 100 200" fill="none" stroke="currentColor" className="w-full h-full text-white/20 stroke-[0.5]">
          <path d="M50 20 C 50 10, 60 10, 60 20 C 60 30, 40 30, 40 20 C 40 10, 50 10, 50 20" />
          <path d="M50 35 L 50 90" />
          <path d="M20 50 L 50 40 L 80 50" />
          <path d="M50 90 L 30 180" />
          <path d="M50 90 L 70 180" />
          
          {/* Active Card Effect Overlay */}
          {activeCard && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={activeCard.id}
            >
              <circle cx="50" cy="40" r="30" className="stroke-cyan-400 stroke-1 fill-cyan-500/10 animate-pulse" />
              <path d="M10 100 L 90 100" className="stroke-cyan-500/50 stroke-[0.5]" />
            </motion.g>
          )}
        </svg>

        {/* Floating Stat Indicators */}
        <AnimatePresence>
          {activeCard && (
            <>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-10 -left-12 bg-black/60 backdrop-blur border border-cyan-500/30 px-3 py-1.5 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs font-bold text-white">+15 Power</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1 }}
                className="absolute top-20 -right-12 bg-black/60 backdrop-blur border border-purple-500/30 px-3 py-1.5 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span className="text-xs font-bold text-white">Passive Active</span>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Contextual Overlay (Bottom) */}
      <AnimatePresence>
        {activeCard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  {activeCard.name}
                  <Badge variant="outline" className="text-[9px] border-white/20 text-white/50 px-1 py-0 h-4">
                    {activeCard.type || 'Ability'}
                  </Badge>
                </h4>
                <p className="text-xs text-white/60 mt-1">
                  Applies <span className="text-cyan-400">Status Effect</span> to all enemies in range.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/40 uppercase tracking-widest block">Usage</span>
                <span className="text-xs font-mono text-green-400">PvE & PvP</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function GameCardShowcase({ game }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const [activeCard, setActiveCard] = useState(null);
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Combine abilities and equipment for the showcase
  const allCards = [
    ...(game.abilities || []).map(c => ({ ...c, category: 'Ability' })),
    ...(game.equipment || []).map(c => ({ ...c, category: 'Equipment' }))
  ];

  // Filter cards based on selection
  const filteredCards = selectedCategory === 'All' 
    ? allCards 
    : allCards.filter(c => c.category === selectedCategory);

  // Default to first card
  useEffect(() => {
    if (allCards.length > 0 && !activeCard) {
      setActiveCard(allCards[0]);
    }
  }, [allCards]);

  if (allCards.length === 0) return null;

  return (
    <div ref={ref} className="w-full py-16 lg:py-24 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c10] via-[#0f1219] to-[#0a0c10] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none opacity-50" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
        
        {/* Header */}
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
              Integrated Card System
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Every item and ability in <span className="text-white font-bold">{game.title}</span> is a persistent card in your Atom XE inventory. Inspect them in 3D and see how they augment your global Avatar.
            </p>
          </motion.div>
        </div>

        <div className="flex flex-col gap-12">
          
          {/* TOP: Main Showcase Area (Card + Avatar) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[500px]">
            
            {/* Big Card Display */}
            <div className="relative h-full bg-gradient-to-b from-slate-900/50 to-slate-900/0 rounded-3xl border border-white/5 backdrop-blur-sm flex items-center justify-center p-8 shadow-2xl">
              {activeCard && (
                <CardViewer3D 
                  card={activeCard} 
                  isInspectMode={isInspectMode}
                  toggleInspect={() => setIsInspectMode(!isInspectMode)}
                />
              )}
            </div>

            {/* Avatar Simulation */}
            <div className="h-full flex flex-col">
               <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Avatar Simulation</h3>
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-[9px] text-white/40">
                    <User className="w-3 h-3 mr-1" /> Wireframe Mode
                  </Badge>
               </div>
               
               <div className="flex-1">
                 <AvatarWireframe activeCard={activeCard} />
               </div>
            </div>
          </div>

          {/* BOTTOM: Mini Garage (Grid View) */}
          <div className="flex flex-col gap-6">
            
            {/* Filter Controls */}
            <div className="flex items-center gap-4 px-2 border-b border-white/10 pb-4">
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest mr-2">Asset Garage</span>
              
              {['All', 'Ability', 'Equipment'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`
                    px-4 py-1.5 rounded-full text-xs font-medium transition-all
                    ${selectedCategory === cat 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                      : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-transparent'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-2">
              {filteredCards.map((card, idx) => (
                <motion.div
                  key={card.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => { setActiveCard(card); setIsInspectMode(false); }}
                  className={`
                    p-3 rounded-xl border cursor-pointer flex flex-col gap-3 group transition-all
                    ${activeCard?.id === card.id 
                      ? 'bg-white/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-105 z-10' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      activeCard?.id === card.id ? 'bg-cyan-500/20 border-cyan-500/30' : 'bg-black/40 border-white/10'
                    }`}>
                      {card.category === 'Ability' ? <Zap className="w-4 h-4 text-white/70" /> : <Shield className="w-4 h-4 text-white/70" />}
                    </div>
                    {activeCard?.id === card.id && (
                      <Badge className="bg-cyan-500/20 text-cyan-300 text-[10px] px-1.5 py-0">Active</Badge>
                    )}
                  </div>
                  
                  <div>
                    <h4 className={`text-sm font-bold truncate transition-colors ${activeCard?.id === card.id ? 'text-white' : 'text-white/70'}`}>
                      {card.name}
                    </h4>
                    <p className="text-[10px] text-white/40 group-hover:text-white/60">
                      {card.category} • {card.rarity || 'Common'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}