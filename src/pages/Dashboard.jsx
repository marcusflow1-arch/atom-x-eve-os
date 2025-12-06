import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, BookOpen, Zap, Sword, Gamepad2, Settings, Target, Layers,
  ChevronLeft, ChevronRight, User, Trophy, MessageSquare, Shield, Swords, X
} from 'lucide-react';
import { useAuth } from '../components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ThreeScene from '../components/shared/ThreeScene';
import AINexusView from '../components/dashboard/views/AINexusView';
import UserInterfaceView from '../components/dashboard/views/UserInterfaceView';
import EconomyDistrictView from '../components/dashboard/views/EconomyDistrictView';
import HallOfRecordsView from '../components/dashboard/views/HallOfRecordsView';
import OctagonSkillTree from '../components/dashboard/OctagonSkillTree';

// Orbital Menu Items
const ORBITAL_ITEMS = [
  { id: 'skill-tree', label: 'Skill Tree', icon: Layers, color: 'from-purple-500 to-pink-500', route: 'Achievements' },
  { id: 'battle', label: 'Battle Mode', icon: Swords, color: 'from-red-500 to-orange-500', route: 'Challenges' },
  { id: 'console', label: 'Console', icon: Gamepad2, color: 'from-blue-500 to-cyan-500', route: 'AIConsole' },
  { id: 'story', label: 'AI Story', icon: BookOpen, color: 'from-indigo-500 to-purple-500', route: 'Storyline' },
  { id: 'home', label: 'AI Home', icon: Home, color: 'from-green-500 to-emerald-500', route: 'Dashboard' },
  { id: 'loadout', label: 'Loadout', icon: Shield, color: 'from-amber-500 to-yellow-500', route: 'Profile' },
  { id: 'games', label: 'Games', icon: Gamepad2, color: 'from-cyan-500 to-blue-500', route: 'Library' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'from-slate-500 to-gray-500', route: 'Profile' },
];

// Secondary Dock Items
const DOCK_ITEMS = [
  { id: 'profile', label: 'Profile', icon: User, route: 'Profile' },
  { id: 'achievements', label: 'Achievements', icon: Trophy, route: 'Achievements' },
  { id: 'community', label: 'Community', icon: MessageSquare, route: 'Community' },
  { id: 'marketplace', label: 'Market', icon: Target, route: 'Marketplace' },
];

