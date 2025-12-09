import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Play, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { aiGamesList, otherSampleGames } from '../store/mockData';

export default function PinGamesContent() {
  const [selectedGenre, setSelectedGenre] = useState('All');
  
  const genres = [
    'All',
    'MMO',
    'RPG',
    'Sci-Fi',
    'Fantasy',
    'Shooter',
    'Horror',
    'Thrill',
    'Simulation',
    'Sims',
    'Later',
    'Other'
  ];

  // Combine mock data for display
  const allGames = [...aiGamesList, ...otherSampleGames];

  // Filter games based on selected genre (simple text match for demo)
  const filteredGames = selectedGenre === 'All' 
    ? allGames 
    : allGames.filter(game => {
        if (selectedGenre === 'Later') return false; // Mock logic
        return game.genre?.toLowerCase().includes(selectedGenre.toLowerCase()) || 
               game.tags?.some(tag => tag.toLowerCase().includes(selectedGenre.toLowerCase()));
      });

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 h-full flex flex-col md:flex-row gap-4 overflow-hidden">
      
      {/* Left Column: Genres */}
      <div className="w-full md:w-48 flex-shrink-0 flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-2 border-b md:border-b-0 md:border-r border-white/5 pb-2 md:pb-0">
        <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3 px-2">Genres</h3>
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`
              w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group
              ${selectedGenre === genre 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }
            `}
          >
            <span>{genre}</span>
            {selectedGenre === genre && <ChevronRight className="w-3 h-3" />}
          </button>
        ))}
      </div>

      {/* Right Column: Game List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest">My Games ({filteredGames.length})</h3>
            <div className="flex gap-2">
                <button className="p-1 hover:bg-white/10 rounded"><LayoutGrid className="w-4 h-4 text-white/40" /></button>
                <button className="p-1 bg-white/10 rounded"><List className="w-4 h-4 text-white" /></button>
            </div>
        </div>

        <div className="flex flex-col gap-2">
          {filteredGames.length > 0 ? (
            filteredGames.map((game) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group cursor-pointer"
              >
                {/* Small Box Icon (Picture) */}
                <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800 border border-white/10 group-hover:border-blue-500/50 transition-colors relative">
                    {game.cover_image ? (
                        <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Gamepad2 className="w-5 h-5 text-slate-600" />
                        </div>
                    )}
                    
                    {/* Hover Play Overlay */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                </div>

                {/* Name & Info */}
                <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-slate-200 group-hover:text-white truncate">{game.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{game.genre || 'Unknown'}</span>
                        </div>
                    </div>
                    
                    {/* Hover Action */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1.5 bg-white/10 hover:bg-blue-600 rounded-lg text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                        Play
                    </motion.button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-500 text-sm">
                No games found in this genre.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}