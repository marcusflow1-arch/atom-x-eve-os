import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Zap, Shield, Crosshair, Eye, Navigation, 
  Cpu, Activity, Lock, Unlock, Check, ChevronRight,
  Target, Swords, Heart, Ghost, Flame, Anchor, 
  Search, Settings, RotateCcw, MousePointer2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// --- CONSTANTS & THEMES ---

const NODE_SIZE = 44; // px
const LARGE_NODE_SIZE = 64; // px

const THEMES = {
  mmorpg: { 
    primary: '#a855f7', // Purple
    secondary: '#d8b4fe',
    bg: 'from-purple-950/50 to-slate-950',
    line: '#6b21a8'
  },
  shooter: { 
    primary: '#10b981', // Emerald
    secondary: '#6ee7b7',
    bg: 'from-emerald-950/50 to-slate-950',
    line: '#059669'
  },
  default: { 
    primary: '#0ea5e9', // Sky/Cyan
    secondary: '#7dd3fc',
    bg: 'from-sky-950/50 to-slate-950',
    line: '#0284c7'
  }
};

// --- SOPHISTICATED MOCK DATA GENERATOR ---
// Generates a complex tree structure: Root -> 3 Branches -> Sub-branches
const generateTreeData = (genreId) => {
  const rootId = 'root';
  const branchIds = ['offense', 'defense', 'utility'];
  
  // Base Nodes
  const nodes = [
    { 
      id: rootId, 
      x: 8, y: 50, 
      label: 'Core Matrix', 
      icon: Brain, 
      type: 'root', 
      cost: 0, 
      desc: 'The central processing unit for all AI behaviors.' 
    }
  ];

  // Branch Configs
  const branches = [
    { id: 'offense', label: 'Aggression', icon: Swords, y: 20, color: 'red' },
    { id: 'utility', label: 'Tactics', icon: Cpu, y: 50, color: 'blue' },
    { id: 'defense', label: 'Survival', icon: Shield, y: 80, color: 'green' }
  ];

  branches.forEach(branch => {
    // 1. Major Branch Start Node
    nodes.push({
      id: branch.id,
      x: 25, y: branch.y,
      parent: rootId,
      label: branch.label,
      icon: branch.icon,
      type: 'major',
      cost: 1,
      desc: `Initializes the ${branch.label} protocol submodule.`
    });

    // 2. Linear Path (3 small nodes)
    let lastId = branch.id;
    for (let i = 1; i <= 3; i++) {
      const nodeId = `${branch.id}_t1_${i}`;
      nodes.push({
        id: nodeId,
        x: 25 + (i * 10), // Spaced out horizontally
        y: branch.y,
        parent: lastId,
        label: `${branch.label} ${i}`,
        icon: Activity,
        type: 'minor',
        cost: 1,
        desc: `Tier 1 enhancement for ${branch.label} systems.`
      });
      lastId = nodeId;
    }

    // 3. Mid-Tree Major Node
    const midMajorId = `${branch.id}_major`;
    nodes.push({
      id: midMajorId,
      x: 60, y: branch.y,
      parent: lastId,
      label: `Advanced ${branch.label}`,
      icon: Zap,
      type: 'major',
      cost: 3,
      desc: `Unlocks advanced capabilities in the ${branch.label} tree.`
    });

    // 4. Split Paths (2 sub-branches)
    const subY1 = branch.y - 8;
    const subY2 = branch.y + 8;
    
    // Sub Path 1
    nodes.push({
      id: `${branch.id}_sub1`,
      x: 75, y: subY1,
      parent: midMajorId,
      label: 'Specialization A',
      icon: Target,
      type: 'minor',
      cost: 2,
      desc: 'Specialized behavior modification.'
    });

    // Sub Path 2
    nodes.push({
      id: `${branch.id}_sub2`,
      x: 75, y: subY2,
      parent: midMajorId,
      label: 'Specialization B',
      icon: Anchor,
      type: 'minor',
      cost: 2,
      desc: 'Specialized behavior modification.'
    });

    // 5. Ultimate Node (Reconverge)
    nodes.push({
      id: `${branch.id}_ultimate`,
      x: 90, y: branch.y,
      parents: [`${branch.id}_sub1`, `${branch.id}_sub2`], // Multiple parents logic handled in lines
      parent: `${branch.id}_sub1`, // Main parent for traversal logic
      label: `${branch.label} Mastery`,
      icon: branch.id === 'offense' ? Flame : branch.id === 'defense' ? Heart : Ghost,
      type: 'ultimate',
      cost: 5,
      desc: `Mastery level protocol for ${branch.label}. Maximum efficiency.`
    });
  });

  return nodes;
};

