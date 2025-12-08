import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, TrendingUp, Activity, GitBranch, ArrowRight, Sparkles, Shield, Sword } from 'lucide-react';
import ShinyCard from '../shared/ShinyCard';

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
  const [stats, setStats] = useState({
    level: 1,
    strength: 150,
    xp: 0,
    xpToNext: 1000
  });
  const [selectedNode, setSelectedNode] = useState('root');
  const [unlockedNodes, setUnlockedNodes] = useState(['root']);

  const handleTrain = () => {
    setStats(prev => {
      const newXp = prev.xp + 250;
      if (newXp >= prev.xpToNext) {
        return {
          ...prev,
          level: prev.level + 1,
          strength: prev.strength + 50,
          xp: newXp - prev.xpToNext,
          xpToNext: Math.floor(prev.xpToNext * 1.5)
        };
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
        onClick={onClose}
      />

      {/* Main Content - No Container Box, Floating Elements */}
      <div className="relative w-full max-w-6xl h-[80vh] flex items-center gap-12 pointer-events-none px-12">
        
        {/* Left: Card Preview & Stats */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          className="flex flex-col gap-8 items-center pointer-events-auto"
        >
          <div className="w-[350px] aspect-[3/4]">
            <ShinyCard>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                  <Zap className="w-12 h-12 text-cyan-300" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{card?.title || 'Unknown Card'}</h2>
                <p className="text-cyan-200/60 text-sm font-medium tracking-widest uppercase">{currentNode.name}</p>
                
                <div className="mt-6 grid grid-cols-2 gap-4 w-full">
                  <div className="bg-black/20 rounded-lg p-2">
                    <div className="text-xs text-white/40 uppercase">STR</div>
                    <div className="text-xl font-bold text-white">{stats.strength}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2">
                    <div className="text-xs text-white/40 uppercase">LVL</div>
                    <div className="text-xl font-bold text-white">{stats.level}</div>
                  </div>
                </div>
              </div>
            </ShinyCard>
          </div>

          {/* Training Controls */}
          <div className="w-full space-y-4">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-white/60">Experience</span>
              <span className="text-white">{stats.xp} / {stats.xpToNext} XP</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${(stats.xp / stats.xpToNext) * 100}%` }}
              />
            </div>
            <button 
              onClick={handleTrain}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 backdrop-blur-md text-cyan-100 font-bold tracking-widest uppercase transition-all active:scale-95 flex items-center justify-center gap-2 group"
            >
              <Sparkles className="w-5 h-5 group-hover:text-yellow-300 transition-colors" />
              Feed Achievement Points
            </button>
          </div>
        </motion.div>

        {/* Right: Skill Tree System */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 50, opacity: 0 }}
          className="flex-1 h-full flex flex-col pointer-events-auto"
        >
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white mb-2">Ability Matrix</h1>
            <p className="text-white/50 text-lg">Modify and evolve your card's inherent abilities.</p>
          </div>

          {/* Skill Tree Viz - Floating Liquid Glass Nodes */}
          <div className="flex-1 relative">
            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
              <path d="M 100 200 C 200 200, 200 100, 400 100" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
              <path d="M 100 200 C 200 200, 200 300, 400 300" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
            </svg>

            {/* Nodes */}
            <div className="absolute top-[200px] left-[100px] -translate-x-1/2 -translate-y-1/2">
              <SkillNode 
                node={MOCK_SKILL_TREE[0]} 
                selected={selectedNode === 'root'} 
                unlocked={true}
                onClick={() => setSelectedNode('root')}
              />
            </div>

            <div className="absolute top-[100px] left-[400px] -translate-x-1/2 -translate-y-1/2">
              <SkillNode 
                node={MOCK_SKILL_TREE[1]} 
                selected={selectedNode === 'branch_1'} 
                unlocked={unlockedNodes.includes('branch_1')}
                onClick={() => setSelectedNode('branch_1')}
              />
            </div>

            <div className="absolute top-[300px] left-[400px] -translate-x-1/2 -translate-y-1/2">
              <SkillNode 
                node={MOCK_SKILL_TREE[2]} 
                selected={selectedNode === 'branch_2'} 
                unlocked={unlockedNodes.includes('branch_2')}
                onClick={() => setSelectedNode('branch_2')}
              />
            </div>
          </div>

          {/* Selected Ability Details */}
          <div className="mt-8 p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                  {currentNode.name}
                  {currentNode.type === 'mutation' && <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30 uppercase tracking-wider">Mutation</span>}
                </h3>
                <p className="text-white/70 text-lg leading-relaxed max-w-2xl">
                  {currentNode.description}
                </p>
              </div>
              {!unlockedNodes.includes(currentNode.id) && (
                <button 
                  onClick={() => handleUnlock(currentNode.id)}
                  className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                >
                  Unlock ({currentNode.cost} AP)
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-0 right-0 p-4 text-white/50 hover:text-white transition-colors pointer-events-auto"
        >
          <X className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}

function SkillNode({ node, selected, unlocked, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
        selected 
          ? 'ring-4 ring-cyan-400 ring-offset-4 ring-offset-transparent shadow-[0_0_40px_rgba(34,211,238,0.6)]' 
          : ''
      }`}
    >
      <div 
        className={`absolute inset-0 rounded-full backdrop-blur-md border transition-all duration-300 ${
          unlocked 
            ? 'bg-cyan-500/20 border-cyan-400/50' 
            : 'bg-slate-900/40 border-white/10 grayscale'
        }`} 
      />
      
      <div className="relative z-10">
        {node.type === 'active' ? <Zap className={`w-8 h-8 ${unlocked ? 'text-cyan-300' : 'text-white/20'}`} /> : <GitBranch className={`w-8 h-8 ${unlocked ? 'text-purple-300' : 'text-white/20'}`} />}
      </div>
    </motion.button>
  );
}