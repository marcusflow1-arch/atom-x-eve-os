import React, { useState, useEffect, useRef, useMemo } from 'react';
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

// --- SVG CONNECTION LAYER ---
const ConnectionLines = ({ nodes, unlockedNodes, theme }) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      {nodes.map(node => {
        // Handle multiple parents if they exist (for reconverging paths), otherwise single parent
        const parentIds = node.parents || (node.parent ? [node.parent] : []);
        
        return parentIds.map(parentId => {
          const parent = nodes.find(n => n.id === parentId);
          if (!parent) return null;

          const isUnlocked = unlockedNodes.includes(node.id) && unlockedNodes.includes(parent.id);
          const isReachable = unlockedNodes.includes(parent.id);

          return (
            <g key={`${parent.id}-${node.id}`}>
              {/* Background Line (Inactive) */}
              <line 
                x1={`${parent.x}%`} y1={`${parent.y}%`} 
                x2={`${node.x}%`} y2={`${node.y}%`} 
                stroke="#334155" 
                strokeWidth="2"
                strokeOpacity="0.5"
              />
              
              {/* Active/Reachable Line */}
              <line 
                x1={`${parent.x}%`} y1={`${parent.y}%`} 
                x2={`${node.x}%`} y2={`${node.y}%`} 
                stroke={isUnlocked ? theme.secondary : isReachable ? '#64748b' : 'transparent'} 
                strokeWidth={isUnlocked ? "3" : "2"}
                strokeOpacity={isUnlocked ? "1" : "0.5"}
                className="transition-all duration-500"
              />
              
              {/* Animated Pulse for Unlocked Paths */}
              {isUnlocked && (
                <circle r="3" fill="white">
                  <animateMotion 
                    dur="3s" 
                    repeatCount="indefinite"
                    path={`M${parent.x * 10},${parent.y * 5} L${node.x * 10},${node.y * 5}`} // Note: SVG coordinate scaling might be needed depending on viewBox, but for % lines usually animateMotion needs explicit path data matching the line
                    // Simplified: We'll skip complex animateMotion on % coords without a proper viewBox transform or use CSS animations on the stroke
                  />
                </circle>
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
      className="absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
      style={{ left: `${node.x}%`, top: `${node.y}%`, width: size, height: size, zIndex: isSelected ? 50 : 10 }}
      onClick={() => onClick(node)}
    >
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
          "relative flex items-center justify-center rounded-full border-2 transition-colors duration-300",
          "bg-slate-950 shadow-xl"
        )}
        style={{ 
          width: '100%', 
          height: '100%',
          borderColor: status === 'locked' ? '#334155' : statusColor,
          boxShadow: status === 'unlocked' ? `0 0 15px ${glowColor}60` : 'none'
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
  // Drag-pan state
  const viewportRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStateRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 }
  });

  // Theme Resolution
  const theme = THEMES[genre?.id] || THEMES.default;

  // Initialize Data
  useEffect(() => {
    setNodes(generateTreeData(genre?.id));
    setSelectedNode(null); // Reset selection on genre change
  }, [genre]);

  // Compute pan bounds based on viewport size and virtual canvas
  const recomputePanBounds = () => {
    const el = viewportRef.current;
    if (!el) return;
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    const contentW = vw * (CONTENT_W / 100);
    const contentH = vh * (CONTENT_H / 100);
    const maxX = 0; // cannot pan beyond left/top
    const maxY = 0;
    const minX = Math.min(0, vw - contentW);
    const minY = Math.min(0, vh - contentH);
    panStateRef.current.bounds = { minX, maxX, minY, maxY };
    setPan((p) => ({
      x: Math.max(minX, Math.min(maxX, p.x)),
      y: Math.max(minY, Math.min(maxY, p.y)),
    }));
  };

  useEffect(() => {
    recomputePanBounds();
    window.addEventListener('resize', recomputePanBounds);
    return () => window.removeEventListener('resize', recomputePanBounds);
  }, [selectedNode]);

  // Drag handlers
  const onPanStart = (e) => {
    e.preventDefault();
    const ps = panStateRef.current;
    ps.isDown = true;
    ps.startX = e.clientX;
    ps.startY = e.clientY;
    ps.startPanX = pan.x;
    ps.startPanY = pan.y;
  };
  const onPanMove = (e) => {
    const ps = panStateRef.current;
    if (!ps.isDown) return;
    const dx = e.clientX - ps.startX;
    const dy = e.clientY - ps.startY;
    const nx = Math.max(ps.bounds.minX, Math.min(ps.bounds.maxX, ps.startPanX + dx));
    const ny = Math.max(ps.bounds.minY, Math.min(ps.bounds.maxY, ps.startPanY + dy));
    setPan({ x: nx, y: ny });
  };
  const onPanEnd = () => {
    panStateRef.current.isDown = false;
  };

  // Determine Node Status
  const getNodeStatus = (node) => {
    if (unlockedNodes.includes(node.id)) return 'unlocked';
    
    // Check if any parent is unlocked
    const parentIds = node.parents || (node.parent ? [node.parent] : []);
    const isReachable = parentIds.some(pid => unlockedNodes.includes(pid));
    
    return isReachable ? 'reachable' : 'locked';
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handleUnlock = () => {
    if (!selectedNode) return;
    const status = getNodeStatus(selectedNode);
    
    if (status === 'reachable' && skillPoints >= selectedNode.cost) {
      setUnlockedNodes(prev => [...prev, selectedNode.id]);
      setSkillPoints(prev => prev - selectedNode.cost);
    }
  };

  return (
    <div className="w-full relative flex flex-col md:flex-row font-sans selection:bg-cyan-500/30">
      


      {/* --- TOP LEFT: HUD --- */}
      <div className="absolute top-6 left-6 z-40 flex flex-col gap-4 pointer-events-none">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase drop-shadow-lg">
            {genre?.name || 'SYSTEM'} <span style={{ color: theme.primary }}>TREE</span>
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="bg-slate-900/50 border-white/10 text-xs text-slate-400 font-mono">
              V.3.0.1
            </Badge>
            <Badge variant="outline" className="bg-slate-900/50 border-white/10 text-xs text-slate-400 font-mono">
              {unlockedNodes.length} / {nodes.length} NODES ACTIVE
            </Badge>
          </div>
        </div>
      </div>

      {/* --- BOTTOM LEFT: POINTS COUNTER --- */}
      <div className="absolute bottom-6 left-6 z-40 pointer-events-auto">
         <div className="flex flex-col items-start gap-1">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Class Points</div>
            <div className="flex items-center gap-3">
               <div className="text-5xl font-black text-white leading-none tracking-tighter" style={{ textShadow: `0 0 20px ${theme.primary}50` }}>
                 {skillPoints}
               </div>
               <div onClick={() => { setUnlockedNodes(['root']); setSkillPoints(genre?.skillPoints || 10); }} 
                    className="cursor-pointer p-2 rounded-full hover:bg-white/5 transition-colors group" 
                    title="Reset Tree">
                  <RotateCcw className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
               </div>
            </div>
         </div>
      </div>

      {/* --- MAIN INTERACTIVE AREA --- */}
      <div className={cn("relative flex-1 w-full h-[clamp(420px,60vh,720px)] overflow-hidden cursor-grab active:cursor-grabbing", selectedNode ? "md:pr-96" : "")}>
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
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute top-0 right-0 h-full w-full md:w-96 bg-slate-900/90 backdrop-blur-xl border-l border-white/10 z-50 p-8 flex flex-col shadow-2xl"
          >
            {/* Header / Icon */}
            <div className="flex items-start justify-between mb-8">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center border-2 shadow-lg"
                style={{ 
                  borderColor: unlockedNodes.includes(selectedNode.id) ? theme.primary : '#334155',
                  backgroundColor: unlockedNodes.includes(selectedNode.id) ? `${theme.primary}20` : '#0f172a'
                }}
              >
                {React.createElement(selectedNode.icon, { 
                  size: 40, 
                  color: unlockedNodes.includes(selectedNode.id) ? theme.primary : '#94a3b8' 
                })}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedNode(null)} 
                className="text-slate-500 hover:text-white"
              >
                <ChevronRight />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                 <Badge className="bg-white/10 hover:bg-white/10 text-white border-none uppercase tracking-wider text-[10px] px-2 py-0.5">
                   {selectedNode.type} NODE
                 </Badge>
                 {unlockedNodes.includes(selectedNode.id) && (
                   <Badge className="bg-green-500/20 text-green-400 border-none uppercase tracking-wider text-[10px] px-2 py-0.5">
                     Active
                   </Badge>
                 )}
              </div>
              
              <h3 className="text-3xl font-bold text-white mb-6 leading-tight">{selectedNode.label}</h3>
              
              <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Description</h4>
                  <p className="text-slate-200 text-sm leading-relaxed">
                    {selectedNode.desc}
                  </p>
                </div>

                <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Effect Analysis</h4>
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

            {/* Footer Action */}
            <div className="pt-6 border-t border-white/10">
              {unlockedNodes.includes(selectedNode.id) ? (
                 <div className="w-full py-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-sm cursor-default">
                    <Check className="w-4 h-4" /> System Online
                 </div>
              ) : (
                <Button 
                  className={cn(
                    "w-full py-6 text-sm font-bold uppercase tracking-widest transition-all",
                    getNodeStatus(selectedNode) === 'reachable' && skillPoints >= selectedNode.cost
                      ? "hover:opacity-90 text-white shadow-lg" 
                      : "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500"
                  )}
                  style={{
                    backgroundColor: getNodeStatus(selectedNode) === 'reachable' && skillPoints >= selectedNode.cost ? theme.primary : undefined
                  }}
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

      {/* No Selection Prompt */}
      {!selectedNode && (
         <div className="absolute top-1/2 right-12 transform -translate-y-1/2 text-right pointer-events-none opacity-50">
            <MousePointer2 className="w-12 h-12 text-slate-600 ml-auto mb-4 animate-bounce" />
            <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">Select a node<br/>to inspect details</p>
         </div>
      )}

    </div>
  );
}