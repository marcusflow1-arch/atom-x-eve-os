import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Trophy, Scroll, Star, Users, Target, Zap, Shield, BookOpen,
  Clock, Check, MessageSquare, ChevronDown, Eye, Award,
  Swords, Map, Flame, Lock, Unlock, TrendingUp, Heart, ArrowRight,
  Crown, Sparkles, Play, Lightbulb
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AchievementGuideTab from './AchievementGuideTab';

const generateQuests = (gameTitle, genreName) => {
  const questTypes = [
    { type: 'Story', icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/20', gradient: 'from-purple-500/20 to-purple-900/10' },
    { type: 'Combat', icon: Swords, color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', gradient: 'from-red-500/20 to-red-900/10' },
    { type: 'Exploration', icon: Map, color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/20', gradient: 'from-green-500/20 to-green-900/10' },
    { type: 'Challenge', icon: Target, color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/20', gradient: 'from-orange-500/20 to-orange-900/10' },
    { type: 'Daily', icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/20', gradient: 'from-cyan-500/20 to-cyan-900/10' },
    { type: 'Mastery', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/20', gradient: 'from-yellow-500/20 to-yellow-900/10' },
    { type: 'Co-op', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/20', gradient: 'from-blue-500/20 to-blue-900/10' },
    { type: 'Hidden', icon: Eye, color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/20', gradient: 'from-slate-500/20 to-slate-900/10' },
  ];

  const difficulties = ['Easy', 'Medium', 'Hard', 'Legendary'];
  const names = [
    `First Steps in ${gameTitle}`, `The ${genreName} Trial`, `Defeat the Guardian`,
    `Explore the Hidden Vault`, `Master the Elements`, `Complete Chapter 1`,
    `Win 10 Ranked Matches`, `Collect All Artifacts`, `Reach Max Level`,
    `Defeat a Boss Without Damage`, `Complete a Speedrun`, `Unlock All Abilities`,
    `Find Every Secret`, `Lead a Raid Party`, `Craft a Legendary Item`,
    `Complete All Side Quests`, `Survive the Gauntlet`, `Achieve S-Rank`,
    `The Final Challenge`, `Community Champion`
  ];

  return names.map((name, i) => {
    const qt = questTypes[i % questTypes.length];
    const diff = difficulties[i % difficulties.length];
    const isCompleted = Math.random() > 0.6;
    const communityCompletions = Math.floor(Math.random() * 2000) + 10;
    const communityGuides = Math.floor(Math.random() * 15);
    const xpReward = (i + 1) * 50 + Math.floor(Math.random() * 200);

    return {
      id: `quest-${i}`,
      name,
      type: qt.type,
      typeIcon: qt.icon,
      typeColor: qt.color,
      typeBg: qt.bg,
      typeBorder: qt.border,
      typeGradient: qt.gradient,
      difficulty: diff,
      xpReward,
      cardReward: Math.random() > 0.7 ? `${genreName} Card #${i + 1}` : null,
      isCompleted,
      description: `Complete this ${qt.type.toLowerCase()} quest to earn ${xpReward} ${genreName} XP and progress your mastery. ${diff === 'Legendary' ? 'Only the most dedicated players will succeed.' : ''}`,
      communityCompletions,
      communityGuides,
      communityRating: (Math.random() * 2 + 3).toFixed(1),
      estimatedTime: `${Math.floor(Math.random() * 120) + 10} min`,
      requirements: diff === 'Legendary' ? [`Level 15+ in ${genreName}`, 'Complete all Story quests'] : diff === 'Hard' ? [`Level 10+ in ${genreName}`] : [],
    };
  });
};

const diffColor = (d) => d === 'Legendary' ? 'text-yellow-400' : d === 'Hard' ? 'text-red-400' : d === 'Medium' ? 'text-orange-300' : 'text-emerald-400';
const diffBg = (d) => d === 'Legendary' ? 'bg-yellow-500/10 border-yellow-500/20' : d === 'Hard' ? 'bg-red-500/10 border-red-500/20' : d === 'Medium' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-emerald-500/10 border-emerald-500/20';

export default function GenreGameDetail({ game, genre, onClose }) {
  const [expandedQuest, setExpandedQuest] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState('quests');

  const quests = useMemo(() => generateQuests(game.title, genre.name), [game.title, genre.name]);

  const filteredQuests = useMemo(() => {
    if (filterType === 'all') return quests;
    if (filterType === 'completed') return quests.filter(q => q.isCompleted);
    if (filterType === 'available') return quests.filter(q => !q.isCompleted);
    return quests.filter(q => q.type.toLowerCase() === filterType);
  }, [quests, filterType]);

  const stats = useMemo(() => ({
    totalQuests: quests.length,
    completed: quests.filter(q => q.isCompleted).length,
    totalXP: quests.reduce((sum, q) => sum + q.xpReward, 0),
    earnedXP: quests.filter(q => q.isCompleted).reduce((sum, q) => sum + q.xpReward, 0),
    totalCards: quests.filter(q => q.cardReward).length,
    earnedCards: quests.filter(q => q.cardReward && q.isCompleted).length,
  }), [quests]);

  const questTypeFilters = ['all', 'Story', 'Combat', 'Exploration', 'Challenge', 'Daily', 'Mastery', 'Co-op', 'Hidden', 'completed', 'available'];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ═══ HERO BANNER ═══ */}
      <div className="relative flex-shrink-0 overflow-hidden">
        <div className="absolute inset-0">
          {game.banner_image || game.cover_image ? (
            <img src={game.banner_image || game.cover_image} alt="" className="w-full h-full object-cover opacity-30" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${genre.color} opacity-20`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080c12]/60 via-[#080c12]/80 to-[#080c12]" />
          <div className={`absolute inset-0 bg-gradient-to-r ${genre.color} opacity-[0.07]`} />
        </div>

        <div className="relative p-6 pb-0">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-20 h-28 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-2xl">
                {game.cover_image ? (
                  <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${genre.color}`} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-black text-white tracking-tight truncate">{game.title}</h1>
                <p className="text-white/40 text-sm mt-0.5 line-clamp-1">{game.description || `${genre.name} experience`}</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${genre.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.completed / stats.totalQuests) * 100}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-white/60 text-xs font-bold">{Math.round((stats.completed / stats.totalQuests) * 100)}%</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all flex-shrink-0 ml-4"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>

          {/* ═══ STAT CARDS ═══ */}
          <div className="grid grid-cols-4 gap-3 pb-5">
            {[
              { icon: Zap, color: 'text-cyan-400', gradBg: 'from-cyan-500/10 to-cyan-900/5', label: 'XP Earned', value: stats.earnedXP.toLocaleString(), sub: `${stats.totalXP.toLocaleString()} total`, pct: Math.round((stats.earnedXP / stats.totalXP) * 100) },
              { icon: Trophy, color: 'text-yellow-400', gradBg: 'from-yellow-500/10 to-yellow-900/5', label: 'Cards Unlocked', value: `${stats.earnedCards} / ${stats.totalCards}`, sub: 'achievement cards', pct: stats.totalCards > 0 ? Math.round((stats.earnedCards / stats.totalCards) * 100) : 0 },
              { icon: Scroll, color: 'text-purple-400', gradBg: 'from-purple-500/10 to-purple-900/5', label: 'Quests Done', value: `${stats.completed} / ${stats.totalQuests}`, sub: 'completed', pct: Math.round((stats.completed / stats.totalQuests) * 100) },
              { icon: Users, color: 'text-blue-400', gradBg: 'from-blue-500/10 to-blue-900/5', label: 'Community', value: `${(game.communityCompletions || 0).toLocaleString()}+`, sub: 'player completions', pct: null },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`relative p-4 rounded-2xl border border-white/6 overflow-hidden bg-gradient-to-br ${s.gradBg}`}
                style={{ backdropFilter: 'blur(16px)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-white/35 text-[10px] font-bold uppercase tracking-widest">{s.label}</span>
                </div>
                <div className="text-white text-xl font-black leading-none">{s.value}</div>
                <div className="text-white/20 text-[10px] mt-1">{s.sub}</div>
                {s.pct !== null && (
                  <div className="mt-2.5 h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${s.color.replace('text-', 'bg-')}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${s.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ TAB SWITCHER ═══ */}
      <div className="px-6 py-3 flex-shrink-0 border-t border-white/5" style={{ background: 'rgba(8,12,18,0.6)' }}>
        {/* Tab Buttons */}
        <div className="flex items-center gap-1 mb-3">
          <button
            onClick={() => setActiveTab('quests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              activeTab === 'quests'
                ? 'bg-white/10 border-white/15 text-white shadow-[0_0_12px_rgba(255,255,255,0.05)]'
                : 'bg-transparent border-transparent text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <Target className="w-4 h-4" />
            Quests & Challenges
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              activeTab === 'guide'
                ? 'bg-indigo-500/15 border-indigo-500/25 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                : 'bg-transparent border-transparent text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            Achievement Guide
          </button>
        </div>

        {/* Quest type filters — only visible on quests tab */}
        {activeTab === 'quests' && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {questTypeFilters.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type.toLowerCase())}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border ${
                  filterType === type.toLowerCase()
                    ? 'bg-white/12 border-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.05)]'
                    : 'bg-transparent border-transparent text-white/35 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                {type === 'all' ? 'All Quests' : type === 'completed' ? '✓ Completed' : type === 'available' ? '○ Available' : type}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <AnimatePresence mode="wait">
        {activeTab === 'quests' ? (
          <motion.div
            key="quests"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex-1 overflow-y-auto px-6 pb-8 pt-3"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filteredQuests.map((quest, qi) => (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(qi * 0.03, 0.3) }}
                  className={`group relative rounded-2xl border overflow-hidden transition-all cursor-pointer ${
                    expandedQuest === quest.id
                      ? 'border-white/15 col-span-1 lg:col-span-2'
                      : 'border-white/6 hover:border-white/12'
                  }`}
                  style={{ backdropFilter: 'blur(12px)' }}
                  onClick={() => setExpandedQuest(expandedQuest === quest.id ? null : quest.id)}
                >
                  <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${quest.typeGradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

                  <div className="p-4 flex items-center gap-4">
                    <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                      quest.isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : `bg-gradient-to-br ${quest.typeGradient} ${quest.typeBorder}`
                    }`}>
                      {quest.isCompleted ? (
                        <Check className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <quest.typeIcon className={`w-5 h-5 ${quest.typeColor}`} />
                      )}
                      {quest.cardReward && !quest.isCompleted && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                          <Sparkles className="w-2.5 h-2.5 text-black" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold truncate ${quest.isCompleted ? 'text-white/40 line-through' : 'text-white'}`}>
                        {quest.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={`${quest.typeBg} ${quest.typeColor} border ${quest.typeBorder} text-[9px] px-1.5 py-0 h-5`}>{quest.type}</Badge>
                        <Badge className={`${diffBg(quest.difficulty)} ${diffColor(quest.difficulty)} text-[9px] px-1.5 py-0 h-5`}>{quest.difficulty}</Badge>
                        {quest.cardReward && (
                          <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] px-1.5 py-0 h-5">
                            <Trophy className="w-2.5 h-2.5 mr-1" />Card
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-white font-bold text-sm">{quest.xpReward}</div>
                        <div className="text-white/25 text-[9px] uppercase tracking-wider">XP</div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="text-white/60 text-xs font-medium flex items-center gap-1 justify-end">
                          <Users className="w-3 h-3 text-white/30" />{quest.communityCompletions.toLocaleString()}
                        </div>
                        <div className="text-white/20 text-[9px]">cleared</div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-white/20 transition-transform ${expandedQuest === quest.id ? 'rotate-180 text-white/40' : ''}`} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedQuest === quest.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-5 pt-1 border-t border-white/5">
                          <p className="text-white/50 text-sm leading-relaxed mb-4">{quest.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-2.5">
                              <h5 className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Details</h5>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.025] border border-white/5">
                                  <span className="text-white/40 text-xs flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Time</span>
                                  <span className="text-white/80 text-xs font-semibold">{quest.estimatedTime}</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.025] border border-white/5">
                                  <span className="text-white/40 text-xs flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" />Reward</span>
                                  <span className="text-cyan-400 text-xs font-bold">{quest.xpReward} {genre.xpType}</span>
                                </div>
                                {quest.cardReward && (
                                  <div className="p-2.5 rounded-xl bg-yellow-500/5 border border-yellow-500/10 flex items-center gap-2.5">
                                    <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                    <div>
                                      <div className="text-[9px] text-yellow-400/60 font-bold uppercase">Card Reward</div>
                                      <div className="text-xs text-yellow-300 font-semibold">{quest.cardReward}</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {quest.requirements.length > 0 && (
                                <div className="space-y-1.5 mt-3">
                                  <h5 className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Requirements</h5>
                                  {quest.requirements.map((req, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-white/40 p-2 rounded-lg bg-white/[0.015] border border-white/5">
                                      <Lock className="w-3 h-3 text-white/20 flex-shrink-0" />
                                      <span>{req}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="space-y-2.5">
                              <h5 className="text-white/30 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <Users className="w-3 h-3" />Community
                              </h5>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { v: quest.communityCompletions.toLocaleString(), l: 'Cleared', icon: Check, c: 'text-emerald-400' },
                                  { v: quest.communityRating, l: 'Rating', icon: Star, c: 'text-yellow-400' },
                                  { v: quest.communityGuides, l: 'Guides', icon: BookOpen, c: 'text-blue-400' },
                                ].map((ci, i) => (
                                  <div key={i} className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                    <ci.icon className={`w-4 h-4 ${ci.c} mx-auto mb-1.5`} />
                                    <div className="text-white text-base font-black">{ci.v}</div>
                                    <div className="text-white/25 text-[9px] mt-0.5">{ci.l}</div>
                                  </div>
                                ))}
                              </div>
                              {quest.communityGuides > 0 && (
                                <motion.div
                                  whileHover={{ x: 4 }}
                                  className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 cursor-pointer hover:bg-blue-500/8 transition-all"
                                >
                                  <MessageSquare className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                  <div className="flex-1">
                                    <div className="text-blue-300 text-xs font-semibold">
                                      {quest.communityGuides} player guide{quest.communityGuides > 1 ? 's' : ''} available
                                    </div>
                                    <div className="text-blue-400/40 text-[10px]">See how others completed this quest</div>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-blue-400/40" />
                                </motion.div>
                              )}
                            </div>

                            <div className="flex flex-col gap-3">
                              <h5 className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Status</h5>
                              <div className={`flex-1 rounded-2xl border p-5 flex flex-col items-center justify-center text-center gap-3 ${
                                quest.isCompleted ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-white/[0.02] border-white/5'
                              }`}>
                                {quest.isCompleted ? (
                                  <>
                                    <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                                      <Check className="w-7 h-7 text-emerald-400" />
                                    </div>
                                    <div>
                                      <div className="text-emerald-400 font-bold text-sm">Completed</div>
                                      <div className="text-white/25 text-[10px] mt-0.5">+{quest.xpReward} XP earned</div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className={`w-14 h-14 rounded-full ${quest.typeBg} border ${quest.typeBorder} flex items-center justify-center`}>
                                      <Play className={`w-6 h-6 ${quest.typeColor}`} />
                                    </div>
                                    <div>
                                      <div className="text-white font-bold text-sm">Ready to Start</div>
                                      <div className="text-white/25 text-[10px] mt-0.5">{quest.estimatedTime} estimated</div>
                                    </div>
                                    <button className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all hover:scale-[1.02] active:scale-[0.98] ${quest.typeBg} ${quest.typeBorder} ${quest.typeColor}`}>
                                      Begin Quest
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              {filteredQuests.length === 0 && (
                <div className="col-span-2 text-center py-16 text-white/20">
                  <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No quests match this filter</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="guide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex-1 overflow-hidden"
          >
            <AchievementGuideTab game={game} genre={genre} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}