import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Trophy, Scroll, Star, Users, Target, Zap, Shield, BookOpen,
  Clock, Check, MessageSquare, ChevronDown, ChevronUp, Eye, Award,
  Swords, Map, Flame, Lock, Unlock, TrendingUp, Heart, ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Generate mock quests for a game
const generateQuests = (gameTitle, genreName) => {
  const questTypes = [
    { type: 'Story', icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/20' },
    { type: 'Combat', icon: Swords, color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20' },
    { type: 'Exploration', icon: Map, color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/20' },
    { type: 'Challenge', icon: Target, color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/20' },
    { type: 'Daily', icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/20' },
    { type: 'Mastery', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/20' },
    { type: 'Co-op', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/20' },
    { type: 'Hidden', icon: Eye, color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/20' },
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

import { Crown } from 'lucide-react';

export default function GenreGameDetail({ game, genre, onClose }) {
  const [activeTab, setActiveTab] = useState('quests');
  const [expandedQuest, setExpandedQuest] = useState(null);
  const [filterType, setFilterType] = useState('all');

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
  }), [quests]);

  const questTypes = ['all', 'Story', 'Combat', 'Exploration', 'Challenge', 'Daily', 'Mastery', 'Co-op', 'Hidden', 'completed', 'available'];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-white/6 flex-shrink-0">
        <div className="flex items-start gap-4">
          {/* Game cover */}
          <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
            {game.cover_image ? (
              <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-white text-lg font-bold tracking-tight truncate">{game.title}</h2>
            <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{game.description}</p>

            {/* Quick Stats Row */}
            <div className="flex items-center gap-4 mt-2.5">
              <div className="flex items-center gap-1.5">
                <Scroll className="w-3.5 h-3.5 text-white/50" />
                <span className="text-white/70 text-xs font-medium">{stats.totalQuests} quests</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-400/70" />
                <span className="text-yellow-400/70 text-xs font-medium">{game.achievementCards} cards</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400/70" />
                <span className="text-cyan-400/70 text-xs font-medium">{stats.totalXP.toLocaleString()} XP</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all flex-shrink-0"
          >
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${genre.color}`}
              initial={{ width: 0 }}
              animate={{ width: `${(stats.completed / stats.totalQuests) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className="text-white/50 text-xs font-mono">{stats.completed}/{stats.totalQuests}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 p-4 flex-shrink-0">
        {[
          { label: 'XP Earned', value: stats.earnedXP.toLocaleString(), sub: `of ${stats.totalXP.toLocaleString()}`, icon: Zap, color: 'text-cyan-400' },
          { label: 'Cards Available', value: stats.totalCards, sub: 'achievement cards', icon: Trophy, color: 'text-yellow-400' },
          { label: 'Community', value: `${game.communityCompletions}+`, sub: 'completions', icon: Users, color: 'text-blue-400' },
        ].map((stat, i) => (
          <div
            key={i}
            className="p-3 rounded-xl border border-white/5"
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-white text-lg font-bold leading-none">{stat.value}</div>
            <div className="text-white/25 text-[10px] mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Quest Type Filters */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {questTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type.toLowerCase())}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all border ${
                filterType === type.toLowerCase()
                  ? 'bg-white/12 border-white/15 text-white'
                  : 'bg-transparent border-transparent text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              {type === 'all' ? 'All' : type === 'completed' ? '✓ Done' : type === 'available' ? '○ Available' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Quest List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
        {filteredQuests.map((quest) => (
          <motion.div
            key={quest.id}
            layout
            className={`rounded-xl border transition-all ${
              expandedQuest === quest.id
                ? 'border-white/12 bg-white/[0.04]'
                : 'border-white/5 bg-white/[0.015] hover:bg-white/[0.03] hover:border-white/8'
            }`}
            style={{
              backdropFilter: 'blur(10px)',
            }}
          >
            {/* Quest Header Row */}
            <button
              onClick={() => setExpandedQuest(expandedQuest === quest.id ? null : quest.id)}
              className="w-full flex items-center gap-3 p-3.5 text-left"
            >
              {/* Status Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                quest.isCompleted ? 'bg-green-500/15 border border-green-500/20' : `${quest.typeBg} border ${quest.typeBorder}`
              }`}>
                {quest.isCompleted ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <quest.typeIcon className={`w-4 h-4 ${quest.typeColor}`} />
                )}
              </div>

              {/* Quest Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-semibold truncate ${quest.isCompleted ? 'text-white/50 line-through' : 'text-white/90'}`}>
                    {quest.name}
                  </h4>
                </div>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <span className={`text-[10px] font-bold ${quest.typeColor}`}>{quest.type}</span>
                  <span className="text-white/20 text-[10px]">•</span>
                  <span className={`text-[10px] font-medium ${
                    quest.difficulty === 'Legendary' ? 'text-yellow-400' :
                    quest.difficulty === 'Hard' ? 'text-red-400' :
                    quest.difficulty === 'Medium' ? 'text-orange-400' : 'text-green-400'
                  }`}>{quest.difficulty}</span>
                  <span className="text-white/20 text-[10px]">•</span>
                  <span className="text-cyan-400/60 text-[10px] font-medium">{quest.xpReward} XP</span>
                </div>
              </div>

              {/* Reward indicator */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {quest.cardReward && (
                  <div className="w-6 h-6 rounded bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center" title="Card reward">
                    <Trophy className="w-3 h-3 text-yellow-400" />
                  </div>
                )}
                {expandedQuest === quest.id ? (
                  <ChevronUp className="w-4 h-4 text-white/30" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/20" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
              {expandedQuest === quest.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3.5 pb-4 space-y-3 border-t border-white/5 pt-3">
                    {/* Description */}
                    <p className="text-white/50 text-xs leading-relaxed">{quest.description}</p>

                    {/* Requirements */}
                    {quest.requirements.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider">Requirements</span>
                        {quest.requirements.map((req, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-white/40">
                            <Lock className="w-3 h-3 text-white/20" />
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-white/[0.025] border border-white/5">
                        <div className="text-[10px] text-white/30 mb-0.5">Estimated Time</div>
                        <div className="text-xs text-white/70 font-medium flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-white/40" />{quest.estimatedTime}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.025] border border-white/5">
                        <div className="text-[10px] text-white/30 mb-0.5">XP Reward</div>
                        <div className="text-xs text-cyan-400 font-bold flex items-center gap-1.5">
                          <Zap className="w-3 h-3" />{quest.xpReward} {genre.xpType}
                        </div>
                      </div>
                    </div>

                    {quest.cardReward && (
                      <div className="p-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/10 flex items-center gap-2.5">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <div>
                          <div className="text-[10px] text-yellow-400/60 font-bold uppercase">Card Reward</div>
                          <div className="text-xs text-yellow-300 font-medium">{quest.cardReward}</div>
                        </div>
                      </div>
                    )}

                    {/* Community Section */}
                    <div className="border-t border-white/5 pt-3 space-y-2">
                      <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3 h-3" /> Community Insights
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/5">
                          <div className="text-white/80 text-sm font-bold">{quest.communityCompletions.toLocaleString()}</div>
                          <div className="text-white/30 text-[9px]">Completions</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/5">
                          <div className="text-white/80 text-sm font-bold flex items-center justify-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{quest.communityRating}
                          </div>
                          <div className="text-white/30 text-[9px]">Rating</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/5">
                          <div className="text-white/80 text-sm font-bold">{quest.communityGuides}</div>
                          <div className="text-white/30 text-[9px]">Guides</div>
                        </div>
                      </div>

                      {quest.communityGuides > 0 && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/10 cursor-pointer hover:bg-blue-500/8 transition-all">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-blue-300 text-[11px] font-medium">
                            {quest.communityGuides} player{quest.communityGuides > 1 ? 's' : ''} shared how they completed this
                          </span>
                          <ArrowRight className="w-3 h-3 text-blue-400/50 ml-auto" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {filteredQuests.length === 0 && (
          <div className="text-center py-12 text-white/25">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No quests match this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}