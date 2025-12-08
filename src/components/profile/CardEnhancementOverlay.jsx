import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Swords, ArrowLeftRight, Sparkles, Layers, Plus, Hexagon, TrendingUp, Shield } from 'lucide-react';
import ShinyCard from '../shared/ShinyCard';
import { inventoryData } from './mockData';

const MODES = [
  { id: 'train', label: 'Train', icon: Swords, color: 'text-red-400', desc: 'Increase Level & XP' },
  { id: 'combine', label: 'Combine', icon: ArrowLeftRight, color: 'text-blue-400', desc: 'Fusion & Rarity' },
  { id: 'enchant', label: 'Enchant', icon: Sparkles, color: 'text-purple-400', desc: 'Boost Stats' },
  { id: 'tree', label: 'Ability Tree', icon: Layers, color: 'text-cyan-400', desc: 'Evolve Skills' },
];

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
  const [activeMode, setActiveMode] = useState(null); // 'train', 'combine', 'enchant', 'tree'
  const [stats, setStats] = useState({ level: 1, strength: 150, xp: 0, xpToNext: 1000, intelligence: 80, agility: 60 });
  const [fusionMaterial, setFusionMaterial] = useState(null);
  const [selectedNode, setSelectedNode] = useState('root');
  const [unlockedNodes, setUnlockedNodes] = useState(['root']);

  const currentNode = MOCK_SKILL_TREE.find(n => n.id === selectedNode) || MOCK_SKILL_TREE[0];

  const handleTrain = () => {
    setStats(prev => ({ ...prev, xp: prev.xp + 250 }));
  };

  const handleStatBoost = (stat) => {
    setStats(prev => ({ ...prev, [stat]: prev[stat] + 5 }));
  };

  // If no mode selected, show the main menu
  const renderMenu = () => (
    <div className="flex gap-8 items-center justify-center w-full h-full">
      {MODES.map((mode) => (
        <motion.button
          key={mode.id}
          onClick={() => setActiveMode(mode.id)}
          whileHover={{ scale: 1.05, y: -10 }}
          whileTap={{ scale: 0.95 }}
          className="group relative w-64 h-80 rounded-3xl bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-md border border-white/10 flex flex-col items-center justify-center gap-6 transition-all duration-300 pointer-events-auto"
        >
           <div className={`w-20 h-20 rounded-2xl bg-black/20 flex items-center justify-center ${mode.color} shadow-lg group-hover:scale-110 transition-transform`}>
             <mode.icon className="w-10 h-10" />
           </div>
           <div className="text-center">
             <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-2">{mode.label}</h3>
             <p className="text-white/40 text-sm font-medium">{mode.desc}</p>
           </div>
           
           {/* Hover Glow */}
           <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
        </motion.button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-xl pointer-events-auto"
        onClick={onClose}
      />

      {/* Main Content Area */}
      <div className="relative w-full h-full flex flex-col pointer-events-none p-12">
        
        {/* Top Bar (Back Button & Title if Mode Active) */}
        <div className="flex items-center justify-between mb-8 pointer-events-auto">
          {activeMode ? (
             <div className="flex items-center gap-6">
                <button 
                  onClick={() => setActiveMode(null)}
                  className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-widest text-xs transition-all"
                >
                  ← Back to Menu
                </button>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                  {React.createElement(MODES.find(m => m.id === activeMode).icon, { className: `w-8 h-8 ${MODES.find(m => m.id === activeMode).color}` })}
                  {MODES.find(m => m.id === activeMode).label}
                </h2>
             </div>
          ) : <div />}
          
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 relative flex items-center justify-center">
          <AnimatePresence mode="wait">
            {!activeMode ? (
              <motion.div 
                key="menu"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="w-full h-full"
              >
                {renderMenu()}
              </motion.div>
            ) : (
              <motion.div 
                key={activeMode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full h-full flex items-center justify-center gap-16 pointer-events-auto"
              >
                {/* ---------------- TRAIN MODE ---------------- */}
                {activeMode === 'train' && (
                  <>
                    <div className="w-[400px] aspect-[3/4]">
                      <ShinyCard>
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                          <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                            <Swords className="w-12 h-12 text-red-400" />
                          </div>
                          <h2 className="text-3xl font-bold text-white mb-2">{card?.title}</h2>
                          <div className="text-5xl font-black text-white mb-1">{stats.level}</div>
                          <p className="text-white/40 uppercase tracking-widest text-xs">Current Level</p>
                        </div>
                      </ShinyCard>
                    </div>

                    <div className="w-[500px] space-y-8">
                       <div className="space-y-4">
                          <div className="flex justify-between text-lg font-bold">
                            <span className="text-white/60">Experience Progress</span>
                            <span className="text-white">{stats.xp} / {stats.xpToNext} XP</span>
                          </div>
                          <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-red-500 to-orange-500 relative overflow-hidden"
                              initial={{ width: 0 }}
                              animate={{ width: `${(stats.xp / stats.xpToNext) * 100}%` }}
                            >
                               <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </motion.div>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={handleTrain}
                            className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center gap-3 transition-all active:scale-95 group"
                          >
                            <Sparkles className="w-8 h-8 text-yellow-400 group-hover:rotate-12 transition-transform" />
                            <div className="text-center">
                              <div className="font-bold text-white">Small XP Pack</div>
                              <div className="text-xs text-white/40">Feed 250 XP</div>
                            </div>
                          </button>
                          <button 
                            onClick={handleTrain}
                            className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center gap-3 transition-all active:scale-95 group"
                          >
                            <Zap className="w-8 h-8 text-blue-400 group-hover:rotate-12 transition-transform" />
                            <div className="text-center">
                              <div className="font-bold text-white">Mega XP Pack</div>
                              <div className="text-xs text-white/40">Feed 1000 XP</div>
                            </div>
                          </button>
                       </div>
                    </div>
                  </>
                )}

                {/* ---------------- ENCHANT MODE ---------------- */}
                {activeMode === 'enchant' && (
                  <>
                    <div className="w-[400px] aspect-[3/4]">
                      <ShinyCard>
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                          <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                            <Sparkles className="w-12 h-12 text-purple-400" />
                          </div>
                          <h2 className="text-3xl font-bold text-white mb-2">{card?.title}</h2>
                          <p className="text-purple-300 font-medium italic">"Imbued with void energy"</p>
                        </div>
                      </ShinyCard>
                    </div>

                    <div className="w-[500px] space-y-4">
                      {['strength', 'intelligence', 'agility'].map(stat => (
                        <div key={stat} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="p-2 rounded-lg bg-black/20">
                                {stat === 'strength' && <Swords className="w-5 h-5 text-red-400" />}
                                {stat === 'intelligence' && <Zap className="w-5 h-5 text-blue-400" />}
                                {stat === 'agility' && <TrendingUp className="w-5 h-5 text-green-400" />}
                             </div>
                             <div>
                               <div className="text-xs font-bold text-white/40 uppercase tracking-wider">{stat}</div>
                               <div className="text-xl font-black text-white">{stats[stat]}</div>
                             </div>
                          </div>
                          <button 
                            onClick={() => handleStatBoost(stat)}
                            className="w-10 h-10 rounded-full bg-purple-500 hover:bg-purple-400 flex items-center justify-center text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ---------------- COMBINE MODE ---------------- */}
                {activeMode === 'combine' && (
                  <div className="flex w-full gap-12">
                     {/* Left: Fusion Altar */}
                     <div className="w-1/3 flex flex-col items-center justify-center gap-8">
                        <div className="relative">
                           <div className="w-[280px] aspect-[3/4]">
                              <ShinyCard>
                                 <div className="absolute inset-0 flex items-center justify-center">
                                    <h3 className="text-2xl font-bold text-white">{card?.title}</h3>
                                 </div>
                              </ShinyCard>
                           </div>
                           {/* Connection Line */}
                           <div className="absolute -right-12 top-1/2 w-12 h-1 bg-gradient-to-r from-blue-500 to-transparent" />
                        </div>
                        
                        <div className="text-3xl font-black text-white">+</div>

                        <div className={`w-[200px] aspect-[3/4] border-2 border-dashed rounded-xl flex items-center justify-center transition-all ${
                           fusionMaterial ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 bg-white/5'
                        }`}>
                           {fusionMaterial ? (
                             <div className="text-center">
                               <h4 className="font-bold text-blue-300">{fusionMaterial.title}</h4>
                             </div>
                           ) : (
                             <span className="text-white/20 font-bold uppercase">Select Material</span>
                           )}
                        </div>

                        <button 
                          disabled={!fusionMaterial}
                          className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all ${
                            fusionMaterial ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-white/10 text-white/20'
                          }`}
                        >
                          Fuse Cards
                        </button>
                     </div>

                     {/* Right: Collection Network */}
                     <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-3xl p-8 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                           <h3 className="text-xl font-bold text-white flex items-center gap-2">
                             <Layers className="w-5 h-5 text-blue-400" />
                             Collection Network
                           </h3>
                           <span className="text-white/40 text-sm">Select a card to fuse</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                           <div className="grid grid-cols-4 gap-4">
                              {inventoryData.slice(0, 12).map((item, i) => (
                                 <motion.div
                                    key={i}
                                    onClick={() => setFusionMaterial(item)}
                                    whileHover={{ scale: 1.05 }}
                                    className={`aspect-[3/4] rounded-xl bg-slate-800 border cursor-pointer relative overflow-hidden ${
                                       fusionMaterial?.id === item.id 
                                         ? 'border-blue-400 ring-2 ring-blue-400/30' 
                                         : 'border-white/10 hover:border-white/30'
                                    }`}
                                 >
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                                    {item.icon_url && <img src={item.icon_url} className="w-full h-full object-cover" alt="" />}
                                    <div className="absolute bottom-3 left-3 z-20">
                                       <div className="text-xs font-bold text-white">{item.name || `Card ${i+1}`}</div>
                                    </div>
                                 </motion.div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* ---------------- TREE MODE ---------------- */}
                {activeMode === 'tree' && (
                  <div className="w-full h-full flex gap-12">
                     <div className="flex-1 relative bg-white/[0.02] rounded-3xl border border-white/5 overflow-hidden">
                        {/* Connecting Lines */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                          <path d="M 200 300 C 300 300, 300 200, 500 200" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                          <path d="M 200 300 C 300 300, 300 400, 500 400" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                        </svg>

                        <div className="absolute top-[300px] left-[200px] -translate-x-1/2 -translate-y-1/2">
                          <SkillNode 
                            node={MOCK_SKILL_TREE[0]} 
                            selected={selectedNode === 'root'} 
                            unlocked={true}
                            onClick={() => setSelectedNode('root')}
                          />
                        </div>
                        <div className="absolute top-[200px] left-[500px] -translate-x-1/2 -translate-y-1/2">
                          <SkillNode 
                            node={MOCK_SKILL_TREE[1]} 
                            selected={selectedNode === 'branch_1'} 
                            unlocked={unlockedNodes.includes('branch_1')}
                            onClick={() => setSelectedNode('branch_1')}
                          />
                        </div>
                        <div className="absolute top-[400px] left-[500px] -translate-x-1/2 -translate-y-1/2">
                          <SkillNode 
                            node={MOCK_SKILL_TREE[2]} 
                            selected={selectedNode === 'branch_2'} 
                            unlocked={unlockedNodes.includes('branch_2')}
                            onClick={() => setSelectedNode('branch_2')}
                          />
                        </div>
                     </div>

                     <div className="w-[350px] p-8 rounded-3xl bg-white/5 border border-white/10 h-fit backdrop-blur-md">
                        <h3 className="text-2xl font-bold text-white mb-2">{currentNode.name}</h3>
                        <p className="text-white/60 mb-8 leading-relaxed">{currentNode.description}</p>
                        
                        {!unlockedNodes.includes(currentNode.id) ? (
                           <button 
                             onClick={() => setUnlockedNodes([...unlockedNodes, currentNode.id])}
                             className="w-full py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-widest transition-all"
                           >
                             Unlock Ability
                           </button>
                        ) : (
                           <div className="w-full py-4 rounded-xl bg-white/10 text-white/50 text-center font-bold uppercase tracking-widest border border-white/10">
                              Unlocked
                           </div>
                        )}
                     </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
         <Zap className={`w-8 h-8 ${unlocked ? 'text-cyan-300' : 'text-white/20'}`} />
      </div>
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-white/80 tracking-wider uppercase">
         {node.name}
      </div>
    </motion.button>
  );
}