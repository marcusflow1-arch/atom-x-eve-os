import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Search, Map, Flame, Shield, Swords, Star,
  ChevronDown, ChevronUp, Eye, EyeOff, Lightbulb, Target,
  Clock, Users, BookOpen, Zap, Lock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const generateAchievementGuides = (gameTitle, genreName) => {
  const categories = ['Story', 'Combat', 'Exploration', 'Collection', 'Mastery', 'Hidden', 'Challenge', 'Co-op'];
  const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythical'];
  const rarityColors = {
    Common: { text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
    Uncommon: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    Rare: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    Epic: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    Legendary: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    Mythical: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  };

  const achievementTemplates = [
    {
      name: 'Fire Sword',
      icon: '🔥',
      category: 'Combat',
      rarity: 'Legendary',
      hint: 'Reach the Molten Forge in the Volcano Zone (approx. Level 18+). Defeat the Fire Colossus boss and interact with the Ember Anvil. You must have 50+ kill streak before attempting.',
      level: 18,
      area: 'Volcano Zone — Molten Forge',
      steps: ['Reach Level 18', 'Enter Volcano Zone via the east mountain pass', 'Defeat Fire Colossus (boss)', 'Interact with the Ember Anvil'],
      communityRate: 12,
      estimatedTime: '3–5 hours',
      isHidden: false,
    },
    {
      name: 'Shadow Walker',
      icon: '🌑',
      category: 'Hidden',
      rarity: 'Mythical',
      hint: 'This is a secret achievement. Stay in stealth mode for 30 consecutive minutes without being detected. Best done in the Midnight Forest at night cycle.',
      level: 25,
      area: 'Midnight Forest',
      steps: ['Unlock stealth ability (Level 25)', 'Wait for night cycle (in-game clock 10PM–4AM)', 'Avoid all detection for 30 mins'],
      communityRate: 4,
      estimatedTime: '1–2 hours',
      isHidden: true,
    },
    {
      name: 'Master Craftsman',
      icon: '⚒️',
      category: 'Collection',
      rarity: 'Epic',
      hint: 'Craft 100 unique items across all categories. Visit every Blacksmith NPC in each major city. Some materials only drop from specific world bosses.',
      level: 10,
      area: 'Any Blacksmith — Multiple Zones',
      steps: ['Unlock Crafting (Level 10)', 'Collect materials from world bosses', 'Craft at least one item from every category'],
      communityRate: 28,
      estimatedTime: '8–12 hours',
      isHidden: false,
    },
    {
      name: 'Speed Demon',
      icon: '⚡',
      category: 'Challenge',
      rarity: 'Rare',
      hint: `Complete the ${gameTitle} main story in under 6 hours. Speedrun routes are available from the community. Skip cutscenes and avoid optional content.`,
      level: 1,
      area: 'Full Game',
      steps: ['Start a New Game', 'Skip optional quests', 'Use known shortcuts in each zone', 'Finish the final boss under 6 hours total'],
      communityRate: 7,
      estimatedTime: '6 hours (speedrun)',
      isHidden: false,
    },
    {
      name: 'Dragon Slayer',
      icon: '🐉',
      category: 'Combat',
      rarity: 'Legendary',
      hint: 'Defeat all 5 Ancient Dragons across the world. Each dragon unlocks after certain story milestones. The final one is accessible only after completing all side quests in the Eastern Realm.',
      level: 30,
      area: 'World Dragons — Various Zones',
      steps: ['Complete Act 2 (Dragon Peaks unlocked)', 'Defeat Dragon #1–4 in order', 'Complete Eastern Realm side quests', 'Defeat the Ancient Dragon King (Level 35 recommended)'],
      communityRate: 9,
      estimatedTime: '10–15 hours',
      isHidden: false,
    },
    {
      name: 'Cartographer',
      icon: '🗺️',
      category: 'Exploration',
      rarity: 'Uncommon',
      hint: 'Reveal 100% of the world map. Some areas require specific items or quests to access. The underground cave network is often missed — enter via the southern swamp.',
      level: 5,
      area: 'All Zones',
      steps: ['Explore each zone thoroughly', 'Find the Underground Cave (South Swamp entrance)', 'Complete the Forgotten Temple discovery quest'],
      communityRate: 45,
      estimatedTime: '15–20 hours',
      isHidden: false,
    },
    {
      name: 'Pacifist',
      icon: '☮️',
      category: 'Challenge',
      rarity: 'Mythical',
      hint: 'Complete the entire game without killing any enemy. Use stun, trap, and sneak abilities exclusively. Only the final boss requires a special non-lethal item to "defeat".',
      level: 1,
      area: 'Full Game',
      steps: ['Never land a killing blow', 'Use stun/trap-based build', 'Obtain the "Mercy Token" before the final boss'],
      communityRate: 2,
      estimatedTime: '20+ hours',
      isHidden: true,
    },
    {
      name: `${genreName} Legend`,
      icon: '👑',
      category: 'Mastery',
      rarity: 'Legendary',
      hint: `Reach the maximum mastery level in all ${genreName} skills. Requires completing every skill tree challenge and defeating all elite enemies at least once.`,
      level: 40,
      area: 'All Zones',
      steps: ['Max out all skill trees', 'Complete all elite enemy encounters', 'Reach Mastery Level 50'],
      communityRate: 5,
      estimatedTime: '25–40 hours',
      isHidden: false,
    },
  ];

  return achievementTemplates.map((t, i) => ({
    ...t,
    id: `ach-guide-${i}`,
    rarity: t.rarity,
    rarityStyle: rarityColors[t.rarity] || rarityColors.Common,
  }));
};

export default function AchievementGuideTab({ game, genre }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [showHidden, setShowHidden] = useState(false);

  const guides = useMemo(() => generateAchievementGuides(game.title, genre.name), [game.title, genre.name]);

  const filtered = useMemo(() => {
    let list = guides;
    if (!showHidden) list = list.filter(g => !g.isHidden);
    if (filter !== 'all') list = list.filter(g => g.category.toLowerCase() === filter.toLowerCase() || g.rarity.toLowerCase() === filter.toLowerCase());
    if (search.trim()) list = list.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || g.hint.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [guides, filter, search, showHidden]);

  const categories = ['all', 'Story', 'Combat', 'Exploration', 'Collection', 'Mastery', 'Hidden', 'Challenge', 'Co-op'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search + Controls */}
      <div className="px-6 pt-3 pb-3 flex-shrink-0 space-y-3 border-b border-white/5" style={{ background: 'rgba(8,12,18,0.5)' }}>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search achievements…"
              className="w-full bg-white/[0.04] border border-white/8 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/15 transition-all"
            />
          </div>
          <button
            onClick={() => setShowHidden(h => !h)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${showHidden ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' : 'bg-white/[0.03] border-white/8 text-white/35 hover:text-white/60'}`}
          >
            {showHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Hidden
          </button>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border ${
                filter === cat
                  ? 'bg-white/12 border-white/20 text-white'
                  : 'bg-transparent border-transparent text-white/35 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              {cat === 'all' ? 'All Achievements' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <div className="px-6 py-2.5 flex-shrink-0 flex items-center gap-2 border-b border-white/5" style={{ background: 'rgba(99,102,241,0.06)' }}>
        <Lightbulb className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
        <p className="text-[11px] text-indigo-300/70">
          These guides show approximate locations, levels, and steps to help you find each achievement. Not every achievement has a strict route — use these as a starting point.
        </p>
      </div>

      {/* Guide Cards */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/20">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No achievements match your search</p>
          </div>
        )}

        {filtered.map((ach, i) => (
          <motion.div
            key={ach.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.3) }}
            className={`rounded-2xl border overflow-hidden transition-all cursor-pointer ${
              expanded === ach.id ? 'border-white/15' : 'border-white/6 hover:border-white/12'
            }`}
            style={{ backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.02)' }}
            onClick={() => setExpanded(expanded === ach.id ? null : ach.id)}
          >
            {/* Card Header */}
            <div className="p-4 flex items-center gap-4">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border ${ach.rarityStyle.bg} ${ach.rarityStyle.border}`}>
                {ach.isHidden && !showHidden ? '❓' : ach.icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-white font-bold text-sm">{ach.isHidden && !showHidden ? '??? Hidden Achievement' : ach.name}</h4>
                  {ach.isHidden && (
                    <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] px-1.5 py-0 h-4">
                      <EyeOff className="w-2.5 h-2.5 mr-0.5" />Secret
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className={`${ach.rarityStyle.bg} ${ach.rarityStyle.text} border ${ach.rarityStyle.border} text-[9px] px-1.5 h-4`}>
                    {ach.rarity}
                  </Badge>
                  <Badge className="bg-white/5 text-white/40 border border-white/8 text-[9px] px-1.5 h-4">
                    {ach.category}
                  </Badge>
                  <span className="text-white/25 text-[10px] flex items-center gap-1">
                    <Target className="w-3 h-3" />Lv. {ach.level}+
                  </span>
                  <span className="text-white/25 text-[10px] flex items-center gap-1">
                    <Users className="w-3 h-3" />{ach.communityRate}% completed
                  </span>
                </div>
              </div>

              <ChevronDown className={`w-4 h-4 text-white/20 flex-shrink-0 transition-transform ${expanded === ach.id ? 'rotate-180 text-white/40' : ''}`} />
            </div>

            {/* Expanded Guide */}
            <AnimatePresence>
              {expanded === ach.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-5 pt-2 border-t border-white/5 space-y-4">
                    {/* Hint */}
                    <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-indigo-300/80 text-[10px] font-bold uppercase tracking-wider">Guide Hint</span>
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed">{ach.hint}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Steps */}
                      <div className="space-y-2">
                        <h5 className="text-white/30 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3" />Step-by-Step
                        </h5>
                        <div className="space-y-1.5">
                          {ach.steps.map((step, si) => (
                            <div key={si} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.025] border border-white/5">
                              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white/50 text-[10px] font-bold">{si + 1}</span>
                              </div>
                              <span className="text-white/55 text-xs leading-relaxed">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="space-y-2">
                        <h5 className="text-white/30 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <Map className="w-3 h-3" />Details
                        </h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.025] border border-white/5">
                            <span className="text-white/40 text-xs flex items-center gap-1.5"><Map className="w-3.5 h-3.5" />Location</span>
                            <span className="text-white/70 text-xs font-semibold text-right max-w-[150px]">{ach.area}</span>
                          </div>
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.025] border border-white/5">
                            <span className="text-white/40 text-xs flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" />Min. Level</span>
                            <span className="text-white/70 text-xs font-semibold">Level {ach.level}+</span>
                          </div>
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.025] border border-white/5">
                            <span className="text-white/40 text-xs flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Est. Time</span>
                            <span className="text-white/70 text-xs font-semibold">{ach.estimatedTime}</span>
                          </div>
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.025] border border-white/5">
                            <span className="text-white/40 text-xs flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Completion Rate</span>
                            <span className={`text-xs font-semibold ${ach.communityRate < 10 ? 'text-red-400' : ach.communityRate < 30 ? 'text-orange-400' : 'text-emerald-400'}`}>
                              {ach.communityRate}% of players
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}