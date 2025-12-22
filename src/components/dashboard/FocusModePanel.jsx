import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Clock, Target, ChevronLeft, ChevronRight,
  Plus, Star, Zap, Sword, Shield, Wand2, Flame, Pin,
  Play, Sparkles, Trophy, Crown, Eye, Check, Trash2, X,
  Library as LibraryIcon, Radio, Gamepad2, Search, MoreHorizontal, Bot,
  Heart, BookOpen
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { allMockGames } from '../store/mockData';
import AchievementDetailOverlay from '../achievements/AchievementDetailOverlay';


// Mock pinned games
const pinnedGames = [
  { id: 1, title: 'Cyberpunk 2088', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', lastPlayed: '2 hours ago', progress: 68 },
  { id: 2, title: 'Elden Ring', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400', lastPlayed: 'Yesterday', progress: 45 },
  { id: 3, title: 'Stellar Odyssey', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400', lastPlayed: '3 days ago', progress: 92 },
  { id: 4, title: 'Shadow Realm', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', lastPlayed: 'Last week', progress: 23 },
  { id: 5, title: 'Neon Legends', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', lastPlayed: '2 days ago', progress: 55 },
];

// Upcoming cards with achievement-style design - organized by genre
const upcomingCards = [
  { 
    id: 1, 
    name: 'Voidtech Slayer', 
    type: 'Ability', 
    rarity: 'Legendary', 
    genre: 'RPG',
    game: 'Elden Ring: Nightreign', 
    icon: '⚔️',
    description: 'A devastating attack that rips through dimensional barriers, dealing massive damage to all enemies in a cone.',
    stats: { Power: 95, Cooldown: '12s', Range: 'Medium' },
    unlockCondition: 'Complete "The Eternal Night" questline',
    releaseDate: 'Season 3',
    lore: 'Forged in the void between worlds, this technique was mastered by the Nightreign Knights who guard the boundary between realms.'
  },
  { 
    id: 2, 
    name: 'Quantum Shield', 
    type: 'Equipment', 
    rarity: 'Epic', 
    genre: 'Sci-Fi',
    game: 'Cyberpunk 2088', 
    icon: '🛡️',
    description: 'Advanced nano-tech protection from the Night City underworld. Absorbs incoming damage.',
    stats: { Defense: 78, Duration: '8s', Absorption: '40%' },
    unlockCondition: 'Reach Cyberpunk genre level 15',
    releaseDate: 'Season 3',
    lore: 'Developed by Arasaka\'s black ops division, this shield creates a quantum probability field that deflects incoming projectiles.'
  },
  { 
    id: 3, 
    name: 'Arcane Surge', 
    type: 'Passive', 
    rarity: 'Rare', 
    genre: 'RPG',
    game: 'Baldur\'s Gate 3', 
    icon: '✨',
    description: 'Channel the Weave to amplify magical abilities. Each spell increases power.',
    stats: { Bonus: '+25%', Stack: '5x', Duration: '10s' },
    unlockCondition: 'Cast 1000 spells across RPG games',
    releaseDate: 'Available Now',
    lore: 'The Weave responds to those who show dedication. Masters of this technique can feel the very fabric of magic bend to their will.'
  },
  { 
    id: 4, 
    name: 'Neon Rush', 
    type: 'Ability', 
    rarity: 'Epic', 
    genre: 'Action',
    game: 'Neon Legends', 
    icon: '⚡',
    description: 'Burst of speed through the neon-lit streets. Become untargetable while dashing.',
    stats: { Speed: '+300%', Duration: '2s', Damage: '45' },
    unlockCondition: 'Win 50 races in Action games',
    releaseDate: 'Season 3',
    lore: 'Street racers who master this technique become living lightning, leaving only afterimages in their wake.'
  },
  { 
    id: 5, 
    name: 'Dragon\'s Breath', 
    type: 'Ability', 
    rarity: 'Legendary', 
    genre: 'RPG',
    game: 'Dragon Age', 
    icon: '🔥',
    description: 'Unleash the fury of an ancient dragon, breathing fire in a massive area.',
    stats: { Power: 120, Area: 'Large', Burn: '6s' },
    unlockCondition: 'Defeat 10 dragons across all games',
    releaseDate: 'Season 4',
    lore: 'Only those who have faced the mightiest beasts and emerged victorious can channel their primal fury.'
  },
  { 
    id: 6, 
    name: 'Shadow Step', 
    type: 'Ability', 
    rarity: 'Rare', 
    genre: 'Action',
    game: 'Shadow Realm', 
    icon: '👁️',
    description: 'Teleport through shadows to strike from behind.',
    stats: { Range: '15m', Damage: '+50%', Cooldown: '8s' },
    unlockCondition: 'Perform 500 stealth kills',
    releaseDate: 'Available Now',
    lore: 'The shadow realm exists in parallel to our own. Those attuned to its frequency can slip between worlds at will.'
  },
  { 
    id: 7, 
    name: 'Chrono Freeze', 
    type: 'Ability', 
    rarity: 'Legendary', 
    genre: 'Sci-Fi',
    game: 'Temporal Wars', 
    icon: '⏱️',
    description: 'Stop time in a localized area, freezing all enemies for 3 seconds.',
    stats: { Duration: '3s', Area: '10m', Cooldown: '30s' },
    unlockCondition: 'Complete all Sci-Fi genre challenges',
    releaseDate: 'Season 4',
    lore: 'Manipulating the fourth dimension requires immense focus. One wrong calculation and you cease to exist.'
  },
  { 
    id: 8, 
    name: 'Berserker Rage', 
    type: 'Passive', 
    rarity: 'Epic', 
    genre: 'Action',
    game: 'Viking Conquest', 
    icon: '🪓',
    description: 'Enter a frenzied state when health drops below 30%. Massive damage boost.',
    stats: { Damage: '+100%', Defense: '-25%', Duration: 'Until healed' },
    unlockCondition: 'Survive 100 near-death encounters',
    releaseDate: 'Season 3',
    lore: 'The old gods favor those who fight without fear of death. In this state, warriors become unstoppable forces of destruction.'
  },
  { 
    id: 9, 
    name: 'Starship Command', 
    type: 'Equipment', 
    rarity: 'Legendary', 
    genre: 'Sci-Fi',
    game: 'Stellar Odyssey', 
    icon: '🚀',
    description: 'Summon your personal starship for orbital support strikes.',
    stats: { Damage: 200, Cooldown: '60s', Range: 'Global' },
    unlockCondition: 'Own 5 Sci-Fi games',
    releaseDate: 'Season 4',
    lore: 'Command-linked neural interfaces allow pilots to call upon their vessels from anywhere in the galaxy.'
  },
  { 
    id: 10, 
    name: 'Nature\'s Wrath', 
    type: 'Ability', 
    rarity: 'Rare', 
    genre: 'RPG',
    game: 'Druid Chronicles', 
    icon: '🌿',
    description: 'Command the forces of nature to entangle and damage enemies.',
    stats: { Damage: 45, Root: '4s', Area: 'Medium' },
    unlockCondition: 'Complete 25 nature-themed quests',
    releaseDate: 'Available Now',
    lore: 'The earth remembers those who protect it. In times of need, it rises to defend its champions.'
  },
];

// Card genres for filtering
const CARD_GENRES = ['All', 'RPG', 'Action', 'Sci-Fi', 'Horror', 'Strategy'];

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
    : size === 'medium'
    ? 'w-28 h-40'
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

// Game filter list for New Content (SAVED FOR LATER)
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

// Library Game Card Component
function LibraryGameCard({ game, isSelected, onClick, onPlay }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={`relative flex-shrink-0 w-32 cursor-pointer group ${isSelected ? 'ring-2 ring-cyan-400 rounded-xl' : ''}`}
    >
      <div 
        className="relative aspect-[3/4] rounded-xl overflow-hidden"
        style={{
          boxShadow: isHovered 
            ? '0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(100,150,255,0.2)' 
            : '0 8px 20px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
        }}
      >
        <img 
          src={game.cover_image || game.cover} 
          alt={game.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />
        
        {/* Hover Play Button */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            >
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={(e) => { e.stopPropagation(); onPlay?.(game); }}
                className="w-12 h-12 rounded-full bg-white hover:bg-white/90 flex items-center justify-center transition-colors shadow-xl"
              >
                <Play className="w-5 h-5 text-black fill-black ml-0.5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Info */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h3 className="text-white font-bold text-xs truncate drop-shadow-lg">{game.title}</h3>
          <div className="flex items-center gap-2 text-[9px] text-white/50 mt-0.5">
            <div className="flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              <span>12h</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Trophy className="w-2.5 h-2.5" />
              <span>8/15</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Genre Row Component with horizontal scroll and arrows
function GenreRow({ genre, games, onSelectGame, selectedGame, onPlayGame }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [games]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!games || games.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-cyan-400" />
          {genre}
          <span className="text-white/40 font-normal text-xs ml-2">({games.length})</span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              canScrollLeft ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              canScrollRight ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {games.map((game, idx) => (
          <LibraryGameCard
            key={game.id || idx}
            game={game}
            isSelected={selectedGame?.id === game.id}
            onClick={() => onSelectGame(game)}
            onPlay={onPlayGame}
          />
        ))}
      </div>
    </div>
  );
}

// Game Detail Panel for selected game
function GameDetailPanel({ game, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!game) return null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'discussion', label: 'Discussion' },
    { id: 'streamers', label: 'Streamers' },
    { id: 'guide', label: 'Guide' },
    { id: 'support', label: 'Support' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'affiliate', label: 'Affiliate' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="h-full flex flex-col"
    >
      {/* Game Header */}
      <div className="flex gap-3 mb-3">
        <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
          <img src={game.cover_image || game.cover} alt={game.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-white font-bold text-base leading-tight">{game.title}</h2>
              <p className="text-white/40 text-[10px] capitalize">{game.genre}</p>
            </div>
            <button 
              onClick={onClose}
              className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X className="w-2.5 h-2.5 text-white/60" />
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-3 text-[10px] text-white/50 mt-1.5">
            <div className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-blue-400" />
              <span>12.5h</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-2.5 h-2.5 text-yellow-400" />
              <span>8/15</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 mt-2">
            <button className="flex items-center gap-1 px-3 py-1.5 bg-white text-black rounded-md text-[10px] font-bold hover:bg-white/90 transition-colors">
              <Play className="w-2.5 h-2.5 fill-current" />
              Play
            </button>
            <button className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-500/20 text-purple-300 rounded-md text-[10px] font-medium hover:bg-purple-500/30 transition-colors border border-purple-500/30">
              <Radio className="w-2.5 h-2.5" />
              Stream
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2 py-1 rounded-md text-[9px] font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div>
                <h3 className="text-white font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  About
                </h3>
                <p className="text-white/50 text-[10px] leading-relaxed">
                  {game.description || 'Experience an epic journey in this critically acclaimed title. Master unique abilities, explore vast worlds, and uncover deep secrets.'}
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Clock, value: '12.5h', label: 'Played', color: 'text-blue-400' },
                  { icon: Trophy, value: '8/15', label: 'Achievements', color: 'text-yellow-400' },
                  { icon: Zap, value: '2h ago', label: 'Last Played', color: 'text-green-400' },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-2 bg-white/[0.03] rounded-lg border border-white/5">
                    <stat.icon className={`w-3 h-3 ${stat.color} mx-auto mb-1`} />
                    <p className="text-white font-bold text-xs">{stat.value}</p>
                    <p className="text-white/30 text-[8px]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'discussion' && (
            <motion.div
              key="discussion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {[
                { title: 'Best build for endgame?', replies: 45, user: 'DragonSlayer' },
                { title: 'Hidden easter eggs found!', replies: 23, user: 'MysticMage' },
                { title: 'Looking for raid group', replies: 12, user: 'ShadowNinja' },
              ].map((topic, i) => (
                <div key={i} className="p-2 bg-white/[0.03] rounded-lg border border-white/5 cursor-pointer hover:bg-white/[0.06] transition-colors">
                  <h4 className="text-white text-[10px] font-medium mb-0.5">{topic.title}</h4>
                  <p className="text-white/30 text-[8px]">by {topic.user} • {topic.replies} replies</p>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {[
                { name: 'Dragon Slayer', icon: '🐉', progress: 100, rarity: 'Legendary' },
                { name: 'Master Thief', icon: '💰', progress: 75, rarity: 'Epic' },
                { name: 'Arena Champion', icon: '⚔️', progress: 50, rarity: 'Rare' },
                { name: 'Explorer', icon: '🗺️', progress: 30, rarity: 'Common' },
              ].map((ach, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-white/[0.03] rounded-lg border border-white/5">
                  <span className="text-lg">{ach.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-[10px] font-medium">{ach.name}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                        ach.rarity === 'Legendary' ? 'bg-orange-500/20 text-orange-400' :
                        ach.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-400' :
                        ach.rarity === 'Rare' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-white/10 text-white/50'
                      }`}>{ach.rarity}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                        style={{ width: `${ach.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {['streamers', 'guide', 'support', 'affiliate'].includes(activeTab) && (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-24 text-white/20"
            >
              <Eye className="w-6 h-6 mb-2 opacity-50" />
              <p className="text-[10px] capitalize">{activeTab} coming soon</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Library Games Section (Bottom) - receives genre from scroll context
function LibraryGamesSection({ activeGenre, gamesByGenre, onSelectGame, selectedGame }) {
  const navigate = useNavigate();
  const libraryScrollRef = useRef(null);
  
  const currentGames = gamesByGenre[activeGenre] || [];

  const handleLibraryClick = () => {
    navigate(createPageUrl('Store'));
  };

  // Horizontal scroll on mouse wheel when hovering
  const handleWheel = (e) => {
    if (libraryScrollRef.current) {
      e.preventDefault();
      libraryScrollRef.current.scrollBy({
        left: e.deltaY * 2,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div>
      {/* Clickable Title - Transitions to Store */}
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={handleLibraryClick}
          className="text-white font-bold text-sm flex items-center gap-2 hover:text-cyan-400 transition-colors group"
        >
          <LibraryIcon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          Library Games
          <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-1 transition-transform" />
        </button>
        
        <div className="flex items-center gap-2">
          <motion.span 
            key={activeGenre}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-cyan-400 text-xs font-medium capitalize"
          >
            {activeGenre || 'All Games'}
          </motion.span>
          <span className="text-white/30 text-xs">({currentGames.length})</span>
        </div>
      </div>

      {/* Games Row - Horizontal scroll on hover */}
      <div 
        ref={libraryScrollRef}
        onWheel={handleWheel}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <AnimatePresence mode="popLayout">
          {currentGames.map((game, index) => {
            const isSelected = selectedGame?.id === game.id;
            return (
              <motion.div
                key={game.id}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                className="flex-shrink-0 w-20 group cursor-pointer"
                onClick={() => onSelectGame(game)}
              >
                <div className={`relative aspect-[3/4] rounded-lg overflow-hidden border transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] ${
                  isSelected 
                    ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                    : 'border-white/10 hover:border-cyan-400/50'
                }`}>
                  <img src={game.cover_image || game.cover} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/80 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-1.5">
                    <p className="text-white font-bold text-[10px] truncate">{game.title}</p>
                    <p className="text-white/40 text-[8px] capitalize truncate">{game.genre}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {currentGames.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center w-full h-20 text-white/30 text-xs"
          >
            No games in {activeGenre || 'this genre'}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// All available genres (master list)
const ALL_GENRES = [
  'Action',
  'Adventure', 
  'RPG',
  'First-Person Shooter',
  'Third-Person Shooter',
  'Fighting',
  'Racing',
  'Sports',
  'Strategy',
  'Simulation',
  'Horror',
  'Puzzle',
  'Platformer',
  'Open World',
  'MMO'
];

// Mini Genre Selector (For bottom section next to Library)
function MiniGenreSelector({ activeGenre, onGenreChange, gamesByGenre }) {
  const scrollRef = useRef(null);
  const genreRefs = useRef({});
  const scrollTimeoutRef = useRef(null);

  const displayGenres = ALL_GENRES;

  // Debounced scroll handler
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (!scrollRef.current) return;
      
      const container = scrollRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;
      
      let closestGenre = displayGenres[0];
      let closestDistance = Infinity;
      
      displayGenres.forEach((genre) => {
        const el = genreRefs.current[genre];
        if (el) {
          const rect = el.getBoundingClientRect();
          const elCenter = rect.top + rect.height / 2;
          const distance = Math.abs(elCenter - containerCenter);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestGenre = genre;
          }
        }
      });
      
      if (closestGenre !== activeGenre) {
        onGenreChange(closestGenre);
      }
    }, 100);
  };

  const handleWheel = (e) => {
    if (!scrollRef.current) return;
    e.preventDefault();
    scrollRef.current.scrollBy({
      top: e.deltaY / 2,
      behavior: 'auto'
    });
  };

  const handleGenreClick = (genre) => {
    onGenreChange(genre);
    const el = genreRefs.current[genre];
    if (el && scrollRef.current) {
      const container = scrollRef.current;
      const containerHeight = container.clientHeight;
      const elTop = el.offsetTop;
      const elHeight = el.clientHeight;
      container.scrollTo({
        top: elTop - (containerHeight / 2) + (elHeight / 2),
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="flex flex-col h-32 w-28 flex-shrink-0">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        className="flex-1 overflow-y-auto py-6"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayGenres.map((genre, index) => {
          const hasGames = gamesByGenre[genre]?.length > 0;
          const isActive = activeGenre === genre;
          
          return (
            <div
              key={genre}
              ref={(el) => genreRefs.current[genre] = el}
              onClick={() => handleGenreClick(genre)}
              className="relative py-1.5 pl-2 cursor-pointer hover:bg-white/5 rounded transition-colors"
            >
              <span className={`font-medium transition-all duration-200 ${
                isActive 
                  ? 'text-cyan-300 text-xs' 
                  : hasGames
                    ? 'text-white/40 text-[10px]'
                    : 'text-white/15 text-[10px]'
              }`}>
                {genre}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="miniGenreActiveLine"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-cyan-400 rounded-full"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Card Detail Overlay - Translucent Achievement style (like Destiny cards)
function CardDetailOverlay({ card, onClose }) {
  if (!card) return null;
  
  const style = rarityStyles[card.rarity];
  
  // Generate a card ID
  const cardId = `CARD-${card.id.toString().padStart(4, '0')}-${card.rarity?.substring(0, 1)}${card.type?.substring(0, 1)}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Translucent Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />

      {/* Modal Container - Translucent glass box */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-3xl rounded-2xl overflow-hidden border-2 ${style?.border || 'border-white/20'}`}
        style={{
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: `0 25px 80px rgba(0,0,0,0.6), 0 0 60px ${
            card.rarity === 'Legendary' ? 'rgba(251, 191, 36, 0.15)' :
            card.rarity === 'Epic' ? 'rgba(168, 85, 247, 0.15)' :
            'rgba(59, 130, 246, 0.15)'
          }`
        }}
      >
        {/* Top Rarity Glow Bar */}
        <div className={`h-1 ${
          card.rarity === 'Legendary' ? 'bg-gradient-to-r from-transparent via-amber-400 to-transparent' :
          card.rarity === 'Epic' ? 'bg-gradient-to-r from-transparent via-purple-400 to-transparent' :
          'bg-gradient-to-r from-transparent via-blue-400 to-transparent'
        }`} />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10 backdrop-blur-md border border-white/10"
        >
          <X className="w-5 h-5 text-white/80" />
        </button>

        <div className="p-8">
          <div className="flex gap-8">
            {/* Left Side - Card Preview in Glass Box */}
            <div className="flex-shrink-0 flex flex-col items-center">
              {/* Card Container with inner glow */}
              <div 
                className={`p-4 rounded-xl border ${style?.border || 'border-white/20'}`}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  boxShadow: `inset 0 0 30px ${
                    card.rarity === 'Legendary' ? 'rgba(251, 191, 36, 0.1)' :
                    card.rarity === 'Epic' ? 'rgba(168, 85, 247, 0.1)' :
                    'rgba(59, 130, 246, 0.1)'
                  }`
                }}
              >
                <AchievementStyleCard card={card} isSelected={true} size="large" />
              </div>
              
              {/* Card ID Badge */}
              <div className="mt-4 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                <p className="text-white/30 text-[10px] font-mono tracking-widest">{cardId}</p>
              </div>
            </div>

            {/* Right Side - Card Details */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h2 className={`text-3xl font-black mb-2 ${style?.text || 'text-white'}`}>{card.name}</h2>
              
              {/* Meta Tags Row */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {/* Rarity */}
                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                  card.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  card.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                  'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}>
                  <Star className="w-3 h-3 inline mr-1" />
                  {card.rarity}
                </span>
                
                {/* Type/Class */}
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white/80 border border-white/10">
                  <Zap className="w-3 h-3 inline mr-1" />
                  {card.type}
                </span>
                
                {/* Genre */}
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white/80 border border-white/10">
                  {card.genre}
                </span>

                {/* Release Status */}
                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  card.releaseDate === 'Available Now' 
                    ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {card.releaseDate}
                </span>
              </div>

              {/* Description */}
              <p className="text-white/70 text-sm leading-relaxed mb-5">{card.description}</p>

              {/* Source Game */}
              <div className="flex items-center gap-2 mb-5 p-3 rounded-lg bg-white/5 border border-white/10">
                <Gamepad2 className="w-4 h-4 text-white/40" />
                <span className="text-white/60 text-sm">From: <span className="text-white font-medium">{card.game}</span></span>
              </div>

              {/* Stats Grid */}
              <div className="mb-5">
                <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Card Stats</h4>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(card.stats).map(([key, val]) => (
                    <div 
                      key={key} 
                      className="p-3 rounded-lg text-center border border-white/10"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                      <p className={`font-bold text-lg ${style?.text || 'text-cyan-400'}`}>{val}</p>
                      <p className="text-white/40 text-[10px] uppercase tracking-wide">{key}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lore */}
              {card.lore && (
                <div className="p-4 rounded-lg border border-white/10 mb-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <BookOpen className="w-4 h-4 text-white/30 mb-2" />
                  <p className="text-white/50 text-xs italic leading-relaxed">"{card.lore}"</p>
                </div>
              )}

              {/* Unlock Condition */}
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300 text-xs font-bold uppercase tracking-wide">Unlock Condition</span>
                </div>
                <p className="text-white/80 text-sm">{card.unlockCondition}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-5">
                <button className="flex-1 px-5 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-white/90 transition-all hover:scale-[1.02]">
                  Track Progress
                </button>
                <button className="px-5 py-3 bg-white/10 text-white font-medium text-sm rounded-xl hover:bg-white/20 transition-all border border-white/10">
                  <Heart className="w-4 h-4 inline mr-2" />
                  Wishlist
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Fade Bar */}
        <div className={`h-0.5 ${
          card.rarity === 'Legendary' ? 'bg-gradient-to-r from-transparent via-amber-400/50 to-transparent' :
          card.rarity === 'Epic' ? 'bg-gradient-to-r from-transparent via-purple-400/50 to-transparent' :
          'bg-gradient-to-r from-transparent via-blue-400/50 to-transparent'
        }`} />
      </motion.div>
    </motion.div>
  );
}

// New Cards Section - Genre-based layout like Library
function NewCardsSection({ upcomingCards }) {
  const [activeCardGenre, setActiveCardGenre] = useState('All');
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardOverlay, setShowCardOverlay] = useState(false);
  const cardScrollRef = useRef(null);
  const genreRefs = useRef({});

  // Filter cards by genre
  const filteredCards = useMemo(() => {
    if (activeCardGenre === 'All') return upcomingCards;
    return upcomingCards.filter(card => card.genre === activeCardGenre);
  }, [upcomingCards, activeCardGenre]);

  // Handle card click - show overlay
  const handleCardClick = (card) => {
    setSelectedCard(card);
    setShowCardOverlay(true);
  };

  // Handle genre scroll
  const handleGenreScroll = () => {
    // Similar to library genre scroll
  };

  // Map selected card to AchievementDetailOverlay format
  const achievementFromCard = useMemo(() => {
    if (!selectedCard) return null;
    const rarityPoints = {
      Common: 25,
      Rare: 50,
      Epic: 100,
      Legendary: 150
    };
    const categoryMap = {
      Ability: 'ability',
      Equipment: 'equipment',
      Passive: 'ability'
    };
    return {
      title: selectedCard.name,
      description: selectedCard.description,
      game: selectedCard.game,
      category: categoryMap[selectedCard.type] || 'standard',
      rarity: selectedCard.rarity,
      points: rarityPoints[selectedCard.rarity] || 50,
      icon: selectedCard.icon,
      reward: {
        type: selectedCard.type,
        name: selectedCard.name,
        description: selectedCard.lore || selectedCard.description,
        stats: selectedCard.stats
      }
    };
  }, [selectedCard]);

  return (
    <motion.div
      key="cards"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Upcoming Cards</h4>
        <span className="text-amber-400 text-xs font-semibold">{filteredCards.length} Cards</span>
      </div>

      {/* Main Content - Genre selector left, Cards + Details right */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Genre Selector - Vertical scroll */}
        <div className="w-24 flex-shrink-0 overflow-y-auto py-2" style={{ scrollbarWidth: 'none' }}>
          {CARD_GENRES.map((genre) => {
            const count = genre === 'All' ? upcomingCards.length : upcomingCards.filter(c => c.genre === genre).length;
            const isActive = activeCardGenre === genre;
            
            return (
              <div
                key={genre}
                ref={(el) => genreRefs.current[genre] = el}
                onClick={() => setActiveCardGenre(genre)}
                className={`relative py-2 px-2 cursor-pointer rounded-lg mb-1 transition-all ${
                  isActive ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium transition-all ${
                    isActive ? 'text-cyan-300 text-xs' : 'text-white/40 text-[10px]'
                  }`}>
                    {genre}
                  </span>
                  <span className={`text-[9px] ${isActive ? 'text-cyan-400' : 'text-white/20'}`}>
                    {count}
                  </span>
                </div>
                
                {isActive && (
                  <motion.div
                    layoutId="cardGenreActiveLine"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-cyan-400 rounded-full"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Vertical Divider */}
        <div className="w-px bg-white/10 self-stretch" />

        {/* Cards Row + Selected Card Details */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Cards Horizontal Scroll */}
          <div 
            ref={cardScrollRef}
            className="flex gap-3 overflow-x-auto pb-3 mb-3"
            style={{ scrollbarWidth: 'none' }}
          >
            <AnimatePresence mode="popLayout">
              {filteredCards.map((card, idx) => (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <AchievementStyleCard
                    card={card}
                    isSelected={selectedCard?.id === card.id}
                    onClick={() => setSelectedCard(card)}
                    size="small"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredCards.length === 0 && (
              <div className="flex items-center justify-center w-full h-28 text-white/30 text-xs">
                No cards in {activeCardGenre}
              </div>
            )}
          </div>

          {/* Selected Card Quick Details */}
          <AnimatePresence mode="wait">
            {selectedCard ? (
              <motion.div
                key={selectedCard.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 p-3 bg-white/[0.02] rounded-lg border border-white/5 overflow-y-auto"
                style={{ scrollbarWidth: 'none' }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{selectedCard.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-white font-bold text-sm">{selectedCard.name}</h4>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                        selectedCard.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-300' :
                        selectedCard.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>{selectedCard.rarity}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                        selectedCard.releaseDate === 'Available Now' ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/50'
                      }`}>{selectedCard.releaseDate}</span>
                    </div>
                    
                    <p className="text-white/40 text-[10px] mb-2">{selectedCard.type} • {selectedCard.game}</p>
                    <p className="text-white/60 text-xs mb-3 line-clamp-2">{selectedCard.description}</p>
                    
                    {/* Stats */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {Object.entries(selectedCard.stats).map(([key, val]) => (
                        <div key={key} className="px-2 py-1 bg-black/30 rounded text-[9px]">
                          <span className="text-white/40">{key}:</span>
                          <span className="text-cyan-400 ml-1 font-semibold">{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Unlock & View More */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[9px] text-amber-400/70">
                        <Trophy className="w-3 h-3" />
                        <span className="truncate">{selectedCard.unlockCondition}</span>
                      </div>
                      <button 
                        onClick={() => setShowCardOverlay(true)}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] text-white font-medium transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-white/20"
              >
                <Crown className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">Select a card to view details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Full Card Detail Overlay (use Achievements translucent UI) */}
      <AnimatePresence>
        {showCardOverlay && achievementFromCard && (
          <AchievementDetailOverlay 
            achievement={achievementFromCard}
            onClose={() => setShowCardOverlay(false)}
            onTrack={() => {}}
            isTracked={false}
            onShare={() => {}}
            onChallenge={() => {}}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// News Feed Section - Xbox-style organized dashboard
function NewsFeedSection({ upcomingCards, selectedGame, onSelectGame }) {
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedCard, setSelectedCard] = useState(null);

  // Featured content
  const featuredContent = {
    title: "Winter Solstice Event",
    subtitle: "Limited Time",
    description: "Exclusive AI traits and legendary cards available until December 31st",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=300&fit=crop",
    tag: "LIVE EVENT"
  };

  // Platform updates
  const updates = [
    { id: 1, category: 'PLATFORM', title: 'Atom x Eve v2.5', description: 'New AI algorithms & card fusion', time: '2h', color: 'bg-green-500' },
    { id: 2, category: 'AI', title: 'Behavior Sync', description: 'Stealth pattern recognition added', time: '5h', color: 'bg-purple-500' },
    { id: 3, category: 'CARDS', title: 'New Legendaries', description: '3 new cards in the vault', time: '1d', color: 'bg-amber-500' },
  ];

  // AI stats
  const aiStats = [
    { label: 'Combat Style', value: 'Aggressive', trend: '+5%', up: true },
    { label: 'Risk Level', value: 'High', trend: '+12%', up: true },
    { label: 'Stealth Pref', value: 'Low', trend: '-3%', up: false },
  ];

  const tabs = [
    { id: 'feed', label: 'Feed' },
    { id: 'ai', label: 'AI Status' },
    { id: 'cards', label: 'New Cards' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header Bar - Xbox style */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm font-semibold uppercase tracking-wide transition-all pb-2 border-b-2 ${
                activeTab === tab.id 
                  ? 'text-white border-green-500' 
                  : 'text-white/40 border-transparent hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-white/30 text-xs font-mono">LIVE</span>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Featured Banner */}
              <div className="relative rounded-lg overflow-hidden h-36 group cursor-pointer">
                <img 
                  src={featuredContent.image} 
                  alt={featuredContent.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-0.5 bg-green-500 text-black text-[10px] font-bold uppercase tracking-wider rounded">
                    {featuredContent.tag}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white/50 text-[10px] uppercase tracking-wider">{featuredContent.subtitle}</p>
                  <h3 className="text-white font-bold text-lg">{featuredContent.title}</h3>
                  <p className="text-white/60 text-xs mt-0.5">{featuredContent.description}</p>
                </div>
              </div>

              {/* Updates List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Recent Updates</h4>
                  <button className="text-green-400 text-[10px] font-semibold hover:text-green-300">See All</button>
                </div>
                <div className="space-y-2">
                  {updates.map((update) => (
                    <div 
                      key={update.id}
                      className="flex items-center gap-3 p-3 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
                    >
                      <div className={`w-1 h-10 rounded-full ${update.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider">{update.category}</span>
                          <span className="text-white/20">•</span>
                          <span className="text-[9px] text-white/30">{update.time}</span>
                        </div>
                        <h5 className="text-white font-semibold text-sm group-hover:text-green-400 transition-colors">{update.title}</h5>
                        <p className="text-white/40 text-xs truncate">{update.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5 text-center">
                  <p className="text-2xl font-bold text-white">47</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Cards Owned</p>
                </div>
                <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5 text-center">
                  <p className="text-2xl font-bold text-green-400">12</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Games Played</p>
                </div>
                <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5 text-center">
                  <p className="text-2xl font-bold text-purple-400">Lv.8</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">AI Level</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* AI Header */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg border border-purple-500/20">
                <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center border-2 border-purple-500/40">
                  <Bot className="w-7 h-7 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">ATOM AI</h3>
                  <p className="text-purple-300/60 text-xs">Learning from your gameplay • Active</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-white font-bold">Level 8</p>
                  <p className="text-white/30 text-[10px]">2,450 / 3,000 XP</p>
                </div>
              </div>

              {/* XP Progress */}
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '82%' }} />
              </div>

              {/* Behavioral Stats */}
              <div>
                <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-3">Behavioral Analysis</h4>
                <div className="space-y-2">
                  {aiStats.map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
                      <span className="text-white/70 text-sm">{stat.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-semibold text-sm">{stat.value}</span>
                        <span className={`text-xs font-bold ${stat.up ? 'text-green-400' : 'text-red-400'}`}>
                          {stat.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Learning */}
              <div>
                <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-3">Recent Learning</h4>
                <div className="p-4 bg-white/[0.02] rounded-lg border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-white font-semibold text-sm">New Pattern Detected</span>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">
                    Your AI noticed increased aggression in RPG combat scenarios. Adapting companion behavior to match your playstyle.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'cards' && (
            <NewCardsSection 
              upcomingCards={upcomingCards}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Selected Game Panel - Shows at bottom when game selected */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 pt-4 border-t border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Now Playing</h4>
              <button onClick={() => onSelectGame(null)} className="text-white/30 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <img src={selectedGame.image || selectedGame.cover_image} alt={selectedGame.title} className="w-12 h-12 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <h5 className="text-white font-semibold text-sm truncate">{selectedGame.title}</h5>
                <p className="text-green-400 text-xs">{selectedGame.genre}</p>
              </div>
              <button className="px-4 py-2 bg-green-500 text-black font-bold text-xs uppercase rounded hover:bg-green-400 transition-colors">
                Play
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main Export
export default function FocusModePanel() {
  const { user, isAuthenticated } = useAuth();
  const [selectedGame, setSelectedGame] = useState(null);
  const [activeGenre, setActiveGenre] = useState('Action');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([
    { id: 1, title: 'Guild Raid Night', type: 'event', time: '20:00', date: new Date().toISOString() },
    { id: 2, title: 'Complete daily quests', type: 'goal', time: '', date: new Date().toISOString() },
  ]);
  const [ownedGames, setOwnedGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch games for bottom Library section
  useEffect(() => {
    const fetchGames = async () => {
      let userGames = [];
      const testGameAlpha = allMockGames['test_game_alpha'];

      if (isAuthenticated) {
        const allGamesFromDb = await base44.entities.Game.list();
        const combinedGamePool = { ...allMockGames, ...Object.fromEntries(allGamesFromDb.map(g => [g.id, g])) };
        const ownedIds = user?.purchased_items || [];
        userGames = ownedIds.map(id => combinedGamePool[id]).filter(Boolean);
        if (testGameAlpha) userGames.unshift(testGameAlpha);
      } else {
        if (testGameAlpha) userGames.push(testGameAlpha);
        userGames = [...userGames, ...Object.values(allMockGames).slice(0, 20)];
      }
      
      setOwnedGames(Array.from(new Map(userGames.map(g => [g.id, g])).values()));
      setLoading(false);
    };
    fetchGames();
  }, [user, isAuthenticated]);

  // Compute games by genre - map to ALL_GENRES
  const gamesByGenre = useMemo(() => {
    const result = {};
    // Initialize all genres
    ALL_GENRES.forEach(g => result[g] = []);
    
    // Map games to genres
    ownedGames.forEach(game => {
      const gameGenre = game.genre || 'Action';
      // Try to match to our genre list
      const matchedGenre = ALL_GENRES.find(g => 
        g.toLowerCase() === gameGenre.toLowerCase() ||
        g.toLowerCase().includes(gameGenre.toLowerCase()) ||
        gameGenre.toLowerCase().includes(g.toLowerCase().split(' ')[0])
      ) || 'Action';
      
      if (result[matchedGenre]) {
        result[matchedGenre].push(game);
      }
    });
    
    return result;
  }, [ownedGames]);

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

  return (
    <div className="h-full flex flex-col" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`.focus-panel-scroll::-webkit-scrollbar { display: none; }`}</style>

      {/* Top Section - News Feed & Content (right of 3D viewer) */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left side - placeholder for 3D viewer area */}
        <div className="w-[300px] flex-shrink-0">
          {/* 3D viewer renders here via fixed positioning in LunaTemplate */}
        </div>

        {/* Right of 3D Viewer - News & Updates Feed */}
        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
          {/* Vertical Divider */}
          <div className="w-px bg-white/10 self-stretch" />

          {/* Content Area - News, Updates, New Cards */}
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
            <NewsFeedSection 
              upcomingCards={upcomingCards}
              selectedGame={selectedGame}
              onSelectGame={setSelectedGame}
            />
          </div>
        </div>
      </div>

      {/* Horizontal Divider */}
      <div className="h-px bg-white/10 my-4" />

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

      {/* Bottom Section - Time, Goals, Genre Selector, and Library Games */}
      <div className="flex gap-4 pt-4">
        {/* Time & Date with Mini Calendar */}
        <div className="flex-shrink-0">
          <TimeDisplay onCalendarClick={handleCalendarDayClick} events={calendarEvents} />
        </div>

        {/* Goals */}
        <div className="flex-shrink-0 w-40">
          <GoalsPanel />
        </div>

        {/* Mini Genre Selector - Scroll to change games */}
        <MiniGenreSelector 
          activeGenre={activeGenre}
          onGenreChange={setActiveGenre}
          gamesByGenre={gamesByGenre}
        />

        {/* Library Games - Changes based on genre scroll */}
        <div className="flex-1 min-w-0">
          <LibraryGamesSection 
            activeGenre={activeGenre}
            gamesByGenre={gamesByGenre}
            onSelectGame={setSelectedGame}
            selectedGame={selectedGame}
          />
        </div>
      </div>
    </div>
  );
}