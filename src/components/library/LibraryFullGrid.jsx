import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Library, Search, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function LibraryFullGrid({ games, onSelectGame, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredId, setHoveredId] = useState(null);

  const filtered = searchTerm
    ? games.filter(g => g.title?.toLowerCase().includes(searchTerm.toLowerCase()) || g.genre?.toLowerCase().includes(searchTerm.toLowerCase()))
    : games;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[52] flex flex-col overflow-hidden"
      style={{
        background: 'rgba(10, 14, 20, 0.75)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Library className="w-6 h-6 text-cyan-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Full Library</h2>
            <p className="text-sm text-white/40">{games.length} titles</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search library..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-10" style={{ scrollbarWidth: 'none' }}>
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4">
          {filtered.map((game, i) => (
            <motion.div
              key={game.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onHoverStart={() => setHoveredId(game.id)}
              onHoverEnd={() => setHoveredId(null)}
              onClick={() => onSelectGame(game)}
              className={`group relative aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border cursor-pointer transition-all duration-300 ${
                hoveredId === game.id
                  ? 'border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-[1.03]'
                  : 'border-white/10 hover:border-cyan-400/30'
              }`}
            >
              <img
                src={game.cover_image || game.cover || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'}
                alt={game.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Hover play icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <h4 className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">{game.title}</h4>
                <p className="text-white/50 text-xs capitalize">{game.genre}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}