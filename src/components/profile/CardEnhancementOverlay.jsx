import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { X, Sparkles, Zap, Swords, Hammer, ArrowLeftRight, Layers, Plus, GitBranch, Hexagon, ArrowRight, Trophy } from 'lucide-react';
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

export default function CardEnhancementOverlay({ card, onClose, readOnly = false }) {
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

  const actions = [
    { id: 'combine', label: 'Combine', icon: ArrowLeftRight, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/50' },
    { id: 'skills', label: 'Skills', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/50' },
    { id: 'train', label: 'Train', icon: Swords, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50' },
    { id: 'craft', label: 'Craft', icon: Hammer, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/50' },
    { id: 'score', label: 'Score', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50' },
  ];

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

        {/* Left Panel: Selected Card & Actions - Independent Box */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-1/3 rounded-3xl overflow-hidden flex flex-col relative p-6"
          style={{
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}
        >
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Interactive Liquid Glass Card Container */}
            <div 
              className="relative group perspective-1000 w-full max-w-[220px] aspect-[2.5/3.5]"
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

          {/* Actions Grid */}
          {!readOnly && (
            <div className="mt-auto pt-4 grid grid-cols-2 gap-2 border-t border-white/5">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => setSelectedAction(selectedAction === action.id ? null : action.id)}
                  className={`relative p-2 rounded-lg border transition-all duration-300 flex items-center gap-3 group overflow-hidden ${
                    selectedAction === action.id
                      ? `${action.bg} ${action.border} shadow-lg`
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`p-1.5 rounded-md bg-black/20 ${action.color}`}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white/80 uppercase tracking-wider">{action.label}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>
              ))}
            </div>
          )}
          {readOnly && (
            <div className="mt-auto pt-4 border-t border-white/5 text-center">
              <p className="text-white/40 text-xs italic">Blacksmith Mode Required to Edit</p>
            </div>
          )}
        </motion.div>

        {/* Right Panel: Dynamic Content (Collection Network OR Feature UI) */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex-1 flex flex-col py-6 pr-6"
        >
          <AnimatePresence mode="wait">
            {!selectedAction ? (
              /* DEFAULT VIEW: Collection Network */
              <motion.div 
                key="collection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <div className="mb-6 flex items-center justify-between pl-2">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-400" />
                      Collection Network
                    </h3>
                    <p className="text-white/40 text-sm">Related cards from {card?.series || "this series"}</p>
                  </div>
                  <Badge variant="outline" className="bg-white/5 border-white/10 px-3 py-1 text-white/60">
                    {relatedCards.length} Cards Found
                  </Badge>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {relatedCards.map((relatedCard) => (
                      <motion.div
                        key={relatedCard.id}
                        layoutId={`card-${relatedCard.id}`}
                        className={`relative aspect-[2.5/3.5] rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-105 hover:z-10`}
                      >
                        {relatedCard.image ? (
                          <img src={relatedCard.image} alt={relatedCard.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800/50 rounded-xl">
                            <span className="text-white/10 text-2xl">?</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 rounded-xl">
                          <p className="text-xs font-bold text-white truncate">{relatedCard.name}</p>
                          <p className="text-[10px] text-white/60">{relatedCard.rarity}</p>
                        </div>
                      </motion.div>
                    ))}
                    {[...Array(3)].map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-[2.5/3.5] rounded-xl flex items-center justify-center group opacity-30">
                        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/20 group-hover:border-white/30 group-hover:text-white/50 transition-all">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : selectedAction === 'train' ? (
              /* TRAIN VIEW */
              <motion.div key="train" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
                <div className="mb-8">
                   <h2 className="text-4xl font-black text-white mb-2 flex items-center gap-3"><Swords className="w-8 h-8 text-red-400"/> Training Grounds</h2>
                   <p className="text-white/50">Gain experience to level up card stats.</p>
                </div>
                <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 p-8 flex flex-col items-center justify-center">
                   <div className="w-full max-w-md space-y-8">
                      <div className="text-center">
                        <div className="text-6xl font-black text-white mb-2">{stats.level}</div>
                        <div className="text-white/40 uppercase tracking-widest text-sm">Current Level</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="text-white/60">XP Progress</span>
                           <span className="text-white">{stats.xp} / {stats.xpToNext}</span>
                        </div>
                        <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5">
                           <motion.div className="h-full bg-red-500" initial={{ width: 0 }} animate={{ width: `${(stats.xp / stats.xpToNext) * 100}%` }} />
                        </div>
                      </div>
                      <Button onClick={handleTrain} className="w-full h-14 text-lg font-bold bg-red-600 hover:bg-red-700">
                         <Zap className="w-5 h-5 mr-2" /> Train (+250 XP)
                      </Button>
                   </div>
                </div>
              </motion.div>
            ) : selectedAction === 'skills' ? (
              /* SKILLS VIEW */
              <motion.div key="skills" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
                 <div className="mb-4">
                    <h2 className="text-4xl font-black text-white mb-2 flex items-center gap-3"><Sparkles className="w-8 h-8 text-purple-400"/> Ability Matrix</h2>
                    <p className="text-white/50">Unlock and mutate abilities.</p>
                 </div>
                 <div className="flex-1 relative bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                       {/* Simplified Skill Tree for Demo */}
                       <div className="relative w-full h-full">
                          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                            <path d="M 50% 50% L 30% 30%" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                            <path d="M 50% 50% L 70% 30%" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                          </svg>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                             <SkillNode node={MOCK_SKILL_TREE[0]} selected={selectedNode === 'root'} unlocked={true} onClick={() => setSelectedNode('root')} />
                          </div>
                          <div className="absolute top-[30%] left-[30%] -translate-x-1/2 -translate-y-1/2">
                             <SkillNode node={MOCK_SKILL_TREE[1]} selected={selectedNode === 'branch_1'} unlocked={unlockedNodes.includes('branch_1')} onClick={() => setSelectedNode('branch_1')} />
                          </div>
                          <div className="absolute top-[30%] left-[70%] -translate-x-1/2 -translate-y-1/2">
                             <SkillNode node={MOCK_SKILL_TREE[2]} selected={selectedNode === 'branch_2'} unlocked={unlockedNodes.includes('branch_2')} onClick={() => setSelectedNode('branch_2')} />
                          </div>
                       </div>
                    </div>
                    {/* Node Details Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-black/60 backdrop-blur-md border-t border-white/10">
                       <h3 className="text-xl font-bold text-white mb-1">{currentNode.name}</h3>
                       <p className="text-white/60 text-sm mb-4">{currentNode.description}</p>
                       {!unlockedNodes.includes(currentNode.id) && (
                          <Button onClick={() => handleUnlock(currentNode.id)} size="sm" className="bg-purple-600 hover:bg-purple-700">Unlock ({currentNode.cost} AP)</Button>
                       )}
                    </div>
                 </div>
              </motion.div>
            ) : selectedAction === 'combine' ? (
              /* FUSION VIEW */
              <motion.div key="combine" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
                 <div className="mb-8">
                    <h2 className="text-4xl font-black text-white mb-2 flex items-center gap-3"><ArrowLeftRight className="w-8 h-8 text-blue-400"/> Fusion Core</h2>
                    <p className="text-white/50">Combine cards to increase rarity.</p>
                 </div>
                 <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center p-8">
                    <div className="flex items-center gap-8">
                       <div className="w-40 aspect-[3/4] bg-white/10 rounded-xl border border-white/20 flex items-center justify-center"><span className="font-bold text-white">Base</span></div>
                       <Plus className="w-8 h-8 text-white/40" />
                       <button onClick={() => setFusionMaterial(fusionMaterial ? null : {})} className={`w-40 aspect-[3/4] rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${fusionMaterial ? 'bg-blue-500/20 border-blue-500' : 'border-white/20 hover:border-white/40'}`}>
                          {fusionMaterial ? <span className="font-bold text-blue-300">Material</span> : <span className="text-white/40">Select</span>}
                       </button>
                       <ArrowRight className="w-8 h-8 text-white/40" />
                       <div className="w-40 aspect-[3/4] bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                          <Hexagon className="w-12 h-12 text-blue-300" />
                       </div>
                    </div>
                 </div>
                 <div className="mt-6 flex justify-center">
                    <Button disabled={!fusionMaterial} className="bg-blue-600 hover:bg-blue-700 w-full max-w-sm h-12 text-lg">Initiate Fusion</Button>
                 </div>
              </motion.div>
            ) : selectedAction === 'score' ? (
              /* SCORE VIEW */
              <motion.div key="score" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
                <div className="mb-8">
                  <h2 className="text-4xl font-black text-white mb-2 flex items-center gap-3"><Trophy className="w-8 h-8 text-yellow-400"/> Achievement Score</h2>
                  <p className="text-white/50">Your total achievement points.</p>
                </div>
                <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 p-8 flex flex-col items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-amber-600 mb-4 drop-shadow-2xl">
                      12,450
                    </div>
                    <div className="text-white/40 uppercase tracking-widest text-lg">Total Score</div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* CRAFT VIEW Placeholder */
              <motion.div key="craft" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex items-center justify-center text-white/30">
                 Crafting feature coming soon...
              </motion.div>
            )}
          </AnimatePresence>
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