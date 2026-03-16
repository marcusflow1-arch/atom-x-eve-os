import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Gamepad2, Pin, Trophy, ChevronRight, Target, Crosshair, Swords, Zap, CheckCircle2, Clock, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';

// Mock Data (Shared source ideally, but duplicated for now to ensure standalone function)
const GAMES_DATA = [
  {
    id: 'cyberpunk',
    title: 'Cyberpunk 2077',
    genre: 'RPG',
    image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=800&q=80',
    quests: [
      { id: 'cp1', title: 'Street Cred', desc: 'Reach 50 Street Cred', progress: 42, total: 50, rarity: 'Epic', xp: 500, status: 'Active' },
      { id: 'cp2', title: 'Cyberpsycho', desc: 'Neutralize 10 Cyberpsychos', progress: 4, total: 10, rarity: 'Rare', xp: 300, status: 'Active' },
      { id: 'cp3', title: 'Legend of Night City', desc: 'Complete all endings', progress: 1, total: 5, rarity: 'Legendary', xp: 1000, status: 'Active' },
      { id: 'cp4', title: 'Gun Nut', desc: 'Collect 20 Iconic Weapons', progress: 12, total: 20, rarity: 'Epic', xp: 450, status: 'Active' },
      { id: 'cp6', title: 'Joytoy', desc: 'Visit Jig-Jig Street', progress: 1, total: 1, rarity: 'Common', xp: 100, status: 'Completed', complete: true },
    ]
  },
  {
    id: 'elden_ring',
    title: 'Elden Ring',
    genre: 'RPG',
    image: 'https://images.unsplash.com/photo-1593305841991-05c297bb45ec?w=800&q=80',
    quests: [
      { id: 'er1', title: 'Shardbearer', desc: 'Defeat 2 Shardbearers', progress: 1, total: 2, rarity: 'Legendary', xp: 2000, status: 'Active' },
      { id: 'er2', title: 'Ranni\'s Aid', desc: 'Serve Ranni the Witch', progress: 0, total: 1, rarity: 'Epic', xp: 800, status: 'Locked' },
      { id: 'er3', title: 'Maidenless', desc: 'Die to Varre', progress: 1, total: 1, rarity: 'Common', xp: 50, status: 'Completed', complete: true },
    ]
  },
  {
    id: 'apex',
    title: 'Apex Legends',
    genre: 'FPS',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
    quests: [
      { id: 'al1', title: 'Champion', desc: 'Win a Battle Royale match', progress: 3, total: 5, rarity: 'Epic', xp: 600, status: 'Active' },
      { id: 'al2', title: 'Damage Dealer', desc: 'Deal 2000 damage in one game', progress: 1450, total: 2000, rarity: 'Rare', xp: 300, status: 'Active' },
    ]
  },
  {
    id: 'general',
    title: 'Daily & Weekly',
    genre: 'Misc',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80',
    quests: [
      { id: 'g1', title: 'Social Butterfly', desc: 'Join 2 clan events', progress: 1, total: 2, rarity: 'Common', xp: 100, status: 'Active' },
      { id: 'g2', title: 'Night Owl', desc: 'Play after midnight', progress: 6, total: 10, rarity: 'Common', xp: 150, status: 'Active' },
      { id: 'g4', title: 'Daily Login', desc: 'Login 7 days in a row', progress: 3, total: 7, rarity: 'Common', xp: 50, status: 'Active' },
    ]
  }
];

