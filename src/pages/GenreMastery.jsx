import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crosshair, Shield, Zap, Brain, Activity, Globe, 
  ChevronRight, Lock, Unlock, Star, Hexagon, Swords, 
  Trophy, Flame, Sparkles, Orbit, ArrowLeft
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

// --- MOCK DATA ---

const GENRES = [
  { 
    id: 'fps', 
    name: 'First Person Shooter', 
    short: 'FPS',
    icon: Crosshair, 
    color: 'from-cyan-500 to-blue-600', 
    xpType: 'Tactical XP',
    level: 28, 
    maxLevel: 50,
    rank: 'Elite',
    rankIcon: Shield,
    xp: 78,
    skillPoints: 3,
    paths: ['Reflex', 'Weaponry', 'Tactics']
  },
  { 
    id: 'rpg', 
    name: 'Role Playing Game', 
    short: 'RPG',
    icon: Flame, 
    color: 'from-purple-500 to-pink-600', 
    xpType: 'Story XP',
    level: 15, 
    maxLevel: 50,
    rank: 'Adept',
    rankIcon: Sparkles,
    xp: 45,
    skillPoints: 1,
    paths: ['Magic', 'Charisma', 'Scaling']
  },
  { 
    id: 'mmo', 
    name: 'Massively Multiplayer', 
    short: 'MMO',
    icon: Globe, 
    color: 'from-green-500 to-emerald-600', 
    xpType: 'Progression XP',
    level: 42, 
    maxLevel: 50,
    rank: 'Warlord',
    rankIcon: Swords,
    xp: 92,
    skillPoints: 5,
    paths: ['Synergy', 'Buffs', 'Command']
  },
  { 
    id: 'strategy', 
    name: 'Strategy & RTS', 
    short: 'RTS',
    icon: Brain, 
    color: 'from-amber-500 to-orange-600', 
    xpType: 'Tactical XP',
    level: 10, 
    maxLevel: 50,
    rank: 'Tactician',
    rankIcon: Activity,
    xp: 20,
    skillPoints: 2,
    paths: ['Economy', 'Control', 'Prediction']
  },
];

// Skill Tree Structure for FPS (Mock)
const FPS_TREE = {
  reflex: [
    { id: 'r1', name: 'Quick Aim', tier: 1, type: 'standard', unlocked: true, description: '+10% ADS Speed' },
    { id: 'r2', name: 'Slide Kill', tier: 2, type: 'advanced', unlocked: true, description: 'Shoot while sliding with no penalty' },
    { id: 'r3', name: 'Blink Dodge', tier: 3, type: 'ultimate', unlocked: false, description: 'Short range teleport dash' },
  ],
  weaponry: [
    { id: 'w1', name: 'Armor Pen', tier: 1, type: 'standard', unlocked: true, description: '+15% Bullet Penetration' },
    { id: 'w2', name: 'Dual Reload', tier: 2, type: 'advanced', unlocked: false, description: 'Reload secondary while firing primary' },
    { id: 'w3', name: 'Overcharge', tier: 3, type: 'ultimate', unlocked: false, description: 'Next magazine deals +50% damage' },
  ],
  tactics: [
    { id: 't1', name: 'Flank Boost', tier: 1, type: 'standard', unlocked: true, description: '+10% Speed when out of combat' },
    { id: 't2', name: 'Radar Hack', tier: 2, type: 'advanced', unlocked: false, description: 'Reveal enemies within 20m on kill' },
    { id: 't3', name: 'Ghost Step', tier: 3, type: 'ultimate', unlocked: false, description: 'Silent footsteps while crouching' },
  ]
};

// --- COMPONENTS ---

const SkillNode = ({ node, color, onClick, isSelected }) => {
  const isUnlocked = node.unlocked;
  
  const getNodeColor = () => {
    if (!isUnlocked) return 'border-slate-700 bg-slate-900/50 text-slate-600';
    if (node.type === 'ultimate') return 'border-yellow-400 bg-yellow-400/20 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]';
    if (node.type === 'advanced') return `border-cyan-400 bg-cyan-400/20 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]`;
    return `border-white/60 bg-white/10 text-white shadow-[0_0_8px_rgba(255,255,255,0.3)]`;
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(node)}
      className={`relative w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 ${getNodeColor()} ${isSelected ? 'ring-4 ring-white/20 scale-110' : ''}`}
    >
      {/* Node Shape based on Type */}
      {node.type === 'ultimate' ? (
        <Star className={`w-8 h-8 ${isUnlocked ? 'animate-pulse' : ''}`} fill={isUnlocked ? "currentColor" : "none"} />
      ) : node.type === 'advanced' ? (
        <Hexagon className="w-8 h-8" fill={isUnlocked ? "currentColor" : "none"} />
      ) : (
        <div className={`w-4 h-4 rounded-full ${isUnlocked ? 'bg-current' : 'bg-slate-700'}`} />
      )}

      {/* Connection Glow Effect */}
      {isUnlocked && (
        <div className="absolute inset-0 rounded-full blur-md bg-current opacity-40" />
      )}
    </motion.button>
  );
};

