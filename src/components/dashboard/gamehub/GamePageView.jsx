import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Trophy, Zap, Clock, Target, BookOpen, Star,
  Lock, Play, Radio, Gamepad2, Crown,
} from 'lucide-react';
import QuestCard from './QuestCard';
import { getGameData } from './gameProgressData';

// Small stat tile
function StatTile({ icon: Icon, value, label, tint }) {
  return (
    <div className="flex-1 min-w-0 rounded-xl border border-white/8 px-2.5 py-2"
      style={{ background: 'rgba(255,255,255,0.035)' }}>
      <Icon className={`w-3.5 h-3.5 ${tint} mb-1`} />
      <p className="text-sm font-black text-white tabular-nums leading-none">{value}</p>
      <p className="text-[8px] text-white/35 uppercase tracking-wide mt-0.5 truncate">{label}</p>
    </div>
  );
}

export default function GamePageView({ game, friendData, onOpenFriend, onBackToSelf }) {
  const [expandedAbility, setExpandedAbility] = useState(null);

  const gameData = getGameData(game?.id);
  const isFriendView = !!friendData;

  const progress = isFriendView ? (friendData.progress ?? 0) : gameData.progress;
  const storyAct = isFriendView ? (friendData.storyAct ?? '—') : gameData.storyAct;
  const storyChapter = isFriendView ? (friendData.storyChapter ?? '—') : gameData.storyChapter;
  const objective = isFriendView ? (friendData.objective ?? '') : gameData.objective;
  const level = isFriendView ? (friendData.level ?? 0) : gameData.level;
  const genreLevel = isFriendView ? (friendData.genreLevel ?? 0) : gameData.genreLevel;
  const playtime = isFriendView ? (friendData.playtime ?? '0h') : gameData.playtime;

  const showCardData = !isFriendView;
  const equipment = gameData.equipment || [];
  const abilities = gameData.abilities || [];
  const achievementsTotal = gameData.achievements;
  const achievementsPct = gameData.achievementPct;
  const nextAchievement = gameData.nextAchievement;
  const quests = gameData.quests || { active: [], available: [] };

  const cardFeed = showCardData ? [
    ...equipment.map(eq => ({ type: 'equipment', ...eq })),
    ...abilities.map(ab => ({ type: 'ability', ...ab })),
  ] : [];

  const cover = game?.image || game?.thumb;

  return (
    <motion.div
      key={isFriendView ? `friend-${friendData.name}` : `game-${game?.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28 }}
      className="h-full flex flex-col"
    >
      {/* ══════ GAME HEADER ══════ */}
      <div className="relative flex-shrink-0 overflow-hidden">
        {/* Backdrop */}
        {cover && (
          <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 scale-110 blur-md" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,10,17,0.55) 0%, rgba(7,10,17,0.92) 100%)' }} />

        {/* Identity row */}
        <div className="relative flex items-center gap-3 px-4 pt-3 pb-3">
          <div className="w-14 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/15 shadow-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {cover ? <img src={game?.thumb || cover} alt={game?.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Gamepad2 className="w-5 h-5 text-white/30" /></div>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight truncate leading-tight">{game?.title}</h2>
              {isFriendView && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">{friendData.name}</span>
              )}
            </div>
            <p className="text-[10px] text-white/45 truncate">{isFriendView ? `${friendData.name}'s progress` : game?.genre}</p>
            {/* Quick action chips */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <button className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-black text-[10px] font-bold hover:bg-white/90 transition-colors">
                <Play className="w-2.5 h-2.5 fill-current" /> Play
              </button>
              <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-semibold hover:bg-purple-500/30 transition-colors border border-purple-500/30">
                <Radio className="w-2.5 h-2.5" /> Stream
              </button>
              <span className="ml-auto text-[9px] text-white/35 tabular-nums">{progress}% done</span>
            </div>
          </div>
        </div>

        {/* Progress line */}
        <div className="relative h-1 bg-white/8">
          <motion.div className="h-full" style={{ background: 'linear-gradient(90deg, #22d3ee, #3b82f6)' }}
            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
        </div>
      </div>

      {/* ══════ BODY ══════ */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 space-y-3">
        {/* Stat tiles */}
        <div className="flex gap-2">
          <StatTile icon={Clock} value={playtime} label="Playtime" tint="text-blue-400" />
          <StatTile icon={Trophy} value={achievementsTotal} label="Awards" tint="text-amber-400" />
          <StatTile icon={Crown} value={`Lv.${level}`} label="Player" tint="text-purple-400" />
          <StatTile icon={Target} value={`${progress}%`} label="Progress" tint="text-cyan-400" />
        </div>

        {/* Story progress */}
        <div className="rounded-xl border border-white/8 px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.035)' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <BookOpen className="w-3 h-3 text-cyan-400/70" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Story</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-bold text-white">{storyAct}</span>
            <span className="text-white/20">·</span>
            <span className="text-xs text-white/60">{storyChapter}</span>
          </div>
          <p className="text-[10px] text-white/40 mt-0.5">{objective}</p>
        </div>

        {/* Genre / Job level */}
        <div className="rounded-xl border border-white/8 px-3 py-2.5 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.035)' }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/25 flex items-center justify-center">
              <span className="text-xs font-black text-cyan-300">{genreLevel}</span>
            </div>
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-wide">{gameData.genreLabel} Job</p>
              <p className="text-xs font-bold text-white/85">{gameData.genreLabel} Lv.{genreLevel}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-white/30 uppercase">Player Lv</p>
            <p className="text-xs font-bold text-white/85">{level}</p>
          </div>
        </div>

        {/* Cards / Abilities / Equipment */}
        {showCardData ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-400/70" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Cards · Abilities · Equipment</h4>
              <span className="text-[9px] text-white/25 ml-auto">Synced</span>
            </div>
            {cardFeed.length > 0 ? (
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-hide pr-1">
                {cardFeed.map((card, i) => {
                  const isAbility = card.type === 'ability';
                  const Icon = card.icon || Zap;
                  const isExpanded = isAbility && expandedAbility === card.name;
                  return (
                    <div key={`${card.type}-${card.name || card.label}-${i}`}
                      className="flex gap-2.5 rounded-lg bg-white/3 border border-white/6 hover:border-white/12 transition-all">
                      <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
                        style={{ background: isAbility ? 'rgba(168,85,247,0.08)' : 'rgba(34,211,238,0.06)' }}>
                        {isAbility ? <Zap className="w-4 h-4 text-purple-400/70" /> : <Icon className="w-4 h-4 text-cyan-400/70" />}
                      </div>
                      <div className="flex-1 min-w-0 py-1.5 pr-2">
                        {isAbility ? (
                          <>
                            <button onClick={() => setExpandedAbility(isExpanded ? null : card.name)} className="w-full flex items-center justify-between text-left">
                              <span className="text-xs font-semibold text-white/85 truncate">{card.name}</span>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[8px] text-white/30">Rk {card.rank}</span>
                                <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </button>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <p className="text-[10px] text-white/45 mt-0.5">{card.desc}</p>
                                  <p className="text-[9px] text-white/25">Cooldown: {card.cooldown}</p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                            {!isExpanded && <p className="text-[10px] text-white/40 truncate mt-0.5">{card.desc}</p>}
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
            <p className="text-[10px] text-white/30">Cards, abilities & equipment are private — synced from your Cards only.</p>
          </div>
        )}

        {/* Achievement progress */}
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
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${achievementsPct}%` }} />
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

        {/* Quest Log */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-3.5 h-3.5 text-cyan-400/70" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Quest Log</h4>
          </div>
          {quests.active.length > 0 && (
            <div className="mb-2">
              <p className="text-[9px] text-cyan-400/50 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Active
              </p>
              <div className="space-y-1.5">{quests.active.map(q => <QuestCard key={q.id} quest={q} variant="active" />)}</div>
            </div>
          )}
          {quests.available.length > 0 && (
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" /> Available
              </p>
              <div className="space-y-1.5">{quests.available.map(q => <QuestCard key={q.id} quest={q} variant="available" />)}</div>
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