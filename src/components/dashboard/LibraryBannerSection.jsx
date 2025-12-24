import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Settings } from 'lucide-react';

function GameReference({ reference, onClick, isActive, isHomeButton }) {
  if (isHomeButton) {
    return (
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClick} className="relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 border-white/20 hover:border-cyan-400/50 transition-all flex-shrink-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
        <div className="w-full h-full flex items-center justify-center">
          <Home className="w-6 h-6 text-white/80" />
        </div>
        <div className="absolute bottom-1 left-1 right-1">
          <p className="text-white text-[7px] font-bold truncate text-center">Home</p>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onClick(reference)} className={`relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 ${isActive ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'border-white/10 hover:border-white/30'}`}>
      <img src={reference.thumbnail} alt={reference.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      <div className="absolute bottom-1 left-1 right-1">
        <p className="text-white text-[7px] font-bold truncate">{reference.title}</p>
      </div>
      <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${reference.type === 'death' ? 'bg-red-500' : reference.type === 'victory' ? 'bg-green-500' : reference.type === 'battle' ? 'bg-orange-500' : 'bg-blue-500'}`} />
    </motion.div>
  );
}

function GameBanner({ game, onChangeBanner }) {
  const [isHovered, setIsHovered] = useState(false);
  const bannerImage = game?.cover_image || game?.cover || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800';
  const bannerTitle = game?.title || 'Select a Game';
  return (
    <div className="w-full h-full rounded-xl overflow-hidden relative group cursor-pointer" style={{ background: 'rgba(100, 120, 140, 0.08)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.10)' }} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={onChangeBanner}>
      <img src={bannerImage} alt={bannerTitle} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      <div className="absolute bottom-3 left-3 right-3">
        <h4 className="text-white font-bold text-sm truncate">{bannerTitle}</h4>
        {game?.genre && <p className="text-white/50 text-[10px] capitalize">{game.genre}</p>}
      </div>
      <AnimatePresence>
        {isHovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20">
              <Settings className="w-4 h-4 text-white/70" />
              <span className="text-white/80 text-xs font-medium">Change Banner</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/40 backdrop-blur-sm">
        <span className="text-[8px] text-white/60 uppercase tracking-wider">Featured Game</span>
      </div>
    </div>
  );
}

export default function LibraryBannerSection({ games, onBackgroundChange }) {
  const [selectedBannerGame, setSelectedBannerGame] = useState(null);
  const [showBannerPicker, setShowBannerPicker] = useState(false);
  const [activeReference, setActiveReference] = useState(null);
  const scrollRef = useRef(null);

  const gameReferences = [
    { id: 1, title: 'Final Stand', thumbnail: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/0d9e757d8_unnamed.jpg', type: 'death', background: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/0d9e757d8_unnamed.jpg', game: 'Borderlands' },
    { id: 2, title: 'Boss Victory', thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200', type: 'victory', background: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920', game: 'Cyberpunk 2088' },
    { id: 3, title: 'Epic Battle', thumbnail: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200', type: 'battle', background: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1920', game: 'Shadow Realm' },
    { id: 4, title: 'Fallen Hero', thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200', type: 'death', background: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920', game: 'Dark Souls' },
    { id: 5, title: 'Champion', thumbnail: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=200', type: 'victory', background: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=1920', game: 'Stellar Odyssey' },
  ];

  const bannerGames = games?.slice(0, 8) || [
    { id: 1, title: 'Cyberpunk 2088', cover_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800', genre: 'RPG' },
    { id: 2, title: 'Elden Ring', cover_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800', genre: 'Action RPG' },
    { id: 3, title: 'Stellar Odyssey', cover_image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800', genre: 'Space Sim' },
    { id: 4, title: 'Shadow Realm', cover_image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800', genre: 'Horror' },
  ];

  const handleReferenceClick = (reference) => {
    setActiveReference(reference);
    if (onBackgroundChange) onBackgroundChange(reference.background);
  };

  const handleHomeClick = () => {
    setActiveReference(null);
    if (onBackgroundChange) onBackgroundChange(null);
  };

  return (
    <div className="flex flex-col items-center mb-4">
      <div className="flex items-stretch gap-4 w-full">
        <div className="flex-1" />
        <div className="w-[200px] h-[60px] flex-shrink-0">
          <GameBanner game={selectedBannerGame} onChangeBanner={() => setShowBannerPicker(true)} />
        </div>
        <div ref={scrollRef} className="flex-1 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <span className="text-white/30 text-[8px] uppercase tracking-wider mr-1 flex-shrink-0">Memories</span>
          {gameReferences.map((ref) => (
            <GameReference key={ref.id} reference={ref} onClick={handleReferenceClick} isActive={activeReference?.id === ref.id} />
          ))}
          <GameReference isHomeButton={true} onClick={handleHomeClick} />
        </div>
      </div>
      <div className="w-[200px] h-px bg-white/20 mt-3" />

      <AnimatePresence>
        {showBannerPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowBannerPicker(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg rounded-2xl p-6" style={{ background: 'rgba(100, 120, 140, 0.15)', backdropFilter: 'blur(30px) saturate(150%)', WebkitBackdropFilter: 'blur(30px) saturate(150%)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Select Featured Game</h3>
                <button onClick={() => setShowBannerPicker(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {bannerGames.map((game) => (
                  <div key={game.id} onClick={() => { setSelectedBannerGame(game); setShowBannerPicker(false); }} className="relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-cyan-400 transition-all">
                    <img src={game.cover_image || game.cover} alt={game.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-2 left-2">
                      <p className="text-white font-bold text-xs">{game.title}</p>
                      <p className="text-white/50 text-[10px]">{game.genre}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}