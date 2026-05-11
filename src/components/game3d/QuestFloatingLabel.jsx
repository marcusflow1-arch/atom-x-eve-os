import React from 'react';

/**
 * Liquid-glass "QUEST" billboard label that hovers above an NPC's head.
 * Positioned by screen-space (x,y) coordinates projected from the 3D world.
 */
export default function QuestFloatingLabel({ x, y, status = 'available' }) {
  // status: 'available' | 'in_progress' | 'turn_in'
  const palette = {
    available: { glow: 'rgba(250, 204, 21, 0.55)', text: '#fde68a', dot: '#facc15', label: 'QUEST' },
    in_progress: { glow: 'rgba(56, 189, 248, 0.45)', text: '#bae6fd', dot: '#38bdf8', label: '...' },
    turn_in: { glow: 'rgba(74, 222, 128, 0.55)', text: '#bbf7d0', dot: '#4ade80', label: '!' },
  }[status] || { glow: 'rgba(250, 204, 21, 0.55)', text: '#fde68a', dot: '#facc15', label: 'QUEST' };

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div
        className="flex items-center gap-1.5 px-3 py-1 rounded-full"
        style={{
          background: 'rgba(15, 20, 30, 0.55)',
          backdropFilter: 'blur(14px) saturate(160%)',
          WebkitBackdropFilter: 'blur(14px) saturate(160%)',
          border: `1px solid ${palette.glow}`,
          boxShadow: `0 4px 18px ${palette.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.15)`,
          animation: 'questBob 2.6s ease-in-out infinite',
        }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{
            background: palette.dot,
            boxShadow: `0 0 8px ${palette.dot}`,
            animation: 'questPulse 1.2s ease-in-out infinite',
          }}
        />
        <span
          className="text-[10px] font-bold tracking-[0.22em]"
          style={{
            color: palette.text,
            textShadow: `0 0 6px ${palette.glow}`,
          }}
        >
          {palette.label}
        </span>
      </div>
      <style>{`
        @keyframes questBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes questPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}