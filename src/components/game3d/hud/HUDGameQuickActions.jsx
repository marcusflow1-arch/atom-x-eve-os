import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users as UsersIcon, Library, Package, Zap, X, ChevronRight, Play, Shield, Trophy, User } from 'lucide-react';
import { libraryGames } from '@/components/dashboard/gamehub/mockLibraryData';

/**
 * In-game quick-action launcher.
 * Sits directly below the Active Quest tracker on the left HUD column.
 * Four pills: Friends, Library, Inventory, Ability/Skill.
 * Clicking a pill opens a slide-in panel mirroring the LibrarySidebar UI design.
 */
const FRIENDS_MOCK = [
  { id: 1, name: 'Shadow_Striker', status: 'online', game: 'Cyberpunk 2088', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
  { id: 2, name: 'CyberVixen', status: 'online', game: 'Final Fantasy XIV', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { id: 3, name: 'GhostReaper', status: 'idle', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150' },
  { id: 4, name: 'NovaStar', status: 'online', game: 'League of Legends', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' },
  { id: 5, name: 'VoidKnight', status: 'online', game: 'Elden Ring', avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150' },
];

const INVENTORY_MOCK = [
  { name: 'Health Potion', qty: 12, icon: Package, color: 'text-red-400', bg: 'bg-red-500/10', rarity: 'Common' },
  { name: 'Mana Crystal', qty: 5, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10', rarity: 'Rare' },
  { name: 'Shadow Blade', qty: 1, icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', rarity: 'Legendary' },
  { name: 'Void Armor', qty: 1, icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', rarity: 'Epic' },
  { name: 'Phoenix Feather', qty: 3, icon: Trophy, color: 'text-orange-400', bg: 'bg-orange-500/10', rarity: 'Epic' },
];

const ABILITIES_MOCK = [
  { name: 'Lightning Strike', level: 5, type: 'Active', icon: Zap, color: 'text-yellow-300', bg: 'bg-yellow-500/10', cooldown: '8s' },
  { name: 'Shadow Teleport', level: 3, type: 'Active', icon: Zap, color: 'text-purple-300', bg: 'bg-purple-500/10', cooldown: '12s' },
  { name: 'Frost Tornado', level: 4, type: 'Active', icon: Zap, color: 'text-cyan-300', bg: 'bg-cyan-500/10', cooldown: '20s' },
  { name: 'Iron Skin', level: 2, type: 'Passive', icon: Shield, color: 'text-slate-300', bg: 'bg-slate-500/10', cooldown: '—' },
  { name: 'Critical Edge', level: 6, type: 'Passive', icon: Trophy, color: 'text-amber-300', bg: 'bg-amber-500/10', cooldown: '—' },
];

const PILLS = [
  { id: 'friends', icon: UsersIcon, label: 'Friends', accent: 'text-green-400', activeBg: 'bg-green-500/20', activeBorder: 'border-green-400/50', hoverText: 'hover:text-green-400', hoverBorder: 'hover:border-green-400/40', hoverBg: 'hover:bg-green-500/10' },
  { id: 'library', icon: Library, label: 'Library', accent: 'text-cyan-400', activeBg: 'bg-cyan-500/20', activeBorder: 'border-cyan-400/50', hoverText: 'hover:text-cyan-400', hoverBorder: 'hover:border-cyan-400/40', hoverBg: 'hover:bg-cyan-500/10' },
  { id: 'inventory', icon: Package, label: 'Inventory', accent: 'text-amber-400', activeBg: 'bg-amber-500/20', activeBorder: 'border-amber-400/50', hoverText: 'hover:text-amber-400', hoverBorder: 'hover:border-amber-400/40', hoverBg: 'hover:bg-amber-500/10' },
  { id: 'skills', icon: Zap, label: 'Ability', accent: 'text-purple-400', activeBg: 'bg-purple-500/20', activeBorder: 'border-purple-400/50', hoverText: 'hover:text-purple-400', hoverBorder: 'hover:border-purple-400/40', hoverBg: 'hover:bg-purple-500/10' },
];

export default function HUDGameQuickActions() {
  const [activePanel, setActivePanel] = useState(null);

  const panelTitle =
    activePanel === 'friends' ? 'Friends' :
    activePanel === 'library' ? 'My Library' :
    activePanel === 'inventory' ? 'Inventory' :
    activePanel === 'skills' ? 'Abilities & Skills' : '';

  return (
    <>
      {/* Pills moved into HUDVitalsRow above the Fusion gauge */}

      {/* Slide-in panel — same glass treatment as LibrarySidebar expanded panel */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            key={`hud-panel-${activePanel}`}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed z-[69] flex flex-col overflow-hidden pointer-events-auto"
            style={{
              left: '70px',
              top: '64px',
              bottom: '52px',
              width: '260px',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(50px) saturate(200%)',
              WebkitBackdropFilter: 'blur(50px) saturate(200%)',
              boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">{panelTitle}</span>
              <button onClick={() => setActivePanel(null)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'none' }}>
              {activePanel === 'friends' && FRIENDS_MOCK.map((friend) => (
                <button
                  key={friend.id}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="relative flex-shrink-0">
                    <img src={friend.avatar} alt={friend.name} className="w-8 h-8 rounded-full object-cover" />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black/60 ${
                      friend.status === 'online' ? 'bg-green-500' :
                      friend.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{friend.name}</p>
                    <p className="text-white/40 text-[10px] truncate">{friend.game || friend.status}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-white/30 flex-shrink-0" />
                </button>
              ))}

              {activePanel === 'library' && libraryGames.map((game, i) => (
                <button
                  key={game.id || i}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-8 h-10 rounded flex-shrink-0 overflow-hidden bg-black/40">
                    <img src={game.cover || game.cover_image || ''} alt={game.title || game.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{game.title || game.name}</p>
                    <p className="text-white/40 text-[10px]">Ready to play</p>
                  </div>
                  <Play className="w-3 h-3 text-cyan-400/70 flex-shrink-0" />
                </button>
              ))}

              {activePanel === 'inventory' && (
                <div className="px-4 py-2">
                  <p className="text-[9px] text-amber-400/70 font-bold uppercase tracking-widest mb-2">Carried Items</p>
                  {INVENTORY_MOCK.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <button key={i} className="w-full flex items-center gap-3 py-2 hover:bg-white/5 rounded-lg transition-colors text-left">
                        <div className={`w-8 h-8 rounded-lg ${item.bg} border border-white/10 flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{item.name}</p>
                          <p className="text-white/40 text-[10px] truncate">{item.rarity}</p>
                        </div>
                        <span className="text-[10px] text-white/60 font-mono flex-shrink-0">×{item.qty}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {activePanel === 'skills' && (
                <div className="px-4 py-2">
                  <p className="text-[9px] text-purple-400/70 font-bold uppercase tracking-widest mb-2">Unlocked Abilities</p>
                  {ABILITIES_MOCK.map((sk, i) => {
                    const Icon = sk.icon;
                    return (
                      <button key={i} className="w-full flex items-center gap-3 py-2 hover:bg-white/5 rounded-lg transition-colors text-left">
                        <div className={`w-8 h-8 rounded-lg ${sk.bg} border border-white/10 flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${sk.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{sk.name}</p>
                          <p className="text-white/40 text-[10px] truncate">{sk.type} • Lv {sk.level}</p>
                        </div>
                        <span className="text-[9px] text-white/40 flex-shrink-0">{sk.cooldown}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}