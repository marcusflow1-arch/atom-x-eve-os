import React from 'react';

export default function WaterRippleAvatar({ src, size = 160, name = 'Creator' }) {
  const ring = 18; // ripple ring thickness
  return (
    <div className="relative mx-auto" style={{ width: size + ring * 4, height: size + ring * 4 }}>
      {/* Ripple rings */}
      <span className="absolute inset-0 rounded-full" style={{
        background: 'radial-gradient(closest-side, rgba(34,211,238,0.35), transparent 70%)',
        filter: 'blur(12px)',
        opacity: 0.7
      }} />
      {[0,1,2].map(i => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: size + ring * 2 + i * 24,
            height: size + ring * 2 + i * 24,
            transform: 'translate(-50%, -50%)',
            border: '1px solid rgba(34,211,238,0.35)',
            boxShadow: '0 0 20px rgba(34,211,238,0.18)',
            animation: `ripple 4.5s ${1 + i * 0.5}s infinite`,
          }}
        />
      ))}

      {/* Avatar circle */}
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden rounded-full border"
        style={{
          width: size,
          height: size,
          transform: 'translate(-50%, -50%)',
          borderColor: 'rgba(255,255,255,0.20)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 10px 30px rgba(0,0,0,0.35)'
        }}
      >
        <img src={src} alt={name} className="w-full h-full object-cover" />
      </div>

      <style>{`
        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(0.92); opacity: .7; }
          70% { transform: translate(-50%, -50%) scale(1.08); opacity: .25; }
          100% { transform: translate(-50%, -50%) scale(1.12); opacity: 0; }
        }
      `}</style>
    </div>
  );
}