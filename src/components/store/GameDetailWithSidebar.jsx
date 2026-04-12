import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function GameDetailWithSidebar({ 
  game, 
  games = [], 
  onGameSelect, 
  onClose,
  detailComponent: DetailComponent 
}) {
  const [selectedGameId, setSelectedGameId] = useState(game?.id);

  const currentGame = games.find(g => g.id === selectedGameId) || game;

  const handleGameSelect = (selectedGame) => {
    setSelectedGameId(selectedGame.id);
    onGameSelect?.(selectedGame);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full h-full max-w-6xl bg-slate-900 rounded-2xl overflow-hidden flex"
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 15% Left Sidebar */}
        <div 
          className="w-[15%] border-r border-white/10 flex flex-col"
          style={{ background: 'rgba(10,15,23,0.5)' }}
        >
          <div className="p-4 border-b border-white/10">
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest">Games</h3>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-3">
              {games.map(g => (
                <button
                  key={g.id}
                  onClick={() => handleGameSelect(g)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all text-xs font-medium truncate ${
                    selectedGameId === g.id
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/40'
                      : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                  title={g.title}
                >
                  {g.title}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* 85% Right Content */}
        <div className="flex-1 overflow-auto">
          {DetailComponent && currentGame ? (
            <DetailComponent game={currentGame} onClose={onClose} />
          ) : (
            <div className="flex items-center justify-center h-full text-white/50">
              Select a game to view details
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}