import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Clock, Target, ChevronLeft, ChevronRight,
  Plus, Star, Zap, Sword, Shield, Wand2, Flame, Pin,
  Play, Sparkles, Trophy, Crown, Eye, Check, Trash2, X,
  Library as LibraryIcon, Radio, Gamepad2, Search, MoreHorizontal, Bot,
  Heart, BookOpen, Bell, Settings
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { allMockGames } from '../store/mockData';
import CardTutorialOverlay from '../cards/CardTutorialOverlay';


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
      <div 
        className={`absolute inset-0 rounded-xl border-2 ${style.border} ${isSelected || isHovered ? style.glow : ''} overflow-hidden transition-shadow duration-300`}
        style={{
          background: 'linear-gradient(135deg, rgba(30, 40, 55, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      >
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

// Mini Calendar Component - 20% smaller
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
    <div className="mt-2" style={{ transform: 'scale(0.8)', transformOrigin: 'top left', width: '125%' }}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-1.5">
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          className="w-4 h-4 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-2.5 h-2.5 text-white/60" />
        </button>
        <span className="text-[10px] text-white/80 font-medium">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
          className="w-4 h-4 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-2.5 h-2.5 text-white/60" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {dayNames.map((day, i) => (
          <div key={i} className="text-center text-[7px] text-white/40 font-medium py-0.5">
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
            className={`aspect-square flex items-center justify-center text-[8px] rounded transition-all relative ${
              day
                ? isToday(day)
                  ? 'bg-cyan-500 text-white font-bold cursor-pointer'
                  : 'text-white/70 hover:bg-white/10 cursor-pointer'
                : ''
            }`}
          >
            {day}
            {hasEvent(day) && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-amber-400" />
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
          background: 'linear-gradient(135deg, rgba(100, 120, 140, 0.15) 0%, rgba(80, 100, 120, 0.10) 100%)',
          backdropFilter: 'blur(30px) saturate(150%)',
          WebkitBackdropFilter: 'blur(30px) saturate(150%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
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
          className="flex items-center gap-2 p-2 rounded-lg border hover:border-cyan-400/40 transition-all cursor-pointer group w-40"
          style={{
            background: 'rgba(100, 120, 140, 0.10)',
            backdropFilter: 'blur(12px) saturate(120%)',
            WebkitBackdropFilter: 'blur(12px) saturate(120%)',
            borderColor: 'rgba(255, 255, 255, 0.08)'
          }}
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
                  <div key={i} className="text-center p-2 rounded-lg border" style={{ background: 'rgba(100, 120, 140, 0.08)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
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
                <div key={i} className="p-2 rounded-lg border cursor-pointer transition-colors hover:border-cyan-400/20" style={{ background: 'rgba(100, 120, 140, 0.08)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
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
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg border" style={{ background: 'rgba(100, 120, 140, 0.08)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                  <span className="text-lg">{ach.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-[10px] font-medium">{ach.name}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                        ach.rarity === 'Legendary' ? 'bg-orange-500/20 text-orange-400' :
                        ach.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-400' :
                        ach.rarity === 'Rare' ? 'bg-cyan-500/20 text-cyan-400' :
                        'bg-white/10 text-white/50'
                      }`}>{ach.rarity}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full"
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

// Library Games Section (Bottom) - shows all games
function LibraryGamesSection({ onSelectGame, selectedGame, allGames }) {
  const navigate = useNavigate();
  const libraryScrollRef = useRef(null);
  const [showGamePanel, setShowGamePanel] = useState(false);
  
  // Show all games
  const currentGames = allGames;

  const handleLibraryClick = () => {
    navigate(createPageUrl('Store'));
  };

  const handleGameClick = (game) => {
    onSelectGame(game);
    setShowGamePanel(true);
  };

  const handleClosePanel = () => {
    setShowGamePanel(false);
  };

  // Split games into rows of 10
  const rows = [];
  for (let i = 0; i < currentGames.length; i += 10) {
    rows.push(currentGames.slice(i, i + 10));
  }

  return (
    <div className="h-full flex gap-3" onClick={(e) => {
      // Close panel when clicking outside of it (but not on games)
      if (!e.target.closest('[data-game-panel]') && !e.target.closest('[data-game-card]')) {
        setShowGamePanel(false);
      }
    }}>
      {/* Main Games Grid */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${showGamePanel && selectedGame ? 'pr-0' : ''}`}>
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
          
          <span className="text-white/30 text-xs">({currentGames.length} games)</span>
        </div>

        {/* Games Grid - Rows of 10, vertical scroll */}
        <div 
          ref={libraryScrollRef}
          className="flex-1 overflow-y-auto space-y-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', maxHeight: '200px' }}
        >
          <AnimatePresence mode="popLayout">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2">
                {row.map((game, index) => {
                  const isSelected = selectedGame?.id === game.id && showGamePanel;
                  return (
                    <motion.div
                      key={game.id}
                      layout
                      data-game-card
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -20 }}
                      transition={{ delay: (rowIndex * 10 + index) * 0.02, duration: 0.3 }}
                      className="flex-shrink-0 w-[calc(10%-6px)] min-w-[69px] group cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); handleGameClick(game); }}
                    >
                      <div className={`relative aspect-[3/4] rounded-lg overflow-hidden border transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] ${
                        isSelected 
                          ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                          : 'border-white/10 hover:border-cyan-400/50'
                      }`}>
                        <img src={game.cover_image || game.cover} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-6 h-6 rounded-full bg-cyan-500/80 flex items-center justify-center">
                            <Play className="w-3 h-3 text-white ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-1">
                          <p className="text-white font-bold text-[8px] truncate">{game.title}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </AnimatePresence>
          {currentGames.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center w-full h-20 text-white/30 text-xs"
            >
              No games in library
            </motion.div>
          )}
        </div>
      </div>

      {/* Slide-out Game Options Panel */}
      <AnimatePresence>
        {showGamePanel && selectedGame && (
          <GameOptionsPanel 
            game={selectedGame} 
            onClose={handleClosePanel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Game Options Slide-out Panel
function GameOptionsPanel({ game, onClose }) {
  const navigate = useNavigate();

  const menuOptions = [
    { id: 'play', label: 'Play Game', icon: Play, isButton: true },
    { id: 'settings', label: 'Settings', icon: Settings, isButton: false },
    { id: 'updates', label: 'Check Updates', icon: Zap, isButton: false },
  ];

  const handleOptionClick = (optionId) => {
    switch(optionId) {
      case 'play':
        console.log('Launching game:', game.title);
        break;
      case 'settings':
        console.log('Opening settings for:', game.title);
        break;
      case 'updates':
        console.log('Checking updates for:', game.title);
        break;
      default:
        break;
    }
  };

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 220, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="h-full flex-shrink-0 overflow-hidden"
      data-game-panel
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="h-full w-[220px] rounded-xl border flex flex-col"
        style={{
          background: 'rgba(100, 120, 140, 0.12)',
          backdropFilter: 'blur(16px) saturate(130%)',
          WebkitBackdropFilter: 'blur(16px) saturate(130%)',
          borderColor: 'rgba(255, 255, 255, 0.10)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Game Cover */}
        <div className="px-3 pt-3 pb-3">
          <div className="relative aspect-[16/9] rounded-lg overflow-hidden border border-white/10">
            <img 
              src={game.cover_image || game.cover} 
              alt={game.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        </div>

        {/* Game Title */}
        <div className="px-3 pb-3">
          <h3 className="text-white font-bold text-sm truncate">{game.title}</h3>
          <p className="text-white/40 text-[10px] capitalize">{game.genre}</p>
        </div>

        {/* Menu Options */}
        <div className="flex-1 px-3 pb-3 space-y-1.5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {menuOptions.map((option) => (
            option.isButton ? (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-400 text-black text-xs font-medium transition-all"
              >
                <option.icon className="w-4 h-4" />
                {option.label}
              </button>
            ) : (
              <div
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                className="flex items-center gap-2.5 py-1.5 text-white/70 hover:text-white text-xs cursor-pointer transition-colors"
              >
                <option.icon className="w-4 h-4 text-white/50" />
                {option.label}
              </div>
            )
          ))}
        </div>

        {/* Quick Stats */}
        <div className="px-3 pb-3 pt-2 border-t border-white/10">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(100, 120, 140, 0.10)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
              <p className="text-white font-bold text-xs">12.5h</p>
              <p className="text-white/30 text-[8px]">Played</p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(100, 120, 140, 0.10)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
              <p className="text-white font-bold text-xs">8/15</p>
              <p className="text-white/30 text-[8px]">Achievements</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// All available genres (master list) - Expanded full list
const ALL_GENRES = [
  'All',
  'Action',
  'Adventure', 
  'RPG',
  'MMORPG',
  'First-Person Shooter',
  'Third-Person Shooter',
  'Fighting',
  'Racing',
  'Sports',
  'Strategy',
  'Real-Time Strategy',
  'Turn-Based Strategy',
  'Simulation',
  'Life Simulation',
  'Horror',
  'Survival Horror',
  'Puzzle',
  'Platformer',
  'Metroidvania',
  'Open World',
  'Sandbox',
  'MMO',
  'Battle Royale',
  'Roguelike',
  'Roguelite',
  'Stealth',
  'Tactical',
  'Tower Defense',
  'Visual Novel',
  'Dating Sim',
  'Card Game',
  'Board Game',
  'Rhythm',
  'Music',
  'Educational',
  'Trivia',
  'Party',
  'Arcade',
  'Shoot Em Up',
  'Beat Em Up',
  'Hack and Slash',
  'Soulslike',
  'Survival',
  'Crafting',
  'Building',
  'City Builder',
  'Management',
  'Farming',
  'Fishing',
  'Hunting',
  'Flight Sim',
  'Space Sim',
  'Mech',
  'Vehicular Combat',
  'Wrestling',
  'Boxing',
  'Golf',
  'Tennis',
  'Baseball',
  'Basketball',
  'Football',
  'Soccer',
  'Hockey',
  'Skateboarding',
  'Snowboarding',
  'Extreme Sports',
  'Indie',
  'Casual',
  'Hardcore',
  'Retro',
  'Classic',
  'Remaster',
  'Remake',
  'Early Access',
  'Free to Play',
  'Premium',
  'VR',
  'AR',
  'Co-op',
  'Multiplayer',
  'Single Player',
  'Local Multiplayer',
  'Online Multiplayer',
  'Cross-Platform',
  'Sci-Fi',
  'Fantasy',
  'Cyberpunk',
  'Steampunk',
  'Post-Apocalyptic',
  'Historical',
  'Military',
  'Western',
  'Anime',
  'Cartoon',
  'Realistic',
  'Abstract'
];

// Compact Vertical Genre Scroll Selector (next to Library) - Fixed height showing ~7 items
function MiniGenreSelector({ activeGenre, onGenreChange, gamesByGenre }) {
  const scrollRef = useRef(null);
  const genreRefs = useRef({});
  const currentIndexRef = useRef(0);

  const displayGenres = ALL_GENRES;

  // Initialize currentIndex based on activeGenre
  useEffect(() => {
    const idx = displayGenres.indexOf(activeGenre);
    if (idx !== -1) {
      currentIndexRef.current = idx;
    }
  }, [activeGenre, displayGenres]);

  // Scroll to Action genre on mount
  useEffect(() => {
    const actionIndex = displayGenres.indexOf('Action');
    if (actionIndex !== -1 && scrollRef.current && genreRefs.current['Action']) {
      currentIndexRef.current = actionIndex;
      genreRefs.current['Action'].scrollIntoView({ block: 'start' });
    }
  }, []);

  const handleWheel = (e) => {
    e.preventDefault();
    
    // Determine scroll direction and move one genre at a time
    const direction = e.deltaY > 0 ? 1 : -1;
    const newIndex = Math.max(0, Math.min(displayGenres.length - 1, currentIndexRef.current + direction));
    
    if (newIndex !== currentIndexRef.current) {
      currentIndexRef.current = newIndex;
      const newGenre = displayGenres[newIndex];
      onGenreChange(newGenre);
      
      const el = genreRefs.current[newGenre];
      if (el && scrollRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  const handleGenreClick = (genre) => {
    const idx = displayGenres.indexOf(genre);
    if (idx !== -1) {
      currentIndexRef.current = idx;
    }
    onGenreChange(genre);
  };

  return (
    <div className="flex flex-col w-28 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-white/50 text-[9px] font-bold uppercase tracking-wider">Genres</h3>
      </div>
      
      {/* Vertical Scroll Genre List - Fixed height for ~7 items */}
      <div 
        ref={scrollRef}
        onWheel={handleWheel}
        className="overflow-y-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', maxHeight: '168px' }}
      >
        {displayGenres.map((genre) => {
          const gameCount = gamesByGenre[genre]?.length || 0;
          const hasGames = gameCount > 0;
          const isActive = activeGenre === genre;
          
          return (
            <div
              key={genre}
              ref={(el) => genreRefs.current[genre] = el}
              onClick={() => handleGenreClick(genre)}
              className={`relative py-1 pl-2 pr-1 cursor-pointer transition-all rounded-sm ${
                isActive 
                  ? 'text-cyan-300' 
                  : hasGames
                    ? 'text-white/50 hover:text-white/80'
                    : 'text-white/20 hover:text-white/30'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="genreActiveLine"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-cyan-400 rounded-full"
                />
              )}
              <span className={`text-[10px] font-medium ${isActive ? 'text-cyan-300' : ''}`}>{genre}</span>
              {hasGames && (
                <span className={`ml-1 text-[8px] ${isActive ? 'text-cyan-400' : 'text-white/30'}`}>({gameCount})</span>
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
          background: 'linear-gradient(135deg, rgba(100, 120, 140, 0.15) 0%, rgba(80, 100, 120, 0.12) 100%)',
          backdropFilter: 'blur(35px) saturate(150%)',
          WebkitBackdropFilter: 'blur(35px) saturate(150%)',
          boxShadow: `0 25px 80px rgba(0,0,0,0.6), 0 0 60px ${
            card.rarity === 'Legendary' ? 'rgba(251, 191, 36, 0.15)' :
            card.rarity === 'Epic' ? 'rgba(168, 85, 247, 0.15)' :
            'rgba(34, 211, 238, 0.15)'
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
                    onClick={() => { setSelectedCard(card); setShowCardOverlay(true); }}
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

          {/* Selected Card Quick Details removed per request; overlay handles details/tutorials */}
        </div>
      </div>

      {/* Full Card Detail Overlay - with tutorial subpage */}
      <AnimatePresence>
        {showCardOverlay && selectedCard && (
          <CardTutorialOverlay 
            card={selectedCard}
            onClose={() => setShowCardOverlay(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Live Panel - Condensed unified module (replaces Feed/AI Status/Cards tabs)
function LivePanel({ upcomingCards }) {
  const navigate = useNavigate();
  const [showCardOverlay, setShowCardOverlay] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  // System alerts / updates
  const alerts = [
    { id: 1, type: 'event', icon: '🎄', title: 'Winter Solstice Event', description: 'Legendary cards available', time: 'Live', color: 'bg-green-500' },
    { id: 2, type: 'drop', icon: '🃏', title: 'New Card Drop', description: '3 new legendaries added', time: '2h', color: 'bg-amber-500' },
    { id: 3, type: 'update', icon: '🤖', title: 'AI Update v2.5', description: 'Behavior sync improved', time: '5h', color: 'bg-purple-500' },
  ];

  // Get latest 3 cards
  const latestCards = upcomingCards.slice(0, 3);

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setShowCardOverlay(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
          <Radio className="w-4 h-4 text-green-400 animate-pulse" />
          Live Panel
        </h3>
        <span className="text-green-400 text-[10px] font-mono">● LIVE</span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-4" style={{ scrollbarWidth: 'none' }}>
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg border text-center" style={{ background: 'rgba(100, 120, 140, 0.08)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
            <p className="text-lg font-bold text-white">47</p>
            <p className="text-[8px] text-white/40 uppercase">Cards</p>
          </div>
          <div className="p-2 rounded-lg border text-center" style={{ background: 'rgba(100, 120, 140, 0.08)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
            <p className="text-lg font-bold text-cyan-400">12</p>
            <p className="text-[8px] text-white/40 uppercase">Games</p>
          </div>
          <div className="p-2 rounded-lg border text-center" style={{ background: 'rgba(100, 120, 140, 0.08)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
            <p className="text-lg font-bold text-purple-400">Lv.8</p>
            <p className="text-[8px] text-white/40 uppercase">AI</p>
          </div>
        </div>
      </div>
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

      {/* Top Section - News Feed & Content (right of 3D viewer) - Reduced by 30% */}
      <div className="flex gap-6 min-h-0" style={{ height: '280px', maxHeight: '280px' }}>
        {/* Left side - Space for 3D viewer (rendered separately as fixed element) */}
        <div className="w-[220px] flex-shrink-0 flex flex-col">
          {/* 3D Viewer Space - This is just a placeholder, actual viewer is fixed in LunaTemplate */}
          <div className="relative flex-1 min-h-[180px]">
            {/* Invisible boundary - 3D viewer floats above this space */}
          </div>
        </div>

        {/* Right of 3D Viewer - News & Updates Feed */}
        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
          {/* Vertical Divider */}
          <div className="w-px bg-white/10 self-stretch" />

          {/* Content Area - Live Panel (unified) */}
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
            <LivePanel 
              upcomingCards={upcomingCards}
            />
          </div>
        </div>
      </div>

      {/* Horizontal Divider - Moved up */}
      <div className="h-px bg-white/10 my-2" />

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

      {/* Bottom Section - Library Games (full width) */}
      <div className="pt-4">
        <LibraryGamesSection 
          onSelectGame={setSelectedGame}
          selectedGame={selectedGame}
          allGames={ownedGames}
        />
      </div>
    </div>
  );
}