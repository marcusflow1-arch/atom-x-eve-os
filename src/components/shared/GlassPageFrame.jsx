import React from 'react';

export const glassStyle = {
  background: 'rgba(100, 120, 140, 0.12)',
  backdropFilter: 'blur(20px) saturate(130%)',
  WebkitBackdropFilter: 'blur(20px) saturate(130%)',
  borderColor: 'rgba(255, 255, 255, 0.10)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
};

export default function GlassPageFrame({ children, bottomContent, topContent, className = '' }) {
  return (
    <div className={`relative w-full h-full min-h-screen ${className}`}>
      {/* Top Glass Bar - always rendered for the visual frame effect */}
      <div
        className="fixed top-0 left-0 right-0 z-[35]"
        style={{
          ...glassStyle,
          height: '64px',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
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
          borderTop: '1px solid rgba(255,255,255,0.10)',
          pointerEvents: bottomContent ? 'auto' : 'none',
        }}
      >
        {bottomContent && (
          <div className="h-full w-full flex items-center justify-center px-6 py-2">
            {bottomContent}
          </div>
        )}
      </div>
    </div>
  );
}