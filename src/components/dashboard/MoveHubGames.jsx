import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, Sword, Brain, Crosshair, Activity, Ghost, 
  Lock, Check, ChevronLeft, Star, Hexagon, Search, Filter,
  Cpu, Database, Wifi, Battery
} from 'lucide-react';

// --- Enhanced Mock Data ---
export const moveHubGamesData = [
  {
    id: 1,
    title: 'Star Wars Knights of the Old Republic',
    genre: 'RPG',
    isFavorite: true,
    lastPlayed: '2023-11-25',
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=80&h=80&fit=crop',
    level: 42,
    skillPoints: 3,
    achievements: [
      { id: 1, name: 'Jedi Master', icon: '⚔️', description: 'Complete the Jedi training' },
      { id: 2, name: 'Sith Lord', icon: '🔴', description: 'Embrace the dark side' }
    ]
  },
  {
    id: 2,
    title: 'Legend of Kain Blood Omen',
    genre: 'Adventure',
    isFavorite: false,
    lastPlayed: '2023-10-10',
    image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=80&h=80&fit=crop',
    level: 15,
    skillPoints: 1,
    achievements: [
      { id: 1, name: 'Vampire Lord', icon: '🦇', description: 'Become the ultimate vampire' }
    ]
  },
  {
    id: 3,
    title: 'Star Wars Jedi Knight Outcast',
    genre: 'Action',
    isFavorite: true,
    lastPlayed: '2023-11-28',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=80&h=80&fit=crop',
    level: 28,
    skillPoints: 5,
    achievements: []
  },
  {
    id: 4,
    title: 'Star Wars Jedi Academy',
    genre: 'Action',
    isFavorite: false,
    lastPlayed: '2023-09-15',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=80&h=80&fit=crop',
    level: 10,
    skillPoints: 2,
    achievements: []
  },
  {
    id: 5,
    title: 'Fallout 4',
    genre: 'RPG',
    isFavorite: true,
    lastPlayed: '2023-11-20',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=80&h=80&fit=crop',
    level: 65,
    skillPoints: 0,
    achievements: []
  },
  {
    id: 6,
    title: 'Quake',
    genre: 'FPS',
    isFavorite: false,
    lastPlayed: '2023-08-01',
    image: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=80&h=80&fit=crop',
    level: 100,
    skillPoints: 10,
    achievements: []
  },
  {
    id: 7,
    title: 'Elder Scrolls',
    genre: 'RPG',
    isFavorite: true,
    lastPlayed: '2023-11-10',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=80&h=80&fit=crop',
    level: 50,
    skillPoints: 4,
    achievements: []
  },
  {
    id: 8,
    title: 'Star Wars Force Unleashed',
    genre: 'Action',
    isFavorite: false,
    lastPlayed: '2023-10-01',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=80&h=80&fit=crop',
    level: 22,
    skillPoints: 2,
    achievements: []
  }
];

// --- Generators for Skill Trees ---

const generateSkillTree = (genre, gameTitle) => {
  // Helper to create node
  const n = (id, label, x, y, icon, parentIds = [], status = 'locked', cost = 1) => ({
    id, label, x, y, icon, parentIds, status, cost,
    description: `Unlocks the ${label} ability for superior tactical advantage.`
  });

  if (genre === 'RPG' || genre === 'Adventure') {
    return {
      categories: ['Combat', 'Magic', 'Survival'],
      nodes: [
        // Root
        n('root', 'Core Resonance', 50, 90, Brain, [], 'unlocked', 0),
        
        // Combat Branch (Left)
        n('c1', 'Warrior\'s Stance', 20, 70, Sword, ['root'], 'unlocked', 1),
        n('c2', 'Heavy Strike', 10, 50, Crosshair, ['c1'], 'unlockable', 2),
        n('c3', 'Blade Dance', 30, 50, Zap, ['c1'], 'locked', 2),
        n('c4', 'Berserker Rage', 20, 30, Flame, ['c2', 'c3'], 'locked', 3),
        
        // Magic Branch (Center)
        n('m1', 'Mana Flow', 50, 65, Ghost, ['root'], 'unlocked', 1),
        n('m2', 'Arcane Blast', 50, 45, Star, ['m1'], 'unlockable', 2),
        n('m3', 'Time Dilation', 50, 25, Clock, ['m2'], 'locked', 4),
        
        // Survival Branch (Right)
        n('s1', 'Iron Skin', 80, 70, Shield, ['root'], 'unlocked', 1),
        n('s2', 'Vitality', 70, 50, Heart, ['s1'], 'unlockable', 2),
        n('s3', 'Scavenger', 90, 50, Search, ['s1'], 'locked', 2),
        n('s4', 'Immunity', 80, 30, Activity, ['s2', 's3'], 'locked', 3),
      ]
    };
  } else {
    // Sci-Fi / FPS Tree
    return {
      categories: ['Tech', 'Weaponry', 'Cybernetics'],
      nodes: [
        // Root
        n('root', 'System Link', 50, 90, Cpu, [], 'unlocked', 0),
        
        // Tech (Left)
        n('t1', 'Hacking Module', 25, 75, Wifi, ['root'], 'unlocked', 1),
        n('t2', 'Data Mining', 15, 55, Database, ['t1'], 'unlockable', 2),
        n('t3', 'Bot Control', 35, 55, Bot, ['t1'], 'locked', 2),
        
        // Weaponry (Right)
        n('w1', 'Aim Assist', 75, 75, Crosshair, ['root'], 'unlocked', 1),
        n('w2', 'Recoil Dampener', 65, 55, Activity, ['w1'], 'unlockable', 2),
        n('w3', 'Energy Siphon', 85, 55, Battery, ['w1'], 'locked', 2),
        
        // Ultimate
        n('ult', 'Singularity', 50, 30, Hexagon, ['t2', 't3', 'w2', 'w3'], 'locked', 5),
      ]
    };
  }
};

