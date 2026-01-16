import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { X, Zap, Sparkles, Shield, TrendingUp, Bolt, Flame, Brain, Eye, Wind, Lock, Check, Filter, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Power Tree - Raw stat increases and combat effectiveness
// Updated to strict grid layout for alignment and visibility
// Added perk definitions
const POWER_TREE_NODES = [
  { 
    id: 'power_root', name: 'Core Activation', description: 'Unlock the card\'s latent power potential.', type: 'core', cost: 0, tier: 0, offsetX: 0, offsetY: 0,
    perks: [{name: 'Base Energy', icon: 'zap'}, {name: 'Starter Kit', icon: 'box'}]
  },
  { 
    id: 'power_atk1', name: 'Attack Boost I', description: 'Increase base attack power by 10%.', type: 'stat', cost: 100, tier: 1, branch: 'left', offsetX: -80, offsetY: 80, parent: 'power_root',
    perks: [{name: '+2% Dmg', icon: 'sword'}, {name: 'Sharpness', icon: 'triangle'}]
  },
  { 
    id: 'power_def1', name: 'Defense Boost I', description: 'Increase base defense by 10%.', type: 'stat', cost: 100, tier: 1, branch: 'right', offsetX: 80, offsetY: 80, parent: 'power_root',
    perks: [{name: '+2% Armor', icon: 'shield'}, {name: 'Hardened', icon: 'square'}]
  },
  { 
    id: 'power_crit', name: 'Critical Strike', description: 'Gain 15% critical hit chance.', type: 'ability', cost: 250, tier: 2, branch: 'left', offsetX: -80, offsetY: 160, parent: 'power_atk1',
    perks: [{name: '+5% Crit Dmg', icon: 'target'}, {name: 'Precision', icon: 'eye'}]
  },
  { 
    id: 'power_res', name: 'Resilience', description: 'Reduce all incoming damage by 8%.', type: 'ability', cost: 250, tier: 2, branch: 'right', offsetX: 80, offsetY: 160, parent: 'power_def1',
    perks: [{name: '+5% HP', icon: 'heart'}, {name: 'Recovery', icon: 'plus'}]
  },
  { 
    id: 'power_atk2', name: 'Attack Boost II', description: 'Increase attack power by additional 20%.', type: 'stat', cost: 500, tier: 3, branch: 'left', offsetX: -80, offsetY: 240, parent: 'power_crit',
    perks: [{name: 'Power Surge', icon: 'zap'}, {name: 'Force', icon: 'hammer'}]
  },
  { 
    id: 'power_def2', name: 'Defense Boost II', description: 'Increase defense by additional 20%.', type: 'stat', cost: 500, tier: 3, branch: 'right', offsetX: 80, offsetY: 240, parent: 'power_res',
    perks: [{name: 'Iron Skin', icon: 'hexagon'}, {name: 'Barrier', icon: 'circle'}]
  },
  { 
    id: 'power_ult', name: 'Overwhelming Force', description: 'Ultimate: All stats increased by 25%. Abilities deal 50% more damage.', type: 'ultimate', cost: 1000, tier: 4, offsetX: 0, offsetY: 320, parent: ['power_atk2', 'power_def2'],
    perks: [{name: 'God Mode', icon: 'crown'}, {name: 'Omnipotence', icon: 'star'}]
  },
];

// AI Adaptation Tree - Behavioral changes and versatility
// Updated to strict grid layout for alignment
const AI_TREE_NODES = [
  { 
    id: 'ai_root', name: 'Neural Link', description: 'Establish connection with AI adaptation systems.', type: 'core', cost: 0, tier: 0, offsetX: 0, offsetY: 0,
    perks: [{name: 'Sync', icon: 'wifi'}, {name: 'Backup', icon: 'save'}]
  },
  { 
    id: 'ai_morph', name: 'Ability Morph', description: 'Force Push becomes Armor Strip - removes enemy defenses instead of knockback.', type: 'transform', cost: 100, tier: 1, branch: 'left', offsetX: -80, offsetY: 80, parent: 'ai_root',
    perks: [{name: 'Flexibility', icon: 'shuffle'}, {name: 'Shift', icon: 'arrow-right'}]
  },
  { 
    id: 'ai_visual', name: 'Visual Override', description: 'Abilities gain new particle effects and execution animations.', type: 'visual', cost: 100, tier: 1, branch: 'right', offsetX: 80, offsetY: 80, parent: 'ai_root',
    perks: [{name: 'Particles', icon: 'sparkles'}, {name: 'Color', icon: 'palette'}]
  },
  { 
    id: 'ai_lift', name: 'Graviton Lift', description: 'Replace knockback with enemy suspension + oxygen deprivation effect.', type: 'transform', cost: 250, tier: 2, branch: 'left', offsetX: -80, offsetY: 160, parent: 'ai_morph',
    perks: [{name: 'Anti-Grav', icon: 'upload'}, {name: 'Choke', icon: 'wind'}]
  },
  { 
    id: 'ai_adapt', name: 'Adaptive Response', description: 'AI analyzes enemy patterns and suggests optimal ability timing.', type: 'behavior', cost: 250, tier: 2, branch: 'right', offsetX: 80, offsetY: 160, parent: 'ai_visual',
    perks: [{name: 'Analysis', icon: 'search'}, {name: 'Reflex', icon: 'clock'}]
  },
  { 
    id: 'ai_chain', name: 'Chain Reaction', description: 'Transformed abilities can trigger secondary effects based on context.', type: 'behavior', cost: 500, tier: 3, branch: 'left', offsetX: -80, offsetY: 240, parent: 'ai_lift',
    perks: [{name: 'Combo', icon: 'layers'}, {name: 'Explosion', icon: 'bomb'}]
  },
  { 
    id: 'ai_pred', name: 'Predictive Strike', description: 'AI pre-calculates enemy movements for guaranteed hits.', type: 'behavior', cost: 500, tier: 3, branch: 'right', offsetX: 80, offsetY: 240, parent: 'ai_adapt',
    perks: [{name: 'Oracle', icon: 'eye-off'}, {name: 'Lock-on', icon: 'crosshair'}]
  },
  { 
    id: 'ai_ult', name: 'Singularity Protocol', description: 'Ultimate: Card gains autonomous decision-making. All abilities become context-aware with unique animations.', type: 'ultimate', cost: 1000, tier: 4, offsetX: 0, offsetY: 320, parent: ['ai_chain', 'ai_pred'],
    perks: [{name: 'Sentience', icon: 'cpu'}, {name: 'Evolution', icon: 'dna'}]
  },
];

// Neutral Tree - Utility and Support
const NEUTRAL_TREE_NODES = [
  { 
    id: 'neutral_root', name: 'Balance Core', description: 'Unlock balanced utility and support capabilities.', type: 'core', cost: 0, tier: 0, offsetX: 0, offsetY: 0,
    perks: [{name: 'Stability', icon: 'scale'}, {name: 'Focus', icon: 'circle'}]
  },
  { 
    id: 'neutral_util1', name: 'Utility Boost I', description: 'Increase resource generation by 10%.', type: 'utility', cost: 100, tier: 1, branch: 'left', offsetX: -80, offsetY: 80, parent: 'neutral_root',
    perks: [{name: '+Res', icon: 'battery'}, {name: 'Efficiency', icon: 'percent'}]
  },
  { 
    id: 'neutral_supp1', name: 'Support Boost I', description: 'Increase healing received by 10%.', type: 'support', cost: 100, tier: 1, branch: 'right', offsetX: 80, offsetY: 80, parent: 'neutral_root',
    perks: [{name: '+Heal', icon: 'heart'}, {name: 'Aid', icon: 'plus'}]
  },
  { 
    id: 'neutral_speed', name: 'Speed Boost', description: 'Increase movement/action speed by 15%.', type: 'utility', cost: 250, tier: 2, branch: 'left', offsetX: -80, offsetY: 160, parent: 'neutral_util1',
    perks: [{name: 'Haste', icon: 'wind'}, {name: 'Quick', icon: 'clock'}]
  },
  { 
    id: 'neutral_aura', name: 'Aura', description: 'Passive aura that buffs nearby allies.', type: 'support', cost: 250, tier: 2, branch: 'right', offsetX: 80, offsetY: 160, parent: 'neutral_supp1',
    perks: [{name: 'Buff', icon: 'users'}, {name: 'Radius', icon: 'rss'}]
  },
  { 
    id: 'neutral_util2', name: 'Utility Boost II', description: 'Reduce cooldowns by 15%.', type: 'utility', cost: 500, tier: 3, branch: 'left', offsetX: -80, offsetY: 240, parent: 'neutral_speed',
    perks: [{name: 'CDR', icon: 'refresh-ccw'}, {name: 'Flow', icon: 'zap'}]
  },
  { 
    id: 'neutral_supp2', name: 'Support Boost II', description: 'Buff ally stats by 10%.', type: 'support', cost: 500, tier: 3, branch: 'right', offsetX: 80, offsetY: 240, parent: 'neutral_aura',
    perks: [{name: 'Empower', icon: 'arrow-up'}, {name: 'Teamwork', icon: 'handshake'}]
  },
  { 
    id: 'neutral_ult', name: 'Perfect Harmony', description: 'Ultimate: Combine effects of both other paths at 50% efficiency for a short duration.', type: 'ultimate', cost: 1000, tier: 4, offsetX: 0, offsetY: 320, parent: ['neutral_util2', 'neutral_supp2'],
    perks: [{name: 'Unity', icon: 'infinity'}, {name: 'Balance', icon: 'scale'}]
  },
];

const getNodeIcon = (type) => {
  switch (type) {
    case 'core': return <Sparkles className="w-5 h-5" />;
    case 'stat': return <TrendingUp className="w-5 h-5" />;
    case 'ability': return <Zap className="w-5 h-5" />;
    case 'ultimate': return <Bolt className="w-5 h-5" />;
    case 'transform': return <Wind className="w-5 h-5" />;
    case 'visual': return <Eye className="w-5 h-5" />;
    case 'behavior': return <Brain className="w-5 h-5" />;
    case 'utility': return <Bolt className="w-5 h-5" />;
    case 'support': return <Shield className="w-5 h-5" />;
    default: return <Shield className="w-5 h-5" />;
  }
};

const getNodeColor = (type, treeType) => {
  if (treeType === 'power') {
    switch (type) {
      case 'core': return 'from-purple-500 to-purple-700';
      case 'stat': return 'from-blue-500 to-blue-700';
      case 'ability': return 'from-indigo-500 to-indigo-700';
      case 'ultimate': return 'from-orange-500 to-red-600';
      default: return 'from-slate-500 to-slate-700';
    }
  } else if (treeType === 'neutral') {
    switch (type) {
      case 'core': return 'from-gray-500 to-gray-700';
      case 'utility': return 'from-yellow-500 to-yellow-700';
      case 'support': return 'from-green-500 to-green-700';
      case 'ultimate': return 'from-slate-200 to-white';
      default: return 'from-slate-500 to-slate-700';
    }
  } else {
    // AI
    switch (type) {
      case 'core': return 'from-cyan-500 to-cyan-700';
      case 'transform': return 'from-teal-500 to-teal-700';
      case 'visual': return 'from-pink-500 to-pink-700';
      case 'behavior': return 'from-emerald-500 to-emerald-700';
      case 'ultimate': return 'from-amber-500 to-orange-600';
      default: return 'from-slate-500 to-slate-700';
    }
  }
};

function SkillNode({ node, isUnlocked, isSelected, isLocked, canUnlock, treeType, onClick, onHover, onLeave, focusedNodeId, isAnimating }) {
  const isFocused = focusedNodeId === node.id;
  const colorGradient = getNodeColor(node.type, treeType);
  const isLeftBranch = node.branch === 'left';
  // If center (no branch), default to right perks unless it's the root/ult where we might want split? 
  // User asked for "left side... box will come out to the left". "right side... right".
  // For center nodes (offset 0), let's just put them on the right for consistency, or maybe alternating?
  // Let's stick to Right for center nodes for now unless specified.
  const showPerksOnLeft = isLeftBranch;

  return (
    <div className="relative flex items-center justify-center">
      {/* Main Node Button */}
      <motion.button
        onClick={() => onClick(node)}
        onMouseEnter={() => onHover(node)}
        onMouseLeave={onLeave}
        onFocus={() => onHover(node)}
        onBlur={onLeave}
        disabled={isLocked && !canUnlock}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          filter: isLocked && !canUnlock ? 'grayscale(100%)' : 'grayscale(0%)'
        }}
        transition={{ delay: node.tier * 0.1, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: canUnlock || isUnlocked ? 1.15 : 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 z-10
          ${isFocused || isSelected ? 'ring-4 ring-white/60 ring-offset-2 ring-offset-transparent' : ''}
          ${isUnlocked ? 'cursor-pointer' : canUnlock ? 'cursor-pointer' : 'cursor-not-allowed'}
        `}
      >
        {/* Unlock burst animation */}
        {isAnimating && (
          <motion.div
            className={`absolute inset-0 rounded-xl ${treeType === 'power' ? 'bg-purple-400' : treeType === 'neutral' ? 'bg-yellow-400' : 'bg-cyan-400'}`}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
        
        {/* Node Background */}
        <div className={`
          absolute inset-0 rounded-xl transition-all duration-300
          ${isUnlocked 
            ? `bg-gradient-to-br ${colorGradient} shadow-lg` 
            : canUnlock 
              ? 'bg-slate-700/80 border-2 border-dashed border-white/30' 
              : 'bg-slate-900/60 border border-white/10'
          }
        `}>
          {isUnlocked && (
            <motion.div
              className="absolute inset-0 rounded-xl"
              animate={{
                boxShadow: [
                  `0 0 10px ${treeType === 'power' ? 'rgba(168, 85, 247, 0.3)' : treeType === 'neutral' ? 'rgba(250, 204, 21, 0.3)' : 'rgba(34, 211, 238, 0.3)'}`,
                  `0 0 20px ${treeType === 'power' ? 'rgba(168, 85, 247, 0.5)' : treeType === 'neutral' ? 'rgba(250, 204, 21, 0.5)' : 'rgba(34, 211, 238, 0.5)'}`,
                  `0 0 10px ${treeType === 'power' ? 'rgba(168, 85, 247, 0.3)' : treeType === 'neutral' ? 'rgba(250, 204, 21, 0.3)' : 'rgba(34, 211, 238, 0.3)'}`,
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>

        {/* Icon */}
        <div className={`relative z-10 ${isUnlocked ? 'text-white' : canUnlock ? 'text-white/60' : 'text-white/20'}`}>
          {isLocked && !canUnlock ? <Lock className="w-4 h-4" /> : getNodeIcon(node.type)}
        </div>

        {/* Unlocked Checkmark */}
        {isUnlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
          >
            <Check className="w-3 h-3 text-white" />
          </motion.div>
        )}

        {/* Cost Badge */}
        {!isUnlocked && node.cost > 0 && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/80 text-[10px] text-yellow-400 font-bold whitespace-nowrap">
            {node.cost} SP
          </div>
        )}
      </motion.button>

      {/* Perk Boxes - Appearing on interaction (selection) */}
      <AnimatePresence>
        {isSelected && node.perks && (
          <motion.div
            initial={{ opacity: 0, x: showPerksOnLeft ? 20 : -20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: showPerksOnLeft ? 10 : -10, scale: 0.8 }}
            className={`absolute flex gap-2 ${showPerksOnLeft ? 'flex-row-reverse right-[110%]' : 'flex-row left-[110%]'}`}
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          >
            {node.perks.map((perk, idx) => (
              <div 
                key={idx}
                className="w-10 h-10 rounded-lg bg-black/60 border border-white/20 flex items-center justify-center backdrop-blur-sm relative group"
                title={perk.name}
              >
                {/* Perk Icon Placeholder */}
                <div className={`w-2 h-2 rounded-full ${treeType === 'power' ? 'bg-purple-400' : treeType === 'neutral' ? 'bg-yellow-400' : 'bg-cyan-400'}`} />
                
                {/* Tooltip for Perk */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[10px] text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
                  {perk.name}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Connection line between nodes with energy trail animation
function ConnectionLine({ fromX, fromY, toX, toY, isUnlocked, treeType }) {
  // Simplified straight lines without flashy animations
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
  
  return (
    <div
      className="absolute origin-left"
      style={{
        left: fromX + 28, // Center of node
        top: fromY + 28,
        width: length,
        height: 2,
        transform: `rotate(${angle}rad)`,
        transformOrigin: '0 50%',
        zIndex: 0
      }}
    >
      <div className={`w-full h-full transition-colors duration-500 ${
        isUnlocked 
          ? treeType === 'power' ? 'bg-purple-500/40' : treeType === 'neutral' ? 'bg-yellow-500/40' : 'bg-cyan-500/40'
          : 'bg-white/5'
      }`} />
    </div>
  );
}

export default function SkillTreeOverlay({ card, onClose }) {
  const [committedPath, setCommittedPath] = useState(null); // null, 'power', 'ai', or 'neutral'
  const [unlockedPowerNodes, setUnlockedPowerNodes] = useState(['power_root']);
  const [unlockedAINodes, setUnlockedAINodes] = useState(['ai_root']);
  const [unlockedNeutralNodes, setUnlockedNeutralNodes] = useState(['neutral_root']);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [focusedNodeId, setFocusedNodeId] = useState(null);
  const [skillPoints, setSkillPoints] = useState(2000); // Demo SP
  const [recentlyUnlocked, setRecentlyUnlocked] = useState(null); // For unlock animations
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const containerRef = useRef(null);

  // Lock body scroll when overlay is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Card tilt effects
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseY, [-150, 150], [10, -10]);
  const rotateY = useTransform(mouseX, [-150, 150], [-10, 10]);
  const shineX = useTransform(mouseX, [-150, 150], [0, 100]);

  const handleCardMouseMove = ({ currentTarget, clientX, clientY }) => {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    x.set(clientX - left - width / 2);
    y.set(clientY - top - height / 2);
  };

  const handleCardMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const canUnlockNode = useCallback((node, treeType) => {
    let unlockedNodes;
    if (treeType === 'power') unlockedNodes = unlockedPowerNodes;
    else if (treeType === 'neutral') unlockedNodes = unlockedNeutralNodes;
    else unlockedNodes = unlockedAINodes;

    if (unlockedNodes.includes(node.id)) return false;
    if (node.cost > skillPoints) return false;
    
    // Check if path is committed to the other tree
    if (committedPath && committedPath !== treeType && node.tier > 0) return false;
    
    // Check parent requirements
    if (!node.parent) return true;
    if (Array.isArray(node.parent)) {
      return node.parent.some(p => unlockedNodes.includes(p));
    }
    return unlockedNodes.includes(node.parent);
  }, [unlockedPowerNodes, unlockedAINodes, unlockedNeutralNodes, skillPoints, committedPath]);

  const handleUnlockNode = (node, treeType) => {
    if (!canUnlockNode(node, treeType)) return;
    
    let setUnlocked;
    if (treeType === 'power') setUnlocked = setUnlockedPowerNodes;
    else if (treeType === 'neutral') setUnlocked = setUnlockedNeutralNodes;
    else setUnlocked = setUnlockedAINodes;
    
    // Commit to path on first non-root unlock
    if (!committedPath && node.tier > 0) {
      setCommittedPath(treeType);
    }
    
    // Trigger unlock animation
    setRecentlyUnlocked(node.id);
    setTimeout(() => setRecentlyUnlocked(null), 1000);
    
    setUnlocked(prev => [...prev, node.id]);
    setSkillPoints(prev => prev - node.cost);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Get node position for connection lines
  const getNodePosition = (nodeId, nodes) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return { x: node.offsetX, y: node.offsetY };
  };

  // Render connection lines between nodes
  const renderConnections = (nodes, unlockedNodes, treeType) => {
    const connections = [];
    
    nodes.forEach(node => {
      if (!node.parent) return;
      
      const parents = Array.isArray(node.parent) ? node.parent : [node.parent];
      const toPos = getNodePosition(node.id, nodes);
      
      parents.forEach(parentId => {
        const fromPos = getNodePosition(parentId, nodes);
        const isUnlocked = unlockedNodes.includes(node.id);
        const isAnimating = recentlyUnlocked === node.id;
        
        connections.push(
          <ConnectionLine
            key={`${parentId}-${node.id}`}
            fromX={fromPos.x + 120} // Center offset (240/2)
            fromY={fromPos.y}
            toX={toPos.x + 120}
            toY={toPos.y}
            isUnlocked={isUnlocked}
            treeType={treeType}
            isAnimating={isAnimating}
          />
        );
      });
    });
    
    return connections;
  };

  const renderTree = (nodes, treeType) => {
    let unlockedNodes;
    if (treeType === 'power') unlockedNodes = unlockedPowerNodes;
    else if (treeType === 'neutral') unlockedNodes = unlockedNeutralNodes;
    else unlockedNodes = unlockedAINodes;

    const isTreeLocked = committedPath && committedPath !== treeType;

    const getTitle = () => {
      if (treeType === 'power') return 'Power Path';
      if (treeType === 'neutral') return 'Neutral Path';
      return 'AI Adaptation Path';
    };

    const getDescription = () => {
      if (treeType === 'power') return 'Raw strength & combat efficiency';
      if (treeType === 'neutral') return 'Balance, support & utility';
      return 'Versatility & behavioral adaptation';
    };

    const getTitleColor = () => {
      if (treeType === 'power') return 'text-purple-300';
      if (treeType === 'neutral') return 'text-yellow-300';
      return 'text-cyan-300';
    };

    return (
      <div className={`relative flex flex-col items-center p-4 rounded-2xl transition-all duration-500 ${
        isTreeLocked ? 'opacity-30 pointer-events-none' : ''
      }`}>
        {/* Tree Header */}
        <div className="text-center mb-4">
          <h3 className={`text-lg font-bold ${getTitleColor()}`}>
            {getTitle()}
          </h3>
          <p className="text-xs text-white/50">
            {getDescription()}
          </p>
          {isTreeLocked && (
            <Badge className="mt-2 bg-red-500/20 text-red-400 border-red-500/30">
              <Lock className="w-3 h-3 mr-1" /> Path Locked
            </Badge>
          )}
        </div>

        {/* Tree Container with positioned nodes */}
        <div className="relative w-[240px] h-[420px]">
          {/* Connection Lines */}
          {renderConnections(nodes, unlockedNodes, treeType)}
          
          {/* Skill Nodes */}
          {nodes.map(node => {
            const isUnlocked = unlockedNodes.includes(node.id);
            const canUnlock = canUnlockNode(node, treeType);
            const isLocked = !isUnlocked && !canUnlock;
            const isAnimating = recentlyUnlocked === node.id;
            
            return (
              <div 
                key={node.id}
                className="absolute"
                style={{ 
                  left: `calc(50% + ${node.offsetX}px - 28px)`, // 28px = half of 56px node width
                  top: node.offsetY,
                }}
              >
                <SkillNode
                  node={node}
                  isUnlocked={isUnlocked}
                  isSelected={hoveredNode?.id === node.id}
                  isLocked={isLocked}
                  canUnlock={canUnlock}
                  treeType={treeType}
                  onClick={(n) => handleUnlockNode(n, treeType)}
                  onHover={setHoveredNode}
                  onLeave={() => setHoveredNode(null)}
                  focusedNodeId={focusedNodeId}
                  isAnimating={isAnimating}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      style={{ background: 'linear-gradient(135deg, rgba(15, 20, 25, 0.95) 0%, rgba(26, 31, 46, 0.95) 50%, rgba(13, 17, 23, 0.95) 100%)' }}
      onClick={onClose}
    >
      {/* Ambient Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
      </div>

      <div
        className="relative w-full max-w-7xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Filter Drawer */}
        <AnimatePresence>
          {isFilterDrawerOpen && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute top-0 bottom-0 left-0 w-[200px] z-50 rounded-l-3xl overflow-hidden"
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '10px 0 30px rgba(0,0,0,0.5)'
              }}
            >
              <div className="p-6 h-full overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Filter className="w-4 h-4 text-cyan-400" />
                    Filters
                  </h3>
                </div>

                <div className="space-y-6">
                  {/* Status Filters */}
                  <div>
                    <label className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3 block">Status</label>
                    <div className="space-y-2">
                      {['Unlocked', 'Available', 'Locked', 'Maxed'].map(filter => (
                        <div key={filter} className="flex items-center gap-3 group cursor-pointer">
                          <div className="w-4 h-4 rounded border border-white/20 group-hover:border-cyan-400 transition-colors" />
                          <span className="text-sm text-white/60 group-hover:text-white transition-colors">{filter}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Type Filters */}
                  <div>
                    <label className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3 block">Type</label>
                    <div className="space-y-2">
                      {['Core', 'Stat', 'Ability', 'Ultimate'].map(type => (
                        <div key={type} className="flex items-center gap-3 group cursor-pointer">
                          <div className="w-4 h-4 rounded border border-white/20 group-hover:border-purple-400 transition-colors" />
                          <span className="text-sm text-white/60 group-hover:text-white transition-colors">{type}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cost Range */}
                  <div>
                    <label className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3 block">Cost</label>
                    <div className="px-1">
                      <div className="h-1 bg-white/10 rounded-full mb-2">
                         <div className="h-full w-2/3 bg-cyan-500 rounded-full" />
                      </div>
                      <div className="flex justify-between text-[10px] text-white/40">
                        <span>0</span>
                        <span>1000+</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 relative">
          <div className="flex items-center gap-4">
             <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
              className={`mr-2 transition-colors ${isFilterDrawerOpen ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-black text-white">{card?.title || card?.name || 'Card'}</h1>
            <Badge className="text-lg px-4 py-1 bg-purple-600/30 border-purple-500/50 text-purple-200">
              Skill Tree
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Skill Points */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-300 font-bold">{skillPoints} SP</span>
            </div>
            

          </div>
        </div>

        {/* Main Content - Card Left, Trees Right */}
        <div className="flex-1 flex gap-8 overflow-hidden" ref={containerRef}>
          
          {/* Left: Card Display */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-[300px]">
            <div
              className="relative w-[260px] aspect-[2.5/3.5] perspective-1000"
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <motion.div
                className="w-full h-full rounded-2xl relative overflow-hidden shadow-2xl border-2 border-white/30 bg-slate-900"
                style={{
                  rotateX,
                  rotateY,
                  transformStyle: "preserve-3d",
                  boxShadow: `0 0 50px ${card?.rarity === 'Legendary' ? 'rgba(249,115,22,0.5)' : card?.rarity === 'Mythic' ? 'rgba(244,63,94,0.5)' : 'rgba(59,130,246,0.5)'}`
                }}
              >
                {card?.image ? (
                  <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <div className="text-white/20 text-6xl">?</div>
                  </div>
                )}
                
                {/* Shine Effect */}
                <motion.div
                  className="absolute inset-0 pointer-events-none mix-blend-overlay"
                  style={{
                    background: useTransform(shineX, val => `linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.3) ${val}%, transparent 100%)`)
                  }}
                />
                
                {/* Power indicator overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                  <div className="text-center">
                    <h3 className="text-white font-bold text-lg truncate">{card?.title || card?.name}</h3>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Badge className={`px-3 py-1 border ${
                        card?.rarity === 'Legendary' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                        card?.rarity === 'Mythic' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                        card?.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                        'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}>
                        {card?.rarity || "Common"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Path Commitment Status Below Card */}
            <div className="mt-8 text-center">
              {committedPath ? (
                <div className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <p className="text-xs text-white/50 mb-1">Current Path</p>
                  <p className={`font-bold text-lg ${committedPath === 'power' ? 'text-purple-400' : committedPath === 'neutral' ? 'text-yellow-400' : 'text-cyan-400'}`}>
                    {committedPath === 'power' ? 'Power Path' : committedPath === 'neutral' ? 'Neutral Path' : 'AI Adaptation Path'}
                  </p>
                </div>
              ) : (
                <div className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <p className="text-xs text-white/50 mb-1">Status</p>
                  <p className="font-medium text-white/80">Path Selection Available</p>
                </div>
              )}
            </div>

            {/* Perks Section */}
            <div className="mt-6 w-full">
              <p className="text-xs text-center text-white/50 font-bold uppercase tracking-widest mb-3">Perks</p>
              <div className="flex justify-center gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-16 h-20 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center relative overflow-hidden group hover:border-white/30 transition-all cursor-pointer">
                    <div className="text-white/20 text-xl font-bold group-hover:text-white/40 transition-colors">?</div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Unified Skill Tree Box with Liquid Glass Finish */}
          <div className="flex-1 relative rounded-3xl overflow-hidden flex flex-col" style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(40px) saturate(150%)',
            WebkitBackdropFilter: 'blur(40px) saturate(150%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
          }}>
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">Skill Progression System</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-xs text-white/50">Power</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-xs text-white/50">Neutral</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                  <span className="text-xs text-white/50">AI Adaptation</span>
                </div>
              </div>
            </div>

            {/* Side by Side Trees */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Power Path Column */}
              <div className="flex-1 relative border-r border-white/10 bg-gradient-to-b from-purple-500/5 to-transparent flex items-center justify-center p-4">
                {renderTree(POWER_TREE_NODES, 'power')}
              </div>

              {/* Neutral Path Column */}
              <div className="flex-1 relative border-r border-white/10 bg-gradient-to-b from-yellow-500/5 to-transparent flex items-center justify-center p-4">
                {renderTree(NEUTRAL_TREE_NODES, 'neutral')}
              </div>
              
              {/* AI Path Column */}
              <div className="flex-1 relative bg-gradient-to-b from-cyan-500/5 to-transparent flex items-center justify-center p-4">
                {renderTree(AI_TREE_NODES, 'ai')}
              </div>
            </div>
          </div>
        </div>

        {/* Node Detail Tooltip */}
        <AnimatePresence>
          {hoveredNode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-60 p-4 rounded-2xl max-w-md"
              style={{
                background: 'rgba(30, 41, 59, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  hoveredNode.type === 'ultimate' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {getNodeIcon(hoveredNode.type)}
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">{hoveredNode.name}</h4>
                  <p className="text-white/70 text-sm mt-1">{hoveredNode.description}</p>
                  {hoveredNode.cost > 0 && (
                    <p className="text-yellow-400 text-sm mt-2 font-medium">Cost: {hoveredNode.cost} SP</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}