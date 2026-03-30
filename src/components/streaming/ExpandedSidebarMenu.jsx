import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Library, ChevronRight, Gamepad2, Search } from 'lucide-react';
import { libraryGames } from '../dashboard/gamehub/mockLibraryData';
import FriendProfilePopover from './FriendProfilePopover';
import GameDetailView from './GameDetailView';

const friendsList = [
  { id: 1, name: 'Shadow_Striker', status: 'online', game: 'Cyberpunk 2088', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
  { id: 2, name: 'CyberVixen', status: 'online', game: 'Final Fantasy XIV', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { id: 3, name: 'GhostReaper', status: 'idle', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150' },
  { id: 4, name: 'IronFist', status: 'offline', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150' },
  { id: 5, name: 'NovaStar', status: 'online', game: 'League of Legends', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' },
];

export default function ExpandedSidebarMenu({ isOpen, type, onClose }) {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showFullLibrary, setShowFullLibrary] = useState(false);

  const handleClose = () => {
    setSelectedFriend(null);
    setSelectedGame(null);
    setShowFullLibrary(false);
    onClose();
  };

  const handleFriendClick = (friend) => {
    setSelectedFriend(friend);
    setSelectedGame(null);
  };

  const handleGameClick = (game) => {
    setSelectedGame(game);
    setSelectedFriend(null);
    setShowFullLibrary(false);
  };

  const handleFullLibrary = () => {
    setShowFullLibrary(true);
    setSelectedGame(null);
  };

  // Reset sub-selections when menu closes or type changes
  React.useEffect(() => {
    setSelectedFriend(null);
    setSelectedGame(null);
    setShowFullLibrary(false);
  }, [type, isOpen]);

  const panelStyle = {
    background: 'rgba(10, 14, 20, 0.6)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    boxShadow: '4px 0 30px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(165, 243, 252, 0.08)',
    borderRight: '1px solid rgba(165, 243, 252, 0.12)',
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-[74]"
          />
        )}
      </AnimatePresence>

      {/* Expanded Side Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-16 bottom-0 left-[60px] w-72 z-[75] flex flex-col overflow-hidden"
            style={panelStyle}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                {type === 'friends' ? (
                  <Users className="w-4 h-4 text-green-400" />
                ) : (
                  <Library className="w-4 h-4 text-cyan-400" />
                )}
                <h2 className="text-white font-bold text-sm tracking-wide">
                  {type === 'friends' ? 'Friends' : 'My Library'}
                </h2>
                <span className="text-white/30 text-xs">
                  {type === 'friends' ? `${friendsList.length} total` : `${libraryGames.length} total`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {type === 'library' && (
                  <button
                    onClick={handleFullLibrary}
                    className="text-[10px] font-medium text-cyan-400 border border-cyan-400/30 rounded-lg px-2 py-1 hover:bg-cyan-400/10 transition-colors"
                  >
                    Full Library
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="w-6 h-6 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Online indicator for friends */}
            {type === 'friends' && (
              <div className="px-5 py-2 flex-shrink-0">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Online Friends</p>
              </div>
            )}

            {/* List Content */}
            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1" style={{ scrollbarWidth: 'none' }}>
              {type === 'friends' && friendsList.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => handleFriendClick(friend)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                    selectedFriend?.id === friend.id
                      ? 'bg-white/15 border border-white/20'
                      : 'hover:bg-white/8 border border-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={friend.avatar} alt={friend.name} className="w-9 h-9 rounded-lg object-cover" />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0e14] ${
                      friend.status === 'online' ? 'bg-green-500' :
                      friend.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{friend.name}</p>
                    <p className="text-white/40 text-[10px] truncate">
                      {friend.game ? <span className="text-blue-300">{friend.game}</span> : <span className="capitalize">{friend.status}</span>}
                    </p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-white/20 flex-shrink-0" />
                </button>
              ))}

              {type === 'library' && libraryGames.map((game, i) => (
                <button
                  key={`lib_${game.id || i}`}
                  onClick={() => handleGameClick(game)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                    selectedGame?.id === game.id
                      ? 'bg-white/15 border border-cyan-400/30'
                      : 'hover:bg-white/8 border border-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0 w-10 h-14 rounded-md overflow-hidden bg-black/50">
                    <img
                      src={game.cover || game.cover_image || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200'}
                      alt={game.title || game.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{game.title || game.name}</p>
                    <p className="text-white/40 text-[10px]">Ready to play</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleGameClick(game); }}
                    className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold hover:bg-cyan-500/30 transition-colors"
                  >
                    Play
                  </button>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friend Profile Popover */}
      <AnimatePresence>
        {isOpen && selectedFriend && (
          <FriendProfilePopover
            friend={selectedFriend}
            onClose={() => setSelectedFriend(null)}
          />
        )}
      </AnimatePresence>

      {/* Game Detail View */}
      <AnimatePresence>
        {isOpen && (selectedGame || showFullLibrary) && (
          <GameDetailView
            game={selectedGame}
            showFullLibrary={showFullLibrary && !selectedGame}
            onClose={() => { setSelectedGame(null); setShowFullLibrary(false); }}
            onSelectGame={handleGameClick}
          />
        )}
      </AnimatePresence>
    </>
  );
}