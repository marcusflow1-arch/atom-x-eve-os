import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Globe, Camera, Clock, Users, Play, Star, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock streamer data (should match StreamingDiscovery)
const MOCK_STREAMERS = [
  { 
    id: 1, 
    name: 'ProGamer_Elite', 
    intro: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=450&fit=crop', 
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
    category: 'FPS', 
    hasCamera: true, 
    isNew: true, 
    streamFrequency: 'daily', 
    viewers: 12500,
    bio: 'Professional FPS player with 10+ years of competitive experience. Love high-action gameplay and engaging with chat!',
    favoriteGames: ['Counter-Strike 2', 'Valorant', 'Call of Duty', 'Apex Legends'],
    eventImages: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=200&fit=crop'
    ],
    schedule: 'Mon-Fri, 7PM-11PM EST',
    languages: ['English', 'Spanish']
  },
  { 
    id: 2, 
    name: 'CasualPlayer', 
    intro: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=450&fit=crop', 
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    category: 'RPG', 
    hasCamera: false, 
    isNew: true, 
    streamFrequency: 'weekly', 
    viewers: 3200,
    bio: 'Just here to have fun and explore amazing RPG worlds. Cozy vibes and chill gaming sessions.',
    favoriteGames: ['Elden Ring', 'Baldurs Gate 3', 'Skyrim', 'The Witcher 3'],
    eventImages: [
      'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop'
    ],
    schedule: 'Weekends, 2PM-6PM EST',
    languages: ['English']
  },
  { 
    id: 3, 
    name: 'TechMaster', 
    intro: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=450&fit=crop', 
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    category: 'Strategy', 
    hasCamera: true, 
    isNew: true, 
    streamFrequency: 'daily', 
    viewers: 8900,
    bio: 'Strategy game enthusiast and tech reviewer. Breaking down complex tactics and builds for my community.',
    favoriteGames: ['Starcraft 2', 'Age of Empires', 'Civilization VI', 'Total War'],
    eventImages: [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=300&h=200&fit=crop'
    ],
    schedule: 'Daily, 5PM-9PM EST',
    languages: ['English', 'German']
  },
  { 
    id: 4, 
    name: 'CreativeArtist', 
    intro: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&h=450&fit=crop', 
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    category: 'Creative', 
    hasCamera: true, 
    isNew: true, 
    streamFrequency: 'occasional', 
    viewers: 1500,
    bio: 'Digital artist creating game-inspired artwork. Join me for art streams and creative challenges!',
    favoriteGames: ['Art', 'Music', 'Creative Tools'],
    eventImages: [
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=300&h=200&fit=crop'
    ],
    schedule: 'Tue, Thu, Sat - 3PM-7PM EST',
    languages: ['English', 'French']
  },
  { 
    id: 5, 
    name: 'SpeedRunner99', 
    intro: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=450&fit=crop', 
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    category: 'Action', 
    hasCamera: false, 
    isNew: true, 
    streamFrequency: 'daily', 
    viewers: 15000,
    bio: 'World record holder speedrunner. Watch me break games and set new records live!',
    favoriteGames: ['Minecraft', 'Dark Souls', 'Celeste', 'Hollow Knight'],
    eventImages: [
      'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=200&fit=crop'
    ],
    schedule: 'Daily, 12PM-6PM EST',
    languages: ['English', 'Japanese']
  },
  { 
    id: 6, 
    name: 'MusicVibes', 
    intro: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=450&fit=crop', 
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    category: 'Rhythm and Music', 
    hasCamera: true, 
    isNew: true, 
    streamFrequency: 'weekly', 
    viewers: 5600,
    bio: 'Music producer and rhythm game master. Creating beats and hitting perfect combos live!',
    favoriteGames: ['Beat Saber', 'Guitar Hero', 'DJ Hero', 'Rhythm Heaven'],
    eventImages: [
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=200&fit=crop'
    ],
    schedule: 'Wed, Sat - 8PM-12AM EST',
    languages: ['English']
  },
];

export default function StreamerProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const streamerId = parseInt(searchParams.get('id') || '1');
  
  const streamer = MOCK_STREAMERS.find(s => s.id === streamerId) || MOCK_STREAMERS[0];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 px-4 py-2 bg-slate-800/60 hover:bg-slate-700/60 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden mb-8">
          <div className="relative h-80">
            <img src={streamer.intro} alt={streamer.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
            <div className="absolute top-4 right-4">
              <div className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            </div>
          </div>

          <div className="relative -mt-20 px-8 pb-8">
            <div className="flex items-end gap-6 mb-6">
              <img 
                src={streamer.avatar} 
                alt={streamer.name} 
                className="w-32 h-32 rounded-full border-4 border-slate-900 shadow-xl"
              />
              <div className="flex-1 pb-2">
                <h1 className="text-4xl font-bold text-white mb-2">{streamer.name}</h1>
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-sm">{streamer.category}</Badge>
                  {streamer.isNew && <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-sm">NEW STREAMER</Badge>}
                  <div className="flex items-center gap-2 text-white/60">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{streamer.viewers.toLocaleString()} watching</span>
                  </div>
                </div>
              </div>
              <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
                Follow
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">About</h2>
              <p className="text-white/70 leading-relaxed">{streamer.bio}</p>
            </div>

            {/* Photos & Highlights */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Photos & Highlights</h2>
              <div className="grid grid-cols-2 gap-4">
                {streamer.eventImages.map((img, idx) => (
                  <div key={idx} className="aspect-video rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all">
                    <img src={img} alt={`Event ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Games I Play */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Games I Play</h2>
              <div className="grid grid-cols-2 gap-3">
                {streamer.favoriteGames.map((game, idx) => (
                  <div key={idx} className="bg-slate-700/40 rounded-lg p-4 text-white/80 font-medium">
                    {game}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stream Info */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Stream Info</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">Schedule</h3>
                    <p className="text-white/60 text-sm">{streamer.schedule}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">Languages</h3>
                    <p className="text-white/60 text-sm">{streamer.languages.join(', ')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">Stream Frequency</h3>
                    <p className="text-white/60 text-sm capitalize">{streamer.streamFrequency} streams</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Camera className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">Camera Setup</h3>
                    <p className="text-white/60 text-sm">{streamer.hasCamera ? 'Camera enabled' : 'No camera'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Stats</h2>
              <div className="space-y-3">
                <div className="bg-slate-700/40 rounded-lg p-4">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Current Viewers</div>
                  <div className="text-white font-bold text-2xl">{streamer.viewers.toLocaleString()}</div>
                </div>
                <div className="bg-slate-700/40 rounded-lg p-4">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Stream Frequency</div>
                  <div className="text-white font-bold text-xl capitalize">{streamer.streamFrequency}</div>
                </div>
              </div>
            </div>

            {/* Hobbies & Interests */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Hobbies & Interests</h2>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-2 bg-purple-500/20 text-purple-300 text-sm rounded-full">Gaming</span>
                <span className="px-3 py-2 bg-green-500/20 text-green-300 text-sm rounded-full">Tech</span>
                <span className="px-3 py-2 bg-orange-500/20 text-orange-300 text-sm rounded-full">Music</span>
                <span className="px-3 py-2 bg-pink-500/20 text-pink-300 text-sm rounded-full">Travel</span>
                <span className="px-3 py-2 bg-blue-500/20 text-blue-300 text-sm rounded-full">Fitness</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}