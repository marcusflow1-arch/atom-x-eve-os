import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Sparkles, ScrollText, Rocket, Newspaper, ArrowUpCircle, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ACHIEVEMENTS = [
  {
    id: 'first-blood',
    name: 'First Blood',
    rarity: 'Rare',
    gameLocation: 'Valorant · Ascent Mid and A Main opener routes',
    summary: 'Land the opening elimination before the opposing squad can react.',
    definition: 'A fast-start combat achievement that rewards first-engagement precision and timing.',
    tips: [
      'Push high-traffic lanes early.',
      'Use audio cues before peeking corners.',
      'Prioritize mobility over armor in the opener.'
    ],
    screenshots: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80'
    ],
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    demo: 'The viewer represents the opening combat moment and positioning for the unlock.'
  },
  {
    id: 'ghost-run',
    name: 'Ghost Run',
    rarity: 'Epic',
    gameLocation: 'Cyberpunk 2088 · Industrial District service tunnels',
    summary: 'Finish a mission undetected from entry to extraction.',
    definition: 'A stealth-focused achievement built around pathing, patience, and silent takedowns.',
    tips: [
      'Study patrol loops before moving.',
      'Disable cameras first.',
      'Use vertical routes to bypass choke points.'
    ],
    screenshots: [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80',
      'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=800&q=80'
    ],
    youtubeUrl: '',
    demo: 'The viewer demonstration highlights stealth movement and clean route selection.'
  },
  {
    id: 'vault-master',
    name: 'Vault Master',
    rarity: 'Legendary',
    gameLocation: 'Elden Ring · Sunken vault chain beneath the capital ruins',
    summary: 'Open every hidden vault in a single run without missing a key sequence.',
    definition: 'A mastery achievement for explorers who combine puzzle memory, routing, and timing.',
    tips: [
      'Memorize the vault order before starting.',
      'Collect all access shards first.',
      'Avoid optional fights that slow the route.'
    ],
    screenshots: [
      'https://images.unsplash.com/photo-1520034475321-cbe63696469a?w=800&q=80',
      'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80'
    ],
    youtubeUrl: '',
    demo: 'The viewer acts as a visual walkthrough for vault timing and interaction flow.'
  }
];

const rarityClasses = {
  Rare: 'text-sky-300 border-sky-400/30 bg-sky-500/10',
  Epic: 'text-fuchsia-300 border-fuchsia-400/30 bg-fuchsia-500/10',
  Legendary: 'text-amber-300 border-amber-400/30 bg-amber-500/10'
};

const QUESTS = [
  {
    id: 'rift',
    title: 'Main Quest: Into the Rift',
    status: 'In Progress',
    steps: [
      'Reach the lower district gate',
      'Scan the relay tower',
      'Return with the system log'
    ]
  },
  {
    id: 'signal',
    title: 'Side Quest: Signal Recovery',
    status: 'New',
    steps: [
      'Find beacon fragment one',
      'Find beacon fragment two',
      'Find beacon fragment three'
    ]
  },
  {
    id: 'elite',
    title: 'Weekly Task: Elite Sweep',
    status: 'Tracked',
    steps: [
      'Clear 5 elite encounters',
      'Collect weekly reward cache',
      'Report back before reset'
    ]
  }
];

