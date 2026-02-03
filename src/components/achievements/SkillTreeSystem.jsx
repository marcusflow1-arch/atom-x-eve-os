import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Zap, Shield, Crosshair, Eye, Navigation, 
  Cpu, Activity, Lock, Unlock, Check, ChevronRight 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// --- MOCK SKILL DATA PER GENRE ---
const SKILL_DATA = {
  mmorpg: {
    name: "Warlord AI Protocol",
    description: "Enhances companion efficiency in large-scale raids and economy management.",
    nodes: [
      { id: 'core', x: 50, y: 50, label: 'Core Logic', icon: Brain, type: 'core', cost: 0, unlocked: true },
      { id: 'pathing', x: 30, y: 35, label: 'Auto-Pathing', icon: Navigation, type: 'utility', cost: 1, parent: 'core', desc: 'AI navigates complex terrain automatically, avoiding hazards.' },
      { id: 'market', x: 70, y: 35, label: 'Trade Analyze', icon: Activity, type: 'economy', cost: 1, parent: 'core', desc: 'Predicts market trends and suggests optimal sell times.' },
      { id: 'raid', x: 50, y: 20, label: 'Raid Awareness', icon: Eye, type: 'combat', cost: 2, parent: 'core', desc: 'Pre-alerts boss mechanics by 1.5 seconds.' },
      { id: 'healing', x: 30, y: 15, label: 'Triage Logic', icon: Shield, type: 'support', cost: 2, parent: 'pathing', desc: 'Prioritizes healing targets based on role value.' },
      { id: 'dps_boost', x: 70, y: 15, label: 'Synergy Spike', icon: Zap, type: 'combat', cost: 3, parent: 'market', desc: 'Grants +5% damage boost when fighting near AI.' },
      { id: 'ultimate', x: 50, y: 5, label: 'Hive Mind', icon: Cpu, type: 'ultimate', cost: 5, parent: 'raid', desc: 'AI coordinates with other party AIs for perfect ability chaining.' },
    ]
  },
  shooter: {
    name: "Aim-Assist Matrix",
    description: "Optimizes target acquisition and recoil control routines.",
    nodes: [
      { id: 'core', x: 50, y: 50, label: 'Core Logic', icon: Brain, type: 'core', cost: 0, unlocked: true },
      { id: 'snap', x: 40, y: 35, label: 'Snap Reflex', icon: Crosshair, type: 'combat', cost: 1, parent: 'core', desc: 'AI acquires targets 20% faster.' },
      { id: 'spotter', x: 60, y: 35, label: 'Enemy Spotter', icon: Eye, type: 'utility', cost: 1, parent: 'core', desc: 'Highlights enemies through smoke and foliage.' },
      { id: 'recoil', x: 20, y: 25, label: 'Recoil Null', icon: Activity, type: 'combat', cost: 2, parent: 'snap', desc: 'AI compensates for 15% of weapon recoil.' },
      { id: 'revive', x: 80, y: 25, label: 'Combat Medic', icon: Shield, type: 'support', cost: 2, parent: 'spotter', desc: 'AI deploys smoke automatically when reviving.' },
      { id: 'auto_lock', x: 50, y: 15, label: 'Target Lock', icon: Target, type: 'ultimate', cost: 5, parent: 'core', desc: 'Enables auto-locking on exposed enemy weak points.' },
    ]
  },
  // Fallback for other genres
  default: {
    name: "General Intelligence",
    description: "General purpose enhancements for your AI companion.",
    nodes: [
      { id: 'core', x: 50, y: 50, label: 'Core Logic', icon: Brain, type: 'core', cost: 0, unlocked: true },
      { id: 'efficiency', x: 35, y: 35, label: 'Efficiency', icon: Zap, type: 'utility', cost: 1, parent: 'core', desc: 'Reduces AI ability cooldowns by 10%.' },
      { id: 'learning', x: 65, y: 35, label: 'Deep Learning', icon: Cpu, type: 'utility', cost: 1, parent: 'core', desc: 'AI adapts to enemy patterns 2x faster.' },
      { id: 'survival', x: 50, y: 20, label: 'Survival Protocol', icon: Shield, type: 'defense', cost: 3, parent: 'core', desc: 'AI automatically uses consumables at low health.' },
    ]
  }
};

