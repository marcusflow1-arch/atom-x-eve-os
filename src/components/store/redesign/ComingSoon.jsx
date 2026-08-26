// ComingSoon.jsx — Immersive Steam-style upcoming-game showcase
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, Calendar, Play, Image as ImageIcon, Trophy, Lock, Star } from 'lucide-react';
import { COMING_SOON } from './storefrontData';

const mediaFor = (g) => [
  { type: 'trailer', label: 'TRAILER', src: g.image },
  { type: 'gameplay', label: 'GAMEPLAY', src: g.image },
  { type: 'cinematic', label: 'CINEMATIC', src: g.image },
  { type: 'screenshot', label: 'SCREENSHOT', src: g.image },
];

const achievementsFor = (g) => [
  { title: 'First Contact', desc: `Begin your journey in ${g.title}.`, progress: 0, icon: Star },
  { title: 'Pathfinder', desc: `Explore the first major area.`, progress: 0, icon: Trophy },
  { title: 'Mastery', desc: `Reach the first major milestone.`, progress: 0, icon: Lock },
  { title: 'Legend Awaits', desc: `Complete a defining challenge.`, progress: 0, icon: Trophy },
];

const Divider = ({ vertical = false }) => <div className={vertical ? 'w-px self-stretch bg-gradient-to-b from-transparent via-white/20 to-transparent' : 'h-px w-full bg-gradient-to-r from-transparent via-white/25 to-transparent'} />;

