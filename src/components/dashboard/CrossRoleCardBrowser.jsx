import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  Trophy, X, Star, Loader2, Gamepad2, Heart, Zap, Shield, Users, Sparkles, ChevronRight
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';
import FriendHighlightsSlideshow from './FriendHighlightsSlideshow';

const RARITY_STYLES = {
  Common:    { border: 'border-slate-400/40',  glow: 'shadow-[0_0_8px_rgba(148,163,184,0.25)]',  badge: 'bg-slate-500/20 text-slate-300' },
  Uncommon:  { border: 'border-green-400/40',  glow: 'shadow-[0_0_10px_rgba(74,222,128,0.3)]',  badge: 'bg-green-500/20 text-green-300' },
  Rare:      { border: 'border-blue-400/50',   glow: 'shadow-[0_0_12px_rgba(96,165,250,0.35)]', badge: 'bg-blue-500/20 text-blue-300' },
  Epic:      { border: 'border-purple-400/50', glow: 'shadow-[0_0_14px_rgba(192,132,252,0.4)]', badge: 'bg-purple-500/20 text-purple-300' },
  Legendary: { border: 'border-amber-400/60',   glow: 'shadow-[0_0_16px_rgba(251,191,36,0.45)]', badge: 'bg-amber-500/20 text-amber-300' },
  Mythic:    { border: 'border-red-400/60',    glow: 'shadow-[0_0_18px_rgba(248,113,113,0.5)]', badge: 'bg-red-500/20 text-red-300' },
  Mythical:  { border: 'border-pink-400/60',   glow: 'shadow-[0_0_18px_rgba(244,114,182,0.5)]', badge: 'bg-pink-500/20 text-pink-300' },
  Unique:    { border: 'border-cyan-400/60',   glow: 'shadow-[0_0_18px_rgba(34,211,238,0.5)]',  badge: 'bg-cyan-500/20 text-cyan-300' },
};

