import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Trophy, Zap, Sword, Shield, Car, Cpu, Users, Target,
  TrendingUp, Clock, Star, Crosshair, User, BookOpen,
} from 'lucide-react';
import QuestCard from './QuestCard';

/**
 * Mock quest data — will be replaced by Cards backend (single source of truth)
 * once the plan is upgraded. Structure matches the spec.
 */
const MOCK_QUESTS = {
  active: [
    {
      id: 'ghost-town',
      title: 'Ghost Town',
      giver: 'Panam',
      difficulty: 3,
      status: 'tracking',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400',
      description: 'Panan has agreed to help. Travel to Sunset Motel and meet her there.',
      objective: 'Meet Panam at Sunset Motel',
      rewards: [
        { type: 'xp', label: '850 XP' },
        { type: 'weapon', label: 'Overwatch' },
        { type: 'money', label: '€$2,400' },
      ],
    },
  ],
  available: [
    {
      id: 'highwayman',
      title: 'The Highwayman',
      giver: 'Rogue',
      difficulty: 2,
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
      description: 'A mysterious figure is causing trouble on the outskirts. Investigate and report back.',
      objective: 'Investigate the Highwayman sightings',
      rewards: [
        { type: 'xp', label: '600 XP' },
        { type: 'money', label: '€$1,200' },
      ],
    },
    {
      id: 'beat-on-the-brat',
      title: 'Beat on the Brat',
      giver: 'Coach Fred',
      difficulty: 4,
      image: null,
      description: 'Prove yourself in the underground boxing ring. Win 3 consecutive fights.',
      objective: 'Win 3 boxing matches',
      rewards: [
        { type: 'xp', label: '1,200 XP' },
        { type: 'weapon', label: 'Legendary Knuckles' },
      ],
    },
  ],
};

const MOCK_EQUIPMENT = [
  { label: 'Equipped Weapon', value: 'Overwatch', icon: Sword },
  { label: 'Armor Set', value: 'Nomad Jacket', icon: Shield },
  { label: 'Vehicle', value: 'Type-66 "Hoon"', icon: Car },
  { label: 'Cyberware', value: '8 Installed', icon: Cpu },
];

const MOCK_ABILITIES = [
  { name: 'Dash', desc: 'Quick burst of movement', cooldown: '8s', rank: 3 },
  { name: 'Quick Hack', desc: 'Hack an enemy device remotely', cooldown: '12s', rank: 5 },
  { name: 'Double Jump', desc: 'Jump again mid-air', cooldown: 'Passive', rank: 2 },
  { name: 'Optical Camo', desc: 'Become invisible briefly', cooldown: '45s', rank: 4 },
];

const MOCK_FRIENDS_PLAYING = [
  { name: 'Marcus', avatar: 'https://i.pravatar.cc/100?u=marcus', detail: 'Act 3', status: 'online' },
  { name: 'James', avatar: 'https://i.pravatar.cc/100?u=james', detail: 'Level 51', status: 'online' },
  { name: 'Sarah', avatar: 'https://i.pravatar.cc/100?u=sarah', detail: 'Finished Story', status: 'online' },
];

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-3.5 h-3.5 text-cyan-400/70" />
      <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">{children}</h4>
      <div className="flex-1 h-px bg-white/8 ml-2" />
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[11px] text-white/40">{label}</span>
      <span className="text-xs font-semibold text-white/85">{value}</span>
    </div>
  );
}

