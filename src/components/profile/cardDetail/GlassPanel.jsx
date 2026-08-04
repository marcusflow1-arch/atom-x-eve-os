import React from 'react';

/**
 * Crystal-clear glass container with a subtle double outline for depth.
 */
export default function GlassPanel({ children, className = '', padded = true, hover = false }) {
  return (
    <div
      className={`relative rounded-2xl ${padded ? 'p-5' : ''} ${hover ? 'transition-colors hover:bg-white/[0.07]' : ''} ${className}`}
      style={{
        background: 'rgba(148,163,184,0.06)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 12px 40px rgba(0,0,0,0.35)',
      }}
    >
      <div className="pointer-events-none absolute inset-[1px] rounded-[15px] border border-white/[0.05]" />
      <div className="relative">{children}</div>
    </div>
  );
}