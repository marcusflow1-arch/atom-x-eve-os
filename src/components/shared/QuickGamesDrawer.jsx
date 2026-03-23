import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, MessageSquare, Gamepad2, ChevronRight, Wheat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuickGamesDrawer({ isOpen, onClose, type, games }) {
  const navigate = useNavigate();
  
  const isClan = type === 'clan';
  const isFarm = type === 'farm';
  const title = isClan ? 'Recent Clan Chats' : isFarm ? 'Recent Farm Hubs' : 'Recent Forum Hubs';
  const Icon = isClan ? Users : isFarm ? Wheat : MessageSquare;
  const themeColor = isClan ? 'text-blue-400' : isFarm ? 'text-yellow-400' : 'text-emerald-400';
  const themeBorder = isClan ? 'border-blue-500/30' : isFarm ? 'border-yellow-500/30' : 'border-emerald-500/30';
  const themeBg = isClan ? 'bg-blue-500/10' : isFarm ? 'bg-yellow-500/10' : 'bg-emerald-500/10';

  const handleGameClick = (game) => {
    onClose();
    // Navigate to the respective page with the game query param
    if (isClan) {
      navigate(`/Clan?game=${encodeURIComponent(game.name)}`);
    } else if (isFarm) {
      navigate(`/Farm?gameId=${game.id}`);
    } else {
      navigate(`/Community?game=${encodeURIComponent(game.name)}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[300px] z-[101] flex flex-col border-r border-white/10"
            style={{
              background: 'rgba(100, 120, 140, 0.12)',
              backdropFilter: 'blur(30px) saturate(150%)',
              WebkitBackdropFilter: 'blur(30px) saturate(150%)',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3), inset -1px 0 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            {/* Header */}
            <div className="p-4 shrink-0 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${themeBorder} ${themeBg}`}>
                  <Icon className={`w-4 h-4 ${themeColor}`} />
                </div>
                <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2 custom-scrollbar">
              <h3 className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4 px-1 flex items-center gap-2">
                <Gamepad2 className="w-3.5 h-3.5" />
                Select a game
              </h3>
              
              {games.map(game => (
                <div 
                  key={game.id}
                  onClick={() => handleGameClick(game)}
                  className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group"
                >
                  <img src={game.image} alt={game.name} className="w-12 h-16 rounded-md object-cover border border-white/10 group-hover:border-white/30 transition-colors shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white text-sm font-bold truncate group-hover:text-white/90 transition-colors">{game.name}</h4>
                    <p className="text-white/40 text-[10px] mt-1 truncate">
                      {isClan ? 'View Clan Chat' : isFarm ? 'View Game Farm' : 'View Game Forum'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}