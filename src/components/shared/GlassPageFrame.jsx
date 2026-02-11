import React from 'react';

const glassStyle = {
  background: 'rgba(100, 120, 140, 0.12)',
  backdropFilter: 'blur(30px) saturate(150%)',
  WebkitBackdropFilter: 'blur(30px) saturate(150%)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
};

export default function GlassPageFrame({ children, bottomContent, topContent, className = '' }) {
  return (
    <div className={`relative w-full h-full min-h-screen ${className}`}>
      {/* Top Glass Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[35] pointer-events-none"
        style={{
          ...glassStyle,
          height: '64px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {topContent && (
          <div className="h-full flex items-center px-6 pointer-events-auto">
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
        className="fixed bottom-0 left-0 right-0 z-[35] pointer-events-none"
        style={{
          ...glassStyle,
          minHeight: '48px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {bottomContent && (
          <div className="h-full flex items-center px-6 py-2 pointer-events-auto">
            {bottomContent}
          </div>
        )}
      </div>
    </div>
  );
}