import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Play, Info, ChevronLeft, ChevronRight, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function StoreSpotlight({ games }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);

  // Filter only top tier games for spotlight
  const spotlightGames = games.slice(0, 8);
  const activeGame = spotlightGames[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % spotlightGames.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + spotlightGames.length) % spotlightGames.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isHovered) return;
      
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        e.preventDefault(); // Prevent page scroll
        handleNext();
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        e.preventDefault(); // Prevent page scroll
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovered, spotlightGames.length]);

  if (!activeGame) return null;

  return (
    <div 
      ref={containerRef}
      className="w-full mb-16 relative group outline-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
    >
      {/* Selection Indicator/Hint */}
      <div className={`absolute -top-8 left-0 transition-opacity duration-300 flex items-center gap-2 text-sm text-blue-400 font-medium ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <Gamepad2 className="w-4 h-4" />
        <span>Use A / D to browse spotlight</span>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 h-[300px] xl:h-[250px]">
        
        {/* BIG BOX: Main Media (Left) */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Main Display */}
          <motion.div 
            key={activeGame.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative flex-1 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 group/media"
            onClick={() => navigate(createPageUrl(`GameDetail?id=${activeGame.id}`))}
          >
            {/* Main Image/Video */}
            <img 
              src={activeGame.cover_image || activeGame.image} 
              alt={activeGame.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-105"
            />
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {/* Play Button Overlay (Simulated) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 text-white fill-white" />
                </div>
            </div>
          </motion.div>

          {/* Thumbnails (Screenshots/Videos) */}
          <div className="h-12 flex gap-4">
             {/* Fake Video Thumb 1 */}
             <div className="aspect-video h-full rounded-lg overflow-hidden border border-white/10 relative cursor-pointer hover:border-blue-500 transition-colors">
                 <img src={activeGame.cover_image} className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" />
                 <div className="absolute inset-0 flex items-center justify-center"><Play className="w-4 h-4 text-white drop-shadow-md" /></div>
             </div>
             {/* Fake Video Thumb 2 */}
             <div className="aspect-video h-full rounded-lg overflow-hidden border border-white/10 relative cursor-pointer hover:border-blue-500 transition-colors">
                 <div className="w-full h-full bg-slate-800 opacity-60 hover:opacity-100 transition-opacity" />
                 <div className="absolute inset-0 flex items-center justify-center"><Play className="w-4 h-4 text-white drop-shadow-md" /></div>
             </div>
             {/* Screenshot 1 */}
             <div className="aspect-video h-full rounded-lg overflow-hidden border border-white/10 relative cursor-pointer hover:border-blue-500 transition-colors">
                 <img src={activeGame.cover_image} className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity hue-rotate-30" />
             </div>
             {/* Screenshot 2 */}
             <div className="aspect-video h-full rounded-lg overflow-hidden border border-white/10 relative cursor-pointer hover:border-blue-500 transition-colors">
                 <img src={activeGame.cover_image} className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity hue-rotate-60" />
             </div>
          </div>
        </div>

        {/* INFO BOX (Right) */}
        <div className="w-full xl:w-[400px] flex flex-col gap-6 justify-center p-6 bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                key={`info-${activeGame.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 flex flex-col h-full"
            >
                <div className="mb-auto">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30">
                            {activeGame.genre}
                        </Badge>
                        {activeGame.aiEnhanced && (
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                AI Enhanced
                            </Badge>
                        )}
                        <Badge variant="outline" className="border-white/10 text-white/60">
                            {activeGame.releaseDate || '2025'}
                        </Badge>
                    </div>

                    <h2 className="text-2xl font-black text-white mb-2 leading-tight tracking-tight">
                        {activeGame.title}
                    </h2>

                    <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1 text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                                <Star 
                                    key={i} 
                                    className={`w-3 h-3 ${i < Math.floor(activeGame.rating) ? 'fill-current' : 'text-white/20'}`} 
                                />
                            ))}
                            <span className="ml-2 font-bold text-white text-sm">{activeGame.rating}</span>
                        </div>
                        <span className="text-white/20">|</span>
                        <span className="text-green-400 font-bold text-lg">${activeGame.price}</span>
                    </div>

                    <p className="text-slate-300 leading-relaxed mb-3 line-clamp-2 text-sm">
                        {activeGame.description}
                    </p>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                    <Button 
                        onClick={() => navigate(createPageUrl(`GameDetail?id=${activeGame.id}`))}
                        className="w-full h-9 text-sm font-bold bg-white text-black hover:bg-slate-200"
                    >
                        View Details
                    </Button>
                    <Button 
                        variant="outline"
                        className="w-full h-9 text-xs border-white/10 hover:bg-white/5 text-white"
                    >
                        <span className="mr-2">+</span> Add to Wishlist
                    </Button>
                </div>
            </motion.div>
        </div>
      </div>

      {/* BOTTOM CAROUSEL: Scroll Effect */}
      <div className="mt-8 relative">
        <div className="overflow-hidden">
            <motion.div 
                className="flex gap-4"
                animate={{ x: -currentIndex * 220 + (220) }} // Center-ish logic or just simple slide
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {spotlightGames.map((game, index) => {
                    const isActive = index === currentIndex;
                    return (
                        <div 
                            key={game.id}
                            onClick={() => setCurrentIndex(index)}
                            className={`
                                flex-shrink-0 w-[200px] aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border
                                ${isActive 
                                    ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105 opacity-100 z-10' 
                                    : 'border-white/10 opacity-50 hover:opacity-80 hover:scale-100'
                                }
                            `}
                        >
                            <img src={game.cover_image || game.image} alt={game.title} className="w-full h-full object-cover" />
                            {isActive && (
                                <div className="absolute inset-0 border-4 border-blue-500 rounded-xl" />
                            )}
                        </div>
                    );
                })}
            </motion.div>
        </div>
        
        {/* Navigation Hints */}
        <div className="absolute top-1/2 -left-12 -translate-y-1/2 hidden xl:flex flex-col items-center gap-1 text-white/20">
            <div className={`w-8 h-8 rounded border border-current flex items-center justify-center font-mono text-xs ${isHovered ? 'text-blue-400 border-blue-400' : ''}`}>A</div>
        </div>
        <div className="absolute top-1/2 -right-12 -translate-y-1/2 hidden xl:flex flex-col items-center gap-1 text-white/20">
            <div className={`w-8 h-8 rounded border border-current flex items-center justify-center font-mono text-xs ${isHovered ? 'text-blue-400 border-blue-400' : ''}`}>D</div>
        </div>
      </div>
    </div>
  );
}