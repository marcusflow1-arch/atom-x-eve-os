import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Medal, Crown, Star, Gamepad2, Target, Flame, 
  TrendingUp, ChevronRight, Search, Filter, Users, Zap,
  Award, Shield, Swords
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PlayerJourneyOverlay from '../components/leaderboard/PlayerJourneyOverlay';
import MiniLunaNav from '../components/nav/MiniLunaNav';
import GlassPageFrame from '../components/shared/GlassPageFrame';

// Leaderboard Categories
const LEADERBOARD_TABS = [
  { id: 'overall', label: 'Overall', icon: Trophy, color: 'from-amber-500 to-yellow-500' },
  { id: 'achievements', label: 'Achievements', icon: Award, color: 'from-purple-500 to-pink-500' },
  { id: 'games', label: 'Games Played', icon: Gamepad2, color: 'from-cyan-500 to-blue-500' },
  { id: 'weekly', label: 'Weekly', icon: Flame, color: 'from-orange-500 to-red-500' },
];

// Mock data for demonstration
const MOCK_LEADERBOARD = [
  { id: 1, username: 'DragonSlayer99', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', level: 87, score: 125400, achievements: 342, gamesPlayed: 156, rank: 1 },
  { id: 2, username: 'NightHawk', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', level: 82, score: 118200, achievements: 298, gamesPlayed: 143, rank: 2 },
  { id: 3, username: 'CyberPhantom', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100', level: 79, score: 112800, achievements: 276, gamesPlayed: 134, rank: 3 },
  { id: 4, username: 'StarRunner', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', level: 75, score: 98500, achievements: 245, gamesPlayed: 128, rank: 4 },
  { id: 5, username: 'ShadowMage', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', level: 72, score: 94200, achievements: 231, gamesPlayed: 119, rank: 5 },
  { id: 6, username: 'ThunderBolt', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', level: 68, score: 87600, achievements: 218, gamesPlayed: 112, rank: 6 },
  { id: 7, username: 'IceQueen', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', level: 65, score: 82100, achievements: 204, gamesPlayed: 105, rank: 7 },
  { id: 8, username: 'BlazeFury', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100', level: 62, score: 76800, achievements: 189, gamesPlayed: 98, rank: 8 },
  { id: 9, username: 'VoidWalker', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100', level: 59, score: 71200, achievements: 175, gamesPlayed: 91, rank: 9 },
  { id: 10, username: 'StormBreaker', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100', level: 56, score: 65900, achievements: 162, gamesPlayed: 84, rank: 10 },
];

const RankBadge = ({ rank }) => {
  if (rank === 1) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
        <Crown className="w-5 h-5 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-lg shadow-slate-400/30">
        <Medal className="w-5 h-5 text-white" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-600/30">
        <Medal className="w-5 h-5 text-white" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
      <span className="text-white/70 font-bold text-sm">{rank}</span>
    </div>
  );
};

const LeaderboardRow = ({ player, activeTab, index, onClick }) => {
  const getStatValue = () => {
    switch (activeTab) {
      case 'achievements': return player.achievements;
      case 'games': return player.gamesPlayed;
      default: return player.score.toLocaleString();
    }
  };

  const getStatLabel = () => {
    switch (activeTab) {
      case 'achievements': return 'achievements';
      case 'games': return 'games';
      default: return 'points';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onClick(player)}
      className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-white/5 cursor-pointer group ${
        player.rank <= 3 ? 'bg-white/[0.03]' : ''
      }`}
      style={{
        borderLeft: player.rank === 1 ? '3px solid #EAB308' : 
                    player.rank === 2 ? '3px solid #94A3B8' : 
                    player.rank === 3 ? '3px solid #D97706' : '3px solid transparent'
      }}
    >
      <RankBadge rank={player.rank} />
      
      <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/10 group-hover:border-white/20 transition-colors">
        {player.avatar ? (
          <img src={player.avatar} alt={player.username} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold">
            {player.username?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-bold text-sm truncate group-hover:text-cyan-300 transition-colors">
          {player.username}
        </h3>
        <div className="flex items-center gap-2 text-white/50 text-xs">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span>Level {player.level}</span>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-white font-bold text-lg">{getStatValue()}</p>
        <p className="text-white/40 text-xs">{getStatLabel()}</p>
      </div>
      
      <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/50 transition-colors" />
    </motion.div>
  );
};

export default function Leaderboard({ isEmbedded = false }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overall');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Escape key to go back to Luna
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate(createPageUrl('LunaTemplate'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Fetch real users from database with real-time polling
  const { data: dbUsers, isLoading } = useQuery({
    queryKey: ['leaderboard-users'],
    queryFn: () => base44.entities.User.list('-level', 50),
    refetchInterval: 5000, // Poll every 5s for "real-time" feel
  });

  // Fetch progression for real score calculation if needed, but for now trusting User entity fields
  // In a full real-time setup, we might aggregate UserAchievements here.

  // Combine real users with mock data for fuller leaderboard
  const leaderboardData = useMemo(() => {
    let users = [];
    
    if (dbUsers && dbUsers.length > 0) {
      users = dbUsers.map((u, idx) => ({
        id: u.id,
        username: u.username || u.full_name || 'User',
        avatar: u.avatar_url,
        level: u.level || 1,
        // In a real scenario, score would come from a 'score' field on User or aggregated events
        score: u.gamer_score || ((u.level || 1) * 1000), 
        achievements: u.achievements_count || Math.floor((u.level || 1) * 2), 
        gamesPlayed: u.games_played || 0,
        rank: idx + 1,
        isReal: true // Flag to identify real users
      }));
    }

    // Fill remaining spots with mock data ONLY if list is short
    if (users.length < 10) {
      const mockToAdd = MOCK_LEADERBOARD.slice(0, 10 - users.length);
      mockToAdd.forEach((m, idx) => {
        users.push({ ...m, rank: users.length + 1, isReal: false });
      });
    }

    // Sort based on active tab
    if (activeTab === 'achievements') {
      users.sort((a, b) => b.achievements - a.achievements);
    } else if (activeTab === 'games') {
      users.sort((a, b) => b.gamesPlayed - a.gamesPlayed);
    } else {
      users.sort((a, b) => b.score - a.score);
    }

    // Reassign ranks after sorting
    users.forEach((u, idx) => u.rank = idx + 1);

    return users;
  }, [dbUsers, activeTab]);

  // Filter by search
  const filteredData = useMemo(() => {
    if (!searchTerm) return leaderboardData;
    return leaderboardData.filter(p => 
      p.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leaderboardData, searchTerm]);

  // Get top 3 for podium
  const topThree = filteredData.slice(0, 3);
  const restOfList = filteredData.slice(3);

  const content = (
    <div className={`${isEmbedded ? 'h-full bg-transparent' : 'min-h-screen'} w-full text-white overflow-y-auto pb-20`} style={isEmbedded ? {} : { background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
      {/* Background Effects */}
      {!isEmbedded && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
        </div>
      )}

      <div className={`relative z-10 w-full px-6 ${isEmbedded ? 'pt-6' : 'pt-20'} pb-8`}>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 pb-2" style={{ scrollbarWidth: 'none' }}>
          {LEADERBOARD_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
          />
        </div>

        {/* Top 3 Podium */}
        {topThree.length >= 3 && !searchTerm && (
          <div className="flex items-end justify-center gap-4 mb-10">
            {/* 2nd Place */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-slate-400 shadow-lg shadow-slate-400/20 mb-3">
                {topThree[1]?.avatar ? (
                  <img src={topThree[1].avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-2xl font-bold">
                    {topThree[1]?.username?.charAt(0)}
                  </div>
                )}
              </div>
              <p className="text-white font-bold text-sm mb-1">{topThree[1]?.username}</p>
              <div className="w-24 h-20 bg-gradient-to-t from-slate-500/30 to-slate-400/10 rounded-t-xl flex items-center justify-center border border-slate-400/30 border-b-0">
                <span className="text-3xl font-black text-slate-300">2</span>
              </div>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <Crown className="w-8 h-8 text-yellow-400 mb-2 drop-shadow-lg" />
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-yellow-400 shadow-lg shadow-yellow-400/30 mb-3">
                {topThree[0]?.avatar ? (
                  <img src={topThree[0].avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white text-3xl font-bold">
                    {topThree[0]?.username?.charAt(0)}
                  </div>
                )}
              </div>
              <p className="text-white font-bold mb-1">{topThree[0]?.username}</p>
              <div className="w-28 h-28 bg-gradient-to-t from-yellow-500/30 to-yellow-400/10 rounded-t-xl flex items-center justify-center border border-yellow-400/30 border-b-0">
                <span className="text-4xl font-black text-yellow-400">1</span>
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-amber-600 shadow-lg shadow-amber-600/20 mb-3">
                {topThree[2]?.avatar ? (
                  <img src={topThree[2].avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white text-2xl font-bold">
                    {topThree[2]?.username?.charAt(0)}
                  </div>
                )}
              </div>
              <p className="text-white font-bold text-sm mb-1">{topThree[2]?.username}</p>
              <div className="w-24 h-16 bg-gradient-to-t from-amber-600/30 to-amber-500/10 rounded-t-xl flex items-center justify-center border border-amber-600/30 border-b-0">
                <span className="text-3xl font-black text-amber-500">3</span>
              </div>
            </motion.div>
          </div>
        )}

        {/* Leaderboard List */}
        <div 
          className="rounded-2xl border border-white/10 overflow-hidden"
          style={{
            background: 'rgba(100, 120, 140, 0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-white/20 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {(searchTerm ? filteredData : restOfList).map((player, index) => (
                <LeaderboardRow 
                  key={player.id} 
                  player={player} 
                  activeTab={activeTab}
                  index={index}
                  onClick={setSelectedPlayer}
                />
              ))}
              {filteredData.length === 0 && (
                <div className="text-center py-16 text-white/40">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No players found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Player Journey Overlay */}
      <AnimatePresence>
        {selectedPlayer && (
          <PlayerJourneyOverlay 
            player={selectedPlayer} 
            onClose={() => setSelectedPlayer(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return <GlassPageFrame>{content}</GlassPageFrame>;
}