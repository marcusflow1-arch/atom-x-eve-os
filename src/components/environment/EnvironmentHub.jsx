import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Lock, Unlock, Check, ChevronRight, Star, Zap, Shield,
  ShoppingBag, Hammer, Swords, Trophy, TrendingUp, Sparkles, Map,
  X, Crown, Layers, Gift, ArrowUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import EnvironmentSelector from '@/components/avatarHome/EnvironmentSelector';

// ── Mock environment achievement data ──
const ENVIRONMENT_ACHIEVEMENTS = [
  {
    id: 'env_ach_1',
    title: 'Neon District',
    description: 'Complete 10 missions in Cyberpunk 2088 to unlock the Neon District environment.',
    game: 'Cyberpunk 2088',
    rarity: 'Epic',
    icon: '🌃',
    thumbnail: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&q=80',
    unlocked: true,
    progress: 100,
    environmentId: 'neon_district',
  },
  {
    id: 'env_ach_2',
    title: 'Dragon\'s Lair',
    description: 'Defeat the Ancient Dragon in Elden Ring to gain access to the Dragon\'s Lair.',
    game: 'Elden Ring',
    rarity: 'Legendary',
    icon: '🐉',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&q=80',
    unlocked: true,
    progress: 100,
    environmentId: 'dragons_lair',
  },
  {
    id: 'env_ach_3',
    title: 'Orbital Station',
    description: 'Reach Level 30 in Stellar Odyssey to unlock the Orbital Station.',
    game: 'Stellar Odyssey',
    rarity: 'Rare',
    icon: '🛸',
    thumbnail: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=600&q=80',
    unlocked: false,
    progress: 65,
    environmentId: 'orbital_station',
  },
  {
    id: 'env_ach_4',
    title: 'Shadow Throne',
    description: 'Complete the Shadow Realm storyline to unlock the Shadow Throne room.',
    game: 'Shadow Realm',
    rarity: 'Mythical',
    icon: '👑',
    thumbnail: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=600&q=80',
    unlocked: false,
    progress: 20,
    environmentId: 'shadow_throne',
  },
  {
    id: 'env_ach_5',
    title: 'Arcade Paradise',
    description: 'Win 100 matches across all games to unlock Arcade Paradise.',
    game: 'Cross-Game',
    rarity: 'Epic',
    icon: '🕹️',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80',
    unlocked: false,
    progress: 42,
    environmentId: 'arcade_paradise',
  },
];

// ── Environment features that can be unlocked via leveling ──
const ENV_FEATURES = [
  { id: 'shop', name: 'Shop', icon: ShoppingBag, levelReq: 1, description: 'Buy and sell items within your environment.' },
  { id: 'blacksmith', name: 'Blacksmith', icon: Hammer, levelReq: 3, description: 'Forge and upgrade equipment in 3D.' },
  { id: 'arena', name: 'Battle Arena', icon: Swords, levelReq: 5, description: 'Challenge AI enemies inside your world.' },
  { id: 'trophy_room', name: 'Trophy Room', icon: Trophy, levelReq: 7, description: 'Display your rarest achievements.' },
  { id: 'guild_hall', name: 'Guild Hall', icon: Crown, levelReq: 10, description: 'Invite clan members to your environment.' },
  { id: 'enchanting', name: 'Enchanting Table', icon: Sparkles, levelReq: 12, description: 'Apply enchantments to cards and gear.' },
  { id: 'vault', name: 'The Vault', icon: Shield, levelReq: 15, description: 'Secure storage for legendary items.' },
  { id: 'portal', name: 'Dimension Portal', icon: Layers, levelReq: 20, description: 'Travel between unlocked environments instantly.' },
];

