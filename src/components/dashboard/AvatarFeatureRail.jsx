import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy, Swords, Sparkles, Radio, Crown, Gamepad2, Globe } from 'lucide-react';
import { glassCard } from './avatarFocus/SectionShell';
import QuestSection from './avatarFocus/sections/QuestSection';
import BattleSection from './avatarFocus/sections/BattleSection';
import StorySection from './avatarFocus/sections/StorySection';
import LiveSection from './avatarFocus/sections/LiveSection';
import RanksSection from './avatarFocus/sections/RanksSection';
import GamesSection from './avatarFocus/sections/GamesSection';
import WorldsSection from './avatarFocus/sections/WorldsSection';

const SECTIONS = [
  { id: 'quest', label: 'Quest', icon: Trophy, hex: '#facc15', Component: QuestSection },
  { id: 'battle', label: 'Battle', icon: Swords, hex: '#f87171', Component: BattleSection },
  { id: 'story', label: 'Story', icon: Sparkles, hex: '#22d3ee', Component: StorySection },
  { id: 'live', label: 'Live', icon: Radio, hex: '#4ade80', Component: LiveSection },
  { id: 'ranks', label: 'Ranks', icon: Crown, hex: '#a855f7', Component: RanksSection },
  { id: 'games', label: 'Games', icon: Gamepad2, hex: '#60a5fa', Component: GamesSection },
  { id: 'worlds', label: 'Worlds', icon: Globe, hex: '#f472b6', Component: WorldsSection },
];

export default function AvatarFeatureRail({ className = '' }) {
  const [index, setIndex] = useState(0);
  const go = useCallback((delta) => setIndex(prev => (prev + delta + SECTIONS.length) % SECTIONS.length), []);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
      const key = (e.key || '').toLowerCase();
      if (key === 'arrowleft') { e.preventDefault(); go(-1); }
      if (key === 'arrowright') { e.preventDefault(); go(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const section = SECTIONS[index];
  const Icon = section.icon;

  return (
    <div className={`w-full ${className}`}>
      <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center gap-2 min-w-max">
          {SECTIONS.map((item, i) => {
            const ItemIcon = item.icon;
            const active = i === index;
            return (
              <button
                key={item.id}
                onClick={() => setIndex(i)}
                title={item.label}
                className="w-12 h-12 rounded-xl flex-shrink-0 flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-[1.04]"
                style={{
                  ...glassCard(active ? item.hex : 'rgba(255,255,255,0.10)'),
                  boxShadow: active ? `0 0 14px ${item.hex}44` : undefined,
                }}
              >
                <ItemIcon className="w-4 h-4" style={{ color: item.hex, opacity: active ? 1 : 0.62 }} />
                <span className={`text-[6px] font-bold uppercase tracking-wider ${active ? 'text-white' : 'text-white/40'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="mt-2 w-full"
        >
          <div className="flex items-center gap-2 mb-3">
            <Icon className="w-4 h-4" style={{ color: section.hex }} />
            <span className="text-white/75 font-bold text-xs uppercase tracking-[0.24em]">{section.label}</span>
          </div>
          <section.Component accent={section.hex} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
