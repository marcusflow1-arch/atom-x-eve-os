import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Camera, BookOpen, Sparkles, ChevronUp, ChevronDown, X } from 'lucide-react';
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
    demo: 'The viewer represents the opening combat moment and positioning for the unlock.'
  },
  {
    id: 'ghost-run',
    name: 'Ghost Run',
    rarity: 'Epic',
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
    demo: 'The viewer demonstration highlights stealth movement and clean route selection.'
  },
  {
    id: 'vault-master',
    name: 'Vault Master',
    rarity: 'Legendary',
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
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'none' }}>
        <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)] gap-5 min-h-full">
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-cyan-300" />
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">Achievement List</p>
              </div>
              <div className="space-y-2">
                {ACHIEVEMENTS.map((achievement) => (
                  <button
                    key={achievement.id}
                    onClick={() => {
                      setSelectedId(achievement.id);
                      setCurrentShot(0);
                    }}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition-all ${
                      selectedAchievement.id === achievement.id
                        ? 'border-yellow-400/30 bg-yellow-500/10'
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/10'
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{achievement.name}</p>
                    <p className="text-[11px] text-white/40 mt-1 line-clamp-2">{achievement.summary}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 min-w-0">
            <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4 items-start">
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="p-3 border-b border-white/5">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-yellow-400/70">3D Demo</p>
                </div>
                <div className="achievement-viewer h-[190px] bg-black/30" style={viewerCardStyle}>
                  <AdvancedModel3DViewer modelUrl={DEMO_MODEL} />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0a0e14] via-transparent to-transparent" />
                </div>
                <div className="p-3 border-t border-white/5">
                  <p className="text-xs text-white/65 leading-relaxed">{selectedAchievement.demo}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-white">{selectedAchievement.name}</h2>
                  <Badge className={rarityClasses[selectedAchievement.rarity]}>{selectedAchievement.rarity}</Badge>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl bg-black/20 border border-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2">Rundown</p>
                    <p className="text-sm text-white/75 leading-relaxed">{selectedAchievement.summary}</p>
                  </div>
                  <div className="rounded-xl bg-black/20 border border-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2">Definition</p>
                    <p className="text-sm text-white/75 leading-relaxed">{selectedAchievement.definition}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">Helpful Tips</p>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {selectedAchievement.tips.map((tip) => (
                  <div key={tip} className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/75 leading-relaxed">
                    {tip}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-4 h-4 text-violet-300" />
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">Screenshots</p>
              </div>
              <div className="grid lg:grid-cols-[minmax(0,1fr)_120px] gap-4">
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/30 aspect-[16/9]">
                  <img
                    src={selectedAchievement.screenshots[currentShot]}
                    alt={selectedAchievement.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex lg:flex-col gap-3 overflow-auto">
                  {selectedAchievement.screenshots.map((shot, index) => (
                    <button
                      key={shot}
                      onClick={() => setCurrentShot(index)}
                      className={`rounded-xl overflow-hidden border flex-shrink-0 h-20 lg:h-24 w-24 lg:w-full ${
                        currentShot === index ? 'border-yellow-400/40' : 'border-white/10'
                      }`}
                    >
                      <img src={shot} alt={`shot-${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/45 mb-3">More Achievements</p>
              <div className="flex items-center gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {ACHIEVEMENTS.map((achievement) => (
                  <button
                    key={`${achievement.id}-footer`}
                    onClick={() => {
                      setSelectedId(achievement.id);
                      setCurrentShot(0);
                    }}
                    className={`min-w-[180px] rounded-xl border px-4 py-3 text-left ${
                      selectedAchievement.id === achievement.id
                        ? 'border-yellow-400/30 bg-yellow-500/10'
                        : 'border-white/10 bg-black/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">{achievement.name}</span>
                      {selectedAchievement.id === achievement.id ? <ChevronUp className="w-4 h-4 text-yellow-300" /> : <ChevronDown className="w-4 h-4 text-white/25" />}
                    </div>
                    <p className="text-[11px] text-white/40 mt-1">{achievement.rarity} achievement guide</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}