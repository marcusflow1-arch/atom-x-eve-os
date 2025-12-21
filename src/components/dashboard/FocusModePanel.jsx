import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Target, Bell, Newspaper, ChevronRight, 
  Plus, Check, Trash2, Radio, Gamepad2, Trophy, Users, Sparkles,
  Pin, Play, Star, Zap, Sword, Shield, Wand2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';

// Mock data for upcoming cards
const upcomingCards = [
  { id: 1, name: 'Void Slasher', type: 'Ability', rarity: 'Legendary', game: 'Elden Ring: Nightreign', icon: Sword, color: 'from-purple-500 to-pink-500', description: 'A devastating attack that rips through dimensional barriers' },
  { id: 2, name: 'Quantum Shield', type: 'Equipment', rarity: 'Epic', game: 'Cyberpunk 2088', icon: Shield, color: 'from-cyan-500 to-blue-500', description: 'Advanced nano-tech protection from the Night City underworld' },
  { id: 3, name: 'Arcane Surge', type: 'Passive', rarity: 'Rare', game: 'Baldur\'s Gate 3', icon: Wand2, color: 'from-amber-500 to-orange-500', description: 'Channel the Weave to amplify magical abilities' },
  { id: 4, name: 'Neon Rush', type: 'Ability', rarity: 'Epic', game: 'Neon Legends', icon: Zap, color: 'from-green-500 to-emerald-500', description: 'Burst of speed through the neon-lit streets' },
];

