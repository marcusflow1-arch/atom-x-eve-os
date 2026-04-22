import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Star } from 'lucide-react';
import StudioGamesPanel from './StudioGamesPanel';

const MOCK_STUDIOS = [
  {
    id: 'studio-1',
    name: 'Neon Studios',
    logo: 'https://via.placeholder.com/40?text=NS',
    description: 'Crafting immersive cyberpunk experiences',
    gamesCount: 8,
    gameIds: ['game-1', 'game-2', 'game-3', 'game-4'],
  },
  {
    id: 'studio-2',
    name: 'Phantom Games',
    logo: 'https://via.placeholder.com/40?text=PG',
    description: 'Masters of action-packed adventures',
    gamesCount: 12,
    gameIds: ['game-5', 'game-6', 'game-7'],
  },
  {
    id: 'studio-3',
    name: 'Apex Digital',
    logo: 'https://via.placeholder.com/40?text=AD',
    description: 'Revolutionary indie game developers',
    gamesCount: 5,
    gameIds: ['game-8', 'game-9'],
  },
  {
    id: 'studio-4',
    name: 'Ethereal Studios',
    logo: 'https://via.placeholder.com/40?text=ES',
    description: 'Pioneering next-gen RPG experiences',
    gamesCount: 15,
    gameIds: ['game-10', 'game-11', 'game-12', 'game-13'],
  },
  {
    id: 'studio-5',
    name: 'Quantum Games',
    logo: 'https://via.placeholder.com/40?text=QG',
    description: 'Sci-fi simulation specialists',
    gamesCount: 6,
    gameIds: ['game-14', 'game-15'],
  },
];

export default function StudioDrawer({ isOpen, onClose, games }) {
  const [selectedStudio, setSelectedStudio] = useState(null);

  const handleStudioClick = (studio) => {
    setSelectedStudio(studio);
  };

  const handleBackToStudios = () => {
    setSelectedStudio(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45]"
          />

          {/* Main Studio Drawer - from right */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-96 z-[50] flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 border-l border-white/10"
            style={{
              boxShadow: '-4px 0 30px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header */}
            <div className="flex-shrink-0 p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white">Gaming Studios</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-xs text-white/50">Explore all game developers</p>
            </div>

            {/* Studio List - Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-4 space-y-2">
                {MOCK_STUDIOS.map((studio) => (
                  <motion.button
                    key={studio.id}
                    onClick={() => handleStudioClick(studio)}
                    whileHover={{ x: 8 }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group text-left"
                  >
                    {/* Logo */}
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-xs">
                      {studio.logo}
                    </div>

                    {/* Studio Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{studio.name}</h3>
                      <p className="text-xs text-white/50 truncate">{studio.gamesCount} games</p>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white/80 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Studio Games Panel - Secondary drawer */}
          <AnimatePresence>
            {selectedStudio && (
              <StudioGamesPanel
                studio={selectedStudio}
                games={games}
                onBack={handleBackToStudios}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}