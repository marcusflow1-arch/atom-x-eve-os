import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, ShoppingBag, Trophy, Gamepad2, Users, Radio, MessageSquare, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, page: 'LunaTemplate' },
  { id: 'store', label: 'Store', icon: ShoppingBag, page: 'Store' },
  { id: 'library', label: 'Library', icon: Gamepad2, page: 'Library' },
  { id: 'achievements', label: 'Cards', icon: Trophy, page: 'GenreMastery' },
  { id: 'clan', label: 'Clan', icon: Users, page: 'Clan' },
  { id: 'aura', label: 'Aura', icon: Radio, page: 'Aura' },
  { id: 'forum', label: 'Forum', icon: MessageSquare, page: 'Community' },
];

export default function MobileBottomNav({ onMenuOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (page) => {
    if (!page) return false;
    return location.pathname.toLowerCase().includes(`/${page.toLowerCase()}`);
  };

  return (
    <div
      className="flex items-center relative z-[80] flex-shrink-0 overflow-x-auto"
      style={{
        height: '52px',
        background: 'rgba(100, 120, 140, 0.12)',
        backdropFilter: 'blur(30px) saturate(150%)',
        WebkitBackdropFilter: 'blur(30px) saturate(150%)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.25), inset 0 -1px 0 rgba(255, 255, 255, 0.06)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {/* Hamburger Menu Button */}
      <button
        onClick={onMenuOpen}
        className="flex flex-col items-center justify-center gap-0.5 flex-shrink-0 h-full px-3 text-white/40 active:text-white/80 transition-colors"
        style={{ minWidth: '48px' }}
      >
        <Menu className="w-[18px] h-[18px]" />
        <span className="text-[9px] font-medium">Menu</span>
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10 flex-shrink-0" />

      {/* Nav Items */}
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.page);
        return (
          <button
            key={item.id}
            onClick={() => navigate(createPageUrl(item.page))}
            className={`flex flex-col items-center justify-center gap-0.5 flex-shrink-0 h-full relative transition-colors px-3 ${
              active ? 'text-cyan-400' : 'text-white/40'
            }`}
            style={{ minWidth: '52px' }}
          >
            <item.icon className="w-[18px] h-[18px]" />
            <span className="text-[9px] font-medium">{item.label}</span>
            {active && (
              <motion.div
                layoutId="mobile-nav-dot"
                className="absolute top-0.5 w-4 h-[2px] bg-cyan-400 rounded-full"
                style={{ boxShadow: '0 0 8px rgba(34, 211, 238, 0.4)' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}