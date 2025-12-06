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

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rotation, setRotation] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const itemCount = ORBITAL_ITEMS.length;
  const angleStep = 360 / itemCount;

  // Auto-rotate slowly
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.2) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

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

  const getItemPosition = (index) => {
    const angle = ((index - activeIndex) * angleStep + rotation) * (Math.PI / 180);
    const radius = 280;
    const x = Math.sin(angle) * radius;
    const y = -Math.cos(angle) * radius;
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

      {/* Title */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30">
        <h1 className="text-4xl font-black text-white tracking-wider drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
          AI NEXUS
        </h1>
      </div>

      {/* Center AI Avatar */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
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
          
          {/* AI Avatar */}
          <div className="relative w-full h-full bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl">
            {user?.avatar?.model_url ? (
              <ThreeScene modelUrl={user.avatar.model_url} scale={1.5} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="w-16 h-16 text-white" />
                  </div>
                  <p className="text-white font-bold text-xl">{user?.avatar?.gender === 'male' ? 'ATUM' : 'EVE'}</p>
                  <p className="text-cyan-300 text-sm">Level {user?.avatar?.level || 1}</p>
                </div>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-green-500/50">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white text-sm font-semibold">Online</span>
          </div>
        </motion.div>
      </div>

      {/* Orbit Ring Visual */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5 pointer-events-none" />

      {/* Rotating Orbital Boxes */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
        {ORBITAL_ITEMS.map((item, index) => {
          const { x, y, scale, opacity, zIndex } = getItemPosition(index);
          const Icon = item.icon;
          const isActive = index === activeIndex;

          return (
            <motion.div
              key={item.id}
              className="absolute top-1/2 left-1/2 cursor-pointer"
              style={{
                x: x - 80,
                y: y - 80,
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
                className={`w-40 h-40 rounded-3xl backdrop-blur-2xl border transition-all ${
                  isActive 
                    ? 'bg-white/20 border-white/40 shadow-[0_0_40px_rgba(255,255,255,0.3)]' 
                    : 'bg-white/5 border-white/10'
                }`}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 ${isActive ? 'shadow-lg' : ''}`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-white font-bold text-sm text-center">{item.label}</span>
                </div>

                {/* Active Highlight Ring */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-3xl border-2 border-white/50"
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

      {/* Navigation Arrows */}
      <motion.button
        className="absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-30"
        onClick={handleRotateLeft}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronLeft className="w-8 h-8" />
      </motion.button>

      <motion.button
        className="absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-30"
        onClick={handleRotateRight}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronRight className="w-8 h-8" />
      </motion.button>

      {/* Dot Indicators */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-3 z-30">
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

      {/* Secondary Dock Menu */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-30">
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
    </div>
  );
}