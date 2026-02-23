import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, ShoppingBag, Trophy, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, page: 'LunaTemplate' },
  { id: 'store', label: 'Store', icon: ShoppingBag, page: 'Store' },
  { id: 'library', label: 'Library', icon: Gamepad2, page: 'Library' },
  { id: 'achievements', label: 'Cards', icon: Trophy, page: 'GenreMastery' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (page) => {
    if (!page) return false;
    return location.pathname.toLowerCase().includes(`/${page.toLowerCase()}`);
  };

  return (
    <>
      {/* Bottom Nav Bar */}
      <div
        className="flex items-center justify-around relative z-[80] flex-shrink-0"
        style={{
          height: '52px',
          background: 'rgba(100, 120, 140, 0.12)',
          backdropFilter: 'blur(30px) saturate(150%)',
          WebkitBackdropFilter: 'blur(30px) saturate(150%)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.25), inset 0 -1px 0 rgba(255, 255, 255, 0.06)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = item.page ? isActive(item.page) : showMore;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'more') {
                  setShowMore(!showMore);
                } else {
                  setShowMore(false);
                  navigate(createPageUrl(item.page));
                }
              }}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-colors ${
                active ? 'text-cyan-400' : 'text-white/40'
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span className="text-[9px] font-medium">{item.label}</span>
              {active && item.id !== 'more' && (
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
    </>
  );
}