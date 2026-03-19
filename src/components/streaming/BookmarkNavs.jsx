import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare, ArrowLeftRight, Hash, MessagesSquare } from 'lucide-react';
import { createPageUrl } from '@/utils';

const mockClanGames = [
  { id: '1', name: 'Destiny 2', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&q=80' },
  { id: '2', name: 'Warframe', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&q=80' },
  { id: '3', name: 'WoW', image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=100&q=80' },
];

const mockClanGamesList = [
  { id: 'g1', name: 'Destiny 2' },
  { id: 'g2', name: 'Warframe' },
  { id: 'g3', name: 'WoW' },
  { id: 'g4', name: 'Cyberpunk 2077' },
];

const mockForumTopics = [
  { id: 'f1', name: 'Elden Ring', image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=100&q=80' },
  { id: 'f2', name: 'Valorant', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=100&q=80' },
  { id: 'f3', name: 'Cyberpunk', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&q=80' },
];

const mockForumGamesList = [
  { id: 'p1', name: 'Elden Ring' },
  { id: 'p2', name: 'Cyberpunk 2077' },
  { id: 'p3', name: 'Valorant' },
];

export const ClanBookmarkNav = () => {
  const navigate = useNavigate();
  const [isChatsOpen, setIsChatsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-2 relative z-[80] mt-2 group/clan-nav">
      {/* Above: Cross-scroll Game Boxes */}
      <div className="w-16 h-20 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden relative group/scroller shadow-lg shrink-0">
        <div className="flex overflow-x-auto snap-x snap-mandatory h-full w-full [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {mockClanGames.map(game => (
            <div 
              key={game.id} 
              onClick={() => navigate(createPageUrl('Clan'))}
              className="min-w-full h-full snap-center flex flex-col items-center justify-center p-1 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="text-[9px] text-white/80 font-bold w-full text-center mb-1 truncate px-0.5">{game.name}</div>
              <img src={game.image} alt={game.name} className="w-10 h-10 object-cover rounded-lg shadow-md border border-white/10 shrink-0" />
            </div>
          ))}
        </div>
        <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-black/60 to-transparent pointer-events-none opacity-0 group-hover/scroller:opacity-100 transition-opacity flex items-center justify-end pr-0.5">
          <ArrowLeftRight className="w-3 h-3 text-white/70" />
        </div>
      </div>

      {/* Main Clan Button */}
      <button 
        onClick={() => navigate(createPageUrl('Clan'))}
        className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5 text-white/90 backdrop-blur-lg shadow-lg hover:bg-white/10 hover:scale-105 hover:border-blue-400/50 hover:text-blue-400 transition-all duration-300"
        title="Clan Hub"
      >
        <Users className="w-5 h-5" />
      </button>

      {/* Below: Pullout Menu for Recent Chats */}
      <div className="relative shrink-0">
        <button 
          onClick={() => setIsChatsOpen(!isChatsOpen)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isChatsOpen ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/30'}`}
          title="Recent Clan Chats"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {isChatsOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="absolute left-14 top-0 bg-[#0f1419]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.5)] origin-left z-50"
            >
              <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-white/[0.02] shrink-0 w-[240px]">
                <MessagesSquare className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white tracking-wide">Recent Games</span>
              </div>
              <div className="max-h-60 overflow-y-auto p-2 space-y-1 w-[240px]" style={{ scrollbarWidth: 'none' }}>
                {mockClanGamesList.map(game => (
                  <div 
                    key={game.id} 
                    onClick={() => {
                      navigate(createPageUrl('Clan'));
                      setIsChatsOpen(false);
                    }}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 text-sm text-white/80 hover:text-white cursor-pointer transition-colors"
                  >
                    <Hash className="w-3 h-3 text-white/40 shrink-0" />
                    <span className="truncate">{game.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const ForumBookmarkNav = () => {
  const navigate = useNavigate();
  const [isPagesOpen, setIsPagesOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-2 relative z-[79] mt-2 group/forum-nav">
      {/* Above: Cross-scroll Topics Boxes */}
      <div className="w-16 h-20 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden relative group/scroller shadow-lg shrink-0">
        <div className="flex overflow-x-auto snap-x snap-mandatory h-full w-full [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {mockForumTopics.map(topic => (
            <div 
              key={topic.id} 
              onClick={() => navigate(createPageUrl('Community'))}
              className="min-w-full h-full snap-center flex flex-col items-center justify-center p-1 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="text-[9px] text-white/80 font-bold w-full text-center mb-1 truncate px-0.5">{topic.name}</div>
              <img src={topic.image} alt={topic.name} className="w-10 h-10 object-cover rounded-lg shadow-md border border-white/10 shrink-0" />
            </div>
          ))}
        </div>
        <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-black/60 to-transparent pointer-events-none opacity-0 group-hover/scroller:opacity-100 transition-opacity flex items-center justify-end pr-0.5">
          <ArrowLeftRight className="w-3 h-3 text-white/70" />
        </div>
      </div>

      {/* Main Forum Button */}
      <button 
        onClick={() => navigate(createPageUrl('Community'))}
        className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5 text-white/90 backdrop-blur-lg shadow-lg hover:bg-white/10 hover:scale-105 hover:border-green-400/50 hover:text-green-400 transition-all duration-300"
        title="Community Forum"
      >
        <MessagesSquare className="w-5 h-5" />
      </button>

      {/* Below: Pullout Menu for Recent Pages */}
      <div className="relative shrink-0">
        <button 
          onClick={() => setIsPagesOpen(!isPagesOpen)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isPagesOpen ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/30'}`}
          title="Recent Forum Pages"
        >
          <Hash className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {isPagesOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="absolute left-14 top-0 bg-[#0f1419]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.5)] origin-left z-50"
            >
              <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-white/[0.02] shrink-0 w-[240px]">
                <Hash className="w-4 h-4 text-green-400" />
                <span className="text-xs font-bold text-white tracking-wide">Recent Topics</span>
              </div>
              <div className="max-h-60 overflow-y-auto p-2 space-y-1 w-[240px]" style={{ scrollbarWidth: 'none' }}>
                {mockForumPages.map(page => (
                  <div 
                    key={page.id} 
                    onClick={() => {
                      navigate(createPageUrl('Community'));
                      setIsPagesOpen(false);
                    }}
                    className="flex flex-col justify-center p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors text-sm text-white/80 hover:text-white"
                  >
                    <span className="truncate">{page.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};