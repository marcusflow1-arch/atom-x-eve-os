import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  Trophy, Lock, X,
  Sparkles, Shield, Zap, Users, Star, Loader2, Gamepad2, HelpCircle
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

// Default number of placeholder slots shown for a game with no/unlocked cards
const DEFAULT_PLACEHOLDER_COUNT = 8;

function rarityStyle(rarity) {
  return RARITY_STYLES[rarity] || RARITY_STYLES.Common;
}

export default function CrossRoleCardBrowser() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [userCards, setUserCards] = useState([]);
  const [cardTemplates, setCardTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [detailCard, setDetailCard] = useState(null);
  const [gameAchievements, setGameAchievements] = useState([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);

  // Fetch all games + owned cards + templates
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const fetches = [base44.entities.Game.list()];
        if (user?.id) fetches.push(base44.entities.UserCard.filter({ user_id: user.id }));
        else fetches.push(Promise.resolve([]));
        fetches.push(base44.entities.CardTemplate.list());
        const [gamesRes, ownedRes, templatesRes] = await Promise.all(fetches);
        if (cancelled) return;
        setGames(Array.isArray(gamesRes) ? gamesRes : (gamesRes?.data || []));
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

  // Group ALL games by genre (from Game entity, not just owned cards)
  const gamesByGenre = useMemo(() => {
    const map = {};
    games.forEach((g) => {
      const genre = g.genre || 'other';
      if (!map[genre]) map[genre] = [];
      map[genre].push(g);
    });
    return map;
  }, [games]);

  const genres = useMemo(() => Object.keys(gamesByGenre).sort(), [gamesByGenre]);

  // Auto-select first genre
  useEffect(() => {
    if (!selectedGenre && genres.length > 0) setSelectedGenre(genres[0]);
  }, [genres, selectedGenre]);

  const gamesInGenre = useMemo(() => {
    if (!selectedGenre) return [];
    return gamesByGenre[selectedGenre] || [];
  }, [selectedGenre, gamesByGenre]);

  // Map owned cards by game title for quick lookup
  const ownedCardsByGame = useMemo(() => {
    const map = {};
    userCards.forEach((uc) => {
      const key = uc.game_name || uc.game_id;
      if (!map[key]) map[key] = [];
      map[key].push(uc);
    });
    return map;
  }, [userCards]);

  // Build card list for selected game: owned (colored) + locked templates + question-mark placeholders
  // Build card lists for every game in the selected genre (owned + locked + placeholders)
  const cardsByGameId = useMemo(() => {
    const map = {};
    gamesInGenre.forEach((game) => {
      const owned = ownedCardsByGame[game.title] || ownedCardsByGame[game.id] || [];
      const templatesForGame = cardTemplates.filter((ct) => ct.source_game_id === game.id);
      const ownedNames = new Set(owned.map((c) => (c.card_name || '').toLowerCase()));
      const locked = templatesForGame.filter((ct) => !ownedNames.has((ct.name || '').toLowerCase()));

      const cards = [
        ...owned.map((c) => ({
          ...c, _owned: true, _placeholder: false, _gameTitle: game.title,
          _name: c.card_name, _rarity: c.card_rarity, _image: c.card_image, _type: c.card_type, _desc: c.card_description || '',
        })),
        ...locked.map((ct) => ({
          ...ct, _owned: false, _placeholder: false, _gameTitle: game.title,
          _name: ct.name, _rarity: ct.base_rarity, _image: ct.image_url, _type: ct.type, _desc: ct.description || '',
        })),
      ];

      const totalKnown = owned.length + locked.length;
      const fillCount = Math.max(0, DEFAULT_PLACEHOLDER_COUNT - totalKnown);
      for (let i = 0; i < fillCount; i++) {
        cards.push({
          id: `placeholder_${game.id}_${i}`,
          _owned: false, _placeholder: true, _gameTitle: game.title,
          _name: '???', _rarity: 'Common', _image: null, _type: 'Unknown', _desc: '',
        });
      }
      map[game.id] = cards;
    });
    return map;
  }, [gamesInGenre, ownedCardsByGame, cardTemplates]);

  // Fetch achievements for the detail card's game
  useEffect(() => {
    if (!detailCard) { setGameAchievements([]); return; }
    let cancelled = false;
    (async () => {
      setLoadingAchievements(true);
      try {
        const gameName = detailCard._gameTitle || detailCard.game_name || detailCard.game;
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
      <div className="flex items-center justify-center h-full pointer-events-auto p-8">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        <span className="ml-3 text-white/50 text-sm">Loading card collection…</span>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto p-1">
      <AnimatePresence mode="wait">
        <motion.div
          key="cards-view"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="mt-2 flex flex-col"
          style={{ height: 'calc(100vh - 300px)', minHeight: '280px' }}
        >
            {/* XMB-style horizontal genre bar */}
            <GenreBar
              genres={genres}
              selectedGenre={selectedGenre}
              onSelect={setSelectedGenre}
              gamesByGenre={gamesByGenre}
              ownedCardsByGame={ownedCardsByGame}
            />

            {/* Vertical scroll of game card rows below the selected genre */}
            <div className="flex-1 overflow-y-auto mt-2" style={{ scrollbarWidth: 'none' }}>
              {gamesInGenre.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-8">No games in this genre.</p>
              ) : (
                gamesInGenre.map((game) => {
                  const cards = cardsByGameId[game.id] || [];
                  const owned = ownedCardsByGame[game.title] || ownedCardsByGame[game.id] || [];
                  return (
                    <div key={game.id} className="mb-4">
                      {/* Game label row */}
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                        {game.cover_image ? (
                          <img src={game.cover_image} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
                        ) : (
                          <Gamepad2 className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                        )}
                        <span className="text-white/70 text-xs font-bold uppercase tracking-wide truncate">{game.title}</span>
                        <span className={`text-[9px] ${owned.length > 0 ? 'text-cyan-400/60' : 'text-white/25'}`}>
                          {owned.length > 0 ? `${owned.length} unlocked` : 'Not played'}
                        </span>
                        <div className="flex-1 h-px bg-white/5 ml-2" />
                      </div>
                      {/* Horizontal card scroll */}
                      <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                        {cards.map((card, idx) => (
                          <div key={card.id || idx} className="flex-shrink-0 w-[100px]">
                            <CardTile card={card} onClick={() => card._owned && setDetailCard(card)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Card detail modal (blurred background) ── */}
      <AnimatePresence>
        {detailCard && (
          <CardDetailModal
            card={detailCard}
            achievements={gameAchievements}
            loadingAchievements={loadingAchievements}
            gameTitle={detailCard?._gameTitle}
            onClose={() => setDetailCard(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Individual card tile (owned / locked / placeholder question-mark) ──
function CardTile({ card, onClick }) {
  const rs = rarityStyle(card._rarity);
  const TypeIcon = CARD_TYPE_ICON[card._type] || Star;

  // Question-mark placeholder card
  if (card._placeholder) {
    return (
      <div
        className="relative rounded-lg border border-white/8 overflow-hidden opacity-50"
        style={{ background: 'rgba(255,255,255,0.015)' }}
      >
        <div className="aspect-[3/4] flex items-center justify-center">
          <HelpCircle className="w-8 h-8 text-white/20" />
        </div>
        <div className="p-1.5">
          <p className="text-[9px] font-semibold text-white/30 truncate">???</p>
          <p className="text-[7px] text-white/15 uppercase">Locked</p>
        </div>
      </div>
    );
  }

  // Owned or locked card
  return (
    <button
      onClick={onClick}
      disabled={!card._owned}
      className={`group relative rounded-lg border ${rs.border} ${card._owned ? rs.glow + ' cursor-pointer hover:scale-[1.04]' : 'opacity-40 cursor-not-allowed'} transition-all overflow-hidden`}
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
}

// ── XMB-style horizontal genre bar ──
function GenreBar({ genres, selectedGenre, onSelect, gamesByGenre, ownedCardsByGame }) {
  const scrollRef = useRef(null);

  // Auto-scroll the selected genre into center view
  useEffect(() => {
    if (!scrollRef.current || !selectedGenre) return;
    const el = scrollRef.current.querySelector(`[data-genre="${selectedGenre}"]`);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedGenre]);

  if (genres.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <p className="text-white/30 text-xs">No games found in catalog.</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-1 overflow-x-auto rounded-xl border border-white/8 p-1.5"
      style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', scrollbarWidth: 'none' }}
    >
      {genres.map((g) => {
        const ownedInGenre = (gamesByGenre[g] || []).filter(game =>
          (ownedCardsByGame[game.title] || ownedCardsByGame[game.id] || []).length > 0
        ).length;
        const isSelected = selectedGenre === g;
        return (
          <button
            key={g}
            data-genre={g}
            onClick={() => onSelect(g)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 ${
              isSelected
                ? 'bg-white/15 text-white shadow-[0_0_12px_rgba(255,255,255,0.12)] border border-white/15'
                : 'text-white/45 hover:text-white/80 hover:bg-white/5 border border-transparent'
            }`}
          >
            <span>{g}</span>
            {ownedInGenre > 0 && <span className="text-[8px] text-cyan-400/60">{ownedInGenre}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Blurred card detail modal ──
function CardDetailModal({ card, achievements, loadingAchievements, onClose, gameTitle }) {
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
        className={`relative w-full max-w-md rounded-2xl border ${rs.border} ${rs.glow} overflow-hidden flex flex-col max-h-[90vh]`}
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
            {card.game_name || card.game || gameTitle} · <span className="uppercase">{card.genre}</span>
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