// --- Neural Skill Tree Component ---

const NeuralSkillTree = ({ game, onClose }) => {
  const [treeData, setTreeData] = useState(() => generateSkillTree(game.genre, game.title));
  const [selectedNode, setSelectedNode] = useState(null);
  const [scale, setScale] = useState(1);
  
  // Handle unlock logic (mock)
  const handleUnlock = (node) => {
    if (node.status === 'unlockable' && game.skillPoints >= node.cost) {
      const newNodes = treeData.nodes.map(n => {
        if (n.id === node.id) return { ...n, status: 'unlocked' };
        // Check if children should be unlockable
        return n;
      });
      
      // Update children status
      const updatedNodes = newNodes.map(n => {
        if (n.status === 'locked') {
          const parents = newNodes.filter(p => n.parentIds.includes(p.id));
          if (parents.some(p => p.status === 'unlocked')) {
            return { ...n, status: 'unlockable' };
          }
        }
        return n;
      });

      setTreeData({ ...treeData, nodes: updatedNodes });
      // In a real app, you'd decrement user skill points here
    }
  };

  // Render connections
  const renderConnections = () => {
    return treeData.nodes.map(node => {
      return node.parentIds.map(parentId => {
        const parent = treeData.nodes.find(n => n.id === parentId);
        if (!parent) return null;

        const isActive = node.status === 'unlocked' && parent.status === 'unlocked';
        const isUnlockable = node.status === 'unlockable' && parent.status === 'unlocked';

        return (
          <svg key={`${parentId}-${node.id}`} className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0">
            <motion.line
              x1={`${parent.x}%`}
              y1={`${parent.y}%`}
              x2={`${node.x}%`}
              y2={`${node.y}%`}
              stroke={isActive ? '#3b82f6' : isUnlockable ? '#475569' : '#1e293b'}
              strokeWidth="2"
              strokeDasharray={isActive ? "0" : "4 4"}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
            {isActive && (
              <motion.circle
                r="3"
                fill="#60a5fa"
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: "100%" }}
                style={{ 
                  offsetPath: `path('M ${parent.x * 10} ${parent.y * 10} L ${node.x * 10} ${node.y * 10}')` 
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            )}
          </svg>
        );
      });
    });
  };

  return (
    <div className="flex h-full w-full bg-slate-950 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      <div className="absolute inset-0" style={{ 
        backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start bg-gradient-to-b from-slate-900 to-transparent">
        <div>
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Games
          </button>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            {game.title} <span className="text-blue-500 text-sm font-mono px-2 py-1 bg-blue-500/10 rounded border border-blue-500/30">NEURAL MATRIX</span>
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase">Available Points</p>
              <p className="text-xl font-bold text-yellow-400">{game.skillPoints}</p>
            </div>
            <Zap className="w-6 h-6 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Tree Container */}
      <div className="flex-1 relative z-10 overflow-hidden">
        <div className="w-full h-full absolute inset-0 flex items-center justify-center">
          <div className="w-[80%] h-[80%] relative">
            {renderConnections()}
            
            {treeData.nodes.map(node => {
              const isLocked = node.status === 'locked';
              const isUnlocked = node.status === 'unlocked';
              const isUnlockable = node.status === 'unlockable';
              
              return (
                <motion.button
                  key={node.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isUnlocked 
                      ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.5)]' 
                      : isUnlockable
                        ? 'bg-slate-800 border-yellow-500/50 hover:border-yellow-400 hover:bg-slate-700 animate-pulse'
                        : 'bg-slate-900 border-slate-700 grayscale opacity-70'
                  }`}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedNode(node)}
                >
                  <node.icon className={`w-7 h-7 ${isUnlocked ? 'text-white' : isUnlockable ? 'text-yellow-400' : 'text-slate-500'}`} />
                  {isLocked && <Lock className="absolute -bottom-1 -right-1 w-5 h-5 text-slate-500 bg-slate-900 rounded-full p-1" />}
                  {isUnlocked && <Check className="absolute -bottom-1 -right-1 w-5 h-5 text-white bg-green-500 rounded-full p-1" />}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Node Details Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute right-0 top-0 bottom-0 w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 z-30 p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <selectedNode.icon className="w-6 h-6 text-blue-400" />
                Node Analysis
              </h3>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">
                <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>
            </div>

            <div className="space-y-6">
              <div className={`p-6 rounded-2xl border ${
                selectedNode.status === 'unlocked' ? 'bg-blue-900/20 border-blue-500/50' :
                selectedNode.status === 'unlockable' ? 'bg-yellow-900/20 border-yellow-500/50' :
                'bg-slate-800/50 border-slate-700'
              }`}>
                <div className="w-16 h-16 rounded-xl bg-slate-800 mb-4 flex items-center justify-center mx-auto border border-white/10">
                  <selectedNode.icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-2xl font-black text-center text-white mb-2">{selectedNode.label}</h4>
                <div className="flex justify-center gap-2 mb-4">
                  <Badge className={
                    selectedNode.status === 'unlocked' ? 'bg-green-500' :
                    selectedNode.status === 'unlockable' ? 'bg-yellow-500' : 'bg-slate-600'
                  }>
                    {selectedNode.status.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="border-slate-600">TIER {selectedNode.cost}</Badge>
                </div>
                <p className="text-slate-300 text-center leading-relaxed">
                  {selectedNode.description}
                </p>
              </div>

              <div className="space-y-4">
                <h5 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Requirements</h5>
                <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-slate-300">Skill Points Required</span>
                  <span className={`font-bold ${game.skillPoints >= selectedNode.cost ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedNode.cost} SP
                  </span>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-slate-300">Prerequisite Nodes</span>
                  <span className={`font-bold ${
                    selectedNode.parentIds.every(pid => treeData.nodes.find(n => n.id === pid)?.status === 'unlocked')
                      ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {selectedNode.parentIds.length === 0 ? 'None' : 
                      selectedNode.parentIds.length === 1 ? '1 Node' : `${selectedNode.parentIds.length} Nodes`
                    }
                  </span>
                </div>
              </div>

              <div className="pt-6">
                {selectedNode.status === 'unlockable' ? (
                  <button
                    onClick={() => handleUnlock(selectedNode)}
                    disabled={game.skillPoints < selectedNode.cost}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                      game.skillPoints >= selectedNode.cost
                        ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {game.skillPoints >= selectedNode.cost ? 'UNLOCK NODE' : 'INSUFFICIENT POINTS'}
                  </button>
                ) : selectedNode.status === 'unlocked' ? (
                  <div className="w-full py-4 rounded-xl bg-green-500/20 border border-green-500/50 text-green-400 font-bold text-center flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" /> NODE ACTIVE
                  </div>
                ) : (
                  <div className="w-full py-4 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-500 font-bold text-center flex items-center justify-center gap-2">
                    <Lock className="w-5 h-5" /> LOCKED
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Tab Component ---

export default function MoveHubTab({ filter = { mode: 'all' } }) {
  const [selectedGame, setSelectedGame] = React.useState(null);

  const filteredGames = React.useMemo(() => {
    let games = [...moveHubGamesData];
    
    if (filter.mode === 'favorites') {
      games = games.filter(g => g.isFavorite);
    } else if (filter.mode === 'recent') {
      games.sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed));
    } else if (filter.mode === 'genre' && filter.value) {
      games = games.filter(g => g.genre === filter.value);
    }
    
    return games;
  }, [filter]);

  if (selectedGame) {
    return <NeuralSkillTree game={selectedGame} onClose={() => setSelectedGame(null)} />;
  }

  return (
    <div className="h-full w-full flex bg-slate-900/50">
      {/* Left Sidebar - Game List */}
      <div className="w-80 h-full flex-shrink-0 border-r border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Select Neural Interface</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search games..." 
              className="w-full bg-slate-800 border-none rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredGames.map((game) => (
            <motion.div
              key={game.id}
              whileHover={{ x: 2, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedGame(game)}
              className="p-3 rounded-xl cursor-pointer flex items-center gap-4 group transition-colors"
            >
              <div className="relative">
                <img
                  src={game.image}
                  alt={game.title}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-700 group-hover:border-blue-500/50 transition-colors"
                />
                {game.isFavorite && (
                  <div className="absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">{game.title}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-500">{game.genre}</span>
                  {game.skillPoints > 0 && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1 border-yellow-500/30 text-yellow-500 bg-yellow-500/10">
                      {game.skillPoints} SP
                    </Badge>
                  )}
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-600 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Right Content - Placeholder */}
      <div className="flex-1 h-full flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
        <div className="text-center z-10 max-w-md px-6">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center animate-pulse">
            <Zap className="w-10 h-10 text-slate-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Neural Matrix Standby</h2>
          <p className="text-slate-400 mb-8">
            Select a compatible game cartridge from the left interface to access its skill tree and neural mapping.
          </p>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
              <div className="text-2xl font-bold text-white mb-1">{filteredGames.length}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Games</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {filteredGames.reduce((acc, g) => acc + (g.skillPoints || 0), 0)}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Total SP</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
              <div className="text-2xl font-bold text-blue-400 mb-1">Active</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Status</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}