// --- SVG CONNECTION LAYER (curved, energy-flow style) ---
const ConnectionLines = ({ nodes, unlockedNodes, theme }) => {
  const curve = (p, n) => {
    const mx = (p.x + n.x) / 2;
    return `M ${p.x} ${p.y} C ${mx} ${p.y}, ${mx} ${n.y}, ${n.x} ${n.y}`;
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      {nodes.map(node => {
        const parentIds = node.parents || (node.parent ? [node.parent] : []);
        return parentIds.map(parentId => {
          const parent = nodes.find(n => n.id === parentId);
          if (!parent) return null;
          const isUnlocked = unlockedNodes.includes(node.id) && unlockedNodes.includes(parent.id);
          const isReachable = unlockedNodes.includes(parent.id);
          const d = curve(parent, node);

          return (
            <g key={`${parent.id}-${node.id}`}>
              {/* Track */}
              <path d={d} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              {/* Live conduit */}
              <path
                d={d}
                fill="none"
                stroke={isUnlocked ? theme.secondary : isReachable ? 'rgba(255,255,255,0.30)' : 'transparent'}
                strokeWidth={isUnlocked ? 2.5 : 2}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className="transition-all duration-500"
                style={isUnlocked ? { filter: `drop-shadow(0 0 4px ${theme.primary})` } : undefined}
              />
              {/* Flowing energy dashes on active paths */}
              {isUnlocked && (
                <path d={d} fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 9" vectorEffect="non-scaling-stroke" opacity="0.85">
                  <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1.1s" repeatCount="indefinite" />
                </path>
              )}
            </g>
          );
        });
      })}
    </svg>
  );
};

