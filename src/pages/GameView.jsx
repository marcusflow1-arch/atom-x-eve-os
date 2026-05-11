import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import GameViewer3D from '../components/game3d/GameViewer3D';

export default function GameView() {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0a0e1a 100%)',
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{
          background: 'rgba(10, 14, 26, 0.6)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <button
          onClick={() => navigate(createPageUrl('LunaTemplate'))}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-cyan-400" />
          <span className="text-white font-bold tracking-wider">Game View</span>
        </div>

        <div className="w-[88px]" />
      </div>

      {/* 3D Viewer fills the rest of the screen */}
      <div className="flex-1 relative overflow-hidden">
        <GameViewer3D />
      </div>
    </div>
  );
}