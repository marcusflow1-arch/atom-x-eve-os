import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Globe, X, ChevronLeft, ChevronRight, Settings, Image as ImageIcon, Box, Bot, Shield, Cpu, ShoppingCart, Map, Lock, Unlock, Zap, Eye, Play, PenTool, Shirt, Home, Car, Swords, Layers } from 'lucide-react';
import EnvironmentHub from '@/components/environment/EnvironmentHub';

export default function EnvHubDrawer({ open, onClose, currentEnvId, onSelectEnv }) {
  const [selectedEnv, setSelectedEnv] = useState({
    id: 'cyber_hub',
    name: 'Cyber Hub',
    level: 12,
    xp: 4500,
    maxXp: 5000,
    status: 'Active',
    thumbnail: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400',
    capacity: '8/10',
    energy: '450/500',
    slots: '3/5',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920'
  });

  const envList = [
    { id: 'cyber_hub', name: 'Cyber Hub', level: 12, xp: 4500, maxXp: 5000, status: 'Active', thumbnail: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400', image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920' },
    { id: 'training_zone', name: 'Training Zone', level: 5, xp: 1200, maxXp: 2000, status: 'Locked', thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920' },
    { id: 'room_1', name: 'Room 1', level: 1, xp: 0, maxXp: 1000, status: 'Available', thumbnail: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400', image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920' }
  ];

  const initialModules = [
    { 
      id: 'wardrobe', title: 'Wardrobe', icon: Shirt, 
      upgrades: [
        { id: 'w1', name: 'Upgrade Clothing Racks', unlocked: true },
        { id: 'w2', name: 'Upgrade Color Customization', unlocked: true },
        { id: 'w3', name: 'Upgrade Advanced Fabrics', unlocked: false },
        { id: 'w4', name: 'Upgrade Holographic Mirrors', unlocked: false }
      ]
    },
    { 
      id: 'housing', title: 'Housing', icon: Home, 
      upgrades: [
        { id: 'h1', name: 'Upgrade Basic Living Quarters', unlocked: true },
        { id: 'h2', name: 'Upgrade Furniture Tools', unlocked: false },
        { id: 'h3', name: 'Upgrade Trophy Display', unlocked: false },
        { id: 'h4', name: 'Upgrade Floor Plan', unlocked: false }
      ]
    },
    { 
      id: 'cars', title: 'Car Collection', icon: Car, 
      upgrades: [
        { id: 'c1', name: 'Upgrade Garage Space', unlocked: true },
        { id: 'c2', name: 'Upgrade Tuning Shop', unlocked: false },
        { id: 'c3', name: 'Upgrade Paint Booth', unlocked: false },
        { id: 'c4', name: 'Upgrade Test Track', unlocked: false }
      ]
    },
    { 
      id: 'equipment', title: 'Equipment', icon: Shield, 
      upgrades: [
        { id: 'e1', name: 'Upgrade Basic Armory', unlocked: true },
        { id: 'e2', name: 'Upgrade Weapon Racks', unlocked: false },
        { id: 'e3', name: 'Upgrade Enchantment Station', unlocked: false },
        { id: 'e4', name: 'Upgrade Forge', unlocked: false }
      ]
    },
    { 
      id: 'market', title: 'Marketplace', icon: ShoppingCart, 
      upgrades: [
        { id: 'm1', name: 'Upgrade Local Kiosks', unlocked: true },
        { id: 'm2', name: 'Upgrade Global Trade Terminal', unlocked: false },
        { id: 'm3', name: 'Upgrade Black Market Access', unlocked: false },
        { id: 'm4', name: 'Upgrade Auction House', unlocked: false }
      ]
    },
    { 
      id: 'training', title: 'Training Room', icon: Swords, 
      upgrades: [
        { id: 't1', name: 'Upgrade Dummy Targets', unlocked: true },
        { id: 't2', name: 'Upgrade AI Sparring Bots', unlocked: false },
        { id: 't3', name: 'Upgrade Simulation Hazards', unlocked: false },
        { id: 't4', name: 'Upgrade Combat Analytics', unlocked: false }
      ]
    },
    { 
      id: 'cards', title: 'Card Collection', icon: Layers, 
      upgrades: [
        { id: 'cc1', name: 'Upgrade Deck Builder', unlocked: true },
        { id: 'cc2', name: 'Upgrade Holographic Displays', unlocked: false },
        { id: 'cc3', name: 'Upgrade Trading Binders', unlocked: false }
      ]
    },
    { 
      id: 'ai_npc', title: 'AI / NPC System', icon: Bot, 
      upgrades: [
        { id: 'a1', name: 'Upgrade Basic Pathfinding', unlocked: true },
        { id: 'a2', name: 'Upgrade Dialog Trees', unlocked: false },
        { id: 'a3', name: 'Upgrade Companion Logic', unlocked: false }
      ]
    },
    { 
      id: 'portals', title: 'Portals & Travel', icon: Map, 
      upgrades: [
        { id: 'p1', name: 'Upgrade Local Teleporters', unlocked: true },
        { id: 'p2', name: 'Upgrade Cross-Realm Gates', unlocked: false },
        { id: 'p3', name: 'Upgrade Starship Dock', unlocked: false }
      ]
    },
  ];

  const [modules, setModules] = useState(initialModules);
  const [selectedModuleId, setSelectedModuleId] = useState(initialModules[0].id);

  const selectedModule = modules.find(m => m.id === selectedModuleId);

  const handleUpgradeToggle = (modId, upId) => {
    setModules(prev => prev.map(m => {
      if (m.id !== modId) return m;
      return {
        ...m,
        upgrades: m.upgrades.map(u => u.id === upId ? { ...u, unlocked: !u.unlocked } : u)
      };
    }));
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed z-[35] left-0 right-0 bg-[#080808] shadow-2xl border-t border-white/10"
          style={{ top: '64px', bottom: '48px', pointerEvents: 'all' }}
        >
          <div className="flex w-full h-full text-white font-sans overflow-hidden bg-transparent">
            {/* LEFT PANEL (15%) - Environment Navigation */}
            <div className="w-[15%] h-full flex flex-col border-r border-white/10 bg-black/60 overflow-hidden relative backdrop-blur-md">
              {/* Back / Close button */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <button 
                  onClick={onClose}
                  className="flex items-center gap-2 text-sm font-bold text-white/40 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                </button>
              </div>

              {/* Selected Environment Summary (Fixed) */}
              <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                    <img src={selectedEnv.thumbnail} alt={selectedEnv.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold truncate text-white">{selectedEnv.name}</h3>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${selectedEnv.status === 'Active' ? 'text-cyan-400' : selectedEnv.status === 'Locked' ? 'text-red-400' : 'text-green-400'}`}>
                      {selectedEnv.status}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-white/60">LVL {selectedEnv.level}</span>
                  <span className="text-[9px] text-white/40">{selectedEnv.xp} / {selectedEnv.maxXp} XP</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full transition-all duration-500" style={{ width: `${(selectedEnv.xp / selectedEnv.maxXp) * 100}%` }} />
                </div>
              </div>

              {/* List of Environments */}
              <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-2 mb-2 mt-2">All Worlds</p>
                <div className="flex flex-col gap-1">
                  {envList.map(env => (
                    <button
                      key={env.id}
                      onClick={() => {
                        setSelectedEnv(env);
                        if (onSelectEnv) onSelectEnv(env);
                      }}
                      className={`flex flex-col p-2 rounded-lg transition-all border text-left ${selectedEnv.id === env.id ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <img src={env.thumbnail} alt={env.name} className="w-6 h-6 rounded object-cover border border-white/10" />
                        <span className={`text-xs font-bold truncate ${selectedEnv.id === env.id ? 'text-cyan-400' : 'text-white/80'}`}>{env.name}</span>
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[9px] font-bold text-white/50">LVL {env.level}</span>
                        <div className="flex-1 ml-2 mr-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${selectedEnv.id === env.id ? 'bg-cyan-400' : 'bg-white/30'}`} style={{ width: `${(env.xp / env.maxXp) * 100}%` }} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CENTER PANEL (50%) - Feature Control System */}
            <div className="w-[50%] h-full flex flex-col relative border-r border-white/10 bg-[#0a0d14]">
              {/* TOP BAR */}
              <div className="h-[15%] min-h-[100px] border-b border-white/10 px-8 flex flex-col justify-center flex-shrink-0 bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-black tracking-wide text-white drop-shadow-lg flex items-center gap-3">
                      <Globe className="w-8 h-8 text-cyan-400" />
                      {selectedEnv.name}
                    </h1>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">LEVEL {selectedEnv.level}</span>
                        <span className="text-xs text-white/50">{selectedEnv.xp} / {selectedEnv.maxXp} XP</span>
                      </div>
                      <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 rounded-full transition-all duration-500" style={{ width: `${(selectedEnv.xp / selectedEnv.maxXp) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 bg-black/40 p-4 rounded-xl border border-white/5">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Capacity</span>
                      <span className="text-sm font-bold text-white">{selectedEnv.capacity}</span>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Energy</span>
                      <span className="text-sm font-bold text-amber-400">{selectedEnv.energy}</span>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Slots</span>
                      <span className="text-sm font-bold text-white">{selectedEnv.slots}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MAIN CONTENT AREA */}
              <div className="flex-1 overflow-y-auto p-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Feature Modules
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {modules.map((mod, i) => {
                    const Icon = mod.icon;
                    const isUnlocked = mod.status === 'Unlocked';
                    return (
                      <motion.div
                        key={mod.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`group relative rounded-xl overflow-hidden border ${isUnlocked ? 'border-white/10' : 'border-red-500/20'} transition-all`}
                        style={{
                          background: isUnlocked ? 'linear-gradient(135deg, rgba(30,40,50,0.4) 0%, rgba(15,20,30,0.6) 100%)' : 'rgba(20,10,10,0.4)',
                          boxShadow: isUnlocked ? '0 4px 20px rgba(0,0,0,0.2)' : 'none',
                        }}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${isUnlocked ? 'from-cyan-500/5' : 'from-red-500/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                        
                        <div className="p-5 flex flex-col h-full relative z-10">
                          <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 rounded-lg ${isUnlocked ? 'bg-white/5 border-white/10' : 'bg-red-500/10 border-red-500/20'} border flex items-center justify-center transition-colors duration-300`}>
                              <Icon className={`w-5 h-5 ${isUnlocked ? 'text-cyan-400' : 'text-red-400'}`} />
                            </div>
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isUnlocked ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                              {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                              {mod.status}
                            </div>
                          </div>
                          
                          <h4 className={`text-base font-bold mb-4 ${isUnlocked ? 'text-white' : 'text-white/60'}`}>{mod.title}</h4>
                          
                          <div className="mt-auto flex gap-2">
                            {isUnlocked ? (
                              <>
                                <button className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs font-bold text-white transition-all flex items-center justify-center gap-2">
                                  Manage
                                </button>
                                <button className="flex-1 py-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-bold text-cyan-400 transition-all flex items-center justify-center gap-2">
                                  <Zap className="w-3 h-3" /> Upgrade
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={() => handleModuleAction(mod.id, mod.status)}
                                className="w-full py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 transition-all flex items-center justify-center gap-2"
                              >
                                Unlock Module
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL (35%) - Live Environment Preview */}
            <div className="w-[35%] h-full relative overflow-hidden bg-black flex flex-col">
              {/* Image Preview with Parallax-like scale */}
              <motion.div 
                className="absolute inset-0"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <img src={selectedEnv.image} alt={selectedEnv.name} className="w-full h-full object-cover opacity-60" />
              </motion.div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

              {/* Status Indicators overlaid on preview */}
              <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10 pointer-events-none">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live Preview</span>
                </div>
                <div className="flex flex-col gap-2">
                  {modules.filter(m => m.status === 'Unlocked').map(m => (
                    <div key={`preview-${m.id}`} className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30">
                      <m.icon className="w-3 h-3 text-cyan-400" />
                      <span className="text-[10px] font-bold text-cyan-100 uppercase tracking-wider">{m.title} Active</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Overlay at bottom */}
              <div className="absolute bottom-12 left-8 right-8 z-10 flex flex-col gap-3">
                <button className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] flex items-center justify-center gap-3 group">
                  <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                  Enter World
                </button>
                <button className="w-full py-3 rounded-xl bg-black/50 backdrop-blur-md border border-white/20 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                  <PenTool className="w-4 h-4" />
                  Edit Mode
                </button>
              </div>

              {/* Target Reticle decoration */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/10 rounded-full flex items-center justify-center pointer-events-none">
                <div className="w-2 h-2 bg-cyan-400/50 rounded-full" />
                <div className="absolute top-0 w-px h-4 bg-white/20" />
                <div className="absolute bottom-0 w-px h-4 bg-white/20" />
                <div className="absolute left-0 w-4 h-px bg-white/20" />
                <div className="absolute right-0 w-4 h-px bg-white/20" />
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}