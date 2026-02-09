import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, ShoppingBag, Trophy, Users, Gamepad2, Swords, MessageSquare, Radio, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, page: 'LunaTemplate' },
  { id: 'store', label: 'Store', icon: ShoppingBag, page: 'Store' },
  { id: 'library', label: 'Library', icon: Gamepad2, page: 'Library' },
  { id: 'achievements', label: 'Cards', icon: Trophy, page: 'AIAchievements' },
  { id: 'more', label: 'More', icon: Menu, page: null },
];

const MORE_ITEMS = [
  { label: 'AI Battle', icon: Swords, page: 'AIBattle' },
  { label: 'Clan', icon: Users, page: 'Clan' },
  { label: 'Forum', icon: MessageSquare, page: 'Community' },
  { label: 'Aura', icon: Radio, page: 'Aura' },
  { label: 'Blacksmith', icon: Gamepad2, page: 'Blacksmith' },
  { label: 'Friends', icon: Users, page: 'Friends' },
  { label: 'Leaderboard', icon: Trophy, page: 'Leaderboard' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = React.useState(false);

  const isActive = (page) => {
    if (!page) return false;
    return location.pathname.toLowerCase().includes(`/${page.toLowerCase()}`);
  };

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <>
          <div className="absolute inset-0 z-[90]" onClick={() => setShowMore(false)} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 left-2 right-2 z-[95] rounded-2xl p-3 grid grid-cols-3 gap-2"
            style={{
              background: 'rgba(15, 20, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {MORE_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setShowMore(false);
                  navigate(createPageUrl(item.page));
                }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                  isActive(item.page)
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}
          </motion.div>
        </>
      )}

      {/* Bottom Nav Bar */}
      <div
        className="h-16 flex items-center justify-around px-2 relative z-[80] flex-shrink-0"
        style={{
          background: 'rgba(10, 14, 20, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
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
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                active ? 'text-cyan-400' : 'text-white/50'
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? 'drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {active && item.id !== 'more' && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute bottom-1 w-6 h-0.5 bg-cyan-400 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}