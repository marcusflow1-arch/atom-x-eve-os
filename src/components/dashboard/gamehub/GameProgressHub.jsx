import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Trophy, Zap, Sword, Target, BookOpen,
  UserPlus, Home, Lock, Star, MapPin,
} from 'lucide-react';
import QuestCard from './QuestCard';
import { getGameData } from './gameProgressData';

const FRIEND_SLOTS = 5;

export default function GameProgressHub({ game, friendData, onOpenFriend, onBackToSelf }) {
  const [showAllAbilities, setShowAllAbilities] = useState(false);
  const [expandedAbility, setExpandedAbility] = useState(null);
  const cardScrollRef = useRef(null);

  const gameData = getGameData(game?.id);
  const isFriendView = !!friendData;

  // Progress/story — shows friend's data in friend view, user's data otherwise
  const progress = isFriendView ? (friendData.progress ?? 0) : gameData.progress;
  const storyAct = isFriendView ? (friendData.storyAct ?? '—') : gameData.storyAct;
  const storyChapter = isFriendView ? (friendData.storyChapter ?? '—') : gameData.storyChapter;
  const objective = isFriendView ? (friendData.objective ?? '') : gameData.objective;
  const level = isFriendView ? (friendData.level ?? 0) : gameData.level;
  const genreLevel = isFriendView ? (friendData.genreLevel ?? 0) : gameData.genreLevel;
  const combatStyle = isFriendView ? (friendData.combatStyle ?? '—') : gameData.combatStyle;
  const playtime = isFriendView ? (friendData.playtime ?? '0h') : gameData.playtime;

  // Card-synced data — user ONLY, never shown for friends
  const showCardData = !isFriendView;
  const equipment = gameData.equipment || [];
  const abilities = gameData.abilities || [];
  const achievementsTotal = gameData.achievements;
  const achievementsPct = gameData.achievementPct;
  const nextAchievement = gameData.nextAchievement;

  const quests = gameData.quests || { active: [], available: [] };

  // Combine cards (achievements, abilities, equipment) into one scroll feed
  const cardFeed = showCardData ? [
    ...equipment.map(eq => ({ type: 'equipment', ...eq })),
    ...abilities.map(ab => ({ type: 'ability', ...ab })),
  ] : [];

  // Friends — pad to 5 slots
  const friends = gameData.friends || [];
  const friendSlots = Array.from({ length: FRIEND_SLOTS }, (_, i) => friends[i] || null);

  // Home button handler
  const handleHome = () => {
    onBackToSelf?.();
  };

  // Click a friend → pass computed friend data
  const handleFriendClick = (friend, idx) => {
    if (!friend) return;
    onOpenFriend?.({
      ...friend,
      progress: Math.max(5, gameData.progress - 10 + idx * 7),
      storyAct: gameData.storyAct,
      storyChapter: gameData.storyChapter,
      objective: gameData.objective,
      level: Math.max(1, gameData.level + (idx - 1) * 4),
      genreLevel: gameData.genreLevel,
      combatStyle: gameData.combatStyle,
      playtime: `${Math.floor(Math.random() * 40) + 8}h`,
    });
  };

  return (
    <motion.div
      key={isFriendView ? `friend-${friendData.name}` : `game-${game?.id}`}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25 }}
      className="h-full flex flex-col"
    >
      {/* ═══ TOP BAR: 5 friend boxes + Home button ═══ */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6 flex-shrink-0">
        <span className="text-[9px] font-black uppercase tracking-widest text-white/30 mr-1">Friends</span>
        <div className="flex items-center gap-1.5">
          {friendSlots.map((friend, i) => (
            <button
              key={i}
              onClick={() => handleFriendClick(friend, i)}
              className="relative flex flex-col items-center group"
              title={friend ? friend.name : 'Add friend'}
            >
              {/* Plus sign above */}
              <div className="mb-0.5 w-3.5 h-3.5 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
                {friend ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                ) : (
                  <UserPlus className="w-2 h-2 text-white/25" />
                )}
              </div>
              {/* Avatar box */}
              <div
                className={`w-10 h-10 rounded-lg border overflow-hidden transition-all ${
                  friend
                    ? 'border-cyan-400/20 hover:border-cyan-400/50 hover:scale-105 cursor-pointer'
                    : 'border-dashed border-white/10 hover:border-white/25 cursor-pointer'
                }`}
                style={friend ? { background: 'rgba(255,255,255,0.04)' } : { background: 'rgba(255,255,255,0.02)' }}
              >
                {friend ? (
                  <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserPlus className="w-3.5 h-3.5 text-white/15" />
                  </div>
                )}
              </div>
              <span className="text-[7px] text-white/35 mt-0.5 max-w-[40px] truncate">
                {friend ? friend.name : ''}
              </span>
            </button>
          ))}
        </div>

        {/* Home button — to the right of the 5 boxes */}
        <button
          onClick={handleHome}
          className="ml-auto w-10 h-10 rounded-lg border border-white/10 hover:border-cyan-400/40 bg-white/5 hover:bg-cyan-500/10 flex items-center justify-center transition-all group"
          title="Back to my progress"
        >
          <Home className="w-4 h-4 text-white/50 group-hover:text-cyan-400 transition-colors" />
        </button>
      </div>

      {/* ═══ Scrollable content ═══ */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          {isFriendView && (
            <img src={friendData.avatar} alt={friendData.name} className="w-9 h-9 rounded-full border border-cyan-400/30 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <h2 className="text-base font-black text-white tracking-tight truncate">{game?.title}</h2>
            <p className="text-[10px] text-white/40">
              {isFriendView ? `${friendData.name}'s progress` : game?.genre}
            </p>
          </div>
        </div>

        {/* ─── Section: Progress bar ─── */}
        <div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #22d3ee, #3b82f6)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <span className="text-sm font-bold text-white tabular-nums">{progress}%</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xs font-bold text-white">{storyAct}</span>
            <span className="text-white/20">·</span>
            <span className="text-xs text-white/60">{storyChapter}</span>
          </div>
          <p className="text-[10px] text-white/40">{objective}</p>
        </div>

        {/* ─── Section: Genre / Job Level (small) ─── */}
        <div className="rounded-lg bg-white/4 border border-white/8 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/20 flex items-center justify-center">
                <span className="text-xs font-black text-cyan-300">{genreLevel}</span>
              </div>
              <div>
                <p className="text-[9px] text-white/30 uppercase tracking-wide">{gameData.genreLabel} Job</p>
                <p className="text-xs font-bold text-white/85">
                  {game?.title} <span className="text-white/30">·</span> {gameData.genreLabel} Lv.{genreLevel}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-white/30 uppercase">Player Lv</p>
              <p className="text-xs font-bold text-white/85">{level}</p>
            </div>
          </div>
        </div>

        {/* ─── Section: Card scroll (Achievements / Abilities / Equipment) — user only ─── */}
        {showCardData ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-400/70" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Cards · Abilities · Equipment
              </h4>
              <span className="text-[9px] text-white/25 ml-auto">Synced from Cards</span>
            </div>

            {/* Vertical scroll of cards */}
            {cardFeed.length > 0 ? (
              <div
                ref={cardScrollRef}
                className="space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-hide pr-1"
              >
                {cardFeed.map((card, i) => {
                  const isAbility = card.type === 'ability';
                  const Icon = card.icon || Zap;
                  const isExpanded = isAbility && expandedAbility === card.name;

                  return (
                    <div
                      key={`${card.type}-${card.name || card.label}-${i}`}
                      className="flex gap-2.5 rounded-lg bg-white/3 border border-white/6 hover:border-white/12 transition-all"
                    >
                      {/* Card thumbnail */}
                      <div className="w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
                        style={{ background: isAbility ? 'rgba(168,85,247,0.08)' : 'rgba(34,211,238,0.06)' }}
                      >
                        {isAbility ? (
                          <Zap className="w-5 h-5 text-purple-400/70" />
                        ) : (
                          <Icon className="w-5 h-5 text-cyan-400/70" />
                        )}
                      </div>

                      {/* Description to the right */}
                      <div className="flex-1 min-w-0 py-1.5 pr-2">
                        {isAbility ? (
                          <>
                            <button
                              onClick={() => setExpandedAbility(isExpanded ? null : card.name)}
                              className="w-full flex items-center justify-between text-left"
                            >
                              <span className="text-xs font-semibold text-white/85 truncate">{card.name}</span>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[8px] text-white/30">Rk {card.rank}</span>
                                <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </button>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <p className="text-[10px] text-white/45 mt-0.5">{card.desc}</p>
                                  <p className="text-[9px] text-white/25">Cooldown: {card.cooldown}</p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                            {!isExpanded && (
                              <p className="text-[10px] text-white/40 truncate mt-0.5">{card.desc}</p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-semibold text-white/85 truncate">{card.value}</p>
                            <p className="text-[10px] text-white/40">{card.label}</p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg bg-white/3 border border-dashed border-white/8 p-4 text-center">
                <Lock className="w-4 h-4 text-white/15 mx-auto mb-1" />
                <p className="text-[10px] text-white/30">No cards unlocked yet</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-white/3 border border-white/8 p-3 text-center">
            <Lock className="w-4 h-4 text-white/15 mx-auto mb-1" />
            <p className="text-[10px] text-white/30">
              Cards, abilities & equipment are private — synced from your Cards only.
            </p>
          </div>
        )}

        {/* ─── Section: Achievement progress (user only) ─── */}
        {showCardData && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-3.5 h-3.5 text-amber-400/70" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Achievement Progress</h4>
            </div>
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-xl font-black text-white">{achievementsTotal}</span>
              <span className="text-[10px] text-white/30">{achievementsPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                style={{ width: `${achievementsPct}%` }}
              />
            </div>
            <div className="rounded-lg bg-white/3 border border-white/8 p-2">
              <p className="text-[9px] text-white/30 uppercase tracking-wide mb-0.5">Next</p>
              <p className="text-[11px] font-semibold text-white/80">{nextAchievement?.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${nextAchievement?.pct}%` }} />
                </div>
                <span className="text-[9px] text-white/40">{nextAchievement?.pct}%</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── Section: Quest Log (scrollable dropdowns) ─── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-3.5 h-3.5 text-cyan-400/70" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Quest Log</h4>
          </div>

          {/* Active quests */}
          {quests.active.length > 0 && (
            <div className="mb-2">
              <p className="text-[9px] text-cyan-400/50 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Active
              </p>
              <div className="space-y-1.5">
                {quests.active.map(q => (
                  <QuestCard key={q.id} quest={q} variant="active" />
                ))}
              </div>
            </div>
          )}

          {/* Available quests */}
          {quests.available.length > 0 && (
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" /> Available
              </p>
              <div className="space-y-1.5">
                {quests.available.map(q => (
                  <QuestCard key={q.id} quest={q} variant="available" />
                ))}
              </div>
            </div>
          )}

          {quests.active.length === 0 && quests.available.length === 0 && (
            <p className="text-[11px] text-white/30 italic px-1">No quests available</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}