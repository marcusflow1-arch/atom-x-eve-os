import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { X, Zap, Sparkles, Shield, TrendingUp, Bolt, Flame, Brain, Eye, Wind, Lock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Power Tree - Raw stat increases and combat effectiveness
// Node positions with offsets for visual progression feel
const POWER_TREE_NODES = [
  { id: 'power_root', name: 'Core Activation', description: 'Unlock the card\'s latent power potential.', type: 'core', cost: 0, tier: 0, offsetX: 0, offsetY: 0 },
  { id: 'power_atk1', name: 'Attack Boost I', description: 'Increase base attack power by 10%.', type: 'stat', cost: 100, tier: 1, branch: 'left', offsetX: -60, offsetY: 90, parent: 'power_root' },
  { id: 'power_def1', name: 'Defense Boost I', description: 'Increase base defense by 10%.', type: 'stat', cost: 100, tier: 1, branch: 'right', offsetX: 60, offsetY: 90, parent: 'power_root' },
  { id: 'power_crit', name: 'Critical Strike', description: 'Gain 15% critical hit chance.', type: 'ability', cost: 250, tier: 2, branch: 'left', offsetX: -80, offsetY: 180, parent: 'power_atk1' },
  { id: 'power_res', name: 'Resilience', description: 'Reduce all incoming damage by 8%.', type: 'ability', cost: 250, tier: 2, branch: 'right', offsetX: 80, offsetY: 180, parent: 'power_def1' },
  { id: 'power_atk2', name: 'Attack Boost II', description: 'Increase attack power by additional 20%.', type: 'stat', cost: 500, tier: 3, branch: 'left', offsetX: -60, offsetY: 270, parent: 'power_crit' },
  { id: 'power_def2', name: 'Defense Boost II', description: 'Increase defense by additional 20%.', type: 'stat', cost: 500, tier: 3, branch: 'right', offsetX: 60, offsetY: 270, parent: 'power_res' },
  { id: 'power_ult', name: 'Overwhelming Force', description: 'Ultimate: All stats increased by 25%. Abilities deal 50% more damage.', type: 'ultimate', cost: 1000, tier: 4, offsetX: 0, offsetY: 360, parent: ['power_atk2', 'power_def2'] },
];

// AI Adaptation Tree - Behavioral changes and versatility
const AI_TREE_NODES = [
  { id: 'ai_root', name: 'Neural Link', description: 'Establish connection with AI adaptation systems.', type: 'core', cost: 0, tier: 0, offsetX: 0, offsetY: 0 },
  { id: 'ai_morph', name: 'Ability Morph', description: 'Force Push becomes Armor Strip - removes enemy defenses instead of knockback.', type: 'transform', cost: 100, tier: 1, branch: 'left', offsetX: -60, offsetY: 90, parent: 'ai_root' },
  { id: 'ai_visual', name: 'Visual Override', description: 'Abilities gain new particle effects and execution animations.', type: 'visual', cost: 100, tier: 1, branch: 'right', offsetX: 60, offsetY: 90, parent: 'ai_root' },
  { id: 'ai_lift', name: 'Graviton Lift', description: 'Replace knockback with enemy suspension + oxygen deprivation effect.', type: 'transform', cost: 250, tier: 2, branch: 'left', offsetX: -80, offsetY: 180, parent: 'ai_morph' },
  { id: 'ai_adapt', name: 'Adaptive Response', description: 'AI analyzes enemy patterns and suggests optimal ability timing.', type: 'behavior', cost: 250, tier: 2, branch: 'right', offsetX: 80, offsetY: 180, parent: 'ai_visual' },
  { id: 'ai_chain', name: 'Chain Reaction', description: 'Transformed abilities can trigger secondary effects based on context.', type: 'behavior', cost: 500, tier: 3, branch: 'left', offsetX: -60, offsetY: 270, parent: 'ai_lift' },
  { id: 'ai_pred', name: 'Predictive Strike', description: 'AI pre-calculates enemy movements for guaranteed hits.', type: 'behavior', cost: 500, tier: 3, branch: 'right', offsetX: 60, offsetY: 270, parent: 'ai_adapt' },
  { id: 'ai_ult', name: 'Singularity Protocol', description: 'Ultimate: Card gains autonomous decision-making. All abilities become context-aware with unique animations.', type: 'ultimate', cost: 1000, tier: 4, offsetX: 0, offsetY: 360, parent: ['ai_chain', 'ai_pred'] },
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
    default: return <Shield className="w-5 h-5" />;
  }
};

