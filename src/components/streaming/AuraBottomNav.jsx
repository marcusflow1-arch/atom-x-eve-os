import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Radio, Compass, ListVideo } from 'lucide-react';

export default function AuraBottomNav() {
  const navigate = useNavigate();
  const path = (typeof window !== 'undefined' ? window.location.pathname : '').toLowerCase();
  const isDiscover = path.includes('/discover');
  const isHome = path.includes('/streaminghome');
  const isAura = path.includes('/aura') && !isHome;
  const isStreamingGames = path.includes('/streaming');

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex items-center">
        <button onClick={() => navigate(createPageUrl('Discover'))} className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${isDiscover ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'}`}>
          {isDiscover && <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full -z-10 pointer-events-none" />}
          <Compass className="w-4 h-4" /><span>Discover</span>
        </button>
        <div className="w-px h-5 bg-white/10 mx-2" />
        <button onClick={() => navigate(createPageUrl('StreamingHome'))} className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${isHome ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'}`}>
          {isHome && <div className="absolute inset-0 bg-white/10 blur-md rounded-full -z-10 pointer-events-none" />}
          <Home className="w-4 h-4" /><span>Home</span>
        </button>
        <div className="w-px h-5 bg-white/10 mx-2" />
        <button onClick={() => navigate(createPageUrl('Aura'))} className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${isAura ? 'text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]' : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'}`}>
          {isAura && <div className="absolute inset-0 bg-purple-400/20 blur-md rounded-full -z-10 pointer-events-none" />}
          <Radio className="w-4 h-4" /><span>Aura</span>
        </button>
        <div className="w-px h-5 bg-white/10 mx-2" />
        <button onClick={() => navigate(createPageUrl('Streaming'))} className={`relative px-5 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${isStreamingGames ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'}`} title="Streaming Games">
          {isStreamingGames && <div className="absolute inset-0 bg-white/10 blur-md rounded-full -z-10 pointer-events-none" />}
          <ListVideo className="w-4 h-4" /><span>Streaming Games</span>
        </button>
      </div>
    </div>
  );
}
