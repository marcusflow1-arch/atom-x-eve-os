import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, BookOpen, Zap, Sword, Gamepad2, Settings, Target, Layers,
  ChevronLeft, ChevronRight, User, Trophy, MessageSquare, Shield, Swords
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
    <div className="h-screen w-full overflow-hidden relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Liquid Glass Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/5 rounded-full blur-[150px]" />
      </div>

      {/* Holographic Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

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
              onClick={() => handleItemClick(item)}
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

        {/* Dots */}
        <div className="flex gap-3">
          {ORBITAL_ITEMS.map((_, index) => (
            <motion.button
              key={index}
              className={`w-3 h-3 rounded-full transition-all ${
                index === activeIndex
                  ? 'bg-white w-8'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              onClick={() => handleDotClick(index)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>

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

      {/* Preset D - Loadout Panel (Moved to Top) - Only in AI mode */}
      <div className={`absolute top-24 left-1/2 -translate-x-1/2 w-[500px] z-30 transition-opacity duration-500 ${currentMode === 'ai' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-3 flex gap-4 items-start">
          {/* Header Column */}
          <div className="flex flex-col gap-2 min-w-[80px]">
            <h3 className="text-white font-bold text-xs tracking-wide">PRESET D</h3>
            <div className="flex gap-1">
              {['A', 'B', 'C', 'D'].map((preset) => (
                <button
                  key={preset}
                  className={`w-6 h-6 rounded-lg text-[10px] font-bold transition-all ${
                    preset === 'D'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-white/50 hover:bg-white/20'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Row 1: Weapons & Equipment */}
          <div className="flex-1 grid grid-cols-8 gap-1.5">
            {/* Weapons */}
            <div className="col-span-2 space-y-1.5">
              <div className="text-white/70 text-[8px] font-bold uppercase tracking-wider">Weapons</div>
              <div className="grid grid-cols-2 gap-1.5">
                 <div className="aspect-square rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer" />
                 <div className="aspect-square rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer" />
              </div>
            </div>

            {/* Equipment */}
            <div className="col-span-6 space-y-1.5">
              <div className="text-white/70 text-[8px] font-bold uppercase tracking-wider">Equipment</div>
              <div className="grid grid-cols-6 gap-1.5">
                <div className="aspect-square rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-center">
                  <span className="text-white/30 text-[7px] font-medium">H</span>
                </div>
                <div className="aspect-square rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-center">
                  <span className="text-white/30 text-[7px] font-medium">G</span>
                </div>
                <div className="aspect-square rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-center">
                  <span className="text-white/30 text-[7px] font-medium">B</span>
                </div>
                <div className="aspect-square rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-center">
                  <span className="text-white/30 text-[7px] font-medium">R</span>
                </div>
                <div className="aspect-square rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-center">
                  <span className="text-white/30 text-[7px] font-medium">R</span>
                </div>
                <div className="aspect-square rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-center">
                  <span className="text-white/30 text-[7px] font-medium">C</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Octagon Skill Tree - Bottom Right Corner - Only in AI mode */}
        <div className={`absolute right-6 bottom-4 z-30 transition-opacity duration-500 origin-bottom-right scale-[0.35] ${currentMode === 'ai' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
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