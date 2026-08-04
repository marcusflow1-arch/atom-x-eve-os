import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Star, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getRarity } from './rarityTheme';

const FALLBACK = 'https://images.unsplash.com/photo-1627856014759-2a5713c54d65?q=80&w=1000&auto=format&fit=crop';

/**
 * The hero card visual — hollow glass frame with a 3D tilt + sweeping shine on hover.
 */
export default function TiltCard({ card, level = 1, stars = 1, ascension = 0, children }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mx = useSpring(x, { stiffness: 140, damping: 16 });
  const my = useSpring(y, { stiffness: 140, damping: 16 });
  const rotateX = useTransform(my, [-150, 150], [11, -11]);
  const rotateY = useTransform(mx, [-150, 150], [-11, 11]);
  const shineX = useTransform(mx, [-150, 150], [0, 100]);
  const shine = useTransform(shineX, (v) => `linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.28) ${v}%, transparent 100%)`);

  const r = getRarity(card?.rarity);

  const onMove = ({ currentTarget, clientX, clientY }) => {
    const b = currentTarget.getBoundingClientRect();
    x.set(clientX - b.left - b.width / 2);
    y.set(clientY - b.top - b.height / 2);
  };

  return (
    <div className="relative w-full" style={{ perspective: 1000 }} onMouseMove={onMove} onMouseLeave={() => { x.set(0); y.set(0); }}>
      <div className="absolute -inset-6 rounded-full blur-3xl opacity-40 pointer-events-none" style={{ background: r.glow }} />
      <motion.div
        className="relative w-full aspect-[2.5/3.5] rounded-2xl overflow-hidden"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', border: `1px solid ${r.ring}`, boxShadow: `0 20px 60px rgba(0,0,0,0.55), 0 0 30px ${r.glow}` }}
      >
        <img src={card?.image || FALLBACK} alt={card?.title || 'Card'} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
        <motion.div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{ background: shine }} />
        <div className="pointer-events-none absolute inset-[3px] rounded-[13px] border border-white/15" />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <Badge className="bg-black/55 backdrop-blur-md border border-white/20 text-white font-bold text-[10px]">Lv. {level}</Badge>
          <div className="flex gap-0.5 rounded-full bg-black/45 backdrop-blur-md px-1.5 py-1 border border-white/10">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < stars ? 'text-amber-300 fill-amber-300' : 'text-white/20'}`} />
            ))}
          </div>
        </div>

        {ascension > 0 && (
          <div className="absolute top-12 left-3">
            <Badge className="bg-purple-500/70 backdrop-blur-md border border-purple-300/40 text-white text-[10px]">
              <Crown className="w-3 h-3 mr-1" /> A{ascension}
            </Badge>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="text-white font-black text-lg leading-tight drop-shadow-lg truncate">{card?.title || 'Unknown Card'}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] font-black uppercase tracking-[0.18em] px-2 py-0.5 rounded-full bg-gradient-to-r ${r.grad} text-black/80`}>
              {card?.rarity || 'Common'}
            </span>
            <span className="text-white/60 text-[11px] truncate">{card?.series || 'Collection'}</span>
          </div>
        </div>
        {children}
      </motion.div>
    </div>
  );
}