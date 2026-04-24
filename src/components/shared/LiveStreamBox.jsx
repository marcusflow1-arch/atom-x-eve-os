import React from 'react';
import { Play, Radio, Users } from 'lucide-react';

export default function LiveStreamBox({ game }) {
  return (
    <div className="w-full h-full p-6 flex items-center justify-center">
      <div className="flex-[2] min-w-0 w-full max-w-4xl">
        <div
          className="relative rounded-2xl overflow-hidden aspect-video flex flex-col"
          style={{
            background: 'rgba(6, 6, 10, 0.72)',
            backdropFilter: 'blur(28px) saturate(160%)',
            WebkitBackdropFilter: 'blur(28px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.4)',
          }}
        >
          {/* Liquid glass sheen */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)' }} />

          {/* Stream Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0" style={{ background: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <span className="text-white/80 font-bold text-xs uppercase tracking-wider">Live Stream</span>
              <span className="px-2 py-0.5 rounded bg-red-500/15 border border-red-500/25 text-red-400 text-[10px] font-bold">LIVE</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-white/30">
              <span className="flex items-center gap-1"><Radio className="w-3 h-3 text-red-400/70" /> 1,204 watching</span>
              <span>StreamerXO is playing {game?.title}</span>
            </div>
          </div>

          {/* Stream Embed / Placeholder */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <img
              src={game?.banner_image || game?.cover_image}
              alt="Live Stream"
              className="absolute inset-0 w-full h-full object-cover opacity-25 blur-md scale-105"
            />
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1.5px solid rgba(239,68,68,0.3)', boxShadow: '0 0 24px rgba(239,68,68,0.2)' }}>
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </div>
              <p className="text-white/80 font-semibold text-sm">Tap to Watch Live</p>
              <p className="text-white/30 text-xs">StreamerXO • {game?.genre} • Started 2h ago</p>
            </div>
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white border border-white/20">S</div>
              <div className="px-2 py-1 rounded text-xs text-white/70 font-medium" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>StreamerXO</div>
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
              <Users className="w-3 h-3 text-white/40" />
              <span className="text-white/40 text-xs">1,204</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}