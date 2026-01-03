import React from 'react';
import ShinyCard from '@/components/shared/ShinyCard';

export default function HolographicTile({ Icon, label, onClick, className = '' }) {
  return (
    <ShinyCard
      onClick={onClick}
      className={`w-64 h-64 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-2xl ${className}`}
    >
      {/* Subtle glass gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        {Icon && <Icon className="w-16 h-16 mb-4" />}
        <span className="text-xl font-bold">{label}</span>
      </div>
    </ShinyCard>
  );
}