export default function QuestLog() {
  const navigate = useNavigate();
  const [activeGameId, setActiveGameId] = useState('cyberpunk');
  const [pinnedGameId, setPinnedGameId] = useState(() => localStorage.getItem('luna_pinned_quest_game') || 'cyberpunk');
  const [genreFilter, setGenreFilter] = useState('All');
  const [hoveredQuest, setHoveredQuest] = useState(null);

  const activeGame = GAMES_DATA.find(g => g.id === activeGameId) || GAMES_DATA[0];

  const handlePinGame = (id) => {
    setPinnedGameId(id);
    localStorage.setItem('luna_pinned_quest_game', id);
  };

  const filteredGames = GAMES_DATA.filter(g => genreFilter === 'All' || g.genre === genreFilter);

  // Statistics
  const totalQuests = activeGame.quests.length;
  const completedQuests = activeGame.quests.filter(q => q.complete).length;
  const progressPercent = Math.round((completedQuests / totalQuests) * 100);

  return (
    <PageErrorBoundary pageName="QuestLog">
      <div 
        className="min-h-screen w-full bg-[#0f1115] text-white pt-24 px-8 pb-8 flex flex-col"
        style={{
          backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(20, 24, 30, 1) 0%, rgba(15, 17, 21, 1) 90%)'
        }}
      >
        {/* Header Area */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Quest Log</h1>
            <p className="text-white/40 text-sm">Track your progress, achievements, and daily challenges.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-[#161920] border border-white/5 rounded-2xl px-4 py-2 flex items-center gap-3">
              <div className="text-right">
                <span className="block text-[10px] text-white/40 uppercase tracking-wider">Total XP Earned</span>
                <span className="block text-lg font-bold text-yellow-400 font-mono">12,450</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
            
            <Button 
              onClick={() => navigate(createPageUrl('LunaTemplate'))} 
              variant="outline" 
              className="border-white/10 hover:bg-white/5"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
          
          {/* LEFT SIDEBAR: Games List */}
          <div className="col-span-3 flex flex-col gap-6">
            {/* Search & Filter */}
            <div className="bg-[#161920] p-4 rounded-3xl border border-white/5">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input 
                  type="text" 
                  placeholder="Search games..." 
                  className="w-full bg-[#0f1115] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/10 transition-colors"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['All', 'RPG', 'FPS', 'Misc'].map(genre => (
                  <button
                    key={genre}
                    onClick={() => setGenreFilter(genre)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      genreFilter === genre 
                        ? 'bg-white text-black' 
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Games List */}
            <div className="flex-1 bg-[#161920] rounded-3xl border border-white/5 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Active Games</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {filteredGames.map(game => (
                  <button
                    key={game.id}
                    onClick={() => setActiveGameId(game.id)}
                    className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all group ${
                      activeGameId === game.id 
                        ? 'bg-gradient-to-r from-cyan-500/20 to-transparent border border-cyan-500/30' 
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-cover bg-center shadow-lg ${activeGameId === game.id ? 'ring-2 ring-cyan-400/50' : ''}`} style={{ backgroundImage: `url(${game.image})` }} />
                    <div className="flex-1 text-left min-w-0">
                      <div className={`font-bold text-sm truncate ${activeGameId === game.id ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>{game.title}</div>
                      <div className="flex items-center gap-2 text-[10px] text-white/30">
                        <span>{game.genre}</span>
                        <span>•</span>
                        <span>{game.quests.filter(q => q.complete).length}/{game.quests.length}</span>
                      </div>
                    </div>
                    {pinnedGameId === game.id && <Pin className="w-3 h-3 text-cyan-400" fill="currentColor" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT: Quests & Details */}
          <div className="col-span-9 flex flex-col gap-6">
            
            {/* Game Banner / Header */}
            <div className="relative h-48 rounded-3xl overflow-hidden border border-white/10 group">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${activeGame.image})` }} />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f1115] via-[#0f1115]/80 to-transparent" />
              
              <div className="absolute inset-0 p-8 flex flex-col justify-center items-start">
                <Badge className="mb-3 bg-white/10 hover:bg-white/20 text-white border-white/10 backdrop-blur-md">{activeGame.genre}</Badge>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-4xl font-bold text-white">{activeGame.title}</h2>
                  <button 
                    onClick={() => {
                      localStorage.setItem('luna_pinned_card_game_name', activeGame.title);
                      localStorage.setItem('luna_pinned_card_game_genre', activeGame.genre);
                      window.dispatchEvent(new Event('storage'));
                      navigate(createPageUrl('GenreMastery'));
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all group border border-cyan-500/20 hover:border-cyan-500/40 mt-1"
                    title="View game cards"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className="group-hover:scale-110 transition-transform"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                    <span className="text-xs font-bold uppercase tracking-widest">Cards</span>
                  </button>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>24h Played</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Trophy className="w-4 h-4" />
                    <span>{completedQuests}/{totalQuests} Completed</span>
                  </div>
                </div>

                <button 
                  onClick={() => handlePinGame(activeGame.id)}
                  className={`absolute bottom-8 right-8 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${
                    pinnedGameId === activeGame.id 
                      ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                      : 'bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Pin className="w-4 h-4" fill={pinnedGameId === activeGame.id ? "currentColor" : "none"} />
                  {pinnedGameId === activeGame.id ? 'Pinned to Dashboard' : 'Pin to Dashboard'}
                </button>
              </div>
            </div>

            {/* Quests Grid */}
            <div className="flex-1 bg-[#161920] rounded-3xl border border-white/5 p-6 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Quest Board</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-white/60 hover:text-white transition-colors">Active</button>
                  <button className="px-3 py-1 rounded-lg bg-transparent hover:bg-white/5 text-xs font-medium text-white/40 hover:text-white transition-colors">Completed</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-2 gap-4">
                  {activeGame.quests.map((quest) => {
                    const pct = Math.round((quest.progress / quest.total) * 100);
                    const isHovered = hoveredQuest === quest.id;
                    
                    return (
                      <motion.div
                        key={quest.id}
                        onMouseEnter={() => setHoveredQuest(quest.id)}
                        onMouseLeave={() => setHoveredQuest(null)}
                        className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-default ${
                          quest.complete 
                            ? 'bg-green-500/5 border-green-500/20' 
                            : 'bg-[#0f1115] border-white/5 hover:border-white/10 hover:bg-[#1a1d24]'
                        }`}
                      >
                        {/* Hover Glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              quest.complete ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/40 group-hover:text-white group-hover:bg-white/10'
                            }`}>
                              {quest.complete ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                            </div>
                            <div>
                              <h4 className={`font-bold text-base ${quest.complete ? 'text-green-400 line-through' : 'text-white'}`}>{quest.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-bold ${
                                  quest.rarity === 'Legendary' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                                  quest.rarity === 'Epic' ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' :
                                  'border-white/10 text-white/30 bg-white/5'
                                }`}>
                                  {quest.rarity}
                                </span>
                                <span className="text-[10px] text-yellow-500 font-mono font-bold flex items-center gap-1">
                                  <Zap className="w-3 h-3" /> {quest.xp} XP
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-xs font-mono text-white/40 block">Progress</span>
                            <span className="text-sm font-mono font-bold text-white">{quest.progress} / {quest.total}</span>
                          </div>
                        </div>

                        <p className="text-sm text-white/50 mb-6 relative z-10 pl-[52px]">{quest.desc}</p>

                        <div className="relative z-10 pl-[52px]">
                          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={`h-full ${quest.complete ? 'bg-green-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`} 
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}