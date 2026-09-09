import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import GameStreamPanel from './GameStreamPanel';
import StudioProfileView from '@/components/studio/StudioProfileView';
import DevGamesPanel from '@/components/studio/DevGamesPanel';

export const glassStyle = {
  background: 'rgba(8, 12, 18, 0.42)',
  backdropFilter: 'blur(30px) saturate(150%)',
  WebkitBackdropFilter: 'blur(30px) saturate(150%)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
};

// Reusable visual language for the Studio overlay: Roman-inspired architecture
// rendered as transparent liquid glass with a faceted "diamond" finish.
const studioFrameStyle = {
  width: 'clamp(34px, 4.5vw, 78px)',
  top: '0',
  bottom: '0',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 10%, rgba(255,255,255,0.045) 50%, rgba(255,255,255,0.08) 90%, rgba(255,255,255,0.16) 100%)',
  backdropFilter: 'blur(18px) saturate(180%)',
  WebkitBackdropFilter: 'blur(18px) saturate(180%)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.13), 0 0 22px rgba(255,255,255,0.045)',
};

const diamondTexture = {
  backgroundImage: `
    linear-gradient(135deg, rgba(255,255,255,0.15) 25%, transparent 25%),
    linear-gradient(315deg, rgba(255,255,255,0.10) 25%, transparent 25%),
    linear-gradient(45deg, rgba(255,255,255,0.08) 25%, transparent 25%),
    linear-gradient(225deg, rgba(255,255,255,0.12) 25%, transparent 25%)
  `,
  backgroundPosition: '0 0, 0 0, 0 0, 0 0',
  backgroundSize: '10px 10px',
  mixBlendMode: 'screen',
  opacity: 0.42,
};

function StudioPillar({ side }) {
  const right = side === 'right';
  return (
    <div
      aria-hidden="true"
      className={`absolute ${right ? 'right-0' : 'left-0'} top-0 bottom-0 pointer-events-none z-[2] flex items-stretch`}
      style={{
        width: 'clamp(48px, 5.2vw, 88px)',
        padding: '8px 0',
        filter: 'drop-shadow(0 0 18px rgba(255,255,255,0.055))',
      }}
    >
      <div className="relative w-full h-full flex flex-col justify-between items-center">
        {/* Capital */}
        <div className="w-[86%] h-10 sm:h-12 relative flex items-end justify-center">
          <div
            className="absolute inset-x-0 bottom-0 h-7 rounded-t-xl border border-white/15"
            style={studioFrameStyle}
          />
          <div className="absolute bottom-2 w-[68%] h-3 rounded-md border border-white/20 bg-white/[0.12] backdrop-blur-md" />
          <div className="absolute bottom-[2px] w-[48%] h-1.5 rounded-full bg-white/20 shadow-[0_0_14px_rgba(255,255,255,0.35)]" />
          <div className="absolute inset-x-0 top-0 h-full" style={diamondTexture} />
        </div>

        {/* Full-height fluted shaft */}
        <div
          className="relative flex-1 w-[70%] my-1 rounded-[18px] border border-white/12 overflow-hidden"
          style={{
            ...studioFrameStyle,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.055), rgba(255,255,255,0.14) 22%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.14) 78%, rgba(255,255,255,0.055))',
            boxShadow: 'inset 2px 0 10px rgba(255,255,255,0.08), inset -2px 0 10px rgba(255,255,255,0.04), 0 0 18px rgba(255,255,255,0.035)',
          }}
        >
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.14) 0px, rgba(255,255,255,0.14) 2px, transparent 2px, transparent 7px)',
              filter: 'blur(0.4px)',
            }}
          />
          <div className="absolute inset-0" style={diamondTexture} />

          {/* Faceted diamond ornaments spaced through the shaft */}
          <div className="absolute inset-x-0 top-[8%] flex justify-center">
            <div className="w-3.5 h-3.5 rotate-45 border border-white/30 bg-white/[0.16] shadow-[0_0_12px_rgba(255,255,255,0.20)]" />
          </div>
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
            <div className="w-4 h-4 rotate-45 border border-white/25 bg-white/[0.12] shadow-[0_0_14px_rgba(255,255,255,0.18)]" />
          </div>
          <div className="absolute inset-x-0 bottom-[8%] flex justify-center">
            <div className="w-3.5 h-3.5 rotate-45 border border-white/30 bg-white/[0.16] shadow-[0_0_12px_rgba(255,255,255,0.20)]" />
          </div>
        </div>

        {/* Base */}
        <div className="w-[86%] h-10 sm:h-12 relative flex items-start justify-center">
          <div
            className="absolute inset-x-0 top-0 h-7 rounded-b-xl border border-white/15"
            style={studioFrameStyle}
          />
          <div className="absolute top-2 w-[68%] h-3 rounded-md border border-white/20 bg-white/[0.12] backdrop-blur-md" />
          <div className="absolute top-[2px] w-[48%] h-1.5 rounded-full bg-white/20 shadow-[0_0_14px_rgba(255,255,255,0.35)]" />
          <div className="absolute inset-x-0 bottom-0 h-full" style={diamondTexture} />
        </div>
      </div>
    </div>
  );
}

