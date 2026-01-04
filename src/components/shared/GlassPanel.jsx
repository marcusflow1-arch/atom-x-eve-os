import React from 'react';

export default function GlassPanel({ variant = 'center', className = '', children }) {
  const stylesByVariant = {
    left: {
      background: 'linear-gradient(180deg, rgba(15,23,42,0.30) 0%, rgba(17,24,39,0.30) 45%, rgba(24,24,35,0.30) 100%)',
      borderColor: 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(24px) saturate(160%)',
      WebkitBackdropFilter: 'blur(24px) saturate(160%)'
    },
    center: {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.04) 100%)',
      borderColor: 'rgba(255,255,255,0.12)',
      // Clearest panel for high color accuracy
      backdropFilter: 'blur(8px) saturate(100%) contrast(1.02)',
      WebkitBackdropFilter: 'blur(8px) saturate(100%) contrast(1.02)'
    },
    right: {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(220,235,255,0.06) 100%)',
      borderColor: 'rgba(255,255,255,0.14)',
      backdropFilter: 'blur(18px) saturate(140%) contrast(1.03)',
      WebkitBackdropFilter: 'blur(18px) saturate(140%) contrast(1.03)'
    }
  };

  const style = stylesByVariant[variant] || stylesByVariant.center;

  return (
    <div 
        className={`relative h-full w-full rounded-3xl overflow-hidden border ${className}`} 
        style={{
            ...style,
            // Beveled Glowing Edges (#4) - Enhanced
            boxShadow: `
                0 0 0 1px rgba(255,255,255,0.05), /* Outer subtle ring */
                inset 0 1px 0 rgba(255,255,255,0.2), /* Top bevel highlight */
                inset 0 0 20px rgba(255,255,255,0.05), /* Inner glow */
                0 10px 40px rgba(0,0,0,0.2) /* Deep shadow */
            `
        }}
    >
      {/* 1px Refraction Line on Edge */}
      <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none mix-blend-overlay" />

      {/* Soft edge glow */}
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 40px rgba(255,255,255,0.06)' }} />

      {/* Subtle grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(0deg, rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px)',
          backgroundSize: '3px 3px'
        }}
      />

      {/* Content */}
      <div className="relative h-full w-full p-3 md:p-4">{children}</div>
    </div>
  );
}