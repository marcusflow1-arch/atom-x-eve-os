import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Trophy, Zap, Sword, Shield, Users, Target,
  TrendingUp, BookOpen, Crosshair, User, UserPlus,
} from 'lucide-react';
import QuestCard from './QuestCard';
import { getGameData } from './gameProgressData';

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <Icon className="w-3.5 h-3.5 text-cyan-400/70" />
      <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">{children}</h4>
      <div className="flex-1 h-px bg-white/8 ml-2" />
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-white/40">{label}</span>
      <span className="text-xs font-semibold text-white/85">{value}</span>
    </div>
  );
}

const FRIEND_SLOTS = 5;

export default function GameProgressHub({ game, friendData, onOpenFriend, onBackToSelf }) {
  const [showAllAbilities, setShowAllAbilities] = useState(false);
  const [expandedAbility, setExpandedAbility] = useState(null);

  // Per-game data — each game shows ONLY its own information
  const gameData = getGameData(game?.id);

  const isFriendView = !!friendData;

  // Friend view overrides progress-related fields; card data (equipment, abilities, achievements)
  // is user-only and does NOT show for friends
  const progress = isFriendView ? (friendData.progress ?? 0) : gameData.progress;
  const storyAct = isFriendView ? (friendData.storyAct ?? '—') : gameData.storyAct;
  const storyChapter = isFriendView ? (friendData.storyChapter ?? '—') : gameData.storyChapter;
  const objective = isFriendView ? (friendData.objective ?? '') : gameData.objective;
  const level = isFriendView ? (friendData.level ?? 0) : gameData.level;
  const genreLevel = isFriendView ? (friendData.genreLevel ?? 0) : gameData.genreLevel;
  const combatStyle = isFriendView ? (friendData.combatStyle ?? '—') : gameData.combatStyle;
  const playtime = isFriendView ? (friendData.playtime ?? '0h') : gameData.playtime;

  // Card-synced data — user only, never shown for friends
  const showCardData = !isFriendView;
  const equipment = gameData.equipment;
  const abilities = gameData.abilities;
  const achievementsTotal = gameData.achievements;
  const achievementsPct = gameData.achievementPct;
  const nextAchievement = gameData.nextAchievement;

  // Quests — per-game, shown for both user and friend (friend sees the same quest list)
  const quests = gameData.quests;

  // Friends — fill 5 slots, pad with empty "+" slots
  const friends = gameData.friends || [];
  const friendSlots = Array.from({ length: FRIEND_SLOTS }, (_, i) => friends[i] || null);

  return (
    <motion.div
      key={isFriendView ? `friend-${friendData.name}` : `game-${game?.id}`}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25 }}
      className="h-full overflow-y-auto scrollbar-hide"
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        {isFriendView && (
          <button
            onClick={onBackToSelf}
            className="flex items-center gap-1.5 text-[10px] text-cyan-400/70 hover:text-cyan-300 mb-2 transition-colors"
          >
            ← Back to my progress
          </button>
        )}
        <div className="flex items-center gap-3">
          {isFriendView && (
            <img src={friendData.avatar} alt={friendData.name} className="w-10 h-10 rounded-full border border-cyan-400/30" />
          )}
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">{game?.title}</h2>
            <p className="text-[10px] text-white/40">
              {isFriendView ? `${friendData.name}'s progress` : game?.genre}
            </p>
          </div>
        </div>
      </div>

      {/* ─── FRIEND BOXES — 5 slots at top with + signs ─── */}
      {!isFriendView && (
        <div className="px-5 py-3">
          <SectionLabel icon={Users}>Friends Playing This Game</SectionLabel>
          <div className="flex items-center gap-2">
            {friendSlots.map((friend, i) => (
              <button
                key={i}
                onClick={() => friend && onOpenFriend?.({
                  ...friend,
                  progress: gameData.progress > 10 ? gameData.progress - 15 + (i * 5) : 40 + i * 10,
                  storyAct: gameData.storyAct,
                  storyChapter: gameData.storyChapter,
                  objective: gameData.objective,
                  level: gameData.level + (i - 1) * 3,
                  genreLevel: gameData.genreLevel,
                  combatStyle: gameData.combatStyle,
                  playtime: `${Math.floor(Math.random() * 50) + 10}h`,
                })}
                className="relative flex flex-col items-center group"
              >
                {/* Plus sign above the box */}
                <div className="mb-1 w-4 h-4 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
                  {friend ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  ) : (
                    <UserPlus className="w-2.5 h-2.5 text-white/30" />
                  )}
                </div>
                {/* Friend avatar box */}
                <div
                  className={`w-11 h-11 rounded-xl border overflow-hidden transition-all ${
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
                      <UserPlus className="w-4 h-4 text-white/15" />
                    </div>
                  )}
                </div>
                {/* Name under box */}
                <span className="text-[8px] text-white/40 mt-1 max-w-[48px] truncate">
                  {friend ? friend.name : 'Add'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-5 pb-6 space-y-4">
        {/* ─── Progress ─── */}
        <div>
          <SectionLabel icon={TrendingUp}>Progress</SectionLabel>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full bg-white/8 overflow-hidden">
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
        </div>

        {/* ─── Story Progress ─── */}
        <div>
          <SectionLabel icon={BookOpen}>Current Story</SectionLabel>
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-white">{storyAct}</span>
              <span className="text-white/30">·</span>
              <span className="text-sm text-white/70">{storyChapter}</span>
            </div>
            <p className="text-[11px] text-white/45">{objective}</p>
          </div>
        </div>

        {/* ─── Genre Level ─── */}
        <div>
          <SectionLabel icon={Trophy}>Genre Level</SectionLabel>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/20 flex items-center justify-center">
              <span className="text-sm font-black text-cyan-300">{genreLevel}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/85">{gameData.genreLabel} Lv.{genreLevel}</p>
              <p className="text-[10px] text-white/40">{isFriendView ? `${friendData.name}'s genre rank` : 'Your genre rank'}</p>
            </div>
          </div>
        </div>

        {/* ─── Active Quest (dropdown) ─── */}
        <div>
          <SectionLabel icon={Crosshair}>Active Quest Log</SectionLabel>
          <div className="space-y-2">
            {quests.active.length > 0 ? (
              quests.active.map((q) => (
                <QuestCard key={q.id} quest={q} variant="active" />
              ))
            ) : (
              <p className="text-[11px] text-white/30 italic px-1">No active quests</p>
            )}
          </div>
        </div>

        {/* ─── Quest Offers (dropdown) ─── */}
        <div>
          <SectionLabel icon={Target}>Quest Offers</SectionLabel>
          <div className="space-y-2">
            {quests.available.length > 0 ? (
              quests.available.map((q) => (
                <QuestCard key={q.id} quest={q} variant="available" />
              ))
            ) : (
              <p className="text-[11px] text-white/30 italic px-1">No quests available</p>
            )}
          </div>
        </div>

        {/* ─── Character ─── */}
        <div>
          <SectionLabel icon={User}>Character</SectionLabel>
          <div className="grid grid-cols-2 gap-x-4">
            <StatRow label="Level" value={`Lv.${level}`} />
            <StatRow label="Genre Level" value={`${gameData.genreLabel} Lv.${genreLevel}`} />
            <StatRow label="Combat Style" value={combatStyle} />
            <StatRow label="Playtime" value={playtime} />
          </div>
        </div>

        {/* ─── Equipment (Card-synced, user only) ─── */}
        {showCardData && (
          <div>
            <SectionLabel icon={Sword}>Equipment</SectionLabel>
            <p className="text-[9px] text-white/25 mb-2">Synced from Cards</p>
            <div className="space-y-0">
              {equipment.map((eq) => (
                <div key={eq.label} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0">
                    <eq.icon className="w-3.5 h-3.5 text-white/50" />
                  </div>
                  <span className="text-[11px] text-white/40 flex-shrink-0 w-24">{eq.label}</span>
                  <span className="text-xs font-semibold text-white/85 truncate">{eq.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Abilities (Card-synced, user only, expandable) ─── */}
        {showCardData && (
          <div>
            <SectionLabel icon={Zap}>Abilities Unlocked</SectionLabel>
            <p className="text-[9px] text-white/25 mb-2">Synced from Cards</p>
            <div className="space-y-1">
              {abilities.length > 0 ? (
                abilities.slice(0, showAllAbilities ? undefined : 4).map((ab) => (
                  <div key={ab.name}>
                    <button
                      onClick={() => setExpandedAbility(expandedAbility === ab.name ? null : ab.name)}
                      className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <span className="text-xs font-medium text-white/80">{ab.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-white/30">Rank {ab.rank}</span>
                        <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${expandedAbility === ab.name ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedAbility === ab.name && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 pb-2 space-y-1">
                            <p className="text-[10px] text-white/45">{ab.desc}</p>
                            <p className="text-[10px] text-white/30">Cooldown: {ab.cooldown}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-white/30 italic px-1">No abilities unlocked yet</p>
              )}
            </div>
            {abilities.length > 4 && (
              <button
                onClick={() => setShowAllAbilities((p) => !p)}
                className="text-[10px] text-cyan-400/70 hover:text-cyan-300 mt-1 transition-colors"
              >
                {showAllAbilities ? 'Show less' : `Show all ${abilities.length} >`}
              </button>
            )}
          </div>
        )}

        {/* ─── Achievement Progress (Card-synced, user only) ─── */}
        {showCardData && (
          <div>
            <SectionLabel icon={Trophy}>Achievement Progress</SectionLabel>
            <p className="text-[9px] text-white/25 mb-2">Synced from Cards</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-black text-white">{achievementsTotal}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                style={{ width: `${achievementsPct}%` }}
              />
            </div>
            <p className="text-[10px] text-white/40">{achievementsPct}% complete</p>
            <div className="mt-2 rounded-lg bg-white/3 border border-white/8 p-2.5">
              <p className="text-[9px] text-white/30 uppercase tracking-wide mb-0.5">Next Achievement</p>
              <p className="text-xs font-semibold text-white/80">{nextAchievement.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${nextAchievement.pct}%` }} />
                </div>
                <span className="text-[9px] text-white/40">{nextAchievement.pct}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Friend view notice — card data is user-only */}
        {isFriendView && (
          <div className="rounded-lg bg-white/3 border border-white/8 p-3 text-center">
            <Shield className="w-4 h-4 text-white/20 mx-auto mb-1" />
            <p className="text-[10px] text-white/30">
              Equipment, abilities, and achievements are private — synced from your Cards only.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}