export default function GlassPageFrame({ children, bottomContent, topContent, showTriggerTab = false, className = '', gameData, sidebarVisible, onSidebarToggle }) {
  const [overlay, setOverlay] = useState(null); // null | 'studio' | 'stream'
  const [gamesOpen, setGamesOpen] = useState(false);

  const closeAll = () => {
    setOverlay(null);
    setGamesOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeAll();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleOverlay = (name) => {
    setGamesOpen(false);
    setOverlay(prev => prev === name ? null : name);
  };

  const toggleGames = () => {
    setOverlay(null);
    setGamesOpen(prev => !prev);
  };

  return (
    <div className={`relative w-full h-full min-h-screen ${className}`}>
      {/* Top Glass Bar */}
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

      {/* Games Top Panel */}
      {showTriggerTab && <DevGamesPanel open={gamesOpen} game={gameData} />}

      {/* Page Content */}
      <div className="relative z-[1]">
        {children}
      </div>

      {/* Studio / Stream Overlay - between top and bottom bars */}
      <AnimatePresence>
        {overlay && (
          <motion.div
            key={overlay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 right-0 z-[34]"
            style={{
              top: '64px',
              bottom: '48px',
              background: 'rgba(22, 26, 32, 0.58)',
              backdropFilter: 'blur(40px) saturate(165%)',
              WebkitBackdropFilter: 'blur(40px) saturate(165%)',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              overflowY: 'auto',
            }}
          >
            {overlay === 'studio' && (
              <>
                {/* Architectural framing: full-height liquid-glass Roman pillars */}
                <StudioPillar side="left" />
                <StudioPillar side="right" />
                {/* Faint central diamond glint, reinforcing the faceted glass finish */}
                <div
                  aria-hidden="true"
                  className="absolute left-1/2 top-6 w-24 h-24 -translate-x-1/2 pointer-events-none opacity-20"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 68%)',
                    filter: 'blur(10px)',
                  }}
                />
              </>
            )}

            <div className={overlay === 'studio' ? 'relative z-[3] h-full pl-[clamp(58px,6vw,98px)] pr-[clamp(58px,6vw,98px)]' : 'relative z-[3] h-full'}>
              {overlay === 'stream' && gameData && (
                <GameStreamPanel game={gameData} />
              )}
              {overlay === 'studio' && gameData && (
                <StudioProfileView game={gameData} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Glass Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[35]"
        style={{
          ...glassStyle,
          minHeight: '48px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          pointerEvents: bottomContent || showTriggerTab ? 'auto' : 'none',
        }}
      >
        {/* Trigger Tab */}
        {showTriggerTab && (
          <>
            {/* Dev Info Label */}
            <div
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
              style={{
                top: '-48px',
              }}
            >
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Dev Info</span>
            </div>
            <div
              className="absolute left-1/2 -translate-x-1/2 flex overflow-hidden pointer-events-auto"
              style={{
                top: '-36px',
                width: '216px',
                height: '40px',
                background: 'rgba(8, 12, 18, 0.42)',
                backdropFilter: 'blur(30px) saturate(150%)',
                WebkitBackdropFilter: 'blur(30px) saturate(150%)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderBottom: 'none',
                borderRadius: '8px 8px 0 0',
                boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)',
              }}
            >
              {/* Games */}
              <div
                onClick={toggleGames}
                className={`flex-1 flex items-center justify-center border-r border-white/10 cursor-pointer transition-colors ${gamesOpen ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${gamesOpen ? 'text-white/90' : 'text-white/50'}`}>Games</span>
              </div>

              {/* Studio */}
              <div
                onClick={() => toggleOverlay('studio')}
                className={`flex-1 flex items-center justify-center border-r border-white/10 cursor-pointer transition-colors ${overlay === 'studio' ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${overlay === 'studio' ? 'text-white/90' : 'text-white/50'}`}>Studio</span>
              </div>

              {/* Stream */}
              <div
                onClick={() => toggleOverlay('stream')}
                className={`flex-1 flex items-center justify-center cursor-pointer transition-colors ${overlay === 'stream' ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${overlay === 'stream' ? 'text-white/90' : 'text-white/50'}`}>Stream</span>
              </div>
            </div>
          </>
        )}

        {bottomContent && (
          <div className="h-full w-full flex items-center px-3 py-2 gap-3">
            {/* Sidebar toggle button — far left of bottom bar */}
            {onSidebarToggle && (
              <button
                onClick={onSidebarToggle}
                title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
                className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-white/10 text-white/40 hover:text-white"
              >
                {sidebarVisible
                  ? <PanelLeftClose className="w-4 h-4" />
                  : <PanelLeftOpen className="w-4 h-4" />
                }
              </button>
            )}
            <div className="flex-1 flex items-center justify-center">
              {bottomContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
