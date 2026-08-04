import React, { useState } from 'react';

/** Studio picture with a graceful initials fallback when no real logo exists. */
export default function StudioLogo({ name = '', logoUrl, className = '', rounded = 'rounded-2xl' }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <div
      className={`${className} ${rounded} overflow-hidden flex items-center justify-center flex-shrink-0`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)',
      }}
    >
      {logoUrl && !failed ? (
        <img
          src={logoUrl}
          alt={name}
          onError={() => setFailed(true)}
          className="w-full h-full object-contain p-1.5"
        />
      ) : (
        <span className="font-black text-white/70 tracking-tight" style={{ fontSize: '1.4em' }}>
          {initials || '?'}
        </span>
      )}
    </div>
  );
}