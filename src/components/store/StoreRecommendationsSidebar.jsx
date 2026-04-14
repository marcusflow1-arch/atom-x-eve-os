import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Flame, TrendingUp, ShoppingCart } from 'lucide-react';

const mockRecommendationSections = [
  {
    id: 'recommended',
    title: 'Recommended',
    description: 'Games people are seeking',
    icon: Star,
    games: [
      { id: 1, title: 'Cyberpunk 2088', image: 'https://images.unsplash.com/photo-1538481143235-5d8986cad138?w=400&h=300&fit=crop', rating: 4.5 },
      { id: 2, title: 'Elden Ring', image: 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=400&h=300&fit=crop', rating: 4.8 },
      { id: 3, title: 'Baldurs Gate 3', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', rating: 4.7 },
    ]
  },
  {
    id: 'farm',
    title: 'Farm Routes',
    description: 'Best for grinding cards',
    icon: Flame,
    games: [
      { id: 4, title: 'Diablo IV', image: 'https://images.unsplash.com/photo-1538481143235-5d8986cad138?w=400&h=300&fit=crop', rating: 4.3 },
      { id: 5, title: 'Path of Exile', image: 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=400&h=300&fit=crop', rating: 4.4 },
      { id: 6, title: 'Lost Ark', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', rating: 4.2 },
    ]
  },
  {
    id: 'hot',
    title: 'Hot Trades',
    description: 'Most traded right now',
    icon: TrendingUp,
    games: [
      { id: 7, title: 'Final Fantasy XIV', image: 'https://images.unsplash.com/photo-1538481143235-5d8986cad138?w=400&h=300&fit=crop', rating: 4.6 },
      { id: 8, title: 'World of Warcraft', image: 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=400&h=300&fit=crop', rating: 4.4 },
      { id: 9, title: 'Guild Wars 2', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', rating: 4.3 },
    ]
  }
];

export default function StoreRecommendationsSidebar({ onGameSelect }) {
  const [activeSection, setActiveSection] = useState('recommended');
  const [selectedGame, setSelectedGame] = useState(null);

  const currentSection = mockRecommendationSections.find(s => s.id === activeSection);
  const sectionIcon = currentSection?.icon;
  const SectionIcon = sectionIcon;

  return (
    <div className="w-[280px] flex-shrink-0 h-full bg-white/[0.02] border-l border-white/10 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 flex-shrink-0 border-b border-white/5">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Recommendations</p>
        <div className="flex flex-col gap-2">
          {mockRecommendationSections.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setSelectedGame(null);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  isActive 
                    ? 'text-white border-b-2 border-cyan-400 bg-white/5'
                    : 'text-white/50 hover:text-white/80 border-b-2 border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-semibold">{section.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Section Title & Description */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white mb-1">{currentSection?.title}</h3>
              <p className="text-xs text-white/40">{currentSection?.description}</p>
            </div>

            {/* Small Game Cards */}
            <motion.div className="space-y-2 mb-6">
              {currentSection?.games.map(game => (
                <motion.button
                  key={game.id}
                  onClick={() => setSelectedGame(game)}
                  className={`w-full p-2 rounded-lg border transition-all text-left ${
                    selectedGame?.id === game.id
                      ? 'border-cyan-400/60 bg-cyan-400/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
                  }`}
                  whileHover={{ x: 4 }}
                >
                  <p className="text-xs font-semibold text-white truncate">{game.title}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-white/60">{game.rating}</span>
                  </div>
                </motion.button>
              ))}
            </motion.div>

            {/* Large Featured Game */}
            {selectedGame && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]"
              >
                <div className="aspect-video overflow-hidden bg-slate-800 relative group cursor-pointer"
                  onClick={() => onGameSelect(selectedGame)}
                >
                  <img 
                    src={selectedGame.image} 
                    alt={selectedGame.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onGameSelect(selectedGame);
                    }}
                    className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 rounded-lg text-cyan-300 text-xs font-semibold transition-all"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    View
                  </button>
                </div>
                <div className="p-3">
                  <h4 className="font-bold text-white text-sm mb-2">{selectedGame.title}</h4>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-white/60">{selectedGame.rating}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}