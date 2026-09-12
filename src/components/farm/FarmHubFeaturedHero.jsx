import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MessageSquare, Route, Sparkles } from 'lucide-react';

export default function FarmHubFeaturedHero({ games, onSelect }) {
  const [active, setActive] = useState(0);
  if (!games?.length) return null;

  const safeActive = Math.min(active, games.length - 1);
  const game = games[safeActive];
  const prev = () => setActive((index) => (index - 1 + games.length) % games.length);
  const next = () => setActive((index) => (index + 1) % games.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative h-[270px] cursor-pointer overflow-hidden rounded-2xl group"
      onClick={() => onSelect(game)}
      style={{
        background: 'rgba(100, 120, 140, 0.08)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 12px 44px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={game.id}
          initial={{ opacity: 0, scale: 1.035 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="absolute inset-0"
        >
          <img src={game.banner || game.image} alt={game.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1419]/95 via-[#0f1419]/62 to-[#0f1419]/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419]/88 via-transparent to-black/10" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex h-full max-w-[760px] flex-col justify-end p-8">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Featured Farm</span>
          {!!game.activityCount && (
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
              <Sparkles className="h-3 w-3" /> Active community
            </span>
          )}
        </div>
        <AnimatePresence mode="wait">
          <motion.h2
            key={game.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="mb-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl"
          >
            {game.title}
          </motion.h2>
        </AnimatePresence>
        {game.description && <p className="mb-4 line-clamp-2 max-w-2xl text-sm leading-6 text-white/50">{game.description}</p>}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-cyan-200/80"><MessageSquare className="h-3.5 w-3.5" />{game.postCount || 0} farm posts</span>
          <span className="flex items-center gap-1.5 text-white/45"><Route className="h-3.5 w-3.5" />{game.routeCount || 0} routes</span>
          <span className="capitalize text-white/35">{game.genre || 'Other'}</span>
        </div>
      </div>

      {games.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous featured game"
            onClick={(event) => { event.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 opacity-0 backdrop-blur-md transition-all group-hover:opacity-100 hover:bg-black/65"
          >
            <ChevronLeft className="h-4 w-4 text-white/75" />
          </button>
          <button
            type="button"
            aria-label="Next featured game"
            onClick={(event) => { event.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 opacity-0 backdrop-blur-md transition-all group-hover:opacity-100 hover:bg-black/65"
          >
            <ChevronRight className="h-4 w-4 text-white/75" />
          </button>
        </>
      )}

      {games.length > 1 && (
        <div className="absolute bottom-4 right-8 z-20 flex gap-1.5">
          {games.map((item, index) => (
            <button
              type="button"
              aria-label={`Show ${item.title}`}
              key={item.id}
              onClick={(event) => { event.stopPropagation(); setActive(index); }}
              className={`rounded-full transition-all duration-300 ${index === safeActive ? 'h-1.5 w-7 bg-cyan-400' : 'h-1.5 w-1.5 bg-white/20 hover:bg-white/45'}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
