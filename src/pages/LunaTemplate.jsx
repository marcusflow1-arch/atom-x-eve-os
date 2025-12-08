import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Circle, X, ArrowLeft, Settings,
  Home, BookOpen, Zap, Sword, Gamepad2, Target, Layers,
  ChevronLeft, ChevronRight, User, Trophy, MessageSquare, Shield, Swords, Bot
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import InventoryPanel from '../components/profile/InventoryPanel';
import LunaStatsPanel from '../components/profile/LunaStatsPanel';
import LunaCardScroll from '../components/profile/LunaCardScroll';
import SettingsPanel from '../components/dashboard/SettingsPanel';
import LoadoutPanel from '../components/dashboard/LoadoutPanel';
import GenreMastery from './GenreMastery';
import BattleModeOverlay from '../components/dashboard/BattleModeOverlay';
import AIHomeOverlay from '../components/dashboard/AIHomeOverlay';
import AIStoryOverlay from '../components/dashboard/AIStoryOverlay';
import { inventoryData, profileData } from '../components/profile/mockData';
import { DragDropContext } from '@hello-pangea/dnd';
import { useDashboardMode } from '../components/dashboard/DashboardModeContext';
import UserInterfaceView from '../components/dashboard/views/UserInterfaceView';

// Orbital Menu Items
const ORBITAL_ITEMS = [
  { 
    id: 'skill-tree', 
    label: 'Skill Tree', 
    icon: Layers, 
    color: 'from-purple-500 to-pink-500', 
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    description: 'View & Unlock Abilities'
  },
  { 
    id: 'battle', 
    label: 'Battle Mode', 
    icon: Swords, 
    color: 'from-red-500 to-orange-500', 
    route: 'Challenges',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    description: 'Enter Combat Arena'
  },
  { 
    id: 'console', 
    label: 'Console', 
    icon: Gamepad2, 
    color: 'from-blue-500 to-cyan-500', 
    route: 'AIConsole',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400',
    description: 'Launch Game Hub'
  },
  { 
    id: 'story', 
    label: 'AI Story', 
    icon: BookOpen, 
    color: 'from-indigo-500 to-purple-500', 
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
    description: 'Continue Your Journey'
  },
  { 
    id: 'home', 
    label: 'AI Home', 
    icon: Home, 
    color: 'from-green-500 to-emerald-500', 
    route: 'Dashboard',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400',
    description: 'Personal Space'
  },
  { 
    id: 'loadout', 
    label: 'Loadout', 
    icon: Shield, 
    color: 'from-amber-500 to-yellow-500', 
    route: 'Profile',
    image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400',
    description: 'Customize Equipment'
  },
  { 
    id: 'games', 
    label: 'PINGAMES', 
    icon: Gamepad2, 
    color: 'from-cyan-500 to-blue-500', 
    route: 'Library',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400',
    description: 'Your Game Library'
  },
];

