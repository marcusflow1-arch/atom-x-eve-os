import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { subscribePlayerHUD } from './playerHUDStore';
import ProgressionLeftPanel from './progression/ProgressionLeftPanel';
import SkillTreeRightPanel from './progression/SkillTreeRightPanel';

/**
 * Full-screen overlay opened with the C key.
 * Left half = Character Progression. Right half = Skill Tree System.
 */
export default function CharacterProgressionMenu({ isOpen, onClose }) {
  const [hud, setHud] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    return subscribePlayerHUD(setHud);
  }, [isOpen]);

  if (!isOpen || !hud) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch"
      style={{
        background: 'rgba(4,8,14,0.85)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
      onClick={onClose}
    >
      <div
        className="relative flex w-full h-full"
        style={{
          background: 'linear-gradient(135deg, rgba(20,28,42,0.92) 0%, rgba(12,18,28,0.92) 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left side — Character Progression */}
        <div className="flex-1 min-w-0 border-r border-white/10">
          <ProgressionLeftPanel hud={hud} />
        </div>

        {/* Center divider with glow */}
        <div
          className="w-px"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(255,210,70,0.4) 30%, rgba(58,158,230,0.4) 70%, transparent 100%)',
          }}
        />

        {/* Right side — Skill Tree System */}
        <div className="flex-1 min-w-0">
          <SkillTreeRightPanel hud={hud} />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Footer hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-white/40 tracking-[0.25em] uppercase">
          Press <span className="text-yellow-300 font-bold">C</span> or <span className="text-yellow-300 font-bold">Esc</span> to close
        </div>
      </div>
    </div>
  );
}