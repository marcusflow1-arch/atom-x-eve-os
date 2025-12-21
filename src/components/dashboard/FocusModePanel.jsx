import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Clock, Target, ChevronLeft, ChevronRight,
  Plus, Star, Zap, Sword, Shield, Wand2, Flame, Pin,
  Play, Sparkles, Trophy, Crown, Eye, Check, Trash2, X,
  Library as LibraryIcon, Radio, Gamepad2, Search, MoreHorizontal
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { allMockGames } from '../store/mockData';


// Mock pinned games
const pinnedGames = [
  { id: 1, title: 'Cyberpunk 2088', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', lastPlayed: '2 hours ago', progress: 68 },
  { id: 2, title: 'Elden Ring', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400', lastPlayed: 'Yesterday', progress: 45 },
  { id: 3, title: 'Stellar Odyssey', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400', lastPlayed: '3 days ago', progress: 92 },
  { id: 4, title: 'Shadow Realm', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', lastPlayed: 'Last week', progress: 23 },
  { id: 5, title: 'Neon Legends', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', lastPlayed: '2 days ago', progress: 55 },
];

// Upcoming cards with achievement-style design
const upcomingCards = [
  { 
    id: 1, 
    name: 'Voidtech Slayer', 
    type: 'Ability', 
    rarity: 'Legendary', 
    game: 'Elden Ring: Nightreign', 
    icon: '⚔️',
    description: 'A devastating attack that rips through dimensional barriers, dealing massive damage to all enemies in a cone.',
    stats: { Power: 95, Cooldown: '12s', Range: 'Medium' },
    unlockCondition: 'Complete "The Eternal Night" questline'
  },
  { 
    id: 2, 
    name: 'Quantum Shield', 
    type: 'Equipment', 
    rarity: 'Epic', 
    game: 'Cyberpunk 2088', 
    icon: '🛡️',
    description: 'Advanced nano-tech protection from the Night City underworld. Absorbs incoming damage.',
    stats: { Defense: 78, Duration: '8s', Absorption: '40%' },
    unlockCondition: 'Reach Cyberpunk genre level 15'
  },
  { 
    id: 3, 
    name: 'Arcane Surge', 
    type: 'Passive', 
    rarity: 'Rare', 
    game: 'Baldur\'s Gate 3', 
    icon: '✨',
    description: 'Channel the Weave to amplify magical abilities. Each spell increases power.',
    stats: { Bonus: '+25%', Stack: '5x', Duration: '10s' },
    unlockCondition: 'Cast 1000 spells across RPG games'
  },
  { 
    id: 4, 
    name: 'Neon Rush', 
    type: 'Ability', 
    rarity: 'Epic', 
    game: 'Neon Legends', 
    icon: '⚡',
    description: 'Burst of speed through the neon-lit streets. Become untargetable while dashing.',
    stats: { Speed: '+300%', Duration: '2s', Damage: '45' },
    unlockCondition: 'Win 50 races in Action games'
  },
  { 
    id: 5, 
    name: 'Dragon\'s Breath', 
    type: 'Ability', 
    rarity: 'Legendary', 
    game: 'Dragon Age', 
    icon: '🔥',
    description: 'Unleash the fury of an ancient dragon, breathing fire in a massive area.',
    stats: { Power: 120, Area: 'Large', Burn: '6s' },
    unlockCondition: 'Defeat 10 dragons across all games'
  },
  { 
    id: 6, 
    name: 'Shadow Step', 
    type: 'Ability', 
    rarity: 'Rare', 
    game: 'Shadow Realm', 
    icon: '👁️',
    description: 'Teleport through shadows to strike from behind.',
    stats: { Range: '15m', Damage: '+50%', Cooldown: '8s' },
    unlockCondition: 'Perform 500 stealth kills'
  },
];

const rarityStyles = {
  Common: { border: 'border-slate-400', glow: '', ring: 'ring-slate-400/30', text: 'text-slate-300' },
  Rare: { border: 'border-blue-400', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]', ring: 'ring-blue-400/40', text: 'text-blue-300' },
  Epic: { border: 'border-purple-400', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]', ring: 'ring-purple-400/50', text: 'text-purple-300' },
  Legendary: { border: 'border-amber-400', glow: 'shadow-[0_0_25px_rgba(251,191,36,0.6)]', ring: 'ring-amber-400/60', text: 'text-amber-300' },
};

// Achievement-style Card Component with tilt effect
function AchievementStyleCard({ card, isSelected, onClick, size = 'normal' }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const style = rarityStyles[card.rarity];

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      x: (y - 0.5) * 20,
      y: (x - 0.5) * -20
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const sizeClasses = size === 'small' 
    ? 'w-20 h-28' 
    : size === 'large' 
    ? 'w-40 h-56' 
    : 'w-28 h-40';

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: tilt.x,
        rotateY: tilt.y,
        scale: isSelected ? 1.05 : 1
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`${sizeClasses} relative cursor-pointer perspective-1000 flex-shrink-0`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Card Base */}
      <div className={`absolute inset-0 rounded-xl border-2 ${style.border} ${isSelected || isHovered ? style.glow : ''} overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 transition-shadow duration-300`}>
        {/* Animated shine line */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(${105 + tilt.y * 2}deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)`,
          }}
        />
        
        {/* Content */}
        <div className="relative h-full flex flex-col p-2">
          {/* Rarity indicator */}
          <div className="flex justify-between items-start mb-1">
            <span className={`text-[8px] font-bold uppercase tracking-wider ${style.text}`}>
              {card.rarity}
            </span>
            {isSelected && <Eye className="w-3 h-3 text-white/60" />}
          </div>

          {/* Icon */}
          <div className="flex-1 flex items-center justify-center">
            <span className={`${size === 'large' ? 'text-5xl' : size === 'small' ? 'text-2xl' : 'text-3xl'}`}>{card.icon}</span>
          </div>

          {/* Name */}
          <div className="text-center">
            <p className={`text-white font-bold ${size === 'large' ? 'text-sm' : 'text-[10px]'} truncate`}>{card.name}</p>
            <p className={`text-white/50 ${size === 'large' ? 'text-xs' : 'text-[8px]'} truncate`}>{card.type}</p>
          </div>
        </div>

        {/* Corner decorations */}
        <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${style.border} rounded-tl-lg`} />
        <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${style.border} rounded-tr-lg`} />
        <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${style.border} rounded-bl-lg`} />
        <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${style.border} rounded-br-lg`} />
      </div>
    </motion.div>
  );
}

// Mini Calendar Component
function MiniCalendar({ onDayClick, events }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const hasEvent = (day) => {
    if (!day || !events) return false;
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
    return events.some(e => new Date(e.date).toDateString() === dateStr);
  };

  const isToday = (day) => {
    if (!day) return false;
    return today.getDate() === day && 
           today.getMonth() === currentDate.getMonth() && 
           today.getFullYear() === currentDate.getFullYear();
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="mt-3">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-3 h-3 text-white/60" />
        </button>
        <span className="text-xs text-white/80 font-medium">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-3 h-3 text-white/60" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {dayNames.map((day, i) => (
          <div key={i} className="text-center text-[8px] text-white/40 font-medium py-0.5">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {getDaysInMonth().map((day, index) => (
          <div
            key={index}
            onClick={() => day && onDayClick(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
            className={`aspect-square flex items-center justify-center text-[10px] rounded transition-all relative ${
              day
                ? isToday(day)
                  ? 'bg-cyan-500 text-white font-bold cursor-pointer'
                  : 'text-white/70 hover:bg-white/10 cursor-pointer'
                : ''
            }`}
          >
            {day}
            {hasEvent(day) && (
              <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Calendar Modal Component
function CalendarModal({ isOpen, onClose, selectedDate, events, onAddEvent, onDeleteEvent }) {
  const [viewDate, setViewDate] = useState(selectedDate || new Date());
  const [selectedDay, setSelectedDay] = useState(selectedDate);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', type: 'event', time: '' });

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
      setSelectedDay(selectedDate);
    }
  }, [selectedDate]);

  if (!isOpen) return null;

  const getDaysInMonth = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getEventsForDay = (day) => {
    if (!day || !events) return [];
    const dateStr = new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toDateString();
    return events.filter(e => new Date(e.date).toDateString() === dateStr);
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === viewDate.getMonth() && 
           today.getFullYear() === viewDate.getFullYear();
  };

  const isSelected = (day) => {
    if (!day || !selectedDay) return false;
    return selectedDay.getDate() === day && 
           selectedDay.getMonth() === viewDate.getMonth() && 
           selectedDay.getFullYear() === viewDate.getFullYear();
  };

  const handleAddEvent = () => {
    if (!newEvent.title.trim() || !selectedDay) return;
    onAddEvent({
      id: Date.now(),
      title: newEvent.title,
      type: newEvent.type,
      time: newEvent.time,
      date: selectedDay.toISOString()
    });
    setNewEvent({ title: '', type: 'event', time: '' });
    setShowAddForm(false);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay.getDate()) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Calendar</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 rounded-xl text-cyan-300 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Calendar Grid */}
          <div className="flex-1 p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <h3 className="text-xl font-bold text-white">
                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
              </h3>
              <button
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-bold text-white/40 uppercase py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth().map((day, index) => {
                const dayEvents = getEventsForDay(day);
                return (
                  <div
                    key={index}
                    onClick={() => day && setSelectedDay(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))}
                    className={`aspect-square rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                      day
                        ? isSelected(day)
                          ? 'border-cyan-400 bg-cyan-500/20'
                          : isToday(day)
                          ? 'border-amber-400 bg-amber-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                        : 'border-transparent'
                    }`}
                  >
                    {day && (
                      <>
                        <span className="text-white text-sm font-semibold">{day}</span>
                        {dayEvents.length > 0 && (
                          <div className="flex gap-0.5 mt-1">
                            {dayEvents.slice(0, 3).map((_, i) => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Events Sidebar */}
          <div className="w-72 border-l border-white/10 p-6 bg-black/20">
            <h4 className="text-white font-bold mb-4">
              {selectedDay ? selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'Select a day'}
            </h4>

            {/* Add Event Form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 space-y-3"
                >
                  <input
                    type="text"
                    placeholder="Event title..."
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-cyan-400"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newEvent.type}
                      onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
                    >
                      <option value="event">Event</option>
                      <option value="goal">Goal</option>
                      <option value="reminder">Reminder</option>
                    </select>
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      className="w-24 px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddEvent}
                      className="flex-1 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Events List */}
            <div className="space-y-2 max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 group"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      event.type === 'goal' ? 'bg-amber-400' : event.type === 'reminder' ? 'bg-purple-400' : 'bg-cyan-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{event.title}</p>
                      {event.time && <p className="text-white/40 text-xs">{event.time}</p>}
                    </div>
                    <button
                      onClick={() => onDeleteEvent(event.id)}
                      className="w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-white/40 text-sm text-center py-4">No events for this day</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Time & Date Component
function TimeDisplay({ onCalendarClick, events }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-left">
      <div className="text-3xl font-bold text-white font-mono tracking-wider">
        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-sm text-white/60">
        {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </div>
      <MiniCalendar onDayClick={onCalendarClick} events={events} />
    </div>
  );
}

// Goals Component
function GoalsPanel({ onAddGoal }) {
  const [goals, setGoals] = useState([
    { id: 1, text: 'Complete 5 achievements', completed: true },
    { id: 2, text: 'Reach RPG level 20', completed: false },
    { id: 3, text: 'Win 5 battles', completed: false },
  ]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');

  const toggleGoal = (id) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const addGoal = () => {
    if (!newGoalText.trim()) return;
    setGoals([...goals, { id: Date.now(), text: newGoalText, completed: false }]);
    setNewGoalText('');
    setShowAddGoal(false);
  };

  const deleteGoal = (id) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          Today's Goals
        </h3>
        <button
          onClick={() => setShowAddGoal(!showAddGoal)}
          className="w-5 h-5 rounded-full bg-white/10 hover:bg-cyan-500/30 flex items-center justify-center transition-colors"
        >
          <Plus className="w-3 h-3 text-white/60" />
        </button>
      </div>

      {/* Add Goal Form */}
      <AnimatePresence>
        {showAddGoal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="New goal..."
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addGoal()}
              className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder-white/40 focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={addGoal}
              className="px-2 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 rounded-lg text-cyan-300 text-xs transition-colors"
            >
              Add
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1.5">
        {goals.map((goal) => (
          <div 
            key={goal.id}
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-xs group ${
              goal.completed ? 'bg-green-500/10 text-white/50' : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            <div 
              onClick={() => toggleGoal(goal.id)}
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                goal.completed ? 'bg-green-500 border-green-500' : 'border-white/30'
              }`}
            >
              {goal.completed && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            <span 
              onClick={() => toggleGoal(goal.id)}
              className={`flex-1 ${goal.completed ? 'line-through' : ''}`}
            >
              {goal.text}
            </span>
            <button
              onClick={() => deleteGoal(goal.id)}
              className="w-4 h-4 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-2.5 h-2.5 text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Game Boxes Component (next to 3D viewer)
function GameBoxes() {
  return (
    <div className="flex flex-col gap-2">
      {pinnedGames.slice(0, 4).map((game) => (
        <div 
          key={game.id}
          className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.05] backdrop-blur-sm border border-white/10 hover:border-cyan-400/40 transition-all cursor-pointer group w-40"
        >
          <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
            <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{game.title}</p>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${game.progress}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Game filter list for New Content
const gameFilterList = [
  { id: 'all', name: 'All Games', icon: '🎮' },
  { id: 'elden-ring', name: 'Elden Ring', icon: '⚔️' },
  { id: 'cyberpunk', name: 'Cyberpunk 2088', icon: '🌃' },
  { id: 'baldurs-gate', name: "Baldur's Gate 3", icon: '🧙' },
  { id: 'neon-legends', name: 'Neon Legends', icon: '⚡' },
  { id: 'dragon-age', name: 'Dragon Age', icon: '🐉' },
  { id: 'shadow-realm', name: 'Shadow Realm', icon: '👁️' },
  { id: 'stellar-odyssey', name: 'Stellar Odyssey', icon: '🚀' },
  { id: 'final-fantasy', name: 'Final Fantasy', icon: '✨' },
  { id: 'dark-souls', name: 'Dark Souls', icon: '🔥' },
];

// Main Export
export default function FocusModePanel() {
  const [selectedCard, setSelectedCard] = useState(upcomingCards[0]);
  const [selectedGameFilter, setSelectedGameFilter] = useState('all');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([
    { id: 1, title: 'Guild Raid Night', type: 'event', time: '20:00', date: new Date().toISOString() },
    { id: 2, title: 'Complete daily quests', type: 'goal', time: '', date: new Date().toISOString() },
  ]);
  const scrollRef = useRef(null);

  const handleCalendarDayClick = (date) => {
    setSelectedCalendarDate(date);
    setShowCalendarModal(true);
  };

  const handleAddEvent = (event) => {
    setCalendarEvents([...calendarEvents, event]);
  };

  const handleDeleteEvent = (eventId) => {
    setCalendarEvents(calendarEvents.filter(e => e.id !== eventId));
  };

  // Filter cards based on selected game
  const filteredCards = selectedGameFilter === 'all' 
    ? upcomingCards 
    : upcomingCards.filter(card => {
        const gameMap = {
          'elden-ring': 'Elden Ring',
          'cyberpunk': 'Cyberpunk 2088',
          'baldurs-gate': "Baldur's Gate 3",
          'neon-legends': 'Neon Legends',
          'dragon-age': 'Dragon Age',
          'shadow-realm': 'Shadow Realm',
        };
        return card.game.toLowerCase().includes(gameMap[selectedGameFilter]?.toLowerCase() || '');
      });

  return (
    <div className="h-full flex flex-col" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`.focus-panel-scroll::-webkit-scrollbar { display: none; }`}</style>

      {/* Top Section - New Content (right of 3D viewer) */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left side - placeholder for 3D viewer area */}
        <div className="w-[300px] flex-shrink-0">
          {/* 3D viewer renders here via fixed positioning in LunaTemplate */}
        </div>

        {/* Right of 3D Viewer - New Content */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Vertical Divider */}
          <div className="w-px bg-white/10 self-stretch" />

          {/* Content Area - New Content Cards REMOVED (saved for later) */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Placeholder - New Content UI will be restored here */}
          </div>
        </div>
      </div>

      {/* Calendar Modal */}
      <AnimatePresence>
        {showCalendarModal && (
          <CalendarModal
            isOpen={showCalendarModal}
            onClose={() => setShowCalendarModal(false)}
            selectedDate={selectedCalendarDate}
            events={calendarEvents}
            onAddEvent={handleAddEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        )}
      </AnimatePresence>

      {/* Bottom Section - Time, Goals, and Pinned Games */}
      <div className="flex gap-6 mt-6 pt-4 border-t border-white/10">
        {/* Time & Date with Mini Calendar */}
        <div className="flex-shrink-0">
          <TimeDisplay onCalendarClick={handleCalendarDayClick} events={calendarEvents} />
        </div>

        {/* Goals */}
        <div className="flex-shrink-0 w-48">
          <GoalsPanel />
        </div>

        {/* Pinned Games - Horizontal scroll */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
            <Pin className="w-4 h-4 text-cyan-400" />
            Pinned Games
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {pinnedGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex-shrink-0 w-20 group cursor-pointer"
              >
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400/50 transition-all">
                  <img src={game.image} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/80 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-1.5">
                    <p className="text-white font-bold text-[10px] truncate">{game.title}</p>
                    <div className="h-0.5 bg-white/20 rounded-full overflow-hidden mt-0.5">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${game.progress}%` }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {/* Add Game */}
            <div className="flex-shrink-0 w-20">
              <div className="aspect-[3/4] rounded-lg border border-dashed border-white/20 hover:border-cyan-400/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                <Plus className="w-5 h-5 text-white/40" />
                <p className="text-white/40 text-[10px] mt-1">Add</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}