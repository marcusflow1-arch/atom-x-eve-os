import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flame, TrendingUp, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { Game } from '@/entities/Game';
import { aiGamesList, otherSampleGames, trendingGames, newReleases } from './mockData';
import { generateGameCards } from './tradingpost/tradingPostMock';
import TradingPostFilters from './tradingpost/TradingPostFilters';
import TradingPostGameGrid from './tradingpost/TradingPostGameGrid';
import TradingPostCardGrid from './tradingpost/TradingPostCardGrid';
import TradingPostListingBoard from './tradingpost/TradingPostListingBoard';

const FALLBACK_TRENDING = [...trendingGames, ...newReleases, ...aiGamesList, ...otherSampleGames];

function getGameImage(game) {
  return game?.cover_image || game?.image || game?.coverImage || game?.thumbnail || '';
}

function getCardPreview(game) {
  try {
    return generateGameCards(game).slice(0, 3);
  } catch {
    return [];
  }
}

function TrendingBuyingShowcase({ games, onSelectGame }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const trending = useMemo(() => {
    const source = games.length ? games : FALLBACK_TRENDING;
    const seen = new Set();
    return source.filter((game) => {
      const key = game.id || game.title;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 30);
  }, [games]);

  useEffect(() => {
    if (activeIndex >= trending.length) setActiveIndex(0);
  }, [trending.length, activeIndex]);

  if (!trending.length) return null;

  const activeGame = trending[activeIndex];
  const cards = getCardPreview(activeGame);

  const move = (direction) => {
    setActiveIndex((current) => direction > 0
      ? (current + 1) % trending.length
      : (current - 1 + trending.length) % trending.length
    );
  };

  return (
    <section className="relative shrink-0 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_45%_20%,rgba(34,211,238,0.08),transparent_42%)]" />
      <div className="relative px-6 pt-5 pb-4">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-orange-400" />
              <h1 className="text-lg font-black uppercase tracking-[0.16em] text-white">Trending Now</h1>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
              What players are buying right now · Games &amp; collectible cards
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/40 mr-1">{activeIndex + 1} / {trending.length}</span>
            <button onClick={() => move(-1)} aria-label="Previous trending game" className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => move(1)} aria-label="Next trending game" className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-4 min-h-[172px]">
          <AnimatePresence mode="wait">
            <motion.div key={activeGame.id || activeGame.title} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.2 }} className="flex min-w-0 flex-1 gap-4">
              <button onClick={() => onSelectGame(activeGame)} className="group relative w-[130px] shrink-0 overflow-hidden border border-white/10 bg-black/30 text-left">
                {getGameImage(activeGame) ? (
                  <img src={getGameImage(activeGame)} alt={activeGame.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : <div className="absolute inset-0 bg-slate-800" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute left-3 right-3 bottom-3">
                  <span className="inline-flex items-center gap-1 text-[8px] uppercase tracking-widest font-bold text-orange-300">
                    <TrendingUp className="w-3 h-3" /> Trending
                  </span>
                </div>
              </button>

              <div className="min-w-[210px] w-[27%] flex flex-col justify-center border-r border-white/10 pr-5">
                <button onClick={() => onSelectGame(activeGame)} className="text-left group">
                  <div className="text-[9px] uppercase tracking-[0.18em] text-cyan-400 font-bold mb-1">Hot Game</div>
                  <h2 className="text-xl font-black text-white leading-tight group-hover:text-cyan-300 transition-colors">{activeGame.title}</h2>
                  <p className="text-xs text-white/40 mt-2 line-clamp-2">{activeGame.description || `Players are actively collecting and trading ${activeGame.title} cards.`}</p>
                </button>
                <div className="flex items-center gap-3 mt-4 text-[9px] uppercase tracking-wider text-white/40">
                  <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> High demand</span>
                  {activeGame.genre && <span>{activeGame.genre}</span>}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-[0.18em] font-bold text-white/50">Cards people are buying</span>
                    <span className="h-px w-10 bg-white/10" />
                  </div>
                  <button onClick={() => onSelectGame(activeGame)} className="text-[9px] uppercase tracking-widest text-cyan-400 hover:text-white flex items-center gap-1">
                    View all <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 h-[132px]">
                  {cards.length > 0 ? cards.map((card) => (
                    <button key={card.id} onClick={() => onSelectGame(activeGame)} className="relative overflow-hidden border border-white/10 bg-white/[0.025] text-left group">
                      {card.image && <img src={card.image} alt={card.name} className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                      <div className="absolute inset-x-2 bottom-2">
                        <div className="text-[9px] font-bold text-white truncate">{card.name}</div>
                        <div className="flex justify-between gap-2 mt-1 text-[8px] font-mono">
                          <span className="text-orange-300 uppercase">{card.rarity}</span>
                          <span className="text-cyan-300">{Number(card.marketPrice || 0).toLocaleString()} AGP</span>
                        </div>
                      </div>
                    </button>
                  )) : (
                    <div className="col-span-3 flex items-center justify-center border border-dashed border-white/10 text-[10px] uppercase tracking-widest text-white/30">
                      Collectible demand data loading
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-1.5 mt-4 overflow-x-auto custom-scrollbar pb-1">
          {trending.map((game, index) => (
            <button key={game.id || game.title} onClick={() => setActiveIndex(index)} className={`shrink-0 text-[8px] uppercase tracking-wider px-2.5 py-1 border transition-colors ${index === activeIndex ? 'border-cyan-400/50 text-cyan-300 bg-cyan-400/10' : 'border-white/10 text-white/35 hover:text-white/70 hover:bg-white/[0.04]'}`}>
              {game.title}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function TradingPostContent({ genreFilter, searchTerm }) {
  const [allGames, setAllGames] = useState([]);
  const [filters, setFilters] = useState({ category: 'all', rarity: [], priceRange: [0, 10000] });
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const fetched = await Game.list();
        setAllGames(fetched.length > 0 ? fetched : FALLBACK_TRENDING);
      } catch {
        setAllGames(FALLBACK_TRENDING);
      }
    };
    fetchGames();
  }, []);

  const filteredGames = useMemo(() => {
    const search = searchTerm || '';
    return allGames.filter((g) => {
      if (genreFilter && g.genre !== genreFilter) return false;
      if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allGames, genreFilter, searchTerm]);

  const trendingSource = useMemo(() => {
    const source = allGames.length ? allGames : FALLBACK_TRENDING;
    const seen = new Set();
    return source.filter((game) => {
      const key = game.id || game.title;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 30);
  }, [allGames]);

  const level = selectedCard ? 3 : selectedGame ? 2 : 1;
  const goBack = () => {
    if (selectedCard) setSelectedCard(null);
    else if (selectedGame) setSelectedGame(null);
  };

  return (
    <div className="relative z-10 w-full h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      {level === 1 && <TrendingBuyingShowcase games={trendingSource} onSelectGame={setSelectedGame} />}

      {level > 1 && (
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 bg-white/[0.02] text-sm shrink-0">
          <button onClick={goBack} className="flex items-center gap-1 text-white/60 hover:text-white transition-colors mr-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-white/40">All Games</span>
          {selectedGame && <><ChevronRight className="w-3 h-3 text-white/30" /><span className={level === 2 ? 'text-cyan-300 font-medium' : 'text-white/40'}>{selectedGame.title}</span></>}
          {selectedCard && <><ChevronRight className="w-3 h-3 text-white/30" /><span className="text-cyan-300 font-medium">{selectedCard.name}</span></>}
        </div>
      )}

      <div className="flex-1 min-h-0 flex gap-6 overflow-hidden px-6 py-4">
        {level > 1 && <TradingPostFilters filters={filters} setFilters={setFilters} />}
        <div className="min-w-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {level === 1 && (
              <motion.div key="games" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="h-full">
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