const CARD_TYPE_ICON = {
  Equipment: Shield, Ability: Zap, Companion: Users, Achievement: Trophy,
  Item: Gamepad2, Passive: Star, AI_Trait: Sparkles, AI_Teacher: Sparkles,
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function rarityStyle(rarity) {
  return RARITY_STYLES[rarity] || RARITY_STYLES.Common;
}

function relativeDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CrossRoleCardBrowser({ selectedFriend }) {
  const { user } = useAuth();
  const targetUserId = selectedFriend?.id || user?.id;
  const [userCards, setUserCards] = useState([]);
  const [games, setGames] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailCard, setDetailCard] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!targetUserId) { setLoading(false); return; }
      setLoading(true);
      try {
        const [cardsRes, gamesRes, achRes, uaRes] = await Promise.all([
          base44.entities.UserCard.filter({ user_id: targetUserId }),
          base44.entities.Game.list(),
          base44.entities.Achievement.list(),
          base44.entities.UserAchievement.filter({ user_id: targetUserId }),
        ]);
        if (cancelled) return;
        setUserCards(Array.isArray(cardsRes) ? cardsRes : (cardsRes?.data || []));
        setGames(Array.isArray(gamesRes) ? gamesRes : (gamesRes?.data || []));
        setAchievements(Array.isArray(achRes) ? achRes : (achRes?.data || []));
        setUserAchievements(Array.isArray(uaRes) ? uaRes : (uaRes?.data || []));
      } catch (e) {
        console.error('RecentlyPlayed fetch error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [targetUserId]);

  // Group all user cards by game
  const cardsByGame = useMemo(() => {
    const map = {};
    userCards.forEach((uc) => {
      const key = uc.game_id || uc.game_name;
      if (!key) return;
      if (!map[key]) map[key] = { gameId: uc.game_id, gameName: uc.game_name, genre: uc.genre, cards: [] };
      map[key].cards.push(uc);
    });
    return map;
  }, [userCards]);

  // Recently played: games with at least one unlock in last 7 days
  const recentlyPlayed = useMemo(() => {
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    const result = [];
    Object.values(cardsByGame).forEach((entry) => {
      const recent = entry.cards
        .filter((c) => c.unlocked_date && new Date(c.unlocked_date).getTime() >= cutoff)
        .sort((a, b) => new Date(b.unlocked_date) - new Date(a.unlocked_date));
      if (recent.length > 0) {
        result.push({ ...entry, recentUnlocks: recent, totalCards: entry.cards.length });
      }
    });
    return result.sort((a, b) =>
      new Date(b.recentUnlocks[0].unlocked_date) - new Date(a.recentUnlocks[0].unlocked_date)
    );
  }, [cardsByGame]);

  const gameMap = useMemo(() => {
    const m = {};
    games.forEach((g) => { m[g.id] = g; });
    return m;
  }, [games]);

  // Achievement progress per game name
  const achProgress = useMemo(() => {
    const totals = {};
    achievements.forEach((a) => { totals[a.game] = (totals[a.game] || 0) + 1; });
    const unlocked = {};
    userAchievements.forEach((ua) => {
      if (ua.status !== 'unlocked') return;
      const ach = achievements.find((a) => a.id === ua.achievement_id);
      if (ach) unlocked[ach.game] = (unlocked[ach.game] || 0) + 1;
    });
    return { totals, unlocked };
  }, [achievements, userAchievements]);

  const userName = user?.username || user?.full_name || user?.email?.split('@')[0];

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full pointer-events-auto p-8">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        <span className="ml-3 text-white/50 text-sm">Loading your journey…</span>
      </div>
    );
  }

  // ── Empty welcome state ──
  if (recentlyPlayed.length === 0) {
    return (
      <div className="pointer-events-auto flex flex-col items-center justify-center text-center py-10 px-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)' }}>
          <Heart className="w-7 h-7 text-cyan-400/70" />
        </div>
        <h3 className="text-white text-base font-bold mb-1">
          Welcome{userName ? `, ${userName}` : ''}!
        </h3>
        <p className="text-white/40 text-xs max-w-[220px] leading-relaxed">
          Your journey begins here. Play games and unlock achievements to see your progress light up here.
        </p>
      </div>
    );
  }

  const totalWeekUnlocks = recentlyPlayed.reduce((sum, g) => sum + g.recentUnlocks.length, 0);

  return (
    <div className="pointer-events-auto p-1" style={{ marginTop: '8px' }}>
      {/* Friend highlights slideshow */}
      <FriendHighlightsSlideshow selectedFriend={selectedFriend} />

      {/* White horizontal line */}
      <div className="w-full h-px bg-white/40 mb-2" />

      {/* Recently played progression cards */}
      <div className="overflow-y-auto space-y-1.5" style={{ height: 'calc(100vh - 460px)', minHeight: '130px', scrollbarWidth: 'none' }}>
        {recentlyPlayed.map((entry) => (
          <GameProgressionCard
            key={entry.gameId || entry.gameName}
            entry={entry}
            game={gameMap[entry.gameId]}
            achTotal={achProgress.totals[entry.gameName] || 0}
            achUnlocked={achProgress.unlocked[entry.gameName] || 0}
            onCardClick={setDetailCard}
          />
        ))}
      </div>

      {/* Card detail modal */}
      <AnimatePresence>
        {detailCard && (
          <CardDetailModal card={detailCard} onClose={() => setDetailCard(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── One game's progression strip ──
function GameProgressionCard({ entry, game, achTotal, achUnlocked, onCardClick }) {
  const cover = game?.cover_image;
  const genre = game?.genre || entry.genre || 'game';
  const title = game?.title || entry.gameName;
  // Journey: oldest → newest (left to right = forward progression)
  const journey = [...entry.recentUnlocks].reverse();
  const achPct = achTotal > 0 ? Math.round((achUnlocked / achTotal) * 100) : 0;

  return (
    <div className="rounded-xl border border-white/8 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.025)' }}>
      {/* Game header */}
      <div className="flex items-center gap-2 p-1.5">
        <div className="w-5 h-5 rounded-md overflow-hidden flex-shrink-0 border border-white/10">
          {cover ? (
            <img src={cover} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/5">
              <Gamepad2 className="w-2 h-2 text-white/30" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold truncate">{title}</p>
          <p className="text-white/40 text-[9px] uppercase tracking-wide">{genre}</p>
        </div>
        {/* Progress stats */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-center">
            <p className="text-cyan-300 text-sm font-bold leading-none">{entry.totalCards}</p>
            <p className="text-white/30 text-[7px] uppercase mt-0.5">Cards</p>
          </div>
          {achTotal > 0 && (
            <div className="text-center">
              <p className="text-amber-300 text-sm font-bold leading-none">{achUnlocked}<span className="text-white/30 text-[10px]">/{achTotal}</span></p>
              <p className="text-white/30 text-[7px] uppercase mt-0.5">Achv</p>
            </div>
          )}
        </div>
      </div>

      {/* Achievement progress bar */}
      {achTotal > 0 && (
        <div className="px-1.5 pb-1">
          <div className="h-1 rounded-full bg-white/8 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${achPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-amber-400/50 to-amber-300 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Journey timeline — A → B → C */}
      <div className="px-1.5 pb-1.5 pt-0.5">
        <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {journey.map((card, idx) => (
            <React.Fragment key={card.id || idx}>
              {idx > 0 && (
                <div className="flex-shrink-0 flex items-center">
                  <div className="w-1.5 h-px bg-white/20" />
                  <ChevronRight className="w-2 h-2 text-white/20 -ml-0.5" />
                </div>
              )}
              <UnlockNode card={card} onClick={() => onCardClick(card)} />
            </React.Fragment>
          ))}
          {/* Forward arrow suggesting continued journey */}
          <div className="flex-shrink-0 flex items-center pl-1">
            <ChevronRight className="w-4 h-4 text-white/15" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Single unlock node in the journey ──
function UnlockNode({ card, onClick }) {
  const rs = rarityStyle(card.card_rarity);
  const TypeIcon = CARD_TYPE_ICON[card.card_type] || Trophy;
  return (
    <button onClick={onClick} className="flex-shrink-0 w-[30px] flex flex-col items-center gap-0.5 group">
      <div className={`relative w-[30px] h-[40px] rounded-md border ${rs.border} ${rs.glow} overflow-hidden group-hover:scale-105 transition-transform`}
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        {card.card_image ? (
          <img src={card.card_image} alt={card.card_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <TypeIcon className="w-2.5 h-2.5 text-white/30" />
          </div>
        )}
        <span className={`absolute top-0.5 left-0.5 px-0.5 py-0 rounded text-[6px] font-bold uppercase ${rs.badge}`}>
          {card.card_rarity}
        </span>
      </div>
      <p className="text-white/70 text-[8px] font-semibold text-center truncate w-full leading-tight">{card.card_name}</p>
      <p className="text-cyan-400/50 text-[7px]">{relativeDate(card.unlocked_date)}</p>
    </button>
  );
}

// ── Card detail modal ──
function CardDetailModal({ card, onClose }) {
  const rs = rarityStyle(card.card_rarity);
  const TypeIcon = CARD_TYPE_ICON[card.card_type] || Trophy;
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
        className={`relative w-full max-w-sm rounded-2xl border ${rs.border} ${rs.glow} overflow-hidden flex flex-col max-h-[80vh]`}
        style={{ background: 'linear-gradient(160deg, rgba(20,24,35,0.96) 0%, rgba(10,14,22,0.98) 100%)' }}
      >
        <button onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors">
          <X className="w-4 h-4 text-white/60" />
        </button>

        <div className="relative h-40 overflow-hidden flex-shrink-0">
          {card.card_image ? (
            <img src={card.card_image} alt={card.card_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/5">
              <TypeIcon className="w-12 h-12 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e16] via-transparent to-transparent" />
          <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${rs.badge}`}>
            {card.card_rarity}
          </span>
        </div>

        <div className="p-4 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center gap-2 mb-1">
            <TypeIcon className={`w-4 h-4 ${rs.text || 'text-white/60'}`} />
            <span className="text-white/40 text-[10px] uppercase tracking-wide font-bold">{card.card_type}</span>
          </div>
          <h3 className="text-white text-xl font-bold mb-1">{card.card_name}</h3>
          <p className="text-white/50 text-xs mb-3">
            {card.game_name || card.game} · <span className="uppercase">{card.genre}</span>
          </p>

          {card.unlocked_date && (
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <Trophy className="w-3.5 h-3.5 text-amber-400/70" />
              <span>Unlocked {relativeDate(card.unlocked_date)}</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modal, document.body);
}