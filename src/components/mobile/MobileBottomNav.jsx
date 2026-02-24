import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, ShoppingBag, Trophy, Users, Radio, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, page: 'LunaTemplate' },
  { id: 'store', label: 'Store', icon: ShoppingBag, page: 'Store' },
  { id: 'achievements', label: 'Cards', icon: Trophy, page: 'GenreMastery' },
  { id: 'clan', label: 'Clan', icon: Users, page: 'Clan' },
  { id: 'aura', label: 'Aura', icon: Radio, page: 'Aura' },
  { id: 'forum', label: 'Forum', icon: MessageSquare, page: 'Community' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (page) => {
    if (!page) return false;
    return location.pathname.toLowerCase().includes(`/${page.toLowerCase()}`);
  };

  const handleClick = (item) => {
    if (item.action === 'library_sidebar') {
      window.dispatchEvent(new CustomEvent('openLibrarySidebar'));
    } else {
      navigate(createPageUrl(item.page));
    }
  };

  return (
    <div
      className="flex items-center justify-around relative z-[80] flex-shrink-0"
      style={{
        height: '56px',
        background: 'rgba(100, 120, 140, 0.12)',
        backdropFilter: 'blur(30px) saturate(150%)',
        WebkitBackdropFilter: 'blur(30px) saturate(150%)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.25), inset 0 -1px 0 rgba(255, 255, 255, 0.06)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = item.page ? isActive(item.page) : false;
        return (
          <button
            key={item.id}
            onClick={() => handleClick(item)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-colors ${
              active ? 'text-cyan-400' : 'text-white/40'
            }`}
          >
            <item.icon className="w-[17px] h-[17px]" />
            <span className="text-[8px] font-medium">{item.label}</span>
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