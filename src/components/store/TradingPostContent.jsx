import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Orbit, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { Game } from '@/entities/Game';
import { aiGamesList, otherSampleGames } from './mockData';
import TradingPostFilters from './tradingpost/TradingPostFilters';
import TradingPostGameGrid from './tradingpost/TradingPostGameGrid';
import TradingPostCardGrid from './tradingpost/TradingPostCardGrid';
import TradingPostListingBoard from './tradingpost/TradingPostListingBoard';

export default function TradingPostContent() {
  const [allGames, setAllGames] = useState([]);
  const [filters, setFilters] = useState({ category: 'all', rarity: [], priceRange: [0, 10000] });
  const [search, setSearch] = useState('');

  // Navigation: level 1 (games) → 2 (cards) → 3 (listings)
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const fetched = await Game.list();
        setAllGames(fetched.length > 0 ? fetched : [...aiGamesList, ...otherSampleGames]);
      } catch {
        setAllGames([...aiGamesList, ...otherSampleGames]);
      }
    };
    fetchGames();
  }, []);

  const filteredGames = useMemo(() => {
    return allGames.filter((g) => {
      if (filters.category !== 'all' && g.genre !== filters.category) return false;
      if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allGames, filters.category, search]);

  const level = selectedCard ? 3 : selectedGame ? 2 : 1;

  const goBack = () => {
    if (selectedCard) setSelectedCard(null);
    else if (selectedGame) setSelectedGame(null);
  };

  return (
    <div className="relative z-10 w-full h-[calc(100vh-80px)] flex flex-col">
      {/* HEADER */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-white/10"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}
      >
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-1 flex items-center gap-2">
            <Orbit className="w-6 h-6 text-cyan-400" />
            GALACTIC TRADING POST
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            Player-to-Player Item Exchange
          </p>
        </div>

        <div
          className="px-4 py-3 rounded-2xl flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Your Balance</p>
            <p className="text-lg font-bold text-white font-mono">24,500 AGP</p>
          </div>
        </div>
      </div>

      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 bg-white/[0.02] text-sm">
        {level > 1 && (
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-white/60 hover:text-white transition-colors mr-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        <span className={level === 1 ? 'text-cyan-300 font-medium' : 'text-white/40'}>All Games</span>
        {selectedGame && (
          <>
            <ChevronRight className="w-3 h-3 text-white/30" />
            <span className={level === 2 ? 'text-cyan-300 font-medium' : 'text-white/40'}>{selectedGame.title}</span>
          </>
        )}
        {selectedCard && (
          <>
            <ChevronRight className="w-3 h-3 text-white/30" />
            <span className="text-cyan-300 font-medium">{selectedCard.name}</span>
          </>
        )}
      </div>

      {/* BODY: filters + content */}
      <div className="flex-1 flex gap-6 overflow-hidden px-6 py-4">
        <TradingPostFilters filters={filters} setFilters={setFilters} search={search} setSearch={setSearch} />

        <div className="flex-1 min-w-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {level === 1 && (
              <motion.div key="games" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="h-full">
                <TradingPostGameGrid games={filteredGames} onSelectGame={setSelectedGame} />
              </motion.div>
            )}
            {level === 2 && (
              <motion.div key="cards" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="h-full">
                <TradingPostCardGrid game={selectedGame} filters={filters} onSelectCard={setSelectedCard} />
              </motion.div>
            )}
            {level === 3 && (
              <motion.div key="board" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="h-full">
                <TradingPostListingBoard card={selectedCard} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}