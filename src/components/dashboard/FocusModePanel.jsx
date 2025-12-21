import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, Target, Bell, Newspaper, ChevronRight, 
  Plus, Check, Trash2, Radio, Gamepad2, Trophy, Users, Sparkles
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';

export default function FocusModePanel() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
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

  return (
    <div className="h-full flex flex-col gap-6 p-6 overflow-y-auto">
      {/* Time & Date Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center"
      >
        <div className="text-6xl font-bold text-white mb-2 font-mono tracking-wider">
          {formatTime(currentTime)}
        </div>
        <div className="text-xl text-white/60">
          {formatDate(currentTime)}
        </div>
      </motion.div>

      {/* Calendar / Upcoming Events */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            Upcoming Events
          </h2>
          <ChevronRight className="w-5 h-5 text-white/40" />
        </div>
        <div className="space-y-3">
          {upcomingEvents.length > 0 ? upcomingEvents.map((event, i) => (
            <div 
              key={i} 
              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-400/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 rounded-lg px-3 py-2 text-purple-300 font-bold text-sm">
                  {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{event.title}</p>
                  {event.game && <p className="text-white/50 text-sm">{event.game}</p>}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-6">
              <Calendar className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">No upcoming events</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Personal Goals */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex-1"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Personal Goals
          </h2>
          <button 
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="w-8 h-8 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 flex items-center justify-center transition-colors"
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
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50"
            />
            <button 
              onClick={addGoal}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg text-cyan-400 font-semibold transition-colors"
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
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  goal.completed 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-white/30 hover:border-cyan-400'
                }`}
              >
                {goal.completed && <Check className="w-4 h-4 text-white" />}
              </button>
              <span className={`flex-1 ${goal.completed ? 'text-white/50 line-through' : 'text-white'}`}>
                {goal.text}
              </span>
              <button 
                onClick={() => deleteGoal(goal.id)}
                className="w-6 h-6 rounded-full hover:bg-red-500/20 flex items-center justify-center transition-colors opacity-0 hover:opacity-100"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Platform News & Updates */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Radio className="w-5 h-5 text-green-400" />
            Atom × Eve Updates
          </h2>
        </div>
        <div className="space-y-3">
          {platformUpdates.length > 0 ? platformUpdates.map((update, i) => (
            <div 
              key={i}
              className={`bg-white/5 rounded-xl p-4 border transition-colors cursor-pointer ${
                update.update_type === 'required' 
                  ? 'border-red-500/50 hover:border-red-400' 
                  : 'border-white/10 hover:border-green-400/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <Sparkles className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  update.update_type === 'required' ? 'text-red-400' : 'text-green-400'
                }`} />
                <div className="flex-1">
                  <p className="text-white font-semibold mb-1">{update.title}</p>
                  <p className="text-white/60 text-sm line-clamp-2">{update.description}</p>
                </div>
              </div>
            </div>
          )) : (
            // Mock updates if none in database
            <>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-400/50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <Gamepad2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold mb-1">New Games Added</p>
                    <p className="text-white/60 text-sm">5 classic titles now available in the library</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-400/50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold mb-1">Season 2 Starting</p>
                    <p className="text-white/60 text-sm">New rewards and challenges await</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-400/50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold mb-1">Clan Wars Event</p>
                    <p className="text-white/60 text-sm">Join your clan and compete for glory</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}