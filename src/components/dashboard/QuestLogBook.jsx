import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, Search, Filter, Gamepad2, Pin, Trophy, Map, Zap, ChevronRight, Swords, Target, Crosshair } from 'lucide-react';
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

function BookPage({ quests, tiltDirection, contentVisible }) {
  const tiltAngle = tiltDirection === 'left' ? 8 : -8;

  return (
    <div
      className="flex-1 min-w-0 rounded-xl overflow-hidden relative cursor-pointer"
      style={{
        transform: `perspective(800px) rotateY(${tiltAngle}deg)`,
        transformOrigin: tiltDirection === 'left' ? 'right center' : 'left center',
        background: 'linear-gradient(135deg, rgba(180, 195, 215, 0.10) 0%, rgba(140, 160, 185, 0.07) 40%, rgba(200, 210, 225, 0.09) 100%)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      <div className={`absolute top-0 bottom-0 w-[2px] ${tiltDirection === 'left' ? 'right-0' : 'left-0'}`}
        style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.04), rgba(255,255,255,0.08))' }}
      />
      <div
        className={`absolute top-0 bottom-0 pointer-events-none z-10 ${tiltDirection === 'left' ? 'right-0 w-8' : 'left-0 w-8'}`}
        style={{
          background: tiltDirection === 'left'
            ? 'linear-gradient(to left, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.08) 40%, transparent 100%)'
            : 'linear-gradient(to right, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.08) 40%, transparent 100%)',
          borderRadius: tiltDirection === 'left' ? '0 12px 12px 0' : '12px 0 0 12px',
        }}
      />
      <div
        className="relative z-20 p-3 flex flex-col gap-1 h-full transition-opacity duration-200"
        style={{ opacity: contentVisible ? 1 : 0 }}
      >
        {quests.slice(0, 3).map(q => <QuestEntry key={q.id} quest={q} />)}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function QuestLogBook() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pinnedGameId, setPinnedGameId] = useState('cyberpunk'); // Default game
  const [viewGameId, setViewGameId] = useState('cyberpunk');
  const [genreFilter, setGenreFilter] = useState('All');
  
  // Book Page Logic (Collapsed)
  const [spreadIdx, setSpreadIdx] = useState(0);
  const [contentVisible, setContentVisible] = useState(true);
  const [turning, setTurning] = useState(false);

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
    if (turning) return;
    setTurning(true);
    setContentVisible(false);
    setTimeout(() => {
      if (direction === 'forward') {
        setSpreadIdx((spreadIdx + 1) % totalSpreads);
      } else {
        setSpreadIdx((spreadIdx - 1 + totalSpreads) % totalSpreads);
      }
      setContentVisible(true);
      setTurning(false);
    }, 220);
  };

  // Expanded View Logic
  const filteredGames = useMemo(() => {
    if (genreFilter === 'All') return GAMES_DATA;
    return GAMES_DATA.filter(g => g.genre === genreFilter);
  }, [genreFilter]);

  const viewGame = GAMES_DATA.find(g => g.id === viewGameId) || GAMES_DATA[0];

  return (
    <>
      <div className="w-full flex flex-col items-center" style={{ perspective: '1000px' }}>
        {/* Title - Clickable to Expand */}
        <button 
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 mb-3 w-full justify-center group"
        >
          <BookOpen className="w-4 h-4 text-white/40 group-hover:text-cyan-400 transition-colors" />
          <h3
            className="text-sm font-extrabold uppercase tracking-widest text-center group-hover:scale-105 transition-transform"
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
              <BookPage quests={leftPageQuests} tiltDirection="left" contentVisible={contentVisible} />
            </div>
            <div className="flex-1 min-w-0" onClick={() => turnPage('forward')}>
              <BookPage quests={rightPageQuests} tiltDirection="right" contentVisible={contentVisible} />
            </div>
          </div>
        </div>
      </div>

      {/* EXPANDED MODAL VIEW */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-5xl h-[80vh] bg-[#0f1115] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Sidebar: Games List */}
              <div className="w-full md:w-80 bg-[#161920] border-r border-white/5 flex flex-col">
                <div className="p-6 border-b border-white/5">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-cyan-400" /> Quest Log
                  </h2>
                  
                  {/* Genre Filter */}
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                    {['All', 'RPG', 'FPS', 'Misc'].map(genre => (
                      <button
                        key={genre}
                        onClick={() => setGenreFilter(genre)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                          genreFilter === genre 
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' 
                            : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {filteredGames.map(game => (
                    <button
                      key={game.id}
                      onClick={() => setViewGameId(game.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                        viewGameId === game.id
                          ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                          : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/5'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${viewGameId === game.id ? 'bg-cyan-500/20' : 'bg-black/20'}`}>
                        {game.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-sm truncate ${viewGameId === game.id ? 'text-white' : 'text-white/60'}`}>{game.title}</div>
                        <div className="text-[10px] text-white/30 flex items-center justify-between">
                          <span>{game.genre}</span>
                          <span>{game.quests.filter(q => q.complete).length}/{game.quests.length} Done</span>
                        </div>
                      </div>
                      {viewGameId === game.id && <ChevronRight className="w-4 h-4 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Content: Quests Detail */}
              <div className="flex-1 flex flex-col bg-[#0f1115] relative">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0f1115]/50 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-2xl">
                      {viewGame.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{viewGame.title}</h2>
                      <div className="flex items-center gap-2 text-white/40 text-xs">
                        <Badge variant="outline" className="border-white/10 text-white/50">{viewGame.genre}</Badge>
                        <span>•</span>
                        <span>{viewGame.quests.length} Active Quests</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button 
                      variant={pinnedGameId === viewGame.id ? "default" : "outline"}
                      onClick={() => setPinnedGameId(viewGame.id)}
                      className={`gap-2 ${pinnedGameId === viewGame.id ? 'bg-green-500 hover:bg-green-600 text-white' : 'border-white/10 text-white/60'}`}
                    >
                      <Pin className="w-4 h-4" />
                      {pinnedGameId === viewGame.id ? 'Pinned to Dashboard' : 'Pin to Dashboard'}
                    </Button>
                    <button onClick={() => setIsExpanded(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Quests Grid */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewGame.quests.map((quest) => {
                      const pct = Math.round((quest.progress / quest.total) * 100);
                      const isComplete = quest.complete || quest.progress >= quest.total;
                      
                      return (
                        <div key={quest.id} className={`p-4 rounded-2xl border transition-all group ${
                          isComplete 
                            ? 'bg-green-900/10 border-green-500/20 opacity-70 hover:opacity-100' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{quest.icon}</span>
                              <div>
                                <h4 className={`font-bold ${isComplete ? 'text-green-400 line-through' : 'text-white'}`}>{quest.title}</h4>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                  quest.rarity === 'Legendary' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                                  quest.rarity === 'Epic' ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' :
                                  'border-white/10 text-white/40 bg-white/5'
                                }`}>
                                  {quest.rarity}
                                </span>
                              </div>
                            </div>
                            {isComplete && <div className="bg-green-500/20 p-1.5 rounded-full"><Target className="w-4 h-4 text-green-400" /></div>}
                          </div>
                          
                          <p className="text-sm text-white/60 mb-4 h-10">{quest.desc}</p>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-white/40">Progress</span>
                              <span className="text-white font-mono">{quest.progress} / {quest.total}</span>
                            </div>
                            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-cyan-500'}`} 
                                style={{ width: `${pct}%` }} 
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}