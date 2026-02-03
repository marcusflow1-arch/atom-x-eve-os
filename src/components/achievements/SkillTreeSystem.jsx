import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Zap, Shield, Crosshair, Eye, Navigation, 
  Cpu, Activity, Lock, Unlock, Check, ChevronRight,
  Hexagon, Target, Play, AlertCircle, Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// --- ENHANCED MOCK DATA ---
const SKILL_DATA = {
  mmorpg: {
    name: "WARLORD PROTOCOL",
    class: "Tactical Command",
    description: "Advanced raid heuristics and economy optimization algorithms.",
    color: "purple",
    nodes: [
      { id: 'core', x: 50, y: 50, label: 'Cortex', icon: Brain, type: 'core', cost: 0, unlocked: true },
      { id: 'pathing', x: 35, y: 40, label: 'Auto-Nav', icon: Navigation, type: 'utility', cost: 1, parent: 'core', desc: 'Autonomous terrain traversal and hazard avoidance systems.' },
      { id: 'market', x: 65, y: 40, label: 'Econ-AI', icon: Activity, type: 'economy', cost: 1, parent: 'core', desc: 'Real-time market arbitrage and resource valuation.' },
      { id: 'raid', x: 50, y: 25, label: 'Boss Logic', icon: Eye, type: 'combat', cost: 2, parent: 'core', desc: 'Predictive modeling for boss encounter mechanics.' },
      { id: 'healing', x: 25, y: 25, label: 'Triage', icon: Shield, type: 'support', cost: 2, parent: 'pathing', desc: 'Dynamic health prioritization for party members.' },
      { id: 'dps_boost', x: 75, y: 25, label: 'Synergy', icon: Zap, type: 'combat', cost: 3, parent: 'market', desc: 'Coordinated attack patterns yield +5% damage output.' },
      { id: 'ultimate', x: 50, y: 10, label: 'HIVE MIND', icon: Cpu, type: 'ultimate', cost: 5, parent: 'raid', desc: 'Full party neural link for frame-perfect combo execution.' },
    ]
  },
  shooter: {
    name: "AIM-ASSIST MATRIX",
    class: "Precision Ops",
    description: "Sub-millisecond target acquisition and recoil negation.",
    color: "emerald",
    nodes: [
      { id: 'core', x: 50, y: 50, label: 'Cortex', icon: Brain, type: 'core', cost: 0, unlocked: true },
      { id: 'snap', x: 40, y: 35, label: 'Reflex', icon: Crosshair, type: 'combat', cost: 1, parent: 'core', desc: 'Target acquisition latency reduced by 20%.' },
      { id: 'spotter', x: 60, y: 35, label: 'Vision', icon: Eye, type: 'utility', cost: 1, parent: 'core', desc: 'Thermal imaging overlay for obscured targets.' },
      { id: 'recoil', x: 30, y: 20, label: 'Stabilizer', icon: Activity, type: 'combat', cost: 2, parent: 'snap', desc: 'AI counter-acts 15% of weapon recoil patterns.' },
      { id: 'revive', x: 70, y: 20, label: 'Medic', icon: Shield, type: 'support', cost: 2, parent: 'spotter', desc: 'Autonomous smoke deployment during revival actions.' },
      { id: 'auto_lock', x: 50, y: 10, label: 'DEADEYE', icon: Target, type: 'ultimate', cost: 5, parent: 'core', desc: 'Perfect tracking on exposed weak points for 3s.' },
    ]
  },
  default: {
    name: "GENERAL INTELLIGENCE",
    class: "Base Systems",
    description: "Core processing and adaptability enhancements.",
    color: "cyan",
    nodes: [
      { id: 'core', x: 50, y: 50, label: 'Cortex', icon: Brain, type: 'core', cost: 0, unlocked: true },
      { id: 'efficiency', x: 35, y: 35, label: 'Cycles', icon: Zap, type: 'utility', cost: 1, parent: 'core', desc: 'Ability cooldowns reduced by 10% via overclocking.' },
      { id: 'learning', x: 65, y: 35, label: 'Adapt', icon: Cpu, type: 'utility', cost: 1, parent: 'core', desc: 'Pattern recognition speed increased by 200%.' },
      { id: 'survival', x: 50, y: 20, label: 'Protocol', icon: Shield, type: 'defense', cost: 3, parent: 'core', desc: 'Emergency consumable usage at critical health thresholds.' },
    ]
  }
};