// ── Rarity colors ──
const RARITY_STYLE = {
  Common: { text: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/30' },
  Uncommon: { text: 'text-green-300', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  Rare: { text: 'text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  Epic: { text: 'text-purple-300', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  Legendary: { text: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  Mythical: { text: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

// ── Sub-components ──
function EnvironmentAchievementCard({ ach, isSelected, onClick }) {
  const rs = RARITY_STYLE[ach.rarity] || RARITY_STYLE.Common;
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative flex-shrink-0 w-52 aspect-[4/5] rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
        isSelected ? `${rs.border} ring-2 ring-offset-0 shadow-lg` : 'border-white/10 hover:border-white/20'
      } ${!ach.unlocked ? 'grayscale-[40%]' : ''}`}
    >
      <img src={ach.thumbnail} alt={ach.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Lock overlay */}
      {!ach.unlocked && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <Lock className="w-8 h-8 text-white/30" />
        </div>
      )}

      {/* Badge: rarity */}
      <div className="absolute top-2 left-2 z-20">
        <Badge className={`text-[9px] border ${rs.bg} ${rs.text} ${rs.border}`}>{ach.rarity}</Badge>
      </div>

      {/* Unlocked check */}
      {ach.unlocked && (
        <div className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
        <span className="text-2xl block mb-1">{ach.icon}</span>
        <h4 className="text-white font-bold text-sm truncate">{ach.title}</h4>
        <p className="text-white/50 text-[10px] truncate">{ach.game}</p>

        {/* Progress bar */}
        {!ach.unlocked && (
          <div className="mt-2">
            <div className="flex justify-between text-[9px] mb-0.5">
              <span className="text-white/40">Progress</span>
              <span className="text-white/60 font-bold">{ach.progress}%</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all" style={{ width: `${ach.progress}%` }} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function FeatureUnlockCard({ feature, envLevel, onClick }) {
  const isUnlocked = envLevel >= feature.levelReq;
  const Icon = feature.icon;

  return (
    <motion.div
      whileHover={isUnlocked ? { scale: 1.03, y: -2 } : {}}
      onClick={() => isUnlocked && onClick?.(feature)}
      className={`relative p-4 rounded-xl border transition-all ${
        isUnlocked
          ? 'border-white/15 bg-white/5 cursor-pointer hover:border-cyan-400/40 hover:bg-cyan-500/5'
          : 'border-white/5 bg-white/[0.02] cursor-not-allowed opacity-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isUnlocked ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-white/5 border border-white/10'}`}>
          {isUnlocked ? <Icon className="w-5 h-5 text-cyan-400" /> : <Lock className="w-4 h-4 text-white/30" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-bold text-sm ${isUnlocked ? 'text-white' : 'text-white/40'}`}>{feature.name}</h4>
            {!isUnlocked && (
              <Badge className="text-[8px] bg-white/5 border-white/10 text-white/40">Lv {feature.levelReq}</Badge>
            )}
          </div>
          <p className={`text-[10px] ${isUnlocked ? 'text-white/50' : 'text-white/25'}`}>{feature.description}</p>
        </div>
        {isUnlocked && <ChevronRight className="w-4 h-4 text-white/30" />}
      </div>
    </motion.div>
  );
}

// ── Main EnvironmentHub Component ──
export default function EnvironmentHub({ currentEnvId, onSelectEnv, onClose }) {
  const [selectedAch, setSelectedAch] = useState(null);
  const [activeTab, setActiveTab] = useState('environments'); // 'environments' | 'features' | 'selector'

  // Mock environment level & XP (would be stored per-user in production)
  const [envLevel] = useState(7);
  const [envXP] = useState(2400);
  const xpForNextLevel = 3000;
  const xpProgress = Math.round((envXP / xpForNextLevel) * 100);

  const unlockedCount = ENVIRONMENT_ACHIEVEMENTS.filter(a => a.unlocked).length;
  const unlockedFeatures = ENV_FEATURES.filter(f => envLevel >= f.levelReq).length;

  const tabs = [
    { id: 'environments', label: 'Environments', icon: Map },
    { id: 'features', label: 'Features', icon: Gift },
    { id: 'selector', label: '3D Viewer', icon: Globe },
  ];

  return (
    <div className="flex flex-col h-full max-h-[80vh] overflow-hidden">
      {/* Header with leveling */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-cyan-400" />
          <div>
            <h3 className="text-white font-bold text-xl">Environment Hub</h3>
            <p className="text-white/40 text-xs">{unlockedCount} environments · {unlockedFeatures} features unlocked</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Level badge */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-400 flex items-center justify-center bg-cyan-500/10">
                <span className="text-cyan-300 font-black text-lg">{envLevel}</span>
              </div>
              {/* XP ring */}
              <svg className="absolute inset-0 w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="21" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                <circle cx="24" cy="24" r="21" fill="none" stroke="#22d3ee" strokeWidth="2"
                  strokeDasharray={`${(xpProgress / 100) * 132} 132`} strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-white text-xs font-bold">Level {envLevel}</p>
              <p className="text-white/40 text-[10px]">{envXP}/{xpForNextLevel} XP</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* XP Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-white/40">Environment XP</span>
          <div className="flex items-center gap-1.5">
            <ArrowUp className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 font-bold">+150 from last session</span>
          </div>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full"
          />
        </div>
        {/* Next unlock preview */}
        {(() => {
          const nextFeature = ENV_FEATURES.find(f => f.levelReq > envLevel);
          if (!nextFeature) return null;
          return (
            <p className="text-[10px] text-white/30 mt-1.5">
              Next unlock at Lv {nextFeature.levelReq}: <span className="text-white/50 font-medium">{nextFeature.name}</span>
            </p>
          );
        })()}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white border border-white/15'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'environments' && (
            <motion.div key="envs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Achievement cards scroll */}
              <div>
                <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-3">Environment Achievements</h4>
                <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
                  {ENVIRONMENT_ACHIEVEMENTS.map(ach => (
                    <EnvironmentAchievementCard
                      key={ach.id}
                      ach={ach}
                      isSelected={selectedAch?.id === ach.id}
                      onClick={() => setSelectedAch(selectedAch?.id === ach.id ? null : ach)}
                    />
                  ))}
                </div>
              </div>

              {/* Selected achievement detail */}
              <AnimatePresence>
                {selectedAch && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 rounded-xl border border-white/10 bg-white/[0.03]">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                          <img src={selectedAch.thumbnail} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{selectedAch.icon}</span>
                            <h3 className="text-white font-bold text-lg">{selectedAch.title}</h3>
                            {selectedAch.unlocked && (
                              <Badge className="text-[9px] bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Unlocked</Badge>
                            )}
                          </div>
                          <p className="text-white/50 text-sm mb-2">{selectedAch.description}</p>
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="text-white/40">Game: <span className="text-white/70">{selectedAch.game}</span></span>
                            <span className="text-white/40">Rarity: <span className={(RARITY_STYLE[selectedAch.rarity] || {}).text}>{selectedAch.rarity}</span></span>
                          </div>
                          {selectedAch.unlocked ? (
                            <button
                              onClick={() => setActiveTab('selector')}
                              className="mt-3 px-4 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-bold hover:bg-cyan-500/30 transition-all flex items-center gap-2"
                            >
                              <Globe className="w-3.5 h-3.5" /> Apply Environment
                            </button>
                          ) : (
                            <div className="mt-3">
                              <div className="flex justify-between text-[9px] mb-1">
                                <span className="text-white/40">Progress</span>
                                <span className="text-white/60 font-bold">{selectedAch.progress}%</span>
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" style={{ width: `${selectedAch.progress}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'features' && (
            <motion.div key="feats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Unlockable Features</h4>
                <span className="text-[10px] text-white/30">{unlockedFeatures}/{ENV_FEATURES.length} unlocked</span>
              </div>
              <p className="text-white/40 text-xs mb-4">
                Level up your environment to unlock features inside the 3D world. Each feature lets you do things you'd normally do in the hub — but immersively.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ENV_FEATURES.map(feature => (
                  <FeatureUnlockCard
                    key={feature.id}
                    feature={feature}
                    envLevel={envLevel}
                    onClick={(f) => console.log('Open feature:', f.name)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'selector' && (
            <motion.div key="sel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EnvironmentSelector
                currentEnvId={currentEnvId}
                onSelect={(env) => {
                  onSelectEnv?.(env);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}