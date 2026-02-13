import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Gamepad2, Sparkles, Layers, DollarSign, Trophy, X,
  LayoutGrid, Globe, Rocket, Crown, Crosshair, Map, Ghost, Monitor, Car,
  ShoppingCart, Star, Zap, BookOpen, Users
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DEV_SPOTLIGHT_DATA } from './devSpotlightData';
import CardEnhancementOverlay from '../profile/CardEnhancementOverlay';

// Developer tabs (mirrors genre tabs from Achievements)
const DEV_TABS = [
  { id: 'all', name: 'All', icon: LayoutGrid },
  ...DEV_SPOTLIGHT_DATA.map(dev => ({
    id: dev.id,
    name: dev.name,
    icon: Users,
    logo: dev.logo
  }))
];

function DevScrollTabs({ tabs, selectedTab, onSelect }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleWheel = (e) => { e.preventDefault(); el.scrollLeft += e.deltaY > 0 ? 80 : -80; };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="flex-1 min-w-0 relative">
      <div className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(8,12,18,0.9), transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, rgba(8,12,18,0.9), transparent)' }} />
      <div ref={scrollRef} className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide scroll-smooth px-2" style={{ scrollBehavior: 'smooth' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap border transition-all text-xs font-semibold flex-shrink-0 ${
              selectedTab?.id === t.id
                ? 'bg-white/12 border-white/20 text-white'
                : 'bg-transparent border-transparent text-white/45 hover:bg-white/5 hover:text-white/70'
            }`}
          >
            {t.logo ? (
              <img src={t.logo} alt="" className="w-4 h-4 rounded-full" />
            ) : (
              React.createElement(t.icon, { className: 'w-3.5 h-3.5' })
            )}
            <span>{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DevSpotlightOverlay({ onClose }) {
  const [selectedTab, setSelectedTab] = useState(DEV_TABS[0]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  // Flatten all games from all developers, or filter by selected dev
  const allGames = useMemo(() => {
    let games = [];
    const devs = selectedTab.id === 'all' ? DEV_SPOTLIGHT_DATA : DEV_SPOTLIGHT_DATA.filter(d => d.id === selectedTab.id);
    devs.forEach(dev => {
      dev.games.forEach(game => {
        games.push({
          ...game,
          developerName: dev.name,
          developerLogo: dev.logo,
          cardCount: game.cards.length
        });
      });
    });
    return games;
  }, [selectedTab]);

  // Auto-select first game when tab changes
  useEffect(() => {
    if (allGames.length > 0) {
      setSelectedGame(allGames[0]);
    } else {
      setSelectedGame(null);
    }
    setSelectedCard(null);
  }, [selectedTab]);

  // Get cards for the selected game
  const displayCards = useMemo(() => {
    if (!selectedGame) return [];
    return selectedGame.cards || [];
  }, [selectedGame]);

  // Escape key handling
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (selectedCard) setSelectedCard(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedCard, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[55] pointer-events-auto"
    >
      <div className="h-screen w-full text-white font-sans overflow-hidden relative flex flex-col"
        style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-600/8 rounded-full blur-[150px] mix-blend-screen" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-[150px] mix-blend-screen" />
        </div>

        {/* ═══ SUB-NAV BAR ═══ */}
        <div className="relative z-10 flex-shrink-0 mt-16">
          <div className="flex items-center px-6 py-2 gap-0"
            style={{
              background: 'rgba(8, 12, 18, 0.5)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Left: Developer Cards label */}
            <span className="text-white/50 text-xs font-bold uppercase tracking-widest whitespace-nowrap flex-shrink-0 mr-4 select-none">
              Developer Cards
            </span>

            {/* Fade divider left */}
            <div className="flex-shrink-0 w-px h-8 mx-3 relative">
              <div className="absolute inset-x-0 top-0 bottom-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.15) 35%, rgba(255,255,255,0.15) 65%, transparent 100%)' }} />
            </div>

            {/* Center: Scrollable developer tabs */}
            <DevScrollTabs
              tabs={DEV_TABS}
              selectedTab={selectedTab}
              onSelect={setSelectedTab}
            />

            {/* Fade divider right */}
            <div className="flex-shrink-0 w-px h-8 mx-3 relative">
              <div className="absolute inset-x-0 top-0 bottom-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.15) 35%, rgba(255,255,255,0.15) 65%, transparent 100%)' }} />
            </div>

            {/* Right: Black Market + Skill Tree buttons (non-functional) */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border whitespace-nowrap bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/15"
                style={{ backdropFilter: 'blur(12px)' }}
              >
                <DollarSign className="w-4 h-4" />
                <span>Black Market</span>
              </button>

              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border whitespace-nowrap bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/15"
                style={{ backdropFilter: 'blur(12px)' }}
              >
                <Layers className="w-4 h-4" />
                <span>Skill Tree</span>
              </button>

              {/* Close button */}
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all border whitespace-nowrap bg-white/5 border-white/10 text-white/40 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ═══ MAIN CONTENT: Games List + Cards ═══ */}
        <div className="flex-1 flex min-h-0 relative z-10">

          {/* LEFT: Games List */}
          <div
            className="h-full flex flex-col overflow-hidden flex-shrink-0"
            style={{
              width: '320px',
              minWidth: '320px',
              background: 'rgba(10, 14, 20, 0.65)',
              backdropFilter: 'blur(30px)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* List Header */}
            <div className="p-4 border-b border-white/6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                  <Gamepad2 className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-sm">All Games</h2>
                  <p className="text-white/35 text-[10px]">{allGames.length} game{allGames.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Games */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
              {allGames.length === 0 ? (
                <div className="text-center py-12 text-white/25">
                  <Gamepad2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No games from this developer</p>
                </div>
              ) : (
                allGames.map((game) => (
                  <motion.button
                    key={game.id}
                    onClick={() => { setSelectedGame(game); setSelectedCard(null); }}
                    whileHover={{ x: 2 }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border ${
                      selectedGame?.id === game.id
                        ? 'bg-white/10 border-white/15'
                        : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/6'
                    }`}
                  >
                    <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-white/8 bg-black/30">
                      <img src={game.cover} alt={game.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-xs font-semibold truncate">{game.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-white/30 text-[10px]">{game.genre}</span>
                        <span className="text-cyan-400/50 text-[10px] flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />{game.cardCount}
                        </span>
                      </div>
                      {/* Developer name sub-line */}
                      <p className="text-white/20 text-[9px] mt-0.5 truncate">{game.developerName}</p>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Cards Grid */}
          <div className="flex-1 h-full overflow-hidden"
            style={{
              background: 'rgba(8, 12, 18, 0.55)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <AnimatePresence mode="wait">
              {selectedGame ? (
                <motion.div
                  key={`cards-${selectedGame.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex flex-col"
                >
                  {/* Game Header */}
                  <div className="p-5 pb-3 border-b border-white/6 flex items-center gap-4">
                    <div className="w-12 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                      <img src={selectedGame.cover} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-white font-bold text-lg truncate">{selectedGame.title}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px]">{selectedGame.genre}</Badge>
                        <span className="text-white/30 text-xs">{displayCards.length} cards</span>
                        {/* Divider */}
                        <div className="w-px h-3 bg-white/15" />
                        <span className="text-white/25 text-[10px]">{selectedGame.developerName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cards Grid */}
                  <div className="flex-1 overflow-y-auto p-5">
                    {displayCards.length > 0 ? (
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {displayCards.map((card, i) => {
                          const rarityColor =
                            card.rarity === 'Legendary' ? 'border-orange-500/50 text-orange-400' :
                            card.rarity === 'Epic' ? 'border-purple-500/50 text-purple-400' :
                            card.rarity === 'Rare' ? 'border-blue-500/50 text-blue-400' :
                            'border-slate-500/50 text-slate-400';

                          return (
                            <motion.div
                              key={card.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.02 }}
                              onClick={() => setSelectedCard(card)}
                              whileHover={{ scale: 1.05, y: -4 }}
                              className="aspect-[2.5/3.5] rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-white/25 transition-all relative bg-slate-900/80 shadow-lg hover:shadow-xl hover:shadow-cyan-500/10"
                            >
                              {/* Card image */}
                              <div className="relative w-full h-3/5 overflow-hidden">
                                <img src={card.image || selectedGame.cover} alt={card.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
                              </div>
                              {/* Card info */}
                              <div className="p-2 flex flex-col gap-1">
                                <h3 className="text-white font-bold text-[10px] leading-tight line-clamp-2">{card.name}</h3>
                                <div className="flex gap-1 flex-wrap">
                                  <Badge variant="outline" className={`text-[8px] h-3.5 px-1 border ${rarityColor}`}>
                                    {card.rarity}
                                  </Badge>
                                  <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-white/15 text-white/40">
                                    {card.type}
                                  </Badge>
                                </div>
                                {card.price && (
                                  <span className="text-cyan-400/70 text-[9px] font-semibold mt-0.5">{card.price}</span>
                                )}
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                        <Layers className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No cards released yet</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center px-8"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 opacity-20 flex items-center justify-center mb-6">
                    <Gamepad2 className="w-10 h-10 text-white/40" />
                  </div>
                  <h2 className="text-xl font-bold text-white/30 mb-2">Select a Game</h2>
                  <p className="text-white/20 text-sm max-w-sm">
                    Choose a game from the list to view developer released cards.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Card Detail Overlay */}
        <AnimatePresence>
          {selectedCard && (
            <DevCardDetailOverlay card={selectedCard} game={selectedGame} onClose={() => setSelectedCard(null)} />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function DevCardDetailOverlay({ card, game, onClose }) {
  if (!card) return null;

  const rarityColor =
    card.rarity === 'Legendary' ? 'text-amber-300' :
    card.rarity === 'Epic' ? 'text-purple-300' :
    card.rarity === 'Rare' ? 'text-blue-300' :
    'text-slate-300';

  const rarityBg =
    card.rarity === 'Legendary' ? 'bg-amber-500/20 border-amber-500/40' :
    card.rarity === 'Epic' ? 'bg-purple-500/20 border-purple-500/40' :
    card.rarity === 'Rare' ? 'bg-blue-500/20 border-blue-500/40' :
    'bg-white/10 border-white/20';

  const glowColor =
    card.rarity === 'Legendary' ? 'rgba(251, 191, 36, 0.15)' :
    card.rarity === 'Epic' ? 'rgba(168, 85, 247, 0.15)' :
    'rgba(34, 211, 238, 0.15)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden border border-white/15"
        style={{
          background: 'linear-gradient(135deg, rgba(100, 120, 140, 0.15) 0%, rgba(80, 100, 120, 0.12) 100%)',
          backdropFilter: 'blur(35px) saturate(150%)',
          WebkitBackdropFilter: 'blur(35px) saturate(150%)',
          boxShadow: `0 25px 80px rgba(0,0,0,0.6), 0 0 60px ${glowColor}`
        }}
      >
        {/* Top glow bar */}
        <div className={`h-1 ${
          card.rarity === 'Legendary' ? 'bg-gradient-to-r from-transparent via-amber-400 to-transparent' :
          card.rarity === 'Epic' ? 'bg-gradient-to-r from-transparent via-purple-400 to-transparent' :
          'bg-gradient-to-r from-transparent via-cyan-400 to-transparent'
        }`} />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center z-10 backdrop-blur-md border border-white/10"
        >
          <X className="w-5 h-5 text-white/80" />
        </button>

        <div className="p-8">
          <div className="flex gap-8">
            {/* Card Preview */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="w-36 h-48 rounded-xl overflow-hidden border-2 border-white/15 shadow-2xl">
                <img src={card.image || game?.cover} alt={card.name} className="w-full h-full object-cover" />
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-white/30">
                <span className="font-mono">{card.type}</span>
                <span>•</span>
                <span>{card.tag}</span>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h2 className={`text-2xl font-black ${rarityColor}`}>{card.name}</h2>

              <div className="flex flex-wrap items-center gap-2 mt-2 mb-4">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${rarityBg} ${rarityColor}`}>
                  {card.rarity}
                </span>
                <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-white/10 text-white/80 border border-white/10">
                  {card.type}
                </span>
                {game && <span className="text-white/30 text-xs">{game.developerName}</span>}
              </div>

              <p className="text-white/70 text-sm leading-relaxed mb-4">{card.description}</p>

              {card.stats && (
                <div className="mb-4">
                  <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Stats</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(card.stats).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-lg text-center border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <p className={`font-bold text-sm ${rarityColor}`}>{v}</p>
                        <p className="text-white/30 text-[9px] uppercase">{k}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button className="flex-1 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold rounded-xl border border-cyan-500/30 transition-colors flex items-center justify-center gap-2 text-sm">
                  <ShoppingCart className="w-4 h-4" />
                  {card.price || 'Purchase'}
                </button>
                <button className="py-3 px-5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl border border-white/10 transition-colors">
                  <Star className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={`h-0.5 ${
          card.rarity === 'Legendary' ? 'bg-gradient-to-r from-transparent via-amber-400/50 to-transparent' :
          card.rarity === 'Epic' ? 'bg-gradient-to-r from-transparent via-purple-400/50 to-transparent' :
          'bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent'
        }`} />
      </motion.div>
    </motion.div>
  );
}