const getNodeColor = (type, isPower) => {
  if (isPower) {
    switch (type) {
      case 'core': return 'from-purple-500 to-purple-700';
      case 'stat': return 'from-blue-500 to-blue-700';
      case 'ability': return 'from-indigo-500 to-indigo-700';
      case 'ultimate': return 'from-orange-500 to-red-600';
      default: return 'from-slate-500 to-slate-700';
    }
  } else {
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

function SkillNode({ node, isUnlocked, isSelected, isLocked, canUnlock, isPowerTree, onClick, onHover, onLeave, focusedNodeId }) {
  const isFocused = focusedNodeId === node.id;
  const colorGradient = getNodeColor(node.type, isPowerTree);
  
  return (
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
        relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300
        ${isFocused || isSelected ? 'ring-4 ring-white/60 ring-offset-2 ring-offset-transparent' : ''}
        ${isUnlocked ? 'cursor-pointer' : canUnlock ? 'cursor-pointer' : 'cursor-not-allowed'}
      `}
    >
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
                `0 0 10px ${isPowerTree ? 'rgba(168, 85, 247, 0.3)' : 'rgba(34, 211, 238, 0.3)'}`,
                `0 0 20px ${isPowerTree ? 'rgba(168, 85, 247, 0.5)' : 'rgba(34, 211, 238, 0.5)'}`,
                `0 0 10px ${isPowerTree ? 'rgba(168, 85, 247, 0.3)' : 'rgba(34, 211, 238, 0.3)'}`,
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
  );
}

// Connection line between nodes with energy trail animation
function ConnectionLine({ fromX, fromY, toX, toY, isUnlocked, isPowerTree, isAnimating }) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
  
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ 
        opacity: 1, 
        scaleX: 1,
      }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="absolute origin-left"
      style={{
        left: fromX + 28, // Center of node (56/2)
        top: fromY + 28,
        width: length,
        height: 3,
        transform: `rotate(${angle}rad)`,
        transformOrigin: '0 50%',
      }}
    >
      {/* Base line */}
      <div className={`absolute inset-0 rounded-full transition-colors duration-500 ${
        isUnlocked 
          ? isPowerTree ? 'bg-purple-500/60' : 'bg-cyan-500/60'
          : 'bg-slate-700/50'
      }`} />
      
      {/* Animated energy flow when unlocked */}
      {isUnlocked && (
        <motion.div
          className={`absolute inset-y-0 left-0 w-8 rounded-full ${
            isPowerTree 
              ? 'bg-gradient-to-r from-transparent via-purple-400 to-transparent' 
              : 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent'
          }`}
          animate={{
            x: [0, length - 32, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}
      
      {/* Unlock animation burst */}
      {isAnimating && (
        <motion.div
          className={`absolute inset-0 rounded-full ${
            isPowerTree ? 'bg-purple-400' : 'bg-cyan-400'
          }`}
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{ transformOrigin: '0 50%' }}
        />
      )}
    </motion.div>
  );
}

export default function SkillTreeOverlay({ card, onClose }) {
  const [committedPath, setCommittedPath] = useState(null); // null, 'power', or 'ai'
  const [unlockedPowerNodes, setUnlockedPowerNodes] = useState(['power_root']);
  const [unlockedAINodes, setUnlockedAINodes] = useState(['ai_root']);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [focusedNodeId, setFocusedNodeId] = useState(null);
  const [skillPoints, setSkillPoints] = useState(2000); // Demo SP
  const [recentlyUnlocked, setRecentlyUnlocked] = useState(null); // For unlock animations
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
    const unlockedNodes = treeType === 'power' ? unlockedPowerNodes : unlockedAINodes;
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
  }, [unlockedPowerNodes, unlockedAINodes, skillPoints, committedPath]);

  const handleUnlockNode = (node, treeType) => {
    if (!canUnlockNode(node, treeType)) return;
    
    const setUnlocked = treeType === 'power' ? setUnlockedPowerNodes : setUnlockedAINodes;
    
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

  const renderTree = (nodes, treeType, isPowerTree) => {
    const unlockedNodes = treeType === 'power' ? unlockedPowerNodes : unlockedAINodes;
    const isTreeLocked = committedPath && committedPath !== treeType;

    return (
      <div className={`relative flex flex-col items-center gap-6 p-4 rounded-2xl transition-all duration-500 ${
        isTreeLocked ? 'opacity-30 pointer-events-none' : ''
      }`}>
        {/* Tree Header */}
        <div className="text-center mb-2">
          <h3 className={`text-lg font-bold ${isPowerTree ? 'text-purple-300' : 'text-cyan-300'}`}>
            {isPowerTree ? 'Power Path' : 'AI Adaptation Path'}
          </h3>
          <p className="text-xs text-white/50">
            {isPowerTree ? 'Raw strength & combat efficiency' : 'Versatility & behavioral adaptation'}
          </p>
          {isTreeLocked && (
            <Badge className="mt-2 bg-red-500/20 text-red-400 border-red-500/30">
              <Lock className="w-3 h-3 mr-1" /> Path Locked
            </Badge>
          )}
        </div>

        {/* Tree Grid */}
        <div className="grid grid-cols-3 gap-x-8 gap-y-10">
          {[0, 1, 2, 3, 4].map(tier => (
            <React.Fragment key={tier}>
              {nodes.filter(n => n.tier === tier).sort((a, b) => a.col - b.col).map(node => {
                const isUnlocked = unlockedNodes.includes(node.id);
                const canUnlock = canUnlockNode(node, treeType);
                const isLocked = !isUnlocked && !canUnlock;
                
                return (
                  <div 
                    key={node.id} 
                    className="flex justify-center"
                    style={{ gridColumn: node.col + 1 }}
                  >
                    <SkillNode
                      node={node}
                      isUnlocked={isUnlocked}
                      isSelected={hoveredNode?.id === node.id}
                      isLocked={isLocked}
                      canUnlock={canUnlock}
                      isPowerTree={isPowerTree}
                      onClick={(n) => handleUnlockNode(n, treeType)}
                      onHover={setHoveredNode}
                      onLeave={() => setHoveredNode(null)}
                      focusedNodeId={focusedNodeId}
                    />
                  </div>
                );
              })}
            </React.Fragment>
          ))}
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
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
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-8 overflow-hidden">
          {/* Left: Card Preview */}
          <div className="w-80 flex-shrink-0 flex flex-col items-center justify-center">
            <div
              className="relative w-full max-w-[260px] aspect-[2.5/3.5] perspective-1000"
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <motion.div
                className="w-full h-full rounded-2xl relative overflow-hidden shadow-2xl border border-white/20 bg-slate-900"
                style={{
                  rotateX,
                  rotateY,
                  transformStyle: "preserve-3d",
                  boxShadow: `0 0 40px ${card?.rarity === 'Legendary' ? 'rgba(249,115,22,0.4)' : card?.rarity === 'Mythic' ? 'rgba(244,63,94,0.4)' : 'rgba(59,130,246,0.4)'}`
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
              </motion.div>
            </div>

            {/* Card Info */}
            <div className="mt-6 text-center">
              <h2 className="text-xl font-bold text-white">{card?.title || card?.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">
                  {card?.series || "Unknown"}
                </Badge>
                <Badge className={`border ${
                  card?.rarity === 'Legendary' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                  card?.rarity === 'Mythic' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                  card?.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                  'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}>
                  {card?.rarity || "Common"}
                </Badge>
              </div>
              
              {/* Path Commitment Status */}
              {committedPath && (
                <div className="mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/50">Committed to</p>
                  <p className={`font-bold ${committedPath === 'power' ? 'text-purple-400' : 'text-cyan-400'}`}>
                    {committedPath === 'power' ? 'Power Path' : 'AI Adaptation Path'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Dual Skill Trees */}
          <div className="flex-1 flex gap-6 overflow-auto custom-scrollbar">
            {/* Power Tree */}
            <div className="flex-1 rounded-2xl p-4" style={{
              background: 'rgba(100, 120, 140, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.2)'
            }}>
              {renderTree(POWER_TREE_NODES, 'power', true)}
            </div>

            {/* Divider */}
            <div className="w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

            {/* AI Tree */}
            <div className="flex-1 rounded-2xl p-4" style={{
              background: 'rgba(100, 120, 140, 0.08)',
              border: '1px solid rgba(34, 211, 238, 0.2)'
            }}>
              {renderTree(AI_TREE_NODES, 'ai', false)}
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