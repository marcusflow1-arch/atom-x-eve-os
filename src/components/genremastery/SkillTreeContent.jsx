import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, Lock, Star, Trophy, Sparkles, Check,
  ChevronLeft, ChevronRight, TrendingUp, Clock, Users, X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ShinyCard from '@/components/shared/ShinyCard';
import SkillTreeSystem from '@/components/achievements/SkillTreeSystem';

const rarityColors = {
  Common: { bg: 'bg-slate-700', border: 'border-slate-500', text: 'text-slate-300', glow: 'shadow-slate-500/50' },
  Rare: { bg: 'bg-blue-900', border: 'border-blue-500', text: 'text-blue-300', glow: 'shadow-blue-500/50' },
  Epic: { bg: 'bg-purple-900', border: 'border-purple-500', text: 'text-purple-300', glow: 'shadow-purple-500/50' },
  Legendary: { bg: 'bg-yellow-900', border: 'border-yellow-500', text: 'text-yellow-300', glow: 'shadow-yellow-500/50' },
  Mythical: { bg: 'bg-red-900', border: 'border-red-500', text: 'text-red-300', glow: 'shadow-red-500/50' },
  Godlike: { bg: 'bg-gradient-to-br from-purple-600 via-pink-600 to-yellow-600', border: 'border-pink-400', text: 'text-white', glow: 'shadow-pink-500/80' }
};

const generateProgressionLevels = (genreId, genreName) => {
  const levels = [];
  const getIcon = (id, level) => `https://source.unsplash.com/random/500x500?${id},weapon,armor,transparent&sig=${level}`;
  for (let i = 1; i <= 20; i++) {
    const isCardLevel = i === 1 || i % 5 === 0;
    let rarity = 'Common';
    let rewardData = {};
    if (isCardLevel) {
      rarity = i === 20 ? 'Godlike' : i === 15 ? 'Mythical' : i === 10 ? 'Legendary' : i === 5 ? 'Epic' : 'Rare';
      rewardData = { name: `${genreName} Mastery Card ${i}`, type: 'Ability Card', rarity, image: getIcon(genreId, i), description: `Exclusive Season 0 mastery card for reaching rank ${i} in ${genreName}.` };
    } else {
      const isMaterial = i % 2 === 0;
      rarity = isMaterial ? 'Rare' : 'Common';
      rewardData = isMaterial
        ? { name: `${genreName} Essence`, type: 'Material', rarity, image: `https://source.unsplash.com/random/500x500?gem,crystal,ore&sig=${i}`, description: `Rare crafting material used for upgrading ${genreName} equipment.` }
        : { name: 'Experience Bundle', type: 'Experience', rarity, image: `https://source.unsplash.com/random/500x500?lightning,energy,spark&sig=${i}`, description: `A bundle of ${i * 150} XP to boost your progression.` };
    }
    levels.push({
      level: i, isUnlocked: i <= 12, season: 0, rewardType: isCardLevel ? 'card' : 'resource', cardReward: rewardData,
      equipmentReward: { name: `Elite Gear Tier ${i}`, type: 'Equipment', rarity: rarity === 'Godlike' ? 'Mythical' : rarity === 'Common' ? 'Common' : rarity, image: `https://source.unsplash.com/random/300x300?armor,weapon,tech&sig=${i}`, description: `High-performance equipment unlocked at level ${i}.` }
    });
  }
  return levels;
};

