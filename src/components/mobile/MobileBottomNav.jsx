import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, ShoppingBag, Trophy, Gamepad2, LayoutGrid, Swords, Users, MessageSquare, Radio, Crown, Layers, Rocket, Hammer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, page: 'LunaTemplate' },
  { id: 'store', label: 'Store', icon: ShoppingBag, page: 'Store' },
  { id: 'library', label: 'Library', icon: Gamepad2, page: 'Library' },
  { id: 'achievements', label: 'Cards', icon: Trophy, page: 'GenreMastery' },

];

const MORE_ITEMS = [
  { label: 'AI Battle', icon: Swords, page: 'AIBattle' },
  { label: 'Clan', icon: Users, page: 'Clan' },
  { label: 'Forum', icon: MessageSquare, page: 'Community' },
  { label: 'Aura', icon: Radio, page: 'Aura' },
  { label: 'Blacksmith', icon: Hammer, page: 'Blacksmith' },
  { label: 'Friends', icon: Users, page: 'Friends' },
  { label: 'Leaderboard', icon: Crown, page: 'Leaderboard' },
  { label: 'Skill Tree', icon: Layers, page: 'GenreMastery' },
  { label: 'Season Pass', icon: Rocket, page: 'SeasonalPass' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const isActive = (page) => {
    if (!page) return false;
    return location.pathname.toLowerCase().includes(`/${page.toLowerCase()}`);
  };

  return (
    <>
      {/* More Menu Overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[88]"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-[56px] left-3 right-3 z-[95] rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(12, 16, 24, 0.97)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
              }}
            >
              <div className="p-3 grid grid-cols-3 gap-1.5">
                {MORE_ITEMS.map((item) => {
                  const active = isActive(item.page);
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        setShowMore(false);
                        navigate(createPageUrl(item.page));
                      }}
                      className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all ${
                        active
                          ? 'bg-cyan-500/15 text-cyan-400'
                          : 'text-white/50 active:bg-white/10'
                      }`}
                    >
                      <item.icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                      <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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