import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Gamepad2, Newspaper, Calendar, Wrench, Zap, ChevronRight, Star, Clock } from 'lucide-react';

const MOCK_FRIENDS = [
  { id: 1, name: 'ShadowKnight', status: 'online', avatar: '🎮', game: 'Cyberpunk 2088' },
  { id: 2, name: 'DragonSlayer', status: 'online', avatar: '⚔️', game: 'Fantasy Quest' },
  { id: 3, name: 'NebulaGamer', status: 'away', avatar: '🌟' },
  { id: 4, name: 'PhantomAce', status: 'offline', avatar: '👻' },
  { id: 5, name: 'VortexPro', status: 'online', avatar: '🌀', game: 'Shooter Arena' }
];

const MOCK_GAMES = [
  { id: 1, title: 'Cyberpunk 2088', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', status: 'Playing', playtime: '42h' },
  { id: 2, title: 'Neon Legends', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', status: 'Installed', playtime: '28h' },
  { id: 3, title: 'Shadow Realm', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', status: 'Installed', playtime: '15h' },
  { id: 4, title: 'Stellar Odyssey', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400', status: 'Update Available', playtime: '67h' },
  { id: 5, title: 'Battle Frontier', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400', status: 'Installed', playtime: '91h' }
];

const AI_NEWS_ITEMS = [
  {
    id: 1,
    type: 'game',
    icon: Gamepad2,
    title: 'New Game Release: Quantum Realms',
    description: 'Experience the next generation of AI-driven gameplay. Launch date: Jan 15, 2025',
    date: '2 hours ago',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 2,
    type: 'event',
    icon: Calendar,
    title: 'Community Tournament - Winter Championship',
    description: 'Join thousands of players in our biggest competitive event. Registration opens Dec 20',
    date: '5 hours ago',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 3,
    type: 'dev',
    icon: Wrench,
    title: 'Dev Meeting: AI Companion Updates',
    description: 'Live Q&A with the development team about upcoming AI features. Dec 18, 3PM EST',
    date: '1 day ago',
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 4,
    type: 'update',
    icon: Zap,
    title: 'OS Update v2.4 - Enhanced Performance',
    description: 'New AI optimization algorithms, improved voice recognition, and faster load times',
    date: '2 days ago',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 5,
    type: 'game',
    icon: Gamepad2,
    title: 'Early Access: Void Chronicles',
    description: 'Be among the first to explore this AI-generated roguelike adventure',
    date: '3 days ago',
    color: 'from-indigo-500 to-blue-500'
  }
];

export default function AIInformedView() {
  const [selectedGame, setSelectedGame] = useState(null);

  return (
    <div className="h-full w-full flex gap-6">
      {/* Left Side - Friends + Games */}
      <div className="w-1/3 flex flex-col gap-6">
        {/* Friends List */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Friends</h2>
            <span className="ml-auto text-xs text-white/40">{MOCK_FRIENDS.filter(f => f.status === 'online').length} online</span>
          </div>
          
          <div className="space-y-2">
            {MOCK_FRIENDS.map((friend) => (
              <div 
                key={friend.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xl">
                    {friend.avatar}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                    friend.status === 'online' ? 'bg-green-500' : 
                    friend.status === 'away' ? 'bg-yellow-500' : 'bg-slate-600'
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{friend.name}</p>
                  {friend.game && (
                    <p className="text-xs text-white/40 truncate">{friend.game}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Games List */}
        <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Gamepad2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Your Games</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {MOCK_GAMES.map((game) => (
              <motion.div
                key={game.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedGame(game)}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-white/5 hover:border-cyan-400/30"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{game.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      game.status === 'Playing' ? 'bg-green-500/20 text-green-400' :
                      game.status === 'Update Available' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {game.status}
                    </span>
                    <span className="text-xs text-white/40">{game.playtime}</span>
                  </div>
                </div>
                
                <ChevronRight className="w-4 h-4 text-white/30" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - AI News Feed */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Newspaper className="w-5 h-5 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">AI News & Updates</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {AI_NEWS_ITEMS.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-cyan-400/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {item.title}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-white/60 mb-3 leading-relaxed">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Clock className="w-3 h-3" />
                      {item.date}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}