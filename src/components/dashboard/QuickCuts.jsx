import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Gamepad2, Library, Trophy, Swords, ShoppingBag, 
  Users, User, MessageSquare, LayoutGrid, Zap
} from 'lucide-react';

export default function QuickCuts({ onNavigate }) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState(null);

  const shortcuts = [
    { id: 'gamehub', label: 'Game Hub', icon: Gamepad2, color: 'text-blue-400', action: () => onNavigate('gamehub') },
    { id: 'console', label: 'Battle Console', icon: Swords, color: 'text-red-400', action: () => onNavigate('console') },
    { type: 'separator' },
    { id: 'store', label: 'Store', icon: ShoppingBag, color: 'text-purple-400', path: 'Store' },
    { id: 'library', label: 'Library', icon: Library, color: 'text-green-400', path: 'Library' },
    { id: 'achievements', label: 'Trophies', icon: Trophy, color: 'text-yellow-400', path: 'Achievements' },
    { type: 'separator' },
    { id: 'clan', label: 'Clan', icon: Users, color: 'text-orange-400', path: 'Clan' },
    { id: 'community', label: 'Social', icon: MessageSquare, color: 'text-pink-400', path: 'Community' },
    { id: 'profile', label: 'Profile', icon: User, color: 'text-cyan-400', path: 'Profile' },
  ];

  const handleClick = (shortcut) => {
    if (shortcut.action) {
      shortcut.action();
    } else if (shortcut.path) {
      navigate(createPageUrl(shortcut.path));
    }
  };

  return (
    <div className="w-full flex justify-center pb-8 pt-4 pointer-events-none z-50 relative">
      <div className="pointer-events-auto bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-2xl shadow-black/50 transition-all hover:bg-slate-900/80 hover:border-white/20 hover:scale-[1.01]">
        {shortcuts.map((shortcut, index) => {
          if (shortcut.type === 'separator') {
             return <div key={`sep-${index}`} className="w-px h-8 bg-white/10 mx-2" />;
          }

          const Icon = shortcut.icon;
          const isHovered = hoveredId === shortcut.id;
          // Extract color base name (e.g. 'blue' from 'text-blue-400') for dynamic classes
          const colorBase = shortcut.color.split('-')[1];

          return (
            <div key={shortcut.id} className="relative flex flex-col items-center">
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: -45, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bg-slate-800 text-white text-xs font-medium py-1 px-3 rounded-md border border-white/10 whitespace-nowrap z-50 shadow-sm"
                  >
                    {shortcut.label}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 border-r border-b border-white/10"></div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.button
                onHoverStart={() => setHoveredId(shortcut.id)}
                onHoverEnd={() => setHoveredId(null)}
                onClick={() => handleClick(shortcut)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative group p-1.5"
              >
                <div className={`
                  p-2.5 rounded-xl bg-transparent 
                  group-hover:bg-white/5
                  transition-colors duration-200 relative
                `}>
                   <Icon className={`w-6 h-6 ${shortcut.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                </div>
              </motion.button>
            </div>
          );
        })}
      </div>
    </div>
  );
}