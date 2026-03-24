import React from 'react';
import { Home, Users, MessageSquare, TrendingUp } from 'lucide-react';

export default function ClanBottomNav({ activeTab, onTabSelect, isRosterOpen, onToggleRoster }) {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex items-center">
        <button
          onClick={() => onTabSelect('home')}
          className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${
            activeTab === 'home'
              ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]'
              : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
          }`}
        >
          {activeTab === 'home' && (
            <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full -z-10 pointer-events-none" />
          )}
          <Home className="w-4 h-4" />
          <span>Stronghold</span>
        </button>

        <div className="w-px h-5 bg-white/10 mx-2" />

        <button
          onClick={onToggleRoster}
          className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${
            isRosterOpen
              ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]'
              : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
          }`}
        >
          {isRosterOpen && (
            <div className="absolute inset-0 bg-yellow-400/20 blur-md rounded-full -z-10 pointer-events-none" />
          )}
          <Users className="w-4 h-4" />
          <span>Roster</span>
        </button>

        <div className="w-px h-5 bg-white/10 mx-2" />

        <button
          onClick={() => onTabSelect('upgrades')}
          className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${
            activeTab === 'upgrades'
              ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]'
              : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
          }`}
        >
          {activeTab === 'upgrades' && (
            <div className="absolute inset-0 bg-emerald-400/20 blur-md rounded-full -z-10 pointer-events-none" />
          )}
          <TrendingUp className="w-4 h-4" />
          <span>Upgrades</span>
        </button>

        <div className="w-px h-5 bg-white/10 mx-2" />

        <button
          onClick={() => onTabSelect('games_chat')}
          className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${
            activeTab === 'games_chat'
              ? 'text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]'
              : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
          }`}
        >
          {activeTab === 'games_chat' && (
            <div className="absolute inset-0 bg-purple-400/20 blur-md rounded-full -z-10 pointer-events-none" />
          )}
          <MessageSquare className="w-4 h-4" />
          <span>Game Chat</span>
        </button>
      </div>
    </div>
  );
}