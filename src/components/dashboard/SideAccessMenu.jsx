import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, Tv, Brain, Swords, X, Play, Star, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AIStoryOverlay from './AIStoryOverlay';
import BattleModeOverlay from './BattleModeOverlay';

const MENU_ITEMS = [
  { id: 'library', label: 'Library', icon: Library, color: 'cyan' },
  { id: 'entertainment', label: 'Entertainment', icon: Tv, color: 'purple' },
  { id: 'ai-story', label: 'AI Story', icon: Brain, color: 'emerald' },
  { id: 'ai-battle', label: 'AI Battle', icon: Swords, color: 'orange' },
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

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-64 h-full max-h-[70vh] overflow-y-auto custom-scrollbar p-4"
    >
      {renderContent()}
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