const THEME_COLORS = {
  cyan: { main: 'text-cyan-400', border: 'border-cyan-500', glow: 'shadow-cyan-500/50', bg: 'bg-cyan-950', grad: 'from-cyan-500 to-blue-600' },
  purple: { main: 'text-purple-400', border: 'border-purple-500', glow: 'shadow-purple-500/50', bg: 'bg-purple-950', grad: 'from-purple-500 to-indigo-600' },
  emerald: { main: 'text-emerald-400', border: 'border-emerald-500', glow: 'shadow-emerald-500/50', bg: 'bg-emerald-950', grad: 'from-emerald-500 to-teal-600' },
  red: { main: 'text-red-400', border: 'border-red-500', glow: 'shadow-red-500/50', bg: 'bg-red-950', grad: 'from-red-500 to-rose-600' },
};

// --- COMPONENTS ---

const HexNode = ({ node, onClick, isSelected, isUnlocked, isReachable, theme }) => {
  const Icon = node.icon;
  const isUltimate = node.type === 'ultimate';
  
  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
      onClick={() => onClick(node)}
    >
      {/* Outer Pulse Ring for Unlocked/Ultimate */}
      {(isUnlocked || (isUltimate && isReachable)) && (
        <div className="absolute inset-0 -m-4">
          <div className={`w-full h-full rounded-full animate-ping opacity-20 bg-${theme.split('-')[1]}-400`} />
        </div>
      )}

      {/* Connection Line Hub */}
      <div className="absolute inset-0 flex items-center justify-center -z-10">
        <div className={`w-24 h-24 bg-black/50 blur-xl rounded-full`} />
      </div>

      <motion.div
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        animate={{ 
          scale: isSelected ? 1.1 : 1,
          borderColor: isSelected ? 'rgba(255,255,255,0.9)' : '',
        }}
        className={`
          relative flex items-center justify-center backdrop-blur-md transition-all duration-500
          ${isUltimate ? 'w-20 h-20' : 'w-14 h-14'}
          ${isUnlocked 
            ? `${THEME_COLORS[theme]?.bg || 'bg-cyan-950'}/80 ${THEME_COLORS[theme]?.border || 'border-cyan-500'} border-2 shadow-[0_0_20px_rgba(34,211,238,0.3)]` 
            : isReachable 
              ? 'bg-slate-900/80 border-slate-600 border border-dashed hover:border-white/50' 
              : 'bg-black/60 border-slate-800 border opacity-60 grayscale'}
          clip-path-hexagon
        `}
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
        }}
      >
        {/* Hexagon Border Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        
        {/* Icon */}
        <Icon 
          className={`
            relative z-10 transition-colors duration-300
            ${isUltimate ? 'w-8 h-8' : 'w-6 h-6'}
            ${isUnlocked 
              ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' 
              : isReachable ? 'text-white/70' : 'text-slate-600'}
          `} 
        />

        {/* Lock Icon Overlay */}
        {!isUnlocked && !isReachable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
            <Lock className="w-3 h-3 text-slate-500" />
          </div>
        )}
      </motion.div>

      {/* Label Tag */}
      <AnimatePresence>
        {(isSelected || isUnlocked) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className={`
              absolute top-full mt-3 left-1/2 -translate-x-1/2 
              whitespace-nowrap px-3 py-1 rounded-sm border-l-2 
              bg-black/80 backdrop-blur-sm
              ${THEME_COLORS[theme]?.border || 'border-cyan-500'}
            `}
          >
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
              {node.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CircuitLine = ({ start, end, active, theme }) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Background Track */}
      <path 
        d={`M${start.x} ${start.y} L${end.x} ${end.y}`} 
        stroke={active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"} 
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Active Circuit */}
      <path 
        d={`M${start.x} ${start.y} L${end.x} ${end.y}`} 
        stroke={active ? (theme === 'purple' ? '#a855f7' : theme === 'emerald' ? '#10b981' : '#22d3ee') : "#334155"} 
        strokeWidth={active ? "2" : "1"}
        strokeDasharray={active ? "none" : "4 4"}
        fill="none"
        filter="url(#glow)"
        className="transition-all duration-700"
      />

      {/* Data Packet Animation */}
      {active && (
        <circle r="3" fill="white">
          <animateMotion 
            dur={`${Math.random() * 2 + 1}s`}
            repeatCount="indefinite"
            path={`M${start.x} ${start.y} L${end.x} ${end.y}`} 
          />
        </circle>
      )}
    </svg>
  );
};

