import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Trophy, Calendar, Gamepad2, Target, 
  TrendingUp, Award, Star, BookOpen, Map, 
  Crown, Flame, Scroll, Clock, Swords, Shield
} from 'lucide-react';

const GENRE_COLORS = {
  RPG: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Action: 'text-red-400 bg-red-500/10 border-red-500/20',
  Strategy: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Simulation: 'text-green-400 bg-green-500/10 border-green-500/20',
  Sports: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

// Mock data generator for the "Journey"
const generateJourneyData = (player) => {
  return {
    gamesPlayed: [
      { id: 1, name: "Cyberpunk 2088", genre: "RPG", score: 4500, playtime: "120h", completed: "98%", lastPlayed: "2 days ago", topAchievement: "Legend of Night City" },
      { id: 2, name: "Elden Ring: Nightreign", genre: "RPG", score: 3800, playtime: "95h", completed: "85%", lastPlayed: "1 week ago", topAchievement: "Elden Lord" },
      { id: 3, name: "Neon Legends", genre: "Action", score: 2100, playtime: "45h", completed: "60%", lastPlayed: "3 days ago", topAchievement: "Speed Demon" },
      { id: 4, name: "Stellar Odyssey", genre: "Simulation", score: 1500, playtime: "200h", completed: "100%", lastPlayed: "Yesterday", topAchievement: "Galactic Emperor" },
    ],
    milestones: [
      { date: "2025-12-15", title: "Reached Level 80", type: "level", icon: TrendingUp },
      { date: "2025-11-20", title: "Tournament Champion", game: "Neon Legends", type: "trophy", icon: Trophy },
      { date: "2025-10-05", title: "100% Completion", game: "Stellar Odyssey", type: "completion", icon: Star },
      { date: "2025-09-12", title: "Joined 'Void Walkers' Clan", type: "social", icon: Shield },
    ],
    genreMastery: [
      { name: "RPG", score: 8300, percentage: 85 },
      { name: "Action", score: 4200, percentage: 60 },
      { name: "Simulation", score: 3500, percentage: 45 },
      { name: "Strategy", score: 1200, percentage: 30 },
    ],
    signature: player.username === 'DragonSlayer99' ? "Victory is forged in the fires of persistence." : "Leave your mark on the world."
  };
};

export default function PlayerJourneyOverlay({ player, onClose }) {
  const [activeTab, setActiveTab] = useState('journal');
  const journeyData = useMemo(() => player ? generateJourneyData(player) : null, [player]);

  if (!player || !journeyData) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        onClick={onClose}
      />

      {/* Main Card */}
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
        style={{
          background: 'rgba(20, 20, 30, 0.6)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Left Panel: Identity & Stats */}
        <div className="w-full md:w-80 flex-shrink-0 bg-black/20 border-r border-white/5 p-6 flex flex-col relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 opacity-50 blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Avatar Hexagon or Circle */}
            <div className="w-32 h-32 mb-4 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/20 p-1 bg-black/40">
                <img 
                  src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`} 
                  alt={player.username} 
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              {player.rank <= 3 && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1.5 rounded-full shadow-lg border border-white/20">
                  <Crown size={16} fill="currentColor" />
                </div>
              )}
            </div>

            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">{player.username}</h2>
            <p className="text-white/40 text-sm mb-6 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Online
            </p>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 gap-3 w-full mb-8">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Rank</div>
                <div className="text-xl font-bold text-yellow-400">#{player.rank}</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Level</div>
                <div className="text-xl font-bold text-cyan-400">{player.level}</div>
              </div>
              <div className="col-span-2 bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Total Score</div>
                <div className="text-2xl font-black text-white">{player.score.toLocaleString()}</div>
              </div>
            </div>

            {/* Signature / Quote */}
            <div className="mt-auto w-full relative p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="absolute -top-2 left-4 px-2 bg-[#1a1b26] text-white/30 text-xs">Legacy</div>
              <p className="font-serif italic text-white/70 text-sm leading-relaxed">
                "{journeyData.signature}"
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel: The Journey / Paper Trail */}
        <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-white/[0.02] to-transparent">
          
          {/* Header / Tabs */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setActiveTab('journal')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'journal' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70'}`}
              >
                <BookOpen size={14} />
                Journal
              </button>
              <button 
                onClick={() => setActiveTab('breakdown')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'breakdown' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70'}`}
              >
                <Target size={14} />
                Score Breakdown
              </button>
              <button 
                onClick={() => setActiveTab('games')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'games' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70'}`}
              >
                <Gamepad2 size={14} />
                Games
              </button>
            </div>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <AnimatePresence mode="wait">
              
              {/* JOURNAL TAB - Timeline style */}
              {activeTab === 'journal' && (
                <motion.div
                  key="journal"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-xl font-bold text-white">The Journey</h3>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <div className="relative pl-8 border-l border-white/10 space-y-8">
                    {journeyData.milestones.map((milestone, i) => {
                      const Icon = milestone.icon;
                      return (
                        <div key={i} className="relative group">
                          <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-[#1a1b26] border-2 border-white/20 flex items-center justify-center z-10 group-hover:border-cyan-400 group-hover:scale-110 transition-all">
                            <div className="w-2 h-2 rounded-full bg-white/50 group-hover:bg-cyan-400" />
                          </div>
                          
                          <div className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 p-4 rounded-xl transition-all">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-white/10 text-cyan-300">
                                  <Icon size={14} />
                                </span>
                                <span className="text-xs font-mono text-white/40">{milestone.date}</span>
                              </div>
                              <span className="text-[10px] uppercase tracking-wider text-white/30 border border-white/10 px-2 py-0.5 rounded">{milestone.type}</span>
                            </div>
                            <h4 className="text-white font-medium text-lg">{milestone.title}</h4>
                            {milestone.game && <p className="text-white/50 text-sm mt-1">in <span className="text-white/80">{milestone.game}</span></p>}
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="relative">
                      <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-[#1a1b26] border-2 border-white/10 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white/20" />
                      </div>
                      <div className="text-white/30 text-sm italic">The story began...</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* BREAKDOWN TAB - Visual Charts */}
              {activeTab === 'breakdown' && (
                <motion.div
                  key="breakdown"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/5">
                      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Scroll size={18} className="text-purple-400" />
                        Genre Mastery
                      </h3>
                      
                      <div className="space-y-5">
                        {journeyData.genreMastery.map((genre) => (
                          <div key={genre.name}>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-white font-medium">{genre.name}</span>
                              <span className="text-white/60">{genre.score.toLocaleString()} XP</span>
                            </div>
                            <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${genre.percentage}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full rounded-full ${
                                  genre.name === 'RPG' ? 'bg-purple-500' :
                                  genre.name === 'Action' ? 'bg-red-500' :
                                  genre.name === 'Simulation' ? 'bg-green-500' :
                                  'bg-blue-500'
                                }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
                          <Trophy size={32} className="text-amber-400" />
                        </div>
                        <div className="text-2xl font-black text-white">{player.achievements}</div>
                        <div className="text-xs text-white/40 uppercase tracking-widest">Achievements Unlocked</div>
                      </div>
                      <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-3">
                          <Clock size={32} className="text-cyan-400" />
                        </div>
                        <div className="text-2xl font-black text-white">1,240h</div>
                        <div className="text-xs text-white/40 uppercase tracking-widest">Total Playtime</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* GAMES TAB - List view */}
              {activeTab === 'games' && (
                <motion.div
                  key="games"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {journeyData.gamesPlayed.map((game) => (
                    <div 
                      key={game.id}
                      className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 p-4 rounded-xl transition-all flex items-center gap-4"
                    >
                      <div className="w-16 h-20 bg-black/40 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                        {/* Placeholder for game art */}
                        <div className={`w-full h-full bg-gradient-to-br ${
                          game.genre === 'RPG' ? 'from-purple-900 to-slate-900' :
                          game.genre === 'Action' ? 'from-red-900 to-slate-900' :
                          'from-blue-900 to-slate-900'
                        } flex items-center justify-center`}>
                          <Gamepad2 size={20} className="text-white/20" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-bold truncate">{game.name}</h4>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${GENRE_COLORS[game.genre] || 'text-slate-400 border-slate-700'}`}>
                            {game.genre}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/50">
                          <div className="flex items-center gap-1">
                            <Clock size={10} /> {game.playtime}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={10} /> {game.score} pts
                          </div>
                          <div className="flex items-center gap-1 col-span-2 text-cyan-300/80">
                            <Trophy size={10} /> {game.topAchievement}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <div className="text-xl font-bold text-white">{game.completed}</div>
                        <div className="text-[10px] text-white/30 uppercase tracking-wider">Complete</div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
}