export default function GameProgressHub({ game, friendData, onOpenFriend, onBackToSelf }) {
  const [showAllAbilities, setShowAllAbilities] = useState(false);
  const [expandedAbility, setExpandedAbility] = useState(null);

  // Friend view mode — swap all data to show friend's progress
  const isFriendView = !!friendData;

  const progress = isFriendView ? friendData.progress : (game.progress || 62);
  const storyAct = isFriendView ? friendData.storyAct : 'Act 2';
  const storyChapter = isFriendView ? friendData.storyChapter : 'Ghost Town';
  const objective = isFriendView ? friendData.objective : 'Meet Panam at Sunset Motel';

  const level = isFriendView ? friendData.level : 43;
  const genreLevel = isFriendView ? friendData.genreLevel : 7;
  const combatStyle = isFriendView ? friendData.combatStyle : 'Solo';

  const achievementsTotal = isFriendView ? friendData.achievements : '217 / 320';
  const achievementsPct = isFriendView ? friendData.achievementPct : 68;

  const equipment = isFriendView ? friendData.equipment : MOCK_EQUIPMENT;
  const abilities = isFriendView ? friendData.abilities : MOCK_ABILITIES;
  const friendsPlaying = MOCK_FRIENDS_PLAYING;

  return (
    <motion.div
      key={isFriendView ? `friend-${friendData.name}` : `game-${game.id}`}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25 }}
      className="h-full overflow-y-auto scrollbar-hide"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
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
            <h2 className="text-lg font-black text-white tracking-tight">{game.title}</h2>
            <p className="text-[10px] text-white/40">
              {isFriendView ? `${friendData.name}'s progress` : game.genre}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-6 space-y-5">
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
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-white">{storyAct}</span>
              <span className="text-white/30">·</span>
              <span className="text-sm text-white/70">{storyChapter}</span>
            </div>
            <p className="text-[11px] text-white/45">{objective}</p>
          </div>
        </div>

        {/* ─── Active Quest ─── */}
        <div>
          <SectionLabel icon={Crosshair}>Active Quest</SectionLabel>
          <div className="space-y-2">
            {MOCK_QUESTS.active.map((q) => (
              <QuestCard key={q.id} quest={q} variant="active" />
            ))}
          </div>
        </div>

        {/* ─── Quest Offers ─── */}
        <div>
          <SectionLabel icon={Target}>Quest Offers</SectionLabel>
          <div className="space-y-2">
            {MOCK_QUESTS.available.map((q) => (
              <QuestCard key={q.id} quest={q} variant="available" />
            ))}
          </div>
        </div>

        {/* ─── Character ─── */}
        <div>
          <SectionLabel icon={User}>Character</SectionLabel>
          <div className="grid grid-cols-2 gap-x-4">
            <StatRow label="Level" value={`Lv.${level}`} />
            <StatRow label="Genre Level" value={`RPG Lv.${genreLevel}`} />
            <StatRow label="Combat Style" value={combatStyle} />
            <StatRow label="Street Cred" value="50" />
            <StatRow label="Playtime" value={isFriendView ? friendData.playtime : '24.5h'} />
            <StatRow label="Completion" value={`${progress}%`} />
          </div>
        </div>

        {/* ─── Equipment ─── */}
        <div>
          <SectionLabel icon={Sword}>Equipment</SectionLabel>
          <p className="text-[9px] text-white/25 mb-2">Synced from Cards</p>
          <div className="space-y-0">
            {equipment.map((eq) => (
              <div key={eq.label} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0">
                  <eq.icon className="w-3.5 h-3.5 text-white/50" />
                </div>
                <span className="text-[11px] text-white/40 flex-shrink-0 w-24">{eq.label}</span>
                <span className="text-xs font-semibold text-white/85 truncate">{eq.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Abilities ─── */}
        <div>
          <SectionLabel icon={Zap}>Abilities Unlocked</SectionLabel>
          <p className="text-[9px] text-white/25 mb-2">Synced from Cards</p>
          <div className="space-y-1">
            {abilities.slice(0, showAllAbilities ? undefined : 4).map((ab) => (
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
            ))}
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

        {/* ─── Achievement Progress ─── */}
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
            <p className="text-xs font-semibold text-white/80">Complete every NCPD Scanner</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
                <div className="h-full bg-amber-400" style={{ width: '83%' }} />
              </div>
              <span className="text-[9px] text-white/40">83%</span>
            </div>
          </div>
        </div>

        {/* ─── Friends Playing ─── */}
        <div>
          <SectionLabel icon={Users}>Friends Playing</SectionLabel>
          <div className="space-y-1">
            {friendsPlaying.map((f) => (
              <button
                key={f.name}
                onClick={() => onOpenFriend?.(f)}
                className="w-full flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/5 transition-colors text-left"
              >
                <div className="relative flex-shrink-0">
                  <img src={f.avatar} alt={f.name} className="w-7 h-7 rounded-full border border-white/10" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border border-slate-900" />
                </div>
                <span className="text-xs font-medium text-white/80 flex-1">{f.name}</span>
                <span className="text-[10px] text-white/40">{f.detail}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}