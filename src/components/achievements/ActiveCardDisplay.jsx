import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import ShinyCard from '@/components/shared/ShinyCard';
import EvolvedCardVisual from '@/components/blacksmith/CardVisualEvolution';
import { Crown, Star, Flame } from 'lucide-react';

export default function ActiveCardDisplay({ card, stats }) {
  // Use passed stats if available (for live updates from Forge), otherwise fallback to card defaults
  const level = stats?.level ?? card.level ?? 1;
  const stars = stats?.stars ?? card.stars ?? 1;
  const ascension = stats?.ascension ?? card.ascension ?? 0;
  
  // Card tilt effects
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseY, [-300, 300], [15, -15]);
  const rotateY = useTransform(mouseX, [-300, 300], [-15, 15]);

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = event.clientX - rect.left - width / 2;
    const mouseYPos = event.clientY - rect.top - height / 2;
    x.set(mouseXPos);
    y.set(mouseYPos);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Legendary': return 'from-orange-500 to-amber-600';
      case 'Mythic': return 'from-red-500 to-rose-600';
      case 'Epic': return 'from-purple-500 to-violet-600';
      case 'Rare': return 'from-blue-500 to-cyan-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 relative">
      <motion.div
        className="relative w-full max-w-[400px] aspect-[2.5/3.5] z-10"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ perspective: 1000 }}
      >
        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="w-full h-full relative"
        >
          {/* Evolved Visual Wrapper */}
          <EvolvedCardVisual 
            card={{ ...card, level, stars, ascension }}
            showTierBadge={false} // We'll show badges manually
          >
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl relative border border-white/10">
               {/* Card Image */}
               <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

               {/* Stats Overlay */}
               <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <Badge className="bg-black/60 backdrop-blur-md border-white/20 text-white font-bold text-lg px-3 py-1">
                    Lv. {level}
                  </Badge>
                  {ascension > 0 && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 border-0 text-white font-bold shadow-lg animate-pulse">
                      <Crown className="w-3 h-3 mr-1" /> A{ascension}
                    </Badge>
                  )}
               </div>

               {/* Stars */}
               <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-6 h-6 drop-shadow-md ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} 
                    />
                  ))}
               </div>

               {/* Bottom Info */}
               <div className="absolute bottom-0 left-0 right-0 p-6">
                 <h2 className="text-3xl font-black text-white leading-none mb-2 drop-shadow-lg">{card.title}</h2>
                 <div className="flex items-center gap-2">
                   <Badge className={`bg-gradient-to-r ${getRarityColor(card.rarity)} border-0 text-white shadow-lg`}>
                     {card.rarity}
                   </Badge>
                   <span className="text-white/60 font-medium text-sm tracking-wider">{card.series}</span>
                 </div>
               </div>
            </div>
          </EvolvedCardVisual>
        </motion.div>
      </motion.div>

      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-orange-500/10 rounded-full blur-[100px] -z-10" />
    </div>
  );
}