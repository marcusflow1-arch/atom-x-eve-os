import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Download, Settings, Heart, Share2, Trash2, Info, Star, BookOpen } from 'lucide-react';

const STATUS_DOT = {
  Playing: 'bg-green-400',
  'In Progress': 'bg-amber-400',
  Installed: 'bg-blue-400',
  New: 'bg-emerald-400',
};

function ContextMenu({ game, pos, onClose, onPlay }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items = [
    { icon: Play, label: 'Play Now', action: () => { onPlay(game); onClose(); }, highlight: true },
    { icon: Info, label: 'View Details', action: () => { onPlay(game); onClose(); } },
    { icon: Heart, label: 'Add to Wishlist', action: onClose },
    { icon: Share2, label: 'Share', action: onClose },
    { icon: Settings, label: 'Settings', action: onClose },
    { divider: true },
    { icon: Trash2, label: 'Uninstall', action: onClose, danger: true },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -6 }}
      transition={{ duration: 0.12 }}
      className="fixed z-[9999] w-44 rounded-xl overflow-hidden shadow-2xl"
      style={{
        top: pos.y,
        left: pos.x,
        background: 'rgba(12, 18, 30, 0.97)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className="my-1 border-t border-white/10" />
        ) : (
          <button
            key={i}
            onClick={item.action}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left ${
              item.highlight
                ? 'text-cyan-300 hover:bg-cyan-500/15 font-semibold'
                : item.danger
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-white/70 hover:bg-white/[0.07] hover:text-white'
            }`}
          >
            <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
            {item.label}
          </button>
        )
      )}
    </motion.div>
  );
}

export default function GameList({ games, selectedGame, onSelectGame, onToggleLibrary, libraryActive }) {
  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = (e, game) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ game, pos: { x: e.clientX, y: e.clientY } });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        {onToggleLibrary ? (
          <button
            onClick={onToggleLibrary}
            title="Library"
            className={`flex items-center gap-1.5 px-3 h-7 rounded-md text-[10px] font-semibold uppercase tracking-widest transition-all ${libraryActive ? 'text-cyan-300 bg-cyan-500/10' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Library
          </button>
        ) : (
          <span className="text-white/70 text-xs font-bold uppercase tracking-widest">Library</span>
        )}
        <span className="text-white/30 text-[10px]">{games.length} games</span>
      </div>

      {/* Game Rows */}
      <div className="flex-1 overflow-y-auto overscroll-contain py-1" style={{ scrollbarWidth: 'none' }}>
        {games.map((game, i) => {
          const isSelected = selectedGame?.id === game.id;
          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onSelectGame(isSelected ? null : game)}
              onContextMenu={(e) => handleContextMenu(e, game)}
              className={`relative flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xl cursor-pointer transition-all group ${
                isSelected
                  ? 'bg-white/[0.09] border border-white/10'
                  : 'hover:bg-white/[0.05] border border-transparent'
              }`}
            >
              {/* Selected accent */}
              {isSelected && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-cyan-400" />
              )}

              {/* Thumbnail */}
              <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                <img src={game.thumb} alt={game.title} className="w-full h-full object-cover" />
              </div>

              {/* Name + genre */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate leading-tight ${isSelected ? 'text-white' : 'text-white/75'}`}>
                  {game.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[game.status] || 'bg-gray-500'}`} />
                  <span className="text-white/30 text-[9px] truncate">{game.genre}</span>
                </div>
              </div>

              {/* Play button — shows on hover/selected */}
              <button
                onClick={(e) => { e.stopPropagation(); onSelectGame(game); }}
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected
                    ? 'bg-cyan-500/30 border border-cyan-400/50 opacity-100'
                    : 'bg-white/10 border border-white/10 opacity-0 group-hover:opacity-100'
                }`}
              >
                <Play className="w-2.5 h-2.5 text-white fill-white ml-0.5" />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Right-click hint */}
      <div className="px-4 py-2 border-t border-white/[0.05]">
        <p className="text-white/15 text-[9px] text-center">Right-click a game for options</p>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            game={contextMenu.game}
            pos={contextMenu.pos}
            onClose={() => setContextMenu(null)}
            onPlay={onSelectGame}
          />
        )}
      </AnimatePresence>
    </div>
  );
}