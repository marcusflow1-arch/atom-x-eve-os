import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Sparkles, ScrollText, Rocket, Newspaper, ArrowUpCircle } from 'lucide-react';
import AdvancedModel3DViewer from '@/components/3d/AdvancedModel3DViewer';
import { Badge } from '@/components/ui/badge';

const DEMO_MODEL = 'https://models.babylonjs.com/boombox.glb';

const viewerCardStyle = {
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden'
};

const viewerCanvasStyle = `
  .achievement-viewer canvas {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
  }
`;

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

export default function LibraryAchievementsUniverse({ onClose }) {
  const [selectedId, setSelectedId] = useState(ACHIEVEMENTS[0].id);
  const [currentShot, setCurrentShot] = useState(0);
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
      <style>{viewerCanvasStyle}</style>
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-cyan-400/15 bg-white/5 p-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
                  <ScrollText className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Quests & System Updates</h3>
                  <p className="text-sm text-white/45">Quest progress, mission updates, and game content updates.</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Main Quest: Into the Rift',
                    status: 'In Progress',
                    detail: 'Reach the lower district gate and scan the relay tower.',
                    update: 'Objective updated 2 hours ago'
                  },
                  {
                    title: 'Side Quest: Signal Recovery',
                    status: 'New',
                    detail: 'Recover three missing beacon fragments in the eastern zone.',
                    update: 'New quest added in the latest patch'
                  },
                  {
                    title: 'Weekly Task: Elite Sweep',
                    status: 'Tracked',
                    detail: 'Clear 5 elite enemy encounters before reset.',
                    update: 'Weekly refresh in 3 days'
                  }
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h4 className="text-white font-semibold">{item.title}</h4>
                      <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-400/20">{item.status}</Badge>
                    </div>
                    <p className="text-sm text-white/65 leading-relaxed">{item.detail}</p>
                    <p className="text-xs text-white/35 mt-3">{item.update}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
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
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Rocket className="w-4 h-4 text-violet-300" />
                      <span className="text-xs uppercase tracking-[0.2em] text-white/40">{item.type}</span>
                    </div>
                    <h4 className="text-white font-semibold">{item.title}</h4>
                    <p className="text-sm text-white/60 mt-2">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-400/15 bg-white/5 p-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Achievement Cards</h3>
                  <p className="text-sm text-white/45">Cards you own, cards you do not own, and card upgrades.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ACHIEVEMENTS.map((achievement) => (
                  <button
                    key={achievement.id}
                    onClick={() => {
                      setSelectedId(achievement.id);
                      setCurrentShot(0);
                    }}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      selectedAchievement.id === achievement.id
                        ? 'border-yellow-400/30 bg-yellow-500/10 shadow-[0_0_18px_rgba(250,204,21,0.08)]'
                        : 'border-white/10 bg-black/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-base font-semibold text-white">{achievement.name}</p>
                        <p className="text-xs text-white/40 mt-1 line-clamp-2">{achievement.summary}</p>
                      </div>
                      <Badge className={rarityClasses[achievement.rarity]}>{achievement.rarity}</Badge>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20 aspect-[16/10] mb-3">
                      <img
                        src={achievement.screenshots[0]}
                        alt={achievement.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={selectedAchievement.id === achievement.id ? 'text-amber-200' : 'text-white/35'}>
                        {achievement.id === 'ghost-run' || achievement.id === 'vault-master' ? 'Not owned' : 'Owned'}
                      </span>
                      <span className="text-white/35 flex items-center gap-1">
                        Upgrade <ArrowUpCircle className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p className="text-white font-semibold">{selectedAchievement.name}</p>
                    <p className="text-xs text-white/40 mt-1">Selected card action</p>
                  </div>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <p className="text-sm text-white/60 mb-4">Clicking a card gives you the option to upgrade that achievement card.</p>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/25 text-amber-200 font-medium transition-all">
                  <ArrowUpCircle className="w-4 h-4" />
                  Upgrade Card
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Newspaper className="w-5 h-5 text-cyan-300" />
              <div>
                <h3 className="text-xl font-bold text-white">Game Content</h3>
                <p className="text-sm text-white/45">News releases, system updates, and content for the game below the 50/50 split.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80 mb-2">{item.subtitle}</p>
                  <h4 className="text-white font-semibold mb-2">{item.title}</h4>
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