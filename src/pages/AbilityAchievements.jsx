import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, Trophy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '../components/auth/AuthContext';
import { allMockGames } from '../components/store/mockData';

// Main Component
export default function AbilityAchievements() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [userGames, setUserGames] = useState([]);

  useEffect(() => {
    // Get user's owned games
    const ownedGameIds = new Set(user?.purchased_items || []);
    const games = Object.values(allMockGames).filter(g => ownedGameIds.has(g.id));
    
    // For demo, also include some popular games
    const mockGamesList = [
      {
        id: 'elder_scrolls',
        title: 'Elder Scrolls Reborn',
        cover_image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&h=400&fit=crop',
        genre: 'RPG'
      },
      {
        id: 'cyberpunk_2088',
        title: 'Cyberpunk 2088',
        cover_image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=300&h=400&fit=crop',
        genre: 'Action'
      },
      {
        id: 'vanguard_ops',
        title: 'Vanguard Ops',
        cover_image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=400&fit=crop',
        genre: 'Shooter'
      }
    ];

    const combined = [...games, ...mockGamesList];
    const unique = Array.from(new Map(combined.map(g => [g.id, g])).values());
    setUserGames(unique);
  }, [user]);

  const filteredGames = userGames.filter(game =>
    game.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full bg-slate-900 text-white flex">
      {/* Left Sidebar - Games */}
      <div className="w-80 flex-shrink-0 border-r border-slate-700/50 flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search your games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700"
            />
          </div>
        </div>

        {/* Games List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredGames.map(game => (
            <motion.button
              key={game.id}
              whileHover={{ x: 5 }}
              onClick={() => {
                setSelectedGame(game);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                selectedGame?.id === game.id
                  ? 'bg-blue-600/50 border-2 border-blue-500'
                  : 'bg-slate-800/50 hover:bg-slate-700/50 border-2 border-transparent'
              }`}
            >
              <img
                src={game.cover_image}
                alt={game.title}
                className="w-16 h-20 object-cover rounded"
              />
              <div className="flex-1 text-left">
                <p className="text-white font-semibold text-sm line-clamp-2">{game.title}</p>
                <p className="text-slate-400 text-xs mt-1">{game.genre}</p>
              </div>
              {selectedGame?.id === game.id && (
                <ChevronRight className="w-5 h-5 text-blue-400" />
              )}
            </motion.button>
          ))}

          {filteredGames.length === 0 && (
            <div className="text-center py-16">
              <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No games found</p>
            </div>
          )}
        </div>
      </div>

      {/* Vertical Divider */}
      <div className="w-px bg-gradient-to-b from-transparent via-blue-500/50 to-transparent" />

      {/* Right Content Area - Completely Empty */}
      <div className="flex-1">
        {/* Completely empty - no content */}
      </div>
    </div>
  );
}