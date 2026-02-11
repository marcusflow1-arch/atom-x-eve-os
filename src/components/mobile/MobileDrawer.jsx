import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthContext';
import {
  X, Home, ShoppingBag, Gamepad2, Trophy, Swords, Users, MessageSquare,
  Radio, Crown, Layers, Rocket, Settings, LogIn, LogOut, Hammer
} from 'lucide-react';

const DRAWER_SECTIONS = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', icon: Home, page: 'LunaTemplate' },
      { label: 'Store', icon: ShoppingBag, page: 'Store' },
      { label: 'Library', icon: Gamepad2, page: 'Library' },
    ],
  },
  {
    title: 'Play',
    items: [
      { label: 'Achievements', icon: Trophy, page: 'AIAchievements' },
      { label: 'AI Battle', icon: Swords, page: 'AIBattle' },
      { label: 'Skill Tree', icon: Layers, page: 'GenreMastery' },
      { label: 'Blacksmith', icon: Hammer, page: 'Blacksmith' },
      { label: 'Season Pass', icon: Rocket, page: 'SeasonalPass' },
    ],
  },
  {
    title: 'Social',
    items: [
      { label: 'Clan', icon: Users, page: 'Clan' },
      { label: 'Forum', icon: MessageSquare, page: 'Community' },
      { label: 'Friends', icon: Users, page: 'Friends' },
      { label: 'Leaderboard', icon: Crown, page: 'Leaderboard' },
      { label: 'Aura Stream', icon: Radio, page: 'Aura' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', icon: Settings, page: 'LunaTemplate', params: '?panel=settings' },
    ],
  },
];

export default function MobileDrawer({ onClose }) {
  const { user, isAuthenticated, login, logout } = useAuth();
  const location = useLocation();

  const displayName = user?.username || user?.full_name || user?.email?.split('@')[0] || 'User';
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  const isActive = (page, params) => {
    const p = location.pathname.toLowerCase();
    const target = `/${page.toLowerCase()}`;
    if (params) {
      return p.includes(target) && location.search.includes(params.replace('?', ''));
    }
    return p.includes(target);
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[100]"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed top-0 left-0 bottom-0 z-[101] flex flex-col"
        style={{
          width: '75vw',
          maxWidth: '280px',
          background: 'rgba(10, 14, 20, 0.98)',
          backdropFilter: 'blur(30px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-bold text-sm tracking-[0.15em]">ATOM×EVE</span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center active:bg-white/15"
            >
              <X className="w-3.5 h-3.5 text-white/60" />
            </button>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2.5 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden ring-1 ring-white/15 flex-shrink-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-xs truncate">{displayName}</p>
                <p className="text-white/30 text-[10px] truncate">{user?.email}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { login(); onClose(); }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-500/15 text-cyan-400 text-xs font-medium border border-cyan-500/20"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
          )}
        </div>

        {/* Nav Sections */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {DRAWER_SECTIONS.map((section) => (
            <div key={section.title} className="mb-2">
              <p className="text-white/25 text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-1">{section.title}</p>
              {section.items.map((item) => {
                const active = isActive(item.page, item.params);
                return (
                  <Link
                    key={item.label}
                    to={createPageUrl(item.page) + (item.params || '')}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left ${
                      active
                        ? 'text-cyan-400 bg-cyan-500/10'
                        : 'text-white/50 active:bg-white/8'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        {isAuthenticated && (
          <div className="px-3 py-2.5 border-t border-white/5">
            <button
              onClick={() => { logout(); onClose(); }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 text-white/40 text-xs font-medium active:bg-white/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}