export default function LibraryAchievementsUniverse({ onClose }) {
  const [selectedId, setSelectedId] = useState(ACHIEVEMENTS[0].id);
  const [currentShot, setCurrentShot] = useState(0);
  const [expandedQuestId, setExpandedQuestId] = useState(QUESTS[0].id);
  const selectedAchievement = useMemo(
    () => ACHIEVEMENTS.find((item) => item.id === selectedId) || ACHIEVEMENTS[0],
    [selectedId]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
      className="fixed z-[70] flex flex-col overflow-hidden"
      style={{
        left: '320px',
        right: '0px',
        top: '64px',
        bottom: '52px',
        background: 'rgba(10, 14, 20, 0.88)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderLeft: '1px solid rgba(250, 204, 21, 0.16)',
        boxShadow: '-6px 0 30px rgba(0,0,0,0.35)',
      }}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">Achievement Universe</span>
          </div>
          <p className="text-[11px] text-white/35 mt-1">Guides, screenshots, definitions, and a compact demo viewer.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'none' }}>
        <div className="space-y-6 min-h-full">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 border border-white/10 rounded-3xl overflow-hidden bg-white/[0.02]">
            <div className="p-5 md:p-6 border-b xl:border-b-0 xl:border-r border-white/10">
              <div className="flex items-center gap-3 mb-5">
                <ScrollText className="w-4 h-4 text-cyan-300" />
                <div>
                  <h3 className="text-lg font-bold text-white">Quests & System Updates</h3>
                  <p className="text-sm text-white/45">Quest details with simple dropdown sections.</p>
                </div>
              </div>

              <div>
                {QUESTS.map((quest) => {
                  const isOpen = expandedQuestId === quest.id;
                  return (
                    <div key={quest.id} className="border-b border-white/10 py-3 last:border-b-0">
                      <button
                        onClick={() => setExpandedQuestId(isOpen ? null : quest.id)}
                        className="w-full flex items-center justify-between gap-4 text-left"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{quest.title}</p>
                          <p className="text-xs text-white/35 mt-1">{quest.status}</p>
                        </div>
                        {isOpen ? <ChevronDown className="w-4 h-4 text-white/50" /> : <ChevronRight className="w-4 h-4 text-white/50" />}
                      </button>

                      {isOpen && (
                        <div className="mt-3 pl-0 space-y-2">
                          {quest.steps.map((step) => (
                            <p key={step} className="text-sm text-white/60">• {step}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
                {[
                  {
                    title: 'Patch 2.4 Content Update',
                    type: 'Patch Notes',
                    detail: 'New missions, balance tuning, and inventory quality-of-life improvements.'
                  },
                  {
                    title: 'Season Event Live',
                    type: 'Live Event',
                    detail: 'Limited-time rewards, rotating challenge board, and bonus XP weekend.'
                  }
                ].map((item) => (
                  <div key={item.title} className="border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Rocket className="w-3.5 h-3.5 text-violet-300" />
                      <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">{item.type}</span>
                    </div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-sm text-white/55 mt-1">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">Achievement Cards</h3>
                  <p className="text-sm text-white/45">Compact 4-card row with inline upgrade area.</p>
                </div>
                <Trophy className="w-4 h-4 text-amber-300" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ACHIEVEMENTS.map((achievement) => (
                  <button
                    key={achievement.id}
                    onClick={() => {
                      setSelectedId(achievement.id);
                      setCurrentShot(0);
                    }}
                    className={`text-left transition-all ${selectedAchievement.id === achievement.id ? 'opacity-100' : 'opacity-85 hover:opacity-100'}`}
                  >
                    <p className="text-xs font-medium text-white mb-2 truncate">{achievement.name}</p>
                    <div className={`aspect-[3/4] rounded-xl border flex items-center justify-center ${selectedAchievement.id === achievement.id ? 'border-amber-400/40 bg-amber-500/10' : 'border-white/10 bg-black/20'}`}>
                      <HelpCircle className="w-7 h-7 text-white/45" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedAchievement.name}</p>
                    <p className="text-xs text-white/40 mt-1">Mini card upgrade menu</p>
                  </div>
                  <Badge className={rarityClasses[selectedAchievement.rarity]}>{selectedAchievement.rarity}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="border-b border-white/10 pb-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/35 mb-1">Current Card</p>
                      <p className="text-sm text-white/70">Base achievement card frame</p>
                    </div>
                    <div className="border-b border-white/10 pb-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/35 mb-1">Upgrade Path</p>
                      <p className="text-sm text-white/70">Visual tier, stat bump, and card polish</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/35 mb-1">Required</p>
                      <p className="text-sm text-white/70">Materials, credits, and unlock progress</p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-4 border border-white/10 rounded-2xl p-4 bg-black/20">
                    <div>
                      <p className="text-sm text-white/75">This side now acts like a mini version of the card upgrade area.</p>
                      <p className="text-xs text-white/40 mt-2">Select any card above to switch this menu.</p>
                    </div>
                    <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/25 text-amber-200 font-medium transition-all">
                      <ArrowUpCircle className="w-4 h-4" />
                      Upgrade Card
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Newspaper className="w-5 h-5 text-cyan-300" />
              <div>
                <h3 className="text-xl font-bold text-white">Game Content</h3>
                <p className="text-sm text-white/45">Content and system updates displayed below the split view.</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: 'Content Drop: Neon District',
                  subtitle: 'News Release',
                  body: 'Explore a newly opened district with added encounters, vendors, and exploration rewards.'
                },
                {
                  title: 'Developer Update',
                  subtitle: 'System Update',
                  body: 'Combat pacing, loot tuning, and UI clarity updates were deployed for this game.'
                },
                {
                  title: 'Featured Content Roadmap',
                  subtitle: 'Upcoming Content',
                  body: 'Preview the next release wave with event rotations, card sets, and questline expansions.'
                }
              ].map((item) => (
                <div key={item.title} className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 mb-2">{item.subtitle}</p>
                  <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                  <p className="text-sm text-white/60 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}