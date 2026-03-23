import React from 'react';
import { Home, Trophy, Layers } from 'lucide-react';

export default function GenreBottomNav({ activeTab, onTabSelect }) {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex items-center">
        <button
          onClick={() => onTabSelect('achievements')}
          className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 rounded-lg mx-1 ${
            activeTab === 'achievements'
              ? 'text-yellow-400 bg-black/60 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_10px_rgba(0,0,0,0.5)]'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Achievements</span>
        </button>

        <div className="w-px h-5 bg-white/10 mx-2" />

        <button
          onClick={() => onTabSelect('games')}
          className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 rounded-lg mx-1 ${
            activeTab === 'games'
              ? 'text-white bg-black/60 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_10px_rgba(0,0,0,0.5)]'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <div className="w-px h-5 bg-white/10 mx-2" />

        <button
          onClick={() => onTabSelect('skilltree')}
          className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 rounded-lg mx-1 ${
            activeTab === 'skilltree'
              ? 'text-cyan-400 bg-black/60 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_10px_rgba(0,0,0,0.5)]'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Skill Tree</span>
        </button>
      </div>
    </div>
  );
}