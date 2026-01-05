import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, ChevronLeft, ChevronRight, Lock, Check, Sparkles } from 'lucide-react';

// Generate 20 levels similar to GenreMastery seasonal passive awards
const generateAuraLevels = () => {
  const rarityFor = (i) => (
    i === 20 ? 'Godlike' : i === 15 ? 'Mythical' : i === 10 ? 'Legendary' : i === 5 ? 'Epic' : i % 2 === 0 ? 'Rare' : 'Common'
  );
  return Array.from({ length: 20 }, (_, idx) => {
    const level = idx + 1;
    const rarity = rarityFor(level);
    return {
      level,
      isUnlocked: level <= 7,
      season: 0,
      cardReward: {
        name: `Aura Reward ${level}`,
        type: 'Passive',
        rarity,
        image: `https://source.unsplash.com/random/400x400?sig=${level}&reward,icon,transparent`,
        description: `Seasonal passive unlocked at level ${level}.`
      }
    };
  });
};

const rarityBadgeClass = (rarity) => {
  switch (rarity) {
    case 'Common': return 'bg-slate-700 text-slate-200 border-slate-600/40';
    case 'Rare': return 'bg-blue-900 text-blue-200 border-blue-600/40';
    case 'Epic': return 'bg-purple-900 text-purple-200 border-purple-600/40';
    case 'Legendary': return 'bg-yellow-900 text-yellow-200 border-yellow-600/40';
    case 'Mythical': return 'bg-rose-900 text-rose-200 border-rose-600/40';
    case 'Godlike': return 'bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 text-white border-pink-300/40';
    default: return 'bg-slate-700 text-slate-200 border-slate-600/40';
  }
};

const LevelNode = ({ data, onClick, active }) => {
  const { level, isUnlocked, cardReward } = data;
  return (
    <motion.button
      onClick={() => onClick?.(data)}
      className={`relative flex-shrink-0 group cursor-pointer transition-all ${active ? 'w-40 -translate-y-2' : 'w-28'}`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lvl {level}</div>
        <div
          className={`relative rounded-2xl flex items-center justify-center ${active ? 'w-28 h-28' : 'w-20 h-20'} bg-white/8 border border-white/15 backdrop-blur-md`}
        >
          <div className={`absolute inset-0 rounded-2xl opacity-10 ${
            cardReward.rarity === 'Godlike' ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400' : ''
          }`} />
          <img src={cardReward.image} alt="reward" className={`w-full h-full object-contain p-2 ${isUnlocked ? '' : 'grayscale opacity-40'}`} />
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
            {isUnlocked ? (
              <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shadow">
                <Check className="w-3 h-3" />
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full bg-black/50 border border-white/10 flex items-center justify-center backdrop-blur">
                <Lock className="w-2.5 h-2.5 text-white/50" />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
};

export default function AuraMasteryTrack() {
  const [levels] = useState(generateAuraLevels());
  const [active, setActive] = useState(7);
  const scrollerRef = useRef(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const nodeWidth = 144; // ~128 + gap
    el.scrollLeft = (active - 1) * nodeWidth - el.clientWidth / 2 + nodeWidth / 2;
  }, [active]);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" /> Aura Mastery
        </h2>
        <div className="text-xs text-white/60">Seasonal Passive Awards</div>
      </div>

      {/* Track controls */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl border border-white/10 bg-white/5">
        <Button
          variant="ghost"
          size="icon"
          className="bg-white/5 hover:bg-white/10 text-white"
          onClick={() => scrollerRef.current && (scrollerRef.current.scrollLeft -= 400)}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 text-center text-sm text-slate-300">Navigate through 20 levels</div>
        <Button
          variant="ghost"
          size="icon"
          className="bg-white/5 hover:bg-white/10 text-white"
          onClick={() => scrollerRef.current && (scrollerRef.current.scrollLeft += 400)}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Horizontal track */}
      <div
        ref={scrollerRef}
        className="relative flex gap-4 overflow-x-auto pb-8 pt-4 px-2 rounded-2xl scrollbar-hide"
        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', scrollBehavior: 'smooth' }}
      >
        {levels.map((lv) => (
          <LevelNode key={lv.level} data={lv} active={lv.level === active} onClick={(d) => setActive(d.level)} />
        ))}
      </div>

      {/* Active reward summary */}
      <div className="mt-6 p-5 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-400" />
            <span className="text-white font-semibold">Level {active} Reward</span>
          </div>
          <Badge className={`text-[10px] ${rarityBadgeClass(levels[active - 1].cardReward.rarity)}`}>{levels[active - 1].cardReward.rarity}</Badge>
        </div>
        <div className="text-white/80">{levels[active - 1].cardReward.name}</div>
        <div className="text-white/50 text-sm">{levels[active - 1].cardReward.description}</div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}