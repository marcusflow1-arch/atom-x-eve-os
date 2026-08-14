import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Orbit, ChevronLeft, ChevronRight, Crown, Gem, Shield, Sparkles, Swords, Tag, Zap } from 'lucide-react';
import { Game } from '@/entities/Game';
import { aiGamesList, otherSampleGames } from './mockData';
import TradingPostFilters from './tradingpost/TradingPostFilters';
import TradingPostListingBoard from './tradingpost/TradingPostListingBoard';

const rarityStyles = {
  Common: 'border-white/10 bg-white/[0.04]',
  Rare: 'border-cyan-400/25 bg-cyan-400/[0.06]',
  Epic: 'border-violet-400/25 bg-violet-400/[0.07]',
  Legendary: 'border-amber-400/30 bg-amber-400/[0.07]'
};

function TrainingCard({ game, index, onSelect }) {
  const rarity = ['Common', 'Rare', 'Epic', 'Legendary'][index % 4];
  const power = Math.max(40, Math.round((Number(game?.rating) || 4) * 18 + (Number(game?.reviews) || 0) / 250));
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(game)}
      whileHover={{ y: -6, rotateX: 2, rotateY: -2 }}
      className={`group relative text-left rounded-2xl border overflow-hidden min-h-[270px] shadow-2xl ${rarityStyles[rarity]}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-black/60 pointer-events-none" />
      <div className="relative aspect-[16/8] overflow-hidden bg-black/40">
        <img src={game.banner_image || game.cover_image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/10" />
        <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/80">{rarity}</span>
        <span className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black text-cyan-200">PWR {power}</span>
      </div>
      <div className="relative p-4">
        <div className="flex items-start justify-between gap-3"><div><h3 className="text-white font-black text-base truncate">{game.title}</h3><p className="text-[10px] uppercase tracking-widest text-white/35 mt-1">{game.genre || 'Unknown'} • Training Post</p></div><Sparkles className="w-4 h-4 text-cyan-300 flex-shrink-0" /></div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-[10px]">
          <div className="rounded-lg bg-black/20 border border-white/5 p-2"><div className="text-white/25">RATING</div><div className="text-white font-bold mt-1">{game.rating || '—'}</div></div>
          <div className="rounded-lg bg-black/20 border border-white/5 p-2"><div className="text-white/25">XP</div><div className="text-cyan-200 font-bold mt-1">+{power * 2}</div></div>
          <div className="rounded-lg bg-black/20 border border-white/5 p-2"><div className="text-white/25">VALUE</div><div className="text-amber-200 font-bold mt-1">{game.price ? `$${Number(game.price).toFixed(0)}` : 'FREE'}</div></div>
        </div>
      </div>
    </motion.button>
  );
}

export default function TradingPostContent({ genreFilter, searchTerm }) {
  const [allGames, setAllGames] = useState([]);
  const [filters, setFilters] = useState({ category: 'all', rarity: [], priceRange: [0, 10000] });
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fetched = await Game.list();
        if (!cancelled) setAllGames(fetched?.length ? fetched : [...aiGamesList, ...otherSampleGames]);
      } catch {
        if (!cancelled) setAllGames([...aiGamesList, ...otherSampleGames]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredGames = useMemo(() => {
    const search = (searchTerm || '').trim().toLowerCase();
    return allGames.filter(g => {
      if (genreFilter && g.genre !== genreFilter) return false;
      if (search && !`${g.title || ''} ${g.genre || ''} ${(g.tags || []).join(' ')}`.toLowerCase().includes(search)) return false;
      if (filters.priceRange && Number.isFinite(g.price) && (g.price < filters.priceRange[0] || g.price > filters.priceRange[1])) return false;
      return true;
    });
  }, [allGames, genreFilter, searchTerm, filters]);

  const level = selectedCard ? 3 : selectedGame ? 2 : 1;
  const goBack = () => selectedCard ? setSelectedCard(null) : setSelectedGame(null);

  return (
    <div className="relative z-10 w-full h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent">
        <div><h1 className="text-2xl font-black tracking-tighter text-white flex items-center gap-2"><Orbit className="w-6 h-6 text-cyan-400" /> TRAINING POSTS</h1><p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Collectible game knowledge, builds, and player-to-player exchange</p></div>
        <div className="hidden md:flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-wider"><Gem className="w-4 h-4 text-violet-300" /> Card rarity • Stats • Progression</div>
      </div>

      {level > 1 && <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 bg-white/[0.02] text-sm"><button onClick={goBack} className="flex items-center gap-1 text-white/60 hover:text-white mr-2"><ChevronLeft className="w-4 h-4" /> Back</button><span className={level === 1 ? 'text-cyan-300' : 'text-white/40'}>Training Cards</span><ChevronRight className="w-3 h-3 text-white/20" /><span className={level === 2 ? 'text-cyan-300' : 'text-white/40'}>{selectedGame?.title}</span>{selectedCard && <><ChevronRight className="w-3 h-3 text-white/20" /><span className="text-cyan-300">{selectedCard.name}</span></>}</div>}

      <div className="flex-1 flex gap-6 overflow-hidden px-6 py-4">
        <TradingPostFilters filters={filters} setFilters={setFilters} />
        <div className="min-w-0 flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {level === 1 && <motion.div key="cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{filteredGames.map((game, index) => <TrainingCard key={game.id || `${game.title}-${index}`} game={game} index={index} onSelect={setSelectedGame} />)}</div>{filteredGames.length === 0 && <div className="h-64 flex items-center justify-center text-white/30">No training cards match the current filters.</div>}</motion.div>}
            {level === 2 && <motion.div key="game" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-5"><div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="flex items-center gap-3"><Swords className="w-5 h-5 text-cyan-300" /><div><h2 className="font-black text-white">{selectedGame.title} Training Set</h2><p className="text-xs text-white/40 mt-1">Explore cards, builds, teachers, and player listings for this title.</p></div></div></div><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{Array.from({ length: 6 }, (_, i) => ({ name: `${selectedGame.title} • Card ${i + 1}`, type: i % 2 ? 'Ability' : 'Teacher', rarity: ['Common','Rare','Epic','Legendary'][i % 4], power: 100 + i * 137 })).map(card => <button key={card.name} onClick={() => setSelectedCard(card)} className={`text-left rounded-2xl border p-5 ${rarityStyles[card.rarity]} hover:-translate-y-1 transition-transform`}><div className="flex justify-between"><span className="text-[9px] uppercase tracking-widest text-white/40">{card.type}</span><Crown className="w-4 h-4 text-amber-300" /></div><h3 className="font-black text-white mt-3">{card.name}</h3><div className="flex items-center gap-3 mt-5"><span className="text-xs text-white/40">RARITY</span><span className="text-xs font-bold text-cyan-200">{card.rarity}</span><span className="text-xs text-white/40 ml-auto">PWR {card.power}</span></div></button>)}</div></motion.div>}
            {level === 3 && <motion.div key="board" initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} className="h-full"><TradingPostListingBoard card={selectedCard} /></motion.div>}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
