import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Users, UserPlus } from 'lucide-react';

// Mock data for friends and games
const mockFriendsData = {
  all_friends: 84,
  favorite_friends: 12,
  played_together: 17,
  friends_online: 32,
  favorites_count: 5,
  friend_requests: 3
};

const mockGamesWithFriends = [
  {
    id: 1,
    title: 'The Witcher 3 : Wild hunt',
    cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
    friends_playing: 4
  },
  {
    id: 2,
    title: 'God Of War',
    cover: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=300&fit=crop',
    friends_playing: 11
  },
  {
    id: 3,
    title: 'The Elder Scrolls V Skyrim',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    friends_playing: 7
  }
];

const mockLeaderboard = [
  { rank: 1, name: 'LeonardLord12', avatar: 'https://i.pravatar.cc/150?u=leo', score: 45256 },
  { rank: 2, name: 'Johny85Devil', avatar: 'https://i.pravatar.cc/150?u=johny', score: 38567 },
  { rank: 3, name: 'DavPoney', avatar: 'https://i.pravatar.cc/150?u=dav', score: 25417 },
  { rank: 4, name: 'Acalypca888', avatar: 'https://i.pravatar.cc/150?u=aca', score: 23698 },
  { rank: 5, name: 'BobJackson', avatar: 'https://i.pravatar.cc/150?u=bob', score: 17568 },
  { rank: 6, name: 'Kermanshah19Rodar', avatar: 'https://i.pravatar.cc/150?u=ker', score: 14523 },
  { rank: 7, name: 'LadyKiller1414', avatar: 'https://i.pravatar.cc/150?u=lady', score: 8547 }
];

export default function FriendsHubOverlay({ onClose }) {
  const [activeTab, setActiveTab] = useState('friends');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex"
    >
      {/* Background with blur */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex">
        {/* Left Sidebar - Stats */}
        <div 
          className="w-64 h-full flex flex-col py-8 px-6"
          style={{
            background: 'linear-gradient(180deg, rgba(107, 142, 35, 0.3) 0%, rgba(85, 107, 47, 0.2) 100%)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* User Profile */}
          <div className="flex items-center gap-3 mb-8">
            <img 
              src="https://i.pravatar.cc/150?u=david" 
              alt="User"
              className="w-12 h-12 rounded-lg object-cover"
            />
            <span className="text-white font-semibold">David Jaims</span>
          </div>

          {/* Stats */}
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center text-white/90 hover:bg-white/5 px-2 py-2 rounded-lg cursor-pointer transition-colors">
              <span>All friends</span>
              <span className="text-2xl font-bold">{mockFriendsData.all_friends}</span>
            </div>
            <div className="flex justify-between items-center text-white/90 hover:bg-white/5 px-2 py-2 rounded-lg cursor-pointer transition-colors">
              <span>Favorite friends</span>
              <span className="text-2xl font-bold">{mockFriendsData.favorite_friends}</span>
            </div>
            <div className="flex justify-between items-center text-white/90 hover:bg-white/5 px-2 py-2 rounded-lg cursor-pointer transition-colors">
              <span>Played together</span>
              <span className="text-2xl font-bold">{mockFriendsData.played_together}</span>
            </div>
            <div className="flex justify-between items-center text-white/90 hover:bg-white/5 px-2 py-2 rounded-lg cursor-pointer transition-colors">
              <span>friends online</span>
              <span className="text-2xl font-bold">{mockFriendsData.friends_online}</span>
            </div>
            
            {/* Favorites */}
            <div className="flex items-center gap-2 text-white/70 mt-4 px-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>{mockFriendsData.favorites_count}</span>
            </div>

            {/* Friend Requests */}
            <div className="flex items-center gap-2 text-white/70 px-2 mt-4 cursor-pointer hover:text-white transition-colors">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              <span>Friends request</span>
              {mockFriendsData.friend_requests > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {mockFriendsData.friend_requests}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center - Games with Friends */}
        <div className="flex-1 h-full flex flex-col py-8 px-8">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-8 mb-8">
            <button 
              onClick={() => setActiveTab('home')}
              className={`text-lg font-medium transition-colors ${activeTab === 'home' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setActiveTab('friends')}
              className={`text-lg font-medium transition-colors ${activeTab === 'friends' ? 'text-white border-b-2 border-white pb-1' : 'text-white/50 hover:text-white/80'}`}
            >
              Friends
            </button>
            <button 
              onClick={() => setActiveTab('trophies')}
              className={`text-lg font-medium transition-colors ${activeTab === 'trophies' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              Trophies
            </button>
            <button 
              onClick={() => setActiveTab('store')}
              className={`text-lg font-medium transition-colors ${activeTab === 'store' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              Store
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="ml-auto w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Games List */}
          <div className="flex-1 space-y-4 overflow-y-auto">
            {mockGamesWithFriends.map((game) => (
              <div 
                key={game.id}
                className="flex gap-4 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
              >
                {/* Game Cover */}
                <div className="w-40 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={game.cover} 
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Game Info */}
                <div 
                  className="flex-1 py-2 px-4 rounded-lg"
                  style={{
                    background: 'linear-gradient(90deg, rgba(128, 128, 0, 0.4) 0%, rgba(85, 107, 47, 0.3) 100%)'
                  }}
                >
                  <h3 className="text-white font-bold text-lg mb-2">{game.title}</h3>
                  <div className="flex items-center gap-2 text-green-400">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-sm">{game.friends_playing} friends playing now</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar - Leaderboard */}
        <div 
          className="w-72 h-full py-8 px-6"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <h2 className="text-white font-bold text-lg mb-6 tracking-wide">LEADERBOARD</h2>

          <div className="space-y-3">
            {mockLeaderboard.map((player) => (
              <div 
                key={player.rank}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
              >
                {/* Avatar */}
                <img 
                  src={player.avatar} 
                  alt={player.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-sm">{player.rank} -</span>
                    <span className="text-white text-sm font-medium truncate">{player.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-cyan-400 text-xs">
                    <div className="w-3 h-3 rounded-full bg-cyan-400/30 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    </div>
                    <span>{player.score.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}