const ConnectionLine = ({ active }) => (
  <div className={`h-24 w-1 mx-auto my-[-4px] transition-all duration-500 ${active ? 'bg-gradient-to-b from-white/80 to-white/40 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-slate-800'}`} />
);

const InfoPanel = ({ node, points }) => {
  if (!node) return (
    <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 border border-white/10 rounded-2xl bg-black/40 backdrop-blur-xl">
      <Brain className="w-12 h-12 mb-4 opacity-20" />
      <p className="text-sm uppercase tracking-widest">Select a node to view details</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      key={node.id}
      className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">{node.name}</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded border ${
              node.type === 'ultimate' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : 
              node.type === 'advanced' ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10' : 
              'border-slate-500 text-slate-400'
            } uppercase tracking-wider`}>
              {node.type}
            </span>
          </div>
          {node.unlocked ? (
            <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center">
              <Unlock className="w-5 h-5 text-green-400" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center">
              <Lock className="w-5 h-5 text-red-400" />
            </div>
          )}
        </div>

        <p className="text-slate-300 leading-relaxed mb-8 text-lg">
          {node.description}
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Tier Level</span>
            <span className="text-white font-mono">Rank {node.tier}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Skill Point Cost</span>
            <span className="text-white font-mono">1 SP</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Prerequisite</span>
            <span className="text-white font-mono">{node.tier > 1 ? `Tier ${node.tier - 1} Node` : 'None'}</span>
          </div>
        </div>

        {!node.unlocked && (
          <button 
            disabled={points < 1}
            className={`w-full py-4 rounded-lg font-bold uppercase tracking-widest transition-all ${
              points >= 1 
                ? 'bg-white text-black hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {points >= 1 ? 'Unlock Skill' : 'Insufficient Points'}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default function GenreMastery() {
  const navigate = useNavigate();
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'nexus'

  // Mock tree data switching
  const currentTree = FPS_TREE; // In a real app, switch based on selectedGenre

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden selection:bg-cyan-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0">
        <div className={`absolute inset-0 bg-gradient-to-br ${selectedGenre.color} opacity-10 transition-colors duration-1000`} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-black to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <header className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors group"
            >
              <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tighter italic uppercase flex items-center gap-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                  Omni-Genre
                </span>
                <span className={`px-2 py-0.5 text-sm rounded bg-gradient-to-r ${selectedGenre.color} text-white`}>
                  OGAS
                </span>
              </h1>
              <p className="text-slate-400 text-xs tracking-[0.2em] uppercase mt-1">Ascension System v2.0</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewMode(viewMode === 'tree' ? 'nexus' : 'tree')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                viewMode === 'nexus' 
                  ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                  : 'border-white/20 text-slate-400 hover:text-white'
              }`}
            >
              <Orbit className="w-4 h-4" />
              <span className="text-sm font-bold uppercase">Nexus Core</span>
            </button>
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
              <span className="text-slate-400 text-xs uppercase mr-2">Available SP</span>
              <span className="text-xl font-bold text-yellow-400">{selectedGenre.skillPoints}</span>
            </div>
          </div>
        </header>

        {/* Body Grid */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Genre Selector */}
          <div className="w-24 flex flex-col items-center py-8 gap-4 border-r border-white/5 bg-black/40 backdrop-blur-md z-20">
            {GENRES.map((genre) => {
              const Icon = genre.icon;
              const isActive = selectedGenre.id === genre.id;
              return (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre)}
                  className={`group relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? `bg-gradient-to-br ${genre.color} shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-110` 
                      : 'bg-white/5 hover:bg-white/10 text-slate-500'
                  }`}
                >
                  <Icon className={`w-8 h-8 ${isActive ? 'text-white' : 'group-hover:text-white transition-colors'}`} />
                  {/* Tooltip-ish label */}
                  <div className="absolute left-full ml-4 px-3 py-1 bg-black border border-white/20 rounded text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {genre.name}
                  </div>
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-0.5 w-1 h-8 bg-white rounded-r-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Center: Skill Tree Area */}
          <div className="flex-1 relative overflow-y-auto overflow-x-hidden scrollbar-hide">
            {viewMode === 'tree' ? (
              <div className="p-12 pb-32 max-w-5xl mx-auto">
                {/* Genre Header Card */}
                <motion.div 
                  key={selectedGenre.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-16 relative"
                >
                  <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-xl" />
                  <div className="relative border border-white/10 bg-black/40 backdrop-blur rounded-3xl p-8 overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${selectedGenre.color}`} />
                    
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-wide">{selectedGenre.name}</h2>
                        <div className="flex items-center gap-4 text-sm text-slate-400 font-mono">
                          <span className="flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Rank: <span className="text-white">{selectedGenre.rank}</span>
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-600" />
                          <span>{selectedGenre.xpType}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">
                          {selectedGenre.level}
                        </div>
                        <div className="text-xs uppercase tracking-widest text-slate-500">Current Level</div>
                      </div>
                    </div>

                    {/* XP Bar */}
                    <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedGenre.xp}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`absolute top-0 left-0 h-full bg-gradient-to-r ${selectedGenre.color}`}
                      >
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30" />
                        <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/50 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                      </motion.div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-mono text-slate-500">
                      <span>{selectedGenre.xp} / 100 XP</span>
                      <span>Next Level: {selectedGenre.level + 1}</span>
                    </div>
                  </div>
                </motion.div>

                {/* The Three Paths */}
                <div className="grid grid-cols-3 gap-16 relative">
                  {/* Background connecting lines logic would go here ideally with SVG */}
                  
                  {/* Path 1 */}
                  <div className="flex flex-col items-center">
                    <h3 className="text-cyan-400 font-bold uppercase tracking-widest mb-8 text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4" /> {selectedGenre.paths[0]} Path
                    </h3>
                    {currentTree.reflex.map((node, i) => (
                      <React.Fragment key={node.id}>
                        <SkillNode 
                          node={node} 
                          isSelected={selectedNode?.id === node.id}
                          onClick={setSelectedNode} 
                        />
                        {i < currentTree.reflex.length - 1 && <ConnectionLine active={node.unlocked && currentTree.reflex[i+1].unlocked} />}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Path 2 */}
                  <div className="flex flex-col items-center mt-12">
                    <h3 className="text-purple-400 font-bold uppercase tracking-widest mb-8 text-sm flex items-center gap-2">
                      <Crosshair className="w-4 h-4" /> {selectedGenre.paths[1]} Path
                    </h3>
                    {currentTree.weaponry.map((node, i) => (
                      <React.Fragment key={node.id}>
                        <SkillNode 
                          node={node} 
                          isSelected={selectedNode?.id === node.id}
                          onClick={setSelectedNode} 
                        />
                        {i < currentTree.weaponry.length - 1 && <ConnectionLine active={node.unlocked && currentTree.weaponry[i+1].unlocked} />}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Path 3 */}
                  <div className="flex flex-col items-center">
                    <h3 className="text-emerald-400 font-bold uppercase tracking-widest mb-8 text-sm flex items-center gap-2">
                      <Brain className="w-4 h-4" /> {selectedGenre.paths[2]} Path
                    </h3>
                    {currentTree.tactics.map((node, i) => (
                      <React.Fragment key={node.id}>
                        <SkillNode 
                          node={node} 
                          isSelected={selectedNode?.id === node.id}
                          onClick={setSelectedNode} 
                        />
                        {i < currentTree.tactics.length - 1 && <ConnectionLine active={node.unlocked && currentTree.tactics[i+1].unlocked} />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center p-8">
                {/* Nexus Core Placeholder UI */}
                <div className="relative w-[600px] h-[600px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
                  
                  {/* Central Core */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-4 border-white/20 bg-black/80 backdrop-blur-xl flex items-center justify-center shadow-[0_0_100px_rgba(255,255,255,0.2)] z-10">
                    <div className="text-center">
                      <Orbit className="w-16 h-16 text-white mx-auto mb-2 animate-spin-slow" />
                      <h3 className="text-white font-bold tracking-widest uppercase">Nexus Core</h3>
                      <p className="text-cyan-400 text-sm">Level 125 (Total)</p>
                    </div>
                  </div>

                  {/* Orbiting Planets (Genres) */}
                  {GENRES.map((genre, i) => {
                    const angle = (i / GENRES.length) * 2 * Math.PI;
                    const radius = 220;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    return (
                      <motion.div
                        key={genre.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, x: x + 300 - 32, y: y + 300 - 32 }}
                        transition={{ delay: i * 0.2 }}
                        className="absolute top-0 left-0 w-16 h-16"
                      >
                         <div className={`w-full h-full rounded-full bg-gradient-to-br ${genre.color} shadow-lg flex items-center justify-center border-2 border-white/20`}>
                           <genre.icon className="w-8 h-8 text-white" />
                         </div>
                         {/* Connection Line to Core */}
                         <div 
                            className="absolute top-1/2 left-1/2 h-0.5 bg-white/10 -z-10 origin-left"
                            style={{ 
                              width: radius, 
                              transform: `rotate(${angle + Math.PI}rad)`
                            }} 
                         />
                      </motion.div>
                    );
                  })}
                </div>
                <p className="text-slate-500 mt-8 font-mono text-sm uppercase tracking-widest">Cross-Genre Synergy Nodes: <span className="text-white">Active</span></p>
              </div>
            )}
          </div>

          {/* Right Sidebar: Info Panel */}
          <div className="w-96 p-6 border-l border-white/5 bg-black/40 backdrop-blur-md z-20">
            <InfoPanel node={selectedNode} points={selectedGenre.skillPoints} />
          </div>
        </div>
      </div>
    </div>
  );
}