// --- NODE COMPONENT ---
const SkillNode = ({ node, status, isSelected, onClick, theme }) => {
  const Icon = node.icon;
  const isRoot = node.type === 'root';
  const isUltimate = node.type === 'ultimate';
  const isMajor = node.type === 'major' || isRoot || isUltimate;
  
  const size = isMajor ? LARGE_NODE_SIZE : NODE_SIZE;
  const iconSize = isMajor ? 32 : 20;

  // Visual States
  const variants = {
    locked: { scale: 1, opacity: 0.5, grayscale: 1 },
    reachable: { scale: 1, opacity: 0.8, grayscale: 0.5 },
    unlocked: { scale: 1, opacity: 1, grayscale: 0 },
    selected: { scale: 1.15, zIndex: 10 }
  };

  const statusColor = 
    status === 'unlocked' ? theme.primary : 
    status === 'reachable' ? '#94a3b8' : // Slate 400
    '#334155'; // Slate 700

  const glowColor = status === 'unlocked' ? theme.primary : 'transparent';

  return (
    <div 
      className="group absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
      style={{ left: `${node.x}%`, top: `${node.y}%`, width: size, height: size, zIndex: isSelected ? 50 : 10 }}
      onClick={() => onClick(node)}
    >
      {/* Halo for unlocked nodes */}
      {status === 'unlocked' && (
        <div className="absolute -inset-3 rounded-full blur-xl pointer-events-none" style={{ background: `${theme.primary}40` }} />
      )}

      {/* Selection Ring (Outer) */}
      {isSelected && (
        <motion.div 
          layoutId="selection-ring"
          className="absolute -inset-2 rounded-full border-2 border-white/80"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Main Node Circle */}
      <motion.div
        variants={variants}
        initial="locked"
        animate={isSelected ? 'selected' : status}
        whileHover={{ scale: 1.1 }}
        className={cn(
          "relative flex items-center justify-center rounded-full border-2 transition-colors duration-300 shadow-xl"
        )}
        style={{ 
          width: '100%', 
          height: '100%',
          background: status === 'unlocked' ? `linear-gradient(160deg, ${theme.primary}33, rgba(2,6,16,0.85))` : 'rgba(2,6,16,0.72)',
          backdropFilter: 'blur(10px)',
          borderColor: status === 'locked' ? 'rgba(255,255,255,0.10)' : statusColor,
          boxShadow: status === 'unlocked' ? `0 0 22px ${glowColor}70, inset 0 1px 0 rgba(255,255,255,0.15)` : 'inset 0 1px 0 rgba(255,255,255,0.06)'
        }}
      >
        {/* Fill Background for Unlocked */}
        {status === 'unlocked' && (
          <div 
            className="absolute inset-1 rounded-full opacity-20"
            style={{ backgroundColor: theme.primary }}
          />
        )}

        {/* Inner Ring for Major/Ultimate */}
        {isMajor && (
          <div className="absolute inset-1 rounded-full border border-white/10" />
        )}

        {/* Icon */}
        <Icon 
          size={iconSize} 
          color={status === 'unlocked' ? '#fff' : status === 'reachable' ? '#cbd5e1' : '#475569'}
          strokeWidth={isMajor ? 2 : 1.5}
        />
        
        {/* Tiny Lock Icon for Locked State */}
        {status === 'locked' && (
          <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1 border border-slate-700">
            <Lock size={10} className="text-slate-500" />
          </div>
        )}

        {/* Level/Cost Badge */}
        {!isRoot && status !== 'locked' && (
          <div className="absolute -top-2 -right-2 bg-slate-900 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full border border-white/20">
            {node.cost}
          </div>
        )}
      </motion.div>

      {/* Label Tooltip (Always visible if selected, or on hover) */}
      <div className={cn(
        "absolute top-full mt-3 whitespace-nowrap px-3 py-1.5 rounded bg-slate-900/90 border border-slate-700 backdrop-blur-md transition-all duration-200 pointer-events-none",
        isSelected ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
      )}>
        <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">{node.label}</span>
      </div>
    </div>
  );
};


// --- MAIN COMPONENT ---
export default function SkillTreeSystem({ genre }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [unlockedNodes, setUnlockedNodes] = useState(['root']);
  const [skillPoints, setSkillPoints] = useState(genre?.skillPoints || 0);
  const [nodes, setNodes] = useState([]);

  const theme = THEMES[genre?.id] || THEMES.default;

  useEffect(() => {
    setNodes(generateTreeData(genre?.id));
    setSelectedNode(null);
  }, [genre]);

  const getNodeStatus = (node) => {
    if (unlockedNodes.includes(node.id)) return 'unlocked';
    const parentIds = node.parents || (node.parent ? [node.parent] : []);
    const isReachable = parentIds.some(pid => unlockedNodes.includes(pid));
    return isReachable ? 'reachable' : 'locked';
  };

  const handleNodeClick = (node) => setSelectedNode(node);

  const handleUnlock = () => {
    if (!selectedNode) return;
    const status = getNodeStatus(selectedNode);
    if (status === 'reachable' && skillPoints >= selectedNode.cost) {
      setUnlockedNodes(prev => [...prev, selectedNode.id]);
      setSkillPoints(prev => prev - selectedNode.cost);
    }
  };

  return (
    <div className="w-full relative font-sans selection:bg-cyan-500/30">

      {/* --- HUD BAR --- */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase drop-shadow-lg">
            {genre?.name || 'SYSTEM'} <span style={{ color: theme.primary }}>TREE</span>
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="bg-slate-900/50 border-white/10 text-xs text-slate-400 font-mono">
              {unlockedNodes.length} / {nodes.length} NODES
            </Badge>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">SP</span>
              <span className="text-xl font-black text-white" style={{ textShadow: `0 0 15px ${theme.primary}50` }}>{skillPoints}</span>
              <div onClick={() => { setUnlockedNodes(['root']); setSkillPoints(genre?.skillPoints || 10); }}
                   className="cursor-pointer p-1.5 rounded-full hover:bg-white/5 transition-colors group ml-1"
                   title="Reset Tree">
                <RotateCcw className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        </div>
        {!selectedNode && (
          <div className="flex items-center gap-2 text-slate-500 opacity-60">
            <MousePointer2 className="w-5 h-5 animate-bounce" />
            <span className="text-xs font-mono uppercase tracking-wider">Click a node</span>
          </div>
        )}
      </div>

      {/* --- TREE + INSPECTOR SIDE-BY-SIDE --- */}
      <div className="flex flex-col md:flex-row gap-4">

        {/* --- MAIN TREE AREA (contained, no scroll needed) --- */}
        <div
          className="relative flex-1 rounded-2xl overflow-hidden"
          style={{
            background: `radial-gradient(circle at 12% 50%, ${theme.primary}18, transparent 55%), rgba(148,163,184,0.05)`,
            backdropFilter: 'blur(26px) saturate(160%)',
            WebkitBackdropFilter: 'blur(26px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 16px 50px rgba(0,0,0,0.4)',
            aspectRatio: '16 / 9',
            minHeight: '400px',
          }}
        >
          {/* Blueprint grid backdrop */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              maskImage: 'radial-gradient(circle at 50% 50%, black 45%, transparent 88%)',
              WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 45%, transparent 88%)',
            }}
          />
          <div className="pointer-events-none absolute inset-[1px] rounded-[15px] border border-white/[0.05]" />
          <ConnectionLines nodes={nodes} unlockedNodes={unlockedNodes} theme={theme} />
          {nodes.map(node => (
            <SkillNode
              key={node.id}
              node={node}
              status={getNodeStatus(node)}
              isSelected={selectedNode?.id === node.id}
              onClick={handleNodeClick}
              theme={theme}
            />
          ))}
        </div>

        {/* --- RIGHT SIDEBAR: INSPECTOR --- */}
        <AnimatePresence mode="wait">
          {selectedNode && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full md:w-80 lg:w-96 flex-shrink-0 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col shadow-2xl"
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg"
                  style={{
                    borderColor: unlockedNodes.includes(selectedNode.id) ? theme.primary : '#334155',
                    backgroundColor: unlockedNodes.includes(selectedNode.id) ? `${theme.primary}20` : '#0f172a'
                  }}
                >
                  {React.createElement(selectedNode.icon, {
                    size: 32,
                    color: unlockedNodes.includes(selectedNode.id) ? theme.primary : '#94a3b8'
                  })}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-white">
                  <ChevronRight />
                </Button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-white/10 hover:bg-white/10 text-white border-none uppercase tracking-wider text-[10px] px-2 py-0.5">
                    {selectedNode.type} NODE
                  </Badge>
                  {unlockedNodes.includes(selectedNode.id) && (
                    <Badge className="bg-green-500/20 text-green-400 border-none uppercase tracking-wider text-[10px] px-2 py-0.5">Active</Badge>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 leading-tight">{selectedNode.label}</h3>
                <div className="space-y-4">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1.5">Description</h4>
                    <p className="text-slate-200 text-sm leading-relaxed">{selectedNode.desc}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1.5">Effect Analysis</h4>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-300">Power Output</span>
                      <span className="text-white font-mono font-bold">+12%</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-[60%]" style={{ backgroundColor: theme.primary }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 mt-4">
                {unlockedNodes.includes(selectedNode.id) ? (
                  <div className="w-full py-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-sm cursor-default">
                    <Check className="w-4 h-4" /> System Online
                  </div>
                ) : (
                  <Button
                    className={cn(
                      "w-full py-5 text-sm font-bold uppercase tracking-widest transition-all",
                      getNodeStatus(selectedNode) === 'reachable' && skillPoints >= selectedNode.cost
                        ? "hover:opacity-90 text-white shadow-lg"
                        : "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500"
                    )}
                    style={{ backgroundColor: getNodeStatus(selectedNode) === 'reachable' && skillPoints >= selectedNode.cost ? theme.primary : undefined }}
                    onClick={handleUnlock}
                    disabled={getNodeStatus(selectedNode) !== 'reachable' || skillPoints < selectedNode.cost}
                  >
                    {getNodeStatus(selectedNode) !== 'reachable'
                      ? <><Lock className="w-4 h-4 mr-2" /> Locked</>
                      : skillPoints < selectedNode.cost
                        ? <><Target className="w-4 h-4 mr-2" /> Insufficient Points</>
                        : <><Unlock className="w-4 h-4 mr-2" /> Unlock ({selectedNode.cost} SP)</>
                    }
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}