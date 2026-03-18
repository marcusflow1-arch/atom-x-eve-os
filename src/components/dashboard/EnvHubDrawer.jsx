import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Globe, X, ChevronLeft, ChevronRight, Settings, Image as ImageIcon, Box, Bot, Shield, Cpu, ShoppingCart, Map } from 'lucide-react';
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
    slots: '3/5'
  });

  const envList = [
    { id: 'cyber_hub', name: 'Cyber Hub', level: 12, xp: 4500, maxXp: 5000, status: 'Active', thumbnail: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400' },
    { id: 'training_zone', name: 'Training Zone', level: 5, xp: 1200, maxXp: 2000, status: 'Locked', thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400' },
    { id: 'room_1', name: 'Room 1', level: 1, xp: 0, maxXp: 1000, status: 'Available', thumbnail: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400' }
  ];

  const modules = [
    { id: 'skybox', title: 'Skybox Editor', icon: ImageIcon, desc: 'Change environment visuals and atmosphere.', action: 'Configure' },
    { id: 'structure', title: 'Structure Builder', icon: Box, desc: 'Add shops, buildings, and portals.', action: 'Build' },
    { id: 'ai_npc', title: 'AI/NPC System', icon: Bot, desc: 'Assign AI agents or companions to this zone.', action: 'Manage' },
    { id: 'skill_zones', title: 'Skill Zones', icon: Shield, desc: 'Configure training areas and combat arenas.', action: 'Edit' },
    { id: 'resources', title: 'Resource Systems', icon: Cpu, desc: 'Manage generators, farms, and economy.', action: 'Optimize' },
    { id: 'marketplace', title: 'Marketplace Access', icon: ShoppingCart, desc: 'Link commerce modules to this world.', action: 'Open' },
    { id: 'fast_travel', title: 'Fast Travel / Portal', icon: Map, desc: 'Setup teleportation and routing nodes.', action: 'Route' }
  ];

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
            {/* LEFT PANEL (15%) */}
            <div className="w-[15%] h-full flex flex-col border-r border-white/10 bg-black/40 overflow-hidden relative">
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
                    <p className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">{selectedEnv.status}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-white/60">LVL {selectedEnv.level}</span>
                  <span className="text-[9px] text-white/40">{selectedEnv.xp} / {selectedEnv.maxXp} XP</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${(selectedEnv.xp / selectedEnv.maxXp) * 100}%` }} />
                </div>
              </div>

              {/* List of Environments */}
              <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-2 mb-2 mt-2">All Worlds</p>
                <div className="flex flex-col gap-1">
                  {envList.map(env => (
                    <button
                      key={env.id}
                      onClick={() => setSelectedEnv(env)}
                      className={`flex flex-col p-2 rounded-lg transition-all border text-left ${selectedEnv.id === env.id ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <img src={env.thumbnail} alt={env.name} className="w-6 h-6 rounded object-cover border border-white/10" />
                        <span className={`text-xs font-bold truncate ${selectedEnv.id === env.id ? 'text-cyan-400' : 'text-white/80'}`}>{env.name}</span>
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[9px] font-bold text-white/50">LVL {env.level}</span>
                        <div className="flex-1 ml-2 mr-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${selectedEnv.id === env.id ? 'bg-cyan-400' : 'bg-white/30'}`} style={{ width: `${(env.xp / env.maxXp) * 100}%` }} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL (85%) */}
            <div className="w-[85%] h-full flex flex-col relative" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(30,40,60,0.4) 0%, transparent 70%)' }}>
              {/* TOP BAR */}
              <div className="h-[12%] min-h-[80px] border-b border-white/10 px-8 flex items-center justify-between flex-shrink-0 bg-black/20">
                <div>
                  <h1 className="text-3xl font-black tracking-wide text-white drop-shadow-lg flex items-center gap-3">
                    <Globe className="w-8 h-8 text-cyan-400" />
                    {selectedEnv.name}
                  </h1>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">LEVEL {selectedEnv.level}</span>
                      <span className="text-xs text-white/50">{selectedEnv.xp} / {selectedEnv.maxXp} XP</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
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

              {/* MAIN CONTENT AREA */}
              <div className="flex-1 overflow-y-auto p-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="grid grid-cols-3 lg:grid-cols-4 gap-4 content-start">
                  {modules.map((mod, i) => {
                    const Icon = mod.icon;
                    return (
                      <motion.div
                        key={mod.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group relative rounded-xl overflow-hidden cursor-pointer"
                        style={{
                          background: 'linear-gradient(135deg, rgba(30,40,50,0.6) 0%, rgba(15,20,30,0.8) 100%)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="p-5 flex flex-col h-full min-h-[160px] relative z-10">
                          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-cyan-400/50 transition-all duration-300">
                            <Icon className="w-5 h-5 text-cyan-400" />
                          </div>
                          
                          <h4 className="text-base font-bold text-white mb-2">{mod.title}</h4>
                          <p className="text-xs text-white/50 leading-relaxed flex-1">{mod.desc}</p>
                          
                          <button className="mt-4 w-full py-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/50 text-xs font-bold text-white transition-all">
                            {mod.action}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}