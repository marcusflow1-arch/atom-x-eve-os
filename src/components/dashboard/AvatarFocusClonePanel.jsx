import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Swords, Sparkles, Radio, Crown, Gamepad2, Globe } from 'lucide-react';
import { LibraryBannerSection } from './FocusModePanel';

// 7 decorative small glass boxes with different colored outlines (non-functional for now)
const BOXES = [
  { label: 'Quests', icon: Trophy, color: 'rgba(250,204,21,0.5)', glow: 'rgba(250,204,21,0.12)' },
  { label: 'Battle', icon: Swords, color: 'rgba(248,113,113,0.5)', glow: 'rgba(248,113,113,0.12)' },
  { label: 'Story', icon: Sparkles, color: 'rgba(34,211,238,0.5)', glow: 'rgba(34,211,238,0.12)' },
  { label: 'Live', icon: Radio, color: 'rgba(74,222,128,0.5)', glow: 'rgba(74,222,128,0.12)' },
  { label: 'Ranks', icon: Crown, color: 'rgba(168,85,247,0.5)', glow: 'rgba(168,85,247,0.12)' },
  { label: 'Games', icon: Gamepad2, color: 'rgba(96,165,250,0.5)', glow: 'rgba(96,165,250,0.12)' },
  { label: 'World', icon: Globe, color: 'rgba(244,114,182,0.5)', glow: 'rgba(244,114,182,0.12)' },
];

export default function AvatarFocusClonePanel({ currentEnvId, onSelectEnv, isEnvironmentActive, onToggleEnvironment }) {
  const [showEnvDropdown, setShowEnvDropdown] = useState(false);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Exact same top row UI as the dashboard FocusModePanel */}
      <div className="w-full" style={{ height: '110px' }}>
        <LibraryBannerSection
          games={[]}
          currentEnvId={currentEnvId}
          onSelectEnv={onSelectEnv}
          showEnvDropdown={showEnvDropdown}
          setShowEnvDropdown={setShowEnvDropdown}
          onQuickChangeToggle={() => {}}
          isEnvironmentActive={isEnvironmentActive}
          onToggleEnvironment={onToggleEnvironment}
          navBoxes={null}
          calendarBox={null}
          intelligenceFeed={null}
        />
      </div>

      {/* 7 small colored glass boxes below */}
      <div className="grid grid-cols-7 gap-2 max-w-3xl">
        {BOXES.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1.5"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px) saturate(150%)',
                WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                border: `1px solid ${b.color}`,
                boxShadow: `inset 0 0 18px ${b.glow}, 0 6px 18px rgba(0,0,0,0.3)`,
              }}
            >
              <Icon className="w-5 h-5 text-white/80" />
              <span className="text-white/70 text-[9px] font-bold uppercase tracking-wider">{b.label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}