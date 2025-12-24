import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Gamepad2, Download, Ticket, Users, Star, Clock, ChevronRight } from 'lucide-react';

const MOCK_EVENTS = [
  {
    id: 1,
    type: 'game_update',
    title: 'Cyberpunk 2088 Patch 2.1',
    subtitle: 'New story expansion',
    date: 'Dec 26',
    time: '10:00 AM',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400',
    color: 'from-cyan-500/20 to-blue-500/20',
    icon: Download,
    featured: true
  },
  {
    id: 2,
    type: 'live_event',
    title: 'Winter Gaming Festival',
    subtitle: 'Live tournaments & prizes',
    date: 'Dec 28',
    time: '6:00 PM',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    color: 'from-purple-500/20 to-pink-500/20',
    icon: Ticket
  },
  {
    id: 3,
    type: 'developer',
    title: 'Dev Stream: Behind the Scenes',
    subtitle: 'Neon Legends Studio',
    date: 'Dec 29',
    time: '3:00 PM',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400',
    color: 'from-orange-500/20 to-amber-500/20',
    icon: Users
  },
  {
    id: 4,
    type: 'seasonal',
    title: 'New Year Challenge',
    subtitle: 'Limited rewards available',
    date: 'Jan 1',
    time: '12:00 AM',
    image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400',
    color: 'from-emerald-500/20 to-teal-500/20',
    icon: Star
  },
  {
    id: 5,
    type: 'community',
    title: 'Clan Wars Season 4',
    subtitle: 'Registration opens',
    date: 'Jan 3',
    time: '9:00 AM',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400',
    color: 'from-red-500/20 to-rose-500/20',
    icon: Gamepad2
  }
];

const FeaturedEventCard = ({ event, compact = false }) => {
  const Icon = event.icon;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="relative h-full rounded-xl overflow-hidden cursor-pointer group"
      style={{
        background: 'rgba(100, 120, 140, 0.08)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={event.image} alt="" className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" />
        <div className={`absolute inset-0 bg-gradient-to-br ${event.color}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>
      
      {/* Content */}
      <div className={`relative h-full flex flex-col justify-between ${compact ? 'p-2.5' : 'p-3'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
            <Icon className="w-2.5 h-2.5 text-white/80" />
            <span className="text-[8px] font-semibold text-white/80 uppercase tracking-wider">Featured</span>
          </div>
          <div className="text-right">
            <div className="text-white font-bold text-xs">{event.date}</div>
            <div className="text-white/50 text-[9px]">{event.time}</div>
          </div>
        </div>
        
        <div>
          <h3 className={`text-white font-bold ${compact ? 'text-xs' : 'text-sm'} mb-0.5 group-hover:text-cyan-300 transition-colors truncate`}>{event.title}</h3>
          <p className="text-white/60 text-[10px] truncate">{event.subtitle}</p>
          
          <div className="flex items-center gap-1.5 mt-2">
            <button className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-lg py-1.5 text-white text-[9px] font-semibold transition-all flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" />
              Add
            </button>
            <button className="w-7 h-7 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 flex items-center justify-center transition-all">
              <ChevronRight className="w-3 h-3 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SmallEventCard = ({ event, compact = false }) => {
  const Icon = event.icon;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -1 }}
      className="relative rounded-lg overflow-hidden cursor-pointer group"
      style={{
        background: 'rgba(100, 120, 140, 0.06)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
      }}
    >
      <div className={`flex items-center gap-2 ${compact ? 'p-1.5' : 'p-2'}`}>
        {/* Image Thumbnail */}
        <div className={`${compact ? 'w-10 h-10' : 'w-11 h-11'} rounded-md overflow-hidden flex-shrink-0 relative`}>
          <img src={event.image} alt="" className="w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-br ${event.color} opacity-60`} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-white drop-shadow-lg`} />
          </div>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-white font-semibold ${compact ? 'text-[10px]' : 'text-xs'} truncate group-hover:text-cyan-300 transition-colors`}>{event.title}</h4>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="w-2.5 h-2.5 text-white/30" />
            <span className="text-white/50 text-[8px]">{event.date}</span>
          </div>
        </div>
        
        {/* Arrow */}
        <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
      </div>
    </motion.div>
  );
};

export default function UpcomingEventsSection({ compact = false }) {
  const featuredEvent = MOCK_EVENTS.find(e => e.featured);
  const otherEvents = MOCK_EVENTS.filter(e => !e.featured);
  
  // Compact mode for sidebar placement (next to 3D viewer)
  if (compact) {
    return (
      <div className="h-full flex flex-col">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <h3 className="text-white font-bold text-xs">Events</h3>
          </div>
          <button className="text-white/40 hover:text-white text-[9px] font-medium flex items-center gap-0.5 transition-colors">
            All <ChevronRight className="w-2.5 h-2.5" />
          </button>
        </div>
        
        {/* Compact Events Layout - Vertical stack */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {/* Featured Event - Smaller */}
          {featuredEvent && (
            <div className="h-[100px] flex-shrink-0">
              <FeaturedEventCard event={featuredEvent} compact />
            </div>
          )}
          
          {/* Other Events - Compact list */}
          <div className="flex flex-col gap-1.5">
            {otherEvents.slice(0, 3).map((event) => (
              <SmallEventCard key={event.id} event={event} compact />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Full size mode (for below cards section)
  return (
    <div className="w-full py-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-400/20">
            <Calendar className="w-3 h-3 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">Upcoming Events</h2>
            <p className="text-white/40 text-[10px]">Don't miss out</p>
          </div>
        </div>
        <button className="text-white/40 hover:text-white text-[10px] font-medium flex items-center gap-1 transition-colors">
          View All <ChevronRight className="w-2.5 h-2.5" />
        </button>
      </div>
      
      {/* Events Grid - Collage Layout */}
      <div 
        className="rounded-xl p-3"
        style={{
          background: 'rgba(100, 120, 140, 0.04)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.02)'
        }}
      >
        <div className="grid grid-cols-12 gap-3">
          {/* Featured Large Card - Takes 5 columns */}
          <div className="col-span-5 row-span-2 h-[160px]">
            {featuredEvent && <FeaturedEventCard event={featuredEvent} />}
          </div>
          
          {/* Small Cards Grid - Takes 7 columns */}
          <div className="col-span-7 grid grid-cols-2 gap-2">
            {otherEvents.map((event) => (
              <SmallEventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}