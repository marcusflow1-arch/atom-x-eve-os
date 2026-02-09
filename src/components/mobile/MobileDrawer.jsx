import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthContext';
import {
  X, Home, ShoppingBag, Gamepad2, Trophy, Swords, Users, MessageSquare,
  Radio, Crown, Layers, Rocket, Settings, LogIn, LogOut, Hammer
} from 'lucide-react';

const DRAWER_ITEMS = [
  { label: 'Dashboard', icon: Home, page: 'LunaTemplate' },
  { label: 'Store', icon: ShoppingBag, page: 'Store' },
  { label: 'Library', icon: Gamepad2, page: 'Library' },
  { label: 'Achievements', icon: Trophy, page: 'AIAchievements' },
  { label: 'AI Battle', icon: Swords, page: 'AIBattle' },
  { label: 'Clan', icon: Users, page: 'Clan' },
  { label: 'Forum', icon: MessageSquare, page: 'Community' },
  { label: 'Aura Stream', icon: Radio, page: 'Aura' },
  { label: 'Blacksmith', icon: Hammer, page: 'Blacksmith' },
  { label: 'Skill Tree', icon: Layers, page: 'GenreMastery' },
  { label: 'Season Pass', icon: Rocket, page: 'SeasonalPass' },
  { label: 'Leaderboard', icon: Crown, page: 'Leaderboard' },
  { label: 'Friends', icon: Users, page: 'Friends' },
  { label: 'Settings', icon: Settings, page: 'LunaTemplate', params: '?panel=settings' },
];

export default function MobileDrawer({ onClose }) {
  const { user, isAuthenticated, login, logout } = useAuth();

  const displayName = user?.username || user?.full_name || user?.email?.split('@')[0] || 'User';
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-[100]"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="fixed top-0 left-0 bottom-0 w-72 z-[101] flex flex-col"
        style={{
          background: 'rgba(10, 14, 20, 0.97)',
          backdropFilter: 'blur(30px)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-bold text-lg tracking-wider">ATOM×EVE</span>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/20">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{displayName}</p>
                <p className="text-white/40 text-xs truncate">{user?.email}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { login(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
          )}
        </div>

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {DRAWER_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={createPageUrl(item.page) + (item.params || '')}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Footer */}
        {isAuthenticated && (
          <div className="p-4 border-t border-white/5">
            <button
              onClick={() => { logout(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-white/50 hover:text-white text-sm font-medium transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}