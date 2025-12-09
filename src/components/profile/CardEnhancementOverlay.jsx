import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { X, Sparkles, Zap, Swords, Hammer, ArrowLeftRight, Layers, Plus, GitBranch, Hexagon, ArrowRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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
  const [stats, setStats] = useState({ level: 1, strength: 150, xp: 0, xpToNext: 1000, playerXP: 5000, skillPoints: 12 });
  const [selectedNode, setSelectedNode] = useState('root');
  const [unlockedNodes, setUnlockedNodes] = useState(['root']);
  const [fusionMaterial, setFusionMaterial] = useState(null);
  
  // Mock Related Cards if not provided (to match exact look of Collection Network)
  const [collectionCards, setCollectionCards] = useState(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: `related-${i}`,
      name: `${card?.series || 'Series'} Card ${i+1}`,
      rarity: ['Common', 'Rare', 'Epic'][Math.floor(Math.random() * 3)],
      image: i % 2 === 0 ? card?.image : null
    }));
  });

  const actions = [
    { id: 'combine', label: 'Combine', icon: ArrowLeftRight, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/50' },
    { id: 'skills', label: 'Skills', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/50' },
    { id: 'train', label: 'Train', icon: Swords, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50' },
    { id: 'craft', label: 'Craft', icon: Hammer, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/50' },
    { id: 'score', label: 'Score', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50' },
  ];

  // Card Tilt & Shine Logic
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
      if (prev.playerXP < 250) return prev;
      const newXp = prev.xp + 250;
      let newLevel = prev.level;
      let newStrength = prev.strength;
      let newXpToNext = prev.xpToNext;
      let currentXp = newXp;

      if (newXp >= prev.xpToNext) {
        newLevel += 1;
        newStrength += 50;
        currentXp = newXp - prev.xpToNext;
        newXpToNext = Math.floor(prev.xpToNext * 1.5);
      }
      return { ...prev, level: newLevel, strength: newStrength, xp: currentXp, xpToNext: newXpToNext, playerXP: prev.playerXP - 250 };
    });
  };

  const handleUnlock = (nodeId) => {
    if (!unlockedNodes.includes(nodeId) && stats.skillPoints >= 1) {
      setUnlockedNodes([...unlockedNodes, nodeId]);
      setSelectedNode(nodeId);
      setStats(prev => ({...prev, skillPoints: prev.skillPoints - 1}));
    }
  };

  const currentNode = MOCK_SKILL_TREE.find(n => n.id === selectedNode) || MOCK_SKILL_TREE[0];

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    if (result.destination.droppableId === 'fusion-slot') {
       // Handle drop to fusion slot
       const item = collectionCards.find(i => i.id === result.draggableId);
       setFusionMaterial(item);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-7xl h-[90vh] flex gap-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Panel: Selected Card ONLY */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-1/4 rounded-3xl overflow-hidden flex flex-col relative p-6 items-center justify-center"
          style={{
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}
        >
            <div 
              className="relative group perspective-1000 w-full max-w-[240px] aspect-[2.5/3.5]"
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
                <div className="absolute inset-0 z-0" style={{ transform: "translateZ(0)" }}>
                  {card?.image || card?.preview_image_url ? (
                    <img src={card.image || card.preview_image_url} alt={card.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <div className="text-white/20 text-4xl">?</div>
                    </div>
                  )}
                </div>
                <motion.div 
                  className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
                  style={{
                    background: useTransform(shineX, val => `linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.4) ${val}%, transparent 100%)`)
                  }}
                />
                <div className="absolute inset-0 z-10 bg-gradient-to-tr from-white/10 via-transparent to-black/30 pointer-events-none" />
              </motion.div>
            </div>

            <div className="mt-6 text-center">
              <h2 className="text-2xl font-black text-white mb-1 tracking-tight">{card?.title || card?.name || "Unknown Card"}</h2>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">{card?.series || "Series"}</Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {card?.rarity || "Common"}
                </Badge>
              </div>
            </div>
        </motion.div>

        {/* Right Panel: Content + Split Menu */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex-1 flex flex-col h-full overflow-hidden"
        >
          <DragDropContext onDragEnd={handleDragEnd}>
            {/* Top Section: Card Grid (Always Visible for Dragging) */}
            <div className={`transition-all duration-500 flex flex-col ${selectedAction === 'combine' || selectedAction === 'craft' ? 'h-1/2' : selectedAction ? 'h-0 opacity-0 overflow-hidden' : 'h-full'}`}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-400" />
                    Collection Network
                  </h3>
                  <Badge variant="outline" className="bg-white/5 border-white/10 px-3 py-1 text-white/60">
                    {collectionCards.length} Cards Found
                  </Badge>
                </div>
                
                <Droppable droppableId="collection-grid" direction="horizontal" isDropDisabled={true}>
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-1 overflow-y-auto pr-2 custom-scrollbar"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {collectionCards.map((relatedCard, index) => (
                          <Draggable key={relatedCard.id} draggableId={relatedCard.id} index={index}>
                            {(providedDrag) => (
                              <div
                                ref={providedDrag.innerRef}
                                {...providedDrag.draggableProps}
                                {...providedDrag.dragHandleProps}
                                className="aspect-[2.5/3.5] rounded-xl overflow-hidden cursor-pointer group bg-slate-800 border border-white/10 hover:border-white/30 transition-all"
                              >
                                {relatedCard.image ? (
                                  <img src={relatedCard.image} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white/20">?</div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex flex-col justify-end">
                                   <p className="text-[10px] font-bold text-white truncate">{relatedCard.name}</p>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
            </div>

            {/* Middle Section: Split Menu (Actions) */}
            <div className="py-4 border-t border-b border-white/10 my-2 shrink-0">
               <div className="flex justify-between gap-4">
                  {actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => setSelectedAction(selectedAction === action.id ? null : action.id)}
                      className={`flex-1 relative p-3 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 group overflow-hidden ${
                        selectedAction === action.id
                          ? `${action.bg} ${action.border} shadow-lg scale-105`
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <action.icon className={`w-5 h-5 ${action.color}`} />
                      <span className="text-xs font-bold text-white/80 uppercase tracking-wider">{action.label}</span>
                    </button>
                  ))}
               </div>
            </div>

            {/* Bottom Section: Active Action UI */}
            <div className="flex-1 overflow-hidden relative">
               <AnimatePresence mode="wait">
                  {selectedAction === 'combine' ? (
                    <motion.div key="combine" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="h-full flex flex-col">
                        <div className="text-center mb-4">
                           <h4 className="text-white font-bold uppercase tracking-widest text-sm">Fusion Chamber</h4>
                           <p className="text-white/40 text-xs">Drag a card from above to fuse</p>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center p-8 gap-8">
                           <div className="w-32 aspect-[2.5/3.5] bg-white/10 rounded-xl border border-white/20 flex flex-col items-center justify-center">
                              <span className="font-bold text-white text-xs mb-2">Base</span>
                              {card?.image || card?.preview_image_url ? <img src={card.image || card.preview_image_url} className="w-20 h-28 object-cover rounded shadow-lg opacity-80" /> : null}
                           </div>
                           <Plus className="w-6 h-6 text-white/40" />
                           
                           <Droppable droppableId="fusion-slot">
                             {(provided, snapshot) => (
                               <div 
                                 ref={provided.innerRef}
                                 {...provided.droppableProps}
                                 className={`w-32 aspect-[2.5/3.5] rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${
                                   snapshot.isDraggingOver ? 'bg-blue-500/20 border-blue-400' : 'border-white/20'
                                 }`}
                               >
                                  {fusionMaterial ? (
                                    <div className="w-full h-full relative group cursor-pointer" onClick={() => setFusionMaterial(null)}>
                                       <img src={fusionMaterial.image} className="w-full h-full object-cover rounded-lg" />
                                       <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <X className="text-white w-6 h-6" />
                                       </div>
                                    </div>
                                  ) : (
                                    <span className="text-white/40 text-xs font-bold">Drag Card Here</span>
                                  )}
                                  {provided.placeholder}
                               </div>
                             )}
                           </Droppable>

                           <ArrowRight className="w-6 h-6 text-white/40" />
                           <div className="w-32 aspect-[2.5/3.5] bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                              <Hexagon className="w-10 h-10 text-blue-300" />
                           </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                           <Button disabled={!fusionMaterial} className="bg-blue-600 hover:bg-blue-700 w-full max-w-sm">Fuse Cards</Button>
                        </div>
                    </motion.div>
                  ) : selectedAction === 'train' ? (
                    <motion.div key="train" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="h-full flex flex-col p-4">
                        <div className="flex justify-between items-center mb-6">
                           <h2 className="text-2xl font-bold text-white">Training</h2>
                           <Badge variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 px-3 py-1">
                              Available XP: {stats.playerXP.toLocaleString()}
                           </Badge>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-white/10 p-8">
                           <div className="text-center mb-8">
                              <div className="text-6xl font-black text-white mb-2">{stats.level}</div>
                              <div className="text-white/40 uppercase tracking-widest text-sm">Current Level</div>
                           </div>
                           <div className="w-full max-w-md space-y-2 mb-8">
                              <div className="flex justify-between text-sm">
                                 <span className="text-white/60">XP Progress</span>
                                 <span className="text-white">{stats.xp} / {stats.xpToNext}</span>
                              </div>
                              <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                 <motion.div className="h-full bg-red-500" initial={{ width: 0 }} animate={{ width: `${(stats.xp / stats.xpToNext) * 100}%` }} />
                              </div>
                           </div>
                           <Button onClick={handleTrain} disabled={stats.playerXP < 250} className="w-full max-w-md h-12 text-lg font-bold bg-red-600 hover:bg-red-700">
                              <Zap className="w-5 h-5 mr-2" /> Train (250 XP)
                           </Button>
                        </div>
                    </motion.div>
                  ) : selectedAction === 'skills' ? (
                    <motion.div key="skills" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="h-full flex flex-col p-4">
                        <div className="flex justify-between items-center mb-4">
                           <h2 className="text-2xl font-bold text-white">Ability Matrix</h2>
                           <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400 px-3 py-1">
                              Skill Points: {stats.skillPoints}
                           </Badge>
                        </div>
                        <div className="flex-1 relative bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                           {/* Skill Tree SVG */}
                           <div className="absolute inset-0 flex items-center justify-center">
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
                           <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/60 backdrop-blur-md border-t border-white/10">
                              <div className="flex justify-between items-center">
                                 <div>
                                    <h3 className="text-white font-bold">{currentNode.name}</h3>
                                    <p className="text-white/60 text-xs">{currentNode.description}</p>
                                 </div>
                                 {!unlockedNodes.includes(currentNode.id) && (
                                    <Button onClick={() => handleUnlock(currentNode.id)} disabled={stats.skillPoints < 1} size="sm" className="bg-purple-600 hover:bg-purple-700">Unlock (1 SP)</Button>
                                 )}
                              </div>
                           </div>
                        </div>
                    </motion.div>
                  ) : selectedAction === 'craft' ? (
                    <motion.div key="craft" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="h-full flex items-center justify-center text-white/30">
                       <p>Crafting Module - Drag materials here (Coming Soon)</p>
                    </motion.div>
                  ) : selectedAction === 'score' ? (
                    <motion.div key="score" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="h-full flex items-center justify-center">
                        <div className="text-center">
                           <div className="text-8xl font-black text-yellow-500 mb-2">12,450</div>
                           <div className="text-white/40 uppercase tracking-widest">Total Score</div>
                        </div>
                    </motion.div>
                  ) : (
                    // Default State (when no action selected) - Shows full grid if we wanted, but we keep grid always visible now
                    <div className="h-full flex items-center justify-center text-white/20 italic">
                       Select an action from the menu below to begin enhancement.
                    </div>
                  )}
               </AnimatePresence>
            </div>
          </DragDropContext>
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