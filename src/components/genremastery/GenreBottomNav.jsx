import React from 'react';
import { Home, Trophy, Layers, Search, Mic } from 'lucide-react';

export default function GenreBottomNav({ activeTab, onTabSelect, marketView, cardSearchQuery, onCardSearch }) {
  const showSearch = marketView === 'blackmarket' || marketView === 'tradingpost';
  return (
    <div className="flex items-center w-full h-full px-4">
      {/* Left spacer to balance layout */}
      <div className="flex-1" />

      {/* Center tabs */}
      <div className="flex items-center">
        <button
          onClick={() => onTabSelect('achievements')}
          className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${
            activeTab === 'achievements'
              ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]'
              : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
          }`}
        >
          {activeTab === 'achievements' && (
            <div className="absolute inset-0 bg-yellow-400/20 blur-md rounded-full -z-10 pointer-events-none" />
          )}
          <Trophy className="w-4 h-4" />
          <span>Achievements</span>
        </button>

        <div className="w-px h-5 bg-white/10 mx-2" />

        <button
          onClick={() => onTabSelect('games')}
          className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${
            activeTab === 'games'
              ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]'
              : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
          }`}
        >
          {activeTab === 'games' && (
            <div className="absolute inset-0 bg-white/10 blur-md rounded-full -z-10 pointer-events-none" />
          )}
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <div className="w-px h-5 bg-white/10 mx-2" />

        <button
          onClick={() => onTabSelect('skilltree')}
          className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${
            activeTab === 'skilltree'
              ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]'
              : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
          }`}
        >
          {activeTab === 'skilltree' && (
            <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full -z-10 pointer-events-none" />
          )}
          <Layers className="w-4 h-4" />
          <span>Skill Tree</span>
        </button>
      </div>

      {/* Right: Card search bar — only when Black Market or Trading Post is active */}
      <div className="flex-1 flex justify-end">
        {showSearch && (
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            <input
              value={cardSearchQuery}
              onChange={(e) => onCardSearch(e.target.value)}
              placeholder="Search cards..."
              className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-10 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 w-44"
            />
            <button className="absolute right-2 w-6 h-5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center">
              <Mic className="w-3.5 h-3.5 text-white/45" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}