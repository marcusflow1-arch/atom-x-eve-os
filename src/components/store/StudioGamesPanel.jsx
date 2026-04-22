import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Star, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudioGamesPanel({ studio, games, onBack }) {
  const navigate = useNavigate();

  // Mock studio games data
  const studioGames = [
    {
      id: 'game-1',
      title: 'Neon Vortex',
      image: 'https://via.placeholder.com/300x400?text=Neon+Vortex',
      price: 29.99,
      rating: 4.8,
    },
    {
      id: 'game-2',
      title: 'Cyber Nexus',
      image: 'https://via.placeholder.com/300x400?text=Cyber+Nexus',
      price: 34.99,
      rating: 4.6,
    },
    {
      id: 'game-3',
      title: 'Digital Dreams',
      image: 'https://via.placeholder.com/300x400?text=Digital+Dreams',
      price: 24.99,
      rating: 4.5,
    },
    {
      id: 'game-4',
      title: 'Echo Protocol',
      image: 'https://via.placeholder.com/300x400?text=Echo+Protocol',
      price: 39.99,
      rating: 4.9,
    },
  ];

  const handleGameClick = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-0 right-96 bottom-0 w-80 z-[51] flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 border-l border-white/10"
      style={{
        boxShadow: '-4px 0 30px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-wider">Back</span>
        </button>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">{studio.name}</h2>
          <p className="text-xs text-white/50">{studio.description}</p>
        </div>
      </div>

      {/* Studio Stats */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-white/5">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-cyan-400">{studio.gamesCount}</p>
            <p className="text-xs text-white/50">Games Published</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-cyan-400">4.7</p>
            <p className="text-xs text-white/50">Avg Rating</p>
          </div>
        </div>
      </div>

      {/* Games List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-3">
          {studioGames.map((game, idx) => (
            <motion.button
              key={game.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleGameClick(game.id)}
              whileHover={{ scale: 1.02 }}
              className="w-full flex gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group text-left overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="w-12 h-16 rounded-lg flex-shrink-0 overflow-hidden bg-slate-800">
                <img
                  src={game.image}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Game Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate">{game.title}</h3>
                <div className="flex items-center gap-2 mt-1 mb-2">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-xs text-white/60">{game.rating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400">${game.price}</span>
                  <ShoppingBag className="w-3 h-3 text-white/40 group-hover:text-white/80 transition-colors" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}