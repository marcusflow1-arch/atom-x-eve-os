import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export const glassStyle = {
  background: 'rgba(8, 12, 18, 0.42)',
  backdropFilter: 'blur(30px) saturate(150%)',
  WebkitBackdropFilter: 'blur(30px) saturate(150%)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
};

export default function GlassPageFrame({ children, bottomContent, topContent, className = '' }) {
  const navigate = useNavigate();
  return (
    <div className={`relative w-full h-full min-h-screen ${className}`}>
      {/* Top Glass Bar - always rendered for the visual frame effect */}
      <div
        className="fixed top-0 left-0 right-0 z-[35]"
        style={{
          ...glassStyle,
          height: '64px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          pointerEvents: topContent ? 'auto' : 'none',
        }}
      >
        {topContent && (
          <div className="h-full flex items-center px-6 w-full">
            {topContent}
          </div>
        )}
      </div>

      {/* Page Content */}
      <div className="relative z-[1]">
        {children}
      </div>

      {/* Bottom Glass Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[35]"
        style={{
          ...glassStyle,
          minHeight: '48px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          pointerEvents: bottomContent ? 'auto' : 'none',
        }}
      >
        {bottomContent && (
          <div className="h-full flex items-center px-6 py-2 gap-3 justify-center flex-wrap">
            {bottomContent}
            <div className="w-px h-6 bg-white/10" />
            <button onClick={() => navigate(createPageUrl('Clan'))} className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border bg-transparent border-white/10 text-white/60 hover:bg-white/10 hover:text-white">Clan</button>
            <button onClick={() => navigate(createPageUrl('Farm'))} className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border bg-transparent border-white/10 text-white/60 hover:bg-white/10 hover:text-white">Farm</button>
            <button onClick={() => navigate(createPageUrl('Aura'))} className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border bg-transparent border-white/10 text-white/60 hover:bg-white/10 hover:text-white">Aura</button>
            <button onClick={() => navigate(createPageUrl('GenreMastery'))} className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border bg-transparent border-white/10 text-white/60 hover:bg-white/10 hover:text-white">Cards</button>
          </div>
        )}
      </div>
    </div>
  );
}