const MODES = [
  { id: 'ai', label: 'AI NEXUS' },
  { id: 'user', label: 'USER INTERFACE' },
  { id: 'economy', label: 'ECONOMY DISTRICT' },
  { id: 'records', label: 'HALL OF RECORDS' }
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rotation, setRotation] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentMode, setCurrentMode] = useState('ai');
  const [modeIndex, setModeIndex] = useState(0);
  const [activeDrawer, setActiveDrawer] = useState(null);

  const itemCount = ORBITAL_ITEMS.length;
  const angleStep = 360 / itemCount;

  const handleRotateLeft = () => {
    setActiveIndex((prev) => (prev - 1 + itemCount) % itemCount);
  };

  const handleRotateRight = () => {
    setActiveIndex((prev) => (prev + 1) % itemCount);
  };

  const handleDotClick = (index) => {
    setActiveIndex(index);
  };

  const handleItemClick = (item) => {
    if (item.route) {
      navigate(createPageUrl(item.route));
    }
  };

  const handleModeLeft = () => {
    const newIndex = (modeIndex - 1 + MODES.length) % MODES.length;
    setModeIndex(newIndex);
    setCurrentMode(MODES[newIndex].id);
  };

  const handleModeRight = () => {
    const newIndex = (modeIndex + 1) % MODES.length;
    setModeIndex(newIndex);
    setCurrentMode(MODES[newIndex].id);
  };

  const getItemPosition = (index) => {
    const angle = ((index - activeIndex) * angleStep) * (Math.PI / 180);
    const radius = 280;
    const x = Math.sin(angle) * radius;
    const y = Math.cos(angle) * radius; // Positive y to place active item at bottom (under "Online")
    const scale = index === activeIndex ? 1.2 : 0.9;
    const opacity = index === activeIndex ? 1 : 0.6;
    const zIndex = index === activeIndex ? 20 : 10;
    
    return { x, y, scale, opacity, zIndex };
  };

  return (
    <div className="h-screen w-full overflow-hidden relative bg-[#0f1115]">
      {/* Blank Background */}

      {/* Settings Wallpaper - Only visible when Settings is active */}
      <AnimatePresence>
        {ORBITAL_ITEMS[activeIndex]?.id === 'settings' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/b5077c819_global-network-connection-world-map-point-line-composition_41981-3243.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        )}
      </AnimatePresence>

      {/* Games Wallpaper - Only visible when Games is active */}
      <AnimatePresence>
        {ORBITAL_ITEMS[activeIndex]?.id === 'games' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/825110603_wallpapersdencom_ghostrunner-4k-gaming_3840x2160.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        )}
      </AnimatePresence>

      {/* Battle Mode Wallpaper - Only visible when Battle Mode is active */}
      <AnimatePresence>
        {ORBITAL_ITEMS[activeIndex]?.id === 'battle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/0a20ac0f0_rmXjJo.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        )}
      </AnimatePresence>

      {/* AI Home Wallpaper - Only visible when AI Home is active */}
      <AnimatePresence>
        {ORBITAL_ITEMS[activeIndex]?.id === 'home' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/db2ccfac8_translucent-liquid-glass-filling-entire-screen-wallpaper-transparent-white-background-iridescent-abstract-many-colored-full-302912310.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        )}
      </AnimatePresence>

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
              initial={activeDrawer.id === 'home' || activeDrawer.id === 'settings' ? { opacity: 0, scale: 0.95 } : { x: '-100%', opacity: 0 }}
              animate={activeDrawer.id === 'home' || activeDrawer.id === 'settings' ? { opacity: 1, scale: 1 } : { x: 0, opacity: 1 }}
              exit={activeDrawer.id === 'home' || activeDrawer.id === 'settings' ? { opacity: 0, scale: 0.95 } : { x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col rounded-3xl ${
                activeDrawer.id === 'home' || activeDrawer.id === 'settings' ? 'inset-8' : 'left-0 border-r rounded-none'
              }`}
              style={activeDrawer.id === 'home' || activeDrawer.id === 'settings' ? { 
                WebkitBackdropFilter: 'blur(50px) saturate(200%)' 
              } : { 
                top: '80px',
                bottom: '48px',
                width: '28vw',
                WebkitBackdropFilter: 'blur(50px) saturate(200%)' 
              }}
            >
              {/* Header */}
              <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                <h2 className="text-white font-bold text-xl tracking-wider uppercase">{activeDrawer.label}</h2>
                <button 
                  onClick={() => setActiveDrawer(null)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeDrawer.id === 'games' ? (
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
                          transition={{ delay: index * 0.1 }}
                          className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-cyan-400/50 transition-all"
                        >
                          {/* Game Image */}
                          <img src={game.image} alt={game.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                          
                          {/* Status Badge */}
                          <div className="absolute top-2 right-2">
                            <div className={`px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border ${
                              game.status === 'Playing' 
                                ? 'bg-green-500/20 border-green-400/50 text-green-300' 
                                : 'bg-blue-500/20 border-blue-400/50 text-blue-300'
                            }`}>
                              {game.status}
                            </div>
                          </div>

                          {/* Game Info */}
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1">{game.genre}</p>
                            <h4 className="text-white font-bold text-sm mb-2 group-hover:text-cyan-400 transition-colors">{game.title}</h4>
                            
                            {/* Play Button */}
                            <button className="w-full bg-white/10 hover:bg-cyan-500/30 border border-white/20 hover:border-cyan-400/50 rounded-lg py-2 text-white/80 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2">
                              <Gamepad2 className="w-3 h-3" />
                              Launch
                            </button>
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



      {/* Mode Toggle at Top with Arrows */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4">
        {/* Left Arrow */}
        <motion.button
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
          onClick={handleModeLeft}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>

        {/* Mode Display */}
        <div className="bg-white/5 backdrop-blur-xl rounded-full px-6 py-3 border border-white/10 min-w-[200px]">
          <AnimatePresence mode="wait">
            <motion.h1
              key={currentMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-black text-white tracking-wider text-center"
            >
              {MODES[modeIndex].label}
            </motion.h1>
          </AnimatePresence>
        </div>

        {/* Right Arrow */}
        <motion.button
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
          onClick={handleModeRight}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Conditional Content Based on Mode */}
      <AnimatePresence mode="wait">
        {currentMode !== 'ai' ? (
          <motion.div
            key={currentMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-20 pt-24 px-8 pb-8"
          >
            {currentMode === 'user' && <UserInterfaceView />}
            {currentMode === 'economy' && <EconomyDistrictView />}
            {currentMode === 'records' && <HallOfRecordsView />}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Center AI Avatar - Only visible in AI mode */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transition-opacity duration-500 ${currentMode === 'ai' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <motion.div
          className="relative w-96 h-96 rounded-full overflow-hidden"
          animate={{
            boxShadow: [
              '0 0 40px rgba(59, 130, 246, 0.3)',
              '0 0 80px rgba(139, 92, 246, 0.5)',
              '0 0 40px rgba(59, 130, 246, 0.3)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {/* Holographic Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-spin" style={{ animationDuration: '20s' }} />
          <div className="absolute inset-4 rounded-full border border-cyan-400/30 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
          
          {/* AI Avatar - Iframe Embed */}
          <div className="relative w-full h-full">
            <iframe 
              title="AI Avatar" 
              frameBorder="0" 
              allowFullScreen 
              mozallowfullscreen="true" 
              webkitallowfullscreen="true" 
              allow="autoplay; fullscreen; xr-spatial-tracking" 
              xr-spatial-tracking="true" 
              execution-while-out-of-viewport="true" 
              execution-while-not-rendered="true" 
              web-share="true" 
              src="https://sketchfab.com/models/a6493956f268493c8e40db5bbbca140f/embed?autostart=1&ui_controls=0&ui_infos=0&ui_stop=0&ui_inspector=0&ui_hint=0"
              className="w-full h-full rounded-full"
            />
          </div>

          {/* Status Badge */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-green-500/50">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white text-sm font-semibold">Online</span>
          </div>
        </motion.div>
      </div>

      {/* Orbit Ring Visual - Only in AI mode */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5 pointer-events-none transition-opacity duration-500 ${currentMode === 'ai' ? 'opacity-100' : 'opacity-0'}`} />

      {/* Rotating Orbital Boxes - Only in AI mode */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full transition-opacity duration-500 ${currentMode === 'ai' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {ORBITAL_ITEMS.map((item, index) => {
          const { x, y, scale, opacity, zIndex } = getItemPosition(index);
          const Icon = item.icon;
          const isActive = index === activeIndex;

          return (
            <motion.div
              key={item.id}
              className="absolute top-1/2 left-1/2 cursor-pointer"
              style={{
                x: x - 40,
                y: y - 40,
                zIndex,
              }}
              animate={{
                scale,
                opacity,
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              onClick={() => setActiveDrawer(item)}
            >
              <motion.div
                className={`w-20 h-20 rounded-2xl backdrop-blur-2xl border transition-all ${
                  isActive 
                    ? 'bg-white/20 border-white/40 shadow-[0_0_40px_rgba(255,255,255,0.3)]' 
                    : 'bg-white/5 border-white/10'
                }`}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-1 ${isActive ? 'shadow-lg' : ''}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-semibold text-[10px] text-center">{item.label}</span>
                </div>

                {/* Active Highlight Ring */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/50"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(255,255,255,0.5)',
                        '0 0 40px rgba(255,255,255,0.8)',
                        '0 0 20px rgba(255,255,255,0.5)',
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

      {/* Dot Indicators & Navigation Arrows (Combined) - Only in AI mode */}
      <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-5 z-30 transition-opacity duration-500 scale-90 ${currentMode === 'ai' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Left Arrow */}
        <motion.button
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
          onClick={handleRotateLeft}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>

        {/* Dots Removed */}

        {/* Right Arrow */}
        <motion.button
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
          onClick={handleRotateRight}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Secondary Dock Menu - Only in AI mode */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-30 transition-opacity duration-500 ${currentMode === 'ai' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {DOCK_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white hover:bg-white/20 transition-all"
              onClick={() => navigate(createPageUrl(item.route))}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Preset D - Right Side Panel - Only in AI mode */}
      <div className={`absolute right-8 top-[40%] -translate-y-1/2 w-72 z-30 transition-opacity duration-500 ${currentMode === 'ai' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col gap-6 p-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-white/90 font-bold text-xs tracking-widest uppercase">Preset D</h3>
            <div className="flex gap-1">
              {['A', 'B', 'C', 'D'].map((preset) => (
                <button
                  key={preset}
                  className={`w-7 h-7 rounded-md text-[10px] font-bold transition-all flex items-center justify-center ${
                    preset === 'D'
                      ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]'
                      : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Weapons Section */}
          <div className="space-y-2">
            <div className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Weapons</div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="aspect-square rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.06] transition-all cursor-pointer" />
              ))}
            </div>
          </div>

          {/* Equipment Section */}
          <div className="space-y-2">
            <div className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Equipment</div>
            <div className="grid grid-cols-3 gap-3">
              {['Armor', 'Gloves', 'Boots', 'Legs', 'Ring', 'Cape'].map((item) => (
                <div key={item} className="aspect-square rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.06] transition-all cursor-pointer flex items-center justify-center group">
                  <span className="text-white/20 text-[8px] group-hover:text-white/40 transition-colors">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Aspect Section */}
          <div className="space-y-2">
            <div className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Aspect</div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="aspect-square rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.06] transition-all cursor-pointer" />
              ))}
            </div>
          </div>

          {/* Artifacts Section */}
          <div className="space-y-2">
            <div className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Artifacts</div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="aspect-square rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.06] transition-all cursor-pointer" />
              ))}
            </div>
          </div>

        </div>
      </div>

        {/* Octagon Skill Tree - Bottom Right Corner - Only in AI mode */}
        <div className={`absolute right-6 bottom-4 z-30 transition-opacity duration-500 origin-bottom-right scale-[0.61] ${currentMode === 'ai' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <OctagonSkillTree />
        </div>

        {/* Experience Bar at Bottom - Always visible */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-black/40 backdrop-blur-sm border-t border-white/10 z-40">
        <div className="relative h-full flex">
          {/* Progress Fill (example: 65% of first section) */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" style={{ width: '16.25%' }} />

          {/* Divider Lines */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: `${i * 25}%` }} />
          ))}
        </div>
        </div>
        </div>
        );
        }