import { Target } from 'lucide-react';

const SkillNode = ({ node, onClick, isSelected, isUnlocked, isReachable }) => {
  const Icon = node.icon;
  
  // Node Styles based on state
  let bg = 'bg-slate-900';
  let border = 'border-slate-700';
  let iconColor = 'text-slate-500';
  let shadow = '';

  if (isUnlocked) {
    bg = 'bg-cyan-900/80';
    border = 'border-cyan-400';
    iconColor = 'text-cyan-300';
    shadow = 'shadow-[0_0_15px_rgba(34,211,238,0.4)]';
  } else if (isReachable) {
    bg = 'bg-slate-800';
    border = 'border-white/40 border-dashed';
    iconColor = 'text-white/60';
  }

  if (isSelected) {
    border = 'border-white';
    shadow = 'shadow-[0_0_20px_rgba(255,255,255,0.6)]';
  }

  if (node.type === 'ultimate') {
    border = isUnlocked ? 'border-yellow-400' : 'border-yellow-900';
    iconColor = isUnlocked ? 'text-yellow-300' : 'text-yellow-700';
  }

  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
      onClick={() => onClick(node)}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${bg} ${border} ${shadow}`}
      >
        <Icon className={`w-6 h-6 md:w-8 md:h-8 ${iconColor}`} />
        
        {/* Status Indicator */}
        <div className="absolute -bottom-1 -right-1">
          {isUnlocked ? (
            <div className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center border border-black text-black">
              <Check className="w-3 h-3" />
            </div>
          ) : !isReachable ? (
            <div className="w-5 h-5 bg-black/80 rounded-full flex items-center justify-center border border-slate-600">
              <Lock className="w-3 h-3 text-slate-500" />
            </div>
          ) : null}
        </div>
      </motion.div>
      
      {/* Tooltip Label */}
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="bg-black/80 text-white text-[10px] px-2 py-1 rounded border border-white/10 uppercase tracking-wider">
          {node.label}
        </span>
      </div>
    </div>
  );
};

// SVG Connector Lines
const Connection = ({ start, end, active }) => {
  // Simple calculation assuming % coordinates
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <line 
        x1={`${start.x}%`} 
        y1={`${start.y}%`} 
        x2={`${end.x}%`} 
        y2={`${end.y}%`} 
        stroke={active ? "#22d3ee" : "#334155"} 
        strokeWidth={active ? "2" : "1"}
        strokeDasharray={active ? "none" : "4 4"}
      />
      {active && (
        <circle r="2" fill="#22d3ee">
          <animateMotion 
            dur="2s" 
            repeatCount="indefinite"
            path={`M${start.x*10},${start.y*10} L${end.x*10},${end.y*10}`} // Scaling for viewBox
          />
        </circle>
      )}
    </svg>
  );
};

export default function SkillTreeSystem({ genre }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [unlockedNodes, setUnlockedNodes] = useState(['core']); // Core always unlocked
  const [skillPoints, setSkillPoints] = useState(genre?.skillPoints || 0);

  const treeData = SKILL_DATA[genre?.id] || SKILL_DATA[genre?.short?.toLowerCase()] || SKILL_DATA['default'];
  const nodes = treeData.nodes;

  // Helper to check if a node is reachable (parent is unlocked)
  const isNodeReachable = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node.parent) return true; // Core
    return unlockedNodes.includes(node.parent);
  };

  const handleUnlock = () => {
    if (!selectedNode) return;
    if (skillPoints >= selectedNode.cost && isNodeReachable(selectedNode.id)) {
      setUnlockedNodes([...unlockedNodes, selectedNode.id]);
      setSkillPoints(prev => prev - selectedNode.cost);
    }
  };

  return (
    <div className="w-full bg-[#0a0a0a] rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20" 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      />
      
      {/* Header */}
      <div className="relative z-20 p-8 border-b border-white/5 flex justify-between items-start bg-black/40 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 px-3 py-1">
              AI PROTOCOL V.2.0
            </Badge>
            <h3 className="text-white/40 text-sm font-mono uppercase tracking-widest">{genre?.name || 'GENERIC'} MODULE</h3>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">{treeData.name}</h2>
          <p className="text-slate-400 text-sm max-w-md mt-2">{treeData.description}</p>
        </div>
        
        {/* Skill Point Counter */}
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Available Points</span>
          <div className="flex items-center gap-2 px-6 py-3 bg-cyan-900/20 border border-cyan-500/30 rounded-xl">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <span className="text-3xl font-mono font-bold text-white">{skillPoints}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row h-[600px] relative z-10">
        
        {/* Tree Visualization Area */}
        <div className="flex-1 relative h-full overflow-hidden">
          {/* Render Connections */}
          <div className="absolute inset-0 w-full h-full">
            {nodes.map(node => {
              if (!node.parent) return null;
              const parent = nodes.find(n => n.id === node.parent);
              if (!parent) return null;
              
              const isPathActive = unlockedNodes.includes(node.id);
              
              return (
                <svg key={`conn-${node.id}`} className="absolute inset-0 w-full h-full pointer-events-none">
                  <line 
                    x1={`${parent.x}%`} 
                    y1={`${parent.y}%`} 
                    x2={`${node.x}%`} 
                    y2={`${node.y}%`} 
                    stroke={isPathActive ? "#22d3ee" : "#334155"} 
                    strokeWidth={isPathActive ? "2" : "1"}
                    strokeDasharray={isPathActive ? "none" : "6 4"}
                    className="transition-colors duration-500"
                  />
                </svg>
              );
            })}
          </div>

          {/* Render Nodes */}
          {nodes.map(node => (
            <SkillNode 
              key={node.id} 
              node={node} 
              onClick={setSelectedNode}
              isSelected={selectedNode?.id === node.id}
              isUnlocked={unlockedNodes.includes(node.id)}
              isReachable={isNodeReachable(node.id)}
            />
          ))}
        </div>

        {/* Inspector Panel (Right Side) */}
        <AnimatePresence mode="wait">
          <motion.div 
            className="w-full md:w-96 bg-[#0f0f11] border-l border-white/10 p-8 flex flex-col relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {selectedNode ? (
              <>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border-2 ${
                  unlockedNodes.includes(selectedNode.id) 
                    ? 'bg-cyan-900/30 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
                    : 'bg-slate-800 border-slate-600 text-slate-400'
                }`}>
                  {React.createElement(selectedNode.icon, { className: "w-8 h-8" })}
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">{selectedNode.label}</h3>
                <div className="flex gap-2 mb-6">
                  <Badge variant="outline" className="text-[10px] uppercase border-white/10 bg-white/5">{selectedNode.type}</Badge>
                  {unlockedNodes.includes(selectedNode.id) ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                  ) : (
                    <Badge className="bg-slate-700 text-slate-300 border-slate-600">Locked</Badge>
                  )}
                </div>

                <p className="text-slate-300 leading-relaxed mb-8 border-l-2 border-white/10 pl-4">
                  {selectedNode.desc}
                </p>

                {/* Stats / Impact */}
                <div className="space-y-4 mb-auto">
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">System Impact</h4>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-400">AI Efficiency</span>
                      <span className="text-cyan-400 font-mono">+12%</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 w-[12%]" />
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-8 border-t border-white/10 pt-6">
                  {unlockedNodes.includes(selectedNode.id) ? (
                    <div className="w-full py-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center gap-2 text-green-400 font-bold">
                      <Check className="w-5 h-5" />
                      PROTOCOL ACTIVE
                    </div>
                  ) : (
                    <Button 
                      className={`w-full py-6 text-lg font-bold ${
                        skillPoints >= selectedNode.cost && isNodeReachable(selectedNode.id)
                          ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                      onClick={handleUnlock}
                      disabled={skillPoints < selectedNode.cost || !isNodeReachable(selectedNode.id)}
                    >
                      {skillPoints < selectedNode.cost ? `Need ${selectedNode.cost} Points` : 
                       !isNodeReachable(selectedNode.id) ? 'Unlock Previous Node' :
                       `Unlock Protocol (-${selectedNode.cost} SP)`}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                <Brain className="w-24 h-24 mb-4" />
                <p className="text-xl font-bold">Select a Neural Node</p>
                <p className="text-sm">View details and upgrade AI protocols.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}