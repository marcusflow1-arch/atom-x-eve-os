import React from 'react';
import { Mic } from 'lucide-react';

/**
 * Floating liquid-glass mic indicator shown above a player's name when their
 * mic is active. Positioned in screen-space (x, y already projected).
 */
export default function VoiceMicIndicator({ x, y, visible }) {
  if (!visible) return null;
  return (
    <div
      className="pointer-events-none absolute select-none"
      style={{
        left: x,
        top: y - 22,
        transform: 'translate(-50%, -100%)',
        willChange: 'transform',
      }}
    >
      <div
        className="flex items-center justify-center w-7 h-7 rounded-full"
        style={{
          background: 'rgba(34, 197, 94, 0.18)',
          backdropFilter: 'blur(14px) saturate(180%)',
          WebkitBackdropFilter: 'blur(14px) saturate(180%)',
          border: '1px solid rgba(134, 239, 172, 0.55)',
          boxShadow:
            '0 4px 14px rgba(34, 197, 94, 0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
          animation: 'voiceMicPulse 1.4s ease-in-out infinite',
        }}
      >
        <Mic className="w-3.5 h-3.5 text-emerald-200" strokeWidth={2.4} />
      </div>
      <style>{`
        @keyframes voiceMicPulse {
          0%, 100% { box-shadow: 0 4px 14px rgba(34,197,94,0.35), inset 0 1px 0 rgba(255,255,255,0.18); }
          50% { box-shadow: 0 4px 22px rgba(34,197,94,0.65), inset 0 1px 0 rgba(255,255,255,0.25); }
        }
      `}</style>
    </div>
  );
}