// Mock pinned games
const pinnedGames = [
  { id: 1, title: 'Cyberpunk 2088', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', lastPlayed: '2 hours ago', progress: 68 },
  { id: 2, title: 'Elden Ring: Nightreign', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400', lastPlayed: 'Yesterday', progress: 45 },
  { id: 3, title: 'Stellar Odyssey', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400', lastPlayed: '3 days ago', progress: 92 },
  { id: 4, title: 'Shadow Realm', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', lastPlayed: 'Last week', progress: 23 },
];

export function PinnedGamesPanel() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Scrollable Pinned Games */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3" style={{ scrollbarWidth: 'thin' }}>
        <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2 sticky top-0 bg-transparent backdrop-blur-sm py-2 z-10">
          <Pin className="w-4 h-4 text-cyan-400" />
          Pinned Games
        </h2>
        {pinnedGames.map((game) => (
          <motion.div 
            key={game.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.05] backdrop-blur-xl rounded-xl overflow-hidden border border-white/10 hover:border-cyan-400/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 p-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={game.image} 
                  alt={game.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm mb-0.5 truncate">{game.title}</p>
                <p className="text-white/40 text-xs mb-1.5">Last played: {game.lastPlayed}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      style={{ width: `${game.progress}%` }}
                    />
                  </div>
                  <span className="text-white/60 text-[10px] font-semibold">{game.progress}%</span>
                </div>
              </div>
              <button className="w-8 h-8 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
                <Play className="w-4 h-4 text-cyan-400 ml-0.5" />
              </button>
            </div>
          </motion.div>
        ))}
        
        {/* Recently Played */}
        <h2 className="text-white font-bold text-sm mt-4 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          Recently Played
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {pinnedGames.slice(0, 4).map((game) => (
            <motion.div 
              key={`recent-${game.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer"
            >
              <img 
                src={game.image} 
                alt={game.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white font-semibold text-xs truncate">{game.title}</p>
                <p className="text-white/50 text-[10px]">{game.lastPlayed}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 mt-4 pb-4">
          <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 text-center transition-colors">
            <Plus className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
            <p className="text-white text-xs font-semibold">Pin Game</p>
          </button>
          <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 text-center transition-colors">
            <Gamepad2 className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <p className="text-white text-xs font-semibold">Library</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export function FeedUpdatesPanel() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [goals, setGoals] = useState([
    { id: 1, text: 'Complete 5 achievements this week', completed: false },
    { id: 2, text: 'Reach level 25 in RPG genre', completed: false },
    { id: 3, text: 'Trade 3 items in marketplace', completed: true },
  ]);
  const [newGoal, setNewGoal] = useState('');
  const [showAddGoal, setShowAddGoal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleGoal = (id) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, { id: Date.now(), text: newGoal, completed: false }]);
      setNewGoal('');
      setShowAddGoal(false);
    }
  };

  const deleteGoal = (id) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const rarityColors = {
    Common: 'text-slate-400',
    Rare: 'text-blue-400',
    Epic: 'text-purple-400',
    Legendary: 'text-amber-400',
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Time & Date */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 text-center">
        <div className="text-4xl font-bold text-white mb-1 font-mono tracking-wider">
          {formatTime(currentTime)}
        </div>
        <div className="text-sm text-white/60">
          {formatDate(currentTime)}
        </div>
      </div>

      {/* Upcoming Cards */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" />
          New Cards Coming
        </h2>
        <div className="space-y-2">
          {upcomingCards.map((card) => {
            const Icon = card.icon;
            return (
              <div 
                key={card.id}
                className="bg-white/5 rounded-xl p-3 border border-white/10 hover:border-white/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-2">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white font-bold text-sm">{card.name}</p>
                      <span className={`text-[10px] font-semibold ${rarityColors[card.rarity]}`}>
                        {card.rarity}
                      </span>
                    </div>
                    <p className="text-white/40 text-[10px] mb-0.5">{card.type} • <span className="text-cyan-400">{card.game}</span></p>
                    <p className="text-white/60 text-xs line-clamp-1">{card.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Personal Goals */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            Personal Goals
          </h2>
          <button 
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="w-6 h-6 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 flex items-center justify-center transition-colors"
          >
            <Plus className="w-3 h-3 text-cyan-400" />
          </button>
        </div>

        {showAddGoal && (
          <div className="mb-3 flex gap-2">
            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addGoal()}
              placeholder="Enter new goal..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs placeholder-white/40 focus:outline-none focus:border-cyan-400/50"
            />
            <button 
              onClick={addGoal}
              className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg text-cyan-400 font-semibold text-xs transition-colors"
            >
              Add
            </button>
          </div>
        )}

        <div className="space-y-1.5">
          {goals.map((goal) => (
            <div 
              key={goal.id}
              className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                goal.completed 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <button 
                onClick={() => toggleGoal(goal.id)}
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  goal.completed 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-white/30 hover:border-cyan-400'
                }`}
              >
                {goal.completed && <Check className="w-2.5 h-2.5 text-white" />}
              </button>
              <span className={`flex-1 text-xs ${goal.completed ? 'text-white/50 line-through' : 'text-white'}`}>
                {goal.text}
              </span>
              <button 
                onClick={() => deleteGoal(goal.id)}
                className="w-4 h-4 rounded-full hover:bg-red-500/20 flex items-center justify-center transition-colors opacity-0 hover:opacity-100"
              >
                <Trash2 className="w-2.5 h-2.5 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Platform News */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Radio className="w-4 h-4 text-green-400" />
          Atom × Eve Updates
        </h2>
        <div className="space-y-2">
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10 hover:border-green-400/50 transition-colors cursor-pointer">
            <div className="flex items-start gap-2">
              <Gamepad2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-xs mb-0.5">New Games Added</p>
                <p className="text-white/60 text-[10px]">5 classic titles now available</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10 hover:border-green-400/50 transition-colors cursor-pointer">
            <div className="flex items-start gap-2">
              <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-xs mb-0.5">Season 2 Starting</p>
                <p className="text-white/60 text-[10px]">New rewards and challenges await</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10 hover:border-green-400/50 transition-colors cursor-pointer">
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-xs mb-0.5">Clan Wars Event</p>
                <p className="text-white/60 text-[10px]">Join your clan and compete</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FocusModePanel() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('updates'); // 'updates' or 'pinned'
  const [goals, setGoals] = useState([
    { id: 1, text: 'Complete 5 achievements this week', completed: false },
    { id: 2, text: 'Reach level 25 in RPG genre', completed: false },
    { id: 3, text: 'Trade 3 items in marketplace', completed: true },
  ]);
  const [newGoal, setNewGoal] = useState('');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [platformUpdates, setPlatformUpdates] = useState([]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch events and updates
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const events = await base44.entities.UserEvent.filter({ user_id: user.id });
        setUpcomingEvents(events.slice(0, 3));
        
        const updates = await base44.entities.PlatformUpdate.filter({ published: true });
        setPlatformUpdates(updates.slice(0, 4));
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    fetchData();
  }, [user]);

  const toggleGoal = (id) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, { id: Date.now(), text: newGoal, completed: false }]);
      setNewGoal('');
      setShowAddGoal(false);
    }
  };

  const deleteGoal = (id) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const rarityColors = {
    Common: 'text-slate-400',
    Rare: 'text-blue-400',
    Epic: 'text-purple-400',
    Legendary: 'text-amber-400',
  };

  return (
    <div className="h-full flex flex-col gap-6 p-6 overflow-y-auto">
      {/* Time & Date Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center"
      >
        <div className="text-5xl font-bold text-white mb-1 font-mono tracking-wider">
          {formatTime(currentTime)}
        </div>
        <div className="text-lg text-white/60">
          {formatDate(currentTime)}
        </div>
      </motion.div>

      {/* Tab Navigation with Transition Box Effect */}
      <div className="relative">
        {/* Background box that transitions */}
        <div className="absolute inset-0 flex">
          <motion.div
            className="absolute top-0 bottom-0 w-1/2 bg-white/[0.08] backdrop-blur-xl rounded-xl border border-white/20"
            animate={{
              x: activeTab === 'updates' ? 0 : '100%',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        
        {/* Tab Buttons */}
        <div className="relative flex">
          <button
            onClick={() => setActiveTab('updates')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 z-10 ${
              activeTab === 'updates' ? 'text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Feed Updates
          </button>
          <button
            onClick={() => setActiveTab('pinned')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 z-10 ${
              activeTab === 'pinned' ? 'text-white' : 'text-white/50 hover:text-white/70'
            }`}
          >
            <Pin className="w-4 h-4" />
            Pinned Games
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'updates' ? (
            <motion.div
              key="updates"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col gap-4 overflow-y-auto"
            >
              {/* Upcoming Cards Section */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  New Cards Coming
                </h2>
                <div className="space-y-3">
                  {upcomingCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div 
                        key={card.id}
                        className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-bold">{card.name}</p>
                              <span className={`text-xs font-semibold ${rarityColors[card.rarity]}`}>
                                {card.rarity}
                              </span>
                            </div>
                            <p className="text-white/40 text-xs mb-1">{card.type} • from <span className="text-cyan-400">{card.game}</span></p>
                            <p className="text-white/60 text-sm line-clamp-2">{card.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Personal Goals */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-bold text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-cyan-400" />
                    Personal Goals
                  </h2>
                  <button 
                    onClick={() => setShowAddGoal(!showAddGoal)}
                    className="w-7 h-7 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>

                {showAddGoal && (
                  <div className="mb-4 flex gap-2">
                    <input
                      type="text"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                      placeholder="Enter new goal..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-cyan-400/50"
                    />
                    <button 
                      onClick={addGoal}
                      className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg text-cyan-400 font-semibold text-sm transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {goals.map((goal) => (
                    <div 
                      key={goal.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        goal.completed 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <button 
                        onClick={() => toggleGoal(goal.id)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          goal.completed 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-white/30 hover:border-cyan-400'
                        }`}
                      >
                        {goal.completed && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <span className={`flex-1 text-sm ${goal.completed ? 'text-white/50 line-through' : 'text-white'}`}>
                        {goal.text}
                      </span>
                      <button 
                        onClick={() => deleteGoal(goal.id)}
                        className="w-5 h-5 rounded-full hover:bg-red-500/20 flex items-center justify-center transition-colors opacity-0 hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform News */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-green-400" />
                  Atom × Eve Updates
                </h2>
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10 hover:border-green-400/50 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <Gamepad2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-semibold text-sm mb-0.5">New Games Added</p>
                        <p className="text-white/60 text-xs">5 classic titles now available</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10 hover:border-green-400/50 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-semibold text-sm mb-0.5">Season 2 Starting</p>
                        <p className="text-white/60 text-xs">New rewards and challenges await</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="pinned"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col gap-4 overflow-y-auto"
            >
              {/* Pinned Games Section */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Pin className="w-5 h-5 text-cyan-400" />
                  Your Pinned Games
                </h2>
                <div className="space-y-3">
                  {pinnedGames.map((game) => (
                    <div 
                      key={game.id}
                      className="bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-cyan-400/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 p-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={game.image} 
                            alt={game.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold mb-1 truncate">{game.title}</p>
                          <p className="text-white/40 text-xs mb-2">Last played: {game.lastPlayed}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                style={{ width: `${game.progress}%` }}
                              />
                            </div>
                            <span className="text-white/60 text-xs font-semibold">{game.progress}%</span>
                          </div>
                        </div>
                        <button className="w-10 h-10 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
                          <Play className="w-5 h-5 text-cyan-400 ml-0.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recently Played */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  Recently Played
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {pinnedGames.slice(0, 4).map((game) => (
                    <div 
                      key={`recent-${game.id}`}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer"
                    >
                      <img 
                        src={game.image} 
                        alt={game.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white font-semibold text-sm truncate">{game.title}</p>
                        <p className="text-white/50 text-xs">{game.lastPlayed}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-center transition-colors">
                    <Plus className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                    <p className="text-white text-sm font-semibold">Pin Game</p>
                  </button>
                  <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-center transition-colors">
                    <Gamepad2 className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-white text-sm font-semibold">Browse Library</p>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}