import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BookOpen, X, Search, Filter, Gamepad2, Pin, Trophy, Map, Zap, ChevronRight, Swords, Target, Crosshair, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// --- Mock Data ---
const GAMES_DATA = [
  {
    id: 'cyberpunk',
    title: 'Cyberpunk 2077',
    genre: 'RPG',
    icon: <Gamepad2 className="w-4 h-4 text-yellow-400" />,
    quests: [
      { id: 'cp1', title: 'Street Cred', desc: 'Reach 50 Street Cred', progress: 42, total: 50, rarity: 'Epic', icon: '😎' },
      { id: 'cp2', title: 'Cyberpsycho', desc: 'Neutralize 10 Cyberpsychos', progress: 4, total: 10, rarity: 'Rare', icon: '🤖' },
      { id: 'cp3', title: 'Legend of Night City', desc: 'Complete all endings', progress: 1, total: 5, rarity: 'Legendary', icon: '🌃' },
      { id: 'cp4', title: 'Gun Nut', desc: 'Collect 20 Iconic Weapons', progress: 12, total: 20, rarity: 'Epic', icon: '🔫' },
      { id: 'cp5', title: 'Netrunner', desc: 'Hack 50 Access Points', progress: 35, total: 50, rarity: 'Common', icon: '💻' },
      { id: 'cp6', title: 'Joytoy', desc: 'Visit Jig-Jig Street', progress: 1, total: 1, rarity: 'Common', icon: '💋', complete: true },
    ]
  },
  {
    id: 'elden_ring',
    title: 'Elden Ring',
    genre: 'RPG',
    icon: <Swords className="w-4 h-4 text-amber-400" />,
    quests: [
      { id: 'er1', title: 'Shardbearer', desc: 'Defeat 2 Shardbearers', progress: 1, total: 2, rarity: 'Legendary', icon: '💍' },
      { id: 'er2', title: 'Ranni\'s Aid', desc: 'Serve Ranni the Witch', progress: 0, total: 1, rarity: 'Epic', icon: '🌙' },
      { id: 'er3', title: 'Maidenless', desc: 'Die to Varre', progress: 1, total: 1, rarity: 'Common', icon: '💀', complete: true },
      { id: 'er4', title: 'Tree Sentinel', desc: 'Defeat the Tree Sentinel', progress: 0, total: 1, rarity: 'Rare', icon: '🐴' },
    ]
  },
  {
    id: 'apex',
    title: 'Apex Legends',
    genre: 'FPS',
    icon: <Crosshair className="w-4 h-4 text-red-400" />,
    quests: [
      { id: 'al1', title: 'Champion', desc: 'Win a Battle Royale match', progress: 3, total: 5, rarity: 'Epic', icon: '👑' },
      { id: 'al2', title: 'Damage Dealer', desc: 'Deal 2000 damage in one game', progress: 1450, total: 2000, rarity: 'Rare', icon: '💥' },
      { id: 'al3', title: 'Team Player', desc: 'Revive 10 teammates', progress: 7, total: 10, rarity: 'Common', icon: '🚑' },
    ]
  },
  {
    id: 'general',
    title: 'General / Daily',
    genre: 'Misc',
    icon: <Trophy className="w-4 h-4 text-blue-400" />,
    quests: [
      { id: 'g1', title: 'Social Butterfly', desc: 'Join 2 clan events', progress: 1, total: 2, rarity: 'Common', icon: '🦋' },
      { id: 'g2', title: 'Night Owl', desc: 'Play after midnight', progress: 6, total: 10, rarity: 'Common', icon: '🦉' },
      { id: 'g3', title: 'Stream Watcher', desc: 'Watch 1 hour of streams', progress: 45, total: 60, rarity: 'Rare', icon: '📺' },
      { id: 'g4', title: 'Daily Login', desc: 'Login 7 days in a row', progress: 3, total: 7, rarity: 'Common', icon: '📅' },
    ]
  }
];

const RARITY_COLOR = {
  Legendary: 'text-amber-300',
  Epic: 'text-purple-300',
  Rare: 'text-blue-300',
  Common: 'text-slate-300',
};

// --- Helper Components for the "Book" view ---