const LevelNode = ({ levelData, onClick }) => {
  const { level, isUnlocked, cardReward } = levelData;
  const rarity = rarityColors[cardReward.rarity];
  const isElite = ['Legendary', 'Mythical', 'Godlike'].includes(cardReward.rarity);
  return (
    <motion.div onClick={() => onClick(levelData)} className="relative flex-shrink-0 cursor-pointer w-28">
      <div className="flex flex-col items-center gap-3">
        <div className="text-center opacity-40">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Lvl {level}</div>
        </div>
        <div className="relative rounded-2xl w-20 h-20 bg-white/5 border border-white/10 z-10 backdrop-blur-sm flex items-center justify-center">
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${rarity.bg} opacity-10`} />
          <div className={`relative w-full h-full p-2 flex items-center justify-center ${isUnlocked ? '' : 'grayscale opacity-30'}`}>
            <img src={cardReward.image} alt="Reward" className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
            {isUnlocked ? (
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.5)]"><Check className="w-3 h-3 text-black" /></div>
            ) : (
              <div className="w-4 h-4 rounded-full bg-black/50 border border-white/10 flex items-center justify-center backdrop-blur-md"><Lock className="w-2.5 h-2.5 text-white/40" /></div>
            )}
          </div>
          {isElite && <div className="absolute -inset-4 bg-gradient-to-t from-white/20 to-transparent blur-xl -z-10 animate-pulse" />}
        </div>
      </div>
    </motion.div>
  );
};

const LimitedEditionCard = ({ card, onClick }) => {
  const rarity = rarityColors[card.rarity];
  return (
    <ShinyCard onClick={() => onClick && onClick(card)} className="relative w-56 h-80 rounded-xl overflow-hidden cursor-pointer shadow-2xl flex-shrink-0">
      <div className="w-full h-full relative" style={{ background: 'rgba(148,163,184,0.06)', backdropFilter: 'blur(50px) saturate(200%)', border: '1px solid rgba(148,163,184,0.15)' }}>
        <img src={card.image} alt={card.name} className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center justify-between mb-1">
            <Badge className={`${rarity.bg} ${rarity.text} border-slate-600/40 backdrop-blur-md text-[9px] font-semibold px-1.5 py-0.5`}>{card.rarity}</Badge>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 backdrop-blur-md text-[9px] px-1.5 py-0.5">{card.type}</Badge>
          </div>
          <h3 className="text-sm font-bold text-white mb-0.5 drop-shadow-lg truncate">{card.name}</h3>
          <p className="text-[10px] text-white/70 line-clamp-2">{card.description}</p>
        </div>
      </div>
    </ShinyCard>
  );
};

export default function SkillTreeContent({ genre, onClose }) {
  const [viewingLevel, setViewingLevel] = useState(null);
  const scrollContainerRef = useRef(null);
  const carouselRef = useRef(null);
  const isDraggingTrack = useRef(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });

  const progressionData = useMemo(() => genre ? generateProgressionLevels(genre.id, genre.name) : [], [genre]);
  const carouselItems = progressionData.filter(p => ['Legendary', 'Mythical', 'Godlike'].includes(p.cardReward.rarity)).map(p => ({ ...p.cardReward, id: p.level, season: `Season ${p.season}` }));

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const id = setInterval(() => { carousel.scrollLeft = carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth ? 0 : carousel.scrollLeft + 1; }, 30);
    return () => clearInterval(id);
  }, [genre]);

  const scroll = (dir) => scrollContainerRef.current?.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
  const onTrackMouseDown = (e) => { if (!scrollContainerRef.current) return; isDraggingTrack.current = true; dragStartRef.current = { x: e.clientX, scrollLeft: scrollContainerRef.current.scrollLeft }; };
  const onTrackMouseMove = (e) => { if (!isDraggingTrack.current || !scrollContainerRef.current) return; scrollContainerRef.current.scrollLeft = dragStartRef.current.scrollLeft - (e.clientX - dragStartRef.current.x); };
  const onTrackMouseUp = () => { isDraggingTrack.current = false; };

  if (!genre) return null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={`bg-black/40 border-white/10 backdrop-blur-md ${genre.accent} px-2 py-0.5 text-xs`}>
                {genre.icon && React.createElement(genre.icon, { className: "w-3 h-3 mr-1" })}{genre.rank}
              </Badge>
              <Badge variant="outline" className="bg-black/40 border-white/10 text-white/60 px-2 py-0.5 text-xs">Lvl {genre.level}/20</Badge>
              <Badge variant="outline" className="bg-blue-500/20 border-blue-500/30 text-blue-300 px-2 py-0.5 text-xs">SEASON 0</Badge>
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-white via-slate-300 to-slate-500 bg-clip-text text-transparent uppercase tracking-tighter">
              {genre.name} Skill Tree
            </h1>
          </div>
          <div className="text-right px-4 py-2 rounded-xl" style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)' }}>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{genre.xpType}</div>
            <div className="text-xl font-black text-white">{genre.xp}/100</div>
          </div>
        </div>
        {/* XP Bar */}
        <div className="w-full h-2 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <motion.div className="h-full" style={{ background: `linear-gradient(90deg, ${genre.color.split(' ')[1].replace('to-', '')} 0%, white 100%)` }} initial={{ width: 0 }} animate={{ width: `${genre.xp}%` }} transition={{ duration: 1.5, ease: 'circOut' }} />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {/* Skill Tree System */}
        <div className="mb-12">
          <SkillTreeSystem genre={genre} />
        </div>

        {/* Exclusive Rewards Carousel */}
        <div className="mb-10">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white mb-4">
            <Sparkles className="w-4 h-4 text-yellow-400" />Exclusive Season Rewards
          </h2>
          <div ref={carouselRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollBehavior: 'smooth', maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
            {carouselItems.map((card) => (
              <LimitedEditionCard key={card.id} card={card} onClick={() => setViewingLevel(progressionData.find(p => p.level === card.id))} />
            ))}
          </div>
        </div>

        {/* Progression Track */}
        <div className="mb-10">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white mb-3"><Trophy className="w-4 h-4 text-blue-500" />Progression Track</h2>
          <div className="flex items-center gap-3 mb-4 p-3 bg-white/5 rounded-xl border border-white/5">
            <Button variant="ghost" size="icon" className="bg-white/5 hover:bg-white/10 text-white h-8 w-8" onClick={() => scroll('left')}><ChevronLeft className="w-4 h-4" /></Button>
            <div className="flex-1 text-center text-xs text-slate-400 font-medium">20 Levels of {genre.name} Mastery</div>
            <Button variant="ghost" size="icon" className="bg-white/5 hover:bg-white/10 text-white h-8 w-8" onClick={() => scroll('right')}><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <div ref={scrollContainerRef} onMouseDown={onTrackMouseDown} onMouseMove={onTrackMouseMove} onMouseUp={onTrackMouseUp} onMouseLeave={onTrackMouseUp} className="relative flex items-center gap-4 overflow-x-auto pb-10 pt-4 px-4 rounded-2xl scrollbar-hide cursor-grab active:cursor-grabbing select-none" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Connecting line through the center of boxes */}
            <div className="absolute left-0 right-0 h-[2px] pointer-events-none z-0" style={{ top: 'calc(50% + 6px)', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 5%, rgba(255,255,255,0.15) 95%, transparent 100%)' }} />
            {progressionData.map((level) => (
              <LevelNode key={level.level} levelData={level} onClick={() => setViewingLevel(level)} />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: TrendingUp, label: 'Genre Rank', value: genre.rank, color: 'text-blue-400' },
            { icon: Clock, label: 'Time Played', value: '127h', color: 'text-green-400' },
            { icon: Trophy, label: 'Unlocks', value: '12/20', color: 'text-yellow-400' },
            { icon: Users, label: 'Skill Points', value: genre.skillPoints, color: 'text-purple-400' }
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-2xl hover:bg-white/5 transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2 mb-1">
                {React.createElement(stat.icon, { className: `w-4 h-4 ${stat.color}` })}
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="text-xl font-black text-white">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reward Modal */}
      <AnimatePresence>
        {viewingLevel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-md z-[500] flex items-center justify-center p-8" onClick={() => setViewingLevel(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="max-w-md w-full p-6 rounded-2xl" style={{ background: 'rgba(100,120,140,0.15)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-white font-bold text-lg">{viewingLevel.cardReward.name}</h3>
                <button onClick={() => setViewingLevel(null)} className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"><X className="w-4 h-4 text-white/50" /></button>
              </div>
              <img src={viewingLevel.cardReward.image} className="w-full h-48 object-cover rounded-xl mb-4" />
              <p className="text-white/60 text-sm mb-4">{viewingLevel.cardReward.description}</p>
              <div className="flex gap-2">
                <Badge className={`${rarityColors[viewingLevel.cardReward.rarity].bg} ${rarityColors[viewingLevel.cardReward.rarity].text} text-xs`}>{viewingLevel.cardReward.rarity}</Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">Season {viewingLevel.season}</Badge>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}