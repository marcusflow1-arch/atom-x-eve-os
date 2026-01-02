import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Play, Radio, Clock, Trophy, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VirtualizedGameList({ 
  games, 
  selectedGame, 
  streamingGameId,
  onSelect, 
  onPlay 
}) {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: games.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70, // Height per game item
    overscan: 10,
  });

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto"
      style={{ contain: 'strict', scrollbarWidth: 'none' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const game = games[virtualRow.index];
          const isSelected = selectedGame?.id === game.id;
          const isStreaming = game.id === streamingGameId;
          
          return (
            <motion.div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              onClick={() => onSelect(game)}
              className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 border ${
                isSelected 
                  ? 'border-cyan-400/30 shadow-lg' 
                  : 'hover:border-cyan-400/20 border-transparent'
              }`}
              style={isSelected ? {
                background: 'rgba(34, 211, 238, 0.12)',
                boxShadow: '0 0 12px rgba(34, 211, 238, 0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
              } : {}}
              whileHover={{ x: 4 }}
            >
              <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black/50">
                <img src={game.cover_image || game.cover} alt={game.title} className="w-full h-full object-cover" />
                {isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-500/90">
                    <Radio className="w-4 h-4 text-white animate-pulse" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-sm truncate transition-colors ${isSelected ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                  {game.title}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-white/30 text-xs capitalize">{game.genre}</p>
                  {(game.card_rewards?.length > 0 || game.ability_unlocks?.length > 0) && (
                    <div className="flex items-center gap-0.5 text-cyan-400/60">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span className="text-[9px]">{(game.card_rewards?.length || 0) + (game.ability_unlocks?.length || 0)}</span>
                    </div>
                  )}
                </div>
              </div>

              <motion.button
                onClick={(e) => { e.stopPropagation(); onPlay(game); }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:text-black"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </motion.button>

              {isSelected && (
                <motion.div 
                  layoutId="sidebarIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-r-full"
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}