import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, Tv, Brain, Swords, X, Play, Star, Clock, Users, Radio, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AIStoryOverlay from './AIStoryOverlay';
import BattleModeOverlay from './BattleModeOverlay';
import FriendsListContent from './FriendsListContent';

const MENU_ITEMS = [
  { id: 'library', label: 'Library', icon: Library, color: 'cyan' },
  { id: 'friends-list', label: 'Friends List', icon: Users, color: 'blue' },
  { id: 'aura', label: 'Aura', icon: Radio, color: 'pink' },
  { id: 'ai-story', label: 'AI Story', icon: Brain, color: 'emerald' },
];

// Mock data for content panels
const MOCK_LIBRARY_GAMES = [
  { id: 1, title: 'Cyber Protocol', cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=300&fit=crop', lastPlayed: '2 hours ago' },
  { id: 2, title: 'Neon Drift', cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=300&fit=crop', lastPlayed: 'Yesterday' },
  { id: 3, title: 'Void Runners', cover: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200&h=300&fit=crop', lastPlayed: '3 days ago' },
  { id: 4, title: 'Star Nexus', cover: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0c?w=200&h=300&fit=crop', lastPlayed: 'Last week' },
];

const MOCK_ENTERTAINMENT = [
  { id: 1, title: 'Gaming Weekly', type: 'Video', duration: '24:30', thumbnail: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=300&h=200&fit=crop' },
  { id: 2, title: 'Dev Insights', type: 'Podcast', duration: '45:00', thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=300&h=200&fit=crop' },
  { id: 3, title: 'Esports Finals', type: 'Live', duration: 'LIVE', thumbnail: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=300&h=200&fit=crop' },
];

const ContentPanel = ({ activeItem, onClose }) => {
  if (!activeItem) return null;

  const renderContent = () => {
    switch (activeItem) {
      case 'library':
        return (
          <div className="space-y-3">
            <h3 className="text-white/90 font-semibold text-sm uppercase tracking-wider mb-4">Recent Games</h3>
            {MOCK_LIBRARY_GAMES.map(game => (
              <Link
                key={game.id}
                to={createPageUrl('Library')}
                className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={game.cover} alt={game.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{game.title}</p>
                  <p className="text-white/40 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {game.lastPlayed}
                  </p>
                </div>
                <Play className="w-4 h-4 text-white/30 group-hover:text-cyan-400 transition-colors" />
              </Link>
            ))}
            <Link
              to={createPageUrl('Library')}
              className="block text-center text-cyan-400 text-xs hover:text-cyan-300 mt-4"
            >
              View Full Library →
            </Link>
          </div>
        );

      case 'entertainment':
        return (
          <div className="space-y-3">
            <h3 className="text-white/90 font-semibold text-sm uppercase tracking-wider mb-4">Entertainment</h3>
            {MOCK_ENTERTAINMENT.map(item => (
              <div
                key={item.id}
                className="rounded-xl bg-white/5 hover:bg-white/10 transition-all overflow-hidden cursor-pointer"
              >
                <div className="relative aspect-video">
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.duration === 'LIVE' ? 'bg-red-500 text-white' : 'bg-black/60 text-white/80'
                  }`}>
                    {item.duration}
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-white font-medium text-xs truncate">{item.title}</p>
                  <p className="text-white/40 text-[10px]">{item.type}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'ai-story':
        return (
          <div className="space-y-4">
            <h3 className="text-white/90 font-semibold text-sm uppercase tracking-wider mb-4">AI Story Mode</h3>
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30">
              <Brain className="w-8 h-8 text-emerald-400 mb-3" />
              <h4 className="text-white font-bold mb-1">Continue Your Journey</h4>
              <p className="text-white/60 text-xs mb-3">Chapter 7: The Digital Frontier</p>
              <button className="w-full py-2 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-300 text-sm font-medium transition-all">
                Resume Story
              </button>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-white/50 text-xs">Your AI companion awaits. Make choices that shape the narrative.</p>
            </div>
          </div>
        );

      case 'ai-battle':
        return (
          <div className="space-y-4">
            <h3 className="text-white/90 font-semibold text-sm uppercase tracking-wider mb-4">AI Battle Mode</h3>
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30">
              <Swords className="w-8 h-8 text-orange-400 mb-3" />
              <h4 className="text-white font-bold mb-1">Arena Challenge</h4>
              <p className="text-white/60 text-xs mb-3">Rank: Diamond III • 2,450 pts</p>
              <button className="w-full py-2 rounded-lg bg-orange-500/30 hover:bg-orange-500/50 text-orange-300 text-sm font-medium transition-all">
                Enter Battle
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-white/5 text-center">
                <p className="text-white font-bold text-lg">47</p>
                <p className="text-white/40 text-[10px]">Wins</p>
              </div>
              <div className="p-2 rounded-lg bg-white/5 text-center">
                <p className="text-white font-bold text-lg">12</p>
                <p className="text-white/40 text-[10px]">Losses</p>
              </div>
            </div>
          </div>
        );

      case 'aura':
        return (
          <div className="space-y-4">
            <h3 className="text-white/90 font-semibold text-sm uppercase tracking-wider mb-4">Aura Streaming</h3>
            <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/10 border border-pink-500/30">
              <Radio className="w-8 h-8 text-pink-400 mb-3" />
              <h4 className="text-white font-bold mb-1">Live Now</h4>
              <p className="text-white/60 text-xs mb-3">Top streams and content</p>
              <Link to={createPageUrl('Aura')} className="block w-full py-2 rounded-lg bg-pink-500/30 hover:bg-pink-500/50 text-pink-300 text-sm font-medium transition-all text-center">
                Open Aura
              </Link>
            </div>
          </div>
        );

      case 'friends-list':
        return (
          <div className="h-[500px] w-[600px] -ml-4 -mt-4">
            <FriendsListContent />
          </div>
        );

      default:
        return null;
    }
  };

  // If friends list is active, we need a wider container
  const isWideMode = activeItem === 'friends-list';

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`${isWideMode ? 'w-[600px]' : 'w-64'} h-full max-h-[70vh] overflow-hidden rounded-r-xl custom-scrollbar p-4 bg-slate-900/90 border-r border-white/10 backdrop-blur-xl`}
    >
      <div className="h-full overflow-y-auto">
        {renderContent()}
      </div>
    </motion.div>
  );
};

export default function SideAccessMenu() {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [showAIStory, setShowAIStory] = useState(false);
  const [showAIBattle, setShowAIBattle] = useState(false);
  const menuRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsExpanded(false);
        setActiveItem(null);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // Escape closes the friends list box / expanded menu
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (showAIBattle) { setShowAIBattle(false); return; }
      if (showAIStory) { setShowAIStory(false); return; }
      if (activeItem || isExpanded) { setIsExpanded(false); setActiveItem(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showAIBattle, showAIStory, activeItem, isExpanded]);

  const handleAnchorClick = () => {
    if (isExpanded) {
      setIsExpanded(false);
      setActiveItem(null);
    } else {
      setIsExpanded(true);
    }
  };

  const handleItemClick = (itemId) => {
    // For AI Story and AI Battle, show full-screen overlays instead of inline panels
    if (itemId === 'ai-story') {
      setShowAIStory(true);
      setIsExpanded(false);
      setActiveItem(null);
      return;
    }
    if (itemId === 'ai-battle') {
      setShowAIBattle(true);
      setIsExpanded(false);
      setActiveItem(null);
      return;
    }
    
    if (activeItem === itemId) {
      setActiveItem(null);
    } else {
      setActiveItem(itemId);
    }
  };

  const getItemColor = (item, isActive) => {
    if (!isActive) return 'text-white/50';
    switch (item.color) {
      case 'cyan': return 'text-cyan-400';
      case 'purple': return 'text-purple-400';
      case 'emerald': return 'text-emerald-400';
      case 'orange': return 'text-orange-400';
      default: return 'text-white';
    }
  };

  return (
    <>
      {/* Trigger Button - Floating on Left Edge */}
      {!isExpanded && !activeItem && (
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 z-40 flex items-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Hit area */}
          <div 
            className="w-4 h-64 absolute left-0" 
            onClick={handleAnchorClick}
          />
          
          {/* Visible Bar Removed */}
        </motion.div>
      )}

      {/* Expanded Menu - Slide out */}
      <AnimatePresence>
        {(isExpanded || activeItem) && (
          <div ref={menuRef} className="absolute left-0 top-1/2 -translate-y-1/2 z-40 flex h-[600px]">
            {/* Menu List */}
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-64 h-full bg-black/80 backdrop-blur-xl border-y border-r border-white/10 rounded-r-2xl flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-white font-bold text-lg tracking-wide">Quick Access</h3>
                <button 
                  onClick={() => { setIsExpanded(false); setActiveItem(null); }}
                  className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto py-2">
                {MENU_ITEMS.map((item) => {
                  const isActive = activeItem === item.id;
                  const Icon = item.icon;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-6 py-4 transition-all border-l-2 ${
                        isActive 
                          ? `bg-white/10 ${getItemColor(item, true)} border-${item.color}-400`
                          : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Icon className={`w-5 h-5 ${isActive ? getItemColor(item, true) : ''}`} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Content Panel (Slides out next to menu) */}
            <AnimatePresence mode="wait">
              {activeItem && (
                <motion.div
                  key="content-panel"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full ml-4"
                >
                  <div className="h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    <ContentPanel activeItem={activeItem} onClose={() => setActiveItem(null)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>

      {/* AI Story Full Screen Overlay */}
      <AnimatePresence>
        {showAIStory && (
          <AIStoryOverlay onClose={() => setShowAIStory(false)} />
        )}
      </AnimatePresence>

      {/* AI Battle Full Screen Overlay */}
      <AnimatePresence>
        {showAIBattle && (
          <BattleModeOverlay onClose={() => setShowAIBattle(false)} />
        )}
      </AnimatePresence>
    </>
  );
}