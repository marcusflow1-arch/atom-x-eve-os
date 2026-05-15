import React from 'react';

/**
 * HUD prompt for the mount system. F now works from anywhere — the prompt
 * is always shown (Mount when on foot, Dismount when riding).
 * The legacy `nearby` prop is accepted but no longer required.
 */
export default function CompanionMountHUD({ mounted, companionName }) {

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full pointer-events-none"
      style={{
        bottom: mounted ? 80 : 128,
        background: 'rgba(15, 20, 30, 0.7)',
        backdropFilter: 'blur(14px) saturate(160%)',
        WebkitBackdropFilter: 'blur(14px) saturate(160%)',
        border: '1px solid rgba(251, 191, 36, 0.5)',
        boxShadow: '0 4px 18px rgba(251, 191, 36, 0.25)',
      }}
    >
      <div className="flex items-center gap-2 text-sm text-white">
        <span className="px-2 py-0.5 rounded bg-amber-500/25 border border-amber-400/40 font-mono text-xs text-amber-200">
          F
        </span>
        {mounted ? (
          <span>Dismount <span className="text-amber-300 font-semibold">{companionName}</span></span>
        ) : (
          <span>Mount <span className="text-amber-300 font-semibold">{companionName}</span></span>
        )}
      </div>
    </div>
  );
}