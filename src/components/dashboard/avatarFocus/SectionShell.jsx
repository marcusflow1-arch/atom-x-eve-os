import React from 'react';

// Shared Atom X Eve glass styling for focus-hub sections — crystal glass with double outline
export const glassCard = (accent = 'rgba(150,185,255,0.16)') => ({
  background: 'rgba(255,255,255,0.045)',
  backdropFilter: 'blur(24px) saturate(150%)',
  WebkitBackdropFilter: 'blur(24px) saturate(150%)',
  border: `1px solid ${accent}`,
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.10), 0 12px 40px rgba(0,0,0,0.45)',
  borderRadius: '16px',
});

export default function SectionShell({ title, subtitle, accent, actions, children }) {
  return (
    <div className="w-full h-full flex flex-col px-10 py-6 max-w-[1500px] mx-auto">
      <div className="flex items-end justify-between mb-5 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em]" style={{ textShadow: `0 0 24px ${accent}` }}>
            {title}
          </h2>
          {subtitle && <p className="text-white/40 text-xs mt-1 tracking-wide">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto relative pr-1" style={{ scrollbarWidth: 'none' }}>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, message }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 text-white/30">
      {Icon && <Icon className="w-10 h-10" />}
      <p className="text-sm tracking-wide">{message}</p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );
}