export default function ComingSoon({ onSelect }) {
  const games = COMING_SOON || [];
  const [selectedId, setSelectedId] = useState(games[0]?.id);
  const [mediaIndex, setMediaIndex] = useState(0);
  const selected = useMemo(() => games.find(g => g.id === selectedId) || games[0], [games, selectedId]);
  if (!selected) return null;
  const media = mediaFor(selected);
  const achievements = achievementsFor(selected);
  const chooseGame = (id) => { setSelectedId(id); setMediaIndex(0); onSelect?.(id); };
  const scroll = (dir) => document.getElementById('coming-soon-carousel')?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  return (
    <section className="w-full mt-8 pb-8">
      <Divider />
      <div className="flex items-center justify-between py-4">
        <div>
          <div className="text-white font-black text-lg uppercase tracking-[0.18em]">Coming Soon</div>
          <div className="text-white/35 text-[10px] uppercase tracking-widest mt-1">Upcoming releases &amp; exclusive previews</div>
        </div>
        <button className="flex items-center gap-1 text-cyan-300 text-[10px] font-semibold uppercase tracking-wider hover:text-cyan-200">View All <ChevronRight className="w-3 h-3" /></button>
      </div>

      <div className="relative min-h-[620px] overflow-hidden border border-white/[0.07] bg-white/[0.012] shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
        <div className="grid grid-cols-[minmax(0,7fr)_minmax(260px,3fr)] min-h-[620px]">
          <div className="min-w-0 p-5 pr-6">
            <div className="relative h-[410px] overflow-hidden bg-black/30 border border-white/[0.06]">
              <img src={media[mediaIndex].src} alt={selected.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />
              <div className="absolute top-4 left-4 flex items-center gap-2"><span className="px-2 py-1 text-[8px] font-bold tracking-widest text-white bg-black/50 border border-white/10">{media[mediaIndex].label}</span><span className="px-2 py-1 text-[8px] text-white/60 bg-black/40 border border-white/10">PREVIEW</span></div>
              <button onClick={() => setMediaIndex(i => (i + 1) % media.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 border border-white/15 backdrop-blur flex items-center justify-center text-white hover:bg-white/10"><Play className="w-4 h-4 ml-0.5" /></button>
              <div className="absolute left-6 right-6 bottom-6">
                <div className="text-cyan-300 text-[9px] uppercase tracking-[0.25em] mb-2">{selected.genre} • {selected.date}</div>
                <h4 className="text-white font-black text-3xl leading-none tracking-tight">{selected.title}</h4>
                <div className="flex items-center gap-4 mt-3 text-white/55 text-[10px]"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {selected.date}</span><span>{selected.wishlist_count || 0} wishlisted</span></div>
              </div>
            </div>

            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
              {media.map((m, i) => <button key={m.type} onClick={() => setMediaIndex(i)} className={`relative h-[78px] min-w-[122px] overflow-hidden border transition-all ${i === mediaIndex ? 'border-cyan-300/50' : 'border-white/[0.07] opacity-60 hover:opacity-100'}`}><img src={m.src} alt="" className="w-full h-full object-cover"/><div className="absolute inset-0 bg-black/35"/><div className="absolute left-2 bottom-2 flex items-center gap-1 text-white text-[7px] font-bold tracking-wider"><ImageIcon className="w-3 h-3"/>{m.label}</div></button>)}
            </div>
          </div>

          <div className="min-w-0 py-5 pr-5 pl-0 flex">
            <Divider vertical />
            <div className="pl-5 flex-1 min-w-0">
              <div className="text-white/40 text-[9px] uppercase tracking-[0.2em] mb-1">Achievements &amp; Unlockables</div>
              <div className="text-white font-bold text-lg mb-4">Upcoming Rewards</div>
              <div className="space-y-2">{achievements.map(({ title, desc, icon:Icon }, i) => <div key={title} className="p-3 border-b border-white/[0.07] bg-white/[0.018]"><div className="flex gap-3"><div className="w-8 h-8 flex-shrink-0 flex items-center justify-center border border-white/[0.08] text-cyan-300/70"><Icon className="w-4 h-4"/></div><div className="min-w-0"><div className="text-white/85 text-[11px] font-semibold">{title}</div><div className="text-white/35 text-[9px] leading-relaxed mt-1">{desc}</div><div className="mt-2 h-0.5 bg-white/[0.06]"><div className="h-full w-0 bg-cyan-300/60"/></div></div></div></div>)}</div>
              <div className="mt-5 pt-4 border-t border-white/[0.07]"><div className="text-white/35 text-[8px] uppercase tracking-widest">Release readiness</div><div className="flex items-center gap-2 mt-2"><div className="h-1 flex-1 bg-white/[0.06]"><div className="h-full w-[18%] bg-cyan-300/60"/></div><span className="text-cyan-300/70 text-[8px]">18%</span></div></div>
              <button onClick={() => onSelect?.(selected.id)} className="mt-5 w-full py-2.5 border border-white/[0.10] bg-white/[0.025] text-white/70 text-[9px] uppercase tracking-widest hover:bg-white/[0.06]">View Game</button>
            </div>
          </div>
        </div>
      </div>

      <Divider />
      <div className="flex items-center justify-between pt-5 pb-3">
        <div className="text-white/55 text-[9px] uppercase tracking-[0.2em]">More Upcoming Games</div>
        <div className="flex gap-1"><button onClick={() => scroll(-1)} className="w-7 h-7 flex items-center justify-center border border-white/[0.08] text-white/45 hover:text-white"><ChevronLeft className="w-3 h-3"/></button><button onClick={() => scroll(1)} className="w-7 h-7 flex items-center justify-center border border-white/[0.08] text-white/45 hover:text-white"><ChevronRight className="w-3 h-3"/></button></div>
      </div>
      <div id="coming-soon-carousel" className="flex gap-5 overflow-x-auto pb-3 scroll-smooth scrollbar-thin scrollbar-thumb-white/10">
        {games.map(g => <motion.button key={g.id} onClick={() => chooseGame(g.id)} whileHover={{ y: -4 }} className={`group text-left min-w-[245px] w-[245px] ${g.id === selected.id ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}>
          <div className={`relative h-[138px] overflow-hidden border ${g.id === selected.id ? 'border-cyan-300/40' : 'border-white/[0.07]'}`}><img src={g.image} alt={g.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"/><div className="absolute left-3 bottom-3"><div className="text-white text-sm font-bold">{g.title}</div><div className="text-cyan-300/70 text-[8px] uppercase tracking-wider mt-1">{g.genre} • {g.date}</div></div></div>
          <div className="flex items-center justify-between mt-2"><span className="text-white/35 text-[8px]">{g.wishlist_count || 0} wishlisted</span><span className="text-white/25 text-[8px] flex items-center gap-1"><Heart className="w-3 h-3"/> Wishlist</span></div>
        </motion.button>)}
      </div>
    </section>
  );
}
