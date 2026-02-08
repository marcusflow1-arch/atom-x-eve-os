import React from 'react';
import YBotPlayerViewer from '@/components/3d/YBotPlayerViewer';

export default function YBotTest() {
  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0e14 0%, #1a1f2e 50%, #0a0e14 100%)' }}>
      {/* 3D Viewer (full screen) */}
      <YBotPlayerViewer
        className="w-full h-full"
        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      />

      {/* Controls HUD overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-6 py-4 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl">
        <h3 className="text-white font-bold text-sm mb-3 text-center tracking-wider uppercase">Player Controls</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-white font-mono text-[10px]">W A S D</kbd>
            <span className="text-white/50">Move</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-white font-mono text-[10px]">Shift</kbd>
            <span className="text-white/50">Run</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-white font-mono text-[10px]">Space</kbd>
            <span className="text-white/50">Jump</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-white font-mono text-[10px]">Q</kbd>
            <span className="text-white/50">Roll</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-white font-mono text-[10px]">Mouse</kbd>
            <span className="text-white/50">Orbit Camera</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-white font-mono text-[10px]">Click</kbd>
            <span className="text-white/50">Focus Canvas</span>
          </div>
        </div>
        <p className="text-white/30 text-[9px] text-center mt-2">Click the 3D view first to enable keyboard input</p>
      </div>
    </div>
  );
}