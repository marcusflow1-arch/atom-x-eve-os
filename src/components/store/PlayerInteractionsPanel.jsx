import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Link, Star, ChevronLeft, ChevronRight, MessageCircle, Download } from 'lucide-react';

const glassCard = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.10)',
};

const MOCK_RECOMMENDATIONS = [
  {
    title: 'Cyberpunk 2088',
    image: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=200&q=80',
    genre: 'Action RPG',
    downloads: '2.5M',
    id: '1',
  },
  {
    title: 'Void Walker',
    image: 'https://images.unsplash.com/photo-1535869452e05-87d9c44cb6c1?w=200&q=80',
    genre: 'Sci-Fi',
    downloads: '1.8M',
    id: '2',
  },
  {
    title: 'Neural Nexus',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200&q=80',
    genre: 'Strategy',
    downloads: '950K',
    id: '3',
  },
  {
    title: 'Shadow Protocol',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=200&q=80',
    genre: 'Stealth',
    downloads: '1.2M',
    id: '4',
  },
  {
    title: 'Orbital Strike',
    image: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=200&q=80',
    genre: 'Shooter',
    downloads: '3.1M',
    id: '5',
  },
  {
    title: 'Quantum Realm',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&q=80',
    genre: 'Adventure',
    downloads: '1.5M',
    id: '6',
  },
];

const MOCK_REVIEWS = [
  { user: 'StarBlaze', rating: 5, text: 'Unmatched visuals. Best game of the year hands down.', date: '2d ago' },
  { user: 'NightOwl99', rating: 4, text: 'Solid mechanics, smooth performance. Minor bugs but nothing major.', date: '5d ago' },
  { user: 'LunarFox', rating: 5, text: 'Addictive gameplay loop. I cannot stop playing even at 3am.', date: '1w ago' },
  { user: 'RiftBreaker', rating: 3, text: 'Good game, but the servers lag occasionally.', date: '1w ago' },
  { user: 'ArcaneVeil', rating: 5, text: 'The story is absolutely phenomenal. 10/10 would recommend.', date: '2w ago' },
];

export default function PlayerInteractionsPanel({ onGameSelect }) {
  const [reviewText, setReviewText] = useState('');

  const handleGameClick = (game) => {
    if (onGameSelect) onGameSelect(game);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', background: 'rgba(5,8,15,0.65)' }}>
      
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-white/60 text-[10px] uppercase tracking-widest font-black">Recommended</span>
        </div>
      </div>

      {/* Game Grid */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0 custom-scrollbar">
        {MOCK_RECOMMENDATIONS.map((game) => (
          <motion.div
            key={game.id}
            onClick={() => handleGameClick(game)}
            className="group relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105"
            whileHover={{ y: -4 }}
          >
            <div className="relative aspect-[3/2] rounded-lg overflow-hidden">
              <img src={game.image} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              
              {/* Game Info */}
              <div className="absolute inset-0 flex flex-col justify-end p-2">
                <h4 className="text-white font-bold text-xs truncate">{game.title}</h4>
                <div className="flex items-center justify-between text-[9px] text-white/70 mt-1">
                  <span>{game.genre}</span>
                  <div className="flex items-center gap-1">
                    <Download className="w-2.5 h-2.5" />
                    <span>{game.downloads}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>


    </div>
  );
}