export default function SkillTreeSystem({ genre }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [unlockedNodes, setUnlockedNodes] = useState(['core']); 
  const [skillPoints, setSkillPoints] = useState(genre?.skillPoints || 0);
  const containerRef = useRef(null);

  // Derive data
  const skillKey = genre?.id || (genre?.short ? genre.short.toLowerCase() : 'default');
  const treeData = SKILL_DATA[skillKey] || SKILL_DATA.default;
  const themeKey = treeData.color || 'cyan';
  const theme = THEME_COLORS[themeKey];

  const nodes = treeData.nodes;

  const isNodeReachable = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node.parent) return true;
    return unlockedNodes.includes(node.parent);
  };

  const handleUnlock = () => {
    if (!selectedNode) return;
    if (skillPoints >= selectedNode.cost && isNodeReachable(selectedNode.id)) {
      setUnlockedNodes([...unlockedNodes, selectedNode.id]);
      setSkillPoints(prev => prev - selectedNode.cost);
    }
  };

  // Calculate coordinates for SVG lines based on percentage
  const getCoords = (node) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    return { x: (node.x / 100) * w, y: (node.y / 100) * h };
  };

  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        setDimensions({ 
          w: containerRef.current.clientWidth, 
          h: containerRef.current.clientHeight 
        });
      }
    };
    window.addEventListener('resize', updateDims);
    updateDims();
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  return (
    <div className="w-full relative min-h-[700px] flex flex-col md:flex-row gap-6 p-6">
      
      {/* --- LEFT: SKILL TREE VISUALIZER --- */}
      <div className="flex-1 relative rounded-3xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl backdrop-blur-sm group">
        
        {/* Animated Grid Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
        </div>
        
        {/* Ambient Glow */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-${themeKey}-500/10 blur-[100px] rounded-full pointer-events-none`} />

        {/* Tree Header */}
        <div className="absolute top-6 left-6 z-30 pointer-events-none">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-8 bg-gradient-to-b ${theme.grad}`} />
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-none">{treeData.name}</h2>
              <p className={`text-xs font-bold uppercase tracking-widest ${theme.main} opacity-80`}>{treeData.class} SYSTEM</p>
            </div>
          </div>
        </div>

        {/* Points Counter */}
        <div className="absolute top-6 right-6 z-30">
          <div className="flex items-center gap-3 px-4 py-2 bg-black/60 border border-white/10 rounded-full backdrop-blur-md">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Available Points</span>
            <div className={`text-xl font-mono font-bold ${theme.main}`}>{skillPoints}</div>
          </div>
        </div>

        {/* Interactive Tree Area */}
        <div ref={containerRef} className="absolute inset-0 top-20 z-10">
          {/* Render Connections */}
          {dimensions.w > 0 && nodes.map(node => {
            if (!node.parent) return null;
            const parent = nodes.find(n => n.id === node.parent);
            if (!parent) return null;
            
            const start = { x: (parent.x / 100) * dimensions.w, y: (parent.y / 100) * dimensions.h };
            const end = { x: (node.x / 100) * dimensions.w, y: (node.y / 100) * dimensions.h };
            const active = unlockedNodes.includes(node.id);

            return (
              <CircuitLine 
                key={`conn-${node.id}`} 
                start={start} 
                end={end} 
                active={active} 
                theme={themeKey}
              />
            );
          })}

          {/* Render Nodes */}
          {nodes.map(node => (
            <HexNode 
              key={node.id}
              node={node}
              theme={themeKey}
              onClick={setSelectedNode}
              isSelected={selectedNode?.id === node.id}
              isUnlocked={unlockedNodes.includes(node.id)}
              isReachable={isNodeReachable(node.id)}
            />
          ))}
        </div>
      </div>

      {/* --- RIGHT: INSPECTOR PANEL (HUD STYLE) --- */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedNode ? selectedNode.id : 'empty'}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full md:w-[350px] flex-shrink-0 flex flex-col gap-4"
        >
          {selectedNode ? (
            <div className="h-full bg-black/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden flex flex-col shadow-2xl">
              
              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.grad}`} />

              {/* Icon & Status Header */}
              <div className="flex items-start justify-between mb-6">
                <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center bg-black/50 shadow-lg ${unlockedNodes.includes(selectedNode.id) ? theme.border : 'border-white/10'}`}>
                  {React.createElement(selectedNode.icon, { 
                    className: `w-8 h-8 ${unlockedNodes.includes(selectedNode.id) ? theme.main : 'text-white/40'}` 
                  })}
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={`mb-1 uppercase tracking-widest text-[9px] ${unlockedNodes.includes(selectedNode.id) ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {unlockedNodes.includes(selectedNode.id) ? 'INSTALLED' : 'AVAILABLE'}
                  </Badge>
                  <div className="text-[10px] text-white/30 font-mono">ID: {selectedNode.id.toUpperCase()}_v.2.4</div>
                </div>
              </div>

              {/* Title & Desc */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{selectedNode.label}</h3>
                <div className="h-px w-12 bg-white/20 mb-4" />
                <p className="text-sm text-slate-300 leading-relaxed font-light border-l-2 border-white/10 pl-3">
                  {selectedNode.desc}
                </p>
              </div>

              {/* Stats / Impact Visualization */}
              <div className="mb-auto space-y-3">
                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  Performance Delta
                </h4>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">System Load</span>
                    <span className="text-white">Low</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Efficiency</span>
                    <span className={theme.main}>+15.4%</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: '75%' }} 
                      className={`h-full bg-gradient-to-r ${theme.grad}`} 
                    />
                  </div>
                </div>
              </div>

              {/* Action Button Area */}
              <div className="pt-6 mt-6 border-t border-white/10 relative z-10">
                {unlockedNodes.includes(selectedNode.id) ? (
                  <div className="w-full py-4 rounded-xl bg-green-500/5 border border-green-500/20 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-green-400 tracking-widest uppercase">Protocol Active</span>
                  </div>
                ) : (
                  <Button 
                    className={`w-full py-6 text-sm font-bold tracking-widest uppercase transition-all duration-300 relative overflow-hidden group
                      ${skillPoints >= selectedNode.cost && isNodeReachable(selectedNode.id)
                        ? `bg-white text-black hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]`
                        : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'}
                    `}
                    onClick={handleUnlock}
                    disabled={skillPoints < selectedNode.cost || !isNodeReachable(selectedNode.id)}
                  >
                    {/* Hover Shine Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                    
                    <span className="relative flex items-center gap-2">
                      {skillPoints < selectedNode.cost 
                        ? <><AlertCircle className="w-4 h-4" /> INSUFFICIENT DATA</> 
                        : !isNodeReachable(selectedNode.id) 
                          ? <><Lock className="w-4 h-4" /> PATHWAY LOCKED</>
                          : <><Unlock className="w-4 h-4" /> INITIALIZE (-{selectedNode.cost} SP)</>
                      }
                    </span>
                  </Button>
                )}
              </div>

            </div>
          ) : (
            // Empty State
            <div className="h-full bg-black/40 border border-white/5 rounded-3xl flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm border-dashed">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                <Brain className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-lg font-bold text-white/60 mb-2">AWAITING INPUT</h3>
              <p className="text-xs text-white/30 max-w-[200px] leading-relaxed">
                Select a neural node from the matrix to view parameters and initialize upgrade protocols.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}