import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  Trophy, Library as LibraryIcon, ChevronRight, ChevronLeft, Lock, X,
  Sparkles, Sword, Shield, Zap, Users, Star, Loader2, Gamepad2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';

const RARITY_STYLES = {
  Common:    { border: 'border-slate-400/40',  glow: 'shadow-[0_0_8px_rgba(148,163,184,0.25)]',  text: 'text-slate-300',  badge: 'bg-slate-500/20 text-slate-300' },
  Uncommon:  { border: 'border-green-400/40',  glow: 'shadow-[0_0_10px_rgba(74,222,128,0.3)]',  text: 'text-green-300',  badge: 'bg-green-500/20 text-green-300' },
  Rare:      { border: 'border-blue-400/50',   glow: 'shadow-[0_0_12px_rgba(96,165,250,0.35)]', text: 'text-blue-300',   badge: 'bg-blue-500/20 text-blue-300' },
  Epic:      { border: 'border-purple-400/50', glow: 'shadow-[0_0_14px_rgba(192,132,252,0.4)]', text: 'text-purple-300', badge: 'bg-purple-500/20 text-purple-300' },
  Legendary: { border: 'border-amber-400/60',   glow: 'shadow-[0_0_16px_rgba(251,191,36,0.45)]', text: 'text-amber-300',  badge: 'bg-amber-500/20 text-amber-300' },
  Mythic:    { border: 'border-red-400/60',    glow: 'shadow-[0_0_18px_rgba(248,113,113,0.5)]', text: 'text-red-300',    badge: 'bg-red-500/20 text-red-300' },
  Mythical:  { border: 'border-pink-400/60',   glow: 'shadow-[0_0_18px_rgba(244,114,182,0.5)]', text: 'text-pink-300',   badge: 'bg-pink-500/20 text-pink-300' },
  Unique:    { border: 'border-cyan-400/60',   glow: 'shadow-[0_0_18px_rgba(34,211,238,0.5)]',  text: 'text-cyan-300',   badge: 'bg-cyan-500/20 text-cyan-300' },
};

const CARD_TYPE_ICON = {
  Equipment: Shield, Ability: Zap, Companion: Users, Achievement: Trophy,
  Item: Gamepad2, Passive: Star, AI_Trait: Sparkles, AI_Teacher: Sparkles,
};

function rarityStyle(rarity) {
  return RARITY_STYLES[rarity] || RARITY_STYLES.Common;
}

