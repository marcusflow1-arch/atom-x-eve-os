import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Link, Star, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';

const glassCard = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.10)',
};

const MOCK_INTERACTIONS = [
  {
    player: 'ShadowAce',
    level: 42,
    mission: 'The Final Siege',
    comment: 'Just pulled off an insane 360 no-scope from across the map. The crowd went wild!',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80',
  },
  {
    player: 'NovaPulse',
    level: 87,
    mission: 'Shadow Realm — Boss',
    comment: 'Beat the hardest boss on first try with full health. Pure skill, no cheats!',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80',
  },
  {
    player: 'CryptoKnight',
    level: 21,
    mission: 'Desert Storm',
    comment: 'Found a secret area nobody knows about. Hidden loot is unreal!',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&q=80',
  },
  {
    player: 'VoidWalker',
    level: 65,
    mission: 'Cyber City Chase',
    comment: 'Escaped 5 enemies at once with 1 HP left. Heart was pounding!',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&q=80',
  },
  {
    player: 'NeuroGamer',
    level: 33,
    mission: 'Orbital Strike',
    comment: 'Accidentally started a chain explosion that wiped half the map 💥',
    image: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=400&q=80',
  },
];

const MOCK_REVIEWS = [
  { user: 'StarBlaze', rating: 5, text: 'Unmatched visuals. Best game of the year hands down.', date: '2d ago' },
  { user: 'NightOwl99', rating: 4, text: 'Solid mechanics, smooth performance. Minor bugs but nothing major.', date: '5d ago' },
  { user: 'LunarFox', rating: 5, text: 'Addictive gameplay loop. I cannot stop playing even at 3am.', date: '1w ago' },
  { user: 'RiftBreaker', rating: 3, text: 'Good game, but the servers lag occasionally.', date: '1w ago' },
  { user: 'ArcaneVeil', rating: 5, text: 'The story is absolutely phenomenal. 10/10 would recommend.', date: '2w ago' },
];

export default function PlayerInteractionsPanel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef(null);
  const total = MOCK_INTERACTIONS.length;

  const prev = () => setActiveIndex(i => (i - 1 + total) % total);
  const next = () => setActiveIndex(i => (i + 1) % total);

  // Scroll-to-slide when hovering the interaction box
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!isHovering) return;
      e.preventDefault();
      if (e.deltaY > 0) next();
      else prev();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isHovering, activeIndex]);

  const interaction = MOCK_INTERACTIONS[activeIndex];

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', background: 'rgba(5,8,15,0.65)' }}>
      
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-white/60 text-[10px] uppercase tracking-widest font-black">Player Interactions</span>
        </div>
      </div>

      {/* Interaction Box */}
      <div
        ref={containerRef}
        className="flex-shrink-0 mx-3 mt-3 rounded-xl overflow-hidden cursor-pointer select-none"
        style={glassCard}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Meta row: player info | vertical divider | comment */}
        <div className="flex items-stretch px-3 py-2.5 gap-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Left: player name, level, mission */}
          <div className="flex flex-col justify-center gap-0.5 pr-2.5 min-w-0" style={{ width: '45%' }}>
            <p className="text-white font-bold text-xs truncate">{interaction.player}</p>
            <p className="text-cyan-400 text-[10px] font-semibold">Lvl {interaction.level}</p>
            <p className="text-white/35 text-[9px] truncate">{interaction.mission}</p>
          </div>
          {/* Vertical divider */}
          <div className="flex-shrink-0 w-px self-stretch mx-1" style={{ background: 'rgba(255,255,255,0.15)' }} />
          {/* Right: comment */}
          <div className="flex items-center pl-2.5 min-w-0" style={{ width: '55%' }}>
            <p className="text-white/60 text-[10px] leading-tight line-clamp-3">{interaction.comment}</p>
          </div>
        </div>

        {/* Screenshot */}
        <div className="relative" style={{ aspectRatio: '16/9' }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={activeIndex}
              src={interaction.image}
              alt="Player interaction"
              className="w-full h-full object-cover"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.5) 100%)' }} />

          {/* Nav arrows */}
          <button onClick={prev} className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-all">
            <ChevronLeft className="w-3.5 h-3.5 text-white" />
          </button>
          <button onClick={next} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-all">
            <ChevronRight className="w-3.5 h-3.5 text-white" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {MOCK_INTERACTIONS.map((_, i) => (
              <div key={i} onClick={() => setActiveIndex(i)} className={`rounded-full cursor-pointer transition-all ${i === activeIndex ? 'w-3 h-1.5 bg-cyan-400' : 'w-1.5 h-1.5 bg-white/30'}`} />
            ))}
          </div>

          {/* Scroll hint on hover */}
          {isHovering && (
            <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] text-white/60 bg-black/50">
              scroll ↔
            </div>
          )}
        </div>
      </div>

      {/* Horizontal divider */}
      <div className="flex-shrink-0 mx-3 mt-3 h-px" style={{ background: 'rgba(255,255,255,0.10)' }} />

      {/* Reviews section — scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0" style={{ scrollbarWidth: 'none' }}>
        <p className="text-white/30 text-[9px] uppercase tracking-widest font-black sticky top-0 pt-1 pb-1" style={{ background: 'transparent' }}>Player Reviews</p>
        {MOCK_REVIEWS.map((r, i) => (
          <div key={i} className="rounded-xl p-2.5" style={glassCard}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-white font-bold text-[11px]">{r.user}</span>
              <span className="text-white/25 text-[9px]">{r.date}</span>
            </div>
            <div className="flex items-center gap-0.5 mb-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-2.5 h-2.5 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/15'}`} />
              ))}
            </div>
            <p className="text-white/55 text-[10px] leading-tight">{r.text}</p>
          </div>
        ))}
      </div>

      {/* Leave Review input */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <p className="text-white/35 text-[9px] uppercase tracking-widest font-black mb-2">Leave Review</p>
        <div className="rounded-2xl p-2.5 flex flex-col gap-2" style={{ ...glassCard, border: '1px solid rgba(255,255,255,0.12)' }}>
          <textarea
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder="Share your experience..."
            rows={2}
            className="w-full bg-transparent outline-none text-[11px] text-white/75 placeholder:text-white/25 resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-[9px] text-white/30 hover:text-white/60 transition-all" title="Attach screenshot">
                <Paperclip className="w-3 h-3" />
                <span>Screenshot</span>
              </button>
              <button className="flex items-center gap-1 text-[9px] text-white/30 hover:text-white/60 transition-all" title="Add video link">
                <Link className="w-3 h-3" />
                <span>Video</span>
              </button>
            </div>
            <button
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{ background: reviewText.trim() ? 'linear-gradient(135deg, rgba(0,200,255,0.35), rgba(80,80,255,0.3))' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Send className="w-3 h-3 text-white/70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}