function QuestEntry({ quest }) {
  const pct = Math.min(100, Math.round((quest.progress / quest.total) * 100));
  const color = RARITY_COLOR[quest.rarity] || 'text-white/60';
  const isComplete = quest.complete || quest.progress >= quest.total;

  return (
    <div className={`flex items-start gap-2.5 px-3 py-2 rounded-lg transition-colors ${isComplete ? 'opacity-50' : 'hover:bg-white/5'}`}>
      <span className="text-lg flex-shrink-0 mt-0.5">{quest.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-bold truncate ${isComplete ? 'line-through text-white/30' : 'text-white/80'}`}>{quest.title}</p>
        <p className="text-[8px] text-white/25 truncate">{quest.desc}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${isComplete ? 'bg-green-500/60' : 'bg-cyan-400/60'}`} style={{ width: `${pct}%` }} />
          </div>
          <span className={`text-[8px] font-mono ${color}`}>{quest.progress}/{quest.total}</span>
        </div>
      </div>
    </div>
  );
}

function BookPage({ quests, tiltDirection }) {
  const isLeft = tiltDirection === 'left';
  const tiltAngle = isLeft ? 8 : -8;

  return (
    <motion.div
      className="flex-1 min-w-0 rounded-xl overflow-hidden relative cursor-pointer h-52 bg-slate-900/40"
      initial={{ rotateY: isLeft ? 90 : -90, opacity: 0 }}
      animate={{ rotateY: tiltAngle, opacity: 1 }}
      exit={{ rotateY: isLeft ? 90 : -90, opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      style={{
        transformOrigin: isLeft ? 'right center' : 'left center',
        background: 'linear-gradient(135deg, rgba(180, 195, 215, 0.10) 0%, rgba(140, 160, 185, 0.07) 40%, rgba(200, 210, 225, 0.09) 100%)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      <div className={`absolute top-0 bottom-0 w-[2px] ${isLeft ? 'right-0' : 'left-0'}`}
        style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.04), rgba(255,255,255,0.08))' }}
      />
      <div
        className={`absolute top-0 bottom-0 pointer-events-none z-10 ${isLeft ? 'right-0 w-8' : 'left-0 w-8'}`}
        style={{
          background: isLeft
            ? 'linear-gradient(to left, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.08) 40%, transparent 100%)'
            : 'linear-gradient(to right, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.08) 40%, transparent 100%)',
          borderRadius: isLeft ? '0 12px 12px 0' : '12px 0 0 12px',
        }}
      />
      <div className="relative z-20 p-3 flex flex-col gap-1 h-full">
        {quests.slice(0, 3).map(q => <QuestEntry key={q.id} quest={q} />)}
        {quests.length === 0 && (
          <div className="h-full flex items-center justify-center opacity-30">
            <Gamepad2 className="w-8 h-8" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// --- Main Component ---

export default function QuestLogBook() {
  const navigate = useNavigate();
  // Read persisted pinned game from localStorage
  const [pinnedGameId, setPinnedGameId] = useState(() => localStorage.getItem('luna_pinned_quest_game') || 'cyberpunk');
  
  // Update local state when localStorage changes (in case changed from full page)
  useEffect(() => {
    const handleStorageChange = () => {
      setPinnedGameId(localStorage.getItem('luna_pinned_quest_game') || 'cyberpunk');
    };
    window.addEventListener('storage', handleStorageChange);
    // Custom event dispatch from full page to sync immediately
    window.addEventListener('questPinUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('questPinUpdated', handleStorageChange);
    };
  }, []);

  // Book Page Logic (Collapsed)
  const [spreadIdx, setSpreadIdx] = useState(0);

  // Get Quests for Pinned Game
  const pinnedGame = GAMES_DATA.find(g => g.id === pinnedGameId) || GAMES_DATA[0];
  const allPinnedQuests = pinnedGame.quests;
  
  // Pagination for book
  const ITEMS_PER_PAGE = 3;
  const totalPages = Math.ceil(allPinnedQuests.length / ITEMS_PER_PAGE) * 2; // Artificially double pages for spreads
  const totalSpreads = Math.ceil(totalPages / 2);
  
  // Get quests for left/right pages of current spread
  const leftPageQuests = allPinnedQuests.slice((spreadIdx * 2) * ITEMS_PER_PAGE, (spreadIdx * 2) * ITEMS_PER_PAGE + ITEMS_PER_PAGE);
  const rightPageQuests = allPinnedQuests.slice((spreadIdx * 2 + 1) * ITEMS_PER_PAGE, (spreadIdx * 2 + 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  const turnPage = (direction) => {
    if (direction === 'forward') {
      setSpreadIdx((spreadIdx + 1) % totalSpreads);
    } else {
      setSpreadIdx((spreadIdx - 1 + totalSpreads) % totalSpreads);
    }
  };

  return (
    <>
      <div className="w-full flex flex-col items-center" style={{ perspective: '1000px' }}>
        {/* Title - Clickable to Navigate to Full Page */}
        <div className="flex items-center justify-center gap-2 mb-3 w-full">
          <button 
            onClick={() => navigate(createPageUrl('QuestLog'))}
            className="group"
          >
            <h3
              className="text-[12.5px] font-extrabold uppercase tracking-widest text-center group-hover:scale-105 transition-transform"
              style={{
                background: 'linear-gradient(180deg, #E2E8F0 0%, #94A3B8 45%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
              }}
            >
              Quest Book
            </h3>
          </button>
          
          <BookOpen className="w-4 h-4 text-white/40 flex-shrink-0" />
          
          <button 
            onClick={() => navigate(createPageUrl('QuestLog') + '?game=' + pinnedGameId)}
            className="group"
          >
            <h3
              className="text-[12.5px] font-extrabold uppercase tracking-widest text-center group-hover:scale-105 transition-transform truncate max-w-[120px]"
              style={{
                background: 'linear-gradient(180deg, #E2E8F0 0%, #94A3B8 45%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
              }}
            >
              {pinnedGame.title}
            </h3>
          </button>
        </div>

        {/* Book — layered backing for depth, then glass pages on top */}
        <div className="w-full relative" style={{ transformStyle: 'preserve-3d' }}>
          {/* Back layers */}
          <div
            className="absolute inset-x-2 rounded-xl pointer-events-none"
            style={{
              top: '6px', bottom: '-6px', transform: 'perspective(800px) translateZ(-12px)',
              background: 'linear-gradient(135deg, rgba(100, 115, 135, 0.08) 0%, rgba(80, 95, 115, 0.06) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
            }}
          />
          <div
            className="absolute inset-x-1 rounded-xl pointer-events-none"
            style={{
              top: '3px', bottom: '-3px', transform: 'perspective(800px) translateZ(-6px)',
              background: 'linear-gradient(135deg, rgba(130, 145, 165, 0.09) 0%, rgba(110, 125, 145, 0.07) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.07)', boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            }}
          />
          {/* Spine */}
          <div
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-5 rounded-sm pointer-events-none z-30"
            style={{
              background: 'linear-gradient(90deg, rgba(0,0,0,0.25) 0%, rgba(255,255,255,0.06) 35%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.06) 65%, rgba(0,0,0,0.25) 100%)',
              boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.3), inset -2px 0 4px rgba(0,0,0,0.3), 0 0 12px rgba(0,0,0,0.4)',
            }}
          />

          {/* Active Game Label (Floating above book) */}
          <div className="absolute -top-6 left-0 right-0 flex justify-center opacity-0 hover:opacity-100 transition-opacity z-40 pointer-events-none">
             <span className="text-[10px] text-white/40 bg-black/60 px-2 py-0.5 rounded backdrop-blur-md">{pinnedGame.title}</span>
          </div>

          {/* Book Pages */}
          <div className="relative z-20 w-full flex gap-1" style={{ transformStyle: 'preserve-3d' }}>
            <div className="flex-1 min-w-0" onClick={() => turnPage('backward')}>
              <AnimatePresence mode="wait">
                <BookPage key={`left-${spreadIdx}`} quests={leftPageQuests} tiltDirection="left" />
              </AnimatePresence>
            </div>
            <div className="flex-1 min-w-0" onClick={() => turnPage('forward')}>
              <AnimatePresence mode="wait">
                <BookPage key={`right-${spreadIdx}`} quests={rightPageQuests} tiltDirection="right" />
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}