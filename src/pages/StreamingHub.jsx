import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../components/auth/AuthContext';
import DiscoverySidebar from '../components/streaming/DiscoverySidebar';
import IntroVideoHero from '../components/streaming/IntroVideoHero';
import StreamerFlow from '../components/streaming/StreamerFlow';

// Enhanced Mock Data to support the new schema
const MOCK_STREAMERS = [
  {
    id: '1',
    username: 'NeonRider',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
    intro_video_url: 'https://cdn.coverr.co/videos/coverr-person-typing-on-a-computer-keyboard-4643/1080p.mp4',
    bio_short: "I explore the darkest corners of cyberpunk lore so you don't have to.",
    context_disclaimer: "I roleplay a Netrunner on stream, but I'm just a history nerd IRL.",
    stream_focus: 'Lore Focused',
    tags: ['RPG', 'Story', 'Cyberpunk'],
    followers: 12500,
    games_played: ['Cyberpunk 2088', 'Deus Ex', 'Shadowrun'],
    is_live: true,
    category: 'rpg'
  },
  {
    id: '2',
    username: 'CardWhiz',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    intro_video_url: 'https://cdn.coverr.co/videos/coverr-playing-cards-on-a-table-5388/1080p.mp4',
    bio_short: "Hunting the rarest 1% drop rate cards in every MMO.",
    context_disclaimer: "My reaction to rare drops is 100% genuine panic.",
    stream_focus: 'Card Collector',
    tags: ['MMO', 'Economy', 'Gacha'],
    followers: 8900,
    games_played: ['Elder Scrolls Online', 'Destiny 2', 'Genshin Impact'],
    is_live: false,
    category: 'card'
  },
  {
    id: '3',
    username: 'RetroDave',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    intro_video_url: 'https://cdn.coverr.co/videos/coverr-arcade-game-machine-4286/1080p.mp4',
    bio_short: "Preserving gaming history one pixel at a time.",
    context_disclaimer: "",
    stream_focus: 'Indie Discovery',
    tags: ['Retro', 'Classics', 'Emulator'],
    followers: 4500,
    games_played: ['Chrono Trigger', 'Earthbound', 'Final Fantasy VI'],
    is_live: true,
    category: 'retro'
  },
  {
    id: '4',
    username: 'TacticalAce',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop',
    intro_video_url: 'https://cdn.coverr.co/videos/coverr-person-playing-a-video-game-with-a-controller-5396/1080p.mp4',
    bio_short: "Ex-pro coach teaching you how to stop panicking in 1v1s.",
    context_disclaimer: "I yell calls in game, but I'm super chill in chat.",
    stream_focus: 'Competitive',
    tags: ['FPS', 'Ranked', 'Coaching'],
    followers: 22000,
    games_played: ['Valorant', 'CS2', 'Overwatch 2'],
    is_live: true,
    category: 'fps'
  },
  {
    id: '5',
    username: 'CozyBuilder',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop',
    intro_video_url: 'https://cdn.coverr.co/videos/coverr-person-drawing-on-a-digital-tablet-5392/1080p.mp4',
    bio_short: "Building dream homes and relaxing vibes. Tea required.",
    context_disclaimer: "",
    stream_focus: 'Casual',
    tags: ['Creative', 'Building', 'Chill'],
    followers: 6700,
    games_played: ['Minecraft', 'Sims 4', 'Stardew Valley'],
    is_live: false,
    category: 'indie'
  }
];

export default function StreamingHub() {
  const { user } = useAuth();
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [activeStreamer, setActiveStreamer] = useState(MOCK_STREAMERS[0]);
  const [filters, setFilters] = useState({
    cameraOn: false,
    newStreamers: false
  });

  // Filter streamers based on selection
  const filteredStreamers = MOCK_STREAMERS.filter(s => {
    if (selectedGenre !== 'all' && s.category !== selectedGenre) return false;
    // Add logic for other filters here if mock data supported it
    return true;
  });

  const handleGenreSelect = (genreId) => {
    setSelectedGenre(genreId);
    // Auto-select first streamer of new genre for the hero
    const firstMatch = MOCK_STREAMERS.find(s => genreId === 'all' || s.category === genreId);
    if (firstMatch) setActiveStreamer(firstMatch);
  };

  const handleFilterUpdate = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-screen w-full bg-[#0f1419] text-white overflow-hidden flex relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full opacity-50" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 blur-[120px] rounded-full opacity-50" />
      </div>

      {/* 1. Left Zone: Discovery & Categories (20% width) */}
      <div className="w-80 h-full p-6 z-10 flex-shrink-0 border-r border-white/5 bg-slate-900/30 backdrop-blur-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 mb-1">
            ATOM<span className="text-cyan-400">×</span>STREAM
          </h1>
          <p className="text-xs text-white/40 font-medium">Connect. Discover. Belong.</p>
        </div>
        <DiscoverySidebar 
          selectedGenre={selectedGenre} 
          onSelectGenre={handleGenreSelect}
          filters={filters}
          onUpdateFilters={handleFilterUpdate}
        />
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 h-full flex flex-col z-10 overflow-y-auto custom-scrollbar relative">
        
        {/* Right Primary Zone: Introduction Hero (Top 60%) */}
        <div className="w-full h-[65vh] p-6 pb-0">
          <IntroVideoHero streamer={activeStreamer} isActive={true} />
        </div>

        {/* Lower Flow Section: Games & Profiles (Bottom 40%) */}
        <div className="w-full p-8 pb-20">
          <StreamerFlow streamers={filteredStreamers} />
          
          {/* Example of "Games Played" specific to the active hero (optional expansion) */}
          <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-6">
              Games {activeStreamer.username} Plays
            </h3>
            <div className="flex gap-4">
              {activeStreamer.games_played.map((game, i) => (
                <div key={i} className="px-6 py-4 bg-slate-900/50 rounded-2xl border border-white/10 text-white/80 hover:bg-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer">
                  {game}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}