export default function CrossRoleCardBrowser() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cards'); // 'cards' | 'library'
  const [userCards, setUserCards] = useState([]);
  const [cardTemplates, setCardTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [detailCard, setDetailCard] = useState(null);
  const [gameAchievements, setGameAchievements] = useState([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);

  // Fetch owned cards + all templates
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [ownedRes, templatesRes] = await Promise.all([
          base44.entities.UserCard.filter({ user_id: user.id }),
          base44.entities.CardTemplate.list(),
        ]);
        if (cancelled) return;
        setUserCards(Array.isArray(ownedRes) ? ownedRes : (ownedRes?.data || []));
        setCardTemplates(Array.isArray(templatesRes) ? templatesRes : (templatesRes?.data || []));
      } catch (e) {
        console.error('CrossRoleCardBrowser fetch error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Build genre → game → cards map from owned UserCards
  const genreGameMap = useMemo(() => {
    const map = {};
    userCards.forEach((uc) => {
      const genre = uc.genre || 'other';
      const game = uc.game_name || 'Unknown Game';
      if (!map[genre]) map[genre] = {};
      if (!map[genre][game]) map[genre][game] = { ownedCards: [], gameId: uc.game_id, gameName: game, genre };
      map[genre][game].ownedCards.push(uc);
    });
    // Also include CardTemplates grouped under their game/genre
    cardTemplates.forEach((ct) => {
      // We don't have genre on CardTemplate directly; match by source_game_id to owned games
      // Templates without a matching owned game are shown under "other" genre
    });
    return map;
  }, [userCards, cardTemplates]);

  const genres = useMemo(() => Object.keys(genreGameMap).sort(), [genreGameMap]);

  // Auto-select first genre
  useEffect(() => {
    if (!selectedGenre && genres.length > 0) setSelectedGenre(genres[0]);
  }, [genres, selectedGenre]);

  const gamesInGenre = useMemo(() => {
    if (!selectedGenre) return [];
    const g = genreGameMap[selectedGenre] || {};
    return Object.values(g);
  }, [selectedGenre, genreGameMap]);

  // When game selected, build the full card list: owned + locked templates
  const gameCards = useMemo(() => {
    if (!selectedGame) return [];
    const owned = selectedGame.ownedCards || [];
    // Templates that belong to this game (by source_game_id matching game_id, or by name matching)
    const templatesForGame = cardTemplates.filter((ct) => {
      if (selectedGame.gameId && ct.source_game_id === selectedGame.gameId) return true;
      return false;
    });
    // Merge: owned cards first, then locked templates
    const ownedNames = new Set(owned.map((c) => c.card_name?.toLowerCase()));
    const locked = templatesForGame.filter((ct) => !ownedNames.has(ct.name?.toLowerCase()));
    return [
      ...owned.map((c) => ({ ...c, _owned: true, _name: c.card_name, _rarity: c.card_rarity, _image: c.card_image, _type: c.card_type, _desc: '' })),
      ...locked.map((ct) => ({ ...ct, _owned: false, _name: ct.name, _rarity: ct.base_rarity, _image: ct.image_url, _type: ct.type, _desc: ct.description })),
    ];
  }, [selectedGame, cardTemplates]);

  // Fetch achievements for the detail card's game
  useEffect(() => {
    if (!detailCard) { setGameAchievements([]); return; }
    let cancelled = false;
    (async () => {
      setLoadingAchievements(true);
      try {
        const gameName = detailCard.game_name || detailCard.game;
        const res = await base44.entities.Achievement.filter({ game: gameName });
        if (!cancelled) setGameAchievements(Array.isArray(res) ? res : (res?.data || []));
      } catch (e) {
        if (!cancelled) setGameAchievements([]);
      } finally {
        if (!cancelled) setLoadingAchievements(false);
      }
    })();
    return () => { cancelled = true; };
  }, [detailCard]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full pointer-events-auto">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        <span className="ml-3 text-white/50 text-sm">Loading card collection…</span>
      </div>
    );
  }

  // ── Empty state ──
  if (userCards.length === 0) {
    return (
      <div className="pointer-events-auto">
        <TabBar activeTab={activeTab} onTab={setActiveTab} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Trophy className="w-12 h-12 text-white/15 mb-3" />
          <p className="text-white/40 text-sm">No cards unlocked yet. Play games and earn achievements to collect cards!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto">
      <TabBar activeTab={activeTab} onTab={setActiveTab} />

      <AnimatePresence mode="wait">
        {activeTab === 'cards' ? (
          <motion.div
            key="cards-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex gap-3 mt-2"
            style={{ height: 'calc(100vh - 300px)', minHeight: '280px' }}
          >
            {/* Genre sidebar — vertical scroll */}
            <div
              className="w-[120px] flex-shrink-0 overflow-y-auto rounded-xl border border-white/8 p-2"
              style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)', scrollbarWidth: 'none' }}
            >
              <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold px-1 pb-1.5">Genres</p>
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => { setSelectedGenre(g); setSelectedGame(null); }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium uppercase tracking-wide transition-all mb-0.5 ${
                    selectedGenre === g
                      ? 'bg-white/12 text-white border border-white/15'
                      : 'text-white/45 hover:text-white/80 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Games list for selected genre */}
            {!selectedGame && (
              <div
                className="flex-1 overflow-y-auto rounded-xl border border-white/8 p-3"
                style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)', scrollbarWidth: 'none' }}
              >
                <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-2">
                  {selectedGenre ? `${selectedGenre} Games` : 'Select a genre'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {gamesInGenre.map((g) => (
                    <button
                      key={g.gameName}
                      onClick={() => setSelectedGame(g)}
                      className="group flex items-center gap-2.5 p-2.5 rounded-lg border border-white/8 hover:border-white/20 hover:bg-white/5 transition-all text-left"
                      style={{ background: 'rgba(255,255,255,0.015)' }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {g.ownedCards[0]?.card_image ? (
                          <img src={g.ownedCards[0].card_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Gamepad2 className="w-4 h-4 text-white/40" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white/80 text-xs font-semibold truncate">{g.gameName}</p>
                        <p className="text-white/35 text-[10px]">{g.ownedCards.length} card{g.ownedCards.length !== 1 ? 's' : ''}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Card grid for selected game */}
            {selectedGame && (
              <div
                className="flex-1 flex flex-col rounded-xl border border-white/8 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}
              >
                {/* Game header + back */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8 flex-shrink-0">
                  <button
                    onClick={() => setSelectedGame(null)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-white/60" />
                  </button>
                  <span className="text-white/80 text-xs font-bold uppercase tracking-wide truncate">{selectedGame.gameName}</span>
                  <span className="text-white/30 text-[10px] ml-auto">{gameCards.length} cards</span>
                </div>

                {/* Card grid — scrollable */}
                <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: 'none' }}>
                  {gameCards.length === 0 ? (
                    <p className="text-white/30 text-xs text-center py-8">No cards available for this game.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                      {gameCards.map((card, idx) => {
                        const rs = rarityStyle(card._rarity);
                        const TypeIcon = CARD_TYPE_ICON[card._type] || Star;
                        return (
                          <button
                            key={card.id || idx}
                            onClick={() => card._owned && setDetailCard(card)}
                            disabled={!card._owned}
                            className={`group relative rounded-lg border ${rs.border} ${card._owned ? rs.glow + ' cursor-pointer hover:scale-[1.04]' : 'opacity-40 grayscale cursor-not-allowed'} transition-all overflow-hidden`}
                            style={{ background: 'rgba(255,255,255,0.03)' }}
                          >
                            {/* Card image */}
                            <div className="aspect-[3/4] relative overflow-hidden">
                              {card._image ? (
                                <img src={card._image} alt={card._name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                  <TypeIcon className="w-6 h-6 text-white/30" />
                                </div>
                              )}
                              {/* Locked overlay */}
                              {!card._owned && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <Lock className="w-5 h-5 text-white/50" />
                                </div>
                              )}
                              {/* Rarity badge */}
                              <span className={`absolute top-1 left-1 px-1 py-0.5 rounded text-[7px] font-bold uppercase ${rs.badge}`}>
                                {card._rarity}
                              </span>
                            </div>
                            {/* Card name */}
                            <div className="p-1.5">
                              <p className={`text-[9px] font-semibold truncate ${card._owned ? 'text-white/80' : 'text-white/40'}`}>{card._name}</p>
                              <p className="text-[7px] text-white/30 uppercase">{card._type}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* ── Library tab ── */
          <motion.div
            key="library-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-2"
            style={{ height: 'calc(100vh - 300px)', minHeight: '280px' }}
          >
            <LibrarySummary userCards={userCards} genreGameMap={genreGameMap} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Card detail modal (blurred background) ── */}
      <AnimatePresence>
        {detailCard && (
          <CardDetailModal
            card={detailCard}
            achievements={gameAchievements}
            loadingAchievements={loadingAchievements}
            onClose={() => setDetailCard(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Tab bar ──
function TabBar({ activeTab, onTab }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl border border-white/8 inline-flex w-fit" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}>
      <button
        onClick={() => onTab('cards')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all ${
          activeTab === 'cards' ? 'bg-white/15 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'text-white/45 hover:text-white/70'
        }`}
      >
        <Trophy className="w-3.5 h-3.5" /> Cards
      </button>
      <button
        onClick={() => onTab('library')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all ${
          activeTab === 'library' ? 'bg-white/15 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'text-white/45 hover:text-white/70'
        }`}
      >
        <LibraryIcon className="w-3.5 h-3.5" /> Library
      </button>
    </div>
  );
}

// ── Library summary tab ──
function LibrarySummary({ userCards, genreGameMap }) {
  const totalCards = userCards.length;
  const totalGames = Object.values(genreGameMap).reduce((acc, games) => acc + Object.keys(games).length, 0);
  const totalGenres = Object.keys(genreGameMap).length;
  const rarityCount = userCards.reduce((acc, c) => {
    const r = c.card_rarity || 'Common';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <StatCard label="Total Cards" value={totalCards} icon={Trophy} color="text-cyan-300" />
        <StatCard label="Games" value={totalGames} icon={Gamepad2} color="text-purple-300" />
        <StatCard label="Genres" value={totalGenres} icon={Star} color="text-amber-300" />
      </div>

      {/* Rarity breakdown */}
      <div className="rounded-xl border border-white/8 p-3 mb-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-2">By Rarity</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(rarityCount).sort((a, b) => b[1] - a[1]).map(([rarity, count]) => {
            const rs = rarityStyle(rarity);
            return (
              <span key={rarity} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${rs.badge} border ${rs.border}`}>
                {rarity}: {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Games list */}
      <div className="rounded-xl border border-white/8 p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-2">Your Games</p>
        <div className="space-y-1.5">
          {Object.entries(genreGameMap).sort().map(([genre, games]) => (
            Object.entries(games).map(([gameName, data]) => (
              <div key={genre + gameName} className="flex items-center gap-2.5 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.015)' }}>
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {data.ownedCards[0]?.card_image ? (
                    <img src={data.ownedCards[0].card_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Gamepad2 className="w-3.5 h-3.5 text-white/30" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white/70 text-xs font-medium truncate">{gameName}</p>
                  <p className="text-white/30 text-[9px] uppercase">{genre}</p>
                </div>
                <span className="text-white/40 text-[10px] font-mono">{data.ownedCards.length}</span>
              </div>
            ))
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-white/8 p-2.5 flex flex-col items-center justify-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <Icon className={`w-4 h-4 ${color} mb-1`} />
      <span className="text-white text-lg font-bold leading-none">{value}</span>
      <span className="text-white/35 text-[8px] uppercase tracking-wide mt-0.5">{label}</span>
    </div>
  );
}

// ── Blurred card detail modal ──
function CardDetailModal({ card, achievements, loadingAchievements, onClose }) {
  const rs = rarityStyle(card._rarity);
  const TypeIcon = CARD_TYPE_ICON[card._type] || Star;
  const modal = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md rounded-2xl border ${rs.border} ${rs.glow} overflow-hidden flex flex-col`}
        style={{ background: 'linear-gradient(160deg, rgba(20,24,35,0.96) 0%, rgba(10,14,22,0.98) 100%)', backdropFilter: 'blur(24px)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>

        {/* Card image header */}
        <div className="relative h-48 overflow-hidden flex-shrink-0">
          {card._image ? (
            <img src={card._image} alt={card._name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/5">
              <TypeIcon className="w-12 h-12 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e16] via-transparent to-transparent" />
          <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${rs.badge}`}>
            {card._rarity}
          </span>
        </div>

        {/* Card info */}
        <div className="p-4 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center gap-2 mb-1">
            <TypeIcon className={`w-4 h-4 ${rs.text}`} />
            <span className="text-white/40 text-[10px] uppercase tracking-wide font-bold">{card._type}</span>
          </div>
          <h3 className="text-white text-xl font-bold mb-1">{card._name}</h3>
          <p className="text-white/50 text-xs mb-3">
            {card.game_name || card.game} · <span className="uppercase">{card.genre}</span>
          </p>

          {card._desc && (
            <p className="text-white/60 text-sm leading-relaxed mb-3">{card._desc}</p>
          )}

          {/* Stats */}
          {card.stats && Object.keys(card.stats).length > 0 && (
            <div className="mb-3">
              <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1.5">Stats</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(card.stats).map(([k, v]) => (
                  <span key={k} className="px-2 py-0.5 rounded-lg bg-white/6 text-white/70 text-[10px] font-mono">
                    {k}: {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Acquisition info */}
          {card.unlocked_date && (
            <p className="text-white/35 text-[10px] mb-3">
              Unlocked: {new Date(card.unlocked_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          )}

          {/* Achievements */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1.5 flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Achievements
            </p>
            {loadingAchievements ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span className="text-white/40 text-xs">Loading achievements…</span>
              </div>
            ) : achievements.length === 0 ? (
              <p className="text-white/30 text-xs py-2">No achievements found for this game.</p>
            ) : (
              <div className="space-y-1.5">
                {achievements.slice(0, 6).map((ach) => (
                  <div key={ach.id} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span className="text-lg flex-shrink-0 leading-none">{ach.icon || '🏆'}</span>
                    <div className="min-w-0">
                      <p className="text-white/70 text-xs font-semibold truncate">{ach.title}</p>
                      <p className="text-white/35 text-[10px] leading-tight line-clamp-2">{ach.description}</p>
                    </div>
                    <span className={`ml-auto flex-shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${rarityStyle(ach.rarity).badge}`}>
                      {ach.rarity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modal, document.body);
}