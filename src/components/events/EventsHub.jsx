import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Trophy, Users, Video, MapPin, Clock, Star, Shield, Sword } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const mockTournaments = [
  {
    id: 1,
    title: "Apex Legends: Cross-Platform Cup",
    game: "Apex Legends",
    date: "2025-12-15T18:00:00",
    status: "upcoming",
    prize: "10,000 AGP + Exclusive Skins",
    participants: 128,
    max_participants: 256,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop",
    platform: "Cross-Platform"
  },
  {
    id: 2,
    title: "Cyberpunk 2088: Speedrun Challenge",
    game: "Cyberpunk 2088",
    date: "2025-12-10T20:00:00",
    status: "live",
    prize: "5,000 AGP + 'Netrunner' Badge",
    participants: 45,
    max_participants: 100,
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=400&fit=crop",
    platform: "PC"
  },
  {
    id: 3,
    title: "Elder Scrolls: PvP Arena",
    game: "Elder Scrolls VI",
    date: "2025-12-20T16:00:00",
    status: "upcoming",
    prize: "Legendary Weapon Chest",
    participants: 200,
    max_participants: 500,
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=400&fit=crop",
    platform: "Cross-Platform"
  }
];

export default function EventsHub() {
  const [filter, setFilter] = useState('all');

  const filteredEvents = filter === 'all' 
    ? mockTournaments 
    : mockTournaments.filter(t => t.status === filter);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-white mb-2 flex justify-center items-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-500" />
            Events & Tournaments
          </h1>
          <p className="text-slate-400">Compete, Watch, and Win Exclusive Rewards</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            onClick={() => setFilter('all')}
            className="rounded-full"
          >
            All Events
          </Button>
          <Button 
            variant={filter === 'live' ? 'default' : 'outline'} 
            onClick={() => setFilter('live')}
            className="rounded-full bg-red-600 hover:bg-red-700 border-red-600"
          >
            Live Now
          </Button>
          <Button 
            variant={filter === 'upcoming' ? 'default' : 'outline'} 
            onClick={() => setFilter('upcoming')}
            className="rounded-full"
          >
            Upcoming
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <motion.div
              key={event.id}
              whileHover={{ y: -5 }}
              className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all"
            >
              <div className="relative h-48">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute top-3 right-3">
                  <Badge className={`${
                    event.status === 'live' ? 'bg-red-600 animate-pulse' : 'bg-blue-600'
                  } text-white`}>
                    {event.status === 'live' ? 'LIVE NOW' : 'UPCOMING'}
                  </Badge>
                </div>
                <div className="absolute top-3 left-3">
                   <Badge variant="secondary" className="bg-black/60 backdrop-blur-sm text-white border-white/10">
                      {event.platform}
                   </Badge>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{event.title}</h3>
                    <p className="text-slate-400 text-sm flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(event.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Participants
                    </span>
                    <span className="text-white font-mono">
                      {event.participants} / {event.max_participants}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" /> Prize Pool
                    </span>
                    <span className="text-yellow-400 font-bold">
                      {event.prize}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {event.status === 'live' ? (
                    <Button className="w-full bg-red-600 hover:bg-red-700">
                      <Video className="w-4 h-4 mr-2" /> Watch Stream
                    </Button>
                  ) : (
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Register Now
                    </Button>
                  )}
                  <Button variant="outline" size="icon">
                    <Star className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}