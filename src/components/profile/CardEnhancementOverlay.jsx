import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { X, Layers, Plus, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock Data for Features
const MOCK_SKILL_TREE = [
  {
    id: 'root',
    name: 'Force Push',
    description: 'Push enemies away in a cone in front of you.',
    type: 'active',
    unlocked: true,
    children: ['branch_1', 'branch_2']
  },
  {
    id: 'branch_1',
    name: 'Force Disrupt',
    description: 'Unleash force in all directions, blowing everything away from your vessel.',
    type: 'mutation',
    unlocked: false,
    cost: 500,
    parent: 'root'
  },
  {
    id: 'branch_2',
    name: 'Focused Blast',
    description: 'Narrow beam of force that deals high damage to a single target.',
    type: 'mutation',
    unlocked: false,
    cost: 500,
    parent: 'root'
  }
];

export default function CardEnhancementOverlay({ card, onClose }) {
  const [selectedAction, setSelectedAction] = useState(null); // null = Collection View
  const [stats, setStats] = useState({ level: 1, strength: 150, xp: 0, xpToNext: 1000 });
  const [selectedNode, setSelectedNode] = useState('root');
  const [unlockedNodes, setUnlockedNodes] = useState(['root']);
  const [fusionMaterial, setFusionMaterial] = useState(null);

  // Mock Related Cards if not provided (to match exact look of Collection Network)
  const relatedCards = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: `related-${i}`,
      name: `${card?.series || 'Series'} Card ${i+1}`,
      rarity: ['Common', 'Rare', 'Epic'][Math.floor(Math.random() * 3)],
      image: i % 2 === 0 ? card?.image : null
    }));
  }, [card]);

  // Actions removed - showing description only

  // Card Tilt & Shine Logic (Copied from CardInventoryOverlay)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseY, [-150, 150], [15, -15]);
  const rotateY = useTransform(mouseX, [-150, 150], [-15, 15]);
  const shineX = useTransform(mouseX, [-150, 150], [0, 100]);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const cX = clientX - left - width / 2;
    const cY = clientY - top - height / 2;
    x.set(cX);
    y.set(cY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  // Feature Handlers
  const handleTrain = () => {
    setStats(prev => {
      const newXp = prev.xp + 250;
      if (newXp >= prev.xpToNext) {
        return { ...prev, level: prev.level + 1, strength: prev.strength + 50, xp: newXp - prev.xpToNext, xpToNext: Math.floor(prev.xpToNext * 1.5) };
      }
      return { ...prev, xp: newXp };
    });
  };

  const handleUnlock = (nodeId) => {
    if (!unlockedNodes.includes(nodeId)) {
      setUnlockedNodes([...unlockedNodes, nodeId]);
      setSelectedNode(nodeId);
    }
  };

  const currentNode = MOCK_SKILL_TREE.find(n => n.id === selectedNode) || MOCK_SKILL_TREE[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-6xl h-[85vh] flex gap-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Floating outside */}
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Panel: Selected Card & Actions - No Box, Just Content */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-1/3 flex flex-col relative p-6 items-center justify-center"
        >
          <div className="flex flex-col items-center justify-center">
            {/* Interactive Liquid Glass Card Container */}
            <div 
              className="relative group perspective-1000 w-full max-w-[280px] aspect-[2.5/3.5]"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <motion.div
                className="w-full h-full rounded-2xl relative z-10 overflow-hidden shadow-2xl border border-white/20 bg-slate-900"
                style={{
                  rotateX,
                  rotateY,
                  transformStyle: "preserve-3d",
                  boxShadow: `0 0 30px ${card?.rarity === 'Legendary' ? 'rgba(249,115,22,0.3)' : card?.rarity === 'Mythic' ? 'rgba(244,63,94,0.3)' : 'rgba(59,130,246,0.3)'}`
                }}
              >
                {/* Card Content Layer */}
                <div className="absolute inset-0 z-0" style={{ transform: "translateZ(0)" }}>
                  {card?.image ? (
                    <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <div className="text-white/20 text-4xl">?</div>
                    </div>
                  )}
                </div>

                {/* Interactive Shine Layer */}
                <motion.div 
                  className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
                  style={{
                    background: useTransform(shineX, val => `linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.4) ${val}%, transparent 100%)`)
                  }}
                />

                {/* Glossy Overlay */}
                <div className="absolute inset-0 z-10 bg-gradient-to-tr from-white/10 via-transparent to-black/30 pointer-events-none" />
              </motion.div>
              
              {/* Floor Reflection */}
              <div className="absolute -bottom-10 left-4 right-4 h-4 bg-black/60 blur-xl rounded-full" />
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-2xl font-black text-white mb-1 tracking-tight">{card?.title || card?.name || "Unknown Card"}</h2>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">{card?.series || "Unknown Series"}</Badge>
                <Badge className={`${
                  card?.rarity === 'Legendary' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                  card?.rarity === 'Mythic' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                  card?.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                  'bg-blue-500/20 text-blue-300 border-blue-500/30'
                } border`}>
                  {card?.rarity || "Common"}
                </Badge>
              </div>
            </div>
          </div>


        </motion.div>

        {/* Right Panel: Dynamic Content (Collection Network OR Feature UI) */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex-1 flex flex-col py-6 pr-6"
        >
          {/* Card Description Record */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col"
          >
            <div className="mb-6 pl-2">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <ScrollText className="w-6 h-6 text-cyan-400" />
                Card Record
              </h3>
              <p className="text-white/40 text-sm">Detailed information about this card</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-3">Description</label>
                    <p className="text-slate-300 leading-relaxed italic text-sm">
                      "{card?.description || "A mysterious card from the vast collection. Its true power and origins remain shrouded in mystery, waiting to be discovered by those brave enough to seek its secrets."}"
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                    <div>
                      <label className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-2">Series</label>
                      <p className="text-white font-medium">{card?.series || "Unknown Series"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-2">Rarity</label>
                      <Badge className={`${
                        card?.rarity === 'Legendary' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' :
                        card?.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' :
                        card?.rarity === 'Rare' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 
                        card?.rarity === 'Mythic' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 
                        'bg-slate-500/20 text-slate-400 border-slate-500/50'
                      } border`}>
                        {card?.rarity || "Common"}
                      </Badge>
                    </div>
                  </div>

                  {card?.stats && Object.keys(card.stats).length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <label className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-3">Stats</label>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(card.stats).map(([key, value]) => (
                          <div key={key} className="bg-black/30 p-3 rounded-lg border border-white/5">
                            <div className="text-xs text-slate-400 uppercase tracking-wide">{key.replace('_', ' ')}</div>
                            <div className="text-2xl font-bold text-white mt-1">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/10">
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-3">Card Details</label>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-slate-400">Card ID</span>
                        <span className="text-white font-mono">{card?.id || "---"}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-slate-400">Type</span>
                        <span className="text-white">{card?.type || "Trading Card"}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-slate-400">Collection</span>
                        <span className="text-white">{card?.series || "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function SkillNode({ node, selected, unlocked, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
        selected ? 'ring-4 ring-purple-400 ring-offset-4 ring-offset-transparent shadow-[0_0_30px_rgba(168,85,247,0.5)]' : ''
      }`}
    >
      <div className={`absolute inset-0 rounded-full backdrop-blur-md border transition-all duration-300 ${unlocked ? 'bg-purple-500/20 border-purple-400/50' : 'bg-slate-900/40 border-white/10 grayscale'}`} />
      <div className="relative z-10">
        <GitBranch className={`w-6 h-6 ${unlocked ? 'text-purple-300' : 'text-white/20'}`} />
      </div>
    </motion.button>
  );
}