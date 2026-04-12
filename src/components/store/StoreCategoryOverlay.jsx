import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';

const CATEGORIES = [
  'All', 'Action', 'RPG', 'Strategy', 'Shooter',
  'Sports', 'Racing', 'Puzzle', 'Adventure', 'Horror'
];

const MOCK_REVIEWS = [
  { user: 'Alex', rating: 5, text: 'Absolutely incredible game! Worth every penny.' },
  { user: 'Jordan', rating: 4, text: 'Great gameplay and amazing graphics. Highly recommend!' },
  { user: 'Casey', rating: 5, text: 'Best purchase I\'ve made this year.' },
];

function ReviewStars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}
        />
      ))}
    </div>
  );
}

export default function StoreCategoryOverlay({ games = [], selectedGame, onClose, onSelectGame }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [hoveredGameId, setHoveredGameId] = useState(null);

  const filteredGames = selectedCategory === 'All'
    ? games
    : games.filter(g => g.genre === selectedCategory.toLowerCase());

  const avgRating = selectedGame
    ? MOCK_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / MOCK_REVIEWS.length
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[45] flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-11/12 h-5/6 rounded-2xl overflow-hidden flex flex-col border border-white/10"
        style={{
          background: 'linear-gradient(135deg, rgba(10,14,20,0.95) 0%, rgba(15,20,30,0.95) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white tracking-wider">Browse by Genre</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left 70%: Game Grid with Category Filter */}
          <div className="w-7/10 flex flex-col overflow-hidden">
            {/* Category Filter */}
            <div className="px-6 py-3 border-b border-white/10 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="flex gap-2 flex-nowrap">
                {CATEGORIES.map(cat => (
                  <motion.button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                      selectedCategory === cat
                        ? 'bg-white/20 border-white/40 text-white'
                        : 'bg-transparent border-white/10 text-white/60 hover:text-white hover:border-white/20'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {cat}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Game Grid */}
            <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'none' }}>
              <div className="grid grid-cols-4 gap-4">
                {filteredGames.map((game) => (
                  <motion.button
                    key={game.id}
                    onClick={() => onSelectGame(game)}
                    onMouseEnter={() => setHoveredGameId(game.id)}
                    onMouseLeave={() => setHoveredGameId(null)}
                    className="group relative flex flex-col gap-2 cursor-pointer overflow-hidden rounded-lg"
                    whileHover={{ y: -4 }}
                  >
                    <div className="relative rounded-lg overflow-hidden border border-white/10 group-hover:border-cyan-400/50 transition-all" style={{ height: '200px' }}>
                      <img
                        src={game.cover_image || game.image}
                        alt={game.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <AnimatePresence>
                        {hoveredGameId === game.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                          >
                            <div className="text-green-400 font-black text-lg">${game.price ?? '0'}</div>
                            <button className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold rounded-full transition-all">
                              View Details
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <h3 className="text-white/80 text-xs font-semibold line-clamp-2 group-hover:text-white transition-colors">
                      {game.title}
                    </h3>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Right 30%: Details Panel */}
          {selectedGame ? (
            <div className="overflow-y-auto p-4" style={{ scrollbarWidth: 'none', width: '30%', background: 'rgba(10,14,20,0.5)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex flex-col gap-3 h-full">
                {/* Video/Trailer at Top */}
                {(selectedGame.trailer_url || (selectedGame.video_urls && selectedGame.video_urls[0])) && (
                  <div>
                    <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-2">Trailer</p>
                    <div className="rounded-lg overflow-hidden border border-white/10" style={{ aspectRatio: '16/9' }}>
                      <iframe src={(selectedGame.trailer_url || selectedGame.video_urls[0]).replace('watch?v=', 'embed/')} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title="Trailer" />
                    </div>
                  </div>
                )}

                {/* Screenshots */}
                {selectedGame.screenshots && selectedGame.screenshots.length > 0 && (
                  <div>
                    <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-2">Screenshots</p>
                    <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                      {selectedGame.screenshots.slice(0, 4).map((url, i) => (
                        <img key={i} src={url} alt={`Screenshot ${i + 1}`} className="flex-shrink-0 rounded-lg border border-white/10 object-cover" style={{ width: '100px', height: '60px' }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Rating & Recommendation */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <ReviewStars rating={avgRating} />
                    <span className="text-yellow-400 text-xs font-bold">{avgRating}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-green-500/30 flex items-center justify-center text-green-400 text-[9px] font-bold flex-shrink-0">92%</div>
                    <p className="text-white/70 text-[9px]">Players recommend</p>
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold mb-2">Reviews</p>
                  <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    {MOCK_REVIEWS.slice(0, 2).map((r, i) => (
                      <div key={i} className="py-2 border-b border-white/6">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold">{r.user[0]}</div>
                          <span className="text-white/70 text-[10px] font-bold line-clamp-1">{r.user}</span>
                          <ReviewStars rating={r.rating} />
                        </div>
                        <p className="text-white/50 text-[9px] leading-tight pl-6 line-clamp-2">{r.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center" style={{ width: '30%', background: 'rgba(10,14,20,0.5)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-white/20 text-sm">Select a game</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export { CATEGORIES };