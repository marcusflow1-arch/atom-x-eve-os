import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Trophy, Zap, Clock, Target, BookOpen, Star,
  Lock, Play, Radio, Gamepad2, Crown, Swords, Shield, Sparkles,
} from 'lucide-react';
import QuestCard from './QuestCard';
import { getGameData } from './gameProgressData';

// Circular progress ring
function ProgressRing({ pct, size = 56, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.10)" strokeWidth={stroke} fill="none" />
        <motion.circle cx={size/2} cy={size/2} r={r} stroke="url(#ringGrad)" strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }} />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black text-white tabular-nums">{pct}%</span>
      </div>
    </div>
  );
}

// Inline stat in the ribbon
function RibbonStat({ icon: Icon, value, label, tint, last }) {
  return (
    <div className="flex items-center gap-1.5 px-3">
      <Icon className={`w-3.5 h-3.5 ${tint}`} />
      <div className="leading-none">
        <p className="text-sm font-black text-white tabular-nums">{value}</p>
        <p className="text-[7px] text-white/40 uppercase tracking-wider mt-0.5">{label}</p>
      </div>
      {!last && <div className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-px bg-white/8" />}
    </div>
  );
}

export default function GamePageView({ game, friendData, onOpenFriend, onBackToSelf }) {
  const [tab, setTab] = useState('loadout'); // 'loadout' | 'quests' | 'awards'
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
  const thumb = game?.thumb || cover;

  const TABS = [
    { id: 'loadout', label: 'Loadout', icon: Swords },
    { id: 'quests', label: 'Quests', icon: Target },
    { id: 'awards', label: 'Awards', icon: Trophy },
  ];

  return (
    <motion.div
      key={isFriendView ? `friend-${friendData.name}` : `game-${game?.id}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col"
    >
      {/* ══════ CINEMATIC HERO ══════ */}
      <div className="relative flex-shrink-0 h-32 overflow-hidden">
        {cover && (
          <motion.img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,10,17,0.30) 0%, rgba(7,10,17,0.55) 45%, rgba(7,10,17,0.98) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(7,10,17,0.65) 0%, transparent 55%, rgba(7,10,17,0.4) 100%)' }} />

        {/* Top row: tag + actions */}
        <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white/70 border border-white/15" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
            {game?.genre || 'Game'}
          </span>
          {isFriendView && (
            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase bg-cyan-500/25 text-cyan-200 border border-cyan-400/40" style={{ backdropFilter: 'blur(8px)' }}>
              {friendData.name}'s run
            </span>
          )}
          <div className="flex items-center gap-1.5 ml-auto">
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-black text-[10px] font-black hover:bg-white/90 transition-colors shadow-lg">
              <Play className="w-2.5 h-2.5 fill-current" /> Play
            </button>
            <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-purple-200 hover:bg-purple-500/30 transition-colors border border-purple-400/40" style={{ background: 'rgba(126,34,206,0.25)', backdropFilter: 'blur(8px)' }}>
              <Radio className="w-2.5 h-2.5" /> Stream
            </button>
          </div>
        </div>

        {/* Bottom row: title + ring */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-end gap-3">
          <div className="w-12 h-14 rounded-md overflow-hidden flex-shrink-0 border border-white/20 shadow-xl">
            {thumb ? <img src={thumb} alt={game?.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center bg-white/5"><Gamepad2 className="w-4 h-4 text-white/40" /></div>}
          </div>
          <div className="flex-1 min-w-0 pb-0.5">
            <h2 className="text-2xl font-black text-white tracking-tight leading-none drop-shadow-lg truncate">{game?.title}</h2>
            <p className="text-[10px] text-white/60 mt-1 truncate">{isFriendView ? `${friendData.name}'s save` : storyAct} · {storyChapter}</p>
          </div>
          <ProgressRing pct={progress} />
        </div>
      </div>

      {/* ══════ GLASS STAT RIBBON ══════ */}
      <div className="relative flex-shrink-0 -mt-3 mx-3 rounded-xl overflow-hidden z-10 flex items-stretch"
        style={{ background: 'rgba(12,16,24,0.75)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
        <RibbonStat icon={Clock} value={playtime} label="Playtime" tint="text-blue-400" />
        <RibbonStat icon={Trophy} value={achievementsTotal} label="Awards" tint="text-amber-400" />
        <RibbonStat icon={Crown} value={`Lv.${level}`} label="Player" tint="text-purple-400" />
        <RibbonStat icon={Sparkles} value={`${gameData.genreLabel} ${genreLevel}`} label="Job" tint="text-cyan-400" last />
      </div>

      {/* ══════ TAB BAR ══════ */}
      <div className="flex-shrink-0 flex items-center gap-1 px-3 mt-3 mb-1">
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
                active ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
              style={active ? { background: 'rgba(255,255,255,0.06)', borderBottom: '2px solid #22d3ee' } : { borderBottom: '2px solid transparent' }}>
              <t.icon className="w-3 h-3" /> {t.label}
              {t.id === 'quests' && quests.active.length > 0 && (
                <span className="ml-0.5 px-1 rounded-full bg-cyan-500/30 text-cyan-200 text-[8px] font-black">{quests.active.length}</span>
              )}
            </button>
          );
        })}
        <div className="ml-auto text-[8px] text-white/25 uppercase tracking-widest">{showCardData ? 'Synced from Cards' : 'Friend preview'}</div>
      </div>

      {/* ══════ TAB BODY ══════ */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-3">
        <AnimatePresence mode="wait">
          {tab === 'loadout' && (
            <motion.div key="loadout" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-2.5">
              {/* Story arc banner */}
              <div className="relative rounded-xl overflow-hidden border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'linear-gradient(180deg, #22d3ee, #3b82f6)' }} />
                <div className="px-3.5 py-2.5 pl-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BookOpen className="w-3 h-3 text-cyan-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Story Arc</span>
                  </div>
                  <p className="text-sm font-bold text-white">{storyAct} <span className="text-white/30 font-normal">·</span> <span className="text-white/70">{storyChapter}</span></p>
                  <p className="text-[10px] text-white/45 mt-0.5 flex items-center gap-1"><Target className="w-2.5 h-2.5 text-cyan-400/60" /> {objective}</p>
                </div>
              </div>

              {/* Loadout grid */}
              {showCardData ? (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/35 mb-1.5 px-0.5">Equipped Loadout</p>
                  {cardFeed.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {cardFeed.map((card, i) => {
                        const isAbility = card.type === 'ability';
                        const isExpanded = isAbility && expandedAbility === card.name;
                        return (
                          <div key={`${card.type}-${card.name || card.label}-${i}`}
                            className="rounded-lg border border-white/8 hover:border-white/16 transition-all overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <div className="flex items-center gap-2 px-2.5 py-2">
                              <div className="w-9 h-9 rounded-md flex-shrink-0 flex items-center justify-center"
                                style={{ background: isAbility ? 'rgba(168,85,247,0.12)' : 'rgba(34,211,238,0.10)' }}>
                                {isAbility ? <Zap className="w-4 h-4 text-purple-400" /> : <Shield className="w-4 h-4 text-cyan-400" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                {isAbility ? (
                                  <button onClick={() => setExpandedAbility(isExpanded ? null : card.name)} className="w-full flex items-center justify-between text-left">
                                    <span className="text-[11px] font-semibold text-white/90 truncate">{card.name}</span>
                                    <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                ) : (
                                  <span className="text-[11px] font-semibold text-white/90 truncate block">{card.value}</span>
                                )}
                                <p className="text-[9px] text-white/40 truncate">{isAbility ? `Rank ${card.rank}` : card.label}</p>
                              </div>
                            </div>
                            <AnimatePresence>
                              {isAbility && isExpanded && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <div className="px-2.5 pb-2 pt-0.5 border-t border-white/5">
                                    <p className="text-[10px] text-white/50">{card.desc}</p>
                                    <p className="text-[9px] text-white/30 mt-0.5">Cooldown · {card.cooldown}</p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-white/10 p-5 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <Lock className="w-5 h-5 text-white/15 mx-auto mb-1.5" />
                      <p className="text-[10px] text-white/35">No cards unlocked yet</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-white/8 p-4 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <Lock className="w-4 h-4 text-white/15 mx-auto mb-1" />
                  <p className="text-[10px] text-white/35">Loadout is private — sync from your Cards.</p>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'quests' && (
            <motion.div key="quests" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-2.5 pt-1">
              {quests.active.length > 0 && (
                <div>
                  <p className="text-[9px] text-cyan-400/60 uppercase tracking-wide mb-1.5 flex items-center gap-1 px-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Active · {quests.active.length}
                  </p>
                  <div className="space-y-1.5">{quests.active.map(q => <QuestCard key={q.id} quest={q} variant="active" />)}</div>
                </div>
              )}
              {quests.available.length > 0 && (
                <div>
                  <p className="text-[9px] text-white/35 uppercase tracking-wide mb-1.5 flex items-center gap-1 px-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30" /> Available · {quests.available.length}
                  </p>
                  <div className="space-y-1.5">{quests.available.map(q => <QuestCard key={q.id} quest={q} variant="available" />)}</div>
                </div>
              )}
              {quests.active.length === 0 && quests.available.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/10 p-6 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <Target className="w-5 h-5 text-white/15 mx-auto mb-1.5" />
                  <p className="text-[11px] text-white/35 italic">No quests available</p>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'awards' && (
            <motion.div key="awards" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-2.5 pt-1">
              {showCardData ? (
                <>
                  {/* Big achievement header */}
                  <div className="relative rounded-xl overflow-hidden border border-amber-400/20 p-3.5"
                    style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.10), rgba(249,115,22,0.06))' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400/25 to-orange-500/25 border border-amber-400/30 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-amber-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-white tabular-nums leading-none">{achievementsTotal}</span>
                          <span className="text-[10px] text-amber-300/70 font-bold">{achievementsPct}% complete</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-black/30 overflow-hidden mt-2">
                          <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #f59e0b, #f97316)' }}
                            initial={{ width: 0 }} animate={{ width: `${achievementsPct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Next achievement */}
                  <div className="rounded-xl border border-white/8 p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Star className="w-3 h-3 text-amber-400/70" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Next Up</span>
                    </div>
                    <p className="text-xs font-bold text-white/90 mb-1.5">{nextAchievement?.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${nextAchievement?.pct}%` }} />
                      </div>
                      <span className="text-[9px] text-white/50 tabular-nums font-bold">{nextAchievement?.pct}%</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-white/8 p-4 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <Lock className="w-4 h-4 text-white/15 mx-auto mb-1" />
                  <p className="text-[10px] text-white/35">Award details are private.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}