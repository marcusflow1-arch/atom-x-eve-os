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

const FeaturedEventCard = ({ event }) => {
  const Icon = event.icon;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative h-full rounded-2xl overflow-hidden cursor-pointer group"
      style={{
        background: 'rgba(100, 120, 140, 0.08)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={event.image} alt="" className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" />
        <div className={`absolute inset-0 bg-gradient-to-br ${event.color}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>
      
      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
            <Icon className="w-3.5 h-3.5 text-white/80" />
            <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Featured</span>
          </div>
          <div className="text-right">
            <div className="text-white font-bold text-lg">{event.date}</div>
            <div className="text-white/50 text-xs">{event.time}</div>
          </div>
        </div>
        
        <div>
          <h3 className="text-white font-bold text-xl mb-1 group-hover:text-cyan-300 transition-colors">{event.title}</h3>
          <p className="text-white/60 text-sm mb-3">{event.subtitle}</p>
          
          {/* Semantic Labels */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-300 font-mono">
              UNLOCKS: {event.featured ? 'LEGENDARY_MEMORY' : 'RARE_CARD'}
            </div>
            <div className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 font-mono">
              SYSTEM: {event.featured ? 'AI_NARRATIVE' : 'COMBAT_LOGIC'}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-auto">
            <button className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-xl py-2.5 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />
              Add to Calendar
            </button>
            <button className="w-10 h-10 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 flex items-center justify-center transition-all">
              <ChevronRight className="w-5 h-5 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SmallEventCard = ({ event }) => {
  const Icon = event.icon;
  
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      className="relative rounded-xl overflow-hidden cursor-pointer group"
      style={{
        background: 'rgba(100, 120, 140, 0.06)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
      }}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Image Thumbnail */}
        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 relative">
          <img src={event.image} alt="" className="w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-br ${event.color} opacity-60`} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white drop-shadow-lg" />
          </div>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm truncate group-hover:text-cyan-300 transition-colors">{event.title}</h4>
          <p className="text-white/40 text-xs truncate">{event.subtitle}</p>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3 h-3 text-white/30" />
            <span className="text-white/50 text-[10px]">{event.date} • {event.time}</span>
          </div>
        </div>
        
        {/* Arrow */}
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
      </div>
    </motion.div>
  );
};

export default function UpcomingEventsSection() {
  const featuredEvent = MOCK_EVENTS.find(e => e.featured);
  const otherEvents = MOCK_EVENTS.filter(e => !e.featured);
  
  return (
    <div className="w-full py-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-400/20">
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Upcoming Events</h2>
            <p className="text-white/40 text-xs">Don't miss out on what's happening</p>
          </div>
        </div>
        <button className="text-white/40 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors">
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      {/* Events Grid - Collage Layout */}
      <div 
        className="rounded-2xl p-4"
        style={{
          background: 'rgba(100, 120, 140, 0.04)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.02)'
        }}
      >
        <div className="grid grid-cols-12 gap-4">
          {/* Featured Large Card - Takes 5 columns */}
          <div className="col-span-5 row-span-2 h-[220px]">
            {featuredEvent && <FeaturedEventCard event={featuredEvent} />}
          </div>
          
          {/* Small Cards Grid - Takes 7 columns */}
          <div className="col-span-7 grid grid-cols-2 gap-3">
            {otherEvents.map((event) => (
              <SmallEventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}