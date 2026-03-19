import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, MonitorPlay } from 'lucide-react';

export default function AuraWatchedStreamsDrawer({ isOpen, onClose }) {
  // Simulate real-time data fetching structure
  const [data, setData] = useState({
    recentGames: [],
    mostViewed: [],
    newStreamers: [],
    recommended: []
  });

  useEffect(() => {
    // In a real implementation, this would fetch from a live API/WebSocket
    setData({
      recentGames: [
        { 
          id: 'g1', 
          name: 'Cyberpunk 2077', 
          image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&q=80',
          streamers: [
            { id: 'g1_s1', name: 'NeonRunner', viewers: '12K', avatar: 'https://i.pravatar.cc/150?u=1' },
            { id: 'g1_s2', name: 'VTheMerc', viewers: '2.1K', avatar: 'https://i.pravatar.cc/150?u=5' }
          ]
        },
        { 
          id: 'g2', 
          name: 'Elden Ring', 
          image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=100&q=80',
          streamers: [
            { id: 'g2_s1', name: 'TarnishedPro', viewers: '8.5K', avatar: 'https://i.pravatar.cc/150?u=2' },
            { id: 'g2_s2', name: 'LetMeSolo', viewers: '15K', avatar: 'https://i.pravatar.cc/150?u=6' }
          ]
        },
        { 
          id: 'g3', 
          name: 'Valorant', 
          image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=100&q=80',
          streamers: [
            { id: 'g3_s1', name: 'AimBot', viewers: '1.5K', avatar: 'https://i.pravatar.cc/150?u=13' }
          ]
        }
      ],
      mostViewed: [
        { id: 'mv1', name: 'GuildMaster', avatar: 'https://i.pravatar.cc/150?u=3', game: 'World of Warcraft', viewers: '45K', isLive: true },
        { id: 'mv2', name: 'EsportsLive', avatar: 'https://i.pravatar.cc/150?u=14', game: 'Valorant', viewers: '120K', isLive: true },
        { id: 'mv3', name: 'TarnishedPro', avatar: 'https://i.pravatar.cc/150?u=2', game: 'Elden Ring', viewers: '8.5K', isLive: true },
        { id: 'mv4', name: 'NeonRunner', avatar: 'https://i.pravatar.cc/150?u=1', game: 'Cyberpunk 2077', viewers: '12K', isLive: true },
        { id: 'mv5', name: 'ProGamerX', avatar: 'https://i.pravatar.cc/150?u=15', game: 'Apex Legends', viewers: '32K', isLive: true },
      ],
      newStreamers: [
        { id: 'ns1', name: 'PixelHunter', avatar: 'https://i.pravatar.cc/150?u=7', game: 'Indie Showcase', viewers: '1.2K', isLive: true },
        { id: 'ns2', name: 'RetroGamer', avatar: 'https://i.pravatar.cc/150?u=8', game: 'Super Mario 64', viewers: '800', isLive: true },
        { id: 'ns3', name: 'SpeedyJ', avatar: 'https://i.pravatar.cc/150?u=9', game: 'Sonic Odyssey', viewers: '450', isLive: true },
        { id: 'ns4', name: 'CasualDan', avatar: 'https://i.pravatar.cc/150?u=16', game: 'Stardew Valley', viewers: '200', isLive: true },
      ],
      recommended: [
        { id: 'rc1', name: 'StrategyKing', avatar: 'https://i.pravatar.cc/150?u=10', game: 'Civilization VI', viewers: '5.6K', isLive: true },
        { id: 'rc2', name: 'FPSGod', avatar: 'https://i.pravatar.cc/150?u=11', game: 'Valorant', viewers: '22K', isLive: true },
        { id: 'rc3', name: 'StoryTeller', avatar: 'https://i.pravatar.cc/150?u=12', game: 'The Witcher 3', viewers: '4.2K', isLive: true },
        { id: 'rc4', name: 'CozyGamer', avatar: 'https://i.pravatar.cc/150?u=4', game: 'Persona 5', viewers: '3.4K', isLive: true },
        { id: 'rc5', name: 'LoreMaster', avatar: 'https://i.pravatar.cc/150?u=17', game: 'Dark Souls 3', viewers: '9.1K', isLive: true },
      ]
    });
  }, []);

  const StreamerRow = ({ streamer }) => (
    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group">
      <div className="relative shrink-0">
        <img src={streamer.avatar} alt={streamer.name} className="w-8 h-8 rounded-full object-cover border border-white/10 group-hover:border-cyan-500/50 transition-colors" />
        {streamer.isLive && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-[2px] border-[#0d1117]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h4 className="text-white text-sm font-semibold truncate group-hover:text-cyan-300 transition-colors">{streamer.name}</h4>
          {streamer.isLive && (
            <div className="flex items-center gap-1.5 text-white/90 text-[10px] font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {streamer.viewers}
            </div>
          )}
        </div>
        <p className="text-white/50 text-[11px] truncate">{streamer.game}</p>
      </div>
    </div>
  );

  const GameRow = ({ game }) => {
    const [expanded, setExpanded] = useState(false);
    return (
      <div className="space-y-1">
        <div 
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
          onClick={() => setExpanded(!expanded)}
        >
          <img src={game.image} alt={game.name} className="w-8 h-10 rounded object-cover border border-white/10 group-hover:border-cyan-500/50 transition-colors shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="text-white text-sm font-semibold truncate group-hover:text-cyan-300 transition-colors">{game.name}</h4>
          </div>
          <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-1 pl-4 border-l border-white/5 ml-4 mt-1"
            >
              {game.streamers.map(s => <StreamerRow key={s.id} streamer={{...s, game: game.name, isLive: true}} />)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const Section = ({ title, items, renderItem, defaultLimit = 3 }) => {
    const [showAll, setShowAll] = useState(false);
    const visibleItems = showAll ? items : items.slice(0, defaultLimit);

    if (!items || items.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2 px-3">{title}</h3>
        <div className="space-y-0.5 px-1">
          {visibleItems.map(renderItem)}
        </div>
        {items.length > defaultLimit && (
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-cyan-400/80 hover:text-cyan-300 text-xs font-medium px-3 py-1.5 mt-1 w-full text-left transition-colors flex items-center gap-1 hover:bg-white/5 rounded-lg"
          >
            {showAll ? 'Show Less' : 'Show More'}
          </button>
        )}
      </div>
    );
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
                <MonitorPlay className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white tracking-wide">Aura Streams</h2>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
              <Section 
                title="Recently Watched Games" 
                items={data.recentGames} 
                renderItem={(game) => <GameRow key={game.id} game={game} />}
                defaultLimit={2}
              />
              
              <Section 
                title="Most Viewed" 
                items={data.mostViewed} 
                renderItem={(streamer) => <StreamerRow key={streamer.id} streamer={streamer} />}
                defaultLimit={3}
              />

              <Section 
                title="New Streamers" 
                items={data.newStreamers} 
                renderItem={(streamer) => <StreamerRow key={streamer.id} streamer={streamer} />}
                defaultLimit={2}
              />

              <Section 
                title="Recommended For You" 
                items={data.recommended} 
                renderItem={(streamer) => <StreamerRow key={streamer.id} streamer={streamer} />}
                defaultLimit={3}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}