export default function LunaTemplate() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const { mode } = useDashboardMode();

  const itemCount = ORBITAL_ITEMS.length;
  const angleStep = 360 / itemCount;

  const getItemPosition = (index) => {
    const angle = ((index - activeIndex) * angleStep) * (Math.PI / 180);
    const radius = 350;
    const x = Math.sin(angle) * radius;
    const y = Math.cos(angle) * radius;
    const scale = index === activeIndex ? 1 : 0.75;
    const opacity = index === activeIndex ? 1 : 0.5;
    const zIndex = index === activeIndex ? 20 : 10;

    return { x, y, scale, opacity, zIndex };
  };

  const handleBoxClick = () => {
    setShowInventory(true);
  };

  if (mode === 'user') {
    return (
      <div className="h-screen w-full bg-slate-900 pt-24 px-8 pb-8">
        <UserInterfaceView />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={() => {}}>
      <div 
        className="min-h-screen text-white p-8 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 25%, #3d4a5c 50%, #2d3548 75%, #1a1f2e 100%)' }}
      >
        {/* Circle Icon Button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="fixed top-24 left-8 z-40 w-11 h-11 rounded-full bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10"
          style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
        >
          <Circle className="w-5 h-5 text-white/80" />
        </button>

        {/* Settings Gear Icon */}
        <motion.button
          className="absolute top-4 right-4 z-40 w-12 h-12 rounded-full bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10 text-white"
          style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
          onClick={() => setShowSettings(true)}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
        >
          <Settings className="w-6 h-6 text-white/80" />
        </motion.button>

        {/* Orbital Menu */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full transition-opacity duration-500 z-30 pointer-events-none`}>
          <div className="relative w-full h-full pointer-events-auto">
          {ORBITAL_ITEMS.map((item, index) => {
            const { x, y, scale, opacity, zIndex } = getItemPosition(index);
            const Icon = item.icon;
            const isActive = index === activeIndex;

            return (
              <motion.div
                key={item.id}
                className="absolute top-1/2 left-1/2 cursor-pointer"
                style={{
                  x: x - 140,
                  y: y - 105,
                  zIndex,
                }}
                animate={{
                  scale,
                  opacity,
                }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 100, 
                  damping: 25,
                  mass: 0.8
                }}
                onClick={() => setActiveDrawer(item)}
              >
                <motion.div
                  className={`w-[280px] h-[210px] rounded-3xl overflow-hidden transition-all duration-500 flex flex-col items-center justify-center text-center p-6 ${
                    isActive 
                      ? 'border-2 border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.3)]' 
                      : 'border border-white/10'
                  }`}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    background: 'rgba(255, 255, 255, 0.15)',
                    transition: { duration: 0.3 }
                  }}
                >
                  {/* Icon Badge */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg mb-4 bg-opacity-80 backdrop-blur-sm`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Card Content */}
                  <div>
                    <h3 className="text-white font-bold text-xl mb-2 tracking-wide">{item.label}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{item.description}</p>
                  </div>

                  {/* Active Highlight Ring */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-3xl border-2 border-white/60 pointer-events-none"
                      animate={{
                        boxShadow: [
                          '0 0 30px rgba(255,255,255,0.5)',
                          '0 0 50px rgba(255,255,255,0.8)',
                          '0 0 30px rgba(255,255,255,0.5)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              </motion.div>
            );
          })}
          </div>
        </div>

        {/* Universal Slide-Out Drawer */}
        <AnimatePresence>
          {activeDrawer && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setActiveDrawer(null)}
              />
              <motion.div
                initial={['home', 'settings', 'skill-tree', 'battle', 'story'].includes(activeDrawer.id) ? { opacity: 0, scale: 0.95 } : { x: '-100%', opacity: 0 }}
                animate={['home', 'settings', 'skill-tree', 'battle', 'story'].includes(activeDrawer.id) ? { opacity: 1, scale: 1 } : { x: 0, opacity: 1 }}
                exit={['home', 'settings', 'skill-tree', 'battle', 'story'].includes(activeDrawer.id) ? { opacity: 0, scale: 0.95 } : { x: '-100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col ${
                  ['settings', 'skill-tree', 'battle', 'home', 'story'].includes(activeDrawer.id)
                    ? 'inset-0' 
                    : 'left-0 rounded-3xl'
                }`}
                style={['home', 'settings', 'skill-tree', 'battle', 'story'].includes(activeDrawer.id) ? { 
                  WebkitBackdropFilter: 'blur(50px) saturate(200%)' 
                } : { 
                  top: '80px',
                  bottom: '48px',
                  width: '28vw',
                  WebkitBackdropFilter: 'blur(50px) saturate(200%)' 
                }}
              >
                {/* Header - Hidden for full screen apps that have their own header */}
                {!['skill-tree', 'battle', 'home', 'story'].includes(activeDrawer.id) && (
                  <div className="p-6 flex items-center justify-between">
                    <h2 className="text-white font-bold text-xl tracking-wider uppercase">{activeDrawer.label}</h2>
                    <button 
                      onClick={() => setActiveDrawer(null)}
                      className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                    >
                      <X className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                )}

                {/* Close Button Overlay for Full Screen Apps (Story has its own internal close button) */}
                {['battle', 'home'].includes(activeDrawer.id) && (
                  <button 
                    onClick={() => setActiveDrawer(null)}
                    className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}

                {/* Content Area */}
                <div className={`flex-1 overflow-y-auto ${activeDrawer.id === 'skill-tree' ? '' : 'p-6'}`}>
                  {activeDrawer.id === 'loadout' ? (
                    <LoadoutPanel />
                  ) : activeDrawer.id === 'settings' ? (
                    <SettingsPanel />
                  ) : activeDrawer.id === 'skill-tree' ? (
                    <GenreMastery onClose={() => setActiveDrawer(null)} />
                  ) : activeDrawer.id === 'battle' ? (
                    <BattleModeOverlay onClose={() => setActiveDrawer(null)} />
                  ) : activeDrawer.id === 'home' ? (
                    <AIHomeOverlay onClose={() => setActiveDrawer(null)} />
                  ) : activeDrawer.id === 'story' ? (
                    <AIStoryOverlay onClose={() => setActiveDrawer(null)} />
                  ) : activeDrawer.id === 'games' ? (
                    <div className="space-y-6">
                      {/* Pinned Games Header */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-white/80 font-semibold text-sm uppercase tracking-wider">Pinned Games</h3>
                        <span className="text-white/40 text-xs">Quick Access</span>
                      </div>

                      {/* Pinned Games Grid */}
                      <div className="grid grid-cols-7 gap-3">
                        {Array.from({ length: 70 }, (_, i) => {
                          const games = [
                            { title: 'Cyberpunk 2088', genre: 'RPG', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', status: 'Playing' },
                            { title: 'Neon Legends', genre: 'Action', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', status: 'Installed' },
                            { title: 'Stellar Odyssey', genre: 'Space Sim', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400', status: 'Playing' },
                            { title: 'Shadow Realm', genre: 'Fantasy', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', status: 'Installed' },
                          ];
                          const game = games[i % games.length];
                          return { ...game, index: i };
                        }).map((game, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.02, 1) }}
                            onClick={() => setSelectedGame(game)}
                            className="group relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border border-white/10 hover:border-cyan-400/50 transition-all"
                          >
                            {/* Game Image */}
                            <img src={game.image} alt={game.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                            
                            {/* Status Badge */}
                            <div className="absolute top-1 right-1">
                              <div className={`w-2 h-2 rounded-full ${
                                game.status === 'Playing' ? 'bg-green-400' : 'bg-blue-400'
                              }`} />
                            </div>

                            {/* Game Info - Only on hover */}
                            <div className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white/60 text-[8px] uppercase tracking-wider mb-0.5">{game.genre}</p>
                              <h4 className="text-white font-bold text-[10px] mb-1 truncate">{game.title}</h4>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Add More Games */}
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="w-full border-2 border-dashed border-white/20 hover:border-cyan-400/50 rounded-xl py-8 text-white/40 hover:text-white/80 transition-all flex flex-col items-center justify-center gap-2"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                          <Gamepad2 className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold">Pin More Games</span>
                      </motion.button>
                    </div>
                  ) : (
                    <p className="text-white/40 text-sm">{activeDrawer.label} content will appear here</p>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Game Detail Drawer - Slides from Right */}
        <AnimatePresence>
          {selectedGame && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={() => setSelectedGame(null)}
              />
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 border-l rounded-none bg-white/[0.03] backdrop-blur-3xl border-white/[0.08] z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col"
                style={{ 
                  top: '80px',
                  bottom: '48px',
                  width: '35vw',
                  WebkitBackdropFilter: 'blur(50px) saturate(200%)' 
                }}
              >
                {/* Header */}
                <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                  <h2 className="text-white font-bold text-xl tracking-wider uppercase">Game Details</h2>
                  <button 
                    onClick={() => setSelectedGame(null)}
                    className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Game Cover */}
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                    <img src={selectedGame.image} alt={selectedGame.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-2xl font-bold text-white mb-1">{selectedGame.title}</h3>
                      <p className="text-white/60 text-sm">{selectedGame.genre}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${selectedGame.status === 'Playing' ? 'bg-green-400 animate-pulse' : 'bg-blue-400'}`} />
                    <span className="text-white font-semibold">{selectedGame.status}</span>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 rounded-lg py-3 text-white font-semibold transition-all flex items-center justify-center gap-2">
                      <Gamepad2 className="w-4 h-4" />
                      Launch Game
                    </button>
                    <button className="bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg py-3 text-white font-semibold transition-all">
                      View Library
                    </button>
                  </div>

                  {/* Game Stats */}
                  <div className="space-y-3">
                    <h4 className="text-white/80 font-semibold text-sm uppercase tracking-wider">Statistics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-white/40 text-xs mb-1">Playtime</p>
                        <p className="text-white font-bold text-lg">24.5h</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-white/40 text-xs mb-1">Achievements</p>
                        <p className="text-white font-bold text-lg">12/50</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-white/40 text-xs mb-1">Last Played</p>
                        <p className="text-white font-bold text-sm">2 hours ago</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <p className="text-white/40 text-xs mb-1">Progress</p>
                        <p className="text-white font-bold text-lg">68%</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Achievements */}
                  <div className="space-y-3">
                    <h4 className="text-white/80 font-semibold text-sm uppercase tracking-wider">Recent Achievements</h4>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm font-semibold">Achievement Title</p>
                            <p className="text-white/40 text-xs">Unlocked today</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pin/Unpin Button */}
                  <button className="w-full bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg py-3 text-white font-semibold transition-all">
                    Unpin from Dashboard
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Back to Loadout X Button (Only visible when Inventory is open) */}
        <AnimatePresence>
          {showInventory && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setShowInventory(false)}
              className="fixed top-40 left-8 z-40 w-11 h-11 rounded-full bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10"
              style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
            >
              <X className="w-5 h-5 text-white/80" />
              </motion.button>
              )}
              </AnimatePresence> */
              }

              {/* Main Content Area */}
              <div className="w-full mt-24 px-12 relative">
              <AnimatePresence mode="wait">
                {!showInventory ? (
                  <motion.div 
                    key="boxes"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-between gap-12"
                  >
                    <div className="flex flex-col items-start gap-12">
                      {/* Weapons Section */}
                      <div className="flex flex-col items-start">
                        <h2 className="text-xs font-bold tracking-[0.3em] uppercase mb-6 text-white/50 text-left pl-1">Weapons</h2>
                        <div className="flex gap-4">
                          <div onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          <div onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                        </div>
                      </div>

                      {/* Equipment Section */}
                      <div className="flex flex-col items-start gap-4">
                        <h2 className="text-xs font-bold tracking-[0.3em] uppercase mb-2 text-white/50 text-left pl-1">Equipment</h2>

                        {/* Top Row: 5 Boxes */}
                        <div className="flex gap-4">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={`top-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          ))}
                        </div>

                        {/* Bottom Row: 5 Boxes */}
                        <div className="flex gap-4">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={`bottom-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          ))}
                        </div>
                      </div>

                      {/* Artifacts Section */}
                      <div className="flex flex-col items-start gap-4">
                        <h2 className="text-xs font-bold tracking-[0.3em] uppercase mb-2 text-white/50 text-left pl-1">Artifacts</h2>

                        <div className="flex gap-4">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={`artifact-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          ))}
                        </div>
                      </div>

                      {/* Relics Section */}
                      <div className="flex flex-col items-start gap-4">
                        <h2 className="text-xs font-bold tracking-[0.3em] uppercase mb-2 text-white/50 text-left pl-1">Relics</h2>

                        <div className="flex gap-4">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={`relic-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          ))}
                        </div>
                      </div>

                      {/* Aspect Section */}
                      <div className="flex flex-col items-start gap-4">
                        <h2 className="text-xs font-bold tracking-[0.3em] uppercase mb-2 text-white/50 text-left pl-1">Aspect</h2>

                        <div className="flex gap-4">
                          {[1, 2, 3].map(i => (
                            <div key={`aspect-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Side Stats Panel */}
                    <div className="flex-shrink-0 pt-6 flex flex-col">
                      <LunaStatsPanel />
                      <LunaCardScroll />
                    </div>

                  </motion.div>
            ) : (
              <motion.div 
                key="inventory"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                className="w-full max-w-5xl"
              >
                <InventoryPanel 
                  inventory={inventoryData} 
                  capacity={profileData.inventoryCapacity} 
                  profile={profileData} 
                  onClose={() => setShowInventory(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      {/* Blank Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col rounded-r-3xl border-r border-white/10"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
            >
              <div className="p-6 flex justify-end">
                  <button 
                    onClick={() => setDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
              </div>
              {/* Blank Content Area */}
              <div className="flex-1"></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowSettings(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col"
              style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
            >
              <div className="flex-1 overflow-y-auto">
                <SettingsPanel />
              </div>
              
              <button 
                onClick={() => setShowSettings(false)}
                className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>
    </DragDropContext>
  );
}